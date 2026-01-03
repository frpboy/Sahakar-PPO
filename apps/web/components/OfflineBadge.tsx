'use client';

import { WifiOff } from 'lucide-react';

interface OfflineBadgeProps {
    isOnline: boolean;
    pendingSyncCount?: number;
}

export function OfflineBadge({ isOnline, pendingSyncCount = 0 }: OfflineBadgeProps) {
    if (isOnline && pendingSyncCount === 0) return null;

    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            {!isOnline && (
                <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Offline Mode</span>
                </>
            )}
            {isOnline && pendingSyncCount > 0 && (
                <>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span>Syncing ({pendingSyncCount})</span>
                </>
            )}
        </div>
    );
}
