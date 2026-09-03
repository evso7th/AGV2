--- GUITAR_TIMBRE_IMPROVEMENTS.md (原始)


+++ GUITAR_TIMBRE_IMPROVEMENTS.md (修改后)
# АНАЛИЗ И РЕКОМЕНДАЦИИ: Улучшение гитарных тембров AuraGroove V2

## Текущее состояние (AS-IS)

### 1. Архитектура гитарных инструментов

Проект использует **гибридный подход**:
- **Сэмплеры** (реалистичные инструменты): `TelecasterGuitarSampler`, `BlackGuitarSampler`, `CS80GuitarSampler`
- **Синтезаторы** (субтрактивный синтез): `buildGuitarEngine()` в `instrument-factory.ts`
- **Пресеты**: `synth-presets.ts` (`electricGuitar`, `acousticGuitar`)

### 2. Выявленные проблемы

#### A. Проблемы сэмплеров
| Проблема | Файл | Описание |
|----------|------|----------|
| **Отсутствие артикуляций** | `telecaster-guitar-sampler.ts:137-158` | Один тип атаки для всех нот (22мс линейная атака). Нет hammer-on, pull-off, slide, bend |
| **Примитивный velocity layer** | `black-guitar-sampler.ts:189-203` | Только 3 слоя (p/mf/f). Нет random round-robin для избежания "machine gun effect" |
| **Отсутствие/release tails** | `telecaster-guitar-sampler.ts:156` | Резкий fade-out за 15 сек вместо естественного затухания струн |
| **Одноуровневый preamp** | `telecaster-guitar-sampler.ts:55` | Фиксированный gain 0.30. Нет эмуляции гитарного усилителя |
| **Нет резонанса деки** | Оба файла | Отсутствует моделирование резонанса корпуса акустической гитары |

#### B. Проблемы синтезатора гитары
| Проблема | Файл | Описание |
|----------|------|----------|
| **Упрощённый осциллятор** | `instrument-factory.ts:514` | Один pulse wave с шириной 0.45. Реальная гитара имеет сложную форму волны с множеством гармоник |
| **Отсутствие noise attack** | `instrument-factory.ts:508-527` | Нет звука медиатора/пальца в начале ноты (pick noise, finger squeak) |
| **Примитивный cabinet filter** | `instrument-factory.ts:487-489` | Простой LPF на 2100 Гц. Нет эмуляции гитарного кабинета с ИК-ответом |
| **Отсутствие double-tracking** | `instrument-factory.ts:466-538` | Реальные гитарные треки всегда даблятся. Здесь один моно-голос |
| **Слабый phaser/delay** | `instrument-factory.ts:482-484` | Стандартные эффекты без эмуляции гитарных педалей (overdrive, compression, spring reverb) |

#### C. Проблемы пресетов
```typescript
// synth-presets.ts:195-208
electricGuitar: {
  layers: [
    { type: 'sawtooth', detune: 0, octave: 0, gain: 1.0 },  // ❌ Слишком яркий
    { type: 'square', detune: 3, octave: 0, gain: 0.6 },    // ❌ Квадратная волна не характерна для гитары
  ],
  adsr: { attack: 0.02, decay: 0.8, sustain: 0.2, release: 1.0 }, // ❌ Sustain 0.2 слишком низкий
  filter: { type: 'bandpass', cutoff: 1500, q: 3.5 },      // ❌ Узкий диапазон
  effects: { distortion: 0.6, ... }                         // ❌ Цифровая дисторшн вместо ламповой
}
```

---

## План улучшений (TO-BE)

### Уровень 1: Быстрые улучшения (1-2 часа)

#### 1.1. Добавить pick noise к сэмплерам
**Файл:** `telecaster-guitar-sampler.ts`, `black-guitar-sampler.ts`

```typescript
// Добавить в playSample() перед основной нотой
private playPickNoise(startTime: number, velocity: number) {
    const noiseBuffer = this.createNoiseBuffer(0.03); // 30мс белый шум
    const source = this.audioContext.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(velocity * 0.15, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03);

    source.connect(filter).connect(gain).connect(this.preamp);
    source.start(startTime);
}

private createNoiseBuffer(duration: number): AudioBuffer {
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}
```

