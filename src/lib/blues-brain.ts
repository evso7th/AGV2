
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
    transposeMelody,
    addOrnaments,
    humanizeEvents,
    markovNext
} from './music-theory';

const PHRASE_LENGTH_TRANSITIONS: Record<string, Record<string, number>> = {
    '2': { '2': 0.3, '3': 0.4, '4': 0.3 },
    '3': { '2': 0.2, '3': 0.5, '4': 0.3 },
    '4': { '2': 0.1, '4': 0.6, '3': 0.3 }
};

/**
 * #ЗАЧЕМ: "Блюзовый Мозг" v4.0 — "Midnight Soul & Grace".
 * #ЧТО: Радикальная реформа музыкальности на основе "how to play" гайдов:
 *       1. Midnight Drag: Имитация "лености" исполнения через контекстные задержки.
 *       2. Thematic Silence: Система "вздохов", где тишина важнее нот.
 *       3. Enclosure Logic: Окружение целевых нот хроматическими мелизмами.
 *       4. Staggered Ripples: Глубокое расслоение аккордов аккомпанемента.
 */
export class BluesBrain {
    private cognitiveState: BluesCognitiveState;
    private random: any;
    private lastPhraseLength: string = '2';
    private lastTargetPitch: number = 60;

    constructor(seed: number, mood: Mood) {
        this.random = this.seededRandom(seed);
        this.cognitiveState = {
            phraseState: 'call',
            tensionLevel: 0.3,
            phraseHistory: [],
            lastPhraseHash: '',
            blueNotePending: false,
            emotion: { 
                melancholy: ['melancholic', 'dark', 'anxious'].includes(mood) ? 0.95 : 0.4,
                darkness: ['dark', 'gloomy'].includes(mood) ? 0.85 : 0.3
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
        const events: FractalEvent[] = [];
        this.evolveEmotion();

        // Markov-based phrase breathing
        if (epoch % 4 === 0) {
            this.lastPhraseLength = markovNext(PHRASE_LENGTH_TRANSITIONS, this.lastPhraseLength, this.random);
        }

        const barInChorus = epoch % 12;
        this.cognitiveState.phraseState = barInChorus % 4 < 2 ? 'call' : (barInChorus % 4 === 2 ? 'response' : 'fill');

        // Orchestration Dispatch
        if (hints.drums) events.push(...this.generateDrums(navInfo, dna, epoch));
        if (hints.bass) events.push(...this.generateBass(currentChord, dna, epoch, navInfo.currentPart.mood));
        
        // Advanced Layering
        if (hints.accompaniment) {
            events.push(...this.generateAdvancedAccompaniment(currentChord, navInfo, epoch, hints.accompaniment));
        }
        
        if (hints.melody) {
            events.push(...this.generateSoulSolo(currentChord, dna, epoch, navInfo, hints.melody));
        }
        
        if (hints.pianoAccompaniment) {
            events.push(...this.generatePianoPocket(currentChord, epoch));
        }

        return events;
    }

    private applyMidnightDrag(note: FractalEvent, isLead: boolean) {
        // #ЗАЧЕМ: Имитация "Laid-back" исполнения.
        // #ЧТО: Гитарист всегда чуть-чуть опаздывает, особенно на высоких и эмоциональных нотах.
        const baseDrag = isLead ? 0.025 : 0.015; // 25ms drag for lead
        const highNoteBonus = note.note > 72 ? 0.01 : 0;
        const randomness = (this.random.next() * 0.01);
        
        note.time += baseDrag + highNoteBonus + randomness;
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

        // Softer, more "brushed" feel for smoky blues
        const velocityScale = mood === 'melancholic' ? 0.6 : 0.8;
        add(riff.K, kit.kick, velocityScale);
        add(riff.SD, kit.snare, velocityScale * 0.9);
        add(riff.HH, kit.hihat, 0.4);
        if (epoch % 4 === 3) add(riff.R, kit.ride, 0.5); // Ride only on phrase ends

        humanizeEvents(drumEvents, 0.02, this.random);
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
            duration: ((n.d || 2) / 3) * 1.1, // Full legato
            weight: 0.9,
            technique: 'pluck', dynamics: 'mf', phrasing: 'legato',
            params: { cutoff: 600, resonance: 0.3, distortion: 0.01, portamento: 0.15 }
        }));
    }

    private generateAdvancedAccompaniment(chord: GhostChord, navInfo: NavigationInfo, epoch: number, instrument?: string): FractalEvent[] {
        const events: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const root = chord.rootNote;
        const compOctave = 12;

        // "Thematic Ripples": Instead of chops, we play staggered, swelled chords
        // that "bloom" into existence.
        const isResponse = this.cognitiveState.phraseState === 'response';
        const density = isResponse ? 0.8 : 0.4; // More active during response to "fill the air"

        if (this.random.next() < density) {
            const chordNotes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];
            
            chordNotes.forEach((n, i) => {
                // Staggered entry for a "spilled" chord effect
                const stagger = i * 0.12; 
                const event: FractalEvent = {
                    type: 'accompaniment',
                    note: n + compOctave,
                    time: stagger,
                    duration: 3.8, // Let it ring
                    weight: 0.35 - (i * 0.05),
                    technique: 'swell', dynamics: 'p', phrasing: 'legato',
                    params: { attack: 1.8, release: 2.5 }
                };
                this.applyMidnightDrag(event, false);
                events.push(event);
            });

            // "Decorative Tails": Tiny melodic responses from the organ/piano
            if (epoch % 2 === 0) {
                const tailDegrees = ['9', 'b7', '5'];
                tailDegrees.forEach((deg, i) => {
                    events.push({
                        type: 'accompaniment',
                        note: root + (DEGREE_TO_SEMITONE[deg] || 0) + compOctave + 12,
                        time: 2.5 + i * 0.4,
                        duration: 0.6,
                        weight: 0.2,
                        technique: 'swell', dynamics: 'pp', phrasing: 'detached'
                    });
                });
            }
        }
        
        return events;
    }

    private generatePianoPocket(chord: GhostChord, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor';
        const root = chord.rootNote;
        const pianoOctave = 12;

        // "Midnight Stride": Extremely laid-back piano chords
        const notes = [root, root + (isMinor ? 3 : 4), root + 7];
        
        [0.05, 2.05].forEach((beatTime) => { // Shifted for "drag"
            notes.forEach((n, ni) => {
                events.push({
                    type: 'pianoAccompaniment',
                    note: n + pianoOctave,
                    time: beatTime + (ni * 0.02), // Micro-stagger
                    duration: 1.5,
                    weight: 0.3 - (ni * 0.05),
                    technique: 'hit', dynamics: 'p', phrasing: 'detached'
                });
            });
        });
        return events;
    }

    private generateSoulSolo(chord: GhostChord, dna: SuiteDNA, epoch: number, navInfo: NavigationInfo, instrument?: string): FractalEvent[] {
        const isAcoustic = instrument === 'blackAcoustic';
        
        // "Silence is Music": High chance of rest if tension is low or just had a big burst
        if (this.cognitiveState.tensionLevel < 0.4 && this.random.next() < 0.3) {
            console.log(`[BluesBrain @ Bar ${epoch}] Choosing silence for the soul.`);
            return []; 
        }

        const currentSoloPlan = this.cognitiveState.tensionLevel > 0.85 ? 'S_ACTIVE' : (dna.soloPlanMap.get(navInfo.currentPart.id) || 'S04');
        const plan = BLUES_SOLO_PLANS[currentSoloPlan];
        
        const barIn12 = epoch % 12;
        const chorusIdx = Math.floor(epoch / 12) % (plan?.choruses.length || 1);
        const lickId = plan?.choruses[chorusIdx][barIn12] || 'L01';
        
        let lickPhrase = JSON.parse(JSON.stringify(BLUES_SOLO_LICKS[lickId].phrase));

        // CALL & RESPONSE LOGIC
        if (this.cognitiveState.phraseState === 'response') {
            if (this.random.next() < 0.5) lickPhrase = invertMelody(lickPhrase);
            if (this.random.next() < 0.3) lickPhrase = lickPhrase.slice(0, Math.ceil(lickPhrase.length / 2)); // Shorten response
        }

        // ORNAMENTATION & ENCLOSURES
        lickPhrase = addOrnaments(lickPhrase, this.random);

        const events: FractalEvent[] = [];
        const soloOctave = 24; // C3-C5 Range

        lickPhrase.forEach((note: any) => {
            const rootPitch = chord.rootNote + (DEGREE_TO_SEMITONE[note.deg] || 0) + soloOctave; 

            // "Thematic Drag": High notes get more drag
            const event: FractalEvent = {
                type: 'melody',
                note: rootPitch,
                time: note.t / 3,
                duration: (note.d || 2) / 3,
                weight: 0.85 * (1 - (this.cognitiveState.emotion.melancholy * 0.2)), // Softer if sad
                technique: (note.tech || 'pick') as Technique,
                dynamics: 'p', phrasing: 'legato',
                params: { barCount: epoch }
            };
            
            this.applyMidnightDrag(event, true);
            events.push(event);

            // Double stops for "crying" effect
            if (this.random.next() < 0.2 && note.d > 4) {
                events.push({
                    ...event,
                    note: rootPitch + 5, // Perfect 4th above
                    weight: event.weight * 0.6,
                    time: event.time + 0.01
                });
            }
        });

        // Virtuoso Bursts based on tension
        if (this.cognitiveState.tensionLevel > 0.9) {
            const burstDegrees = ['R', 'b3', '4', 'b5', '5'];
            burstDegrees.forEach((deg, i) => {
                events.push({
                    type: 'melody',
                    note: chord.rootNote + (DEGREE_TO_SEMITONE[deg] || 0) + soloOctave + 12,
                    time: 3.5 + (i * 0.1),
                    duration: 0.15,
                    weight: 0.5,
                    technique: 'pick', dynamics: 'mf', phrasing: 'staccato'
                });
            });
        }

        humanizeEvents(events, 0.025, this.random); 
        return events;
    }

    private evolveEmotion() {
        // Slow emotional drift
        this.cognitiveState.emotion.melancholy += (this.random.next() - 0.5) * 0.02;
        this.cognitiveState.tensionLevel += (this.random.next() - 0.45) * 0.05; 
        
        if (this.cognitiveState.tensionLevel > 1.0) this.cognitiveState.tensionLevel = 0.2;
        if (this.cognitiveState.tensionLevel < 0) this.cognitiveState.tensionLevel = 0.1;
        
        this.cognitiveState.emotion.melancholy = Math.max(0.5, Math.min(0.99, this.cognitiveState.emotion.melancholy));
    }
}
