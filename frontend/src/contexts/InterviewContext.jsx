import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { interviewsService } from '../services/api';

const InterviewContext = createContext();

export const useInterview = () => {
    return useContext(InterviewContext);
};

export const InterviewProvider = ({ children }) => {
    const [interviews, setInterviews] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Helper to get current school ID
    const getSchoolId = useCallback(() => {
        try {
            const colegios = JSON.parse(localStorage.getItem('colegios') || '[]');
            return colegios.length > 0 ? colegios[0].id : null;
        } catch (e) {
            console.error("Error reading colegios from localStorage", e);
            return null;
        }
    }, []);

    const fetchInterviews = useCallback(async () => {
        const schoolId = getSchoolId();
        if (!schoolId) {
            // No school available yet, don't fetch
            return;
        }

        setLoading(true);
        try {
            const data = await interviewsService.list(schoolId);

            // Helper to format date from created_at
            const formatDate = (isoString) => {
                if (!isoString) return '';
                const date = new Date(isoString);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            };

            const mapped = data.map(i => ({
                ...i,
                studentName: i.student_name,
                grade: i.course,
                interviewer: i.interviewer_name,
                date: formatDate(i.created_at),
            }));

            setInterviews(mapped);
        } catch (err) {
            console.error("Error fetching interviews:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [getSchoolId]);

    // Initial load and listen for storage/auth changes
    useEffect(() => {
        // Try to fetch immediately if we haven't yet
        if (!interviews && !loading && !error) {
            fetchInterviews();
        }

        // Listen for storage changes (when login saves colegios)
        const handleStorageChange = (e) => {
            if (e.key === 'colegios') {
                fetchInterviews();
            }
        };

        // Listen for internal auth events (same-tab login)
        const handleAuthChange = () => {
            fetchInterviews();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('auth-changed', handleAuthChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('auth-changed', handleAuthChange);
        };
    }, [fetchInterviews]);

    const addInterview = async (interviewData) => {
        const schoolId = getSchoolId();

        if (!schoolId) {
            // Fallback legacy behavior
            const newInterview = {
                ...interviewData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                status: interviewData.status || 'Borrador'
            };
            setInterviews(prev => [newInterview, ...prev]);
            return newInterview.id;
        }

        try {
            const payload = {
                student_name: interviewData.studentName,
                course: interviewData.grade,
                school_id: schoolId,
                status: interviewData.status || 'Borrador',
                description: interviewData.notes,
                interviewer_name: interviewData.interviewer,
                gender: interviewData.gender
            };

            const newBackendInterview = await interviewsService.create(payload);

            // Helper to format date
            const formatDate = (isoString) => {
                if (!isoString) return '';
                const d = new Date(isoString);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${day}/${month}/${year}`;
            };

            // Map back to frontend structure
            const newInterview = {
                ...newBackendInterview,
                studentName: newBackendInterview.student_name,
                grade: newBackendInterview.course,
                interviewer: newBackendInterview.interviewer_name,
                date: formatDate(newBackendInterview.created_at)
            };

            setInterviews(prev => [newInterview, ...prev]);
            return newInterview.id;
        } catch (err) {
            console.error("Error creating interview:", err);
            throw err;
        }
    };

    const getInterview = (id) => {
        if (!interviews) return null;
        return interviews.find(i => i.id.toString() === id.toString());
    };

    const updateInterview = async (id, updatedData) => {
        try {
            const payload = {};
            if (updatedData.studentName !== undefined) payload.student_name = updatedData.studentName;
            if (updatedData.grade !== undefined) payload.course = updatedData.grade;
            if (updatedData.description !== undefined) payload.description = updatedData.description;
            if (updatedData.notes !== undefined) payload.notes = updatedData.notes;
            if (updatedData.transcription !== undefined) payload.transcription = updatedData.transcription;
            if (updatedData.aiSummary !== undefined) payload.summary = updatedData.aiSummary;
            if (updatedData.gender !== undefined) payload.gender = updatedData.gender;
            // Validar estado contra el backend (Borrador | Finalizada)
            if (updatedData.status === 'Borrador' || updatedData.status === 'Finalizada') {
                payload.status = updatedData.status;
            }

            const updated = await interviewsService.update(id, payload);

            setInterviews(prev => prev.map(item =>
                item.id.toString() === id.toString()
                    ? { ...item, ...updated, studentName: updated.student_name, grade: updated.course }
                    : item
            ));

            return updated;
        } catch (err) {
            console.error("Error updating interview:", err);
            throw err;
        }
    };

    const deleteInterview = async (id) => {
        try {
            await interviewsService.delete(id);
            setInterviews(prev => prev.filter(item => item.id.toString() !== id.toString()));
        } catch (err) {
            console.error("Error deleting interview:", err);
            throw err;
        }
    };

    // New methods for logic
    const uploadAudio = async (id, file) => {
        try {
            const updated = await interviewsService.uploadAudio(id, file);
            setInterviews(prev => prev.map(item =>
                item.id.toString() === id.toString() ? { ...item, ...updated, studentName: updated.student_name, grade: updated.course } : item
            ));
            return updated;
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const uploadSignature = async (id, signerType, file, signerName) => {
        try {
            const updated = await interviewsService.uploadSignature(id, signerType, file, signerName);
            setInterviews(prev => prev.map(item =>
                item.id.toString() === id.toString() ? { ...item, ...updated, studentName: updated.student_name, grade: updated.course } : item
            ));
            return updated;
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const generateSummary = async () => {
        const schoolId = getSchoolId();
        if (schoolId) return await interviewsService.generateSummary(schoolId);
        return null;
    };

    const value = {
        interviews,
        loading,
        error,
        refetch: fetchInterviews,
        addInterview,
        getInterview,
        updateInterview,
        deleteInterview,
        uploadAudio,
        uploadSignature,
        generateSummary
    };

    return (
        <InterviewContext.Provider value={value}>
            {children}
        </InterviewContext.Provider>
    );
};

export default InterviewContext;