#### 1.2. Улучшить ADSR для естественного затухания
**Файл:** `telecaster-guitar-sampler.ts:148-158`

```typescript
// ЗАМЕНИТЬ текущий код на:
const naturalDecay = Math.min(2.0 + (1.0 - velocity), 4.0); // Чем тише, тем длиннее затухание
gainNode.gain.setValueAtTime(0, startTime);
gainNode.gain.linearRampToValueAtTime(velocity, startTime + 0.022);
gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + naturalDecay);

// Удалить setTargetAtTime с фиксированными 15 секундами
```

#### 1.3. Обновить пресет electricGuitar
**Файл:** `synth-presets.ts:195-208`

```typescript
electricGuitar: {
  layers: [
    { type: 'triangle', detune: 0, octave: 0, gain: 0.7 },   // Мягкая основа
    { type: 'sawtooth', detune: -3, octave: 0, gain: 0.3 },  // Добавление гармоник
    { type: 'sine', detune: 0, octave: 1, gain: 0.15 },      // Воздушность
  ],
  adsr: {
    attack: 0.015,     // Чуть быстрее для атаки медиатора
    decay: 0.4,        // Быстрый спад до sustain
    sustain: 0.65,     // Выше для длительных нот
    release: 0.8       // Естественное затухание
  },
  filter: {
    type: 'lowpass',   // LPF вместо BPF для более полного звука
    cutoff: 3200,      // Выше для яркости
    q: 1.8
  },
  lfo: {
    shape: 'sine',
    rate: 5.5,         // Вибрато как у гитариста
    amount: 12,        // ±12 центов
    target: 'pitch'
  },
  effects: {
    distortion: 0.25,  // Мягкая сатурация вместо жёсткой
    chorus: {
      rate: 0.9,       // Медленный глубокий хорус
      depth: 0.007,
      mix: 0.35
    },
    delay: {
      time: 0.375,     // 3/16 note delay
      feedback: 0.35,
      mix: 0.28
    },
  },
}
```

---

### Уровень 2: Средние улучшения (4-6 часов)

#### 2.1. Реализовать Round-Robin для сэмплеров
**Файл:** `black-guitar-sampler.ts:200-203`

```typescript
// ДОБАВИТЬ свойство класса:
private rrIndex = new Map<number, number>(); // Хранит текущий индекс для каждой ноты

// ЗАМЕНИТЬ выбор сэмпла:
const pool = layers[layerKey].length > 0 ? layers[layerKey] : (layers.mf.length > 0 ? layers.mf : layers.f);
if (pool.length === 0) return { buffer: null, sampleMidi: closestMidi, name: 'none' };

// Round-robin выбор
const currentIndex = this.rrIndex.get(closestMidi) || 0;
const nextIndex = (currentIndex + 1) % pool.length;
this.rrIndex.set(closestMidi, nextIndex);

const namedBuf = pool[nextIndex]; // Вместо Math.random()
```

#### 2.2. Добавить эмуляцию гитарного усилителя
**Файл:** `telecaster-guitar-sampler.ts:48-57`

```typescript
// ЗАМЕНИТЬ простой preamp на цепочку эффектов:
private preamp: GainNode;
private ampSim: WaveShaperNode;
private cabSim: BiquadFilterNode;
private springReverb: ConvolverNode;

constructor(...) {
    // ...
    this.preamp = this.audioContext.createGain();
    this.preamp.gain.value = 0.25;

    this.ampSim = this.audioContext.createWaveShaper();
    this.ampSim.curve = this.makeAmpCurve(0.6); // Ламповая сатурация
    this.ampSim.oversample = '4x';

    this.cabSim = this.audioContext.createBiquadFilter();
    this.cabSim.type = 'lowpass';
    this.cabSim.frequency.value = 4500; // Характеристика гитарного динамика
    this.cabSim.Q.value = 0.7;

    // Подключение: preamp → ampSim → cabSim → destination
    this.preamp.connect(this.ampSim).connect(this.cabSim).connect(this.destination);
}

private makeAmpCurve(amount: number): Float32Array {
    const n = 16384;
    const curve = new Float32Array(n);
    const k = amount * 100;
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        // Кривая лампового усилителя с мягкой сатурацией
        curve[i] = (1 + k) * x / (1 + k * Math.abs(x)) + (x * 0.1);
    }
    return curve;
}
```

