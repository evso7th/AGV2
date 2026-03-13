
/**
 * @fileOverview Ambient Brain V44.0 — "Chronos Rotation Protocol".
 * #ОБНОВЛЕНО (ПЛАН №799): Аксиомы следуют временной сетке донора и ротируются принудительно.
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
    applyRhythmicJitter,
    safeSemitoneToDegree,
    getWalkingDegree,
    keyToMidiRoot
} from './music-theory';
import { DRUM_KITS } from './assets/drum-kits';

const TICKS_PER_BAR = 12;
const BEATS_PER_BAR = 4;
const TICK_TO_BEAT = BEATS_PER_BAR / TICKS_PER_BAR; 

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export class AmbientBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private random: any;
    private useHeritage: boolean;
    
    private fog: number = 0.3;
    private pulse: number = 0.15;
    private depth: number = 0.4;
    private bright: number = 0.3;
    private registerShift: number = 0;
    private currentTransposition: number = 0;
    private microTransposition: number = 0;
    private currentNativeRoot: number | null = null; 

    private soloistBusyUntilBar: number = -1;
    private soloistRestingUntilBar: number = -1; 
    private accompanimentRestingUntilBar: number = -1; 
    
    private readonly MELODY_CEILING = 72;
    private readonly PAD_CEILING = 64;

    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string, tags: string[] } | null = null;
    private currentThemeMaxTick: number = 0;
    private currentTimeScale: number = 1;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number } | null = null; 
    private currentAccompAxioms: { phrase: any[], role: string, endBar: number }[] = []; 
    
    private currentTrackName: string = '';
    private ensembleStatus: 'SIBLING' | 'ADAPTIVE' | 'LOCAL' = 'ADAPTIVE';
    private currentMutationType: string = 'none';
    
    private cloudAxioms: any[] = [];
    private activeAnchorId: string | null = null;
    
    private usedThemeHistory: string[] = [];
    private lastPlayedOffset: number = -1;

    constructor(seed: number, mood: Mood, genre: Genre, useHeritage: boolean = true) {
        this.seed = seed;
        this.mood = mood;
        this.genre = genre;
        this.useHeritage = useHeritage;
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

    public updateCloudAxioms(axioms: any[], activeAnchorId?: string | null, useHeritage?: boolean) {
        this.cloudAxioms = axioms || [];
        if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
        if (useHeritage !== undefined) this.useHeritage = useHeritage;
    }

    private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number, tension: number): number {
        const barsElapsed = epoch - startEpoch;
        const linearIndex = barsElapsed % totalBars;
        const rand = calculateMusiNum(epoch, 17, this.seed, 100) / 100;
        if (tension > 0.8 && (rand < 0.15 || rand > 0.95)) return (linearIndex + 1) % totalBars;
        return linearIndex;
    }

    public generateBar(
        epoch: number, 
        currentChord: GhostChord, 
        navInfo: NavigationInfo, 
        dna: SuiteDNA, 
        hints: InstrumentHints
    ): { events: FractalEvent[], tension: number, beautyScore: number, mutationType?: string, activeAxioms?: any, narrative?: string, newBpm?: number } {
        
        const waves = this.computeTensionWaves(epoch * (60 / dna.baseTempo) * 4);
        const localTension = this.computeGlobalTension(waves);
        const isBridge = navInfo.currentPart.id.includes('BRIDGE') || navInfo.currentPart.id.includes('TRANSITION') || navInfo.currentPart.id.includes('PROLOGUE');

        if (navInfo.isPartTransition) {
            this.soloistBusyUntilBar = epoch; 
            const shifts = [0, 2, -2, 5, 7, -5];
            this.currentTransposition = shifts[this.random.nextInt(shifts.length)];
            this.microTransposition = 0;
        }

        this.applyGeography(epoch, dna);
        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const events: FractalEvent[] = [];

        if (isBridge) {
            events.push(...this.renderLiquidBridge(epoch, resChord, localTension, hints));
            return { 
                events, tension: localTension, beautyScore: 0.5,
                lickId: 'Liquid Bridge', mutationType: 'none',
                activeAxioms: { melody: 'Bridge Flow', ensemble: 'UNISON', bass: 'Scalar Walk', drums: 'Soft Swells' },
                narrative: `Liquid Bridge: Smooth transition through ${navInfo.currentPart.name}`
            };
        }

        if (epoch % 4 === 0 && this.ensembleStatus === 'LOCAL') {
            const mutRand = this.random.next();
            if (mutRand < 0.4) { this.microTransposition = [-2, 0, 2, 5, -5][this.random.nextInt(5)]; this.currentMutationType = 'transpose'; }
            else if (mutRand < 0.6) this.currentMutationType = 'inversion';
            else if (mutRand < 0.8) this.currentMutationType = 'retrograde';
            else this.currentMutationType = 'jitter';
        }

        const isSoloistFree = epoch >= this.soloistBusyUntilBar;
        const isSoloistResting = epoch < this.soloistRestingUntilBar;

        let newBpm: number | undefined;
        if (isSoloistFree && !isSoloistResting) {
            newBpm = this.selectNextAxiom(navInfo, dna, epoch);
        }

        let activePhrase = this.currentTheme?.phrase || [];
        if (this.ensembleStatus === 'LOCAL' && activePhrase.length > 0) {
            if (this.currentMutationType === 'inversion') activePhrase = invertPhrase(activePhrase);
            else if (this.currentMutationType === 'retrograde') activePhrase = retrogradePhrase(activePhrase);
            else if (this.currentMutationType === 'jitter') activePhrase = applyRhythmicJitter(activePhrase, this.seed + epoch);
        }

        const isAccompResting = epoch < this.accompanimentRestingUntilBar;
        if (!isAccompResting) {
            this.currentAccompAxioms.forEach((ax) => {
                const role = ax.role.toLowerCase();
                let targetType: InstrumentPart = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('strings') ? 'harmony' : 'accompaniment');
                if ((navInfo.currentPart.layers as any)[targetType]) {
                    events.push(...this.renderHeritageAccompaniment(resChord, epoch, ax.phrase, targetType, dna, localTension));
                }
            });
            if (hints.accompaniment && !this.currentAccompAxioms.some(a => !a.role.includes('piano') && !a.role.includes('strings'))) {
                events.push(...this.renderPad(resChord, epoch, hints.accompaniment as string, localTension));
            }
            if (hints.pianoAccompaniment && !this.currentAccompAxioms.some(a => a.role.includes('piano'))) {
                events.push(...this.renderGenerativePiano(resChord, epoch, localTension));
            }
            if (hints.harmony && !this.currentAccompAxioms.some(a => a.role.includes('strings') || a.role.includes('violin') || a.role.includes('guitar'))) {
                events.push(...this.renderGenerativeHarmony(resChord, epoch, localTension, hints.harmony));
            }
        }

        if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
            events.push(...this.constrainBass(this.renderThemeBass(resChord, epoch, localTension, dna)));
        } else if (hints.bass) {
            events.push(...this.constrainBass(this.renderDroneBass(resChord, epoch, localTension)));
        }

        if (hints.melody && !isSoloistResting) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                events.push(...this.renderThemeMelody(resChord, epoch, localTension, hints, dna, 'melody', activePhrase, this.currentThemeMaxTick, this.currentTimeScale));
            } else {
                events.push(...this.renderMelodicPadBase(resChord, epoch, localTension));
            }
        }

        if (hints.drums) events.push(...this.renderTexturalPercussion(epoch, localTension));
        if (hints.sparkles && this.random.next() < 0.6) events.push(this.renderSparkle(resChord, MOOD_TO_COMMON[this.mood] === 'light'));
        if (hints.sfx && this.random.next() < 0.2) events.push(...this.renderSfx(localTension));

        return { 
            events, tension: localTension, beautyScore: 0.5,
            mutationType: this.currentMutationType, newBpm,
            activeAxioms: {
                melody: isSoloistResting ? 'Breath' : (this.currentTheme?.id || 'Generative'),
                ensemble: this.ensembleStatus,
                bass: this.currentBassTheme ? 'Sibling' : 'Walking Drone',
                drums: 'Sonic Cube'
            },
            narrative: `Ambient Evolution: ${this.currentTrackName || 'Algorithmic Cloud'} [Chronos Mode]`
        };
    }

    private renderLiquidBridge(epoch: number, chord: GhostChord, tension: number, hints: InstrumentHints): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote + this.currentTransposition + this.microTransposition;
        const scale = [0, 7, 12, 14, 12, 7, 0];
        [0, 6].forEach((t, i) => {
            events.push({
                type: 'bass', note: this.constrainBassOctave(root - 12 + scale[i % scale.length]),
                time: t * TICK_TO_BEAT, duration: 6.0 * TICK_TO_BEAT, weight: 0.7, technique: 'drone', dynamics: 'p', phrasing: 'legato'
            });
        });
        events.push({
            type: 'accompaniment', note: this.constrainAccompanimentOctave(root + 12),
            time: 0, duration: 4.0, weight: 0.35, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 2.0, release: 2.5 }
        });
        if (hints.melody) {
            events.push({
                type: 'melody', note: root + 24, time: 0, duration: 4.0, weight: 0.45, technique: 'swell', dynamics: 'p', phrasing: 'legato',
                params: { attack: 2.5, release: 3.0 }
            });
        }
        events.push({ type: 'drum_ride_wetter', note: 51, time: 0, duration: 4.0, weight: 0.3, technique: 'swell', dynamics: 'p', phrasing: 'legato' });
        return events;
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentAccompAxioms = []; 
        this.currentNativeRoot = null;
        this.currentTimeScale = 1;
        let cloudAxiom: any = null;
        
        const poolToUse = (this.useHeritage && this.cloudAxioms.length > 0) ? this.cloudAxioms : (this.useHeritage ? (dna.cloudAxioms || []) : []);

        if (poolToUse.length > 0) {
            const targetAnchor = this.activeAnchorId ? this.normalizeStr(this.activeAnchorId) : null;
            const commonMoodFilter = MOOD_TO_COMMON[this.mood];

            let filteredPool = poolToUse.filter(ax => {
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                const axMoods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                return axGenres.includes(this.genre) && (axMoods.includes(this.mood) || Array.isArray(ax.commonMood) ? ax.commonMood.includes(commonMoodFilter) : ax.commonMood === commonMoodFilter);
            });

            if (targetAnchor) filteredPool = filteredPool.filter(ax => this.normalizeStr(ax.compositionId) === targetAnchor);

            if (filteredPool.length > 0) {
                let basePool = filteredPool.filter(ax => ax.role === 'melody');
                if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role?.startsWith('accomp'));

                if (basePool.length > 0) {
                    // #ЗАЧЕМ: ПЛАН №799. Chronos Discovery Logic.
                    const maxDonorBars = Math.max(...basePool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
                    const suitePlayhead = epoch % (maxDonorBars || 144);
                    
                    const candidates = basePool
                        .filter(ax => !this.usedThemeHistory.includes(ax.id))
                        .sort((a, b) => Math.abs((a.barOffset || 0) - suitePlayhead) - Math.abs((b.barOffset || 0) - suitePlayhead));

                    cloudAxiom = candidates.length > 0 ? candidates[0] : basePool[this.random.nextInt(basePool.length)];
                    if (cloudAxiom) {
                        this.usedThemeHistory.push(cloudAxiom.id);
                        if (this.usedThemeHistory.length > 20) this.usedThemeHistory.shift();
                    }
                }
            }
        }

        if (cloudAxiom) {
            this.currentNativeRoot = keyToMidiRoot(cloudAxiom.nativeKey);
            let rawPhrase = decompressCompactPhrase(cloudAxiom.phrase);
            const phrasesToNormalize = [rawPhrase];
            const cid = this.normalizeStr(cloudAxiom.compositionId);
            
            const bassSibling = poolToUse.find(ax => ax.role === 'bass' && this.normalizeStr(ax.compositionId) === cid && ax.barOffset === cloudAxiom.barOffset)
                             || poolToUse.find(ax => ax.role === 'bass' && this.normalizeStr(ax.compositionId) === cid);
            if (bassSibling) {
                const rb = decompressCompactPhrase(bassSibling.phrase);
                phrasesToNormalize.push(rb);
                this.currentBassTheme = { phrase: rb, startBar: epoch, endBar: epoch + (cloudAxiom.bars || 4) };
            }
            const accompSiblings = poolToUse.filter(ax => ax.role?.startsWith('accomp') && this.normalizeStr(ax.compositionId) === cid && ax.barOffset === cloudAxiom.barOffset);
            accompSiblings.slice(0, 2).forEach(ax => {
                const p = decompressCompactPhrase(ax.phrase);
                phrasesToNormalize.push(p);
                this.currentAccompAxioms.push({ phrase: p, role: ax.role, endBar: epoch + (cloudAxiom.bars || 4) });
            });
            normalizePhraseGroup(phrasesToNormalize);
            const phraseBars = cloudAxiom.bars || 4;
            this.currentThemeMaxTick = phraseBars * TICKS_PER_BAR;
            this.currentTheme = { phrase: rawPhrase, startBar: epoch, endBar: epoch + phraseBars, id: cloudAxiom.id, tags: cloudAxiom.tags || [] };
            this.currentTrackName = cloudAxiom.compositionId;
            this.soloistBusyUntilBar = epoch + phraseBars;
            this.ensembleStatus = 'SIBLING';
            this.lastPlayedOffset = cloudAxiom.barOffset || 0;
            return cloudAxiom.nativeBpm || undefined;
        } else {
            this.ensembleStatus = 'LOCAL';
            this.currentTheme = null;
            this.soloistBusyUntilBar = epoch + 12;
            return undefined;
        }
    }

    private renderDroneBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const degrees = [0, 7, 9, 5, 0, 7, 2, 0];
        const shift = degrees[calculateMusiNum(epoch, 8, this.seed, 8)];
        return [{
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + shift + this.currentTransposition + this.microTransposition),
            time: 0, duration: 4.0, weight: 0.8, technique: 'drone', dynamics: 'p', phrasing: 'legato',
            params: { attack: 1.5, release: 2.0, filterCutoff: 300 + (tension * 200) }
        }];
    }

    private renderTexturalPercussion(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const kit = DRUM_KITS.ambient[this.mood as any] || DRUM_KITS.ambient.melancholic;
        if (this.random.next() < 0.2 || epoch % 4 === 3) events.push({ type: (kit.kick[this.random.nextInt(kit.kick.length)] || 'drum_kick_soft') as any, note: 36, time: 0, duration: 0.1, weight: 0.8, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        if (this.random.next() < 0.7) {
            const perc = kit.perc[this.random.nextInt(kit.perc.length)];
            events.push({ type: perc as any, note: 48, time: this.random.nextInt(12) * TICK_TO_BEAT, duration: 1.0, weight: 0.45, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }
        return events;
    }

    private renderThemeMelody(chord: GhostChord, epoch: number, tension: number, hints: InstrumentHints, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number): FractalEvent[] {
        const totalBarsInPhrase = Math.ceil((maxTick * timeScale) / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBarsInPhrase;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBarsInPhrase, tension);
        const barOffset = (mosaicBar * TICKS_PER_BAR) / timeScale;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + (TICKS_PER_BAR / timeScale));
        return barNotes.map(n => ({
            type: type as any,
            note: Math.min(chord.rootNote + 24 + this.registerShift + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition, this.MELODY_CEILING),
            time: (n.t - barOffset) * TICK_TO_BEAT * timeScale, duration: n.d * TICK_TO_BEAT * timeScale, weight: 0.8 + (this.random.next() * 0.1 - 0.05),
            technique: (tension > 0.6 && n.d >= 4 && this.random.next() < 0.3) ? 'vb' : 'pick', dynamics: 'p', phrasing: 'legato',
            params: { attack: 0.3, release: 1.5, filterCutoff: 2000 + (tension * 1500) }
        }));
    }

    private renderThemeBass(chord: GhostChord, epoch: number, tension: number, dna: SuiteDNA): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBarsInPhrase = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBarsInPhrase;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBarsInPhrase, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = this.currentBassTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        if (barNotes.length === 0) return this.renderDroneBass(chord, epoch, tension);
        return barNotes.map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.85, technique: 'drone', dynamics: 'p', phrasing: 'legato'
        }));
    }

    private renderHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, dna: SuiteDNA, tension: number): FractalEvent[] {
        const totalBarsInPhrase = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBarsInPhrase;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBarsInPhrase, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        return barNotes.map(n => ({
            type: type, note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.registerShift + this.currentTransposition + this.microTransposition, this.PAD_CEILING + 12),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.45 + (this.random.next() * 0.1 - 0.05),
            technique: tension > 0.7 ? 'hit' : 'swell', dynamics: 'p', phrasing: 'legato'
        }));
    }

    private renderMelodicPadBase(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const shift = [0, 2, 4, 7, 9, 7, 4, 0][calculateMusiNum(epoch, 4, this.seed, 8)];
        return [{
            type: 'melody', note: Math.min(chord.rootNote + 24 + this.registerShift + shift + this.currentTransposition + this.microTransposition, this.MELODY_CEILING),
            time: 0, duration: 4.0, weight: 0.45, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 1.5, release: 3.0, filterCutoff: 1800 + (tension * 1200) }
        }];
    }

    private renderGenerativePiano(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const shift = [0, 7, 12, 14, 11, 7, 4, 0][calculateMusiNum(epoch, 5, this.seed, 8)];
        return [{ type: 'pianoAccompaniment', note: Math.min(chord.rootNote + 24 + this.currentTransposition + this.microTransposition + shift, this.MELODY_CEILING), time: this.random.nextInt(12) * TICK_TO_BEAT, duration: 2.0, weight: 0.15, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }];
    }

    private renderGenerativeHarmony(chord: GhostChord, epoch: number, tension: number, timbre?: string): FractalEvent[] {
        const root = chord.rootNote + 12 + this.registerShift + this.currentTransposition + this.microTransposition;
        const colorDegree = epoch % 8 < 4 ? (chord.chordType === 'minor' ? 3 : 4) : 7;
        if (timbre === 'guitarChords') {
            return [{ type: 'harmony', note: root, time: 0, duration: 2.0, weight: 0.25, technique: 'hit', dynamics: 'p', phrasing: 'legato', chordName: chord.chordType === 'minor' ? 'Am' : 'A' }, { type: 'harmony', note: root + colorDegree, time: 6 * TICK_TO_BEAT, duration: 2.0, weight: 0.25, technique: 'hit', dynamics: 'p', phrasing: 'legato', chordName: chord.chordType === 'minor' ? 'Am' : 'A' }];
        }
        return [{ type: 'harmony', note: Math.min(root + colorDegree, this.PAD_CEILING), time: 0, duration: 4.0, weight: 0.35, technique: 'swell', dynamics: 'p', phrasing: 'legato' }];
    }

    private renderPad(chord: GhostChord, epoch: number, timbre: string, tension: number): FractalEvent[] {
        const root = Math.min(chord.rootNote + 12 + this.registerShift + this.currentTransposition + this.microTransposition, this.PAD_CEILING);
        return [0, 7, 12].map((n, i) => ({
            type: 'accompaniment', note: Math.min(root + n, this.PAD_CEILING + 12), time: i * TICK_TO_BEAT, duration: 5.0, weight: 0.45, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 1.0 + (1 - tension) * 1.5, release: 2.5, filterCutoff: 1200 + (tension * 800) }
        }));
    }

    private renderSparkle(chord: GhostChord, isPositive: boolean): FractalEvent {
        return { type: 'sparkle', note: chord.rootNote + 48, time: this.random.nextInt(12) * TICK_TO_BEAT, duration: 6.0, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'legato', params: { mood: this.mood, genre: this.genre, category: isPositive ? 'light' : 'ambient_common' } };
    }

    private renderSfx(tension: number): FractalEvent[] {
        return [{ type: 'sfx', note: 60, time: this.random.nextInt(12) * TICK_TO_BEAT, duration: 4.0, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: { mood: this.mood, genre: this.genre } }];
    }

    private constrainBassOctave(note: number): number {
        let finalNote = note;
        while (finalNote > 47) finalNote -= 12;
        while (finalNote < 31) finalNote += 12;
        return finalNote;
    }

    private constrainAccompanimentOctave(note: number): number {
        let finalNote = note;
        while (finalNote > 71) finalNote -= 12;
        while (finalNote < 48) finalNote += 12;
        return finalNote;
    }

    private constrainBass(events: FractalEvent[]): FractalEvent[] {
        return events.map(e => ({ ...e, note: this.constrainBassOctave(e.note) }));
    }

    private applyGeography(epoch: number, dna: SuiteDNA) {
        if (!dna.itinerary || dna.itinerary.length === 0) return;
        let stage = Math.min(2, Math.floor((epoch / 150) * 3));
        const atom = GEO_ATLAS[dna.itinerary[stage]];
        if (atom) { this.fog = atom.fog; this.depth = atom.depth; this.registerShift = atom.reg; }
    }

    private computeTensionWaves(timeSec: number): number[] {
        const p = [8, 45, 180, 600]; const phi = [0.0, 1.309, 2.618, 4.188]; const psi = [0.785, 2.094, 3.927, 5.498]; const beta = 7.2360679775; const md = [0.05, 0.12, 0.25, 0.40];
        return [0, 1, 2, 3].map(n => (Math.sin(2 * Math.PI * timeSec / p[n] + phi[n])) * (1 + md[n] * Math.sin(2 * Math.PI * timeSec / (p[n] / beta) + psi[n])));
    }

    private computeGlobalTension(waves: number[]): number {
        const w = [0.15, 0.35, 0.30, 0.20]; let t = 0;
        for (let n = 0; n < 4; n++) t += w[n] * waves[n];
        return (t + 1) / 2;
    }
}
