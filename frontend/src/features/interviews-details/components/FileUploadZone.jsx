import React from 'react';
import { Upload } from 'lucide-react';

function FileUploadZone({ isDragging, onDragEnter, onDragOver, onDragLeave, onDrop, onClick }) {
    return (
        <div
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={onClick}
            className={`bg-gray-50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 gap-3 cursor-pointer transition-all ${
                isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-100'
            }`}
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isDragging ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-400'
            }`}>
                <Upload size={24} />
            </div>
            <div>
                <p className="text-gray-700 text-sm font-medium">
                    {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz click para seleccionar'}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                    PDF, Word, Imágenes, Audio (máx. 10MB)
                </p>
            </div>
        </div>
    );
}

export default FileUploadZone;
