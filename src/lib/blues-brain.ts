
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
    humanizeEvents
} from './music-theory';

/**
 * #ЗАЧЕМ: "Блюзовый Мозг" — автономный модуль музыкального интеллекта.
 * #ЧТО: Хранитель правил и сокровищницы блюза. Умеет в вариативность, 
 *       мутагенез мотивов (секвенции, инверсии) и когнитивный контроль.
 * #СВЯЗИ: Вызывается из FractalMusicEngine при выборе жанра 'blues'.
 */
export class BluesBrain {
    private cognitiveState: BluesCognitiveState;
    private random: any;

    constructor(seed: number, mood: Mood) {
        this.random = this.seededRandom(seed);
        this.cognitiveState = {
            phraseState: 'call',
            tensionLevel: 0.1,
            phraseHistory: [],
            lastPhraseHash: '',
            blueNotePending: false,
            emotion: { 
                melancholy: ['melancholic', 'dark', 'anxious'].includes(mood) ? 0.8 : 0.3,
                darkness: ['dark', 'gloomy'].includes(mood) ? 0.7 : 0.2
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

    /**
     * Генерирует события для одного такта блюза.
     */
    public generateBar(
        epoch: number, 
        currentChord: GhostChord, 
        navInfo: NavigationInfo, 
        dna: SuiteDNA, 
        hints: InstrumentHints
    ): FractalEvent[] {
        const events: FractalEvent[] = [];
        
        // 1. Управление Эмоцией
        this.evolveEmotion();

        // 2. Определение фазы фразы (Зов / Ответ / Филл)
        const currentChordIdx = dna.harmonyTrack.findIndex(c => epoch >= c.bar && epoch < c.bar + c.durationBars);
        const barInChorus = currentChordIdx % 12;
        this.cognitiveState.phraseState = barInChorus % 4 < 2 ? 'call' : (barInChorus % 4 === 2 ? 'response' : 'fill');

        // 3. Генерация партий
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
                        weight: 0.8,
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
        // Ротация риффа каждые 4 такта
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
            duration: ((n.d || 2) / 3) * 0.95,
            weight: 0.85 + this.random.next() * 0.1,
            technique: 'pluck', dynamics: 'mf', phrasing: 'legato',
            params: { cutoff: 800, resonance: 0.7, distortion: 0.15 }
        }));

        humanizeEvents(events, 0.015, this.random);
        return events;
    }

    private generateAccompaniment(chord: GhostChord, navInfo: NavigationInfo, epoch: number): FractalEvent[] {
        const tech = (navInfo.currentPart.instrumentRules?.accompaniment?.techniques?.[0]?.value || 'long-chords') as AccompanimentTechnique;
        const events: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const root = chord.rootNote;
        
        // Shell Voicings (3-7-9)
        const notes = [root + (isMinor ? 3 : 4), root + 10, root + 14];

        if (tech === 'rhythmic-comp') {
            [4, 10].forEach(tick => {
                notes.forEach((note, i) => {
                    events.push({
                        type: 'accompaniment',
                        note: note + 24,
                        time: tick / 3,
                        duration: 0.4,
                        weight: 0.4 - (i * 0.05),
                        technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                    });
                });
            });
        } else {
            notes.forEach((note, i) => {
                events.push({
                    type: 'accompaniment',
                    note: note + 24,
                    time: i * 0.05,
                    duration: 4.0,
                    weight: 0.5 - (i * 0.1),
                    technique: 'swell', dynamics: 'mp', phrasing: 'legato',
                    params: { attack: 0.8, release: 2.5 }
                });
            });
        }

        humanizeEvents(events, 0.015, this.random);
        return events;
    }

