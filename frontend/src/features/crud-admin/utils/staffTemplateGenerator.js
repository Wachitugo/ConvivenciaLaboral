import * as XLSX from 'xlsx';

/**
 * Genera y descarga una plantilla Excel para carga de personal
 */
export const downloadStaffTemplate = () => {
    // Datos de ejemplo
    const templateData = [
        {
            'Nombre': 'Juan',
            'Apellido': 'Pérez González',
            'RUT': '12.345.678-9',
            'Email': 'juan.perez@colegio.cl',
            'Rol': 'Profesor',
            'Asignatura': 'Matemáticas'
        },
        {
            'Nombre': 'María',
            'Apellido': 'López Silva',
            'RUT': '11.222.333-4',
            'Email': 'maria.lopez@colegio.cl',
            'Rol': 'Encargado Convivencia',
            'Asignatura': ''
        }
    ];

    // Crear libro de trabajo
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Ajustar anchos de columna
    worksheet['!cols'] = [
        { wch: 15 },  // Nombre
        { wch: 20 },  // Apellido
        { wch: 15 },  // RUT
        { wch: 30 },  // Email
        { wch: 20 },  // Rol
        { wch: 20 }   // Asignatura
    ];

    // Añadir hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Personal');

    // Descargar archivo
    XLSX.writeFile(workbook, 'plantilla_personal.xlsx');
};
