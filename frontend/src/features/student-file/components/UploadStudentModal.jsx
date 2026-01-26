import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { processExcelFile, validateFile } from '../utils/excelProcessor';
import { studentsService } from '../../../services/api';
import { downloadTemplate } from '../utils/templateGenerator';
import { X, Upload, FileSpreadsheet, Loader2, CloudUpload, Download, AlertTriangle, CheckCircle, Info } from 'lucide-react';

function UploadStudentModal({ isOpen, onClose }) {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setError(null);
            setSuccess(false);

            const validation = validateFile(selectedFile);
            if (!validation.valid) {
                setError(validation.error);
                return;
            }

            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Por favor selecciona un archivo');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSuccess(false);

        try {
            // Procesar el archivo Excel
            const students = await processExcelFile(file);

            if (students.length === 0) {
                setError('El archivo no contiene datos válidos');
                setIsProcessing(false);
                return;
            }

            // Preparar datos para la API
            // Necesitamos el ID del colegio. Por ahora asumimos que está en localStorage o contexto.
            // TODO: Obtener colegio_id real del contexto
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const colegioId = user.colegios ? user.colegios[0] : null;

            if (!colegioId) {
                setError('No se pudo identificar el colegio del usuario');
                setIsProcessing(false);
                return;
            }

            const studentsToUpload = students.map(s => ({
                ...s,
                colegio_id: colegioId
            }));

            // Subir a la API
            await studentsService.uploadStudents(studentsToUpload);


            setSuccess(true);

            // Cerrar el modal después de 1.5 segundos y recargar
            setTimeout(() => {
                onClose();
                setFile(null);
                setError(null);
                setSuccess(false);
                window.location.reload();
            }, 1500);

        } catch (err) {
            setError(err.message || 'Error al procesar el archivo');
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setError(null);
        setSuccess(false);
        onClose();
    };

    return createPortal(
        <>
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
                onClick={handleClose}
            />

            <div className="fixed right-0 top-0 h-full z-[70] flex items-center justify-end pointer-events-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <div className="w-[430px] h-full shadow-2xl bg-white border-l border-gray-100 flex flex-col animate-slide-in overflow-hidden pointer-events-auto">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Cargar Alumnos</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Sube un archivo para actualizar la base de datos</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                        <div className="space-y-6">

                            {/* Upload Zone */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    Archivo de datos
                                </label>
                                <div
                                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                                    className={`relative group border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${file
                                        ? 'border-green-400 bg-green-50/30'
                                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'
                                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept=".csv,.xlsx,.xls"
                                        disabled={isProcessing}
                                    />

                                    {file ? (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                                <FileSpreadsheet size={24} className="text-green-600" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-gray-800 truncate max-w-[250px]">{file.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                className="text-xs text-red-500 hover:text-red-700 font-medium underline"
                                            >
                                                Cambiar archivo
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                <Upload size={20} className="text-gray-400 group-hover:text-blue-500" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                                                    Haga clic para subir archivo
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Soporta archivos .CSV, .XLSX, .XLS
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Template Download */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                        <Info size={12} />
                                        Columnas del Excel
                                    </label>
                                    <button
                                        type="button"
                                        onClick={downloadTemplate}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm flex items-center gap-1.5 transition-colors"
                                    >
                                        <Download size={14} />
                                        Descargar Plantilla
                                    </button>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    {/* Campos obligatorios */}
                                    <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-2">
                                        Obligatorios
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium border border-red-200">
                                            Nombres
                                        </span>
                                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium border border-red-200">
                                            Apellidos
                                        </span>
                                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium border border-red-200">
                                            RUT
                                        </span>
                                    </div>

                                    {/* Campos opcionales */}
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Opcionales
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">
                                            Email
                                        </span>
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">
                                            Curso
                                        </span>
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">
                                            Fecha Nacimiento
                                        </span>
                                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-200">
                                            TEA
                                        </span>
                                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-200">
                                            PIE
                                        </span>
                                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-200">
                                            PAEC
                                        </span>
                                    </div>

                                    {/* Nota de formato */}
                                    <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                                        TEA, PIE, PAEC aceptan: <span className="font-medium">Sí / No</span> • Fecha: <span className="font-medium">DD/MM/AAAA</span>
                                    </p>
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-800 leading-relaxed">
                                    Esta información es confidencial. Asegúrese de cumplir con los protocolos de manejo de datos.
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100 animate-in fade-in duration-200">
                                    <X size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-800 leading-relaxed font-medium">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100 animate-in fade-in duration-200">
                                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-green-800 leading-relaxed font-medium">
                                        ¡Archivo cargado exitosamente! Actualizando...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-white">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!file || isProcessing}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 ${file && !isProcessing
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CloudUpload size={16} />
                                        <span>Cargar Datos</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}

export default UploadStudentModal;
