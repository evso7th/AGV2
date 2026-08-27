'use client';

import React, { ReactNode, useEffect } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AudioEngineProvider } from '@/contexts/audio-engine-context';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * #ЗАЧЕМ: Единая точка входа для всех клиентских провайдеров.
 * #ЧТО: Регистрация Service Worker для PWA и консолидация сервисов.
 */
export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      // next-pwa автоматически внедряет window.workbox
      // Но для надежности регистрируем явно
      const swUrl = '/sw.js';
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <FirebaseClientProvider>
      <AudioEngineProvider>
        {children}
      </AudioEngineProvider>
    </FirebaseClientProvider>
  );
}
