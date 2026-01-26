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
  const hasSidePanels = selectedFile || showFileList || showCaseList;

  return (
    <div className={`flex-1 flex flex-col rounded-lg shadow-md ${current.cardBg} border border-gray-300 ${hasSidePanels ? 'mr-2' : ''} transition-all duration-300 overflow-hidden`}>
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

      <div className={`flex-1 overflow-y-auto overflow-x-hidden px-4 custom-scrollbar ${messages.length === 0 ? 'flex items-center' : 'pt-32'}`}>
        <div className="max-w-3xl mx-auto w-full">
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
          {/* Input centrado cuando no hay mensajes */}
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
        <div className="px-4 pb-4 flex-shrink-0">
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
              initialFiles={chatFiles} // Pasar archivos cargados inicialmente
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
