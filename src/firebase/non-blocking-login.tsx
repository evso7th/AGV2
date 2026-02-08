'use client';
import {
  Auth, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential
} from 'firebase/auth';

/** 
 * Initiate anonymous sign-in. 
 * #ОБНОВЛЕНО: Теперь возвращает Promise, чтобы вызывающий код мог обработать ошибки сети.
 */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  // Возвращаем промис для корректного ожидания в AudioEngineContext
  return signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}
