import React from 'react';
import { createPortal } from 'react-dom';
import { Plus, FileWarning, AlertTriangle, X, Save } from 'lucide-react';
import { useCompromisos } from '../hooks';
import { getEstadoCompromiso, formatDate } from '../utils';

function CompromisosTab({ student, canEdit = true }) {
    const {
        compromisos,
        compromisosActivos,
        showModal,
        setShowModal,
        nuevoCompromiso,
        setNuevoCompromiso,
        handleAgregarCompromiso,
        handleCambiarEstado
    } = useCompromisos(student?.id);

    // Get casos asociados for the select dropdown
    const [casosAsociados, setCasosAsociados] = React.useState([]);

    React.useEffect(() => {
        const loadCases = async () => {
            if (student?.id) {
                try {
                    const { studentsService } = await import('../../../services/api');
                    const cases = await studentsService.getStudentCases(student.id);
                    setCasosAsociados(cases.map(c => ({
                        id: c.id,
                        titulo: c.title
                    })));
                } catch (error) {
                    console.error("Error loading cases:", error);
                }
            }
        };
        loadCases();
    }, [student?.id]);

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <FileWarning size={18} className="text-[#34B6D8] flex-shrink-0 sm:w-5 sm:h-5 drop-shadow-[0_0_8px_rgba(52,182,216,0.6)]" />
                        Sanciones
                    </h3>
                    <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                        Seguimiento de sanciones del colaborador
                    </p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-medium text-white bg-[#1A71B8] hover:bg-[#1A71B8]/80 rounded-lg transition-colors border border-white/10"
                    >
                        <Plus size={12} />
                        <span className="hidden sm:inline">Nuevo</span>
                    </button>
                )}
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-auto p-3 sm:p-4">

                {/* Alerta de compromisos activos */}
                {compromisosActivos.length > 0 && (
                    <div className="mb-4 bg-amber-500/10 rounded-lg border border-amber-500/20 p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={14} className="text-amber-400 sm:w-4 sm:h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-amber-300">
                                {compromisosActivos.length} sanción{compromisosActivos.length > 1 ? 'es' : ''} activa{compromisosActivos.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-amber-400/70 truncate">Cualquier nueva falta puede significar incumplimiento</p>
                        </div>
                    </div>
                )}

                {/* Compromisos */}
                {compromisos.length > 0 ? (
                    <>
                        {/* Vista Cards - Móvil */}
                        <div className="space-y-3 md:hidden">
                            {compromisos.map((compromiso) => {
                                const estadoInfo = getEstadoCompromiso(compromiso.estado);
                                const IconEstado = estadoInfo.icon;
                                return (
                                    <div key={compromiso.id} className="bg-white/5 rounded-lg border border-white/10 p-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <p className="text-sm font-medium text-white flex-1">{compromiso.descripcion}</p>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${estadoInfo.bg} ${estadoInfo.text}`}>
                                                <IconEstado size={10} />
                                                {estadoInfo.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50 mb-3">
                                            {compromiso.casoAsociado && (
                                                <span>Caso: <span className="text-white/70">{compromiso.casoAsociado}</span></span>
                                            )}
                                            <span>Vence: <span className="text-white/70">{formatDate(compromiso.fechaVencimiento)}</span></span>
                                        </div>
                                        {canEdit && (
                                            <div className="flex gap-2">
                                                {compromiso.estado !== 'cumplido' && (
                                                    <button
                                                        onClick={() => handleCambiarEstado(compromiso.id, 'cumplido')}
                                                        className="flex-1 text-xs px-2 py-1.5 border border-green-500/20 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors font-medium"
                                                    >
                                                        Marcar Cumplido
                                                    </button>
                                                )}
                                                {compromiso.estado !== 'incumplido' && (
                                                    <button
                                                        onClick={() => handleCambiarEstado(compromiso.id, 'incumplido')}
                                                        className="flex-1 text-xs px-2 py-1.5 border border-red-500/20 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors font-medium"
                                                    >
                                                        Marcar Incumplido
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Vista Tabla - Desktop */}
                        <div className="hidden md:block overflow-hidden rounded-lg border border-white/10">
                            <table className="w-full text-sm">
                                <thead className="bg-black/10">
                                    <tr>
                                        <th className="text-left px-3 py-2 text-xs font-bold text-white/50 uppercase">Compromiso</th>
                                        <th className="text-left px-3 py-2 text-xs font-bold text-white/50 uppercase">Caso</th>
                                        <th className="text-left px-3 py-2 text-xs font-bold text-white/50 uppercase">Vencimiento</th>
                                        <th className="text-left px-3 py-2 text-xs font-bold text-white/50 uppercase">Estado</th>
                                        {canEdit && <th className="text-left px-3 py-2 text-xs font-bold text-white/50 uppercase">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {compromisos.map((compromiso) => {
                                        const estadoInfo = getEstadoCompromiso(compromiso.estado);
                                        const IconEstado = estadoInfo.icon;
                                        return (
                                            <tr key={compromiso.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-3 py-2 text-white max-w-xs">
                                                    <p className="truncate font-medium">{compromiso.descripcion}</p>
                                                </td>
                                                <td className="px-3 py-2 text-white/50">{compromiso.casoAsociado}</td>
                                                <td className="px-3 py-2 text-white/60">{formatDate(compromiso.fechaVencimiento)}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${estadoInfo.bg} ${estadoInfo.text}`}>
                                                        <IconEstado size={10} />
                                                        {estadoInfo.label}
                                                    </span>
                                                </td>
                                                {canEdit && (
                                                    <td className="px-3 py-2">
                                                        <div className="flex gap-1">
                                                            {compromiso.estado !== 'cumplido' && (
                                                                <button
                                                                    onClick={() => handleCambiarEstado(compromiso.id, 'cumplido')}
                                                                    className="text-xs px-1.5 py-0.5 border border-white/10 bg-white/5 text-white/70 rounded hover:bg-white/10 transition-colors"
                                                                >
                                                                    Cumplido
                                                                </button>
                                                            )}
                                                            {compromiso.estado !== 'incumplido' && (
                                                                <button
                                                                    onClick={() => handleCambiarEstado(compromiso.id, 'incumplido')}
                                                                    className="text-xs px-1.5 py-0.5 border border-white/10 bg-white/5 text-white/70 rounded hover:bg-white/10 transition-colors"
                                                                >
                                                                    Incumplido
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center p-6 bg-white/5 rounded-lg border border-dashed border-white/10">
                        <div className="text-center">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                                <FileWarning size={16} className="text-white/40" />
                            </div>
                            <p className="text-sm text-white/50">No hay sanciones registradas</p>
                            {canEdit && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#34B6D8] hover:text-white border border-[#34B6D8]/30 rounded-lg hover:bg-[#34B6D8]/10 transition-colors"
                                >
                                    <Plus size={12} />
                                    Agregar primera sanción
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para nuevo compromiso */}
            {showModal && createPortal(
                <>
                    <div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
                        onClick={() => setShowModal(false)}
                    />
                    <div className="fixed right-0 top-0 h-full z-[70] flex items-center justify-end pointer-events-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        <div className="w-[430px] h-full shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#0A3866]/95 backdrop-blur-3xl border-l border-[#1A71B8]/30 flex flex-col animate-slide-in overflow-hidden pointer-events-auto">
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <FileWarning size={18} className="text-[#34B6D8]" />
                                        Nueva Sanción
                                    </h2>
                                    <p className="text-xs text-white/60 mt-0.5">Registra una nueva sanción para el colaborador</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Descripción *</label>
                                    <textarea
                                        value={nuevoCompromiso.descripcion}
                                        onChange={(e) => setNuevoCompromiso({ ...nuevoCompromiso, descripcion: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-white/20 focus:border-[#34B6D8] focus:ring-4 focus:ring-[#34B6D8]/10 outline-none bg-white/5 text-sm font-medium text-white placeholder:text-white/30 transition-all resize-none"
                                        rows={4}
                                        placeholder="Describe la sanción..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Fecha de vencimiento *</label>
                                    <input
                                        type="date"
                                        value={nuevoCompromiso.fechaVencimiento}
                                        onChange={(e) => setNuevoCompromiso({ ...nuevoCompromiso, fechaVencimiento: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-white/20 focus:border-[#34B6D8] focus:ring-4 focus:ring-[#34B6D8]/10 outline-none bg-white/5 text-sm font-medium text-white transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Caso asociado</label>
                                    <select
                                        value={nuevoCompromiso.casoAsociado}
                                        onChange={(e) => setNuevoCompromiso({ ...nuevoCompromiso, casoAsociado: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-white/20 focus:border-[#34B6D8] focus:ring-4 focus:ring-[#34B6D8]/10 outline-none bg-white/5 text-sm font-medium text-white transition-all appearance-none"
                                    >
                                        <option value="" className="bg-[#0A3866]">Seleccionar caso...</option>
                                        {casosAsociados.map(caso => (
                                            <option key={caso.id} value={caso.titulo} className="bg-[#0A3866]">{caso.titulo}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-white/10">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-white/70 rounded-xl text-sm font-bold hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAgregarCompromiso}
                                        disabled={!nuevoCompromiso.descripcion || !nuevoCompromiso.fechaVencimiento}
                                        className="flex-1 px-4 py-2.5 bg-[#1A71B8] hover:bg-[#1A71B8]/80 text-white border border-white/10 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save size={14} />
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}

export default CompromisosTab;
