
// src/lib/assets/blues-melody-riffs.ts

/**
 * #ЗАЧЕМ: Этот файл содержит оцифрованную библиотеку блюзовых мелодических фраз,
 *          предоставленную пользователем. Он служит "нотной грамотой" для
 *          FractalMusicEngine при генерации блюзовых соло.
 * #ЧТО: Экспортирует массив BLUES_MELODY_RIFFS, где каждый элемент — это
 *       полное описание блюзовой мелодии, включая фразы для каждого аккорда
 *       прогрессии и правила их применения.
 * #СВЯЗИ: Используется в `fractal-music-engine.ts` для генерации мелодий в
 *          жанре 'blues'.
 */

export type BluesRiffDegree = 'R' | '2' | 'b2' | 'b3' | '3' | '4' | '#4' | 'b5' | '5' | 'b6' | '6' | 'b7' | '9' | '11' | 'R+8';

export type BluesRiffEvent = {
  t: number; // tick (0-11 for 12/8 time)
  d: number; // duration in ticks
  deg: BluesRiffDegree;
  vel?: number;
};

export type BluesMelodyPhrase = BluesRiffEvent[];

export type BluesMelody = {
  id: string;
  moods: ('joyful' | 'neutral' | 'enthusiastic' | 'dreamy' | 'calm' | 'melancholic' | 'gloomy' | 'dark')[];
  type: 'major' | 'minor';
  progression: ('I' | 'IV' | 'V' | 'i' | 'iv' | 'bVI')[]; // Simplified for now
  phraseI: BluesMelodyPhrase;
  phraseIV: BluesMelodyPhrase;
  phraseV: BluesMelodyPhrase;
  phraseTurnaround: BluesMelodyPhrase;
};

