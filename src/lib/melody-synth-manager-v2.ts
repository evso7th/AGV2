import type { FractalEvent, AccompanimentInstrument } from '@/types/fractal';
import type { Note } from "@/types/music";
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP, BASS_PRESET_MAP } from './presets-v2';
import { BASS_PRESETS } from './bass-presets';
import type { BlackGuitarSampler } from './black-guitar-sampler';
import type { TelecasterGuitarSampler } from './telecaster-guitar-sampler';
import type { DarkTelecasterSampler } from './dark-telecaster-sampler';

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
    private darkTelecasterSampler: DarkTelecasterSampler;
    private preamp: GainNode;

    private activePresetName: keyof typeof V2_PRESETS | keyof typeof BASS_PRESETS | 'none' = 'synth';

    constructor(
        audioContext: AudioContext, 
        destination: AudioNode,
        telecasterSampler: TelecasterGuitarSampler,
        blackAcousticSampler: BlackGuitarSampler,
        darkTelecasterSampler: DarkTelecasterSampler,
        partName: 'melody' | 'bass'
    ) {
        this.audioContext = audioContext;
        this.destination = destination;
        this.telecasterSampler = telecasterSampler;
        this.blackAcousticSampler = blackAcousticSampler;
        this.darkTelecasterSampler = darkTelecasterSampler;
        this.partName = partName;

        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.0;
        this.preamp.connect(this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        console.log(`[MelodySynthManagerV2] Initializing for ${this.partName}...`);
        
        // #ЗАЧЕМ: Динамическое определение типа инструмента при инициализации.
        // #ЧТО: Читаем тип из пресета, а не хардкодим 'synth'.
        const initialPresetName = this.partName === 'bass' ? 'bass_jazz_warm' : 'synth';
        const preset = this.partName === 'bass' 
            ? BASS_PRESETS[initialPresetName as keyof typeof BASS_PRESETS]
            : V2_PRESETS[initialPresetName as keyof typeof V2_PRESETS];
            
        const instrumentTypeForFactory = preset?.type || (this.partName === 'bass' ? 'bass' : 'synth');

        await this.loadInstrument(initialPresetName as any, instrumentTypeForFactory as any);
        this.isInitialized = true;
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
        
        try {
            this.synth = await buildMultiInstrument(this.audioContext, {
                type: instrumentType,
                preset: preset,
                output: this.preamp // Connect to the manager's preamp
            });
            this.activePresetName = presetName;
        } catch (error) {
            console.error(`[MelodySynthManagerV2] Error loading synth for ${this.partName} with preset ${presetName}:`, error);
        }
    }

    public async schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: string) {
        const beatDuration = 60 / tempo;
        const notesToPlay = events.filter(e => e.type === this.partName).map(e => ({ midi: e.note, time: e.time * beatDuration, duration: e.duration * beatDuration, velocity: e.weight, technique: e.technique, params: e.params }));
        
        if (notesToPlay.length === 0) return;

        // --- SMART ROUTER (только для мелодии) ---
        if (this.partName === 'melody') {
            if (instrumentHint === 'blackAcoustic') {
                this.blackAcousticSampler.schedule(notesToPlay, barStartTime, tempo);
                return;
            }
            if (instrumentHint === 'telecaster') {
                this.telecasterSampler.schedule(notesToPlay, barStartTime, tempo);
                return;
            }
            if (instrumentHint === 'darkTelecaster') {
                this.darkTelecasterSampler.schedule(notesToPlay, barStartTime, tempo);
                return;
            }
        }
        
        // --- SYNTH LOGIC ---
        let finalInstrumentHint = instrumentHint;
        if (instrumentHint) {
            if (this.partName === 'bass') {
                const mappedName = BASS_PRESET_MAP[instrumentHint as keyof typeof BASS_PRESET_MAP];
                if (mappedName) finalInstrumentHint = mappedName;
            } else {
                const mappedName = V1_TO_V2_PRESET_MAP[instrumentHint as keyof typeof V1_TO_V2_PRESET_MAP];
                if (mappedName) finalInstrumentHint = mappedName;
            }
        } else {
            finalInstrumentHint = this.activePresetName;
        }

        if (finalInstrumentHint === 'none') {
            if (this.activePresetName !== 'none') await this.setInstrument('none');
            return;
        }

        if (finalInstrumentHint !== this.activePresetName) {
            await this.setInstrument(finalInstrumentHint as any);
        }
        
        if (!this.synth) return;
        
        notesToPlay.forEach(note => {
            const noteOnTime = barStartTime + note.time;
            
            if (isFinite(note.duration) && note.duration > 0) {
                 // #ЗАЧЕМ: Переход на самозавершающиеся ноты (как в сэмплерах).
                 // #ЧТО: Передаем duration прямо в noteOn. Это позволяет нотам
                 //      наслаиваться друг на друга (layering), не обрывая хвосты.
                 //      Метод noteOff в менеджере больше не вызывается.
                 this.synth.noteOn(note.midi, noteOnTime, note.velocity, note.duration);
            } else {
                 console.error(`[MelodySynthManagerV2] Invalid duration for event for part ${this.partName}!`, JSON.parse(JSON.stringify(note)));
            }
        });
    }
    
    public async setInstrument(instrumentName: keyof typeof V2_PRESETS | keyof typeof BASS_PRESETS | 'none') {
       if (instrumentName === this.activePresetName) return;

       if (instrumentName === 'none') {
            this.allNotesOff();
            this.synth = null;
            this.activePresetName = 'none';
            console.log(`[MelodySynthManagerV2] for ${this.partName}: Instrument set to 'none'. Output silenced.`);
            return;
       }

       const isBassPreset = this.partName === 'bass';
       const preset = isBassPreset
           ? BASS_PRESETS[instrumentName as keyof typeof BASS_PRESETS]
           : V2_PRESETS[instrumentName as keyof typeof V2_PRESETS];

       if (this.synth && this.synth.type === preset?.type && this.synth.setPreset && preset) {
           this.synth.setPreset(preset);
           this.activePresetName = instrumentName;
           console.log(`[MelodySynthManagerV2] for ${this.partName}: Preset updated to: ${instrumentName}`);
       } else if (preset) {
           await this.loadInstrument(instrumentName, isBassPreset ? 'bass' : (preset.type || 'synth'));
       } else {
           console.error(`[MelodySynthManagerV2] Failed to set preset: ${instrumentName}. Preset not found.`);
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
    }

    public stop() { this.allNotesOff(); }
    public dispose() { this.stop(); if (this.preamp) { this.preamp.disconnect(); } }
}
