/**
 * Estado inicial del formulario de registro individual
 */
export const INITIAL_FORM_STATE = {
    nombres: '',
    apellidos: '',
    rut: '',
    email: '',
    curso: '',
    rol: 'Gerente Relaciones Laborales'
};

/**
 * Opciones de rol para el registro de personal
 * Los valores deben coincidir exactamente con el enum RoleName del backend
 */
export const STAFF_ROLE_OPTIONS = [
    { value: 'Gerente Relaciones Laborales', label: 'Gerente Relaciones Laborales' },
    { value: 'Encargado de Relaciones Laborales', label: 'Encargado de Relaciones Laborales' },
    { value: 'Investigador', label: 'Investigador' },
];

/**
 * Tipos de archivo aceptados para la carga
 */
export const ACCEPTED_FILE_TYPES = '.csv,.xlsx,.xls';

/**
 * Contraseña temporal para usuarios nuevos
 */
export const DEFAULT_TEMP_PASSWORD = 'temporal123';
