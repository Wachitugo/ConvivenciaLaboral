# ConvivenciaLaboral — Contexto del Proyecto

## ¿Qué es este proyecto?
Plataforma SaaS de gestión de convivencia laboral para empresas chilenas. Permite gestionar expedientes de casos (Ley Karin, bullying, conflictos), entrevistas, fichas de colaboradores (trabajadores), y tiene un asistente de IA especializado en legislación laboral chilena.

**Repositorios**
- Frontend: `/Users/luisolavarria/development/ConvivenciaLaboral/frontend`
- Backend: `/Users/luisolavarria/development/convivenciaLaboral/backend`

---

## Stack Tecnológico

### Frontend
- **React 19** + **Vite 6** + **React Router 7** (tenant-based routing `/:schoolSlug/`)
- **Tailwind CSS 3** — sin CSS modules, solo clases utilitarias
- **lucide-react** para todos los iconos (NO usar otros icon packs)
- **axios** con interceptor JWT para todas las llamadas API
- **createPortal** para modales (se montan en `document.body`)
- **Context API** para estado global (ThemeContext, LayoutContext, InterviewContext)
- **localStorage** para persistencia: `token`, `usuario`, `colegios`

### Backend
- **FastAPI** + **Pydantic v2** + **uvicorn**
- **Firestore** (google-cloud-firestore) como base de datos principal
- **Firebase Admin SDK** para autenticación
- **Vertex AI** (gemini) + **LangChain/LangGraph** para el agente de IA
- **Google Cloud Storage** para archivos
- **Discovery Engine** para búsqueda de documentos legales

---

## Arquitectura Frontend

### Estructura de carpetas
```
src/
├── components/       # Componentes compartidos (Toast, modals, guards)
├── contexts/         # React Contexts (ThemeContext, LayoutContext, InterviewContext)
├── features/         # Lógica por dominio (ver abajo)
├── hooks/            # Custom hooks
├── layouts/          # MainLayout.jsx
├── pages/            # Page-level components
├── services/         # api.js — ÚNICO punto de acceso a la API
└── utils/            # Helpers, logger, date utils
```

### Feature folders pattern
Cada feature sigue esta estructura:
```
features/my-feature/
├── index.js          # Barrel exports
├── ComponentName.jsx
├── skeletons/        # Loading skeletons
├── hooks/            # Feature-specific hooks (opcional)
└── utils/            # Feature-specific utils (opcional)
```

### Routing
```
/ → Login
/:schoolSlug/mis-casos → Expedientes
/:schoolSlug/mis-casos/:id → Detalle expediente
/:schoolSlug/entrevistas → Entrevistas
/:schoolSlug/entrevistas/:id → Detalle entrevista
/:schoolSlug/ficha-alumnos → Colaboradores
/:schoolSlug/ficha-alumnos/:id → Detalle colaborador
/:schoolSlug/chat-general → Asistente IA
/:schoolSlug/dashboard → Dashboard
```

---

## Arquitectura Backend

### Estructura
```
app/
├── api/v1/endpoints/   # Route handlers (uno por dominio)
├── services/           # Business logic
├── schemas/            # Pydantic models
└── core/config.py      # Settings
```

### Patrón de endpoint
```python
@router.get("/{id}", response_model=Schema)
async def get_resource(id: str, current_user = Depends(get_current_user)):
    result = resource_service.get_by_id(id)
    if not result:
        raise HTTPException(status_code=404, detail="No encontrado")
    return result
```

### Colecciones Firestore
- `colegios` — Empresas/organizaciones
- `users` / `usuarios` — Usuarios del sistema
- `cases` — Expedientes (con `case_permissions` para compartir)
- `interviews` — Entrevistas
- `students` — Colaboradores/trabajadores
- `chat_sessions` — Sesiones de chat con IA
- `commitments` — Compromisos

---

## Convenciones de Código

### Naming
- **Componentes React**: PascalCase (`CaseCard.jsx`, `EditStudentModal.jsx`)
- **Servicios frontend**: camelCase con sufijo Service (`casesService`, `studentsService`)
- **Archivos Python**: snake_case (`case_service.py`, `student_service.py`)
- **Clases Pydantic**: PascalCase + sufijo descriptivo (`CaseCreate`, `CaseUpdate`, `Case`)
- **Variables frontend**: camelCase
- **Variables backend**: snake_case

### Roles del sistema
```
"Gerente Relaciones Laborales"    → Acceso completo
"Encargado de Relaciones Laborales" → Acceso completo
"Investigador"                    → Acceso limitado (mis-casos, entrevistas, ficha-alumnos)
```

### Status de expedientes
`pendiente` | `abierto` | `resuelto` | `no_resuelto`

---

## Tema Visual (Glassmorphic Dark Blue)

### Colores principales
```
Deep Blue base:    #0A3866
Primary Blue:      #1A71B8
Accent Cyan:       #34B6D8
```

### Clases Tailwind de uso frecuente
```
Card:         bg-[#0A3866]/40 backdrop-blur-md border border-white/10 rounded-xl
Card premium: bg-[#0A3866]/40 backdrop-blur-md border border-[#1A71B8]/30 rounded-2xl
Shadow:       shadow-[0_4px_16px_rgba(0,0,0,0.2)]
Input:        bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40
Button primary: bg-[#1A71B8] hover:bg-[#155d96] text-white rounded-xl font-bold
Button ghost: bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 rounded-lg
Label:        text-[10px] font-bold text-white/50 uppercase tracking-widest
Section title: text-[11px] font-black text-[#34B6D8] uppercase tracking-widest
```

