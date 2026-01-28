import React from 'react';
import { User } from 'lucide-react';
import { STAFF_ROLE_OPTIONS } from '../constant';

/**
 * Formulario para registro individual (alumnos o personal)
 */
export default function IndividualForm({ uploadType, form, isProcessing, onUpdateField }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Nombres <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.nombres}
                        onChange={(e) => onUpdateField('nombres', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Juan"
                        disabled={isProcessing}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Apellidos <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.apellidos}
                        onChange={(e) => onUpdateField('apellidos', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Pérez González"
                        disabled={isProcessing}
                    />
                </div>
            </div>

            {uploadType === 'alumnos' ? (
                <>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            RUT <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.rut}
                            onChange={(e) => onUpdateField('rut', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="12.345.678-9"
                            disabled={isProcessing}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => onUpdateField('email', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="email@ejemplo.cl"
                                disabled={isProcessing}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Área de trabajo
                            </label>
                            <select
                                value={form.curso}
                                onChange={(e) => onUpdateField('curso', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                disabled={isProcessing}
                            >
                                <option value="">Seleccionar curso</option>
                                <optgroup label="Educación Básica">
                                    <option value="1° Básico">1° Básico</option>
                                    <option value="2° Básico">2° Básico</option>
                                    <option value="3° Básico">3° Básico</option>
                                    <option value="4° Básico">4° Básico</option>
                                    <option value="5° Básico">5° Básico</option>
                                    <option value="6° Básico">6° Básico</option>
                                    <option value="7° Básico">7° Básico</option>
                                    <option value="8° Básico">8° Básico</option>
                                </optgroup>
                                <optgroup label="Educación Media">
                                    <option value="1° Medio">1° Medio</option>
                                    <option value="2° Medio">2° Medio</option>
                                    <option value="3° Medio">3° Medio</option>
                                    <option value="4° Medio">4° Medio</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => onUpdateField('email', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="usuario@colegio.cl"
                            disabled={isProcessing}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Rol
                        </label>
                        <select
                            value={form.rol}
                            onChange={(e) => onUpdateField('rol', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            disabled={isProcessing}
                        >
                            {STAFF_ROLE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {/* Info */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <User size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                    {uploadType === 'alumnos'
                        ? 'El alumno será asociado automáticamente a este colegio.'
                        : 'El usuario tendrá contraseña temporal "temporal123". Debe cambiarla en el primer inicio de sesión.'}
                </p>
            </div>
        </div>
    );
}
