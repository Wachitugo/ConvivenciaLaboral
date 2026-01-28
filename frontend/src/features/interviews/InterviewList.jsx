import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import InterviewRow from './InterviewRow';
import AssociateCaseModal from './AssociateCaseModal';
import { ConfirmModal } from '../../components/modals';
import { interviewsService } from '../../services/api';
import { useInterview } from '../../contexts/InterviewContext';
import { useToast } from '../../components/Toast';

function InterviewList({ interviews, onOpenModal }) {
    const navigate = useNavigate();
    const { schoolSlug } = useParams();
    const { updateInterview, deleteInterview } = useInterview();
    const { showToast, ToastComponent } = useToast();
    const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
    const [selectedInterviewForAssociation, setSelectedInterviewForAssociation] = useState(null);
    const [isAssociating, setIsAssociating] = useState(false);

    // Selection state for deletion
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSelectInterview = (interview) => {
        const basePath = schoolSlug ? `/${schoolSlug}` : '';
        navigate(`${basePath}/entrevistas/${interview.id}`);
    };

    const handleOpenAssociateModal = (interview) => {
        setSelectedInterviewForAssociation(interview);
        setIsAssociateModalOpen(true);
    };

    const handleCloseAssociateModal = () => {
        setIsAssociateModalOpen(false);
        setSelectedInterviewForAssociation(null);
    };

    const handleAssociateCase = async (interview, caseId) => {
        setIsAssociating(true);
        try {
            // Call API to associate interview with case
            await interviewsService.associateToCase(interview.id, caseId);

            // Update local state
            await updateInterview(interview.id, { case_id: caseId });

            // Show success toast
            showToast('Entrevista asociada al caso correctamente', 'success');

            handleCloseAssociateModal();
        } catch (error) {
            console.error('Error associating interview to case:', error);

            // Show error toast
            const errorMessage = error.response?.data?.detail || 'Error al asociar la entrevista';
            showToast(errorMessage, 'error');
        } finally {
            setIsAssociating(false);
        }
    };

    // Selection handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(interviews.map(i => i.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleDeleteSelected = async () => {
        setIsDeleting(true);
        try {
            const deletePromises = Array.from(selectedIds).map(id => deleteInterview(id));
            await Promise.all(deletePromises);
            showToast(`${selectedIds.size} entrevista(s) eliminada(s) correctamente`, 'success');
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Error deleting interviews:', error);
            showToast('Error al eliminar entrevistas', 'error');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (!interviews || interviews.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-white p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No hay entrevistas</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-6">
                    Comienza creando una nueva entrevista para registrar el seguimiento de los alumnos.
                </p>
                <button
                    onClick={onOpenModal}
                    className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
                >
                    Comenzar una nueva entrevista
                </button>
            </div>
        );
    }

    const allSelected = interviews.length > 0 && selectedIds.size === interviews.length;
    const someSelected = selectedIds.size > 0;

    return (
        <>
            {/* Floating action bar at bottom center */}
            {someSelected && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 fade-in duration-200">
                    <div className="flex items-center gap-4 px-5 py-3 bg-white rounded-xl shadow-lg border border-gray-200 backdrop-blur-sm">
                        <span className="text-sm font-medium text-gray-700">
                            {selectedIds.size} seleccionada{selectedIds.size > 1 ? 's' : ''}
                        </span>
                        <div className="w-px h-5 bg-gray-200" />
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                        </button>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Cancelar selección"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => !isDeleting && setShowDeleteConfirm(false)}
                onConfirm={handleDeleteSelected}
                title="¿Eliminar entrevistas?"
                message={`¿Estás seguro de que deseas eliminar ${selectedIds.size} entrevista${selectedIds.size > 1 ? 's' : ''}? Esta acción no se puede deshacer y se eliminarán todos los archivos asociados.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                icon="danger"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
                isLoading={isDeleting}
                loadingText="Eliminando..."
            />

            <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md border-2 border-gray-300 overflow-hidden backdrop-blur-sm relative">
                {/* Loading overlay during deletion */}
                {isDeleting && (
                    <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-blue-200 rounded-full"></div>
                                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-700">Eliminando entrevistas...</p>
                                <p className="text-xs text-gray-500 mt-1">Esto puede tomar unos segundos</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="min-w-full">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-gradient-to-r from-gray-50 via-gray-100/80 to-gray-50 border-b border-gray-200">
                                {/* Checkbox */}
                                <th scope="col" className="px-3 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                    />
                                </th>
                                {/* Alumno */}
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/4">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Estudiante
                                    </div>
                                </th>
                                {/* Género */}
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        Género
                                    </div>
                                </th>
                                {/* Curso */}
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        Área de trabajo
                                    </div>
                                </th>

                                {/* Fecha */}
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Fecha
                                    </div>
                                </th>

                                {/* Entrevistador */}
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Entrevistador
                                    </div>
                                </th>

                                {/* Estado */}
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Estado
                                    </div>
                                </th>

                                {/* Acciones */}
                                <th scope="col" className="relative px-6 py-4">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {interviews.map((interview) => (
                                <InterviewRow
                                    key={interview.id}
                                    interview={interview}
                                    onSelect={handleSelectInterview}
                                    onAssociate={handleOpenAssociateModal}
                                    isSelected={selectedIds.has(interview.id)}
                                    onToggleSelect={handleSelectOne}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AssociateCaseModal
                isOpen={isAssociateModalOpen}
                onClose={handleCloseAssociateModal}
                onAssociate={handleAssociateCase}
                interview={selectedInterviewForAssociation}
                isAssociating={isAssociating}
            />

            {/* Toast Notifications */}
            {ToastComponent}
        </>
    );
}

export default InterviewList;
