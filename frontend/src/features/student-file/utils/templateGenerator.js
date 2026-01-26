import * as XLSX from 'xlsx';

/**
 * Genera y descarga una plantilla Excel con el formato requerido
 */
export const downloadTemplate = () => {
  // Datos de ejemplo para la plantilla
  const templateData = [
    {
      'Nombres': 'Juan',
      'Apellidos': 'Pérez González',
      'RUT': '12.345.678-9',
      'Email': 'juan.perez@email.com',
      'Curso': '1° Medio A',
      'Fecha Nacimiento': '15/03/2010',
      'TEA': 'No',
      'PIE': 'Sí',
      'PAEC': 'No'
    },
    {
      'Nombres': 'María',
      'Apellidos': 'González López',
      'RUT': '98.765.432-1',
      'Email': 'maria.gonzalez@email.com',
      'Curso': '2° Básico B',
      'Fecha Nacimiento': '22/07/2015',
      'TEA': 'Sí',
      'PIE': 'Sí',
      'PAEC': 'Sí'
    },
    {
      'Nombres': 'Pedro',
      'Apellidos': 'Martínez Silva',
      'RUT': '11.222.333-4',
      'Email': 'pedro.martinez@email.com',
      'Curso': '4° Medio A',
      'Fecha Nacimiento': '08/11/2007',
      'TEA': 'No',
      'PIE': 'No',
      'PAEC': 'No'
    },
    {
      'Nombres': 'Ana',
      'Apellidos': 'Rodríguez Torres',
      'RUT': '22.333.444-5',
      'Email': 'ana.rodriguez@email.com',
      'Curso': '4° Medio A',
      'Fecha Nacimiento': '30/01/2008',
      'TEA': 'No',
      'PIE': 'Sí',
      'PAEC': 'Sí'
    },
    {
      'Nombres': 'Carlos',
      'Apellidos': 'Fernández Ruiz',
      'RUT': '33.444.555-6',
      'Email': 'carlos.fernandez@email.com',
      'Curso': '8° Básico A',
      'Fecha Nacimiento': '14/09/2012',
      'TEA': 'Sí',
      'PIE': 'No',
      'PAEC': 'No'
    }
  ];

  // Crear workbook y worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Ajustar anchos de columna
  const columnWidths = [
    { wch: 15 }, // Nombres
    { wch: 20 }, // Apellidos
    { wch: 15 }, // RUT
    { wch: 25 }, // Email
    { wch: 12 }, // Curso
    { wch: 16 }, // Fecha Nacimiento
    { wch: 8 },  // TEA
    { wch: 8 },  // PIE
    { wch: 10 }  // PAEC
  ];
  worksheet['!cols'] = columnWidths;

  // Agregar el worksheet al workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos');

  // Generar y descargar el archivo
  XLSX.writeFile(workbook, 'plantilla_alumnos.xlsx');
};
