import ChatHeaderSkeleton from './ChatHeaderSkeleton';
import WelcomeMessageSkeleton from './WelcomeMessageSkeleton';
import SuggestionCardsSkeleton from './SuggestionCardsSkeleton';
import ChatInterfaceGeneralSkeleton from './ChatInterfaceGeneralSkeleton';

function ChatSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm shadow-cyan-600/20 bg-gray-100 border border-gray-200 overflow-hidden">
      {/* Header Skeleton */}
      <ChatHeaderSkeleton />

      {/* Área de mensajes - estado vacío con welcome, suggestions e input */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 custom-scrollbar flex items-center">
        <div className="max-w-3xl mx-auto w-full">
          <WelcomeMessageSkeleton />
          <SuggestionCardsSkeleton />
          <ChatInterfaceGeneralSkeleton />
        </div>
      </div>
    </div>
  );
}

export default ChatSkeleton;
