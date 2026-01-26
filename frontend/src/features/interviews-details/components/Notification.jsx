import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

function Notification({ notification, onClose }) {
    if (!notification) return null;

    const isSuccess = notification.type === 'success';

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
            <div className={`p-4 rounded-lg flex items-center gap-3 text-sm shadow-lg min-w-[300px] max-w-md ${
                isSuccess
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
                {isSuccess ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <span className="flex-1">{notification.message}</span>
                <button
                    onClick={onClose}
                    className="hover:opacity-70 transition-opacity flex-shrink-0"
                    aria-label="Cerrar notificación"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}

export default Notification;
