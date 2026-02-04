/**
 * Estado inicial del formulario de registro individual
 */
export const INITIAL_FORM_STATE = {
    nombres: '',
    apellidos: '',
    rut: '',
    email: '',
    curso: '',
    rol: 'Encargado de Convivencia'
};

/**
 * Opciones de rol para el registro de personal
 * Los valores deben coincidir exactamente con el enum RoleName del backend
 */
export const STAFF_ROLE_OPTIONS = [
    { value: 'Encargado de Convivencia', label: 'Encargado de Convivencia' },
    { value: 'Directivo', label: 'Director' },
    { value: 'Trabajador', label: 'Trabajador' }
];

/**
 * Tipos de archivo aceptados para la carga
 */
export const ACCEPTED_FILE_TYPES = '.csv,.xlsx,.xls';

/**
 * Contraseña temporal para usuarios nuevos
 */
export const DEFAULT_TEMP_PASSWORD = 'temporal123';
