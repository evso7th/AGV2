
'use client';

import { firebaseConfig } from './config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * #ЗАЧЕМ: Изолированная инициализация Firebase для предотвращения ChunkLoadError.
 * #ЧТО: Этот файл является единственным источником правды для SDK, не имеющим зависимостей от других файлов Firebase.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    // Прямая инициализация с использованием конфига для избежания ошибок при сборке
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}
