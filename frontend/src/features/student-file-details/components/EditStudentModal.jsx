import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User, CreditCard, GraduationCap, Mail, Cake, Briefcase, CalendarDays } from 'lucide-react';
import BirthDatePicker from '../../../components/BirthDatePicker';
import AreaSelect from '../../../components/AreaSelect';

const inputClass = `w-full px-4 py-3 rounded-xl border border-white/20 focus:border-[#34B6D8] focus:ring-4 focus:ring-[#34B6D8]/10 outline-none bg-white/5 text-sm text-white placeholder-white/30 transition-all`;

const labelClass = `text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5 mb-1.5`;

function EditStudentModal({ isOpen, onClose, onSave, student, schoolId = null }) {
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        rut: '',
        curso: '',
        genero: '',
        email: '',
        fecha_nacimiento: '',
        fecha_ingreso: '',
        profesion: '',
        cargo: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (student) {
            setFormData({
                nombres: student.nombres || '',
                apellidos: student.apellidos || '',
                rut: student.rut || '',
                curso: student.curso || '',
                genero: student.genero || '',
                email: student.email || '',
                fecha_nacimiento: student.fechaNacimiento || student.fecha_nacimiento
                    ? new Date(student.fechaNacimiento || student.fecha_nacimiento).toISOString().split('T')[0]
                    : '',
                fecha_ingreso: student.fecha_ingreso || '',
                profesion: student.profesion || '',
                cargo: student.cargo || ''
            });
        }
    }, [student, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({
                ...student,
                nombres: formData.nombres,
                apellidos: formData.apellidos,
                rut: formData.rut,
                curso: formData.curso || null,
                genero: formData.genero || null,
                email: formData.email || null,
                fecha_nacimiento: formData.fecha_nacimiento || null,
                fecha_ingreso: formData.fecha_ingreso || null,
                profesion: formData.profesion || null,
                cargo: formData.cargo || null
            });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const field = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full z-[70] pointer-events-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <div className="w-[480px] h-full shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#0A3866]/95 backdrop-blur-3xl border-l border-[#1A71B8]/30 flex flex-col overflow-hidden pointer-events-auto animate-slide-in">

                    {/* Header */}
                    <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#1A71B8]/40 border border-[#34B6D8]/30 flex items-center justify-center">
                                <User size={20} className="text-[#34B6D8]" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white">Editar Colaborador</h2>
                                <p className="text-xs text-white/50">
                                    {student?.nombres} {student?.apellidos}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="p-6 space-y-6 flex-1">

                            {/* Sección: Información Personal */}
                            <div>
                                <p className="text-[11px] font-black text-[#34B6D8] uppercase tracking-widest mb-4">Información Personal</p>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>
                                                <User size={10} /> Nombres
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.nombres}
                                                onChange={(e) => field('nombres', e.target.value)}
                                                className={inputClass}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>
                                                <User size={10} /> Apellidos
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.apellidos}
                                                onChange={(e) => field('apellidos', e.target.value)}
                                                className={inputClass}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>
                                                <CreditCard size={10} /> RUT
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.rut}
                                                onChange={(e) => field('rut', e.target.value)}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>
                                                <User size={10} /> Género
                                            </label>
                                            <select
                                                value={formData.genero}
                                                onChange={(e) => field('genero', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-white/20 focus:border-[#34B6D8] outline-none bg-[#071f3a] text-sm text-white transition-all"
                                            >
                                                <option value="">Seleccionar género</option>
                                                <option value="Masculino">Masculino</option>
                                                <option value="Femenino">Femenino</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            <Mail size={10} /> Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => field('email', e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/10" />

                            {/* Sección: Información Laboral */}
                            <div>
                                <p className="text-[11px] font-black text-[#34B6D8] uppercase tracking-widest mb-4">Información Laboral</p>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>
                                                <GraduationCap size={10} /> Área de trabajo
                                            </label>
                                            <AreaSelect
                                                value={formData.curso}
                                                onChange={(val) => field('curso', val)}
                                                schoolId={schoolId}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>
                                                <Briefcase size={10} /> Cargo
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.cargo}
                                                onChange={(e) => field('cargo', e.target.value)}
                                                placeholder="Ej: Jefe de Área..."
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            <Briefcase size={10} /> Profesión u Oficio
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.profesion}
                                            onChange={(e) => field('profesion', e.target.value)}
                                            placeholder="Ej: Ingeniero, Técnico..."
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            <Cake size={10} /> Fecha de Nacimiento
                                        </label>
                                        <BirthDatePicker
                                            value={formData.fecha_nacimiento}
                                            onChange={(date) => field('fecha_nacimiento', date)}
                                            maxYear={new Date().getFullYear() - 18}
                                            minYear={1950}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <CalendarDays size={10} /> Fecha de Ingreso
                                        </label>
                                        <BirthDatePicker
                                            value={formData.fecha_ingreso}
                                            onChange={(date) => field('fecha_ingreso', date)}
                                            maxYear={new Date().getFullYear()}
                                            minYear={new Date().getFullYear() - 50}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer fijo */}
                        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3 flex-shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
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
                                        Guardar Cambios
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

export default EditStudentModal;
