import { useState, useEffect } from 'react';
import { FileText, AlertTriangle, FolderOpen, MessageSquare, Edit, BarChart3, Calendar, Clock } from 'lucide-react';
import { studentsService } from '../../../services/api';

function ResumenTab({ student }) {
    const [resumenData, setResumenData] = useState({
        casosActivos: 0,
        casosCerrados: 0,
        entrevistas: 0,
        compromisosActivos: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (student?.id) {
                try {
                    const stats = await studentsService.getStudentStats(student.id);
                    setResumenData(stats);
                } catch (error) {
                    console.error("Error fetching student stats:", error);
                }
            }
        };
        fetchStats();
    }, [student]);

    return (
        <div className="space-y-3">



            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border-2 border-gray-300 shadow-md p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FolderOpen size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${resumenData.casosActivos > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                                {resumenData.casosActivos}
                            </p>
                            <p className="text-sm text-gray-500">Casos Activos</p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Casos cerrados</span>
                            <span className="font-medium text-gray-700">{resumenData.casosCerrados}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border-2 border-gray-300 shadow-md p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                            <MessageSquare size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{resumenData.entrevistas}</p>
                            <p className="text-sm text-gray-500">Entrevistas</p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Total realizadas</span>
                            <span className="font-medium text-gray-700">{resumenData.entrevistas}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border-2 border-gray-300 shadow-md p-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${resumenData.compromisosActivos > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
                            <AlertTriangle size={24} className={resumenData.compromisosActivos > 0 ? 'text-amber-600' : 'text-gray-400'} />
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${resumenData.compromisosActivos > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                                {resumenData.compromisosActivos}
                            </p>
                            <p className="text-sm text-gray-500">Compromisos</p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Estado</span>
                            <span className={`font-medium ${resumenData.compromisosActivos > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                {resumenData.compromisosActivos > 0 ? 'Pendientes' : 'Sin pendientes'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white rounded-xl border-2 border-gray-300 shadow-md p-4">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Resumen de todo lo existente en la ficha aun en proceso</h3>


            </div>
        </div>
    );
}

export default ResumenTab;
