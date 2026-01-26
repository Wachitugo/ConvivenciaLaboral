import { useState, useRef } from 'react';
import { processExcelFile, validateFile } from '../../student-file/utils/excelProcessor';
import { downloadTemplate } from '../../student-file/utils/templateGenerator';
import { processStaffExcelFile, validateStaffFile } from '../utils/staffExcelProcessor';
import { downloadStaffTemplate } from '../utils/staffTemplateGenerator';
import { INITIAL_FORM_STATE, DEFAULT_TEMP_PASSWORD } from '../constant';
import { studentsService } from '../../../services/api';

/**
 * Hook personalizado para manejar la lógica del modal de carga masiva/individual
 */
export function useBulkUploadModal({ school, uploadType, onRegistrarUsuario, onSuccess, onClose }) {
    const [mode, setMode] = useState('bulk'); // 'bulk' | 'individual'
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [individualForm, setIndividualForm] = useState(INITIAL_FORM_STATE);
    const fileInputRef = useRef(null);

    const resetForm = () => {
        setIndividualForm(INITIAL_FORM_STATE);
    };

    const handleClose = () => {
        setFile(null);
        setError(null);
        setSuccess(null);
        setIsProcessing(false);
        setMode('bulk');
        resetForm();
        onClose();
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setError(null);
            setSuccess(null);

            const validation = uploadType === 'alumnos'
                ? validateFile(selectedFile)
                : validateStaffFile(selectedFile);

            if (!validation.valid) {
                setError(validation.error);
                return;
            }

            setFile(selectedFile);
        }
    };

    const handleUploadStudents = async () => {
        if (!file) {
            setError('Por favor selecciona un archivo');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSuccess(null);

        try {
            const students = await processExcelFile(file);

            if (students.length === 0) {
                setError('El archivo no contiene datos válidos');
                setIsProcessing(false);
                return;
            }

            const studentsToUpload = students.map(s => ({
                rut: s.rut,
                nombres: s.nombres,
                apellidos: s.apellidos,
                email: s.email || null,
                curso: s.curso,
                fecha_nacimiento: s.fechaNacimiento,
                tea: s.tea,
                pie: s.pie,
                paec: s.paec,
                apoderado_nombre: s.apoderadoNombre,
                apoderado_email: s.apoderadoEmail || null,
                apoderado_telefono: s.apoderadoTelefono || null,
                colegio_id: school.id
            }));

            await studentsService.uploadStudents(studentsToUpload);

            setSuccess(`¡${students.length} alumnos cargados exitosamente!`);
            setTimeout(() => {
                onSuccess?.();
                handleClose();
            }, 1500);

        } catch (err) {
            setError(err.message || 'Error al procesar el archivo');
            setIsProcessing(false);
        }
    };

    const handleUploadStaff = async () => {
        if (!file) {
            setError('Por favor selecciona un archivo');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSuccess(null);

        try {
            const staff = await processStaffExcelFile(file);

            if (staff.length === 0) {
                setError('El archivo no contiene datos válidos');
                setIsProcessing(false);
                return;
            }

            let successCount = 0;
            let errorCount = 0;

            for (const person of staff) {
                try {
                    await onRegistrarUsuario({
                        nombre: person.nombreCompleto,
                        correo: person.correo,
                        password: DEFAULT_TEMP_PASSWORD,
                        rol: person.rol
                    }, school.id);
                    successCount++;
                } catch (err) {
                    console.error(`Error registrando ${person.correo}:`, err);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                setSuccess(`¡${successCount} usuarios registrados!${errorCount > 0 ? ` (${errorCount} errores)` : ''}`);
                setTimeout(() => {
                    onSuccess?.();
                    handleClose();
                }, 1500);
            } else {
                setError(`No se pudo registrar ningún usuario. ${errorCount} errores.`);
                setIsProcessing(false);
            }

        } catch (err) {
            setError(err.message || 'Error al procesar el archivo');
            setIsProcessing(false);
        }
    };

    const handleUpload = () => {
        if (uploadType === 'alumnos') {
            handleUploadStudents();
        } else {
            handleUploadStaff();
        }
    };

    const handleIndividualStudent = async () => {
        const { nombres, apellidos, rut } = individualForm;

        if (!nombres.trim() || !apellidos.trim() || !rut.trim()) {
            setError('Nombres, Apellidos y RUT son obligatorios');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSuccess(null);

        try {
            const newStudent = {
                nombres: nombres.trim(),
                apellidos: apellidos.trim(),
                rut: rut.trim(),
                email: individualForm.email.trim() || null,
                curso: individualForm.curso.trim() || null,
                colegio_id: school.id
            };

            await studentsService.uploadStudents([newStudent]);

            setSuccess('¡Alumno registrado exitosamente!');
            resetForm();
            setTimeout(() => {
                onSuccess?.();
                handleClose();
            }, 1500);

        } catch (err) {
            setError(err.message || 'Error al registrar alumno');
            setIsProcessing(false);
        }
    };

    const handleIndividualStaff = async () => {
        const { nombres, apellidos, email } = individualForm;

        if (!nombres.trim() || !apellidos.trim() || !email.trim()) {
            setError('Nombre, Apellido y Email son obligatorios');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSuccess(null);

        try {
            await onRegistrarUsuario({
                nombre: `${nombres.trim()} ${apellidos.trim()}`,
                correo: email.trim(),
                password: DEFAULT_TEMP_PASSWORD,
                rol: individualForm.rol
            }, school.id);

            setSuccess('¡Usuario registrado exitosamente!');
            resetForm();
            setTimeout(() => {
                onSuccess?.();
                handleClose();
            }, 1500);

        } catch (err) {
            setError(err.message || 'Error al registrar usuario');
            setIsProcessing(false);
        }
    };

    const handleIndividualSubmit = () => {
        if (uploadType === 'alumnos') {
            handleIndividualStudent();
        } else {
            handleIndividualStaff();
        }
    };

    const handleDownloadTemplate = () => {
        if (uploadType === 'alumnos') {
            downloadTemplate();
        } else {
            downloadStaffTemplate();
        }
    };

    const updateFormField = (field, value) => {
        setIndividualForm(prev => ({ ...prev, [field]: value }));
    };

    const triggerFileInput = () => {
        if (!isProcessing) {
            fileInputRef.current?.click();
        }
    };

    const clearFile = () => {
        setFile(null);
    };

    return {
        // Estado
        mode,
        setMode,
        file,
        isProcessing,
        error,
        success,
        individualForm,
        fileInputRef,

        // Acciones
        handleFileChange,
        handleUpload,
        handleIndividualSubmit,
        handleDownloadTemplate,
        handleClose,
        updateFormField,
        triggerFileInput,
        clearFile
    };
}
