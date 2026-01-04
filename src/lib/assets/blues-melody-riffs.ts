
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

import type { BluesMelody } from '@/types/fractal';

export const BLUES_MELODY_RIFFS: BluesMelody[] = [
  // --- MAJOR BLUES MELODIES ---
  {
    id: 'Joyful-01',
    moods: ['joyful', 'epic'],
    type: 'major',
    tags: ['shuffle', 'uptempo'],
    progression: [], // Placeholder
    phraseI: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:6,deg:'R'}],
    phraseIV: [{t:0,d:3,deg:'3'},{t:3,d:3,deg:'5'},{t:6,d:6,deg:'R'}],
    phraseV: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'3'},{t:9,d:3,deg:'R'}],
    phraseTurnaround: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'6'},{t:9,d:3,deg:'#4'}]
  },
  {
    id: 'Joyful-02',
    moods: ['joyful', 'enthusiastic'],
    type: 'major',
    tags: ['shuffle', 'boogie'],
    progression: [],
    phraseI: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8'}],
    phraseIV:[{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'9'}],
    phraseV: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'5'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround: [{t:0,d:3,deg:'2'},{t:3,d:3,deg:'b3'},{t:6,d:3,deg:'3'},{t:9,d:3,deg:'4'}]
  },
  {
    id: 'Joyful-03',
    moods: ['joyful', 'epic'],
    type: 'major',
    tags: ['shuffle', 'mid-tempo'],
    progression: [],
    phraseI: [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'4'},{t:8,d:4,deg:'5'}],
    phraseIV:[{t:0,d:4,deg:'R'},{t:4,d:4,deg:'5'},{t:8,d:4,deg:'6'}],
    phraseV: [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'b7'},{t:8,d:4,deg:'5'}],
    phraseTurnaround: [{t:0,d:2,deg:'2'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'4'},{t:8,d:2,deg:'#4'},{t:10,d:2,deg:'5'}]
  },
  {
    id: 'Neutral-01',
    moods: ['contemplative', 'calm'],
    type: 'major',
    tags: ['shuffle', 'laid-back'],
    progression: [],
    phraseI: [{t:0,d:3,deg:'b3'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'5'}],
    phraseIV:[{t:0,d:3,deg:'b3'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'R'}],
    phraseV: [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'R'}],
    phraseTurnaround: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:6,deg:'R'}]
  },
  {
    id: 'Neutral-02',
    moods: ['contemplative', 'calm'],
    type: 'major',
    tags: ['slow-burn', 'ballad'],
    progression: [],
    phraseI: [{t:0,d:12,deg:'R'}],
    phraseIV:[{t:0,d:6,deg:'R'},{t:6,d:6,deg:'5'}],
    phraseV: [{t:0,d:4,deg:'R'},{t:4,d:8,deg:'b7'}],
    phraseTurnaround: [{t:0,d:4,deg:'6'},{t:4,d:4,deg:'5'},{t:8,d:4,deg:'R'}]
  },
  {
    id: 'Dreamy-01',
    moods: ['dreamy', 'calm'],
    type: 'major',
    tags: ['ballad', 'soul'],
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
    tags: ['soul', 'laid-back'],
    progression: [],
    phraseI: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8'}],
    phraseIV:[{t:0,d:3,deg:'3'},{t:3,d:3,deg:'5'},{t:6,d:6,deg:'6'}],
    phraseV: [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'R'}],
    phraseTurnaround: [{t:0,d:3,deg:'b3'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'R'}]
  },
  {
    id: 'Calm-01',
    moods: ['calm', 'contemplative'],
    type: 'major',
    tags: ['slow-burn', 'ballad'],
    progression: [],
    phraseI: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'5'}],
    phraseIV:[{t:0,d:6,deg:'R'},{t:6,d:6,deg:'3'}],
    phraseV: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround: [{t:0,d:4,deg:'6'},{t:4,d:4,deg:'5'},{t:8,d:4,deg:'R'}]
  },
  {
    id: 'Enthusiastic-01',
    moods: ['enthusiastic', 'joyful', 'epic'],
    type: 'major',
    tags: ['boogie', 'uptempo'],
    progression: [],
    phraseI: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'6'},{t:6,d:6,deg:'R'}],
    phraseIV:[{t:0,d:3,deg:'5'},{t:3,d:3,deg:'6'},{t:6,d:6,deg:'R'}],
    phraseV: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:6,deg:'3'}],
    phraseTurnaround: [{t:0,d:3,deg:'2'},{t:3,d:3,deg:'b3'},{t:6,d:3,deg:'3'},{t:9,d:3,deg:'4'}]
  },
  {
    id: 'Joyful-04',
    moods: ['joyful'],
    type: 'major',
    tags: ['shuffle', 'driving'],
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
    tags: ['slow-burn', 'ballad'],
    progression: [],
    phraseI:  [{t:0,d:6,deg:'b3'},{t:6,d:6,deg:'11'}],
    phraseIV: [{t:0,d:6,deg:'b3'},{t:6,d:6,deg:'9'}],
    phraseV:  [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b2'},{t:6,d:6,deg:'R'}],
    phraseTurnaround:  [{t:0,d:6,deg:'b7'},{t:6,d:6,deg:'R'}]
  },
  {
    id: 'Melancholic-02',
    moods: ['melancholic'],
    type: 'minor',
    tags: ['shuffle', 'mid-tempo'],
    progression: [],
    phraseI:  [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'#4'},{t:8,d:4,deg:'5'}],
    phraseIV: [{t:0,d:6,deg:'11'},{t:6,d:6,deg:'9'}],
    phraseV:  [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround:  [{t:0,d:3,deg:'2'},{t:3,d:3,deg:'b2'},{t:6,d:6,deg:'R'}]
  },
  {
    id: 'Gloomy-01',
    moods: ['gloomy', 'dark'],
    type: 'minor',
    tags: ['slow-burn', 'sparse'],
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
    tags: ['shuffle', 'laid-back'],
    progression: [],
    phraseI:  [{t:0,d:3,deg:'b3'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'5'}],
    phraseIV: [{t:0,d:3,deg:'4'},{t:3,d:9,deg:'9'}],
    phraseV:  [{t:0,d:3,deg:'5'},{t:3,d:9,deg:'b7'}],
    phraseTurnaround:  [{t:0,d:3,deg:'b3'},{t:3,d:9,deg:'R'}]
  },
  {
    id: 'Dark-01',
    moods: ['dark', 'anxious'],
    type: 'minor',
    tags: ['shuffle', 'heavy'],
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
    tags: ['slow-burn', 'drone'],
    progression: [],
    phraseI:  [{t:0,d:12,deg:'b3'}],
    phraseIV: [{t:0,d:12,deg:'11'}],
    phraseV:  [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}]
  },
  {
    id: 'Dreamy-Minor-01',
    moods: ['dreamy', 'melancholic'],
    type: 'minor',
    tags: ['ballad', 'soul'],
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
    tags: ['shuffle', 'expressive'],
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
    tags: ['shuffle', 'heavy'],
    progression: [],
    phraseI:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8'}],
    phraseIV: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8'}],
    phraseV:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround:  [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'b7'},{t:8,d:4,deg:'R'}]
  },
  {
    id: 'Dark-03',
    moods: ['dark', 'anxious'],
    type: 'minor',
    tags: ['shuffle', 'dissonant'],
    progression: [],
    phraseI:  [{t:0,d:6,deg:'b3'},{t:6,d:6,deg:'5'}],
    phraseIV: [{t:0,d:6,deg:'11'},{t:6,d:6,deg:'9'}],
    phraseV:  [{t:0,d:3,deg:'b2'},{t:3,d:3,deg:'R'},{t:6,d:6,deg:'b7'}],
    phraseTurnaround:  [{t:0,d:3,deg:'2'},{t:3,d:3,deg:'b2'},{t:6,d:6,deg:'R'}]
  },
];

  