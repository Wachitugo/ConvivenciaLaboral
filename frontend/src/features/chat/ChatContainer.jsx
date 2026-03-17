import { useTheme } from '../../contexts/ThemeContext';
import ChatInterfaceGeneral from './ChatInterfaceGeneral';
import GeneratingCaseModal from './GeneratingCaseModal';
import { useAutoScroll } from './hooks';
import { ChatHeader, ChatMessages } from './components';

function ChatContainer({
  chatTitle,
  messages,
  isThinking,
  thinkingText,
  relatedCase,
  chatFiles,
  showFileList,
  showCaseList,
  showOptionsMenu,
  selectedFile,
  isSidebarOpen,
  toggleSidebar,
  toggleFileList,
  toggleCaseList,
  setShowOptionsMenu,
  onSendMessage,
  onSuggestionClick,
  onFileClick,
  onLike,
  onDislike,
  onDownload,
  onExportPDF,
  onExportWord,
  onGenerateCase,
  onClearChat,
  isGeneratingCase,
  loadingProgress = 0,
  onCompleteStep,
  onStopGenerating,
  availableCases,
  onCaseSelect,
  isStreaming,
  filesToAddToInput,
  onFilesAddedToInput,
  sessionId
}) {
  const { current } = useTheme();
  const { endRef } = useAutoScroll([messages, isThinking]);

  return (
    <div className={`flex-1 flex flex-col  transition-all duration-300 overflow-hidden`}>
 <ChatHeader
        chatTitle={chatTitle}
        relatedCase={relatedCase}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        chatFiles={chatFiles}
        showFileList={showFileList}
        showOptionsMenu={showOptionsMenu}
        toggleFileList={toggleFileList}
        setShowOptionsMenu={setShowOptionsMenu}
        onExportPDF={onExportPDF}
        onExportWord={onExportWord}
        onGenerateCase={onGenerateCase}
        onClearChat={onClearChat}
        messagesCount={messages.length}
        isGeneratingCase={isGeneratingCase}
      />

      {/* Contenedor principal relativo para estar por encima del fondo */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10 ${messages.length === 0 ? 'flex items-center px-8' : ' px-4'}`}>
        <div className="max-w-7xl mx-auto w-full">
          <ChatMessages
            messages={messages}
            isThinking={isThinking}
            thinkingText={thinkingText}
            endRef={endRef}
            onSuggestionClick={onSuggestionClick}
            onFileClick={onFileClick}
            onLike={onLike}
            onDislike={onDislike}
            onDownload={onDownload}
            onCompleteStep={onCompleteStep}
            sessionId={sessionId}
          />
          {/* Input centrado cuando no hay mensajes - Se superpone elegantemente a la mesa */}
          {messages.length === 0 && (
            <ChatInterfaceGeneral
              onSendMessage={onSendMessage}
              relatedCase={relatedCase}
              isThinking={isThinking}
              onStopGenerating={onStopGenerating}
              onSuggestionClick={onSuggestionClick}
              hasMessages={false}
              availableCases={availableCases}
              onCaseSelect={onCaseSelect}
              isStreaming={isStreaming}
              initialFiles={chatFiles}
              filesToAddToInput={filesToAddToInput}
              onFilesAddedToInput={onFilesAddedToInput}
            />
          )}
        </div>
      </div>

      {/* Interfaz del chat - siempre al fondo - Fija cuando hay mensajes */}
      {messages.length > 0 && (
        <div className="px-4 pb-4 flex-shrink-0 relative z-10">
          <div className="max-w-3xl mx-auto">
            <ChatInterfaceGeneral
              onSendMessage={onSendMessage}
              relatedCase={relatedCase}
              isThinking={isThinking}
              onStopGenerating={onStopGenerating}
              onSuggestionClick={onSuggestionClick}
              hasMessages={true}
              availableCases={availableCases}
              onCaseSelect={onCaseSelect}
              isStreaming={isStreaming}
              initialFiles={chatFiles}
              filesToAddToInput={filesToAddToInput}
              onFilesAddedToInput={onFilesAddedToInput}
            />
          </div>
        </div>
      )}

      {/* Modal de generación de caso */}
      <GeneratingCaseModal isOpen={isGeneratingCase} progress={loadingProgress} />
    </div>
  );
}

export default ChatContainer;