#### 2.3. Double-tracking для синтезатора
**Файл:** `instrument-factory.ts:508-527`

```typescript
// В noteOn() создать ДВА осциллятора с небольшим расстройкой:
const osc1 = ctx.createOscillator();
osc1.setPeriodicWave(getPulseWave(oscP.width || 0.45));
osc1.frequency.setValueAtTime(f, when);
osc1.detune.value = -8; // -8 центов

const osc2 = ctx.createOscillator();
osc2.setPeriodicWave(getPulseWave(oscP.width || 0.45));
osc2.frequency.setValueAtTime(f, when);
osc2.detune.value = 7; // +7 центов (асимметрично для естественности)

// Смешать оба через отдельные гейны:
const g1 = ctx.createGain(); g1.gain.value = 0.85;
const g2 = ctx.createGain(); g2.gain.value = 0.75;

osc1.connect(g1).connect(voiceGain);
osc2.connect(g2).connect(voiceGain);
osc1.start(when);
osc2.start(when + 0.003); // Задержка 3мс для эффекта "ширины"
```

---

### Уровень 3: Продвинутые улучшения (8-12 часов)

#### 3.1. Добавить техники игры (articulations)
**Файл:** `telecaster-guitar-sampler.ts`, `black-guitar-sampler.ts`

```typescript
// Расширить интерфейс Note:
interface Note {
    midi: number;
    velocity: number;
    technique?: 'hammer_on' | 'pull_off' | 'slide_up' | 'slide_down' | 'bend' | 'harmonic' | 'palm_mute';
    params?: {
        bendAmount?: number; // Для bend: количество полутонов
        slideDuration?: number; // Для slide: длительность в секундах
    };
}

// Реализация hammer-on/pull-off:
private playArticulation(note: Note, startTime: number) {
    if (note.technique === 'hammer_on') {
        // Более мягкая атака, меньше шума медиатора
        this.playPickNoise(startTime, note.velocity * 0.3);
        // ... остальная логика
    } else if (note.technique === 'slide_up') {
        // Pitch ramp от предыдущей ноты к текущей
        const prevMidi = note.params?.prevMidi || note.midi - 2;
        const slideDuration = note.params?.slideDuration || 0.15;

        source.playbackRate.setValueAtTime(
            Math.pow(2, (prevMidi - sampleMidi) / 12),
            startTime
        );
        source.playbackRate.exponentialRampToValueAtTime(
            Math.pow(2, (note.midi - sampleMidi) / 12),
            startTime + slideDuration
        );
    }
    // ... остальные техники
}
```

#### 3.2. Импульсные ответы (IR) для кабинета
**Файл:** Создать новый файл `guitar-cabinet-ir.ts`

```typescript
// Использовать готовые IR гитарных кабинетов
const CABINET_IRS = {
    'fender_deluxe': '/assets/ir/cab_fender_deluxe_12inch.ogg',
    'marshall_4x12': '/assets/ir/cab_marshall_4x12_vintage.ogg',
    'vox_ac30': '/assets/ir/cab_vox_ac30_top_boost.ogg',
};

// В instrument-factory.ts заменить cabinetFilter на ConvolverNode:
async function loadCabinetIR(ctx: AudioContext, irName: string): Promise<AudioBuffer | null> {
    const url = CABINET_IRS[irName as keyof typeof CABINET_IRS];
    if (!url) return null;

    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return await ctx.decodeAudioData(buf);
}

// Использование:
const cabIR = await loadCabinetIR(ctx, 'fender_deluxe');
const cabSim = ctx.createConvolver();
cabSim.buffer = cabIR;
```

#### 3.3. Моделирование струнного резонанса (sympathetic resonance)
**Файл:** Новый класс `GuitarResonanceEngine.ts`

