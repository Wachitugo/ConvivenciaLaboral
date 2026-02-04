import { useState, useEffect } from 'react';
import ColegioSearchInput from './ColegioSearchInput';

export default function CreateUserModal({
  isOpen,
  onClose,
  colegios,
  onRegistrarUsuario
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    password: '',
    rol: 'Encargado de Convivencia'
  });
  const [selectedColegio, setSelectedColegio] = useState('');
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Resetear el formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre: '',
        correo: '',
        password: '',
        rol: 'Encargado de Convivencia'
      });
      setSelectedColegio('');
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre || formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.correo || !emailRegex.test(formData.correo)) {
      newErrors.correo = 'Ingresa un correo válido';
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    await onRegistrarUsuario(formData, selectedColegio);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md px-5 py-4 md:px-8 md:py-6 flex items-center justify-between z-10 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Registrar Nuevo Usuario</h3>
            <p className="text-sm text-gray-500 mt-1">Ingresa los datos del nuevo usuario del sistema.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 md:p-8 space-y-8">
          {/* Información del Usuario */}
          <div className="space-y-6">
            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">Información Básica</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Nombre completo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={`block w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 text-sm ${errors.nombre ? 'ring-2 ring-red-500/50 bg-red-50' : ''
                    }`}
                />
                {errors.nombre && (
                  <p className="text-xs text-red-500 font-medium">{errors.nombre}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  className={`block w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 text-sm ${errors.correo ? 'ring-2 ring-red-500/50 bg-red-50' : ''
                    }`}
                />
                {errors.correo && (
                  <p className="text-xs text-red-500 font-medium">{errors.correo}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`block w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 text-sm ${errors.password ? 'ring-2 ring-red-500/50 bg-red-50' : ''
                    }`}
                />
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Rol
                </label>
                <div className="relative">
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="block w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 text-sm appearance-none cursor-pointer"
                  >
                    <option value="Encargado de Convivencia">Encargado de Convivencia</option>
                    <option value="Directivo">Director</option>
                    <option value="Trabajador">Trabajador</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Colegio Asignado */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">Asignación</h4>
            <ColegioSearchInput
              colegios={colegios}
              selectedColegioId={selectedColegio}
              onSelect={setSelectedColegio}
              label="Colegio (opcional)"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-5 py-4 md:px-8 md:py-6 flex gap-4 justify-end border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleRegister}
            disabled={isSaving}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-gray-200/50 transition-all active:scale-95"
          >
            {isSaving ? 'Registrando...' : 'Registrar Usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}
