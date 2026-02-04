import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { API_URL } from '../../services/api';
import { createLogger } from '../../utils/logger';

const logger = createLogger('EmailComposer');

// Función para convertir markdown a HTML
const markdownToHtml = (text) => {
    if (!text) return '';

    // Primero procesamos todo el texto junto para manejar mejor los patrones
    let processed = text
        // ***texto*** -> negrita + cursiva
        .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
        // **texto** -> negrita (captura cualquier cosa que no sea asterisco)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // *texto* -> cursiva (solo si no empieza/termina con espacio y tiene contenido)
        .replace(/(?<!\*)\*([^*\s][^*]*?)\*(?!\*)/g, '<em>$1</em>');

    // Luego procesamos línea por línea para listas y saltos
    return processed
        .split('\n')
        .map(line => {
            // Procesar listas (viñetas)
            if (/^[\s]*[-•]\s/.test(line)) {
                return line.replace(/^[\s]*[-•]\s/, '• ');
            }
            // Lista con asterisco (solo si es marcador de lista, no negrita)
            if (/^[\s]*\*\s+[^*]/.test(line)) {
                return line.replace(/^[\s]*\*\s+/, '• ');
            }
            return line;
        })
        .join('<br>');
};

// Función para convertir HTML a texto con markdown (para enviar)
const htmlToMarkdown = (html) => {
    if (!html) return '';

    return html
        // Convertir <strong><em> a ***texto*** (negrita + cursiva)
        .replace(/<strong><em>(.*?)<\/em><\/strong>/gi, '***$1***')
        .replace(/<b><i>(.*?)<\/i><\/b>/gi, '***$1***')
        // Convertir <strong> y <b> a **texto** (negrita)
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b>(.*?)<\/b>/gi, '**$1**')
        // Convertir <em> y <i> a *texto* (cursiva)
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i>(.*?)<\/i>/gi, '*$1*')
        // Convertir <br> a saltos de línea
        .replace(/<br\s*\/?>/gi, '\n')
        // Convertir <div> a saltos de línea
        .replace(/<\/div><div>/gi, '\n')
        .replace(/<div>/gi, '\n')
        .replace(/<\/div>/gi, '')
        // Quitar otras etiquetas HTML pero mantener el contenido
        .replace(/<[^>]*>/g, '')
        // Limpiar entidades HTML
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        // Limpiar saltos de línea múltiples al inicio
        .replace(/^\n+/, '');
};

