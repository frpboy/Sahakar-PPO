import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { AppShell } from '../components/AppShell';
import { UserRoleProvider } from '../context/UserRoleContext';
import { ToastProvider } from '../components/Toast';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter'
});

export const metadata: Metadata = {
    title: 'Sahakar PPO',
    description: 'Procurement Orchestration System',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>
                    <UserRoleProvider>
                        <ToastProvider>
                            <AppShell>
                                {children}
                            </AppShell>
                        </ToastProvider>
                    </UserRoleProvider>
                </Providers>
            </body>
        </html>
    );
}
