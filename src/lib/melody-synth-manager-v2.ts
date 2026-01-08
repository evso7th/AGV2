

import type { FractalEvent, AccompanimentInstrument } from '@/types/fractal';
import type { Note } from "@/types/music";
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP } from './presets-v2';
import type { TelecasterGuitarSampler } from './telecaster-guitar-sampler';
import type { BlackGuitarSampler } from './black-guitar-sampler';

/**
 * A V2 manager for the melody synthesizer.
 * This version acts as a "smart performer", routing events to either its
 * internal synthesizer or to specialized guitar samplers.
 */
export class MelodySynthManagerV2 {
    private audioContext: AudioContext;
    private destination: AudioNode;
    public isInitialized = false;
    
    // Internal Instruments
    private synth: any | null = null; 
    private telecasterSampler: TelecasterGuitarSampler;
    private blackAcousticSampler: BlackGuitarSampler;

    private activePresetName: keyof typeof V2_PRESETS = 'synth';
    private activeNotes = new Map<number, () => void>(); // Maps MIDI note to a cleanup function

    constructor(
        audioContext: AudioContext, 
        destination: AudioNode,
        telecasterSampler: TelecasterGuitarSampler,
        blackAcousticSampler: BlackGuitarSampler
    ) {
        this.audioContext = audioContext;
        this.destination = destination;
        this.telecasterSampler = telecasterSampler;
        this.blackAcousticSampler = blackAcousticSampler;
        console.log('[MelodyManagerV2] Constructor: Destination and samplers are set.');
    }

    async init() {
        if (this.isInitialized) return;
        console.log('[MelodyManagerV2] Initializing...');
        await this.loadInstrument(this.activePresetName);
        this.isInitialized = true;
        console.log('[MelodyManagerV2] Initialized with a persistent synth and samplers.');
    }
    
    private async loadInstrument(presetName: keyof typeof V2_PRESETS) {
        this.allNotesOff(); // Stop any previous sound
        const preset = V2_PRESETS[presetName];
        if (!preset) {
            console.error(`[MelodyManagerV2] Preset not found: ${presetName}`);
            return;
        }

        console.log(`[MelodyManagerV2] Loading synth instrument with preset: ${presetName}`);

        try {
            this.synth = await buildMultiInstrument(this.audioContext, {
                type: preset.type as any,
                preset: preset,
                output: this.destination
            });
            this.activePresetName = presetName;
            console.log(`[MelodyManagerV2] Synth instrument loaded with preset: ${presetName}`);
        } catch (error) {
            console.error(`[MelodyManagerV2] Error loading synth for preset ${presetName}:`, error);
        }
    }


    public async schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: string) {
        
        const melodyLogPrefix = `%cMelodyInstrumentLog:`;
        const melodyLogCss = `color: #DA70D6`;
        console.log(`${melodyLogPrefix} [2. Manager] Received hint: ${instrumentHint}`, melodyLogCss);

        // --- SMART ROUTER ---
        if (instrumentHint === 'telecaster') {
            console.log(`${melodyLogPrefix} [3. Router] Routing to TelecasterSampler`, melodyLogCss);
            const notesToPlay = events.map(e => ({ midi: e.note, time: e.time * (60/tempo), duration: e.duration * (60/tempo), velocity: e.weight }));
            this.telecasterSampler.schedule(notesToPlay, barStartTime);
            return;
        }
        if (instrumentHint === 'blackAcoustic') {
            console.log(`${melodyLogPrefix} [3. Router] Routing to BlackGuitarSampler`, melodyLogCss);
             const notesToPlay = events.map(e => ({ midi: e.note, time: e.time * (60/tempo), duration: e.duration * (60/tempo), velocity: e.weight }));
            this.blackAcousticSampler.schedule(notesToPlay, barStartTime);
            return;
        }

        // --- SYNTH LOGIC (if not routed to sampler) ---
        console.log(`${melodyLogPrefix} [3. Router] Routing to internal V2 Synth`, melodyLogCss);
        const finalInstrumentHint = (instrumentHint && V1_TO_V2_PRESET_MAP[instrumentHint])
            ? V1_TO_V2_PRESET_MAP[instrumentHint]
            : instrumentHint;

        if (finalInstrumentHint && finalInstrumentHint !== this.activePresetName) {
            this.setInstrument(finalInstrumentHint as keyof typeof V2_PRESETS);
        }
        
        if (!this.synth) {
            console.warn('[MelodyManagerV2] Schedule called for synth but instrument is not loaded.');
            return;
        }

        const beatDuration = 60 / tempo;
        
        events.forEach(event => {
            if(event.type !== 'melody') return;
            
            const noteOnTime = barStartTime + (event.time * beatDuration);
            if (!isFinite(event.duration) || event.duration <= 0) {
                 console.error(`[SoloLog] MelodySynthManagerV2: Invalid duration for event!`, JSON.parse(JSON.stringify(event)));
                return; // Skip this event
            }
            const noteOffTime = noteOnTime + (event.duration * beatDuration);
            
            this.synth.noteOn(event.note, noteOnTime);
            this.synth.noteOff(event.note, noteOffTime);
        });
    }
    
    public setInstrument(instrumentName: keyof typeof V2_PRESETS) {
       if (!this.synth || instrumentName === this.activePresetName) return;
       
       const newPreset = V2_PRESETS[instrumentName];
       if (newPreset && this.synth.setPreset) {
           this.synth.setPreset(newPreset);
           this.activePresetName = instrumentName;
           console.log(`[MelodyManagerV2] Synth preset updated to: ${instrumentName}`);
       } else {
           console.error(`[MelodyManagerV2] Failed to set synth preset: ${instrumentName}.`);
       }
    }

    public allNotesOff() {
        if (this.synth && this.synth.allNotesOff) {
            this.synth.allNotesOff();
        }
        this.telecasterSampler?.stopAll();
        this.blackAcousticSampler?.stopAll();
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
    }
}
