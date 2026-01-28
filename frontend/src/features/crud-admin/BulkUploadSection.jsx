import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, CloudUpload, Download, AlertTriangle, CheckCircle, X, Users, UserPlus, Info } from 'lucide-react';
import { processExcelFile, validateFile, saveStudentsToLocalStorage, getStudentsFromLocalStorage } from '../student-file/utils/excelProcessor';
import { downloadTemplate } from '../student-file/utils/templateGenerator';
import { processStaffExcelFile, validateStaffFile } from './utils/staffExcelProcessor';
import { downloadStaffTemplate } from './utils/staffTemplateGenerator';

export default function BulkUploadSection({ colegios, onRegistrarUsuario }) {
    const [activeSubTab, setActiveSubTab] = useState('alumnos');
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedColegio, setSelectedColegio] = useState('');
    const fileInputRef = useRef(null);

    const subTabs = [
        { id: 'alumnos', label: 'Alumnos', icon: Users },
        { id: 'personal', label: 'Personal', icon: UserPlus }
    ];

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setError(null);
            setSuccess(null);

            const validation = activeSubTab === 'alumnos'
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

            const existingStudents = getStudentsFromLocalStorage();
            const allStudents = [...existingStudents, ...students];
            const saved = saveStudentsToLocalStorage(allStudents);

            if (!saved) {
                setError('Error al guardar los datos');
                setIsProcessing(false);
                return;
            }

            setSuccess(`¡${students.length} alumnos cargados exitosamente!`);
            setFile(null);
            setIsProcessing(false);

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

            // Registrar cada miembro del personal como usuario
            let successCount = 0;
            let errorCount = 0;

            for (const person of staff) {
                try {
                    await onRegistrarUsuario({
                        nombre: person.nombreCompleto,
                        correo: person.correo,
                        password: 'temporal123', // Password temporal
                        rol: person.rol
                    }, selectedColegio || null);
                    successCount++;
                } catch (err) {
                    console.error(`Error registrando ${person.correo}:`, err);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                setSuccess(`¡${successCount} usuarios registrados exitosamente!${errorCount > 0 ? ` (${errorCount} errores)` : ''}`);
            } else {
                setError(`No se pudo registrar ningún usuario. ${errorCount} errores.`);
            }

            setFile(null);
            setIsProcessing(false);

        } catch (err) {
            setError(err.message || 'Error al procesar el archivo');
            setIsProcessing(false);
        }
    };

    const handleUpload = () => {
        if (activeSubTab === 'alumnos') {
            handleUploadStudents();
        } else {
            handleUploadStaff();
        }
    };

    const handleDownloadTemplate = () => {
        if (activeSubTab === 'alumnos') {
            downloadTemplate();
        } else {
            downloadStaffTemplate();
        }
    };

    const resetState = () => {
        setFile(null);
        setError(null);
        setSuccess(null);
    };

    const handleSubTabChange = (tabId) => {
        setActiveSubTab(tabId);
        resetState();
    };

    return (
        <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                {subTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleSubTabChange(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeSubTab === tab.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
                <div className="p-6 space-y-6">
                    {/* Header Info */}
                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-blue-900">
                                {activeSubTab === 'alumnos' ? 'Carga Masiva de Alumnos' : 'Carga Masiva de Personal'}
                            </h3>
                            <p className="text-xs text-blue-700 mt-1">
                                {activeSubTab === 'alumnos'
                                    ? 'Sube un archivo Excel con los datos de los alumnos para agregarlos al sistema.'
                                    : 'Sube un archivo Excel con los datos del personal (profesores, encargados) para crear sus cuentas de usuario.'}
                            </p>
                        </div>
                    </div>

                    {/* Colegio Selector (only for staff) */}
                    {activeSubTab === 'personal' && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Colegio (opcional)
                            </label>
                            <select
                                value={selectedColegio}
                                onChange={(e) => setSelectedColegio(e.target.value)}
                                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200 text-sm"
                            >
                                <option value="">Sin asignar colegio</option>
                                {colegios.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}

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
                                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                                        <FileSpreadsheet size={28} className="text-green-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-800 truncate max-w-[300px]">{file.name}</p>
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
                                    <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        <Upload size={24} className="text-gray-400 group-hover:text-blue-500" />
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

                    {/* Template Info */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                <Info size={12} />
                                Columnas del Excel
                            </label>
                            <button
                                type="button"
                                onClick={handleDownloadTemplate}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-sm flex items-center gap-2 transition-colors"
                            >
                                <Download size={16} />
                                Descargar Plantilla
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            {activeSubTab === 'alumnos' ? (
                                <>
                                    <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-2">
                                        Obligatorios
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium border border-red-200">Nombres</span>
                                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium border border-red-200">Apellidos</span>
                                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium border border-red-200">RUT</span>
                                    </div>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Opcionales</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">Email</span>
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">Área de trabajo</span>
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">Fecha Nacimiento</span>
                                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-200">TEA</span>
                                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-200">PIE</span>
                                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-200">PAEC</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-2">
                                        Obligatorios
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium border border-red-200">Nombre</span>
                                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium border border-red-200">Apellido</span>
                                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium border border-red-200">Email</span>
                                    </div>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Opcionales</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">RUT</span>
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">Rol</span>
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">Asignatura</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-3">
                                        Rol acepta: <span className="font-medium">Profesor, Encargado Convivencia, Admin</span>
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                        <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-800 leading-relaxed">
                            {activeSubTab === 'alumnos'
                                ? 'Esta información es confidencial. Asegúrese de cumplir con los protocolos de manejo de datos.'
                                : 'Los usuarios creados tendrán una contraseña temporal "temporal123". Se recomienda que cambien su contraseña en el primer inicio de sesión.'}
                        </p>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                            <X size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-800 leading-relaxed font-medium">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-green-800 leading-relaxed font-medium">{success}</p>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || isProcessing}
                        className={`w-full px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 ${file && !isProcessing
                            ? 'bg-black hover:bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Procesando...</span>
                            </>
                        ) : (
                            <>
                                <CloudUpload size={18} />
                                <span>Cargar {activeSubTab === 'alumnos' ? 'Alumnos' : 'Personal'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
