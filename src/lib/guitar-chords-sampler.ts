
import type { Note as NoteEvent } from "@/types/music";
import { ACOUSTIC_GUITAR_CHORD_SAMPLES } from "./samples";
import * as Tone from 'tone';

const CHORD_SAMPLE_MAP = ACOUSTIC_GUITAR_CHORD_SAMPLES;

// MIDI root notes for the chords we have samples for.
// This allows us to map incoming notes to the correct sample.
const CHORD_ROOT_MIDI_MAP: Record<string, number> = {
    'Dm': 2, // D
    'Em': 4, // E
    'Fm': 5, // F
    'G': 7,  // G
    'A': 9,  // A
    'Am': 9, // A
    'Bm': 11, // B
    'C': 0,   // C
    'D': 2,   // D
};

/**
 * A sampler player for acoustic guitar chords. It maps MIDI notes to chord samples.
 * It pre-loads audio samples and schedules them for playback with precise timing.
 */
export class GuitarChordsSampler {
    private audioContext: AudioContext;
    private samples: Map<string, AudioBuffer> = new Map(); // Maps chord name to buffer
    public output: GainNode;
    public isInitialized: boolean = false;
    private isLoading: boolean = false;
    private preamp: GainNode;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.output = this.audioContext.createGain();
        
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.5; // Slightly boost guitar volume
        this.preamp.connect(this.output);
        
        this.output.connect(destination);
    }

    public async init() {
        if (this.isInitialized || this.isLoading) return;
        this.isLoading = true;
        console.log(`[GuitarChordsSampler] Initializing... Loading ${Object.keys(CHORD_SAMPLE_MAP).length} samples.`);

        const samplePromises: Promise<void>[] = [];
        for (const chordName in CHORD_SAMPLE_MAP) {
            const url = CHORD_SAMPLE_MAP[chordName as keyof typeof CHORD_SAMPLE_MAP];
            samplePromises.push(this.loadSample(chordName, url));
        }

        await Promise.all(samplePromises);
        this.isInitialized = true;
        this.isLoading = false;
        console.log(`[GuitarChordsSampler] ${this.samples.size} samples loaded. Ready.`);
    }

    private async loadSample(chordName: string, url: string) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.samples.set(chordName, audioBuffer);
        } catch (e) {
            console.error(`Failed to load sample: ${chordName} from ${url}`, e);
        }
    }
    
    public schedule(notes: NoteEvent[], startTime: number) {
        if (!this.isInitialized || notes.length === 0) return;

        const note = notes[0]; // Process only the first note to trigger a chord sample
        const chordName = this.midiToChordName(note.midi);

        if (!chordName) {
            // console.warn(`[GuitarChordsSampler] Could not map MIDI ${note.midi} to a chord.`);
            return;
        }

        const buffer = this.samples.get(chordName);
        if (buffer) {
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            
            const noteGain = this.audioContext.createGain();
            noteGain.gain.value = note.velocity ?? 0.7;
            
            source.connect(noteGain);
            noteGain.connect(this.preamp);
            
            source.start(startTime + note.time);
        } else {
            console.warn(`[GuitarChordsSampler] Sample for chord "${chordName}" not found.`);
        }
    }
    
    // Maps a MIDI note to the most likely chord name from our sample map
    private midiToChordName(midi: number): string | null {
        const noteDegree = midi % 12;
        let bestMatch: string | null = null;
        let minDistance = Infinity;

        for (const chordName in CHORD_ROOT_MIDI_MAP) {
            const chordRootDegree = CHORD_ROOT_MIDI_MAP[chordName];
            const distance = Math.abs(noteDegree - chordRootDegree);
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = chordName;
            }
        }
        
        // Only return a match if it's exact (distance is 0)
        return minDistance === 0 ? bestMatch : null;
    }


    public setVolume(volume: number) {
        this.output.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
    }

    public stopAll() {
        // One-shot samples, no central stop needed.
    }

    public dispose() {
        this.preamp.disconnect();
        this.output.disconnect();
    }
}
