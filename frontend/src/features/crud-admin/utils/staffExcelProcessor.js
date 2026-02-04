import * as XLSX from 'xlsx';

/**
 * Procesa un archivo Excel y extrae los datos de personal (profesores/encargados)
 * @param {File} file - Archivo Excel a procesar
 * @returns {Promise<Array>} - Array de personal
 */
export const processStaffExcelFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Obtener la primera hoja
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convertir a JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Validar y normalizar los datos
                const staff = jsonData.map((row, index) => {
                    return normalizeStaffData(row, index);
                });

                // Filtrar personal inválido
                const validStaff = staff.filter(person => person !== null);

                resolve(validStaff);
            } catch (error) {
                reject(new Error(`Error al procesar el archivo: ${error.message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };

        reader.readAsArrayBuffer(file);
    });
};

/**
 * Normaliza los datos de un miembro del personal
 * @param {Object} row - Fila del Excel
 * @param {number} index - Índice de la fila
 * @returns {Object|null} - Personal normalizado o null si es inválido
 */
const normalizeStaffData = (row, index) => {
    // Mapeo flexible de nombres de columnas
    const nombre = row['Nombre'] || row['nombre'] || row['Nombres'] || row['nombres'] || '';
    const apellido = row['Apellido'] || row['apellido'] || row['Apellidos'] || row['apellidos'] || '';
    const rut = row['RUT'] || row['rut'] || row['Rut'] || '';
    const email = row['Email'] || row['email'] || row['Correo'] || row['correo'] || '';
    const rol = row['Rol'] || row['rol'] || row['Cargo'] || row['cargo'] || 'Trabajador';
    const asignatura = row['Asignatura'] || row['asignatura'] || row['Área'] || row['area'] || '';

    // Validar campos obligatorios
    if (!nombre || !apellido || !email) {
        console.warn(`Fila ${index + 2} omitida: faltan campos obligatorios (nombre, apellido, email)`);
        return null;
    }

    // Normalizar rol
    const normalizeRol = (value) => {
        if (!value) return 'Trabajador';
        const lower = value.toString().toLowerCase().trim();

        // Mapeo a RoleName enum del backend
        if (lower.includes('encargado') || lower.includes('coordinador') || lower.includes('convivencia')) {
            return 'Encargado de Convivencia';
        }
        if (lower.includes('director') || lower.includes('admin') || lower.includes('directivo')) {
            return 'Directivo';
        }
        if (lower.includes('psicolog') || lower.includes('orientador') || lower.includes('dupla')) {
            return 'Encargado de Convivencia'; // Asumimos rol de staff/equipo por ahora
        }

        return 'Trabajador';
    };

    return {
        id: Date.now() + index,
        nombre: nombre.toString().trim(),
        apellido: apellido.toString().trim(),
        nombreCompleto: `${nombre.toString().trim()} ${apellido.toString().trim()}`,
        rut: rut.toString().trim(),
        correo: email.toString().trim(),
        rol: normalizeRol(rol),
        asignatura: asignatura.toString().trim(),
        fechaRegistro: new Date().toISOString()
    };
};

/**
 * Valida el formato del archivo
 * @param {File} file - Archivo a validar
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateStaffFile = (file) => {
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
