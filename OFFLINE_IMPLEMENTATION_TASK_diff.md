--- OFFLINE_IMPLEMENTATION_TASK.md (原始)


+++ OFFLINE_IMPLEMENTATION_TASK.md (修改后)
# Техническое задание: 100% Оффлайн-режим для AuraGroove

## 🎯 Цель
Обеспечить полную работоспособность приложения без интернет-соединения после первичной загрузки и кэширования данных.

---

## 📋 Что нужно проверить (Аудит текущего состояния)

### 1. Аудио-ассеты
- [ ] **Проверить наличие всех файлов**: Убедиться, что все 957 `.ogg` файлов присутствуют в `/public/assets/`
- [ ] **Проверить пути импорта**: Все ли sampler-классы используют относительные пути к локальным файлам
- [ ] **Проверить размеры**: Общий размер ассетов (~116MB) — убедиться, что хостинг позволяет отдавать такой объем

**Команда для проверки:**
```bash
find public/assets -name "*.ogg" | wc -l
du -sh public/assets
```

### 2. Firebase конфигурация
- [ ] **Проверить `src/firebase/init.ts`**: Убедиться, что используется правильная конфигурация
- [ ] **Проверить коллекции Firestore**: Какие данные критичны для оффлайн-работы
  - `heritage_axioms` — аксиомы наследия
  - Другие коллекции, используемые в приложении
- [ ] **Проверить аутентификацию**: Убедиться, что анонимный вход работает корректно

### 3. Текущие сетевые запросы
- [ ] **Найти все `fetch()` вызовы**:
```bash
grep -r "fetch(" src/ --include="*.ts" --include="*.tsx"
```
- [ ] **Найти все Firestore запросы**:
```bash
grep -r "getDocs\|onSnapshot\|addDoc\|updateDoc" src/ --include="*.ts" --include="*.tsx"
```
- [ ] **Составить список endpoints**, которые требуют оффлайн-обработки

---

## ➕ Что нужно добавить

### 1. Зависимости
```bash
npm install idb workbox-window
```

**Файлы для установки:**
- `idb` — Promise-based обертка над IndexedDB для кэширования аудио
- `workbox-window` — Управление Service Worker

### 2. Новые файлы

#### `src/lib/audio-cache.ts`
**Назначение**: Кэширование аудио-сэмплов в IndexedDB

**Требования:**
- Функция `initAudioCache()`: Инициализация базы данных
- Функция `cacheAudioFile(url: string, arrayBuffer: ArrayBuffer)`: Сохранение сэмпла
- Функция `getCachedAudio(url: string): Promise<ArrayBuffer | null>`: Получение из кэша
- Функция `cacheAllEssentialSamples()`: Массовое кэширование при первом запуске
- Функция `getCacheStats()`: Статистика занятого места

#### `src/lib/offline-sync.ts`
**Назначение**: Синхронизация данных Firestore

**Требования:**
- Функция `enableOfflinePersistence(db: Firestore)`: Включение IndexedDB для Firestore
- Функция `preloadHeritageAxioms(db: Firestore)`: Предзагрузка аксиом
- Функция `forceSyncFirestore(db: Firestore)`: Принудительная синхронизация с сервером
- Функция `getSyncStatus()`: Статус последней синхронизации (время, успех/ошибка)
- Функция `clearOfflineCache()`: Очистка кэша при необходимости

#### `public/sw.js` (Service Worker)
**Назначение**: Кэширование статики (HTML, CSS, JS, шрифты, изображения)

**Требования:**
- Стратегия Cache First для статики
- Стратегия Network First для API (с fallback на кэш)
- Автоматическое обновление кэша при изменении версии
- Обработка навигации для SPA

**Альтернатива**: Использовать `next-pwa` для автоматической генерации SW

#### `public/manifest.json`
**Назначение**: PWA манифест для установки приложения

**Содержимое:**
```json
{
  "name": "AuraGroove",
  "short_name": "AuraGroove",
  "description": "Генеративная музыкальная система",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "start_url": "/",
  "icons": [
    {
      "src": "/assets/icon8.jpeg",
      "sizes": "512x512",
      "type": "image/jpeg"
    }
  ]
}
```

#### `src/components/OfflineSyncButton.tsx`
**Назначение**: UI компонент для принудительной синхронизации

**Требования:**
- Кнопка «Синхронизировать с облаком»
- Индикатор статуса (онлайн/оффлайн)
- Индикатор прогресса синхронизации
- Сообщение о последней успешной синхронизации
- Обработка ошибок сети

#### `src/components/OfflinePreloader.tsx`
**Назначение**: Экран предзагрузки перед первым использованием

