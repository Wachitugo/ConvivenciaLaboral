import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { InterviewDetailHeader } from '../features/interviews';
import Breadcrumb from '../components/Breadcrumb';
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
        generateSummary,
        handleSaveAudioRecording,
        navigate,
        showNotification,
        selectedDocumentId,
        studentSignatureUrl,
        guardianSignatureUrl,
        handleDeleteSignature,
        handleSave,
        refreshInterview
    } = useInterviewDetailPage();

    const { updateInterview, deleteInterview } = useInterview();
    const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
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

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }} className={`flex-1 flex flex-col rounded-lg shadow-md  ${current.cardBg} border border-gray-300 transition-all duration-300 overflow-hidden`}>
            {/* Header with Breadcrumb and Actions */}
            <InterviewDetailHeader
                title={interview ? interview.studentName : 'Cargando...'}
                onBack={() => navigate(-1)}
                onExport={() => { }} // Add export logic later
                onDelete={handleDeleteInterview}
                interviewData={interview}
                isDeleting={isDeleting}
            />

            {/* Content Container */}
            <div className="flex flex-col p-4 gap-3 flex-1 overflow-hidden">

                {/* Breadcrumb */}
                <div className="w-full mb-1 mt-2 flex-shrink-0 flex items-center justify-between gap-4">
                    <Breadcrumb caseName={interview?.studentName} />
                    {interview?.status === 'Autorizada' && (
                        <button
                            onClick={handleOpenAssociateModal}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-colors"
                            title="Asociar a Caso"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span>Asociar caso</span>
                        </button>
                    )}
                </div>

                {/* Layout Vertical: Info General arriba, Tabs abajo */}
                <div className="flex flex-col gap-4 flex-1 overflow-hidden">

                    {/* TOP: General Info */}
                    <div className="flex-shrink-0">
                        <InterviewGeneralInfo interview={interview} onUpdate={handleUpdateGeneralInfo} />
                    </div>

                    {/* BOTTOM: Tabs & Content */}
                    <div className="flex-1 flex flex-col overflow-hidden rounded-xl border-2 border-gray-300 ">

                        {/* Custom Tabs */}
                        <InterviewTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                        {/* Tab Content Area */}
                        <div className={`flex-1 bg-white rounded-b-xl overflow-hidden flex flex-col`}>
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
        </div>
    );
}

export default InterviewDetailPage;
