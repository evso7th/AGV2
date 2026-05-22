
/**
 * @fileOverview Universal Music Theory Utilities V5.9 — "The Complete Codex".
 * #ЗАЧЕМ: Исправление ошибок импорта в Ambient и Blues Brain.
 * #ЧТО: ПЛАН №1905 — Восстановлены GEO_ATLAS, LIGHT_ATLAS и функции L-трансформации.
 */

import type { 
    FractalEvent, 
    Mood, 
    Genre, 
    GhostChord, 
    SuiteDNA, 
    NavigationInfo,
    TensionProfile,
    AxiomVector,
    Technique
} from '@/types/music';
import { getChordNameForBar, getDynastyForMood } from './blues-theory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP, BASS_PRESET_MAP } from './presets-v2';
import { BASS_PRESETS } from './bass-presets';

// ───── GLOBAL CHRONOS CONSTANTS ─────
export const TICKS_PER_BAR = 12;
export const BEATS_PER_BAR = 4;
export const TICK_TO_BEAT = BEATS_PER_BAR / TICKS_PER_BAR; // 0.3333...

export const MODE_SEMITONES: Record<string, number[]> = {
    ionian: [0, 2, 4, 5, 7, 9, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    aeolian: [0, 2, 3, 5, 7, 8, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10]
};

export const DEGREE_TO_SEMITONE: Record<string, number> = {
    'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, '5': 7,
    'b6': 8, '6': 9, 'b7': 10, '7': 11, 'R+8': 12, '9': 14, '11': 17
};

export const DEGREE_KEYS = Object.keys(DEGREE_TO_SEMITONE);
export const TECHNIQUE_KEYS = ['pick', 'sl', 'h/p', 'bn', 'vb', 'gr', 'ds', 'harm', 'pick', 'hit', 'swell'];

export const SEMITONE_TO_DEGREE: Record<number, string> = {
    0: 'R', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: '#4', 7: '5',
    8: 'b6', 9: '6', 10: 'b7', 11: '7', 12: 'R+8', 14: '9', 17: '11'
};

// ───── ATLASES ─────

/**
 * #ЗАЧЕМ: Атлас Географии для AmbientBrain.
 */
export const GEO_ATLAS: Record<string, { fog: number, depth: number, reg: number }> = {
    'harbor': { fog: 0.6, depth: 0.4, reg: -12 },
    'temple': { fog: 0.2, depth: 0.8, reg: 0 },
    'plains': { fog: 0.4, depth: 0.3, reg: 12 },
    'void':   { fog: 0.8, depth: 0.9, reg: -24 }
};

/**
 * #ЗАЧЕМ: Атлас Света для AmbientBrain.
 */
export const LIGHT_ATLAS: Record<string, { intensity: number, bloom: number }> = {
    'epic': { intensity: 0.8, bloom: 0.9 },
    'enthusiastic': { intensity: 0.7, bloom: 0.6 },
    'joyful': { intensity: 0.9, bloom: 0.4 }
};

// ───── L-LOGIC (TRANSFORMATIONS) ─────

/**
 * #ЗАЧЕМ: Нормализация группы нот.
 */
export function normalizePhraseGroup(phrase: any[]): any[] {
    if (!phrase || phrase.length === 0) return [];
    const minT = Math.min(...phrase.map(n => n.t));
    return phrase.map(n => ({ ...n, t: n.t - minT }));
}

/**
 * #ЗАЧЕМ: Инверсия фраз (Зеркальное отражение).
 */
export function invertPhrase(phrase: any[]): any[] {
    if (!phrase || phrase.length === 0) return [];
    const firstDeg = DEGREE_TO_SEMITONE[phrase[0].deg] || 0;
    return phrase.map(n => {
        const currentSemi = DEGREE_TO_SEMITONE[n.deg] || 0;
        const invertedSemi = firstDeg - (currentSemi - firstDeg);
        // Защита от выхода за диапазон
        const wrappedSemi = ((invertedSemi % 12) + 12) % 12;
        const degName = SEMITONE_TO_DEGREE[wrappedSemi] || 'R';
        return { ...n, deg: degName };
    });
}

/**
 * #ЗАЧЕМ: Ретроградная трансформация (Реверс).
 */
export function retrogradePhrase(phrase: any[]): any[] {
    if (!phrase || phrase.length === 0) return [];
    const maxT = Math.max(...phrase.map(n => n.t + n.d));
    return phrase.map(n => ({ 
        ...n, 
        t: maxT - (n.t + n.d) 
    })).sort((a, b) => a.t - b.t);
}

/**
 * #ЗАЧЕМ: Ритмический джиттер (Живое отклонение).
 */
export function applyRhythmicJitter(phrase: any[], seed: number): any[] {
    return phrase.map((n, i) => {
        const jitter = (calculateMusiNum(seed + i, 7, 0, 10) / 100) - 0.05; 
        return { ...n, t: Math.max(0, n.t + jitter) };
    });
}

// ───── CORE UTILS ─────

/**
 * #ЗАЧЕМ: Сопоставление настроения с музыкальной гаммой.
 */
export function getScaleForMood(mood: Mood): number[] {
    const moodMap: Record<string, string> = {
        epic: 'mixolydian',
        joyful: 'ionian',
        enthusiastic: 'lydian',
        melancholic: 'dorian',
        dark: 'phrygian',
        anxious: 'locrian',
        dreamy: 'lydian',
        contemplative: 'mixolydian',
        calm: 'ionian',
        gloomy: 'aeolian'
    };
    const scaleName = moodMap[mood] || 'dorian';
    return MODE_SEMITONES[scaleName];
}

/**
 * #ЗАЧЕМ: Детерминированный взвешенный выбор для стабильности сессии.
 */
export function pickWeightedDeterministic<T>(options: any[], seed: number, step: number, salt: number): T | null {
    if (!options || options.length === 0) return null;
    
    const totalWeight = options.reduce((sum, opt) => sum + (opt.weight || 0), 0);
    if (totalWeight <= 0) return options[0].name || options[0];

    const rand = (calculateMusiNum(step, 17, seed + salt, 1000) / 1000) * totalWeight;
    
    let cumulativeWeight = 0;
    for (const option of options) {
        cumulativeWeight += (option.weight || 0);
        if (rand <= cumulativeWeight) {
            return option.name || option;
        }
    }
    return options[options.length - 1].name || options[options.length - 1];
}

/**
 * #ЗАЧЕМ: Генерация нот для режима Atom.
 */
export function createHarmonyAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: any, epoch: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor' || genre === 'ambient' || genre === 'psybient';
    const scale = MODE_SEMITONES[isMinor ? 'dorian' : 'ionian'];
    const root = chord.rootNote;

    const density = 2 + (calculateMusiNum(epoch, 7, root, 3));
    
    for (let i = 0; i < density; i++) {
        const jitter = (calculateMusiNum(epoch + i, 13, root, 100) / 100) * 0.4;
        const t = (TICKS_PER_BAR / density) * i + jitter;
        const complexSeed = epoch * 17 + root * 5 + i * 23;
        const degIdx = calculateMusiNum(complexSeed, 19, 0, scale.length);
        const note = root + 12 + scale[degIdx];

        events.push({
            type: 'accompaniment',
            note: note,
            time: t * TICK_TO_BEAT,
            duration: 5.0 * TICK_TO_BEAT, 
            weight: 0.45 + (calculateMusiNum(epoch, 11, i, 4) / 10),
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato'
        });
    }
    return events;
}

