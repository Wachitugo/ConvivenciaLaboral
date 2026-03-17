import {
    Document, Paragraph, TextRun, AlignmentType,
    convertInchesToTwip, ImageRun, BorderStyle, Packer,
    Table, TableCell, TableRow, WidthType, VerticalAlign,
    HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
    TextWrappingType, TextWrappingSide, ShadingType, TableLayoutType
} from 'docx';
import { saveAs } from 'file-saver';
import { getImageAsBase64, getCombinedChronology } from './exportHelpers';
import { interviewsService, studentsService } from '../../../services/api';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('docxExport');

// ── Colores ──────────────────────────────────────────────────────
const COLOR_HEADER_BG  = '1E3A5F'; // azul oscuro para cabeceras de tabla
const COLOR_HEADER_TXT = 'FFFFFF';
const COLOR_LABEL_BG   = 'D6E4F7'; // azul claro para celdas de etiqueta (igual al PDF)
const COLOR_LABEL_TXT  = '1E3A5F';
const COLOR_BODY_TXT   = '334155';
const COLOR_SUBHDR_BG  = 'BFDBFE'; // azul medio para sub-cabeceras (DENUNCIANTE / DENUNCIADO)

// ── Helpers de celda ─────────────────────────────────────────────

// Ancho total útil de página carta con márgenes de 1" cada lado: 9360 twips
const PAGE_WIDTH_DXA = 9360;
const pct = (p) => Math.round(p / 100 * PAGE_WIDTH_DXA);

// Presets de anchos de columna (deben sumar PAGE_WIDTH_DXA)
const COL_4_EQ   = [pct(25), pct(25), pct(25), pct(25)]; // 4 columnas iguales
const COL_2_STD  = [pct(35), pct(65)];                    // etiqueta / valor
const COL_2_WIDE = [pct(25), pct(75)];                    // fecha / contenido
const COL_3_ANT  = [pct(40), pct(20), pct(40)];           // etapa / fecha / notas

const cell = (children, { width = 50, fill = 'FFFFFF', bold = false, color = COLOR_BODY_TXT, colspan = 1 } = {}) =>
    new TableCell({
        children: Array.isArray(children) ? children : [
            new Paragraph({
                children: [new TextRun({ text: String(children ?? '—'), bold, size: 18, color })],
                spacing: { before: 60, after: 60 }
            })
        ],
        width: { size: pct(width), type: WidthType.DXA },
        shading: { fill, type: ShadingType.SOLID, color: fill },
        verticalAlign: VerticalAlign.CENTER,
        columnSpan: colspan
    });

const headerCell = (text, { width = 50, colspan = 1 } = {}) =>
    cell(text, { width, fill: COLOR_HEADER_BG, bold: true, color: COLOR_HEADER_TXT, colspan });

const labelCell = (text, width = 35) =>
    cell(text, { width, fill: COLOR_LABEL_BG, bold: true, color: COLOR_LABEL_TXT });

const valueCell = (text, width = 65) =>
    cell(text, { width, color: COLOR_BODY_TXT });

const subHeaderCell = (text) =>
    cell(text, { width: 100, fill: COLOR_SUBHDR_BG, bold: true, color: COLOR_LABEL_TXT, colspan: 2 });