**Требования:**
- Прогресс-бар загрузки аудио-сэмплов
- Прогресс-бар загрузки данных Firestore
- Сообщение о статусе («Загрузка сэмплов...», «Синхронизация данных...»)
- Блокировка интерфейса до завершения загрузки

### 3. Модификация существующих файлов

#### `src/firebase/init.ts`
**Изменения:**
```typescript
import { enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

export async function initializeFirebase() {
  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);
  const auth = getAuth(app);

  // Включаем оффлайн-персистентность
  try {
    await enableMultiTabIndexedDbPersistence(firestore);
    console.log('✅ Offline persistence enabled');
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Multiple tabs open, persistence limited');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Browser does not support persistence');
    } else {
      console.error('❌ Failed to enable persistence:', err);
    }
  }

  return { firebaseApp: app, firestore, auth };
}
```

#### `src/app/layout.tsx`
**Изменения:**
- Добавить `<link rel="manifest" href="/manifest.json" />`
- Добавить `<meta name="theme-color" content="#000000" />`
- Обернуть приложение в `OfflinePreloader`
- Добавить регистрацию Service Worker

```typescript
// Регистрация SW
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  });
}
```

#### Все sampler-классы (14 файлов)
**Файлы для модификации:**
- `src/lib/sampler-player.ts`
- `src/lib/sampler-bamboo.ts`
- `src/lib/sampler-duduk.ts`
- `src/lib/sampler-flute.ts`
- `src/lib/sampler-gong.ts`
- `src/lib/sampler-guitar.ts`
- `src/lib/sampler-hang.ts`
- `src/lib/sampler-kalimba.ts`
- `src/lib/sampler-kosha.ts`
- `src/lib/sampler-rattle.ts`
- `src/lib/sampler-singing-bowl.ts`
- `src/lib/sampler-talking-drum.ts`
- `src/lib/sampler-tibetan-bowl.ts`
- `src/lib/sampler-zamboula.ts`

**Изменения в каждом файле:**
```typescript
// Было:
async loadSample(url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return this.ctx.decodeAudioData(arrayBuffer);
}

// Стало:
import { getCachedAudio, cacheAudioFile } from '@/lib/audio-cache';

async loadSample(url: string): Promise<AudioBuffer> {
  // Проверяем кэш
  const cached = await getCachedAudio(url);
  if (cached) {
    try {
      return await this.ctx.decodeAudioData(cached.slice(0));
    } catch (e) {
      console.warn('Cached audio corrupted, re-fetching:', url);
    }
  }

  // Загружаем из сети
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();

    // Кэшируем для будущего использования
    await cacheAudioFile(url, arrayBuffer);

    return await this.ctx.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error(`Failed to load sample: ${url}`, error);
    throw error;
  }
}
```

#### `src/hooks/useFirestoreData.ts` (или аналогичный хук)
**Изменения:**
- Добавить обработку оффлайн-режима
- Добавить индикатор статуса синхронизации
- Реализовать механизм повторных попыток

```typescript
import { useEffect, useState } from 'react';
import { collection, onSnapshot, getFirestore } from 'firebase/firestore';
import { getNetworkStatus } from '@/lib/network-status';

export function useHeritageAxioms() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!getNetworkStatus());
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const db = getFirestore();
    const ref = collection(db, 'heritage_axioms');

    // Слушаем изменения (работает оффлайн с кэшированными данными)
    const unsubscribe = onSnapshot(ref,
      (snapshot) => {
        const newData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(newData);
        setIsLoading(false);

        if (snapshot.metadata.fromCache) {
          console.log('📦 Data loaded from cache');
        } else {
          setLastSyncTime(new Date());
          console.log('☁️ Data synced from server');
        }
      },
      (error) => {
        console.error('Firestore error:', error);
        setIsLoading(false);
      }
    );

    // Отписываемся при размонтировании
    return () => unsubscribe();
  }, []);

  // Отслеживаем статус сети
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { data, isLoading, isOffline, lastSyncTime };
}
```

---

## 🔄 Обработка синхронизации Firestore

### Архитектура синхронизации

```
┌──────────────────────────────────────────────────────┐
│                  СИНХРОНИЗАЦИЯ                        │
├──────────────────────────────────────────────────────┤
│  1. Онлайн режим:                                     │
│     - onSnapshot() слушает изменения в реальном времени│
│     - Данные автоматически кэшируются в IndexedDB     │
│     - Пользователь видит актуальные данные            │
│                                                      │
│  2. Оффлайн режим:                                    │
│     - onSnapshot() возвращает данные из IndexedDB     │
│     - Помечает данные как «из кэша» (fromCache: true) │
│     - Пользователь видит последнюю известную версию   │
│                                                      │
│  3. Восстановление соединения:                        │
│     - Firebase автоматически синхронизирует данные    │
│     - onSnapshot() вызывает callback с новыми данными │
│     - Интерфейс обновляется без перезагрузки          │
│                                                      │
│  4. Принудительная синхронизация (кнопка):            │
│     - Проверяет наличие интернета                     │
│     - Выполняет getDocs() для получения свежих данных │
│     - Обновляет локальный кэш IndexedDB               │
│     - Показывает пользователю результат               │
└──────────────────────────────────────────────────────┘
```

