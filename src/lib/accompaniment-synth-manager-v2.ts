

import type { FractalEvent, AccompanimentInstrument } from '@/types/fractal';
import type { Note } from "@/types/music";
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS } from './presets-v2';

/**
 * A V2 manager for the accompaniment synthesizer.
 * This version uses the advanced `instrument-factory` to create a single,
 * powerful, polyphonic instrument instance. It does not manage a pool of simple voices.
 */
export class AccompanimentSynthManagerV2 {
    private audioContext: AudioContext;
    private destination: AudioNode;
    public isInitialized = false;
    private instrument: any | null = null; // Will hold the instance from the factory
    private activePresetName: keyof typeof V2_PRESETS = 'synth';
    private activeNotes = new Map<number, () => void>(); // Maps MIDI note to a cleanup function

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;
        console.log('[AccompanimentManagerV2] Constructor: Destination node is set.');
    }

    async init() {
        if (this.isInitialized) return;
        console.log('[AccompanimentManagerV2] Initializing...');
        await this.loadInstrument(this.activePresetName);
        this.isInitialized = true;
        console.log('[AccompanimentManagerV2] Initialized.');
    }
    
    private async loadInstrument(presetName: keyof typeof V2_PRESETS) {
        this.allNotesOff(); // Stop any previous sound
        const preset = V2_PRESETS[presetName];
        if (!preset) {
            console.error(`[AccompanimentManagerV2] Preset not found: ${presetName}`);
            return;
        }
        
        console.log(`[AccompanimentManagerV2] Loading instrument with preset: ${presetName}`, preset);

        try {
            this.instrument = await buildMultiInstrument(this.audioContext, {
                type: preset.type as any,
                preset: preset,
                output: this.destination
            });
            this.activePresetName = presetName;
            console.log(`[AccompanimentManagerV2] Instrument loaded with preset: ${presetName}`);
        } catch (error) {
            console.error(`[AccompanimentManagerV2] Error loading instrument for preset ${presetName}:`, error);
        }
    }

    public async schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: keyof typeof V2_PRESETS) {
        if (instrumentHint && instrumentHint !== this.activePresetName) {
            await this.loadInstrument(instrumentHint);
        }

        if (!this.instrument) {
            console.warn('[AccompanimentManagerV2] Schedule called but instrument is not loaded.');
            return;
        }

        const beatDuration = 60 / tempo;
        
        events.forEach(event => {
            if(event.type !== 'accompaniment') return;
            
            const noteOnTime = barStartTime + (event.time * beatDuration);
            const noteOffTime = noteOnTime + (event.duration * beatDuration);
            
            if (this.activeNotes.has(event.note)) {
                this.instrument.noteOff(event.note, this.audioContext.currentTime);
                this.activeNotes.delete(event.note);
            }

            // TELEMETRY POINT
            console.log(`%c[AccompanimentManagerV2] Scheduling Note: MIDI=${event.note}, On=${noteOnTime.toFixed(2)}, Off=${noteOffTime.toFixed(2)}`, 'color: #90EE90;');

            // Schedule noteOn and noteOff with the instrument
            this.instrument.noteOn(event.note, noteOnTime);
            this.instrument.noteOff(event.note, noteOffTime);
            
            // Use setTimeout only to clean up the tracking map after the note has fully released
            const cleanupTime = (noteOffTime - this.audioContext.currentTime + (this.instrument.preset?.adsr?.r || 2) + 0.1) * 1000;
            const timeoutId = setTimeout(() => {
                this.activeNotes.delete(event.note);
            }, cleanupTime);
            
            this.activeNotes.set(event.note, () => clearTimeout(timeoutId));
        });
    }
    
    public setInstrument(instrumentName: keyof typeof V2_PRESETS) {
       if (this.activePresetName !== instrumentName) {
           this.loadInstrument(instrumentName);
       }
    }

    public allNotesOff() {
        if (this.instrument) {
             this.activeNotes.forEach((clearTimeoutFunc, note) => {
                this.instrument.noteOff(note, this.audioContext.currentTime);
                clearTimeoutFunc();
            });
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
