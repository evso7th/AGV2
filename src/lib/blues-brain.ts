
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
    subdivideRhythm,
    humanizeEvents,
    markovNext
} from './music-theory';

const PHRASE_LENGTH_TRANSITIONS: Record<string, Record<string, number>> = {
    '2': { '2': 0.3, '3': 0.4, '4': 0.3 },
    '3': { '2': 0.2, '3': 0.5, '4': 0.3 },
    '4': { '2': 0.1, '4': 0.6, '3': 0.3 }
};

/**
 * #ЗАЧЕМ: "Блюзовый Мозг" v3.6 — "Smoky & Grounded".
 * #ЧТО: Когнитивная надстройка с упором на низкий регистр и мягкую фактуру:
 *       1. Grounded Solo: Solo lowered by 2 octaves (+24).
 *       2. Rolling Ripples: Accompaniment staggered and swelled for softness.
 *       3. Melodic Fill-ins: Accompaniment adds tiny decorations instead of static hits.
 */
export class BluesBrain {
    private cognitiveState: BluesCognitiveState;
    private random: any;
    private lastPhraseLength: string = '2';

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

        if (epoch % 4 === 0) {
            this.lastPhraseLength = markovNext(PHRASE_LENGTH_TRANSITIONS, this.lastPhraseLength, this.random);
        }

        const barInChorus = epoch % 12;
        this.cognitiveState.phraseState = barInChorus % 4 < 2 ? 'call' : (barInChorus % 4 === 2 ? 'response' : 'fill');

        if (hints.drums) events.push(...this.generateDrums(navInfo, dna, epoch));
        if (hints.bass) events.push(...this.generateBass(currentChord, dna, epoch, navInfo.currentPart.mood));
        if (hints.accompaniment) events.push(...this.generateAdvancedAccompaniment(currentChord, navInfo, epoch, hints.accompaniment));
        if (hints.melody) events.push(...this.generateSoulSolo(currentChord, dna, epoch, navInfo, hints.melody));
        if (hints.pianoAccompaniment) events.push(...this.generatePianoPocket(currentChord, epoch));

