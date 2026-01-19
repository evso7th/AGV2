

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
        console.log('[AccompanimentManagerV2] Initialized with a persistent instrument.');
    }
    
    private async loadInstrument(presetName: keyof typeof V2_PRESETS) {
        this.allNotesOff(); // Stop any previous sound
        const preset = V2_PRESETS[presetName];
        if (!preset) {
            console.error(`[AccompanimentManagerV2] Preset not found: ${presetName}`);
            return;
        }
        
        console.log(`[AccompanimentManagerV2] Loading instrument with preset: ${presetName}`);

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

    public async schedule(events: FractalEvent[], barStartTime: number, tempo: number, barCount: number, instrumentHint?: string) {
        // #ИСПРАВЛЕНО (ПЛАН 1001): Добавлен "охранник", который прерывает исполнение, если нет явного указания.
        if (!instrumentHint || instrumentHint === 'none') {
            return;
        }

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
            console.warn('[AccompanimentManagerV2] Schedule called but instrument is not loaded.');
            return;
        }

        const beatDuration = 60 / tempo;
        
        events.forEach(event => {
            if(event.type !== 'accompaniment') return;
            
            const noteOnTime = barStartTime + (event.time * beatDuration);
            const noteOffTime = noteOnTime + (event.duration * beatDuration);
            
            console.log(`%c[AccompManagerV2 @ Bar ${barCount}] Instrument: ${this.activePresetName} | Scheduling Note: MIDI=${event.note}, On=${noteOnTime.toFixed(2)}, Off=${noteOffTime.toFixed(2)}`, 'color: #90EE90;');

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
           console.log(`[AccompanimentManagerV2] Preset updated to: ${instrumentName}`);
       } else {
           console.error(`[AccompanimentManagerV2] Failed to set preset: ${instrumentName}. Preset or setPreset method not found.`);
       }
    }

    public setVolume(volume: number) {
        console.log(`%c[AccompV2 GAIN] setVolume called with: ${volume}`, 'color: #90EE90');
        if (this.instrument && this.instrument.setVolume) {
            this.instrument.setVolume(volume);
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
