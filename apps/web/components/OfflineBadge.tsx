'use client';

import { WifiOff } from 'lucide-react';

interface OfflineBadgeProps {
    isOnline: boolean;
    pendingSyncCount?: number;
}

export function OfflineBadge({ isOnline, pendingSyncCount = 0 }: OfflineBadgeProps) {
    if (isOnline && pendingSyncCount === 0) return null;

    if (!isOnline) {
        return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-error-100 border border-error-100 text-error-600">
                <WifiOff size={14} className="stroke-[2.5px]" />
                <span className="text-[10px] font-bold uppercase tracking-widest italic">Offline Mode</span>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent-100 border border-accent-100 text-accent-600">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Syncing ({pendingSyncCount})</span>
        </div>
    );
}
