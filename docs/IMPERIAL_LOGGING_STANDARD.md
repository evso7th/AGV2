
# Стандарт «Имперских логов» AuraGroove (v1.1 — Hash Density)

Этот документ является эталонным описанием системы когнитивного логирования. Версия 1.1 переводит систему на использование коротких хэшей для максимальной читаемости.

---

## 1. Образец лога (Эталон V1.1)

```text
[11:20:53] [Bar 130] [The Final Climax] [DNA: tce8xn] (Mut: retrograde) T:0.83 B:0.24 Axioms: [MEL: tce8xn] [BASS: Sibling DNA] [ACC: m1qhzi] [DRUM: Imperial Pulse] [HAR: Derivative Harmony] [PNO: sz7ped]
  ↳ Narrative: Blues IMPROVISATION: tce8xn [Status: PLAYING]
  | Timbres: [MEL: blackAcoustic] [BASS: bass_jazz_warm] [ACC: organ_soft_jazz] [HAR: violin] [PNO: ep_rhodes_warm]
```

---

## 2. Правила именования (The Hash Rule)

1.  **DNA Identifier**: Вместо полного имени трека в заголовке `[DNA: ...]` теперь используется хэш (последний сегмент ID) ведущей аксиомы (обычно Melody).
2.  **Axiom Channels**: 
    *   `MEL`, `ACC`, `PNO` — выводят только хэш аксиомы.
    *   `BASS`, `DRUM`, `HAR` — выводят статус (например, "Sibling DNA" или "Algorithm").
3.  **Narrative Substitution**: Все вхождения полного названия трека в поле `Narrative` должны быть принудительно заменены на хэш.

---

## 3. Сборка лога (Алгоритм)

Лог собирается внутри метода `Scheduler.tick()` в файле `src/app/ambient.worker.ts`.

**Функция извлечения хэша:**
```typescript
const getHash = (id: string) => id?.split('_').pop() || 'none';
```

**Применение:**
```typescript
const trackHash = ax.melody ? getHash(ax.melody) : 'none';
const narrativeText = (payload.narrative || 'Algorithm').split(track).join(trackHash);
```

---

## 4. Протокол Восстановления (Recovery)

Если код логирования утрачен, восстановите его следующим блоком:

```typescript
const getHash = (id: string) => id?.split('_').pop() || 'none';
const trackHash = ax.melody ? getHash(ax.melody) : 'none';
const narrativeText = (payload.narrative || 'Algorithm').split(track).join(trackHash);

console.log(
    `%c${getTimestamp()} [Bar ${this.barCount}] [${sectionName}] [DNA: ${trackHash}] (Mut: ${mut}) T:${t} B:${b} Axioms: [MEL: ${getHash(ax.melody)}] [BASS: ${ax.bass || 'none'}] [ACC: ${getHash(ax.accompaniment)}] [DRUM: ${ax.drums || 'none'}] [HAR: ${ax.harmony || 'none'}] [PNO: ${getHash(ax.piano)}]\n` +
    `%c  ↳ Narrative: ${narrativeText}\n` +
    `%c  | Timbres: [MEL: ${hints.melody || 'none'}] [BASS: ${hints.bass || 'none'}] [ACC: ${hints.accompaniment || 'none'}] [HAR: ${hints.harmony || 'none'}] [PNO: ${hints.pianoAccompaniment || 'none'}]`,
    'color: #888;',
    'color: #c084fc;', 
    'color: #888;'
);
```

---
*Статус стандарта: v1.1 — Hash Density. Утверждено.*
