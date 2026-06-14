'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

/**
 * #ЗАЧЕМ: Компонент-слушатель ошибок Firestore.
 * #ЧТО: Подписывается на глобальный эмиттер и пробрасывает ошибки в Next.js.
 *       Использует относительные импорты для предотвращения циклов.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  if (error) {
    throw error;
  }

  return null;
}
