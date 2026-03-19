import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User, CreditCard, GraduationCap, Mail, Cake, Briefcase, CalendarDays, UserPlus } from 'lucide-react';
import BirthDatePicker from '../../../components/BirthDatePicker';

const formatRut = (value) => {
    // Limpiar todo excepto dígitos y K
    const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (!clean) return '';

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    // Agregar puntos al cuerpo
    const bodyFormatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return body.length > 0 ? `${bodyFormatted}-${dv}` : dv;
};

const EMPTY_FORM = {
    nombres: '',
    apellidos: '',
    rut: '',
    curso: '',
    genero: '',
    email: '',
    fecha_nacimiento: '',
    fecha_ingreso: '',
    profesion: '',
    cargo: '',
};

const inputClass = (error) =>
    `w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/40 bg-white/10 border transition-all focus:outline-none focus:ring-2 ${
        error
            ? 'border-red-400/70 focus:ring-red-400/30'
            : 'border-white/20 focus:border-white/50 focus:ring-white/10'
    }`;

const selectClass = `w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#0d3258] border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/50 transition-all`;

const labelClass = `flex items-center gap-1.5 text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5`;

function CreateStudentModal({ isOpen, onClose, onSave, isSaving = false }) {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});

    if (!isOpen) return null;

    const validate = () => {
        const newErrors = {};
        if (!formData.nombres.trim()) newErrors.nombres = 'Requerido';
        if (!formData.apellidos.trim()) newErrors.apellidos = 'Requerido';
        if (!formData.rut.trim()) newErrors.rut = 'Requerido';
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        onSave({
            nombres: formData.nombres.trim(),
            apellidos: formData.apellidos.trim(),
            rut: formData.rut.trim(),
            curso: formData.curso || null,
            genero: formData.genero || null,
            email: formData.email || null,
            fecha_nacimiento: formData.fecha_nacimiento || null,
            fecha_ingreso: formData.fecha_ingreso || null,
            profesion: formData.profesion || null,
            cargo: formData.cargo || null,
        });
    };

    const handleClose = () => {
        setFormData(EMPTY_FORM);
        setErrors({});
        onClose();
    };

    const field = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60]" onClick={handleClose} />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="w-full max-w-2xl pointer-events-auto max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
                    style={{ background: 'linear-gradient(145deg, #0d3258 0%, #0A2744 100%)' }}
                >
                    {/* Header */}
                    <div className="px-7 py-5 flex justify-between items-center border-b border-white/10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#1A71B8]/40 border border-[#34B6D8]/30 flex items-center justify-center">
                                <UserPlus size={20} className="text-[#34B6D8]" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white">Nuevo Colaborador</h2>
                                <p className="text-xs text-white/40">Completa los datos del trabajador</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="overflow-y-auto p-7 space-y-5 custom-scrollbar">

                        {/* Sección: Identidad */}
                        <div>
                            <p className="text-[11px] font-black text-[#34B6D8] uppercase tracking-widest mb-3">Información Personal</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>
                                        <User size={11} /> Nombres <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nombres}
                                        onChange={(e) => field('nombres', e.target.value)}
                                        className={inputClass(errors.nombres)}
                                        placeholder="Ej: Juan Carlos"
                                    />
                                    {errors.nombres && <p className="text-xs text-red-400 mt-1">{errors.nombres}</p>}
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        <User size={11} /> Apellidos <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.apellidos}
                                        onChange={(e) => field('apellidos', e.target.value)}
                                        className={inputClass(errors.apellidos)}
                                        placeholder="Ej: González Pérez"
                                    />
                                    {errors.apellidos && <p className="text-xs text-red-400 mt-1">{errors.apellidos}</p>}
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        <CreditCard size={11} /> RUT <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.rut}
                                        onChange={(e) => field('rut', formatRut(e.target.value))}
                                        className={inputClass(errors.rut)}
                                        placeholder="Ej: 12.345.678-9"
                                        maxLength={12}
                                    />
                                    {errors.rut && <p className="text-xs text-red-400 mt-1">{errors.rut}</p>}
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        <User size={11} /> Género
                                    </label>
                                    <select value={formData.genero} onChange={(e) => field('genero', e.target.value)} className={selectClass}>
                                        <option value="">Seleccionar género</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>
                                        <Mail size={11} /> Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => field('email', e.target.value)}
                                        placeholder="Ej: colaborador@empresa.cl"
                                        className={inputClass(false)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/10" />

                        {/* Sección: Trabajo */}
                        <div>
                            <p className="text-[11px] font-black text-[#34B6D8] uppercase tracking-widest mb-3">Información Laboral</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>
                                        <GraduationCap size={11} /> Área de trabajo
                                    </label>
                                    <select value={formData.curso} onChange={(e) => field('curso', e.target.value)} className={selectClass}>
                                        <option value="">Seleccionar área</option>
                                        <option value="Administración">Administración</option>
                                        <option value="Operaciones">Operaciones</option>
                                        <option value="Recursos Humanos">Recursos Humanos</option>
                                        <option value="Finanzas">Finanzas</option>
                                        <option value="Tecnología">Tecnología</option>
                                        <option value="Ventas">Ventas</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Producción">Producción</option>
                                        <option value="Logística">Logística</option>
                                        <option value="Atención al Cliente">Atención al Cliente</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        <Briefcase size={11} /> Cargo
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cargo}
                                        onChange={(e) => field('cargo', e.target.value)}
                                        placeholder="Ej: Jefe de Área, Analista..."
                                        className={inputClass(false)}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        <Briefcase size={11} /> Profesión u Oficio
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.profesion}
                                        onChange={(e) => field('profesion', e.target.value)}
                                        placeholder="Ej: Ingeniero, Técnico..."
                                        className={inputClass(false)}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        <CalendarDays size={11} /> Fecha de Ingreso
                                    </label>
                                    <BirthDatePicker
                                        value={formData.fecha_ingreso}
                                        onChange={(date) => field('fecha_ingreso', date)}
                                        maxYear={new Date().getFullYear()}
                                        minYear={new Date().getFullYear() - 50}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>
                                        <Cake size={11} /> Fecha de Nacimiento
                                    </label>
                                    <BirthDatePicker
                                        value={formData.fecha_nacimiento}
                                        onChange={(date) => field('fecha_nacimiento', date)}
                                        maxYear={new Date().getFullYear() - 18}
                                        minYear={new Date().getFullYear() - 80}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSaving}
                                className="px-5 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-all disabled:opacity-40"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-[#1A71B8] hover:bg-[#155d96] text-white text-sm font-bold rounded-xl shadow-lg flex items-center gap-2 transition-colors disabled:opacity-60"
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={15} />
                                        Guardar Colaborador
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>,
        document.body
    );
}

export default CreateStudentModal;
