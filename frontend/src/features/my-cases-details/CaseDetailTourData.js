// Tour data for CaseDetailTour
// Each key corresponds to a tour ID. Tours with multiple steps guide the user
// through specific sub-elements within each tab.

export const TOURS = {
  general: [
    {
      id: 'general-welcome',
      title: 'Vista General del Expediente',
      description: 'Aquí puedes ver toda la información de alto nivel de este caso. Te guiaremos por las acciones principales y la información crítica del expediente.',
      target: null,
      badge: 'Bienvenida',
    },
    {
      id: 'general-info',
      title: 'Datos Principales',
      description: 'Esta sección muestra el título del expediente, su estado actual, la fecha de creación y el protocolo sugerido por la plataforma.',
      target: 'general-info',
      badge: 'Información',
    },
    {
      id: 'general-actions',
      title: 'Acciones del Expediente',
      description: 'Desde aquí puedes Exportar el expediente a PDF, chatear con el asistente IA sobre este caso en particular, editar los datos básicos o eliminar el caso si tienes permisos.',
      target: 'case-actions',
      badge: 'Acciones',
    },
    {
      id: 'general-tabs',
      title: 'Navegación Detallada',
      description: 'El expediente se divide en varias pestañas especializadas. Haz clic en cualquiera de ellas para ver resúmenes IA, involucrados, cronologías, etc. Puedes abrir el menú de ayuda nuevamente para tomar un recorrido específico por cada pestaña.',
      target: 'tabs-header',
      badge: 'Pestañas',
    },
  ],

  resumen: [
    {
      id: 'resumen-intro',
      title: 'Resumen Inteligente',
      description: 'Esta pestaña es generada automáticamente por nuestra IA. Analiza todos los documentos, testimonios y datos cargados para darte una visión clara, neutral y actualizada del caso en segundos.',
      target: 'content-resumen',
      badge: 'Resumen IA',
    },
    {
      id: 'resumen-header',
      title: 'Encabezado del Resumen',
      description: 'Aquí aparece el título de la sección y el botón para generar o actualizar el análisis. Cada vez que subas un nuevo documento, puedes regenerar el resumen para que la IA incorpore esa nueva información.',
      target: 'resumen-header',
      badge: 'Panel',
    },
    {
      id: 'resumen-generate',
      title: 'Botón "Generar"',
      description: 'Al presionar este botón, la IA analiza todos los documentos del expediente y produce un resumen estructurado del caso. El proceso tarda algunos segundos. Puedes regenerarlo cuantas veces necesites cuando haya nueva información.',
      target: 'resumen-generate-btn',
      badge: 'Acción',
    },
    {
      id: 'resumen-content',
      title: 'Descripción Generada',
      description: 'Aquí se muestra el texto del análisis: una descripción objetiva del caso, los hechos relevantes identificados y el nivel de riesgo estimado. Este contenido queda guardado y se puede exportar junto al expediente en PDF.',
      target: 'resumen-description',
      badge: 'Contenido IA',
    },
  ],

  protocolo: [
    {
      id: 'protocolo-intro',
      title: 'Protocolo de Actuación',
      description: 'Esta pestaña organiza el proceso legal en pasos concretos y ordenados según la normativa vigente — Ley Karin u otros protocolos aplicables. Cada paso indica qué acción tomar, en qué plazo y si ya fue cumplida.',
      target: null,
      badge: 'Protocolo',
    },
    {
      id: 'protocolo-header',
      title: 'Progreso y Herramientas',
      description: 'El encabezado muestra el avance real del expediente: cuántos pasos están completados sobre el total (ej. 2/7).\n\nEl botón "Regenerar" le solicita a la IA que actualice el protocolo si el caso ha cambiado — útil cuando se agregan nuevos documentos o involucrados.',
      target: 'protocolo-header',
      badge: 'Encabezado',
    },
    {
      id: 'protocolo-step-0',
      title: 'Así funciona cada paso',
      description: 'Cada tarjeta muestra una acción legal con su título, descripción, estado actual y el plazo estimado según normativa.\n\nSi un paso está pendiente, aparece el botón "Completar". Al pulsarlo puedes registrar notas, adjuntar documentos de respaldo y confirmar el cumplimiento. El progreso del encabezado se actualiza al instante.\n\nPuedes interactuar con este paso ahora mismo si lo deseas.',
      target: 'protocolo-step-0',
      badge: 'Pasos',
      allowInteraction: true,
    },
  ],

  involucrados: [
    {
      id: 'involucrados-intro',
      title: 'Gestión de Involucrados',
      description: 'En esta pestaña administras a todas las personas relacionadas con el caso: denunciantes, denunciados, testigos u otras partes. Cada persona queda vinculada al expediente con su rol y sus datos.',
      target: 'content-involucrados',
      badge: 'Personas',
    },
    {
      id: 'involucrados-header',
      title: 'Panel de Involucrados',
      description: 'El encabezado muestra cuántas personas hay actualmente en el caso. Esta cifra se actualiza en tiempo real al agregar o eliminar involucrados.',
      target: 'involucrados-header',
      badge: 'Resumen',
    },
    {
      id: 'involucrados-add',
      title: 'Agregar Persona',
      description: 'Al hacer clic en "Agregar" se despliega un formulario emergente. Puedes buscar a la persona en la base de datos de tu institución o ingresarla manualmente con su nombre, RUT, cargo y rol en el caso (denunciante, denunciado, testigo, etc.).',
      target: 'involucrados-add-btn',
      badge: 'Acción',
    },
    {
      id: 'involucrados-table',
      title: 'Lista de Involucrados',
      description: 'Aquí ves la tabla con todos los involucrados: nombre, rol, cargo y opciones para editar o eliminar. Puedes seleccionar varias personas a la vez para acciones masivas. Los cambios se guardan automáticamente en el expediente.',
      target: 'involucrados-content',
      badge: 'Tabla',
    },
  ],

  cronologia: [
    {
      id: 'cronologia-intro',
      title: 'Línea de Tiempo del Caso',
      description: 'La cronología es un registro ordenado e inalterable de todo lo que ha sucedido en el expediente: cuándo fue creado, qué documentos se subieron, qué correos se enviaron y qué eventos fueron agendados.',
      target: 'content-cronologia',
      badge: 'Eventos',
    },
    {
      id: 'cronologia-header',
      title: 'Encabezado de Cronología',
      description: 'El encabezado muestra la cantidad total de eventos registrados. Cada acción relevante queda trazada automáticamente: no necesitas registrar nada manualmente.',
      target: 'cronologia-header',
      badge: 'Panel',
    },
    {
      id: 'cronologia-events',
      title: 'Eventos Registrados',
      description: 'Cada tarjeta representa un evento: la creación del caso, una subida de documento, un correo enviado o un agendamiento. Los eventos de tipo correo o reunión son clicables para ver el detalle completo (destinatario, asunto, cuerpo del mensaje o invitados). Esta información es muy útil para auditorías.',
      target: 'cronologia-events-list',
      badge: 'Historial',
    },
  ],

  documentos: [
    {
      id: 'documentos-intro',
      title: 'Gestor Documental',
      description: 'Aquí centralizas toda la evidencia del caso: actas, declaraciones, pantallazos, contratos u otros archivos. Cada documento que subas es analizado automáticamente por la IA para actualizar el Resumen del caso.',
      target: 'content-documentos',
      badge: 'Evidencia',
    },
    {
      id: 'documentos-header',
      title: 'Panel de Documentos',
      description: 'El encabezado muestra cuántos archivos hay en el expediente. Puedes subir múltiples archivos a la vez (PDFs, imágenes, Word, Excel, etc.) usando el botón de la derecha.',
      target: 'documentos-header',
      badge: 'Panel',
    },
    {
      id: 'documentos-upload',
      title: 'Subir Archivos',
      description: 'Al hacer clic en "Subir", se abre el selector de archivos de tu equipo. Puedes seleccionar varios archivos simultáneamente. Una vez cargados, la IA los procesa en segundo plano y actualiza el Resumen Inteligente del expediente.',
      target: 'documentos-upload-btn',
      badge: 'Acción',
    },
    {
      id: 'documentos-list',
      title: 'Lista de Archivos',
      description: 'Cada archivo aparece con su nombre, peso, tipo y fecha de subida. Desde los íconos de cada fila puedes: ver una vista previa (imágenes y PDFs), renombrar el archivo, descargarlo o eliminarlo. Los archivos descargados usan URL firmadas seguras que expiran automáticamente.',
      target: 'documentos-list',
      badge: 'Archivos',
    },
  ],
};
