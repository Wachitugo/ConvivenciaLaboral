import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { InterviewDetailHeader } from '../features/interviews';
import {
    InterviewGeneralInfo,
    InterviewSummaryTab,
    InterviewNotesTab,
    InterviewConsentTab,
    InterviewTabs,
    InterviewDetailSkeleton
} from '../features/interviews-details/components'; // Adjusted import to be explicit or rely on feature index if corrected
import { useInterviewDetailPage } from '../features/interviews-details/hooks/useInterviewDetailPage';
import AssociateCaseModal from '../features/interviews/AssociateCaseModal';
import { interviewsService } from '../services/api';
import { useInterview } from '../contexts/InterviewContext';
import { ConfirmModal } from '../components/modals';
import { Trash2, Link as LinkIcon, FileText, Mic, PenTool, Download, Sparkles, AlertCircle, FileAudio, Keyboard } from 'lucide-react';

function InterviewDetailPage() {
    const { schoolSlug } = useParams();
    const { current } = useTheme();
    const {
        interview,
        loading,
        activeTab,
        setActiveTab,
        documents,
        setDocuments,
        formData,
        notification,
        uploadingFiles,
        handleFiles,
        handleDelete,
        handleSelectDocument,
        handleDownload,
        handleInputChange,
        handleSignatureEnd,
        handleUploadSignature,
        handleDeleteSignature,
        generateSummary,
        handleSaveAudioRecording,
        navigate,
        showNotification,
        selectedDocumentId,
        studentSignatureUrl,
        guardianSignatureUrl,
        handleSave,
        refreshInterview
    } = useInterviewDetailPage();

    const { updateInterview, deleteInterview } = useInterview();
    const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Added isDeleteModalOpen
    const [isAssociating, setIsAssociating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (loading) return <InterviewDetailSkeleton />;

    const handleOpenAssociateModal = () => {
        setIsAssociateModalOpen(true);
    };

    const handleCloseAssociateModal = () => {
        setIsAssociateModalOpen(false);
    };

    const handleAssociateCase = async (interviewToAssociate, caseId) => {
        setIsAssociating(true);
        try {
            // Call API to associate interview with case
            await interviewsService.associateToCase(interviewToAssociate.id, caseId);

            // Update local state via context if needed to reflect global changes
            // Note: useInterviewDetailPage typically fetches fresh data on mount/updates,
            // but we might want to manually update if we stay on page
            await updateInterview(interviewToAssociate.id, { case_id: caseId });

            // Show success toast
            showNotification('Entrevista asociada al caso correctamente');

            handleCloseAssociateModal();

        } catch (error) {
            console.error('Error associating interview to case:', error);
            const errorMessage = error.response?.data?.detail || 'Error al asociar la entrevista';
            showNotification(errorMessage, 'error');
        } finally {
            setIsAssociating(false);
        }
    };

    const handleUpdateGeneralInfo = async (updatedData) => {
        try {
            await updateInterview(interview.id, updatedData);
            await refreshInterview(); // Refresh local state
            showNotification('Información actualizada correctamente');
        } catch (error) {
            console.error('Error updating interview info:', error);
            showNotification('Error al actualizar la información', 'error');
        }
    };

    const handleDeleteInterview = async () => {
        if (!interview) return;

        try {
            setIsDeleting(true);
            await deleteInterview(interview.id);
            showNotification('Entrevista eliminada correctamente');
            // Redirigir a la lista de entrevistas
            setTimeout(() => {
                setTimeout(() => {
                    const basePath = schoolSlug ? `/${schoolSlug}` : '';
                    navigate(`${basePath}/entrevistas`);
                }, 1000);
            }, 1000);
        } catch (error) {
            console.error('Error deleting interview:', error);
            showNotification('Error al eliminar la entrevista', 'error');
            setIsDeleting(false);
        }
    };

    const handleConfirmDelete = async () => {
        await handleDeleteInterview();
        setIsDeleteModalOpen(false);
    };

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }} className={`flex-1 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 overflow-auto`}>
      
            {/* Content Container */}
            <div className="flex flex-col gap-3 flex-1 min-h-0">

                {/* Layout Vertical: Info General arriba, Tabs abajo */}
                <div className="flex flex-col gap-4 flex-1 min-h-0">

                    {/* TOP: General Info */}
                    <div className="flex-shrink-0">
                        <InterviewGeneralInfo
                            interview={interview}
                            onUpdate={handleUpdateGeneralInfo}
                            onDelete={() => setIsDeleteModalOpen(true)}
                            onAssociate={() => setIsAssociateModalOpen(true)}
                        />
                    </div>

                    {/* BOTTOM: Tabs & Content - Estilo CaseDetailTabs */}
                    <div className="flex-1 min-h-0">
                        <div className="flex flex-col rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] border border-[#1A71B8]/30 h-full bg-[#0A3866]/30 backdrop-blur-3xl">

                            {/* Custom Tabs */}
                            <InterviewTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                            {/* Tab Content Area */}
                            <div className="flex-1 bg-white/5 rounded-b-3xl overflow-y-auto relative z-10 backdrop-blur-md">
                                {activeTab === 'resumen' && (
                                    <InterviewSummaryTab
                                        formData={formData}
                                        generateSummary={generateSummary}
                                        interview={interview}
                                    />
                                )}

                                {activeTab === 'entrevista' && (
                                    <InterviewNotesTab
                                        formData={formData}
                                        handleInputChange={handleInputChange}
                                        onSaveRecording={handleSaveAudioRecording}
                                        onUpload={handleFiles}
                                        onSave={handleSave}
                                        documents={documents}
                                        handleDownload={handleDownload}
                                        handleDelete={handleDelete}
                                        onSelectDocument={handleSelectDocument}
                                        selectedDocumentId={selectedDocumentId}
                                    />
                                )}

                                {activeTab === 'autorización' && (
                                    <InterviewConsentTab
                                        formData={formData}
                                        handleSignatureEnd={handleSignatureEnd}
                                        onUploadSignature={handleUploadSignature}
                                        studentSignatureUrl={studentSignatureUrl}
                                        guardianSignatureUrl={guardianSignatureUrl}
                                        onDeleteSignature={handleDeleteSignature}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                    } transition-all duration-300 z-50`}>
                    {notification.message}
                </div>
            )}

            <AssociateCaseModal
                isOpen={isAssociateModalOpen}
                onClose={handleCloseAssociateModal}
                onAssociate={handleAssociateCase}
                interview={interview}
                isAssociating={isAssociating}
            />

            {/* Modal de Confirmación de Eliminación */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar entrevista?"
                message={`¿Estás seguro de que deseas eliminar la entrevista de ${interview?.studentName || 'este estudiante'}? Esta acción no se puede deshacer y se eliminarán todos los archivos asociados.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                icon="danger"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
                isLoading={isDeleting}
                loadingText="Eliminando..."
            />
        </div>
    );
}

export default InterviewDetailPage;
