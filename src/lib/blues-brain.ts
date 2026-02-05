
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
import { 
    DEGREE_TO_SEMITONE, 
    invertMelody, 
    retrogradeMelody, 
    applyNewRhythm, 
    transposeMelody,
    addOrnaments,
    subdivideRhythm,
    varyRhythm,
    humanizeEvents,
    markovNext
} from './music-theory';

const PHRASE_LENGTH_TRANSITIONS: Record<string, Record<string, number>> = {
    '2': { '2': 0.5, '3': 0.3, '4': 0.2 },
    '3': { '2': 0.2, '3': 0.4, '4': 0.4 },
    '4': { '2': 0.1, '4': 0.6, '3': 0.3 }
};

/**
 * #ЗАЧЕМ: "Блюзовый Мозг" v2.0 — "Virtuoso & Drive".
 * #ЧТО: Радикально повышенная плотность, живой аккомпанемент и корректные регистры.
 *       Внедрены техники арпеджио и ритмической пульсации для органов.
 */
export class BluesBrain {
    private cognitiveState: BluesCognitiveState;
    private random: any;
    private lastPhraseLength: string = '2';

    constructor(seed: number, mood: Mood) {
        this.random = this.seededRandom(seed);
        this.cognitiveState = {
            phraseState: 'call',
            tensionLevel: 0.2,
            phraseHistory: [],
            lastPhraseHash: '',
            blueNotePending: false,
            emotion: { 
                melancholy: ['melancholic', 'dark', 'anxious'].includes(mood) ? 0.85 : 0.4,
                darkness: ['dark', 'gloomy'].includes(mood) ? 0.75 : 0.3
            }
        };
    }