function EmailComposer({ to, subject, body, cc, introText, onSend, onCancel, sessionId, messageIndex, initialSuccess = false }) {
    const { current } = useTheme();
    const editorRef = useRef(null);

    // Get user from localStorage
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userStr = localStorage.getItem('usuario');
        if (userStr) {
            try {
                setUser(JSON.parse(userStr));
            } catch (e) {
                logger.error("Error parsing user from localStorage", e);
            }
        }
    }, []);

    // Inicializar el editor con el contenido HTML
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (editorRef.current && body && !initialized) {
            editorRef.current.innerHTML = markdownToHtml(body);
            setInitialized(true);
        }
    }, [body, initialized]);

    const [toInput, setToInput] = useState(to || '');
    const [ccInput, setCcInput] = useState(Array.isArray(cc) ? cc.join(', ') : (cc || ''));
    const [subjectInput, setSubjectInput] = useState(subject || '');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(initialSuccess);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);

    // Verificar el estado de formato actual
    const checkFormatState = () => {
        setIsBold(document.queryCommandState('bold'));
        setIsItalic(document.queryCommandState('italic'));
    };

    // Aplicar negrita
    const applyBold = (e) => {
        e.preventDefault();
        document.execCommand('bold', false, null);
        editorRef.current?.focus();
        checkFormatState();
    };

    // Aplicar cursiva
    const applyItalic = (e) => {
        e.preventDefault();
        document.execCommand('italic', false, null);
        editorRef.current?.focus();
        checkFormatState();
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setIsSending(true);
        setError(null);

        try {
            if (!user || !user.id) {
                throw new Error("Usuario no identificado. No se puede enviar el correo.");
            }

            // Obtener el contenido del editor y convertir a markdown
            const bodyContent = htmlToMarkdown(editorRef.current?.innerHTML || '');

            // Parse CC input to list
            const ccList = ccInput.split(',').map(email => email.trim()).filter(email => email);

            const response = await fetch(`${API_URL}/chat/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: toInput,
                    subject: subjectInput,
                    body: bodyContent,
                    user_id: user.id,
                    cc: ccList,
                    session_id: sessionId,
                    message_id: messageIndex
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Error al enviar el correo");
            }

            setSuccess(true);
            if (onSend) onSend();

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSending(false);
        }
    };

    if (success) {
        return (
            <div className={`w-full h-full flex items-center justify-center animate-fade-in`}>
                <div className=" rounded-2xl p-8 text-center shadow-sm w-full">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4 shadow-sm">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-green-900 mb-2">¡Correo enviado!</h3>
                    <p className="text-md text-green-700 leading-relaxed">
                        El correo se ha enviado correctamente desde tu cuenta.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col font-sans animate-fade-in space-y-4">
            <div className={`w-full flex-grow overflow-hidden rounded-xl ${current.cardBg} flex flex-col transition-all duration-300`}>

                {/* Header de la tarjeta */}
                <div className={`px-6 py-4 bg-gray-50 border-b ${current.cardBorder || 'border-gray-100'}`}>
                    {introText && (
                        <div className={`px-1 text-sm ${current.textSecondary} italic font-medium`}>
                            {introText}
                        </div>
                    )}
                </div>

                <div className="p-6 flex flex-col gap-5 flex-grow">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Input Para */}
                    <div className="group">
                        <h2 className={`text-lg mb-1 font-bold text-blue-800`}>Redactar nuevo mensaje</h2>
                        <div className={`flex items-center border-b ${current.inputBorder || 'border-gray-200'} group-focus-within:border-blue-400 transition-colors py-1`}>
                            <span className={`text-gray-400 w-16 font-medium text-md`}>Para:</span>
                            <input
                                type="email"
                                value={toInput}
                                onChange={(e) => setToInput(e.target.value)}
                                className={`w-full px-2 py-2 focus:outline-none bg-transparent ${current.textPrimary} placeholder-gray-300 text-sm`}
                                style={{ fontFamily: "'Open Sans', sans-serif" }}
                                placeholder="destinatario@ejemplo.com"
                            />
                        </div>
                    </div>

                    {/* Input CC */}
                    <div className="group">
                        <div className={`flex items-center border-b ${current.inputBorder || 'border-gray-200'} group-focus-within:border-blue-400 transition-colors py-1`}>
                            <span className={`text-gray-400 w-16 font-medium text-md`}>CC:</span>
                            <input
                                type="text"
                                value={ccInput}
                                onChange={(e) => setCcInput(e.target.value)}
                                className={`w-full px-2 py-2 focus:outline-none bg-transparent ${current.textPrimary} placeholder-gray-300 text-sm`}
                                style={{ fontFamily: "'Open Sans', sans-serif" }}
                                placeholder="copia@ejemplo.com, otro@ejemplo.com"
                            />
                        </div>
                    </div>

                    {/* Input Asunto */}
                    <div className="group">
                        <div className={`flex items-center border-b ${current.inputBorder || 'border-gray-200'} group-focus-within:border-blue-400 transition-colors py-1`}>
                            <span className={`text-gray-400 w-16 font-medium text-md`}>Asunto:</span>
                            <input
                                type="text"
                                value={subjectInput}
                                onChange={(e) => setSubjectInput(e.target.value)}
                                className={`w-full px-2 py-2 focus:outline-none bg-transparent ${current.textPrimary} font-bold placeholder-gray-300 text-sm`}
                                style={{ fontFamily: "'Open Sans', sans-serif" }}
                                placeholder="Título del mensaje"
                            />
                        </div>
                    </div>

                    {/* Cuerpo del mensaje con editor WYSIWYG */}
                    <div className="flex-grow min-h-[200px] flex flex-col">
                        {/* Toolbar de formato */}
                        <div className="flex items-center gap-1 mb-2 pb-2 border-b border-gray-100">
                            <button
                                type="button"
                                onMouseDown={applyBold}
                                className={`p-2 rounded-lg transition-colors ${isBold ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                                title="Negrita (Ctrl+B)"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
                                </svg>
                            </button>
                            <button
                                type="button"
                                onMouseDown={applyItalic}
                                className={`p-2 rounded-lg transition-colors ${isItalic ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                                title="Cursiva (Ctrl+I)"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
                                </svg>
                            </button>
                            <span className="text-xs text-gray-400 ml-2">Selecciona texto y haz clic para aplicar formato</span>
                        </div>

                        {/* Editor contentEditable */}
                        <div
                            ref={editorRef}
                            contentEditable
                            onSelect={checkFormatState}
                            onKeyUp={checkFormatState}
                            onClick={checkFormatState}
                            className={`w-full flex-grow min-h-[180px] resize-none focus:outline-none bg-white ${current.textPrimary} leading-relaxed text-sm border border-gray-200 rounded-lg p-3 overflow-y-auto focus:border-blue-400 transition-colors`}
                            style={{ fontFamily: "'Open Sans', sans-serif" }}
                            suppressContentEditableWarning={true}
                        />
                    </div>

                    {/* Footer con botón Enviar */}
                    <div className="flex items-center justify-end pt-4 border-t border-gray-50 gap-3">
                        <button
                            onClick={onCancel}
                            className={`${current.textSecondary} hover:${current.textPrimary} text-sm font-medium px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors`}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isSending}
                            className={`flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm shadow-blue-200 transition-all transform active:scale-95 ${isSending ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {isSending ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <span>Enviar</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmailComposer;
