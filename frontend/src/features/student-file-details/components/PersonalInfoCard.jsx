import React, { useState } from 'react';
import { User, Mail, CreditCard, GraduationCap, Edit, Camera, Cake, Phone } from 'lucide-react';
import { calcularEdad, getInitials, parseLocalDate } from '../utils';
import EditStudentModal from './EditStudentModal';

function PersonalInfoCard({ student, onUpdateStudent, canEdit = true, canEditPrograms = true }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [programs, setPrograms] = useState({
        tea: student.tea || false,
        pie: student.pie || false,
        paec: student.paec || false
    });

    // Handle both snake_case (API) and camelCase (legacy/frontend-only) keys
    const fechaNacimiento = student.fecha_nacimiento || student.fechaNacimiento;
    const edad = calcularEdad(fechaNacimiento);
    const initials = getInitials(student.nombres, student.apellidos);
    const apoderadoNombre = student.apoderado_nombre || student.nombreApoderado;
    const apoderadoTelefono = student.apoderado_telefono || student.telefonoApoderado;

    const handleToggleProgram = (program) => {
        if (!canEditPrograms) return;
        const newPrograms = { ...programs, [program]: !programs[program] };
        setPrograms(newPrograms);
        if (onUpdateStudent) onUpdateStudent({ ...student, ...newPrograms });
    };

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
                        <span className="hidden sm:inline">Datos del estudiante y contacto de apoderado</span>
                        <span className="sm:hidden">Datos y contacto</span>
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
                                <GraduationCap size={10} className="text-blue-500" /> Curso
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

                        {/* Apoderado */}
                        <div className="bg-gray-100 p-2.5 sm:p-3 rounded-lg">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                                <User size={10} className="text-blue-500" /> Apoderado
                            </p>
                            <p className="font-medium text-gray-900 text-sm truncate">{apoderadoNombre || 'No registrado'}</p>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />


                {/* Programas */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <p className="text-xs font-medium text-gray-500 uppercase">Programas:</p>

                        {[
                            { key: 'tea', label: 'TEA', active: programs.tea },
                            { key: 'pie', label: 'PIE', active: programs.pie },
                            { key: 'paec', label: 'PAEC', active: programs.paec }
                        ].map(({ key, label, active }) => (
                            <label key={key} className={`flex items-center gap-2 ${canEditPrograms ? 'cursor-pointer' : 'cursor-default'}`}>
                                <div
                                    onClick={() => canEditPrograms && handleToggleProgram(key)}
                                    className={`w-8 h-4 rounded-full transition-colors flex items-center ${canEditPrograms ? 'cursor-pointer' : 'cursor-default opacity-60'} ${active ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'}`}
                                >
                                    <div className="w-3 h-3 bg-white rounded-full shadow-sm mx-0.5"></div>
                                </div>
                                <span className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-500'}`}>{label}</span>
                            </label>
                        ))}
                    </div>

                    <div className="sm:ml-auto flex items-center gap-1.5">
                        <Phone size={12} className="text-blue-500" />
                        <a href={`tel:${apoderadoTelefono}`} className="text-sm font-medium text-blue-600 hover:underline">
                            {apoderadoTelefono || 'No registrado'}
                        </a>
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