    private seededRandom(seed: number) {
        let state = seed;
        return {
            next: () => {
                state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
                return state / Math.pow(2, 32);
            },
            nextInt: (max: number) => Math.floor((state / Math.pow(2, 32)) * max)
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

        const currentChordIdx = dna.harmonyTrack.findIndex(c => epoch >= c.bar && epoch < c.bar + c.durationBars);
        const barInChorus = currentChordIdx % 12;
        this.cognitiveState.phraseState = barInChorus % 4 < 2 ? 'call' : (barInChorus % 4 === 2 ? 'response' : 'fill');

        if (hints.drums) events.push(...this.generateDrums(navInfo, dna, epoch));
        if (hints.bass) events.push(...this.generateBass(currentChord, dna, epoch, navInfo.currentPart.mood));
        if (hints.accompaniment) events.push(...this.generateAccompaniment(currentChord, navInfo, epoch));
        if (hints.melody) events.push(...this.generateSolo(currentChord, dna, epoch, navInfo));

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
                        time: t / 3,
                        duration: 0.2,
                        weight: 0.85,
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

        humanizeEvents(drumEvents, 0.01, this.random);
        return drumEvents;
    }

    private generateBass(chord: GhostChord, dna: SuiteDNA, epoch: number, mood: Mood): FractalEvent[] {
        const riffs = BLUES_BASS_RIFFS[mood] || BLUES_BASS_RIFFS['contemplative'];
        const selectedRiff = riffs[Math.floor(epoch / 4) % riffs.length];
        const currentChordIdx = dna.harmonyTrack.findIndex(c => epoch >= c.bar && epoch < c.bar + c.durationBars);
        const barIn12 = currentChordIdx % 12;
        
        let src: 'I' | 'IV' | 'V' | 'turn' = 'I';
        if (barIn12 === 11) src = 'turn';
        else if ([1, 4, 5, 9].includes(barIn12)) src = 'IV';
        else if (barIn12 === 8) src = 'V';

        const events: FractalEvent[] = selectedRiff[src].map(n => ({
            type: 'bass',
            note: chord.rootNote + (DEGREE_TO_SEMITONE[n.deg] || 0) - 12,
            time: n.t / 3,
            duration: ((n.d || 2) / 3) * 0.98,
            weight: 0.9,
            technique: 'pluck', dynamics: 'mf', phrasing: 'legato',
            params: { cutoff: 1200, resonance: 0.6, distortion: 0.1 }
        }));

        humanizeEvents(events, 0.01, this.random);
        return events;
    }

    private generateAccompaniment(chord: GhostChord, navInfo: NavigationInfo, epoch: number): FractalEvent[] {
        const rules = navInfo.currentPart.instrumentRules?.accompaniment;
        const tech = (rules?.techniques?.[0]?.value || 'chord-pulsation') as AccompanimentTechnique;
        const events: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const root = chord.rootNote;
        
        // Shell Voicings (3-7-9)
        const notes = [root + (isMinor ? 3 : 4), root + 10, root + 14];

        if (tech === 'rhythmic-comp' || tech === 'chord-pulsation') {
            // Живая пульсация: удары на 1, "и" 2, 3, 4
            [0, 4, 6, 9].forEach((tick, beatIdx) => {
                const velMod = beatIdx % 2 === 0 ? 1.0 : 0.7;
                notes.forEach((note, i) => {
                    events.push({
                        type: 'accompaniment',
                        note: note + 24,
                        time: tick / 3,
                        duration: 0.35,
                        weight: (0.45 - (i * 0.05)) * velMod,
                        technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                    });
                });
            });
        } else if (tech === 'arpeggio-slow' || tech === 'arpeggio-fast') {
            // Активное арпеджио для аккомпанемента
            const step = tech === 'arpeggio-fast' ? 1 : 2;
            for (let i = 0; i < 12; i += step) {
                events.push({
                    type: 'accompaniment',
                    note: notes[i % notes.length] + 24 + (i > 6 ? 12 : 0),
                    time: i / 3,
                    duration: (step / 3) * 0.9,
                    weight: 0.4,
                    technique: 'pluck', dynamics: 'mp', phrasing: 'detached'
                });
            }
        } else {
            // Слитные аккорды (Long Chords)
            notes.forEach((note, i) => {
                events.push({
                    type: 'accompaniment',
                    note: note + 24,
                    time: i * 0.02,
                    duration: 4.0,
                    weight: 0.5 - (i * 0.1),
                    technique: 'swell', dynamics: 'mp', phrasing: 'legato',
                    params: { attack: 0.5, release: 2.0 }
                });
            });
        }

        humanizeEvents(events, 0.01, this.random);
        return events;
    }

    private generateSolo(chord: GhostChord, dna: SuiteDNA, epoch: number, navInfo: NavigationInfo): FractalEvent[] {
        let lickPhrase: any[] = [];
        
        // 1. Высокая плотность: если напряжение растет, выбираем виртуозные планы
        const currentSoloPlan = this.cognitiveState.tensionLevel > 0.7 ? 'S_ACTIVE' : (dna.soloPlanMap.get(navInfo.currentPart.id) || 'S01');
        const plan = BLUES_SOLO_PLANS[currentSoloPlan];
        
        const currentChordIdx = dna.harmonyTrack.findIndex(c => epoch >= c.bar && epoch < c.bar + c.durationBars);
        const barIn12 = currentChordIdx % 12;
        const chorusIdx = Math.floor(currentChordIdx / 12) % (plan?.choruses.length || 1);
        
        const lickId = plan?.choruses[chorusIdx][barIn12] || 'L01';
        lickPhrase = JSON.parse(JSON.stringify(BLUES_SOLO_LICKS[lickId].phrase));

        // 2. Драматургические мутации
        if (this.cognitiveState.phraseState === 'response' && this.cognitiveState.phraseHistory.length > 0) {
            const r = this.random.next();
            if (r < 0.4) lickPhrase = transposeMelody(lickPhrase, [5, -7, 2, -2][this.random.nextInt(4)]);
            else if (r < 0.6) lickPhrase = invertMelody(lickPhrase);
            else if (r < 0.8) lickPhrase = applyNewRhythm(lickPhrase, this.random);
        }

        // 3. Анти-монотонность (ЖЕСТКАЯ)
        const currentHash = lickPhrase.map((n: any) => n.deg).join(',');
        if (this.calculateSimilarity(currentHash, this.cognitiveState.lastPhraseHash) > 0.75) {
            lickPhrase = subdivideRhythm(lickPhrase, this.random);
            lickPhrase = addOrnaments(lickPhrase, this.random);
        }
        this.cognitiveState.lastPhraseHash = currentHash;
        
        this.cognitiveState.phraseHistory.push(JSON.parse(JSON.stringify(lickPhrase)));
        if (this.cognitiveState.phraseHistory.length > 12) this.cognitiveState.phraseHistory.shift();

        // 4. Грамматика разрешений
        lickPhrase.forEach((note: any) => {
            if (note.deg === 'b5') this.cognitiveState.blueNotePending = true;
            else if (this.cognitiveState.blueNotePending) {
                note.deg = '4'; // Жесткое разрешение ♭5 -> 4
                this.cognitiveState.blueNotePending = false;
            }
        });

        if (this.cognitiveState.tensionLevel > 0.85 && lickPhrase.length > 0) {
            lickPhrase[lickPhrase.length - 1].deg = 'R';
            lickPhrase[lickPhrase.length - 1].d = 8;
            this.cognitiveState.tensionLevel = 0.1; // Сброс
        }

        // 5. Рендеринг с поднятым регистром (+36)
        const events: FractalEvent[] = lickPhrase.map(note => ({
            type: 'melody',
            note: chord.rootNote + (DEGREE_TO_SEMITONE[note.deg] || 0) + 36, // <<< OCTAVE LIFT (Range 60-84)
            time: note.t / 3,
            duration: (note.d || 2) / 3,
            weight: (0.85 + this.random.next() * 0.15) * (1 - this.cognitiveState.emotion.melancholy * 0.2),
            technique: (note.tech || 'pluck') as Technique,
            dynamics: 'mf', phrasing: 'legato', params: { barCount: epoch }
        }));

        humanizeEvents(events, 0.015, this.random);
        return events;
    }

    private calculateSimilarity(a: string, b: string): number {
        if (!a || !b) return 0;
        const setA = new Set(a.split(','));
        const setB = new Set(b.split(','));
        const inter = new Set([...setA].filter(x => setB.has(x)));
        return inter.size / new Set([...setA, ...setB]).size;
    }

    private evolveEmotion() {
        this.cognitiveState.emotion.melancholy += (this.random.next() - 0.5) * 0.03;
        this.cognitiveState.emotion.darkness += (this.random.next() - 0.5) * 0.02;
        this.cognitiveState.tensionLevel += this.random.next() * 0.05;
        this.cognitiveState.emotion.melancholy = Math.max(0.1, Math.min(0.95, this.cognitiveState.emotion.melancholy));
        this.cognitiveState.emotion.darkness = Math.max(0.1, Math.min(0.9, this.cognitiveState.emotion.darkness));
    }
}
