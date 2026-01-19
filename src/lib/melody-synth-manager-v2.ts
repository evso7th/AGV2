

import type { FractalEvent, AccompanimentInstrument } from '@/types/fractal';
import type { Note } from "@/types/music";
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP, BASS_PRESET_MAP } from './presets-v2';
import { BASS_PRESETS } from './bass-presets';
import type { TelecasterGuitarSampler } from './telecaster-guitar-sampler';
import type { BlackGuitarSampler } from './black-guitar-sampler';

/**
 * A V2 manager for melody and bass parts.
 * This version acts as a "smart performer", routing events to either its
 * internal synthesizer (for synth sounds) or to specialized guitar samplers.
 * It's made universal by accepting a 'partName' to know which events to process.
 */
export class MelodySynthManagerV2 {
    private audioContext: AudioContext;
    private destination: AudioNode;
    public isInitialized = false;
    private partName: 'melody' | 'bass';
    
    // Internal Instruments
    private synth: any | null = null; 
    private telecasterSampler: TelecasterGuitarSampler;
    private blackAcousticSampler: BlackGuitarSampler;

    private activePresetName: keyof typeof V2_PRESETS | keyof typeof BASS_PRESETS = 'synth';

    constructor(
        audioContext: AudioContext, 
        destination: AudioNode,
        telecasterSampler: TelecasterGuitarSampler,
        blackAcousticSampler: BlackGuitarSampler,
        partName: 'melody' | 'bass'
    ) {
        this.audioContext = audioContext;
        this.destination = destination;
        this.telecasterSampler = telecasterSampler;
        this.blackAcousticSampler = blackAcousticSampler;
        this.partName = partName;
        console.log(`[MelodySynthManagerV2] Constructor for ${this.partName}: Destination and samplers are set.`);
    }

    async init() {
        if (this.isInitialized) return;
        console.log(`[MelodySynthManagerV2] Initializing for ${this.partName}...`);
        
        const instrumentTypeForFactory = this.partName === 'bass' ? 'bass' : 'synth';
        const initialPreset = this.partName === 'bass' ? 'bass_jazz_warm' : 'synth';

        await this.loadInstrument(initialPreset, instrumentTypeForFactory);
        this.isInitialized = true;
        console.log(`[MelodySynthManagerV2] Initialized for ${this.partName} with a persistent synth and samplers.`);
    }
    
    private async loadInstrument(presetName: keyof typeof V2_PRESETS | keyof typeof BASS_PRESETS, instrumentType: 'bass' | 'synth' | 'organ' | 'guitar' = 'synth') {
        this.allNotesOff();
        
        const preset = instrumentType === 'bass'
            ? BASS_PRESETS[presetName as keyof typeof BASS_PRESETS]
            : V2_PRESETS[presetName as keyof typeof V2_PRESETS];

        if (!preset) {
            console.error(`[MelodySynthManagerV2] for ${this.partName}: Preset not found: ${presetName}`);
            return;
        }
        
        console.log(`[MelodySynthManagerV2] Loading instrument for ${this.partName} of type ${instrumentType} with preset: ${presetName}`);

        try {
            this.synth = await buildMultiInstrument(this.audioContext, {
                type: instrumentType,
                preset: preset,
                output: this.destination
            });
            this.activePresetName = presetName;
            console.log(`[MelodySynthManagerV2] Instrument loaded for ${this.partName} with preset: ${presetName}`);
        } catch (error) {
            console.error(`[MelodySynthManagerV2] Error loading synth for ${this.partName} with preset ${presetName}:`, error);
        }
    }

