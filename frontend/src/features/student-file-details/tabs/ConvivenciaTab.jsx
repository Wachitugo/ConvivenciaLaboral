import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FolderOpen, Shield, Link2 } from 'lucide-react';
import { studentsService } from '../../../services/api';
import { AssociateCaseModal, AssociateInterviewModal } from '../components/convivencia-modals';

function ConvivenciaTab({ student, canEdit = true }) {
    const [casosAsociados, setCasosAsociados] = React.useState([]);
    const [entrevistasAsociadas, setEntrevistasAsociadas] = React.useState([]);
    const [showCaseModal, setShowCaseModal] = React.useState(false);
    const [showInterviewModal, setShowInterviewModal] = React.useState(false);

    React.useEffect(() => {
        if (student?.id) {
            loadStudentData();
        }
    }, [student?.id]);

    const loadStudentData = async () => {
        try {
            const [cases, interviews] = await Promise.all([
                studentsService.getStudentCases(student.id),
                studentsService.getStudentInterviews(student.id)
            ]);

            setCasosAsociados(cases.map(c => ({
                id: c.id,
                titulo: c.title,
                fecha: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : 'Sin fecha',
                estado: c.status || 'active'
            })));

            setEntrevistasAsociadas(interviews.map(i => ({
                id: i.id,
                fecha: i.created_at ? new Date(i.created_at).toISOString().split('T')[0] : 'Sin fecha',
                entrevistador: i.interviewer_name || 'Desconocido',
                estado: i.status || 'Borrador'
            })));

        } catch (error) {
            console.error("Error loading student cases/interviews:", error);
        }
    };

    const handleAssociateCase = async () => {
        await loadStudentData();
    };

    const handleAssociateInterview = async () => {
        await loadStudentData();
    };

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden rounded-xl shadow-sm">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Shield size={18} className="text-blue-600 flex-shrink-0 sm:w-5 sm:h-5" />
                        Convivencia Escolar
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Casos y entrevistas asociados al estudiante
                    </p>
                </div>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-auto p-3 sm:p-4">
                {/* Casos y Entrevistas */}
                <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <FolderOpen size={14} className="text-blue-500 flex-shrink-0 sm:w-4 sm:h-4" />
                        Casos y Entrevistas Asociados
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Casos */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-gray-500 uppercase">Casos ({casosAsociados.length})</p>
                                <Link to="/mis-casos" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                    Ver todos <ExternalLink size={10} />
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {casosAsociados.length > 0 ? (
                                    casosAsociados.map((caso) => (
                                        <Link
                                            key={caso.id}
                                            to={`/mis-casos/${caso.id}`}
                                            className="block p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                                        >
                                            <p className="text-sm font-medium text-gray-900 truncate">{caso.titulo}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs text-gray-500">{caso.fecha}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${caso.estado === 'Abierto' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {caso.estado}
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-2">Sin casos asociados</p>
                                )}
                            </div>
                            {canEdit && (
                                <button
                                    onClick={() => setShowCaseModal(true)}
                                    className="mt-2 w-full flex items-center justify-center gap-1.5 p-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-200"
                                >
                                    <Link2 size={12} />
                                    Asociar Caso
                                </button>
                            )}
                        </div>

                        {/* Entrevistas */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-gray-500 uppercase">Entrevistas ({entrevistasAsociadas.length})</p>
                                <Link to="/entrevistas" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                    Ver todas <ExternalLink size={10} />
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {entrevistasAsociadas.length > 0 ? (
                                    entrevistasAsociadas.map((entrevista) => (
                                        <Link
                                            key={entrevista.id}
                                            to={`/entrevistas/${entrevista.id}`}
                                            className="block p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                                        >
                                            <p className="text-sm font-medium text-gray-900">{entrevista.fecha}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs text-gray-500 truncate">{entrevista.entrevistador}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${entrevista.estado === 'Autorizada' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {entrevista.estado}
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-2">Sin entrevistas asociadas</p>
                                )}
                            </div>
                            {canEdit && (
                                <button
                                    onClick={() => setShowInterviewModal(true)}
                                    className="mt-2 w-full flex items-center justify-center gap-1.5 p-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-200"
                                >
                                    <Link2 size={12} />
                                    Asociar Entrevista
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals de Asociación */}
            <AssociateCaseModal
                isOpen={showCaseModal}
                onClose={() => setShowCaseModal(false)}
                onAssociate={handleAssociateCase}
                student={student}
                associatedCaseIds={casosAsociados.map(c => c.id)}
            />

            <AssociateInterviewModal
                isOpen={showInterviewModal}
                onClose={() => setShowInterviewModal(false)}
                onAssociate={handleAssociateInterview}
                student={student}
                associatedInterviewIds={entrevistasAsociadas.map(i => i.id)}
            />
        </div>
    );
}

export default ConvivenciaTab;
