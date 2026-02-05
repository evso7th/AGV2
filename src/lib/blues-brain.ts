import type { 
    FractalEvent, 
    Mood, 
    Genre, 
    Technique, 
    GhostChord, 
    SuiteDNA, 
    NavigationInfo, 
    BluesCognitiveState,
    InstrumentHints
} from '@/types/music';
import { BLUES_SOLO_LICKS, BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { DRUM_KITS } from './assets/drum-kits';
import { 
    DEGREE_TO_SEMITONE, 
    humanizeEvents,
    getScaleForMood
} from './music-theory';

/**
 * #ЗАЧЕМ: "Блюзовый Архитектор" v7.0 — "The Alvin Lee Soul".
 * #ЧТО: Реализует структуру AAB, процедурный Walking Bass и активный Travis Picking.
 *       Регистр исправлен на густой средний (база +24).
 *       Никаких "шаманских" созвучий, только Dorian Add 5.
 */
export class BluesBrain {
    private cognitiveState: BluesCognitiveState;
    private random: any;
    private lastMotif: FractalEvent[] = [];
    private barInChorus = 0;

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

    public generateBar(
        epoch: number, 
        currentChord: GhostChord, 
        navInfo: NavigationInfo, 
        dna: SuiteDNA, 
        hints: InstrumentHints
    ): FractalEvent[] {
        this.barInChorus = epoch % 12;
        const events: FractalEvent[] = [];

        // 1. УДАРНЫЕ: Живой шаффл с оттяжкой
        if (hints.drums) events.push(...this.generateDrums(navInfo, epoch));

        // 2. БАС: Процедурный Walking Bass (никакой шарманки)
        if (hints.bass) events.push(...this.generateWalkingBass(currentChord, epoch));
        
        // 3. АККОМПАНЕМЕНТ: Активный Travis Picking + Swells
        if (hints.accompaniment) events.push(...this.generateAcousticComping(currentChord, epoch));
        
        // 4. МЕЛОДИЯ: Логика AAB (Theme -> Variation -> Answer)
        if (hints.melody) events.push(...this.generateAABMelody(currentChord, epoch, navInfo, dna));

        return events;
    }

    private generateDrums(navInfo: NavigationInfo, epoch: number): FractalEvent[] {
        const mood = navInfo.currentPart.mood;
        const kit = (DRUM_KITS.blues as any)?.[`blues_${mood}`] || DRUM_KITS.blues!['melancholic']!;
        const riffs = BLUES_DRUM_RIFFS[mood] || BLUES_DRUM_RIFFS['melancholic'] || [];
        const riff = riffs[epoch % riffs.length];
        const drumEvents: FractalEvent[] = [];

        const add = (pattern: number[] | undefined, pool: string[], weight = 0.7) => {
            if (pattern && pool.length > 0) {
                pattern.forEach(t => {
                    drumEvents.push({
                        type: pool[this.random.nextInt(pool.length)],
                        time: (t / 3) + (this.random.next() * 0.04), // Midnight Drag
                        duration: 0.2, weight: weight,
                        technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                    });
                });
            }
        };

        add(riff.K, kit.kick, 0.8);
        add(riff.SD, kit.snare, 0.7);
        add(riff.HH, kit.hihat, 0.4);
        
        return drumEvents;
    }

    private generateWalkingBass(chord: GhostChord, epoch: number): FractalEvent[] {
        const root = chord.rootNote;
        const events: FractalEvent[] = [];
        const scale = [0, 2, 3, 4, 7, 9, 10]; // Mixolydian/Dorian blend
        
        // 4-to-the-bar walking line
        [0, 1, 2, 3].forEach(beat => {
            let step = 0;
            if (beat === 0) step = 0; // Root on 1
            else if (beat === 1) step = this.random.next() > 0.5 ? 2 : 4; // 3rd or 5th
            else if (beat === 2) step = 7; // Dominant
            else step = this.random.next() > 0.5 ? 10 : 11; // b7 or leading tone

            events.push({
                type: 'bass',
                note: root + step - 12,
                time: beat + (this.random.next() * 0.03), // Delayed feel
                duration: 0.8,
                weight: 0.8,
                technique: 'walking', dynamics: 'mf', phrasing: 'legato'
            });
        });

        return events;
    }

    private generateAcousticComping(chord: GhostChord, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote;
        const isMinor = chord.chordType === 'minor';
        const chordNotes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];

        // Travis Picking Pattern (Busy fingers)
        const pattern = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5];
        pattern.forEach((time, i) => {
            const noteIdx = i % chordNotes.length;
            events.push({
                type: 'accompaniment',
                note: chordNotes[noteIdx] + 12, // Lower register grounding
                time: time + (this.random.next() * 0.02),
                duration: 0.45,
                weight: 0.3,
                technique: 'pluck', dynamics: 'p', phrasing: 'detached'
            });
        });

        return events;
    }

    private generateAABMelody(chord: GhostChord, epoch: number, navInfo: NavigationInfo, dna: SuiteDNA): FractalEvent[] {
        const phase = this.barInChorus < 4 ? 'A' : (this.barInChorus < 8 ? 'A_VAR' : 'B');
        let notes: FractalEvent[] = [];

        if (phase === 'A') {
            notes = this.generateMotif(chord.rootNote, 0.6);
            this.lastMotif = notes;
        } else if (phase === 'A_VAR') {
            // Repeat A with variation (transposition or slight rhythmic shift)
            notes = this.lastMotif.map(n => ({
                ...n,
                note: n.note + (chord.rootNote - this.lastMotif[0].note), // Transpose to IV
                time: n.time + (this.random.next() * 0.1 - 0.05)
            }));
        } else {
            // Answer B: Higher tension and resolution
            notes = this.generateMotif(chord.rootNote, 0.9);
        }

        return notes;
    }

    private generateMotif(root: number, tension: number): FractalEvent[] {
        const scale = [0, 3, 5, 6, 7, 10]; // Blues Pentatonic
        const events: FractalEvent[] = [];
        const count = 3 + Math.floor(tension * 4);

        for (let i = 0; i < count; i++) {
            const deg = scale[this.random.nextInt(scale.length)];
            events.push({
                type: 'melody',
                note: root + deg + 24, // Middle register grounding (C3-C5 range)
                time: (i * 0.5) + (this.random.next() * 0.05),
                duration: 0.4 + (this.random.next() * 0.4),
                weight: 0.85,
                technique: tension > 0.8 ? 'bend' : 'pick',
                dynamics: 'p', phrasing: 'legato'
            });
        }
        return events;
    }
}
