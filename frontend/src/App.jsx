import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { InterviewProvider } from './contexts/InterviewContext';
import MainLayout from './layouts/MainLayout';
import Header from './features/auth/Header';
import Login from './pages/Login';
import ChatPage from './pages/ChatPage';
import ChatGeneralPage from './pages/ChatGeneralPage';
import DashboardPage from './pages/DashboardPage';
import ContactContainer from './features/auth/ContactContainer';
import MyCases from './pages/MyCases';
import CaseDetailPage from './pages/CaseDetailPage';
import InterviewPage from './pages/InterviewPage';
import InterviewDetailPage from './pages/InterviewDetailPage';
import FichaAlumnosPage from './pages/FichaAlumnosPage';
import StudentDetailPage from './pages/StudentDetailPage';
import { AdminPage } from './features/crud-admin';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import NavigateToSchoolDefault from './components/NavigateToSchoolDefault';

import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { current } = useTheme();

  return (
    <div className={`${current.bg} min-h-screen`}>
      <Routes>
        {/* ========== RUTAS PÚBLICAS ========== */}

        {/* Página de inicio - Login */}
        <Route path="/" element={<Login />} />

        {/* Chat público */}
        <Route path="/chat-public" element={<ChatPage />} />

        {/* Contacto */}
        <Route path="/contact" element={
          <div className="flex items-center justify-center min-h-screen">
            <div className="max-w-6xl w-full px-12">
              <Header />
              <ContactContainer />
            </div>
          </div>
        } />

        {/* ========== RUTAS PRIVADAS - ACCESO COMPLETO (Director/Encargado) ========== */}

        {/* ========== RUTAS PRIVADAS ========== */}

        {/* 1. Global / Admin Paths */}
        <Route element={<RoleProtectedRoute requireFullAccess={true} />}>
          <Route path="/panel-admin" element={<AdminPage />} />
        </Route>

        {/* 2. Legacy Redirects (Handle old bookmarks or root access) */}
        <Route element={<RoleProtectedRoute requireFullAccess={false} />}>
          <Route path="/dashboard" element={<NavigateToSchoolDefault dest="dashboard" />} />
          <Route path="/chat-general" element={<NavigateToSchoolDefault dest="chat-general" />} />
          <Route path="/mis-casos" element={<NavigateToSchoolDefault dest="mis-casos" />} />
          <Route path="/entrevistas" element={<NavigateToSchoolDefault dest="entrevistas" />} />
          <Route path="/ficha-alumnos" element={<NavigateToSchoolDefault dest="ficha-alumnos" />} />
        </Route>

        {/* 3. Tenant Paths (Encapsulated in MainLayout) */}
        <Route path="/:schoolSlug" element={<MainLayout />}>

          {/* High Security Group */}
          <Route element={<RoleProtectedRoute requireFullAccess={true} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="chat-general" element={<ChatGeneralPage />} />
            <Route path="chat" element={<Navigate to="chat-general" replace />} />
            <Route path="mis-casos" element={<MyCases />} />
            <Route path="mis-casos/:id" element={<CaseDetailPage />} />
            <Route path="entrevistas" element={<InterviewPage />} />
            <Route path="entrevistas/:id" element={<InterviewDetailPage />} />
          </Route>

          {/* Common Routes (All Roles) */}
          <Route element={<RoleProtectedRoute requireFullAccess={false} />}>
            <Route path="ficha-alumnos" element={<FichaAlumnosPage />} />
            <Route path="ficha-alumnos/:id" element={<StudentDetailPage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LayoutProvider>
          <InterviewProvider>
            <Router>
              <AppContent />
            </Router>
          </InterviewProvider>
        </LayoutProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;