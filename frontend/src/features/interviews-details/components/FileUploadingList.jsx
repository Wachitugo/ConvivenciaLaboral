import React from 'react';
import { Loader2 } from 'lucide-react';

function FileUploadingList({ uploadingFiles }) {
    if (uploadingFiles.length === 0) return null;

    return (
        <div className="space-y-2 flex-shrink-0">
            {uploadingFiles.map((fileName, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                    <Loader2 size={16} className="text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-800 flex-1">{fileName}</span>
                    <span className="text-xs text-blue-600">Subiendo...</span>
                </div>
            ))}
        </div>
    );
}

export default FileUploadingList;
