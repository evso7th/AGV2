
import type { Note, Technique } from "@/types/music";
import { ACOUSTIC_GUITAR_SOLO_SAMPLES, ACOUSTIC_GUITAR_SLIDE_SAMPLES, type GuitarTechniqueSamples } from "./samples";

type SamplerInstrument = {
    buffers: Map<number, {
        pluck?: AudioBuffer;
        pick?: AudioBuffer;
        harm?: AudioBuffer;
    }>;
};

export class AcousticGuitarSoloSampler {
    private audioContext: AudioContext;
    private outputNode: GainNode;
    private instruments = new Map<string, SamplerInstrument>();
    public isInitialized = false;
    private preamp: GainNode;
    private isLoading = false;
    private lastNoteTime = 0;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.outputNode = this.audioContext.createGain();
        
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.8; 
        this.preamp.connect(this.outputNode);

        this.outputNode.connect(destination);
    }
    
    public setVolume(volume: number) {
        this.outputNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
    }

    async init(): Promise<boolean> {
        return this.loadInstrument('acousticGuitarSolo', ACOUSTIC_GUITAR_SOLO_SAMPLES, ACOUSTIC_GUITAR_SLIDE_SAMPLES);
    }

    async loadInstrument(instrumentName: 'acousticGuitarSolo', sampleMap: Record<string, GuitarTechniqueSamples>, slideSamples: string[]): Promise<boolean> {
        if (this.isInitialized || this.isLoading) return true;
        this.isLoading = true;

        if (this.instruments.has(instrumentName)) {
            this.isLoading = false;
            return true;
        }

        try {
            const loadedBuffers = new Map<number, any>();
            
            const loadSample = async (url: string) => {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                return await this.audioContext.decodeAudioData(arrayBuffer);
            };
            
            const notePromises = Object.entries(sampleMap).map(async ([noteStr, techniques]) => {
                const midi = this.noteToMidi(noteStr);
                if (midi === null) return;
                
                loadedBuffers.set(midi, {});
                
                const techPromises = Object.entries(techniques).map(async ([tech, url]) => {
                    if(url) {
                        try {
                            const buffer = await loadSample(url);
                            loadedBuffers.get(midi)![tech as keyof GuitarTechniqueSamples] = buffer;
                        } catch(e) { console.error(`Error loading ${tech} for ${noteStr}`, e); }
                    }
                });
                await Promise.all(techPromises);
            });

            const slidePromises = slideSamples.map(async (url) => {
                try {
                    const buffer = await loadSample(url);
                    this.slideBuffers.push(buffer);
                } catch(e) { console.error(`Error loading slide sample ${url}`, e); }
            });

            await Promise.all([...notePromises, ...slidePromises]);
            
            this.instruments.set(instrumentName, { buffers: loadedBuffers });
            console.log(`[AcousticGuitarSoloSampler] Instrument "${instrumentName}" loaded.`);
            this.isInitialized = true;
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error(`[AcousticGuitarSoloSampler] Failed to load instrument "${instrumentName}":`, error);
            this.isLoading = false;
            return false;
        }
    }
    
    public schedule(notes: Note[], time: number) {
        const instrument = this.instruments.get('acousticGuitarSolo');
        if (!this.isInitialized || !instrument) return;

        notes.forEach((note, index) => {
            const tech: Technique = (note as any).technique || (Math.random() > 0.5 ? 'pick' : 'pluck');

            const { buffer, midi: sampleMidi } = this.findBestSample(instrument, note.midi, tech);
            if (!buffer) return;

            const startTime = time + note.time;

            if (index > 0 && Math.random() < 0.15 && this.slideBuffers.length > 0) {
                const prevNoteEndTime = time + notes[index - 1].time + notes[index - 1].duration;
                if (startTime > prevNoteEndTime) {
                    const slideBuffer = this.slideBuffers[Math.floor(Math.random() * this.slideBuffers.length)];
                    const slideSource = this.audioContext.createBufferSource();
                    slideSource.buffer = slideBuffer;
                    slideSource.connect(this.preamp);
                    slideSource.start(prevNoteEndTime);
                }
            }


            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            
            const gainNode = this.audioContext.createGain();
            
            source.connect(gainNode);
            gainNode.connect(this.preamp);

            const playbackRate = Math.pow(2, (note.midi - sampleMidi) / 12);
            source.playbackRate.value = playbackRate;
            
            // --- ADSR ENVELOPE IMPLEMENTATION ---
            const velocity = note.velocity ?? 0.7;
            const attackTime = 0.01; // Quick attack for pluck/pick
            const releaseTime = Math.max(0.1, note.duration * 0.5); // Release is half the note duration
            const noteEndTime = startTime + note.duration;

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(velocity, startTime + attackTime);
            gainNode.gain.setValueAtTime(velocity, noteEndTime);
            gainNode.gain.linearRampToValueAtTime(0, noteEndTime + releaseTime);
            
            source.start(startTime);
            source.stop(noteEndTime + releaseTime + 0.1); // Stop after release
        });
    }

    private findBestSample(instrument: SamplerInstrument, targetMidi: number, technique: Technique): { buffer: AudioBuffer | null, midi: number } {
        const availableMidiNotes = Array.from(instrument.buffers.keys());
        
        if (availableMidiNotes.length === 0) return { buffer: null, midi: targetMidi };
        const closestMidi = availableMidiNotes.reduce((prev, curr) => 
            Math.abs(curr - targetMidi) < Math.abs(prev - targetMidi) ? curr : prev
        );

        const techSamples = instrument.buffers.get(closestMidi);
        if (!techSamples) return { buffer: null, midi: closestMidi };

        const sampleBuffer = techSamples[technique as keyof GuitarTechniqueSamples];
        
        if (sampleBuffer) {
            return { buffer: sampleBuffer, midi: closestMidi };
        }
        
        // Fallback to pluck or pick if the desired technique is not available
        return { buffer: techSamples.pluck || techSamples.pick || null, midi: closestMidi };
    }

    private noteToMidi(note: string): number | null {
        const match = note.match(/([A-G])([#b]?)(-?\d+)/);
        if (!match) return null;
        
        const noteName = `${match[1].toUpperCase()}${match[2]}`;
        const octave = parseInt(match[3], 10);
        
        const noteMap: Record<string, number> = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11
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
