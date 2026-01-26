# Frontend - Convivencia Inteligente

Aplicación web React para la gestión de casos de convivencia escolar con asistente AI multimodal.

## 🏗️ Arquitectura

```
frontend/src/
├── components/              # Componentes reutilizables genéricos
│   └── [componentes base]
│
├── contexts/                # Context API de React
│   └── ThemeContext.jsx    # Gestión de tema claro/oscuro
│
├── features/                # Módulos por funcionalidad (Feature-based)
│   │
│   ├── auth/               # Autenticación y navegación
│   │   ├── Header.jsx              # Barra superior de la app
│   │   ├── Sidebar.jsx             # Menú lateral de navegación
│   │   ├── SidebarSkeleton.jsx     # Loading state del sidebar
│   │   ├── UserProfileMenu.jsx     # Menú de perfil de usuario
│   │   ├── LoginForm.jsx           # Formulario de login
│   │   ├── LoginModal.jsx          # Modal de autenticación
│   │   ├── LoginContainer.jsx      # Container de login
│   │   └── ContactContainer.jsx    # Container de contactos
│   │
│   ├── chat/               # Chat AI multimodal
│   │   ├── ChatContainer.jsx           # Container principal del chat
│   │   ├── ChatInterfaceGeneral.jsx    # Interfaz de chat general
│   │   ├── MessageBubble.jsx           # Burbuja de mensaje individual
│   │   ├── FileAttachment.jsx          # Componente de adjuntos
│   │   ├── FileListPanel.jsx           # Lista de archivos adjuntos
│   │   ├── FilePreviewPanel.jsx        # Preview de archivos
│   │   ├── CaseListPanel.jsx           # Panel de casos asociados
│   │   ├── SuggestionCards.jsx         # Tarjetas de sugerencias
│   │   ├── ThinkingIndicator.jsx       # Indicador "pensando..."
│   │   ├── hooks/                      # Custom hooks del chat
│   │   │   ├── useChatMessages.js      # Gestión de mensajes
│   │   │   ├── useChatFiles.js         # Gestión de archivos
│   │   │   ├── useCaseAssociation.js   # Asociación con casos
│   │   │   ├── useChatExport.js        # Exportación a PDF/Word
│   │   │   └── index.js                # Exports
│   │   ├── skeletons/                  # Loading states
│   │   │   └── ChatSkeleton.jsx
│   │   └── index.js                    # Exports del módulo
│   │
│   ├── dashboard/          # Dashboards y métricas
│   │   ├── DashboardInstitucional.jsx  # Dashboard institucional
│   │   ├── DashboardEstablecimiento.jsx # Dashboard por establecimiento
│   │   ├── DashboardHeader.jsx         # Encabezado del dashboard
│   │   ├── QuickActions.jsx            # Acciones rápidas
│   │   ├── RecentCases.jsx             # Casos recientes
│   │   ├── CasesByType.jsx             # Gráfico de casos por tipo
│   │   ├── utils.js                    # Utilidades del dashboard
│   │   └── index.js                    # Exports
│   │
│   ├── my-cases/           # Gestión de casos (lista)
│   │   ├── CasesHeader.jsx             # Encabezado de casos
│   │   ├── CasesToolbar.jsx            # Toolbar con filtros/búsqueda
│   │   ├── CasesGrid.jsx               # Vista de grilla
│   │   ├── CasesTable.jsx              # Vista de tabla
│   │   ├── CaseCard.jsx                # Card de caso individual
│   │   ├── CaseRow.jsx                 # Fila de tabla
│   │   ├── CaseEditPanel.jsx           # Panel de edición
│   │   ├── StudentFormPanel.jsx        # Formulario de estudiantes
│   │   ├── ShareCaseModal.jsx          # Modal para compartir
│   │   └── index.js                    # Exports
│   │
│   └── my-cases-details/   # Detalle de caso individual
│       ├── CaseDetail.jsx              # Container principal
│       ├── CaseHeader.jsx              # Header del caso
│       ├── Breadcrumb.jsx              # Navegación breadcrumb
│       ├── CaseGeneralInfo.jsx         # Información general
│       ├── CaseDescription.jsx         # Descripción del caso
│       ├── CaseInvolved.jsx            # Estudiantes involucrados
│       ├── CaseTimeline.jsx            # Línea de tiempo
│       ├── CaseDocuments.jsx           # Documentos adjuntos
│       ├── CaseAISummary.jsx           # Resumen generado por AI
│       ├── DocumentsPanel.jsx          # Panel de documentos
│       ├── ChatButton.jsx              # Botón para abrir chat
│       └── index.js                    # Exports
│
├── layouts/                 # Layouts de la aplicación
│   └── MainLayout.jsx      # Layout principal con sidebar
│
├── pages/                   # Páginas principales (rutas)
│   ├── DashboardPage.jsx   # Página de dashboard
│   ├── MyCases.jsx         # Página de lista de casos
│   ├── CaseDetailPage.jsx  # Página de detalle de caso
│   ├── ChatPage.jsx        # Página de chat específico de caso
│   └── ChatGeneralPage.jsx # Página de chat general
│
├── styles/                  # Estilos globales
│   └── index.css           # Tailwind imports y estilos base
│
├── assets/                  # Assets estáticos (imágenes, etc.)
│
├── App.jsx                  # Componente raíz con rutas
└── main.jsx                 # Entry point de React
```

