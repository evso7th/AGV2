# Трассировка узлов регулировки громкости гитар (AuraGroove V2)

Этот документ описывает все точки контроля амплитуды сигнала для сэмплерных инструментов (Telecaster, Black Acoustic, Dark Tele, CS80).

---

## 1. Схема прохождения сигнала (Audio Graph)

`[Sample Buffer]`  
      ↓  
`(1) [Note Gain]` (Velocity / ADSR) — *Индивидуально для каждой ноты*  
      ↓  
`(2) [Preamp Gain]` (Timbre Drive) — *Вход в цепь эффектов (Saturation/Overdrive)*  
      ↓  
`[Internal FX]` (HPF, Body, Filter, Distortion)  
      ↓  
`(3) [Output Trim]` (Loudness Sync) — *Нормализация по стандарту GUITAR_LOUDNESS_TRIM_DB*  
      ↓  
`(4) [Channel Gain]` (Mixer: LEAD) — *Узел gainNodes.melody в AudioEngineContext*  
      ↓  
`(5) [Master Gain]` (Mixer: MST) — *Финальный фейдер перед лимитером*  
      ↓  
`[System EQ / Output]`

---

## 2. Детализация узлов

### (1) Note Gain (Per-Note)
*   **Файлы**: `telecaster-guitar-sampler.ts`, `black-guitar-sampler.ts` и др.
*   **Метод**: `playSample()`
*   **Зачем**: Превращает параметр `weight` из FractalEvent в реальное давление ноты. Здесь же отрабатывает ADSR-кривая (атака и релиз).

### (2) Preamp Gain (Engine Preamp)
*   **Файлы**: Конструкторы классов `*Sampler`.
*   **Метод**: `setPreampGain(gain)`
*   **Регуляция**: В `audio-engine-context.tsx` через `SAMPLER_DEFAULTS` * `calibrationGains`.
*   **Влияние**: Если поднять здесь — гитара станет "грязнее" (больше сатурации), но не обязательно громче в итоговом миксе.

### (3) Output Trim (Normalization)
*   **Файлы**: `src/lib/guitar-loudness.ts` (Константы).
*   **Метод**: `setOutputTrim(db)`
*   **Зачем**: Чтобы переключение с тихой акустики на агрессивный Telecaster не выбивало перепонки. Это "хирургическое" выравнивание сэмплов.

### (4) Channel Gain (The Mixer)
*   **Файлы**: `src/contexts/audio-engine-context.tsx`
*   **Метод**: `setVolumeCallback(part, volume)`
*   **Зачем**: Основной инструмент сведения. Регулирует громкость всей группы "LEAD" (все гитары и лид-синты).

### (5) Master Gain (The Master)
*   **Файлы**: `src/contexts/audio-engine-context.tsx`
*   **Зачем**: Глобальная громкость приложения. Узел `masterGainNodeRef`.

---
**Версия документа**: 1.0 (Audit complete).
