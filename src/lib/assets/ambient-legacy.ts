/**
 * @fileOverview Ambient Legacy Library (Digital DNA of the Giants)
 * #ЗАЧЕМ: Оцифрованный опыт великих мастеров амбиента и электроники.
 * #ЧТО: Библиотека длинных музыкальных фраз (2-4 такта), превращающая текстуру в мелодию.
 * #ОБНОВЛЕНО (ПЛАН №432): Добавлены Vangelis (Epic) и Jarre (Enthusiastic).
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
            { phrase: [{t:0,d:48,deg:'9',tech:'vb'}], tags: ['suspended', 'fragile'] }
        ]
    },

    // ───── VANGELIS: Majestic Scale (Epic) ─────
    VANG: {
        id: 'vang',
        name: 'Vangelis',
        preferredInstrument: 'organ',
        phrasing: 'legato',
        registerBias: -12,
        licks: [
            { phrase: [{t:0,d:24,deg:'R'}, {t:24,d:24,deg:'5'}], tags: ['majestic', 'anthem'] },
            { phrase: [{t:0,d:48,deg:'R',tech:'vb'}], tags: ['monolith'] },
            { phrase: [{t:0,d:12,deg:'R'}, {t:12,d:12,deg:'b7'}, {t:24,d:24,deg:'R'}], tags: ['mixolydian-glory'] }
        ]
    },

    // ───── JEAN-MICHEL JARRE: The Flow (Enthusiastic) ─────
    JARR: {
        id: 'jarr',
        name: 'Jean-Michel Jarre',
        preferredInstrument: 'synth',
        phrasing: 'glitch',
        registerBias: 12,
        licks: [
            { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'2'}, {t:6,d:3,deg:'3'}, {t:9,d:3,deg:'#4'}], tags: ['lydian-ascent'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'6'}, {t:12,d:6,deg:'R+8'}], tags: ['rising-energy'] },
            { phrase: [{t:0,d:2,deg:'R'}, {t:3,d:2,deg:'R'}, {t:6,d:2,deg:'R'}, {t:9,d:3,deg:'5'}], tags: ['pulse-life'] }
        ]
    },

    // ───── RITCHIE BLACKMORE / FAUN: Medieval Shadow ─────
    FOLK: {
        id: 'folk',
        name: 'Medieval Echoes',
        preferredInstrument: 'blackAcoustic',
        phrasing: 'staccato',
        registerBias: 0,
        licks: [
            { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:1,deg:'b2',tech:'gr'}, {t:4,d:8,deg:'R',tech:'vb'}], tags: ['ritual', 'dark-folk'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'b5',tech:'bn'}], tags: ['blackmore', 'shadow'] },
            { phrase: [{t:0,d:3,deg:'R'}, {t:6,d:3,deg:'4'}, {t:9,d:3,deg:'b3'}], tags: ['ancient', 'call'] }
        ]
    },

    // ───── BOARDS OF CANADA: Analog Memory ─────
    BOARDS: {
        id: 'boards',
        name: 'Boards of Canada',
        preferredInstrument: 'mellotron_strings',
        phrasing: 'sparse',
        registerBias: 0,
        licks: [
            { phrase: [{t:0,d:12,deg:'R',tech:'vb'}, {t:12,d:12,deg:'b7',tech:'vb'}, {t:24,d:24,deg:'R'}], tags: ['nostalgic', 'unstable'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:12,d:6,deg:'4'}, {t:24,d:6,deg:'b3'}, {t:36,d:12,deg:'R'}], tags: ['memory', 'decay'] }
        ]
    }
};
