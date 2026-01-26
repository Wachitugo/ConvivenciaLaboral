import { useState, useEffect } from 'react';
import { saludDataInicial, contactosEmergenciaIniciales } from '../constants';

export function useSaludData(student, onUpdateStudent) {
  // Initialize state from student prop or fallback to initial defaults
  const [saludData, setSaludData] = useState({
    grupoSanguineo: student?.grupo_sanguineo || student?.grupoSanguineo || '-',
    prevision: student?.prevision || 'Fonasa',
    alergias: student?.alergias || [],
    condiciones: student?.condiciones_medicas || student?.condiciones || [],
    alergiasMedicamentos: student?.alergias_medicamentos || student?.alergiasMedicamentos || []
  });

  // Helper to merge Guardian into contacts
  const mergeGuardianIntoContacts = (existingContacts, studentData) => {
    if (!studentData?.apoderado_nombre && !studentData?.nombreApoderado) return existingContacts || [];

    const guardianName = studentData.apoderado_nombre || studentData.nombreApoderado;
    const guardianPhone = studentData.apoderado_telefono || studentData.telefonoApoderado || '';

    let contacts = [...(existingContacts || [])];

    // Find index of existing guardian (match by name or explicit Apoderado relationship)
    const index = contacts.findIndex(c =>
      c.nombre?.toLowerCase() === guardianName?.toLowerCase() ||
      (c.nombre === guardianName && c.parentesco === 'Apoderado')
    );

    const guardianContact = {
      nombre: guardianName,
      parentesco: 'Apoderado',
      telefono: guardianPhone,
      prioridad: 1
    };

    if (index !== -1) {
      // Update existing contact ensuring data is fresh
      contacts[index] = { ...contacts[index], ...guardianContact };
    } else {
      // Add new
      contacts = [guardianContact, ...contacts];
    }

    return contacts;
  };

  const [contactosEmergencia, setContactosEmergencia] = useState(
    mergeGuardianIntoContacts(
      student?.contactos_emergencia || student?.contactosEmergencia || contactosEmergenciaIniciales,
      student
    )
  );

  const [editingSection, setEditingSection] = useState(null);
  const [tempGeneral, setTempGeneral] = useState({});
  const [tempAlergias, setTempAlergias] = useState({});
  const [tempContactos, setTempContactos] = useState([]);
  const [newItem, setNewItem] = useState('');

  // Update local state when student prop changes (e.g. after refresh or parent update)
  useEffect(() => {
    if (student) {
      setSaludData({
        grupoSanguineo: student.grupo_sanguineo || student.grupoSanguineo || '-',
        prevision: student.prevision || 'Fonasa',
        alergias: student.alergias || [],
        condiciones: student.condiciones_medicas || student.condiciones || [],  // Map backend key
        alergiasMedicamentos: student.alergias_medicamentos || student.alergiasMedicamentos || [] // Map backend key
      });

      const contacts = student.contactos_emergencia || student.contactosEmergencia || [];
      setContactosEmergencia(mergeGuardianIntoContacts(contacts, student));
    }
  }, [student]);

  const notifyParentUpdate = (updatedFields) => {
    if (onUpdateStudent && student) {
      // Flatten structure for backend update
      // backend expects: grupo_sanguineo, prevision, alergias, condiciones_medicas, alergias_medicamentos, contactos_emergencia
      const backendPayload = {};

      if (updatedFields.grupoSanguineo !== undefined) backendPayload.grupo_sanguineo = updatedFields.grupoSanguineo;
      if (updatedFields.prevision !== undefined) backendPayload.prevision = updatedFields.prevision;

      if (updatedFields.alergias !== undefined) backendPayload.alergias = updatedFields.alergias;
      if (updatedFields.condiciones !== undefined) backendPayload.condiciones_medicas = updatedFields.condiciones;
      if (updatedFields.alergiasMedicamentos !== undefined) backendPayload.alergias_medicamentos = updatedFields.alergiasMedicamentos;

      if (updatedFields.contactosEmergencia !== undefined) backendPayload.contactos_emergencia = updatedFields.contactosEmergencia;

      onUpdateStudent({ ...student, ...backendPayload });
    }
  };

  // Abrir modal de edición
  const openEditModal = (section) => {
    if (section === 'general') {
      setTempGeneral({
        grupoSanguineo: saludData.grupoSanguineo,
        prevision: saludData.prevision
      });
    } else if (section === 'alergias') {
      setTempAlergias({
        alergias: [...saludData.alergias],
        condiciones: [...saludData.condiciones],
        alergiasMedicamentos: [...saludData.alergiasMedicamentos]
      });
    } else if (section === 'contactos') {
      setTempContactos(contactosEmergencia.map(c => ({ ...c })));
    }
    setEditingSection(section);
  };

  // Guardar cambios
  const handleSave = () => {
    let updatedData = {};
    if (editingSection === 'general') {
      const newGeneral = { ...saludData, ...tempGeneral };
      setSaludData(newGeneral);
      updatedData = newGeneral; // Contains grupoSanguineo, prevision
    } else if (editingSection === 'alergias') {
      const newAlergias = { ...saludData, ...tempAlergias };
      setSaludData(newAlergias);
      updatedData = newAlergias; // Contains alergias, condiciones, alergiasMedicamentos
    } else if (editingSection === 'contactos') {
      setContactosEmergencia(tempContactos);
      updatedData = { contactosEmergencia: tempContactos };
    }

    notifyParentUpdate(updatedData);
    setEditingSection(null);
    setNewItem('');
  };

  // Agregar item a una lista
  const addItemToList = (listName) => {
    if (newItem.trim()) {
      setTempAlergias(prev => ({
        ...prev,
        [listName]: [...prev[listName], newItem.trim()]
      }));
      setNewItem('');
    }
  };

  // Eliminar item de una lista
  const removeItemFromList = (listName, index) => {
    setTempAlergias(prev => ({
      ...prev,
      [listName]: prev[listName].filter((_, i) => i !== index)
    }));
  };

  // Actualizar contacto
  const updateContacto = (index, field, value) => {
    setTempContactos(prev =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  // Agregar nuevo contacto
  const addContacto = () => {
    setTempContactos(prev => [
      ...prev,
      {
        nombre: '',
        parentesco: '',
        telefono: '',
        prioridad: prev.length + 1
      }
    ]);
  };

  // Eliminar contacto
  const removeContacto = (index) => {
    setTempContactos(prev =>
      prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, prioridad: i + 1 }))
    );
  };

  const closeModal = () => {
    setEditingSection(null);
    setNewItem('');
  };

  return {
    saludData,
    contactosEmergencia,
    editingSection,
    setEditingSection,
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
  };
}
