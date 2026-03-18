import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDateToSpanish } from '../utils/dateFormatter';
import { CASE_STATUS, STATUS_CONFIGS, DEFAULT_CASE_STATUS } from '../constants/caseStatus';
import CaseGeneralInfoSkeleton from '../skeletons/CaseGeneralInfoSkeleton';
import ChatHistoryDropdown from './ChatHistoryDropdown';
import { ConfirmModal } from '../../../components/modals';
import { casesService } from '../../../services/api';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('CaseGeneralInfo');

function CaseGeneralInfo({ caseData, onUpdateCase, isLoading = false, onDeleteCase, isDeleting = false, documents = [] }) {
  const navigate = useNavigate();
  const { schoolSlug } = useParams();
  const [isEditing, setIsEditing] = useState(false);

  const handleOpenChat = () => {
    const basePath = schoolSlug ? `/${schoolSlug}` : '';
    navigate(`${basePath}/chat-general`, {
      state: {
        relatedCase: {
          id: caseData.id,
          title: caseData.title,
          caseType: caseData.caseType,
          description: caseData.description,
          documents
        }
      }
    });
  };
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
    <div className="flex flex-col bg-[#0A3866]/30 backdrop-blur-3xl border-b border-[#1A71B8]/30 overflow-hidden rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] relative" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-[#1A71B8]/30 flex items-center justify-between flex-shrink-0 gap-2 relative z-10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#34B6D8] flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,182,216,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">Información General</span>
            </h3>
            {caseData.counterCase && (
              <span className="text-xs sm:text-sm text-white font-mono bg-[#1A71B8]/20 px-2 py-0.5 rounded border border-[#1A71B8]/40 flex-shrink-0">
                {caseData.counterCase}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-white/50 mt-0.5 truncate">
            <span className="hidden sm:inline">Datos generales del caso y estado actual</span>
            <span className="sm:hidden">Datos del caso</span>
          </p>
        </div>
        {!isEditing ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <ChatHistoryDropdown caseData={caseData} documents={documents} />
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-[#ef4444] border border-[#ef4444]/30 rounded-lg hover:bg-[#ef4444]/10 transition-colors disabled:opacity-50 backdrop-blur-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">{isDeleting ? 'Eliminando...' : 'Eliminar'}</span>
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#1A71B8] to-[#34B6D8] hover:from-[#34B6D8] hover:to-[#1A71B8] rounded-lg transition-all shadow-[0_4px_16px_rgba(26,113,184,0.4)] hover:shadow-[0_6px_20px_rgba(52,182,216,0.6)]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="hidden sm:inline">Editar</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-2 sm:px-3 py-1.5 text-xs text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#1A71B8] to-[#34B6D8] hover:from-[#34B6D8] hover:to-[#1A71B8] rounded-lg transition-all shadow-[0_4px_16px_rgba(26,113,184,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-3 sm:p-4 relative z-10">
        {isEditing ? (
          // Modo edición
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg backdrop-blur-md">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                <label className="text-[10px] font-bold text-white/50 tracking-widest uppercase mb-2 block">Nombre del Caso</label>
                <input
                  type="text"
                  value={editedData.title}
                  onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#34B6D8] focus:border-[#34B6D8] text-sm bg-black/20 text-white placeholder-white/30 transition-all"
                  disabled={isSaving}
                />
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                <label className="text-[10px] font-bold text-white/50 tracking-widest uppercase mb-2 block">Estado</label>
                <select
                  value={editedData.status}
                  onChange={(e) => setEditedData({ ...editedData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#34B6D8] focus:border-[#34B6D8] text-sm bg-black/20 text-white transition-all [&>option]:bg-[#0f172a]"
                  disabled={isSaving}
                >
                  <option value={CASE_STATUS.PENDING}>{STATUS_CONFIGS[CASE_STATUS.PENDING].label}</option>
                  <option value={CASE_STATUS.OPEN}>{STATUS_CONFIGS[CASE_STATUS.OPEN].label}</option>
                  <option value={CASE_STATUS.RESOLVED}>{STATUS_CONFIGS[CASE_STATUS.RESOLVED].label}</option>
                  <option value={CASE_STATUS.NOT_RESOLVED}>{STATUS_CONFIGS[CASE_STATUS.NOT_RESOLVED].label}</option>
                </select>
              </div>
              {caseData.protocolSteps && caseData.protocolSteps.length > 0 && (
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                  <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase mb-2 block">Protocolo</span>
                  <span className="font-semibold text-white/90 text-sm">{caseData.protocol || 'Por definir'}</span>
                </div>
              )}
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase mb-2 block">Fecha de creación</span>
                <span className="font-semibold text-white/90 text-sm">{formattedCreationDate}</span>
              </div>
            </div>
          </div>
        ) : (
          // Modo visualización
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Nombre del Caso - ocupa 2 columnas */}
            <div className="col-span-1 sm:col-span-2 bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-2xl backdrop-blur-md">
              <p className="text-[10px] font-bold text-white/50 tracking-widest uppercase mb-1.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#34B6D8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Nombre del Caso
              </p>
              <p className="font-bold text-white text-sm sm:text-base leading-snug">{caseData.title}</p>
            </div>

            {/* Estado */}
            <div className="bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-2xl backdrop-blur-md">
              <p className="text-[10px] font-bold text-white/50 tracking-widest uppercase mb-1.5 flex items-center gap-1.5">Estado</p>
              {(() => {
                const statusConfig = getStatusConfig(caseData.status || DEFAULT_CASE_STATUS);
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 shadow-sm ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} shadow-[0_0_8px_currentColor]`}></span>
                    {statusConfig.label}
                  </span>
                );
              })()}
            </div>

            {/* Fecha de creación */}
            <div className="bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-2xl backdrop-blur-md">
              <p className="text-[10px] font-bold text-white/50 tracking-widest uppercase mb-1.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#34B6D8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fecha de Creación
              </p>
              <p className="font-semibold text-white/90 text-sm">{formattedCreationDate}</p>
            </div>

            {/* Protocolo - solo si hay pasos */}
            {caseData.protocolSteps && caseData.protocolSteps.length > 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-2xl backdrop-blur-md">
                <p className="text-[10px] font-bold text-white/50 tracking-widest uppercase mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#34B6D8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Protocolo Adecuado
                </p>
                <p className="font-semibold text-white/90 text-sm">{caseData.protocol || 'Por definir'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => onDeleteCase?.(caseData.id)}
        title="¿Eliminar caso?"
        message={`¿Estás seguro de que deseas eliminar el caso "${caseData.title}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        icon="danger"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}

export default CaseGeneralInfo;
