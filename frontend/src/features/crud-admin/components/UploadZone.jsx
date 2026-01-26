import React from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { ACCEPTED_FILE_TYPES } from '../constant';

/**
 * Zona de arrastre/clic para subir archivos Excel
 */
export default function UploadZone({
    file,
    isProcessing,
    fileInputRef,
    onFileChange,
    onTriggerInput,
    onClearFile
}) {
    return (
        <div
            onClick={onTriggerInput}
            className={`relative group border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${file
                ? 'border-green-400 bg-green-50/30'
                : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50/30'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                className="hidden"
                accept={ACCEPTED_FILE_TYPES}
                disabled={isProcessing}
            />

            {file ? (
                <>
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                        <FileSpreadsheet size={28} className="text-green-600" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[280px]">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClearFile(); }}
                        className="text-xs text-red-500 hover:text-red-700 font-medium underline"
                    >
                        Cambiar archivo
                    </button>
                </>
            ) : (
                <>
                    <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                        <Upload size={24} className="text-gray-400 group-hover:text-purple-500" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 group-hover:text-purple-600">
                            Haga clic para subir archivo
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            .CSV, .XLSX, .XLS
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
