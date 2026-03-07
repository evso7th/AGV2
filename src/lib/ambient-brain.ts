
/**
 * @fileOverview Ambient Brain v27.0 — "The Sonic Cube Protocol".
 * #ОБНОВЛЕНО (ПЛАН №736): 
 * 1. Обязательное использование расширенной перкуссии (perc-*, tube, bongo).
 * 2. Реформа renderTexturalPercussion: четкое разделение на Барабаны, Железо и Перкуссию.
 */

import type { 
    FractalEvent, 
    GhostChord, 
    Mood, 
    SuiteDNA, 
    NavigationInfo,
    InstrumentHints,
    InstrumentPart,
    Genre,
    CommonMood,
    Technique
} from '@/types/music';
import { 
    calculateMusiNum, 
    DEGREE_TO_SEMITONE, 
    pickWeightedDeterministic, 
    GEO_ATLAS, 
    LIGHT_ATLAS, 
    decompressCompactPhrase,
    normalizePhraseGroup,
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter
} from './music-theory';
import { DRUM_KITS } from './assets/drum-kits';

const SPECTRAL_ATOMS: Record<string, { fog: number[], depth: number[], pulse: number[] }> = {
    A01_BREATH: { fog: [0.2, 0.4, 0.6, 0.4, 0.2], depth: [0.3, 0.3, 0.5, 0.3, 0.3], pulse: [0.1, 0.1, 0.1, 0.1, 0.1] },
    A02_DAWN: { fog: [0.1, 0.2, 0.3, 0.2, 0.1], depth: [0.2, 0.4, 0.6, 0.4, 0.2], pulse: [0.3, 0.3, 0.3, 0.3, 0.3] },
    A05_CRYSTAL: { fog: [0.8, 0.2, 0.1, 0.5, 0.8], depth: [0.4, 0.7, 0.9, 0.6, 0.4], pulse: [0.2, 0.4, 0.6, 0.3, 0.2] },
    A09_ABYSS: { fog: [0.7, 0.8, 0.9, 0.95, 0.9], depth: [0.2, 0.4, 0.6, 0.8, 1.0], pulse: [0.05, 0.05, 0.05, 0.05, 0.05] },
    A12_IMPULSE: { fog: [0.3, 0.3, 0.3, 0.3, 0.3], depth: [0.5, 0.6, 0.7, 0.6, 0.5], pulse: [0.6, 0.8, 0.9, 0.7, 0.6] }
};

