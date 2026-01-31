

import type { FractalEvent, AccompanimentInstrument } from '@/types/fractal';
import type { Note } from "@/types/music";
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP } from './presets-v2';

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
    private activePresetName: keyof typeof V2_PRESETS | 'none' = 'synth';
    private preamp: GainNode;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;
        
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.0;
        this.preamp.connect(this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        console.log('[AccompanimentManagerV2] Initializing...');
        await this.loadInstrument(this.activePresetName as keyof typeof V2_PRESETS);
        this.isInitialized = true;
    }
    
    private async loadInstrument(presetName: keyof typeof V2_PRESETS) {
        this.allNotesOff(); // Stop any previous sound
        const preset = V2_PRESETS[presetName];
        if (!preset) {
            console.error(`[AccompanimentManagerV2] Preset not found: ${presetName}`);
            return;
        }
        
        try {
            this.instrument = await buildMultiInstrument(this.audioContext, {
                type: preset.type as any,
                preset: preset,
                output: this.preamp // Connect to the manager's preamp
            });
            this.activePresetName = presetName;
        } catch (error) {
            console.error(`[AccompanimentManagerV2] Error loading instrument for preset ${presetName}:`, error);
        }
    }

    public async schedule(events: FractalEvent[], barStartTime: number, tempo: number, barCount: number, instrumentHint?: string) {
        const finalInstrumentHint = instrumentHint ? (V1_TO_V2_PRESET_MAP[instrumentHint] || instrumentHint) : this.activePresetName;

        if (finalInstrumentHint === 'none') {
            if (this.activePresetName !== 'none') await this.setInstrument('none');
            return;
        }
        
        if (finalInstrumentHint !== this.activePresetName) {
            await this.setInstrument(finalInstrumentHint as keyof typeof V2_PRESETS);
        }

        if (!this.instrument) return;

        const beatDuration = 60 / tempo;
        
        events.forEach(event => {
            if(event.type !== 'accompaniment') return;
            const noteOnTime = barStartTime + (event.time * beatDuration);
            const noteOffTime = noteOnTime + (event.duration * beatDuration);
            this.instrument.noteOn(event.note, noteOnTime);
            this.instrument.noteOff(event.note, noteOffTime);
        });
    }
    
    public async setInstrument(instrumentName: keyof typeof V2_PRESETS | 'none') {
       if (instrumentName === this.activePresetName) return;

       if (instrumentName === 'none') {
            this.allNotesOff();
            this.instrument = null; // Release the instrument
            this.activePresetName = 'none';
            console.log(`[AccompanimentManagerV2] Instrument set to 'none'. Output silenced.`);
            return;
       }

       if (this.instrument && this.instrument.setPreset) {
           const newPreset = V2_PRESETS[instrumentName as keyof typeof V2_PRESETS];
           if (newPreset) {
               this.instrument.setPreset(newPreset);
               this.activePresetName = instrumentName;
               console.log(`[AccompanimentManagerV2] Preset updated to: ${instrumentName}`);
           } else {
                console.error(`[AccompanimentManagerV2] Failed to set preset: ${instrumentName}. Preset not found.`);
           }
       } else { 
           await this.loadInstrument(instrumentName);
       }
    }

    public setPreampGain(volume: number) {
        if (this.preamp) {
            this.preamp.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
        }
    }

    public allNotesOff() {
        if (this.instrument && this.instrument.allNotesOff) {
            this.instrument.allNotesOff();
        }
    }

    public stop() { this.allNotesOff(); }
    public dispose() { this.stop(); this.preamp.disconnect(); }
}
