import React from 'react';
import { Heart, Phone, AlertCircle, Edit, Stethoscope, Droplet, Shield } from 'lucide-react';
import { useSaludData } from '../hooks';
import { GeneralModal, AlergiasModal, ContactosModal } from '../components/salud-modals';

function SaludFamiliaTab({ student, onUpdateStudent, canEdit = true }) {
    const {
        saludData,
        contactosEmergencia,
        editingSection,
        tempGeneral,
        setTempGeneral,
        tempAlergias,
        setTempAlergias,
        tempContactos,
        newItem,
        setNewItem,
        openEditModal,
        handleSave,
        addItemToList,
        removeItemFromList,
        updateContacto,
        addContacto,
        removeContacto,
        closeModal
    } = useSaludData(student, onUpdateStudent);

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden rounded-xl shadow-sm">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Heart size={18} className="text-blue-600 flex-shrink-0 sm:w-5 sm:h-5" />
                        Salud y Emergencias
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Información médica y contactos de emergencia
                    </p>
                </div>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-auto p-3 sm:p-4">

                {/* Datos básicos */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                            <Stethoscope size={14} className="text-blue-500 flex-shrink-0 sm:w-4 sm:h-4" />
                            Información General
                        </h4>
                        {canEdit && (
                            <button
                                onClick={() => openEditModal('general')}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs sm:text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Edit size={14} />
                                <span className="hidden sm:inline">Editar</span>
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <Droplet size={14} className="text-blue-500" />
                                <span className="text-xs font-medium text-gray-500 uppercase">Grupo Sanguíneo</span>
                            </div>
                            <p className="font-bold text-gray-900 text-lg sm:text-xl">{saludData.grupoSanguineo}</p>
                        </div>
                        <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <Shield size={14} className="text-blue-500" />
                                <span className="text-xs font-medium text-gray-500 uppercase">Previsión</span>
                            </div>
                            <p className="font-bold text-gray-900 text-lg sm:text-xl">{saludData.prevision}</p>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />

                {/* Alergias y Condiciones */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                            <AlertCircle size={14} className="text-blue-500 flex-shrink-0 sm:w-4 sm:h-4" />
                            Alergias y Condiciones
                        </h4>
                        {canEdit && (
                            <button
                                onClick={() => openEditModal('alergias')}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs sm:text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Edit size={14} />
                                <span className="hidden sm:inline">Editar</span>
                            </button>
                        )}
                    </div>
                    <div className="space-y-3">
                        {/* Alergias */}
                        {saludData.alergias.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Alergias</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {saludData.alergias.map((alergia, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                                            {alergia}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Condiciones Médicas */}
                        {saludData.condiciones.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Condiciones Médicas</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {saludData.condiciones.map((cond, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                                            {cond}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Alergias a Medicamentos */}
                        {saludData.alergiasMedicamentos.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Alérgico a Medicamentos</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {saludData.alergiasMedicamentos.map((med, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                                            {med}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Estado vacío */}
                        {saludData.alergias.length === 0 && saludData.condiciones.length === 0 && saludData.alergiasMedicamentos.length === 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <p className="text-sm text-gray-500">No hay alergias ni condiciones registradas</p>
                            </div>
                        )}
                    </div>
                </div>

                <hr className="border-gray-200 my-3 sm:my-4 -mx-3 sm:-mx-4" />

                {/* Contactos de Emergencia */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                            <Phone size={14} className="text-blue-500 flex-shrink-0 sm:w-4 sm:h-4" />
                            Contactos de Emergencia
                        </h4>
                        {canEdit && (
                            <button
                                onClick={() => openEditModal('contactos')}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs sm:text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Edit size={14} />
                                <span className="hidden sm:inline">Editar</span>
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {contactosEmergencia.map((contacto, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-gray-50 border border-gray-200">
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${contacto.prioridad === 1
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {contacto.prioridad}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{contacto.nombre}</p>
                                    <p className="text-xs text-gray-500">{contacto.parentesco}</p>
                                    <p className="text-xs text-gray-600 font-medium mt-0.5">{contacto.telefono}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal de Edición - Información General */}
            {editingSection === 'general' && (
                <GeneralModal
                    tempGeneral={tempGeneral}
                    setTempGeneral={setTempGeneral}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}

            {/* Modal de Edición - Alergias y Condiciones */}
            {editingSection === 'alergias' && (
                <AlergiasModal
                    tempAlergias={tempAlergias}
                    setTempAlergias={setTempAlergias}
                    newItem={newItem}
                    setNewItem={setNewItem}
                    addItemToList={addItemToList}
                    removeItemFromList={removeItemFromList}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}

            {/* Modal de Edición - Contactos de Emergencia */}
            {editingSection === 'contactos' && (
                <ContactosModal
                    tempContactos={tempContactos}
                    updateContacto={updateContacto}
                    addContacto={addContacto}
                    removeContacto={removeContacto}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

export default SaludFamiliaTab;