const PHI = [0.0, 1.309, 2.618, 4.188];
const PSI = [0.785, 2.094, 3.927, 5.498];
const BETA = 7.2360679775;
const PERIODS = [8, 45, 180, 600];
const WEIGHTS = [0.15, 0.35, 0.30, 0.20];
const MOD_DEPTH = [0.05, 0.12, 0.25, 0.40];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export class AmbientBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private random: any;
    
    private fog: number = 0.3;
    private pulse: number = 0.15;
    private depth: number = 0.4;
    private bright: number = 0.3;
    private solistCutoff: number = 2000; 
    private registerShift: number = 0;

    private activatedParts: Set<InstrumentPart> = new Set();
    private activeTimbres: Partial<Record<InstrumentPart, string>> = {};

    private soloistBusyUntilBar: number = -1;
    private soloistRestingUntilBar: number = -1; 
    private accompanimentRestingUntilBar: number = -1; 
    
    private readonly MELODY_CEILING = 75;

    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string, tags: string[] } | null = null;
    private currentThemeMaxTick: number = 0;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number } | null = null; 
    private currentAccompAxioms: { phrase: any[], role: string, endBar: number }[] = []; 
    
    private currentTrackName: string = '';
    private ensembleStatus: 'SIBLING' | 'ADAPTIVE' | 'LOCAL' = 'ADAPTIVE';
    private currentMutationType: string = 'none';
    
    private cloudAxioms: any[] = [];
    private activeAnchorId: string | null = null;
    private activeAnchorRoot: number | null = null;
    
    private usedThemeHistory: string[] = [];

    constructor(seed: number, mood: Mood, genre: Genre) {
        this.seed = seed;
        this.mood = mood;
        this.genre = genre;
        this.random = this.createSeededRandom(seed);
    }

    private createSeededRandom(seed: number) {
        let state = seed;
        const next = () => {
            state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
            return state / Math.pow(2, 32);
        };
        const shuffle = <T>(array: T[]): T[] => {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(next() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };
        const nextInt = (max: number) => Math.floor(next() * max);
        return { next, nextInt, shuffle };
    }

    private normalizeStr(s: string): string {
        return s.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    public updateCloudAxioms(axioms: any[], activeAnchorId?: string | null, activeAnchorRoot?: number | null) {
        this.cloudAxioms = axioms || [];
        if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
        if (activeAnchorRoot !== undefined) this.activeAnchorRoot = activeAnchorRoot;
    }

    public generateBar(
        epoch: number, 
        currentChord: GhostChord, 
        navInfo: NavigationInfo, 
        dna: SuiteDNA
    ): { events: FractalEvent[], instrumentHints: InstrumentHints, tension: number, beautyScore: number, mutationType?: string, activeAxioms?: any, narrative?: string } {
        
        const waves = this.computeTensionWaves(epoch * (60 / dna.baseTempo) * 4);
        const localTension = this.computeGlobalTension(waves);

        const isPositive = ['joyful', 'enthusiastic', 'epic'].includes(this.mood);
        this.applyGeography(epoch, dna);
        this.applySpectralAtom(epoch, waves[3]);
        this.updateMoodAxes(epoch, localTension);

        if (epoch % 16 === 0 && !this.activeAnchorId) {
            const mutPool = ['none', 'inversion', 'retrograde', 'jitter'];
            this.currentMutationType = mutPool[this.random.nextInt(mutPool.length)];
        }

        const isSoloistFree = epoch >= this.soloistBusyUntilBar;
        const isSoloistResting = epoch < this.soloistRestingUntilBar;

        if (isSoloistFree && !isSoloistResting) {
            if (this.random.next() < 0.5) {
                this.soloistRestingUntilBar = epoch + 2 + (this.random.next() > 0.5 ? 2 : 0);
            } else {
                this.selectNextAxiom(navInfo, dna, epoch);
            }
        }

        const hints = this.orchestrate(localTension, navInfo, epoch, dna);
        const events: FractalEvent[] = [];

        if (navInfo.isPartTransition && hints.melody && this.random.next() < 0.7) {
            events.push(...this.renderBeautifulPassage(currentChord, localTension));
        }

        // --- 1. ACCOMPANIMENT ---
        const isAccompResting = epoch < this.accompanimentRestingUntilBar;
        if (!isAccompResting) {
            const hasHeritageAccomp = this.currentAccompAxioms.length > 0;
            if (hasHeritageAccomp) {
                this.currentAccompAxioms.forEach((ax, idx) => {
                    const role = ax.role.toLowerCase();
                    let targetType: InstrumentPart = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('strings') ? 'harmony' : 'accompaniment');
                    if ((navInfo.currentPart.layers as any)[targetType]) {
                        events.push(...this.renderHeritageAccompaniment(currentChord, epoch, ax.phrase, targetType, dna, localTension));
                    }
                });
            } else if (hints.accompaniment) {
                events.push(...this.renderPad(currentChord, epoch, hints.accompaniment as string, localTension));
            }
        }

        // --- 2. BASS ---
        if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
            events.push(...this.constrainBass(this.renderThemeBass(currentChord, epoch, localTension, dna)));
        } else if (hints.bass) {
            events.push(...this.constrainBass(this.renderDroneBass(currentChord, localTension)));
        }

        // --- 3. MELODY ---
        if (hints.melody && !isSoloistResting) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                events.push(...this.renderThemeMelody(currentChord, epoch, localTension, hints, dna, 'melody', this.currentTheme.phrase, this.currentThemeMaxTick, 1));
            } else {
                events.push(...this.renderMelodicPadBase(currentChord, epoch, localTension));
            }
        }

        // --- 4. DRUMS & PERCUSSION ---
        // #ЗАЧЕМ: Реформа ударных (ПЛАН №736). Барабаны, Железо и обязательная Перкуссия.
        if (hints.drums) {
            events.push(...this.renderTexturalPercussion(epoch, localTension));
        }

        // --- 5. TEXTURES ---
        if (hints.sparkles && this.random.next() < 0.25) {
            events.push(this.renderSparkle(currentChord, isPositive));
        }
        if (hints.sfx && epoch % 16 === 0 && this.random.next() < 0.3) {
            events.push(...this.renderSfx(localTension, { categories: [{ name: 'voice', weight: 0.2 }, { name: 'common', weight: 0.8 }] }));
        }

        const narrative = this.currentTrackName || 'Evolving Texture';

        return { 
            events, 
            instrumentHints: hints, 
            tension: localTension, 
            beautyScore: 0.5,
            mutationType: this.currentMutationType,
            activeAxioms: {
                melody: isSoloistResting ? 'Breath' : (this.currentTheme?.id || 'Textural'),
                ensemble: this.ensembleStatus,
                bass: 'Drone',
                drums: 'Sonic Cube'
            },
            narrative: `Texture Flow: ${narrative}`
        };
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number) {
        this.currentAccompAxioms = []; 
        let cloudAxiom: any = null;
        const poolToUse = this.cloudAxioms.length > 0 ? this.cloudAxioms : (dna.cloudAxioms || []);

        if (poolToUse.length > 0) {
            const targetAnchor = this.activeAnchorId ? this.normalizeStr(this.activeAnchorId) : null;
            let basePool = poolToUse.filter(ax => ax.role === 'melody');
            if (targetAnchor) basePool = basePool.filter(ax => this.normalizeStr(ax.compositionId || '') === targetAnchor);

            if (basePool.length > 0) {
                const finalPool = basePool.filter(ax => !this.usedThemeHistory.includes(ax.id));
                const pool = finalPool.length > 0 ? finalPool : basePool;
                cloudAxiom = pool[this.random.nextInt(pool.length)];
                this.usedThemeHistory.push(cloudAxiom.id);
                if (this.usedThemeHistory.length > 30) this.usedThemeHistory.shift();
            }
        }

        if (cloudAxiom) {
            let rawPhrase = decompressCompactPhrase(cloudAxiom.phrase);
            const phrasesToNormalize = [rawPhrase];
            
            const bassSibling = poolToUse.find(ax => 
                ax.role === 'bass' && 
                this.normalizeStr(ax.compositionId || '') === this.normalizeStr(cloudAxiom.compositionId) &&
                ax.barOffset === cloudAxiom.barOffset
            );
            
            let rawBass: any[] | null = null;
            if (bassSibling) {
                rawBass = decompressCompactPhrase(bassSibling.phrase);
                phrasesToNormalize.push(rawBass);
            }

            const accompSiblings = poolToUse.filter(ax => 
                ax.role?.startsWith('accomp') && 
                this.normalizeStr(ax.compositionId || '') === this.normalizeStr(cloudAxiom.compositionId) && 
                ax.barOffset === cloudAxiom.barOffset
            ).slice(0, 2);

            const rawAccomps: any[][] = [];
            accompSiblings.forEach(ax => {
                const p = decompressCompactPhrase(ax.phrase);
                rawAccomps.push(p);
                phrasesToNormalize.push(p);
            });

            normalizePhraseGroup(phrasesToNormalize);

            const phraseBars = cloudAxiom.bars || 4;
            this.currentThemeMaxTick = phraseBars * 12;
            this.currentTheme = { phrase: rawPhrase, startBar: epoch, endBar: epoch + phraseBars, id: cloudAxiom.id, tags: cloudAxiom.tags || [] };
            this.currentTrackName = cloudAxiom.compositionId;
            this.soloistBusyUntilBar = epoch + phraseBars;
            
            if (rawBass) this.currentBassTheme = { phrase: rawBass, startBar: epoch, endBar: epoch + phraseBars };
            this.currentAccompAxioms = rawAccomps.map((p, idx) => ({ phrase: p, role: accompSiblings[idx].role, endBar: epoch + phraseBars }));
            this.ensembleStatus = 'SIBLING';
        } else {
            this.ensembleStatus = 'ADAPTIVE';
            this.currentTheme = null;
            this.currentBassTheme = null;
        }
    }

    private renderDroneBass(chord: GhostChord, tension: number): FractalEvent[] {
        return [{
            type: 'bass',
            note: this.constrainBassOctave(chord.rootNote - 12),
            time: 0,
            duration: 4.0,
            weight: 0.7,
            technique: 'drone',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 1.5, release: 2.0 }
        }];
    }

    private renderTexturalPercussion(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const moodCategory = MOOD_TO_COMMON[this.mood] || 'neutral';
        const kit = DRUM_KITS.ambient[this.mood as any] || DRUM_KITS.ambient.melancholic;

        // --- 1. БАРАБАНЫ (Drums) ---
        if (this.random.next() < 0.25) {
            const kick = kit.kick[this.random.nextInt(kit.kick.length)] || 'drum_kick_soft';
            events.push({ type: kick as any, note: 36, time: 0, duration: 0.1, weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }
        if (this.random.next() < 0.3) {
            const tomPool = ['drum_Sonor_Classix_Low_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_High_Tom'];
            const tom = tomPool[this.random.nextInt(tomPool.length)];
            events.push({ type: tom as any, note: 40, time: 1.5 + this.random.next(), duration: 1.5, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }

        // --- 2. ЖЕЛЕЗО (Iron) ---
        if (this.random.next() < 0.6) {
            [0, 1, 2, 3].forEach(beat => {
                if (this.random.next() < 0.3) {
                    events.push({ type: 'drum_closed_hi_hat_ghost', note: 42, time: beat + 0.5, duration: 0.1, weight: 0.2, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
                }
            });
        }
        if (tension > 0.5 && this.random.next() < 0.3) {
            events.push({ type: 'drum_ride_wetter', note: 51, time: 0, duration: 4.0, weight: 0.2, technique: 'hit', dynamics: 'p', phrasing: 'legato' });
        }

        // --- 3. ПЕРКУССИЯ (Percussion) ---
        // #ЗАЧЕМ: Обязательное использование расширенной перкуссии (ПЛАН №736).
        if (this.random.next() < 0.5) {
            const percPool = kit.perc || [];
            if (percPool.length > 0) {
                const count = 1 + this.random.nextInt(2);
                for(let i=0; i<count; i++) {
                    const perc = percPool[this.random.nextInt(percPool.length)];
                    events.push({ 
                        type: perc as any, 
                        note: 48, 
                        time: this.random.next() * 3.5, 
                        duration: 1.0, 
                        weight: 0.45, 
                        technique: 'hit', 
                        dynamics: 'p', 
                        phrasing: 'staccato' 
                    });
                }
            }
        }

        return events;
    }

    private renderBeautifulPassage(chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote + 24;
        const scale = [0, 2, 4, 7, 9, 11, 12]; 
        const events: FractalEvent[] = [];
        const count = 3 + this.random.nextInt(4);
        for(let i=0; i<count; i++) {
            events.push({
                type: 'melody',
                note: root + scale[this.random.nextInt(scale.length)],
                time: i * 0.6,
                duration: 2.0,
                weight: 0.4,
                technique: 'pick',
                dynamics: 'p',
                phrasing: 'legato',
                params: { attack: 0.2, release: 1.5 }
            });
        }
        return events;
    }

    private orchestrate(tension: number, navInfo: NavigationInfo, epoch: number, dna: SuiteDNA): InstrumentHints {
        const hints: InstrumentHints = { summonProgress: {} };
        const part = navInfo.currentPart;
        
        const organChance = 0.05; 
        const useOrgan = this.random.next() < organChance;

        Object.entries(part.instrumentation || {}).forEach(([partStr, rule]: [any, any]) => {
            const p = partStr as InstrumentPart;
            if (!this.activatedParts.has(p)) {
                if (this.random.next() < (rule.activationChance ?? 1.0)) {
                    this.activatedParts.add(p);
                    let options = rule.instrumentOptions || rule.v2Options || [];
                    if (!useOrgan) options = options.filter((o: any) => o.name !== 'organ');
                    this.activeTimbres[p] = pickWeightedDeterministic(options, this.seed, epoch, 500);
                }
            }
        });

        this.activatedParts.forEach(p => {
            if ((part.layers as any)[p]) {
                (hints as any)[p] = this.activeTimbres[p] || 'synth';
                hints.summonProgress![p] = 1.0;
            }
        });

        return hints;
    }

    private renderPad(chord: GhostChord, epoch: number, timbre: string, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12 + this.registerShift;
        return [0, 7, 12].map((n, i) => ({
            type: 'accompaniment',
            note: root + n,
            time: i * 0.3,
            duration: 5.0,
            weight: 0.4,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 1.2, release: 2.5, barCount: epoch }
        }));
    }

    private renderHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, dna: SuiteDNA, tension: number): FractalEvent[] {
        const barInAxiom = epoch % 4; 
        const barOffset = barInAxiom * 12;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + 12);
        return barNotes.map(n => ({
            type: type,
            note: chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.registerShift,
            time: (n.t - barOffset) / 3,
            duration: n.d / 3,
            weight: 0.5,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 0.8, release: 3.0 }
        }));
    }

    private renderThemeMelody(chord: GhostChord, epoch: number, tension: number, hints: InstrumentHints, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number): FractalEvent[] {
        const barInCycle = epoch % (maxTick / 12);
        const barOffset = barInCycle * 12;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + 12);
        return barNotes.map(n => ({
            type: type as any,
            note: Math.min(chord.rootNote + 24 + this.registerShift + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: (n.t - barOffset) / 3,
            duration: n.d / 3,
            weight: 0.6,
            technique: 'pick',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 0.3, release: 1.5 }
        }));
    }

    private renderThemeBass(chord: GhostChord, epoch: number, tension: number, dna: SuiteDNA): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const barInAxiom = epoch % 4;
        const note = this.currentBassTheme.phrase.find(n => n.t >= barInAxiom * 12);
        if (!note) return this.renderDroneBass(chord, tension);
        return [{
            type: 'bass',
            note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[note.deg] || 0)),
            time: 0,
            duration: 4.0,
            weight: 0.8,
            technique: 'drone',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 1.0, release: 2.0 }
        }];
    }

    private renderMelodicPadBase(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        return [{
            type: 'melody',
            note: chord.rootNote + 24 + this.registerShift,
            time: 0,
            duration: 4.0,
            weight: 0.3,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 1.5, release: 3.0 }
        }];
    }

    private renderSparkle(chord: GhostChord, isPositive: boolean): FractalEvent {
        return {
            type: 'sparkle',
            note: chord.rootNote + 48,
            time: this.random.next() * 4,
            duration: 6.0,
            weight: 0.5, 
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'legato',
            params: { mood: this.mood, genre: this.genre, category: isPositive ? 'light' : 'ambient_common' }
        };
    }

    private renderSfx(tension: number, options?: any): FractalEvent[] {
        return [{
            type: 'sfx', note: 60, time: this.random.next() * 2, duration: 4.0, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: { mood: this.mood, genre: this.genre, options }
        }];
    }

    private constrainBassOctave(note: number): number {
        let finalNote = note;
        while (finalNote > 47) finalNote -= 12;
        while (finalNote < 31) finalNote += 12;
        return finalNote;
    }

    private constrainBass(events: FractalEvent[]): FractalEvent[] {
        return events.map(e => ({ ...e, note: this.constrainBassOctave(e.note) }));
    }

    private applyGeography(epoch: number, dna: SuiteDNA) {
        if (!dna.itinerary || dna.itinerary.length === 0) return;
        let stage = Math.min(2, Math.floor((epoch / 150) * 3));
        const atomKey = dna.itinerary[stage];
        const atom = GEO_ATLAS[atomKey];
        if (atom) {
            this.fog = atom.fog;
            this.depth = atom.depth;
            this.registerShift = atom.reg;
        }
    }

    private applySpectralAtom(epoch: number, t3: number) {
        const atomKeys = Object.keys(SPECTRAL_ATOMS);
        const normalizedT3 = (t3 + 1.5) / 3.0;
        const safeIdx = Math.floor(Math.max(0, Math.min(0.999, normalizedT3)) * atomKeys.length);
        const atom = SPECTRAL_ATOMS[atomKeys[safeIdx]];
        if (atom) {
            const step = epoch % 5; 
            this.fog = (this.fog + atom.fog[step]) / 2;
        }
    }

    private computeTensionWaves(timeSec: number): number[] {
        const p = PERIODS, phi = PHI, psi = PSI, md = MOD_DEPTH;
        return [0, 1, 2, 3].map(n => {
            const base = Math.sin(2 * Math.PI * timeSec / p[n] + phi[n]);
            const mod = Math.sin(2 * Math.PI * timeSec / (p[n] / BETA) + psi[n]);
            return base * (1 + md[n] * mod);
        });
    }

    private computeGlobalTension(waves: number[]): number {
        let t = 0;
        for (let n = 0; n < 4; n++) t += WEIGHTS[n] * waves[n];
        return (t + 1) / 2;
    }

    private updateMoodAxes(epoch: number, tension: number) {
        this.solistCutoff = 1500 + (tension * 2500);
    }
}

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};
