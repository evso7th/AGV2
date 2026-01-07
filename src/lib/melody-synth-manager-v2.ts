

import type { FractalEvent, AccompanimentInstrument } from '@/types/fractal';
import type { Note } from "@/types/music";
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP } from './presets-v2';

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
    private activeNotes = new Map<number, () => void>(); // Maps MIDI note to a cleanup function

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;
        console.log('[MelodyManagerV2] Constructor: Destination node is set.');
    }

    async init() {
        if (this.isInitialized) return;
        console.log('[MelodyManagerV2] Initializing...');
        await this.loadInstrument(this.activePresetName);
        this.isInitialized = true;
        console.log('[MelodyManagerV2] Initialized with a persistent instrument.');
    }
    
    private async loadInstrument(presetName: keyof typeof V2_PRESETS) {
        this.allNotesOff(); // Stop any previous sound
        const preset = V2_PRESETS[presetName];
        if (!preset) {
            console.error(`[MelodyManagerV2] Preset not found: ${presetName}`);
            return;
        }

        console.log(`[MelodyManagerV2] Loading instrument with preset: ${presetName}`);

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


    public async schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: string) {
        // #ЗАЧЕМ: Этот блок транслирует старые названия V1 в новые V2.
        // #ЧТО: Он проверяет, есть ли `instrumentHint` в карте `V1_TO_V2_PRESET_MAP`.
        //      Если есть, используется V2-название. Если нет, используется оригинальный hint.
        // #СВЯЗИ: Устраняет ошибку "Preset not found".
        const finalInstrumentHint = (instrumentHint && V1_TO_V2_PRESET_MAP[instrumentHint])
            ? V1_TO_V2_PRESET_MAP[instrumentHint]
            : instrumentHint;

        if (finalInstrumentHint && finalInstrumentHint !== this.activePresetName) {
            this.setInstrument(finalInstrumentHint as keyof typeof V2_PRESETS);
        }
        
        if (!this.instrument) {
            console.warn('[MelodyManagerV2] Schedule called but instrument is not loaded.');
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
            
            this.instrument.noteOn(event.note, noteOnTime);
            this.instrument.noteOff(event.note, noteOffTime);
        });
    }
    
    public setInstrument(instrumentName: keyof typeof V2_PRESETS) {
       if (!this.instrument || instrumentName === this.activePresetName) return;
       
       const newPreset = V2_PRESETS[instrumentName];
       if (newPreset && this.instrument.setPreset) {
           this.instrument.setPreset(newPreset);
           this.activePresetName = instrumentName;
           console.log(`[MelodyManagerV2] Preset updated to: ${instrumentName}`);
       } else {
           console.error(`[MelodyManagerV2] Failed to set preset: ${instrumentName}. Preset or setPreset method not found.`);
       }
    }

    public allNotesOff() {
        if (this.instrument && this.instrument.allNotesOff) {
            this.instrument.allNotesOff();
        }
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
    }
}

    
