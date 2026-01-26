import React from 'react';
import { Loader2 } from 'lucide-react';

function UploadProgress({ uploadingFiles }) {
    if (uploadingFiles.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-6 z-50 animate-slide-up">
            <div className="bg-white border border-blue-200 rounded-lg shadow-lg p-4 min-w-[320px] max-w-md">
                <div className="flex items-center gap-2 mb-3">
                    <Loader2 size={18} className="text-blue-600 animate-spin" />
                    <h3 className="text-sm font-semibold text-gray-800">
                        Subiendo {uploadingFiles.length} archivo{uploadingFiles.length > 1 ? 's' : ''}
                    </h3>
                </div>
                <div className="space-y-2">
                    {uploadingFiles.map((fileName, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="truncate">{fileName}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default UploadProgress;