export function resolveSemanticTimbre(hint: any, tension: number, part: string, genre: Genre = 'ambient'): string {
    if (!hint || hint === 'none') return 'none';
    let targetHint = hint;
    if (typeof hint === 'object' && !Array.isArray(hint)) {
        if (tension < 0.4) targetHint = hint.low || hint.mid || hint.high;
        else if (tension < 0.75) targetHint = hint.mid || hint.low || hint.high;
        else targetHint = hint.high || hint.mid || hint.low;
    }
    if (!targetHint || targetHint === 'none') return 'none';
    const clean = String(targetHint).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (part === 'pianoAccompaniment') {
        if (clean === 'piano' || clean === 'acousticpiano') return 'piano';
        if (clean === 'rhodes' || clean === 'eprhodeswarm') return 'ep_rhodes_warm';
    }
    if (clean === 'dynamicorgan') {
        if (tension < 0.4) return 'organ_prog';
        if (tension < 0.75) return 'organ_soft_jazz';
        return 'organ'; 
    }
    if (clean === 'dynamicpad') {
        if (tension < 0.4) return 'synth'; 
        if (tension < 0.75) return 'synth_ambient_pad_lush';
        return 'synth_cave_pad';
    }
    const v2Keys = Object.keys(V2_PRESETS);
    const matchedV2 = v2Keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === clean);
    if (matchedV2) return matchedV2;
    const bassKeys = Object.keys(BASS_PRESETS);
    const matchedBass = bassKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === clean);
    if (matchedBass) return matchedBass;
    if (part === 'melody') {
        if (clean.includes('acoustic')) return 'blackAcoustic';
        if (clean.includes('tele')) return 'telecaster';
        if (clean.includes('shine')) return 'guitar_shineOn';
        if (clean.includes('muff')) return 'guitar_muffLead';
        if (clean.includes('cs80')) return 'cs80';
    }
    if (part === 'accompaniment') {
        const isPianoTimbre = clean === 'piano' || clean === 'rhodes' || clean === 'eprhodeswarm' || clean === 'pianoaccompaniment';
        if (isPianoTimbre) {
            return genre === 'blues' ? 'organ_soft_jazz' : 'synth_ambient_pad_lush';
        }
    }
    if (clean === 'guitar' || clean === 'electricguitar' || clean === 'melody') {
        if (tension < 0.45) return 'telecaster';
        if (tension > 0.75) return 'guitar_muffLead';
        return 'guitar_shineOn';
    }
    if (part === 'bass') {
        return BASS_PRESET_MAP[targetHint] || BASS_PRESET_MAP[clean] || 'bass_jazz_warm';
    }
    return V1_TO_V2_PRESET_MAP[targetHint] || V1_TO_V2_PRESET_MAP[clean] || String(targetHint);
}