## 🎨 Stack y Dependencias

### Core
- **React 19.2.0** - Biblioteca UI
- **Vite 6.4.1** - Build tool y dev server
- **React Router** - Navegación (si aplica)

### UI y Estilos
- **Tailwind CSS 3.4.18** - Framework de estilos utility-first
- **Lucide React 0.469.0** - Iconos modernos
- **PostCSS 8.4.49** - Procesador CSS

### Visualización de Datos
- **Chart.js 4.4.7** - Gráficos interactivos
- **Recharts 2.15.0** - Componentes de gráficos React
- **react-chartjs-2 5.3.0** - Wrapper de Chart.js para React

### Exportación de Documentos
- **jsPDF 2.5.2** - Generación de PDF en el navegador
- **docx 9.0.2** - Generación de documentos Word

### Desarrollo
- **ESLint 9.18.0** - Linter
- **@vitejs/plugin-react 4.3.4** - Plugin Vite para React

## 🚀 Ejecución

### Desarrollo
```bash
# Instalar dependencias
npm install

# Iniciar dev server con hot-reload
npm run dev

# Acceder a: http://localhost:3000
```

### Producción
```bash
# Build optimizado
npm run build

# Preview del build
npm run preview
```

### Docker
```bash
# Desde la raíz del proyecto
docker-compose up frontend
```

## 📱 Características Principales

### 1. Chat AI Multimodal
- **Interfaz de conversación** fluida con burbujas de mensajes
- **Adjuntos multimodales**: imágenes (JPG, PNG, GIF), PDFs, documentos Word
- **Preview de archivos** con miniaturas y gestión
- **Tarjetas de sugerencias** contextuales
- **Indicador de "pensando"** durante procesamiento AI
- **Exportación** de conversaciones a PDF y Word
- **Asociación con casos** para contexto específico

**Hooks principales**:
- `useChatMessages` - Gestión de mensajes, envío a backend `/gemini/stream`
- `useChatFiles` - Manejo de archivos adjuntos y previews
- `useChatExport` - Exportación de conversaciones con jsPDF/docx
- `useCaseAssociation` - Vinculación de chat con casos

### 2. Gestión de Casos
- **Vista dual**: Tabla y Grilla intercambiables
- **Búsqueda y filtros** avanzados por tipo, estado, fecha
- **CRUD completo**: Crear, editar, eliminar casos
- **Formularios de estudiantes** involucrados
- **Compartir casos** con otros usuarios
- **Timeline de eventos** con seguimiento cronológico

**Componentes clave**:
- `CasesToolbar` - Filtros y búsqueda
- `CaseCard` / `CaseRow` - Visualización de casos
- `CaseEditPanel` - Edición inline

### 3. Dashboards
- **Dashboard Institucional**: Métricas globales de todos los establecimientos
- **Dashboard por Establecimiento**: Métricas específicas
- **Visualizaciones**:
  - Casos por tipo (gráfico de barras)
  - Tendencias temporales
  - Casos recientes
  - Acciones rápidas contextuales

**Componentes**:
- `DashboardInstitucional` - Vista global
- `DashboardEstablecimiento` - Vista específica
- `CasesByType` - Gráficos con Chart.js/Recharts

### 4. Detalle de Caso
- **Información general** con metadata
- **Descripción completa** del caso
- **Estudiantes involucrados** con datos
- **Timeline interactiva** de eventos
- **Documentos adjuntos** con preview
- **Resumen AI** generado automáticamente
- **Botón de chat** para consultas específicas del caso

**Componentes**:
- `CaseDetail` - Container principal
- `CaseTimeline` - Línea de tiempo visual
- `CaseAISummary` - Resumen generado por AI

