import { useState, useEffect } from 'react';
import { commitmentsService } from '../../../services/api';

export function useCompromisos(studentId) {
  const [compromisos, setCompromisos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nuevoCompromiso, setNuevoCompromiso] = useState({
    descripcion: '',
    fechaVencimiento: '',
    casoAsociado: ''
  });

  const fetchCompromisos = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const data = await commitmentsService.getStudentCommitments(studentId);
      setCompromisos(data.map(item => ({
        id: item.id,
        descripcion: item.description,
        fechaVencimiento: item.due_date,
        estado: item.status,
        casoAsociado: item.case_title || 'Sin caso asociado'
      })));
    } catch (error) {
      console.error("Error fetching commitments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompromisos();
  }, [studentId]);

  const handleAgregarCompromiso = async () => {
    if (!nuevoCompromiso.descripcion || !nuevoCompromiso.fechaVencimiento) return;

    try {
      const payload = {
        student_id: studentId,
        description: nuevoCompromiso.descripcion,
        due_date: nuevoCompromiso.fechaVencimiento,
        status: 'vigente',
        case_title: nuevoCompromiso.casoAsociado || 'Sin caso asociado'
        // case_id is optional, we could add mapping if we had case IDs in the select
      };

      await commitmentsService.createCommitment(payload);

      await fetchCompromisos();
      setNuevoCompromiso({ descripcion: '', fechaVencimiento: '', casoAsociado: '' });
      setShowModal(false);
    } catch (error) {
      console.error("Error creating commitment:", error);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await commitmentsService.updateCommitment(id, { status: nuevoEstado });
      await fetchCompromisos();
    } catch (error) {
      console.error("Error updating commitment status:", error);
    }
  };

  const compromisosActivos = compromisos.filter(
    c => c.estado === 'vigente' || c.estado === 'proximo_a_vencer'
  );

  return {
    compromisos,
    compromisosActivos,
    showModal,
    setShowModal,
    nuevoCompromiso,
    setNuevoCompromiso,
    handleAgregarCompromiso,
    handleCambiarEstado,
    loading
  };
}
