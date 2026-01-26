import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, MoreVertical, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../../components/modals';

function InterviewDetailHeader({ title, onBack, onExport, onDelete, interviewData, isDeleting = false }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleDeleteClick = () => {
        setIsMenuOpen(false);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (onDelete) {
            onDelete();
        }
    };

    return (
        <div className="flex items-center p-3 border-b border-gray-200 bg-white flex-shrink-0" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onBack}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    title="Volver"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <h1 className="text-lg font-semibold text-gray-800 flex-1 text-center">Detalle de la Entrevista</h1>

            <div className="flex-1 flex justify-end items-center gap-2">
                {/* Menu de opciones */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        title="Opciones"
                    >
                        <MoreVertical size={20} />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            <button
                                onClick={handleDeleteClick}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                                <Trash2 size={16} />
                                Eliminar entrevista
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmación de eliminación */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar entrevista?"
                message={`¿Estás seguro de que deseas eliminar la entrevista de ${interviewData?.studentName || 'este estudiante'}? Esta acción no se puede deshacer y se eliminarán todos los archivos asociados.`}
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

export default InterviewDetailHeader;