### Status badge pattern
```jsx
// Pending
<span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-xs font-semibold">
// Active
<span className="bg-[#1A71B8]/20 text-[#34B6D8] border border-[#1A71B8]/40 px-2 py-0.5 rounded-full text-xs font-semibold">
// Success
<span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-xs font-semibold">
// Error
<span className="bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-xs font-semibold">
```

---

## Patrones de Componentes

### Modal (con createPortal)
```jsx
import { createPortal } from 'react-dom';

function MyModal({ isOpen, onClose, onSave }) {
    if (!isOpen) return null;
    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60]" onClick={onClose} />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                <div className="w-full max-w-2xl pointer-events-auto max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
                    style={{ background: 'linear-gradient(145deg, #0d3258 0%, #0A2744 100%)' }}>
                    {/* Header */}
                    <div className="px-7 py-5 flex justify-between items-center border-b border-white/10 flex-shrink-0">
                        ...
                    </div>
                    {/* Body */}
                    <div className="overflow-y-auto p-7 custom-scrollbar">
                        ...
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
```

### Toast de éxito (inline, desaparece en 3s)
```jsx
const [successMsg, setSuccessMsg] = useState(null);

const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
};

// Render:
{successMsg && (
    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
        <CheckCircle size={14} />
        {successMsg}
    </div>
)}
```

### Loading en botón submit
```jsx
const [isSaving, setIsSaving] = useState(false);

<button type="submit" disabled={isSaving}
    className="px-6 py-2.5 bg-[#1A71B8] hover:bg-[#155d96] text-white text-sm font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-60">
    {isSaving ? (
        <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Guardando...
        </>
    ) : (
        <><Save size={15} /> Guardar</>
    )}
</button>
```

### Info card field (en PersonalInfoCard)
```jsx
<div className="bg-white/5 border border-white/10 p-2.5 sm:p-3 rounded-lg shadow-inner">
    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1.5">
        <Icon size={10} className="text-[#34B6D8]" /> Label
    </p>
    <p className="font-bold text-white text-sm">{value || <span className="text-white/30">No registrado</span>}</p>
</div>
```

---

## Patrones de API

### Frontend — agregar método a un service
```javascript
// En api.js, dentro del objeto correspondiente:
export const myService = {
    // ...métodos existentes...
    newMethod: async (param) => {
        const response = await api.get(`/my-resource/${param}`);
        return response.data;
    },
    createItem: async (data) => {
        const response = await api.post('/my-resource/', data);
        return response.data;
    },
};
```

### Backend — agregar endpoint
```python
@router.get("/{resource_id}/sub-resource", response_model=List[str])
async def get_sub_resource(resource_id: str):
    """Descripción del endpoint"""
    try:
        result = my_service.get_sub_resource(resource_id)
        return result
    except Exception as e:
        logger.exception("Error en get_sub_resource")
        raise HTTPException(status_code=500, detail="Error interno")
```

### Backend — agregar método a un service
```python
def get_something(self, resource_id: str) -> List[str]:
    """Descripción"""
    try:
        doc_ref = self.db.collection(self.collection_name).document(resource_id)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict().get("field", [])
        return []
    except Exception as e:
        logger.error(f"Error: {e}")
        return []
```

---

## Lectura de localStorage
```javascript
// Patrón estándar para obtener schoolId en cualquier componente/página:
const schoolId = (() => {
    try {
        const u = JSON.parse(localStorage.getItem('usuario'));
        const id = u?.colegios?.[0];
        return typeof id === 'object' ? id?.id : id;
    } catch { return null; }
})();

// Obtener rol del usuario:
const userRol = (() => {
    try { return JSON.parse(localStorage.getItem('usuario'))?.rol || ''; }
    catch { return ''; }
})();
```

---

## Vocabulario del dominio
- **Caso** → siempre llamado **Expediente** en la UI
- **Alumno / Student** → es un **Colaborador** (trabajador de empresa)
- **Curso / Área** → **Área de trabajo** del colaborador
- **Colegio / School** → **Empresa** o **Organización**
- **Investigador** → Rol de usuario con acceso limitado
- **Ley Karin** → Ley chilena sobre acoso laboral (principal caso de uso)
- **RIOHS** → Reglamento Interno de Orden, Higiene y Seguridad (documento legal)

---

## Colecciones Firestore (base de datos: `convivencia-laboral`)
- `colegios` — Empresas/organizaciones (campo `areas: []` para áreas personalizadas)
- `cases` — Expedientes
- `case_documents` — Documentos adjuntos a expedientes
- `case_protocols` — Protocolos de casos
- `chat_sessions` — Sesiones del asistente IA
- `interviews` — Entrevistas
- `students` — Colaboradores/trabajadores
- `usuarios` — Usuarios del sistema

## Patrón de áreas de trabajo (AreaSelect)
- Las `DEFAULT_AREAS` son constantes del frontend (nunca se guardan en Firestore)
- Firestore solo guarda las áreas **personalizadas** en `colegios/{id}.areas`
- El componente hace **merge** al cargar: DEFAULT_AREAS + áreas de Firestore (sin duplicar)
- Nunca guardar los defaults en Firestore — son genéricos para todas las empresas

## Cosas importantes a recordar
1. **Los modales usan createPortal** — siempre montar en `document.body` con z-index alto
2. **Los Pydantic schemas son estrictos** — si un campo no está en el schema, Firestore NO lo guarda
3. **El token se guarda en localStorage como `token`**, no en cookies
4. **Las rutas son tenant-based** — siempre incluir `/:schoolSlug/` al principio
5. **GCS signed URLs** para archivos > 30MB — no subir directo al backend
6. **Nunca usar `alert()`** — usar toast o mensaje inline
7. **`custom-scrollbar`** class en todos los contenedores scrollables
8. **Poppins** como fuente en tarjetas: `style={{ fontFamily: "'Poppins', sans-serif" }}`
