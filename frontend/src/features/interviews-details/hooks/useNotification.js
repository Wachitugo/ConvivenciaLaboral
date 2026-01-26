import { useState, useCallback } from 'react';
import { NOTIFICATION_DURATION } from '../constants/fileConstants';

export const useNotification = () => {
    const [notification, setNotification] = useState(null);

    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), NOTIFICATION_DURATION);
    }, []);

    const hideNotification = useCallback(() => {
        setNotification(null);
    }, []);

    return { notification, showNotification, hideNotification };
};
