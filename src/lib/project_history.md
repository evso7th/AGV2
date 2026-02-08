
# Журнал Проекта "AuraGroove"

---

### ЗАПИСЬ: 2024-12-04 (План №255: «IDENTITY-BASED GENE POOL ACCESS»)

**ПРОБЛЕМА:**
Даже при открытых правилах (`if true`), Firestore отклонял анонимные запросы записи из-за отсутствия объекта `auth` в контексте запроса (`auth: null`).

**РЕШЕНИЕ:**
1. **Silent Auth**: В метод `initialize()` контекста `AudioEngineProvider` добавлен вызов `initiateAnonymousSignIn`. Теперь каждый пользователь автоматически получает временный ID.
2. **Rule Upgrade**: В `firestore.rules` доступ к `masterpieces` изменен с анонимного на авторизованный (`if isSignedIn()`). 
3. **Connectivity**: Подтверждена работоспособность `Long Polling` для стабильного удержания сессии в Studio-среде.

---

### ЗАПИСЬ: 2024-12-04 (План №254: «CONNECTIVITY & PERMISSIONS BREAKTHROUGH»)

**ПРОБЛЕМА:**
1. Ошибка `FirebaseError: Missing or insufficient permissions` при сохранении в `masterpieces`.
2. Ошибка `WebChannelConnection RPC 'Listen' transport errored` (сетевой транспорт).

**РЕШЕНИЕ:**
1. **Long Polling**: В `src/firebase/index.ts` включен режим `experimentalForceLongPolling: true`. Это устраняет ошибки сетевого транспорта в Studio/IDX среде.
2. **Rule Refinement**: Правила Firestore для `masterpieces` упрощены до явного списка `get, list, create: if true`.
3. **SDK Initialization**: Переход на `initializeFirestore` для гарантированного применения сетевых настроек при старте.

---
