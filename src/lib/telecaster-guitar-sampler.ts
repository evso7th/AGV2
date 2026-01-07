
import type { Note, Technique } from "@/types/music";

const TELECASTER_SAMPLES: Record<string, string> = {
    'c6': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_C6.ogg',
    'b5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_B5.ogg',
    'a5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_A5.ogg',
    'g5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_G5.ogg',
    'f5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_F5.ogg',
    'e5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_E5.ogg',
    'd5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_D5.ogg',
    'c5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_C5.ogg',
    'b4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_B4.ogg',
    'a4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_A4.ogg',
    'g4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_G4.ogg',
    'f4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_F4.ogg',
    'e4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_E4.ogg',
    'd4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_D4.ogg',
    'c4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_C4.ogg',
    'b3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_B3.ogg',
    'a3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_A3.ogg',
    'g3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_G3.ogg',
    'f3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_F3.ogg',
    'e3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_E3.ogg',
    'd3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_D3.ogg',
    'c3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_C3.ogg',
    'b2': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_B2.ogg',
    'a2': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_A2.ogg',
    'g2': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_G2.ogg',
    'f2': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_F2.ogg',
    'e2': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_E2.ogg',
};


type SamplerInstrument = {
    buffers: Map<number, AudioBuffer>;
};

export class TelecasterGuitarSampler {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private instruments = new Map<string, SamplerInstrument>();
    public isInitialized = false;
    private isLoading = false;
    private preamp: GainNode;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        // План 874: Абсолютный Минимализм.
        // 1. Создаем только один узел - предусилитель.
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 4.0; // Сразу ставим высокое усиление для проверки.

        // 2. Подключаем его НАПРЯМУЮ к выходу.
        this.preamp.connect(this.destination);
    }

    private makeDistortionCurve(amount: number): Float32Array {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        let i = 0;
        let x;
        for ( ; i < n_samples; ++i ) {
            x = i * 2 / n_samples - 1;
            curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
        }
        return curve;
    }

    async init(): Promise<boolean> {
        return this.loadInstrument('telecaster', TELECASTER_SAMPLES);
    }

    async loadInstrument(instrumentName: 'telecaster', sampleMap: Record<string, string>): Promise<boolean> {
        if (this.isInitialized || this.isLoading) return true;
        this.isLoading = true;

        if (this.instruments.has(instrumentName)) {
            this.isLoading = false;
            return true;
        }

        try {
            const loadedBuffers = new Map<number, AudioBuffer>();
            
            const loadSample = async (url: string) => {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${'' + response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                return await this.audioContext.decodeAudioData(arrayBuffer);
            };
            
            const notePromises = Object.entries(sampleMap).map(async ([key, url]) => {
                const midi = this.keyToMidi(key);
                if (midi === null) {
                    console.warn(`[TelecasterGuitarSampler] Could not parse MIDI from key: ${key}`);
                    return;
                };

                try {
                    const buffer = await loadSample(url);
                    loadedBuffers.set(midi, buffer);
                } catch(e) { console.error(`Error loading sample for ${key}`, e); }
            });

            await Promise.all(notePromises);
            
            this.instruments.set(instrumentName, { buffers: loadedBuffers });
            console.log(`[TelecasterGuitarSampler] Instrument "${instrumentName}" loaded with ${loadedBuffers.size} samples.`);
            this.isInitialized = true;
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error(`[TelecasterGuitarSampler] Failed to load instrument "${instrumentName}":`, error);
            this.isLoading = false;
            return false;
        }
    }
    
    public schedule(notes: Note[], time: number) {
        const instrument = this.instruments.get('telecaster');
        if (!this.isInitialized || !instrument) return;

        notes.forEach(note => {
            const { buffer, midi: sampleMidi } = this.findBestSample(instrument, note.midi);
            if (!buffer) return;

            const noteStartTime = time + note.time;

            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            
            const gainNode = this.audioContext.createGain();
            
            source.connect(gainNode);
            // План 874: Подключаем ноту НАПРЯМУЮ к предусилителю.
            gainNode.connect(this.preamp);

            const playbackRate = Math.pow(2, (note.midi - sampleMidi) / 12);
            source.playbackRate.value = playbackRate;
            
            const velocity = note.velocity ?? 0.7;
            const noteDuration = note.duration;
            gainNode.gain.setValueAtTime(velocity, noteStartTime);

            if (noteDuration) {
                 gainNode.gain.setTargetAtTime(0, noteStartTime + noteDuration * 0.8, 0.1);
                 source.start(noteStartTime);
                 source.stop(noteStartTime + noteDuration * 1.2);
            } else {
                 source.start(noteStartTime);
            }
        });
    }

    private findBestSample(instrument: SamplerInstrument, targetMidi: number): { buffer: AudioBuffer | null, midi: number } {
        const availableMidiNotes = Array.from(instrument.buffers.keys());
        
        if (availableMidiNotes.length === 0) return { buffer: null, midi: targetMidi };
        const closestMidi = availableMidiNotes.reduce((prev, curr) => 
            Math.abs(curr - targetMidi) < Math.abs(prev - targetMidi) ? curr : prev
        );

        const sampleBuffer = instrument.buffers.get(closestMidi);
        
        return { buffer: sampleBuffer || null, midi: closestMidi };
    }
    
    private keyToMidi(key: string): number | null {
        const noteStr = key.toLowerCase();
        // Updated regex to handle note names like 'g_3'
        const noteMatch = noteStr.match(/([a-g][b#]?)_?(\d)/);
    
        if (!noteMatch) return null;
    
        let [, name, octaveStr] = noteMatch;
        const octave = parseInt(octaveStr, 10);
    
        const noteMap: Record<string, number> = {
            'c': 0, 'c#': 1, 'db': 1, 'd': 2, 'd#': 3, 'eb': 3, 'e': 4, 'f': 5, 'f#': 6, 'gb': 6, 'g': 7, 'g#': 8, 'ab': 8, 'a': 9, 'a#': 10, 'bb': 10, 'b': 11
        };
    
        // Normalize note name for lookup
        const normalizedName = name.replace('#', 's').replace('b', 'f');
        const noteValue = noteMap[name];
        
        if (noteValue === undefined) return null;
    
        return 12 * octave + noteValue;
    }
    

    public stopAll() {
    }

    public dispose() {
        this.preamp.disconnect();
    }
}

    