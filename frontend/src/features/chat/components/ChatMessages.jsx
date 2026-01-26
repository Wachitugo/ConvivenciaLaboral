import { MessageBubble, WelcomeMessage, ThinkingIndicator } from '../';

// Helper function to format date for separator
const formatDateSeparator = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date);

  // Reset hours to compare just dates
  const isToday = messageDate.toDateString() === today.toDateString();
  const isYesterday = messageDate.toDateString() === yesterday.toDateString();

  if (isToday) {
    return 'Hoy';
  } else if (isYesterday) {
    return 'Ayer';
  } else {
    return messageDate.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

// Helper to check if two dates are different days
const isDifferentDay = (date1, date2) => {
  if (!date1 || !date2) return true;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() !== d2.toDateString();
};

// Date separator component
const DateSeparator = ({ date }) => (
  <div className="flex items-center justify-center my-4">
    <div className="bg-gray-100 text-gray-600 text-xs font-medium px-4 py-1.5 rounded-full shadow-sm border border-gray-200">
      {formatDateSeparator(date)}
    </div>
  </div>
);

function ChatMessages({
  messages,
  isThinking,
  thinkingText,
  endRef,
  onSuggestionClick,
  onFileClick,
  onLike,
  onDislike,
  onDownload,
  onCompleteStep,
  sessionId
}) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6">
        <WelcomeMessage />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-2">
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showDateSeparator = isDifferentDay(prevMessage?.timestamp, message.timestamp);

        return (
          <div key={message.id}>
            {showDateSeparator && message.timestamp && (
              <DateSeparator date={message.timestamp} />
            )}
            <MessageBubble
              message={message}
              messageIndex={index}
              onFileClick={onFileClick}
              onLike={onLike}
              onDislike={onDislike}
              onDownload={onDownload}
              onCompleteStep={onCompleteStep}
              onSuggestionClick={onSuggestionClick}
              sessionId={sessionId}
            />
          </div>
        );
      })}
      {isThinking && <ThinkingIndicator text={thinkingText} />}
      <div ref={endRef} />
    </div>
  );
}

export default ChatMessages;