### 5. Autenticación y Navegación
- **Sidebar responsivo** con navegación principal
- **Header** con búsqueda y perfil de usuario
- **Menú de usuario** con configuración
- **Login modal** para autenticación
- **Tema claro/oscuro** con ThemeContext

## 🎨 Convenciones de Diseño

### Estructura de Componentes
```jsx
// Feature-based organization
// Cada feature contiene sus componentes, hooks y utilidades

// Ejemplo: features/chat/MessageBubble.jsx
export const MessageBubble = ({ message, isUser }) => {
  // Componente específico del chat
  return (
    <div className={`message-bubble ${isUser ? 'user' : 'ai'}`}>
      {message.content}
    </div>
  );
};
```

### Custom Hooks Pattern
```jsx
// Hooks en carpeta dedicada por feature
// features/chat/hooks/useChatMessages.js

export const useChatMessages = () => {
  const [messages, setMessages] = useState([]);
  
  const sendMessage = async (content, files) => {
    // Lógica de envío a /gemini/stream
    const formData = new FormData();
    formData.append('query', content);
    files.forEach(f => formData.append('files', f));
    
    const response = await fetch('http://localhost:8000/gemini/stream', {
      method: 'POST',
      body: formData
    });
    // ...
  };
  
  return { messages, sendMessage };
};
```

### Exportación de Módulos
```javascript
// Cada feature tiene index.js para exports limpios
// features/chat/index.js

export { ChatContainer } from './ChatContainer';
export { MessageBubble } from './MessageBubble';
export { useChatMessages, useChatFiles } from './hooks';
```

## 🔌 Integración con Backend

### API Base URL
Por defecto apunta a: `http://localhost:8000`

### Endpoints Consumidos
```javascript
// POST /gemini/stream - Chat AI
const response = await fetch('http://localhost:8000/gemini/stream', {
  method: 'POST',
  body: formData  // multipart/form-data con query + files
});

// GET /health - Health check
const health = await fetch('http://localhost:8000/health');
```

### Manejo de Archivos
```javascript
// Envío de imágenes al chat
const formData = new FormData();
formData.append('query', 'Analiza esta imagen');
formData.append('files', imageFile);  // File object del input

// El backend procesa automáticamente imágenes con OCR
```

## 🎯 Estado y Contexto

### ThemeContext
```jsx
// Gestión global del tema
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

const { theme, toggleTheme } = useTheme();
// theme: 'light' | 'dark'
```

### Estado Local
La mayoría de componentes usan `useState` local. No hay Redux/Zustand implementado.

## 🧪 Testing

```bash
# (Pendiente de implementar)
npm run test
```

## 📦 Build y Deployment

### Variables de Entorno
Crear `.env` en `/frontend`:
```env
VITE_API_URL=http://localhost:8000
# Agregar otras variables según necesidad
```

### Build de Producción
```bash
npm run build
# Output en /dist
```

### Docker
El `Dockerfile.frontend` construye la imagen con:
1. Instalación de dependencias
2. Build de Vite
3. Servidor de desarrollo (puerto 3000)

## 🔧 Scripts Disponibles

```json
{
  "dev": "vite",                    // Desarrollo con hot-reload
  "build": "vite build",            // Build de producción
  "preview": "vite preview",        // Preview del build
  "lint": "eslint ."                // Linting con ESLint
}
```

## 🎨 Tailwind y Estilos

### Configuración
Ver `tailwind.config.js` para tema personalizado

### Clases Comunes
```jsx
// Containers
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// Cards
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">

// Buttons
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
```

## 🐛 Debugging

### DevTools
- React DevTools (extensión de navegador)
- Vite dev server con hot-reload automático

### Logs
```javascript
console.log('[Chat] Enviando mensaje:', message);
console.error('[API] Error en fetch:', error);
```

## 📈 Futuras Mejoras

- [ ] Implementar tests unitarios con Vitest
- [ ] Migrar a TypeScript para type safety
- [ ] Implementar estado global (Redux/Zustand) si crece complejidad
- [ ] Agregar Storybook para documentación de componentes
- [ ] Implementar lazy loading de rutas
- [ ] Optimizar bundle size (code splitting)
- [ ] Agregar PWA capabilities
- [ ] Implementar internacionalización (i18n)

## 🤝 Contribución

Al agregar nuevas features:
1. Crear carpeta en `/features/nombre-feature/`
2. Incluir componentes, hooks y utilidades relacionadas
3. Exportar desde `index.js` de la feature
4. Actualizar este README si es una feature principal
5. Seguir convenciones de Tailwind y estructura existente
