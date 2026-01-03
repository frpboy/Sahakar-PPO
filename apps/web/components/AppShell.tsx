'use client';

import { Sidebar } from './Sidebar';
import { useUserRole } from '../context/UserRoleContext';
import { Bell, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { auth } from '../src/lib/firebase';
import { signOut } from 'firebase/auth';
import { DutyEndButton } from './DutyEndButton';
import { OfflineBadge } from './OfflineBadge';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { RoleBadge } from './RoleBadge';

export function AppShell({ children }: { children: React.ReactNode }) {
    const { role, currentUser, isLoading } = useUserRole();
    const { isOnline, pendingSyncCount, processSyncQueue } = useOfflineSync();
    const pathname = usePathname();
    const router = useRouter();

    const isLoginPage = pathname === '/login';

    useEffect(() => {
        if (!isLoading && !currentUser && !isLoginPage) {
            router.push('/login');
        }
    }, [isLoading, currentUser, isLoginPage, router]);

    useEffect(() => {
        if (isOnline) {
            processSyncQueue();
        }
    }, [isOnline]);

    if (isLoginPage) {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-primary-700 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-neutral-500 font-medium text-sm">Initializing Sahakar PPO...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) return null;

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            <Sidebar />
            <div className="flex-1 pl-64 min-h-screen flex flex-col relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/5 blur-[120px] -z-10 rounded-full" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-success-500/5 blur-[100px] -z-10 rounded-full" />

                <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-neutral-200/60 px-8 h-20 flex justify-between items-center transition-all">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <h2 className="text-sm font-bold text-neutral-900 tracking-tight uppercase">Operational Command</h2>
                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-tight">System Live • Real-time Monitoring</p>
                        </div>
                        <div className="h-8 w-px bg-neutral-200/60" />
                        <OfflineBadge isOnline={isOnline} pendingSyncCount={pendingSyncCount} />
                    </div>

                    <div className="flex items-center gap-6">
                        {(role === 'BILLING_STAFF' || role === 'BILLING_HEAD') && (
                            <DutyEndButton
                                onDutyEnd={async () => {
                                    console.log('Duty ended');
                                }}
                            />
                        )}

                        <div className="flex items-center gap-6 pr-6 border-r border-neutral-200/60">
                            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-50 text-neutral-400 hover:text-brand-600 hover:bg-brand-50 smooth-transition relative">
                                <Bell size={20} />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger-500 rounded-full border-2 border-white"></span>
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-sm font-bold text-neutral-900 truncate max-w-[150px] leading-tight mb-1">{currentUser.email?.split('@')[0]}</span>
                                    <RoleBadge role={role || 'Authenticating...'} />
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-br from-brand-100 to-brand-50 border border-brand-200/60 text-brand-700 rounded-xl flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                                    {currentUser.email?.substring(0, 2) || 'U'}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-neutral-500 hover:text-danger-600 hover:bg-danger-50 smooth-transition text-xs font-bold uppercase tracking-widest"
                        >
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-8 w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}

