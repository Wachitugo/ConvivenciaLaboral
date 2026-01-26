import React from 'react';
import { createPortal } from 'react-dom';
import { useBulkUploadModal } from './hooks';
import {
    BulkUploadHeader,
    ModeToggle,
    UploadZone,
    ColumnsInfo,
    IndividualForm,
    MessageAlert,
    BulkUploadFooter,
    BulkWarning
} from './components';

export default function BulkUploadModal({ isOpen, onClose, school, uploadType, onRegistrarUsuario, onSuccess }) {
    const {
        mode,
        setMode,
        file,
        isProcessing,
        error,
        success,
        individualForm,
        fileInputRef,
        handleFileChange,
        handleUpload,
        handleIndividualSubmit,
        handleDownloadTemplate,
        handleClose,
        updateFormField,
        triggerFileInput,
        clearFile
    } = useBulkUploadModal({ school, uploadType, onRegistrarUsuario, onSuccess, onClose });

    if (!isOpen) return null;

    return createPortal(
        <>
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
                onClick={handleClose}
            />

            <div className="fixed right-0 top-0 h-full z-[70] flex items-center justify-end pointer-events-none">
                <div className="w-[430px] h-full shadow-2xl bg-white border-l border-gray-100 flex flex-col overflow-hidden pointer-events-auto">
                    {/* Header */}
                    <BulkUploadHeader
                        uploadType={uploadType}
                        schoolName={school?.nombre}
                        onClose={handleClose}
                    />

                    {/* Mode Toggle */}
                    <ModeToggle mode={mode} onModeChange={setMode} />

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1 space-y-5">
                        {/* Messages */}
                        <MessageAlert error={error} success={success} />

                        {mode === 'bulk' ? (
                            <>
                                {/* Upload Zone */}
                                <UploadZone
                                    file={file}
                                    isProcessing={isProcessing}
                                    fileInputRef={fileInputRef}
                                    onFileChange={handleFileChange}
                                    onTriggerInput={triggerFileInput}
                                    onClearFile={clearFile}
                                />

                                {/* Columns Info */}
                                <ColumnsInfo
                                    uploadType={uploadType}
                                    onDownloadTemplate={handleDownloadTemplate}
                                />
                            </>
                        ) : (
                            /* Individual Form */
                            <IndividualForm
                                uploadType={uploadType}
                                form={individualForm}
                                isProcessing={isProcessing}
                                onUpdateField={updateFormField}
                            />
                        )}

                        {/* Warning - solo para modo masivo */}
                        {mode === 'bulk' && <BulkWarning uploadType={uploadType} />}
                    </div>

                    {/* Footer */}
                    <BulkUploadFooter
                        mode={mode}
                        file={file}
                        isProcessing={isProcessing}
                        onCancel={handleClose}
                        onSubmit={mode === 'bulk' ? handleUpload : handleIndividualSubmit}
                    />
                </div>
            </div>
        </>,
        document.body
    );
}
