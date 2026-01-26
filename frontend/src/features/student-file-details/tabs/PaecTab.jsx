import React from 'react';
import { ClipboardList, Shield } from 'lucide-react';
import { usePaecData } from '../hooks';
import {
    DiagnosticoModal,
    SaludModal,
    EquipoModal,
    ProtocolosModal,
    AdicionalModal,
    ObservacionesModal
} from '../components/paec-modals';
import {
    DiagnosticoSection,
    SaludSection,
    EquipoSection,
    ProtocolosSection,
    InfoAdicionalSection,
    ObservacionesSection
} from '../components/paec-sections';

function PaecTab({ student, onUpdateStudent, canEdit = true }) {
    const hasPaec = student.tea || student.paec;

    const {
        paecData,
        editingSection,
        setEditingSection,
        tempData,
        setTempData,
        newItem,
        setNewItem,
        openEditModal,
        handleSave,
        addItemToList,
        removeItemFromList,
        updateListItem,
        addProfesional,
        updateProfesional,
        removeProfesional
    } = usePaecData(student, onUpdateStudent);

    // Estado cuando no hay PAEC
    if (!hasPaec) {
        return (
            <div className="p-6 sm:p-8 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-center">
                <ClipboardList size={36} className="text-gray-300 mx-auto mb-3 sm:w-10 sm:h-10" />
                <h4 className="text-sm sm:text-base font-medium text-gray-600 mb-1">Sin ficha PAEC</h4>
                <p className="text-xs sm:text-sm text-gray-400 mb-4">
                    Este alumno no está registrado en el Programa PAEC.
                </p>
                {canEdit && (
                    <button
                        onClick={() => onUpdateStudent && onUpdateStudent({ ...student, paec: true })}
                        className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm sm:text-base font-medium transition-colors"
                    >
                        Crear ficha PAEC
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden rounded-xl shadow-sm">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Shield size={18} className="text-blue-600 flex-shrink-0 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Plan de Acompañamiento Emocional y Conductual</span>
                        <span className="sm:hidden">Ficha PAEC</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        <span className="hidden sm:inline">Recuperación del estado emocional y conductual del estudiante</span>
                        <span className="sm:hidden">Acompañamiento emocional y conductual</span>
                    </p>
                </div>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-auto p-3 sm:p-4">
                <DiagnosticoSection
                    diagnostico={paecData.diagnostico}
                    onEdit={canEdit ? () => openEditModal('diagnostico') : undefined}
                />

                <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />

                <SaludSection
                    antecedentesSalud={paecData.antecedentesSalud}
                    onEdit={canEdit ? () => openEditModal('salud') : undefined}
                />

                <hr className="border-gray-200 my-4" />

                <EquipoSection
                    equipoProfesionales={paecData.equipoProfesionales}
                    onEdit={canEdit ? () => openEditModal('equipo') : undefined}
                />

                <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />

                <ProtocolosSection
                    protocolosIntervencion={paecData.protocolosIntervencion}
                    intervencionCrisis={paecData.intervencionCrisis}
                    onEdit={canEdit ? () => openEditModal('protocolos') : undefined}
                />

                <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />

                <InfoAdicionalSection
                    gatillantes={paecData.gatillantes}
                    senalesEstres={paecData.senalesEstres}
                    medidasRespuesta={paecData.medidasRespuesta}
                    actividadesInteres={paecData.actividadesInteres}
                    onEdit={canEdit ? () => openEditModal('adicional') : undefined}
                />

                <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />

                <ObservacionesSection
                    observaciones={paecData.observaciones}
                    onEdit={canEdit ? () => openEditModal('observaciones') : undefined}
                />
            </div>

            {/* Modales */}
            {editingSection === 'diagnostico' && (
                <DiagnosticoModal
                    tempData={tempData}
                    setTempData={setTempData}
                    onClose={() => setEditingSection(null)}
                    onSave={handleSave}
                />
            )}

            {editingSection === 'salud' && (
                <SaludModal
                    tempData={tempData}
                    setTempData={setTempData}
                    onClose={() => setEditingSection(null)}
                    onSave={handleSave}
                />
            )}

            {editingSection === 'equipo' && (
                <EquipoModal
                    tempData={tempData}
                    updateProfesional={updateProfesional}
                    removeProfesional={removeProfesional}
                    addProfesional={addProfesional}
                    onClose={() => setEditingSection(null)}
                    onSave={handleSave}
                />
            )}

            {editingSection === 'protocolos' && (
                <ProtocolosModal
                    tempData={tempData}
                    setTempData={setTempData}
                    updateListItem={updateListItem}
                    removeItemFromList={removeItemFromList}
                    newItem={newItem}
                    setNewItem={setNewItem}
                    addItemToList={addItemToList}
                    onClose={() => setEditingSection(null)}
                    onSave={handleSave}
                />
            )}

            {editingSection === 'adicional' && (
                <AdicionalModal
                    tempData={tempData}
                    setTempData={setTempData}
                    removeItemFromList={removeItemFromList}
                    onClose={() => setEditingSection(null)}
                    onSave={handleSave}
                />
            )}

            {editingSection === 'observaciones' && (
                <ObservacionesModal
                    tempData={tempData}
                    setTempData={setTempData}
                    updateListItem={updateListItem}
                    removeItemFromList={removeItemFromList}
                    onClose={() => setEditingSection(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

export default PaecTab;
