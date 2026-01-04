'use client';
import { Info, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPlaceholder() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="app-card p-12 bg-white text-center max-w-md flex flex-col items-center">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Settings size={32} className="text-brand-600" />
                </div>
                <h1 className="text-xl font-bold text-neutral-900 mb-2">Infrastructure Settings</h1>
                <p className="text-sm text-neutral-500 mb-8">Global system parameters, sync TTLs, and conflict rules are being moved to the persistent config store.</p>
                <button className="btn-brand w-full" onClick={() => router.back()}>Return to Dashboard</button>
            </div>
        </div>
    );
}
