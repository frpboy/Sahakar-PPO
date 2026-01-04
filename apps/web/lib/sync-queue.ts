import { db } from './db';

export class SyncQueue {
    /**
     * Add an API call to the sync queue
     */
    static async enqueue(endpoint: string, method: 'POST' | 'PUT' | 'DELETE', payload: any) {
        await db.syncQueue.add({
            endpoint,
            method,
            payload,
            createdAt: Date.now(),
            retryCount: 0,
            status: 'pending'
        });
    }

    /**
     * Process all pending items in the sync queue
     */
    static async processPending() {
        const pendingItems = await db.syncQueue
            .where('status')
            .equals('pending')
            .toArray();

        for (const item of pendingItems) {
            await this.syncItem(item);
        }
    }

    /**
     * Sync a single item
     */
    private static async syncItem(item: any) {
        if (!item.id) return;

        try {
            // Update status to syncing
            await db.syncQueue.update(item.id, { status: 'syncing' });

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';
            const response = await fetch(`${apiUrl}${item.endpoint}`, {
                method: item.method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.payload)
            });

            if (response.ok) {
                // Successfully synced, remove from queue
                await db.syncQueue.delete(item.id);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error(`Failed to sync item ${item.id}:`, error);

            // Increment retry count
            await db.syncQueue.update(item.id, {
                status: 'failed',
                retryCount: item.retryCount + 1
            });

            // If too many retries, mark as permanently failed
            if (item.retryCount >= 5) {
                console.error(`Item ${item.id} failed after 5 retries`);
            }
        }
    }

    /**
     * Get count of pending items
     */
    static async getPendingCount(): Promise<number> {
        return await db.syncQueue
            .where('status')
            .equals('pending')
            .count();
    }

    /**
     * Clear all synced items
     */
    static async clearSynced() {
        await db.syncQueue.where('status').equals('pending').delete();
    }
}
