import { useState, useEffect, useRef } from 'react';
import { studentsService } from '../../../services/api';

/**
 * Hook para manejar la lógica de SchoolDetailSection
 */
export function useSchoolDetailSection({ school, usuarios = [] }) {
    const [activeTab, setActiveTab] = useState('trabajadores');
    const [uploadModal, setUploadModal] = useState({ isOpen: false, type: null });
    const [students, setStudents] = useState([]);
    const documentsRef = useRef(null);

    // Cargar alumnos de la API
    useEffect(() => {
        const fetchStudents = async () => {
            if (school?.id) {
                const data = await studentsService.getStudents(school.id);
                setStudents(data);
            }
        };
        fetchStudents();
    }, [school?.id]);

    // Filtrar usuarios por colegio
    const schoolStaff = usuarios.filter(u =>
        u.colegios_info &&
        u.colegios_info.length > 0 &&
        u.colegios_info[0].id === school.id
    );

    const handleOpenUploadModal = (type) => {
        setUploadModal({ isOpen: true, type });
    };

    const handleCloseUploadModal = () => {
        setUploadModal({ isOpen: false, type: null });
    };

    const handleUploadSuccess = async () => {
        // Recargar datos después de una carga exitosa
        if (school?.id) {
            const data = await studentsService.getStudents(school.id);
            setStudents(data);
        }
    };

    const handleUpdateStudent = async (updatedStudent) => {
        try {
            // Llamar al servicio para actualizar en backend
            await studentsService.updateStudent(updatedStudent.id, updatedStudent);

            // Actualizar lista local
            setStudents(prev => prev.map(s =>
                s.id === updatedStudent.id ? updatedStudent : s
            ));
        } catch (error) {
            console.error('Error updating student:', error);
            throw error;
        }
    };

    const handleDeleteStudent = async (studentId) => {
        try {
            await studentsService.deleteStudent(studentId);
            setStudents(prev => prev.filter(s => s.id !== studentId));
        } catch (error) {
            console.error('Error deleting student:', error);
            throw error;
        }
    };

    const handleUploadClick = () => {
        if (activeTab === 'documentos') {
            documentsRef.current?.triggerUpload();
        } else {
            handleOpenUploadModal(activeTab);
        }
    };

    const getUploadButtonLabel = () => {
        switch (activeTab) {
            case 'trabajadores':
                return 'Cargar Trabajadores';
            case 'personal':
                return 'Cargar Personal';
            default:
                return 'Cargar Documentos';
        }
    };

    return {
        // Estado
        activeTab,
        setActiveTab,
        uploadModal,
        students,
        schoolStaff,
        documentsRef,

        // Acciones
        handleOpenUploadModal,
        handleCloseUploadModal,
        handleUploadSuccess,
        handleUpdateStudent,
        handleDeleteStudent,
        handleUploadClick,
        getUploadButtonLabel
    };
}
