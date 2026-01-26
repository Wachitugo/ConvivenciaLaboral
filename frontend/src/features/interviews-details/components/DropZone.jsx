import React from 'react';
import { Upload } from 'lucide-react';

function DropZone() {
    return (
        <div className="border-2 border-dashed border-blue-400 bg-blue-50 rounded-xl flex flex-col items-center justify-center text-center p-8 gap-3">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Upload size={28} />
            </div>
            <div>
                <p className="text-blue-700 text-base font-semibold">
                    Suelta los archivos aquí
                </p>
                <p className="text-blue-500 text-sm mt-1">
                    PDF, Word, Imágenes, Audio (máx. 10MB)
                </p>
            </div>
        </div>
    );
}

export default DropZone;
