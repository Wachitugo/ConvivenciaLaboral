import { useState, useCallback } from 'react';

export const useFileRename = (setDocuments, showNotification) => {
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');

    const startRename = useCallback((doc) => {
        setEditingId(doc.id);
        setEditingName(doc.name);
    }, []);

    const saveRename = useCallback((id) => {
        if (!editingName.trim()) {
            showNotification('El nombre no puede estar vacío', 'error');
            return;
        }

        setDocuments(prev => prev.map(doc =>
            doc.id === id ? { ...doc, name: editingName.trim() } : doc
        ));
        setEditingId(null);
        setEditingName('');
        showNotification('Archivo renombrado correctamente');
    }, [editingName, setDocuments, showNotification]);

    const cancelRename = useCallback(() => {
        setEditingId(null);
        setEditingName('');
    }, []);

    return {
        editingId,
        editingName,
        setEditingName,
        startRename,
        saveRename,
        cancelRename
    };
};
