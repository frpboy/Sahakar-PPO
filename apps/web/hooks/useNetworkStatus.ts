'use client';
import { useEffect, useState } from 'react';
import { SyncQueue } from '../lib/sync-queue';

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingSync, setPendingSync] = useState(0);

    useEffect(() => {
        // Check initial online status
        setIsOnline(navigator.onLine);

        // Update pending count
        const updatePendingCount = async () => {
            const count = await SyncQueue.getPendingCount();
            setPendingSync(count);
        };

        // Handle online event
        const handleOnline = async () => {
            setIsOnline(true);
            console.log('🌐 Back online - processing sync queue');

            // Process pending sync items
            await SyncQueue.processPending();
            await updatePendingCount();
        };

        // Handle offline event
        const handleOffline = () => {
            setIsOnline(false);
            console.log('📡 Offline - mutations will queue');
        };

        // Add event listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Update pending count on mount
        updatePendingCount();

        // Poll for pending count updates
        const interval = setInterval(updatePendingCount, 10000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    return { isOnline, pendingSync };
}
