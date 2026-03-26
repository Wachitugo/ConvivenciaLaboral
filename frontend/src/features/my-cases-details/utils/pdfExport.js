import { jsPDF } from 'jspdf';
import { getImageAsBase64, getCombinedChronology } from './exportHelpers';
import { interviewsService, studentsService, casesService } from '../../../services/api';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('pdfExport');

// ── Colores (RGB) ────────────────────────────────────────────────
const C_HEADER_BG   = [30, 58, 95];    // azul oscuro cabecera tabla
const C_HEADER_TXT  = [255, 255, 255]; // blanco
const C_LABEL_BG    = [239, 246, 255]; // azul muy claro etiqueta
const C_LABEL_TXT   = [30, 58, 95];
const C_SUBHDR_BG   = [219, 234, 254]; // azul claro sub-cabecera
const C_BODY_TXT    = [51, 65, 85];
const C_MUTED_TXT   = [148, 163, 184];
const C_BORDER      = [203, 213, 225];
const C_WHITE       = [255, 255, 255];

export const exportToPDF = async (caseData, schoolData, documents = []) => {
    try {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
        const PW = doc.internal.pageSize.getWidth();
        const PH = doc.internal.pageSize.getHeight();
        const ML = 18, MR = 18;
        const TW = PW - ML - MR; // table width
        let y = 18;

        // ── Datos base ───────────────────────────────────────────
        const usuarioData   = JSON.parse(localStorage.getItem('usuario') || '{}');
        const colegioNombre = schoolData?.nombre || usuarioData.colegios_info?.[0]?.nombre || 'Organización';
        const colegioId     = schoolData?.id || caseData.colegio_id;
        const logoUrl       = schoolData?.logo_url || usuarioData.colegios_info?.[0]?.logo_url;
        const direccion     = schoolData?.direccion || '—';
        const steps         = caseData.pasosProtocolo || caseData.protocolSteps || [];

        const fechaInforme  = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const fechaRecRaw   = caseData.created_at || caseData.createdAt || caseData.creationDate;
        const fechaRecepcion = fechaRecRaw
            ? new Date(fechaRecRaw).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : '—';

        let interviews = [];
        if (colegioId) {
            try {
                const all = await interviewsService.list(colegioId);
                interviews = (all || []).filter(i => i.case_id === caseData.id);
            } catch (e) { logger.warn('No se pudieron cargar entrevistas:', e); }
        }

        // Cargar timeline completo (incluye correos y agendamientos)
        let timelineEvents = [];
        try {
            const tlResult = await casesService.getCaseTimeline(caseData.id, usuarioData.id);
            // Convertir timestamp string → Date, ordenar más antiguo primero
            timelineEvents = (tlResult.events || [])
                .map(ev => ({ ...ev, date: new Date(ev.timestamp) }))
                .filter(ev => !isNaN(ev.date.getTime()))
                .sort((a, b) => a.date - b.date);
        } catch (e) { logger.warn('No se pudo cargar timeline:', e); }

        // Enriquecer involucrados con datos de trabajadores si rut/grade están vacíos
        let workers = [];
        if (colegioId) {
            try {
                workers = await studentsService.getStudents(colegioId) || [];
            } catch (e) { logger.warn('No se pudieron cargar trabajadores:', e); }
        }
        const findWorker = (p) => {
            if (!workers.length) return null;
            // Prioridad 1: match por ID
            if (p.studentId) {
                const byId = workers.find(w => w.id === p.studentId);
                if (byId) return byId;
            }
            // Prioridad 2: match por nombre completo
            if (p.name) {
                const nameLower = p.name.toLowerCase().trim();
                return workers.find(w => {
                    const full = `${w.nombres || ''} ${w.apellidos || ''}`.toLowerCase().trim();
                    return full === nameLower;
                }) || null;
            }
            return null;
        };
        const enrichPerson = (p) => {
            const w = findWorker(p);
            return {
                ...p,
                rut:   p.rut   || w?.rut   || null,
                grade: p.grade || w?.curso  || null,
            };
        };

        const cronologia = getCombinedChronology(caseData, documents);

        // ── Helpers ──────────────────────────────────────────────

        const checkPage = (need = 10) => {
            if (y + need > PH - 14) { doc.addPage(); y = 18; }
        };

        // Dibuja una celda rectangular con texto
        const drawCell = (x, cellY, w, h, text, {
            bgColor = C_WHITE, txtColor = C_BODY_TXT,
            bold = false, fontSize = 8.5, align = 'left',
            border = true, multiline = false, maxLines = 3
        } = {}) => {
            doc.setFillColor(...bgColor);
            doc.rect(x, cellY, w, h, 'F');
            if (border) {
                doc.setDrawColor(...C_BORDER);
                doc.setLineWidth(0.25);
                doc.rect(x, cellY, w, h, 'S');
            }
            doc.setFontSize(fontSize);
            doc.setFont(undefined, bold ? 'bold' : 'normal');
            doc.setTextColor(...txtColor);
            const pad = 2;
            const textX = align === 'center' ? x + w / 2 : x + pad;
            const textY = cellY + h / 2 + fontSize * 0.18;

            if (multiline) {
                const lines = doc.splitTextToSize(String(text ?? '—'), w - pad * 2).slice(0, maxLines);
                const lineH = fontSize * 0.45;
                const totalH = lines.length * lineH;
                let lineY = cellY + (h - totalH) / 2 + lineH * 0.8;
                lines.forEach(line => {
                    doc.text(line, align === 'center' ? textX : x + pad, lineY, { align });
                    lineY += lineH;
                });
            } else {
                const short = doc.splitTextToSize(String(text ?? '—'), w - pad * 2)[0];
                doc.text(short, align === 'center' ? textX : x + pad, textY, { align });
            }
        };

        // Calcula la altura necesaria para texto multilínea en una celda
        const cellHeight = (text, w, fontSize = 8.5, minH = 8) => {
            const lines = doc.setFontSize(fontSize) || doc.splitTextToSize(String(text ?? '—'), w - 4);
            const linesArr = doc.splitTextToSize(String(text ?? '—'), w - 4);
            const h = Math.max(minH, linesArr.length * fontSize * 0.5 + 4);
            return h;
        };

        // Fila etiqueta | valor (2 columnas)
        const drawLabelRow = (label, value, lw = TW * 0.32) => {
            const vw = TW - lw;
            const h = cellHeight(value, vw);
            checkPage(h + 1);
            drawCell(ML,      y, lw, h, label, { bgColor: C_LABEL_BG, txtColor: C_LABEL_TXT, bold: true });
            drawCell(ML + lw, y, vw, h, value, { bgColor: C_WHITE, txtColor: C_BODY_TXT, multiline: true, maxLines: 5 });
            y += h;
        };

        // Fila de cabecera (N columnas)
        const drawHeaderRow = (cols, rowH = 8) => {
            checkPage(rowH + 1);
            let xOff = ML;
            cols.forEach(({ text, w }) => {
                drawCell(xOff, y, w, rowH, text, { bgColor: C_HEADER_BG, txtColor: C_HEADER_TXT, bold: true, align: 'center', fontSize: 8 });
                xOff += w;
            });
            y += rowH;
        };

        // Fila sub-cabecera (span completo)
        const drawSubHeader = (text, rowH = 8) => {
            checkPage(rowH + 1);
            drawCell(ML, y, TW, rowH, text, { bgColor: C_SUBHDR_BG, txtColor: C_LABEL_TXT, bold: true });
            y += rowH;
        };

        // Título de sección
        const drawSection = (num, title) => {
            checkPage(14);
            y += 5;
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...C_HEADER_BG);
            const sectionLines = doc.splitTextToSize(`${num}.- ${title.toUpperCase()}`, TW);
            sectionLines.forEach(line => {
                doc.text(line, ML, y);
                y += 5;
            });
            y -= 3; // ajuste para mantener espaciado con la línea divisoria
            doc.setDrawColor(...C_BORDER);
            doc.setLineWidth(0.5);
            doc.line(ML, y, PW - MR, y);
            y += 5;
        };

        // Texto multilínea libre (fuera de tabla)
        const drawText = (text, { indent = 0, color = C_BODY_TXT, italic = false, fontSize = 8.5 } = {}) => {
            doc.setFontSize(fontSize);
            doc.setFont(undefined, italic ? 'italic' : 'normal');
            doc.setTextColor(...color);
            const lines = doc.splitTextToSize(text || '—', TW - indent);
            lines.forEach(line => {
                checkPage(5);
                doc.text(line, ML + indent, y);
                y += fontSize * 0.48;
            });
        };

        // Logo
        let logoBase64 = null;
        if (logoUrl) {
            try { logoBase64 = await getImageAsBase64(logoUrl); } catch (e) { logger.warn('Logo error', e); }
        }

        // ── ENCABEZADO ───────────────────────────────────────────

        if (logoBase64) doc.addImage(logoBase64, 'PNG', PW - MR - 18, y, 18, 18);

        doc.setFontSize(15);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...C_HEADER_BG);
        doc.text('INFORME DE INVESTIGACIÓN', PW / 2, y + 7, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...C_BODY_TXT);
        doc.text(colegioNombre, PW / 2, y + 13, { align: 'center' });
        y += 22;

        // ── TABLA METADATOS ──────────────────────────────────────

        const cw4 = TW / 4;
        drawHeaderRow([
            { text: 'Fecha informe',                w: cw4 },
            { text: 'Fecha recep. denuncia', w: cw4 },
            { text: 'Comuna',                        w: cw4 },
            { text: 'Materia',                       w: cw4 },
        ]);
        checkPage(8);
        drawCell(ML,          y, cw4, 8, fechaInforme);
        drawCell(ML + cw4,    y, cw4, 8, fechaRecepcion);
        drawCell(ML + cw4*2,  y, cw4, 8, '');
        drawCell(ML + cw4*3,  y, cw4, 8, '');
        y += 8;

        const protocolText = caseData.protocol || '—';
        const row2H = cellHeight(protocolText, cw4, 8.5, 8);
        checkPage(row2H + 1);
        drawCell(ML,          y, cw4, row2H, 'Caso N°',  { bgColor: C_LABEL_BG, txtColor: C_LABEL_TXT, bold: true });
        drawCell(ML + cw4,    y, cw4, row2H, caseData.counterCase || caseData.counter_case || '—');
        drawCell(ML + cw4*2,  y, cw4, row2H, 'Protocolo', { bgColor: C_LABEL_BG, txtColor: C_LABEL_TXT, bold: true });
        drawCell(ML + cw4*3,  y, cw4, row2H, protocolText, { multiline: true, maxLines: 5 });
        y += row2H;
        y += 4;

        // ── 1. INFORMACIÓN DE LA EMPRESA ────────────────────────

        drawSection('1', 'Información de la Empresa');
        drawLabelRow('Razón Social', colegioNombre);
        drawLabelRow('RUT', '—');
        drawLabelRow('Dirección', direccion);
        drawLabelRow('Correo electrónico', '—');
        y += 4;

        // ── 2. INDIVIDUALIZACIÓN DE LAS PARTES ──────────────────

        drawSection('2', 'Individualización de las Partes');

        const involved     = (caseData.involved || []).map(enrichPerson);
        const denunciantes = involved.filter(p => ['afectado','denunciante'].includes((p.role||'').toLowerCase()));
        const denunciados  = involved.filter(p => ['agresor','denunciado'].includes((p.role||'').toLowerCase()));
        const testigos     = involved.filter(p => (p.role||'').toLowerCase() === 'testigo');
        const otros        = involved.filter(p =>
            !['afectado','agresor','testigo','denunciante','denunciado'].includes((p.role||'').toLowerCase())
        );

        const drawPersona = (headerLabel, personas) => {
            drawSubHeader(headerLabel);
            if (personas.length === 0) {
                drawLabelRow('Nombre', '—');
            } else {
                personas.forEach((p, i) => {
                    if (i > 0) { checkPage(4); y += 2; doc.setDrawColor(...C_BORDER); doc.line(ML, y, PW - MR, y); y += 2; }
                    drawLabelRow('Nombre', p.name || '—');
                    drawLabelRow('RUT', p.rut || '—');
                    drawLabelRow('Cargo', p.grade || '—');
                });
            }
            y += 3;
        };

        drawPersona('DENUNCIANTE', denunciantes);
        drawPersona('DENUNCIADO', denunciados);
        if (testigos.length > 0) drawPersona('TESTIGO', testigos);
        if (otros.length > 0)    drawPersona('OTRO INVOLUCRADO', otros);
        y += 2;

        // ── 3. DATOS DEL INVESTIGADOR ────────────────────────────

        drawSection('3', 'Datos del Investigador');
        drawLabelRow('Nombre', caseData.owner_name || usuarioData.nombre || '—');
        drawLabelRow('RUT', '—');
        drawLabelRow('Cargo / Rol', usuarioData.rol || '—');
        drawLabelRow('Correo electrónico', '—');
        drawLabelRow('Investigador/a', 'Interno');
        drawLabelRow('Imparcialidad', 'No se recibieron antecedentes sobre imparcialidad relativa al investigador/a.');
        y += 4;

        // ── 4. DENUNCIA ──────────────────────────────────────────

        drawSection('4', 'Denuncia');
        const descText  = caseData.description || 'Sin descripción registrada.';
        const descLines = doc.splitTextToSize(descText, TW - 4);
        const descH     = Math.max(12, descLines.length * 4.5 + 4);
        checkPage(descH + 2);
        drawCell(ML, y, TW, descH, descText, { multiline: true, maxLines: 50, bgColor: C_WHITE });
        y += descH + 4;

        // ── 5. MEDIDAS DE RESGUARDO ──────────────────────────────

        drawSection('5', 'Medidas de Resguardo');
        const stepsMedRes = steps.filter(s => {
            const t = (s.titulo || s.title || '').toLowerCase();
            return t.includes('resguardo') || t.includes('protección') || t.includes('proteccion');
        });
        drawHeaderRow([{ text: 'FECHA', w: TW * 0.25 }, { text: 'MEDIDA', w: TW * 0.75 }]);
        if (stepsMedRes.length > 0) {
            stepsMedRes.forEach(s => {
                const f = s.fecha ? new Date(s.fecha).toLocaleDateString('es-CL') : '—';
                const val = s.notas || s.notes || s.titulo || '—';
                const h = cellHeight(val, TW * 0.75);
                checkPage(h + 1);
                drawCell(ML,              y, TW * 0.25, h, f);
                drawCell(ML + TW * 0.25,  y, TW * 0.75, h, val, { multiline: true, maxLines: 5 });
                y += h;
            });
        } else {
            checkPage(8);
            drawCell(ML, y, TW, 8, 'Sin medidas de resguardo registradas.', { txtColor: C_MUTED_TXT });
            y += 8;
        }
        y += 4;

        // ── 6. NOTIFICACIONES (CRONOLOGÍA) ───────────────────────
        // Usar timeline de la API si está disponible (incluye correos/agendamientos),
        // si no, usar la cronología local como fallback.
        const cronologiaFinal = timelineEvents.length > 0 ? timelineEvents : cronologia;

        drawSection('6', 'Notificaciones');
        drawHeaderRow([{ text: 'FECHA', w: TW * 0.22 }, { text: 'NOTIFICACIÓN / EVENTO', w: TW * 0.78 }]);
        if (cronologiaFinal.length > 0) {
            cronologiaFinal.forEach(event => {
                const dateStr = event.date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const desc = event.description && event.description !== event.title
                    ? `${event.title}: ${event.description}`
                    : (event.title || '—');
                const h = cellHeight(desc, TW * 0.78);
                checkPage(h + 1);
                drawCell(ML,              y, TW * 0.22, h, dateStr);
                drawCell(ML + TW * 0.22,  y, TW * 0.78, h, desc, { multiline: true, maxLines: 4 });
                y += h;
            });
        } else {
            checkPage(8);
            drawCell(ML, y, TW, 8, 'Sin eventos registrados en la cronología.', { txtColor: C_MUTED_TXT });
            y += 8;
        }
        y += 4;

        // ── 7. ANTECEDENTES ──────────────────────────────────────

        drawSection('7', 'Antecedentes');
        const stepsComp = steps.filter(s => s.estado === 'completado' || s.status === 'completed');
        if (stepsComp.length > 0) {
            drawHeaderRow([
                { text: 'ETAPA', w: TW * 0.45 },
                { text: 'FECHA', w: TW * 0.2 },
                { text: 'NOTAS', w: TW * 0.35 }
            ]);
            stepsComp.forEach(s => {
                const f = s.fecha
                    ? new Date(s.fecha).toLocaleDateString('es-CL')
                    : s.completed_at ? new Date(s.completed_at).toLocaleDateString('es-CL') : '—';
                const notas = s.notas || s.notes || '—';
                const titulo = s.titulo || s.title || '—';
                const h = Math.max(cellHeight(titulo, TW*0.45), cellHeight(notas, TW*0.35));
                checkPage(h + 1);
                drawCell(ML,               y, TW*0.45, h, titulo, { multiline: true, maxLines: 4 });
                drawCell(ML + TW*0.45,     y, TW*0.2,  h, f);
                drawCell(ML + TW*0.65,     y, TW*0.35, h, notas, { multiline: true, maxLines: 4 });
                y += h;
            });
        } else {
            checkPage(8);
            drawCell(ML, y, TW, 8, 'Sin antecedentes de etapas completadas.', { txtColor: C_MUTED_TXT });
            y += 8;
        }
        y += 4;

        // ── 8. ANÁLISIS DE LAS DECLARACIONES ────────────────────

        drawSection('8', 'Análisis de las Declaraciones');

        if (interviews.length > 0) {
            interviews.forEach((interview, i) => {
                const fechaEnt = interview.created_at
                    ? new Date(interview.created_at).toLocaleDateString('es-CL')
                    : '—';
                drawSubHeader(`Entrevista ${i + 1}: ${interview.student_name || 'Declarante'}`);
                drawLabelRow('Entrevistador/a', interview.interviewer_name || '—');
                drawLabelRow('Fecha', fechaEnt);
                drawLabelRow('Estado', interview.status || '—');

                if (interview.summary) {
                    const h = cellHeight(interview.summary, TW * 0.68, 8.5, 10);
                    checkPage(h + 9);
                    drawCell(ML,              y, TW * 0.32, h, 'Resumen', { bgColor: C_LABEL_BG, txtColor: C_LABEL_TXT, bold: true });
                    drawCell(ML + TW * 0.32,  y, TW * 0.68, h, interview.summary, { multiline: true, maxLines: 20 });
                    y += h;
                }
                if (interview.description) {
                    const h = cellHeight(interview.description, TW * 0.68, 8.5, 10);
                    checkPage(h + 9);
                    drawCell(ML,              y, TW * 0.32, h, 'Descripción', { bgColor: C_LABEL_BG, txtColor: C_LABEL_TXT, bold: true });
                    drawCell(ML + TW * 0.32,  y, TW * 0.68, h, interview.description, { multiline: true, maxLines: 20 });
                    y += h;
                }
                if (interview.notes) {
                    drawLabelRow('Notas', interview.notes);
                }
                y += 3;
            });
        } else {
            checkPage(8);
            drawCell(ML, y, TW, 8, 'No se han registrado entrevistas asociadas a este caso.', { txtColor: C_MUTED_TXT });
            y += 8;
        }
        y += 4;

        // ── 12. MEDIDAS CORRECTIVAS ──────────────────────────────

        drawSection('12', 'Medidas Correctivas');
        const stepsMedidas = steps.filter(s => {
            const t = (s.titulo || s.title || '').toLowerCase();
            return t.includes('medida') || t.includes('correc') || t.includes('sancion') || t.includes('sanción');
        });
        drawHeaderRow([{ text: 'FECHA', w: TW * 0.25 }, { text: 'MEDIDA CORRECTIVA', w: TW * 0.75 }]);
        if (stepsMedidas.length > 0) {
            stepsMedidas.forEach(s => {
                const f = s.fecha ? new Date(s.fecha).toLocaleDateString('es-CL') : '—';
                const val = s.notas || s.notes || s.titulo || '—';
                const h = cellHeight(val, TW * 0.75);
                checkPage(h + 1);
                drawCell(ML,             y, TW * 0.25, h, f);
                drawCell(ML + TW * 0.25, y, TW * 0.75, h, val, { multiline: true, maxLines: 5 });
                y += h;
            });
        } else {
            checkPage(8);
            drawCell(ML, y, TW, 8, 'Sin medidas correctivas registradas.', { txtColor: C_MUTED_TXT });
            y += 8;
        }

        // ── FOOTER en todas las páginas ──────────────────────────

        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setDrawColor(...C_BORDER);
            doc.setLineWidth(0.3);
            doc.line(ML, PH - 12, PW - MR, PH - 12);
            doc.setFontSize(7);
            doc.setFont(undefined, 'italic');
            doc.setTextColor(...C_MUTED_TXT);
            doc.text(`${colegioNombre} — Documento Confidencial`, ML, PH - 8);
            doc.text(`Página ${i} de ${totalPages}`, PW - MR, PH - 8, { align: 'right' });
        }

        const caseNum = (caseData.counterCase || caseData.counter_case || 'caso').replace(/[^a-z0-9-]/gi, '_');
        doc.save(`Informe_${caseNum}_${new Date().toISOString().split('T')[0]}.pdf`);
        return true;

    } catch (error) {
        logger.error('Error al exportar a PDF:', error);
        alert('Error al exportar el informe a PDF.');
        throw error;
    }
};
