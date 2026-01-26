/**
 * Componente para interactuar con el agente de IA especializado en convivencia
 * Permite chat, análisis de casos y obtener sugerencias
 */
import React, { useState, useEffect, useRef } from 'react';
import agentService, { CASE_TYPES, SEVERITY_LEVELS } from '../services/agentService';
import { createLogger } from '../utils/logger';

const logger = createLogger('AgentInterface');

const AgentChat = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [agentStatus, setAgentStatus] = useState(null);
    const [showCaseAnalysis, setShowCaseAnalysis] = useState(false);
    const messagesEndRef = useRef(null);

    // Estado para análisis de caso
    const [caseData, setCaseData] = useState({
        type: CASE_TYPES.BULLYING,
        description: '',
        students: [{ name: '', grade: '', age: '', role: 'víctima' }],
        severity: SEVERITY_LEVELS.LEVE,
        location: '',
        date: '',
        witnesses: [],
        previous_incidents: false
    });

    useEffect(() => {
        checkAgentStatus();
        // Agregar mensaje de bienvenida
        setMessages([{
            id: 1,
            type: 'agent',
            content: '¡Hola! Soy tu asistente especializado en convivencia escolar. ¿En qué puedo ayudarte hoy?',
            timestamp: new Date().toISOString()
        }]);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const checkAgentStatus = async () => {
        try {
            const status = await agentService.getStatus();
            setAgentStatus(status);
        } catch (error) {
            logger.error('Error verificando estado del agente:', error);
        }
    };

    const addMessage = (type, content, data = null) => {
        const newMessage = {
            id: Date.now(),
            type,
            content,
            data,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');
        
        // Agregar mensaje del usuario
        addMessage('user', userMessage);
        
        setIsLoading(true);
        
        try {
            const response = await agentService.sendMessage(userMessage);
            addMessage('agent', response.response);
        } catch (error) {
            addMessage('agent', `Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCaseAnalysis = async () => {
        if (!caseData.description.trim()) {
            alert('Por favor, describe el caso antes de analizarlo');
            return;
        }

        setIsLoading(true);
        addMessage('user', `Solicito análisis del caso: ${caseData.description}`);

        try {
            const analysis = await agentService.analyzeCase(caseData);
            
            // Formatear respuesta del análisis
            const analysisContent = `
**Análisis de Caso - ID: ${analysis.case_id}**

**Evaluación de Gravedad:** ${analysis.severity_assessment}

**Factores Clave:**
${analysis.key_factors.map(factor => `• ${factor}`).join('\n')}

**Acciones Inmediatas:**
${analysis.immediate_actions.map(action => `• ${action}`).join('\n')}

**Plan de Intervención:**
${analysis.intervention_plan.map((step, index) => `${index + 1}. ${step}`).join('\n')}

**Seguimiento:**
${analysis.follow_up.map(item => `• ${item}`).join('\n')}

**Medidas Preventivas:**
${analysis.prevention_measures.map(measure => `• ${measure}`).join('\n')}

**Recursos Necesarios:**
${analysis.resources_needed.map(resource => `• ${resource}`).join('\n')}
            `;

            addMessage('agent', analysisContent, analysis);
            setShowCaseAnalysis(false);
            
        } catch (error) {
            addMessage('agent', `Error en el análisis: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickConsultation = async (caseType, description) => {
        setIsLoading(true);
        addMessage('user', `Consulta rápida sobre ${caseType}: ${description}`);

        try {
            const consultation = await agentService.quickConsultation(caseType, description);
            
            const consultationContent = `
**Consulta Rápida - ${caseType.toUpperCase()}**

${consultation.response}

**Sugerencias Inmediatas:**
${consultation.suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')}
            `;

            addMessage('agent', consultationContent, consultation);
        } catch (error) {
            addMessage('agent', `Error en consulta: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const addStudent = () => {
        setCaseData(prev => ({
            ...prev,
            students: [...prev.students, { name: '', grade: '', age: '', role: 'testigo' }]
        }));
    };

    const updateStudent = (index, field, value) => {
        setCaseData(prev => ({
            ...prev,
            students: prev.students.map((student, i) => 
                i === index ? { ...student, [field]: value } : student
            )
        }));
    };

    const removeStudent = (index) => {
        setCaseData(prev => ({
            ...prev,
            students: prev.students.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Agente de Convivencia Escolar</h1>
                        <p className="text-gray-600">Asistente especializado en mediación educativa</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className={`flex items-center space-x-2`}>
                            <div className={`w-3 h-3 rounded-full ${
                                agentStatus?.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-sm text-gray-600">
                                {agentStatus?.status || 'Desconectado'}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowCaseAnalysis(!showCaseAnalysis)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Análisis de Caso
                        </button>
                    </div>
                </div>
            </div>

            {/* Panel de Análisis de Caso */}
            {showCaseAnalysis && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                    <h2 className="text-xl font-semibold mb-4">Análisis de Caso</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Caso
                            </label>
                            <select
                                value={caseData.type}
                                onChange={(e) => setCaseData(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                            >
                                {Object.entries(CASE_TYPES).map(([key, value]) => (
                                    <option key={value} value={value}>
                                        {key.replace(/_/g, ' ').toLowerCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gravedad
                            </label>
                            <select
                                value={caseData.severity}
                                onChange={(e) => setCaseData(prev => ({ ...prev, severity: e.target.value }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                            >
                                {Object.entries(SEVERITY_LEVELS).map(([key, value]) => (
                                    <option key={value} value={value}>
                                        {key.toLowerCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción del Caso
                        </label>
                        <textarea
                            value={caseData.description}
                            onChange={(e) => setCaseData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            rows={4}
                            placeholder="Describe detalladamente lo ocurrido..."
                        />
                    </div>

                    {/* Estudiantes involucrados */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Estudiantes Involucrados
                            </label>
                            <button
                                onClick={addStudent}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                                Agregar Estudiante
                            </button>
                        </div>
                        
                        {caseData.students.map((student, index) => (
                            <div key={index} className="flex space-x-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Nombre"
                                    value={student.name}
                                    onChange={(e) => updateStudent(index, 'name', e.target.value)}
                                    className="flex-1 border border-gray-300 rounded px-2 py-1"
                                />
                                <input
                                    type="text"
                                    placeholder="Curso"
                                    value={student.grade}
                                    onChange={(e) => updateStudent(index, 'grade', e.target.value)}
                                    className="w-20 border border-gray-300 rounded px-2 py-1"
                                />
                                <select
                                    value={student.role}
                                    onChange={(e) => updateStudent(index, 'role', e.target.value)}
                                    className="w-24 border border-gray-300 rounded px-2 py-1"
                                >
                                    <option value="víctima">Víctima</option>
                                    <option value="agresor">Agresor</option>
                                    <option value="testigo">Testigo</option>
                                </select>
                                {caseData.students.length > 1 && (
                                    <button
                                        onClick={() => removeStudent(index)}
                                        className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleCaseAnalysis}
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Analizando...' : 'Analizar Caso'}
                    </button>
                </div>
            )}

            {/* Área de Chat */}
            <div className="flex-1 bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col">
                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    message.type === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-800'
                                }`}
                            >
                                <div className="whitespace-pre-wrap">{message.content}</div>
                                <div className="text-xs opacity-75 mt-1">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input de mensaje */}
                <div className="flex space-x-2">
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Escribe tu consulta sobre convivencia escolar..."
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 resize-none"
                        rows={1}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputMessage.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        Enviar
                    </button>
                </div>
            </div>

            {/* Consultas rápidas */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-3">Consultas Rápidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <button
                        onClick={() => handleQuickConsultation('bullying', 'Necesito estrategias inmediatas para intervenir')}
                        className="bg-red-100 text-red-800 px-3 py-2 rounded text-sm hover:bg-red-200"
                    >
                        Intervención Bullying
                    </button>
                    <button
                        onClick={() => handleQuickConsultation('conflicto_interpersonal', 'Dos estudiantes en conflicto constante')}
                        className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-sm hover:bg-yellow-200"
                    >
                        Mediación de Conflictos
                    </button>
                    <button
                        onClick={() => handleQuickConsultation('comportamiento_disruptivo', 'Estudiante interrumpe constantemente las clases')}
                        className="bg-purple-100 text-purple-800 px-3 py-2 rounded text-sm hover:bg-purple-200"
                    >
                        Comportamiento Disruptivo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentChat;