import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function ChatInterface({ onSubmit, onAIResponse }) {
  const { current } = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Si hay un callback onSubmit, verificar si permite el envío
    if (onSubmit) {
      const canSubmit = onSubmit(input);
      if (!canSubmit) {
        // No limpiar el input si no se permite el envío
        return;
      }
    }

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');

    // Mostrar estado "pensando"
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);

      // Si hay callback onAIResponse, usarlo
      if (onAIResponse) {
        const response = onAIResponse();
        // Si retorna null, no agregar respuesta (se abrirá el modal)
        if (response === null) {
          return;
        }
        // Si retorna una respuesta, agregarla
        const aiResponse = {
          role: 'assistant',
          content: response
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        // Comportamiento por defecto
        const aiResponse = {
          role: 'assistant',
          content: 'Esta es una respuesta simulada. Aquí se integraría tu API de IA.'
        };
        setMessages(prev => [...prev, aiResponse]);
      }
    }, 1500);
  };

  return (
    <div className="relative ">
 

      {/* Contenido del chat */}
      <div className={`relative rounded-2xl`}>
        {/* Indicador de "pensando..." */}
        {isThinking && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span>Pensando...</span>
          </div>
        )}

        {/* Input con botones integrados - mejorado */}
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`w-full px-5 py-5 mb-2 pr-32 pb-10 text-sm md:text-base border-2 ${current.inputBorder} rounded-2xl ${current.inputBg} ${current.textPrimary} placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-md hover:shadow-md`}
            placeholder="Pregúntame lo que necesites..."
          />

          {/* Botón "Pruébalo" - abajo a la izquierda con icono */}
          <button
            type="button"
            className={`absolute left-4 bottom-4 px-4  rounded-md ${current.formBg} border ${current.inputBorder} flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all text-xs md:text-sm ${current.textSecondary} font-medium hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
          >
           
            Pruébalo ahora
          </button>

          {/* Botón enviar - abajo a la derecha con animación */}
          <button
            type="submit"
            className="absolute right-4 bottom-4 w-11 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 group"
          >
            <svg className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>

  
      </div>
    </div>
  );
}

export default ChatInterface;