    public async schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: string) {
        
        const logPrefix = this.partName === 'melody' ? `%cMelodyInstrumentLog:` : `%cBassInstrumentLog:`;
        const logCss = this.partName === 'melody' ? 'color: #DA70D6' : 'color: #4169E1';
        console.log(`${logPrefix} [2. Manager] Received hint: ${instrumentHint}`, logCss);

        // --- SMART ROUTER (только для мелодии) ---
        if (this.partName === 'melody') {
            if (instrumentHint === 'telecaster') {
                console.log(`${logPrefix} [3. Router] Routing to TelecasterSampler`, logCss);
                const notesToPlay = events.filter(e => e.type === this.partName).map(e => ({ midi: e.note, time: e.time * (60/tempo), duration: e.duration * (60/tempo), velocity: e.weight }));
                this.telecasterSampler.schedule(notesToPlay, barStartTime, tempo);
                return;
            }
            if (instrumentHint === 'blackAcoustic') {
                console.log(`${logPrefix} [3. Router] Routing to BlackGuitarSampler`, logCss);
                 const notesToPlay = events.filter(e => e.type === this.partName).map(e => ({ midi: e.note, time: e.time * (60/tempo), duration: e.duration * (60/tempo), velocity: e.weight }));
                this.blackAcousticSampler.schedule(notesToPlay, barStartTime, tempo);
                return;
            }
        }
        
        // --- SYNTH LOGIC (если не было маршрутизации на сэмплер) ---
        console.log(`${logPrefix} [3. Router] Routing to internal V2 Synth`, logCss);
        
        // #ИСПРАВЛЕНО (ПЛАН 1485): Маршрутизация пресетов теперь учитывает тип партии (бас или мелодия).
        let finalInstrumentHint = instrumentHint;
        if (instrumentHint) {
            if (this.partName === 'bass') {
                const mappedName = BASS_PRESET_MAP[instrumentHint];
                if (mappedName) {
                    finalInstrumentHint = mappedName;
                    console.log(`${logPrefix} [3.1 Router] Mapped V1 bass hint "${instrumentHint}" to V2 preset "${finalInstrumentHint}"`, logCss);
                }
            } else { // Мелодия
                const mappedName = V1_TO_V2_PRESET_MAP[instrumentHint];
                if (mappedName) {
                    finalInstrumentHint = mappedName;
                }
            }
        }

        if (finalInstrumentHint && finalInstrumentHint !== this.activePresetName) {
            await this.setInstrument(finalInstrumentHint as any);
        }
        
        if (!this.synth) {
            console.warn(`[MelodySynthManagerV2] Schedule called for ${this.partName} but instrument is not loaded.`);
            return;
        }

        const beatDuration = 60 / tempo;
        
        events.forEach(event => {
            if (event.type !== this.partName) return;
            
            const noteOnTime = barStartTime + (event.time * beatDuration);
            if (!isFinite(event.duration) || event.duration <= 0) {
                 console.error(`[MelodySynthManagerV2] Invalid duration for event for part ${this.partName}!`, JSON.parse(JSON.stringify(event)));
                return;
            }
            const noteOffTime = noteOnTime + (event.duration * beatDuration);
            
            this.synth.noteOn(event.note, noteOnTime);
            this.synth.noteOff(event.note, noteOffTime);
        });
    }
    
    public async setInstrument(instrumentName: keyof typeof V2_PRESETS | keyof typeof BASS_PRESETS) {
       if (instrumentName === this.activePresetName) return;

       const isBassPreset = (instrumentName as string) in BASS_PRESETS;
       const newPreset = isBassPreset
           ? BASS_PRESETS[instrumentName as keyof typeof BASS_PRESETS]
           : V2_PRESETS[instrumentName as keyof typeof V2_PRESETS];

       if (newPreset && this.synth?.setPreset) {
           this.synth.setPreset(newPreset);
           this.activePresetName = instrumentName;
           console.log(`[MelodySynthManagerV2] for ${this.partName} - Preset updated to: ${instrumentName}`);
       } else {
           console.error(`[MelodySynthManagerV2] Failed to set preset: ${instrumentName}. Preset or setPreset method not found.`);
       }
    }

    public setVolume(volume: number) {
        if (this.synth && this.synth.setVolume) {
            this.synth.setVolume(volume);
        }
    }

    public allNotesOff() {
        if (this.synth && this.synth.allNotesOff) {
            this.synth.allNotesOff();
        }
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
    }
}
