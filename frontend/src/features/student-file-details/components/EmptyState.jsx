import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState - Componente reutilizable para mostrar cuando no hay datos
 * @param {string} message - Mensaje a mostrar
 * @param {React.ElementType} icon - Icono personalizado (opcional)
 * @param {string} size - Tamaño: 'sm', 'md', 'lg'
 */
function EmptyState({
    message = 'Sin información registrada',
    icon: Icon = Inbox,
    size = 'md',
    className = ''
}) {
    const sizeStyles = {
        sm: {
            container: 'p-3',
            icon: 14,
            text: 'text-xs'
        },
        md: {
            container: 'p-4',
            icon: 18,
            text: 'text-sm'
        },
        lg: {
            container: 'p-6',
            icon: 24,
            text: 'text-base'
        }
    };

    const styles = sizeStyles[size] || sizeStyles.md;

    return (
        <div className={`flex flex-col items-center justify-center ${styles.container} rounded-lg bg-gray-50/80 border border-dashed border-gray-200 ${className}`}>
            <Icon size={styles.icon} className="text-gray-300 mb-1.5" />
            <p className={`${styles.text} text-gray-400 text-center`}>{message}</p>
        </div>
    );
}

export default EmptyState;
