
import type { Note, Technique } from "@/types/music";
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';

/**
 * #ЗАЧЕМ: Сэмплер Black Acoustic с поддержкой естественных хвостов (tails) и режима "Transient Donor".
 * #ЧТО: Внедрена возможность проигрывания только первых 20мс сэмпла (Surgical Cut) для создания глюков.
 *       Использует расширенную карту сэмплов E3-E6.
 */
const BLACK_GUITAR_ORD_SAMPLES: Record<string, string> = {
    'e3': '/assets/acoustic_guitar_samples/black/ord/twang_e3_f_rr3.ogg',
    'f3': '/assets/acoustic_guitar_samples/black/ord/twang_f3_p_rr1.ogg',
    'g3': '/assets/acoustic_guitar_samples/black/ord/twang_g3_mf_rr1.ogg',
    'a3': '/assets/acoustic_guitar_samples/black/ord/twang_a3_f_rr2.ogg',
    'b3': '/assets/acoustic_guitar_samples/black/ord/twang_b3_mf_rr3.ogg',
    'c4': '/assets/acoustic_guitar_samples/black/ord/twang_c4_mf_rr2.ogg',
    'd4': '/assets/acoustic_guitar_samples/black/ord/twang_d4_mf_rr3.ogg',
    'e4': '/assets/acoustic_guitar_samples/black/ord/twang_e4_mf_rr1.ogg',
    'f4': '/assets/acoustic_guitar_samples/black/ord/twang_f4_mf_rr1.ogg',
    'g4': '/assets/acoustic_guitar_samples/black/ord/twang_g4_mf_rr2.ogg',
    'a4': '/assets/acoustic_guitar_samples/black/ord/twang_a4_mf_rr2.ogg',
    'b4': '/assets/acoustic_guitar_samples/black/ord/twang_b4_mf_rr2.ogg',
    'c5': '/assets/acoustic_guitar_samples/black/ord/twang_c5_mf_rr3.ogg',
    'd5': '/assets/acoustic_guitar_samples/black/ord/twang_d5_f_rr1.ogg',
    'e5': '/assets/acoustic_guitar_samples/black/ord/twang_e5_f_rr1.ogg',
    'f5': '/assets/acoustic_guitar_samples/black/ord/twang_f5_mf_rr3.ogg',
    'g5': '/assets/acoustic_guitar_samples/black/ord/twang_g5_mf_rr2.ogg',
    'a5': '/assets/acoustic_guitar_samples/black/ord/twang_a5_mf_rr2.ogg',
    'b5': '/assets/acoustic_guitar_samples/black/ord/twang_b5_f_rr2.ogg',
    'c6': '/assets/acoustic_guitar_samples/black/ord/twang_c6_f_rr1.ogg',
    'd6': '/assets/acoustic_guitar_samples/black/ord/twang_d6_mf_rr1.ogg',
    'e6': '/assets/acoustic_guitar_samples/black/ord/twang_e6_mf_rr1.ogg',
};

type SamplerInstrument = {
    buffers: Map<number, AudioBuffer>;
};

