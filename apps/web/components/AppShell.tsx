'use client';

import { Sidebar } from './Sidebar';
import { useUserRole } from '../context/UserRoleContext';
import { Bell, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { auth } from '../src/lib/firebase';
import { signOut } from 'firebase/auth';
import { DutyEndButton } from './DutyEndButton';
// import { OfflineBadge } from './OfflineBadge'; // Will activate when offline sync is implemented

export function AppShell({ children }: { children: React.ReactNode }) {
    const { role, currentUser, isLoading } = useUserRole();
    const pathname = usePathname();
    const router = useRouter();

    const isLoginPage = pathname === '/login';

    useEffect(() => {
        if (!isLoading && !currentUser && !isLoginPage) {
            router.push('/login');
        }
    }, [isLoading, currentUser, isLoginPage, router]);

    if (isLoginPage) {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium anim-pulse">Initializing Sahakar PPO...</p>
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
        <div className="min-h-screen bg-[#F8F9FB]">
            <Sidebar />
            <div className="pl-64 min-h-screen flex flex-col">
                <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-8 py-3 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-800 tracking-tight">Sahakar PPO</h2>
                        {/* Offline Badge - will connect to actual online/offline state later */}
                        {/* <OfflineBadge isOnline={true} pendingSyncCount={0} /> */}
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Duty End Button - only for Billing roles */}
                        {(role === 'BILLING_STAFF' || role === 'BILLING_HEAD') && (
                            <DutyEndButton
                                onDutyEnd={async () => {
                                    // TODO: Implement duty end logic
                                    console.log('Duty ended');
                                }}
                            />
                        )}

                        <div className="flex items-center gap-4 border-r pr-6 border-gray-200">
                            <button className="text-gray-400 hover:text-gray-600 relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold uppercase">
                                    {currentUser.email?.substring(0, 2) || 'U'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="truncate max-w-[150px]">{currentUser.email}</span>
                                    <span className="text-xs text-indigo-600 font-semibold uppercase">{role?.replace('_', ' ') || 'Authenticating...'}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 max-w-[1600px] mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
