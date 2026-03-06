
/**
 * @fileOverview Ambient Brain v25.8 — "Total Anti-Hum Protocol".
 * #ОБНОВЛЕНО (ПЛАН №731): 
 * 1. Forced rhythmic redivision for all accompaniment notes > 6 ticks.
 * 2. Enhanced "Breath" logic for pads and piano layers.
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
    stretchToNarrativeLength, 
    decompressCompactPhrase,
    normalizePhraseGroup,
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter
} from './music-theory';
import { AMBIENT_LEGACY } from './assets/ambient-legacy';

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
    
    private fog: number = 0.3;
    private pulse: number = 0.15;
    private depth: number = 0.4;
    private bright: number = 0.3;
    private solistCutoff: number = 2000; 
    private registerShift: number = 0;

    private lastFog: number = 0.3;
    private lastDepth: number = 0.4;

    private activatedParts: Set<InstrumentPart> = new Set();
    private activeTimbres: Partial<Record<InstrumentPart, string>> = {};
    private introLotteryMap: Map<number, Partial<Record<InstrumentPart, any>>> = new Map();

    private soloistBusyUntilBar: number = -1;
    private soloistRestingUntilBar: number = -1; 
    private accompanimentRestingUntilBar: number = -1; // #ЗАЧЕМ: Паузы в аккомпанементе
    
    private readonly MELODY_CEILING = 75;
    private readonly BASS_FLOOR = 31; 

    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string, tags: string[] } | null = null;
    private currentThemeMaxTick: number = 0;
    
    private secondaryTheme: { phrase: any[], maxTick: number } | null = null;

    private currentBassTheme: { phrase: any[], startBar: number, endBar: number } | null = null; 
    private currentAccompAxioms: { phrase: any[], role: string, endBar: number }[] = []; 
    
    private currentTrackName: string = '';
    private ensembleStatus: 'SIBLING' | 'ADAPTIVE' | 'LOCAL' = 'ADAPTIVE';
    private currentMutationType: string = 'none';
    
    private cloudAxioms: any[] = [];
    private activeAnchorId: string | null = null;
    private activeAnchorRoot: number | null = null;
    
    private usedThemeHistory: string[] = [];
    private stagnationCounter: number = 0;

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

    private normalize(s: string): string {
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
        const needsCognitiveJump = this.stagnationCounter > 2;
        
        if (isPositive) {
            this.applyRadiance(epoch, dna, needsCognitiveJump);
        } else {
            this.applyGeography(epoch, dna, needsCognitiveJump);
        }

        this.applySpectralAtom(epoch, waves[3]);
        this.updateMoodAxes(epoch, localTension);

        if (epoch % 12 === 0) {
            if (!this.activeAnchorId) {
                const mutPool = ['none', 'inversion', 'retrograde', 'jitter'];
                this.currentMutationType = mutPool[this.random.nextInt(mutPool.length)];
            } else {
                this.currentMutationType = 'none';
            }
        }

        const melodyScale = navInfo.currentPart.instrumentRules?.melody?.timeScale || 1;
        
        const isSoloistFree = epoch >= this.soloistBusyUntilBar;
        const isSoloistResting = epoch < this.soloistRestingUntilBar;

        if (isSoloistFree && !isSoloistResting) {
            if (this.random.next() < 0.6) {
                this.soloistRestingUntilBar = epoch + 1 + (this.random.next() > 0.5 ? 1 : 0);
                console.log(`%c[Ambience] Taking a breath until bar ${this.soloistRestingUntilBar}`, 'color: #DA70D6; font-style: italic;');
            } else {
                this.selectNextAxiom(navInfo, dna, epoch, melodyScale);
            }
        }

        const hints = this.orchestrate(localTension, navInfo, epoch, dna);
        
        if (hints.accompaniment && hints.accompaniment.startsWith('organ')) {
            const muffleFactor = clamp(localTension * 1.3, 0.25, 0.75); 
            (hints as any).drawbars = [8, 0, 8, Math.round(5 * muffleFactor), 0, Math.round(2 * muffleFactor), 0, 0, 0];
        }

        const events: FractalEvent[] = [];

        // #ЗАЧЕМ: "Вдох" аккомпанемента в амбиенте.
        const isAccompResting = epoch < this.accompanimentRestingUntilBar;

        if (!isAccompResting && this.currentAccompAxioms.length > 0) {
            this.currentAccompAxioms.forEach((ax, idx) => {
                const role = ax.role.toLowerCase();
                let targetType: InstrumentPart = 'accompaniment';
                
                if (role.includes('piano')) targetType = 'pianoAccompaniment';
                else if (role.includes('strings') || role.includes('violin') || role.includes('guitar')) targetType = 'harmony';
                else if (idx === 1 && !this.currentAccompAxioms.some(a => a.role.includes('strings'))) targetType = 'harmony';
                else if (idx === 2) targetType = 'pianoAccompaniment';

                if ((navInfo.currentPart.layers as any)[targetType]) {
                    events.push(...this.renderHeritageAccompaniment(currentChord, epoch, ax.phrase, targetType, dna, localTension));
                }
            });
        }
        
        if (!isAccompResting && hints.accompaniment && (this.currentAccompAxioms.length === 0 || localTension > 0.7)) {
            events.push(...this.renderPad(currentChord, epoch, hints.accompaniment as string, localTension));
        }

        // Периодические паузы в аккомпанементе для "воздуха"
        if (epoch > 0 && epoch % 16 === 15 && this.random.next() < 0.2) {
            this.accompanimentRestingUntilBar = epoch + 1;
        }
        
        if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
            events.push(...this.constrainBass(this.renderThemeBass(currentChord, epoch, localTension, dna)));
        } else if (this.mood === 'anxious') {
            events.push(...this.constrainBass(this.renderRitualWalkingBass(currentChord, localTension, hints.bass as string, epoch)));
        } else {
            const bassEvs = this.renderRhythmicBass(currentChord, localTension, hints.bass as string, epoch);
            if (navInfo.isPartTransition && bassEvs.length > 0) bassEvs[0].technique = 'slide';
            events.push(...this.constrainBass(bassEvs));
        }

        const melodyEvents: FractalEvent[] = [];
        if (hints.melody) {
            events.push(...this.renderMelodicPadBase(currentChord, epoch, localTension));
            if (this.currentTheme && !isSoloistResting && epoch < this.currentTheme.endBar) {
                const mel = this.renderThemeMelody(currentChord, epoch, localTension, hints, dna, 'melody', this.currentTheme.phrase, this.currentThemeMaxTick, melodyScale);
                melodyEvents.push(...mel);
                events.push(...mel);
            }
        }

        const pianoScale = navInfo.currentPart.instrumentRules?.pianoAccompaniment?.timeScale || 1;
        if (hints.pianoAccompaniment && this.secondaryTheme && !isSoloistResting && epoch < this.soloistBusyUntilBar) {
            const secMel = this.renderThemeMelody(currentChord, epoch, localTension, hints, dna, 'pianoAccompaniment', this.secondaryTheme.phrase, this.secondaryTheme.maxTick, pianoScale);
            events.push(...secMel.map(e => ({ ...e, weight: e.weight * 0.5 })));
        } else if (hints.pianoAccompaniment && this.currentAccompAxioms.filter(a => a.role.includes('piano')).length === 0) {
            events.push(...this.renderShadowPiano(epoch, melodyEvents, events.filter(e => e.type === 'accompaniment')));
        }

        if (hints.harmony && this.currentAccompAxioms.filter(a => a.role.includes('strings') || a.role.includes('violin')).length === 0) {
            const harmonyChance = isPositive ? 0.35 : 1.0; 
            if (this.random.next() < harmonyChance) {
                const timbre = localTension > 0.55 ? 'violin' : 'guitarChords';
                hints.harmony = timbre as any; 
                events.push(...this.renderOrchestralHarmony(currentChord, epoch, hints, localTension));
            }
        }

        events.push(...this.renderAmbientPercussion(epoch, localTension));

        if (hints.sparkles) {
            if (this.random.next() < 0.3) {
                events.push(this.renderSparkle(currentChord, isPositive));
            }
        }

        if (hints.sfx && epoch % 12 === 0) {
            const sfxRule = navInfo.currentPart.instrumentRules?.sfx as any;
            events.push(...this.renderSfx(localTension, sfxRule));
        }

        const narrativeSource = this.currentTrackName || 'Atmospheric';
        const narrative = isSoloistResting ? 'Silence between themes...' : (this.currentTheme ? `Evoking ${narrativeSource} (${this.currentTheme.tags.join(', ')})` : 'Flowing through ambient textures.');

        return { 
            events, 
            instrumentHints: hints, 
            tension: localTension, 
            beautyScore: 0.5,
            mutationType: this.currentMutationType,
            activeAxioms: {
                melody: isSoloistResting ? 'Breath' : (this.currentTheme?.id || 'Atmospheric'),
                melodyTrack: isSoloistResting ? 'Silence' : narrativeSource,
                ensemble: this.ensembleStatus,
                bass: this.currentBassTheme ? 'Sibling' : (localTension > 0.7 ? 'Walking' : 'Riff'),
                drums: 'Consistent',
                accompaniment: isAccompResting ? 'Breath' : (hints.accompaniment || 'none'),
                harmony: hints.harmony || 'none'
            },
            narrative
        };
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number, melodyScale: number) {
        this.currentAccompAxioms = []; 
        this.secondaryTheme = null;
        
        let cloudAxiom: any = null;
        const poolToUse = this.cloudAxioms.length > 0 ? this.cloudAxioms : (dna.cloudAxioms || []);

        if (poolToUse.length > 0) {
            const targetAnchor = this.activeAnchorId ? this.normalize(this.activeAnchorId) : null;
            let basePool = poolToUse.filter(ax => ax.role === 'melody');
            if (targetAnchor) basePool = basePool.filter(ax => this.normalize(ax.compositionId || '') === targetAnchor);

            if (basePool.length > 0) {
                const commonMoodFilter = MOOD_TO_COMMON[this.mood];
                const moodMatched = basePool.filter(ax => {
                    const moodArr = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                    const commonArr = Array.isArray(ax.commonMood) ? ax.commonMood : [ax.commonMood];
                    return (moodArr.includes(this.mood) || commonArr.includes(commonMoodFilter));
                });

                const finalPool = moodMatched.length > 0 ? moodMatched : basePool;
                cloudAxiom = finalPool[this.random.nextInt(finalPool.length)];

                const others = finalPool.filter(ax => ax.id !== cloudAxiom.id && ax.barOffset === cloudAxiom.barOffset);
                if (others.length > 0) {
                    const sec = others[this.random.nextInt(others.length)];
                    const rawSec = decompressCompactPhrase(sec.phrase);
                    this.secondaryTheme = { phrase: rawSec, maxTick: (sec.bars || 1) * 12 };
                }
            }
        }

        if (cloudAxiom) {
            let rawPhrase = decompressCompactPhrase(cloudAxiom.phrase);
            const phrasesToNormalize = [rawPhrase];
            if (this.secondaryTheme) phrasesToNormalize.push(this.secondaryTheme.phrase);
            
            const bassSibling = poolToUse.find(ax => 
                ax.role === 'bass' && 
                this.normalize(ax.compositionId || '') === this.normalize(cloudAxiom.compositionId) &&
                ax.barOffset === cloudAxiom.barOffset
            );
            
            let rawBass: any[] | null = null;
            if (bassSibling) {
                rawBass = decompressCompactPhrase(bassSibling.phrase);
                phrasesToNormalize.push(rawBass);
            }

            const accompSiblings = poolToUse.filter(ax => 
                ax.role?.startsWith('accomp') && 
                this.normalize(ax.compositionId || '') === this.normalize(cloudAxiom.compositionId) && 
                ax.barOffset === cloudAxiom.barOffset
            ).slice(0, 3);

            const rawAccomps: any[][] = [];
            accompSiblings.forEach(ax => {
                const p = decompressCompactPhrase(ax.phrase);
                rawAccomps.push(p);
                phrasesToNormalize.push(p);
            });

            normalizePhraseGroup(phrasesToNormalize);

            if (!this.activeAnchorId && this.currentMutationType !== 'none') {
                if (this.currentMutationType === 'inversion') rawPhrase = invertPhrase(rawPhrase);
                else if (this.currentMutationType === 'retrograde') rawPhrase = retrogradePhrase(rawPhrase);
                else if (this.currentMutationType === 'jitter') rawPhrase = applyRhythmicJitter(rawPhrase);
            }

            const phraseBars = cloudAxiom.bars || Math.max(1, Math.ceil(Math.max(...rawPhrase.map(n => n.t + n.d), 0) / 12));
            this.currentThemeMaxTick = phraseBars * 12;
            
            this.currentTheme = {
                phrase: rawPhrase,
                startBar: epoch,
                endBar: epoch + (phraseBars * melodyScale),
                id: cloudAxiom.id,
                tags: cloudAxiom.tags || ['cloud']
            };
            this.currentTrackName = cloudAxiom.compositionId;
            this.soloistBusyUntilBar = epoch + (phraseBars * melodyScale);
            
            if (rawBass) {
                this.currentBassTheme = {
                    phrase: rawBass,
                    startBar: epoch,
                    endBar: epoch + (phraseBars * melodyScale)
                };
            }

            this.currentAccompAxioms = rawAccomps.map((p, idx) => ({
                phrase: p,
                role: accompSiblings[idx].role,
                endBar: epoch + (phraseBars * melodyScale)
            }));

            this.ensembleStatus = (bassSibling || accompSiblings.length > 0) ? 'SIBLING' : 'ADAPTIVE';
        } else if (!this.activeAnchorId) {
            let groupKey = dna.ambientLegacyGroup || 'BUDD';
            const group = AMBIENT_LEGACY[groupKey];
            let lickIdx = calculateMusiNum(epoch, 7, this.seed, group.licks.length);
            const lick = group.licks[lickIdx];
            
            let rawPhrase = [...lick.phrase]; 
            normalizePhraseGroup([rawPhrase]); 

            if (this.currentMutationType !== 'none') {
                if (this.currentMutationType === 'inversion') rawPhrase = invertPhrase(rawPhrase);
                else if (this.currentMutationType === 'retrograde') rawPhrase = retrogradePhrase(rawPhrase);
            }

            const phraseBars = Math.max(1, Math.ceil(Math.max(...rawPhrase.map(n => n.t + n.d), 0) / 12));
            this.currentThemeMaxTick = phraseBars * 12;
            
            this.currentTheme = {
                phrase: rawPhrase,
                startBar: epoch,
                endBar: epoch + (phraseBars * melodyScale),
                id: `${groupKey}_${lickIdx}`,
                tags: lick.tags
            };
            this.currentTrackName = 'Ambient Legacy';
            this.soloistBusyUntilBar = epoch + (phraseBars * melodyScale);
            this.ensembleStatus = 'LOCAL';
            this.currentBassTheme = null;
            this.currentAccompAxioms = [];

            const secondIdx = (lickIdx + 1) % group.licks.length;
            const secPhrase = [...group.licks[secondIdx].phrase];
            normalizePhraseGroup([secPhrase]);
            this.secondaryTheme = { phrase: secPhrase, maxTick: 48 };
        }
    }

    private renderOrchestralHarmony(chord: GhostChord, epoch: number, hints: InstrumentHints, tension: number): FractalEvent[] {
        const root = chord.rootNote; 
        const notes = [root, root + 7];
        return notes.map((n, i) => ({
            type: 'harmony',
            note: n + 12 + this.registerShift, 
            time: i * 0.5,
            duration: 8.0,
            weight: 0.55, 
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            chordName: chord.chordType === 'minor' ? 'Am' : 'E',
            params: { barCount: epoch, filterCutoff: this.solistCutoff * 0.8 }
        }));
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

    private applyGeography(epoch: number, dna: SuiteDNA, forceShift: boolean = false) {
        if (!dna.itinerary || dna.itinerary.length === 0) return;
        let stage = Math.min(2, Math.floor((epoch / 150) * 3));
        if (forceShift) stage = (stage + 1) % 3;
        const atomKey = dna.itinerary[stage];
        const atom = GEO_ATLAS[atomKey];
        if (!atom) return;
        this.fog = (this.fog + atom.fog) / 2;
        this.depth = (this.depth + atom.depth) / 2;
        this.registerShift = atom.reg;
    }

    private applyRadiance(epoch: number, dna: SuiteDNA, forceShift: boolean = false) {
        if (!dna.itinerary || dna.itinerary.length === 0) return;
        let stage = Math.min(2, Math.floor((epoch / 150) * 3));
        if (forceShift) stage = (stage + 1) % 3;
        const atomKey = dna.itinerary[stage];
        const atom = LIGHT_ATLAS[atomKey];
        if (!atom) return;
        this.fog = (this.fog + atom.fog) / 2;
        this.depth = (this.depth + atom.depth) / 2;
        this.bright = atom.bright;
        this.registerShift = this.mood === 'joyful' ? 12 : (this.mood === 'epic' ? -12 : 0);
    }

    private orchestrate(tension: number, navInfo: NavigationInfo, epoch: number, dna: SuiteDNA): InstrumentHints {
        const hints: InstrumentHints = { summonProgress: {} };
        const part = navInfo.currentPart;
        const stages = part.stagedInstrumentation;

        if (part.id === 'INTRO' && stages && stages.length > 0 && this.introLotteryMap.size === 0) {
            this.performIntroLottery(stages);
        }

        let currentInstructions: Partial<Record<InstrumentPart, any>> | undefined;

        if (part.id === 'INTRO' && this.introLotteryMap.size > 0) {
            const partBars = navInfo.currentPartEndBar - navInfo.currentPartStartBar + 1;
            const progress = (epoch - navInfo.currentPartStartBar) / (partBars || 1);
            const stageIndex = Math.floor(progress * (stages?.length || 1));
            currentInstructions = this.introLotteryMap.get(Math.min(stageIndex, (stages?.length || 1) - 1));
        } else if (stages && stages.length > 0) {
            const partBars = navInfo.currentPartEndBar - navInfo.currentPartStartBar + 1;
            const progress = (epoch - navInfo.currentPartStartBar) / (partBars || 1);
            let acc = 0;
            for (const s of stages) { 
                acc += s.duration.percent; 
                if (progress * 100 <= acc) { currentInstructions = s.instrumentation; break; } 
            }
        } else {
            currentInstructions = part.instrumentation;
        }

        if (currentInstructions) {
            Object.entries(currentInstructions).forEach(([partStr, rule]: [any, any]) => {
                const part = partStr as InstrumentPart;
                if (!this.activatedParts.has(part)) {
                    if (this.random.next() < (rule.activationChance ?? 1.0)) {
                        this.activatedParts.add(part);
                        let selected = pickWeightedDeterministic(rule.instrumentOptions || rule.v2Options || rule.options || [], this.seed, epoch, 500);
                        this.activeTimbres[part] = selected;
                    }
                } else if (rule.instrumentOptions?.length > 0) {
                    let selected = pickWeightedDeterministic(rule.instrumentOptions, this.seed, epoch, 500);
                    this.activeTimbres[part] = selected;
                }
            });
        }

        if (part.layers) {
            this.activatedParts.forEach(p => {
                if ((part.layers as any)[p]) {
                    (hints as any)[p] = this.activeTimbres[p] || 'synth';
                    hints.summonProgress![p] = 1.0;
                }
            });
            if (part.layers.pianoAccompaniment) hints.pianoAccompaniment = 'piano';
        }

        return hints;
    }

    private renderPad(chord: GhostChord, epoch: number, timbre: string, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12 + this.registerShift;
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const notes = [root, root + (isMinor ? 3 : 4), root + 7];

        // #ЗАЧЕМ: Устранение гудения в пэдах.
        // #ЧТО: Дробление пэда на два перекрывающихся вступления.
        return notes.flatMap((n, i) => [
            {
                type: 'accompaniment',
                note: n,
                time: (i * 0.2),
                duration: 6.0, 
                weight: 0.45,
                technique: 'swell',
                dynamics: 'p',
                phrasing: 'legato',
                params: { attack: 0.8, release: 2.0, filterCutoff: this.solistCutoff * 0.6, barCount: epoch }
            },
            {
                type: 'accompaniment',
                note: n,
                time: 2.0 + (i * 0.1),
                duration: 6.0,
                weight: 0.4,
                technique: 'swell',
                dynamics: 'p',
                phrasing: 'legato',
                params: { attack: 1.2, release: 3.0, filterCutoff: this.solistCutoff * 0.55, barCount: epoch }
            }
        ]);
    }

    private renderHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, dna: SuiteDNA, tension: number): FractalEvent[] {
        const barCountInPhrase = Math.ceil(this.currentThemeMaxTick / 12);
        const startEpoch = this.soloistBusyUntilBar - barCountInPhrase;
        const barInAxiom = (epoch - startEpoch) % barCountInPhrase;
        const barOffset = barInAxiom * 12;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + 12);

        const effectiveRoot = (dna.activeAnchorRoot && this.activeAnchorId) ? dna.activeAnchorRoot : chord.rootNote;

        const events: FractalEvent[] = [];

        barNotes.forEach(n => {
            // #ЗАЧЕМ: Устранение бесконечного гудения (ПЛАН №731).
            // #ЧТО: Любая нота длиннее 6 тиков дробится на ритмические "капли".
            const isLong = n.d >= 6;
            
            if (isLong && type === 'accompaniment') {
                const compingPattern = [0, 6]; 
                compingPattern.forEach(p => {
                    events.push({
                        type: type,
                        note: effectiveRoot + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.registerShift,
                        time: ((n.t - barOffset) + p) / 3,
                        duration: 1.5,
                        weight: 0.5,
                        technique: 'hit',
                        dynamics: 'p',
                        phrasing: 'staccato',
                        params: { attack: 0.1, release: 2.5, filterCutoff: this.solistCutoff * 0.7, barCount: epoch }
                    });
                });
            } else {
                events.push({
                    type: type,
                    note: effectiveRoot + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.registerShift,
                    time: (n.t - barOffset) / 3,
                    duration: n.d / 3,
                    weight: 0.55,
                    technique: n.d < 4 ? 'hit' : 'swell',
                    dynamics: 'p',
                    phrasing: 'legato',
                    params: { attack: 0.8, release: 4.0, filterCutoff: this.solistCutoff * 0.75, barCount: epoch }
                });
            }
        });

        return events;
    }

    private renderMelodicPadBase(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        return [{
            type: 'melody',
            note: chord.rootNote + 24 + this.registerShift,
            time: 0,
            duration: 4.0,
            weight: 0.4,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 1.0, release: 3.0, filterCutoff: this.solistCutoff * 0.5 }
        }];
    }

    private renderThemeMelody(chord: GhostChord, epoch: number, tension: number, hints: InstrumentHints, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number = 1): FractalEvent[] {
        const barCountInPhrase = Math.ceil(maxTick / 12);
        const phraseBarsStretched = barCountInPhrase * timeScale;
        const startEpoch = this.soloistBusyUntilBar - phraseBarsStretched;
        
        const relativeBar = epoch - startEpoch;
        const barInCycle = relativeBar % phraseBarsStretched;
        const originalTicksPerBar = 12 / timeScale;
        const startOriginalTickInCycle = barInCycle * originalTicksPerBar;
        const endOriginalTickInCycle = startOriginalTickInCycle + originalTicksPerBar;

        const barNotes = phrase.filter(n => {
            const cycleTick = n.t % maxTick;
            return cycleTick >= startOriginalTickInCycle && cycleTick < endOriginalTickInCycle;
        });

        const effectiveRoot = (dna.activeAnchorRoot && this.activeAnchorId) ? dna.activeAnchorRoot : chord.rootNote;

        return barNotes.map(n => {
            const cycleTick = n.t % maxTick;
            const tickInBar = (cycleTick - startOriginalTickInCycle) * timeScale;
            
            return {
                type: type as any,
                note: Math.min(effectiveRoot + 36 + (n.octShift || 0) + this.registerShift + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
                time: tickInBar / 3,
                duration: (n.d * timeScale) / 3, 
                weight: 0.85,
                technique: n.tech || 'pick',
                dynamics: 'p',
                phrasing: 'legato', 
                params: { filterCutoff: this.solistCutoff, barCount: epoch } 
            };
        });
    }

    private renderThemeBass(chord: GhostChord, epoch: number, tension: number, dna: SuiteDNA): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const barCountInPhrase = Math.ceil(this.currentThemeMaxTick / 12);
        const startEpoch = this.soloistBusyUntilBar - barCountInPhrase;
        const barInAxiom = (epoch - startEpoch) % barCountInPhrase;
        const barOffset = barInAxiom * 12;
        const barNotes = this.currentBassTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + 12);

        const effectiveRoot = (dna.activeAnchorRoot && this.activeAnchorId) ? dna.activeAnchorRoot : chord.rootNote;

        return barNotes.map(n => {
            const pitch = effectiveRoot - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0);
            return {
                type: 'bass',
                note: pitch,
                time: (n.t - barOffset) / 3, 
                duration: 3.5, 
                weight: 0.85,
                technique: 'pluck',
                dynamics: 'p',
                phrasing: 'legato',
                params: { attack: 0.1, release: 0.8, filterCutoff: 400 }
            };
        });
    }

    private renderRhythmicBass(chord: GhostChord, tension: number, timbre: string, epoch: number): FractalEvent[] {
        const root = chord.rootNote - 12; 
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        
        const pattern = [
            { t: 0, n: root, d: 0.7, w: 0.85 },
            { t: 1.5, n: root + 7, d: 0.4, w: 0.75 }, 
            { t: 2.0, n: root + (isMinor ? 3 : 4), d: 0.4, w: 0.75 },
            { t: 3.5, n: root + 7, d: 0.7, w: 0.8 }
        ];
        return pattern.map(p => ({
            type: 'bass', note: p.n, time: p.t, duration: p.d, 
            weight: p.w, technique: 'pluck', dynamics: p.t === 0 ? 'mf' : 'p', phrasing: 'legato',
            params: { attack: 0.1, release: 0.8, filterCutoff: 400 } 
        }));
    }

    private renderRitualWalkingBass(yogaChord: GhostChord, localTension: number, timbre: string, epoch: number): FractalEvent[] {
        const root = yogaChord.rootNote - 12;
        const ritualPattern = [
            { t: 0, n: root, w: 0.85 }, { t: 1.0, n: root + 7, w: 0.75 }, { t: 1.5, n: root + 6, w: 0.8 }, { t: 2.5, n: root, w: 0.8 }
        ];
        return ritualPattern.map(p => ({
            type: 'bass', note: p.n, time: p.t, duration: 0.4,
            weight: p.w, technique: 'pluck', dynamics: 'p', phrasing: 'staccato',
            params: { attack: 0.05, release: 0.4, filterCutoff: 400 }
        }));
    }

    private renderShadowPiano(epoch: number, melodyEvents: FractalEvent[], accompanimentEvents: FractalEvent[]): FractalEvent[] {
        if (melodyEvents.length > 0 && this.random.next() < 0.6) {
            return melodyEvents.slice(0, 2).map(me => ({ ...me, type: 'pianoAccompaniment', weight: 0.3, technique: 'hit', phrasing: 'staccato' }));
        }
        return accompanimentEvents.map(ae => ({ ...ae, type: 'pianoAccompaniment', weight: 0.25, technique: 'hit', phrasing: 'staccato' }));
    }

    private renderAmbientPercussion(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const heartbeatProb = 0.95; 
        if (this.random.next() < heartbeatProb) {
            events.push({ type: 'drum_kick_reso', note: 36, time: 0, duration: 0.1, weight: 0.85, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
            events.push({ type: 'drum_Sonor_Classix_Low_Tom', note: 40, time: 0, duration: 1.0, weight: 0.75, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
            
            if (this.random.next() < 0.5) {
                events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: 2.0, duration: 0.1, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
            }
        }
        return events;
    }

    private renderSparkle(chord: GhostChord, isPositive: boolean): FractalEvent {
        return {
            type: 'sparkle',
            note: chord.rootNote + 48 + this.registerShift,
            time: this.random.next() * 4,
            duration: 6.0,
            weight: 0.6, 
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'legato',
            params: { mood: this.mood, genre: this.genre, category: isPositive ? 'light' : 'ambient_common' }
        };
    }

    private renderSfx(tension: number, options?: any): FractalEvent[] {
        return [{
            type: 'sfx',
            note: 60,
            time: this.random.next() * 2,
            duration: 4.0,
            weight: 0.5, 
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'staccato',
            params: { mood: this.mood, genre: this.genre, options }
        }];
    }

    private performIntroLottery(stages: any[]) {
        const participantsMap = new Map<InstrumentPart, any>();
        stages.forEach(s => {
            if (s.instrumentation) {
                Object.entries(s.instrumentation).forEach(([part, rule]) => {
                    participantsMap.set(part as InstrumentPart, rule);
                });
            }
        });
        const allParts = Array.from(participantsMap.keys());
        const shuffledParts = this.random.shuffle(allParts);
        const stageCount = stages.length || 1;
        const partsPerStage = Math.ceil(shuffledParts.length / stageCount);
        stages.forEach((_, i) => {
            const stageParts = shuffledParts.slice(i * partsPerStage, (i + 1) * participantsMap.size); 
            const stageInstr: Partial<Record<InstrumentPart, any>> = {};
            stageParts.forEach(part => { stageInstr[part] = participantsMap.get(part); });
            this.introLotteryMap.set(i, stageInstr);
        });
    }

    private applySpectralAtom(epoch: number, t3: number) {
        const atomKeys = Object.keys(SPECTRAL_ATOMS);
        const normalizedT3 = (t3 + 1.5) / 3.0;
        const safeIdx = Math.floor(Math.max(0, Math.min(0.999, normalizedT3)) * atomKeys.length);
        const atom = SPECTRAL_ATOMS[atomKeys[safeIdx]];
        if (!atom) return;
        const step = epoch % 5; 
        this.fog = (this.fog + atom.fog[step]) / 2;
        this.depth = (this.depth + atom.depth[step]) / 2;
    }

    private computeTensionWaves(timeSec: number): number[] {
        for (var waves = [], n = 0; n < 4; n++) {
            var base = Math.sin(2 * Math.PI * timeSec / PERIODS[n] + PHI[n]),
                mod = Math.sin(2 * Math.PI * timeSec / (PERIODS[n] / BETA) + PSI[n]);
            waves.push(base * (1 + MOD_DEPTH[n] * mod));
        }
        return waves;
    }

    private computeGlobalTension(waves: number[]): number {
        for (var t = 0, n = 0; n < 4; n++) t += WEIGHTS[n] * waves[n];
        return (t + 1) / 2;
    }

    private updateMoodAxes(epoch: number, tension: number) {
        this.fog = Math.max(0, Math.min(1, 0.3 + (tension * 0.55))); 
        this.depth = Math.max(0, Math.min(1, 0.4 + (tension * 0.45)));
        this.pulse = Math.max(0, Math.min(1, 0.15 + (tension * 0.35)));
        const isPositive = ['joyful', 'enthusiastic', 'epic'].includes(this.mood);
        const dazzle = (isPositive && tension > 0.85) ? 1.0 : 0;
        const maxCutoff = isPositive ? 6500 : (this.mood === 'anxious' ? 3500 : 5300);
        this.solistCutoff = (maxCutoff * (1 - this.fog * 0.7) + 1500) * (1.0 + dazzle * 0.5); 
    }
}
