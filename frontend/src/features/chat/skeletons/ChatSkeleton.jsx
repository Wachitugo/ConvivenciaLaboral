import ChatHeaderSkeleton from './ChatHeaderSkeleton';
import WelcomeMessageSkeleton from './WelcomeMessageSkeleton';
import SuggestionCardsSkeleton from './SuggestionCardsSkeleton';
import ChatInterfaceGeneralSkeleton from './ChatInterfaceGeneralSkeleton';

function ChatSkeleton() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeaderSkeleton />

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 custom-scrollbar flex items-center">
        <div className="mx-auto w-full">
          <WelcomeMessageSkeleton />
          <SuggestionCardsSkeleton />
          <ChatInterfaceGeneralSkeleton />
        </div>
      </div>
    </div>
  );
}

export default ChatSkeleton;
