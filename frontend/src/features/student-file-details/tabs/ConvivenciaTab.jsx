import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, FolderOpen, Shield, Link2 } from 'lucide-react';
import { studentsService } from '../../../services/api';
import { AssociateCaseModal, AssociateInterviewModal } from '../components/convivencia-modals';

const STATUS_LABELS = {
    active:       'Activo',
    abierto:      'Abierto',
    pendiente:    'Pendiente',
    resuelto:     'Resuelto',
    no_resuelto:  'No resuelto',
    cerrado:      'Cerrado',
};

const ROLE_LABELS = {
    afectado: { label: 'Denunciante', classes: 'bg-red-900/40 text-red-300 border-red-800/50' },
    agresor:  { label: 'Denunciado',  classes: 'bg-orange-900/40 text-orange-300 border-orange-800/50' },
    testigo:  { label: 'Testigo',     classes: 'bg-blue-900/40 text-blue-300 border-blue-800/50' },
    otro:     { label: 'Otro',        classes: 'bg-white/10 text-white/70 border-white/20' },
};

function ConvivenciaTab({ student, canEdit = true }) {
    const { schoolSlug } = useParams();
    const [casosAsociados, setCasosAsociados] = React.useState([]);
    const [entrevistasAsociadas, setEntrevistasAsociadas] = React.useState([]);
    const [showCaseModal, setShowCaseModal] = React.useState(false);
    const [showInterviewModal, setShowInterviewModal] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (student?.id) {
            loadStudentData();
        }
    }, [student?.id]);

    const loadStudentData = async () => {
        setIsLoading(true);
        try {
            const [cases, interviews] = await Promise.all([
                studentsService.getStudentCases(student.id),
                studentsService.getStudentInterviews(student.id)
            ]);

            setCasosAsociados(cases.map(c => ({
                id: c.id,
                titulo: c.title,
                fecha: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : 'Sin fecha',
                estado: c.status || 'active',
                rol: c.student_role || null,
            })));

            setEntrevistasAsociadas(interviews.map(i => ({
                id: i.id,
                fecha: i.created_at ? new Date(i.created_at).toISOString().split('T')[0] : 'Sin fecha',
                entrevistador: i.interviewer_name || 'Desconocido',
                estado: i.status || 'Borrador'
            })));

        } catch (error) {
            console.error("Error loading student cases/interviews:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssociateCase = async () => {
        await loadStudentData();
    };

    const handleAssociateInterview = async () => {
        await loadStudentData();
    };

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <Shield size={18} className="text-[#34B6D8] flex-shrink-0 sm:w-5 sm:h-5 drop-shadow-[0_0_8px_rgba(52,182,216,0.6)]" />
                        Convivencia Laboral
                    </h3>
                    <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                        Casos y entrevistas asociados al trabajador
                    </p>
                </div>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-auto p-3 sm:p-4">
                {/* Casos y Entrevistas */}
                <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white/80 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <FolderOpen size={14} className="text-[#34B6D8] flex-shrink-0 sm:w-4 sm:h-4" />
                        Casos y Entrevistas Asociados
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Casos */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-white/50 uppercase">Casos ({isLoading ? '…' : casosAsociados.length})</p>
                                <Link to={`/${schoolSlug}/mis-casos`} className="text-xs text-[#34B6D8] hover:underline flex items-center gap-1">
                                    Ver todos <ExternalLink size={10} />
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {isLoading ? (
                                    [1, 2].map(n => (
                                        <div key={n} className="p-2 bg-white/5 rounded-lg border border-white/10 animate-pulse">
                                            <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
                                            <div className="flex items-center justify-between">
                                                <div className="h-2.5 bg-white/10 rounded w-1/4" />
                                                <div className="h-2.5 bg-white/10 rounded w-1/5" />
                                            </div>
                                        </div>
                                    ))
                                ) : casosAsociados.length > 0 ? (
                                    casosAsociados.map((caso) => {
                                        const roleInfo = caso.rol ? ROLE_LABELS[caso.rol] || ROLE_LABELS.otro : null;
                                        return (
                                            <Link
                                                key={caso.id}
                                                to={`/${schoolSlug}/mis-casos/${caso.id}`}
                                                className="block p-2 bg-white/5 rounded-lg border border-white/10 hover:border-[#34B6D8]/30 hover:bg-white/10 transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-1 mb-1">
                                                    <p className="text-sm font-medium text-white truncate flex-1">{caso.titulo}</p>
                                                    {roleInfo && (
                                                        <span className={`flex-shrink-0 px-1.5 py-0.5 rounded border text-[10px] font-bold ${roleInfo.classes}`}>
                                                            {roleInfo.label}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-xs text-white/50">{caso.fecha}</span>
                                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium bg-white/10 text-white/70`}>
                                                        {STATUS_LABELS[caso.estado] || caso.estado}
                                                    </span>
                                                </div>
                                            </Link>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-white/40 text-center py-2">Sin casos asociados</p>
                                )}
                            </div>
                            {canEdit && (
                                <button
                                    onClick={() => setShowCaseModal(true)}
                                    className="mt-2 w-full flex items-center justify-center gap-1.5 p-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg text-xs font-medium transition-colors border border-white/10"
                                >
                                    <Link2 size={12} />
                                    Asociar Caso
                                </button>
                            )}
                        </div>

                        {/* Entrevistas */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-white/50 uppercase">Entrevistas ({isLoading ? '…' : entrevistasAsociadas.length})</p>
                                <Link to={`/${schoolSlug}/entrevistas`} className="text-xs text-[#34B6D8] hover:underline flex items-center gap-1">
                                    Ver todas <ExternalLink size={10} />
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {isLoading ? (
                                    [1, 2].map(n => (
                                        <div key={n} className="p-2 bg-white/5 rounded-lg border border-white/10 animate-pulse">
                                            <div className="h-3 bg-white/10 rounded w-1/2 mb-2" />
                                            <div className="flex items-center justify-between">
                                                <div className="h-2.5 bg-white/10 rounded w-1/3" />
                                                <div className="h-2.5 bg-white/10 rounded w-1/5" />
                                            </div>
                                        </div>
                                    ))
                                ) : entrevistasAsociadas.length > 0 ? (
                                    entrevistasAsociadas.map((entrevista) => (
                                        <Link
                                            key={entrevista.id}
                                            to={`/${schoolSlug}/entrevistas/${entrevista.id}`}
                                            className="block p-2 bg-white/5 rounded-lg border border-white/10 hover:border-[#34B6D8]/30 hover:bg-white/10 transition-all"
                                        >
                                            <p className="text-sm font-medium text-white">{entrevista.fecha}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs text-white/50 truncate">{entrevista.entrevistador}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium bg-white/10 text-white/70`}>
                                                    {entrevista.estado}
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-xs text-white/40 text-center py-2">Sin entrevistas asociadas</p>
                                )}
                            </div>
                            {canEdit && (
                                <button
                                    onClick={() => setShowInterviewModal(true)}
                                    className="mt-2 w-full flex items-center justify-center gap-1.5 p-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg text-xs font-medium transition-colors border border-white/10"
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
