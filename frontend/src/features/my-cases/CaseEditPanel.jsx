import { useState, useEffect } from 'react';
import { casesService } from '../../services/api';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CaseEditPanel');

export default function CaseEditPanel({ isOpen, onClose, caseToEdit, onUpdateCase }) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('pendiente');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Opciones de status
  const statusOptions = [
    { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'abierto', label: 'Abierto', color: 'bg-blue-100 text-blue-700' },
    { value: 'resuelto', label: 'Resuelto', color: 'bg-green-100 text-green-700' },
    { value: 'no_resuelto', label: 'No Resuelto', color: 'bg-red-100 text-red-700' }
  ];

  useEffect(() => {
    if (caseToEdit) {
      setTitle(caseToEdit.title || '');
      setStatus(caseToEdit.status || 'pendiente');
      setError(null);
    }
  }, [caseToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Obtener usuario del localStorage
      const usuarioData = JSON.parse(localStorage.getItem('usuario'));

      if (!usuarioData) {
        throw new Error('Usuario no disponible');
      }

      // Preparar datos de actualización
      const updateData = {
        title: title.trim(),
        status: status
      };

      // Llamar a la API
      const updatedCase = await casesService.updateCase(
        caseToEdit.id,
        usuarioData.id,
        updateData
      );

      // Formatear el caso actualizado para el componente padre
      const formattedCase = {
        ...caseToEdit,
        title: updatedCase.title,
        status: updatedCase.status,
        caseType: updatedCase.case_type || caseToEdit.caseType,
        lastUpdate: new Date(updatedCase.updated_at || new Date()).toLocaleDateString(),
        isActive: updatedCase.status !== 'resuelto' && updatedCase.status !== 'no_resuelto',
        isShared: updatedCase.is_shared || caseToEdit.isShared,
        description: updatedCase.description || caseToEdit.description,
        createdAt: updatedCase.created_at || caseToEdit.createdAt,
        ownerId: updatedCase.owner_id || caseToEdit.ownerId,
        ownerName: updatedCase.owner_name || caseToEdit.ownerName,
        colegioId: updatedCase.colegio_id || caseToEdit.colegioId
      };

      // Notificar al componente padre
      onUpdateCase(formattedCase);

      // Cerrar panel
      onClose();
    } catch (err) {
      logger.error('Error actualizando caso:', err);
      setError(err.response?.data?.detail || 'Error al actualizar el caso');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-50 flex items-center justify-end pointer-events-none">
        <div className="w-[520px] h-full rounded-l-lg shadow-2xl bg-white border-l border-gray-200 flex flex-col animate-slide-in overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Editar Caso</h2>
              <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Cerrar">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Actualiza el título y el estado del caso.</p>
          </div>

          {/* Formulario */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/30">
            <form id="edit-case-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Mostrar error si existe */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Título del caso
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="Ej: Conflicto entre estudiantes"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estado del caso
                </label>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                        status === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={status === option.value}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="ml-3 flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${option.color}`}>
                          {option.label}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Información adicional */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Nota:</strong> Solo puedes editar el título y el estado del caso.
                  Para modificar otros datos, contacta al administrador.
                </p>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                form="edit-case-form"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}