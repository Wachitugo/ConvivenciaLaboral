import { useState, useEffect } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { createLogger } from '../utils/logger';

const logger = createLogger('MyCases');

import {
  CasesHeader,
  CasesToolbar,
  CasesGrid,
  CasesTable,
  CaseEditPanel,
  MyCasesSkeleton
} from "../features/my-cases";
import ShareCaseModal from "../features/my-cases/ShareCaseModal";
import { casesService, usersService } from "../services/api";
import { calculateDeadlineDate, getDeadlineStatus } from "../utils/dateUtils";

function MyCases() {
  const { current } = useTheme();
  const navigate = useNavigate();
  const { schoolSlug } = useParams();
  const { isSidebarOpen, toggleSidebar, setSidebarHidden } = useOutletContext();
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingCase, setSharingCase] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' o 'table'
  const [editingCase, setEditingCase] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: "",
    sortBy: "date_desc",
    sharedStatus: "all",
    month: "all",
    year: "all",
    status: "all",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [cases, setCases] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [colegio, setColegio] = useState(null);

  // Obtener usuario y colegio actual del localStorage
  useEffect(() => {
    try {
      const usuarioData = JSON.parse(localStorage.getItem('usuario'));
      const colegios = JSON.parse(localStorage.getItem('colegios'));

      setUsuario(usuarioData);
      setColegio(colegios && colegios.length > 0 ? colegios[0] : null);
    } catch (error) {
      logger.error("Error obteniendo usuario del localStorage:", error);
      setUsuario(null);
      setColegio(null);
    }
  }, []);

  // Cargar casos desde el backend
  useEffect(() => {
    const fetchCases = async () => {
      setIsLoading(true);
      try {
        const data = await casesService.getCases(usuario.id, colegio.id);

        // Transformar datos del backend al formato del frontend
        const formattedCases = data.map((c) => {
          const isOwner = c.owner_id === usuario.id;
          const isShared = c.is_shared || false;

          // Calcular estado del semáforo de plazos y texto
          let deadlineStatus = 'none';
          let deadlineText = null;
          let nextDeadlineDate = null;

          const steps = c.pasosProtocolo || c.protocolSteps || [];
          if (steps && steps.length > 0) {
            // Encontrar el primer paso pendiente (índice original para mostrar usuario)
            const nextStepIndex = steps.findIndex(s => s.status !== 'completed' && s.status !== 'completado' && s.status !== 'skipped');
            const nextStep = nextStepIndex !== -1 ? steps[nextStepIndex] : null;

            if (nextStep && (nextStep.deadline || nextStep.estimated_time)) {
              if (nextStep.deadline) {
                nextDeadlineDate = new Date(nextStep.deadline);
              } else if (nextStep.estimated_time) {
                // Fix: Pass case creation date as base date to prevent daily shifting
                const baseDate = c.created_at ? new Date(c.created_at) : new Date();
                nextDeadlineDate = calculateDeadlineDate(nextStep.estimated_time, baseDate);
              }

              if (nextDeadlineDate) {
                deadlineStatus = getDeadlineStatus(nextDeadlineDate);

                // Calcular diferencia de días para el texto
                const now = new Date();
                const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const deadlineDay = new Date(nextDeadlineDate.getFullYear(), nextDeadlineDate.getMonth(), nextDeadlineDate.getDate());
                const diffDays = Math.ceil((deadlineDay - nowDay) / (1000 * 60 * 60 * 24));

                const stepNum = nextStepIndex + 1;

                if (diffDays < 0) {
                  deadlineText = `Paso ${stepNum}: Venció hace ${Math.abs(diffDays)} días`;
                } else if (diffDays === 0) {
                  deadlineText = `Paso ${stepNum}: Vence hoy`;
                } else if (diffDays === 1) {
                  deadlineText = `Paso ${stepNum}: Vence mañana`;
                } else {
                  deadlineText = `Paso ${stepNum}: Vence en ${diffDays} días`;
                }
              }
            }
          }

          return {
            id: c.id,
            counterCase: c.counter_case, // ID legible C-001
            title: c.title,
            status: c.status === 'active' ? 'pendiente' : (c.status || 'pendiente'),
            caseType: c.case_type || 'No especificado',
            lastUpdate: new Date(c.updated_at || c.created_at).toLocaleDateString(),
            isActive: c.status !== 'resuelto' && c.status !== 'no_resuelto',
            isShared: isShared,
            isSharedByMe: isOwner && isShared, // TÚ lo compartiste
            isSharedWithMe: !isOwner && isShared, // TE lo compartieron
            sharedWith: [], // Se puede cargar con getCasePermissions si es necesario
            involved: (c.involved || []).map(person => ({
              id: person.name, // Usar nombre como ID temporal
              name: person.name
            })),
            description: c.description,
            createdAt: c.created_at,
            ownerId: c.owner_id,
            ownerName: c.owner_name,
            colegioId: c.colegio_id,
            deadlineStatus: deadlineStatus, // Semáforo
            deadlineText: deadlineText,
            nextDeadlineDate: nextDeadlineDate // Objeto Date para ordenamiento
          };
        });
        setCases(formattedCases);
      } catch (error) {
        logger.error("Error cargando casos:", error);
        setCases([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (usuario && colegio) {
      fetchCases();
    }
  }, [usuario, colegio]);

  // Generar lista de AÑOS disponibles
  const availableYears = [
    ...new Set(
      cases.map((c) => {
        const date = new Date(c.createdAt || c.lastUpdate);
        return date.getFullYear().toString();
      })
    )
  ].sort((a, b) => b.localeCompare(a)).map(year => ({ value: year, label: year }));

  // Generar lista de MESES disponibles (independiente del año para mostrar qué meses tienen actividad en general)
  // Opcional: Podría depender del año seleccionado, pero para simplificar mostramos meses que tengan algún caso en la historia
  const availableMonths = [
    ...new Set(
      cases.map((c) => {
        const date = new Date(c.createdAt || c.lastUpdate);
        return String(date.getMonth() + 1).padStart(2, '0');
      })
    )
  ].sort().map(month => {
    // Crear fecha dummy para obtener nombre del mes
    const date = new Date(2000, parseInt(month) - 1, 1);
    const monthName = date.toLocaleString('es-ES', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return { value: month, label: capitalizedMonth };
  });

  // Lista completa de estudiantes del colegio para buscar y añadir
  const [allStudents, setAllStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!colegio) return;

      try {
        // Intentar obtener usuarios con rol 'Estudiante' del colegio actual
        const students = await usersService.getByRol('Estudiante', colegio.id);
        setAllStudents(students);
      } catch (error) {
        logger.error("Error fetching students:", error);
        // Fallback: obtener todos los usuarios del colegio
        try {
          const allUsers = await usersService.getByColegio(colegio.id);
          setAllStudents(allUsers);
        } catch (fallbackError) {
          logger.error("Error in fallback fetching users:", fallbackError);
          setAllStudents([]);
        }
      }
    };

    fetchStudents();
  }, [colegio?.id]);



  const [formData, setFormData] = useState({
    title: "",
    caseType: "",
    status: "pendiente",
    involved: [],
    description: "",
    initialFiles: [],
  });

  const handleQuickCreate = async (title) => {
    if (isSaving) return;

    if (!usuario || !colegio) {
      logger.error("Usuario o colegio no disponible para crear caso");
      alert("Error: Usuario o colegio no disponible");
      return;
    }

    try {
      setIsSaving(true);

      const caseData = {
        title: title,
        description: "",
        case_type: "Por definir",
        status: "pendiente",
        involved: [],
        protocol: "Por definir",
        owner_id: usuario.id,
        colegio_id: colegio.id
      };

      logger.info("📝 Creando caso rápido...");
      const createdCase = await casesService.createCase(caseData);
      logger.info(`✅ Caso creado con ID: ${createdCase.id}`);

      const isOwner = createdCase.owner_id === usuario.id;
      const isShared = createdCase.is_shared || false;

      const newCase = {
        id: createdCase.id,
        counterCase: createdCase.counter_case,
        title: createdCase.title,
        status: createdCase.status || 'pendiente',
        caseType: createdCase.case_type || 'Por definir',
        lastUpdate: new Date(createdCase.updated_at || createdCase.created_at).toLocaleDateString(),
        isActive: createdCase.status !== 'resuelto' && createdCase.status !== 'no_resuelto',
        isShared: isShared,
        isSharedByMe: isOwner && isShared,
        isSharedWithMe: !isOwner && isShared,
        sharedWith: [],
        involved: [],
        description: createdCase.description,
        createdAt: createdCase.created_at,
        ownerId: createdCase.owner_id,
        ownerName: createdCase.owner_name || usuario.nombre,
        colegioId: createdCase.colegio_id
      };

      setCases([newCase, ...cases]);
      logger.info("🎉 Caso creado exitosamente");

    } catch (error) {
      logger.error("Error creando caso:", error);
      alert("Error al crear el caso. Por favor intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditPanel = (caseItem) => {
    // Abre el panel de EDICIÓN
    setEditingCase(caseItem);
    setFormData({
      title: caseItem.title,
      caseType: caseItem.caseType,
      status: caseItem.status,
      involved: caseItem.involved,
    });
    setShowEditPanel(true);
  };

  const handleClosePanel = () => {
    setShowEditPanel(false);
    setEditingCase(null);
    setFormData({
      title: "",
      caseType: "",
      status: "pendiente",
      involved: [],
      description: "",
      initialFiles: []
    });
  };

  const handleUpdateCase = (updatedCase) => {
    setCases(cases.map(c => c.id === updatedCase.id ? updatedCase : c));
    handleClosePanel();
  };

  const handleSelectCase = (caseItem) => {
    // Navegar a la página de detalles del caso, pasando los datos del caso
    const basePath = schoolSlug ? `/${schoolSlug}` : '';
    navigate(`${basePath}/mis-casos/${caseItem.id}`, { state: { caseData: caseItem } });
  };

  const handleOpenChat = (student) => {
    // Abriendo chat para: student.name
    // Aquí puedes redirigir a la página de chat con el ID del estudiante
    // Por ejemplo: navigate(`/chat/${student.id}`)
  };

  const handleShareCase = (caseItem) => {
    // Para casos nuevos, verificar que el usuario sea el owner
    // Para casos legacy (sin ownerId), permitir compartir
    if (caseItem.ownerId && usuario && caseItem.ownerId !== usuario.id) {
      alert("Solo el propietario del caso puede compartirlo");
      return;
    }

    if (!usuario) {
      alert("Debes iniciar sesión para compartir casos");
      return;
    }

    // Abrir modal de compartir
    setSharingCase(caseItem);
    setShowShareModal(true);
  };

  const handleShareSuccess = async (result) => {
    // Recargar casos para actualizar el estado is_shared
    try {
      const data = await casesService.getCases(usuario.id, colegio.id);
      const formattedCases = data.map((c) => {
        const isOwner = c.owner_id === usuario.id;
        const isShared = c.is_shared || false;

        return {
          id: c.id,
          counterCase: c.counter_case,
          title: c.title,
          status: c.status || 'pendiente',
          caseType: c.case_type || 'No especificado',
          lastUpdate: new Date(c.updated_at || c.created_at).toLocaleDateString(),
          isActive: c.status !== 'resuelto' && c.status !== 'no_resuelto',
          isShared: isShared,
          isSharedByMe: isOwner && isShared,
          isSharedWithMe: !isOwner && isShared,
          sharedWith: [],
          involved: (c.involved || []).map(person => ({
            id: person.name,
            name: person.name
          })),
          description: c.description,
          createdAt: c.created_at,
          ownerId: c.owner_id,
          ownerName: c.owner_name,
          colegioId: c.colegio_id
        };
      });
      setCases(formattedCases);
    } catch (error) {
      logger.error("Error recargando casos:", error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredAndSortedCases = cases
    .filter((caseItem) => {
      // Filtro por término de búsqueda
      const searchTerm = filters.searchTerm.toLowerCase();
      const matchesSearch =
        caseItem.title.toLowerCase().includes(searchTerm) ||
        caseItem.caseType.toLowerCase().includes(searchTerm) ||
        caseItem.involved.some(p => p.name.toLowerCase().includes(searchTerm));

      // Filtro por estado de "compartido"
      const matchesSharedStatus =
        filters.sharedStatus === 'all' ||
        (filters.sharedStatus === 'shared' && caseItem.isShared) ||
        (filters.sharedStatus === 'not-shared' && !caseItem.isShared) ||
        (filters.sharedStatus === 'shared-with-me' && caseItem.isSharedWithMe);

      // Filtro por Año
      const matchesYear =
        filters.year === 'all' ||
        (() => {
          const date = new Date(caseItem.createdAt || caseItem.lastUpdate);
          return date.getFullYear().toString() === filters.year;
        })();

      // Filtro por Mes (Ahora solo compara el mes 01-12)
      const matchesMonth =
        filters.month === 'all' ||
        (() => {
          const date = new Date(caseItem.createdAt || caseItem.lastUpdate);
          const monthStr = String(date.getMonth() + 1).padStart(2, '0');
          return monthStr === filters.month;
        })();

      // Filtro por estado del caso (abierto, pendiente, resuelto...)
      const matchesStatus =
        filters.status === 'all' ||
        (filters.status === 'abierto' && caseItem.status === 'abierto') ||
        (filters.status === 'active' && (caseItem.status === 'abierto' || caseItem.status === 'active')) ||
        (filters.status === caseItem.status);


      return matchesSearch && matchesSharedStatus && matchesYear && matchesMonth && matchesStatus;
    })
    .sort((a, b) => {
      // Prioridad absoluta: Casos con fecha de vencimiento próxima (deadlineDate) se muestran PRIMERO
      if (a.nextDeadlineDate && b.nextDeadlineDate) {
        return a.nextDeadlineDate - b.nextDeadlineDate; // El que vence antes va primero
      }
      if (a.nextDeadlineDate && !b.nextDeadlineDate) return -1; // 'a' tiene fecha, va antes
      if (!a.nextDeadlineDate && b.nextDeadlineDate) return 1;  // 'b' tiene fecha, va antes

      switch (filters.sortBy) {
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'date_asc':
          // Suponiendo que hay una fecha 'createdAt'. Si no, usar 'id' o 'lastUpdate'
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'date_desc':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  const getStatusColor = (status) => {
    return status === "active"
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-gray-100 text-gray-600 border-gray-200";
  };

  const getStatusText = (status) => {
    return status === "active" ? "Activo" : "Resuelto";
  };

  return (
    <>
      {/* Mostrar skeleton mientras carga */}
      {isLoading ? (
        <MyCasesSkeleton />
      ) : (
        <>
          {/* Contenedor principal */}
          <div
            className={`flex-1 flex flex-col bg-white rounded-lg shadow-md border border-gray-300 transition-all duration-300 overflow-hidden`}
          >
            <CasesHeader
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              textPrimary={current.textPrimary}
            />
            <CasesToolbar
              filters={filters}
              onFilterChange={handleFilterChange}
              onQuickCreate={handleQuickCreate}
              isSaving={isSaving}
              viewMode={viewMode}
              setViewMode={setViewMode}
              availableMonths={availableMonths}
              availableYears={availableYears}
            />
            {viewMode === "grid" ? (
              <CasesGrid
                cases={filteredAndSortedCases}
                onSelectCase={handleSelectCase}
                onEditCase={handleOpenEditPanel}
                onShareCase={handleShareCase}
              />
            ) : (
              <CasesTable
                cases={filteredAndSortedCases}
                onSelectCase={handleSelectCase}
                onEditCase={handleOpenEditPanel}
                onShareCase={handleShareCase}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
              />
            )}
          </div>


          {/* Panel lateral para EDITAR caso */}
          {editingCase && (
            <CaseEditPanel
              isOpen={showEditPanel}
              onClose={handleClosePanel}
              caseToEdit={editingCase}
              onUpdateCase={handleUpdateCase}
            />
          )}

          {/* Modal para COMPARTIR caso */}
          <ShareCaseModal
            isOpen={showShareModal}
            onClose={() => {
              setShowShareModal(false);
              setSharingCase(null);
            }}
            caseData={sharingCase}
            currentUserId={usuario?.id}
            onShareSuccess={handleShareSuccess}
          />
        </>
      )}
    </>
  );
}

export default MyCases;
