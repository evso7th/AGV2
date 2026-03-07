
/**
 * @fileOverview Ambient Brain v31.0 — "Generative Imperative & Texture Flow".
 * #ОБНОВЛЕНО (ПЛАН №742): 
 * 1. Реализован Генеративный Императив: если нет Heritage, играем алгоритмы.
 * 2. Бас переведен на 1-тактные дроны.
 * 3. Ударные переработаны: редкий кик/железо + плотная перкуссия (perc, tube, bongo).
 * 4. Внедрены красивые медленные пассажи на границах частей.
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
    private registerShift: number = 0;

    private soloistBusyUntilBar: number = -1;
    private soloistRestingUntilBar: number = -1; 
    private accompanimentRestingUntilBar: number = -1; 
    
    private readonly MELODY_CEILING = 72;
    private readonly PAD_CEILING = 64;

    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string, tags: string[] } | null = null;
    private currentThemeMaxTick: number = 0;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number } | null = null; 
    private currentAccompAxioms: { phrase: any[], role: string, endBar: number }[] = []; 
    
    private currentTrackName: string = '';
    private ensembleStatus: 'SIBLING' | 'ADAPTIVE' | 'LOCAL' = 'ADAPTIVE';
    private currentMutationType: string = 'none';
    
    private cloudAxioms: any[] = [];
    private activeAnchorId: string | null = null;
    
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
        const nextInt = (max: number) => Math.floor(next() * max);
        return { next, nextInt };
    }

    private normalizeStr(s: string): string {
        return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    public updateCloudAxioms(axioms: any[], activeAnchorId?: string | null) {
        this.cloudAxioms = axioms || [];
        if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
    }

    public generateBar(
        epoch: number, 
        currentChord: GhostChord, 
        navInfo: NavigationInfo, 
        dna: SuiteDNA,
        hints: InstrumentHints
    ): { events: FractalEvent[], tension: number, beautyScore: number, mutationType?: string, activeAxioms?: any, narrative?: string } {
        
        const waves = this.computeTensionWaves(epoch * (60 / dna.baseTempo) * 4);
        const localTension = this.computeGlobalTension(waves);

        const isPositive = ['joyful', 'enthusiastic', 'epic'].includes(this.mood);
        this.applyGeography(epoch, dna);
        this.applySpectralAtom(epoch, waves[3]);

        if (epoch % 16 === 0 && !this.activeAnchorId) {
            const mutPool = ['none', 'inversion', 'retrograde', 'jitter'];
            this.currentMutationType = mutPool[this.random.nextInt(mutPool.length)];
        }

        const isSoloistFree = epoch >= this.soloistBusyUntilBar;
        const isSoloistResting = epoch < this.soloistRestingUntilBar;

        if (isSoloistFree && !isSoloistResting) {
            if (this.random.next() < 0.45) {
                this.soloistRestingUntilBar = epoch + 2;
            } else {
                this.selectNextAxiom(navInfo, dna, epoch);
            }
        }

        const events: FractalEvent[] = [];

        // --- 1. ACCOMPANIMENT & HARMONY (Generative Imperative) ---
        const isAccompResting = epoch < this.accompanimentRestingUntilBar;
        if (!isAccompResting) {
            // Heritage Priority
            if (this.currentAccompAxioms.length > 0) {
                this.currentAccompAxioms.forEach((ax) => {
                    const role = ax.role.toLowerCase();
                    let targetType: InstrumentPart = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('strings') ? 'harmony' : 'accompaniment');
                    if ((navInfo.currentPart.layers as any)[targetType]) {
                        events.push(...this.renderHeritageAccompaniment(currentChord, epoch, ax.phrase, targetType, dna, localTension));
                    }
                });
            }
            
            // Generative Fallbacks if DNA missing roles
            if (hints.accompaniment && !this.currentAccompAxioms.some(a => !a.role.includes('piano') && !a.role.includes('strings'))) {
                events.push(...this.renderPad(currentChord, epoch, hints.accompaniment as string, localTension));
            }
            if (hints.pianoAccompaniment && !this.currentAccompAxioms.some(a => a.role.includes('piano'))) {
                events.push(...this.renderGenerativePiano(currentChord, epoch, localTension));
            }
            if (hints.harmony && !this.currentAccompAxioms.some(a => a.role.includes('strings') || a.role.includes('violin'))) {
                events.push(...this.renderGenerativeHarmony(currentChord, epoch, localTension));
            }
        }

        // --- 2. BASS (Drone Policy) ---
        if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
            events.push(...this.constrainBass(this.renderThemeBass(currentChord, epoch, localTension, dna)));
        } else if (hints.bass) {
            // #ЗАЧЕМ: Принудительный дрон, если нет DNA.
            events.push(...this.constrainBass(this.renderDroneBass(currentChord, localTension)));
        }

        // --- 3. MELODY (Passage Policy) ---
        if (hints.melody && !isSoloistResting) {
            const isBoundary = navInfo.isPartTransition || navInfo.isBundleTransition;
            if (isBoundary && this.random.next() < 0.7) {
                // #ЗАЧЕМ: Красивые медленные пассажи на стыках.
                events.push(...this.renderBeautifulPassage(currentChord, localTension));
            } else if (this.currentTheme && epoch < this.currentTheme.endBar) {
                events.push(...this.renderThemeMelody(currentChord, epoch, localTension, hints, dna, 'melody', this.currentTheme.phrase, this.currentThemeMaxTick, 1));
            } else {
                events.push(...this.renderMelodicPadBase(currentChord, epoch, localTension));
            }
        }

        // --- 4. DRUMS (Percussion Priority) ---
        if (hints.drums) {
            events.push(...this.renderTexturalPercussion(epoch, localTension));
        }

        // --- 5. TEXTURES ---
        if (hints.sparkles && this.random.next() < 0.3) {
            events.push(this.renderSparkle(currentChord, isPositive));
        }
        if (hints.sfx && epoch % 16 === 0 && this.random.next() < 0.3) {
            events.push(...this.renderSfx(localTension));
        }

        return { 
            events, 
            tension: localTension, 
            beautyScore: 0.5,
            mutationType: this.currentMutationType,
            activeAxioms: {
                melody: isSoloistResting ? 'Breath' : (this.currentTheme?.id || 'Generative'),
                ensemble: this.ensembleStatus,
                bass: this.currentBassTheme ? 'Sibling' : 'Static Drone',
                drums: 'Sonic Cube'
            },
            narrative: `Ambient Texture: ${this.currentTrackName || 'Algorithmic Cloud'}`
        };
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number) {
        this.currentAccompAxioms = []; 
        let cloudAxiom: any = null;
        const poolToUse = this.cloudAxioms.length > 0 ? this.cloudAxioms : (dna.cloudAxioms || []);

        if (poolToUse.length > 0) {
            const targetAnchor = this.activeAnchorId ? this.normalizeStr(this.activeAnchorId) : null;
            
            let basePool = poolToUse.filter(ax => ax.role === 'melody');
            if (targetAnchor) {
                const anchorPool = poolToUse.filter(ax => this.normalizeStr(ax.compositionId) === targetAnchor);
                basePool = anchorPool.filter(ax => ax.role === 'melody');
                if (basePool.length === 0) {
                    basePool = anchorPool.filter(ax => ax.role?.startsWith('accomp'));
                }
            }

            if (basePool.length > 0) {
                const freshPool = basePool.filter(ax => !this.usedThemeHistory.includes(ax.id));
                cloudAxiom = (freshPool.length > 0 ? freshPool : basePool)[this.random.nextInt(Math.max(1, freshPool.length || basePool.length))];
                if (cloudAxiom) {
                    this.usedThemeHistory.push(cloudAxiom.id);
                    if (this.usedThemeHistory.length > 30) this.usedThemeHistory.shift();
                }
            }
        }

        if (cloudAxiom) {
            let rawPhrase = decompressCompactPhrase(cloudAxiom.phrase);
            const phrasesToNormalize = [rawPhrase];
            const cid = this.normalizeStr(cloudAxiom.compositionId);

            const bassSibling = poolToUse.find(ax => 
                ax.role === 'bass' && this.normalizeStr(ax.compositionId) === cid && ax.barOffset === cloudAxiom.barOffset
            );
            
            let rawBass: any[] | null = null;
            if (bassSibling) {
                rawBass = decompressCompactPhrase(bassSibling.phrase);
                phrasesToNormalize.push(rawBass);
            }

            const accompSiblings = poolToUse.filter(ax => 
                ax.role?.startsWith('accomp') && this.normalizeStr(ax.compositionId) === cid && ax.barOffset === cloudAxiom.barOffset
            ).slice(0, 3);

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
        // #ЗАЧЕМ: Строго 1 нота на такт для дрона.
        return [{
            type: 'bass',
            note: this.constrainBassOctave(chord.rootNote - 12),
            time: 0,
            duration: 4.0,
            weight: 0.75,
            technique: 'drone',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 1.5, release: 2.0 }
        }];
    }

    private renderTexturalPercussion(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const kit = DRUM_KITS.ambient[this.mood as any] || DRUM_KITS.ambient.melancholic;

        // 1. Rare Drums (Kick/Toms)
        if (this.random.next() < 0.2) {
            const kick = kit.kick[this.random.nextInt(kit.kick.length)] || 'drum_kick_soft';
            events.push({ type: kick as any, note: 36, time: 0, duration: 0.1, weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }
        if (this.random.next() < 0.25) {
            const tomPool = ['drum_Sonor_Classix_Low_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_High_Tom'];
            const tom = tomPool[this.random.nextInt(tomPool.length)];
            events.push({ type: tom as any, note: 40, time: 1.5 + this.random.next() * 2, duration: 1.5, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }

        // 2. Iron (Ghost Hats & Wet Ride)
        if (this.random.next() < 0.4) {
            events.push({ type: 'drum_closed_hi_hat_ghost', note: 42, time: 0.5 + this.random.next() * 3, duration: 0.1, weight: 0.2, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }
        if (tension > 0.6 && this.random.next() < 0.2) {
            events.push({ type: 'drum_ride_wetter', note: 51, time: 0, duration: 4.0, weight: 0.2, technique: 'hit', dynamics: 'p', phrasing: 'legato' });
        }

        // 3. Mandatory Percussion (Sonic Cube)
        // #ЗАЧЕМ: Обязательное использование всех 15 perc, tube и bongo.
        if (this.random.next() < 0.7) {
            const count = 1 + this.random.nextInt(3);
            for (let i = 0; i < count; i++) {
                const perc = kit.perc[this.random.nextInt(kit.perc.length)];
                events.push({ 
                    type: perc as any, 
                    note: 48, 
                    time: this.random.next() * 3.8, 
                    duration: 1.0, 
                    weight: 0.45, 
                    technique: 'hit', 
                    dynamics: 'p', 
                    phrasing: 'staccato' 
                });
            }
        }

        return events;
    }

    private renderBeautifulPassage(chord: GhostChord, tension: number): FractalEvent[] {
        // #ЗАЧЕМ: Медленные красивые каскады на границах.
        const root = chord.rootNote + 24;
        const scale = [0, 2, 4, 7, 9, 11, 12, 14]; 
        const events: FractalEvent[] = [];
        const count = 3 + this.random.nextInt(4);
        for(let i=0; i<count; i++) {
            events.push({
                type: 'melody',
                note: Math.min(root + scale[this.random.nextInt(scale.length)], this.MELODY_CEILING),
                time: i * 0.8,
                duration: 2.5,
                weight: 0.45,
                technique: 'pick',
                dynamics: 'p',
                phrasing: 'legato',
                params: { attack: 0.3, release: 2.0 }
            });
        }
        return events;
    }

    private renderGenerativePiano(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = chord.rootNote + 24;
        const note = root + (this.random.next() < 0.5 ? 7 : 0);
        return [{
            type: 'pianoAccompaniment',
            note: Math.min(note, this.MELODY_CEILING),
            time: this.random.next() * 3,
            duration: 2.0,
            weight: 0.35,
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'staccato',
            params: { release: 1.5 }
        }];
    }

    private renderGenerativeHarmony(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12 + this.registerShift;
        return [{
            type: 'harmony',
            note: Math.min(root + (chord.chordType === 'minor' ? 3 : 4), this.PAD_CEILING),
            time: 0,
            duration: 4.0,
            weight: 0.4,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato'
        }];
    }

    private renderPad(chord: GhostChord, epoch: number, timbre: string, tension: number): FractalEvent[] {
        const root = Math.min(chord.rootNote + 12 + this.registerShift, this.PAD_CEILING);
        // #ЗАЧЕМ: Редкость органа.
        const isOrgan = timbre.includes('organ');
        if (isOrgan && this.random.next() > 0.15) return [];

        return [0, 7, 12].map((n, i) => ({
            type: 'accompaniment',
            note: Math.min(root + n, this.PAD_CEILING + 12), 
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
        const barCountInPhrase = Math.ceil(this.currentThemeMaxTick / 12);
        const barInAxiom = epoch % barCountInPhrase; 
        const barOffset = barInAxiom * 12;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + 12);
        const events: FractalEvent[] = [];

        barNotes.forEach(n => {
            // #ЗАЧЕМ: Анти-гул. Дробление длинных нот Heritage.
            if (n.d >= 6 && type === 'accompaniment') {
                [0, 4.5, 9].forEach(p => {
                    const tick = (n.t - barOffset) + p;
                    if (tick < 12) {
                        events.push({
                            type: type,
                            note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.registerShift, this.PAD_CEILING + 12),
                            time: tick / 3,
                            duration: 0.8,
                            weight: 0.5 * (p === 0 ? 1.1 : 0.8),
                            technique: 'hit',
                            dynamics: 'p',
                            phrasing: 'staccato'
                        });
                    }
                });
            } else {
                events.push({
                    type: type,
                    note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.registerShift, this.PAD_CEILING + 12),
                    time: (n.t - barOffset) / 3,
                    duration: n.d / 3,
                    weight: 0.5,
                    technique: tension > 0.7 ? 'hit' : 'swell',
                    dynamics: 'p',
                    phrasing: 'legato'
                });
            }
        });
        return events;
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
        const barInAxiom = epoch % (this.currentThemeMaxTick / 12);
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
            phrasing: 'legato'
        }];
    }

    private renderMelodicPadBase(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        return [{
            type: 'melody',
            note: Math.min(chord.rootNote + 24 + this.registerShift, this.MELODY_CEILING),
            time: 0,
            duration: 4.0,
            weight: 0.35,
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

    private renderSfx(tension: number): FractalEvent[] {
        return [{
            type: 'sfx', note: 60, time: this.random.next() * 2, duration: 4.0, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: { mood: this.mood, genre: this.genre }
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
}
