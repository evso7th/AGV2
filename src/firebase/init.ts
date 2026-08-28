'use client';

import { firebaseConfig } from './config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

/**
 * #ЗАЧЕМ: Изолированная инициализация Firebase.
 * #ЧТО: ПЛАН №2205 — Включена оффлайн-персистентность для Firestore через современный API.
 *       Устраняет предупреждения о депрекации enableMultiTabIndexedDbPersistence.
 */
export function initializeFirebase() {
  let firebaseApp: FirebaseApp;
  
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  // Современный способ инициализации кэша Firestore
  if (typeof window !== 'undefined') {
    try {
      initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch (e) {
      // Игнорируем ошибку, если Firestore уже инициализирован с настройками
    }
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}
