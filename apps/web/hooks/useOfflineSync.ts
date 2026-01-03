import { useState, useEffect } from 'react';
import { db, SyncOperation } from '../src/lib/dexie';

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    useEffect(() => {
        // Monitor online status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOnline(navigator.onLine);

        // Monitor sync queue count
        const updateSyncCount = async () => {
            const count = await db.syncQueue.count();
            setPendingSyncCount(count);
        };

        updateSyncCount();
        const interval = setInterval(updateSyncCount, 5000); // Check every 5s

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const addToSyncQueue = async (operation: Omit<SyncOperation, 'id' | 'createdAt'>) => {
        await db.syncQueue.add({
            ...operation,
            createdAt: Date.now()
        });
        const count = await db.syncQueue.count();
        setPendingSyncCount(count);
    };

    const processSyncQueue = async () => {
        if (!isOnline) return;

        const operations = await db.syncQueue.orderBy('priority').reverse().toArray();
        if (operations.length === 0) return;

        console.log(`Processing ${operations.length} sync operations...`);

        for (const op of operations) {
            try {
                // Here we would call the actual API
                // For now, let's simulate a successful sync
                console.log(`Syncing operation: ${op.type} ${op.action}`);

                // await api.post('/sync', op.data); 

                await db.syncQueue.delete(op.id!);
            } catch (error) {
                console.error('Sync failed for operation', op.id, error);
                // Keep in queue for retry
                break;
            }
        }
    };

    return {
        isOnline,
        pendingSyncCount,
        addToSyncQueue,
        processSyncQueue
    };
}
