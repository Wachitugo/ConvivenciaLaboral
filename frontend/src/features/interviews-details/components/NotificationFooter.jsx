import React from 'react';

function NotificationFooter({ notification, onClose, totalFiles }) {
    if (notification) {
        return (
            <div className={`flex-shrink-0 px-4 py-3 border-t flex items-center gap-2 text-sm ${
                notification.type === 'success'
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : 'bg-red-50 text-red-800 border-red-200'
            }`}>
                {notification.type === 'success' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
                <span className="flex-1">{notification.message}</span>
                <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    if (totalFiles > 0) {
        return (
            <div className="px-4 py-3 border-t border-stone-200 bg-stone-50 flex-shrink-0">
                <div className="flex items-center justify-end text-xs text-gray-500">
                    <span className="font-medium text-gray-900">
                        Total: <span className="font-medium text-gray-900">{totalFiles}</span>
                    </span>
                </div>
            </div>
        );
    }

    return null;
}

export default NotificationFooter;