```typescript
/**
 * Симулирует резонанс открытых струн при игре аккордов
 * Как в реальных гитарах: когда играешь ноту, другие струны слегка вибрируют
 */
export class GuitarResonanceEngine {
    private resonators: Map<number, { freq: number; gain: GainNode; osc: OscillatorNode }> = new Map();
    private ctx: AudioContext;
    private output: AudioNode;

    constructor(ctx: AudioContext, output: AudioNode) {
        this.ctx = ctx;
        this.output = output;

        // Открытые струны стандартного строя EADGBE
        const openStrings = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
        openStrings.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const gain = ctx.createGain();
            gain.gain.value = 0;

            osc.connect(gain).connect(output);
            osc.start();

            this.resonators.set(idx, { freq, gain, osc });
        });
    }

    public triggerResonance(playedMidi: number, velocity: number) {
        const playedFreq = midiToHz(playedMidi);

        this.resonators.forEach(({ freq, gain }) => {
            // Проверка на гармоническую связь (октавы, квинты, терции)
            const ratio = playedFreq / freq;
            const isHarmonic = [0.5, 1, 2, 4].some(h => Math.abs(ratio - h) < 0.05) ||
                              [0.66, 1.5].some(h => Math.abs(ratio - h) < 0.05); // Квинта

            if (isHarmonic && freq !== playedFreq) {
                // Запуск резонанса с плавной атакой
                const resonanceLevel = velocity * 0.08; // 8% от громкости основной ноты
                gain.gain.cancelScheduledValues(this.ctx.currentTime);
                gain.gain.setValueAtTime(0, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(resonanceLevel, this.ctx.currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
            }
        });
    }
}
```

---

## Сравнение результатов

| Параметр | До улучшений | После Уровня 1 | После Уровня 2 | После Уровня 3 |
|----------|--------------|----------------|----------------|----------------|
| **Атака** | Плоская, синтетическая | + Pick noise | + Amp saturation | + Articulations |
| **Затухание** | Линейное, неестественное | Экспоненциальное | С учётом velocity | + Sympathetic resonance |
| **Тембр** | Один осциллятор | — | Double-tracking | + Cabinet IR |
| **Динамика** | 1 слой velocity | — | Round-robin RR | + Техники игры |
| **Пространство** | Сухой звук | — | Chorus/Delay | + Spring reverb |
| **Реализм** | 3/10 | 5/10 | 7/10 | 9/10 |

---

## Приоритетный план действий

### Неделя 1: Foundation
- [ ] **День 1-2**: Внедрить pick noise и улучшить ADSR (Уровень 1.1, 1.2)
- [ ] **День 3**: Обновить пресет electricGuitar (Уровень 1.3)
- [ ] **День 4-5**: Round-robin для BlackGuitar (Уровень 2.1)

### Неделя 2: Character
- [ ] **День 1-3**: Эмуляция усилителя (Уровень 2.2)
- [ ] **День 4-5**: Double-tracking для синтезатора (Уровень 2.3)

### Неделя 3: Professional
- [ ] **День 1-3**: Артикуляции (hammer-on, slide, bend) (Уровень 3.1)
- [ ] **День 4-5**: Cabinet IR и резонанс (Уровень 3.2, 3.3)

---

## Технические требования к ресурсам

### Необходимые сэмплы (приоритет):
1. **Pick noises**: 5 вариантов (разная сила удара)
2. **Finger squeaks**: 3 варианта для слайдов
3. **Harmonics**: натуральные флажолеты на 5, 7, 12 ладах

### Необходимые IR (импульсные ответы):
1. Fender Deluxe Reverb (clean)
2. Marshall Plexi 4x12 (rock)
3. Vox AC30 (chime)

### Рекомендуемые плагины для записи:
- **Neural DSP Archetype** (для референсов)
- **Two Notes Torpedo** (для IR кабинетов)
- **Soundtoys Decapitator** (для сатурации)

---

## Ожидаемый результат

После внедрения всех улучшений гитарные тембры AuraGroove V2 будут звучать:
- **Аутентично**: Узнаваемый характер Telecaster и акустической гитары
- **Живо**: Естественная динамика и вариативность исполнения
- **Профессионально**: Готовый микс с правильным частотным балансом
- **Выразительно**: Возможность передачи эмоций через техники игры

**Целевой показатель**: 90% слушателей не смогут отличить сгенерированные гитарные партии от записанных живым гитаристом в слепом тесте.