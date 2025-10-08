
import type { Note } from "@/types/music";

type VelocitySample = {
    velocity: number;
    file: string;
};

type SamplerInstrument = {
    buffers: Map<number, { velocity: number; buffer: AudioBuffer }[]>;
};

export class ViolinSamplerPlayer {
    private audioContext: AudioContext;
    private outputNode: GainNode;
    private instruments = new Map<string, SamplerInstrument>();
    public isInitialized = false;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.outputNode = this.audioContext.createGain();
        this.outputNode.connect(destination);
    }
    
    public setVolume(volume: number) {
        this.outputNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
    }

    async loadInstrument(instrumentName: string, sampleMap: Record<string, VelocitySample[]>): Promise<boolean> {
        if (this.instruments.has(instrumentName)) {
            console.log(`[VelocitySampler] Instrument "${instrumentName}" already loaded.`);
            return true;
        }

        try {
            const loadedBuffers = new Map<number, { velocity: number; buffer: AudioBuffer }[]>();
            
            const loadPromises = Object.entries(sampleMap).flatMap(([noteStr, samples]) => {
                const midi = this.noteToMidi(noteStr);
                if (midi === null) {
                    console.warn(`[VelocitySampler] Could not parse MIDI for note: ${noteStr}`);
                    return [];
                }
                
                if (!loadedBuffers.has(midi)) {
                    loadedBuffers.set(midi, []);
                }
                
                return samples.map(async (sample) => {
                    try {
                        const response = await fetch(sample.file);
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                        loadedBuffers.get(midi)!.push({ velocity: sample.velocity, buffer: audioBuffer });
                    } catch (error) {
                        console.error(`Error loading sample ${noteStr} (${sample.velocity}) from ${sample.file}:`, error);
                    }
                });
            });

            await Promise.all(loadPromises);

            // Sort by velocity for faster lookup
            for (const samples of loadedBuffers.values()) {
                samples.sort((a, b) => a.velocity - b.velocity);
            }

            if (Array.from(loadedBuffers.values()).every(arr => arr.length === 0)) {
                 console.error(`[VelocitySampler] No samples were loaded for instrument "${instrumentName}".`);
                 return false;
            }
            
            this.instruments.set(instrumentName, { buffers: loadedBuffers });
            
            console.log(`[VelocitySampler] Instrument "${instrumentName}" loaded.`);
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error(`[VelocitySampler] Failed to load instrument "${instrumentName}":`, error);
            return false;
        }
    }
    
    public schedule(notes: Note[], time: number) {
        const instrument = this.instruments.get('violin');
        if (!this.isInitialized || !instrument) {
            console.warn('[VelocitySampler] Tried to schedule before "violin" instrument was initialized.');
            return;
        }

        notes.forEach(note => {
            const { buffer, midi: sampleMidi } = this.findBestSample(instrument, note.midi, note.velocity);
            if (!buffer) return;

            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            
            const gainNode = this.audioContext.createGain();
            // Apply note velocity to the overall volume
            gainNode.gain.setValueAtTime(note.velocity ?? 0.7, this.audioContext.currentTime);

            source.connect(gainNode);
            gainNode.connect(this.outputNode);

            // Adjust playback rate for pitch shifting
            const playbackRate = Math.pow(2, (note.midi - sampleMidi) / 12);
            source.playbackRate.value = playbackRate;

            const startTime = time + note.time;
            source.start(startTime);
        });
    }

    private findBestSample(instrument: SamplerInstrument, targetMidi: number, targetVelocity: number = 0.7): { buffer: AudioBuffer | null, midi: number } {
        const availableMidiNotes = Array.from(instrument.buffers.keys());
        
        // 1. Find the closest MIDI note available in the samples
        if (availableMidiNotes.length === 0) return { buffer: null, midi: targetMidi };
        const closestMidi = availableMidiNotes.reduce((prev, curr) => 
            Math.abs(curr - targetMidi) < Math.abs(prev - targetMidi) ? curr : prev
        );

        const velocityLayers = instrument.buffers.get(closestMidi);
        if (!velocityLayers || velocityLayers.length === 0) {
            return { buffer: null, midi: closestMidi };
        }
        
        // 2. Find the best velocity match for that note
        // Find the first sample with velocity greater than or equal to the target
        let bestSample = velocityLayers.find(sample => sample.velocity >= targetVelocity);
        
        // If no sample is loud enough, take the loudest one available
        if (!bestSample) {
            bestSample = velocityLayers[velocityLayers.length - 1];
        }

        return { buffer: bestSample.buffer, midi: closestMidi };
    }

    private noteToMidi(note: string): number | null {
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
        // One-shot samples, no central stop needed.
    }

    public dispose() {
        this.outputNode.disconnect();
    }
}
