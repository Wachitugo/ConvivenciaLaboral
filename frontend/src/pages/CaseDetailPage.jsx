import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { CaseDetail } from '../features/my-cases';
import { CaseDetailPageSkeleton } from '../features/my-cases-details/skeletons';
import { casesService, chatService } from '../services/api';
import { createLogger } from '../utils/logger';

const logger = createLogger('CaseDetailPage');

function CaseDetailPage() {
  const { current } = useTheme();
  const { id, schoolSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar } = useOutletContext();

  const [caseData, setCaseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper para formatear y mapear datos del caso
  const formatCaseData = (data, protocolData = null) => {
    const mappedInvolved = (data.involved || []).map((person, index) => ({
      id: person.id || `inv-${index}-${Date.now()}`,
      name: person.name,
      role: person.role || 'Sin rol',
      grade: person.grade, // Mantener por si acaso, pero usaremos role
      rut: person.rut
    }));

    let protocolSteps = data.protocolSteps || [];

    // PRIORITY 1: Persisted manual steps (pasosProtocolo) from backend
    if (data.pasosProtocolo && data.pasosProtocolo.length > 0) {
      protocolSteps = data.pasosProtocolo;
    }
    // PRIORITY 2: Dynamic protocol from separate fetch (only if no persisted steps)
    else if (protocolData && protocolData.protocol && protocolData.protocol.steps) {
      protocolSteps = protocolData.protocol.steps;
    }

    return {
      ...data,
      id: data.id,
      title: data.title,
      caseType: data.case_type || data.caseType,
      status: data.status,
      counterCase: data.counter_case, // ID legible C-001
      createdAt: data.created_at, // Unify with List View (MyCases.jsx) which uses createdAt
      creationDate: data.created_at, // Keep existing property just in case other components use it
      lastUpdate: new Date(data.updated_at || data.created_at || Date.now()).toLocaleDateString(),
      description: data.description,
      involved: mappedInvolved,
      protocol: data.protocol,
      protocolSteps: protocolSteps,
      chatHistory: data.chatHistory || []
    };
  };

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        await fetchCaseById(id);
      }
    };
    loadData();
  }, [id, location.state]);

  const fetchCaseById = async (caseId) => {
    try {
      // Solo mostramos loading si no tenemos datos previos
      if (!caseData) setIsLoading(true);

      // Obtener usuario del localStorage
      const usuarioData = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioData) {
        logger.error('Usuario no disponible');
        return;
      }

      // 1. Obtener datos del caso
      const caseResponse = await casesService.getCaseById(caseId, usuarioData.id);

      // 2. Obtener protocolo asociado
      let protocolData = null;
      try {
        const sessionId = location.state?.sessionId || "history-view";
        protocolData = await chatService.getProtocol(sessionId, caseId);
      } catch {
        // No active protocol found or error fetching protocol
      }

      // 3. Formatear y setear
      const formattedCase = formatCaseData(caseResponse, protocolData);
      setCaseData(formattedCase);

    } catch (error) {
      logger.error("Error fetching case details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const basePath = schoolSlug ? `/${schoolSlug}` : '';
    navigate(`${basePath}/mis-casos`);
  };

  const handleUpdateCase = async (updatedCase, saveToBackend = false) => {
    // Actualización optimista del estado local
    setCaseData(updatedCase);

    // Si se solicita, guardar en el backend
    if (saveToBackend) {
      try {
        const usuario = JSON.parse(localStorage.getItem('usuario'));

        // Debug: Log IDs to see if there's a mismatch
        logger.info("🔍 DEBUG - usuario.id:", usuario.id);
        logger.info("🔍 DEBUG - caseData.owner_id:", updatedCase.owner_id);

        // Preparar datos para actualización
        const updatePayload = {
          title: updatedCase.title,
          status: updatedCase.status,
          description: updatedCase.description, // Ahora permitido
          involved: updatedCase.involved,    // Ahora permitido
          pasosProtocolo: updatedCase.pasosProtocolo // Para protocolos manuales
        };

        logger.info("💾 Guardando cambios en backend:", updatePayload);
        await casesService.updateCase(updatedCase.id, usuario.id, updatePayload);
        logger.info("✅ Cambios guardados exitosamente en backend");

      } catch (error) {
        logger.error("Error updating case in backend:", error);
        // Opcional: Revertir estado o mostrar error
        alert("Hubo un error al guardar los cambios en el servidor.");
      }
    }
  };

  // Mostrar skeleton mientras carga inicialmente
  if (isLoading || !caseData) {
    return (
      <div
        className={`flex-1 flex flex-col rounded-lg shadow-md bg-white border border-gray-300 transition-all duration-300 overflow-y-auto scrollbar-hide`}
      >
        <CaseDetailPageSkeleton />
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col rounded-lg shadow-md bg-white border border-gray-300 transition-all duration-300 overflow-y-auto scrollbar-hide`}
    >
      <CaseDetail
        caseData={caseData}
        onBack={handleBack}
        onUpdateCase={handleUpdateCase}
        isLoading={isLoading}
      />
    </div>
  );
}

export default CaseDetailPage;
