import * as XLSX from 'xlsx';

/**
 * Genera y descarga una plantilla Excel con el formato requerido para trabajadores
 */
export const downloadTemplate = () => {
  // Datos de ejemplo para la plantilla - 20 trabajadores con RUTs de personas naturales
  const templateData = [
    {
      'Nombres': 'Juan Carlos',
      'Apellidos': 'Pérez González',
      'RUT': '12.345.678-5',
      'Email': 'juan.perez@empresa.cl',
      'Área de trabajo': 'Administración',
      'Fecha Nacimiento': '15/03/1985',
      'Género': 'Masculino'
    },
    {
      'Nombres': 'María José',
      'Apellidos': 'González López',
      'RUT': '15.432.876-3',
      'Email': 'maria.gonzalez@empresa.cl',
      'Área de trabajo': 'Recursos Humanos',
      'Fecha Nacimiento': '22/07/1990',
      'Género': 'Femenino'
    },
    {
      'Nombres': 'Pedro Antonio',
      'Apellidos': 'Martínez Silva',
      'RUT': '11.234.567-8',
      'Email': 'pedro.martinez@empresa.cl',
      'Área de trabajo': 'Tecnología',
      'Fecha Nacimiento': '08/11/1988',
      'Género': 'Masculino'
    },
    {
      'Nombres': 'Ana María',
      'Apellidos': 'Rodríguez Torres',
      'RUT': '17.654.321-K',
      'Email': 'ana.rodriguez@empresa.cl',
      'Área de trabajo': 'Finanzas',
      'Fecha Nacimiento': '30/01/1992',
      'Género': 'Femenino'
    },
    {
      'Nombres': 'Carlos Alberto',
      'Apellidos': 'Fernández Ruiz',
      'RUT': '9.876.543-2',
      'Email': 'carlos.fernandez@empresa.cl',
      'Área de trabajo': 'Operaciones',
      'Fecha Nacimiento': '14/09/1983',
      'Género': 'Masculino'
    },
    {
      'Nombres': 'Valentina Andrea',
      'Apellidos': 'Muñoz Soto',
      'RUT': '19.123.456-7',
      'Email': 'valentina.munoz@empresa.cl',
      'Área de trabajo': 'Marketing',
      'Fecha Nacimiento': '25/05/1995',
      'Género': 'Femenino'
    },
    {
      'Nombres': 'Diego Alejandro',
      'Apellidos': 'Herrera Castro',
      'RUT': '13.567.890-1',
      'Email': 'diego.herrera@empresa.cl',
      'Área de trabajo': 'Ventas',
      'Fecha Nacimiento': '12/12/1987',
      'Género': 'Masculino'
    },
    {
      'Nombres': 'Camila Francisca',
      'Apellidos': 'Vargas Morales',
      'RUT': '16.789.012-4',
      'Email': 'camila.vargas@empresa.cl',
      'Área de trabajo': 'Atención al Cliente',
      'Fecha Nacimiento': '03/08/1993',
      'Género': 'Femenino'
    },
    {
      'Nombres': 'Roberto Andrés',
      'Apellidos': 'Díaz Paredes',
      'RUT': '8.901.234-5',
      'Email': 'roberto.diaz@empresa.cl',
      'Área de trabajo': 'Producción',
      'Fecha Nacimiento': '18/04/1980',
      'Género': 'Masculino'
    },
    {
      'Nombres': 'Javiera Ignacia',
      'Apellidos': 'Sepúlveda Reyes',
      'RUT': '18.234.567-9',
      'Email': 'javiera.sepulveda@empresa.cl',
      'Área de trabajo': 'Logística',
      'Fecha Nacimiento': '27/02/1991',
      'Género': 'Femenino'
    },
    {
      'Nombres': 'Felipe Ignacio',
      'Apellidos': 'Contreras Núñez',
      'RUT': '14.567.890-2',
      'Email': 'felipe.contreras@empresa.cl',
      'Área de trabajo': 'Tecnología',
      'Fecha Nacimiento': '09/06/1989',
      'Género': 'Masculino'
    },
    {
      'Nombres': 'Francisca Belén',
      'Apellidos': 'Espinoza Fuentes',
      'RUT': '20.123.456-8',
      'Email': 'francisca.espinoza@empresa.cl',
      'Área de trabajo': 'Administración',
      'Fecha Nacimiento': '16/10/1994',
      'Género': 'Femenino'
    },
    {
      'Nombres': 'Sebastián Andrés',
      'Apellidos': 'Rojas Valenzuela',
      'RUT': '10.987.654-3',
      'Email': 'sebastian.rojas@empresa.cl',
      'Área de trabajo': 'Finanzas',
      'Fecha Nacimiento': '21/11/1986',
      'Género': 'Masculino'
    },
    {
      'Nombres': 'Catalina Paz',
      'Apellidos': 'Araya Figueroa',
      'RUT': '17.345.678-6',
      'Email': 'catalina.araya@empresa.cl',
      'Área de trabajo': 'Recursos Humanos',
      'Fecha Nacimiento': '05/07/1992',
      'Género': 'Femenino'
    },
    {
      'Nombres': 'Alexis Jordan',
      'Apellidos': 'Bravo Mendoza',
      'RUT': '21.456.789-0',
      'Email': 'alexis.bravo@empresa.cl',
      'Área de trabajo': 'Operaciones',
      'Fecha Nacimiento': '13/03/1996',
      'Género': 'Otro'
    },
    {
      'Nombres': 'Martín Eduardo',
      'Apellidos': 'Vega Saavedra',
      'RUT': '10.234.567-1',
      'Email': 'martin.vega@empresa.cl',
      'Área de trabajo': 'Ventas',
      'Fecha Nacimiento': '28/09/1984',
      'Género': 'Masculino'
    },
    {
      'Nombres': 'Isidora Antonia',
      'Apellidos': 'Pizarro Lagos',
      'RUT': '22.567.890-K',
      'Email': 'isidora.pizarro@empresa.cl',
      'Área de trabajo': 'Marketing',
      'Fecha Nacimiento': '07/01/1997',
      'Género': 'Femenino'
    },
    {
      'Nombres': 'Nicolás Tomás',
      'Apellidos': 'Ríos Guzmán',
      'RUT': '7.890.123-4',
      'Email': 'nicolas.rios@empresa.cl',
      'Área de trabajo': 'Producción',
      'Fecha Nacimiento': '19/05/1982',
      'Género': 'Masculino'
    },
    {
      'Nombres': 'Macarena Soledad',
      'Apellidos': 'Tapia Olivares',
      'RUT': '15.678.901-5',
      'Email': 'macarena.tapia@empresa.cl',
      'Área de trabajo': 'Logística',
      'Fecha Nacimiento': '11/08/1990',
      'Género': 'Femenino'
    },
    {
      'Nombres': 'Gonzalo Esteban',
      'Apellidos': 'Molina Carrasco',
      'RUT': '13.890.123-7',
      'Email': 'gonzalo.molina@empresa.cl',
      'Área de trabajo': 'Atención al Cliente',
      'Fecha Nacimiento': '02/12/1988',
      'Género': 'Masculino'
    }
  ];

  // Crear workbook y worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Ajustar anchos de columna
  const columnWidths = [
    { wch: 20 }, // Nombres
    { wch: 22 }, // Apellidos
    { wch: 15 }, // RUT
    { wch: 30 }, // Email
    { wch: 20 }, // Área de trabajo
    { wch: 16 }, // Fecha Nacimiento
    { wch: 12 }  // Género
  ];
  worksheet['!cols'] = columnWidths;

  // Agregar el worksheet al workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trabajadores');

  // Generar y descargar el archivo
  XLSX.writeFile(workbook, 'plantilla_trabajadores.xlsx');
};
