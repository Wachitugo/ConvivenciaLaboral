import React, { useState } from 'react';
import { User, Mail, CreditCard, GraduationCap, Edit, Cake, Briefcase, CalendarDays } from 'lucide-react';
import { calcularEdad, parseLocalDate } from '../utils';
import EditStudentModal from './EditStudentModal';

function PersonalInfoCard({ student, onUpdateStudent, canEdit = true }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fechaNacimiento = student.fecha_nacimiento || student.fechaNacimiento;
    const edad = calcularEdad(fechaNacimiento);

    const handleSaveStudent = (updatedStudent) => {
        if (onUpdateStudent) {
            onUpdateStudent(updatedStudent);
        }
    };

    return (
        <div className="flex flex-col bg-[#0A3866]/40 backdrop-blur-md overflow-hidden rounded-xl border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.2)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0 gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <User size={18} className="text-[#34B6D8] flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,182,216,0.6)] sm:w-5 sm:h-5" />
                        <span className="truncate">Información Personal</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-white/60 mt-0.5 truncate">
                        <span className="hidden sm:inline">Datos del trabajador</span>
                        <span className="sm:hidden">Datos personales</span>
                    </p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-bold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors shadow-sm flex-shrink-0"
                    >
                        <Edit size={14} />
                        <span className="hidden sm:inline">Editar</span>
                    </button>
                )}
            </div>

            {/* Contenido */}
            <div className="p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">

                    {/* Nombre */}
                    <div className="col-span-1 sm:col-span-2 bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <User size={10} className="text-[#34B6D8]" /> Nombre Completo
                        </p>
                        <p className="font-bold text-white text-sm sm:text-base truncate">{student.nombres} {student.apellidos}</p>
                    </div>

                    {/* RUT */}
                    <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <CreditCard size={10} className="text-[#34B6D8]" /> RUT
                        </p>
                        <p className="font-bold text-white text-sm">{student.rut || <span className="text-white/30">No registrado</span>}</p>
                    </div>

                    {/* Área de trabajo */}
                    <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <GraduationCap size={10} className="text-[#34B6D8]" /> Área de trabajo
                        </p>
                        {student.curso ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#1A71B8]/20 text-[#34B6D8] border border-[#1A71B8]/40">
                                {student.curso}
                            </span>
                        ) : (
                            <p className="font-bold text-white/30 text-sm">No registrado</p>
                        )}
                    </div>

                    {/* Género */}
                    <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <User size={10} className="text-[#34B6D8]" /> Género
                        </p>
                        <p className="font-bold text-sm">{student.genero ? <span className="text-white">{student.genero}</span> : <span className="text-white/30">No registrado</span>}</p>
                    </div>

                    {/* Email */}
                    <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <Mail size={10} className="text-[#34B6D8]" /> Email
                        </p>
                        {student.email ? (
                            <a href={`mailto:${student.email}`} className="font-bold text-[#34B6D8] hover:underline text-sm truncate block">
                                {student.email}
                            </a>
                        ) : (
                            <p className="font-bold text-white/30 text-sm">No registrado</p>
                        )}
                    </div>

                    {/* Fecha Nacimiento */}
                    <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <Cake size={10} className="text-[#34B6D8]" /> Nacimiento
                        </p>
                        {fechaNacimiento ? (
                            <p className="font-bold text-white text-sm">
                                {parseLocalDate(fechaNacimiento)?.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) || 'Fecha inválida'}
                            </p>
                        ) : (
                            <p className="font-bold text-white/30 text-sm">No registrado</p>
                        )}
                    </div>

                    {/* Edad */}
                    <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Edad</p>
                        {edad !== null ? (
                            <p className="font-bold text-white text-sm">{edad} años</p>
                        ) : (
                            <p className="font-bold text-white/30 text-sm">—</p>
                        )}
                    </div>

                    {/* Fecha Ingreso */}
                    <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <CalendarDays size={10} className="text-[#34B6D8]" /> Fecha de Ingreso
                        </p>
                        {student.fecha_ingreso ? (
                            <p className="font-bold text-white text-sm">
                                {parseLocalDate(student.fecha_ingreso)?.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) || student.fecha_ingreso}
                            </p>
                        ) : (
                            <p className="font-bold text-white/30 text-sm">No registrado</p>
                        )}
                    </div>

                    {/* Profesión */}
                    <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <Briefcase size={10} className="text-[#34B6D8]" /> Profesión u Oficio
                        </p>
                        <p className="font-bold text-sm">{student.profesion ? <span className="text-white">{student.profesion}</span> : <span className="text-white/30">No registrado</span>}</p>
                    </div>

                    {/* Cargo */}
                    <div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <Briefcase size={10} className="text-[#34B6D8]" /> Cargo
                        </p>
                        <p className="font-bold text-sm">{student.cargo ? <span className="text-white">{student.cargo}</span> : <span className="text-white/30">No registrado</span>}</p>
                    </div>

                </div>
            </div>

            <EditStudentModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveStudent}
                student={student}
            />
        </div>
    );
}

export default PersonalInfoCard;
