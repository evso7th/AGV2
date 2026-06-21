# Стандарт «Имперских логов» AuraGroove (v1.0)

Этот документ является эталонным описанием системы когнитивного логирования, внедренной в `ambient.worker.ts`. Лог предназначен для обеспечения полной прозрачности работы музыкального интеллекта и ансамбля.

---

## 1. Образец лога (Эталон)

```text
[11:20:53] [Bar 130] [The Final Climax] [DNA: Eric Clapton-Wonderful Tonight] (Mut: retrograde) T:0.83 B:0.24 Axioms: [MEL: Wonderful_Tonight__...sz7ped] [BASS: Sibling DNA] [ACC: Wonderful_Tonight...m1qhzi] [DRUM: Imperial Pulse] [HAR: Derivative Harmony] [PNO: Wonderful_Tonight...sz7ped]
  ↳ Narrative: Blues IMPROVISATION: Eric Clapton-Wonderful Tonight [Status: PLAYING]
  | Timbres: [MEL: blackAcoustic] [BASS: bass_jazz_warm] [ACC: organ_soft_jazz] [HAR: violin] [PNO: ep_rhodes_warm]
```

---

## 2. Анатомия лога: Источники данных

### Строка 1: Техническая и Генетическая сводка
*   **`[HH:MM:SS]`**: Системное время. Берется из функции `getTimestamp()` в воркере.
*   **`[Bar N]`**: Текущий такт сессии. Источник: переменная `this.barCount` в `Scheduler.tick()`.
*   **`[Section Name]`**: Название части Блюпринта. Источник: `payload.navInfo.currentPart.name`.
*   **`[DNA: Track Name]`**: Имя трека-донора. Источник: `payload.trackName` (формируется в `AmbientBrain` или `BluesBrain`).
*   **`(Mut: Type)`**: Активная мутация такта. Источник: `payload.mutationType`.
*   **`T:0.XX`**: Текущий уровень Напряжения. Источник: `payload.tension` (из `SuiteDNA.tensionMap`).
*   **`B:0.XX`**: Оценка красоты/резонанса. Источник: `payload.beautyScore` (результат работы Матрицы Резонанса).
*   **`Axioms: [...]`**: Карта активных компонентов. Источник: объект `payload.activeAxioms`. Содержит ID аксиомы из Firestore или описание генеративного алгоритма для каждого из 6 каналов.

### Строка 2: Нарративный слой
*   **`↳ Narrative`**: Описание «души» такта. Источник: поле `payload.narrative` (формируется Мозгом жанра на основе данных Наследия).

### Строка 3: Тембральный слой
*   **`| Timbres`**: Список инструментов. Источник: объект `payload.instrumentHints`. Показывает, какие именно пресеты выбраны для исполнения партий.

---

## 3. Сборка лога (Алгоритм)

Лог собирается внутри метода `Scheduler.tick()` в файле `src/app/ambient.worker.ts` перед отправкой сообщения `SCORE_READY`. 

**Используемая стилизация:**
*   Первая и третья строки: `%c` с цветом `#888` (серый).
*   Вторая строка (Narrative): `%c` с цветом `#c084fc` (фиолетовый), чтобы выделить музыкальный смысл.

---

## 4. Протокол Восстановления (Recovery)

Если код логирования в `src/app/ambient.worker.ts` (район строки 257) был поврежден или утрачен, его необходимо восстановить следующим блоком:

```typescript
// #ЗАЧЕМ: ПЛАН №1227. Полное логирование всех 6 каналов ансамбля.
const sectionName = payload.navInfo?.currentPart.name || 'Unknown';
const ax = payload.activeAxioms || {};
const hints = payload.instrumentHints || {};
const track = payload.trackName || 'Generative';
const t = payload.tension.toFixed(2);
const b = (payload.beautyScore || 0.5).toFixed(2);
const mut = payload.mutationType || 'none';

console.log(
    `%c${getTimestamp()} [Bar ${this.barCount}] [${sectionName}] [DNA: ${track}] (Mut: ${mut}) T:${t} B:${b} Axioms: [MEL: ${ax.melody || 'none'}] [BASS: ${ax.bass || 'none'}] [ACC: ${ax.accompaniment || 'none'}] [DRUM: ${ax.drums || 'none'}] [HAR: ${ax.harmony || 'none'}] [PNO: ${ax.piano || 'none'}]\n` +
    `%c  ↳ Narrative: ${payload.narrative || 'Algorithm'}\n` +
    `%c  | Timbres: [MEL: ${hints.melody || 'none'}] [BASS: ${hints.bass || 'none'}] [ACC: ${hints.accompaniment || 'none'}] [HAR: ${hints.harmony || 'none'}] [PNO: ${hints.pianoAccompaniment || 'none'}]`,
    'color: #888;',
    'color: #c084fc;', 
    'color: #888;'
);
```

---
*Статус стандарта: v1.0 — Imperial Standard. Утверждено.*
