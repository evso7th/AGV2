
import type { FractalEvent } from '@/types/fractal';
import type { Note } from "@/types/music";
import { SamplerPlayer } from '@/lib/sampler-player';
import { GuitarChordsSampler } from '@/lib/guitar-chords-sampler';
import { ViolinSamplerPlayer } from '@/lib/violin-sampler-player';
import { FluteSamplerPlayer } from '@/lib/flute-sampler-player';
import { PIANO_SAMPLES, VIOLIN_SAMPLES, FLUTE_SAMPLES } from "@/lib/samples";

type HarmonyInstrument = 'piano' | 'guitarChords' | 'violin' | 'flute' | 'none';

/**
 * Manages the "harmony" layer, for instruments like piano, guitar, violin, and flute.
 * It's a specialized multi-sampler player.
 */
export class HarmonySynthManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private activeInstrumentName: HarmonyInstrument = 'piano';
    public isInitialized = false;

    // Sampler Instruments
    private piano: SamplerPlayer;
    private guitarChords: GuitarChordsSampler;
    private violin: ViolinSamplerPlayer;
    private flute: FluteSamplerPlayer;


    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.piano = new SamplerPlayer(audioContext, this.destination);
        this.guitarChords = new GuitarChordsSampler(audioContext, this.destination);
        this.violin = new ViolinSamplerPlayer(audioContext, this.destination);
        this.flute = new FluteSamplerPlayer(audioContext, this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[HarmonyManager] Initializing harmony instruments...');

        await Promise.all([
            this.piano.loadInstrument('piano', PIANO_SAMPLES),
            this.guitarChords.init(),
            this.violin.loadInstrument('violin', VIOLIN_SAMPLES),
            this.flute.loadInstrument('flute', FLUTE_SAMPLES),
        ]);
        
        this.setInstrument(this.activeInstrumentName); // Set initial volume

        this.isInitialized = true;
        console.log('[HarmonyManager] Harmony instruments initialized.');
    }
    
    public schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: HarmonyInstrument) {
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

        console.log(`[HarmonyManager] Scheduling ${notes.length} notes for instrument: ${instrumentToPlay}`);

        switch (instrumentToPlay) {
            case 'piano':
                this.piano.schedule('piano', notes, barStartTime);
                break;
            case 'guitarChords':
                this.guitarChords.schedule(notes, barStartTime);
                break;
            case 'violin':
                this.violin.schedule(notes, barStartTime);
                break;
            case 'flute':
                this.flute.schedule(notes, barStartTime);
                break;
        }
    }

    public setInstrument(instrumentName: HarmonyInstrument) {
        if (!this.isInitialized) {
            console.warn('[HarmonyManager] setInstrument called before initialization.');
            return;
        }
        console.log(`[HarmonyManager] Setting active instrument to: ${instrumentName}`);
        this.activeInstrumentName = instrumentName;

        // Manage volumes of child samplers
        this.piano.setVolume(instrumentName === 'piano' ? 1.0 : 0);
        this.guitarChords.setVolume(instrumentName === 'guitarChords' ? 1.0 : 0);
        this.violin.setVolume(instrumentName === 'violin' ? 1.0 : 0);
        this.flute.setVolume(instrumentName === 'flute' ? 1.0 : 0);
    }

    public allNotesOff() {
        this.piano.stopAll();
        this.guitarChords.stopAll();
        this.violin.stopAll();
        this.flute.stopAll();
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
        this.piano.dispose();
        this.guitarChords.dispose();
        this.violin.dispose();
        this.flute.dispose();
    }
}
