/**
 * @fileOverview Ambient Legacy Library (Digital DNA of the Giants)
 * #ЗАЧЕМ: Оцифрованный опыт великих мастеров амбиента и электроники.
 * #ЧТО: Группы ликов и паттернов, отражающие авторские манеры.
 * #ОБНОВЛЕНО (ПЛАН №390): Тотальная дифференциация стилей. 
 *       Каждая группа имеет свой "тембральный якорь" и уникальную фразировку.
 */

import type { BluesSoloPhrase, MelodyInstrument } from '@/types/music';

export type LegacyGroup = {
    id: string;
    name: string;
    preferredInstrument: string; // Ссылка на пресет V2
    phrasing: 'legato' | 'staccato' | 'glitch' | 'sparse';
    registerBias: number; // Смещение октавы
    licks: { phrase: BluesSoloPhrase; tags: string[] }[];
};

export const AMBIENT_LEGACY: Record<string, LegacyGroup> = {
    // #ЗАЧЕМ: Брайан Ино. 
    // #ЧТО: Генеративный минимализм, "капли" в пустом пространстве.
    ENO: {
        id: 'eno',
        name: 'Brian Eno',
        preferredInstrument: 'ep_rhodes_warm',
        phrasing: 'sparse',
        registerBias: 12,
        licks: [
            { phrase: [{t:0,d:12,deg:'R',tech:'vb'}], tags: ['generative', 'stillness'] },
            { phrase: [{t:4,d:8,deg:'5'}, {t:0,d:4,deg:'9'}], tags: ['piano', 'drops'] },
            { phrase: [{t:0,d:12,deg:'b7',tech:'vb'}], tags: ['suspended', 'pure'] }
        ]
    },
    // #ЗАЧЕМ: Kraftwerk. 
    // #ЧТО: Математическая точность, чистые тона, робо-фолк.
    KRAFTWERK: {
        id: 'kraftwerk',
        name: 'Kraftwerk',
        preferredInstrument: 'synth',
        phrasing: 'staccato',
        registerBias: 0,
        licks: [
            { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'2'}, {t:6,d:3,deg:'3'}, {t:9,d:3,deg:'5'}], tags: ['mechanical', 'pure'] },
            { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'R'}, {t:4,d:4,deg:'5'}, {t:8,d:4,deg:'R'}], tags: ['man-machine', 'stable'] },
            { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'5'}, {t:6,d:3,deg:'R+8'}, {t:9,d:3,deg:'5'}], tags: ['trans-europe', 'triadic'] }
        ]
    },
    // #ЗАЧЕМ: Aphex Twin (Ambient Works). 
    // #ЧТО: Глитчи, микро-бенды, хрупкая цифровая меланхолия.
    APHEX: {
        id: 'aphex',
        name: 'Aphex Twin',
        preferredInstrument: 'theremin',
        phrasing: 'glitch',
        registerBias: 12,
        licks: [
            { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:1,deg:'b2',tech:'gr'}, {t:3,d:9,deg:'R'}], tags: ['micro', 'eerie'] },
            { phrase: [{t:0,d:1,deg:'R'}, {t:1,d:1,deg:'b2'}, {t:2,d:1,deg:'R'}, {t:6,d:6,deg:'b5',tech:'bn'}], tags: ['glitch', 'saw-tooth'] },
            { phrase: [{t:0,d:3,deg:'5'}, {t:3,d:3,deg:'b5',tech:'bn'}, {t:6,d:6,deg:'4'}], tags: ['acid-melancholy', 'fragile'] }
        ]
    },
    // #ЗАЧЕМ: Boards of Canada. 
    // #ЧТО: Ностальгия, расстроенная лента, теплый аналоговый шум.
    BOARDS: {
        id: 'boards',
        name: 'Boards of Canada',
        preferredInstrument: 'mellotron_strings',
        phrasing: 'legato',
        registerBias: 0,
        licks: [
            { phrase: [{t:0,d:6,deg:'R',tech:'vb'}, {t:6,d:6,deg:'b7',tech:'vb'}], tags: ['nostalgic', 'detuned'] },
            { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'b3'}, {t:8,d:4,deg:'2'}], tags: ['analog', 'memory'] },
            { phrase: [{t:0,d:6,deg:'5',tech:'sl'}, {t:6,d:6,deg:'4',tech:'vb'}], tags: ['warm', 'dawn'] }
        ]
    },
    // #ЗАЧЕМ: Carbon Based Lifeforms. 
    // #ЧТО: Пси-амбиент, вложенные арпеджио, пульсация космоса.
    CBL: {
        id: 'cbl',
        name: 'Carbon Based Lifeforms',
        preferredInstrument: 'synth_ambient_pad_lush',
        phrasing: 'legato',
        registerBias: -12,
        licks: [
            { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'5'}, {t:8,d:4,deg:'R'}], tags: ['psy-ambient', 'deep'] },
            { phrase: [{t:0,d:2,deg:'R'}, {t:3,d:2,deg:'5'}, {t:6,d:2,deg:'8'}, {t:9,d:3,deg:'5'}], tags: ['triplet', 'pulsar'] },
            { phrase: [{t:0,d:12,deg:'R',tech:'swell'}], tags: ['interloper', 'void'] }
        ]
    },
    // #ЗАЧЕМ: Манфред Мэнн. 
    // #ЧТО: Органные соло, "носовые" фильтры, прог-роковая блюзовая манера.
    MANN: {
        id: 'mann',
        name: 'Manfred Mann',
        preferredInstrument: 'organ_soft_jazz',
        phrasing: 'legato',
        registerBias: 0,
        licks: [
            { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b3',tech:'sl'}, {t:6,d:6,deg:'4',tech:'vb'}], tags: ['earth-band', 'organic'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:3,deg:'b7'}, {t:9,d:3,deg:'R',tech:'sl'}], tags: ['solo-organ', 'bluesy'] },
            { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b3'}, {t:4,d:2,deg:'4'}, {t:6,d:6,deg:'5',tech:'bn'}], tags: ['prog-blues', 'bending'] }
        ]
    },
    // #ЗАЧЕМ: Майк Олдфилд. 
    // #ЧТО: Колокольные паттерны, вложенные циклы, дорийский нео-фолк.
    OLDFIELD: {
        id: 'oldfield',
        name: 'Mike Oldfield',
        preferredInstrument: 'synth',
        phrasing: 'staccato',
        registerBias: 12,
        licks: [
            { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'5'}, {t:6,d:3,deg:'R+8'}, {t:9,d:3,deg:'7'}], tags: ['crystalline', 'nested'] },
            { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:2,deg:'6'}, {t:8,d:2,deg:'7'}, {t:10,d:2,deg:'R+8'}], tags: ['tubular', 'climb'] },
            { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'2'}, {t:8,d:4,deg:'b3'}], tags: ['incantations', 'folk'] }
        ]
    }
};
