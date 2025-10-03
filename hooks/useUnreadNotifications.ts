import { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const ORIGINAL_TITLE = document.title;

export const useUnreadNotifications = () => {
    const { state } = useData();
    const { user } = useAuth();
    const [isTabFocused, setIsTabFocused] = useState(true);

    const currentUserId = user?.type === 'agent' ? user.id : 'admin';
    const unreadCount = state.messages.filter(m => m.recipientId === currentUserId && m.status === 'unread').length;

    useEffect(() => {
        const handleFocus = () => setIsTabFocused(true);
        const handleBlur = () => setIsTabFocused(false);

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    useEffect(() => {
        if (unreadCount > 0 && !isTabFocused) {
            document.title = `(${unreadCount}) New Message! | ${ORIGINAL_TITLE}`;
        } else {
            document.title = ORIGINAL_TITLE;
        }

        // Cleanup function to reset title when component unmounts
        return () => {
            document.title = ORIGINAL_TITLE;
        };
    }, [unreadCount, isTabFocused]);
};