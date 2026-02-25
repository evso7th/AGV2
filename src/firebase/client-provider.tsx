'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';
import { initiateAnonymousSignIn } from './non-blocking-login';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * #ЗАЧЕМ: Клиентский провайдер Firebase.
 * #ЧТО: Инициализирует SDK и выполняет анонимный вход.
 *       Использует прямые импорты для предотвращения ChunkLoadError.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []); 

  useEffect(() => {
    if (firebaseServices.auth) {
      initiateAnonymousSignIn(firebaseServices.auth);
    }
  }, [firebaseServices.auth]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
