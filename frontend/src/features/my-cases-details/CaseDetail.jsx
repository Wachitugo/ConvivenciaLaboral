import { useMemo, useState, useEffect } from 'react';
import CaseHeader from './components/CaseHeader';
import Breadcrumb from '../../components/Breadcrumb';
import CaseGeneralInfo from './components/CaseGeneralInfo';

import CaseDetailTabs from './components/CaseDetailTabs';
import ChatButton from './components/ChatButton';
import ChatHistoryDropdown from './components/ChatHistoryDropdown';
import ExportButton from './components/ExportButton';
import { casesService, schoolsService } from '../../services/api';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CaseDetail');

function CaseDetail({ caseData, onBack, onUpdateCase, isLoading = false }) {
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cargar documentos desde el backend
  // Cargar documentos desde el backend
  const loadDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const usuarioData = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioData || !caseData.id) return;

      const docs = await casesService.getCaseDocuments(caseData.id, usuarioData.id);
      logger.debug(' Documents received from backend:', docs);
      setDocuments(docs);
    } catch (error) {
      logger.error('Error loading documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [caseData.id]);

  // Simular carga de información general
  useEffect(() => {
    setIsLoadingInfo(true);

    const infoTimer = setTimeout(() => {
      setIsLoadingInfo(false);
    }, 800);

    return () => {
      clearTimeout(infoTimer);
    };
  }, [caseData.id]);

  // Obtener datos del colegio
  const [schoolData, setSchoolData] = useState(null);

  useEffect(() => {
    const fetchSchoolData = async () => {
      logger.debug(' CaseDetail: caseData:', caseData);
      if (caseData?.colegio_id) {
        try {
          logger.debug(' CaseDetail: Fetching school for ID:', caseData.colegio_id);
          const school = await schoolsService.getById(caseData.colegio_id);
          logger.info('✅ CaseDetail: School data fetched:', school);
          setSchoolData(school);
        } catch (error) {
          logger.error('❌ CaseDetail: Error fetching school data:', error);
        }
      } else {
        logger.warn('⚠️ CaseDetail: No colegio_id in caseData');
      }
    };
    fetchSchoolData();
  }, [caseData?.colegio_id]);

  // Manejar eliminación de caso
  const handleDeleteCase = async (caseId) => {
    try {
      setIsDeleting(true);
      const usuarioData = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioData) {
        alert('Error: Usuario no encontrado');
        return;
      }

      await casesService.deleteCase(caseId, usuarioData.id);
      logger.info('✅ Caso eliminado exitosamente');

      // Volver a la lista de casos
      onBack();
    } catch (error) {
      logger.error('Error eliminando caso:', error);
      if (error.response?.status === 403) {
        alert('Solo el propietario puede eliminar el caso');
      } else if (error.response?.status === 404) {
        alert('Caso no encontrado');
      } else {
        alert('Error al eliminar el caso. Por favor intenta nuevamente.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Formatear documentos para el componente CaseDocuments
  const allFiles = useMemo(() => {
    const formatted = documents.map(doc => {
      // Manejar diferentes formatos de fecha de Firestore
      let eventDate = new Date().toLocaleDateString('es-CL');
      if (doc.created_at) {
        try {
          if (doc.created_at._seconds) {
            // Firestore timestamp
            eventDate = new Date(doc.created_at._seconds * 1000).toLocaleDateString('es-CL');
          } else if (typeof doc.created_at === 'string') {
            // ISO string
            eventDate = new Date(doc.created_at).toLocaleDateString('es-CL');
          } else if (doc.created_at instanceof Date) {
            eventDate = doc.created_at.toLocaleDateString('es-CL');
          }
        } catch (e) {
          logger.error('Error parsing date:', e);
        }
      }

      // Determinar tamaño del archivo con fallback
      let fileSize = doc.size;

      // Si doc.size no está definido o es inválido, calcular desde size_bytes
      if (!fileSize || fileSize === 'undefined' || fileSize === 'null') {
        const sizeBytes = doc.size_bytes || 0;
        if (sizeBytes < 1024) {
          fileSize = `${sizeBytes} B`;
        } else if (sizeBytes < 1024 * 1024) {
          fileSize = `${(sizeBytes / 1024).toFixed(1)} KB`;
        } else {
          fileSize = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
        }
        logger.debug(`Calculated size from size_bytes: ${sizeBytes} -> ${fileSize}`);
      }

      return {
        id: doc.id,
        name: doc.name,
        size: fileSize,
        source: doc.source,
        eventTitle: caseData.title || 'Caso',
        eventDate: eventDate,
        gcs_uri: doc.gcs_uri,
        content_type: doc.content_type
      };
    });

    logger.debug(' Formatted files for display:', formatted);
    return formatted;
  }, [documents, caseData.title]);

  return (
    <div
      className="flex-1 flex gap-4"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <CaseHeader
          caseData={caseData}
          onBack={onBack}
          onDeleteCase={handleDeleteCase}
        />

        {/* Contenido del Detalle */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          {/* Breadcrumb y Botones */}
          <div className="flex items-center justify-between gap-4 flex-shrink-0">
            <Breadcrumb caseName={caseData.title} />
            <div className="flex items-center gap-2">
              <ChatHistoryDropdown caseData={caseData} documents={allFiles} />
              <ExportButton caseData={caseData} schoolData={schoolData} documents={documents} />
            </div>
          </div>

          {/* Layout vertical: Info arriba, Tabs abajo */}
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Información General - Ancho completo */}
            <CaseGeneralInfo caseData={caseData} onUpdateCase={onUpdateCase} isLoading={isLoadingInfo} />

            {/* Sistema de tabs - Ocupa el resto del espacio */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <CaseDetailTabs
                caseData={caseData}
                onUpdateCase={onUpdateCase}
                documents={allFiles}
                onReloadDocuments={loadDocuments}
                isLoading={isLoading}
                isLoadingDocs={isLoadingDocs}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseDetail;
