import { jsPDF } from 'jspdf';
import { STATUS_CONFIGS, DEFAULT_CASE_STATUS } from '../constants/caseStatus';
import { getImageAsBase64, getCombinedChronology, generateProtocolNarrative } from './exportHelpers';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('pdfExport');

export const exportToPDF = async (caseData, schoolData, documents = []) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - (margin * 2);

        const checkPageSpace = (yPos, neededSpace) => {
            if (yPos + neededSpace > pageHeight - 20) {
                doc.addPage();
                return margin + 10;
            }
            return yPos;
        };

        const usuarioData = JSON.parse(localStorage.getItem('usuario') || '{}');
        const colegioNombre = schoolData?.nombre || usuarioData.colegios_info?.[0]?.nombre || 'Institución Educativa';
        const logoUrl = schoolData?.logo_url || usuarioData.colegios_info?.[0]?.logo_url;

        // ==================== HEADER ====================
        const addHeader = async () => {
            let yPos = 15;
            let logoWidth = 0;

            if (logoUrl) {
                try {
                    const logoBase64 = await getImageAsBase64(logoUrl);
                    const logoSize = 15;
                    doc.addImage(logoBase64, 'PNG', margin, yPos, logoSize, logoSize);
                    logoWidth = logoSize + 5;
                } catch (error) {
                    logger.warn('No se pudo cargar el logo:', error);
                }
            }

            doc.setTextColor(30, 41, 59);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(colegioNombre, margin + logoWidth, yPos + 5);

            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text('Reporte de Caso de Convivencia Escolar', margin + logoWidth, yPos + 10);

            const fecha = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
            const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

            doc.setFontSize(8);
            doc.text(`${fecha} - ${hora}`, pageWidth - margin, yPos + 5, { align: 'right' });

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos + 20, pageWidth - margin, yPos + 20);

            return yPos + 30;
        };

        const addFooter = (pageNum, totalPages) => {
            const footerY = pageHeight - 10;
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.setFont(undefined, 'italic');
            doc.text(`${colegioNombre} - Documento Confidencial`, margin, footerY);
            doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
        };

        let yPosition = await addHeader();

        // ==================== TÍTULO ====================
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        const titleLines = doc.splitTextToSize(caseData.title || 'Sin título', maxWidth);
        doc.text(titleLines, margin, yPosition);
        yPosition += (titleLines.length * 6) + 5;

        // ==================== INFO GENERAL ====================
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text('Información General', margin, yPosition);
        yPosition += 5;

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(71, 85, 105);

        const col1X = margin;
        const col2X = margin + (maxWidth / 2);
        const colWidth = (maxWidth / 2) - 5;

        const addWrappedText = (label, text, x, y) => {
            const fullText = `${label}: ${text}`;
            const lines = doc.splitTextToSize(fullText, colWidth);
            doc.text(lines, x, y);
            return lines.length * 4;
        };

        const typeText = caseData.caseType || 'No especificado';
        // Robust protocol retrieval
        const protocolText = caseData.protocol || caseData.protocolo || caseData.assignedProtocol || 'No especificado';

        const height1 = addWrappedText('Tipo', typeText, col1X, yPosition);
        const height2 = addWrappedText('Protocolo', protocolText, col2X, yPosition);
        yPosition += Math.max(height1, height2) + 2;

        const statusConfig = STATUS_CONFIGS[caseData.status] || STATUS_CONFIGS[DEFAULT_CASE_STATUS];
        const statusLabel = statusConfig?.label || caseData.status || 'No especificado';
        const fechaCreacionRaw = caseData.created_at || caseData.creationDate || caseData.createdAt;
        const fechaCreacion = fechaCreacionRaw ? new Date(fechaCreacionRaw).toLocaleDateString('es-CL') : 'No especificada';

        const height3 = addWrappedText('Estado', statusLabel, col1X, yPosition);
        const height4 = addWrappedText('Fecha de creación', fechaCreacion, col2X, yPosition);
        yPosition += Math.max(height3, height4) + 4;

        doc.setDrawColor(241, 245, 249);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        // Helper para imprimir líneas con salto de página automático
        const printLines = (lines, lineHeight = 4, align = 'justify') => {
            lines.forEach(line => {
                if (yPosition + lineHeight > pageHeight - 20) {
                    doc.addPage();
                    yPosition = margin + 10;
                }
                doc.text(line, margin, yPosition, { align, maxWidth });
                yPosition += lineHeight;
            });
        };

        // ==================== DESCRIPCIÓN ====================
        yPosition = checkPageSpace(yPosition, 20);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text('Descripción', margin, yPosition);
        yPosition += 5;

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(71, 85, 105);
        const descText = caseData.description?.trim() || 'Sin descripción registrada.';
        const descLines = doc.splitTextToSize(descText, maxWidth);
        printLines(descLines);
        yPosition += 8;

        // ==================== PERSONAS INVOLUCRADAS ====================
        yPosition = checkPageSpace(yPosition, 20);
        const involvedCount = caseData.involved?.length || 0;
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text(`Personas Involucradas (${involvedCount})`, margin, yPosition);
        yPosition += 5;

        if (caseData.involved && caseData.involved.length > 0) {
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(71, 85, 105);
            caseData.involved.forEach((person, index) => {
                yPosition = checkPageSpace(yPosition, 10);
                const personText = `${index + 1}. ${person.name} ${person.grade ? `(${person.grade})` : ''} ${person.rut ? `- RUT: ${person.rut}` : ''}`;
                doc.text(personText, margin, yPosition);
                yPosition += 4;
            });
        } else {
            doc.setFontSize(8);
            doc.setFont(undefined, 'italic');
            doc.setTextColor(148, 163, 184);
            doc.text('No hay personas registradas.', margin, yPosition);
            yPosition += 4;
        }
        yPosition += 8;

        // ==================== PROTOCOLO Y SEGUIMIENTO (NARRATIVA) ====================
        yPosition = checkPageSpace(yPosition, 20);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text('Protocolo y Seguimiento', margin, yPosition);
        yPosition += 5;

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(71, 85, 105);

        const narrativeText = generateProtocolNarrative(caseData, documents);
        const narrativeLines = doc.splitTextToSize(narrativeText, maxWidth);
        printLines(narrativeLines);
        yPosition += 8;

        // ==================== CRONOLOGÍA DEL CASO ====================
        const chronology = getCombinedChronology(caseData, documents);
        if (chronology.length > 0) {
            yPosition = checkPageSpace(yPosition, 20);
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text('Cronología del Caso', margin, yPosition);
            yPosition += 5;

            chronology.forEach((event) => {
                yPosition = checkPageSpace(yPosition, 15);

                // Fecha lateral
                doc.setFontSize(7);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(100, 116, 139);
                const dateStr = event.date.toLocaleDateString('es-CL');
                const timeStr = event.date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                doc.text(dateStr, margin, yPosition);
                doc.text(timeStr, margin, yPosition + 3);

                // Línea de tiempo
                doc.setDrawColor(203, 213, 225);
                doc.line(margin + 18, yPosition, margin + 18, yPosition + 10);
                doc.circle(margin + 18, yPosition + 1.5, 0.5, 'F');

                // Contenido del evento
                doc.setFontSize(8);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(71, 85, 105);
                doc.text(event.title, margin + 25, yPosition);

                doc.setFont(undefined, 'normal');
                doc.setTextColor(100, 116, 139);
                const descLines = doc.splitTextToSize(event.description, maxWidth - 35);
                doc.text(descLines, margin + 25, yPosition + 4);

                yPosition += Math.max(12, (descLines.length * 4) + 6);
            });
        }

        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            addFooter(i, totalPages);
        }

        const fileName = `Caso_${caseData.title?.replace(/[^a-z0-9]/gi, '_') || 'sin-titulo'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        return true;

    } catch (error) {
        logger.error('Error al exportar a PDF:', error);
        alert('Error al exportar el caso a PDF');
        throw error;
    }
};
