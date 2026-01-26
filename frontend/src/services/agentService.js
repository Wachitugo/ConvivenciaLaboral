import { chatService } from './api';
import { createLogger } from '../utils/logger';

const logger = createLogger('agentService');

export const CASE_TYPES = {
    BULLYING: 'bullying',
    CONFLICTO_INTERPERSONAL: 'conflicto_interpersonal',
    COMPORTAMIENTO_DISRUPTIVO: 'comportamiento_disruptivo',
    AGRESION_FISICA: 'agresion_fisica',
    AGRESION_VERBAL: 'agresion_verbal',
    DISCRIMINACION: 'discriminacion',
    CYBERBULLYING: 'cyberbullying',
    OTROS: 'otros'
};

// Niveles de gravedad
export const SEVERITY_LEVELS = {
    LEVE: 'leve',
    MODERADA: 'moderada',
    GRAVE: 'grave'
};

let currentSessionId = localStorage.getItem('agent_session_id');
const SCHOOL_NAME = "Escuela Demo"; // Could be configurable

const getSessionId = async () => {
    if (!currentSessionId) {
        try {
            currentSessionId = await chatService.createSession();
            localStorage.setItem('agent_session_id', currentSessionId);
        } catch (error) {
            logger.error("Failed to create session", error);
            // Fallback to a random string if API fails, to allow UI to render
            currentSessionId = 'session-' + Date.now();
        }
    }
    return currentSessionId;
};

const agentService = {
    getStatus: async () => {
        try {
            const health = await chatService.checkHealth();
            return { status: health.status === 'ok' ? 'online' : 'offline' };
        } catch (error) {
            return { status: 'offline' };
        }
    },

    sendMessage: async (message, caseId = null) => {
        const sessionId = await getSessionId();
        try {
            const response = await chatService.sendMessage(message, sessionId, SCHOOL_NAME, [], caseId);
            return { response: response.response };
        } catch (error) {
            logger.error("Error sending message", error);
            throw error;
        }
    },

    analyzeCase: async (caseData) => {
        const sessionId = await getSessionId();
        const prompt = `
            Analiza el siguiente caso de convivencia escolar.
            Tipo: ${caseData.type}
            Gravedad: ${caseData.severity}
            Descripción: ${caseData.description}
            Estudiantes: ${JSON.stringify(caseData.students)}

            Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin texto adicional) con la siguiente estructura:
            {
                "case_id": "generar_id_unico",
                "severity_assessment": "evaluación detallada",
                "key_factors": ["factor 1", "factor 2"],
                "immediate_actions": ["acción 1", "acción 2"],
                "intervention_plan": ["paso 1", "paso 2"],
                "follow_up": ["medida 1", "medida 2"],
                "prevention_measures": ["medida 1", "medida 2"],
                "resources_needed": ["recurso 1", "recurso 2"]
            }
        `;

        try {
            const response = await chatService.sendMessage(prompt, sessionId, SCHOOL_NAME);
            let cleanResponse = response.response;
            // Attempt to clean markdown code blocks if present
            cleanResponse = cleanResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanResponse);
        } catch (error) {
            logger.error("Error analyzing case", error);
            // Return a mock/error object to prevent UI crash
            return {
                case_id: "error-analysis",
                severity_assessment: "No se pudo generar el análisis automáticamente.",
                key_factors: ["Error de conexión o formato"],
                immediate_actions: ["Contactar soporte"],
                intervention_plan: [],
                follow_up: [],
                prevention_measures: [],
                resources_needed: []
            };
        }
    },

    quickConsultation: async (caseType, description) => {
        const sessionId = await getSessionId();
        const prompt = `
            Consulta rápida sobre: ${caseType}
            Descripción: ${description}

            Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
            {
                "response": "Respuesta general",
                "suggestions": ["sugerencia 1", "sugerencia 2"]
            }
        `;

        try {
            const response = await chatService.sendMessage(prompt, sessionId, SCHOOL_NAME);
            let cleanResponse = response.response;
            cleanResponse = cleanResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanResponse);
        } catch (error) {
            logger.error("Error in quick consultation", error);
            return {
                response: "No se pudo procesar la consulta.",
                suggestions: ["Intente nuevamente más tarde"]
            };
        }
    }
};

export default agentService;