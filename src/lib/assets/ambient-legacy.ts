/**
 * @fileOverview Ambient Legacy Library (Digital DNA of the Giants)
 * #ЗАЧЕМ: Оцифрованный опыт великих мастеров амбиента и электроники.
 * #ЧТО: Группы ликов и паттернов, отражающие характерные приемы Олдфилда, Жарра, Ино и др.
 * #СВЯЗИ: Используется в `AmbientBrain` для семантической генерации.
 */

import type { BluesSoloPhrase } from '@/types/fractal';

export type LegacyGroup = {
    id: string;
    name: string;
    licks: { phrase: BluesSoloPhrase; tags: string[] }[];
};

export const AMBIENT_LEGACY: Record<string, LegacyGroup> = {
    OLDFIELD: {
        id: 'oldfield',
        name: 'Mike Oldfield',
        licks: [
            { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'5'}, {t:6,d:3,deg:'R+8'}, {t:9,d:3,deg:'7'}], tags: ['bells', 'nested'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:2,deg:'6'}, {t:8,d:2,deg:'7'}, {t:10,d:2,deg:'R+8'}], tags: ['ethnic', 'climb'] }
        ]
    },
    JARRE: {
        id: 'jarre',
        name: 'Jean-Michel Jarre',
        licks: [
            { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'5'}, {t:4,d:2,deg:'R'}, {t:6,d:2,deg:'5'}, {t:8,d:4,deg:'b7'}], tags: ['laser', 'pulse'] },
            { phrase: [{t:0,d:3,deg:'5'}, {t:3,d:3,deg:'b7'}, {t:6,d:3,deg:'R+8'}, {t:9,d:3,deg:'9'}], tags: ['oxygen', 'sweep'] }
        ]
    },
    ENO: {
        id: 'eno',
        name: 'Brian Eno',
        licks: [
            { phrase: [{t:0,d:12,deg:'R',tech:'vb'}], tags: ['generative', 'sparse'] },
            { phrase: [{t:4,d:8,deg:'9'}, {t:0,d:4,deg:'5'}], tags: ['piano', 'drops'] }
        ]
    },
    KRAFTWERK: {
        id: 'kraftwerk',
        name: 'Kraftwerk',
        licks: [
            { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'R'}, {t:6,d:3,deg:'R'}, {t:9,d:3,deg:'5'}], tags: ['mechanical', 'pure'] },
            { phrase: [{t:0,d:2,deg:'R'}, {t:3,d:2,deg:'2'}, {t:6,d:2,deg:'b3'}, {t:9,d:2,deg:'4'}], tags: ['robot', 'math'] }
        ]
    },
    APHEX: {
        id: 'aphex',
        name: 'Aphex Twin',
        licks: [
            { phrase: [{t:0,d:3,deg:'b2',tech:'gr'}, {t:3,d:9,deg:'R'}], tags: ['micro', 'eerie'] },
            { phrase: [{t:0,d:1,deg:'R'}, {t:2,d:1,deg:'b2'}, {t:4,d:1,deg:'R'}, {t:6,d:6,deg:'b5',tech:'bn'}], tags: ['glitch', 'fragile'] }
        ]
    },
    BOARDS: {
        id: 'boards',
        name: 'Boards of Canada',
        licks: [
            { phrase: [{t:0,d:6,deg:'R',tech:'vb'}, {t:6,d:6,deg:'b7',tech:'vb'}], tags: ['nostalgic', 'detuned'] },
            { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'b3'}, {t:8,d:4,deg:'2'}], tags: ['analog', 'memory'] }
        ]
    },
    CBL: {
        id: 'cbl',
        name: 'Carbon Based Lifeforms',
        licks: [
            { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'5'}, {t:8,d:4,deg:'R'}], tags: ['psy-ambient', 'deep'] },
            { phrase: [{t:0,d:2,deg:'R'}, {t:3,d:2,deg:'5'}, {t:6,d:2,deg:'8'}, {t:9,d:3,deg:'5'}], tags: ['triplet', 'pulsar'] }
        ]
    }
};
