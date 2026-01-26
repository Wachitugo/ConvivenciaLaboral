import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/index.css'
import App from './App.jsx'
import { createLogger } from './utils/logger';

const logger = createLogger('main');

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || (window._env_ && window._env_.VITE_GOOGLE_CLIENT_ID)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider
      clientId={googleClientId}
      onScriptLoadError={() => logger.error('Error al cargar Google SDK')}
      onScriptLoadSuccess={() => { }}
    >
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
