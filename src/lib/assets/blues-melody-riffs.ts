// src/lib/assets/blues-melody-riffs.ts

/**
 * #ЗАЧЕМ: Этот файл содержит оцифрованную библиотеку блюзовых мелодических фраз.
 * #ОБНОВЛЕНО (ПЛАН №568): Добавлены 10 "плотных" минорных мелодий для меланхоличного блюза.
 */

import type { BluesMelody } from '@/types/music';

export const BLUES_MELODY_RIFFS: BluesMelody[] = [
    { "id":"Joyful-01","moods":["joyful", "epic"],"type": "major","tags":["shuffle", "uptempo"], progression: [],
      "phraseI":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":3,"deg":"b7"},{"t":6,"d":6,"deg":"R"}],
      "phraseIV":[{"t":0,"d":3,"deg":"3"},{"t":3,"d":3,"deg":"5"},{"t":6,"d":6,"deg":"R"}],
      "phraseV":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":3,"deg":"b7"},{"t":6,"d":3,"deg":"3"},{"t":9,"d":3,"deg":"R"}],
      "phraseTurnaround":[{"t":0,"d":3,"deg":"2"},{"t":3,"d":3,"deg":"b3"},{"t":6,"d":3,"deg":"3"},{"t":9,"d":3,"deg":"4"}]
    },
    { "id":"Joyful-02","moods":["joyful", "enthusiastic"],"type": "major", "tags":["shuffle", "boogie"], progression: [],
      "phraseI":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"R+8"}],
      "phraseIV":[{"t":0,"d":3,"deg":"R"},{"t":3,"d":3,"deg":"3"},{"t":6,"d":6,"deg":"9"}],
      "phraseV":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":8,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":2,"deg":"2"},{"t":2,"d":2,"deg":"b3"},{"t":4,"d":2,"deg":"3"},{"t":6,"d":2,"deg":"4"},{"t":8,"d":2,"deg":"#4"},{"t":10,"d":2,"deg":"5"}]
    },
    // ... (остальные существующие)
    
    // --- 10 DENSE MELANCHOLIC MELODIES (MelDense-01 to MelDense-10) ---
    {
      "id": "MelDense-01", "moods": ["melancholic"], "type": "minor", "tags": ["dense", "slow-burn"], progression: ["i","iv","V","T"],
      "phrasei":  [ {"t":0,"d":2,"deg":"b3"}, {"t":2,"d":2,"deg":"4"}, {"t":4,"d":2,"deg":"#4"}, {"t":6,"d":2,"deg":"5"}, {"t":8,"d":2,"deg":"b7"}, {"t":10,"d":2,"deg":"5"} ],
      "phraseiv": [ {"t":0,"d":2,"deg":"11"}, {"t":2,"d":2,"deg":"9"}, {"t":4,"d":2,"deg":"5"},  {"t":6,"d":2,"deg":"11"}, {"t":8,"d":2,"deg":"9"}, {"t":10,"d":2,"deg":"5"} ],
      "phraseV":  [ {"t":0,"d":2,"deg":"5"},  {"t":2,"d":2,"deg":"b7"}, {"t":4,"d":2,"deg":"R"}, {"t":6,"d":2,"deg":"b7"}, {"t":8,"d":2,"deg":"5"},  {"t":10,"d":2,"deg":"3"} ],
      "phraseTurnaround":  [ {"t":0,"d":2,"deg":"2"},  {"t":2,"d":2,"deg":"b2"}, {"t":4,"d":2,"deg":"R"}, {"t":6,"d":2,"deg":"b7"}, {"t":8,"d":2,"deg":"5"},  {"t":10,"d":2,"deg":"#4"} ]
    },
    {
      "id": "MelDense-02", "moods": ["melancholic"], "type": "minor", "tags": ["dense", "chromatic"], progression: ["i","iv","V","T"],
      "phrasei":  [ {"t":0,"d":2,"deg":"R"}, {"t":2,"d":2,"deg":"2"}, {"t":4,"d":2,"deg":"b3"}, {"t":6,"d":2,"deg":"4"}, {"t":8,"d":2,"deg":"#4"}, {"t":10,"d":2,"deg":"5"} ],
      "phraseiv": [ {"t":0,"d":2,"deg":"R"}, {"t":2,"d":2,"deg":"2"}, {"t":4,"d":2,"deg":"11"}, {"t":6,"d":2,"deg":"9"}, {"t":8,"d":2,"deg":"5"},  {"t":10,"d":2,"deg":"11"} ],
      "phraseV":  [ {"t":0,"d":2,"deg":"5"}, {"t":2,"d":2,"deg":"R"}, {"t":4,"d":2,"deg":"b7"}, {"t":6,"d":2,"deg":"5"}, {"t":8,"d":2,"deg":"R"},  {"t":10,"d":2,"deg":"b7"} ],
      "phraseTurnaround":  [ {"t":0,"d":2,"deg":"b7"}, {"t":2,"d":2,"deg":"6"}, {"t":4,"d":2,"deg":"b6"}, {"t":6,"d":2,"deg":"5"}, {"t":8,"d":2,"deg":"#4"}, {"t":10,"d":2,"deg":"R"} ]
    },
    {
      "id": "MelDense-03", "moods": ["melancholic"], "type": "minor", "tags": ["dense", "descending"], progression: ["i","iv","V","T"],
      "phrasei":  [ {"t":0,"d":2,"deg":"b3"}, {"t":2,"d":2,"deg":"5"}, {"t":4,"d":2,"deg":"4"}, {"t":6,"d":2,"deg":"b3"}, {"t":8,"d":2,"deg":"2"}, {"t":10,"d":2,"deg":"R"} ],
      "phraseiv": [ {"t":0,"d":2,"deg":"11"}, {"t":2,"d":2,"deg":"9"}, {"t":4,"d":2,"deg":"5"}, {"t":6,"d":2,"deg":"9"}, {"t":8,"d":2,"deg":"11"},{"t":10,"d":2,"deg":"5"} ],
      "phraseV":  [ {"t":0,"d":2,"deg":"b2"}, {"t":2,"d":2,"deg":"R"}, {"t":4,"d":2,"deg":"b7"}, {"t":6,"d":2,"deg":"5"}, {"t":8,"d":2,"deg":"b7"}, {"t":10,"d":2,"deg":"R"} ],
      "phraseTurnaround":  [ {"t":0,"d":2,"deg":"2"},  {"t":2,"d":2,"deg":"b2"}, {"t":4,"d":2,"deg":"R"}, {"t":6,"d":2,"deg":"b7"}, {"t":8,"d":2,"deg":"5"},  {"t":10,"d":2,"deg":"#4"} ]
    },
    {
      "id": "MelDense-04", "moods": ["melancholic"], "type": "minor", "tags": ["dense"], progression: [],
      "phrasei":  [ {"t":0,"d":2,"deg":"R"}, {"t":2,"d":2,"deg":"b3"}, {"t":4,"d":2,"deg":"4"}, {"t":6,"d":2,"deg":"#4"}, {"t":8,"d":2,"deg":"5"}, {"t":10,"d":2,"deg":"b7"} ],
      "phraseiv": [ {"t":0,"d":2,"deg":"R"}, {"t":2,"d":2,"deg":"11"}, {"t":4,"d":2,"deg":"9"}, {"t":6,"d":2,"deg":"11"}, {"t":8,"d":2,"deg":"5"}, {"t":10,"d":2,"deg":"9"} ],
      "phraseV":  [ {"t":0,"d":2,"deg":"5"}, {"t":2,"d":2,"deg":"3"},  {"t":4,"d":2,"deg":"R"}, {"t":6,"d":2,"deg":"b7"}, {"t":8,"d":2,"deg":"5"}, {"t":10,"d":2,"deg":"R"} ],
      "phraseTurnaround":  [ {"t":0,"d":2,"deg":"2"}, {"t":2,"d":2,"deg":"b2"}, {"t":4,"d":2,"deg":"R"}, {"t":6,"d":2,"deg":"b7"}, {"t":8,"d":2,"deg":"5"}, {"t":10,"d":2,"deg":"#4"} ]
    },
    {
      "id": "MelDense-05", "moods": ["melancholic"], "type": "minor", "tags": ["dense", "soul"], progression: [],
      "phrasei":  [ {"t":0,"d":2,"deg":"b3"}, {"t":2,"d":2,"deg":"2"}, {"t":4,"d":2,"deg":"R"}, {"t":6,"d":2,"deg":"5"}, {"t":8,"d":2,"deg":"4"}, {"t":10,"d":2,"deg":"#4"} ],
      "phraseiv": [ {"t":0,"d":2,"deg":"11"}, {"t":2,"d":2,"deg":"9"}, {"t":4,"d":2,"deg":"11"},{"t":6,"d":2,"deg":"5"}, {"t":8,"d":2,"deg":"9"}, {"t":10,"d":2,"deg":"5"} ],
      "phraseV":  [ {"t":0,"d":2,"deg":"5"}, {"t":2,"d":2,"deg":"b7"}, {"t":4,"d":2,"deg":"5"}, {"t":6,"d":2,"deg":"R"}, {"t":8,"d":2,"deg":"b7"}, {"t":10,"d":2,"deg":"5"} ],
      "phraseTurnaround":  [ {"t":0,"d":2,"deg":"b7"},{"t":2,"d":2,"deg":"6"},  {"t":4,"d":2,"deg":"b6"},{"t":6,"d":2,"deg":"5"}, {"t":8,"d":2,"deg":"#4"},{"t":10,"d":2,"deg":"R"} ]
    },
    {
      "id": "MelDense-06", "moods": ["melancholic"], "type": "minor", "tags": ["dense"], progression: [],
      "phrasei":  [ {"t":0,"d":2,"deg":"R"}, {"t":2,"d":2,"deg":"2"}, {"t":4,"d":2,"deg":"b3"}, {"t":6,"d":2,"deg":"4"}, {"t":8,"d":2,"deg":"5"}, {"t":10,"d":2,"deg":"b7"} ],
      "phraseiv": [ {"t":0,"d":2,"deg":"R"}, {"t":2,"d":2,"deg":"11"},{"t":4,"d":2,"deg":"9"},  {"t":6,"d":2,"deg":"11"},{"t":8,"d":2,"deg":"5"}, {"t":10,"d":2,"deg":"9"} ],
      "phraseV":  [ {"t":0,"d":2,"deg":"5"}, {"t":2,"d":2,"deg":"b7"},{"t":4,"d":2,"deg":"3"},  {"t":6,"d":2,"deg":"5"}, {"t":8,"d":2,"deg":"R"}, {"t":10,"d":2,"deg":"b7"} ],
      "phraseTurnaround":  [ {"t":0,"d":2,"deg":"2"}, {"t":2,"d":2,"deg":"b2"}, {"t":4,"d":2,"contains":"R"},  {"t":6,"d":2,"deg":"b7"},{"t":8,"d":2,"deg":"5"},{"t":10,"d":2,"deg":"#4"} ]
    },
    {
      "id": "MelDense-07", "moods": ["melancholic"], "type": "minor", "tags": ["dense", "sad"], progression: [],
      "phrasei":  [ {"t":0,"d":2,"deg":"b3"}, {"t":2,"d":2,"deg":"4"}, {"t":4,"d":2,"deg":"5"}, {"t":6,"d":2,"deg":"#4"}, {"t":8,"d":2,"deg":"5"}, {"t":10,"d":2,"deg":"b7"} ],
      "phraseiv": [ {"t":0,"d":2,"deg":"11"},{"t":2,"d":2,"deg":"9"},  {"t":4,"d":2,"deg":"5"}, {"t":6,"d":2,"deg":"11"}, {"t":8,"d":2,"deg":"9"}, {"t":10,"d":2,"deg":"5"} ],
      "phraseV":  [ {"t":0,"d":2,"deg":"b2"},{"t":2,"d":2,"deg":"R"},  {"t":4,"d":2,"deg":"b7"},{"t":6,"d":2,"deg":"5"},  {"t":8,"d":2,"deg":"b7"},{"t":10,"d":2,"deg":"R"} ],
      "phraseTurnaround":  [ {"t":0,"d":2,"deg":"b7"},{"t":2,"d":2,"deg":"6"},  {"t":4,"d":2,"deg":"b6"},{"t":6,"d":2,"deg":"5"},  {"t":8,"d":2,"deg":"#4"},{"t":10,"d":2,"deg":"R"} ]
    },
    {
      "id": "MelDense-08", "moods": ["melancholic"], "type": "minor", "tags": ["dense"], progression: [],
      "phrasei":  [ {"t":0,"d":2,"deg":"R"}, {"t":2,"d":2,"deg":"b3"}, {"t":4,"d":2,"deg":"4"}, {"t":6,"d":2,"deg":"5"}, {"t":8,"d":2,"deg":"4"}, {"t":10,"d":2,"deg":"#4"} ],
      "phraseiv": [ {"t":0,"d":2,"deg":"R"}, {"t":2,"d":2,"deg":"11"},{"t":4,"d":2,"deg":"9"}, {"t":6,"d":2,"deg":"11"},{"t":8,"d":2,"deg":"5"}, {"t":10,"d":2,"deg":"11"} ],
      "phraseV":  [ {"t":0,"d":2,"deg":"5"}, {"t":2,"d":2,"deg":"3"},  {"t":4,"d":2,"deg":"R"}, {"t":6,"d":2,"deg":"b7"},{"t":8,"d":2,"deg":"5"}, {"t":10,"d":2,"deg":"R"} ],
      "phraseTurnaround":  [ {"t":0,"d":2,"deg":"2"}, {"t":2,"d":2,"deg":"b2"}, {"t":4,"d":2,"deg":"R"}, {"t":6,"d":2,"deg":"b7"},{"t":8,"d":2,"deg":"5"},{"t":10,"d":2,"deg":"#4"} ]
    },
    {
      "id": "MelDense-09", "moods": ["melancholic"], "type": "minor", "tags": ["dense"], progression: [],
      "phrasei":  [ {"t":0,"d":2,"deg":"b3"},{"t":2,"d":2,"deg":"2"}, {"t":4,"d":2,"deg":"R"}, {"t":6,"d":2,"deg":"5"}, {"t":8,"d":2,"deg":"b7"}, {"t":10,"d":2,"deg":"5"} ],
      "phraseiv": [ {"t":0,"d":2,"deg":"11"},{"t":2,"d":2,"deg":"9"}, {"t":4,"d":2,"deg":"5"},  {"t":6,"d":2,"deg":"11"},{"t":8,"d":2,"deg":"9"}, {"t":10,"d":2,"deg":"5"} ],
      "phraseV":  [ {"t":0,"d":2,"deg":"5"}, {"t":2,"d":2,"deg":"b7"},{"t":4,"d":2,"deg":"R"},  {"t":6,"d":2,"deg":"b7"},{"t":8,"d":2,"deg":"5"}, {"t":10,"d":2,"deg":"3"} ],
      "phraseTurnaround":  [ {"t":0,"d":2,"deg":"2"}, {"t":2,"d":2,"deg":"b2"},{"t":4,"d":2,"deg":"R"},  {"t":6,"d":2,"deg":"b7"},{"t":8,"d":2,"deg":"5"},{"t":10,"d":2,"deg":"#4"} ]
    },
    {
      "id": "MelDense-10", "moods": ["melancholic"], "type": "minor", "tags": ["dense", "expressive"], progression: [],
      "phrasei":  [ {"t":0,"d":2,"deg":"R"}, {"t":2,"d":2,"deg":"2"}, {"t":4,"d":2,"deg":"b3"}, {"t":6,"d":2,"deg":"4"}, {"t":8,"d":2,"deg":"#4"}, {"t":10,"d":2,"deg":"5"} ],
      "phraseiv": [ {"t":0,"d":2,"deg":"R"}, {"t":2,"d":2,"deg":"11"},{"t":4,"d":2,"deg":"9"},  {"t":6,"d":2,"deg":"5"},  {"t":8,"d":2,"deg":"11"},{"t":10,"d":2,"deg":"9"} ],
      "phraseV":  [ {"t":0,"d":2,"deg":"5"}, {"t":2,"d":2,"deg":"b7"}, {"t":4,"d":2,"deg":"R"}, {"t":6,"d":2,"deg":"b7"}, {"t":8,"d":2,"deg":"5"}, {"t":10,"d":2,"deg":"R"} ],
      "phraseTurnaround":  [ {"t":0,"d":2,"deg":"b7"},{"t":2,"d":2,"deg":"6"}, {"t":4,"d":2,"deg":"b6"}, {"t":6,"d":2,"deg":"5"},  {"t":8,"d":2,"deg":"#4"},{"t":10,"d":2,"deg":"R"} ]
    }
];
