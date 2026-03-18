import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, MoreVertical, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../../components/modals';

function InterviewDetailHeader({ title, onBack, onExport, onDelete, interviewData, isDeleting = false }) {
    const handleConfirmDelete = () => {
        if (onDelete) {
            onDelete();
        }
    };

    return (
        <div className="flex items-center p-3 border-b border-white/10 bg-transparent flex-shrink-0" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onBack}
                    className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    title="Volver"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <h1 className="text-lg font-bold text-white flex-1 text-center">Detalle de la Entrevista</h1>

            <div className="flex-1 flex justify-end items-center gap-2">
                {/* Opciones se han movido a la página principal */}
            </div>

            {/* Modal de confirmación de eliminación */}
            <ConfirmModal
                isOpen={false} // Movido a InterviewDetailPage
                onClose={() => {}}
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
