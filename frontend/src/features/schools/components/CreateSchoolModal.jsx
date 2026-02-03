import { useState, useEffect } from 'react';

export default function CreateSchoolModal({
    isOpen,
    onClose,
    onCreateColegio
}) {
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Resetear el formulario cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setFormData({
                nombre: '',
                direccion: ''
            });
            setLogoFile(null);
            setLogoPreview(null);
            setErrors({});
            setIsDragging(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombre || formData.nombre.trim().length < 3) {
            newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const processFile = (file) => {
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoChange = (e) => {
        processFile(e.target.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        processFile(file);
    };

    const handleCreate = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        await onCreateColegio(formData, logoFile);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                <div className="px-5 py-4 md:px-8 md:py-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Crear Nueva Organización</h3>
                        <p className="text-sm text-gray-500 mt-1">Ingresa los datos de la nueva organización.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-5 md:p-8 overflow-y-auto space-y-8">
                    {/* Información del Colegio */}
                    <div className="space-y-5">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Información Básica</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nombre de la organización <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Empresa S.A."
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all ${errors.nombre ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                />
                                {errors.nombre && (
                                    <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {errors.nombre}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Dirección <span className="text-gray-400 font-normal">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Av. Principal 123"
                                    value={formData.direccion}
                                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Logo del Colegio */}
                    <div className="space-y-5">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Imagen Institucional</h4>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Logo <span className="text-gray-400 font-normal">(opcional)</span>
                            </label>

                            <div className="flex items-start gap-6">
                                <div className="flex-1">
                                    <label
                                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all group ${isDragging ? 'border-purple-500 bg-purple-50 scale-[1.02]' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-purple-300'}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                                            <svg className={`w-8 h-8 mb-2 transition-colors ${isDragging ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <p className={`text-sm ${isDragging ? 'text-purple-700 font-medium' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                                {isDragging ? 'Suelta el logo aquí' : <><span className="font-semibold">Click para subir</span> o arrastra</>}
                                            </p>
                                            <p className="text-xs text-gray-400">SVG, PNG, JPG (Max. 2MB)</p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                    </label>
                                </div>

                                {logoPreview && (
                                    <div className="relative shrink-0">
                                        <div className="w-32 h-32 rounded-xl border border-gray-200 p-1 bg-white shadow-sm">
                                            <img
                                                src={logoPreview}
                                                alt="Preview"
                                                className="w-full h-full rounded-lg object-cover"
                                            />
                                        </div>
                                        <button
                                            onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                                            className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 md:px-8 md:py-5 flex gap-3 justify-end border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 rounded-xl transition duration-200"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isSaving}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-black hover:bg-gray-800 rounded-xl shadow-lg ring-1 ring-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                    >
                        {isSaving ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Creando...
                            </span>
                        ) : 'Crear Organización'}
                    </button>
                </div>
            </div>
        </div>
    );
}
