import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Link as LinkIcon, Check, FolderOpen } from 'lucide-react';
import { casesService } from '../../../../services/api';

function AssociateCaseModal({ isOpen, onClose, onAssociate, student, associatedCaseIds = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCaseId, setSelectedCaseId] = useState(null);
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAssociating, setIsAssociating] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const isCaseAssociated = (caseId) => {
        return associatedCaseIds.includes(caseId);
    };

    // Load user and cases
    useEffect(() => {
        if (isOpen) {
            loadData();
            setSelectedCaseId(null);
            setSearchTerm('');
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem('usuario');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUser(user);

                const colegioId = user.colegios?.[0]?.id || user.colegios?.[0];
                const userId = user.id;

                if (userId && colegioId) {
                    const idToUse = typeof colegioId === 'object' ? colegioId.id : colegioId;
                    const fetchedCases = await casesService.getCases(userId, idToUse);
                    // Map backend format if necessary, though casesService likely returns expected format
                    // Ensure date formatting consistency
                    setCases(fetchedCases.map(c => ({
                        id: c.id,
                        title: c.title || 'Sin título',
                        status: c.status,
                        date: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '',
                        student_id: c.student_id
                    })));
                }
            }
        } catch (error) {
            console.error("Error loading cases:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCases = cases.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort cases: already associated first
    const sortedCases = [...filteredCases].sort((a, b) => {
        const aAssociated = isCaseAssociated(a.id);
        const bAssociated = isCaseAssociated(b.id);
        if (aAssociated && !bAssociated) return -1;
        if (!aAssociated && bAssociated) return 1;
        return 0;
    });

    if (!isOpen) return null;

    const handleAssociate = async () => {
        if (selectedCaseId && currentUser) {
            try {
                setIsAssociating(true);
                // Call API to update the case with the student_id
                const updatedCase = await casesService.updateCase(selectedCaseId, currentUser.id, {
                    student_id: student.id
                });

                // Format for parent component
                const formattedCase = {
                    id: updatedCase.id,
                    title: updatedCase.title,
                    status: updatedCase.status,
                    date: updatedCase.created_at ? new Date(updatedCase.created_at).toISOString().split('T')[0] : '',
                    student_id: updatedCase.student_id
                };

                onAssociate(formattedCase);
                onClose();
            } catch (error) {
                console.error("Error associating case:", error);
                // Optionally show error toast
            } finally {
                setIsAssociating(false);
            }
        }
    };

    const selectedCaseIsAlreadyAssociated = selectedCaseId ? isCaseAssociated(selectedCaseId) : false;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
                onClick={onClose}
            />

            {/* Slide-in Panel */}
            <div className="fixed right-0 top-0 h-full z-[70] flex items-center justify-end pointer-events-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <div className="w-[430px] h-full shadow-2xl bg-white border-l border-gray-100 flex flex-col animate-slide-in overflow-hidden pointer-events-auto">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Asociar a un Caso</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Selecciona un caso para vincular al estudiante
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <X size={20} strokeWidth={2} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white space-y-5">
                        {/* Student Info */}
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Vinculando a</p>
                            <p className="text-sm font-semibold text-gray-800">{student?.nombres} {student?.apellidos}</p>
                            {student?.curso && (
                                <span className="inline-block mt-2 text-xs font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                                    {student.curso}
                                </span>
                            )}
                        </div>

                        {/* Search */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Buscar Caso</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar por título..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-0 outline-none bg-gray-50 text-sm font-medium text-gray-800 transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Cases List */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Casos Disponibles</label>

                            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {loading && (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                                    </div>
                                )}

                                {!loading && sortedCases.map((c) => {
                                    const isAssociated = isCaseAssociated(c.id);
                                    const isSelected = selectedCaseId === c.id;

                                    return (
                                        <div
                                            key={c.id}
                                            onClick={() => !isAssociated && setSelectedCaseId(c.id)}
                                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${isSelected
                                                ? 'border-gray-800 bg-gray-50 ring-1 ring-gray-800'
                                                : isAssociated
                                                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100/50'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-gray-800 text-white' : isAssociated ? 'bg-gray-200 text-gray-500' : 'bg-white border border-gray-200 text-gray-500'
                                                }`}>
                                                <FolderOpen size={20} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm font-medium block truncate ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {c.title}
                                                </span>
                                                <span className="text-xs text-gray-500 block">
                                                    {c.status} • {c.date}
                                                </span>
                                            </div>

                                            {isAssociated ? (
                                                <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                    Asociado
                                                </span>
                                            ) : isSelected && (
                                                <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                                                    <Check size={12} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {!loading && sortedCases.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-gray-400 text-sm">
                                            {searchTerm ? 'No se encontraron casos' : 'No hay casos disponibles'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-white">
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                disabled={!selectedCaseId || isAssociating}
                                onClick={handleAssociate}
                                className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${selectedCaseIsAlreadyAssociated
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {isAssociating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Asociando...
                                    </>
                                ) : selectedCaseIsAlreadyAssociated ? (
                                    <>
                                        <Check size={16} />
                                        Ya Asociado
                                    </>
                                ) : (
                                    <>
                                        <LinkIcon size={16} />
                                        Confirmar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}

export default AssociateCaseModal;
