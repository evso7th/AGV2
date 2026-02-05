import type { 
    FractalEvent, 
    Mood, 
    Genre, 
    GhostChord, 
    SuiteDNA, 
    NavigationInfo, 
    BluesCognitiveState,
    InstrumentHints
} from '@/types/music';
import { BLUES_SOLO_LICKS, BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { DRUM_KITS } from './assets/drum-kits';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { 
    DEGREE_TO_SEMITONE, 
    humanizeEvents
} from './music-theory';

/**
 * #ЗАЧЕМ: "Блюзовый Архитектор" v8.0 — "Cognitive Soul".
 * #ЧТО: Реализует логику AAB (Statement-Variation-Answer), правила разрешения ♭5,
 *       "Midnight Drag" (оттяжку) и активный Travis Picking.
 * #ИНТЕГРАЦИЯ: Полностью контролирует исполнение Black Acoustic и Organ.
 */
export class BluesBrain {
    private state: BluesCognitiveState;
    private random: any;
    private lastAxiom: FractalEvent[] = [];
    private barInChorus = 0;

    constructor(seed: number, mood: Mood) {
        this.random = this.seededRandom(seed);
        this.state = {
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

        // 1. УДАРНЫЕ: Ритмический "кач" с акцентами (не в сетку!)
        if (hints.drums) events.push(...this.generateDrums(navInfo, epoch));

        // 2. БАС: Умные риффы с процедурными мостами
        if (hints.bass) events.push(...this.generateWalkingBass(currentChord, epoch));
        
        // 3. АККОМПАНЕМЕНТ: Живые "пальцы" (Travis Picking + Strumming)
        if (hints.accompaniment) events.push(...this.generateAcousticComping(currentChord, epoch));
        
        // 4. МЕЛОДИЯ: Когнитивная речь по закону AAB
        if (hints.melody) events.push(...this.generateCognitiveMelody(currentChord, epoch, navInfo));

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
                    // Midnight Drag для малого барабана и хэта
                    const drag = pool[0].includes('snare') || pool[0].includes('hat') ? (this.random.next() * 0.045) : 0;
                    drumEvents.push({
                        type: pool[this.random.nextInt(pool.length)],
                        time: (t / 3) + drag, 
                        duration: 0.2, weight: weight,
                        technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                    });
                });
            }
        };

        add(riff.K, kit.kick, 0.85);
        add(riff.SD, kit.snare, 0.75);
        add(riff.HH, kit.hihat, 0.45);
        if (this.barInChorus === 11) add([0, 3, 6, 9], kit.perc, 0.6); // Fill на 12-м такте
        
        return drumEvents;
    }

    private generateWalkingBass(chord: GhostChord, epoch: number): FractalEvent[] {
        const mood = this.state.emotion.melancholy > 0.7 ? 'melancholic' : 'joyful';
        const riffs = BLUES_BASS_RIFFS[mood] || BLUES_BASS_RIFFS['melancholic'];
        const riffTemplate = riffs[this.random.nextInt(riffs.length)];
        
        let pattern = riffTemplate.I;
        if (this.barInChorus === 4 || this.barInChorus === 5) pattern = riffTemplate.IV;
        else if (this.barInChorus === 8) pattern = riffTemplate.V;
        else if (this.barInChorus === 11) pattern = riffTemplate.turn;

        return pattern.map(note => ({
            type: 'bass',
            note: chord.rootNote + DEGREE_TO_SEMITONE[note.deg] - 12,
            time: (note.t / 3) + (this.random.next() * 0.02),
            duration: (note.d || 2) / 3,
            weight: 0.8,
            technique: 'walking', dynamics: 'mf', phrasing: 'legato'
        }));
    }

    private generateAcousticComping(chord: GhostChord, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote;
        const isMinor = chord.chordType === 'minor';
        const chordNotes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];

        // "Busy Fingers" Travis Picking
        const ticks = [0, 2, 4, 6, 8, 10];
        ticks.forEach((t, i) => {
            const noteIdx = i % chordNotes.length;
            // Рассыпаем аккорд (Staggered entry)
            events.push({
                type: 'accompaniment',
                note: chordNotes[noteIdx] + 12, 
                time: (t / 3) + (i * 0.015),
                duration: 0.6,
                weight: 0.35,
                technique: 'pluck', dynamics: 'p', phrasing: 'detached'
            });
        });

        return events;
    }

    private generateCognitiveMelody(chord: GhostChord, epoch: number, navInfo: NavigationInfo): FractalEvent[] {
        // Логика AAB
        const phase = this.barInChorus < 4 ? 'A' : (this.barInChorus < 8 ? 'A_VAR' : 'B');
        const scale = [0, 3, 5, 6, 7, 10]; // Blues Pentatonic + b5
        const events: FractalEvent[] = [];
        
        if (phase === 'A') {
            const motif = this.generateMotifRuleBased(chord.rootNote, 0.5);
            this.lastAxiom = motif;
            events.push(...motif);
        } else if (phase === 'A_VAR') {
            // Повтор темы с вариацией регистра или легкой оттяжкой
            events.push(...this.lastAxiom.map(n => ({
                ...n,
                note: n.note + (chord.rootNote - this.lastAxiom[0].note), // Транспозиция под аккорд
                time: n.time + (this.random.next() * 0.1) // "Ленивая" вариация
            })));
        } else {
            // Ответ B: Эмоциональный пик и разрешение
            events.push(...this.generateMotifRuleBased(chord.rootNote, 0.9));
        }

        return events;
    }

    private generateMotifRuleBased(root: number, energy: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const scale = [0, 3, 5, 6, 7, 10]; // 6 = b5 (blue note)
        const count = 3 + Math.floor(energy * 5);
        let currentTick = 0;

        for (let i = 0; i < count; i++) {
            let degIndex = this.random.nextInt(scale.length);
            let degree = scale[degIndex];
            
            // ПРАВИЛО РАЗРЕШЕНИЯ b5: если прошлая нота была b5, эта обязана быть 5 или b3
            if (this.state.blueNotePending) {
                degree = this.random.next() > 0.5 ? 7 : 3;
                this.state.blueNotePending = false;
            } else if (degree === 6) {
                this.state.blueNotePending = true;
            }

            const pitch = root + degree + 24; // C3-C5 range (заземление)
            const time = (currentTick / 3) + (this.random.next() * 0.05); // Midnight Drag
            
            events.push({
                type: 'melody',
                note: pitch,
                time: time,
                duration: 0.4 + (this.random.next() * 0.6),
                weight: 0.85,
                technique: degree === 6 ? 'bend' : (this.random.next() > 0.8 ? 'slide' : 'pick'),
                dynamics: 'p', phrasing: 'legato'
            });

            currentTick += 2 + this.random.nextInt(3);
            if (currentTick >= 12) break;
        }

        return events;
    }
}
