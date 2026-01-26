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
        className="relative px-3 py-1.5 bg-blue-600 rounded-xl shadow-md hover:shadow-lg hover:bg-blue-700 text-white transition-all duration-300"
        title="Ver historial de conversaciones"
      >
        <div className="relative flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold">Continuar Análisis</span>
          {caseData.chatHistory?.length > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold bg-yellow-400 text-purple-900 rounded-full">
              {caseData.chatHistory.length}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown del historial */}
      {showChatHistory && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Historial</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {caseData.chatHistory?.length > 0 ? (
              <div>
                {caseData.chatHistory.map((chat, index) => (
                  <button
                    key={index}
                    onClick={() => handleChatHistoryClick(chat)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800 truncate mb-1">
                      {chat.title || 'Conversación sin título'}
                    </p>
                    <p className="text-xs text-gray-500">{chat.date}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {chat.preview}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center gap-3">
                <p className="text-sm text-gray-500 mb-2">Sin conversaciones previas,¡Inicia Una!</p>
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
