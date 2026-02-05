/**
 * #ЗАЧЕМ: Этот файл содержит оцифрованную библиотеку блюзовых басовых риффов,
 *          сгруппированных по настроениям. Он служит "нотной грамотой" для
 *          FractalMusicEngine при генерации стилистически верных басовых партий.
 * #ЧТО: Экспортирует константу BLUES_BASS_RIFFS, где каждый ключ — это настроение,
 *       а значение — массив риффов, подходящих для этого настроения.
 * #СВЯЗИ: Используется в `fractal-music-engine.ts` функцией `generateBluesBassRiff`.
 */

import type { BluesBassRiff, Mood } from '@/types/fractal';

export const BLUES_BASS_RIFFS: Record<Mood, BluesBassRiff[]> = {
    joyful: [
        { // Riff J1 — Classic light boogie
            I:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}],
            IV: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}],
            V:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        },
        { // Riff J2 — Two‑feel с октавой
            I:  [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'5'},{t:8,d:4,deg:'R+8'}],
            IV: [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'6'},{t:8,d:4,deg:'5'}],
            V:  [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'b7'},{t:8,d:4,deg:'5'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        },
        { // Riff J3 — Позитивный подъём к 6
            I:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'6'}],
            IV: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'6'}],
            V:  [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'R'}],
            turn: [{t:0,d:2,deg:'2'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'4'},{t:8,d:2,deg:'#4'},{t:10,d:2,deg:'5'}]
        }
    ],
    enthusiastic: [
        { // Riff E1 — Drive shuffle
            I:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'R'}],
            IV: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'R'}],
            V:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'R'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        },
        { // Riff E2 — Лёгкий «галоп» в конце бара
            I:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:3,deg:'b7'},{t:9,d:2,deg:'6'},{t:11,d:1,deg:'5'}],
            IV: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:3,deg:'b7'},{t:9,d:2,deg:'6'},{t:11,d:1,deg:'5'}],
            V:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:3,deg:'b7'},{t:9,d:2,deg:'6'},{t:11,d:1,deg:'5'}],
            turn: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'6'},{t:9,d:3,deg:'5'}]
        },
        { // Riff E3 — Ответ от 4 к 6
            I:  [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'4'},{t:8,d:4,deg:'6'}],
            IV: [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'5'},{t:8,d:4,deg:'6'}],
            V:  [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'b7'},{t:8,d:4,deg:'5'}],
            turn: [{t:0,d:2,deg:'2'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'4'},{t:8,d:2,deg:'#4'},{t:10,d:2,deg:'5'}]
        }
    ],
    contemplative: [ // Mapped from Neutral
        { // Riff N1 — Чистый boogie‑6
            I:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}],
            IV: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}],
            V:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:4,deg:'b7'},{t:6,d:4,deg:'6'},{t:10,d:2,deg:'5'}]
        },
        { // Riff N2 — Two‑feel basic
            I:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'5'}],
            IV: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'3'}],
            V:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        },
        { // Riff N3 — Плотность на конце
            I:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}],
            IV: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}],
            V:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:4,deg:'b7'},{t:6,d:4,deg:'6'},{t:10,d:2,deg:'5'}]
        }
    ],
    dreamy: [
        { // Riff D1 — Тёплая педаль + мягкий ход
            I:  [{t:0,d:12,deg:'R'}],
            IV: [{t:0,d:4,deg:'6'},{t:4,d:4,deg:'5'},{t:8,d:4,deg:'2'}],
            V:  [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'R'}],
            turn: [{t:0,d:4,deg:'6'},{t:4,d:4,deg:'5'},{t:8,d:4,deg:'R'}]
        },
        { // Riff D2 — Октавы «вздохом»
            I:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8'}],
            IV: [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'6'}],
            V:  [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'R'}],
            turn: [{t:0,d:2,deg:'2'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'4'},{t:8,d:2,deg:'#4'},{t:10,d:2,deg:'5'}]
        },
        { // Riff D3 — 9 как «пятно света»
            I:  [{t:0,d:4,deg:'9'},{t:4,d:8,deg:'R'}],
            IV: [{t:0,d:6,deg:'6'},{t:6,d:6,deg:'5'}],
            V:  [{t:0,d:4,deg:'9'},{t:4,d:8,deg:'5'}],
            turn: [{t:0,d:6,deg:'2'},{t:6,d:6,deg:'R'}]
        }
    ],
    calm: [
        { // Riff C1 — Минимум движений
            I:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'5'}],
            IV: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'3'}],
            V:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}],
            turn: [{t:0,d:4,deg:'6'},{t:4,d:4,deg:'5'},{t:8,d:4,deg:'R'}]
        },
        { // Riff C2 — Тихий two‑feel с ответом
            I:  [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'5'},{t:8,d:4,deg:'R+8'}],
            IV: [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'6'},{t:8,d:4,deg:'5'}],
            V:  [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'b7'},{t:8,d:4,deg:'5'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        },
        { // Riff C3 — Длинные R/5
            I:  [{t:0,d:12,deg:'R'}],
            IV: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'5'}],
            V:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}],
            turn: [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'b7'},{t:8,d:4,deg:'R'}]
        }
    ],
    melancholic: [
        { // Riff M1 — Slow minor boogie (Swing)
            I:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}],
            IV: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}],
            V:  [{t:0,d:2,deg:'5'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'R'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'R'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        },
        { // Riff M2 — b3 и 11 как опоры (Shuffle)
            I:  [{t:0,d:6,deg:'b3'},{t:6,d:6,deg:'11'}],
            IV: [{t:0,d:6,deg:'b3'},{t:6,d:6,deg:'9'}],
            V:  [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'b7'}],
            turn: [{t:0,d:6,deg:'b7'},{t:6,d:6,deg:'R'}]
        },
        { // Riff M3 — Walking Bass (Slow)
            I:  [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3'},{t:6,d:3,deg:'5'},{t:9,d:3,deg:'6'}],
            IV: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3'},{t:6,d:3,deg:'5'},{t:9,d:3,deg:'6'}],
            V:  [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3'},{t:6,d:3,deg:'5'},{t:9,d:3,deg:'b7'}],
            turn: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'6'},{t:9,d:3,deg:'5'}]
        }
    ],
    gloomy: [
        { // Riff G1 — Swamp pedal + «грязь»
            I:  [{t:0,d:12,deg:'R'}],
            IV: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'4'},{t:6,d:2,deg:'#4'},{t:8,d:2,deg:'4'},{t:10,d:2,deg:'b3'}],
            V:  [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'b7'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        },
        { // Riff G2 — Ползучая хроматика
            I:  [{t:0,d:2,deg:'5'},{t:2,d:2,deg:'#4'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}],
            IV: [{t:0,d:2,deg:'4'},{t:2,d:2,deg:'b5'},{t:4,d:2,deg:'5'},{t:6,d:2,deg:'b5'},{t:8,d:2,deg:'4'},{t:10,d:2,deg:'b3'}],
            V:  [{t:0,d:2,deg:'5'},{t:2,d:2,deg:'R'},{t:4,d:2,deg:'b7'},{t:6,d:2,deg:'5'},{t:8,d:2,deg:'R'},{t:10,d:2,deg:'5'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        },
        { // Riff G3 — Низкий turn с паузами
            I:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}],
            IV: [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'4'},{t:8,d:4,deg:'b3'}],
            V:  [{t:0,d:12,deg:'5'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        }
    ],
    dark: [
        { // Riff K1 — Тяжёлый up‑down (Shuffle)
            I:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'b6'},{t:6,d:2,deg:'6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'R'}],
            IV: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'b6'},{t:6,d:2,deg:'6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'R'}],
            V:  [{t:0,d:2,deg:'5'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'R'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'R'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        },
        { // Riff K2 — Walking Bass (Chrom)
            I:  [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b3'},{t:6,d:3,deg:'4'},{t:9,d:3,deg:'#4'}],
            IV: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b3'},{t:6,d:3,deg:'4'},{t:9,d:3,deg:'#4'}],
            V:  [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'R'},{t:9,d:3,deg:'b2'}],
            turn: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'6'},{t:9,d:3,deg:'5'}]
        },
        { // Riff K3 — Тензии к V (b2/b9)
            I:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'5'}],
            IV: [{t:0,d:6,deg:'11'},{t:6,d:6,deg:'9'}],
            V:  [{t:0,d:3,deg:'b2'},{t:3,d:3,deg:'R'},{t:6,d:6,deg:'b7'}],
            turn: [{t:0,d:2,deg:'2'},{t:2,d:2,deg:'b2'},{t:4,d:8,deg:'R'}]
        }
    ],
    epic: [],
    anxious: [],
};

BLUES_BASS_RIFFS.epic = BLUES_BASS_RIFFS.joyful;
BLUES_BASS_RIFFS.anxious = BLUES_BASS_RIFFS.dark;
