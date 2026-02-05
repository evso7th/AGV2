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
        { // Riff J2 — Walking Bass Up
            I:  [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'2'},{t:6,d:3,deg:'3'},{t:9,d:3,deg:'5'}],
            IV: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'2'},{t:6,d:3,deg:'3'},{t:9,d:3,deg:'5'}],
            V:  [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'2'},{t:6,d:3,deg:'3'},{t:9,d:3,deg:'5'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        }
    ],
    enthusiastic: [
        { // Riff E1 — Drive shuffle
            I:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'R'}],
            IV: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'R'}],
            V:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'R'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        }
    ],
    contemplative: [ 
        { // Riff N1 — Chicago Walking
            I:  [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3'},{t:6,d:3,deg:'5'},{t:9,d:3,deg:'6'}],
            IV: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3'},{t:6,d:3,deg:'5'},{t:9,d:3,deg:'6'}],
            V:  [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3'},{t:6,d:3,deg:'5'},{t:9,d:3,deg:'b7'}],
            turn: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'6'},{t:9,d:3,deg:'5'}]
        }
    ],
    dreamy: [
        { // Riff D1 — Long Floating
            I:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'5'}],
            IV: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'3'}],
            V:  [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'R'}],
            turn: [{t:0,d:6,deg:'6'},{t:6,d:6,deg:'5'}]
        }
    ],
    calm: [
        { // Riff C1 — Two Feel
            I:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'5'}],
            IV: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'3'}],
            V:  [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}],
            turn: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'b7'}]
        }
    ],
    melancholic: [
        { // Riff M1 — Heavy Slow Walking (The Alvin Lee Base)
            I:  [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b3'},{t:6,d:3,deg:'4'},{t:9,d:3,deg:'#4'}],
            IV: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b3'},{t:6,d:3,deg:'4'},{t:9,d:3,deg:'#4'}],
            V:  [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'R'},{t:9,d:3,deg:'b2'}],
            turn: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'6'},{t:9,d:3,deg:'5'}]
        },
        { // Riff M2 — Soul Shuffle
            I:  [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'R'},{t:6,d:2,deg:'5'},{t:8,d:2,deg:'b7'},{t:10,d:2,deg:'5'}],
            IV: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'R'},{t:6,d:2,deg:'5'},{t:8,d:2,deg:'b7'},{t:10,d:2,deg:'5'}],
            V:  [{t:0,d:2,deg:'5'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'R'},{t:6,d:2,deg:'b7'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'R'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        }
    ],
    gloomy: [
        { // Riff G1 — Swamp Crawler
            I:  [{t:0,d:12,deg:'R'}],
            IV: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b3'},{t:6,d:3,deg:'4'},{t:9,d:3,deg:'b5'}],
            V:  [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'b7'}],
            turn: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}]
        }
    ],
    dark: [
        { // Riff K1 — Heavy Walking Chromatic
            I:  [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b3'},{t:6,d:3,deg:'4'},{t:9,d:3,deg:'#4'}],
            IV: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b3'},{t:6,d:3,deg:'4'},{t:9,d:3,deg:'#4'}],
            V:  [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'R'},{t:9,d:3,deg:'b2'}],
            turn: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:3,deg:'6'},{t:9,d:3,deg:'5'}]
        }
    ],
    epic: [],
    anxious: [],
};

BLUES_BASS_RIFFS.epic = BLUES_BASS_RIFFS.joyful;
BLUES_BASS_RIFFS.anxious = BLUES_BASS_RIFFS.dark;
