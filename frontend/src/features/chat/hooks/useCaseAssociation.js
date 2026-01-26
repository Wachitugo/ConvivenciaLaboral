import { useState, useEffect } from 'react';
import { casesService } from '../../../services/api';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('useCaseAssociation');

export default function useCaseAssociation(initialCase = null, sessionId = null) {
  const [relatedCase, setRelatedCase] = useState(initialCase);
  const [availableCases, setAvailableCases] = useState([]);
  const [showCaseList, setShowCaseList] = useState(false);

  // Intentar recuperar el caso asociado si hay sessionId pero no relatedCase
  useEffect(() => {
    const fetchAssociatedCase = async () => {
      if (!relatedCase && sessionId) {
        try {
          const caseData = await casesService.getCaseBySession(sessionId);
          if (caseData) {
            setRelatedCase({
              id: caseData.id,
              title: caseData.title,
              caseType: caseData.case_type,
              description: caseData.description
            });
          }
        } catch (error) {
          // Es normal si no hay caso asociado
          if (error.response && error.response.status !== 404) {
            logger.error("Error fetching associated case:", error);
          }
        }
      }
    };

    fetchAssociatedCase();
  }, [sessionId, relatedCase]);

  // Cargar casos disponibles
  useEffect(() => {
    const fetchCases = async () => {
      try {
        // Obtener usuario y colegio del localStorage
        const usuarioData = JSON.parse(localStorage.getItem('usuario'));
        const colegios = JSON.parse(localStorage.getItem('colegios'));
        const colegio = colegios && colegios.length > 0 ? colegios[0] : null;

        if (!usuarioData || !colegio) {
          logger.error("Usuario o colegio no disponible para cargar casos");
          setAvailableCases([]);
          return;
        }

        const cases = await casesService.getCases(usuarioData.id, colegio.id);
        // Mapear al formato esperado por el componente si es necesario
        const formattedCases = cases.map(c => ({
          id: c.id,
          title: c.title,
          caseType: c.case_type || 'General',
          lastUpdate: new Date(c.updated_at || c.created_at).toLocaleDateString(),
          description: c.description
        }));
        setAvailableCases(formattedCases);
      } catch (error) {
        logger.error("Error fetching cases for association:", error);
        setAvailableCases([]);
      }
    };

    fetchCases();
  }, []);

  const toggleCaseList = () => {
    setShowCaseList(!showCaseList);
  };

  const closeCaseList = () => {
    setShowCaseList(false);
  };

  const associateCase = (selectedCase) => {
    setRelatedCase({
      id: selectedCase.id,
      title: selectedCase.title,
      caseType: selectedCase.caseType,
      description: selectedCase.description
    });
    setShowCaseList(false);

    // Aquí guardarías en el backend la asociación del chat con el caso
    // Chat asociado al caso
  };

  return {
    relatedCase,
    availableCases,
    showCaseList,
    setRelatedCase,
    toggleCaseList,
    closeCaseList,
    associateCase
  };
}
