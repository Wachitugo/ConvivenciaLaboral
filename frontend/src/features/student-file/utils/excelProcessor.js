import * as XLSX from 'xlsx';

/**
 * Procesa un archivo Excel y extrae los datos de estudiantes
 * @param {File} file - Archivo Excel a procesar
 * @returns {Promise<Array>} - Array de estudiantes
 */
export const processExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isCsv = file.name.toLowerCase().endsWith('.csv');

    reader.onload = (e) => {
      try {
        let workbook;
        if (isCsv) {
          // Para CSV, leemos como string para forzar UTF-8 si es necesario
          workbook = XLSX.read(e.target.result, { type: 'string' });
        } else {
          // Para Excel, seguimos usando array buffer
          const data = new Uint8Array(e.target.result);
          workbook = XLSX.read(data, { type: 'array' });
        }

        // Obtener la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validar y normalizar los datos
        const students = jsonData.map((row, index) => {
          return normalizeStudentData(row, index);
        });

        // Filtrar estudiantes inválidos
        const validStudents = students.filter(student => student !== null);

        resolve(validStudents);
      } catch (error) {
        reject(new Error(`Error al procesar el archivo: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    if (isCsv) {
      reader.readAsText(file); // Default is UTF-8
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

/**
 * Normaliza los datos de un estudiante
 * @param {Object} row - Fila del Excel
 * @param {number} index - Índice de la fila
 * @returns {Object|null} - Estudiante normalizado o null si es inválido
 */
const normalizeStudentData = (row, index) => {
  // Mapeo flexible de nombres de columnas (soporta variaciones)
  const nombres = row['Nombres'] || row['nombres'] || row['Nombre'] || row['nombre'] || '';
  const apellidos = row['Apellidos'] || row['apellidos'] || row['Apellido'] || row['apellido'] || '';
  const rut = row['RUT'] || row['rut'] || row['Rut'] || '';
  const email = row['Email'] || row['email'] || row['Correo'] || row['correo'] || '';
  const curso = row['Área de trabajo'] || row['ÁREA DE TRABAJO'] || row['Area de trabajo'] || row['Curso'] || row['curso'] || row['CURSO'] || '';
  const fechaNacimiento = row['Fecha Nacimiento'] || row['Fecha_Nacimiento'] || row['fechaNacimiento'] || row['FechaNacimiento'] || row['Nacimiento'] || '';
  const tea = row['TEA'] || row['tea'] || '';
  const pie = row['PIE'] || row['pie'] || '';
  const paec = row['PAEC'] || row['paec'] || '';
  const apoderadoNombre = row['Apoderado'] || row['apoderado'] || row['Nombre Apoderado'] || row['nombreApoderado'] || '';
  const apoderadoEmail = row['Email Apoderado'] || row['emailApoderado'] || row['Correo Apoderado'] || '';
  const apoderadoTelefono = row['Telefono Apoderado'] || row['telefonoApoderado'] || row['Celular Apoderado'] || row['Telefono'] || '';

  // Validar campos obligatorios
  if (!nombres || !apellidos || !rut) {
    console.warn(`Fila ${index + 2} omitida: faltan campos obligatorios`);
    return null;
  }

  // Normalizar valores booleanos (Sí/No)
  const normalizeBool = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      return lower === 'sí' || lower === 'si' || lower === 'yes' || lower === 'true' || lower === '1';
    }
    return false;
  };

  // Normalizar fecha de nacimiento (puede venir como número de Excel o string)
  const normalizeDate = (value) => {
    if (!value) return null;
    // Si es un número (fecha de Excel)
    if (typeof value === 'number') {
      // Convertir número de Excel a fecha JS
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 86400000);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    // Si es string, intentar parsear
    if (typeof value === 'string') {
      const trimmed = value.trim();
      // Formato DD/MM/YYYY o DD-MM-YYYY
      const match = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (match) {
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      // Si ya viene en formato ISO o similar
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return null;
  };

  return {
    id: Date.now() + index, // ID único temporal
    nombres: nombres.toString().trim(),
    apellidos: apellidos.toString().trim(),
    rut: rut.toString().trim(),
    email: email.toString().trim(),
    curso: curso.toString().trim(),
    fechaNacimiento: normalizeDate(fechaNacimiento),
    tea: normalizeBool(tea),
    pie: normalizeBool(pie),
    paec: normalizeBool(paec),
    apoderadoNombre: apoderadoNombre.toString().trim(),
    apoderadoEmail: apoderadoEmail.toString().trim(),
    apoderadoTelefono: apoderadoTelefono.toString().trim(),
    fechaRegistro: new Date().toISOString()
  };
};

/**
 * Guarda estudiantes en localStorage
 * @param {Array} students - Array de estudiantes
 */
export const saveStudentsToLocalStorage = (students) => {
  try {
    localStorage.setItem('students', JSON.stringify(students));
    return true;
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
    return false;
  }
};

/**
 * Obtiene estudiantes desde localStorage
 * @returns {Array} - Array de estudiantes
 */
export const getStudentsFromLocalStorage = () => {
  try {
    const data = localStorage.getItem('students');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error al leer de localStorage:', error);
    return [];
  }
};

/**
 * Valida el formato del archivo
 * @param {File} file - Archivo a validar
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const validExtensions = ['xlsx', 'xls', 'csv'];

  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo' };
  }

  const extension = file.name.split('.').pop().toLowerCase();
  if (!validExtensions.includes(extension)) {
    return { valid: false, error: 'Formato de archivo no válido. Use Excel (.xlsx, .xls) o CSV' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'El archivo es demasiado grande. Máximo 10MB' };
  }

  return { valid: true, error: null };
};
