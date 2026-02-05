
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
 * #ЗАЧЕМ: "Блюзовый Мозг" v3.5 — "The Alvin Lee Soul".
 * #ЧТО: Когнитивная надстройка для имитации стиля "The Bluest Blues":
 *       1. Emotive Soloing: длинные бенды и глубокое вибрато.
 *       2. Dynamic Bursts: внезапные виртуозные пассажи при росте tension.
 *       3. Pocket Logic: синхронизация ансамбля в медленном темпе.
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

        // 1. Динамическое "дыхание" фраз (Markov)
        if (epoch % 4 === 0) {
            this.lastPhraseLength = markovNext(PHRASE_LENGTH_TRANSITIONS, this.lastPhraseLength, this.random);
        }

        // 2. Фаза цикла (Зов/Ответ/Филл)
        const barInChorus = epoch % 12;
        this.cognitiveState.phraseState = barInChorus % 4 < 2 ? 'call' : (barInChorus % 4 === 2 ? 'response' : 'fill');

        // 3. Инструментальная интерпретация
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

        add(riff.K, kit.kick, 0.9);
        add(riff.SD, kit.snare, 0.85);
        add(riff.HH, kit.hihat, 0.6);
        add(riff.R, kit.ride, 0.7);
        add(riff.T, kit.perc, 0.5);

        humanizeEvents(drumEvents, 0.01, this.random);
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
            params: { cutoff: 1000, resonance: 0.5, distortion: 0.05, portamento: 0.08 }
        }));
    }

    private generateAdvancedAccompaniment(chord: GhostChord, navInfo: NavigationInfo, epoch: number, instrument?: string): FractalEvent[] {
        const isGuitar = instrument?.toLowerCase().includes('guitar');
        const events: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const root = chord.rootNote;
        
        if (isGuitar) {
            const patternName = this.random.next() < 0.4 ? 'F_TRAVIS' : 'S_SWING';
            const pattern = GUITAR_PATTERNS[patternName];
            const voicingName = isMinor ? 'Em7_open' : 'E7_open';
            const voicing = BLUES_GUITAR_VOICINGS[voicingName];

            pattern.pattern.forEach(step => {
                step.ticks.forEach(t => {
                    step.stringIndices.forEach((idx, sIdx) => {
                        const noteOnTime = (t / 3) + (sIdx * (pattern.rollDuration / 12));
                        events.push({
                            type: 'accompaniment',
                            note: voicing[voicing.length - 1 - idx] + 24,
                            time: noteOnTime,
                            duration: 0.6,
                            weight: 0.55,
                            technique: 'pick', dynamics: 'p', phrasing: 'detached',
                            params: { barCount: epoch, voicingName }
                        });
                    });
                });
            });
        } else {
            // "Блюзовые Чопы" — синхронизированные акценты
            const shellVoicing = [root + (isMinor ? 3 : 4), root + 10];
            const chopTicks = [4, 10]; 
            chopTicks.forEach(tick => {
                shellVoicing.forEach(n => {
                    events.push({
                        type: 'accompaniment',
                        note: n + 36,
                        time: tick / 3,
                        duration: 0.15,
                        weight: 0.6,
                        technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                    });
                });
            });
        }
        return events;
    }

    private generatePianoPocket(chord: GhostChord, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor';
        const root = chord.rootNote;
        const notes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];
        
        // "Pocket" — акцент на 1 и синкопа на 2-и
        [0, 4.5].forEach(tick => {
            notes.forEach((n, i) => {
                events.push({
                    type: 'pianoAccompaniment',
                    note: n + 36,
                    time: tick / 3,
                    duration: 0.3,
                    weight: 0.5 - (i * 0.05),
                    technique: 'hit', dynamics: 'p', phrasing: 'staccato'
                });
            });
        });
        return events;
    }

    private generateSoulSolo(chord: GhostChord, dna: SuiteDNA, epoch: number, navInfo: NavigationInfo, instrument?: string): FractalEvent[] {
        const isAcoustic = instrument === 'blackAcoustic';
        // При высоком напряжении всегда переходим на активный план
        const currentSoloPlan = this.cognitiveState.tensionLevel > 0.82 ? 'S_ACTIVE' : (dna.soloPlanMap.get(navInfo.currentPart.id) || 'S04');
        const plan = BLUES_SOLO_PLANS[currentSoloPlan];
        
        const barIn12 = epoch % 12;
        const chorusIdx = Math.floor(epoch / 12) % (plan?.choruses.length || 1);
        const lickId = plan?.choruses[chorusIdx][barIn12] || 'L01';
        
        let lickPhrase = JSON.parse(JSON.stringify(BLUES_SOLO_LICKS[lickId].phrase));

        // Эмоциональное развитие: инверсия ответа
        if (this.cognitiveState.phraseState === 'response' && this.random.next() < 0.5) {
            lickPhrase = invertMelody(lickPhrase);
        }

        const events: FractalEvent[] = [];
        lickPhrase.forEach((note: any) => {
            // Подъем в зону 60-84 для певучести
            const rootPitch = chord.rootNote + (DEGREE_TO_SEMITONE[note.deg] || 0) + 48; 

            // Alvin Lee Double-Stops: добавляем квинту или терцию для "жира"
            const isEmotiveDouble = this.random.next() < 0.25 && !isAcoustic && note.d > 2;

            events.push({
                type: 'melody',
                note: rootPitch,
                time: note.t / 3,
                duration: (note.d || 2) / 3,
                weight: 0.98,
                technique: (note.tech || 'pick') as Technique,
                dynamics: 'mf', phrasing: 'legato',
                params: { barCount: epoch }
            });

            if (isEmotiveDouble) {
                events.push({
                    type: 'melody',
                    note: rootPitch + 5, // Квинта
                    time: note.t / 3 + 0.005,
                    duration: (note.d || 2) / 3,
                    weight: 0.75,
                    technique: 'pick', dynamics: 'p', phrasing: 'legato'
                });
            }
        });

        // "Alvin Lee Shred": взрывные пассажи при высоком напряжении
        if (this.cognitiveState.tensionLevel > 0.75 && this.random.next() < 0.4 && !isAcoustic) {
            const shredDegrees = ['R', '2', 'b3', '3', '5', '6', 'b7', 'R+8'];
            shredDegrees.forEach((deg, i) => {
                events.push({
                    type: 'melody',
                    note: chord.rootNote + (DEGREE_TO_SEMITONE[deg] || 0) + 48,
                    time: (i * 0.75) / 12,
                    duration: 0.1,
                    weight: 0.65,
                    technique: 'pick', dynamics: 'mf', phrasing: 'staccato'
                });
            });
        }

        humanizeEvents(events, 0.008, this.random);
        return events;
    }

    private evolveEmotion() {
        // Броуновское движение эмоций для живости
        this.cognitiveState.emotion.melancholy += (this.random.next() - 0.5) * 0.04;
        this.cognitiveState.tensionLevel += (this.random.next() - 0.3) * 0.06; // Напряжение растет быстрее
        
        if (this.cognitiveState.tensionLevel > 1.0) this.cognitiveState.tensionLevel = 0.4;
        this.cognitiveState.emotion.melancholy = Math.max(0.2, Math.min(0.99, this.cognitiveState.emotion.melancholy));
    }
}