### Реализация кнопки синхронизации

```typescript
// src/components/OfflineSyncButton.tsx
'use client';

import { useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getNetworkStatus } from '@/lib/network-status';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
}

export function OfflineSyncButton() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: getNetworkStatus(),
    isSyncing: false,
    lastSyncTime: null,
    error: null,
  });

  const handleForceSync = async () => {
    setStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    if (!getNetworkStatus()) {
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: 'Нет подключения к интернету. Синхронизация невозможна.',
      }));
      return;
    }

    try {
      const db = getFirestore();
      const collections = ['heritage_axioms']; // Добавить другие коллекции

      for (const colName of collections) {
        const snapshot = await getDocs(collection(db, colName));
        console.log(`✅ Synced ${colName}: ${snapshot.size} documents`);
      }

      setStatus({
        isOnline: true,
        isSyncing: false,
        lastSyncTime: new Date(),
        error: null,
      });
    } catch (error) {
      setStatus({
        isOnline: true,
        isSyncing: false,
        lastSyncTime: null,
        error: `Ошибка синхронизации: ${(error as Error).message}`,
      });
    }
  };

  return (
    <div className="sync-button-container">
      <button
        onClick={handleForceSync}
        disabled={status.isSyncing || !status.isOnline}
        className={`sync-btn ${status.isOnline ? 'online' : 'offline'}`}
      >
        {status.isSyncing ? (
          <>
            <Spinner />
            Синхронизация...
          </>
        ) : status.isOnline ? (
          '🔄 Синхронизировать с облаком'
        ) : (
          '📴 Оффлайн режим'
        )}
      </button>

      {status.lastSyncTime && (
        <p className="last-sync">
          Последняя синхронизация:{' '}
          {status.lastSyncTime.toLocaleTimeString()}
        </p>
      )}

      {status.error && (
        <p className="sync-error">{status.error}</p>
      )}
    </div>
  );
}
```

### Хук для отслеживания статуса сети

```typescript
// src/lib/network-status.ts
export function getNetworkStatus(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

export function subscribeToNetworkStatus(callback: (isOnline: boolean) => void) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Возвращаем функцию отписки
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
```

---

## ✅ Чек-листы проверки для программиста

### Чек-лист 1: Установка зависимостей и создание файлов
- [ ] Установлен пакет `idb`: `npm install idb`
- [ ] Установлен пакет `workbox-window`: `npm install workbox-window`
- [ ] Создан файл `src/lib/audio-cache.ts`
- [ ] Создан файл `src/lib/offline-sync.ts`
- [ ] Создан файл `src/lib/network-status.ts`
- [ ] Создан файл `public/sw.js`
- [ ] Создан файл `public/manifest.json`
- [ ] Создан компонент `src/components/OfflineSyncButton.tsx`
- [ ] Создан компонент `src/components/OfflinePreloader.tsx`

### Чек-лист 2: Модификация существующих файлов
- [ ] Обновлен `src/firebase/init.ts` с `enableMultiTabIndexedDbPersistence()`
- [ ] Обновлен `src/app/layout.tsx` с подключением манифеста и регистрацией SW
- [ ] Обновлены все 14 sampler-файлов с логикой кэширования аудио
- [ ] Обновлены хуки работы с Firestore с обработкой оффлайн-режима
- [ ] Добавлен `OfflinePreloader` в корневой компонент приложения
- [ ] Добавлена кнопка `OfflineSyncButton` в интерфейс (например, в настройки)

