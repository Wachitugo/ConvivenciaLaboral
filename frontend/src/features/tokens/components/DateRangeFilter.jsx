import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, X } from 'lucide-react';

const DateRangeFilter = ({ range, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempRange, setTempRange] = useState(range);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync prop changes to temp state when not editing
    useEffect(() => {
        if (!isOpen) {
            setTempRange(range);
        }
    }, [range, isOpen]);

    const [label, setLabel] = useState('Personalizado');

    const presets = [
        { label: 'Últimos 7 días', days: 7 },
        { label: 'Últimos 30 días', days: 30 },
        { label: 'Últimos 60 días', days: 60 },
        { label: 'Últimos 90 días', days: 90 },
    ];

    // Initialize label based on range if it matches a preset
    useEffect(() => {
        const start = new Date(range.start);
        const end = new Date(range.end);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Check if end date is today (approximate check for UTC/Local mismatch)
        const today = new Date();
        const isEndToday = Math.abs(today - end) < 86400000; // within 24 hours

        if (isEndToday) {
            const preset = presets.find(p => Math.abs(p.days - diffDays) <= 1);
            if (preset) {
                setLabel(preset.label);
                return;
            }
        }

        setLabel(formatDateRange(range.start, range.end));
    }, [range]);

    const handlePresetClick = (days, presetLabel) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);

        const toLocalDateString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const newRange = {
            start: toLocalDateString(start),
            end: toLocalDateString(end)
        };

        onChange(newRange);
        setLabel(presetLabel);
        setIsOpen(false);
    };

    const handleApplyCustom = () => {
        onChange(tempRange);
        setLabel(formatDateRange(tempRange.start, tempRange.end));
        setIsOpen(false);
    };

    const formatDateRange = (startStr, endStr) => {
        if (!startStr || !endStr) return 'Seleccionar fecha';

        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            const userTimezoneOffset = date.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
            return new Intl.DateTimeFormat('es-CL', {
                month: 'short',
                day: 'numeric'
            }).format(adjustedDate);
        };

        return `${formatDate(startStr)} - ${formatDate(endStr)}`;
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            >
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 font-medium min-w-[140px] text-left">
                    {label}
                </span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rango de fechas</span>
                    </div>

                    <div className="flex flex-col">
                        <div className="p-4 border-b border-gray-100">
                            <h4 className="text-xs font-medium text-gray-500 mb-3">Rangos Rápidos</h4>
                            <div className="space-y-1">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.days}
                                        onClick={() => handlePresetClick(preset.days, preset.label)}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors flex items-center justify-between group"
                                    >
                                        {preset.label}
                                        <span className="opacity-0 group-hover:opacity-100 text-blue-500 text-xs">Aplicar</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4">
                            <h4 className="text-xs font-medium text-gray-500 mb-3">Personalizado</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Desde</label>
                                    <input
                                        type="date"
                                        value={tempRange.start}
                                        max={tempRange.end}
                                        onChange={(e) => setTempRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                                    <input
                                        type="date"
                                        value={tempRange.end}
                                        min={tempRange.start}
                                        onChange={(e) => setTempRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleApplyCustom}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors flex items-center gap-1"
                        >
                            <Check className="w-3 h-3" />
                            Aplicar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangeFilter;
