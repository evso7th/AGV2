import type { FractalEvent, AccompanimentInstrument } from '@/types/fractal';
import type { Note } from "@/types/music";
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP, BASS_PRESET_MAP } from './presets-v2';
import { BASS_PRESETS } from './bass-presets';
import type { BlackGuitarSampler } from './black-guitar-sampler';
import type { TelecasterGuitarSampler } from './telecaster-guitar-sampler';
import type { DarkTelecasterSampler } from './dark-telecaster-sampler';
import type { CS80GuitarSampler } from './cs80-guitar-sampler';

/**
 * A V2 manager for melody and bass parts.
 * Updated to support HYBRID synthesis and deferred preset switching for melody.
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
    private darkTelecasterSampler: DarkTelecasterSampler;
    private cs80Sampler: CS80GuitarSampler;
    private preamp: GainNode;

    private activePresetName: string = 'none';

    constructor(
        audioContext: AudioContext, 
        destination: AudioNode,
        telecasterSampler: TelecasterGuitarSampler,
        blackAcousticSampler: BlackGuitarSampler,
        darkTelecasterSampler: DarkTelecasterSampler,
        cs80Sampler: CS80GuitarSampler,
        partName: 'melody' | 'bass'
    ) {
        this.audioContext = audioContext;
        this.destination = destination;
        this.telecasterSampler = telecasterSampler;
        this.blackAcousticSampler = blackAcousticSampler;
        this.darkTelecasterSampler = darkTelecasterSampler;
        this.cs80Sampler = cs80Sampler;
        this.partName = partName;

        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.0;
        this.preamp.connect(this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        console.log(`[MelodySynthManagerV2] Initializing for ${this.partName}...`);
        
        const initialPresetName = this.partName === 'bass' ? 'bass_jazz_warm' : 'synth';
        await this.setInstrument(initialPresetName);
        this.isInitialized = true;
    }
    
    private async loadInstrument(presetName: string, instrumentType: 'bass' | 'synth' | 'organ' | 'guitar' = 'synth') {
        if (this.synth) {
            this.synth.disconnect();
            this.synth = null;
        }
        
        const preset = instrumentType === 'bass'
            ? BASS_PRESETS[presetName as keyof typeof BASS_PRESETS]
            : V2_PRESETS[presetName as keyof typeof V2_PRESETS];

        if (!preset) return;
        
        try {
            this.synth = await buildMultiInstrument(this.audioContext, {
                type: instrumentType,
                preset: preset,
                output: this.preamp
            });
            this.activePresetName = presetName;
        } catch (error) {
            console.error(`[MelodySynthManagerV2] Error loading synth for ${this.partName}:`, error);
        }
    }

    public async schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: string) {
        const beatDuration = 60 / tempo;
        const notesToPlay = events.filter(e => e.type === this.partName).map(e => ({ 
            midi: e.note, 
            time: e.time * beatDuration, 
            duration: e.duration * beatDuration, 
            velocity: e.weight, 
            technique: e.technique, 
            params: e.params 
        }));
        
        // --- DEFERRED PRESET SWITCH (Lead Stability Logic) ---
        // #ЗАЧЕМ: Мелодии нельзя менять пресет во время активной игры.
        // #ЧТО: Смена происходит только если текущий такт пуст (пауза) или если мы выходим из тишины.
        if (instrumentHint && this.partName === 'melody') {
            const mappedHint = V1_TO_V2_PRESET_MAP[instrumentHint] || instrumentHint;
            if (mappedHint !== this.activePresetName) {
                if (notesToPlay.length === 0 || this.activePresetName === 'none') {
                    await this.setInstrument(mappedHint);
                }
            }
        } else if (instrumentHint && this.partName === 'bass') {
            // Bass usually changes on parts, but we can sync it too if needed.
            // For now, let bass be more immediate as requested.
            const mappedHint = BASS_PRESET_MAP[instrumentHint] || instrumentHint;
            if (mappedHint !== this.activePresetName) {
                await this.setInstrument(mappedHint);
            }
        }

        if (this.activePresetName === 'none') return;
        if (notesToPlay.length === 0) return;

        // Use ACTIVE identity for routing
        const currentActive = this.activePresetName;
        const isGlitchNote = notesToPlay.some(n => n.technique === 'harm');

        // --- Sampler Routing ---
        if (currentActive === 'cs80') {
            this.cs80Sampler.schedule(notesToPlay, barStartTime, tempo);
            return;
        }

        if (this.partName === 'melody') {
            if (currentActive === 'blackAcoustic') {
                this.blackAcousticSampler.schedule(notesToPlay, barStartTime, tempo, isGlitchNote);
                return;
            }
            if (currentActive === 'telecaster') {
                this.telecasterSampler.schedule(notesToPlay, barStartTime, tempo, isGlitchNote);
                return;
            }
            if (currentActive === 'darkTelecaster') {
                this.darkTelecasterSampler.schedule(notesToPlay, barStartTime, tempo, isGlitchNote);
                return;
            }
        }
        
        if (!this.synth) return;
        
        notesToPlay.forEach(note => {
            const noteOnTime = barStartTime + note.time;
            
            if (note.params?.filterCutoff && this.synth.setParam) {
                this.synth.setParam('filterCutoff', note.params.filterCutoff);
                this.synth.setParam('lpf', note.params.filterCutoff);
            }

            if (isFinite(note.duration) && note.duration > 0) {
                 this.synth.noteOn(note.midi, noteOnTime, note.velocity, note.duration);
            }
        });
    }
    
    public async setInstrument(instrumentName: string) {
       if (instrumentName === this.activePresetName) return;

       if (this.synth) {
           this.synth.disconnect();
           this.synth = null;
       }

       if (instrumentName === 'none') {
            this.activePresetName = 'none';
            return;
       }

       const isBassPart = this.partName === 'bass';
       const preset = isBassPart
           ? BASS_PRESETS[instrumentName as keyof typeof BASS_PRESETS]
           : V2_PRESETS[instrumentName as keyof typeof V2_PRESETS];

       if (preset) {
           await this.loadInstrument(instrumentName, isBassPart ? 'bass' : (preset.type || 'synth'));
       } else {
           // It's a sampler name or unknown preset
           this.activePresetName = instrumentName;
       }
    }

    public setPreampGain(volume: number) {
        if (this.preamp) {
            this.preamp.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
        }
    }

    public allNotesOff() {
        if (this.synth && this.synth.allNotesOff) {
            this.synth.allNotesOff();
        }
        this.telecasterSampler.stopAll();
        this.blackAcousticSampler.stopAll();
        this.darkTelecasterSampler.stopAll();
        this.cs80Sampler.stopAll();
    }

    public stop() { this.allNotesOff(); }
    public dispose() { 
        this.stop(); 
        if (this.synth) this.synth.disconnect();
        if (this.preamp) { this.preamp.disconnect(); } 
    }
}
