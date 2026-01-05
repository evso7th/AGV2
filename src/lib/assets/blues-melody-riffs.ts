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

import type { BluesMelody, Mood } from '@/types/fractal';

export const BLUES_MELODY_RIFFS: BluesMelody[] = [
    { "id":"Joyful-01","moods":["joyful", "epic"],"type": "major","tags":["shuffle", "uptempo"],
      "phraseI":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":3,"deg":"b7"},{"t":6,"d":6,"deg":"R"}],
      "phraseIV":[{"t":0,"d":3,"deg":"3"},{"t":3,"d":3,"deg":"5"},{"t":6,"d":6,"deg":"R"}],
      "phraseV":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":3,"deg":"b7"},{"t":6,"d":3,"deg":"3"},{"t":9,"d":3,"deg":"R"}],
      "phraseTurnaround":[{"t":0,"d":3,"deg":"2"},{"t":3,"d":3,"deg":"b3"},{"t":6,"d":3,"deg":"3"},{"t":9,"d":3,"deg":"4"}]
    },
    { "id":"Joyful-02","moods":["joyful", "enthusiastic"],"type": "major", "tags":["shuffle", "boogie"],
      "phraseI":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"R+8"}],
      "phraseIV":[{"t":0,"d":3,"deg":"R"},{"t":3,"d":3,"deg":"3"},{"t":6,"d":6,"deg":"9"}],
      "phraseV":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":8,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":2,"deg":"2"},{"t":2,"d":2,"deg":"b3"},{"t":4,"d":2,"deg":"3"},{"t":6,"d":2,"deg":"4"},{"t":8,"d":2,"deg":"#4"},{"t":10,"d":2,"deg":"5"}]
    },
    { "id":"Joyful-03","moods":["joyful", "epic"],"type": "major","tags":["shuffle", "mid-tempo"],
      "phraseI":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"4"},{"t":8,"d":4,"deg":"6"}],
      "phraseIV":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"5"},{"t":8,"d":4,"deg":"6"}],
      "phraseV":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":3,"deg":"b7"},{"t":6,"d":6,"deg":"3"}],
      "phraseTurnaround":[{"t":0,"d":3,"deg":"R"},{"t":3,"d":3,"deg":"b7"},{"t":6,"d":6,"deg":"R"}]
    },
    { "id":"Joyful-04", "moods":["joyful"], "type": "major","tags":["shuffle", "driving"],
      "phraseI":[{"t":0,"d":3,"deg":"b3"},{"t":3,"d":3,"deg":"3"},{"t":6,"d":6,"deg":"5"}],
      "phraseIV":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":8,"deg":"5"}],
      "phraseV":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":8,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":6,"deg":"6"},{"t":6,"d":6,"deg":"R"}]
    },
    { "id":"Joyful-05","moods":["joyful"],"type": "major","tags":["shuffle", "uptempo"],
      "phraseI":[{"t":0,"d":3,"deg":"9"},{"t":3,"d":3,"deg":"6"},{"t":6,"d":6,"deg":"R"}],
      "phraseIV":[{"t":0,"d":3,"deg":"9"},{"t":3,"d":9,"deg":"R"}],
      "phraseV":[{"t":0,"d":3,"deg":"9"},{"t":3,"d":9,"deg":"5"}],
      "phraseTurnaround":[{"t":0,"d":4,"deg":"2"},{"t":4,"d":8,"deg":"R"}]
    },
    { "id":"Enthusiastic-01","moods":["enthusiastic"],"type": "major","tags":["boogie", "uptempo"],
      "phraseI":[{"t":0,"deg":"R"},{"t":2,"deg":"5"},{"t":4,"deg":"6"},{"t":6,"deg":"6"},{"t":8,"deg":"5"},{"t":10,"deg":"R"}],
      "phraseIV":[{"t":0,"deg":"R"},{"t":2,"deg":"5"},{"t":4,"deg":"6"},{"t":6,"deg":"6"},{"t":8,"deg":"5"},{"t":10,"deg":"R"}],
      "phraseV":[{"t":0,"deg":"R"},{"t":2,"deg":"5"},{"t":4,"deg":"b7"},{"t":6,"deg":"5"},{"t":8,"deg":"R"},{"t":10,"deg":"5"}],
      "phraseTurnaround":[{"t":0,"deg":"R"},{"t":3,"deg":"b7"},{"t":6,"deg":"6"},{"t":9,"deg":"5"}]
    },
    { "id":"Enthusiastic-02","moods":["enthusiastic"],"type": "major","tags":["boogie", "driving"],
      "phraseI":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"4"},{"t":8,"d":4,"deg":"6"}],
      "phraseIV":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"5"},{"t":8,"d":4,"deg":"6"}],
      "phraseV":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"b7"},{"t":8,"d":4,"deg":"5"}],
      "phraseTurnaround":[{"t":0,"d":2,"deg":"2"},{"t":2,"d":2,"deg":"b3"},{"t":4,"d":2,"deg":"3"},{"t":6,"d":2,"deg":"4"},{"t":8,"d":2,"deg":"#4"},{"t":10,"d":2,"deg":"5"}]
    },
    { "id":"Enthusiastic-03","moods":["enthusiastic"],"type": "major","tags":["shuffle", "uptempo"],
      "phraseI":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"6"}],
      "phraseIV":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"6"}],
      "phraseV":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":3,"deg":"b7"},{"t":6,"d":6,"deg":"3"}],
      "phraseTurnaround":[{"t":0,"d":6,"deg":"6"},{"t":6,"d":6,"deg":"R"}]
    },
    { "id":"Enthusiastic-04","moods":["enthusiastic"],"type": "major","tags":["shuffle", "driving"],
      "phraseI":[{"t":0,"deg":"R"},{"t":2,"deg":"5"},{"t":4,"deg":"6"},{"t":6,"deg":"b7"},{"t":9,"deg":"6"},{"t":11,"deg":"5"}],
      "phraseIV":[{"t":0,"deg":"R"},{"t":2,"deg":"5"},{"t":4,"deg":"6"},{"t":6,"deg":"b7"},{"t":9,"deg":"6"},{"t":11,"deg":"5"}],
      "phraseV":[{"t":0,"deg":"5"},{"t":2,"deg":"b7"},{"t":4,"deg":"R"},{"t":6,"deg":"b7"},{"t":8,"deg":"5"},{"t":10,"deg":"R"}],
      "phraseTurnaround":[{"t":0,"deg":"R"},{"t":2,"deg":"b7"},{"t":4,"deg":"6"},{"t":6,"deg":"b6"},{"t":8,"deg":"5"},{"t":10,"deg":"#4"}]
    },
    { "id":"Enthusiastic-05","moods":["enthusiastic"],"type": "major","tags":["shuffle", "uptempo"],
      "phraseI":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":3,"deg":"6"},{"t":6,"d":6,"deg":"R"}],
      "phraseIV":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":3,"deg":"6"},{"t":6,"d":6,"deg":"R"}],
      "phraseV":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":3,"deg":"b7"},{"t":6,"d":6,"deg":"3"}],
      "phraseTurnaround":[{"t":0,"d":3,"deg":"2"},{"t":3,"d":3,"deg":"b3"},{"t":6,"d":6,"deg":"R"}]
    },

    { "id":"Neutral-01","moods":["contemplative"], "type": "major","tags":["chicago", "mid-tempo"],
      "phraseI":[{"t":0,"deg":"R"},{"t":2,"deg":"5"},{"t":4,"deg":"6"},{"t":6,"deg":"b7"},{"t":8,"deg":"6"},{"t":10,"deg":"5"}],
      "phraseIV":[{"t":0,"deg":"R"},{"t":2,"deg":"5"},{"t":4,"deg":"6"},{"t":6,"deg":"b7"},{"t":8,"deg":"6"},{"t":10,"deg":"5"}],
      "phraseV":[{"t":0,"deg":"5"},{"t":2,"deg":"b7"},{"t":4,"deg":"R"},{"t":6,"deg":"b7"},{"t":8,"deg":"5"},{"t":10,"deg":"R"}],
      "phraseTurnaround":[{"t":0,"deg":"R"},{"t":2,"deg":"b7"},{"t":6,"deg":"6"},{"t":10,"deg":"5"}]
    },
    { "id":"Neutral-02","moods":["contemplative"],"type": "major","tags":["chicago", "laid-back"],
      "phraseI":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"5"}],
      "phraseIV":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"3"}],
      "phraseV":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":6,"deg":"6"},{"t":6,"d":6,"deg":"R"}]
    },
    { "id":"Neutral-03","moods":["contemplative"],"type": "major","tags":["shuffle", "mid-tempo"],
      "phraseI":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"4"},{"t":8,"d":4,"deg":"5"}],
      "phraseIV":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"5"},{"t":8,"d":4,"deg":"6"}],
      "phraseV":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"b7"},{"t":8,"d":4,"deg":"5"}],
      "phraseTurnaround":[{"t":0,"d":2,"deg":"2"},{"t":2,"d":2,"deg":"b3"},{"t":4,"d":2,"deg":"3"},{"t":6,"d":2,"deg":"4"},{"t":8,"d":2,"deg":"#4"},{"t":10,"d":2,"deg":"5"}]
    },
    { "id":"Neutral-04","moods":["contemplative"],"type": "major","tags":["slow-burn", "sparse"],
      "phraseI":[{"t":0,"d":12,"deg":"R"}],
      "phraseIV":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"5"}],
      "phraseV":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":4,"deg":"6"},{"t":4,"d":4,"deg":"5"},{"t":8,"d":4,"deg":"R"}]
    },
    { "id":"Neutral-05","moods":["contemplative"],"type": "major","tags":["shuffle", "classic"],
      "phraseI":[{"t":0,"d":3,"deg":"b3"},{"t":3,"d":3,"deg":"3"},{"t":6,"d":6,"deg":"5"}],
      "phraseIV":[{"t":0,"d":3,"deg":"R"},{"t":3,"d":3,"deg":"3"},{"t":6,"d":6,"deg":"R"}],
      "phraseV":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":9,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":3,"deg":"R"},{"t":3,"d":3,"deg":"b7"},{"t":6,"d":6,"deg":"R"}]
    },
    { "id":"Dreamy-01","moods":["dreamy"],"type": "major","tags":["ballad", "soul"],
      "phraseI":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"R+8"}],
      "phraseIV":[{"t":0,"d":6,"deg":"6"},{"t":6,"d":6,"deg":"5"}],
      "phraseV":[{"t":0,"d":6,"deg":"5"},{"t":6,"d":6,"deg":"R"}],
      "phraseTurnaround":[{"t":0,"d":6,"deg":"2"},{"t":6,"d":6,"deg":"R"}]
    },
    { "id":"Dreamy-02","moods":["dreamy"],"type": "major","tags":["soul", "laid-back"],
      "phraseI":[{"t":0,"d":4,"deg":"9"},{"t":4,"d":8,"deg":"R"}],
      "phraseIV":[{"t":0,"d":6,"deg":"6"},{"t":6,"d":6,"deg":"5"}],
      "phraseV":[{"t":0,"d":4,"deg":"9"},{"t":4,"d":8,"deg":"5"}],
      "phraseTurnaround":[{"t":0,"d":6,"deg":"6"},{"t":6,"d":6,"deg":"R"}]
    },
    { "id":"Dreamy-03","moods":["dreamy"],"type": "major","tags":["ballad", "soul"],
      "phraseI":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":3,"deg":"6"},{"t":6,"d":6,"deg":"R"}],
      "phraseIV":[{"t":0,"d":3,"deg":"3"},{"t":3,"d":9,"deg":"R"}],
      "phraseV":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":9,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":3,"deg":"2"},{"t":3,"d":9,"deg":"R"}]
    },
    { "id":"Dreamy-04","moods":["dreamy"],"type": "major","tags":["soul", "sparse"],
      "phraseI":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"9"}],
      "phraseIV":[{"t":0,"d":6,"deg":"6"},{"t":6,"d":6,"deg":"9"}],
      "phraseV":[{"t":0,"d":6,"deg":"5"},{"t":6,"d":6,"deg":"9"}],
      "phraseTurnaround":[{"t":0,"d":4,"deg":"6"},{"t":4,"d":8,"deg":"R"}]
    },
    { "id":"Dreamy-05","moods":["dreamy"],"type": "major","tags":["ballad", "minimal"],
      "phraseI":[{"t":0,"d":12,"deg":"R"}],
      "phraseIV":[{"t":0,"d":12,"deg":"5"}],
      "phraseV":[{"t":0,"d":12,"deg":"5"}],
      "phraseTurnaround":[{"t":0,"d":6,"deg":"2"},{"t":6,"d":6,"deg":"R"}]
    },

    { "id":"Calm-01","moods":["calm"],"type": "major","tags":["laid-back", "mid-tempo"],
      "phraseI":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"5"}],
      "phraseIV":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"3"}],
      "phraseV":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":4,"deg":"6"},{"t":4,"d":4,"deg":"5"},{"t":8,"d":4,"deg":"R"}]
    },
    { "id":"Calm-02","moods":["calm"],"type": "major","tags":["slow-burn", "sparse"],
      "phraseI":[{"t":0,"d":12,"deg":"R"}],
      "phraseIV":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"5"}],
      "phraseV":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":12,"deg":"R"}]
    },
    { "id":"Calm-03","moods":["calm"],"type": "major","tags":["shuffle", "classic"],
      "phraseI":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"4"},{"t":8,"d":4,"deg":"5"}],
      "phraseIV":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"5"},{"t":8,"d":4,"deg":"6"}],
      "phraseV":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"b7"},{"t":8,"d":4,"deg":"5"}],
      "phraseTurnaround":[{"t":0,"d":2,"deg":"2"},{"t":2,"d":2,"deg":"b3"},{"t":4,"d":2,"deg":"3"},{"t":6,"d":2,"deg":"4"},{"t":8,"d":2,"deg":"#4"},{"t":10,"d":2,"deg":"5"}]
    },
    { "id":"Calm-04","moods":["calm"],"type": "major","tags":["shuffle", "laid-back"],
      "phraseI":[{"t":0,"d":3,"deg":"b3"},{"t":3,"d":3,"deg":"3"},{"t":6,"d":6,"deg":"5"}],
      "phraseIV":[{"t":0,"d":3,"deg":"R"},{"t":3,"d":3,"deg":"3"},{"t":6,"d":6,"deg":"R"}],
      "phraseV":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":9,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":6,"deg":"6"},{"t":6,"d":6,"deg":"R"}]
    },
    { "id":"Calm-05","moods":["calm"],"type": "major","tags":["shuffle", "minimal"],
      "phraseI":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"6"}],
      "phraseIV":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"6"}],
      "phraseV":[{"t":0,"d":6,"deg":"5"},{"t":6,"d":6,"deg":"R"}],
      "phraseTurnaround":[{"t":0,"d":6,"deg":"2"},{"t":6,"d":6,"deg":"R"}]
    },

    { "id":"Melancholic-01","moods":["melancholic"],"type": "minor","tags":["slow-burn", "ballad"],
      "phraseI":[{"t":0,"d":6,"deg":"b3"},{"t":6,"d":6,"deg":"11"}],
      "phraseIV":[{"t":0,"d":6,"deg":"b3"},{"t":6,"d":6,"deg":"9"}],
      "phraseV":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":3,"deg":"b2"},{"t":6,"d":6,"deg":"R"}],
      "phraseTurnaround":[{"t":0,"d":6,"deg":"b7"},{"t":6,"d":6,"deg":"R"}]
    },
    { "id":"Melancholic-02","moods":["melancholic"],"type": "minor","tags":["shuffle", "mid-tempo"],
      "phraseI":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"#4"},{"t":8,"d":4,"deg":"5"}],
      "phraseIV":[{"t":0,"d":6,"deg":"11"},{"t":6,"d":6,"deg":"9"}],
      "phraseV":[{"t":0,"d":3,"deg":"R"},{"t":3,"d":3,"deg":"3"},{"t":6,"d":6,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":3,"deg":"2"},{"t":3,"d":3,"deg":"b2"},{"t":6,"d":6,"deg":"R"}]
    },
    { "id":"Melancholic-03","moods":["melancholic"],"type": "minor","tags":["slow-burn", "drone"],
      "phraseI":[{"t":0,"d":12,"deg":"b3"}],
      "phraseIV":[{"t":0,"d":12,"deg":"11"}],
      "phraseV":[{"t":0,"d":6,"deg":"5"},{"t":6,"d":6,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"b7"}]
    },
    { "id":"Melancholic-04","moods":["melancholic"],"type": "minor","tags":["shuffle", "expressive"],
      "phraseI":[{"t":0,"d":3,"deg":"2"},{"t":3,"d":3,"deg":"b3"},{"t":6,"d":6,"deg":"5"}],
      "phraseIV":[{"t":0,"d":3,"deg":"2"},{"t":3,"d":3,"deg":"4"},{"t":6,"d":6,"deg":"11"}],
      "phraseV":[{"t":0,"d":3,"deg":"2"},{"t":3,"d":3,"deg":"3"},{"t":6,"d":6,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":3,"deg":"b3"},{"t":3,"d":3,"deg":"2"},{"t":6,"d":6,"deg":"R"}]
    },
    { "id":"Melancholic-05","moods":["melancholic"],"type": "minor","tags":["slow-burn", "classic"],
      "phraseI":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"5"}],
      "phraseIV":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"11"}],
      "phraseV":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":3,"deg":"b5"},{"t":6,"d":6,"deg":"4"}],
      "phraseTurnaround":[{"t":0,"d":3,"deg":"b3"},{"t":3,"d":3,"deg":"2"},{"t":6,"d":3,"deg":"R"},{"t":9,"d":3,"deg":"b7"}]
    },

    { "id":"Gloomy-01","moods":["gloomy"],"type": "minor","tags":["swamp", "sparse"],
      "phraseI":[{"t":0,"d":12,"deg":"R"}],
      "phraseIV":[{"t":0,"deg":"R"},{"t":2,"deg":"b3"},{"t":4,"deg":"4"},{"t":6,"deg":"#4"},{"t":8,"deg":"4"},{"t":10,"deg":"b3"}],
      "phraseV":[{"t":0,"d":6,"deg":"5"},{"t":6,"d":6,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"deg":"R"},{"t":2,"deg":"b7"},{"t":4,"deg":"6"},{"t":6,"deg":"b6"},{"t":8,"deg":"5"},{"t":10,"deg":"#4"}]
    },
    { "id":"Gloomy-02","moods":["gloomy"],"type": "minor","tags":["swamp", "chromatic"],
      "phraseI":[{"t":0,"deg":"5"},{"t":2,"deg":"#4"},{"t":4,"deg":"6"},{"t":6,"deg":"b7"},{"t":8,"deg":"6"},{"t":10,"deg":"5"}],
      "phraseIV":[{"t":0,"deg":"4"},{"t":2,"deg":"b5"},{"t":4,"deg":"5"},{"t":6,"deg":"b5"},{"t":8,"deg":"4"},{"t":10,"deg":"b3"}],
      "phraseV":[{"t":0,"deg":"5"},{"t":2,"deg":"R"},{"t":4,"deg":"b7"},{"t":6,"deg":"5"},{"t":8,"deg":"R"},{"t":10,"deg":"5"}],
      "phraseTurnaround":[{"t":0,"deg":"R"},{"t":2,"deg":"b7"},{"t":4,"deg":"6"},{"t":6,"deg":"b6"},{"t":8,"deg":"5"},{"t":10,"deg":"#4"}]
    },
    { "id":"Gloomy-03","moods":["gloomy"],"type": "minor","tags":["shuffle", "heavy"],
      "phraseI":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"b7"}],
      "phraseIV":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"4"},{"t":8,"d":4,"deg":"b3"}],
      "phraseV":[{"t":0,"d":12,"deg":"5"}],
      "phraseTurnaround":[{"t":0,"deg":"R"},{"t":2,"deg":"b7"},{"t":4,"deg":"6"},{"t":6,"deg":"b6"},{"t":8,"deg":"5"},{"t":10,"deg":"#4"}]
    },
    { "id":"Gloomy-04","moods":["gloomy"],"type": "minor","tags":["slow-burn", "laid-back"],
      "phraseI":[{"t":0,"d":3,"deg":"b3"},{"t":3,"d":3,"deg":"3"},{"t":6,"d":6,"deg":"5"}],
      "phraseIV":[{"t":0,"d":3,"deg":"4"},{"t":3,"d":9,"deg":"9"}],
      "phraseV":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":9,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":3,"deg":"b3"},{"t":3,"d":9,"deg":"R"}]
    },
    { "id":"Gloomy-05","moods":["gloomy"],"type": "minor","tags":["slow-burn", "drone"],
      "phraseI":[{"t":0,"d":12,"deg":"R"}],
      "phraseIV":[{"t":0,"d":12,"deg":"11"}],
      "phraseV":[{"t":0,"d":6,"deg":"5"},{"t":6,"d":6,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"b7"}]
    },

    { "id":"Dark-01","moods":["dark", "anxious"],"type": "minor","tags":["shuffle", "heavy"],
      "phraseI":[{"t":0,"deg":"R"},{"t":2,"deg":"5"},{"t":4,"deg":"b6"},{"t":6,"deg":"6"},{"t":8,"deg":"5"},{"t":10,"deg":"R"}],
      "phraseIV":[{"t":0,"deg":"R"},{"t":2,"deg":"5"},{"t":4,"deg":"b6"},{"t":6,"deg":"6"},{"t":8,"deg":"5"},{"t":10,"deg":"R"}],
      "phraseV":[{"t":0,"deg":"5"},{"t":2,"deg":"b7"},{"t":4,"deg":"R"},{"t":6,"deg":"b7"},{"t":8,"deg":"5"},{"t":10,"deg":"R"}],
      "phraseTurnaround":[{"t":0,"deg":"R"},{"t":2,"deg":"b7"},{"t":4,"deg":"6"},{"t":6,"deg":"b6"},{"t":8,"deg":"5"},{"t":10,"deg":"#4"}]
    },
    { "id":"Dark-02","moods":["dark"],"type": "minor","tags":["slow-burn", "drone"],
      "phraseI":[{"t":0,"d":12,"deg":"b3"}],
      "phraseIV":[{"t":0,"d":12,"deg":"11"}],
      "phraseV":[{"t":0,"d":6,"deg":"5"},{"t":6,"d":6,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"b7"}]
    },
    { "id":"Dark-03","moods":["dark"],"type": "minor","tags":["shuffle", "dissonant"],
      "phraseI":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"5"}],
      "phraseIV":[{"t":0,"d":6,"deg":"11"},{"t":6,"d":6,"deg":"9"}],
      "phraseV":[{"t":0,"d":3,"deg":"b2"},{"t":3,"d":3,"deg":"R"},{"t":6,"d":6,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":3,"deg":"2"},{"t":3,"d":3,"deg":"b2"},{"t":6,"d":6,"deg":"R"}]
    },
    { "id":"Dark-04","moods":["dark"],"type": "minor","tags":["slow-burn", "tense"],
      "phraseI":[{"t":0,"d":3,"deg":"b3"},{"t":3,"d":3,"deg":"5"},{"t":6,"d":6,"deg":"b7"}],
      "phraseIV":[{"t":0,"d":3,"deg":"4"},{"t":3,"d":3,"deg":"11"},{"t":6,"d":6,"deg":"9"}],
      "phraseV":[{"t":0,"d":3,"deg":"5"},{"t":3,"d":3,"deg":"b5"},{"t":6,"d":6,"deg":"4"}],
      "phraseTurnaround":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"b7"}]
    },
    { "id":"Dark-05","moods":["dark"],"type": "minor","tags":["shuffle", "heavy"],
      "phraseI":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"R+8"}],
      "phraseIV":[{"t":0,"d":6,"deg":"R"},{"t":6,"d":6,"deg":"R+8"}],
      "phraseV":[{"t":0,"d":6,"deg":"5"},{"t":6,"d":6,"deg":"b7"}],
      "phraseTurnaround":[{"t":0,"d":4,"deg":"R"},{"t":4,"d":4,"deg":"b7"},{"t":8,"d":4,"deg":"R"}]
    }
  ]
;
