
import type { FractalEvent, AccompanimentInstrument } from '@/types/fractal';
import type { Note } from "@/types/music";
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS } from './presets-v2';

/**
 * A V2 manager for the melody synthesizer.
 * This version uses the advanced `instrument-factory` to create a single,
 * powerful, polyphonic instrument instance. It does not manage a pool of simple voices.
 */
export class MelodySynthManagerV2 {
    private audioContext: AudioContext;
    private destination: AudioNode;
    public isInitialized = false;
    private instrument: any | null = null; // Will hold the instance from the factory
    private activePresetName: keyof typeof V2_PRESETS = 'synth';
    private activeNotes = new Map<number, () => void>(); // Maps MIDI note to a noteOff function

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;
    }

    async init() {
        if (this.isInitialized) return;
        console.log('[MelodyManagerV2] Initializing...');
        await this.loadInstrument(this.activePresetName);
        this.isInitialized = true;
        console.log('[MelodyManagerV2] Initialized.');
    }
    
    private async loadInstrument(presetName: keyof typeof V2_PRESETS) {
        this.allNotesOff(); // Stop any previous sound
        const preset = V2_PRESETS[presetName];
        if (!preset) {
            console.error(`[MelodyManagerV2] Preset not found: ${presetName}`);
            return;
        }

        try {
            this.instrument = await buildMultiInstrument(this.audioContext, {
                type: preset.type as any,
                preset: preset,
                output: this.destination
            });
            this.activePresetName = presetName;
            console.log(`[MelodyManagerV2] Instrument loaded with preset: ${presetName}`);
        } catch (error) {
            console.error(`[MelodyManagerV2] Error loading instrument for preset ${presetName}:`, error);
        }
    }


    public schedule(events: FractalEvent[], barStartTime: number, tempo: number) {
        if (!this.instrument) return;

        const beatDuration = 60 / tempo;
        
        events.forEach(event => {
            if(event.type !== 'melody') return;
            
            const noteOnTime = barStartTime + (event.time * beatDuration);
            const noteOffTime = noteOnTime + (event.duration * beatDuration);
            
            // Check if note is already playing, if so, trigger noteOff first
            if (this.activeNotes.has(event.note)) {
                this.activeNotes.get(event.note)?.();
            }

            this.instrument.noteOn(event.note, noteOnTime);
            
            const noteOff = () => {
                this.instrument.noteOff(noteOffTime);
                this.activeNotes.delete(event.note);
            };

            this.activeNotes.set(event.note, noteOff);
            
            // Schedule the note off
            const timeoutId = setTimeout(noteOff, (noteOffTime - this.audioContext.currentTime) * 1000);
        });
    }
    
    public setInstrument(instrumentName: keyof typeof V2_PRESETS) {
       if (this.activePresetName !== instrumentName) {
           this.loadInstrument(instrumentName);
       }
    }

    public allNotesOff() {
        if (this.instrument) {
            this.activeNotes.forEach((noteOff) => noteOff());
            this.activeNotes.clear();
        }
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
    }
}
