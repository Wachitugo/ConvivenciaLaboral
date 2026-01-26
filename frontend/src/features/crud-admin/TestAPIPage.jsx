import { useState, useEffect } from 'react';
import { authService, usersService, schoolsService, API_URL } from '../../services/api';
import AlertMessages from './AlertMessages';
import { SchoolsSection } from '../schools';
import UsersSection from './UsersSection';
import { TokensSection } from '../tokens';
import AdminLayout from '../../layouts/AdminLayout';
import { createLogger } from '../../utils/logger';

const logger = createLogger('AdminPage');

export default function AdminPage() {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('usuarios');
  const [selectedSchoolForView, setSelectedSchoolForView] = useState(null);

  const [colegios, setColegios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const handleRequest = async (requestFn, successMessage) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const result = await requestFn();
      setResponse({ success: true, message: successMessage, data: result });
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============ COLEGIOS ============
  const crearColegio = async (colegioForm, logoFile) => {
    await handleRequest(
      () => schoolsService.createWithLogo(colegioForm.nombre, colegioForm.direccion, logoFile),
      'Colegio creado exitosamente'
    );
    listarColegios();
  };

  const listarColegios = async () => {
    await handleRequest(
      async () => {
        const data = await schoolsService.getAll();
        setColegios(data);
        return data;
      },
      'Colegios obtenidos'
    );
  };

  const eliminarColegio = async (colegioId) => {
    if (!colegioId) {
      setError('Selecciona un colegio primero');
      return;
    }
    await handleRequest(
      () => schoolsService.delete(colegioId),
      'Colegio eliminado'
    );
    listarColegios();
  };

  // ============ USUARIOS ============
  const registrarUsuario = async (userForm, selectedColegio) => {
    await handleRequest(
      () => authService.register({
        ...userForm,
        activo: true,
        colegios: selectedColegio ? [selectedColegio] : []
      }),
      'Usuario registrado exitosamente'
    );
    listarUsuarios();
  };

  const listarUsuarios = async () => {
    await handleRequest(
      async () => {
        const data = await usersService.getAll();
        setUsuarios(data);
        return data;
      },
      'Usuarios obtenidos'
    );
  };

  const eliminarUsuario = async (userId) => {
    if (!userId) {
      setError('Selecciona un usuario primero');
      return;
    }
    await handleRequest(
      () => usersService.delete(userId),
      'Usuario eliminado'
    );
    listarUsuarios();
  };

  const cambiarColegioUsuario = async (userId, nuevoColegioId) => {
    if (!userId) {
      setError('ID de usuario no válido');
      return;
    }

    // Obtener el usuario actual
    const usuario = usuarios.find(u => u.id === userId);
    if (!usuario) {
      setError('Usuario no encontrado');
      return;
    }

    // Si el usuario tiene un colegio actual, desasociarlo primero
    if (usuario.colegios_info && usuario.colegios_info.length > 0) {
      const colegioActual = usuario.colegios_info[0].id;
      await usersService.desasociarColegio(userId, colegioActual);
    }

    // Si hay un nuevo colegio seleccionado, asociarlo
    if (nuevoColegioId) {
      await handleRequest(
        () => usersService.asociarColegio(userId, nuevoColegioId),
        'Colegio actualizado exitosamente'
      );
    } else {
      // Si no hay colegio seleccionado, solo actualizamos sin mensaje
      setResponse({ success: true, message: 'Colegio removido', data: null });
    }

    listarUsuarios();
  };

  const editarUsuario = async (userId, updateData) => {
    if (!userId) {
      setError('ID de usuario no válido');
      return;
    }
    await handleRequest(
      () => usersService.update(userId, updateData),
      `Usuario actualizado: ${updateData.nombre}`
    );
    listarUsuarios();
  };

  const editarColegio = async (colegioId, updateData, logoFile) => {
    if (!colegioId) {
      setError('ID de colegio no válido');
      return;
    }

    // Use the appropriate endpoint based on whether there's a logo
    if (logoFile) {
      await handleRequest(
        () => schoolsService.updateWithLogo(colegioId, updateData.nombre, updateData.direccion, logoFile),
        `Colegio actualizado: ${updateData.nombre}`
      );
    } else {
      await handleRequest(
        () => schoolsService.update(colegioId, updateData),
        `Colegio actualizado: ${updateData.nombre}`
      );
    }
    listarColegios();
  };

  // Cargar colegios automáticamente al montar el componente
  useEffect(() => {
    logger.debug(' API_URL actual es:', API_URL);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('⚠️ No se detectó token de sesión. Es probable que las peticiones fallen. Por favor inicia sesión primero.');
    }
    listarColegios();
  }, []);

  // Cargar usuarios cuando se cambia al tab de usuarios
  useEffect(() => {
    if (activeTab === 'usuarios') {
      listarUsuarios();
    }
  }, [activeTab]);

  // Helper to check if current tab is a tokens subtab
  const isTokensTab = activeTab.startsWith('tokens-') || activeTab === 'tokens';

  // Get the subtab for tokens (e.g., 'tokens-dashboard' -> 'dashboard')
  const getTokensSubTab = () => {
    if (activeTab.startsWith('tokens-')) {
      return activeTab.replace('tokens-', '');
    }
    return 'dashboard'; // default
  };

  // Get header title based on active tab
  const getHeaderTitle = () => {
    if (activeTab === 'usuarios') return 'Gestión de Usuarios';
    if (activeTab === 'colegios') return 'Gestión de Colegios';
    if (isTokensTab) return 'Gestión de Tokens';
    return '';
  };

  const getHeaderDescription = () => {
    if (activeTab === 'usuarios') return 'Administra el acceso y permisos de usuarios en el sistema';
    if (activeTab === 'colegios') return 'Administra las instituciones registradas en el sistema';
    if (isTokensTab) return 'Monitoreo de consumo y gestión de límites de IA';
    return '';
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="flex-1 overflow-y-auto p-3 md:p-8">
        {!selectedSchoolForView && (
          <header className="hidden lg:flex mb-4 justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getHeaderTitle()}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {getHeaderDescription()}
              </p>
            </div>
          </header>
        )}


        <div className="bg-white rounded-xl  ">
          {isTokensTab ? (
            <TokensSection initialTab={getTokensSubTab()} />
          ) : activeTab === 'colegios' ? (
            <SchoolsSection
              colegios={colegios}
              usuarios={usuarios}
              onCreateColegio={crearColegio}
              onEliminarColegio={eliminarColegio}
              onEditarColegio={editarColegio}
              onRegistrarUsuario={registrarUsuario}
              onSchoolSelected={setSelectedSchoolForView}
            />
          ) : (
            <UsersSection
              usuarios={usuarios}
              colegios={colegios}
              onRegistrarUsuario={registrarUsuario}
              onEliminarUsuario={eliminarUsuario}
              onEditarUsuario={editarUsuario}
              onCambiarColegio={cambiarColegioUsuario}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
