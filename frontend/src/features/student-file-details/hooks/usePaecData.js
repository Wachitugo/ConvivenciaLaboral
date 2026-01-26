import { useState, useEffect } from 'react';
import { paecDataInicial } from '../constants';

export function usePaecData(student, onUpdateStudent) {
  const [paecData, setPaecData] = useState({
    ...paecDataInicial,
    diagnostico: student?.tea ? 'Trastorno del Espectro Autista (T.E.A.)' : 'Sin diagnóstico registrado'
  });

  const [editingSection, setEditingSection] = useState(null);
  const [tempData, setTempData] = useState({});
  const [newItem, setNewItem] = useState('');

  // Update local state when student prop changes
  useEffect(() => {
    if (student) {
      const savedData = student.paec_info || student.paecInfo || {};

      setPaecData({
        diagnostico: savedData.diagnostico || (student.tea ? 'Trastorno del Espectro Autista (T.E.A.)' : 'Sin diagnóstico registrado'),
        antecedentesSalud: { ...paecDataInicial.antecedentesSalud, ...savedData.antecedentesSalud },
        equipoProfesionales: savedData.equipoProfesionales || paecDataInicial.equipoProfesionales || [],
        protocolosIntervencion: savedData.protocolosIntervencion || paecDataInicial.protocolosIntervencion || [],
        intervencionCrisis: savedData.intervencionCrisis || paecDataInicial.intervencionCrisis || [],
        gatillantes: savedData.gatillantes || paecDataInicial.gatillantes || [],
        senalesEstres: savedData.senalesEstres || paecDataInicial.senalesEstres || [],
        medidasRespuesta: savedData.medidasRespuesta || paecDataInicial.medidasRespuesta || [],
        actividadesInteres: savedData.actividadesInteres || paecDataInicial.actividadesInteres || [],
        observaciones: savedData.observaciones || paecDataInicial.observaciones || []
      });
    }
  }, [student]);

  const notifyParentUpdate = (updatedPaecData) => {
    if (onUpdateStudent && student) {
      onUpdateStudent({
        ...student,
        paec_info: updatedPaecData
      });
    }
  };

  // Abrir modal de edición
  const openEditModal = (section) => {
    if (section === 'diagnostico') {
      setTempData({ diagnostico: paecData.diagnostico });
    } else if (section === 'salud') {
      setTempData({ ...paecData.antecedentesSalud });
    } else if (section === 'equipo') {
      setTempData({ equipoProfesionales: paecData.equipoProfesionales.map(p => ({ ...p })) });
    } else if (section === 'protocolos') {
      setTempData({
        protocolosIntervencion: [...paecData.protocolosIntervencion],
        intervencionCrisis: [...paecData.intervencionCrisis]
      });
    } else if (section === 'adicional') {
      setTempData({
        gatillantes: [...paecData.gatillantes],
        senalesEstres: [...paecData.senalesEstres],
        medidasRespuesta: [...paecData.medidasRespuesta],
        actividadesInteres: [...paecData.actividadesInteres]
      });
    } else if (section === 'observaciones') {
      setTempData({ observaciones: [...paecData.observaciones] });
    }
    setEditingSection(section);
  };

  // Guardar cambios
  const handleSave = () => {
    let newPaecData = { ...paecData };

    if (editingSection === 'diagnostico') {
      newPaecData.diagnostico = tempData.diagnostico;
    } else if (editingSection === 'salud') {
      newPaecData.antecedentesSalud = tempData;
    } else if (editingSection === 'equipo') {
      newPaecData.equipoProfesionales = tempData.equipoProfesionales;
    } else if (editingSection === 'protocolos') {
      newPaecData.protocolosIntervencion = tempData.protocolosIntervencion;
      newPaecData.intervencionCrisis = tempData.intervencionCrisis;
    } else if (editingSection === 'adicional') {
      newPaecData.gatillantes = tempData.gatillantes;
      newPaecData.senalesEstres = tempData.senalesEstres;
      newPaecData.medidasRespuesta = tempData.medidasRespuesta;
      newPaecData.actividadesInteres = tempData.actividadesInteres;
    } else if (editingSection === 'observaciones') {
      newPaecData.observaciones = tempData.observaciones;
    }

    setPaecData(newPaecData);
    notifyParentUpdate(newPaecData);

    setEditingSection(null);
    setNewItem('');
  };

  // Agregar item a una lista
  const addItemToList = (listName) => {
    if (newItem.trim()) {
      setTempData(prev => ({
        ...prev,
        [listName]: [...(prev[listName] || []), newItem.trim()]
      }));
      setNewItem('');
    }
  };

  // Eliminar item de una lista
  const removeItemFromList = (listName, index) => {
    setTempData(prev => ({
      ...prev,
      [listName]: prev[listName].filter((_, i) => i !== index)
    }));
  };

  // Actualizar item de una lista
  const updateListItem = (listName, index, value) => {
    setTempData(prev => ({
      ...prev,
      [listName]: prev[listName].map((item, i) => (i === index ? value : item))
    }));
  };

  // Agregar profesional
  const addProfesional = () => {
    setTempData(prev => ({
      ...prev,
      equipoProfesionales: [...prev.equipoProfesionales, { rol: '', nombre: '', responsabilidad: '' }]
    }));
  };

  // Actualizar profesional
  const updateProfesional = (index, field, value) => {
    setTempData(prev => ({
      ...prev,
      equipoProfesionales: prev.equipoProfesionales.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  // Eliminar profesional
  const removeProfesional = (index) => {
    setTempData(prev => ({
      ...prev,
      equipoProfesionales: prev.equipoProfesionales.filter((_, i) => i !== index)
    }));
  };

  return {
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
  };
}
