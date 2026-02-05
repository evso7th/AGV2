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
 * #ЗАЧЕМ: "Блюзовый Архитектор" v9.0 — "Dark & Grounded Foundation".
 * #ЧТО: Усиленная регистровая политика (октава +0/+12) и декоративный аккомпанемент.
 * #ИНТЕГРАЦИЯ: Контролирует Dark Telecaster и Organ в диапазоне MIDI 36-71.
 */
export class BluesBrain {
    private state: BluesCognitiveState;
    private random: any;
    private lastAxiom: FractalEvent[] = [];
    private barInChorus = 0;
    
    private readonly COMFORT_CEILING = 71; 
    private readonly EXCEPTIONAL_THRESHOLD = 0.85;

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

    private clampToCeiling(pitch: number, isExceptional: boolean = false): number {
        // #ЗАЧЕМ: Ультра-низкая регистровая политика.
        // #ЧТО: Опускаем потолок до 71 (H4). Если нота выше, опускаем на 2 октавы.
        let result = pitch;
        const limit = isExceptional ? 83 : this.COMFORT_CEILING;
        
        while (result > limit) {
            result -= 12;
        }
        
        // Гарантируем, что не опустимся в суб-бас (ниже 36)
        while (result < 36 && result > 0) {
            result += 12;
        }
        
        return result;
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

        // 1. УДАРНЫЕ
        if (hints.drums) events.push(...this.generateDrums(navInfo, epoch));

        // 2. БАС (Гарантированная плотность)
        if (hints.bass) events.push(...this.generateWalkingBass(currentChord, epoch));
        
        // 3. АККОМПАНЕМЕНТ: Декоративный перебор в 2-3 октавах
        if (hints.accompaniment) events.push(...this.generateDecorativeComping(currentChord, epoch));
        
        // 4. МЕЛОДИЯ: Низкая, грудная речь
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
                    const drag = (this.random.next() * 0.035); // Midnight Drag
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
        if (this.barInChorus === 11) add([0, 3, 6, 9], kit.perc, 0.6); 
        
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
            time: (note.t / 3) + (this.random.next() * 0.03), // Живая оттяжка баса
            duration: (note.d || 3) / 3, // Увеличена длительность для поддержки фона
            weight: 0.85,
            technique: 'walking', dynamics: 'mf', phrasing: 'legato'
        }));
    }

    private generateDecorativeComping(chord: GhostChord, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote;
        const isMinor = chord.chordType === 'minor';
        // Аккордовые ступени для перебора
        const chordNotes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];

        // Основной ритмический перебор (пальчики работают)
        const ticks = [0, 3, 6, 9];
        ticks.forEach((t, i) => {
            const noteIdx = i % chordNotes.length;
            let pitch = chordNotes[noteIdx] + 12; // Опущено на 2 октавы от предыдущего +36
            pitch = this.clampToCeiling(pitch, false);

            events.push({
                type: 'accompaniment',
                note: pitch, 
                time: (t / 3) + (this.random.next() * 0.04), // Небрежность
                duration: 0.8,
                weight: 0.4,
                technique: 'pluck', dynamics: 'p', phrasing: 'detached'
            });

            // Добавляем "украшательство" (мелизмы) на слабые доли
            if (this.random.next() > 0.6) {
                const decoration = chordNotes[this.random.nextInt(chordNotes.length)] + 12 + (this.random.next() > 0.5 ? 2 : -2);
                events.push({
                    type: 'accompaniment',
                    note: this.clampToCeiling(decoration, false),
                    time: (t / 3) + 0.15,
                    duration: 0.2,
                    weight: 0.2,
                    technique: 'ghost', dynamics: 'pp', phrasing: 'staccato'
                });
            }
        });

        return events;
    }

    private generateCognitiveMelody(chord: GhostChord, epoch: number, navInfo: NavigationInfo): FractalEvent[] {
        const phase = this.barInChorus < 4 ? 'A' : (this.barInChorus < 8 ? 'A_VAR' : 'B');
        const events: FractalEvent[] = [];
        
        const canGoHigh = phase === 'B' && this.state.tensionLevel > this.EXCEPTIONAL_THRESHOLD;

        if (phase === 'A') {
            const motif = this.generateMotifRuleBased(chord.rootNote, 0.5, false);
            this.lastAxiom = motif;
            events.push(...motif);
        } else if (phase === 'A_VAR') {
            events.push(...this.lastAxiom.map(n => {
                let newNote = n.note + (chord.rootNote - (this.lastAxiom[0]?.note || chord.rootNote));
                return {
                    ...n,
                    note: this.clampToCeiling(newNote, false),
                    time: n.time + (this.random.next() * 0.08)
                };
            }));
        } else {
            events.push(...this.generateMotifRuleBased(chord.rootNote, 0.9, canGoHigh));
        }

        return events;
    }

    private generateMotifRuleBased(root: number, energy: number, allowExceptional: boolean): FractalEvent[] {
        const events: FractalEvent[] = [];
        const scale = [0, 3, 5, 6, 7, 10]; 
        const count = 3 + Math.floor(energy * 5);
        let currentTick = 0;

        for (let i = 0; i < count; i++) {
            let degIndex = this.random.nextInt(scale.length);
            let degree = scale[degIndex];
            
            if (this.state.blueNotePending) {
                degree = this.random.next() > 0.5 ? 7 : 3;
                this.state.blueNotePending = false;
            } else if (degree === 6) {
                this.state.blueNotePending = true;
            }

            // РАСЧЕТ PITCH: опускаем на 2 октавы (используем +0 вместо +24)
            let pitch = root + degree + 0; 
            pitch = this.clampToCeiling(pitch, allowExceptional);

            const time = (currentTick / 3) + (this.random.next() * 0.06); 
            
            events.push({
                type: 'melody',
                note: pitch,
                time: time,
                duration: 0.6 + (this.random.next() * 0.8),
                weight: 0.9,
                technique: degree === 6 ? 'bend' : (this.random.next() > 0.7 ? 'slide' : 'pick'),
                dynamics: 'p', phrasing: 'legato'
            });

            currentTick += 2 + this.random.nextInt(4);
            if (currentTick >= 12) break;
        }

        return events;
    }
}