        return events;
    }

    private generateDrums(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): FractalEvent[] {
        const kitName = navInfo.currentPart.instrumentRules?.drums?.kitName || `blues_${navInfo.currentPart.mood}`;
        const kit = (DRUM_KITS.blues as any)?.[kitName] || DRUM_KITS.blues!['contemplative']!;
        const riffs = BLUES_DRUM_RIFFS[navInfo.currentPart.mood] || BLUES_DRUM_RIFFS['contemplative'] || [];
        
        if (riffs.length === 0) return [];
        const riff = riffs[this.random.nextInt(riffs.length)];
        const drumEvents: FractalEvent[] = [];

        const add = (pattern: number[] | undefined, pool: string[], weight = 0.8) => {
            if (pattern && pool.length > 0) {
                pattern.forEach(t => {
                    drumEvents.push({
                        type: pool[this.random.nextInt(pool.length)],
                        time: t / 3, duration: 0.2, weight,
                        technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                    });
                });
            }
        };

        add(riff.K, kit.kick, 0.8); // Softer kick
        add(riff.SD, kit.snare, 0.7);
        add(riff.HH, kit.hihat, 0.5);
        add(riff.R, kit.ride, 0.6);
        add(riff.T, kit.perc, 0.4);

        humanizeEvents(drumEvents, 0.015, this.random);
        return drumEvents;
    }

    private generateBass(chord: GhostChord, dna: SuiteDNA, epoch: number, mood: Mood): FractalEvent[] {
        const riffs = BLUES_BASS_RIFFS[mood] || BLUES_BASS_RIFFS['contemplative'];
        const selectedRiff = riffs[Math.floor(epoch / 4) % riffs.length];
        const barIn12 = epoch % 12;
        
        let src: 'I' | 'IV' | 'V' | 'turn' = 'I';
        if (barIn12 === 11) src = 'turn';
        else if ([1, 4, 5, 9, 10].includes(barIn12)) src = 'IV';
        else if (barIn12 === 8) src = 'V';

        return selectedRiff[src].map(n => ({
            type: 'bass',
            note: chord.rootNote + (DEGREE_TO_SEMITONE[n.deg] || 0) - 12,
            time: n.t / 3,
            duration: ((n.d || 2) / 3) * 0.95,
            weight: 0.95,
            technique: 'pluck', dynamics: 'mf', phrasing: 'legato',
            params: { cutoff: 800, resonance: 0.4, distortion: 0.02, portamento: 0.1 }
        }));
    }

    private generateAdvancedAccompaniment(chord: GhostChord, navInfo: NavigationInfo, epoch: number, instrument?: string): FractalEvent[] {
        const isGuitar = instrument?.toLowerCase().includes('guitar');
        const events: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const root = chord.rootNote;
        
        // #РЕГИСТР: Опускаем аккомпанемент на 2 октавы (с +36 до +12)
        const compOctave = 12;

        if (isGuitar) {
            const patternName = this.random.next() < 0.5 ? 'F_ROLL12' : 'F_TRAVIS';
            const pattern = GUITAR_PATTERNS[patternName];
            const voicingName = isMinor ? 'Em7_open' : 'E7_open';
            const voicing = BLUES_GUITAR_VOICINGS[voicingName];

            pattern.pattern.forEach(step => {
                step.ticks.forEach(t => {
                    step.stringIndices.forEach((idx, sIdx) => {
                        const noteOnTime = (t / 3) + (sIdx * (pattern.rollDuration / 12));
                        events.push({
                            type: 'accompaniment',
                            note: voicing[voicing.length - 1 - idx] + compOctave,
                            time: noteOnTime,
                            duration: 1.2, // Longer duration for guitar
                            weight: 0.45,  // Softer
                            technique: 'pluck', dynamics: 'p', phrasing: 'legato',
                            params: { barCount: epoch, voicingName }
                        });
                    });
                });
            });
        } else {
            // "Rolling Ripple" для Органа/Синта
            // Вместо чопов играем размытые аккорды
            const chordNotes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];
            
            chordNotes.forEach((n, i) => {
                // Стаггер (раскачка) начала нот
                const stagger = i * 0.08;
                events.push({
                    type: 'accompaniment',
                    note: n + compOctave,
                    time: stagger,
                    duration: 3.5, // Почти весь такт
                    weight: 0.4 - (i * 0.05),
                    technique: 'swell', dynamics: 'p', phrasing: 'legato',
                    params: { attack: 1.5, release: 2.0 }
                });
            });

            // Украшательства (Melodic Ornaments)
            // Добавляем тихую мелодическую линию в аккомпанемент раз в 2 такта
            if (epoch % 2 === 1) {
                const ornaments = [chordNotes[3] + 2, chordNotes[3], chordNotes[2]]; // 9 -> 7 -> 5
                ornaments.forEach((n, i) => {
                    events.push({
                        type: 'accompaniment',
                        note: n + compOctave + 12, // Октавой выше аккорда
                        time: 2.0 + i * 0.5,
                        duration: 0.4,
                        weight: 0.25,
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
        const notes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];
        
        // #РЕГИСТР: Опускаем пианиста на 2 октавы (+36 -> +12)
        const pianoOctave = 12;

        // Мягкий "Страйд" - только на 1 и 3 доли
        [0, 2].forEach((tickInBeats, i) => {
            notes.forEach((n, ni) => {
                events.push({
                    type: 'pianoAccompaniment',
                    note: n + pianoOctave,
                    time: tickInBeats,
                    duration: 1.0,
                    weight: 0.35 - (ni * 0.05),
                    technique: 'hit', dynamics: 'p', phrasing: 'detached'
                });
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

        if (this.cognitiveState.phraseState === 'response' && this.random.next() < 0.4) {
            lickPhrase = invertMelody(lickPhrase);
        }

        const events: FractalEvent[] = [];
        
        // #РЕГИСТР: Опускаем соло на 2 октавы (с +48 до +24)
        // Теперь соло попадает в диапазон C3-C5
        const soloOctave = 24;

        lickPhrase.forEach((note: any) => {
            const rootPitch = chord.rootNote + (DEGREE_TO_SEMITONE[note.deg] || 0) + soloOctave; 

            // Менее агрессивные дабл-стопы
            const isEmotiveDouble = this.random.next() < 0.15 && !isAcoustic && note.d > 3;

            events.push({
                type: 'melody',
                note: rootPitch,
                time: note.t / 3,
                duration: (note.d || 2) / 3,
                weight: 0.85, // Lowered for softness
                technique: (note.tech || 'pick') as Technique,
                dynamics: 'p', phrasing: 'legato',
                params: { barCount: epoch }
            });

            if (isEmotiveDouble) {
                events.push({
                    type: 'melody',
                    note: rootPitch + 5, 
                    time: note.t / 3 + 0.01,
                    duration: (note.d || 2) / 3,
                    weight: 0.5,
                    technique: 'pick', dynamics: 'pp', phrasing: 'legato'
                });
            }
        });

        // "Alvin Lee Shred" только на самом пике и тише
        if (this.cognitiveState.tensionLevel > 0.88 && this.random.next() < 0.3 && !isAcoustic) {
            const shredDegrees = ['R', '2', 'b3', '3', '5', '6'];
            shredDegrees.forEach((deg, i) => {
                events.push({
                    type: 'melody',
                    note: chord.rootNote + (DEGREE_TO_SEMITONE[deg] || 0) + soloOctave,
                    time: (i * 0.5) / 12,
                    duration: 0.1,
                    weight: 0.45,
                    technique: 'pick', dynamics: 'p', phrasing: 'staccato'
                });
            });
        }

        humanizeEvents(events, 0.02, this.random); // Increased humanization for "drag" feel
        return events;
    }

    private evolveEmotion() {
        this.cognitiveState.emotion.melancholy += (this.random.next() - 0.5) * 0.03;
        this.cognitiveState.tensionLevel += (this.random.next() - 0.4) * 0.04; 
        
        if (this.cognitiveState.tensionLevel > 1.0) this.cognitiveState.tensionLevel = 0.3;
        this.cognitiveState.emotion.melancholy = Math.max(0.4, Math.min(0.99, this.cognitiveState.emotion.melancholy));
    }
}
