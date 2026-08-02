import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Providers } from '@/components/Providers';

/**
 * #ЗАЧЕМ: Корневой лейаут AuraGroove.
 * #ЧТО: ПЛАН №5.1 — Синхронизация манифеста и Apple-специфичных метаданных.
 */
export const metadata: Metadata = {
  title: 'AuraGroove',
  description: 'AI-powered ambient music generator',
  manifest: null, // Отключаем генерацию манифеста
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AuraGroove',
    startupImage: '/assets/icons/icon_512.png',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#a855f7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/assets/icons/icon_192.png" />
        <link rel="manifest" href="/manifest.json" /> 
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}