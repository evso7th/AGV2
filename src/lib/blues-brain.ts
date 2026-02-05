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
 * #ЗАЧЕМ: "Блюзовый Мозг" v6.0 — "Anti-Sharmanka & Movement".
 * #ЧТО: Исправление проблем с монотонностью и примитивностью:
 *       1. Walking Bass принудительно (никаких "та-та-та").
 *       2. Variety Guard: запрет на повторение ликов подряд.
 *       3. Scalar Passages: внедрение восходящих и нисходящих пробежек.
 *       4. Dynamic Shuffle Drums: уход от бочки только на "раз".
 */
export class BluesBrain {
    private cognitiveState: BluesCognitiveState;
    private random: any;
    private lastAscendingBar = -10;
    private recentPitches: number[] = [];
    private lastLickId: string = '';

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
        const base = 0.62; // Lowered for more variety
        const modulation = -0.3 * (melancholy - 0.7);
        return Math.max(0.5, Math.min(0.75, base + modulation));
    }

    private generateScalarRun(root: number, ascending: boolean): FractalEvent[] {
        const scale = [0, 2, 3, 5, 7, 10, 12];
        const notes: FractalEvent[] = [];
        const count = 6;
        for (let i = 0; i < count; i++) {
            const degree = ascending ? scale[i % scale.length] : scale[(scale.length - 1 - i) % scale.length];
            notes.push({
                type: 'melody',
                note: root + degree + 24,
                time: (i * 2) / 3, // Eighth note triplets
                duration: 0.3,
                weight: 0.8,
                technique: 'pick', dynamics: 'p', phrasing: 'legato'
            });
        }
        return notes;
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
        if (hints.bass) events.push(...this.generateWalkingBass(currentChord, dna, epoch, navInfo.currentPart.mood));
        
        if (hints.accompaniment) {
            events.push(...this.generateAdvancedAccompaniment(currentChord, navInfo, epoch));
        }
        
        if (hints.melody) {
            let notes = this.generateSoulSolo(currentChord, dna, epoch, navInfo);
            notes = this.enforceFuneralMarchProtection(notes, epoch);
            events.push(...notes);
        }
        
        if (hints.pianoAccompaniment) {
            events.push(...this.generatePianoPocket(currentChord, epoch));
        }

        return events;
    }

    private enforceFuneralMarchProtection(notes: FractalEvent[], epoch: number): FractalEvent[] {
        if (notes.length < 4) return notes;
        
        const pitches = notes.map(n => n.note);
        const last4 = pitches.slice(-4);
        const isDescending = last4.every((p, i, arr) => i === 0 || p < arr[i-1]);

        if (isDescending && (epoch - this.lastAscendingBar > 4)) {
            const lastNote = notes[notes.length - 1];
            const resolution: FractalEvent = {
                type: 'melody',
                note: lastNote.note + 5, // Up by a fourth
                time: lastNote.time + lastNote.duration,
                duration: lastNote.duration * 1.5,
                weight: 0.95,
                technique: 'slide', dynamics: 'mf', phrasing: 'legato',
                params: { barCount: epoch }
            };
            this.lastAscendingBar = epoch;
            return [...notes, resolution];
        }
        return notes;
    }

    private generateDrums(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): FractalEvent[] {
        const mood = navInfo.currentPart.mood;
        const kitName = navInfo.currentPart.instrumentRules?.drums?.kitName || `blues_${mood}`;
        const kit = (DRUM_KITS.blues as any)?.[kitName] || DRUM_KITS.blues!['contemplative']!;
        const riffs = BLUES_DRUM_RIFFS[mood] || BLUES_DRUM_RIFFS['contemplative'] || [];
        
        if (riffs.length === 0) return [];
        // Cycle through riffs to avoid static pattern
        const riff = riffs[(this.random.nextInt(riffs.length) + epoch) % riffs.length];
        const drumEvents: FractalEvent[] = [];

        const add = (pattern: number[] | undefined, pool: string[], weight = 0.8) => {
            if (pattern && pool.length > 0) {
                pattern.forEach(t => {
                    drumEvents.push({
                        type: pool[this.random.nextInt(pool.length)],
                        time: t / 3, duration: 0.2, weight: weight * (0.8 + this.random.next() * 0.4),
                        technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                    });
                });
            }
        };

        const velocityScale = 0.7;
        add(riff.K, kit.kick, velocityScale);
        add(riff.SD, kit.snare, velocityScale * 0.9);
        add(riff.HH, kit.hihat, 0.4);
        if (epoch % 4 === 3) add(riff.T, kit.perc, 0.5); // Accents
        
        humanizeEvents(drumEvents, 0.025, this.random);
        return drumEvents;
    }

    private generateWalkingBass(chord: GhostChord, dna: SuiteDNA, epoch: number, mood: Mood): FractalEvent[] {
        const riffs = BLUES_BASS_RIFFS[mood] || BLUES_BASS_RIFFS['contemplative'];
        const barIn12 = epoch % 12;
        
        // Prefer more "walking" or "boogie" patterns from the pool
        const selectedRiff = riffs[(epoch % riffs.length)];
        
        let src: 'I' | 'IV' | 'V' | 'turn' = 'I';
        if (barIn12 === 11) src = 'turn';
        else if ([1, 4, 5, 9, 10].includes(barIn12)) src = 'IV';
        else if (barIn12 === 8) src = 'V';

        return selectedRiff[src].map(n => ({
            type: 'bass',
            note: chord.rootNote + (DEGREE_TO_SEMITONE[n.deg] || 0) - 12,
            time: n.t / 3,
            duration: ((n.d || 2) / 3) * 1.1,
            weight: 0.8,
            technique: 'pluck', dynamics: 'mf', phrasing: 'legato'
        }));
    }

    private generateSoulSolo(chord: GhostChord, dna: SuiteDNA, epoch: number, navInfo: NavigationInfo): FractalEvent[] {
        const planId = dna.soloPlanMap.get(navInfo.currentPart.id) || 'S04';
        const plan = BLUES_SOLO_PLANS[planId];
        const barIn12 = epoch % 12;
        const chorusIdx = Math.floor(epoch / 12) % (plan?.choruses.length || 1);
        let lickId = plan?.choruses[chorusIdx][barIn12] || 'L01';
        
        // VARIETY GUARD (Spec Rule)
        if (lickId === this.lastLickId && this.random.next() < 0.8) {
            // Force a scalar run or a different lick
            if (this.random.next() < 0.5) {
                this.lastLickId = 'SCALAR';
                return this.generateScalarRun(chord.rootNote, this.random.next() > 0.5);
            }
            const allLicks = Object.keys(BLUES_SOLO_LICKS);
            lickId = allLicks[this.random.nextInt(allLicks.length)];
        }
        this.lastLickId = lickId;

        const lickPhrase = JSON.parse(JSON.stringify(BLUES_SOLO_LICKS[lickId].phrase));
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
            const drag = (this.random.next() * 0.06 - 0.03); // Midnight drag
            event.time += drag;
            events.push(event);
        });

        return events;
    }

    private generateAdvancedAccompaniment(chord: GhostChord, navInfo: NavigationInfo, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote;
        const chordNotes = [root, root + (chord.chordType === 'minor' ? 3 : 4), root + 7, root + 10];
        
        // More active comping (working with fingers)
        const ticks = epoch % 2 === 0 ? [0, 4, 6, 10] : [2, 5, 8, 11];
        ticks.forEach((tick, pi) => {
            const note = chordNotes[pi % chordNotes.length];
            events.push({
                type: 'accompaniment',
                note: note + 12,
                time: tick / 3,
                duration: 0.6,
                weight: 0.25,
                technique: 'hit', dynamics: 'p', phrasing: 'staccato'
            });
        });
        return events;
    }

    private generatePianoPocket(chord: GhostChord, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote;
        // Syn-co-pa-ted piano
        const pattern = epoch % 4 === 0 ? [0.1, 1.25, 2.1, 3.35] : [0.5, 1.5, 2.5, 3.5];
        pattern.forEach((beatTime) => { 
            events.push({
                type: 'pianoAccompaniment',
                note: root + 12,
                time: beatTime,
                duration: 0.4,
                weight: 0.2,
                technique: 'hit', dynamics: 'p', phrasing: 'detached'
            });
        });
        return events;
    }

    private evolveEmotion(epoch: number) {
        const progress = epoch / 144;
        this.cognitiveState.emotion.melancholy = Math.max(0.6, Math.min(0.95, 0.7 + progress * 0.3));
        this.cognitiveState.tensionLevel += (this.random.next() - 0.48) * 0.1;
    }
}
