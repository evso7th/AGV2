

// src/lib/assets/blues-guitar-riffs.ts

/**
 * #ЗАЧЕМ: Этот файл содержит оцифрованную библиотеку блюзовых гитарных партий,
 *          предоставленную пользователем. Он служит "партитурой" для
 *          FractalMusicEngine, позволяя исполнять сложные техники, такие как
 *          соло, перебор и аккордовый бой.
 * #ЧТО: Экспортирует константу BLUES_GUITAR_RIFFS, где каждый элемент — это
 *       полное описание 12-тактовой гитарной аранжировки.
 * #СВЯЗИ: Используется в `fractal-music-engine.ts` для генерации гитарных партий
 *          в жанре 'blues'.
 */

import type { BluesGuitarRiff } from '@/types/fractal';

export const BLUES_GUITAR_RIFFS: BluesGuitarRiff[] = [
  {
    id: "Joy-SoloStrum",
    moods: ["joyful"],
    type: "major",
    tags: ["shuffle", "uptempo"],
    bpm: 72,
    key: "E",
    solo: {
      I:  [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7',tech:'gr'},{t:6,d:6,deg:'R',tech:'vb'}],
      IV: [{t:0,d:3,deg:'6'},{t:3,d:3,deg:'5'},{t:6,d:6,deg:'R'}],
      V:  [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'3',tech:'h'},{t:9,d:3,deg:'R'}],
      Turnaround:  [{t:0,d:2,deg:'2'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'4'},{t:8,d:2,deg:'#4'},{t:10,d:2,deg:'5'}]
    },
    fingerstyle: [
      { bars: [2,5,6], pattern: 'F_TRAVIS', voicingName: 'E7_open' }
    ],
    strum: [
      { bars: [1,3,4,7,8,11], pattern: 'S_SWING', voicingName: 'E7_open' },
      { bars: [10], pattern: 'S_SWING', voicingName: 'A7_open' },
      { bars: [9], pattern: 'S_SWING', voicingName: 'B7_open' }
    ]
  },
  {
    id: "Joy-OctaveGlow",
    moods: ["joyful"],
    type: "major",
    tags: ["shuffle", "boogie"],
    bpm: 76,
    key: "E",
    solo: {
      I:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8',tech:'vb'}],
      IV: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3',tech:'h'},{t:6,d:6,deg:'9'}],
      V:  [{t:0,d:4,deg:'R'},{t:4,d:8,deg:'b7'}],
      Turnaround:  [{t:0,d:6,deg:'6'},{t:6,d:6,deg:'R'}]
    },
    fingerstyle: [
       { bars: [2,6], pattern: 'F_ROLL12', voicingName: 'A7_open' }
    ],
    strum: [
      { bars: [1,3,5,7,8,11], pattern: 'S_4DOWN', voicingName: 'E7_open' },
      { bars: [12], pattern: 'S_SWING', voicingName: 'B7_open' }
    ]
  },
  {
    id: "Enth-PushPick",
    moods: ["enthusiastic"],
    type: "major",
    tags: ["shuffle", "driving"],
    bpm: 78,
    key: "E",
    solo: {
      I:  [{t:0,deg:'R'},{t:2,deg:'4',tech:'sl'},{t:4,deg:'#4'},{t:6,deg:'5',tech:'vb'}],
      IV: [{t:0,deg:'R'},{t:4,d:8,deg:'5'}],
      V:  [{t:0,deg:'R'},{t:3,deg:'b7'},{t:6,d:6,deg:'5'}],
      Turnaround:  [{t:0,deg:'2'},{t:2,deg:'b3'},{t:4,deg:'3'},{t:6,deg:'4'},{t:8,d:2,deg:'#4'},{t:10,d:2,deg:'5'}]
    },
    fingerstyle: [
      { bars: [5,6,2], pattern: 'F_TRAVIS', voicingName: 'A7_open' }
    ],
    strum: [
      { bars: [1,3,4,7,8,11], pattern: 'S_SWING', voicingName: 'E7_open' },
      { bars: [9], pattern: 'S_SWING', voicingName: 'B7_open' },
      { bars: [10], pattern: 'S_SWING', voicingName: 'A7_open' }
    ]
  },
  {
    id: "Neutral-Shells&Licks",
    moods: ["contemplative"],
    type: "major",
    tags: ["chicago", "mid-tempo"],
    bpm: 74,
    key: "E",
    solo: {
      I:  [{t:0,deg:'b3',tech:'gr'},{t:3,deg:'3'},{t:6,d:6,deg:'5'}],
      IV: [{t:0,deg:'R'},{t:3,deg:'3'},{t:6,d:6,deg:'R'}],
      V:  [{t:0,deg:'5'},{t:3,d:9,deg:'b7'}],
      Turnaround:  [{t:0,deg:'R'},{t:3,deg:'b7'},{t:6,d:6,deg:'R'}]
    },
    fingerstyle: [
      { bars: [2,5,6], pattern: 'F_TRAVIS', voicingName: 'A7_open' }
    ],
    strum: [
      { bars: [1,3,4,7,8,11], pattern: 'S_4DOWN', voicingName: 'E7_open' },
      { bars: [12], pattern: 'S_SWING', voicingName: 'B7_open' }
    ]
  },
  {
    id: "Dreamy-9Lift",
    moods: ["dreamy"],
    type: "major",
    tags: ["ballad", "soul"],
    bpm: 68,
    key: "E",
    solo: {
      I:  [{t:0,d:4,deg:'9'},{t:4,d:8,deg:'R'}],
      IV: [{t:0,d:6,deg:'6'},{t:6,d:6,deg:'5'}],
      V:  [{t:0,d:4,deg:'9'},{t:4,d:8,deg:'5'}],
      Turnaround:  [{t:0,d:6,deg:'2'},{t:6,d:6,deg:'R'}]
    },
    fingerstyle: [
      { bars: [2,6], pattern: 'F_ROLL12', voicingName: 'A7_open' },
      { bars: [5], pattern: 'F_TRAVIS', voicingName: 'A7_open' }
    ],
    strum: [
      { bars: [1,3,4,7,8,11,10], pattern: 'S_SWING', voicingName: 'E7_open' }
    ]
  },
  {
    id: "Calm-Oak",
    moods: ["calm"],
    type: "major",
    tags: ["laid-back", "mid-tempo"],
    bpm: 64,
    key: "E",
    solo: {
      I:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'5'}],
      IV: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'3'}],
      V:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}],
      Turnaround:  [{t:0,d:4,deg:'6'},{t:4,d:4,deg:'5'},{t:8,d:4,deg:'R'}]
    },
    fingerstyle: [
      { bars: [2,5], pattern: 'F_TRAVIS', voicingName: 'A7_open' }
    ],
    strum: [
       { bars: [1,3,4,7,8,11], pattern: 'S_SWING', voicingName: 'E7_open' }
    ]
  },
  {
    id: "Melancholic-MinorFlow",
    moods: ["melancholic"],
    type: "minor",
    tags: ["slow-burn", "ballad"],
    bpm: 60,
    key: "E",
    solo: {
      I:  [{t:0,d:6,deg:'b3',tech:'vb'},{t:6,d:6,deg:'11'}],
      IV: [{t:0,d:6,deg:'b3'},{t:6,d:6,deg:'9'}],
      V:  [{t:0,deg:'5'},{t:3,deg:'b2'},{t:6,d:6,deg:'R'}],
      Turnaround:  [{t:0,d:6,deg:'b7'},{t:6,d:6,deg:'R'}]
    },
    fingerstyle: [
      { bars: [2,5,6], pattern: 'F_ROLL12', voicingName: 'Em7_open' }
    ],
    strum: [
      { bars: [1,3,4,7,8,11], pattern: 'S_SWING', voicingName: 'Em7_open' },
      { bars: [9], pattern: 'S_SWING', voicingName: 'B7_open' }
    ]
  },
  {
    id: "Gloomy-SwampPick",
    moods: ["gloomy"],
    type: "minor",
    tags: ["swamp", "sparse"],
    bpm: 62,
    key: "E",
    solo: {
      I:  [{t:0,d:12,deg:'R'}],
      IV: [{t:0,deg:'R'},{t:2,deg:'b3'},{t:4,deg:'4'},{t:6,deg:'#4'},{t:8,deg:'4'},{t:10,deg:'b3'}],
      V:  [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'b7'}],
      Turnaround:  [{t:0,deg:'R'},{t:2,deg:'b7'},{t:4,deg:'6'},{t:6,deg:'b6'},{t:8,deg:'5'},{t:10,deg:'#4'}]
    },
    fingerstyle: [
      { bars: [2,5], pattern: 'F_TRAVIS', voicingName: 'Am7_open' },
      { bars: [6], pattern: 'F_ROLL12', voicingName: 'Am7_open' }
    ],
    strum: [
      { bars: [1,3,4,7,8,11], pattern: 'S_SWING', voicingName: 'Em7_open' }
    ]
  },
  {
    id: "Dark-TensionBend",
    moods: ["dark"],
    type: "minor",
    tags: ["shuffle", "dissonant"],
    bpm: 66,
    key: "E",
    solo: {
      I:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'5'}],
      IV: [{t:0,d:6,deg:'11'},{t:6,d:6,deg:'9'}],
      V:  [{t:0,d:3,deg:'b2',tech:'gr'},{t:3,d:3,deg:'R'},{t:6,d:6,deg:'b7',tech:'vb'}],
      Turnaround:  [{t:0,d:3,deg:'2'},{t:3,d:3,deg:'b2'},{t:6,d:6,deg:'R'}]
    },
    fingerstyle: [
      { bars: [2,6], pattern: 'F_ROLL12', voicingName: 'Am7_open' },
      { bars: [5], pattern: 'F_TRAVIS', voicingName: 'Am7_open' }
    ],
    strum: [
      { bars: [1,3,4,7,8,11], pattern: 'S_4DOWN', voicingName: 'Em7_open' },
      { bars: [12], pattern: 'S_SWING', voicingName: 'B7_open' }
    ]
  },
  {
    id: "Soul-Minor9",
    moods: ["melancholic", "dreamy"],
    type: "minor",
    tags: ["soul", "ballad"],
    bpm: 64,
    key: "E",
    solo: {
      I:  [{t:0,d:4,deg:'9'},{t:4,d:8,deg:'b3'}],
      IV: [{t:0,d:6,deg:'11'},{t:6,d:6,deg:'9'}],
      V:  [{t:0,d:4,deg:'9'},{t:4,d:8,deg:'5'}],
      Turnaround:  [{t:0,d:6,deg:'2'},{t:6,d:6,deg:'R'}]
    },
    fingerstyle: [
      { bars: [2,5,6], pattern: 'F_TRAVIS', voicingName: 'Am7_open' }
    ],
    strum: [
       { bars: [1,3,4,7,8,11], pattern: 'S_SWING', voicingName: 'Em7_open' }
    ]
  },
  // --- SLOW BLUES MELODIES ---
  {
      id: "MelDense-01",
      moods: ["melancholic", "gloomy"],
      type: "minor",
      tags: ["slow-burn", "dense"],
      bpm: 60,
      key: "E",
      solo: {
        I:  [ {"t":0,"deg":"b3"}, {"t":2,"deg":"4"}, {"t":4,"deg":"#4"}, {"t":6,"deg":"5"}, {"t":8,"deg":"b7"}, {"t":10,"deg":"5"} ],
        IV: [ {"t":0,"deg":"11"}, {"t":2,"deg":"9"}, {"t":4,"deg":"5"},  {"t":6,"deg":"11"}, {"t":8,"deg":"9"}, {"t":10,"deg":"5"} ],
        V:  [ {"t":0,"deg":"5"},  {"t":2,"deg":"b7"}, {"t":4,"deg":"R"}, {"t":6,"deg":"b7"}, {"t":8,"deg":"5"},  {"t":10,"deg":"3"} ],
        Turnaround:  [ {"t":0,"deg":"2"},  {"t":2,"deg":"b2"}, {"t":4,"deg":"R"}, {"t":6,"deg":"b7"}, {"t":8,"deg":"5"},  {"t":10,"deg":"#4"} ]
      },
      fingerstyle: [],
      strum: []
    },
    {
      id: "MelDense-02",
      moods: ["melancholic", "dark"],
      type: "minor",
      tags: ["slow-burn", "dense", "chromatic"],
      bpm: 60,
      key: "E",
      solo: {
        I:  [ {"t":0,"deg":"R"}, {"t":2,"deg":"2"}, {"t":4,"deg":"b3"}, {"t":6,"deg":"4"}, {"t":8,"deg":"#4"}, {"t":10,"deg":"5"} ],
        IV: [ {"t":0,"deg":"R"}, {"t":2,"deg":"2"}, {"t":4,"deg":"11"}, {"t":6,"deg":"9"}, {"t":8,"deg":"5"},  {"t":10,"deg":"11"} ],
        V:  [ {"t":0,"deg":"5"}, {"t":2,"deg":"R"}, {"t":4,"deg":"b7"}, {"t":6,"deg":"5"}, {"t":8,"deg":"R"},  {"t":10,"deg":"b7"} ],
        Turnaround:  [ {"t":0,"deg":"b7"}, {"t":2,"deg":"6"}, {"t":4,"deg":"b6"}, {"t":6,"deg":"5"}, {"t":8,"deg":"#4"}, {"t":10,"deg":"R"} ]
      },
      fingerstyle: [],
      strum: []
    },
    {
      id: "MelDense-03",
      moods: ["gloomy", "dark"],
      type: "minor",
      tags: ["slow-burn", "dense"],
      bpm: 60,
      key: "E",
      solo: {
        I:  [ {"t":0,"deg":"b3"}, {"t":2,"deg":"5"}, {"t":4,"deg":"4"}, {"t":6,"deg":"b3"}, {"t":8,"deg":"2"}, {"t":10,"deg":"R"} ],
        IV: [ {"t":0,"deg":"11"}, {"t":2,"deg":"9"}, {"t":4,"deg":"5"}, {"t":6,"deg":"9"}, {"t":8,"deg":"11"},{"t":10,"deg":"5"} ],
        V:  [ {"t":0,"deg":"b2"}, {"t":2,"deg":"R"}, {"t":4,"deg":"b7"}, {"t":6,"deg":"5"}, {"t":8,"deg":"b7"}, {"t":10,"deg":"R"} ],
        Turnaround:  [ {"t":0,"deg":"2"},  {"t":2,"deg":"b2"}, {"t":4,"deg":"R"}, {"t":6,"deg":"b7"}, {"t":8,"deg":"5"},  {"t":10,"deg":"#4"} ]
      },
      fingerstyle: [],
      strum: []
    },
    {
      id: "MelDense-04",
      moods: ["melancholic", "dark"],
      type: "minor",
      tags: ["slow-burn", "dense"],
      bpm: 60,
      key: "E",
      solo: {
        I:  [ {"t":0,"deg":"R"}, {"t":2,"deg":"b3"}, {"t":4,"deg":"4"}, {"t":6,"deg":"#4"}, {"t":8,"deg":"5"}, {"t":10,"deg":"b7"} ],
        IV: [ {"t":0,"deg":"R"}, {"t":2,"deg":"11"}, {"t":4,"deg":"9"}, {"t":6,"deg":"11"}, {"t":8,"deg":"5"}, {"t":10,"deg":"9"} ],
        V:  [ {"t":0,"deg":"5"}, {"t":2,"deg":"3"},  {"t":4,"deg":"R"}, {"t":6,"deg":"b7"}, {"t":8,"deg":"5"}, {"t":10,"deg":"R"} ],
        Turnaround:  [ {"t":0,"deg":"2"}, {"t":2,"deg":"b2"}, {"t":4,"deg":"R"}, {"t":6,"deg":"b7"}, {"t":8,"deg":"5"}, {"t":10,"deg":"#4"} ]
      },
      fingerstyle: [],
      strum: []
    },
    {
      id: "MelDense-05",
      moods: ["melancholic", "gloomy"],
      type: "minor",
      tags: ["slow-burn", "dense"],
      bpm: 60,
      key: "E",
      solo: {
        I:  [ {"t":0,"deg":"b3"}, {"t":2,"deg":"2"}, {"t":4,"deg":"R"}, {"t":6,"deg":"5"}, {"t":8,"deg":"4"}, {"t":10,"deg":"#4"} ],
        IV: [ {"t":0,"deg":"11"}, {"t":2,"deg":"9"}, {"t":4,"deg":"11"},{"t":6,"deg":"5"}, {"t":8,"deg":"9"}, {"t":10,"deg":"5"} ],
        V:  [ {"t":0,"deg":"5"}, {"t":2,"deg":"b7"}, {"t":4,"deg":"5"}, {"t":6,"deg":"R"}, {"t":8,"deg":"b7"}, {"t":10,"deg":"5"} ],
        Turnaround:  [ {"t":0,"deg":"b7"},{"t":2,"deg":"6"},  {"t":4,"deg":"b6"},{"t":6,"deg":"5"}, {"t":8,"deg":"#4"},{"t":10,"deg":"R"} ]
      },
      fingerstyle: [],
      strum: []
    },
    {
      id: "MelDense-06",
      moods: ["melancholic", "dreamy"],
      type: "minor",
      tags: ["slow-burn", "dense"],
      bpm: 60,
      key: "E",
      solo: {
        I:  [ {"t":0,"deg":"R"}, {"t":2,"deg":"2"}, {"t":4,"deg":"b3"}, {"t":6,"deg":"4"}, {"t":8,"deg":"5"}, {"t":10,"deg":"b7"} ],
        IV: [ {"t":0,"deg":"R"}, {"t":2,"deg":"11"},{"t":4,"deg":"9"},  {"t":6,"deg":"11"},{"t":8,"deg":"5"}, {"t":10,"deg":"9"} ],
        V:  [ {"t":0,"deg":"5"}, {"t":2,"deg":"b7"},{"t":4,"deg":"3"},  {"t":6,"deg":"5"}, {"t":8,"deg":"R"}, {"t":10,"deg":"b7"} ],
        Turnaround:  [ {"t":0,"deg":"2"}, {"t":2,"deg":"b2"}, {"t":4,"deg":"R"},  {"t":6,"deg":"b7"},{"t":8,"deg":"5"},{"t":10,"deg":"#4"} ]
      },
      fingerstyle: [],
      strum: []
    },
    {
      id: "MelDense-07",
      moods: ["gloomy", "dark"],
      type: "minor",
      tags: ["slow-burn", "dense", "chromatic"],
      bpm: 60,
      key: "E",
      solo: {
        I:  [ {"t":0,"deg":"b3"}, {"t":2,"deg":"4"}, {"t":4,"deg":"5"}, {"t":6,"deg":"#4"}, {"t":8,"deg":"5"}, {"t":10,"deg":"b7"} ],
        IV: [ {"t":0,"deg":"11"},{"t":2,"deg":"9"},  {"t":4,"deg":"5"}, {"t":6,"deg":"11"}, {"t":8,"deg":"9"}, {"t":10,"deg":"5"} ],
        V:  [ {"t":0,"deg":"b2"},{"t":2,"deg":"R"},  {"t":4,"deg":"b7"},{"t":6,"deg":"5"},  {"t":8,"deg":"b7"},{"t":10,"deg":"R"} ],
        Turnaround:  [ {"t":0,"deg":"b7"},{"t":2,"deg":"6"},  {"t":4,"deg":"b6"},{"t":6,"deg":"5"},  {"t":8,"deg":"#4"},{"t":10,"deg":"R"} ]
      },
      fingerstyle: [],
      strum: []
    },
    {
      id: "MelDense-08",
      moods: ["melancholic", "dark"],
      type: "minor",
      tags: ["slow-burn", "dense"],
      bpm: 60,
      key: "E",
      solo: {
        I:  [ {"t":0,"deg":"R"}, {"t":2,"deg":"b3"}, {"t":4,"deg":"4"}, {"t":6,"deg":"5"}, {"t":8,"deg":"4"}, {"t":10,"deg":"#4"} ],
        IV: [ {"t":0,"deg":"R"}, {"t":2,"deg":"11"},{"t":4,"deg":"9"}, {"t":6,"deg":"11"},{"t":8,"deg":"5"}, {"t":10,"deg":"11"} ],
        V:  [ {"t":0,"deg":"5"}, {"t":2,"deg":"3"},  {"t":4,"deg":"R"}, {"t":6,"deg":"b7"},{"t":8,"deg":"5"}, {"t":10,"deg":"R"} ],
        Turnaround:  [ {"t":0,"deg":"2"}, {"t":2,"deg":"b2"}, {"t":4,"deg":"R"}, {"t":6,"deg":"b7"},{"t":8,"deg":"5"},{"t":10,"deg":"#4"} ]
      },
      fingerstyle: [],
      strum: []
    },
    {
      id: "MelDense-09",
      moods: ["gloomy", "dark"],
      type: "minor",
      tags: ["slow-burn", "dense"],
      bpm: 60,
      key: "E",
      solo: {
        I:  [ {"t":0,"deg":"b3"},{"t":2,"deg":"2"}, {"t":4,"deg":"R"}, {"t":6,"deg":"5"}, {"t":8,"deg":"b7"}, {"t":10,"deg":"5"} ],
        IV: [ {"t":0,"deg":"11"},{"t":2,"deg":"9"}, {"t":4,"deg":"5"},  {"t":6,"deg":"11"},{"t":8,"deg":"9"}, {"t":10,"deg":"5"} ],
        V:  [ {"t":0,"deg":"5"}, {"t":2,"deg":"b7"},{"t":4,"deg":"R"},  {"t":6,"deg":"b7"},{"t":8,"deg":"5"}, {"t":10,"deg":"3"} ],
        Turnaround:  [ {"t":0,"deg":"2"}, {"t":2,"deg":"b2"},{"t":4,"deg":"R"},  {"t":6,"deg":"b7"},{"t":8,"deg":"5"},{"t":10,"deg":"#4"} ]
      },
      fingerstyle: [],
      strum: []
    },
    {
      id: "MelDense-10",
      moods: ["melancholic", "gloomy"],
      type: "minor",
      tags: ["slow-burn", "dense"],
      bpm: 60,
      key: "E",
      solo: {
        I:  [ {"t":0,"deg":"R"}, {"t":2,"deg":"2"}, {"t":4,"deg":"b3"}, {"t":6,"deg":"4"}, {"t":8,"deg":"#4"}, {"t":10,"deg":"5"} ],
        IV: [ {"t":0,"deg":"R"}, {"t":2,"deg":"11"},{"t":4,"deg":"9"},  {"t":6,"deg":"5"},  {"t":8,"deg":"11"},{"t":10,"deg":"9"} ],
        V:  [ {"t":0,"deg":"5"}, {"t":2,"deg":"b7"}, {"t":4,"deg":"R"}, {"t":6,"deg":"b7"}, {"t":8,"deg":"5"}, {"t":10,"deg":"R"} ],
        Turnaround:  [ {"t":0,"deg":"b7"},{"t":2,"deg":"6"}, {"t":4,"deg":"b6"}, {"t":6,"deg":"5"},  {"t":8,"deg":"#4"},{"t":10,"deg":"R"} ]
      },
      fingerstyle: [],
      strum: []
    }
];

export const BLUES_GUITAR_VOICINGS: Record<string, number[]> = {
    'E7_open': [40,47,50,56,59,64],
    'A7_open': [45,52,55,61,64],
    'B7_open': [47,51,57,59,66],
    'Em7_open': [40,47,52,55,62,64],
    'Am7_open': [45,52,55,60,64],
};

    