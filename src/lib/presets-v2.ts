

// V2 Presets — орган, синты/пэды/терменвокс, меллотрон (струн/хор/флейта/акустика),
// гитары (гилмор: shineOn/muffLead). Все пресеты совместимы с buildMultiInstrument().

export const V2_PRESETS = {
  // ───────────────────────── ORGAN ─────────────────────────
  organ: {
    type: 'organ',
    drawbars: [8, 8, 4, 2, 0, 0, 0, 1, 0], // Классический "церковный"
    vibratoRate: 5.8, vibratoDepth: 0.002,
    leslie: { mode: 'slow', slow: 0.5, fast: 6.0, accel: 0.7 },
    lpf: 4500, hpf: 80, chorusMix: 0.3, reverbMix: 0.25,
    // #ПЛАН316: Добавлен саб-бас слой для "веса"
    osc: [ { type: 'sine', detune: 0, octave: -1, gain: 0.4 } ]
  },

  organ_soft_jazz: {
    type: 'organ',
    // #ПЛАН316: Изменены drawbars для уникального джазового тембра
    drawbars: [8, 4, 2, 0, 0, 0, 0, 0, 0], 
    vibratoRate: 5.2, vibratoDepth: 0.002,
    leslie: { mode: 'slow', slow: 0.8, fast: 6.5, accel: 0.5 },
    lpf: 4000, hpf: 120, chorusMix: 0.2, reverbMix: 0.15,
    // #ПЛАН316: Добавлен саб-бас слой
    osc: [ { type: 'sine', detune: 0, octave: -1, gain: 0.5 } ]
  },

  // ───────────────────────── SYNTH (AMBIENT PAD / THEREMIN) ─────────────────────────
  synth: { // Emerald Pad
    type: 'synth',
    osc: [
      { type: 'sawtooth', detune: -4, octave: 0,  gain: 0.5 },
      { type: 'sawtooth', detune: +4, octave: 0,  gain: 0.5 },
      { type: 'sine',     detune: 0, octave: -1, gain: 0.7 } // Sub-bass
    ],
    noise: { on: true, color: 'pink', gain: 0.03 },
    adsr:  { a: 0.8, d: 1.2, s: 0.7, r: 3.0 },
    // #ПЛАН316: Слегка подрезан LPF для мягкости
    lpf:   { cutoff: 1600, q: 1.2, mode: '24dB' }, 
    lfo:   { rate: 0.18, amount: 450, target: 'filter' },
    chorus:{ on: true, rate: 0.2, depth: 0.007, mix: 0.4 },
    delay: { on: true, time: 0.5, fb: 0.3, hc: 4000, mix: 0.2 },
    reverbMix: 0.25
  },
  
  synth_ambient_pad_lush: {
    type: 'synth',
    osc: [
        { type: 'sawtooth', detune: -4, octave: 0,  gain: 0.5 },
        { type: 'sawtooth', detune: +4, octave: 0,  gain: 0.5 },
        { type: 'sine',     detune: 0, octave: -1, gain: 0.7 } // Саб-бас слой
    ],
    noise: { on: true, color: 'pink', gain: 0.03 },
    adsr:  { a: 0.99, d: 2, s: 0.8, r: 4 }, // Пышная огибающая
    lpf:   { cutoff: 1600, q: 1.2, mode: '24dB' }, 
    lfo:   { rate: 0.18, amount: 450, target: 'filter' },
    chorus:{ on: true, rate: 0.2, depth: 0.007, mix: 0.4 },
    delay: { on: true, time: 0.5, fb: 0.3, hc: 4000, mix: 0.2 },
    reverbMix: 0.25
  },
  
  theremin: {
    type: 'synth',
    osc: [
      { type: 'sine', detune: 0, octave: 0, gain: 1.0 },
      { type: 'sine', detune: 2, octave: 1, gain: 0.3 },
    ],
    noise: { on: false },
    // #ПЛАН377: Увеличен release для плавности
    adsr:  { a: 0.4, d: 0.1, s: 0.9, r: 2.8 },
    lpf:   { cutoff: 5000, q: 0.7, mode: '12dB' },
    lfo:   { rate: 5.5, amount: 3, target: 'pitch' },
    chorus:{ on: true, rate: 0.1, depth: 0.002, mix: 0.2 },
    delay: { on: false },
    reverbMix: 0.28
  },

  synth_cave_pad: {
    type: 'synth',
    osc: [
        { type: 'sawtooth', detune: -6, octave: 0,  gain: 0.4 },
        { type: 'sawtooth', detune: +6, octave: 0,  gain: 0.4 },
        { type: 'sawtooth', detune: 0, octave: 1, gain: 0.25 },
        { type: 'sine',     detune: 0, octave: -1, gain: 0.8 },
        { type: 'triangle', detune: 2, octave: -1, gain: 0.5 }
    ],
    noise: { on: true, color: 'brown', gain: 0.04 },
    adsr:  { a: 1.5, d: 2.0, s: 0.8, r: 5.0 },
    lpf:   { cutoff: 1400, q: 1.1, mode: '24dB' },
    lfo:   { rate: 0.1, amount: 5, target: 'pitch' },
    chorus:{ on: true, rate: 0.15, depth: 0.008, mix: 0.6 },
    delay: { on: true, time: 0.52, fb: 0.45, hc: 2500, mix: 0.35 },
    reverbMix: 0.45
  },

  // ───────────────────────── MELLOTRON (переделан в струнный синтезатор) ─────────────────────────
  mellotron: { // Majestic Strings
    type: 'synth',
    osc: [
      { type: 'sawtooth', detune: -5, octave: 0, gain: 0.5 },
      { type: 'sawtooth', detune: 5, octave: 0, gain: 0.5 },
      { type: 'sawtooth', detune: 0, octave: -1, gain: 0.4 } // Body
    ],
    noise: { on: true, color: 'brown', gain: 0.02 },
    adsr:  { a: 0.4, d: 0.8, s: 0.7, r: 1.5 },
    lpf:   { cutoff: 3200, q: 1.5, mode: '24dB' },
    lfo:   { rate: 4.5, amount: 4, target: 'pitch' }, // String vibrato
    chorus:{ on: true, rate: 0.3, depth: 0.008, mix: 0.5 },
    delay: { on: true, time: 0.3, fb: 0.2, hc: 4500, mix: 0.15 },
    reverbMix: 0.35
  },

  mellotron_choir_dark: {
    type: 'mellotron',
    instrument: 'choir',
    attack: 0.08, release: 0.45,
    adsr:  { a: 0.1, d: 0.2, s: 0.9, r: 1.2 },
    wow: { rate: 0.25, depth: 0.0028 },
    flutter: { rate: 5.5, depth: 0.0008 },
    noise: { level: -34 },
    lpf: 8500, hpf: 140,
    reverbMix: 0.26
  },

  mellotron_flute_intimate: {
    type: 'synth',
    osc: [
      { type: 'sine', detune: 0, octave: 0, gain: 0.9 },
      { type: 'triangle', detune: 2, octave: 1, gain: 0.2 },
      { type: 'noise', gain: 0.07, detune: 0, octave: 0 } // #ПЛАН382: "Дыхание"
    ],
    adsr: { a: 0.05, d: 0.2, s: 0.8, r: 0.3 },
    lpf: { cutoff: 7500, q: 0.8, mode: '12dB' },
    lfo: { rate: 4.8, amount: 2.5, target: 'pitch' },
    chorus: { on: false },
    delay: { on: true, time: 0.15, fb: 0.1, hc: 5000, mix: 0.1 },
    reverbMix: 0.15
  },

  // --- НОВЫЕ СИНТЕТИЧЕСКИЕ ГИТАРЫ (ПЛАН 390) ---

  acousticGuitar: { // Folk Acoustic
    type: 'synth',
    osc: [
      { type: 'triangle', detune: -2, octave: 0, gain: 1.0 }, // Основной тон
      { type: 'sine', detune: 2, octave: 1, gain: 0.3 },     // Верхние обертоны
      { type: 'sine', detune: 0, octave: -1, gain: 0.2 },    // Резонанс корпуса
    ],
    noise: { on: true, color: 'white', gain: 0.15 },         // "Щипок"
    adsr:  { a: 0.001, d: 0.3, s: 0.05, r: 0.3 },             // Короткая "щипковая" огибающая
    lpf:   { cutoff: 2500, q: 3.5, mode: '24dB' },            // Фильтр для "деревянного" тембра
    lfo:   { rate: 0, amount: 0, target: 'pitch' },
    chorus:{ on: true, rate: 0.1, depth: 0.001, mix: 0.1 },   // Эффект "комнаты"
    delay: { on: false },
    reverbMix: 0.15
  },

  guitar_shineOn: { // Shine On Lead
    type: 'synth',
    osc: [
      { type: 'sawtooth', detune: -3, octave: 0, gain: 0.6 },
      { type: 'sawtooth', detune: 3, octave: 0, gain: 0.6 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.4 },
    ],
    noise: { on: false },
    adsr:  { a: 0.1, d: 0.8, s: 0.7, r: 2.5 }, // Певучий сустейн
    lpf:   { cutoff: 2800, q: 2.0, mode: '24dB' },
    lfo:   { rate: 0.15, amount: 400, target: 'filter' }, // Медленное движение фильтра
    chorus:{ on: true, rate: 0.12, depth: 0.006, mix: 0.4 }, // Фейзер-подобный хорус
    delay: { on: true, time: 0.48, fb: 0.35, hc: 3500, mix: 0.28 }, // Доттед-дилэй
    reverbMix: 0.25
  },
  
  electricGuitar: { // Muff Lead
    type: 'synth',
    osc: [
      { type: 'sawtooth', detune: -8, octave: 0, gain: 0.9 }, // Жирный пилящий звук
      { type: 'sawtooth', detune: 8, octave: 0, gain: 0.9 },
      { type: 'square', detune: 0, octave: -1, gain: 0.7 }, // "Тело" и вес
    ],
    noise: { on: true, color: 'brown', gain: 0.05 },
    adsr:  { a: 0.02, d: 1.0, s: 0.8, r: 1.5 }, // Мощная атака и долгий сустейн
    lpf:   { cutoff: 1500, q: 3.0, mode: '24dB' }, // Срезаем верха для "мутного" звука
    lfo:   { rate: 0, amount: 0, target: 'filter' },
    // Главное - дисторшн
    distortion: 0.8, 
    chorus:{ on: true, rate: 0.1, depth: 0.002, mix: 0.2 },
    delay: { on: false },
    reverbMix: 0.15
  }
};
