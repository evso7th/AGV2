/**
 * @fileOverview Dark Foundry Brain V8.0 — "Industrial Power Protocol".
 * #ЗАЧЕМ: Интеграция технологий Cyber Blues (Golden Ticks, Long Howl, Rhythmic Chugging).
 * #ЧТО: 1. Аккомпанемент теперь пульсирует по золотым долям (0,3,6,9).
 *       2. Золотые ноты Heritage получают 2.5x сустейн для "органного" шлейфа.
 *       3. Внедрен строгий контроль пауз между текстурами (6с окно).
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
    Technique
} from '@/types/music';
import {
    calculateMusiNum,
    DEGREE_TO_SEMITONE,
    decompressCompactPhrase,
    resolveSemanticTimbre,
    mergeIdenticalNotes,
    keyToMidiRoot,
    normalizeStr,
    TICKS_PER_BAR,
    TICK_TO_BEAT,
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter
} from './music-theory';
import { DRUM_KITS } from './assets/drum-kits';

class SeededRNG {
  private state: number;
  constructor(seed: number) { this.state = seed; }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % Math.pow(2, 32);
    return this.state / Math.pow(2, 32);
  }
  nextInt(max: number): number { 
      if (max <= 0) return 0;
      return Math.floor(this.next() * max); 
  }
  chance(p: number): boolean { return this.next() < p / 100; }
}

export class DarkFoundryBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private rng: SeededRNG;
    private useHeritage: boolean;
    private isImprovising: boolean = false;

    private cloudAxioms: any[] = [];
    private activeAnchorId: string | null = null;
    
    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAxiomMaxTick: number = 0;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    
    private currentTrackName: string = 'Algorithmic';
    private sessionAnchorId: string | null = null; 
    private currentNativeRoot: number | null = null;
    private soloistBusyUntilBar: number = -1;
    private currentMutationType: string = 'none';
    private microTransposition: number = 0;
    private lickHistory: string[] = [];
    
    private lastTextureTime = -999;

    private readonly MELODY_CEILING = 71;
    // #ЗАЧЕМ: Протокол Золотой Ноты (0, 3, 6, 9).
    private readonly GOLDEN_TICKS = [0, 3, 6, 9];

    constructor(seed: number, mood: Mood, genre: Genre, useHeritage: boolean = true) {
        this.seed = seed;
        this.mood = mood;
        this.genre = genre;
        this.useHeritage = useHeritage;
        this.rng = new SeededRNG(seed);
    }

    private isGolden(tick: number): boolean {
        const relT = ((tick % TICKS_PER_BAR) + TICKS_PER_BAR) % TICKS_PER_BAR;
        return this.GOLDEN_TICKS.some(gt => Math.abs(relT - gt) < 0.1);
    }

    private wrapMelody(midi: number): number {
        let v = midi;
        if (!isFinite(v)) return 60;
        while (v > this.MELODY_CEILING) v -= 12;
        return v;
    }

    public updateCloudAxioms(axioms: any[], activeAnchorId?: string | null, useHeritage?: boolean, isImprovising?: boolean) {
        this.cloudAxioms = axioms || [];
        if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
        if (useHeritage !== undefined) this.useHeritage = useHeritage;
        if (this.isImprovising !== undefined) this.isImprovising = isImprovising;
        if (this.cloudAxioms.length > 0 && this.useHeritage) this.soloistBusyUntilBar = -1;
    }

    private phraseBarCount(phrase: any[]): number {
        if (!phrase || phrase.length === 0) return 1;
        let maxT = 0;
        for (const n of phrase) if (n.t > maxT) maxT = n.t;
        return Math.max(1, Math.floor(maxT / TICKS_PER_BAR) + 1);
    }

    private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number, tension: number): number {
        if (totalBars <= 0) return 0;
        const startOffset = calculateMusiNum(this.seed, 13, 0, totalBars);
        if (this.isImprovising) return calculateMusiNum(epoch + startOffset, 7, this.seed, totalBars);
        const barsElapsed = epoch - startEpoch;
        return Math.abs(barsElapsed + startOffset) % totalBars;
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentTheme = null;
        this.currentBassTheme = null;
        this.currentAccompAxioms = [];

        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        let filteredPool = effectiveAnchor 
            ? poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor)
            : poolToUse.filter(ax => {
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                return axGenres.some((g: string) => ['trance', 'psybient', 'foundry'].includes(g));
            });

        if (filteredPool.length === 0 && !effectiveAnchor) {
            filteredPool = poolToUse;
        }

        if (filteredPool.length > 0) {
            let basePool = filteredPool.filter(ax => ax.role === 'melody');
            if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role.toLowerCase().includes('accomp'));

            if (basePool.length > 0) {
                if (!effectiveAnchor) {
                    const first = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                    if (first) {
                        this.sessionAnchorId = normalizeStr(first.compositionId);
                        effectiveAnchor = this.sessionAnchorId;
                        filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
                        basePool = filteredPool.filter(ax => ax.role === 'melody' || ax.role.toLowerCase().includes('accomp'));
                    }
                }

                if (basePool.length === 0) {
                    this.soloistBusyUntilBar = epoch + 1;
                    return undefined;
                }

                const maxDonorBars = Math.max(4, ...basePool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
                const tension = dna.tensionMap?.[epoch] ?? 0.5;
                const targetOffset = this.getMosaicIndex(epoch, 0, maxDonorBars, tension);
                
                const sameOffsetPool = basePool.filter(ax => (ax.barOffset || 0) === targetOffset);
                const freshLicks = sameOffsetPool.filter(ax => !this.lickHistory.includes(ax.id));
                
                let selected = null;
                if (freshLicks.length > 0) {
                    selected = freshLicks[this.rng.nextInt(freshLicks.length)];
                } else if (sameOffsetPool.length > 0) {
                    selected = sameOffsetPool[this.rng.nextInt(sameOffsetPool.length)];
                } else {
                    selected = basePool[this.rng.nextInt(basePool.length)];
                }

                if (selected) {
                    this.lickHistory.push(selected.id);
                    if (this.lickHistory.length > 50) this.lickHistory.shift();

                    this.currentTrackName = selected.compositionId;
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    const cid = normalizeStr(selected.compositionId);
                    
                    const bass = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bass) this.currentBassTheme = { phrase: decompressCompactPhrase(bass.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: bass.id };

                    this.currentAccompAxioms = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset)
                        .map(ax => ({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument }));

                    const baseBars = selected.bars || 4;
                    this.currentAxiomMaxTick = baseBars * TICKS_PER_BAR;
                    this.currentTheme = { phrase: mergeIdenticalNotes(decompressCompactPhrase(selected.phrase)), startBar: epoch, endBar: epoch + baseBars, id: selected.id };
                    this.soloistBusyUntilBar = epoch + baseBars;
                    return selected.nativeBpm || undefined;
                }
            }
        }
        this.currentTrackName = 'Algorithmic';
        this.soloistBusyUntilBar = epoch + 1; 
        return undefined;
    }

    private applyMutationLogic(phrase: any[], tension: number, seed: number): any[] {
        let notes = [...phrase];
        if (this.currentMutationType === 'inversion') notes = invertPhrase(notes);
        else if (this.currentMutationType === 'retrograde') notes = retrogradePhrase(notes);
        else if (this.currentMutationType === 'jitter') notes = applyRhythmicJitter(notes, seed);
        return notes;
    }

    public generateBar(epoch: number, currentChord: GhostChord, navInfo: NavigationInfo, dna: SuiteDNA, hints: InstrumentHints): any {
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        const kit = DRUM_KITS.foundry[this.mood as any] || DRUM_KITS.foundry.melancholic;

        if (epoch % 4 === 0) {
            const roll = calculateMusiNum(epoch, 29, this.seed, 100);
            if (roll < 30) this.currentMutationType = 'none';
            else if (roll < 60) this.currentMutationType = 'retrograde';
            else this.currentMutationType = 'jitter';
        }

        if (epoch >= this.soloistBusyUntilBar) this.selectNextAxiom(navInfo, dna, epoch);

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const events: FractalEvent[] = [];

        const ensembleAnchor = this.currentTheme ? this.currentTheme.startBar : epoch;
        const ensembleTotalBars = Math.max(1, Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR));
        const mosaicBar = this.getMosaicIndex(epoch, ensembleAnchor, ensembleTotalBars, tension);

        // 1. NEURO DRUMS
        if (hints.drums) events.push(...this.renderFoundryDrums(epoch, tension, kit));

        // 2. BASS
        if (hints.bass) {
            const b = (this.currentBassTheme && epoch < this.currentBassTheme.endBar)
                ? this.renderHeritageBass(epoch, resChord, tension, mosaicBar)
                : this.renderRollingBass(epoch, resChord, tension);
            events.push(...b); 
        }

        // 3. SYNTHESIS
        let melodyEvents: FractalEvent[] = [];
        if (hints.melody) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                melodyEvents = this.renderHeritageMelody(epoch, resChord, tension, mosaicBar);
            }
            if (melodyEvents.length === 0) {
                melodyEvents.push(...this.renderShimmerArp(epoch, resChord, tension));
            }
            events.push(...melodyEvents); 
        }

        const usedTargetLayers = new Set<string>();
        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: InstrumentPart | null = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('harmony') ? 'harmony' : (role.includes('accomp') ? 'accompaniment' : null));
            if (target && (hints as any)[target] && !usedTargetLayers.has(target)) {
                let renders = this.renderHeritageLayer(resChord, epoch, ax.phrase, target, tension, mosaicBar);
                
                // #ЗАЧЕМ: ПЛАН №2555. Принудительный унисон "Золотой Доли".
                renders = renders.filter(n => this.isGolden(n.time / TICK_TO_BEAT));
                renders.forEach(n => {
                    n.note = this.wrapMelody(n.note);
                    n.weight *= 0.85;
                    // #ЗАЧЕМ: The Long Howl. Увеличиваем хвост для "органного" резонанса.
                    n.duration *= 2.0; 
                }); 
                events.push(...renders); 
                usedTargetLayers.add(target);
            }
        });
        
        if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
            // #ЗАЧЕМ: Заменяем статический пэд на ритмический "Chugging" пэд.
            events.push(...this.renderRhythmicPowerPad(epoch, resChord, tension)); 
        }

        events.push(...this.renderAtmosphericEvents(epoch, tension));

        return {
            events, tension, beautyScore: 0.95,
            trackName: this.currentTrackName,
            mutationType: this.currentMutationType,
            activeAxioms: { melody: this.currentTheme ? this.currentTheme.id : 'Foundry Arp', ensemble: 'Power Protocol' },
            narrative: `Foundry Power V8 | Chugging: ON | Long Howl: ON`
        };
    }

    private renderFoundryDrums(epoch: number, tension: number, kit: any): FractalEvent[] {
        const events: FractalEvent[] = [];
        const kickSample = kit.kick[this.rng.nextInt(kit.kick.length)];
        const snareSample = kit.snare[0] || 'drum_snare';
        [0, 3, 6, 9].forEach(t => events.push({ type: kickSample as any, note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.55, technique: 'hit', dynamics: 'f', phrasing: 'staccato' }));
        [3, 9].forEach(t => events.push({ type: snareSample as any, note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.65, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' }));
        return events;
    }

    private renderRollingBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = this.constrainBassOctave(chord.rootNote - 12 + this.microTransposition);
        [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5].forEach(t => {
            events.push({
                type: 'bass', note: root, time: t * TICK_TO_BEAT, duration: 0.6 * TICK_TO_BEAT,
                weight: 0.65, technique: 'pulse', dynamics: 'f', phrasing: 'detached'
            });
        });
        return events;
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number, mosaicBar: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        let phrase = this.currentBassTheme.phrase;
        phrase = this.applyMutationLogic(phrase, tension, this.seed + epoch);
        const localBar = Math.abs(mosaicBar) % this.phraseBarCount(phrase);
        const barOffset = localBar * TICKS_PER_BAR;
        return phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR)
            .map(n => ({
                type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition),
                time: (n.t - barOffset) * TICK_TO_BEAT, duration: 1.2 * TICK_TO_BEAT, weight: 0.75, technique: 'pulse', dynamics: 'f', phrasing: 'detached'
            }));
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number, mosaicBar: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        let phrase = this.currentTheme.phrase;
        phrase = this.applyMutationLogic(phrase, tension, this.seed + epoch);
        const localBar = Math.abs(mosaicBar) % this.phraseBarCount(phrase);
        const offset = localBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR);
        
        return barNotes.map(n => {
            const isGolden = this.isGolden(n.t - offset);
            return {
                type: 'melody', note: this.wrapMelody(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition),
                time: (n.t - offset) * TICK_TO_BEAT, 
                // #ЗАЧЕМ: The Long Howl. Удлиняем золотые ноты для резонанса.
                duration: (n.d * TICK_TO_BEAT) * (isGolden ? 2.2 : 1.0),
                weight: isGolden ? 0.85 : 0.65, 
                technique: 'pick', dynamics: 'mf', phrasing: 'legato', 
                params: { attack: 0.05, release: isGolden ? 0.8 : 0.35 }
            };
        });
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number, mosaicBar: number): FractalEvent[] {
        let mutated = this.applyMutationLogic(phrase, tension, this.seed + epoch + 1);
        const localBar = Math.abs(mosaicBar) % this.phraseBarCount(mutated);
        const offset = localBar * TICKS_PER_BAR;
        return mutated.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({
            type, note: this.wrapMelody(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition),
            time: (n.t - offset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.55, technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }));
    }

    private renderRhythmicPowerPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12 + this.microTransposition;
        const intervals = [0, 7, 12]; // Power Chord
        const events: FractalEvent[] = [];

        // #ЗАЧЕМ: ПЛАН №2155. Rhythmic Chugging (0, 3, 6, 9).
        this.GOLDEN_TICKS.forEach(t => {
            const hitChance = 0.5 + (tension * 0.4);
            if (this.rng.next() < hitChance) {
                intervals.forEach(interval => {
                    events.push({
                        type: 'accompaniment', 
                        note: this.constrainAccompanimentOctave(root + interval),
                        time: t * TICK_TO_BEAT, 
                        duration: 2.8 * TICK_TO_BEAT, // Длинный сустейн для наслоения
                        weight: 0.45 + (tension * 0.15), 
                        technique: 'swell', 
                        dynamics: 'p', 
                        params: { attack: 0.15, release: 0.6, drive: 0.4 }
                    });
                });
            }
        });
        return events;
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        return this.renderRhythmicPowerPad(epoch, chord, tension);
    }

    private renderShimmerArp(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote + 24 + this.microTransposition; 
        const scale = [0, 7, 12, 19];
        const rawTicks = [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5];
        return rawTicks.map(t => ({
            type: 'melody', note: this.wrapMelody(root + scale[this.rng.nextInt(scale.length)]),
            time: t * TICK_TO_BEAT, duration: 0.5 * TICK_TO_BEAT, weight: 0.55, technique: 'pick', dynamics: 'p', phrasing: 'staccato'
        }));
    }

    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const barDuration = (60 / 82) * 4;
        const currentTime = epoch * barDuration; 
        if (currentTime - this.lastTextureTime >= 6) { 
            if (this.rng.chance(60)) { 
                this.lastTextureTime = currentTime;
                events.push({
                    type: 'sfx', note: 60, time: 0, duration: 2.5, weight: 0.55, technique: 'hit', dynamics: 'p', phrasing: 'legato',
                    params: { mood: this.mood, genre: this.genre, rules: { categories: [{ name: 'dark', weight: 1.0 }] } }
                });
            }
        }
        return events;
    }

    private constrainBassOctave(n: number): number { let v = n; if(!isFinite(v)) return 36; while (v > 47) n -= 12; while (n < 28) n += 12; return n; }
    private constrainAccompanimentOctave(note: number): number { let n = note; if(!isFinite(n)) return 60; while (n > 83) n -= 12; while (n < 48) n += 12; return n; }
}
