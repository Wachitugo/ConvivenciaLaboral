import { useState, useCallback } from 'react';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, UPLOAD_SIMULATION_DELAY } from '../constants/fileConstants';

export const useFileUpload = (documents, setDocuments, showNotification) => {
    const [uploadingFiles, setUploadingFiles] = useState([]);

    const validateFile = useCallback((file) => {
        if (!ALLOWED_FILE_TYPES[file.type]) {
            showNotification(`Tipo de archivo no permitido: ${file.name}`, 'error');
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            showNotification(`Archivo muy grande: ${file.name} (máx. 10MB)`, 'error');
            return false;
        }
        return true;
    }, [showNotification]);

    const uploadFile = useCallback(async (file) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newDoc = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date(),
                    url: URL.createObjectURL(file)
                };
                resolve(newDoc);
            }, UPLOAD_SIMULATION_DELAY);
        });
    }, []);

    const handleFiles = useCallback(async (files) => {
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(validateFile);

        if (validFiles.length === 0) return;

        setUploadingFiles(prev => [...prev, ...validFiles.map(f => f.name)]);

        const uploadPromises = validFiles.map(uploadFile);
        const uploadedDocs = await Promise.all(uploadPromises);

        setDocuments(prev => [...prev, ...uploadedDocs]);
        setUploadingFiles([]);
        showNotification(`${validFiles.length} archivo(s) subido(s) correctamente`);
    }, [validateFile, uploadFile, setDocuments, showNotification]);

    const handleDelete = useCallback((id) => {
        if (window.confirm('¿Estás seguro de eliminar este archivo?')) {
            setDocuments(prev => prev.filter(doc => doc.id !== id));
            showNotification('Archivo eliminado correctamente');
        }
    }, [setDocuments, showNotification]);

    const handleDownload = useCallback((doc) => {
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = doc.name;
        link.click();
        showNotification('Descargando archivo...');
    }, [showNotification]);

    return {
        uploadingFiles,
        handleFiles,
        handleDelete,
        handleDownload
    };
};
