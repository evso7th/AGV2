
# Журнал Проекта "AuraGroove"

---

### ЗАПИСЬ: 2024-12-04 (План №256: «ROBUST AUTH & IDEMPOTENT SDK»)

**ПРОБЛЕМА:**
1. Ошибка `FirebaseError: auth/network-request-failed` при анонимном входе.
2. Необработанные промисы (unhandled rejections) в консоли.
3. Повторная инициализация Firestore приводила к нестабильности SDK.

**РЕШЕНИЕ:**
1. **Idempotent Init**: Функция `getSdks` в `src/firebase/index.ts` теперь проверяет, создан ли Firestore, прежде чем вызывать `initializeFirestore`. Это устраняет конфликты при HMR и ре-рендерах.
2. **Promise Fix**: `initiateAnonymousSignIn` теперь возвращает `Promise`, что позволяет `AudioEngineProvider` корректно ожидать (`await`) завершения авторизации.
3. **Robust Error Handling**: В `AudioEngineProvider` добавлен блок `try/catch` вокруг входа. Сетевые сбои авторизации теперь логируются как предупреждения, позволяя приложению работать в "автономном" режиме без падения всего движка.

---

### ЗАПИСЬ: 2024-12-04 (План №255: «IDENTITY-BASED GENE POOL ACCESS»)

**ПРОБЛЕМА:**
Даже при открытых правилах (`if true`), Firestore отклонял анонимные запросы записи из-за отсутствия объекта `auth` в контексте запроса (`auth: null`).

**РЕШЕНИЕ:**
1. **Silent Auth**: В метод `initialize()` контекста `AudioEngineProvider` добавлен вызов `initiateAnonymousSignIn`. Теперь каждый пользователь автоматически получает временный ID.
2. **Rule Upgrade**: В `firestore.rules` доступ к `masterpieces` изменен с анонимного на авторизованный (`if isSignedIn()`). 
3. **Connectivity**: Подтверждена работоспособность `Long Polling` для стабильного удержания сессии в Studio-среде.

---
