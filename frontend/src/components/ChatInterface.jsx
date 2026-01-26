import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Mic, Calendar, Mail } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatService } from '../services/api';
import { createLogger } from '../utils/logger';

const logger = createLogger('ChatInterface');

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [schoolName, setSchoolName] = useState('Colegio Alemán de San Felipe');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const initSession = async () => {
            try {
                const id = await chatService.createSession();
                setSessionId(id);
                setMessages([{
                    type: 'ai',
                    content: `Hola, soy tu asistente de convivencia escolar para el ${schoolName}. ¿En qué puedo ayudarte hoy?`
                }]);
            } catch (error) {
                logger.error('Error creating session:', error);
            }
        };
        initSession();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const [uploadedFiles, setUploadedFiles] = useState([]);

    // ... (useEffect)

    const handleSend = async () => {
        if (!input.trim() && uploadedFiles.length === 0) return;

        const userMessage = input;
        const currentFiles = [...uploadedFiles];

        setInput('');
        setUploadedFiles([]); // Clear files after sending

        setMessages(prev => [...prev, { type: 'human', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await chatService.sendMessage(userMessage, sessionId, schoolName, currentFiles);
            setMessages(prev => [...prev, { type: 'ai', content: response.response }]);
        } catch (error) {
            logger.error('Error sending message:', error);
            setMessages(prev => [...prev, { type: 'error', content: 'Lo siento, hubo un error al procesar tu mensaje.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const result = await chatService.uploadFile(file, sessionId);
            if (result.gcs_uri) {
                setUploadedFiles(prev => [...prev, result.gcs_uri]);
                setMessages(prev => [...prev, { type: 'system', content: `Archivo adjunto: ${file.name}` }]);
            }
        } catch (error) {
            logger.error('Error uploading file:', error);
            setMessages(prev => [...prev, { type: 'error', content: 'Error al subir el archivo.' }]);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 p-4">
            <div className="bg-white rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">

                {/* Header */}
                <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                    <h1 className="text-xl font-bold">Asistente de Convivencia Escolar</h1>
                    <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="text-black px-2 py-1 rounded text-sm"
                        placeholder="Nombre del Colegio"
                    />
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.type === 'human' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${msg.type === 'human' ? 'bg-blue-500 text-white' :
                                msg.type === 'error' ? 'bg-red-100 text-red-700' :
                                    msg.type === 'system' ? 'bg-gray-200 text-gray-600 italic' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {msg.type === 'ai' ? (
                                    <ReactMarkdown className="prose prose-sm max-w-none">
                                        {msg.content}
                                    </ReactMarkdown>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-lg p-3 text-gray-500">
                                Escribiendo...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-gray-50">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Adjuntar archivo"
                        >
                            <Paperclip size={20} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                        />

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Escribe tu consulta..."
                            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <button
                            onClick={handleSend}
                            disabled={isLoading}
                            className={`p-2 rounded-full ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors`}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
