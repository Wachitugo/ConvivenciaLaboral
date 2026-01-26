import { useState } from 'react';
import { formatDateToSpanish } from '../utils/dateFormatter';
import { CASE_STATUS, STATUS_CONFIGS, DEFAULT_CASE_STATUS } from '../constants/caseStatus';
import CaseGeneralInfoSkeleton from '../skeletons/CaseGeneralInfoSkeleton';
import { casesService } from '../../../services/api';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('CaseGeneralInfo');

function CaseGeneralInfo({ caseData, onUpdateCase, isLoading = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editedData, setEditedData] = useState({
    title: caseData.title || '',
    status: caseData.status || DEFAULT_CASE_STATUS
  });

  // Formatear fecha de creación (no editable)
  const formattedCreationDate = formatDateToSpanish(
    caseData.creationDate || new Date()
  );

  // Obtener configuración visual del estado
  const getStatusConfig = (status) => {
    return STATUS_CONFIGS[status] || STATUS_CONFIGS[DEFAULT_CASE_STATUS];
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      // Obtener usuario del localStorage
      const usuarioData = JSON.parse(localStorage.getItem('usuario'));

      if (!usuarioData) {
        throw new Error('Usuario no disponible');
      }

      // Preparar datos de actualización (solo title y status)
      const updateData = {
        title: editedData.title.trim(),
        status: editedData.status
      };

      // Llamar al backend
      const updatedCase = await casesService.updateCase(
        caseData.id,
        usuarioData.id,
        updateData
      );

      // Actualizar el caso localmente
      onUpdateCase({ ...caseData, ...updatedCase });
      setIsEditing(false);
    } catch (err) {
      logger.error('Error actualizando caso:', err);
      setError(err.response?.data?.detail || 'Error al actualizar el caso');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData({
      title: caseData.title || '',
      status: caseData.status || DEFAULT_CASE_STATUS
    });
    setError(null);
    setIsEditing(false);
  };

  // Mostrar skeleton mientras carga
  if (isLoading) {
    return <CaseGeneralInfoSkeleton />;
  }

  return (
    <div className="flex flex-col bg-white overflow-hidden rounded-xl border-2 border-gray-300 shadow-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">Información General</span>
            </h3>
            {caseData.counterCase && (
              <span className="text-xs sm:text-sm text-gray-600 font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-300 flex-shrink-0">
                {caseData.counterCase}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
            <span className="hidden sm:inline">Datos generales del caso y estado actual</span>
            <span className="sm:hidden">Datos del caso</span>
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="hidden sm:inline">Editar</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-2 sm:px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-2 sm:px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-3 sm:p-4">
        {isEditing ? (
          // Modo edición
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Nombre del Caso</label>
                <input
                  type="text"
                  value={editedData.title}
                  onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  disabled={isSaving}
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Estado</label>
                <select
                  value={editedData.status}
                  onChange={(e) => setEditedData({ ...editedData, status: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  disabled={isSaving}
                >
                  <option value={CASE_STATUS.PENDING}>{STATUS_CONFIGS[CASE_STATUS.PENDING].label}</option>
                  <option value={CASE_STATUS.OPEN}>{STATUS_CONFIGS[CASE_STATUS.OPEN].label}</option>
                  <option value={CASE_STATUS.RESOLVED}>{STATUS_CONFIGS[CASE_STATUS.RESOLVED].label}</option>
                  <option value={CASE_STATUS.NOT_RESOLVED}>{STATUS_CONFIGS[CASE_STATUS.NOT_RESOLVED].label}</option>
                </select>
              </div>
              {caseData.protocolSteps && caseData.protocolSteps.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs font-medium text-gray-500 uppercase mb-2 block">Protocolo</span>
                  <span className="font-medium text-gray-900 text-sm">{caseData.protocol || 'Por definir'}</span>
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-xs font-medium text-gray-500 uppercase mb-2 block">Fecha de creación</span>
                <span className="font-medium text-gray-900 text-sm">{formattedCreationDate}</span>
              </div>
            </div>
          </div>
        ) : (
          // Modo visualización
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {/* Nombre del Caso - ocupa 2 columnas */}
            <div className="col-span-1 sm:col-span-2 bg-gray-50 p-2.5 sm:p-3 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Nombre del Caso
              </p>
              <p className="font-semibold text-gray-900 text-sm sm:text-base">{caseData.title}</p>
            </div>

            {/* Estado */}
            <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Estado</p>
              {(() => {
                const statusConfig = getStatusConfig(caseData.status || DEFAULT_CASE_STATUS);
                return (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}></span>
                    {statusConfig.label}
                  </span>
                );
              })()}
            </div>

            {/* Fecha de creación */}
            <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fecha de Creación
              </p>
              <p className="font-medium text-gray-900 text-sm">{formattedCreationDate}</p>
            </div>

            {/* Protocolo - solo si hay pasos */}
            {caseData.protocolSteps && caseData.protocolSteps.length > 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Protocolo Adecuado
                </p>
                <p className="font-medium text-gray-900 text-sm">{caseData.protocol || 'Por definir'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CaseGeneralInfo;