export const BLUES_MELODY_RIFFS: BluesMelody[] = [
  // --- MAJOR BLUES MELODIES ---
  {
    id: 'Joyful-01',
    moods: ['joyful'],
    type: 'major',
    progression: [], // Placeholder
    phraseI: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:6,deg:'R'}],
    phraseIV: [{t:0,d:3,deg:'3'},{t:3,d:3,deg:'5'},{t:6,d:6,deg:'R'}],
    phraseV: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'3'},{t:9,d:3,deg:'R'}],
    phraseTurnaround: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'6'},{t:9,d:3,deg:'#4'}]
  },
  {
    id: 'Joyful-02',
    moods: ['joyful'],
    type: 'major',
    progression: [],
    phraseI: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8'}],
    phraseIV:[{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'9'}],
    phraseV: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'5'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround: [{t:0,d:3,deg:'2'},{t:3,d:3,deg:'b3'},{t:6,d:3,deg:'3'},{t:9,d:3,deg:'4'}]
  },
  {
    id: 'Joyful-03',
    moods: ['joyful'],
    type: 'major',
    progression: [],
    phraseI: [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'4'},{t:8,d:4,deg:'5'}],
    phraseIV:[{t:0,d:4,deg:'R'},{t:4,d:4,deg:'5'},{t:8,d:4,deg:'6'}],
    phraseV: [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'b7'},{t:8,d:4,deg:'5'}],
    phraseTurnaround: [{t:0,d:2,deg:'2'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'4'},{t:8,d:2,deg:'#4'},{t:10,d:2,deg:'5'}]
  },
  {
    id: 'Neutral-01',
    moods: ['neutral'],
    type: 'major',
    progression: [],
    phraseI: [{t:0,d:3,deg:'b3'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'5'}],
    phraseIV:[{t:0,d:3,deg:'b3'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'R'}],
    phraseV: [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'R'}],
    phraseTurnaround: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:6,deg:'R'}]
  },
  {
    id: 'Neutral-02',
    moods: ['neutral'],
    type: 'major',
    progression: [],
    phraseI: [{t:0,d:12,deg:'R'}],
    phraseIV:[{t:0,d:6,deg:'R'},{t:6,d:6,deg:'5'}],
    phraseV: [{t:0,d:4,deg:'R'},{t:4,d:8,deg:'b7'}],
    phraseTurnaround: [{t:0,d:4,deg:'6'},{t:4,d:4,deg:'5'},{t:8,d:4,deg:'R'}]
  },
  {
    id: 'Dreamy-01',
    moods: ['dreamy'],
    type: 'major',
    progression: [],
    phraseI: [{t:0,d:4,deg:'9'},{t:4,d:8,deg:'R'}],
    phraseIV:[{t:0,d:6,deg:'6'},{t:6,d:6,deg:'5'}],
    phraseV: [{t:0,d:3,deg:'9'},{t:3,d:9,deg:'5'}],
    phraseTurnaround: [{t:0,d:6,deg:'2'},{t:6,d:6,deg:'R'}]
  },
  {
    id: 'Dreamy-02',
    moods: ['dreamy'],
    type: 'major',
    progression: [],
    phraseI: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8'}],
    phraseIV:[{t:0,d:3,deg:'3'},{t:3,d:3,deg:'5'},{t:6,d:6,deg:'6'}],
    phraseV: [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'R'}],
    phraseTurnaround: [{t:0,d:3,deg:'b3'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'R'}]
  },
  {
    id: 'Calm-01',
    moods: ['calm'],
    type: 'major',
    progression: [],
    phraseI: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'5'}],
    phraseIV:[{t:0,d:6,deg:'R'},{t:6,d:6,deg:'3'}],
    phraseV: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround: [{t:0,d:4,deg:'6'},{t:4,d:4,deg:'5'},{t:8,d:4,deg:'R'}]
  },
  {
    id: 'Enthusiastic-01',
    moods: ['enthusiastic'],
    type: 'major',
    progression: [],
    phraseI: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'6'},{t:6,d:6,deg:'R'}],
    phraseIV:[{t:0,d:3,deg:'5'},{t:3,d:3,deg:'6'},{t:6,d:6,deg:'R'}],
    phraseV: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:6,deg:'3'}],
    phraseTurnaround: [{t:0,d:3,deg:'2'},{t:3,d:3,deg:'b3'},{t:6,d:3,deg:'3'},{t:9,d:3,deg:'4'}]
  },
  {
    id: 'Joyful-04', // Another joyful one
    moods: ['joyful'],
    type: 'major',
    progression: [],
    phraseI: [{t:0,d:3,deg:'b3'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'9'}],
    phraseIV:[{t:0,d:4,deg:'R'},{t:4,d:8,deg:'5'}],
    phraseV: [{t:0,d:4,deg:'R'},{t:4,d:8,deg:'b7'}],
    phraseTurnaround: [{t:0,d:2,deg:'2'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'4'},{t:8,d:2,deg:'#4'},{t:10,d:2,deg:'5'}]
  },

  // --- MINOR BLUES MELODIES ---
  {
    id: 'Melancholic-01',
    moods: ['melancholic'],
    type: 'minor',
    progression: [],
    phraseI:  [{t:0,d:6,deg:'b3'},{t:6,d:6,deg:'11'}],
    phraseIV: [{t:0,d:6,deg:'b3'},{t:6,d:6,deg:'9'}],
    phraseV:  [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b2'},{t:6,d:6,deg:'R'}], // Using b2 for b9 of dominant
    phraseTurnaround:  [{t:0,d:6,deg:'b7'},{t:6,d:6,deg:'R'}]
  },
  {
    id: 'Melancholic-02',
    moods: ['melancholic'],
    type: 'minor',
    progression: [],
    phraseI:  [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'#4'},{t:8,d:4,deg:'5'}],
    phraseIV: [{t:0,d:6,deg:'11'},{t:6,d:6,deg:'9'}],
    phraseV:  [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround:  [{t:0,d:3,deg:'2'},{t:3,d:3,deg:'b2'},{t:6,d:6,deg:'R'}]
  },
  {
    id: 'Gloomy-01',
    moods: ['gloomy'],
    type: 'minor',
    progression: [],
    phraseI:  [{t:0,d:12,deg:'R'}],
    phraseIV: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b3'}],
    phraseV:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround:  [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'b7'},{t:8,d:4,deg:'R'}]
  },
  {
    id: 'Gloomy-02',
    moods: ['gloomy'],
    type: 'minor',
    progression: [],
    phraseI:  [{t:0,d:3,deg:'b3'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'5'}],
    phraseIV: [{t:0,d:3,deg:'4'},{t:3,d:9,deg:'9'}],
    phraseV:  [{t:0,d:3,deg:'5'},{t:3,d:9,deg:'b7'}],
    phraseTurnaround:  [{t:0,d:3,deg:'b3'},{t:3,d:9,deg:'R'}]
  },
  {
    id: 'Dark-01',
    moods: ['dark'],
    type: 'minor',
    progression: [],
    phraseI:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'5'}],
    phraseIV: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'11'}],
    phraseV:  [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b5'},{t:6,d:6,deg:'4'}],
    phraseTurnaround:  [{t:0,d:3,deg:'b3'},{t:3,d:3,deg:'2'},{t:6,d:3,deg:'R'},{t:9,d:3,deg:'b7'}]
  },
  {
    id: 'Dark-02',
    moods: ['dark'],
    type: 'minor',
    progression: [],
    phraseI:  [{t:0,d:12,deg:'b3'}],
    phraseIV: [{t:0,d:12,deg:'11'}],
    phraseV:  [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}]
  },
  {
    id: 'Dreamy-Minor-01',
    moods: ['dreamy'],
    type: 'minor',
    progression: [],
    phraseI:  [{t:0,d:4,deg:'9'},{t:4,d:8,deg:'b3'}],
    phraseIV: [{t:0,d:4,deg:'11'},{t:4,d:8,deg:'9'}],
    phraseV:  [{t:0,d:4,deg:'9'},{t:4,d:8,deg:'5'}],
    phraseTurnaround:  [{t:0,d:6,deg:'2'},{t:6,d:6,deg:'R'}]
  },
  {
    id: 'Melancholic-03',
    moods: ['melancholic'],
    type: 'minor',
    progression: [],
    phraseI:  [{t:0,d:3,deg:'2'},{t:3,d:3,deg:'b3'},{t:6,d:6,deg:'5'}],
    phraseIV: [{t:0,d:3,deg:'2'},{t:3,d:3,deg:'4'},{t:6,d:6,deg:'11'}],
    phraseV:  [{t:0,d:3,deg:'2'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround:  [{t:0,d:3,deg:'b3'},{t:3,d:3,deg:'2'},{t:6,d:6,deg:'R'}]
  },
  {
    id: 'Gloomy-03',
    moods: ['gloomy'],
    type: 'minor',
    progression: [],
    phraseI:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8'}],
    phraseIV: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8'}],
    phraseV:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround:  [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'b7'},{t:8,d:4,deg:'R'}]
  },
  {
    id: 'Dark-03',
    moods: ['dark'],
    type: 'minor',
    progression: [],
    phraseI:  [{t:0,d:6,deg:'b3'},{t:6,d:6,deg:'5'}],
    phraseIV: [{t:0,d:6,deg:'11'},{t:6,d:6,deg:'9'}],
    phraseV:  [{t:0,d:3,deg:'b2'},{t:3,d:3,deg:'R'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround:  [{t:0,d:3,deg:'2'},{t:3,d:3,deg:'b2'},{t:6,d:6,deg:'R'}]
  },
];
