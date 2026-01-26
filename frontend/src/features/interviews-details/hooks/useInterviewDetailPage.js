import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInterview } from '../../../contexts/InterviewContext';
import { useNotification } from './useNotification';
import { useFileUpload } from './useFileUpload';
import { interviewsService, schoolsService } from '../../../services/api';

export const useInterviewDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    // FIX: Import uploadSignature from context
    const { getInterview, updateInterview, uploadSignature: contextUploadSignature } = useInterview();

    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('entrevista');
    const [documents, setDocuments] = useState([]);
    const [selectedDocumentId, setSelectedDocumentId] = useState(null);
    const [studentSignaturePreview, setStudentSignaturePreview] = useState(null);
    const [guardianSignaturePreview, setGuardianSignaturePreview] = useState(null);

    // Lifted state and hooks for file upload
    const { notification, showNotification, hideNotification } = useNotification();
    const { uploadingFiles, handleFiles, handleDownload } = useFileUpload(
        documents,
        setDocuments,
        showNotification
    );

    // Form State
    const [formData, setFormData] = useState({
        type: 'audio', // written | audio
        notes: '',
        transcription: '',
        aiSummary: '',
        studentSignature: null,
        guardianSignature: null
    });

    const mapInterviewToDocs = (iv) => {
        const docs = [];
        if (iv.audio_uri) {
            docs.push({
                id: 'main-audio',
                name: 'Audio de la Entrevista',
                type: 'audio/mp3',
                url: iv.audio_uri,
                size: iv.audio_size || 0,
                uploadedAt: iv.updated_at,
                isMainAudio: true,
                transcription: iv.transcription
            });
        }
        if (iv.attachments) {
            docs.push(...iv.attachments.map(att => ({
                ...att,
                type: att.content_type || 'application/octet-stream',
                transcription: att.transcription,
                uploadedAt: att.created_at || att.uploaded_at || att.uploadedAt || null
            })));
        }
        return docs;
    };

    // Map backend snake_case to frontend camelCase
    const mapBackendToFrontend = (iv) => {
        if (!iv) return null;

        // Format date from created_at if date is not present
        let formattedDate = iv.date;
        if (!formattedDate && iv.created_at) {
            const d = new Date(iv.created_at);
            formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }

        return {
            ...iv,
            studentName: iv.student_name || iv.studentName,
            grade: iv.course || iv.grade,
            date: formattedDate,
        };
    };

    const getSignatureUrl = (iv, type) => {
        if (!iv || !Array.isArray(iv.signatures)) return null;
        const list = iv.signatures.filter(s => s.type === type);
        if (list.length === 0) return null;
        const sorted = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return sorted[0].url || null;
    };

    // Genera URLs blob vía proxy para firmas privadas en GCS
    useEffect(() => {
        let revokeA = null;
        let revokeB = null;

        const loadPreviews = async () => {
            const sUrl = getSignatureUrl(interview, 'student');
            const gUrl = getSignatureUrl(interview, 'guardian');

            try {
                if (sUrl) {
                    const blob = await schoolsService.getProxyImage(sUrl);
                    const objUrl = URL.createObjectURL(blob);
                    setStudentSignaturePreview(objUrl);
                    revokeA = () => URL.revokeObjectURL(objUrl);
                } else {
                    setStudentSignaturePreview(null);
                }
            } catch (_) {
                setStudentSignaturePreview(null);
            }

            try {
                if (gUrl) {
                    const blob = await schoolsService.getProxyImage(gUrl);
                    const objUrl = URL.createObjectURL(blob);
                    setGuardianSignaturePreview(objUrl);
                    revokeB = () => URL.revokeObjectURL(objUrl);
                } else {
                    setGuardianSignaturePreview(null);
                }
            } catch (_) {
                setGuardianSignaturePreview(null);
            }
        };

        if (interview) loadPreviews();

        return () => {
            if (revokeA) revokeA();
            if (revokeB) revokeB();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interview?.signatures]);

    useEffect(() => {
        const found = getInterview(id);
        if (found) {
            // Usar datos del contexto inmediatamente si están disponibles
            setInterview(mapBackendToFrontend(found));
            const hasStudentSig = Array.isArray(found.signatures) && found.signatures.some(s => s.type === 'student');
            const hasGuardianSig = Array.isArray(found.signatures) && found.signatures.some(s => s.type === 'guardian');
            setFormData({
                type: found.type || 'audio',
                notes: found.notes || '',
                transcription: found.transcription || '',
                aiSummary: found.summary || found.aiSummary || '',
                studentSignature: hasStudentSig ? 'signed' : null,
                guardianSignature: hasGuardianSig ? 'signed' : null
            });
            setDocuments(mapInterviewToDocs(found));
            // Mostrar inmediatamente si tenemos datos del contexto
            setLoading(false);
        }
    }, [id, getInterview]);

    // Refrescar siempre el detalle desde el backend para asegurar firmas y últimos cambios
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const fresh = await interviewsService.getById(id);
                if (cancelled || !fresh) return;
                const mapped = mapBackendToFrontend(fresh);
                setInterview(mapped);
                const hasStudentSig = Array.isArray(fresh.signatures) && fresh.signatures.some(s => s.type === 'student');
                const hasGuardianSig = Array.isArray(fresh.signatures) && fresh.signatures.some(s => s.type === 'guardian');
                setFormData(prev => ({
                    ...prev,
                    type: fresh.type || prev.type,
                    notes: fresh.notes || prev.notes,
                    transcription: fresh.transcription || prev.transcription,
                    aiSummary: fresh.summary || prev.aiSummary,
                    studentSignature: hasStudentSig ? 'signed' : null,
                    guardianSignature: hasGuardianSig ? 'signed' : null
                }));
                setDocuments(mapInterviewToDocs(fresh));
                // Asegurar que loading se desactive cuando lleguen datos del backend
                setLoading(false);
            } catch (e) {
                // En caso de error, desactivar loading de todos modos
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    const handleSave = async () => {
        if (!interview) return;
        try {
            await updateInterview(id, {
                notes: formData.notes,
                transcription: formData.transcription,
                aiSummary: formData.aiSummary
                // status: 'Borrador' // opcional, mantén el estado por ahora
            });
            showNotification('Notas guardadas correctamente');
        } catch (error) {
            console.error('Error saving notes:', error);
            showNotification('Error al guardar notas', 'error');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // hasSignature: true cuando existe un trazo; false cuando se limpia
    const handleSignatureEnd = (type, hasSignature) => {
        const fieldName = type === 'student' ? 'studentSignature' : 'guardianSignature';
        if (hasSignature) {
            setFormData(prev => ({ ...prev, [fieldName]: 'signed' }));
        } else {
            setFormData(prev => ({ ...prev, [fieldName]: null }));
            // Ocultar previsualización local al limpiar
            if (type === 'student') setStudentSignaturePreview(null);
            else setGuardianSignaturePreview(null);
        }
    };

    const handleUploadSignature = async (type, file, signerName = null) => {
        try {
            // FIX: Use context method to update global state and list view
            const updated = await contextUploadSignature(id, type, file, signerName);
            setInterview(mapBackendToFrontend(updated));
            // Actualizar listado de documentos para incluir la firma si fuese necesario en el futuro
            setDocuments(mapInterviewToDocs(updated));
            // Reflejar estado firmado en el formulario
            setFormData(prev => ({
                ...prev,
                [type === 'student' ? 'studentSignature' : 'guardianSignature']: 'signed'
            }));
            // Actualizar previews
            const url = getSignatureUrl(updated, type);
            if (type === 'student') setStudentSignaturePreview(url);
            else setGuardianSignaturePreview(url);
            showNotification(`Firma de ${type === 'student' ? 'estudiante' : 'apoderado'} guardada`);
        } catch (error) {
            console.error('Error uploading signature:', error);
            showNotification('Error al guardar la firma', 'error');
        }
    };

    const handleDeleteSignature = async (type) => {
        try {
            const updated = await interviewsService.deleteSignature(id, type, null);
            setInterview(mapBackendToFrontend(updated));
            if (type === 'student') {
                setStudentSignaturePreview(null);
                setFormData(prev => ({ ...prev, studentSignature: null }));
            } else {
                setGuardianSignaturePreview(null);
                setFormData(prev => ({ ...prev, guardianSignature: null }));
            }
            showNotification(`Firma de ${type === 'student' ? 'estudiante' : 'apoderado'} eliminada`);
        } catch (error) {
            console.error('Error deleting signature:', error);
            showNotification('Error al eliminar la firma', 'error');
        }
    };

    const generateSummary = async () => {
        try {
            showNotification('Generando resumen con IA... esto puede tomar unos segundos');
            const response = await interviewsService.generateInterviewSummary(id);

            // The backend returns { summary: "string_json_or_text" }
            if (response && response.summary) {
                setFormData(prev => ({ ...prev, aiSummary: response.summary }));

                // Also update the full interview state to keep it in sync
                setInterview(prev => ({ ...prev, summary: response.summary }));

                // Sync context to prevent stale data overwrite
                try {
                    await updateInterview(id, { aiSummary: response.summary });
                } catch (e) {
                    console.warn("Context sync warning", e);
                }

                showNotification('Resumen generado correctamente');
                return true;
            }
        } catch (error) {
            console.error('Error generating summary:', error);
            showNotification('Error al generar el resumen', 'error');
            throw error;
        }
    };

    const handleSaveAudioRecording = async (file) => {
        // file is a File object now
        const tempId = Date.now() + Math.random();
        const newDocument = {
            id: tempId,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
            url: URL.createObjectURL(file), // Generate blob URL for playback
            duration: 0, // Duration would need to be passed if needed, but not critical for playback
            isMainAudio: false
        };
        setDocuments(prev => [...prev, newDocument]);

        showNotification('Subiendo audio...');

        try {
            // Upload as attachment (now returns immediately, transcription happens in background)
            const updatedInterview = await interviewsService.uploadAttachment(id, file);
            setInterview(mapBackendToFrontend(updatedInterview));
            const newDocs = mapInterviewToDocs(updatedInterview);
            setDocuments(newDocs);

            // Find the newly uploaded attachment
            if (updatedInterview.attachments && updatedInterview.attachments.length > 0) {
                const lastAttachment = updatedInterview.attachments[updatedInterview.attachments.length - 1];
                if (lastAttachment) {
                    setSelectedDocumentId(lastAttachment.id);

                    // Check if transcription is pending (background processing)
                    if (lastAttachment.transcription_status === 'pending') {
                        setFormData(prev => ({ ...prev, transcription: '⏳ Transcribiendo audio... (esto puede tardar unos segundos)' }));
                        showNotification('Audio guardado. Transcripción en proceso...');

                        // Start polling to check for transcription completion
                        pollForTranscription(lastAttachment.id);
                    } else if (lastAttachment.transcription) {
                        setFormData(prev => ({ ...prev, transcription: lastAttachment.transcription }));
                        showNotification('Audio guardado y transcrito correctamente');
                    } else {
                        showNotification('Audio guardado correctamente');
                    }
                }
            } else {
                showNotification('Audio guardado correctamente');
            }
        } catch (error) {
            console.error("Error uploading audio:", error);
            showNotification('Error al subir el audio', 'error');
            // Remove optimistic doc on failure
            setDocuments(prev => prev.filter(d => d.id !== tempId));
        }
    };

    // Polling function to check for transcription completion
    const pollForTranscription = async (attachmentId, attempts = 0) => {
        const maxAttempts = 30; // Max ~1 minute of polling
        // Start with shorter intervals, then increase
        const pollInterval = attempts < 5 ? 2000 : 5000; // First 5 attempts: 2s, then 5s

        if (attempts >= maxAttempts) {
            showNotification('La transcripción está tardando más de lo esperado. Actualiza la página más tarde.', 'error');
            return;
        }

        setTimeout(async () => {
            try {
                console.log(`Polling for transcription, attempt ${attempts + 1}`);
                const fresh = await interviewsService.getById(id);
                if (!fresh) return;

                const attachment = fresh.attachments?.find(a => a.id === attachmentId);
                console.log(`Attachment status: ${attachment?.transcription_status}`);

                if (attachment?.transcription_status === 'completed' && attachment?.transcription) {
                    // Transcription complete!
                    console.log('Transcription completed, updating UI');
                    setInterview(mapBackendToFrontend(fresh));
                    setDocuments(mapInterviewToDocs(fresh));

                    // Always update the transcription view for the attachment we're tracking
                    setFormData(prev => ({ ...prev, transcription: attachment.transcription }));
                    setSelectedDocumentId(attachmentId);
                    showNotification('✅ Transcripción completada');
                } else if (attachment?.transcription_status === 'error') {
                    showNotification('Error al transcribir el audio', 'error');
                    setFormData(prev => ({ ...prev, transcription: '❌ Error al transcribir el audio' }));
                } else if (attachment?.transcription_status === 'pending' || !attachment?.transcription_status) {
                    // Still processing or status not set yet, continue polling
                    pollForTranscription(attachmentId, attempts + 1);
                } else {
                    // No transcription status but we should still check if transcription exists
                    if (attachment?.transcription) {
                        setFormData(prev => ({ ...prev, transcription: attachment.transcription }));
                        setSelectedDocumentId(attachmentId);
                        showNotification('✅ Transcripción completada');
                    } else {
                        // Continue polling
                        pollForTranscription(attachmentId, attempts + 1);
                    }
                }
            } catch (error) {
                console.error('Error polling for transcription:', error);
                // Continue polling despite errors
                pollForTranscription(attachmentId, attempts + 1);
            }
        }, pollInterval);
    };



    const handleDelete = async (docId) => {
        if (!window.confirm('¿Estás seguro de eliminar este archivo?')) return;

        const doc = documents.find(d => d.id === docId);
        if (!doc) return;

        try {
            // If it's the main audio (checked by flag or ID)
            if (doc.isMainAudio || docId === 'main-audio') {
                await interviewsService.deleteAudio(id);
                showNotification('Audio eliminado correctamente');
                setFormData(prev => ({ ...prev, transcription: '' }));
            } else {
                // Backend attachments have string UUIDs. Local/Simulated might differ.
                if (typeof docId === 'string' && !docId.includes('.')) {
                    await interviewsService.deleteAttachment(id, docId);
                    showNotification('Archivo adjunto eliminado correctamente');
                } else {
                    showNotification('Archivo eliminado');
                }
            }

            setDocuments(prev => prev.filter(d => d.id !== docId));
        } catch (error) {
            console.error("Error deleting file:", error);
            showNotification('Error al eliminar archivo', 'error');
        }
    };


    const handleSelectDocument = (doc) => {
        if (!doc) return;

        setSelectedDocumentId(doc.id);

        // If it has a transcription, show it in the text area
        // We update formData to reflect the selected file's content
        if (doc.transcription) {
            setFormData(prev => ({ ...prev, transcription: doc.transcription }));
            showNotification(`Viendo transcripción de: ${doc.name}`);
        } else {
            // If checking main audio and it has no transcription yet, or attachment without it
            if (doc.isMainAudio) {
                // Fallback to current interview transcription if doc one is empty (sync issue?) 
                // But we set it in initialDocs. 
                setFormData(prev => ({ ...prev, transcription: interview?.transcription || '' }));
                showNotification(`Viendo transcripción principal`);
            } else {
                showNotification(`El archivo ${doc.name} no tiene transcripción`, 'error');
            }
        }
    };

    const handleRealFileUpload = async (files) => {
        const fileArray = Array.from(files);
        if (fileArray.length === 0) return;

        // Optimistic update for all files
        const tempFiles = fileArray.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
            url: URL.createObjectURL(file), // Generate blob URL for playback
            fileObject: file // Keep reference for upload
        }));

        setDocuments(prev => [...prev, ...tempFiles]);
        showNotification(`Subiendo ${fileArray.length} archivo(s)...`);

        // Upload each file
        for (const tempDoc of tempFiles) {
            try {
                // Upload as attachment (Unified logic)
                const updatedInterview = await interviewsService.uploadAttachment(id, tempDoc.fileObject);
                setInterview(mapBackendToFrontend(updatedInterview));

                // Robust merge: Server docs + other pending docs (excluding the one we just finished)
                const serverDocs = mapInterviewToDocs(updatedInterview);
                setDocuments(prev => {
                    const otherPending = prev.filter(d => typeof d.id === 'number' && d.id !== tempDoc.id);
                    return [...serverDocs, ...otherPending];
                });

            } catch (error) {
                console.error(`Error uploading ${tempDoc.name}:`, error);
                showNotification(`Error al subir ${tempDoc.name}`, 'error');
                // Remove failed doc
                setDocuments(prev => prev.filter(d => d.id !== tempDoc.id));
            }
        }
        showNotification('Carga de archivos completada');
    };

    // Function to refresh interview data from the backend
    const refreshInterview = async () => {
        try {
            const fresh = await interviewsService.getById(id);
            if (!fresh) return;
            setInterview(mapBackendToFrontend(fresh));
            const hasStudentSig = Array.isArray(fresh.signatures) && fresh.signatures.some(s => s.type === 'student');
            const hasGuardianSig = Array.isArray(fresh.signatures) && fresh.signatures.some(s => s.type === 'guardian');
            setFormData(prev => ({
                ...prev,
                type: fresh.type || prev.type,
                notes: fresh.notes || prev.notes,
                transcription: fresh.transcription || prev.transcription,
                aiSummary: fresh.summary || prev.aiSummary,
                studentSignature: hasStudentSig ? 'signed' : null,
                guardianSignature: hasGuardianSig ? 'signed' : null
            }));
            setDocuments(mapInterviewToDocs(fresh));
        } catch (e) {
            console.error('Error refreshing interview:', e);
        }
    };

    return {
        interview,
        loading,
        refreshInterview,
        activeTab,
        setActiveTab,
        documents,
        setDocuments,
        formData,
        setFormData,
        notification,
        uploadingFiles,
        handleFiles: handleRealFileUpload, // Use real upload handler
        handleDelete, // Sending our custom backend-aware delete
        handleSelectDocument, // New handler for selection
        selectedDocumentId, // Expose selected ID
        handleDownload,
        handleSave,
        handleInputChange,
        handleSignatureEnd,
        handleUploadSignature,
        handleDeleteSignature,
        generateSummary,
        handleSaveAudioRecording,
        navigate,
        showNotification,
        studentSignatureUrl: studentSignaturePreview || getSignatureUrl(interview, 'student'),
        guardianSignatureUrl: guardianSignaturePreview || getSignatureUrl(interview, 'guardian')
    };
};
