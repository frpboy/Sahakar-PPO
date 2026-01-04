import type { Metadata, Viewport } from 'next';
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

// Next.js 16+ requires viewport config in separate export
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
    themeColor: '#4f46e5'
};

export const metadata: Metadata = {
    title: 'Sahakar PPO - Procurement Order Processing',
    description: 'Enterprise Procurement Order Processing System',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Sahakar PPO'
    },
    formatDetection: {
        telephone: false
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
