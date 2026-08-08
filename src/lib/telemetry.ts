'use client';

import { doc, updateDoc, increment, setDoc, Firestore } from 'firebase/firestore';

const FIRST_CONTACT_KEY = 'AG_FirstContact';

/**
 * #ЗАЧЕМ: Анонимный учет сессий (Zero Telemetry Protocol).
 * #ЧТО: Агрегация данных по суткам (YYYY-MM-DD) в Firestore без хранения IP или UID.
 */
export async function logAnonymousSession(db: Firestore) {
  if (typeof window === 'undefined') return;

  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'telemetry_daily', today);

  const isNewUser = !localStorage.getItem(FIRST_CONTACT_KEY);
  if (isNewUser) {
    localStorage.setItem(FIRST_CONTACT_KEY, Date.now().toString());
  }

  const locale = navigator.language || 'unknown';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';

  // Очистка ключей для Firestore (замена точек и слэшей)
  const cleanLocale = locale.replace(/\./g, '_');
  const cleanTimezone = timezone.replace(/\//g, '_');

  const updateData: any = {
    total_hits: increment(1),
    [`locales.${cleanLocale}`]: increment(1),
    [`timezones.${cleanTimezone}`]: increment(1)
  };

  if (isNewUser) {
    updateData.new_users = increment(1);
  } else {
    updateData.returning_users = increment(1);
  }

  try {
    await updateDoc(docRef, updateData);
  } catch (e: any) {
    // Если документ на сегодня еще не создан (ошибка 404), создаем его
    if (e.code === 'not-found' || e.name === 'FirebaseError') {
      const initialData = {
        total_hits: 1,
        new_users: isNewUser ? 1 : 0,
        returning_users: isNewUser ? 0 : 1,
        locales: { [cleanLocale]: 1 },
        timezones: { [cleanTimezone]: 1 },
        timestamp: new Date()
      };
      try {
        await setDoc(docRef, initialData);
      } catch (err) {
        // Молчаливый отказ в случае проблем с правами
      }
    }
  }
}
