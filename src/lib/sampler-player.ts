import type { Note } from "@/types/music";

type SamplerInstrument = {
    buffers: Map<number, AudioBuffer>; // Map from MIDI note to AudioBuffer
    noteRange: [number, number];
};

/**
 * #ЗАЧЕМ: Универсальный сэмплер с поддержкой естественных хвостов.
 * #ЧТО: 1. Повышена базовая мощность преампа (ПЛАН №529).
 *       2. Реализована полная остановка всех запланированных источников (stopAll).
 */
export class SamplerPlayer {
    private audioContext: AudioContext;
    private outputNode: GainNode;
    private instruments = new Map<string, SamplerInstrument>();
    public isInitialized = false;
    private isLoading = false;
    private preamp: GainNode; 
    private activeSources: Set<AudioBufferSourceNode> = new Set();

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.outputNode = this.audioContext.createGain();
        
        this.preamp = this.audioContext.createGain();
        // #ЗАЧЕМ: Повышение читаемости пианино.
        // #ЧТО: Гейн поднят с 1.2 до 2.5.
        this.preamp.gain.value = 2.5; 
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
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error(`[SamplerPlayer] Failed to load instrument "${instrumentName}":`, error);
            return false;
        }
    }
    
    public schedule(instrumentName: string, notes: Note[], time: number, loggerPrefix?: string) {
        if (!this.isInitialized) {
            return;
        }
        
        const instrument = this.instruments.get(instrumentName);
        if (!instrument) {
            return;
        }

        notes.forEach(note => {
            const { buffer, midi: sampleMidi } = this.findClosestSample(instrument, note.midi);
            if (!buffer) {
                return;
            }

            const startTime = time + note.time;
            const velocity = note.velocity ?? 0.7;

            if (!isFinite(velocity) || !isFinite(startTime)) return;

            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            
            const gainNode = this.audioContext.createGain();
            source.connect(gainNode);
            gainNode.connect(this.preamp);

            const playbackRate = Math.pow(2, (note.midi - sampleMidi) / 12);
            source.playbackRate.value = isFinite(playbackRate) ? playbackRate : 1.0;

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(velocity, startTime + 0.005);
            gainNode.gain.setTargetAtTime(0, startTime + 10.0, 0.8);
            
            source.start(startTime);
            this.activeSources.add(source);

            source.onended = () => {
                this.activeSources.delete(source);
                try { gainNode.disconnect(); } catch(e) {}
            };
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
        const match = note.match(/([A-G])([#b]?)(-?\d+)/);
        if (!match) return null;
        const noteName = `${match[1].toUpperCase()}${match[2]}`;
        const octave = parseInt(match[3], 10);
        const noteMap: Record<string, number> = { 'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11 };
        return 12 * (octave + 1) + (noteMap[noteName] ?? 0);
    }

    public stopAll() {
        this.activeSources.forEach(source => {
            try { source.stop(0); } catch(e) {}
        });
        this.activeSources.clear();
    }

    public dispose() {
        this.stopAll();
        this.preamp.disconnect();
        this.outputNode.disconnect();
    }
}
