import React, { useState } from 'react';
import { User, Mail, CreditCard, GraduationCap, Edit, Camera, Cake, Phone } from 'lucide-react';
import { calcularEdad, getInitials, parseLocalDate } from '../utils';
import EditStudentModal from './EditStudentModal';

function PersonalInfoCard({ student, onUpdateStudent, canEdit = true }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fechaNacimiento = student.fecha_nacimiento || student.fechaNacimiento;
    const edad = calcularEdad(fechaNacimiento);
    const initials = getInitials(student.nombres, student.apellidos);

    const handleSaveStudent = (updatedStudent) => {
        if (onUpdateStudent) {
            onUpdateStudent(updatedStudent);
        }
    };

    return (
        <div className="flex flex-col bg-white overflow-hidden rounded-xl border-2 border-gray-300 shadow-sm">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <User size={18} className="text-blue-600 flex-shrink-0 sm:w-5 sm:h-5" />
                        <span className="truncate">Información Personal</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                        <span className="hidden sm:inline">Datos del trabajador</span>
                        <span className="sm:hidden">Datos personales</span>
                    </p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex-shrink-0"
                    >
                        <Edit size={14} />
                        <span className="hidden sm:inline">Editar</span>
                    </button>
                )}
            </div>

            {/* Contenido */}
            <div className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">

                    {/* Info Grid */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                        {/* Nombre */}
                        <div className="col-span-1 sm:col-span-2 bg-gray-100 p-2.5 sm:p-3 rounded-lg shadow-sm">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Nombre Completo</p>
                            <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{student.nombres} {student.apellidos}</p>
                        </div>

                        {/* RUT */}
                        <div className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                                <CreditCard size={10} className="text-blue-500" /> RUT
                            </p>
                            <p className="font-medium text-gray-900 text-sm">{student.rut}</p>
                        </div>

                        {/* Curso */}
                        <div className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                                <GraduationCap size={10} className="text-blue-500" /> Área de trabajo
                            </p>
                            {student.curso ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                                    {student.curso}
                                </span>
                            ) : (
                                <p className="font-medium text-gray-400 text-sm">No registrado</p>
                            )}
                        </div>

                        {/* Género */}
                        <div className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                                <User size={10} className="text-blue-500" /> Género
                            </p>
                            {student.genero ? (
                                <p className="font-medium text-gray-900 text-sm">{student.genero}</p>
                            ) : (
                                <p className="font-medium text-gray-400 text-sm">No registrado</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                                <Mail size={10} className="text-blue-500" /> Email
                            </p>
                            {student.email ? (
                                <a href={`mailto:${student.email}`} className="font-medium text-blue-600 hover:underline text-sm truncate block">
                                    {student.email}
                                </a>
                            ) : (
                                <p className="font-medium text-gray-400 text-sm">No registrado</p>
                            )}
                        </div>

                        {/* Fecha Nacimiento */}
                        <div className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                                <Cake size={10} className="text-blue-500" /> Nacimiento
                            </p>
                            {fechaNacimiento ? (
                                <p className="font-medium text-gray-900 text-sm">
                                    {parseLocalDate(fechaNacimiento)?.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) || 'Fecha inválida'}
                                </p>
                            ) : (
                                <p className="font-medium text-gray-400 text-sm">No registrado</p>
                            )}
                        </div>

                        {/* Edad */}
                        <div className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Edad</p>
                            {edad !== null ? (
                                <p className="font-semibold text-gray-900">{edad} años</p>
                            ) : (
                                <p className="font-medium text-gray-400 text-sm">-</p>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            <EditStudentModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveStudent}
                student={student}
            />
        </div >
    );
}

export default PersonalInfoCard;
