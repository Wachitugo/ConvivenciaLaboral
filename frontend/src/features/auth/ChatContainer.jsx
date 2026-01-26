import loginImage from '../assets/login1.png';
import ChatInterface from './ChatInterface';

function ChatContainer() {
  return (
    <div className="flex gap-8 bg-gray-800 rounded-3xl shadow-xl border border-gray-700 p-8">
      {/* Imagen a la izquierda */}
      <div className="flex-1 max-w-lg">
        <img
          src={loginImage}
          alt="Asistente de IA"
          className="rounded-2xl shadow-lg object-cover w-full h-[600px]"
        />
      </div>

      {/* Contenedor para el chat */}
      <div className="flex flex-col items-center justify-center w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-white">Chat con IA</h1>
        <p className="text-gray-300 text-center mb-8">
          Conversa con nuestro asistente inteligente para resolver tus dudas
        </p>

        <ChatInterface />
      </div>
    </div>
  );
}

export default ChatContainer;
