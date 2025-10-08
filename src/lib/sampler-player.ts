
import type { Note } from "@/types/music";

type SamplerInstrument = {
    buffers: Map<number, AudioBuffer>; // Map from MIDI note to AudioBuffer
    noteRange: [number, number];
};

export class SamplerPlayer {
    private audioContext: AudioContext;
    private outputNode: GainNode;
    private instruments = new Map<string, SamplerInstrument>();
    public isInitialized = false;
    private preamp: GainNode; // Pre-amplifier for the piano

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.outputNode = this.audioContext.createGain();
        
        // Create and connect the preamp
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 2.0; // Boost volume by 2x
        this.preamp.connect(this.outputNode);
        
        this.outputNode.connect(destination);
    }
    
    public setVolume(volume: number) {
        this.outputNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
    }


    async loadInstrument(instrumentName: string, sampleMap: Record<string, string>): Promise<boolean> {
        if (this.instruments.has(instrumentName)) {
            console.log(`[SamplerPlayer] Instrument "${instrumentName}" already loaded.`);
            return true;
        }

        try {
            const loadedBuffers = new Map<number, AudioBuffer>();
            let minMidi = Infinity;
            let maxMidi = -Infinity;

            const loadPromises = Object.entries(sampleMap).map(async ([noteStr, url]) => {
                const midi = this.noteToMidi(noteStr);
                if (midi === null) {
                    console.warn(`[SamplerPlayer] Could not parse MIDI for note: ${noteStr}`);
                    return;
                }
                
                minMidi = Math.min(minMidi, midi);
                maxMidi = Math.max(maxMidi, midi);

                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch sample: ${url} (${response.statusText})`);
                    }
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    loadedBuffers.set(midi, audioBuffer);
                } catch (error) {
                    console.error(`Error loading sample ${noteStr} from ${url}:`, error);
                }
            });

            await Promise.all(loadPromises);

            if (loadedBuffers.size === 0) {
                 console.error(`[SamplerPlayer] No samples were loaded for instrument "${instrumentName}".`);
                 return false;
            }
            
            this.instruments.set(instrumentName, {
                buffers: loadedBuffers,
                noteRange: [minMidi, maxMidi],
            });
            
            console.log(`[SamplerPlayer] Instrument "${instrumentName}" loaded successfully with ${loadedBuffers.size} samples.`);
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error(`[SamplerPlayer] Failed to load instrument "${instrumentName}":`, error);
            return false;
        }
    }
    
    public schedule(instrumentName: string, notes: Note[], time: number) {
        if (!this.isInitialized) {
            console.warn('[SamplerPlayer] Tried to schedule before initialized.');
            return;
        }
        
        const instrument = this.instruments.get(instrumentName);
        if (!instrument) {
            console.warn(`[SamplerPlayer] Instrument "${instrumentName}" not loaded.`);
            return;
        }

        notes.forEach(note => {
            const { buffer, midi: sampleMidi } = this.findClosestSample(instrument, note.midi);
            if (!buffer) return;

            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(note.velocity ?? 0.7, this.audioContext.currentTime);

            // Connect source to gain, gain to preamp, preamp to main output
            source.connect(gainNode);
            gainNode.connect(this.preamp);

            // Adjust playback rate for pitch shifting
            const playbackRate = Math.pow(2, (note.midi - sampleMidi) / 12);
            source.playbackRate.value = playbackRate;

            const startTime = time + note.time;
            source.start(startTime);
        });
    }

    private findClosestSample(instrument: SamplerInstrument, targetMidi: number): { buffer: AudioBuffer | null, midi: number } {
        const availableMidiNotes = Array.from(instrument.buffers.keys());
        
        if (availableMidiNotes.length === 0) return { buffer: null, midi: targetMidi };

        const closestMidi = availableMidiNotes.reduce((prev, curr) => 
            Math.abs(curr - targetMidi) < Math.abs(prev - targetMidi) ? curr : prev
        );

        return { buffer: instrument.buffers.get(closestMidi) ?? null, midi: closestMidi };
    }

    private noteToMidi(note: string): number | null {
        // Basic parser for notes like C4, Fs3, F#3
        const match = note.match(/([A-G])([#b]?)(-?\d+)/);
        if (!match) return null;
        
        const noteName = `${match[1].toUpperCase()}${match[2]}`;
        const octave = parseInt(match[3], 10);
        
        const noteMap: Record<string, number> = {
            'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4,
            'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11
        };

        const noteIndex = noteMap[noteName];
        if (noteIndex === undefined) return null;

        return 12 * (octave + 1) + noteIndex;
    }

    public stopAll() {
        // Since we schedule one-shot samples, a global stop isn't easily implemented
        // without tracking every single source node. For ambient music, letting notes
        // decay naturally is usually acceptable.
    }

    public dispose() {
        this.preamp.disconnect();
        this.outputNode.disconnect();
    }
}

    