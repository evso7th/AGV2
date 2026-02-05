
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
    '2': { '2': 0.4, '3': 0.4, '4': 0.2 },
    '3': { '2': 0.2, '3': 0.5, '4': 0.3 },
    '4': { '2': 0.1, '4': 0.7, '3': 0.2 }
};

/**
 * #ЗАЧЕМ: "Блюзовый Мозг" v3.0 — "The Blues Masterpiece".
 * #ЧТО: Радикальное повышение музыкальности через использование всех активов.
 *       Внедрены: живой гитарный бой, пальцевый перебор, "чопы" и правильные регистры.
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
                melancholy: ['melancholic', 'dark', 'anxious'].includes(mood) ? 0.9 : 0.4,
                darkness: ['dark', 'gloomy'].includes(mood) ? 0.8 : 0.3
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

        // 1. Выбор длительности фразы
        if (epoch % 4 === 0) {
            this.lastPhraseLength = markovNext(PHRASE_LENGTH_TRANSITIONS, this.lastPhraseLength, this.random);
        }

        // 2. Определение фазы цикла
        const currentChordIdx = dna.harmonyTrack.findIndex(c => epoch >= c.bar && epoch < c.bar + c.durationBars);
        const barInChorus = currentChordIdx >= 0 ? currentChordIdx % 12 : epoch % 12;
        this.cognitiveState.phraseState = barInChorus % 4 < 2 ? 'call' : (barInChorus % 4 === 2 ? 'response' : 'fill');

        // 3. Генерация
        if (hints.drums) events.push(...this.generateDrums(navInfo, dna, epoch));
        if (hints.bass) events.push(...this.generateBass(currentChord, dna, epoch, navInfo.currentPart.mood));
        
        // #ЗАЧЕМ: Улучшенный аккомпанемент с техниками боя и перебора.
        if (hints.accompaniment) events.push(...this.generateAdvancedAccompaniment(currentChord, navInfo, epoch, hints.accompaniment));
        
        // #ЗАЧЕМ: Соло в правильном регистре (60-84).
        if (hints.melody) events.push(...this.generateVirtuosoSolo(currentChord, dna, epoch, navInfo, hints.melody));

        if (hints.pianoAccompaniment) events.push(...this.generatePianoChops(currentChord, epoch));

        return events;
    }

    private generateDrums(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): FractalEvent[] {
        const kitName = navInfo.currentPart.instrumentRules?.drums?.kitName || `blues_${navInfo.currentPart.mood}`.toLowerCase();
        const kit = (DRUM_KITS.blues as any)?.[kitName] || DRUM_KITS.blues!['contemplative']!;
        const riffs = BLUES_DRUM_RIFFS[navInfo.currentPart.mood] || BLUES_DRUM_RIFFS['contemplative'] || [];
        
        if (riffs.length === 0) return [];
        const riff = riffs[this.random.nextInt(riffs.length)];
        const drumEvents: FractalEvent[] = [];

        const add = (pattern: number[] | undefined, pool: string[]) => {
            if (pattern && pool.length > 0) {
                pattern.forEach(t => {
                    drumEvents.push({
                        type: pool[this.random.nextInt(pool.length)],
                        time: t / 3, duration: 0.2, weight: 0.85,
                        technique: 'hit', dynamics: 'f', phrasing: 'staccato'
                    });
                });
            }
        };

        add(riff.K, kit.kick);
        add(riff.SD, kit.snare);
        add(riff.HH, kit.hihat);
        add(riff.R, kit.ride);
        add(riff.T, kit.perc);

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

        const events: FractalEvent[] = selectedRiff[src].map(n => ({
            type: 'bass',
            note: chord.rootNote + (DEGREE_TO_SEMITONE[n.deg] || 0) - 12,
            time: n.t / 3,
            duration: ((n.d || 2) / 3) * 0.98,
            weight: 0.95,
            technique: 'pluck', dynamics: 'mf', phrasing: 'legato',
            params: { cutoff: 1200, resonance: 0.6, distortion: 0.1, portamento: 0.05 }
        }));

        humanizeEvents(events, 0.01, this.random);
        return events;
    }

    private generateAdvancedAccompaniment(chord: GhostChord, navInfo: NavigationInfo, epoch: number, instrument?: string): FractalEvent[] {
        const isGuitar = instrument?.toLowerCase().includes('guitar');
        const events: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const root = chord.rootNote;
        
        if (isGuitar) {
            // #ЗАЧЕМ: Использование гитарных паттернов (Strum/Finger) для акустической гитары.
            const patternName = this.random.next() < 0.5 ? 'F_TRAVIS' : 'S_SWING';
            const pattern = GUITAR_PATTERNS[patternName];
            const voicingName = isMinor ? 'Em7_open' : 'E7_open';
            const voicing = BLUES_GUITAR_VOICINGS[voicingName];

            pattern.pattern.forEach(step => {
                step.ticks.forEach(t => {
                    step.stringIndices.forEach((idx, sIdx) => {
                        const noteOnTime = (t / 3) + (sIdx * (pattern.rollDuration / 12));
                        events.push({
                            type: 'accompaniment',
                            note: voicing[voicing.length - 1 - idx] + 24, // Lift to correct octave
                            time: noteOnTime,
                            duration: 0.5,
                            weight: 0.6,
                            technique: 'pick', dynamics: 'mf', phrasing: 'detached',
                            params: { barCount: epoch, voicingName }
                        });
                    });
                });
            });
        } else {
            // #ЗАЧЕМ: "Блюзовые Чопы" для органов.
            const shellVoicing = [root + (isMinor ? 3 : 4), root + 10, root + 14];
            const chopTicks = [4, 10]; // "и" 2 и "и" 4
            chopTicks.forEach(tick => {
                shellVoicing.forEach(n => {
                    events.push({
                        type: 'accompaniment',
                        note: n + 36, // LIFT +3 OCTAVES
                        time: tick / 3,
                        duration: 0.2,
                        weight: 0.7,
                        technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                    });
                });
            });
        }

        humanizeEvents(events, 0.02, this.random);
        return events;
    }

    private generatePianoChops(chord: GhostChord, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor';
        const root = chord.rootNote;
        // Piano Chords: 1-3-7
        const notes = [root, root + (isMinor ? 3 : 4), root + 10];
        
        [0, 6].forEach(tick => { // На 1 и 3 доли
            notes.forEach(n => {
                events.push({
                    type: 'pianoAccompaniment',
                    note: n + 36, // Lift to midrange
                    time: tick / 3,
                    duration: 0.25,
                    weight: 0.5,
                    technique: 'hit', dynamics: 'p', phrasing: 'staccato'
                });
            });
        });
        return events;
    }

    private generateVirtuosoSolo(chord: GhostChord, dna: SuiteDNA, epoch: number, navInfo: NavigationInfo, instrument?: string): FractalEvent[] {
        const isAcoustic = instrument === 'blackAcoustic';
        const currentSoloPlan = this.cognitiveState.tensionLevel > 0.8 ? 'S_ACTIVE' : (dna.soloPlanMap.get(navInfo.currentPart.id) || 'S01');
        const plan = BLUES_SOLO_PLANS[currentSoloPlan];
        
        const barIn12 = epoch % 12;
        const chorusIdx = Math.floor(epoch / 12) % (plan?.choruses.length || 1);
        const lickId = plan?.choruses[chorusIdx][barIn12] || 'L01';
        
        // #ЗАЧЕМ: Глубокое копирование и мутация фразы.
        let lickPhrase = JSON.parse(JSON.stringify(BLUES_SOLO_LICKS[lickId].phrase));

        if (this.cognitiveState.phraseState === 'response') {
            if (this.random.next() < 0.4) lickPhrase = transposeMelody(lickPhrase, 5);
            else if (this.random.next() < 0.3) lickPhrase = invertMelody(lickPhrase);
        }

        const events: FractalEvent[] = [];
        lickPhrase.forEach((note: any) => {
            // #ЗАЧЕМ: ФИКС РЕГИСТРА МЕЛОДИИ (60-84).
            //         baseKey (~24) + offset (0-17) + 48 = 72-89.
            //         Уменьшим лифт до +36 для попадания в целевые 55-76.
            const rootPitch = chord.rootNote + (DEGREE_TO_SEMITONE[note.deg] || 0) + 36; 

            // #ЗАЧЕМ: Внедрение Power Chords и Double Stops (виртуозная техника).
            const isDoubleStop = this.random.next() < 0.2 && !isAcoustic;

            events.push({
                type: 'melody',
                note: rootPitch,
                time: note.t / 3,
                duration: (note.d || 2) / 3,
                weight: 0.95,
                technique: (note.tech || 'pick') as Technique,
                dynamics: 'mf', phrasing: 'legato', params: { barCount: epoch }
            });

            if (isDoubleStop) {
                events.push({
                    type: 'melody',
                    note: rootPitch + 3, // Тональный интервал
                    time: note.t / 3 + 0.01,
                    duration: (note.d || 2) / 3,
                    weight: 0.7,
                    technique: 'pick', dynamics: 'p', phrasing: 'legato'
                });
            }
        });

        // #ЗАЧЕМ: Добавление арпеджированных пассажей при высоком напряжении.
        if (this.cognitiveState.tensionLevel > 0.7 && events.length < 4) {
            const passenger = [0, 3, 5, 6, 7, 10].map(deg => chord.rootNote + deg + 36);
            passenger.forEach((p, i) => {
                events.push({
                    type: 'melody', note: p, time: (i * 1.5) / 12, duration: 0.1, weight: 0.6,
                    technique: 'pick', dynamics: 'p', phrasing: 'staccato'
                });
            });
        }

        humanizeEvents(events, 0.01, this.random);
        return events;
    }

    private evolveEmotion() {
        this.cognitiveState.emotion.melancholy += (this.random.next() - 0.5) * 0.05;
        this.cognitiveState.tensionLevel += this.random.next() * 0.08;
        if (this.cognitiveState.tensionLevel > 1.0) this.cognitiveState.tensionLevel = 0.3;
        this.cognitiveState.emotion.melancholy = Math.max(0.1, Math.min(0.98, this.cognitiveState.emotion.melancholy));
    }
}
