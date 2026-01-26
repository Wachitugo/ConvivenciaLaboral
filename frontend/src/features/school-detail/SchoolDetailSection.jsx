import React from 'react';
import BulkUploadModal from '../crud-admin/BulkUploadModal';
import { useSchoolDetailSection } from './hooks';
import { SCHOOL_DETAIL_TABS } from './constants';
import {
    SchoolHeader,
    SchoolTabs,
    EmptyState,
    StudentsTable,
    StaffTable,
    SchoolDocumentsContent
} from './components';

export default function SchoolDetailSection({ school, onBack, onRegistrarUsuario, usuarios = [] }) {
    const {
        activeTab,
        setActiveTab,
        uploadModal,
        students,
        schoolStaff,
        documentsRef,
        handleOpenUploadModal,
        handleCloseUploadModal,
        handleUploadSuccess,
        handleUpdateStudent,
        handleDeleteStudent,
        handleUploadClick,
        getUploadButtonLabel
    } = useSchoolDetailSection({ school, usuarios });

    const renderContent = () => {
        switch (activeTab) {
            case 'alumnos':
                return students.length === 0 ? (
                    <EmptyState type="alumnos" onUploadClick={() => handleOpenUploadModal('alumnos')} />
                ) : (
                    <StudentsTable
                        students={students}
                        onUpdateStudent={handleUpdateStudent}
                        onDeleteStudent={handleDeleteStudent}
                    />
                );
            case 'personal':
                return schoolStaff.length === 0 ? (
                    <EmptyState type="personal" onUploadClick={() => handleOpenUploadModal('personal')} />
                ) : (
                    <StaffTable staff={schoolStaff} />
                );
            default:
                return <SchoolDocumentsContent ref={documentsRef} school={school} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header con info del colegio */}
            <SchoolHeader school={school} onBack={onBack} />

            {/* Tabs + Botón de carga */}
            <SchoolTabs
                tabs={SCHOOL_DETAIL_TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={{
                    alumnos: students.length,
                    personal: schoolStaff.length,
                    documentos: null
                }}
                onUploadClick={handleUploadClick}
                uploadLabel={getUploadButtonLabel()}
            />

            {/* Content Card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
                {renderContent()}
            </div>

            {/* Modal de carga */}
            <BulkUploadModal
                isOpen={uploadModal.isOpen}
                onClose={handleCloseUploadModal}
                school={school}
                uploadType={uploadModal.type}
                onRegistrarUsuario={onRegistrarUsuario}
                onSuccess={handleUploadSuccess}
            />
        </div>
    );
}
