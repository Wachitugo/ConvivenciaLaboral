import { Image, FileType, FileText, File } from 'lucide-react';

export const getFileIcon = (type) => {
    if (type.startsWith('image/')) {
        return { Icon: Image, className: 'text-purple-600' };
    }
    if (type.includes('pdf')) {
        return { Icon: FileType, className: 'text-red-600' };
    }
    if (type.includes('word')) {
        return { Icon: FileText, className: 'text-blue-600' };
    }
    if (type.startsWith('audio/')) {
        return {
            Icon: () => (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                </svg>
            ),
            className: 'text-green-600'
        };
    }
    return { Icon: File, className: 'text-gray-600' };
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const formatDate = (dateValue) => {
    if (!dateValue) return 'Sin fecha';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Sin fecha';
    return date.toLocaleDateString();
};
