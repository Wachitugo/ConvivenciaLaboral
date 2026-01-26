import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const SignaturePad = forwardRef(function SignaturePad({ onEnd, onClear, backgroundUrl = null }, ref) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';

        // Handle resize
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };

        // Initial size
        resizeCanvas();

        // Clean up
        return () => { };
    }, []);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { offsetX, offsetY } = getCoordinates(e, canvas);

        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { offsetX, offsetY } = getCoordinates(e, canvas);

        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
        if (isEmpty) setIsEmpty(false);
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            // Notify parent that something was drawn (simple validation)
            if (onEnd) onEnd(!isEmpty ? true : false); // Indicate that something was drawn
        }
    };

    const getCoordinates = (e, canvas) => {
        // Touch events vs Mouse events
        if (e.touches && e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top
            };
        }
        return {
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY
        };
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        if (onEnd) onEnd(false); // Indicate empty
        if (onClear) onClear();
    };

    // Exponer helpers al padre
    useImperativeHandle(ref, () => ({
        clear: () => clearSignature(),
        isEmpty: () => isEmpty,
        async getBlob() {
            const canvas = canvasRef.current;
            if (!canvas) return null;
            return await new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob), 'image/png');
            });
        }
    }));

    return (
        <div className="relative w-full h-40 bg-transparent border border-gray-300 rounded-lg overflow-hidden touch-none">
            {backgroundUrl && (
                <img src={backgroundUrl} alt="firma guardada" className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0" />
            )}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair z-10"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <button
                type="button"
                onClick={clearSignature}
                className="absolute bottom-2 right-2 text-xs text-red-500 hover:text-red-700 bg-white/80 px-2 py-1 rounded border border-red-200 z-20"
            >
                Borrar Firma
            </button>
        </div>
    );
});

export default SignaturePad;
