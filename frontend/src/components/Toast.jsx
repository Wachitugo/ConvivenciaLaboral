import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, X } from 'lucide-react';

// Toast notification component
function Toast({ message, type = 'success', onClose, duration = 4000 }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    const Icon = type === 'success' ? CheckCircle : XCircle;

    return createPortal(
        <div
            className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 ${bgColor} text-white rounded-xl shadow-2xl animate-slideUp`}
            style={{ fontFamily: "'Poppins', sans-serif" }}
        >
            <Icon size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">{message}</span>
            <button
                onClick={onClose}
                className="ml-2 p-0.5 rounded-full hover:bg-white/20 transition-colors"
            >
                <X size={16} />
            </button>
        </div>,
        document.body
    );
}

// Hook for managing toast notifications
export function useToast() {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    const ToastComponent = toast ? (
        <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
        />
    ) : null;

    return { showToast, hideToast, ToastComponent };
}

export default Toast;
