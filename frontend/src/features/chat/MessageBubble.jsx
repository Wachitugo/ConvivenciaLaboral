import { useState } from 'react';
import FileAttachment from './FileAttachment';
import ProtocolView from './ProtocolView';
import { API_URL } from '../../services/api';
import EmailComposer from './EmailComposer';
import CalendarEventComposer from './CalendarEventComposer';
import { createLogger } from '../../utils/logger';
import AvatarChat from '../../assets/avatar-chat.svg';

const logger = createLogger('MessageBubble');

function MessageBubble({ message, messageIndex, onFileClick, onLike, onDislike, onDownload, onCompleteStep, onSuggestionClick, sessionId }) {
  const isUser = message.sender === 'user';
  const [showCopied, setShowCopied] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Estado para controlar si el correo se envió (para ocultar el composer o mostrar éxito)
  const [emailSent, setEmailSent] = useState(false);
  const [composerCancelled, setComposerCancelled] = useState(false);


  // Función para manejar el copiado
  const handleCopy = async () => {
    if (onDownload) {
      await onDownload(message);
      setShowCopied(true);
      setIsFadingOut(false);

      // Empezar a desvanecer después de 1.5s
      setTimeout(() => setIsFadingOut(true), 1500);

      // Ocultar completamente después de que termine la animación
      setTimeout(() => {
        setShowCopied(false);
        setIsFadingOut(false);
      }, 2000);
    }
  };

  // Función para extraer JSON de protocolo O borrador de email del texto
  const extractContent = (text) => {
    if (!text) return { type: 'none' };

    // 0. First, try to parse as raw JSON (for success messages saved directly)
    if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
      try {
        const data = JSON.parse(text);

        // Check for success types first
        if (data.type === 'email_success') {
          return { type: 'email_success', data: data, textBefore: '', textAfter: '' };
        }
        if (data.type === 'calendar_success') {
          return { type: 'calendar_success', data: data, textBefore: '', textAfter: '' };
        }

        // Also handle draft types that might be saved as raw JSON
        if (data.type === 'email_draft' || (data.to && data.subject && data.body)) {
          if (!data.type) data.type = 'email_draft';
          if (!data.cc) data.cc = [];
          return { type: 'email_draft', draft: data, textBefore: '', textAfter: '' };
        }

        if (data.type === 'calendar_draft' || (data.summary && data.start_time && data.end_time)) {
          if (!data.type) data.type = 'calendar_draft';
          return { type: 'calendar_draft', draft: data, textBefore: '', textAfter: '' };
        }
      } catch (e) {
        // Not valid JSON, continue with other checks
      }
    }

    // 1. Buscar bloque JSON completo ```json ... ``` (o sin json)
    const patterns = [
      /```json\s*(\{[\s\S]*?\})\s*```/,
      /```\s*(\{[\s\S]*?\})\s*```/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const data = JSON.parse(match[1]);

          // Detectar Protocolo
          if (data.protocol_name && data.steps) {
            return {
              type: 'complete',
              protocol: data,
              textBefore: text.substring(0, match.index).trim(),
              textAfter: text.substring(match.index + match[0].length).trim()
            };
          }

          // Detectar Borrador de Email
          if (data.type === 'email_draft' || (data.to && data.subject && data.body)) {
            // Asegurar que tenga el tipo para el resto del flujo
            if (!data.type) data.type = 'email_draft';
            if (!data.cc) data.cc = [];

            return {
              type: 'email_draft',
              draft: data,
              textBefore: text.substring(0, match.index).trim(),
              textAfter: text.substring(match.index + match[0].length).trim()
            };
          }

          // Detectar Borrador de Calendario
          if (data.type === 'calendar_draft' || (data.summary && data.start_time && data.end_time)) {
            // Asegurar tipo
            if (!data.type) data.type = 'calendar_draft';

            return {
              type: 'calendar_draft',
              draft: data,
              textBefore: text.substring(0, match.index).trim(),
              textAfter: text.substring(match.index + match[0].length).trim()
            };
          }

          // Detectar Email Success
          if (data.type === 'email_success') {
            return {
              type: 'email_success',
              data: data,
              textBefore: text.substring(0, match.index).trim(),
              textAfter: text.substring(match.index + match[0].length).trim()
            };
          }

          // Detectar Calendar Success
          if (data.type === 'calendar_success') {
            return {
              type: 'calendar_success',
              data: data,
              textBefore: text.substring(0, match.index).trim(),
              textAfter: text.substring(match.index + match[0].length).trim()
            };
          }

          // Detectar Borrador de Email envuelto (común en ciertos modelos)
          if (data.prepare_email_content_response && data.prepare_email_content_response.type === 'email_draft') {
            return {
              type: 'email_draft',
              draft: data.prepare_email_content_response,
              textBefore: text.substring(0, match.index).trim(),
              textAfter: text.substring(match.index + match[0].length).trim()
            };
          }

          // Detectar Borrador de Calendario envuelto
          if (data.prepare_calendar_event_response && data.prepare_calendar_event_response.type === 'calendar_draft') {
            return {
              type: 'calendar_draft',
              draft: data.prepare_calendar_event_response,
              textBefore: text.substring(0, match.index).trim(),
              textAfter: text.substring(match.index + match[0].length).trim()
            };
          }

        } catch (e) {
          logger.error("Error parsing JSON:", e);
          return { type: 'error', error: e.message, raw: match[1] };
        }
      }
    }

    // 2. Buscar bloque JSON en progreso (streaming)
    const streamingMatch = text.match(/```json\s*(\{[\s\S]*)$/);
    if (streamingMatch) {
      if (!streamingMatch[0].includes('```', 7)) {
        return {
          type: 'streaming',
          textBefore: text.substring(0, streamingMatch.index).trim()
        };
      }
    }

    return { type: 'none' };
  };

  // Procesar contenido del mensaje
  let messageContent = message.text;
  let additionalFiles = [];

  if (Array.isArray(message.text)) {
    // ... (logic for files remains same) ...
    const textParts = [];
    message.text.forEach(part => {
      if (part.type === 'text') {
        textParts.push(part.text);
      } else if (part.type === 'image_url') {
        // ... (file extraction logic) ...
        const gcsUrl = part.image_url.url;
        let fileName = 'Archivo adjunto';
        let fileUrl = gcsUrl;
        let fileType = 'application/octet-stream';

        if (gcsUrl.startsWith('gs://')) {
          const parts = gcsUrl.split('/');
          if (parts.length >= 4) {
            fileName = parts[parts.length - 1];
            const sessionId = parts[parts.length - 2];
            // Construir URL del backend usando configuración centralizada
            fileUrl = `${API_URL}/chat/files/${sessionId}/${encodeURIComponent(fileName)}`;

            const ext = fileName.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
              fileType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            } else if (ext === 'pdf') {
              fileType = 'application/pdf';
            } else if (['doc', 'docx'].includes(ext)) {
              fileType = 'application/msword';
            }
          }
        }

        additionalFiles.push({
          id: Date.now() + Math.random(),
          name: fileName,
          type: fileType,
          url: fileUrl,
          isRemote: true
        });
      }
    });
    messageContent = textParts.join('\n');
  }

  const contentData = !isUser ? extractContent(messageContent) : { type: 'none' };

  // Combinar archivos ...
  const allFiles = [...(message.files || []), ...additionalFiles];

  // ... (renderFormattedText function remains same) ...
  const renderFormattedText = (text) => {
    // ... (implementation of renderFormattedText) ...
    if (!text) return null;

    const lines = text.split('\n');
    let inRefSection = false;

    return lines.map((line, lineIndex) => {
      if (line.trim() === '') return <span key={lineIndex} className="block h-2" />;

      const isTitle = line.trim().endsWith(':') && line.trim().length < 100;
      const isListItem = /^[\s]*[-*]\s/.test(line);

      // Detectar si es un subtítulo en cursiva o negrita dentro de una lista
      // Formato: "- *Texto en cursiva*" o "- **Texto en negrita:**" 
      const isItalicSubtitle = isListItem && (/^[\s]*[-*]\s*\*[^*]+\*:?\s*$/.test(line) || /^[\s]*[-*]\s*\*\*[^*]+\*\*:?\s*$/.test(line));

      const isQuote = line.trim().startsWith('>');
      const headerMatch = line.trim().match(/^(#{1,6})\s+(.+)$/);
      const isHorizontalRule = /^(-{3,}|\*{3,}|_{3,})$/.test(line.trim());

      const lowerLine = line.toLowerCase().trim();
      const isHeaderMatch = headerMatch || /^#{1,6}/.test(line.trim());
      const trimmedLine = line.trim();
      const isBoldTitle = (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) ||
        (trimmedLine.startsWith('***') && trimmedLine.endsWith('***') && trimmedLine.length > 6);

      if (isHeaderMatch || isBoldTitle) {
        if (lowerLine.includes('referencia') || lowerLine.includes('anexo') || lowerLine.includes('fuentes')) {
          inRefSection = true;
        }
      }

      if (isHorizontalRule) return <hr key={lineIndex} className="my-4 border-t border-white/20" />;

      const textClass = inRefSection ? "text-xs text-gray-400 leading-tight" : "";

      if (headerMatch) {
        const level = headerMatch[1].length;
        const content = headerMatch[2].replace(/\*\*/g, '').trim();
        if (inRefSection) {
          return <div key={lineIndex} className="text-xs font-bold mt-4 mb-2 text-gray-400 uppercase tracking-wide block">{content}</div>;
        }
        const sizes = { 1: "text-xl", 2: "text-lg", 3: "text-base", 4: "text-base", 5: "text-sm", 6: "text-sm" };
        return <div key={lineIndex} className={`${sizes[level] || sizes[3]} font-bold mt-3 mb-2 text-blue-300 block`}>{content}</div>;
      }

      if (isBoldTitle) {
        const cleanContent = line.replace(/\*/g, '').trim();
        return <div key={lineIndex} className="text-base font-bold mt-3 mb-2 text-blue-200 block">{cleanContent}</div>;
      }

      if (isQuote) {
        const quoteContent = line.replace(/^>\s*/, '');
        return (
          <div key={lineIndex} className="my-2 pl-4 border-l-3 border-blue-400 bg-blue-900/20 py-2.5 pr-3 rounded-r-xl">
            <p className={`${inRefSection ? 'text-xs' : 'text-sm'} italic text-gray-300 text-justify leading-relaxed`}>{quoteContent}</p>
          </div>
        );
      }

      // Si es un subtítulo en cursiva (dentro de lista)
      if (isItalicSubtitle) {
        const content = line.replace(/^[\s]*[-*]\s*\*+/, '').replace(/\*+:?\s*$/, '');
        return (
          <div key={lineIndex} className="text-sm font-semibold mt-3 mb-1.5 text-blue-300 block pl-0">
            {content}
          </div>
        );
      }

      const parts = line.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g);
      return (
        <span key={lineIndex} className={`block ${isListItem ? 'pl-4 relative my-1' : ''} ${textClass}`}>
          {isListItem && <span className={`absolute left-0 font-bold ${inRefSection ? 'text-gray-500 text-[10px] top-0.5' : 'text-blue-400'}`}>•</span>}
          {parts.map((part, partIndex) => {
            if (part.startsWith('***') && part.endsWith('***')) return <strong key={partIndex} className="font-bold italic text-blue-200">{part.slice(3, -3)}</strong>;
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={partIndex} className="font-bold text-blue-200">{part.slice(2, -2)}</strong>;
            if (part.startsWith('*') && part.endsWith('*')) {
              // Solo aplicar padding izquierdo si no es el primer elemento con contenido
              const isFirstPart = partIndex === 0 || parts.slice(0, partIndex).every(p => !p.trim());
              const paddingLeft = isFirstPart ? '0' : '0.3em';

              return (
                <em
                  key={partIndex}
                  className="italic text-gray-300 text-sm inline-block"
                  style={{ letterSpacing: '0.01em', paddingLeft, paddingRight: '0.3em' }}
                >
                  {part.slice(1, -1)}
                </em>
              );
            }

            // Limpiar asteriscos sueltos que no forman parte del formato
            let cleanText = part;

            // Si es un item de lista, remover el marcador de lista
            if (isListItem) {
              cleanText = cleanText.replace(/^[\s]*[-*]\s/, '');
            }

            // Remover asteriscos sueltos que pueden quedar al final o inicio
            cleanText = cleanText.replace(/\*+$/, '').replace(/^\*+/, '');

            return <span key={partIndex}>{cleanText}</span>;
          })}
        </span>
      );
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group w-full`}>
      {/* Mensaje del usuario */}
      {isUser ? (
        <div className="flex gap-3 flex-row-reverse max-w-[85%] animate-fade-in">
          {/* Avatar usuario */}
          <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-[#0A3866] flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {message.senderInitials || 'Tú'}
          </div>

          <div className="flex flex-col gap-1 items-end">
            {messageContent && (
              <div className="bg-[#1A71B8] text-white px-5 py-3.5 rounded-2xl rounded-tr-none shadow-sm ring-1 ring-[#1A71B8]/40">
                <p className="text-[1rem] font-[450] leading-[1.65] tracking-[0.008em] whitespace-pre-wrap">
                  {messageContent}
                </p>
                {message.timestamp && (
                  <div className="flex items-center gap-1 mt-2 opacity-50">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[9px] font-bold uppercase tracking-widest">
                      {new Date(message.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            )}

            {allFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allFiles.map((file) => (
                  <FileAttachment
                    key={file.id}
                    file={file}
                    onClick={onFileClick}
                    isUserMessage={isUser}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Mensaje de la IA */
        <div className="w-full flex gap-3 animate-fade-in">
       

          <div className="flex-1 flex flex-col gap-2 max-w-[85%]">
            {/* Solo mostrar la burbuja de texto si hay contenido o hay un protocolo activo */}
            {(messageContent?.trim() || contentData.type !== 'none') && (
              <div
                className={`text-[1rem] font-[450] text-[#E8EDF5] leading-[1.75] tracking-[0.008em] space-y-0.5 text-justify
                          ${(contentData.type === 'email_draft' || contentData.type === 'calendar_draft') ? 'p-0 overflow-hidden' : 'px-5 py-4'}
                          rounded-2xl rounded-tl-none bg-gray-800 backdrop-blur-sm border border-white/10
                          shadow-sm hover:shadow-md hover:shadow-black/20 transition-shadow duration-200 max-w-full`}
              >
                {contentData.type === 'complete' ? (
                  <>
                    {contentData.textBefore && <div className="mb-2">{renderFormattedText(contentData.textBefore)}</div>}
                    <ProtocolView protocol={contentData.protocol} onCompleteStep={onCompleteStep} />
                    {contentData.textAfter && <div className="mt-2">{renderFormattedText(contentData.textAfter)}</div>}
                  </>
                ) : contentData.type === 'email_draft' ? (
                  <>
                    {composerCancelled ? (
                      // Mostrar solo texto cuando se cancela
                      <>
                        {contentData.textBefore && <div className="mb-2">{renderFormattedText(contentData.textBefore)}</div>}
                        <div className="p-4 bg-white/8 border border-white/10 rounded-lg text-gray-400 text-sm italic">
                          Borrador de email cancelado
                        </div>
                      </>
                    ) : (
                      <EmailComposer
                        to={contentData.draft.to}
                        subject={contentData.draft.subject}
                        body={contentData.draft.body}
                        cc={contentData.draft.cc}
                        introText={contentData.textBefore}
                        onSend={() => setEmailSent(true)}
                        onCancel={() => setComposerCancelled(true)}
                        sessionId={sessionId}
                        messageIndex={messageIndex}
                      />
                    )}
                    {contentData.textAfter && <div className="mt-2">{renderFormattedText(contentData.textAfter)}</div>}
                  </>
                ) : contentData.type === 'calendar_draft' ? (
                  <>
                    {composerCancelled ? (
                      // Mostrar solo texto cuando se cancela
                      <>
                        {contentData.textBefore && <div className="mb-2">{renderFormattedText(contentData.textBefore)}</div>}
                        <div className="p-4 bg-white/8 border border-white/10 rounded-lg text-gray-400 text-sm italic">
                          Borrador de evento de calendario cancelado
                        </div>
                      </>
                    ) : (
                      <CalendarEventComposer
                        summary={contentData.draft.summary}
                        start_time={contentData.draft.start_time}
                        end_time={contentData.draft.end_time}
                        description={contentData.draft.description}
                        attendees={contentData.draft.attendees}
                        introText={contentData.textBefore}
                        onSend={() => setEmailSent(true)}
                        onCancel={() => setComposerCancelled(true)}
                        sessionId={sessionId}
                        messageIndex={messageIndex}
                      />
                    )}
                    {contentData.textAfter && <div className="mt-2">{renderFormattedText(contentData.textAfter)}</div>}
                  </>
                ) : contentData.type === 'email_success' ? (
                  // Email success card
                  <div className="w-full flex flex-col items-center justify-center py-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left shadow-sm border border-white/15 max-w-md w-full">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-white mb-1">Correo enviado exitosamente</h3>
                          <p className="text-sm text-gray-300">El correo ha sido enviado desde tu cuenta.</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 min-w-[60px]">📧 Para:</span>
                          <span className="text-gray-100">{contentData.data.to}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 min-w-[60px]">📝 Asunto:</span>
                          <span className="text-gray-100">{contentData.data.subject}</span>
                        </div>
                        {contentData.data.cc && contentData.data.cc.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-400 min-w-[60px]">📄 CC:</span>
                            <span className="text-gray-100">{contentData.data.cc.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : contentData.type === 'calendar_success' ? (
                  // Calendar success card
                  <div className="w-full flex flex-col items-center justify-center py-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left shadow-sm border border-white/15 max-w-md w-full">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-white mb-1">Evento agendado exitosamente</h3>
                          <p className="text-sm text-gray-300">El evento **{contentData.data.summary}** ha sido creado en el calendario.</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 min-w-[60px]">📅 Inicio:</span>
                          <span className="text-gray-900">
                            {(() => {
                              const date = new Date(contentData.data.start_time);
                              return date.toLocaleString('es-CL', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              });
                            })()}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 min-w-[60px]">📅 Fin:</span>
                          <span className="text-gray-900">
                            {(() => {
                              const date = new Date(contentData.data.end_time);
                              return date.toLocaleString('es-CL', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              });
                            })()}
                          </span>
                        </div>
                        {contentData.data.attendees && contentData.data.attendees.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-400 min-w-[60px]">👥 Asistentes:</span>
                            <span className="text-gray-100">{contentData.data.attendees.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : contentData.type === 'streaming' ? (
                  <>
                    {contentData.textBefore && (
                      <div className="mb-2">
                        {renderFormattedText(contentData.textBefore)}
                      </div>
                    )}
                    <div className="mt-4 mb-4 rounded-2xl border border-white/10 p-4 bg-white/8">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-[#34B6D8] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-gray-300">Generando respuesta...</span>
                      </div>
                    </div>
                  </>
                ) : contentData.type === 'error' ? (
                  <>
                    {contentData.textBefore && <div className="mb-2">{renderFormattedText(contentData.textBefore)}</div>}
                    <div className="p-4 bg-red-900/20 border border-red-400/30 rounded-2xl text-red-400 text-sm shadow-sm">
                      <p className="font-semibold flex items-center gap-2">Error visualizando contenido</p>
                      <p className="mt-1.5">{contentData.error}</p>
                    </div>
                  </>
                ) : (
                  renderFormattedText(messageContent)
                )}
              </div>
            )}


            {allFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allFiles.map((file) => (
                  <FileAttachment
                    key={file.id}
                    file={file}
                    onClick={onFileClick}
                    isUserMessage={isUser}
                  />
                ))}
              </div>
            )}

            {/* Sugerencias de preguntas */}
            {message.suggestions && message.suggestions.length > 0 && !message.isStreaming && (
              <div className="mt-2 animate-fade-in flex flex-wrap gap-2">
                {message.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
                    className="px-4 py-2 bg-white/8 border border-white/15 text-[#34B6D8] text-[11px] font-bold uppercase tracking-[0.12em] rounded-xl hover:border-white/30 hover:bg-white/15 hover:-translate-y-0.5 hover:shadow-sm transition-all shadow-sm active:scale-95"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Botones de interacción */}
            {messageContent && messageContent.trim().length > 0 && !message.isStreaming && (
              <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 animate-fade-in">
                {message.timestamp && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(message.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}

                <div className="relative">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-[#34B6D8] transition-all duration-200"
                    title="Copiar respuesta"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {showCopied && (
                    <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#0A3866] text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
                      Copiado!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageBubble;