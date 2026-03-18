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
                className="fixed inset-0 bg-[#0A3866]/60 backdrop-blur-md z-[60] transition-opacity"
                onClick={onClose}
            />

            {/* Slide-in Panel */}
            <div className="fixed right-0 top-0 h-full z-[70] flex items-center justify-end pointer-events-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <div className="w-[430px] h-full shadow-[-8px_0_32px_rgba(0,0,0,0.5)] bg-[#0A3866]/95 backdrop-blur-2xl border-l border-white/10 flex flex-col animate-slide-in overflow-hidden pointer-events-auto">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-white/10 bg-transparent flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <LinkIcon size={18} className="text-[#34B6D8] drop-shadow-[0_0_8px_rgba(52,182,216,0.6)]" />
                                Asociar a un Caso
                            </h2>
                            {associatedCount > 0 ? (
                                <p className="text-xs text-emerald-400 mt-0.5">
                                    Esta entrevista ya está asociada a {associatedCount} caso{associatedCount > 1 ? 's' : ''}
                                </p>
                            ) : (
                                <p className="text-xs text-white/60 mt-0.5">
                                    Selecciona un caso para vincular la entrevista
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X size={20} strokeWidth={2} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-transparent space-y-5">
                        {/* Interview Info */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Entrevista de</p>
                            <p className="text-sm font-bold text-white">{interview?.studentName}</p>
                            {interview?.grade && (
                                <span className="inline-block mt-2 text-xs font-mono bg-white/10 px-2 py-0.5 rounded border border-white/20 text-white">
                                    {interview.grade}
                                </span>
                            )}
                        </div>

                        {/* Search */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Buscar Caso</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                <input
                                    type="text"
                                    placeholder="Escribe para filtrar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/20 focus:border-[#34B6D8]/50 focus:ring-1 focus:ring-[#34B6D8]/50 outline-none bg-white/5 text-sm font-medium text-white shadow-inner transition-all placeholder:text-white/40"
                                />
                            </div>
                        </div>

                        {/* Cases List */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Casos Disponibles</label>

                            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {loading && (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60"></div>
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
                                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 shadow-inner ${isSelected
                                                    ? 'border-[#34B6D8] bg-[#34B6D8]/10 ring-1 ring-[#34B6D8]/50'
                                                    : isAssociated
                                                        ? 'border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-500/80'
                                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                    ? 'border-[#34B6D8] bg-[#34B6D8]'
                                                    : isAssociated
                                                        ? 'border-emerald-500 bg-emerald-500'
                                                        : 'border-white/20 bg-transparent'
                                                }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 bg-[#0A3866] font-bold rounded-full" />}
                                                {!isSelected && isAssociated && <Check size={12} className="text-white" strokeWidth={3} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm block truncate ${isSelected ? 'text-white font-bold' : isAssociated ? 'text-emerald-300 font-bold' : 'text-white/80 font-medium'
                                                    }`}>
                                                    {c.title}
                                                </span>
                                            </div>
                                            {isAssociated && (
                                                <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                                                    <Check size={10} />
                                                    Asociado
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}

                                {!loading && !error && sortedCases.length === 0 && (
                                    <div className="text-center py-8 bg-white/5 border border-dashed border-white/10 rounded-xl">
                                        <p className="text-white/50 text-sm">
                                            {searchTerm ? 'No se encontraron casos' : 'No tienes casos disponibles'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10 bg-[#0A3866]/95 backdrop-blur-2xl">
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white/80 rounded-xl text-sm font-bold hover:bg-white/10 hover:text-white transition-all shadow-inner"
                            >
                                Cancelar
                            </button>
                            <button
                                disabled={!selectedCaseId || isAssociating}
                                onClick={handleAssociate}
                                className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-bold transition-colors shadow-md border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${selectedCaseIsAlreadyAssociated
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-[#1A71B8] hover:bg-[#1A71B8]/80'
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
