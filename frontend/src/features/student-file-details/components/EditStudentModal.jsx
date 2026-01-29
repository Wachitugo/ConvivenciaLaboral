import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User, CreditCard, GraduationCap, Mail, Cake, Phone } from 'lucide-react';
import BirthDatePicker from '../../../components/BirthDatePicker';

function EditStudentModal({ isOpen, onClose, onSave, student }) {
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        rut: '',
        curso: '',
        genero: '',
        email: '',
        fecha_nacimiento: ''
    });

    useEffect(() => {
        if (student) {
            setFormData({
                nombres: student.nombres || '',
                apellidos: student.apellidos || '',
                rut: student.rut || '',
                curso: student.curso || '',
                genero: student.genero || '',
                email: student.email || '',
                // Backend sends fecha_nacimiento usually, but frontend often maps to fechaNacimiento. 
                // Let's check what PersonalInfoCard used: student.fechaNacimiento.
                // If the backend returns camelCase (it doesn't, Pydantic defaults to snake), then PersonalInfoCard is doing mapping or using snake.
                // PersonalInfoCard uses student.fechaNacimiento. This implies there's a transform somewhere or I missed where it was defined.
                // Wait, Pydantic by default returns snake_case JSON. 
                // Let's look at PersonalInfoCard line 117: student.fechaNacimiento. 
                // If that works, then the student object has camelCase? 
                // Let's assume the student object passed here has the keys as they come from the API (snake_case) OR standard frontend (camelCase).
                // API usually returns snake_case. 
                // Safer to check both.

                fecha_nacimiento: student.fechaNacimiento || student.fecha_nacimiento ?
                    new Date(student.fechaNacimiento || student.fecha_nacimiento).toISOString().split('T')[0] : ''
            });
        }
    }, [student, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // Construct payload matching backend schema
        onSave({
            ...student,
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            rut: formData.rut,
            curso: formData.curso || null,
            genero: formData.genero || null,
            email: formData.email || null,
            fecha_nacimiento: formData.fecha_nacimiento || null
        });
        onClose();
    };

    return createPortal(
        <>
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
                onClick={onClose}
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl pointer-events-auto transform transition-all max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <User size={20} className="text-blue-600" />
                            Editar Información del Trabajador
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="overflow-y-auto p-6 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Nombres */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Nombres</label>
                                <input
                                    type="text"
                                    value={formData.nombres}
                                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    required
                                />
                            </div>

                            {/* Apellidos */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Apellidos</label>
                                <input
                                    type="text"
                                    value={formData.apellidos}
                                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    required
                                />
                            </div>

                            {/* RUT */}
                            <div>
                                <label className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase mb-1">
                                    <CreditCard size={12} /> RUT
                                </label>
                                <input
                                    type="text"
                                    value={formData.rut}
                                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>

                            {/* Curso */}
                            <div>
                                <label className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase mb-1">
                                    <GraduationCap size={12} /> Área de trabajo
                                </label>
                                <select
                                    value={formData.curso}
                                    onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                >
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

                            {/* Género */}
                            <div>
                                <label className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase mb-1">
                                    <User size={12} /> Género
                                </label>
                                <select
                                    value={formData.genero}
                                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                >
                                    <option value="">Seleccionar género</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            {/* Email */}
                            <div className="col-span-2">
                                <label className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase mb-1">
                                    <Mail size={12} /> Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>

                            {/* Fecha Nacimiento */}
                            <div>
                                <label className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase mb-1">
                                    <Cake size={12} /> Fecha de Nacimiento
                                </label>
                                <BirthDatePicker
                                    value={formData.fecha_nacimiento}
                                    onChange={(date) => setFormData({ ...formData, fecha_nacimiento: date })}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-colors"
                            >
                                <Save size={16} />
                                Guardar Cambios
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
