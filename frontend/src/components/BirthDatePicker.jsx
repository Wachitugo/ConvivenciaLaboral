import React, { useState, useEffect } from 'react';

/**
 * Selector de fecha con 3 dropdowns (día, mes, año)
 * Ideal para fechas de nacimiento donde hay que navegar muchos años
 */
export default function BirthDatePicker({ value, onChange, disabled = false, className = '' }) {
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    // Parsear valor inicial
    useEffect(() => {
        if (value) {
            const dateStr = value.split('T')[0]; // YYYY-MM-DD
            const [y, m, d] = dateStr.split('-');
            setYear(y || '');
            setMonth(m || '');
            setDay(d || '');
        } else {
            setDay('');
            setMonth('');
            setYear('');
        }
    }, [value]);

    // Generar opciones de años (desde hace 25 años hasta hace 4 años - rango típico estudiantes)
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 4; y >= currentYear - 25; y--) {
        years.push(y);
    }

    // Meses
    const months = [
        { value: '01', label: 'Enero' },
        { value: '02', label: 'Febrero' },
        { value: '03', label: 'Marzo' },
        { value: '04', label: 'Abril' },
        { value: '05', label: 'Mayo' },
        { value: '06', label: 'Junio' },
        { value: '07', label: 'Julio' },
        { value: '08', label: 'Agosto' },
        { value: '09', label: 'Septiembre' },
        { value: '10', label: 'Octubre' },
        { value: '11', label: 'Noviembre' },
        { value: '12', label: 'Diciembre' }
    ];

    // Días según mes y año
    const getDaysInMonth = (m, y) => {
        if (!m || !y) return 31;
        return new Date(parseInt(y), parseInt(m), 0).getDate();
    };

    const daysInMonth = getDaysInMonth(month, year);
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(d.toString().padStart(2, '0'));
    }

    // Manejar cambios
    const handleChange = (newDay, newMonth, newYear) => {
        if (newDay && newMonth && newYear) {
            // Validar que el día sea válido para el mes
            const maxDays = getDaysInMonth(newMonth, newYear);
            const validDay = parseInt(newDay) > maxDays ? maxDays.toString().padStart(2, '0') : newDay;
            onChange(`${newYear}-${newMonth}-${validDay}`);
        } else if (!newDay && !newMonth && !newYear) {
            onChange('');
        }
    };

    const selectClass = `px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className={`flex gap-2 ${className}`}>
            {/* Día */}
            <select
                value={day}
                onChange={(e) => {
                    setDay(e.target.value);
                    handleChange(e.target.value, month, year);
                }}
                disabled={disabled}
                className={`${selectClass} w-20`}
            >
                <option value="">Día</option>
                {days.map(d => (
                    <option key={d} value={d}>{parseInt(d)}</option>
                ))}
            </select>

            {/* Mes */}
            <select
                value={month}
                onChange={(e) => {
                    setMonth(e.target.value);
                    handleChange(day, e.target.value, year);
                }}
                disabled={disabled}
                className={`${selectClass} flex-1`}
            >
                <option value="">Mes</option>
                {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                ))}
            </select>

            {/* Año */}
            <select
                value={year}
                onChange={(e) => {
                    setYear(e.target.value);
                    handleChange(day, month, e.target.value);
                }}
                disabled={disabled}
                className={`${selectClass} w-24`}
            >
                <option value="">Año</option>
                {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </div>
    );
}
