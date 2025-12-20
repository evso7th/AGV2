

import type { FractalEvent } from '@/types/fractal';
import type { Note } from "@/types/music";
import { SamplerPlayer } from '@/lib/sampler-player';
import { GuitarChordsSampler } from '@/lib/guitar-chords-sampler';
import { PIANO_SAMPLES } from "@/lib/samples";

/**
 * Manages the "harmony" layer, specifically for rhythmic/harmonic instruments
 * like piano and guitar chords. It's a specialized sampler player.
 */
export class HarmonySynthManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private activeInstrumentName: 'piano' | 'guitarChords' | 'none' = 'piano';
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
        
        this.setInstrument(this.activeInstrumentName); // Set initial volume

        this.isInitialized = true;
        console.log('[HarmonyManager] Harmony instruments initialized.');
    }
    
    public schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: 'piano' | 'guitarChords') {
        if (!this.isInitialized) {
            return;
        }

        const instrumentToPlay = instrumentHint || this.activeInstrumentName;

        if (instrumentToPlay === 'none') {
            return;
        }

        const beatDuration = 60 / tempo;
        const notes: Note[] = events.map(event => ({
            midi: event.note,
            time: event.time * beatDuration,
            duration: event.duration * beatDuration,
            velocity: event.weight,
        }));
        
        if (notes.length === 0) {
            return;
        }

        console.log(`[harmony] HarmonySynthManager received ${notes.length} notes to schedule.`);

        switch (instrumentToPlay) {
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

        // Manage volumes of child samplers
        this.piano.setVolume(instrumentName === 'piano' ? 1.0 : 0);
        this.guitarChords.setVolume(instrumentName === 'guitarChords' ? 1.0 : 0);
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
