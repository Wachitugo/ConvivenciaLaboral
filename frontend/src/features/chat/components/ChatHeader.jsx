import HeaderButtons from './HeaderButtons';

function ChatHeader({
  chatTitle,
  relatedCase,
  isSidebarOpen,
  toggleSidebar,
  chatFiles,
  showFileList,
  showOptionsMenu,
  toggleFileList,
  setShowOptionsMenu,
  onExportPDF,
  onExportWord,
  onGenerateCase,
  onClearChat,
  messagesCount,
  isGeneratingCase
}) {

  return (
    <div className="px-4 py-3 grid grid-cols-3 items-center flex-shrink-0">
      {/* Botón toggle sidebar — solo móvil (en desktop está en el sidebar) */}
      <div className="flex justify-start lg:hidden">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all"
          title={isSidebarOpen ? "Cerrar sidebar" : "Abrir sidebar"}
        >
          {isSidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>
      {/* Espacio vacío en desktop para mantener el grid */}
      <div className="hidden lg:block" />

      {/* Título centrado — oculto cuando no hay mensajes */}
      <div className="flex flex-col items-center gap-0.5">
        {messagesCount > 0 && (
          <>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#34B6D8]">Consulta activa</span>
            <h1
              className="text-[0.9rem] font-bold text-white truncate max-w-md tracking-tight leading-tight"
              style={{ fontFamily: "'Poppins', sans-serif" }}
              title={chatTitle}
            >
              {chatTitle}
            </h1>
          </>
        )}
      </div>

      {/* Botones de acción */}
      <HeaderButtons
        chatFiles={chatFiles}
        showFileList={showFileList}
        showOptionsMenu={showOptionsMenu}
        relatedCase={relatedCase}
        toggleFileList={toggleFileList}
        setShowOptionsMenu={setShowOptionsMenu}
        onExportPDF={onExportPDF}
        onExportWord={onExportWord}
        onGenerateCase={onGenerateCase}
        onClearChat={onClearChat}
        messagesCount={messagesCount}
        isGeneratingCase={isGeneratingCase}
      />
    </div>
  );
}

export default ChatHeader;
