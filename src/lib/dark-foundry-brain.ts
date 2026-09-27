/**
 * @fileOverview Dark Foundry Brain V6.2 — "Tail Suppression Protocol".
 * #ЗАЧЕМ: 1. Разряжение аккомпанемента для устранения перегруза.
 *         2. Сокращение длительностей и релизов в канале Pad.
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
    private currentDrumAxioms: { phrase: any[], role: string, id: string }[] = [];
    
    private currentTrackName: string = 'Algorithmic';
    private sessionAnchorId: string | null = null; 
    private currentNativeRoot: number | null = null;
    private soloistBusyUntilBar: number = -1;
    private currentMutationType: string = 'none';
    private microTransposition: number = 0;
    private lickHistory: string[] = [];
    
    private lastSparkleTime = -999;

    private readonly MELODY_CEILING = 71;
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

    private applyMutationLogic(phrase: any[], tension: number, seed: number): any[] {
        let notes = [...phrase];
        if (this.currentMutationType === 'inversion') notes = invertPhrase(notes);
        else if (this.currentMutationType === 'retrograde') notes = retrogradePhrase(notes);
        else if (this.currentMutationType === 'jitter') notes = applyRhythmicJitter(notes, seed);
        else if (this.currentMutationType === 'phase_shift') {
            notes = notes.map(n => ({ ...n, t: n.t + 1.5 }));
        }

        if (this.currentMutationType === 'density_guard' && tension < 0.4) {
            notes = notes.filter((_, i) => i % 2 === 0);
        }

        if (this.currentMutationType === 'velocity_curve') {
            const total = notes.length;
            notes = notes.map((n, i) => {
                const p = i / (total || 1);
                return {
                    ...n,
                    params: {
                        ...n.params,
                        attack: 0.05 + (1 - p) * 0.4, 
                        release: 0.1 + p * 1.5        
                    },
                    phrasing: p < 0.5 ? 'legato' : 'staccato'
                };
            });
        }
        return notes;
    }

    public generateBar(epoch: number, currentChord: GhostChord, navInfo: NavigationInfo, dna: SuiteDNA, hints: InstrumentHints): any {
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        const kit = DRUM_KITS.foundry[this.mood as any] || DRUM_KITS.foundry.melancholic;

        if (epoch % 4 === 0) {
            const roll = calculateMusiNum(epoch, 29, this.seed, 100);
            if (roll < 20) this.currentMutationType = 'none';
            else if (roll < 35) { this.currentMutationType = 'transpose'; this.microTransposition = [-2, 2, 5, -5][this.rng.nextInt(4)]; }
            else if (roll < 50) this.currentMutationType = 'inversion';
            else if (roll < 65) this.currentMutationType = 'retrograde';
            else if (roll < 75) this.currentMutationType = 'phase_shift';
            else if (roll < 85) this.currentMutationType = 'density_guard';
            else this.currentMutationType = 'velocity_curve';
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

        // 3. SYNTHESIS: MELODY & ACCOMPANIMENT
        let melodyEvents: FractalEvent[] = [];
        if (hints.melody) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                melodyEvents = this.renderHeritageMelody(epoch, resChord, tension, mosaicBar);
            }
            if (melodyEvents.length === 0 || this.rng.chance(15)) {
                melodyEvents.push(...this.renderShimmerArp(epoch, resChord, tension));
            }
            events.push(...melodyEvents); 
        }

        const usedTargetLayers = new Set<string>();
        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: InstrumentPart | null = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('harmony') ? 'harmony' : (role.includes('accomp') ? 'accompaniment' : null));
            if (target && hints[target] && !usedTargetLayers.has(target)) {
                let renders = this.renderHeritageLayer(resChord, epoch, ax.phrase, target, tension, mosaicBar);
                
                if (target === 'pianoAccompaniment' || target === 'accompaniment') {
                    // #ЗАЧЕМ: Принудительное разряжение наследия для предотвращения гула.
                    renders = renders.filter(n => n.duration / TICK_TO_BEAT > 1.5 || this.isGolden(n.time / TICK_TO_BEAT));
                    renders.forEach(n => {
                        n.note = this.wrapMelody(n.note);
                        n.weight *= 0.75; // Снижение веса для Heritage пэдов
                        n.duration = Math.min(n.duration, 2.5); // Лимит хвоста
                    }); 
                }
                
                events.push(...renders); 
                usedTargetLayers.add(target);
            }
        });
        
        if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
            events.push(...this.renderSidechainedPad(epoch, resChord, tension)); 
        }

        if (hints.harmony && !usedTargetLayers.has('harmony')) {
            events.push(...this.renderGenerativeHarmony(resChord, epoch, tension));
            usedTargetLayers.add('harmony');
        }

        if (hints.pianoAccompaniment && !usedTargetLayers.has('pianoAccompaniment')) {
            const p = this.renderVirtuosoPiano(epoch, resChord, tension, melodyEvents);
            if (p.events.length > 0) {
                const thinned = p.events.filter(n => n.duration / TICK_TO_BEAT > 1.5 || this.isGolden(n.time / TICK_TO_BEAT));
                thinned.forEach(n => {
                    n.note = this.wrapMelody(n.note);
                    n.weight = 0.35;
                });
                events.push(...thinned); 
            }
        }

        // 4. ATMOSPHERIC
        events.push(...this.renderAtmosphericEvents(epoch, tension));

        return {
            events, tension, beautyScore: 0.95,
            trackName: this.currentTrackName,
            mutationType: this.currentMutationType,
            activeAxioms: { melody: this.currentTheme ? this.currentTheme.id : 'Foundry Arp', ensemble: 'Foundry Logic' },
            narrative: `Foundry Epoch ${epoch} | DNA: ${this.currentTrackName}`
        };
    }

    private renderFoundryDrums(epoch: number, tension: number, kit: any): FractalEvent[] {
        const events: FractalEvent[] = [];
        const kickSample = kit.kick[this.rng.nextInt(kit.kick.length)];
        const snareSample = kit.snare[0] || 'drum_snare';
        const hatSample = kit.hihat[0] || 'drum_open_hh_top2';
        const rideSample = kit.ride[0] || 'drum_ride_wetter';

        [0, 3, 6, 9].forEach(t => events.push({ type: kickSample as any, note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.60, technique: 'hit', dynamics: 'f', phrasing: 'staccato' }));
        [1.5, 4.5, 7.5, 10.5].forEach(t => events.push({ type: hatSample as any, note: 42, time: t * TICK_TO_BEAT, duration: 0.05, weight: 0.55, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
        [3, 9].forEach(t => events.push({ type: snareSample as any, note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.95, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' }));
        
        if (tension > 0.5 || this.rng.chance(15)) {
            [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5].forEach(t => {
                if (this.rng.chance(35 + tension * 40)) {
                    events.push({ 
                        type: rideSample as any, note: 51, time: t * TICK_TO_BEAT, 
                        duration: 0.4, weight: 0.25 + (tension * 0.15), 
                        technique: 'hit', dynamics: 'p', phrasing: 'detached', pan: 0.35 
                    });
                }
            });
        }
        return events;
    }

    private renderRollingBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = this.constrainBassOctave(chord.rootNote - 12 + this.microTransposition);
        [1, 2, 4, 5, 7, 8, 10, 11].forEach(t => {
            events.push({
                type: 'bass', note: root, time: t * TICK_TO_BEAT, duration: 1.0 * TICK_TO_BEAT,
                weight: 0.95, technique: 'pulse', dynamics: 'f', phrasing: 'detached'
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
        return phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICKS_PER_BAR, weight: 1.0, technique: 'pulse', dynamics: 'f', phrasing: 'detached'
        }));
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number, mosaicBar: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        let phrase = this.currentTheme.phrase;
        phrase = this.applyMutationLogic(phrase, tension, this.seed + epoch);

        const localBar = Math.abs(mosaicBar) % this.phraseBarCount(phrase);
        const offset = localBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR);

        const useGoldenFilter = barNotes.length > 3;
        const finalNotes = useGoldenFilter 
            ? barNotes.filter(n => this.GOLDEN_TICKS.some(gt => Math.abs((n.t - offset) - gt) < 0.1))
            : barNotes;

        return finalNotes.map(n => {
            const relT = n.t - offset;
            const isGold = this.GOLDEN_TICKS.some(gt => Math.abs(relT - gt) < 0.1);
            const rawNote = chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition;
            return {
                type: 'melody', note: this.wrapMelody(rawNote),
                time: relT * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT * (isGold ? 1.5 : 1.0),
                weight: isGold ? 0.95 : 0.75, technique: isGold ? 'vb' : 'pick', dynamics: 'mf', 
                phrasing: n.phrasing || 'legato',
                params: { attack: n.params?.attack, release: n.params?.release }
            };
        });
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number, mosaicBar: number): FractalEvent[] {
        let mutated = this.applyMutationLogic(phrase, tension, this.seed + epoch + 1);
        const localBar = Math.abs(mosaicBar) % this.phraseBarCount(mutated);
        const offset = localBar * TICKS_PER_BAR;
        const barNotes = mutated.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR);

        const useGoldenFilter = barNotes.length > 3;
        const finalNotes = useGoldenFilter 
            ? barNotes.filter(n => this.GOLDEN_TICKS.some(gt => Math.abs((n.t - offset) - gt) < 0.1))
            : barNotes;

        return finalNotes.map(n => {
            const rawNote = chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition;
            const finalNote = type === 'pianoAccompaniment' ? this.wrapMelody(rawNote) : this.constrainAccompanimentOctave(rawNote);
            return {
                type, note: finalNote,
                time: (n.t - offset) * TICK_TO_BEAT, duration: Math.min(n.d * TICK_TO_BEAT, 2.5), weight: 0.65, technique: 'swell', dynamics: 'p', phrasing: 'legate'
            };
        });
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12 + this.microTransposition;
        // #ЗАЧЕМ: ПЛАН №1951. Разряжение гармоники (только тоника и квинта).
        const intervals = [0, 7]; 
        const events: FractalEvent[] = [];
        
        this.GOLDEN_TICKS.forEach(t => {
            // #ЗАЧЕМ: Снижение шанса удара для освобождения headroom.
            if (this.rng.chance(45 + tension * 40)) {
                intervals.forEach(interval => {
                    events.push({
                        type: 'accompaniment',
                        note: this.constrainAccompanimentOctave(root + interval),
                        time: t * TICK_TO_BEAT,
                        duration: 1.4 * TICK_TO_BEAT, // Сокращено с 2.2 для предотвращения наложений
                        weight: 0.6 + (tension * 0.1),
                        technique: 'swell',
                        dynamics: 'p',
                        phrasing: 'legato'
                    });
                });
            }
        });
        
        return events;
    }

    private renderGenerativeHarmony(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12 + this.microTransposition;
        const isMinor = chord.chordType === 'minor';
        const intervals = [0, 7, 12];
        const events: FractalEvent[] = [];
        const grid = [0, 3, 6, 9]; 
        const gate = 40 + tension * 40; 

        grid.forEach(t => {
            if (this.rng.chance(gate)) {
                intervals.forEach(interval => {
                    events.push({
                        type: 'harmony',
                        note: this.constrainAccompanimentOctave(root + interval),
                        time: t * TICK_TO_BEAT,
                        duration: 0.25 * TICK_TO_BEAT,
                        weight: 0.65, 
                        technique: 'hit',
                        dynamics: 'mf',
                        phrasing: 'staccato',
                        chordName: isMinor ? 'Am' : 'A'
                    });
                });
            }
        });
        return events;
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
        const events: FractalEvent[] = [];
        if (melodyEvents.length > 0) {
            melodyEvents.forEach((m, i) => { 
                if (i % 2 === 0) {
                    events.push({ 
                        ...m, 
                        type: 'pianoAccompaniment', 
                        note: this.wrapMelody(m.note + 7), 
                        weight: 0.35, 
                        technique: 'hit' 
                    });
                }
            });
            return { events, style: 'Shadow Support' };
        }
        return { events: [], style: 'none' };
    }

    private renderShimmerArp(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote + 24 + this.microTransposition; 
        const scale = [0, 7, 12, 19];
        
        const rawTicks = [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5].filter(() => this.rng.chance(40 + tension * 40));
        
        const filteredTicks = rawTicks.length > 3 
            ? rawTicks.filter(t => this.GOLDEN_TICKS.some(gt => Math.abs(t - gt) < 0.1))
            : rawTicks;

        return filteredTicks.map(t => ({
            type: 'melody', note: this.wrapMelody(root + scale[calculateMusiNum(epoch + t, 7, this.seed, scale.length)]),
            time: t * TICK_TO_BEAT, duration: 0.4 * TICK_TO_BEAT, weight: 0.65, technique: 'pick', dynamics: 'p', phrasing: 'staccato'
        }));
    }

    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        if (this.rng.chance(15)) {
            events.push({
                type: 'sfx', note: 60, time: this.rng.next() * 3, duration: 4.0, weight: 0.7, technique: 'hit', dynamics: 'p', phrasing: 'legato',
                params: { mood: this.mood, genre: this.genre, rules: { categories: [{ name: 'dark', weight: 0.6 }, { name: 'voice', weight: 0.4 }] } }
            });
        }
        
        const currentTime = epoch * 3.0; 
        if (currentTime - this.lastSparkleTime >= 16) {
            const sparkleChance = 34 + (tension * 22);
            if (this.rng.chance(sparkleChance)) {
                this.lastSparkleTime = currentTime;
                events.push({
                    type: 'sparkle', note: 64 + (this.rng.nextInt(12)), 
                    time: this.rng.next() * 3.8, duration: 4.0,
                    weight: 0.8 + (this.rng.next() * 0.15), technique: 'hit', dynamics: 'p', phrasing: 'legato',
                    params: { category: this.rng.chance(40) ? 'ORGANIC' : 'MELODIC' }
                });
            }
        }
        return events;
    }

    private constrainBassOctave(n: number): number { let v = n; while (v > 47) v -= 12; while (v < 31) v += 12; return v; }
    private constrainAccompanimentOctave(n: number): number { let v = n; while (v > 83) v -= 12; while (v < 48) v += 12; return n; }
}