    private generateSolo(chord: GhostChord, dna: SuiteDNA, epoch: number, navInfo: NavigationInfo): FractalEvent[] {
        let lickPhrase: any[] = [];
        let lickId = 'custom';
        let developmentType = 'none';

        // --- ЛОГИКА РАЗВИТИЯ (Секвенции, Инверсии) ---
        if (this.cognitiveState.phraseState === 'response' && this.cognitiveState.phraseHistory.length > 0) {
            const lastPhrase = JSON.parse(JSON.stringify(this.cognitiveState.phraseHistory[this.cognitiveState.phraseHistory.length - 1]));
            const r = this.random.next();
            
            if (r < 0.3) {
                lickPhrase = transposeMelody(lastPhrase, [5, -7, 2, -2][this.random.nextInt(4)]);
                developmentType = 'sequence';
            } else if (r < 0.5) {
                lickPhrase = invertMelody(lastPhrase);
                developmentType = 'inversion';
            } else if (r < 0.7) {
                lickPhrase = applyNewRhythm(lastPhrase, this.random);
                developmentType = 'rhythm-variation';
            } else {
                lickPhrase = retrogradeMelody(lastPhrase);
                developmentType = 'retrograde';
            }
            lickId = `dev-${developmentType}`;
        }

        // --- ВЫБОР ИЗ СОКРОВИЩНИЦЫ ---
        if (lickPhrase.length === 0) {
            if (dna.bluesMelodyId) {
                const baseMelody = BLUES_MELODY_RIFFS.find(m => m.id === dna.bluesMelodyId);
                if (baseMelody) {
                    const currentChordIdx = dna.harmonyTrack.findIndex(c => epoch >= c.bar && epoch < c.bar + c.durationBars);
                    const barIn12 = currentChordIdx % 12;
                    if (barIn12 === 11) lickPhrase = JSON.parse(JSON.stringify(baseMelody.phraseTurnaround));
                    else if (barIn12 === 8) lickPhrase = JSON.parse(JSON.stringify(baseMelody.phraseV));
                    else if ([1, 4, 5, 9].includes(barIn12)) lickPhrase = JSON.parse(JSON.stringify(baseMelody.phraseIV));
                    else lickPhrase = JSON.parse(JSON.stringify(baseMelody.phraseI));
                    lickId = baseMelody.id;
                }
            }

            if (lickPhrase.length === 0 || this.random.next() < 0.25) {
                const isMinor = chord.chordType === 'minor';
                const targetTag = isMinor ? 'minor' : 'major';
                const lickPool = Object.entries(BLUES_SOLO_LICKS).filter(([_, data]) => data.tags.includes(targetTag));
                lickId = lickPool[this.random.nextInt(lickPool.length)][0];
                lickPhrase = JSON.parse(JSON.stringify(BLUES_SOLO_LICKS[lickId].phrase));
            }
        }

        // --- Similarity Guard ---
        const currentHash = lickPhrase.map((n: any) => n.deg).join(',');
        if (this.calculateSimilarity(currentHash, this.cognitiveState.lastPhraseHash) > 0.8) {
            lickPhrase = varyRhythm(lickPhrase, this.random);
            if (this.random.next() < 0.5) lickPhrase = subdivideRhythm(lickPhrase, this.random);
        }
        this.cognitiveState.lastPhraseHash = currentHash;
        
        if (lickId !== 'dev-reprise') {
            this.cognitiveState.phraseHistory.push(JSON.parse(JSON.stringify(lickPhrase)));
            if (this.cognitiveState.phraseHistory.length > 12) this.cognitiveState.phraseHistory.shift();
        }

        // --- Blue Note Resolve ---
        lickPhrase.forEach((note: any) => {
            if (note.deg === 'b5') this.cognitiveState.blueNotePending = true;
            else if (this.cognitiveState.blueNotePending) {
                if (note.deg !== '4' && note.deg !== '5') note.deg = this.random.next() > 0.5 ? '5' : '4';
                this.cognitiveState.blueNotePending = false;
            }
        });

        // --- Tension Override ---
        if (this.cognitiveState.tensionLevel > 0.8 && lickPhrase.length > 0) {
            lickPhrase[lickPhrase.length - 1].deg = 'R';
            lickPhrase[lickPhrase.length - 1].d = 6;
            this.cognitiveState.tensionLevel = 0.2;
        }

        const events: FractalEvent[] = lickPhrase.map(note => ({
            type: 'melody',
            note: chord.rootNote + (DEGREE_TO_SEMITONE[note.deg] || 0) + 12,
            time: note.t / 3,
            duration: (note.d || 2) / 3,
            weight: (0.75 + this.random.next() * 0.2) * (1 - this.cognitiveState.emotion.melancholy * 0.3),
            technique: (note.tech || 'pluck') as Technique,
            dynamics: 'mf', phrasing: 'legato', params: { barCount: epoch }
        }));

        humanizeEvents(events, 0.02, this.random);
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
        this.cognitiveState.emotion.melancholy += (this.random.next() - 0.5) * 0.02;
        this.cognitiveState.emotion.darkness += (this.random.next() - 0.5) * 0.01;
        this.cognitiveState.emotion.melancholy = Math.max(0.1, Math.min(0.9, this.cognitiveState.emotion.melancholy));
        this.cognitiveState.emotion.darkness = Math.max(0.1, Math.min(0.9, this.cognitiveState.emotion.darkness));
    }
}
