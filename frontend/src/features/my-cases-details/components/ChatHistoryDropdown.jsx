import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChatButton from './ChatButton';

function ChatHistoryDropdown({ caseData, documents = [] }) {
  const navigate = useNavigate();
  const { schoolSlug } = useParams();
  const [showChatHistory, setShowChatHistory] = useState(false);
  const chatHistoryRef = useRef(null);

  // Cerrar dropdown del historial al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatHistoryRef.current && !chatHistoryRef.current.contains(event.target)) {
        setShowChatHistory(false);
      }
    };

    if (showChatHistory) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatHistory]);

  const handleChatHistoryClick = (chat) => {
    const basePath = schoolSlug ? `/${schoolSlug}` : '';
    navigate(`${basePath}/chat-general`, {
      state: {
        relatedCase: {
          id: caseData.id,
          title: caseData.title,
          caseType: caseData.caseType,
          description: caseData.description,
          documents: documents // Pasar documentos también al historial
        },
        sessionId: chat.id
      }
    });
  };

  return (
    <div className="relative" ref={chatHistoryRef} style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Botón de Historial */}
      <button
        onClick={() => setShowChatHistory(!showChatHistory)}
        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-bold text-white bg-[#1A71B8] hover:bg-[#1A71B8]/80 rounded-lg transition-all shadow-md border border-white/20"
        title="Ver historial de conversaciones"
      >
        <div className="relative flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="hidden sm:inline">Continuar Análisis</span>
          {caseData.chatHistory?.length > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-bold bg-yellow-400 text-[#0A3866] rounded-full">
              {caseData.chatHistory.length}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown del historial */}
      {showChatHistory && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0A3866]/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/10">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Historial</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {caseData.chatHistory?.length > 0 ? (
              <div>
                {caseData.chatHistory.map((chat, index) => (
                  <button
                    key={index}
                    onClick={() => handleChatHistoryClick(chat)}
                    className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/10 last:border-b-0 transition-colors"
                  >
                    <p className="text-sm font-medium text-white truncate mb-1">
                      {chat.title || 'Conversación sin título'}
                    </p>
                    <p className="text-xs text-white/50">{chat.date}</p>
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">
                      {chat.preview}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center gap-3">
                <p className="text-sm text-white/60 mb-2">Sin conversaciones previas, ¡Inicia Una!</p>
                <ChatButton caseData={caseData} documents={documents} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatHistoryDropdown;
