import { CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';

export const getEstadoCompromiso = (estado) => {
  switch (estado) {
    case 'vigente':
      return { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Vigente' };
    case 'proximo_vencer':
      return { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Próximo a vencer' };
    case 'incumplido':
      return { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle, label: 'Incumplido' };
    case 'cumplido':
      return { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle, label: 'Cumplido' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', icon: FileText, label: 'Sin estado' };
  }
};
