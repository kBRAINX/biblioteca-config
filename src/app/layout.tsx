import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/contexts/themeContext';
import { NotificationProvider } from '@/contexts/notificationContext';
import { Providers } from './providers';
import { DevTools } from '@/components/DevTools';

export const metadata: Metadata = {
    title: 'Sistema de Biblioteca - Configuración',
    description: 'Panel de configuración para el sistema de biblioteca',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr" suppressHydrationWarning>
        <body>
        <Providers>
            <ThemeProvider>
                <NotificationProvider>
                    {children}
                    <DevTools />
                </NotificationProvider>
            </ThemeProvider>
        </Providers>
        </body>
        </html>
    );
}
