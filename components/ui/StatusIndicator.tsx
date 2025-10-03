import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import * as db from '../../utils/db';

const StatusIndicator: React.FC = () => {
    const isOnline = useOnlineStatus();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const updateCount = async () => {
            const count = await db.getQueueCount();
            setPendingCount(count);
        };

        updateCount();

        // Listen for custom events that signal a change in the queue
        const handleQueueChange = () => updateCount();
        window.addEventListener('queue-changed', handleQueueChange);

        return () => {
            window.removeEventListener('queue-changed', handleQueueChange);
        };
    }, []);

    let statusText: string;
    if (isOnline) {
        statusText = pendingCount > 0 ? `Syncing (${pendingCount})` : 'Synced';
    } else {
        statusText = `Offline Mode (${pendingCount} pending)`;
    }

    const statusColor = isOnline ? (pendingCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800') : 'bg-gray-100 text-gray-800';
    const dotColor = isOnline ? (pendingCount > 0 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-500';

    return (
        <span
            className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full transition-colors duration-300 ${statusColor}`}
        >
             <span className={`h-2 w-2 rounded-full mr-2 ${dotColor}`}></span>
            {statusText}
        </span>
    );
};

export default StatusIndicator;