export function normalizeStr(s: string): string {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function keyToMidiRoot(key: string | null | undefined): number | null {
    if (!key) return null;
    const noteMap: Record<string, number> = { 'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11 };
    const rootName = key.match(/^[A-G][#b]?/)?.[0] || 'C';
    const offset = noteMap[rootName] || 0;
    return 48 + offset;
}

export function calculateMusiNum(step: number, base: number = 2, start: number = 0, modulo: number = 8): number {
    if (!isFinite(step) || modulo <= 0) return 0;
    if (base <= 1) return Math.abs(Math.floor(step + start)) % modulo; 
    
    let num = Math.abs(Math.floor(step + start));
    let sum = 0;
    while (num > 0) {
        sum += num % base;
        num = Math.floor(num / base);
    }
    return sum % modulo;
}

export function generateMarkovHarmony(totalBars: number, rootNote: number, seed: number, genre: string): GhostChord[] {
    const track: GhostChord[] = [];
    const matrix = GENRE_HARMONY_MATRICES[genre] || GENRE_HARMONY_MATRICES.ambient;
    const states = GENRE_STATES[genre] || GENRE_STATES.ambient;
    let currentBar = 0;
    let currentStateIdx = 0;
    
    while (currentBar < totalBars) {
        const durPool = [12, 16, 24, 32]; 
        const dur = durPool[calculateMusiNum(currentBar, 5, seed, 4)];
        
        track.push({
            rootNote: rootNote + (states[currentStateIdx] || 0),
            chordType: 'minor',
            bar: currentBar,
            durationBars: Math.min(dur, totalBars - currentBar)
        });
        
        const rand = (calculateMusiNum(currentBar, 23, seed + currentStateIdx, 100)) / 100;
        let acc = 0;
        const currentMatrixRow = matrix[currentStateIdx] || matrix[0];
        
        for (let i = 0; i < currentMatrixRow.length; i++) {
            acc += currentMatrixRow[i];
            if (rand <= acc) { currentStateIdx = i; break; }
        }
        currentBar += dur;
    }
    return track;
}

export function generateSuiteDNA(
    totalBars: number, 
    mood: Mood, 
    initialSeed: number, 
    originalRandom: any, 
    genre: Genre, 
    blueprintParts: any[], 
    ancestor?: any, 
    sessionHistory?: string[],
    bpmConfig?: { base: number, range: [number, number], modifier: number },
    masterpieces?: any[],
    cloudAxioms?: any[], 
    activeAnchorId?: string | null,
    activeAnchorRoot?: number | null
): SuiteDNA {
    let finalSeed = initialSeed;
    if (masterpieces && masterpieces.length > 0) {
        const parent1 = masterpieces[calculateMusiNum(initialSeed, 7, 0, masterpieces.length)];
        const parent2 = masterpieces[calculateMusiNum(initialSeed, 11, 5, masterpieces.length)];
        finalSeed = (parent1.seed & 0xAAAA) | (parent2.seed & 0x5555);
    } else if (ancestor && typeof ancestor.seed === 'number') {
        finalSeed = (initialSeed & 0x55555555) | (ancestor.seed & 0xAAAAAAAA);
    }
    const key = 40 + calculateMusiNum(finalSeed, 19, 0, 12); 
    const harmonyTrack = generateMarkovHarmony(totalBars, key, finalSeed, genre);
    let baseTempo = 72;
    if (bpmConfig) {
        const [min, max] = bpmConfig.range;
        const deterministicOffset = (calculateMusiNum(finalSeed, 23, 0, 100) / 100) * (max - min);
        baseTempo = Math.round((min + deterministicOffset) * bpmConfig.modifier);
    }
    const tensionMap = generateTensionMap(finalSeed, totalBars, mood, blueprintParts);
    return { 
        harmonyTrack, baseTempo, rhythmicFeel: 'shuffle', bassStyle: 'walking', 
        drumStyle: 'shuffle_A', soloPlanMap: new Map(), tensionMap, 
        dynasty: genre === 'blues' ? getDynastyForMood(mood, finalSeed) : undefined,
        cloudAxioms, activeAnchorId,
        activeAnchorRoot: activeAnchorRoot || null 
    };
}

export function generateTensionMap(seed: number, totalBars: number, mood: Mood, parts?: any[]): number[] {
    const map: number[] = [];
    const getJitter = (bar: number) => (calculateMusiNum(bar, 7, seed, 10) / 100) - 0.05;
    let accumulatedBars = 0;
    parts?.forEach(part => {
        const partDuration = Math.round((part.duration.percent / 100) * totalBars);
        for (let i = 0; i < partDuration; i++) {
            const progress = i / (partDuration || 1);
            let tension: number;
            if (part.id === 'INTRO' || part.id === 'PROLOGUE') tension = 0.25 + (progress * 0.1); 
            else if (part.id.startsWith('MAIN') || part.id.startsWith('THE_')) tension = 0.35 + 0.5 * Math.sin(progress * Math.PI);
            else if (part.id === 'OUTRO') tension = 0.3 * (1 - progress * 0.6); 
            else tension = 0.4; 
            map.push(Math.max(0.1, Math.min(0.95, tension + getJitter(accumulatedBars + i))));
        }
        accumulatedBars += partDuration;
    });
    while(map.length < totalBars) {
        const progress = map.length / totalBars;
        map.push(0.4 + 0.3 * Math.sin(progress * Math.PI) + getJitter(map.length));
    }
    return map;
}

export const GENRE_HARMONY_MATRICES: Record<string, number[][]> = {
    psybient: [[0.2, 0.4, 0.1, 0.2, 0.1], [0.3, 0.2, 0.2, 0.2, 0.1], [0.1, 0.1, 0.5, 0.2, 0.1], [0.2, 0.1, 0.1, 0.4, 0.2], [0.3, 0.1, 0.1, 0.1, 0.4]],
    ambient: [[0.3, 0.3, 0.1, 0.1, 0.1, 0.1], [0.2, 0.4, 0.1, 0.1, 0.1, 0.1], [0.2, 0.1, 0.4, 0.1, 0.1, 0.1], [0.2, 0.2, 0.1, 0.3, 0.1, 0.1], [0.2, 0.1, 0.1, 0.1, 0.4, 0.1], [0.2, 0.1, 0.1, 0.1, 0.1, 0.4]],
    blues: [[0.3, 0.4, 0.3], [0.3, 0.4, 0.3], [0.4, 0.3, 0.3]]
};

export const GENRE_STATES: Record<string, number[]> = {
    psybient: [0, 3, 5, 8, 10],      
    ambient: [0, 5, 7, 9, 3, 10], 
    blues: [0, 5, 7]             
};

export function decompressCompactPhrase(compact: number[]): any[] {
    const result = [];
    if (!compact) return [];
    for (let i = 0; i < compact.length; i += 4) {
        result.push({
            t: compact[i], d: compact[i+1],
            deg: DEGREE_KEYS[compact[i+2]] || 'R',
            tech: TECHNIQUE_KEYS[compact[i+3]] || 'pick'
        });
    }
    return result;
}

export function repairLegacyPhrase(compact: number[]): number[] {
    if (!compact || compact.length === 0) return [];
    const isLegacy = compact.length >= 3 && compact[2] > 20;
    if (!isLegacy) return compact;
    const repaired: number[] = [];
    const BASE_C4 = 60;
    for (let i = 0; i < compact.length; i += 4) {
        const t = compact[i]; const d = compact[i+1]; const midi = compact[i+2];
        const semitone = (midi - BASE_C4) % 12;
        const degName = SEMITONE_TO_DEGREE[semitone < 0 ? semitone + 12 : semitone] || 'R';
        const degIdx = DEGREE_KEYS.indexOf(degName);
        const techIdx = TECHNIQUE_KEYS.indexOf('pick');
        repaired.push(t, d, degIdx, techIdx);
    }
    return repaired;
}

export function mergeIdenticalNotes(phrase: any[]): any[] {
    if (!phrase || phrase.length <= 1) return phrase || [];
    const sorted = [...phrase].sort((a, b) => a.t - b.t);
    const merged: any[] = [];
    let current = { ...sorted[0] };
    for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];
        if (next.deg === current.deg && Math.abs(next.t - (current.t + current.d)) < 0.01) {
            current.d += next.d;
        } else {
            merged.push(current);
            current = { ...next };
        }
    }
    merged.push(current);
    return merged;
}
