import { useState, useEffect, useRef, useCallback } from 'react';
import { createLogger } from '../utils/logger';

const logger = createLogger('useSpeechToText');

const useSpeechToText = (options = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);

    // Support check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasRecognitionSupport = !!SpeechRecognition;

    useEffect(() => {
        if (!hasRecognitionSupport) {
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = options.continuous ?? false; // default false if undefined
        recognition.interimResults = options.interimResults ?? true;
        recognition.lang = options.lang || 'es-ES';

        const silenceTimeoutMs = options.silenceTimeout || 2500;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);

            // Start silence timer on start
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                if (recognitionRef.current) recognitionRef.current.stop();
            }, silenceTimeoutMs);
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let currentInterimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    currentInterimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                setTranscript(prev => prev + finalTranscript + ' ');
            }
            setInterimTranscript(currentInterimTranscript);

            // Reset silence timer on result
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                if (recognitionRef.current) recognitionRef.current.stop();
            }, silenceTimeoutMs);
        };

        recognition.onerror = (event) => {
            logger.error('Speech recognition error', event.error);
            let errorMessage = 'Error desconocido en el reconocimiento de voz.';

            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'No se detectó voz. Intenta de nuevo.';
                    break;
                case 'audio-capture':
                    errorMessage = 'No se encontró micrófono.';
                    break;
                case 'not-allowed':
                    errorMessage = 'Permiso de micrófono denegado. Verifica tu configuración.';
                    break;
                case 'service-not-allowed':
                    errorMessage = 'El servicio de reconocimiento de voz no está permitido.';
                    break;
                case 'network': // Common in Opera/Chrome if offline
                    errorMessage = 'Error de red. Verifica tu conexión.';
                    break;
                default:
                    errorMessage = `Error: ${event.error}`;
            }

            setError(errorMessage);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript('');
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) recognitionRef.current.abort(); // abort is safer for cleanup
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };
    }, [hasRecognitionSupport, options.continuous, options.interimResults, options.lang, options.silenceTimeout]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current || !hasRecognitionSupport) return;
        if (isListening) return;

        try {
            recognitionRef.current.start();
        } catch (e) {
            logger.error("Error starting recognition:", e);
            // Ignore "already started" errors or similar logic states
        }
    }, [isListening, hasRecognitionSupport]);

    const stopListening = useCallback(() => {
        if (!recognitionRef.current) return;
        recognitionRef.current.stop();
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript,
        error,
        hasRecognitionSupport
    };
};

export default useSpeechToText;
