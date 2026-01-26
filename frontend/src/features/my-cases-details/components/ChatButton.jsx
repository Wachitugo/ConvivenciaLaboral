import { useNavigate, useParams } from 'react-router-dom';

function ChatButton({ caseData, documents = [] }) {
  const navigate = useNavigate();
  const { schoolSlug } = useParams();

  const handleOpenChat = () => {
    const basePath = schoolSlug ? `/${schoolSlug}` : '';
    navigate(`${basePath}/chat-general`, {
      state: {
        relatedCase: {
          id: caseData.id,
          title: caseData.title,
          caseType: caseData.caseType,
          description: caseData.description,
          documents: documents // Pasar documentos para contexto inicial
        }
      }
    });
  };

  return (
    <button
      onClick={handleOpenChat}
      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 rounded-xl shadow-md hover:shadow-lg hover:bg-blue-700 text-white text-sm transition-all duration-300"
      title="Chat con Coni sobre este caso"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span className="text-sm font-semibold">Chat</span>
    </button>
  );
}

export default ChatButton;
