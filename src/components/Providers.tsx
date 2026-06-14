'use client';

import React, { ReactNode } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AudioEngineProvider } from '@/contexts/audio-engine-context';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * #ЗАЧЕМ: Единая точка входа для всех клиентских провайдеров.
 * #ЧТО: Консолидация Firebase и AudioEngine в один чанк для предотвращения ChunkLoadError.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <FirebaseClientProvider>
      <AudioEngineProvider>
        {children}
      </AudioEngineProvider>
    </FirebaseClientProvider>
  );
}
