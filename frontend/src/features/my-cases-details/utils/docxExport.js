import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip, ImageRun, Table, TableCell, TableRow, WidthType, BorderStyle, Packer, VerticalAlign, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType, TextWrappingSide } from 'docx';
import { saveAs } from 'file-saver';
import { STATUS_CONFIGS, DEFAULT_CASE_STATUS } from '../constants/caseStatus';
import { getImageAsBase64, getCombinedChronology, generateProtocolNarrative } from './exportHelpers';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('docxExport');

export const exportToDOCX = async (caseData, schoolData, documents = []) => {
    try {
        // Obtener información del usuario y colegio
        const usuarioData = JSON.parse(localStorage.getItem('usuario') || '{}');
        const colegioNombre = schoolData?.nombre || usuarioData.colegios_info?.[0]?.nombre || 'Institución Educativa';
        const logoUrl = schoolData?.logo_url || usuarioData.colegios_info?.[0]?.logo_url;

        // Preparar fecha y hora
        const fecha = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
        const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

        // Preparar datos del caso
        const statusConfig = STATUS_CONFIGS[caseData.status] || STATUS_CONFIGS[DEFAULT_CASE_STATUS];
        const statusLabel = statusConfig?.label || caseData.status || 'No especificado';
        const fechaCreacionRaw = caseData.created_at || caseData.creationDate || caseData.createdAt;
        const fechaCreacion = fechaCreacionRaw ? new Date(fechaCreacionRaw).toLocaleDateString('es-CL') : 'No especificada';

        // Protocolo robusto
        const protocolText = caseData.protocol || caseData.protocolo || caseData.assignedProtocol || 'No especificado';

        // 1. Preparar logo si existe
        let logoImageRun = null;
        if (logoUrl) {
            try {
                const logoDataUrl = await getImageAsBase64(logoUrl);
                logger.info('🖼️ DOCX: Logo cargado, Data URL length:', logoDataUrl?.length);

                if (logoDataUrl) {
                    // Convertir Data URL a Buffer para docx
                    const base64Data = logoDataUrl.split(',')[1];

                    if (base64Data) {
                        // Convertir base64 a Uint8Array
                        const binaryString = atob(base64Data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }

                        logoImageRun = new ImageRun({
                            data: bytes,
                            transformation: {
                                width: 60,
                                height: 60,
                            },
                            floating: {
                                horizontalPosition: {
                                    relative: HorizontalPositionRelativeFrom.MARGIN,
                                    align: AlignmentType.RIGHT,
                                },
                                verticalPosition: {
                                    relative: VerticalPositionRelativeFrom.MARGIN,
                                    offset: 0, // Top of margin
                                },
                                wrap: {
                                    type: TextWrappingType.SQUARE,
                                    side: TextWrappingSide.LEFT,
                                }
                            }
                        });
                        logger.info('✅ DOCX: Logo ImageRun creado correctamente con floating');
                    }
                }
            } catch (error) {
                logger.error('❌ DOCX: Error al cargar el logo:', error);
            }
        }

        // 2. Construir Header (replicando estructura del PDF)
        const headerContent = [];

        // Primera línea: Nombre del colegio a la izquierda, logo a la derecha
        const firstLineChildren = [];

        firstLineChildren.push(new TextRun({
            text: colegioNombre,
            bold: true,
            size: 20,
            color: "1E293B"
        }));

        if (logoImageRun) {
            // El logo flotante se ancla a este párrafo pero se posiciona absolutamente por el floating
            firstLineChildren.push(logoImageRun);
        }

        headerContent.push(new Paragraph({
            children: firstLineChildren,
            spacing: {
                after: 100,
                line: 280,
                lineRule: "atLeast"
            },
            alignment: AlignmentType.LEFT
        }));

        // Segunda línea: Subtítulo
        headerContent.push(new Paragraph({
            children: [
                new TextRun({
                    text: 'Reporte de Caso de Convivencia Escolar',
                    size: 16,
                    color: "64748B"
                })
            ],
            spacing: { after: 100 }
        }));

        // Tercera línea: Fecha y hora a la izquierda
        headerContent.push(new Paragraph({
            children: [
                new TextRun({
                    text: `${fecha} - ${hora}`,
                    size: 16,
                    color: "64748B"
                })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 200 }
        }));

        // Línea separadora
        headerContent.push(new Paragraph({
            border: {
                bottom: {
                    color: "E2E8F0",
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6
                }
            },
            spacing: { after: 400 }
        }));

        // Título del caso
        headerContent.push(
            new Paragraph({
                text: caseData.title || 'Sin título',
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 200 }
            })
        );

        // Información General
        headerContent.push(
            new Paragraph({
                text: 'Información General',
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 200 }
            })
        );

        // Primera fila: Tipo y Protocolo (simulando 2 columnas con espaciado)
        headerContent.push(
            new Paragraph({
                children: [
                    new TextRun({ text: 'Tipo: ', bold: true, size: 16, color: "475569" }),
                    new TextRun({ text: caseData.caseType || 'No especificado', size: 16, color: "475569" })
                ],
                spacing: { after: 80 }
            })
        );

        headerContent.push(
            new Paragraph({
                children: [
                    new TextRun({ text: 'Protocolo: ', bold: true, size: 16, color: "475569" }),
                    new TextRun({ text: protocolText, size: 16, color: "475569" })
                ],
                spacing: { after: 80 }
            })
        );

        // Segunda fila: Estado y Fecha de creación
        headerContent.push(
            new Paragraph({
                children: [
                    new TextRun({ text: 'Estado: ', bold: true, size: 16, color: "475569" }),
                    new TextRun({ text: statusLabel, size: 16, color: "475569" })
                ],
                spacing: { after: 80 }
            })
        );

        headerContent.push(
            new Paragraph({
                children: [
                    new TextRun({ text: 'Fecha de creación: ', bold: true, size: 16, color: "475569" }),
                    new TextRun({ text: fechaCreacion, size: 16, color: "475569" })
                ],
                spacing: { after: 200 }
            })
        );

        // Línea separadora después de información general
        headerContent.push(new Paragraph({
            border: {
                bottom: {
                    color: "F1F5F9",
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6
                }
            },
            spacing: { after: 300 }
        }));

        // Descripción
        headerContent.push(
            new Paragraph({
                text: 'Descripción',
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: caseData.description?.trim() || 'Sin descripción registrada.',
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 400 }
            })
        );

        // Personas Involucradas
        const involvedCount = caseData.involved?.length || 0;
        headerContent.push(
            new Paragraph({
                text: `Personas Involucradas (${involvedCount})`,
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
            })
        );

        if (caseData.involved && caseData.involved.length > 0) {
            caseData.involved.forEach((person, index) => {
                const personText = `${index + 1}. ${person.name} ${person.grade ? `(${person.grade})` : ''} ${person.rut ? `- RUT: ${person.rut}` : ''}`;
                headerContent.push(
                    new Paragraph({
                        text: personText,
                        spacing: { after: 80 }
                    })
                );
            });
        } else {
            headerContent.push(
                new Paragraph({
                    text: 'No hay personas registradas.',
                    italics: true,
                    color: "94A3B8",
                    spacing: { after: 80 }
                })
            );
        }

        headerContent.push(new Paragraph({ spacing: { after: 400 } }));

        // Protocolo y Seguimiento (Narativa)
        headerContent.push(
            new Paragraph({
                text: 'Protocolo y Seguimiento',
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 100 }
            })
        );

        const narrativeText = generateProtocolNarrative(caseData, documents);
        headerContent.push(
            new Paragraph({
                text: narrativeText,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 400 }
            })
        );

        // ==================== CRONOLOGÍA (NEW) ====================
        const chronology = getCombinedChronology(caseData, documents);
        if (chronology.length > 0) {
            headerContent.push(
                new Paragraph({
                    text: 'Cronología del Caso',
                    heading: HeadingLevel.HEADING_2,
                    spacing: { after: 100 }
                })
            );

            chronology.forEach((event) => {
                const dateStr = event.date.toLocaleDateString('es-CL');
                const timeStr = event.date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

                headerContent.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${dateStr} ${timeStr} - `,
                                bold: true,
                                size: 14,
                                color: "64748B"
                            }),
                            new TextRun({
                                text: event.title,
                                bold: true,
                                size: 14,
                                color: "334155"
                            })
                        ],
                        spacing: { after: 40 }
                    })
                );

                headerContent.push(
                    new Paragraph({
                        text: event.description,
                        size: 14,
                        color: "64748B",
                        spacing: { after: 200 }
                    })
                );
            });
        }

        // Footer
        headerContent.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `${colegioNombre} - Documento Confidencial`,
                        size: 14,
                        color: "94A3B8",
                        italics: true
                    })
                ],
                alignment: AlignmentType.LEFT,
                spacing: { before: 400 }
            })
        );

        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: {
                            font: "Arial",
                        },
                    },
                    heading1: {
                        run: {
                            font: "Arial",
                            size: 28,
                            bold: true,
                            color: "0F172A",
                        },
                    },
                    heading2: {
                        run: {
                            font: "Arial",
                            size: 24,
                            bold: true,
                            color: "334155",
                        },
                    },
                },
            },
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(0.75),
                            right: convertInchesToTwip(0.75),
                            bottom: convertInchesToTwip(0.75),
                            left: convertInchesToTwip(0.75)
                        }
                    }
                },
                children: headerContent
            }]
        });

        // Generar y descargar el archivo
        const blob = await Packer.toBlob(doc);
        const fileName = `Caso_${caseData.title?.replace(/[^a-z0-9]/gi, '_') || 'sin-titulo'}_${new Date().toISOString().split('T')[0]}.docx`;
        saveAs(blob, fileName);

        return true;

    } catch (error) {
        logger.error('Error al exportar a DOCX:', error);
        alert('Error al exportar el caso a DOCX. Asegúrate de que las dependencias estén instaladas.');
        throw error;
    }
};
