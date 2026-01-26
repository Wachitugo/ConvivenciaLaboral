import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Link as LinkIcon, Check } from 'lucide-react';
import { casesService } from '../../services/api';

function AssociateCaseModal({ isOpen, onClose, onAssociate, interview, isAssociating = false }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCaseId, setSelectedCaseId] = useState(null);
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Helper to get user and school data
    const getUserData = () => {
        try {
            const usuario = JSON.parse(localStorage.getItem('usuario'));
            const colegios = JSON.parse(localStorage.getItem('colegios') || '[]');
            const userId = usuario?.id || null;
            const colegioId = colegios.length > 0 ? colegios[0].id : null;
            return { userId, colegioId };
        } catch (e) {
            console.error("Error reading user data from localStorage", e);
            return { userId: null, colegioId: null };
        }
    };

    // Check if a case is already associated with this interview
    const isCaseAssociated = (caseId) => {
        if (interview?.associated_cases && Array.isArray(interview.associated_cases)) {
            return interview.associated_cases.some(c => c.id === caseId || c === caseId);
        }
        if (interview?.case_id) {
            return interview.case_id === caseId;
        }
        return false;
    };

    // Get count of already associated cases
    const getAssociatedCount = () => {
        if (interview?.associated_cases && Array.isArray(interview.associated_cases)) {
            return interview.associated_cases.length;
        }
        if (interview?.case_id) {
            return 1;
        }
        return 0;
    };

    // Fetch cases when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchCases();
            setSelectedCaseId(null);
            setSearchTerm('');
        }
    }, [isOpen]);

    const fetchCases = async () => {
        const { userId, colegioId } = getUserData();

        if (!userId || !colegioId) {
            setError('No se pudo obtener la información del usuario');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await casesService.getCases(userId, colegioId);
            setCases(data);
        } catch (err) {
            console.error('Error fetching cases:', err);
            setError('Error al cargar los casos');
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

    const handleAssociate = () => {
        if (selectedCaseId) {
            onAssociate(interview, selectedCaseId);
            setSelectedCaseId(null);
            setSearchTerm('');
        }
    };

    const associatedCount = getAssociatedCount();
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
                            {associatedCount > 0 ? (
                                <p className="text-xs text-green-600 mt-0.5">
                                    Esta entrevista ya está asociada a {associatedCount} caso{associatedCount > 1 ? 's' : ''}
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Selecciona un caso para vincular la entrevista
                                </p>
                            )}
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
                        {/* Interview Info */}
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Entrevista de</p>
                            <p className="text-sm font-semibold text-gray-800">{interview?.studentName}</p>
                            {interview?.grade && (
                                <span className="inline-block mt-2 text-xs font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                                    {interview.grade}
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
                                    placeholder="Escribe para filtrar..."
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

                                {error && (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-red-600 mb-2">{error}</p>
                                        <button
                                            onClick={fetchCases}
                                            className="text-sm text-blue-600 hover:underline font-medium"
                                        >
                                            Reintentar
                                        </button>
                                    </div>
                                )}

                                {!loading && !error && sortedCases.map((c) => {
                                    const isAssociated = isCaseAssociated(c.id);
                                    const isSelected = selectedCaseId === c.id;

                                    return (
                                        <div
                                            key={c.id}
                                            onClick={() => setSelectedCaseId(c.id)}
                                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${isSelected
                                                    ? 'border-gray-800 bg-gray-50 ring-1 ring-gray-800'
                                                    : isAssociated
                                                        ? 'border-green-300 bg-green-50/50 hover:border-green-400'
                                                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100/50'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected
                                                    ? 'border-gray-800 bg-gray-800'
                                                    : isAssociated
                                                        ? 'border-green-500 bg-green-500'
                                                        : 'border-gray-300'
                                                }`}>
                                                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                {!isSelected && isAssociated && <Check size={12} className="text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm font-medium block truncate ${isSelected ? 'text-gray-900' : isAssociated ? 'text-green-700' : 'text-gray-700'
                                                    }`}>
                                                    {c.title}
                                                </span>
                                            </div>
                                            {isAssociated && (
                                                <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    <Check size={12} />
                                                    Asociado
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}

                                {!loading && !error && sortedCases.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-gray-400 text-sm">
                                            {searchTerm ? 'No se encontraron casos' : 'No tienes casos disponibles'}
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
                                        Asociar a Caso
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
