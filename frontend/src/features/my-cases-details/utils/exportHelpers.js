import { schoolsService } from '../../../services/api';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('exportHelpers');

// Helper para normalizar fecha
export const getValidDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
};

// Helper para construir cronología unificada
export const getCombinedChronology = (caseData, documents = []) => {
    const events = [];

    // 1. Creación del caso
    const createdDate = getValidDate(caseData.created_at || caseData.creationDate || caseData.createdAt);
    if (createdDate) {
        events.push({
            date: createdDate,
            type: 'creation',
            title: 'Caso creado',
            description: 'Inicio del registro del caso en la plataforma',
            icon: 'folder'
        });
    }

    // 2. Documentos adjuntos (usando prop documents)
    if (documents && documents.length > 0) {
        documents.forEach(doc => {
            const docName = doc.name || '';
            // Excluir JSONs
            if (!docName.toLowerCase().endsWith('.json') && !docName.includes('protocol_')) {
                const docDate = getValidDate(doc.created_at?._seconds ? doc.created_at._seconds * 1000 : doc.created_at);
                if (docDate) {
                    events.push({
                        date: docDate,
                        type: 'document',
                        title: 'Documento adjunto',
                        description: docName || 'Archivo sin nombre',
                        icon: 'document'
                    });
                }
            }
        });
    }

    // 3. Pasos del protocolo completados
    const steps = caseData.pasosProtocolo || caseData.protocolSteps || [];
    steps.forEach((step, index) => {
        // Verificar si está completado (checking various flags)
        const isCompleted = step.estado === 'completado' || step.status === 'completed';
        const stepDate = getValidDate(step.fecha || step.completed_at);

        if (isCompleted && stepDate) {
            events.push({
                date: stepDate,
                type: 'step',
                title: `Paso ${index + 1}: ${step.titulo || step.title || 'Sin título'}`,
                description: step.notas || step.notes || 'Paso completado',
                icon: 'check'
            });
        }
    });

    // Ordenar por fecha (más antiguo primero)
    return events.sort((a, b) => a.date - b.date);
};

// Función para convertir imagen a base64
export const getImageAsBase64 = (url) => {
    return new Promise(async (resolve, reject) => {
        logger.info('🖼️ ExportButton: Loading image via proxy:', url);

        try {
            // Usar el proxy del backend para obtener la imagen
            const blob = await schoolsService.getProxyImage(url);

            const reader = new FileReader();
            reader.onloadend = () => {
                logger.info('✅ ExportButton: Image converted to Base64 via proxy');
                resolve(reader.result);
            };
            reader.onerror = (e) => {
                logger.error('❌ ExportButton: Error reading blob:', e);
                reject(e);
            };
            reader.readAsDataURL(blob);

        } catch (error) {
            logger.error('❌ ExportButton: Error loading image via proxy:', error);

            // Fallback: intentar carga directa si el proxy falla
            logger.info('⚠️ ExportButton: Attempting direct load as fallback...');
            const img = new Image();
            img.crossOrigin = 'Anonymous';

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };

            img.onerror = (e) => reject(new Error('Image load failed'));
            img.src = url;
        }
    });
};

// Helper para generar narrativa del protocolo
export const generateProtocolNarrative = (caseData, documents = []) => {
    const steps = caseData.pasosProtocolo || caseData.protocolSteps || [];
    const protocolName = caseData.protocol || caseData.protocolo || caseData.assignedProtocol || 'protocolo asignado';

    // Lista unificada de eventos para la narrativa (Pasos + Documentos)
    const narrativeEvents = [];

    // 1. Agregar pasos completados
    steps.forEach(step => {
        if (step.estado === 'completado' || step.status === 'completed') {
            narrativeEvents.push({
                type: 'step',
                title: step.titulo || step.title || 'un paso sin título',
                date: getValidDate(step.fecha || step.completed_at),
                originalDate: step.fecha || step.completed_at
            });
        }
    });

    // 2. Agregar documentos (Filtrar JSONs internos)
    if (documents && documents.length > 0) {
        documents.forEach(doc => {
            const docName = doc.name || '';
            if (!docName.toLowerCase().endsWith('.json') && !docName.includes('protocol_')) {
                narrativeEvents.push({
                    type: 'document',
                    title: docName || 'un documento adjunto',
                    date: getValidDate(doc.created_at?._seconds ? doc.created_at._seconds * 1000 : doc.created_at),
                    originalDate: doc.created_at
                });
            }
        });
    }

    // Ordenar cronológicamente
    narrativeEvents.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateA - dateB;
    });

    if (narrativeEvents.length === 0) {
        if (documents.length > 0) return `Se ha activado el protocolo "${protocolName}" y se han gestionado documentos de respaldo, aunque aún no se registran hitos formales del protocolo completados en el sistema.`;
        return `Se ha activado el protocolo "${protocolName}", sin embargo, a la fecha, no se han registrado hitos completados ni se ha adjuntado documentación adicional al expediente.`;
    }

    let narrative = `En el marco de la gestión del caso y la aplicación del protocolo "${protocolName}", se ha realizado un seguimiento sistemático de las acciones comprometidas. `;

    // Construir historia secuencial con más detalle pero SIN notas específicas
    narrativeEvents.forEach((event, index) => {
        const dateStr = event.date ? ` el ${event.date.toLocaleDateString('es-CL')}` : '';
        let actionText = "";

        // Variar el inicio de la frase
        const starters = ["Inicialmente,", "Posteriormente,", "A continuación,", "Seguidamente,", "Asimismo,", "Finalmente,"];
        let starter = index === 0 ? starters[0] : (index === narrativeEvents.length - 1 ? starters[starters.length - 1] : starters[(index % (starters.length - 2)) + 1]);

        if (event.type === 'step') {
            // Frases genéricas pero extensas
            actionText = `se dio por cumplida la etapa de "${event.title}"${dateStr}, completando así los requerimientos y procedimientos establecidos para dicha fase del protocolo`;
        } else {
            actionText = `se procedió a incorporar al expediente el documento "${event.title}"${dateStr}, como antecedente relevante para el respaldo de las acciones realizadas`;
        }

        narrative += `${starter} ${actionText}. `;
    });

    // Cierre del relato
    const nextStep = steps.find(s => s.estado !== 'completado' && s.status !== 'completed');
    if (nextStep) {
        narrative += `Actualmente, el caso se mantiene activo y en curso, encontrándose en la etapa de "${nextStep.titulo || nextStep.title}", la cual está pendiente de ejecución para continuar con el debido proceso.`;
    } else {
        narrative += "Con estos antecedentes, se da cuenta de que se han completado todas las etapas contempladas en el protocolo, contando con la documentación de respaldo correspondiente para el cierre administrativo del caso.";
    }

    return narrative;
};
