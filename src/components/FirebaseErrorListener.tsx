'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

/**
 * #ЗАЧЕМ: Профессиональный перехватчик ошибок Firestore.
 * #ЧТО: ПЛАН №2405 — Защита от "Black Screen of Death" в Safari.
 *       На localhost бросает ошибку для ИИ-агента, на проде — показывает деликатный Toast.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (incomingError: FirestorePermissionError) => {
      // 1. Всегда логируем в консоль для дебага
      console.error('[FirebaseErrorListener] Intercepted:', incomingError.message);
      
      // 2. Показываем уведомление пользователю (не блокирует UI)
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Cloud write permission error. Check your connection or login status."
      });

      // 3. Сохраняем в стейт только если мы на localhost (для отладки ИИ-агентом)
      const isDev = typeof window !== 'undefined' && 
                   (window.location.hostname === 'localhost' || 
                    window.location.hostname.includes('cloudworkstations.dev'));
      
      if (isDev) {
        setError(incomingError);
      }
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // Выбрасываем ошибку для срабатывания Next.js Error Boundary ТОЛЬКО в режиме разработки
  if (error) {
    throw error;
  }

  return null;
}
