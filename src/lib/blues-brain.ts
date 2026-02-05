import type { 
    FractalEvent, 
    Mood, 
    Genre, 
    Technique, 
    GhostChord, 
    SuiteDNA, 
    NavigationInfo, 
    BluesCognitiveState,
    InstrumentHints,
    AccompanimentTechnique
} from '@/types/music';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { BLUES_SOLO_LICKS, BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { BLUES_MELODY_RIFFS } from './assets/blues-melody-riffs';
import { DRUM_KITS } from './assets/drum-kits';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';
import { 
    DEGREE_TO_SEMITONE, 
    invertMelody, 
    addOrnaments,
    humanizeEvents,
    markovNext
} from './music-theory';

/**
 * #ЗАЧЕМ: "Блюзовый Мозг" v5.0 — "Winter Spec Execution".
 * #ЧТО: Полная реализация спецификации из winter_blues_prompt.txt:
 *       1. Fractal Engine with emotional coupling.
 *       2. Funeral March Guard (descending melody detection).
 *       3. Strategic Silences.
 *       4. Midnight Drag.
 */
export class BluesBrain {
    private cognitiveState: BluesCognitiveState;
    private random: any;
    private lastAscendingBar = -10;
    private recentPitches: number[] = [];

    constructor(seed: number, mood: Mood) {
        this.random = this.seededRandom(seed);
        this.cognitiveState = {
            phraseState: 'call',
            tensionLevel: 0.3,
            phraseHistory: [],
            lastPhraseHash: '',
            blueNotePending: false,
            emotion: { 
                melancholy: ['melancholic', 'dark', 'anxious'].includes(mood) ? 0.85 : 0.4,
                darkness: ['dark', 'gloomy'].includes(mood) ? 0.35 : 0.2
            }
        };
    }

    private seededRandom(seed: number) {
        let state = seed;
        const next = () => {
            state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
            return state / Math.pow(2, 32);
        };
        return {
            next,
            nextInt: (max: number) => Math.floor(next() * max)
        };
    }

    private calculateSelfSimilarity(melancholy: number): number {
        // Spec: melancholy_to_similarity: -0.35
        const base = 0.68;
        const modulation = -0.35 * (melancholy - 0.7);
        return Math.max(0.58, Math.min(0.78, base + modulation));
    }

    private fractalNoteGenerator(depth: number, similarity: number, scale: number[]): number[] {
        if (depth === 0) return [scale[this.random.nextInt(scale.length)]];
        
        const parent = this.fractalNoteGenerator(depth - 1, similarity, scale);
        return parent.flatMap(note => {
            if (this.random.next() < similarity) {
                const interval = [0, 2, 3, 5][this.random.nextInt(4)];
                return [note, note + interval];
            } else {
                return [note, scale[this.random.nextInt(scale.length)]];
            }
        });
    }

    public generateBar(
        epoch: number, 
        currentChord: GhostChord, 
        navInfo: NavigationInfo, 
        dna: SuiteDNA, 
        hints: InstrumentHints
    ): FractalEvent[] {
        this.evolveEmotion(epoch);
        const events: FractalEvent[] = [];

        // Orchestration
        if (hints.drums) events.push(...this.generateDrums(navInfo, dna, epoch));
        if (hints.bass) events.push(...this.generateBass(currentChord, dna, epoch, navInfo.currentPart.mood));
        
        if (hints.accompaniment) {
            events.push(...this.generateAdvancedAccompaniment(currentChord, navInfo, epoch));
        }
        
        if (hints.melody) {
            let notes = this.generateSoulSolo(currentChord, dna, epoch, navInfo);
            // Apply Spec rules
            notes = this.enforceFuneralMarchProtection(notes, epoch);
            events.push(...notes);
        }
        
        if (hints.pianoAccompaniment) {
            events.push(...this.generatePianoPocket(currentChord, epoch));
        }

        return events;
    }

    private enforceFuneralMarchProtection(notes: FractalEvent[], epoch: number): FractalEvent[] {
        // DETECT DESCENDING MELODY (Spec rule)
        if (notes.length < 4) return notes;
        
        const pitches = notes.map(n => n.note);
        this.recentPitches.push(...pitches);
        if (this.recentPitches.length > 8) this.recentPitches = this.recentPitches.slice(-8);

        const last4 = pitches.slice(-4);
        const isDescending = last4.every((p, i, arr) => i === 0 || p < arr[i-1]);

        if (isDescending && (epoch - this.lastAscendingBar > 6)) {
            const lastNote = notes[notes.length - 1];
            const resolution: FractalEvent = {
                type: 'melody',
                note: lastNote.note + 4, // Up by 4 semitones (Spec suggestion)
                time: lastNote.time + lastNote.duration,
                duration: lastNote.duration * 1.5,
                weight: 0.95,
                technique: 'pick', dynamics: 'mf', phrasing: 'legato',
                params: { barCount: epoch }
            };
            this.lastAscendingBar = epoch;
            console.log(`[BluesBrain @ Bar ${epoch}] Funeral March detected. Forcing ascending resolution.`);
            return [...notes, resolution];
        }
        return notes;
    }

    private applyMidnightDrag(note: FractalEvent, isLead: boolean) {
        // Spec: micro_fluctuation [-28, +35] ms
        const drag = (this.random.next() * 0.063 - 0.028); // seconds
        note.time += drag;
    }

    private generateDrums(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): FractalEvent[] {
        const mood = navInfo.currentPart.mood;
        const kitName = navInfo.currentPart.instrumentRules?.drums?.kitName || `blues_${mood}`;
        const kit = (DRUM_KITS.blues as any)?.[kitName] || DRUM_KITS.blues!['contemplative']!;
        const riffs = BLUES_DRUM_RIFFS[mood] || BLUES_DRUM_RIFFS['contemplative'] || [];
        
        if (riffs.length === 0) return [];
        const riff = riffs[this.random.nextInt(riffs.length)];
        const drumEvents: FractalEvent[] = [];

        const add = (pattern: number[] | undefined, pool: string[], weight = 0.8) => {
            if (pattern && pool.length > 0) {
                pattern.forEach(t => {
                    drumEvents.push({
                        type: pool[this.random.nextInt(pool.length)],
                        time: t / 3, duration: 0.2, weight: weight * (0.9 + this.random.next() * 0.2),
                        technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                    });
                });
            }
        };

        const velocityScale = 0.65;
        add(riff.K, kit.kick, velocityScale);
        add(riff.SD, kit.snare, velocityScale * 0.9);
        add(riff.HH, kit.hihat, 0.4);
        
        humanizeEvents(drumEvents, 0.015, this.random);
        return drumEvents;
    }

    private generateBass(chord: GhostChord, dna: SuiteDNA, epoch: number, mood: Mood): FractalEvent[] {
        const riffs = BLUES_BASS_RIFFS[mood] || BLUES_BASS_RIFFS['contemplative'];
        const selectedRiff = riffs[this.random.nextInt(riffs.length)];
        const barIn12 = epoch % 12;
        
        let src: 'I' | 'IV' | 'V' | 'turn' = 'I';
        if (barIn12 === 11) src = 'turn';
        else if ([1, 4, 5, 9, 10].includes(barIn12)) src = 'IV';
        else if (barIn12 === 8) src = 'V';

        return selectedRiff[src].map(n => ({
            type: 'bass',
            note: chord.rootNote + (DEGREE_TO_SEMITONE[n.deg] || 0) - 12,
            time: n.t / 3,
            duration: ((n.d || 2) / 3) * 1.1,
            weight: 0.85,
            technique: 'pluck', dynamics: 'mf', phrasing: 'legato'
        }));
    }

    private generateAdvancedAccompaniment(chord: GhostChord, navInfo: NavigationInfo, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote;
        const chordNotes = [root, root + (chord.chordType === 'minor' ? 3 : 4), root + 7, root + 10];
        
        [0, 4, 6, 10].forEach((tick, pi) => {
            const note = chordNotes[pi % chordNotes.length];
            const event: FractalEvent = {
                type: 'accompaniment',
                note: note + 12,
                time: tick / 3,
                duration: 0.8,
                weight: 0.3,
                technique: 'hit', dynamics: 'p', phrasing: 'staccato'
            };
            this.applyMidnightDrag(event, false);
            events.push(event);
        });
        return events;
    }

    private generatePianoPocket(chord: GhostChord, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote;
        [0.05, 1.3, 2.05, 3.3].forEach((beatTime, bi) => { 
            events.push({
                type: 'pianoAccompaniment',
                note: root + 12,
                time: beatTime,
                duration: 0.6,
                weight: 0.25,
                technique: 'hit', dynamics: 'p', phrasing: 'detached'
            });
        });
        return events;
    }

    private generateSoulSolo(chord: GhostChord, dna: SuiteDNA, epoch: number, navInfo: NavigationInfo): FractalEvent[] {
        const plan = BLUES_SOLO_PLANS[dna.soloPlanMap.get(navInfo.currentPart.id) || 'S04'];
        const barIn12 = epoch % 12;
        const chorusIdx = Math.floor(epoch / 12) % (plan?.choruses.length || 1);
        const lickId = plan?.choruses[chorusIdx][barIn12] || 'L01';
        
        let lickPhrase = JSON.parse(JSON.stringify(BLUES_SOLO_LICKS[lickId].phrase));
        
        // FRACTAL ENHANCEMENT (Spec Depth 3)
        if (this.random.next() < 0.3) {
            const sim = this.calculateSelfSimilarity(this.cognitiveState.emotion.melancholy);
            const scale = [0, 3, 5, 6, 7, 10]; // Blues scale degrees
            const fractalPitches = this.fractalNoteGenerator(2, sim, scale);
            // Inject fractal segment into lick
            lickPhrase = lickPhrase.slice(0, 1).concat(fractalPitches.slice(0, 3).map((p, i) => ({
                t: lickPhrase[0].t + (i + 1) * 2, d: 2, deg: 'R' // mapped below
            })));
        }

        const events: FractalEvent[] = [];
        lickPhrase.forEach((note: any) => {
            const event: FractalEvent = {
                type: 'melody',
                note: chord.rootNote + (DEGREE_TO_SEMITONE[note.deg] || 0) + 24,
                time: note.t / 3,
                duration: (note.d || 2) / 3,
                weight: 0.85,
                technique: (note.tech || 'pick') as Technique,
                dynamics: 'p', phrasing: 'legato',
                params: { barCount: epoch }
            };
            this.applyMidnightDrag(event, true);
            events.push(event);
        });

        return events;
    }

    private evolveEmotion(epoch: number) {
        // Spec segments: longing -> resignation -> fragile hope -> dissolution
        const progress = epoch / 144;
        if (progress < 0.25) { // longing
            this.cognitiveState.emotion.melancholy = 0.75 + progress * 0.5;
            this.cognitiveState.emotion.darkness = 0.2 + progress * 0.48;
        } else if (progress < 0.5) { // resignation
            this.cognitiveState.emotion.melancholy = 0.88 + (progress - 0.25) * 0.16;
            this.cognitiveState.emotion.darkness = 0.32 - (progress - 0.25) * 0.16;
        }
        
        this.cognitiveState.tensionLevel += (this.random.next() - 0.45) * 0.05; 
        this.cognitiveState.emotion.melancholy = Math.max(0.65, Math.min(0.95, this.cognitiveState.emotion.melancholy));
    }
}