### Чек-лист 3: Функциональное тестирование
- [ ] **Тест 1**: Открыть приложение с интернетом → дождаться полной загрузки → отключить интернет → перезагрузить страницу → приложение работает
- [ ] **Тест 2**: Открыть приложение с интернетом → отключить интернет → нажать кнопку воспроизведения → звук играет
- [ ] **Тест 3**: Открыть приложение с интернетом → отключить интернет → перейти по всем страницам → все страницы загружаются
- [ ] **Тест 4**: Открыть приложение с интернетом → изменить данные в Firestore через консоль → нажать кнопку «Синхронизировать» → данные обновляются
- [ ] **Тест 5**: Открыть приложение → отключить интернет → нажать кнопку «Синхронизировать» → показывается ошибка «Нет подключения»
- [ ] **Тест 6**: Открыть приложение в режиме инкогнито → отключить интернет → приложение не работает (корректное поведение, т.к. кэш пустой)
- [ ] **Тест 7**: Проверить размер IndexedDB в DevTools → убедится, что аудио-сэмплы занимают ожидаемый объем (~116MB)
- [ ] **Тест 8**: Проверить вкладку Application → Cache Storage → убедиться, что статика закэширована
- [ ] **Тест 9**: Проверить вкладку Application → IndexedDB → убедиться, что созданы базы `AuraGroove_AudioCache` и Firebase cache
- [ ] **Тест 10**: Проверить работу Service Worker в DevTools → Application → Service Workers

### Чек-лист 4: Тестирование в различных браузерах
- [ ] Chrome Desktop (полная поддержка)
- [ ] Firefox Desktop (поддержка IndexedDB и SW)
- [ ] Safari Desktop (ограниченная поддержка SW, проверить работу)
- [ ] Chrome Mobile Android (PWA установка)
- [ ] Safari iOS (ограничения iOS, проверить работу оффлайн)

### Чек-лист 5: Производительность
- [ ] Время первой загрузки с кэшированием < 10 секунд (зависит от скорости интернета)
- [ ] Время загрузки в оффлайн-режиме < 2 секунд
- [ ] Отсутствие ошибок в консоли при работе оффлайн
- [ ] Отсутствие утечек памяти при длительной работе (проверить в DevTools)

### Чек-лист 6: Обработка ошибок
- [ ] При повреждении кэша аудио → автоматическая повторная загрузка при появлении интернета
- [ ] При переполнении IndexedDB → показывается понятное сообщение пользователю
- [ ] При ошибке синхронизации Firestore → показывается ошибка с возможностью повторить
- [ ] При блокировке Service Worker браузером → показывается предупреждение

---

## 🛠 Инструменты для разработки

### Просмотр IndexedDB
```javascript
// В консоли браузера
const request = indexedDB.open('AuraGroove_AudioCache');
request.onsuccess = (e) => {
  const db = e.target.result;
  const transaction = db.transaction(['samples'], 'readonly');
  const store = transaction.objectStore('samples');
  const countRequest = store.count();
  countRequest.onsuccess = () => {
    console.log('В кэше сэмплов:', countRequest.result);
  };
};
```

### Просмотр Cache Storage
```javascript
// В консоли браузера
caches.keys().then(names => {
  names.forEach(name => {
    caches.open(name).then(cache => {
      cache.keys().then(requests => {
        console.log(`${name}: ${requests.length} файлов`);
      });
    });
  });
});
```

### Эмуляция оффлайн-режима в DevTools
1. Открыть DevTools (F12)
2. Перейти во вкладку **Network**
3. Выбрать **Offline** в выпадающем списке
4. Перезагрузить страницу (Ctrl+R)

### Lighthouse аудит
1. Открыть DevTools
2. Перейти во вкладку **Lighthouse**
3. Выбрать категории: PWA, Performance
4. Нажать **Analyze page load**
5. Убедиться, что score PWA > 90

---

## 📊 Метрики успеха

| Метрика | Целевое значение | Как измерить |
|---------|------------------|--------------|
| Работа без интернета | 100% функционала | Ручное тестирование |
| Время загрузки оффлайн | < 2 сек | DevTools Performance |
| Размер кэша аудио | ~116MB | DevTools Application |
| Количество закэшированных сэмплов | 957 файлов | Console log |
| PWA Score | > 90 | Lighthouse |
| Ошибки в оффлайн-режиме | 0 | Console errors |

---

## ⚠️ Известные ограничения

1. **Safari iOS**: Service Worker имеет ограничения, может потребоваться периодическое открытие приложения для обновления кэша
2. **Лимиты IndexedDB**: Некоторые браузеры ограничивают размер (обычно 50-80% свободного места на диске)
3. **Первый запуск**: Требует стабильного интернета для загрузки всех ассетов (~116MB)
4. **Обновление приложения**: При выпуске новой версии потребуется перезагрузка для обновления Service Worker

---

## 📞 Контакты для вопросов

При возникновении вопросов по реализации обращаться к:
- Документация IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- Документация Firebase Offline: https://firebase.google.com/docs/firestore/manage-data/enable-offline
- Документация Workbox: https://developers.google.com/web/tools/workbox

---

**Дата создания ТЗ**: 2025-01-XX
**Версия**: 1.0
**Статус**: Готово к реализации
