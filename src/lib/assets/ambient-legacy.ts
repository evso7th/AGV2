/**
 * @fileOverview Ambient Legacy Library (Digital DNA of the Giants)
 * #ЗАЧЕМ: Оцифрованный опыт великих мастеров амбиента и электроники.
 * #ЧТО: Библиотека длинных музыкальных фраз (2-4 такта), превращающая текстуру в мелодию.
 * #ОБНОВЛЕНО (ПЛАН №411): Добавлена династия BUDD (Harold Budd) для "светлой печали".
 */

import type { BluesSoloPhrase } from '@/types/music';

export type LegacyGroup = {
    id: string;
    name: string;
    preferredInstrument: string;
    phrasing: 'legato' | 'staccato' | 'glitch' | 'sparse';
    registerBias: number;
    licks: { phrase: BluesSoloPhrase; tags: string[] }[];
};

export const AMBIENT_LEGACY: Record<string, LegacyGroup> = {
    // ───── HAROLD BUDD: The Soft Touch (Piano Drops) ─────
    BUDD: {
        id: 'budd',
        name: 'Harold Budd',
        preferredInstrument: 'piano',
        phrasing: 'sparse',
        registerBias: 0,
        licks: [
            { phrase: [{t:0,d:12,deg:'R',tech:'vb'}, {t:24,d:24,deg:'6'}], tags: ['light-sadness', 'hope'] },
            { phrase: [{t:6,d:18,deg:'9'}, {t:30,d:18,deg:'5'}], tags: ['comfort', 'whiskey-morning'] },
            { phrase: [{t:0,d:24,deg:'R'}, {t:24,d:6,deg:'b7'}, {t:30,d:18,deg:'6'}], tags: ['dorian-light', 'melancholy'] },
            { phrase: [{t:0,d:4,deg:'5'}, {t:12,d:4,deg:'6'}, {t:24,d:4,deg:'R+8'}, {t:36,d:12,deg:'5'}], tags: ['raindrops', 'morning'] },
            { phrase: [{t:0,d:48,deg:'9',tech:'vb'}], tags: ['suspended', 'fragile'] },
            { phrase: [{t:0,d:12,deg:'R'}, {t:18,d:12,deg:'4'}, {t:36,d:12,deg:'3'}], tags: ['resignation', 'peace'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:12,d:6,deg:'6'}, {t:24,d:24,deg:'R',tech:'vb'}], tags: ['rising-hope'] },
            { phrase: [{t:0,d:24,deg:'R'}, {t:30,d:18,deg:'b3'}], tags: ['deep-sigh'] },
            { phrase: [{t:12,d:12,deg:'R'}, {t:24,d:12,deg:'2'}, {t:36,d:12,deg:'R'}], tags: ['minimal', 'stable'] },
            { phrase: [{t:0,d:12,deg:'5'}, {t:24,d:24,deg:'6',tech:'vb'}], tags: ['shimmering-comfort'] },
            { phrase: [{t:0,d:6,deg:'R'}, {t:12,d:6,deg:'9'}, {t:24,d:6,deg:'R'}, {t:36,d:12,deg:'5'}], tags: ['echo-of-party'] },
            { phrase: [{t:0,d:24,deg:'4'}, {t:24,d:24,deg:'R'}], tags: ['final-breath'] },
            { phrase: [{t:0,d:3,deg:'R'}, {t:12,d:3,deg:'5'}, {t:24,d:3,deg:'6'}, {t:36,d:12,deg:'R'}], tags: ['gentle-steps'] },
            { phrase: [{t:0,d:12,deg:'b7'}, {t:12,d:12,deg:'6'}, {t:24,d:24,deg:'5'}], tags: ['fading-light'] },
            { phrase: [{t:0,d:48,deg:'R',tech:'vb'}], tags: ['stillness'] }
        ]
    },

    // ───── BRIAN ENO: Generative Stillness ─────
    ENO: {
        id: 'eno',
        name: 'Brian Eno',
        preferredInstrument: 'ep_rhodes_warm',
        phrasing: 'sparse',
        registerBias: 12,
        licks: [
            { phrase: [{t:0,d:12,deg:'R',tech:'vb'}, {t:24,d:12,deg:'5',tech:'vb'}], tags: ['stillness', 'fifth'] },
            { phrase: [{t:0,d:6,deg:'9'}, {t:12,d:18,deg:'R',tech:'vb'}, {t:36,d:6,deg:'b7'}], tags: ['floating', 'long-hold'] },
            { phrase: [{t:0,d:4,deg:'5',tech:'gr'}, {t:4,d:20,deg:'R'}, {t:30,d:12,deg:'b3'}], tags: ['minimal', 'minor-touch'] },
            { phrase: [{t:6,d:18,deg:'R',tech:'vb'}, {t:30,d:18,deg:'5',tech:'vb'}], tags: ['patience', 'breathing'] },
            { phrase: [{t:0,d:3,deg:'R'}, {t:12,d:3,deg:'R'}, {t:24,d:3,deg:'R'}, {t:36,d:12,deg:'5'}], tags: ['raindrops', 'rhythmic'] },
            { phrase: [{t:0,d:24,deg:'9',tech:'vb'}, {t:24,d:24,deg:'R',tech:'vb'}], tags: ['suspended', 'pure'] },
            { phrase: [{t:0,d:12,deg:'5'}, {t:12,d:12,deg:'4'}, {t:24,d:24,deg:'R'}], tags: ['descent', 'melancholy'] },
            { phrase: [{t:0,d:12,deg:'R'}, {t:18,d:12,deg:'b7'}, {t:30,d:18,deg:'R'}], tags: ['cycle', 'echo'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:12,d:6,deg:'b7'}, {t:24,d:24,deg:'R+8',tech:'vb'}], tags: ['soaring', 'ascent'] },
            { phrase: [{t:0,d:12,deg:'R',tech:'vb'}, {t:36,d:12,deg:'R',tech:'vb'}], tags: ['void', 'space'] },
            { phrase: [{t:0,d:18,deg:'R'}, {t:24,d:6,deg:'9'}, {t:36,d:12,deg:'5'}], tags: ['peaceful', 'stable'] },
            { phrase: [{t:12,d:12,deg:'5'}, {t:24,d:12,deg:'b7'}, {t:36,d:12,deg:'R'}], tags: ['late-call', 'echo'] },
            { phrase: [{t:0,d:24,deg:'4'}, {t:24,d:24,deg:'R'}], tags: ['sigh', 'tension-free'] },
            { phrase: [{t:0,d:6,deg:'R'}, {t:6,d:6,deg:'b3'}, {t:12,d:6,deg:'4'}, {t:18,d:30,deg:'5'}], tags: ['soft-climb', 'morning'] },
            { phrase: [{t:0,d:48,deg:'R',tech:'vb'}], tags: ['monolith', 'eternity'] }
        ]
    },

    // ───── MIKE OLDFIELD: Tubular Folk ─────
    OLDFIELD: {
        id: 'oldfield',
        name: 'Mike Oldfield',
        preferredInstrument: 'synth',
        phrasing: 'staccato',
        registerBias: 12,
        licks: [
            { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'2'}, {t:6,d:3,deg:'b3'}, {t:9,d:3,deg:'5'}, {t:12,d:12,deg:'R',tech:'vb'}], tags: ['incantations', 'climb'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'R'}, {t:12,d:6,deg:'5'}, {t:18,d:6,deg:'R'}, {t:24,d:24,deg:'b7'}], tags: ['bell-pattern', 'ostinato'] },
            { phrase: [{t:0,d:3,deg:'R'}, {t:6,d:3,deg:'b7'}, {t:12,d:3,deg:'5'}, {t:18,d:3,deg:'4'}, {t:24,d:24,deg:'R'}], tags: ['crystalline', 'clear'] },
            { phrase: [{t:0,d:2,deg:'R'}, {t:4,d:2,deg:'5'}, {t:8,d:4,deg:'R+8'}, {t:12,d:36,deg:'R',tech:'vb'}], tags: ['tubular', 'peaks'] },
            { phrase: [{t:0,d:6,deg:'R'}, {t:12,d:6,deg:'2'}, {t:24,d:6,deg:'b3'}, {t:36,d:12,deg:'5'}], tags: ['songs-of-earth', 'major'] },
            { phrase: [{t:0,d:12,deg:'5',tech:'vb'}, {t:12,d:12,deg:'b7'}, {t:24,d:24,deg:'R'}], tags: ['folklore', 'soul'] },
            { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'5'}, {t:6,d:3,deg:'R'}, {t:9,d:3,deg:'5'}, {t:12,d:3,deg:'R'}], tags: ['pulsar', 'mechanical'] },
            { phrase: [{t:0,d:6,deg:'b3'}, {t:6,d:6,deg:'4'}, {t:12,d:6,deg:'5'}, {t:18,d:30,deg:'R',tech:'vb'}], tags: ['climb-up', 'resolved'] },
            { phrase: [{t:0,d:4,deg:'5'}, {t:8,d:4,deg:'b7'}, {t:16,d:4,deg:'R+8'}, {t:24,d:24,deg:'5'}], tags: ['sky-theme', 'airy'] },
            { phrase: [{t:0,d:12,deg:'R'}, {t:24,d:3,deg:'5'}, {t:27,d:3,deg:'4'}, {t:30,d:18,deg:'R'}], tags: ['legacy-end', 'final'] },
            { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b3'}, {t:6,d:3,deg:'4'}, {t:9,d:3,deg:'b5'}, {t:12,d:12,deg:'5'}], tags: ['dark-ritual', 'minor'] },
            { phrase: [{t:0,d:6,deg:'R'}, {t:12,d:6,deg:'5'}, {t:24,d:6,deg:'R'}, {t:36,d:12,deg:'b7'}], tags: ['bell-echo', 'spaced'] },
            { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'2'}, {t:4,d:2,deg:'b3'}, {t:6,d:6,deg:'R'}], tags: ['quick-flick', 'ornament'] },
            { phrase: [{t:0,d:12,deg:'5'}, {t:12,d:12,deg:'4'}, {t:24,d:12,deg:'b3'}, {t:36,d:12,deg:'R'}], tags: ['long-descent', 'melodic'] },
            { phrase: [{t:0,d:3,deg:'R'}, {t:6,d:3,deg:'5'}, {t:12,d:3,deg:'R+8'}, {t:18,d:30,deg:'5'}], tags: ['wide-spread', 'soaring'] }
        ]
    },

    // ───── BOARDS OF CANADA: Analog Memory ─────
    BOARDS: {
        id: 'boards',
        name: 'Boards of Canada',
        preferredInstrument: 'mellotron_strings',
        phrasing: 'legate',
        registerBias: 0,
        licks: [
            { phrase: [{t:0,d:12,deg:'R',tech:'vb'}, {t:12,d:12,deg:'b7',tech:'vb'}, {t:24,d:24,deg:'R'}], tags: ['nostalgic', 'unstable'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:12,d:6,deg:'4'}, {t:24,d:6,deg:'b3'}, {t:36,d:12,deg:'R'}], tags: ['memory', 'decay'] },
            { phrase: [{t:0,d:9,deg:'R'}, {t:12,d:9,deg:'9'}, {t:24,d:24,deg:'5'}], tags: ['childhood', 'simple'] },
            { phrase: [{t:0,d:18,deg:'b3',tech:'sl'}, {t:24,d:24,deg:'R',tech:'vb'}], tags: ['warm', 'organic'] },
            { phrase: [{t:0,d:6,deg:'R'}, {t:6,d:6,deg:'b7'}, {t:12,d:6,deg:'R'}, {t:18,d:6,deg:'b7'}, {t:24,d:24,deg:'5'}], tags: ['cycles', 'nature'] },
            { phrase: [{t:0,d:12,deg:'5'}, {t:12,d:12,deg:'b6'}, {t:24,d:24,deg:'5'}], tags: ['liminal', 'mystery'] },
            { phrase: [{t:0,d:4,deg:'R'}, {t:8,d:4,deg:'b3'}, {t:16,d:4,deg:'R'}, {t:24,d:24,deg:'b7'}], tags: ['skyline', 'dawn'] },
            { phrase: [{t:0,d:24,deg:'R',tech:'vb'}, {t:24,d:24,deg:'b3',tech:'vb'}], tags: ['two-notes', 'eternal'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'4'}, {t:12,d:6,deg:'5'}, {t:18,d:6,deg:'4'}, {t:24,d:24,deg:'R'}], tags: ['rock-pool', 'static'] },
            { phrase: [{t:0,d:12,deg:'R'}, {t:12,d:12,deg:'b7'}, {t:24,d:12,deg:'b6'}, {t:36,d:12,deg:'5'}], tags: ['twilight', 'fade'] },
            { phrase: [{t:0,d:18,deg:'R'}, {t:18,d:6,deg:'9'}, {t:24,d:24,deg:'R'}], tags: ['haze', 'analog'] },
            { phrase: [{t:0,d:12,deg:'5'}, {t:12,d:12,deg:'b7'}, {t:24,d:24,deg:'R'}], tags: ['distant', 'hills'] },
            { phrase: [{t:0,d:6,deg:'R'}, {t:12,d:6,deg:'b3'}, {t:24,d:24,deg:'5'}], tags: ['glimpse', 'sun'] },
            { phrase: [{t:0,d:24,deg:'4',tech:'sl'}, {t:24,d:24,deg:'3'}], tags: ['blurred', 'lines'] },
            { phrase: [{t:0,d:12,deg:'R'}, {t:24,d:12,deg:'b7'}, {t:36,d:12,deg:'R'}], tags: ['revolving', 'circle'] }
        ]
    },

    // ───── CBL (Carbon Based Lifeforms): Space Pulse ─────
    CBL: {
        id: 'cbl',
        name: 'Carbon Based Lifeforms',
        preferredInstrument: 'synth_ambient_pad_lush',
        phrasing: 'legato',
        registerBias: -12,
        licks: [
            { phrase: [{t:0,d:24,deg:'R',tech:'vb'}, {t:24,d:24,deg:'5',tech:'vb'}], tags: ['abyss', 'deep-space'] },
            { phrase: [{t:0,d:4,deg:'R'}, {t:12,d:4,deg:'5'}, {t:24,d:4,deg:'8'}, {t:36,d:12,deg:'5'}], tags: ['interloper', 'pulsar'] },
            { phrase: [{t:0,d:48,deg:'R',tech:'vb'}], tags: ['void', 'eternal-one'] },
            { phrase: [{t:0,d:6,deg:'R'}, {t:6,d:6,deg:'b3'}, {t:12,d:6,deg:'R'}, {t:18,d:6,deg:'b3'}, {t:24,d:24,deg:'5'}], tags: ['photosynthesis', 'growth'] },
            { phrase: [{t:0,d:12,deg:'5'}, {t:12,d:12,deg:'b7'}, {t:24,d:12,deg:'R+8'}, {t:36,d:12,deg:'5'}], tags: ['orbit', 'circular'] },
            { phrase: [{t:0,d:3,deg:'R'}, {t:6,d:3,deg:'R'}, {t:12,d:3,deg:'R'}, {t:24,d:24,deg:'b3'}], tags: ['under-surface', 'dark'] },
            { phrase: [{t:0,d:12,deg:'R',tech:'sl'}, {t:12,d:12,deg:'b7',tech:'sl'}, {t:24,d:24,deg:'5'}], tags: ['vector', 'motion'] },
            { phrase: [{t:0,d:6,deg:'R'}, {t:12,d:6,deg:'9'}, {t:24,d:6,deg:'R'}, {t:36,d:12,deg:'5'}], tags: ['starlight', 'shimmer'] },
            { phrase: [{t:0,d:24,deg:'5'}, {t:24,d:24,deg:'R'}], tags: ['breath', 'atmosphere'] },
            { phrase: [{t:0,d:12,deg:'R'}, {t:12,d:12,deg:'b3'}, {t:24,d:12,deg:'4'}, {t:36,d:12,deg:'5'}], tags: ['climb', 'cosmic'] },
            { phrase: [{t:0,d:12,deg:'R'}, {t:24,d:24,deg:'R'}], tags: ['static', 'beacon'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:12,d:18,deg:'R'}, {t:36,d:12,deg:'b7'}], tags: ['path', 'found'] },
            { phrase: [{t:0,d:24,deg:'9'}, {t:24,d:24,deg:'R'}], tags: ['dust', 'particle'] },
            { phrase: [{t:0,d:12,deg:'R'}, {t:12,d:12,deg:'b2'}, {t:24,d:24,deg:'R'}], tags: ['exoplanet', 'strange'] },
            { phrase: [{t:0,d:48,deg:'5',tech:'vb'}], tags: ['sun', 'giant'] }
        ]
    },

    // ───── MANFRED MANN: Progressive Soul ─────
    MANN: {
        id: 'mann',
        name: 'Manfred Mann',
        preferredInstrument: 'organ_soft_jazz',
        phrasing: 'legato',
        registerBias: 0,
        licks: [
            { phrase: [{t:0,d:6,deg:'R'}, {t:6,d:6,deg:'b3',tech:'sl'}, {t:12,d:36,deg:'4',tech:'vb'}], tags: ['earth-band', 'vocal-like'] },
            { phrase: [{t:0,d:12,deg:'5'}, {t:12,d:6,deg:'b7'}, {t:18,d:30,deg:'R',tech:'sl'}], tags: ['solo', 'bluesy-ambient'] },
            { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b3'}, {t:6,d:3,deg:'4'}, {t:9,d:39,deg:'5',tech:'bn'}], tags: ['prog', 'climbing'] },
            { phrase: [{t:0,d:12,deg:'R',tech:'vb'}, {t:12,d:12,deg:'b7'}, {t:24,d:24,deg:'R'}], tags: ['hammond', 'warm'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'b5',tech:'bn'}, {t:12,d:36,deg:'4',tech:'vb'}], tags: ['tension', 'release'] },
            { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'b3'}, {t:8,d:4,deg:'4'}, {t:12,d:36,deg:'5'}], tags: ['classic-rock-blues', 'stable'] },
            { phrase: [{t:0,d:12,deg:'R'}, {t:12,d:12,deg:'b2',tech:'sl'}, {t:24,d:24,deg:'R'}], tags: ['exotic', 'modal'] },
            { phrase: [{t:0,d:6,deg:'R'}, {t:12,d:6,deg:'b7'}, {t:24,d:6,deg:'6'}, {t:36,d:12,deg:'5'}], tags: ['sophisticated', 'jazzy'] },
            { phrase: [{t:0,d:24,deg:'5',tech:'vb'}, {t:24,d:24,deg:'R',tech:'vb'}], tags: ['soulful', 'deep'] },
            { phrase: [{t:0,d:3,deg:'R'}, {t:12,d:12,deg:'b3',tech:'h'}, {t:24,d:24,deg:'R'}], tags: ['motive', 'breathing'] },
            { phrase: [{t:0,d:12,deg:'R'}, {t:18,d:6,deg:'b7'}, {t:24,d:24,deg:'5'}], tags: ['walk', 'evening'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'b7'}, {t:12,d:12,deg:'R+8'}, {t:24,d:24,deg:'5'}], tags: ['horizon', 'search'] },
            { phrase: [{t:0,d:24,deg:'R',tech:'vb'}, {t:36,d:12,deg:'b3'}], tags: ['heavy', 'thought'] },
            { phrase: [{t:0,d:12,deg:'5'}, {t:12,d:12,deg:'4',tech:'sl'}, {t:24,d:24,deg:'R'}], tags: ['resolved', 'calm'] },
            { phrase: [{t:0,d:6,deg:'R'}, {t:12,d:6,deg:'9'}, {t:24,d:24,deg:'R'}], tags: ['light', 'touch'] }
        ]
    },

    // ───── APEX TWIN: Fragile Geometry ─────
    APHEX: {
        id: 'aphex',
        name: 'Aphex Twin',
        preferredInstrument: 'theremin',
        phrasing: 'glitch',
        registerBias: 12,
        licks: [
            { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:1,deg:'b2',tech:'gr'}, {t:3,d:45,deg:'R',tech:'vb'}], tags: ['microtonal', 'eerie'] },
            { phrase: [{t:0,d:1,deg:'R'}, {t:3,d:1,deg:'b2'}, {t:6,d:1,deg:'R'}, {t:12,d:36,deg:'b5',tech:'bn'}], tags: ['geometric', 'strange'] },
            { phrase: [{t:0,d:12,deg:'5'}, {t:12,d:12,deg:'b5',tech:'bn'}, {t:24,d:24,deg:'4'}], tags: ['acid', 'fragile'] },
            { phrase: [{t:0,d:3,deg:'R'}, {t:12,d:3,deg:'b2'}, {t:24,d:3,deg:'R'}, {t:36,d:12,deg:'b7'}], tags: ['robotic', 'sad'] },
            { phrase: [{t:0,d:2,deg:'R'}, {t:6,d:2,deg:'R+8'}, {t:12,d:36,deg:'R'}], tags: ['jump', 'echo'] },
            { phrase: [{t:0,d:6,deg:'5',tech:'vb'}, {t:12,d:6,deg:'b2'}, {t:24,d:24,deg:'R'}], tags: ['ambient-works', 'twilight'] },
            { phrase: [{t:0,d:1,deg:'R'}, {t:1,d:1,deg:'b3'}, {t:2,d:1,deg:'4'}, {t:3,d:1,deg:'b5'}, {t:4,d:44,deg:'5'}], tags: ['run', 'climb'] },
            { phrase: [{t:0,d:24,deg:'R',tech:'vb'}, {t:24,d:24,deg:'b7',tech:'vb'}], tags: ['drift', 'digital-sea'] },
            { phrase: [{t:0,d:12,deg:'R'}, {t:12,d:12,deg:'9'}, {t:24,d:24,deg:'R'}], tags: ['melody', 'dream'] },
            { phrase: [{t:0,d:12,deg:'5'}, {t:24,d:12,deg:'4'}, {t:36,d:12,deg:'R'}], tags: ['simple', 'pure'] },
            { phrase: [{t:0,d:1,deg:'R'}, {t:6,d:1,deg:'b2'}, {t:12,d:1,deg:'R'}, {t:18,d:30,deg:'b5'}], tags: ['point', 'line'] },
            { phrase: [{t:0,d:24,deg:'5'}, {t:24,d:6,deg:'b5'}, {t:30,d:18,deg:'R'}], tags: ['distorted', 'beauty'] },
            { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b2'}, {t:6,d:3,deg:'R'}, {t:9,d:39,deg:'9'}], tags: ['pattern', 'abstract'] },
            { phrase: [{t:0,d:12,deg:'R'}, {t:12,d:12,deg:'b7'}, {t:24,d:24,deg:'R+8'}], tags: ['vertical', 'axis'] },
            { phrase: [{t:0,d:48,deg:'R',tech:'sl'}], tags: ['slide-infinite', 'blue'] }
        ]
    }
};
