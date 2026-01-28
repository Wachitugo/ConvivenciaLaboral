import { jsPDF } from 'jspdf';
import { getImageAsBase64 } from '../../my-cases-details/utils/exportHelpers';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('interviewPdfExport');

/**
 * Exports an interview summary to PDF with school branding
 * @param {Object} interviewData - The interview data
 * @param {Object} schoolData - Optional school data (logo, name)
 * @returns {Promise<boolean>} - Success status
 */
export const exportInterviewToPDF = async (interviewData, schoolData = null) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - (margin * 2);

        // Helper for page breaks
        const checkPageSpace = (yPos, neededSpace) => {
            if (yPos + neededSpace > pageHeight - 20) {
                doc.addPage();
                return margin + 10;
            }
            return yPos;
        };

        // Get school data from localStorage if not provided
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
            doc.text('Resumen de Entrevista de Convivencia Escolar', margin + logoWidth, yPos + 10);

            const fecha = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
            const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

            doc.setFontSize(8);
            doc.text(`${fecha} - ${hora}`, pageWidth - margin, yPos + 5, { align: 'right' });

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos + 20, pageWidth - margin, yPos + 20);

            return yPos + 30;
        };

        // Footer
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
        const titleText = `Entrevista: ${interviewData.studentName || 'Sin nombre'}`;
        const titleLines = doc.splitTextToSize(titleText, maxWidth);
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

        // Row 1: Alumno y Área de trabajo
        const height1 = addWrappedText('Alumno', interviewData.studentName || 'No especificado', col1X, yPosition);
        const height2 = addWrappedText('Área de trabajo', interviewData.grade || interviewData.course || 'No especificado', col2X, yPosition);
        yPosition += Math.max(height1, height2) + 2;

        // Row 2: Entrevistador y Fecha
        const fechaEntrevista = interviewData.date || (interviewData.created_at ? new Date(interviewData.created_at).toLocaleDateString('es-CL') : 'No especificada');
        const height3 = addWrappedText('Entrevistador', interviewData.interviewer || interviewData.interviewer_name || 'No especificado', col1X, yPosition);
        const height4 = addWrappedText('Fecha', fechaEntrevista, col2X, yPosition);
        yPosition += Math.max(height3, height4) + 2;

        // Row 3: Estado
        const statusLabels = {
            'Borrador': 'Borrador',
            'Autorizada': 'Autorizada',
            'Finalizada': 'Finalizada'
        };
        const statusLabel = statusLabels[interviewData.status] || interviewData.status || 'No especificado';
        addWrappedText('Estado', statusLabel, col1X, yPosition);
        yPosition += 8;

        doc.setDrawColor(241, 245, 249);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        // Helper para imprimir líneas con salto de página automático
        const printLines = (lines, lineHeight = 4) => {
            lines.forEach(line => {
                if (yPosition + lineHeight > pageHeight - 20) {
                    doc.addPage();
                    yPosition = margin + 10;
                }
                doc.text(line, margin, yPosition, { maxWidth });
                yPosition += lineHeight;
            });
        };

        // ==================== RESUMEN INTELIGENTE ====================
        if (interviewData.aiSummary) {
            yPosition = checkPageSpace(yPosition, 20);
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text('Resumen Inteligente', margin, yPosition);
            yPosition += 5;

            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(71, 85, 105);

            // Try to parse as JSON (structured summary)
            let parsedSummary = null;
            try {
                parsedSummary = JSON.parse(interviewData.aiSummary);
            } catch (e) {
                // Not JSON, treat as plain text
            }

            if (parsedSummary && typeof parsedSummary === 'object') {
                // Resumen Ejecutivo
                if (parsedSummary.resumen_ejecutivo) {
                    yPosition = checkPageSpace(yPosition, 10);
                    doc.setFont(undefined, 'bold');
                    doc.text('Resumen Ejecutivo:', margin, yPosition);
                    yPosition += 4;
                    doc.setFont(undefined, 'normal');

                    const resumenText = Array.isArray(parsedSummary.resumen_ejecutivo)
                        ? parsedSummary.resumen_ejecutivo.join('\n\n')
                        : parsedSummary.resumen_ejecutivo;
                    const resumenLines = doc.splitTextToSize(resumenText, maxWidth);
                    printLines(resumenLines);
                    yPosition += 4;
                }

                // Puntos Clave
                if (parsedSummary.puntos_clave && parsedSummary.puntos_clave.length > 0) {
                    yPosition = checkPageSpace(yPosition, 10);
                    doc.setFont(undefined, 'bold');
                    doc.text('Puntos Clave:', margin, yPosition);
                    yPosition += 4;
                    doc.setFont(undefined, 'normal');

                    parsedSummary.puntos_clave.forEach((point, idx) => {
                        yPosition = checkPageSpace(yPosition, 8);
                        const bulletText = `• ${point}`;
                        const pointLines = doc.splitTextToSize(bulletText, maxWidth - 5);
                        doc.text(pointLines, margin + 3, yPosition);
                        yPosition += pointLines.length * 4;
                    });
                    yPosition += 2;
                }

                // Conclusión
                if (parsedSummary.conclusion) {
                    yPosition = checkPageSpace(yPosition, 10);
                    doc.setFont(undefined, 'bold');
                    doc.text('Conclusión:', margin, yPosition);
                    yPosition += 4;
                    doc.setFont(undefined, 'normal');

                    const conclusionLines = doc.splitTextToSize(parsedSummary.conclusion, maxWidth);
                    printLines(conclusionLines);
                }
            } else {
                // Plain text summary
                const summaryLines = doc.splitTextToSize(interviewData.aiSummary, maxWidth);
                printLines(summaryLines);
            }

            yPosition += 8;
        }

        // ==================== TRANSCRIPCIÓN ====================
        if (interviewData.transcription) {
            yPosition = checkPageSpace(yPosition, 20);
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text('Transcripción de la Entrevista', margin, yPosition);
            yPosition += 5;

            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(71, 85, 105);

            const transcriptionLines = doc.splitTextToSize(interviewData.transcription, maxWidth);
            printLines(transcriptionLines);
            yPosition += 8;
        }

        // ==================== NOTAS ====================
        if (interviewData.notes || interviewData.description) {
            yPosition = checkPageSpace(yPosition, 20);
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text('Notas Adicionales', margin, yPosition);
            yPosition += 5;

            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(71, 85, 105);

            const notesText = interviewData.notes || interviewData.description;
            const notesLines = doc.splitTextToSize(notesText, maxWidth);
            printLines(notesLines);
        }

        // Add footers to all pages
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            addFooter(i, totalPages);
        }

        // Generate filename
        const studentNameClean = (interviewData.studentName || 'entrevista').replace(/[^a-z0-9]/gi, '_');
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `Entrevista_${studentNameClean}_${dateStr}.pdf`;

        doc.save(fileName);

        return true;

    } catch (error) {
        logger.error('Error al exportar entrevista a PDF:', error);
        throw error;
    }
};
