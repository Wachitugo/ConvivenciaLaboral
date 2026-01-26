import { Plus } from 'lucide-react';
import { SchoolDetailSection } from '../school-detail';
import { useSchoolsSection } from './hooks';
import {
    SearchInput,
    SchoolsTable,
    ConfirmModal,
    EditSchoolModal,
    CreateSchoolModal
} from './components';

export default function SchoolsSection({
    colegios,
    usuarios,
    onCreateColegio,
    onEliminarColegio,
    onEditarColegio,
    onRegistrarUsuario,
    onSchoolSelected
}) {
    const {
        searchTerm,
        setSearchTerm,
        selectedSchool,
        confirmModal,
        editModal,
        createModal,
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
    } = useSchoolsSection({ onEliminarColegio, onSchoolSelected });

    const filteredColegios = filterColegios(colegios);

    // Si hay un colegio seleccionado, mostrar los detalles
    if (selectedSchool) {
        return (
            <SchoolDetailSection
                school={selectedSchool}
                onBack={handleBackToList}
                onRegistrarUsuario={onRegistrarUsuario}
                usuarios={usuarios}
            />
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar colegios..."
                    />

                    <button
                        onClick={openCreateModal}
                        className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nuevo Colegio
                    </button>
                </div>

                {/* Content */}
                <SchoolsTable
                    colegios={filteredColegios}
                    searchTerm={searchTerm}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    onCreate={openCreateModal}
                />
            </div>

            {/* Modales */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmDelete}
                title="¿Eliminar colegio?"
                message={`¿Estás seguro de que deseas eliminar "${confirmModal.colegio?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Sí, eliminar"
                type="danger"
            />

            <EditSchoolModal
                isOpen={editModal.isOpen}
                onClose={closeEditModal}
                school={editModal.colegio}
                onSave={onEditarColegio}
            />

            <CreateSchoolModal
                isOpen={createModal}
                onClose={closeCreateModal}
                onCreateColegio={onCreateColegio}
            />
        </>
    );
}
