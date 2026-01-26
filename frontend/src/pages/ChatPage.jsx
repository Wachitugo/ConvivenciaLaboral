import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import ChatInterface from '../features/auth/ChatInterface';
import LoginModal from '../features/login/LoginModal';
import logoSavia from '../assets/Convivencia Inteligente Logo.png';

function ChatPage() {
  const { current, isDark, toggleTheme } = useTheme();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Simular autenticación

  const handleChatSubmit = (message) => {
    // Permitir que se envíe el mensaje siempre
    return true;
  };

  const handleAIResponse = () => {
    // Esta función se llamará cuando la IA debería responder
    // Si no está autenticado, abre el modal en lugar de responder
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return null; // No devolver respuesta
    }

    // Si está autenticado, devolver respuesta normal
    return 'Esta es una respuesta simulada. Aquí se integraría tu API de IA.';
  };

  const handleCloseModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleOpenModal = () => {
    setIsLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Contenedor principal con ancho máximo y centrado */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header centrado con estilo card */}
        <header className="w-full py-11">
          <div className={`${current.cardBg} border ${current.cardBorder} rounded-2xl px-4 md:px-8 py-3 flex items-center justify-between shadow-sm backdrop-blur-sm`}>
          {/* Logo con efecto hover */}
          <Link to="/" className="group">
            <img
              src={logoSavia}
              alt="Logo Savia"
              className={`h-8 md:h-10 cursor-pointer transition-all group-hover:scale-105 ${isDark ? 'brightness-0 invert' : ''}`}
            />
          </Link>

          {/* Botones derecha con mejor espaciado */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Botón modo oscuro con tooltip mejorado */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl ${current.formBg} border ${current.formBorder} ${current.textSecondary} hover:${current.textPrimary} transition-all hover:scale-105 active:scale-95`}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>

            {/* Botón Login con gradiente y efecto */}
            <button
              onClick={handleOpenModal}
              className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs md:text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              Entrar
            </button>
          </div>
        </div>
        </header>

        {/* Contenido principal */}
        <div className="flex flex-col items-center justify-start space-y-8">

          {/* Título principal */}
          <h1 className={`text-5xl md:text-6xl font-extrabold text-center mb-4 ${current.textPrimary} leading-tight`}>
            Gestiona la convivencia escolar con
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent"> Inteligencia Artificial</span>
          </h1>

          {/* Descripción */}
          <p className={`${current.textSecondary} text-center text-base md:text-lg max-w-2xl mb-12 leading-relaxed opacity-90`}>
            Optimiza la gestión de convivencia escolar, automatiza reportes y toma decisiones informadas con análisis en tiempo real.
            Una plataforma integral que conecta a estudiantes, docentes y administradores en un solo lugar.
          </p>

          {/* Chat Interface con degradado */}
          <div className="w-full max-w-3xl mb-20">
            <div className="relative">
              {/* Contenido del chat */}
              <div className="relative ">
                <ChatInterface
                  onSubmit={handleChatSubmit}
                  onAIResponse={handleAIResponse}
                />
              </div>
            </div>
          </div>

          {/* Sección de características */}
          <div className="w-full max-w-6xl mt-24 mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold text-center mb-4 ${current.textPrimary}`}>
              ¿Por qué elegir nuestra plataforma?
            </h2>
            <p className={`${current.textSecondary} text-center text-lg max-w-2xl mx-auto mb-12`}>
              Tecnología de vanguardia al servicio de la convivencia escolar
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Característica 1 */}
              <div className={`${current.cardBg} border ${current.cardBorder} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${current.textPrimary}`}>
                  IA Inteligente
                </h3>
                <p className={`${current.textSecondary} text-sm leading-relaxed`}>
                  Respuestas instantáneas y precisas basadas en inteligencia artificial avanzada para resolver tus consultas sobre convivencia escolar.
                </p>
              </div>

              {/* Característica 2 */}
              <div className={`${current.cardBg} border ${current.cardBorder} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${current.textPrimary}`}>
                  Seguro y Privado
                </h3>
                <p className={`${current.textSecondary} text-sm leading-relaxed`}>
                  Tus datos están protegidos con los más altos estándares de seguridad. Toda la información es confidencial y encriptada.
                </p>
              </div>

              {/* Característica 3 */}
              <div className={`${current.cardBg} border ${current.cardBorder} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${current.textPrimary}`}>
                  Respuestas Rápidas
                </h3>
                <p className={`${current.textSecondary} text-sm leading-relaxed`}>
                  Obtén soluciones en segundos. Nuestra IA está entrenada específicamente para temas de convivencia escolar.
                </p>
              </div>
            </div>
          </div>

          {/* Sección de estadísticas */}
          <div className="w-full max-w-6xl mb-16">
            <div className={`${current.cardBg} border ${current.cardBorder} rounded-2xl p-12`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                    10k+
                  </div>
                  <p className={`${current.textSecondary} text-sm`}>
                    Consultas Resueltas
                  </p>
                </div>
                <div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                    500+
                  </div>
                  <p className={`${current.textSecondary} text-sm`}>
                    Instituciones
                  </p>
                </div>
                <div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-2">
                    98%
                  </div>
                  <p className={`${current.textSecondary} text-sm`}>
                    Satisfacción
                  </p>
                </div>
                <div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                    24/7
                  </div>
                  <p className={`${current.textSecondary} text-sm`}>
                    Disponibilidad
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de casos de uso */}
          <div className="w-full max-w-6xl mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold text-center mb-4 ${current.textPrimary}`}>
              ¿Cómo te podemos ayudar?
            </h2>
            <p className={`${current.textSecondary} text-center text-lg max-w-2xl mx-auto mb-12`}>
              Casos de uso comunes en la gestión de convivencia escolar
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Caso 1 */}
              <div className={`${current.cardBg} border ${current.cardBorder} rounded-xl p-6 hover:border-blue-400 transition-all cursor-pointer`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400 text-xl">📋</span>
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold mb-2 ${current.textPrimary}`}>
                      Resolución de Conflictos
                    </h3>
                    <p className={`${current.textSecondary} text-sm`}>
                      Obtén orientación paso a paso para mediar y resolver conflictos entre estudiantes de manera efectiva.
                    </p>
                  </div>
                </div>
              </div>

              {/* Caso 2 */}
              <div className={`${current.cardBg} border ${current.cardBorder} rounded-xl p-6 hover:border-blue-400 transition-all cursor-pointer`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 dark:text-purple-400 text-xl">📝</span>
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold mb-2 ${current.textPrimary}`}>
                      Documentación y Reportes
                    </h3>
                    <p className={`${current.textSecondary} text-sm`}>
                      Genera reportes automáticos y mantén un registro detallado de todos los incidentes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Caso 3 */}
              <div className={`${current.cardBg} border ${current.cardBorder} rounded-xl p-6 hover:border-blue-400 transition-all cursor-pointer`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 text-xl">⚖️</span>
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold mb-2 ${current.textPrimary}`}>
                      Normativas y Reglamentos
                    </h3>
                    <p className={`${current.textSecondary} text-sm`}>
                      Consulta las normativas vigentes y aprende cómo aplicarlas correctamente en cada situación.
                    </p>
                  </div>
                </div>
              </div>

              {/* Caso 4 */}
              <div className={`${current.cardBg} border ${current.cardBorder} rounded-xl p-6 hover:border-blue-400 transition-all cursor-pointer`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 dark:text-orange-400 text-xl">💬</span>
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold mb-2 ${current.textPrimary}`}>
                      Comunicación Efectiva
                    </h3>
                    <p className={`${current.textSecondary} text-sm`}>
                      Aprende técnicas de comunicación para mejorar las relaciones entre estudiantes y docentes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

     
        </div>
      </div>

      {/* Modal de Login */}
      <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseModal} />
    </div>
  );
}

export default ChatPage;