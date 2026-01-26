import { useState, useRef, useEffect } from 'react';

export const useAudioRecorder = () => {
    const [hasRecording, setHasRecording] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const audioPreviewRef = useRef(null);

    // Gestionar URL del audio para evitar recreación constante en render
    useEffect(() => {
        if (!audioBlob) {
            setAudioUrl(null);
            return;
        }

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [audioBlob]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: mediaRecorderRef.current.mimeType || 'audio/webm'
                });
                setAudioBlob(blob);
                setHasRecording(true);
                setIsRecording(false);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start(1000);
            setIsRecording(true);

            // Start timer
            const interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

            mediaRecorderRef.current.timerInterval = interval;

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("No se pudo acceder al micrófono. Por favor verifica los permisos.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            clearInterval(mediaRecorderRef.current.timerInterval);
            setIsRecording(false);
        }
    };

    const discardRecording = () => {
        if (window.confirm('¿Estás seguro de descartar esta grabación?')) {
            setHasRecording(false);
            setRecordingDuration(0);
            setAudioBlob(null);
            setAudioUrl(null);
            chunksRef.current = [];
        }
    };

    const resetRecording = () => {
        setHasRecording(false);
        setRecordingDuration(0);
        setAudioBlob(null);
        setAudioUrl(null);
        chunksRef.current = [];
    };

    const togglePlayback = () => {
        const audio = audioPreviewRef.current;
        if (audio) {
            if (isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
        }
    };

    return {
        // State
        hasRecording,
        isRecording,
        isPlaying,
        setIsPlaying,
        recordingDuration,
        audioBlob,
        audioUrl,

        // Refs
        audioPreviewRef,

        // Actions
        startRecording,
        stopRecording,
        discardRecording,
        resetRecording,
        togglePlayback
    };
};