const fullTable = (rows, colWidths = COL_2_STD) => new Table({
    width: { size: PAGE_WIDTH_DXA, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: colWidths,
    borders: {
        top:    { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        left:   { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        right:  { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        insideH:{ style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
        insideV:{ style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    },
    rows
});

// Fila de 2 celdas: etiqueta | valor
const labelRow = (label, value) =>
    new TableRow({ children: [ labelCell(label), valueCell(value) ] });

// Cabecera de sección (párrafo, no tabla)
const sectionParagraph = (num, title) => new Paragraph({
    children: [new TextRun({
        text: `${num}.- ${title.toUpperCase()}`,
        bold: true, size: 22, color: COLOR_HEADER_BG, allCaps: true
    })],
    spacing: { before: 400, after: 160 },
    border: { bottom: { color: 'CBD5E1', style: BorderStyle.SINGLE, size: 6, space: 4 } }
});

const spacer = () => new Paragraph({ spacing: { after: 200 } });

const bodyText = (text) => new Paragraph({
    children: [new TextRun({ text: text || 'Sin información registrada.', size: 18, color: COLOR_BODY_TXT })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 60 }
});

// ── Exportador principal ──────────────────────────────────────────

export const exportToDOCX = async (caseData, schoolData, documents = []) => {
    try {
        const usuarioData = JSON.parse(localStorage.getItem('usuario') || '{}');
        const colegioNombre = schoolData?.nombre || usuarioData.colegios_info?.[0]?.nombre || 'Organización';
        const colegioId     = schoolData?.id || caseData.colegio_id;
        const logoUrl       = schoolData?.logo_url || usuarioData.colegios_info?.[0]?.logo_url;
        const direccion     = schoolData?.direccion || '—';
        const steps         = caseData.pasosProtocolo || caseData.protocolSteps || [];

        // Fechas
        const fechaInforme  = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const fechaRecRaw   = caseData.created_at || caseData.createdAt || caseData.creationDate;
        const fechaRecepcion = fechaRecRaw
            ? new Date(fechaRecRaw).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : '—';

        // Entrevistas del caso
        let interviews = [];
        if (colegioId) {
            try {
                const all = await interviewsService.list(colegioId);
                interviews = (all || []).filter(i => i.case_id === caseData.id);
            } catch (e) { logger.warn('No se pudieron cargar entrevistas:', e); }
        }

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

        // Cronología completa (para Notificaciones)
        const cronologia = getCombinedChronology(caseData, documents);

        // Logo flotante
        let logoImageRun = null;
        if (logoUrl) {
            try {
                const logoDataUrl = await getImageAsBase64(logoUrl);
                if (logoDataUrl) {
                    const b64 = logoDataUrl.split(',')[1];
                    if (b64) {
                        const bin = atob(b64);
                        const bytes = new Uint8Array(bin.length);
                        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                        logoImageRun = new ImageRun({
                            data: bytes,
                            transformation: { width: 70, height: 70 },
                            floating: {
                                horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, align: AlignmentType.RIGHT },
                                verticalPosition: { relative: VerticalPositionRelativeFrom.MARGIN, offset: 0 },
                                wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.LEFT }
                            }
                        });
                    }
                }
            } catch (e) { logger.warn('No se pudo cargar el logo:', e); }
        }

        const content = [];

        // ── TÍTULO PRINCIPAL ─────────────────────────────────────────

        const titleChildren = [
            new TextRun({ text: 'INFORME DE INVESTIGACIÓN', bold: true, size: 32, color: COLOR_HEADER_BG, allCaps: true })
        ];
        if (logoImageRun) titleChildren.push(logoImageRun);

        content.push(new Paragraph({ children: titleChildren, alignment: AlignmentType.CENTER, spacing: { after: 80 } }));
        content.push(new Paragraph({
            children: [new TextRun({ text: colegioNombre, bold: true, size: 20, color: COLOR_BODY_TXT })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
        }));

        // ── TABLA METADATOS (Fecha informe | Fecha recepción | Comuna | Materia) ──

        content.push(fullTable([
            new TableRow({ children: [
                headerCell('Fecha informe',                { width: 25 }),
                headerCell('Fecha recepción de denuncia', { width: 25 }),
                headerCell('Comuna',                      { width: 25 }),
                headerCell('Materia',                     { width: 25 }),
            ]}),
            new TableRow({ children: [
                valueCell(fechaInforme,  25),
                valueCell(fechaRecepcion, 25),
                valueCell('', 25),
                valueCell('', 25),
            ]}),
            new TableRow({ children: [
                labelCell('Caso N°', 25),
                valueCell(caseData.counterCase || caseData.counter_case || '—', 25),
                labelCell('Protocolo', 25),
                valueCell(caseData.protocol || '—', 25),
            ]})
        ], COL_4_EQ));
        content.push(spacer());

        // ── 1. INFORMACIÓN DE LA EMPRESA ────────────────────────────

        content.push(sectionParagraph('1', 'Información de la Empresa'));
        content.push(fullTable([
            labelRow('Razón Social', colegioNombre),
            labelRow('RUT', '—'),
            labelRow('Dirección', direccion),
            labelRow('Correo electrónico', '—'),
        ]));
        content.push(spacer());

        // ── 2. INDIVIDUALIZACIÓN DE LAS PARTES ──────────────────────

        content.push(sectionParagraph('2', 'Individualización de las Partes'));

        const involved   = (caseData.involved || []).map(enrichPerson);
        const denunciantes = involved.filter(p => ['afectado','denunciante'].includes((p.role||'').toLowerCase()));
        const denunciados  = involved.filter(p => ['agresor','denunciado'].includes((p.role||'').toLowerCase()));
        const testigos     = involved.filter(p => (p.role||'').toLowerCase() === 'testigo');
        const otros        = involved.filter(p =>
            !['afectado','agresor','testigo','denunciante','denunciado'].includes((p.role||'').toLowerCase())
        );

        const personaTable = (headerLabel, personas) => {
            if (personas.length === 0) {
                return fullTable([
                    new TableRow({ children: [ subHeaderCell(headerLabel) ] }),
                    new TableRow({ children: [
                        cell('No registrado.', { width: 100, colspan: 2, color: '94A3B8' })
                    ]})
                ]);
            }
            const rows = [new TableRow({ children: [ subHeaderCell(headerLabel) ] })];
            personas.forEach((p, i) => {
                if (i > 0) {
                    rows.push(new TableRow({ children: [
                        cell('', { width: 100, colspan: 2, fill: 'E2E8F0' })
                    ]}));
                }
                rows.push(labelRow('Nombre', p.name || '—'));
                rows.push(labelRow('RUT', p.rut || '—'));
                rows.push(labelRow('Cargo', p.grade || '—'));
            });
            return fullTable(rows);
        };

        content.push(personaTable('DENUNCIANTE', denunciantes));
        content.push(spacer());
        content.push(personaTable('DENUNCIADO', denunciados));
        if (testigos.length > 0) { content.push(spacer()); content.push(personaTable('TESTIGO', testigos)); }
        if (otros.length > 0)    { content.push(spacer()); content.push(personaTable('OTRO INVOLUCRADO', otros)); }
        content.push(spacer());

        // ── 3. DATOS DEL INVESTIGADOR ────────────────────────────────

        content.push(sectionParagraph('3', 'Datos del Investigador'));
        content.push(fullTable([
            labelRow('Nombre', caseData.owner_name || usuarioData.nombre || '—'),
            labelRow('Cargo / Rol', usuarioData.rol || '—'),
            labelRow('Correo electrónico', '—'),
            labelRow('Investigador/a', 'Interno'),
            labelRow('Imparcialidad', 'No se recibieron antecedentes sobre imparcialidad relativa al investigador/a.'),
        ]));
        content.push(spacer());

        // ── 4. DENUNCIA ──────────────────────────────────────────────

        content.push(sectionParagraph('4', 'Denuncia'));
        content.push(fullTable([
            new TableRow({ children: [
                cell([
                    new Paragraph({
                        children: [new TextRun({ text: caseData.description || 'Sin descripción registrada.', size: 18, color: COLOR_BODY_TXT })],
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { before: 60, after: 60 }
                    })
                ], { width: 100, colspan: 2 })
            ]})
        ]));
        content.push(spacer());

        // ── 5. MEDIDAS DE RESGUARDO ──────────────────────────────────

        content.push(sectionParagraph('5', 'Medidas de Resguardo'));
        const stepsMedResguardo = steps.filter(s => {
            const t = (s.titulo || s.title || '').toLowerCase();
            return t.includes('resguardo') || t.includes('protección') || t.includes('proteccion');
        });
        const rowsMedRes = [
            new TableRow({ children: [ headerCell('FECHA', { width: 25 }), headerCell('MEDIDA', { width: 75 }) ] })
        ];
        if (stepsMedResguardo.length > 0) {
            stepsMedResguardo.forEach(s => {
                const f = s.fecha ? new Date(s.fecha).toLocaleDateString('es-CL') : '—';
                rowsMedRes.push(new TableRow({ children: [ valueCell(f, 25), valueCell(s.notas || s.notes || s.titulo || '—', 75) ] }));
            });
        } else {
            rowsMedRes.push(new TableRow({ children: [ cell('Sin medidas de resguardo registradas.', { width: 100, colspan: 2, color: '94A3B8' }) ] }));
        }
        content.push(fullTable(rowsMedRes, COL_2_WIDE));
        content.push(spacer());

        // ── 6. NOTIFICACIONES (CRONOLOGÍA) ───────────────────────────

        content.push(sectionParagraph('6', 'Notificaciones'));
        const rowsNotif = [
            new TableRow({ children: [ headerCell('FECHA', { width: 25 }), headerCell('NOTIFICACIÓN / EVENTO', { width: 75 }) ] })
        ];
        if (cronologia.length > 0) {
            cronologia.forEach(event => {
                const dateStr = event.date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const desc = event.description !== event.title
                    ? `${event.title}: ${event.description}`
                    : event.title;
                rowsNotif.push(new TableRow({ children: [ valueCell(dateStr, 25), valueCell(desc, 75) ] }));
            });
        } else {
            rowsNotif.push(new TableRow({ children: [
                cell('Sin eventos registrados en la cronología.', { width: 100, colspan: 2, color: '94A3B8' })
            ]}));
        }
        content.push(fullTable(rowsNotif, COL_2_WIDE));
        content.push(spacer());

        // ── 7. ANTECEDENTES ──────────────────────────────────────────

        content.push(sectionParagraph('7', 'Antecedentes'));
        const stepsCompletados = steps.filter(s => s.estado === 'completado' || s.status === 'completed');
        if (stepsCompletados.length > 0) {
            const rowsAnt = [
                new TableRow({ children: [ headerCell('ETAPA', { width: 40 }), headerCell('FECHA', { width: 20 }), headerCell('NOTAS', { width: 40 }) ] })
            ];
            stepsCompletados.forEach(s => {
                const f = s.fecha
                    ? new Date(s.fecha).toLocaleDateString('es-CL')
                    : s.completed_at ? new Date(s.completed_at).toLocaleDateString('es-CL') : '—';
                rowsAnt.push(new TableRow({ children: [
                    valueCell(s.titulo || s.title || '—', 40),
                    valueCell(f, 20),
                    valueCell(s.notas || s.notes || '—', 40)
                ]}));
            });
            content.push(fullTable(rowsAnt, COL_3_ANT));
        } else {
            content.push(fullTable([
                new TableRow({ children: [
                    cell('Sin antecedentes de etapas completadas.', { width: 100, colspan: 2, color: '94A3B8' })
                ]})
            ]));
        }
        content.push(spacer());

        // ── 8. ANÁLISIS DE LAS DECLARACIONES ────────────────────────

        content.push(sectionParagraph('8', 'Análisis de las Declaraciones'));

        if (interviews.length > 0) {
            interviews.forEach((interview, i) => {
                const fechaEnt = interview.created_at
                    ? new Date(interview.created_at).toLocaleDateString('es-CL')
                    : '—';
                const rowsEnt = [
                    new TableRow({ children: [
                        cell(`Entrevista ${i + 1}: ${interview.student_name || 'Declarante'}`,
                            { width: 100, fill: COLOR_SUBHDR_BG, bold: true, color: COLOR_LABEL_TXT, colspan: 2 })
                    ]}),
                    labelRow('Entrevistador/a', interview.interviewer_name || '—'),
                    labelRow('Fecha', fechaEnt),
                    labelRow('Estado', interview.status || '—'),
                ];
                if (interview.summary) {
                    rowsEnt.push(new TableRow({ children: [
                        labelCell('Resumen', 35),
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: interview.summary, size: 18, color: COLOR_BODY_TXT })],
                                alignment: AlignmentType.JUSTIFIED,
                                spacing: { before: 60, after: 60 }
                            })],
                            width: { size: pct(65), type: WidthType.DXA },
                            shading: { fill: 'FFFFFF', type: ShadingType.SOLID, color: 'FFFFFF' }
                        })
                    ]}));
                }
                if (interview.description) {
                    rowsEnt.push(new TableRow({ children: [
                        labelCell('Descripción', 35),
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: interview.description, size: 18, color: COLOR_BODY_TXT })],
                                alignment: AlignmentType.JUSTIFIED,
                                spacing: { before: 60, after: 60 }
                            })],
                            width: { size: pct(65), type: WidthType.DXA },
                            shading: { fill: 'FFFFFF', type: ShadingType.SOLID, color: 'FFFFFF' }
                        })
                    ]}));
                }
                if (interview.notes) {
                    rowsEnt.push(labelRow('Notas', interview.notes));
                }
                content.push(fullTable(rowsEnt));
                content.push(spacer());
            });
        } else {
            content.push(fullTable([
                new TableRow({ children: [
                    cell('No se han registrado entrevistas asociadas a este caso.', { width: 100, color: '94A3B8' })
                ]})
            ]));
            content.push(spacer());
        }

        // ── 12. MEDIDAS CORRECTIVAS ──────────────────────────────────

        content.push(sectionParagraph('12', 'Medidas Correctivas'));
        const stepsMedidas = steps.filter(s => {
            const t = (s.titulo || s.title || '').toLowerCase();
            return t.includes('medida') || t.includes('correc') || t.includes('sancion') || t.includes('sanción');
        });
        const rowsMed = [
            new TableRow({ children: [ headerCell('FECHA', { width: 25 }), headerCell('MEDIDA CORRECTIVA', { width: 75 }) ] })
        ];
        if (stepsMedidas.length > 0) {
            stepsMedidas.forEach(s => {
                const f = s.fecha ? new Date(s.fecha).toLocaleDateString('es-CL') : '—';
                rowsMed.push(new TableRow({ children: [ valueCell(f, 25), valueCell(s.notas || s.notes || s.titulo || '—', 75) ] }));
            });
        } else {
            rowsMed.push(new TableRow({ children: [
                cell('Sin medidas correctivas registradas.', { width: 100, colspan: 2, color: '94A3B8' })
            ]}));
        }
        content.push(fullTable(rowsMed, COL_2_WIDE));

        // ── FOOTER ───────────────────────────────────────────────────

        content.push(new Paragraph({ spacing: { before: 500 } }));
        content.push(new Paragraph({
            border: { top: { color: 'CBD5E1', style: BorderStyle.SINGLE, size: 4, space: 4 } },
            spacing: { after: 160 }
        }));
        content.push(new Paragraph({
            children: [new TextRun({ text: `${colegioNombre} — Documento Confidencial`, size: 14, color: '94A3B8', italics: true })],
            alignment: AlignmentType.CENTER
        }));

        // ── Ensamblar ─────────────────────────────────────────────────

        const doc = new Document({
            styles: { default: { document: { run: { font: 'Arial' } } } },
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(1),
                            right: convertInchesToTwip(1),
                            bottom: convertInchesToTwip(1),
                            left: convertInchesToTwip(1.25)
                        }
                    }
                },
                children: content
            }]
        });

        const blob = await Packer.toBlob(doc);
        const caseNum = (caseData.counterCase || caseData.counter_case || 'caso').replace(/[^a-z0-9-]/gi, '_');
        saveAs(blob, `Informe_${caseNum}_${new Date().toISOString().split('T')[0]}.docx`);
        return true;

    } catch (error) {
        logger.error('Error al exportar a DOCX:', error);
        alert('Error al exportar el informe a Word.');
        throw error;
    }
};
