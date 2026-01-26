import React, { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import EditStudentModal from '../../student-file-details/components/EditStudentModal';

/**
 * Tabla de alumnos del colegio con funcionalidad de edición
 */
export default function StudentsTable({ students, onUpdateStudent, onDeleteStudent }) {
    const [editingStudent, setEditingStudent] = useState(null);

    const handleSaveStudent = (updatedStudent) => {
        if (onUpdateStudent) {
            onUpdateStudent(updatedStudent);
        }
        setEditingStudent(null);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Alumno</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">RUT</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Curso</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Programas</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                        {student.nombres?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{student.nombres} {student.apellidos}</p>
                                        {student.email && <p className="text-xs text-gray-500">{student.email}</p>}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{student.rut || '-'}</td>
                            <td className="px-6 py-4">
                                {student.curso ? (
                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                        {student.curso}
                                    </span>
                                ) : (
                                    <span className="text-gray-400 text-sm">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex gap-1.5">
                                    {student.tea && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">TEA</span>}
                                    {student.pie && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">PIE</span>}
                                    {student.paec && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">PAEC</span>}
                                    {!student.tea && !student.pie && !student.paec && <span className="text-gray-400 text-sm">-</span>}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2 transition-opacity duration-200">
                                    <button
                                        onClick={() => setEditingStudent(student)}
                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors tooltip"
                                        title="Editar alumno"
                                    >
                                        <Edit className="w-5 h-5" strokeWidth={1.5} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('¿Estás seguro que deseas eliminar este estudiante? Esta acción no se puede deshacer.')) {
                                                onDeleteStudent(student.id);
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar alumno"
                                    >
                                        <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                <p className="text-xs text-gray-500">
                    Mostrando <span className="font-medium text-gray-900">{students.length}</span> alumnos
                </p>
            </div>

            {/* Modal de edición - sin sección de apoderado */}
            <EditStudentModal
                isOpen={!!editingStudent}
                onClose={() => setEditingStudent(null)}
                onSave={handleSaveStudent}
                student={editingStudent}
                showApoderado={false}
            />
        </div>
    );
}
