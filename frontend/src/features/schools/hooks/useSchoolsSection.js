import { useState } from 'react';

/**
 * Hook para manejar la lógica de SchoolsSection
 */
export function useSchoolsSection({ onEliminarColegio, onSchoolSelected }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSchool, setSelectedSchool] = useState(null);

    // Modales
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, colegio: null });
    const [editModal, setEditModal] = useState({ isOpen: false, colegio: null });
    const [createModal, setCreateModal] = useState(false);

    const handleDelete = (colegio) => {
        setConfirmModal({ isOpen: true, colegio });
    };

    const confirmDelete = async () => {
        if (confirmModal.colegio) {
            await onEliminarColegio(confirmModal.colegio.id);
        }
    };

    const handleEdit = (colegio) => {
        setEditModal({ isOpen: true, colegio });
    };

    const handleView = (colegio) => {
        setSelectedSchool(colegio);
        onSchoolSelected?.(colegio);
    };

    const handleBackToList = () => {
        setSelectedSchool(null);
        onSchoolSelected?.(null);
    };

    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, colegio: null });
    };

    const closeEditModal = () => {
        setEditModal({ isOpen: false, colegio: null });
    };

    const openCreateModal = () => {
        setCreateModal(true);
    };

    const closeCreateModal = () => {
        setCreateModal(false);
    };

    const filterColegios = (colegios) => {
        return colegios.filter(c =>
            !searchTerm ||
            c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.direccion && c.direccion.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    return {
        // Estado
        searchTerm,
        setSearchTerm,
        selectedSchool,
        confirmModal,
        editModal,
        createModal,

        // Acciones
        handleDelete,
        confirmDelete,
        handleEdit,
        handleView,
        handleBackToList,
        closeConfirmModal,
        closeEditModal,
        openCreateModal,
        closeCreateModal,
        filterColegios
    };
}
