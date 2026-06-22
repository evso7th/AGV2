# ТЗ: Починить Media Session API (системный медиа-виджет)

## Контекст
Приложение генерирует звук через Web Audio API (без `<audio>`-элемента). Системный медиа-виджет (экран блокировки / шторка / трей) **не появляется**, потому что браузер показывает его только при реально играющем `HTMLMediaElement`. Такой элемент создаёт `BroadcastEngine` ([broadcast-engine.ts](../src/lib/broadcast-engine.ts)), но сейчас он стартует только по ручной кнопке Broadcast.

**Цель:** мост должен включаться автоматически при Play. Плюс пофиксить мелкие баги в метаданных.

---

## Задача 1. Автозапуск моста при Play *(главное)*

**Файл:** [audio-engine-context.tsx:216](../src/contexts/audio-engine-context.tsx#L216), функция `handleTogglePlay`.

Сейчас Play играет только через `context.destination` и мост не трогает. Нужно: на Play — поднять мост, на Stop — погасить.

**Было:**
```ts
if (playing) { 
    if (context.state === 'suspended') await context.resume(); 
    setIsPlayingState(true); 
    masterGainNodeRef.current?.gain.setTargetAtTime(calibrationGainsRef.current.master, context.currentTime, 0.05); 
    stopAllSounds(); 
    nextBarTimeRef.current = context.currentTime + 0.5; 
    workerRef.current.postMessage({ command: 'start' }); 
} else { 
    setIsPlayingState(false); 
    masterGainNodeRef.current?.gain.setTargetAtTime(0.0, context.currentTime, 0.01); 
    workerRef.current.postMessage({ command: 'stop' }); 
    stopAllSounds(); 
}
```

**Стало:**
```ts
if (playing) { 
    if (context.state === 'suspended') await context.resume(); 
    setIsPlayingState(true); 
    masterGainNodeRef.current?.gain.setTargetAtTime(calibrationGainsRef.current.master, context.currentTime, 0.05); 
    stopAllSounds(); 
    nextBarTimeRef.current = context.currentTime + 0.5; 
    workerRef.current.postMessage({ command: 'start' }); 

    // Автозапуск media-bridge: даёт браузеру реальный <audio> элемент,
    // без которого системный медиа-виджет не появляется.
    if (broadcastEngineRef.current && !broadcastEngineRef.current.isActive()) {
        speakerGainNodeRef.current?.gain.setTargetAtTime(0.0, context.currentTime, 0.05); // звук идёт через <audio>, динамики глушим
        broadcastEngineRef.current.start();
        setIsBroadcastActive(true);
    }
} else { 
    setIsPlayingState(false); 
    masterGainNodeRef.current?.gain.setTargetAtTime(0.0, context.currentTime, 0.01); 
    workerRef.current.postMessage({ command: 'stop' }); 
    stopAllSounds(); 

    // Гасим мост на стопе
    if (broadcastEngineRef.current?.isActive()) {
        broadcastEngineRef.current.stop();
        speakerGainNodeRef.current?.gain.setTargetAtTime(1.0, context.currentTime, 0.05);
        setIsBroadcastActive(false);
    }
}
```

**Важно:**
- Добавь `setIsBroadcastActive` в массив зависимостей `useCallback` у `handleTogglePlay` (сейчас там только `[stopAllSounds]` → стало `[stopAllSounds]`, т.к. сеттеры из `useState` стабильны и линтер их не требует — но если ESLint ругается, добавь).
- Ручная кнопка Broadcast (`toggleBroadcastCallback`, [:374](../src/contexts/audio-engine-context.tsx#L374)) **остаётся работать как есть** — она просто переключает тот же мост. Конфликта нет, потому что мы проверяем `isActive()` перед start/stop.

**Проверка:** нажать Play → в Chrome открыть `chrome://media-internals` или просто свернуть вкладку: в шторке ОС должен появиться виджет с обложкой и кнопками.

---

## Задача 2. Убрать «мигание» обложки *(баг)*

**Файл:** [use-aura-groove.ts:436](../src/hooks/use-aura-groove.ts#L436), внутри `updateMetadata`.

**Проблема:** heartbeat вызывает `updateMetadata` каждые 2 сек, а обложки получают `?v=${Date.now()}` — каждый раз новый URL. Браузер заново качает 5 картинок каждые 2 секунды → обложка мигает/пропадает, сессия может сбрасываться.

**Было:**
```ts
const version = Date.now(); 
```

**Стало:**
```ts
const version = `${genre}_${mood}`; // меняется только при смене атмосферы, не каждый тик
```

URL станет стабильным между тиками → браузер берёт из кэша, мигание исчезает, а при смене genre/mood кэш всё равно сбросится (что и нужно).

---

## Задача 3. Убрать дубликат обложки *(чистота)*

**Файл:** [use-aura-groove.ts:447](../src/hooks/use-aura-groove.ts#L447).

Удалить последнюю строку массива `artwork` — это дубль 512×512 с относительным URL (без `/` в начале), он лишний:

```ts
{ src: `assets/cover/cover512.jpg?v=${version}`, sizes: '512x512', type: 'image/jpeg' }, // ← УДАЛИТЬ эту строку
```

---

## Задача 4. Не пересоздавать обработчики каждые 2 сек *(secondary, по времени)*

**Файл:** [use-aura-groove.ts:431](../src/hooks/use-aura-groove.ts#L431).

Сейчас весь `useEffect` зависит от `[isPlaying, genre, mood, ...]` → при каждой смене настроения он полностью пересоздаётся (чистит `setInterval`, обнуляет все `setActionHandler`). Это шумно.

Разделить на два эффекта:
- **Эффект A** — `setActionHandler('play'|'pause'|'stop'|'nexttrack'|'previoustrack', ...)`, зависимости `[]` (регистрируем один раз при монтировании, чистим при размонтировании).
- **Эффект B** — `updateMetadata` + `playbackState` + heartbeat, зависимости `[isPlaying, genre, mood]`.

> Если поджимает время — можно отложить, на работу виджета не влияет. Задачи 1–3 обязательны.

---

## Definition of Done
- [ ] При нажатии Play появляется системный медиа-виджет (проверено: Chrome desktop + Android Chrome).
- [ ] Кнопки play/pause/stop/next/prev в виджете управляют генератором.
- [ ] Обложка в виджете **не мигает** при долгом проигрывании.
- [ ] Обложка меняется при смене genre/mood.
- [ ] Stop убирает звук и виджет; повторный Play поднимает заново.
- [ ] Ручная кнопка Broadcast по-прежнему не падает.
