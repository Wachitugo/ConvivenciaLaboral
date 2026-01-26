# 🎓 Convivencia Inteligente

Sistema de gestión de convivencia escolar potenciado con inteligencia artificial, utilizando Google Discovery Engine para análisis multimodal de casos.

## 📋 Descripción

Plataforma web diseñada para instituciones educativas que permite:
- **Gestión de casos de convivencia** con seguimiento detallado
- **Asistente AI multimodal** con soporte para texto e imágenes
- **Dashboard institucional y por establecimiento** con métricas en tiempo real
- **Chat inteligente** con análisis de documentos y OCR de imágenes
- **Exportación de conversaciones** y documentación de casos

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.2** con hooks modernos
- **Vite 6.4** para desarrollo rápido
- **Tailwind CSS 3.4** para estilos
- **Lucide React** para iconos
- **Chart.js & Recharts** para visualizaciones
- **jsPDF & docx** para exportación de documentos

### Backend
- **Python 3.11** con FastAPI
- **Google Discovery Engine API v1alpha** para AI multimodal
- **Pydantic** para validación de datos
- **Uvicorn** con hot-reload

### DevOps
- **Docker & Docker Compose** para contenedores
- **GitHub** para control de versiones

## 🚀 Inicio Rápido

### Prerequisitos
- Docker Desktop instalado
- Cuenta de Google Cloud con Discovery Engine habilitado
- Service Account JSON con permisos adecuados

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/antoniodavidcoo/convivencia-inteligente.git
cd convivencia-inteligente
```

2. **Configurar credenciales**
   - Colocar `service-account-key.json` en la raíz del proyecto
   - Copiar `.env.example` a `.env` en `/backend`

3. **Configurar variables de entorno**
```bash
# backend/.env
PROJECT_NUMBER=tu-project-number
ENGINE_ID=tu-engine-id
ASSISTANT_ID=default_assistant
LOCATION=us
```

4. **Iniciar servicios con Docker**
```bash
docker-compose up --build
```

5. **Acceder a la aplicación**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Documentación API: http://localhost:8000/docs

## 📁 Estructura del Proyecto

```
convivencia-inteligente/
├── backend/                    # API Python FastAPI
│   ├── api/
│   │   ├── routes/            # Endpoints REST
│   │   │   ├── gemini.py      # Chat AI multimodal
│   │   │   └── health.py      # Health check
│   │   └── main.py            # Configuración FastAPI
│   ├── clients/               # Clientes externos
│   │   └── gemini_client.py   # Google Discovery Engine
│   ├── services/              # Lógica de negocio
│   ├── config.py              # Configuración con Pydantic
│   ├── requirements.txt       # Dependencias Python
│   ├── Dockerfile.backend     # Imagen Docker backend
│   ├── .env.example           # Variables de entorno
│   └── README.md              # Documentación backend
│
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── contexts/          # Context API (Theme, etc.)
│   │   ├── features/          # Módulos por funcionalidad
│   │   │   ├── auth/         # Autenticación y sidebar
│   │   │   ├── chat/         # Chat AI y archivos
│   │   │   ├── dashboard/    # Dashboards y métricas
│   │   │   ├── my-cases/     # Gestión de casos
│   │   │   └── my-cases-details/ # Detalle de casos
│   │   ├── layouts/          # Layouts principales
│   │   ├── pages/            # Páginas de la app
│   │   └── styles/           # Estilos globales
│   ├── public/               # Assets estáticos
│   ├── index.html            # HTML principal
│   ├── package.json          # Dependencias frontend
│   ├── vite.config.js        # Configuración Vite
│   ├── tailwind.config.js    # Configuración Tailwind
│   ├── eslint.config.js      # Configuración ESLint
│   ├── postcss.config.js     # Configuración PostCSS
│   └── README.md             # Documentación frontend
│
├── scripts/                   # Scripts de utilidad
│   ├── init-dev.sh           # Inicialización Linux/Mac
│   ├── init-dev.ps1          # Inicialización Windows
│   └── README.md             # Documentación scripts
│
├── docker-compose.yml         # Orquestación de contenedores
├── Dockerfile.frontend        # Imagen Docker frontend
├── service-account-key.json   # Credenciales GCP (no versionar)
├── package.json              # Scripts Docker globales
├── DEPLOYMENT.md             # Guía de despliegue
├── .gitignore                # Exclusiones de Git
└── README.md                 # Este archivo
```

## 🔑 Variables de Entorno

### Backend (`backend/.env`)
```env
APP_NAME=Convivencia Inteligente API
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CLIENT_ORIGIN=http://localhost:3000

# Google Discovery Engine
PROJECT_NUMBER=your-project-number
ENGINE_ID=your-engine-id
ASSISTANT_ID=default_assistant
LOCATION=us

# Para producción: usar base64 del service account
# GOOGLE_CREDENTIALS_JSON=base64_encoded_json
```

## 📡 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Información de la API |
| GET | `/health` | Health check |
| POST | `/gemini/stream` | Chat AI con soporte multimodal (texto + imágenes) |

## 🎨 Características Principales

### Chat AI Multimodal
- Conversaciones contextuales con Google Discovery Engine
- Soporte para imágenes (JPG, PNG, GIF) con OCR
- Análisis de documentos (PDF, Word, texto)
- Tarjetas de sugerencias inteligentes
- Exportación a PDF y Word

### Gestión de Casos
- CRUD completo de casos de convivencia
- Timeline de eventos con seguimiento
- Asociación de estudiantes involucrados
- Documentación adjunta con preview
- Resúmenes generados por AI

### Dashboards
- Vista institucional con métricas globales
- Vista por establecimiento personalizada
- Gráficos interactivos (casos por tipo, tendencias)
- Acciones rápidas contextuales

### Desarrollo

### Levantar en modo desarrollo
```bash
# Con hot-reload habilitado
docker-compose up

# Solo backend
cd backend
uvicorn api.main:app --reload

# Solo frontend
cd frontend
npm run dev
```

### Linting y formato
```bash
# Frontend
cd frontend
npm run lint

# Backend (configurar pre-commit hooks)
black backend/
flake8 backend/
```



