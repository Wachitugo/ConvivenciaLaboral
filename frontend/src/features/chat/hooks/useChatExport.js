import { schoolsService } from '../../../services/api';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('useChatExport');

export default function useChatExport() {
  const initCap = (str) => {
    // Convierte a formato Sentence case: primera letra mayúscula, resto minúscula
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Función para convertir imagen a base64
  const getImageAsBase64 = (url) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Usar el proxy del backend para obtener la imagen
        const blob = await schoolsService.getProxyImage(url);

        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = (e) => {
          reject(e);
        };
        reader.readAsDataURL(blob);

      } catch (error) {
        // Fallback: intentar carga directa si el proxy falla
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

  const exportToPDF = async (chatTitle, messages, relatedCase = null) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = 15;

      // Obtener información del usuario y colegio
      const usuarioData = JSON.parse(localStorage.getItem('usuario') || '{}');
      const usuarioNombre = usuarioData.nombre || 'Usuario';

      const colegiosData = localStorage.getItem('colegios');
      let colegioNombre = 'Institución Educativa';
      let logoUrl = null;

      if (colegiosData) {
        try {
          const colegios = JSON.parse(colegiosData);
          if (colegios && colegios.length > 0) {
            colegioNombre = colegios[0].nombre || colegioNombre;
            logoUrl = colegios[0].logo_url;
          }
        } catch (e) {
          logger.error('Error parsing colegio data:', e);
        }
      }

      // Función helper para agregar encabezado (solo primera página)
      const addHeader = async () => {
        let yPos = 15;
        let logoWidth = 0;

        // Logo
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

        // Nombre del colegio
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(colegioNombre, margin + logoWidth, yPos + 5);

        // Título del reporte
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text('Reporte de Conversación - Convivencia Escolar', margin + logoWidth, yPos + 10);

        // Fecha y Hora
        const fecha = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
        const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

        doc.setFontSize(8);
        doc.text(`${fecha} - ${hora}`, pageWidth - margin, yPos + 5, { align: 'right' });

        // Línea separadora
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.setLineWidth(0.5);
        doc.line(margin, yPos + 20, pageWidth - margin, yPos + 20);

        return yPos + 30;
      };

      // Helper para verificar espacio
      const checkPageSpace = (yPos, neededSpace) => {
        if (yPos + neededSpace > pageHeight - 20) {
          doc.addPage();
          return margin + 10;
        }
        return yPos;
      };

      // Footer (todas las páginas)
      const addFooter = (pageNum, totalPages) => {
        const footerY = pageHeight - 10;
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.setFont(undefined, 'italic');
        doc.text(`${colegioNombre} - Documento Confidencial`, margin, footerY);
        doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
      };

      // Agregar encabezado inicial
      yPosition = await addHeader();

      // Título del documento con initcap
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42); // Slate 900
      const formattedTitle = initCap(chatTitle);
      const titleLines = doc.splitTextToSize(formattedTitle, maxWidth);
      doc.text(titleLines, margin, yPosition);
      yPosition += (titleLines.length * 7) + 8;

      // Información del caso relacionado
      if (relatedCase) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(51, 65, 85); // Slate 700
        doc.text('Caso Relacionado', margin, yPosition);
        yPosition += 5;

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Título: ${relatedCase.title}`, margin, yPosition);
        yPosition += 4;
        if (relatedCase.caseType) {
          doc.text(`Tipo: ${relatedCase.caseType}`, margin, yPosition);
          yPosition += 4;
        }
        yPosition += 4;
      }

      // Línea separadora
      doc.setDrawColor(241, 245, 249); // Slate 100
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Mensajes
      messages.forEach((message, index) => {
        yPosition = checkPageSpace(yPosition, 20);

        // Etiqueta del emisor con fondo
        const senderLabel = message.sender === 'user' ? usuarioNombre : 'Coni';
        const bgColor = message.sender === 'user' ? [219, 234, 254] : [243, 244, 246];
        const textColor = message.sender === 'user' ? [30, 64, 175] : [55, 65, 81];

        doc.setFillColor(...bgColor);
        doc.roundedRect(margin, yPosition - 4, maxWidth, 10, 2, 2, 'F');

        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...textColor);
        doc.text(senderLabel, margin + 3, yPosition + 2);

        // Timestamp
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(107, 114, 128);
        const timestamp = message.timestamp.toLocaleString('es-CL', {
          dateStyle: 'short',
          timeStyle: 'short'
        });
        doc.text(timestamp, pageWidth - margin - 30, yPosition + 2);

        yPosition += 12;

        // Contenido del mensaje
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(31, 41, 55);
        const lines = doc.splitTextToSize(message.text, maxWidth - 6);
        lines.forEach(line => {
          yPosition = checkPageSpace(yPosition, 5);
          doc.text(line, margin + 3, yPosition);
          yPosition += 5;
        });

        // Archivos adjuntos
        if (message.files && message.files.length > 0) {
          yPosition += 2;
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.setFont(undefined, 'italic');
          doc.text('Archivos adjuntos:', margin + 3, yPosition);
          yPosition += 5;

          message.files.forEach(file => {
            yPosition = checkPageSpace(yPosition, 5);
            doc.setTextColor(59, 130, 246);
            doc.text(`• ${file.name}`, margin + 8, yPosition);
            yPosition += 5;
          });
        }

        // Separador entre mensajes
        if (index < messages.length - 1) {
          yPosition += 3;
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 8;
        }
      });

      // Agregar footers a todas las páginas
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
      }

      // Generar nombre de archivo limitado a 50 caracteres
      const sanitizedTitle = chatTitle.replace(/[^a-z0-9 ]/gi, '_').substring(0, 50);
      const fileName = `Conversacion_${sanitizedTitle}_${Date.now()}.pdf`;
      doc.save(fileName);

      return { success: true };
    } catch (error) {
      logger.error('Error al exportar PDF:', error);
      return { success: false, error };
    }
  };

  const exportToWord = async (chatTitle, messages, relatedCase = null) => {
    try {
      const docx = await import('docx');
      const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, BorderStyle, ImageRun } = docx;

      // Obtener información del usuario y colegio
      const usuarioData = JSON.parse(localStorage.getItem('usuario') || '{}');
      const usuarioNombre = usuarioData.nombre || 'Usuario';

      const colegiosData = localStorage.getItem('colegios');
      let colegioNombre = 'Institución Educativa';
      let logoUrl = null;

      if (colegiosData) {
        try {
          const colegios = JSON.parse(colegiosData);
          if (colegios && colegios.length > 0) {
            colegioNombre = colegios[0].nombre || colegioNombre;
            logoUrl = colegios[0].logo_url;
          }
        } catch (e) {
          logger.error('Error parsing colegio data:', e);
        }
      }

      const paragraphs = [];

      // Encabezado con logo e información del colegio
      const headerChildren = [];

      // TODO: Intentar agregar logo si está disponible (requiere fetch de imagen)
      // Por ahora solo agregamos el nombre del colegio

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: colegioNombre,
              bold: true,
              size: 28,
              color: '1E293B' // Slate 800
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        })
      );

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Reporte de Conversación - Convivencia Escolar',
              size: 20,
              color: '64748B' // Slate 500
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        })
      );

      // Fecha y hora
      const fecha = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
      const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${fecha} - ${hora}`,
              size: 18,
              color: '64748B'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      );

      // Línea separadora
      paragraphs.push(
        new Paragraph({
          border: {
            bottom: {
              color: 'E2E8F0',
              space: 1,
              style: BorderStyle.SINGLE,
              size: 12
            }
          },
          spacing: { after: 300 }
        })
      );

      // Título del documento con initcap
      const formattedTitleWord = initCap(chatTitle);
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: formattedTitleWord,
              bold: true,
              size: 32,
              color: '0F172A' // Slate 900
            })
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        })
      );

      // Información del caso relacionado
      if (relatedCase) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Caso Relacionado',
                bold: true,
                size: 22,
                color: '334155' // Slate 700
              })
            ],
            spacing: { after: 100 }
          })
        );

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Título: ',
                bold: true,
                size: 20,
                color: '475569'
              }),
              new TextRun({
                text: relatedCase.title,
                size: 20,
                color: '475569'
              })
            ],
            spacing: { after: 80 }
          })
        );

        if (relatedCase.caseType) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Tipo: ',
                  bold: true,
                  size: 20,
                  color: '475569'
                }),
                new TextRun({
                  text: relatedCase.caseType,
                  size: 20,
                  color: '475569'
                })
              ],
              spacing: { after: 200 }
            })
          );
        }
      }

      // Línea separadora
      paragraphs.push(
        new Paragraph({
          border: {
            bottom: {
              color: 'F1F5F9',
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6
            }
          },
          spacing: { after: 300 }
        })
      );

      // Mensajes
      messages.forEach((message, index) => {
        const senderLabel = message.sender === 'user' ? usuarioNombre : 'Coni';
        const senderColor = message.sender === 'user' ? '1E40AF' : '374151';
        const bgColor = message.sender === 'user' ? 'DBEAFE' : 'F3F4F6';

        // Encabezado del mensaje con fondo de color
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: senderLabel,
                bold: true,
                size: 22,
                color: senderColor
              }),
              new TextRun({
                text: '  •  ',
                size: 22,
                color: '9CA3AF'
              }),
              new TextRun({
                text: message.timestamp.toLocaleString('es-CL', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                }),
                size: 18,
                color: '6B7280'
              })
            ],
            shading: {
              fill: bgColor
            },
            spacing: { before: 200, after: 150 }
          })
        );

        // Contenido del mensaje
        const messageLines = message.text.split('\n');
        messageLines.forEach(line => {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 22,
                  color: '1F2937'
                })
              ],
              spacing: { after: 120 }
            })
          );
        });

        // Archivos adjuntos
        if (message.files && message.files.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Archivos adjuntos:',
                  bold: true,
                  italics: true,
                  size: 20,
                  color: '64748B'
                })
              ],
              spacing: { before: 150, after: 100 }
            })
          );

          message.files.forEach(file => {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${file.name}`,
                    size: 20,
                    color: '3B82F6'
                  })
                ],
                spacing: { after: 80 }
              })
            );
          });
        }

        // Separador entre mensajes
        if (index < messages.length - 1) {
          paragraphs.push(
            new Paragraph({
              border: {
                bottom: {
                  color: 'E2E8F0',
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 4
                }
              },
              spacing: { before: 200, after: 200 }
            })
          );
        }
      });

      // Footer
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${colegioNombre} - Documento Confidencial`,
              italics: true,
              size: 18,
              color: '94A3B8'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 }
        })
      );

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440
              }
            }
          },
          children: paragraphs
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Generar nombre de archivo limitado a 50 caracteres
      const sanitizedTitle = chatTitle.replace(/[^a-z0-9 ]/gi, '_').substring(0, 50);
      const fileName = `Conversacion_${sanitizedTitle}_${Date.now()}.docx`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      logger.error('Error al exportar a Word:', error);
      return { success: false, error };
    }
  };

  return {
    exportToPDF,
    exportToWord
  };
}