export class BlackGuitarSampler {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private instruments = new Map<string, SamplerInstrument>();
    public isInitialized = false;
    private isLoading = false;
    private preamp: GainNode;
    
    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.2;
        this.preamp.connect(this.destination);
    }

    async init(): Promise<boolean> {
        return this.loadInstrument('blackAcoustic', BLACK_GUITAR_ORD_SAMPLES);
    }

    async loadInstrument(instrumentName: 'blackAcoustic', sampleMap: Record<string, string>): Promise<boolean> {
        if (this.isInitialized || this.isLoading) return true;
        this.isLoading = true;

        try {
            const loadedBuffers = new Map<number, AudioBuffer>();
            
            const loadSample = async (url: string) => {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                return await this.audioContext.decodeAudioData(arrayBuffer);
            };
            
            const notePromises = Object.entries(sampleMap).map(async ([key, url]) => {
                const midi = this.keyToMidi(key);
                if (midi === null) return;
                try {
                    const buffer = await loadSample(url);
                    loadedBuffers.set(midi, buffer);
                } catch(e) { console.error(`Error loading sample for ${key}`, e); }
            });

            await Promise.all(notePromises);
            this.instruments.set(instrumentName, { buffers: loadedBuffers });
            this.isInitialized = true;
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error(`[BlackGuitarSampler] Failed:`, error);
            this.isLoading = false;
            return false;
        }
    }
    
    public schedule(notes: Note[], time: number, tempo: number = 120, isTransientMode: boolean = false) {
        const instrument = this.instruments.get('blackAcoustic');
        if (!this.isInitialized || !instrument) return;

        notes.forEach(note => {
            if (note.technique && (note.technique.startsWith('F_') || note.technique.startsWith('S_'))) {
                this.playPattern(instrument, note, time, tempo, isTransientMode);
            } else {
                this.playSingleNote(instrument, note, time, isTransientMode);
            }
        });
    }

    private playPattern(instrument: SamplerInstrument, note: Note, barStartTime: number, tempo: number, isTransient: boolean) {
        const patternName = note.technique as string;
        const patternData = GUITAR_PATTERNS[patternName];
        if (!patternData) {
            this.playSingleNote(instrument, note, barStartTime, isTransient);
            return;
        }

        const voicingName = note.params?.voicingName || 'E7_open';
        const voicing = BLUES_GUITAR_VOICINGS[voicingName];
        if (!voicing) return;

        const beatDuration = 60 / tempo;
        const ticksPerBeat = 3;

        for (const event of patternData.pattern) {
            for (const tick of event.ticks) {
                const noteTimeInBar = (tick / ticksPerBeat) * beatDuration;
                for (const stringIndex of event.stringIndices) {
                    if (stringIndex < voicing.length) {
                        const midiNote = voicing[voicing.length - 1 - stringIndex];
                        const { buffer, midi: sampleMidi } = this.findBestSample(instrument, midiNote);
                        if (buffer) {
                             const playTime = barStartTime + noteTimeInBar + ((patternData.rollDuration / ticksPerBeat) * beatDuration * (voicing.length - 1 - stringIndex));
                             this.playSample(buffer, sampleMidi, midiNote, playTime, note.velocity || 0.7, undefined, isTransient);
                        }
                    }
                }
            }
        }
    }

    private playSingleNote(instrument: SamplerInstrument, note: Note, startTime: number, isTransient: boolean) {
        const { buffer, midi: sampleMidi } = this.findBestSample(instrument, note.midi);
        if (!buffer) return;
        const noteStartTime = startTime + (note.time || 0);
        this.playSample(buffer, sampleMidi, note.midi, noteStartTime, note.velocity || 0.7, note.duration, isTransient);
    }
    
    private playSample(buffer: AudioBuffer, sampleMidi: number, targetMidi: number, startTime: number, velocity: number, duration?: number, isTransient: boolean = false) {
        if (!isFinite(startTime) || !isFinite(velocity) || !isFinite(targetMidi) || !isFinite(sampleMidi)) {
            return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = this.audioContext.createGain();
        source.connect(gainNode);
        gainNode.connect(this.preamp);

        const playbackRate = Math.pow(2, (targetMidi - sampleMidi) / 12);
        source.playbackRate.value = isFinite(playbackRate) ? playbackRate : 1.0;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(velocity, startTime + 0.005);

        // #ЗАЧЕМ: Реализация "Surgical Cut" для создания неземных глюков (Silent Hill style).
        // #ЧТО: Если включен режим транзиента, звук принудительно обрывается через 20мс.
        if (isTransient) {
            const transientDuration = 0.02; // 20ms
            source.start(startTime);
            gainNode.gain.setTargetAtTime(0, startTime + 0.015, 0.002);
            source.stop(startTime + transientDuration);
        } else {
            if (duration && isFinite(duration)) {
                gainNode.gain.setTargetAtTime(0, startTime + duration, 0.5);
            }
            source.start(startTime);
        }
        
        source.onended = () => {
            try { gainNode.disconnect(); } catch(e) {}
        };
    }

    private findBestSample(instrument: SamplerInstrument, targetMidi: number): { buffer: AudioBuffer | null, midi: number } {
        const availableMidiNotes = Array.from(instrument.buffers.keys());
        if (availableMidiNotes.length === 0) return { buffer: null, midi: targetMidi };
        const closestMidi = availableMidiNotes.reduce((prev, curr) => 
            Math.abs(curr - targetMidi) < Math.abs(prev - targetMidi) ? curr : prev
        );
        return { buffer: instrument.buffers.get(closestMidi) ?? null, midi: closestMidi };
    }
    
    private keyToMidi(key: string): number | null {
        const noteMatch = key.toLowerCase().match(/([a-g][b#]?)(\d)/);
        if (!noteMatch) return null;
        let [, name, octaveStr] = noteMatch;
        const octave = parseInt(octaveStr, 10);
        const noteMap: Record<string, number> = {
            'c': 0, 'c#': 1, 'db': 1, 'd': 2, 'd#': 3, 'eb': 3, 'e': 4, 'f': 5, 'f#': 6, 'gb': 6, 'g': 7, 'g#': 8, 'ab': 8, 'a': 9, 'a#': 10, 'bb': 10, 'b': 11
        };
        const noteValue = noteMap[name];
        if (noteValue === undefined) return null;
        return 12 * (octave + 1) + noteValue;
    }

    public stopAll() {}
    public dispose() { this.preamp.disconnect(); }
}
