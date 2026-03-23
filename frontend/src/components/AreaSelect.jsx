import { useState, useEffect, useRef } from 'react';
import { schoolsService } from '../services/api';

const DEFAULT_AREAS = [
  'Administración', 'Operaciones', 'Recursos Humanos', 'Finanzas',
  'Tecnología', 'Ventas', 'Marketing', 'Producción', 'Logística', 'Atención al Cliente'
];

const ADD_NEW_VALUE = '__add_new__';

export default function AreaSelect({ value, onChange, disabled = false, className = '', schoolId = null }) {
  const [areas, setAreas] = useState(DEFAULT_AREAS);
  const [isAdding, setIsAdding] = useState(false);
  const [newArea, setNewArea] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!schoolId) return;
    schoolsService.getAreas(schoolId)
      .then(data => {
        if (data && data.length > 0) {
          // Merge: siempre mostrar DEFAULT_AREAS + áreas personalizadas no duplicadas
          const merged = [...DEFAULT_AREAS, ...data.filter(a => !DEFAULT_AREAS.includes(a))];
          setAreas(merged);
        }
      })
      .catch(() => {}); // silencioso, usa defaults
  }, [schoolId]);

  useEffect(() => {
    if (isAdding && inputRef.current) inputRef.current.focus();
  }, [isAdding]);

  const handleSelectChange = (e) => {
    if (e.target.value === ADD_NEW_VALUE) {
      setIsAdding(true);
      setNewArea('');
      setError(null);
    } else {
      onChange(e.target.value);
    }
  };

  const handleConfirm = async () => {
    const trimmed = newArea.trim();
    if (!trimmed) { setError('Escribe un nombre para el área'); return; }
    if (areas.includes(trimmed)) { setError('Esta área ya existe'); return; }

    setIsSaving(true);
    try {
      if (schoolId) {
        const updated = await schoolsService.addArea(schoolId, trimmed);
        setAreas(updated);
      } else {
        setAreas(prev => [...prev, trimmed]);
      }
      onChange(trimmed);
      setIsAdding(false);
      setNewArea('');
    } catch {
      setError('Error al guardar. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewArea('');
    setError(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); }
    if (e.key === 'Escape') handleCancel();
  };

  if (isAdding) {
    return (
      <div className="space-y-1">
        <div className="flex gap-1">
          <input
            ref={inputRef}
            type="text"
            value={newArea}
            onChange={(e) => { setNewArea(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Nombre del área..."
            disabled={isSaving}
            className={`flex-1 px-3 py-2 border ${error ? 'border-red-400' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:opacity-50 ${className}`}
          />
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : '✓'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={handleSelectChange}
      disabled={disabled}
      className={`px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <option value="">Seleccionar área</option>
      {areas.map(area => (
        <option key={area} value={area}>{area}</option>
      ))}
      <option disabled>──────────────</option>
      <option value={ADD_NEW_VALUE}>+ Agregar nueva área...</option>
    </select>
  );
}
