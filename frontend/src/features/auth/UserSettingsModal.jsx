import { useState, useEffect } from 'react';
import { usersService } from '../../services/api';
import { createLogger } from '../../utils/logger';

const logger = createLogger('UserSettingsModal');

export default function UserSettingsModal({ isOpen, onClose, usuario, current, onUserUpdate }) {
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [colegiosInfo, setColegiosInfo] = useState([]);

  useEffect(() => {
    if (isOpen && usuario) {
      setNombre(usuario.nombre || '');
      setError(null);
      setSuccess(false);

      // Cargar información de colegios desde localStorage
      const storedColegios = localStorage.getItem('colegios');
      if (storedColegios) {
        try {
          const colegios = JSON.parse(storedColegios);
          setColegiosInfo(colegios);
        } catch (err) {
          logger.error('Error parsing colegios:', err);
        }
      }
    }
  }, [isOpen, usuario]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Actualizar usuario en el backend
      const updatedUser = await usersService.update(usuario.id, { nombre });

      // Actualizar localStorage
      const updatedUsuario = { ...usuario, nombre };
      localStorage.setItem('usuario', JSON.stringify(updatedUsuario));

      setSuccess(true);

      // Notificar al componente padre
      if (onUserUpdate) {
        onUserUpdate(updatedUsuario);
      }

      // Cerrar modal después de 1.5 segundos
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative ${current.cardBg} rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border ${current.cardBorder}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-xl font-semibold ${current.textPrimary}`}>
            Configuración de Usuario
          </h2>
          <button
            onClick={onClose}
            className={`${current.textSecondary} hover:${current.textPrimary} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mensajes de estado */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
              Usuario actualizado correctamente
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className={`block text-sm font-medium ${current.textPrimary} mb-2`}>
                Nombre Completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${current.inputBorder} ${current.inputBg} ${current.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ingresa tu nombre"
                disabled={loading}
              />
            </div>

            {/* Correo (solo lectura) */}
            <div>
              <label className={`block text-sm font-medium ${current.textPrimary} mb-2`}>
                Correo Electrónico
              </label>
              <input
                type="email"
                value={usuario?.correo || ''}
                className={`w-full px-4 py-2 rounded-lg border ${current.inputBorder} ${current.inputBg} ${current.textSecondary} cursor-not-allowed`}
                disabled
              />
              <p className={`mt-1 text-xs ${current.textSecondary}`}>
                El correo no se puede modificar
              </p>
            </div>

            {/* Rol (solo lectura) */}
            <div>
              <label className={`block text-sm font-medium ${current.textPrimary} mb-2`}>
                Rol
              </label>
              <input
                type="text"
                value={usuario?.rol || ''}
                className={`w-full px-4 py-2 rounded-lg border ${current.inputBorder} ${current.inputBg} ${current.textSecondary} cursor-not-allowed`}
                disabled
              />
            </div>

            {/* Información del Colegio */}
            {colegiosInfo && colegiosInfo.length > 0 && (
              <div className={`p-4 rounded-lg border ${current.cardBorder} ${current.formBg}`}>
                <h3 className={`text-sm font-semibold ${current.textPrimary} mb-3`}>
                  Colegio Asociado
                </h3>
                {colegiosInfo.map((colegio) => (
                  <div key={colegio.id} className="space-y-3">
                    {/* Logo */}
                    {colegio.logo_url && (
                      <div className="flex justify-center">
                        <img
                          src={colegio.logo_url}
                          alt={`Logo de ${colegio.nombre}`}
                          className="h-20 w-20 object-contain rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Nombre del Colegio */}
                    <div>
                      <p className={`text-xs ${current.textSecondary} mb-1`}>Nombre</p>
                      <p className={`text-sm font-medium ${current.textPrimary}`}>
                        {colegio.nombre}
                      </p>
                    </div>

                    {/* Dirección */}
                    {colegio.direccion && (
                      <div>
                        <p className={`text-xs ${current.textSecondary} mb-1`}>Dirección</p>
                        <p className={`text-sm ${current.textPrimary}`}>
                          {colegio.direccion}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                <p className={`mt-3 text-xs ${current.textSecondary} italic`}>
                  La información del colegio no se puede modificar desde aquí
                </p>
              </div>
            )}

            {/* Botón Guardar */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
