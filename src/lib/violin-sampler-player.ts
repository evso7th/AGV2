
import type { Note } from "@/types/music";

type VelocitySample = {
    velocity: number;
    file: string;
};

type SamplerInstrument = {
    buffers: Map<number, { velocity: number; buffer: AudioBuffer }[]>;
};

/**
 * #ЗАЧЕМ: Сэмплер скрипки с повышенной мощностью (ПЛАН №529).
 */
export class ViolinSamplerPlayer {
    private audioContext: AudioContext;
    private outputNode: GainNode;
    private instruments = new Map<string, SamplerInstrument>();
    public isInitialized = false;
    private preamp: GainNode;
    private activeSources: Set<AudioBufferSourceNode> = new Set();

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.outputNode = this.audioContext.createGain();
        this.preamp = this.audioContext.createGain();
        // #ЗАЧЕМ: Повышение читаемости скрипки в миксе.
        // #ЧТО: Гейн поднят с 2.2 до 3.5.
        this.preamp.gain.value = 3.5; 
        this.preamp.connect(this.outputNode);
        this.outputNode.connect(destination);
    }
    
    public setVolume(volume: number) {
        this.outputNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
    }

    async loadInstrument(instrumentName: string, sampleMap: Record<string, VelocitySample[]>): Promise<boolean> {
        if (this.instruments.has(instrumentName)) {
            return true;
        }

        try {
            const loadedBuffers = new Map<number, { velocity: number; buffer: AudioBuffer }[]>();
            
            const loadPromises = Object.entries(sampleMap).flatMap(([noteStr, samples]) => {
                const midi = this.noteToMidi(noteStr);
                if (midi === null) return [];
                if (!loadedBuffers.has(midi)) loadedBuffers.set(midi, []);
                
                return samples.map(async (sample) => {
                    try {
                        const response = await fetch(sample.file);
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                        loadedBuffers.get(midi)!.push({ velocity: sample.velocity, buffer: audioBuffer });
                    } catch (error) {}
                });
            });

            await Promise.all(loadPromises);
            for (const samples of loadedBuffers.values()) samples.sort((a, b) => a.velocity - b.velocity);
            this.instruments.set(instrumentName, { buffers: loadedBuffers });
            this.isInitialized = true;
            return true;
        } catch (error) {
            return false;
        }
    }
    
    public schedule(notes: Note[], time: number) {
        const instrument = this.instruments.get('violin');
        if (!this.isInitialized || !instrument) return;

        notes.forEach(note => {
            const { buffer, midi: sampleMidi } = this.findBestSample(instrument, note.midi, note.velocity);
            if (!buffer) return;

            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(note.velocity ?? 0.7, this.audioContext.currentTime);

            source.connect(gainNode);
            gainNode.connect(this.preamp);

            const playbackRate = Math.pow(2, (note.midi - sampleMidi) / 12);
            source.playbackRate.value = playbackRate;

            const startTime = time + note.time;
            source.start(startTime);
            this.activeSources.add(source);
            source.onended = () => {
                this.activeSources.delete(source);
                try { gainNode.disconnect(); } catch(e){} 
            };
        });
    }

    private findBestSample(instrument: SamplerInstrument, targetMidi: number, targetVelocity: number = 0.7): { buffer: AudioBuffer | null, midi: number } {
        const availableMidiNotes = Array.from(instrument.buffers.keys());
        if (availableMidiNotes.length === 0) return { buffer: null, midi: targetMidi };
        const closestMidi = availableMidiNotes.reduce((prev, curr) => 
            Math.abs(curr - targetMidi) < Math.abs(prev - targetMidi) ? curr : prev
        );
        const velocityLayers = instrument.buffers.get(closestMidi);
        if (!velocityLayers || velocityLayers.length === 0) return { buffer: null, midi: closestMidi };
        let bestSample = velocityLayers.find(sample => sample.velocity >= targetVelocity) || velocityLayers[velocityLayers.length - 1];
        return { buffer: bestSample.buffer, midi: closestMidi };
    }

    private noteToMidi(note: string): number | null {
        const match = note.match(/([A-G])([#b]?)(-?\d+)/);
        if (!match) return null;
        const noteName = `${match[1].toUpperCase()}${match[2]}`;
        const octave = parseInt(match[3], 10);
        const noteMap: Record<string, number> = { 'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11 };
        return 12 * (octave + 1) + (noteMap[noteName] ?? 0);
    }

    public stopAll() {
        this.activeSources.forEach(source => {
            try {
                source.stop(0);
            } catch(e) {}
        });
        this.activeSources.clear();
    }

    public dispose() { this.stopAll(); this.outputNode.disconnect(); }
}
