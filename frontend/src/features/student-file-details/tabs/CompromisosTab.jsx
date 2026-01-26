import React from 'react';
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
        <div className="flex flex-col h-full bg-white overflow-hidden rounded-xl shadow-sm">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FileWarning size={18} className="text-blue-600 flex-shrink-0 sm:w-5 sm:h-5" />
                        Compromisos
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Seguimiento de compromisos del estudiante
                    </p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
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
                    <div className="mb-4 bg-amber-50 rounded-lg border border-amber-200 p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={14} className="text-amber-600 sm:w-4 sm:h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-amber-800">
                                {compromisosActivos.length} compromiso{compromisosActivos.length > 1 ? 's' : ''} activo{compromisosActivos.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-amber-600 truncate">Cualquier nueva falta puede significar incumplimiento</p>
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
                                    <div key={compromiso.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <p className="text-sm font-medium text-gray-900 flex-1">{compromiso.descripcion}</p>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${estadoInfo.bg} ${estadoInfo.text}`}>
                                                <IconEstado size={10} />
                                                {estadoInfo.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                                            {compromiso.casoAsociado && (
                                                <span>Caso: <span className="text-gray-700">{compromiso.casoAsociado}</span></span>
                                            )}
                                            <span>Vence: <span className="text-gray-700">{formatDate(compromiso.fechaVencimiento)}</span></span>
                                        </div>
                                        {canEdit && (
                                            <div className="flex gap-2">
                                                {compromiso.estado !== 'cumplido' && (
                                                    <button
                                                        onClick={() => handleCambiarEstado(compromiso.id, 'cumplido')}
                                                        className="flex-1 text-xs px-2 py-1.5 border border-green-200 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
                                                    >
                                                        Marcar Cumplido
                                                    </button>
                                                )}
                                                {compromiso.estado !== 'incumplido' && (
                                                    <button
                                                        onClick={() => handleCambiarEstado(compromiso.id, 'incumplido')}
                                                        className="flex-1 text-xs px-2 py-1.5 border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
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
                        <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase">Compromiso</th>
                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase">Caso</th>
                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase">Vencimiento</th>
                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                        {canEdit && <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {compromisos.map((compromiso) => {
                                        const estadoInfo = getEstadoCompromiso(compromiso.estado);
                                        const IconEstado = estadoInfo.icon;
                                        return (
                                            <tr key={compromiso.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-3 py-2 text-gray-900 max-w-xs">
                                                    <p className="truncate font-medium">{compromiso.descripcion}</p>
                                                </td>
                                                <td className="px-3 py-2 text-gray-500">{compromiso.casoAsociado}</td>
                                                <td className="px-3 py-2 text-gray-600">{formatDate(compromiso.fechaVencimiento)}</td>
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
                                                                    className="text-xs px-1.5 py-0.5 border border-gray-200 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                                                                >
                                                                    Cumplido
                                                                </button>
                                                            )}
                                                            {compromiso.estado !== 'incumplido' && (
                                                                <button
                                                                    onClick={() => handleCambiarEstado(compromiso.id, 'incumplido')}
                                                                    className="text-xs px-1.5 py-0.5 border border-gray-200 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
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
                    <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <div className="text-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                                <FileWarning size={16} className="text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">No hay compromisos registrados</p>
                            {canEdit && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    <Plus size={12} />
                                    Agregar primer compromiso
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para nuevo compromiso */}
            {showModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Nuevo Compromiso</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Descripción *</label>
                                <textarea
                                    value={nuevoCompromiso.descripcion}
                                    onChange={(e) => setNuevoCompromiso({ ...nuevoCompromiso, descripcion: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Ej: Mantener buen comportamiento durante los recreos"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha de vencimiento *</label>
                                <input
                                    type="date"
                                    value={nuevoCompromiso.fechaVencimiento}
                                    onChange={(e) => setNuevoCompromiso({ ...nuevoCompromiso, fechaVencimiento: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Caso asociado</label>
                                <select
                                    value={nuevoCompromiso.casoAsociado}
                                    onChange={(e) => setNuevoCompromiso({ ...nuevoCompromiso, casoAsociado: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Seleccionar caso...</option>
                                    {casosAsociados.map(caso => (
                                        <option key={caso.id} value={caso.titulo}>{caso.titulo}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAgregarCompromiso}
                                disabled={!nuevoCompromiso.descripcion || !nuevoCompromiso.fechaVencimiento}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Save size={14} />
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CompromisosTab;
