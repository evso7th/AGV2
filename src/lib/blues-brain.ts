
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
 * #ЗАЧЕМ: "Блюзовый Мозг" v4.1 — "Busy Hands & Acoustic Heart".
 * #ЧТО: Радикальная реформа аккомпанемента:
 *       1. Active Fingers: Внедрена техника ритмического дробления для органов и гитар.
 *       2. Black Acoustic Lead: Оптимизация под акустический тембр.
 *       3. Midnight Drag: Сохранение живой оттяжки.
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
        const baseDrag = isLead ? 0.025 : 0.015;
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

        const velocityScale = mood === 'melancholic' ? 0.6 : 0.8;
        add(riff.K, kit.kick, velocityScale);
        add(riff.SD, kit.snare, velocityScale * 0.9);
        add(riff.HH, kit.hihat, 0.4);
        if (epoch % 4 === 3) add(riff.R, kit.ride, 0.5);

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
            duration: ((n.d || 2) / 3) * 1.1,
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

        // #ЗАЧЕМ: Устранение "лености". Переход от долгих пэдов к активной работе "пальчиками".
        // #ЧТО: Внедрение техники "Finger Riffs" — ритмического перебора нот аккорда.
        const isActiveSection = ['BUILD', 'MAIN', 'SOLO'].includes(navInfo.currentPart.id);
        const density = isActiveSection ? 0.9 : 0.5;

        if (this.random.next() < density) {
            const chordNotes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];
            
            // "Busy Fingers": Rhythmic patterns within the bar
            // Pattern: 1, 2-and, 3, 4-and (in 12/8 ticks: 0, 4, 6, 10)
            [0, 4, 6, 10].forEach((tick, pi) => {
                const noteIndex = pi % chordNotes.length;
                const note = chordNotes[noteIndex];
                
                const event: FractalEvent = {
                    type: 'accompaniment',
                    note: note + compOctave,
                    time: tick / 3,
                    duration: 0.8, // Shorter, more articulate notes
                    weight: 0.35,
                    technique: 'hit', dynamics: 'p', phrasing: 'staccato',
                    params: { attack: 0.02, release: 0.15 }
                };
                this.applyMidnightDrag(event, false);
                events.push(event);
            });

            // Occasional long background layers for depth
            if (this.random.next() < 0.3) {
                events.push({
                    type: 'accompaniment',
                    note: root + compOctave - 12, // Deep anchor
                    time: 0,
                    duration: 3.9,
                    weight: 0.2,
                    technique: 'swell', dynamics: 'pp', phrasing: 'legato',
                    params: { attack: 2.5, release: 3.0 }
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

        // "Busy Piano": Adding rhythmic "climb" to the stride pattern
        const notes = [root, root + (isMinor ? 3 : 4), root + 7];
        
        [0.05, 1.3, 2.05, 3.3].forEach((beatTime, bi) => { 
            const n = notes[bi % notes.length];
            events.push({
                type: 'pianoAccompaniment',
                note: n + pianoOctave,
                time: beatTime,
                duration: 0.6,
                weight: 0.3,
                technique: 'hit', dynamics: 'p', phrasing: 'detached'
            });
        });
        return events;
    }

    private generateSoulSolo(chord: GhostChord, dna: SuiteDNA, epoch: number, navInfo: NavigationInfo, instrument?: string): FractalEvent[] {
        const isAcoustic = instrument === 'blackAcoustic';
        
        const currentSoloPlan = this.cognitiveState.tensionLevel > 0.85 ? 'S_ACTIVE' : (dna.soloPlanMap.get(navInfo.currentPart.id) || 'S04');
        const plan = BLUES_SOLO_PLANS[currentSoloPlan];
        
        const barIn12 = epoch % 12;
        const chorusIdx = Math.floor(epoch / 12) % (plan?.choruses.length || 1);
        const lickId = plan?.choruses[chorusIdx][barIn12] || 'L01';
        
        let lickPhrase = JSON.parse(JSON.stringify(BLUES_SOLO_LICKS[lickId].phrase));

        if (this.cognitiveState.phraseState === 'response') {
            if (this.random.next() < 0.5) lickPhrase = invertMelody(lickPhrase);
        }

        lickPhrase = addOrnaments(lickPhrase, this.random);

        const events: FractalEvent[] = [];
        const soloOctave = 24; 

        lickPhrase.forEach((note: any) => {
            const rootPitch = chord.rootNote + (DEGREE_TO_SEMITONE[note.deg] || 0) + soloOctave; 

            const event: FractalEvent = {
                type: 'melody',
                note: rootPitch,
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

        humanizeEvents(events, 0.025, this.random); 
        return events;
    }

    private evolveEmotion() {
        this.cognitiveState.emotion.melancholy += (this.random.next() - 0.5) * 0.02;
        this.cognitiveState.tensionLevel += (this.random.next() - 0.45) * 0.05; 
        
        if (this.cognitiveState.tensionLevel > 1.0) this.cognitiveState.tensionLevel = 0.2;
        if (this.cognitiveState.tensionLevel < 0) this.cognitiveState.tensionLevel = 0.1;
        
        this.cognitiveState.emotion.melancholy = Math.max(0.5, Math.min(0.99, this.cognitiveState.emotion.melancholy));
    }
}
