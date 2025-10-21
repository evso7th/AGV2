
import type { FractalEvent } from '@/types/fractal';
import type { Note } from "@/types/music";
import { SamplerPlayer } from './sampler-player';
import { GuitarChordsSampler } from './guitar-chords-sampler';
import { PIANO_SAMPLES } from "./samples";

/**
 * Manages the "harmony" layer, specifically for rhythmic/harmonic instruments
 * like piano and guitar chords. It's a specialized sampler player.
 */
export class HarmonySynthManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private activeInstrumentName: 'piano' | 'guitarChords' | 'none' = 'none';
    public isInitialized = false;

    // Sampler Instruments
    private piano: SamplerPlayer;
    private guitarChords: GuitarChordsSampler;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.piano = new SamplerPlayer(audioContext, this.destination);
        this.guitarChords = new GuitarChordsSampler(audioContext, this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[HarmonyManager] Initializing harmony instruments...');

        await Promise.all([
            this.piano.loadInstrument('piano', PIANO_SAMPLES),
            this.guitarChords.init(),
        ]);

        this.isInitialized = true;
        console.log('[HarmonyManager] Harmony instruments initialized.');
    }
    
    public schedule(events: FractalEvent[], barStartTime: number, tempo: number) {
        if (!this.isInitialized || this.activeInstrumentName === 'none') {
            return;
        }

        const beatDuration = 60 / tempo;
        const notes: Note[] = events.map(event => ({
            midi: event.note,
            time: event.time * beatDuration,
            duration: event.duration * beatDuration,
            velocity: event.weight,
        }));

        console.log(`[HarmonyManager] Scheduling ${notes.length} notes for instrument: ${this.activeInstrumentName}`);

        switch (this.activeInstrumentName) {
            case 'piano':
                this.piano.schedule('piano', notes, barStartTime);
                break;
            case 'guitarChords':
                this.guitarChords.schedule(notes, barStartTime);
                break;
        }
    }

    public setInstrument(instrumentName: 'piano' | 'guitarChords' | 'none') {
        if (!this.isInitialized) {
            console.warn('[HarmonyManager] setInstrument called before initialization.');
            return;
        }
        console.log(`[HarmonyManager] Setting active instrument to: ${instrumentName}`);
        this.activeInstrumentName = instrumentName;
        
        // No volume adjustment needed here as the composer will decide when to play it
    }

    public allNotesOff() {
        this.piano.stopAll();
        this.guitarChords.stopAll();
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
        this.piano.dispose();
        this.guitarChords.dispose();
    }
}
