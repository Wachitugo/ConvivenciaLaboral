export const compromisosIniciales = [
  {
    id: '1',
    descripcion: 'Mantener buen comportamiento durante los recreos',
    fechaInicio: '2026-01-15',
    fechaVencimiento: '2026-03-15',
    estado: 'vigente',
    casoAsociado: 'Incidente en recreo'
  },
  {
    id: '2',
    descripcion: 'Respetar turnos de palabra en clases',
    fechaInicio: '2026-01-10',
    fechaVencimiento: '2026-02-10',
    estado: 'proximo_vencer',
    casoAsociado: 'Situación en sala de clases'
  }
];

export const casosAsociadosIniciales = [
  { id: '1', titulo: 'Incidente en recreo', fecha: '15/01/2026', estado: 'Abierto' },
  { id: '2', titulo: 'Situación en sala de clases', fecha: '10/01/2026', estado: 'Cerrado' }
];

export const entrevistasAsociadasIniciales = [
  { id: '1', fecha: '12/01/2026', entrevistador: 'María González', estado: 'Autorizada' },
  { id: '2', fecha: '05/01/2026', entrevistador: 'Juan Pérez', estado: 'Pendiente' }
];

export const resumenDataInicial = {
  casosActivos: 1,
  casosCerrados: 3,
  entrevistas: 2,
  compromisosActivos: 2,
  ultimaActividad: '15/01/2026'
};

export const saludDataInicial = {
  grupoSanguineo: 'O+',
  prevision: 'Fonasa',
  alergias: ['Alergia al polen', 'Intolerancia a la lactosa'],
  alergiasMedicamentos: ['Penicilina', 'Ibuprofeno', 'Aspirina'],
  condiciones: ['Asma leve']
};

export const contactosEmergenciaIniciales = [
  { nombre: 'Pedro Rodríguez', parentesco: 'Padre', telefono: '+56 9 1234 5678', prioridad: 1 },
  { nombre: 'María Torres González', parentesco: 'Madre', telefono: '+56 9 8765 4321', prioridad: 2 },
  { nombre: 'Ana González Pérez', parentesco: 'Abuela', telefono: '+56 9 9876 5432', prioridad: 3 }
];
