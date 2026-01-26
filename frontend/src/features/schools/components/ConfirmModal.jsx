export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", type = "danger" }) {
    if (!isOpen) return null;

    const styles = {
        danger: {
            button: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100",
            iconBg: "bg-red-50",
            icon: "text-red-600"
        },
        warning: {
            button: "bg-amber-400 hover:bg-amber-500 text-black shadow-lg shadow-amber-100",
            iconBg: "bg-amber-50",
            icon: "text-amber-500"
        },
        info: {
            button: "bg-black hover:bg-gray-800 text-white shadow-lg shadow-gray-200",
            iconBg: "bg-gray-50",
            icon: "text-gray-900"
        }
    };

    const currentStyle = styles[type] || styles.danger;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-auto overflow-hidden transform transition-all">
                <div className="p-8 pb-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${currentStyle.iconBg} mb-2`}>
                            <svg className={`w-7 h-7 ${currentStyle.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 flex gap-3 flex-col sm:flex-row-reverse">
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-95 ${currentStyle.button}`}
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors active:scale-95"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
}
