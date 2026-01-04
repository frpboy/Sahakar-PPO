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
    title: 'Sahakar PPO - Procurement Order Processing',
    description: 'Enterprise Procurement Order Processing System',
    manifest: '/manifest.json',
    themeColor: '#4f46e5',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Sahakar PPO'
    },
    formatDetection: {
        telephone: false
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
        userScalable: true,
        viewportFit: 'cover'
    }
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
