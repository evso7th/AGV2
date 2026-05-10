
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
 * #ЗАЧЕМ: V2 менеджер для Мелодии и Баса.
 * #ЧТО: ПЛАН №1670 — Оптимизация Aria Overlap для разгрузки CPU.
 */
export class MelodySynthManagerV2 {
    private audioContext: AudioContext;
    private destination: AudioNode;
    public isInitialized = false;
    private partName: 'melody' | 'bass';
    
    private synth: any | null = null; 
    private telecasterSampler: TelecasterGuitarSampler;
    private blackAcousticSampler: BlackGuitarSampler;
    private darkTelecasterSampler: DarkTelecasterSampler;
    private cs80Sampler: CS80GuitarSampler;
    
    private activePresetName: string = 'none';
    private preamp: GainNode;
    private isChangingInstrument = false;

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
        const initialPresetName = this.partName === 'bass' ? 'bass_jazz_warm' : 'telecaster';
        await this.setInstrument(initialPresetName);
        this.isInitialized = true;
    }

    public setPreampGain(gain: number) {
        if (isFinite(gain)) {
            this.preamp.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.02);
        }
    }
    
    private async loadInstrument(presetName: string, instrumentType: 'bass' | 'synth' | 'organ' | 'guitar' = 'synth') {
        if (this.isChangingInstrument) return;
        this.isChangingInstrument = true;

        const preset = instrumentType === 'bass'
            ? BASS_PRESETS[presetName as keyof typeof BASS_PRESETS]
            : V2_PRESETS[presetName as keyof typeof V2_PRESETS];

        if (!preset) {
            this.isChangingInstrument = false;
            return;
        }
        
        try {
            const newInstrument = await buildMultiInstrument(this.audioContext, {
                type: instrumentType,
                preset: preset,
                output: this.preamp
            });
            
            const oldInst = this.synth;
            this.synth = newInstrument;
            this.activePresetName = presetName;

            if (oldInst) {
                setTimeout(() => {
                    try { oldInst.disconnect(); } catch (e) {}
                }, 5000);
            }
        } catch (error) {
            console.error(`[MelodySynthManagerV2] Error loading synth for ${this.partName}:`, error);
        } finally {
            this.isChangingInstrument = false;
        }
    }

    public schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: string, barCount: number = 0) {
        const beatDuration = 60 / tempo;
        
        const notesToPlay = events.filter(e => e.type === this.partName).map(e => {
            // #ЗАЧЕМ: ПЛАН №1670. Минимизация Aria Overlap. 
            // 0.2с для мелодии и 0.02с для баса достаточно для плавности, но не захламляет контекст.
            const extraDuration = this.partName === 'melody' ? 0.20 : 0.02;
            return { 
                midi: e.note, 
                time: e.time * beatDuration, 
                duration: (e.duration * beatDuration) + extraDuration, 
                velocity: e.weight, 
                technique: e.technique, 
                pan: e.pan, 
                params: e.params 
            };
        });
        
        let finalHint = instrumentHint;
        if (!finalHint || finalHint === 'melody') {
            finalHint = this.partName === 'bass' ? 'bass_jazz_warm' : 'telecaster';
        }

        if (finalHint !== this.activePresetName && !this.isChangingInstrument) {
            const isPhraseBoundary = barCount % 4 === 0;
            if (notesToPlay.length === 0 || isPhraseBoundary || this.activePresetName === 'none') {
                this.setInstrument(finalHint);
            }
        }

        if (this.activePresetName === 'none') return;
        if (notesToPlay.length === 0) return;

        const currentActive = this.activePresetName;
        
        if (currentActive === 'cs80') {
            this.cs80Sampler.schedule(notesToPlay, barStartTime, tempo);
            return;
        }

        if (this.partName === 'melody') {
            if (currentActive === 'blackAcoustic') {
                this.blackAcousticSampler.schedule(notesToPlay, barStartTime, tempo);
                return;
            }
            if (currentActive === 'telecaster') {
                this.telecasterSampler.schedule(notesToPlay, barStartTime, tempo);
                return;
            }
            if (currentActive === 'darkTelecaster') {
                this.darkTelecasterSampler.schedule(notesToPlay, barStartTime, tempo);
                return;
            }
        }
        
        if (!this.synth) {
            if (this.partName === 'melody') this.telecasterSampler.schedule(notesToPlay, barStartTime, tempo);
            return;
        }
        
        // Aria Transient Logic
        if (currentActive === 'guitar_shineOn' || currentActive === 'synth' || currentActive === 'organ') {
            this.telecasterSampler.schedule(notesToPlay, barStartTime, tempo, true);
        } else if (currentActive === 'guitar_muffLead') {
            this.blackAcousticSampler.schedule(notesToPlay, barStartTime, tempo, true);
        }
        
        notesToPlay.forEach(note => {
            const noteOnTime = barStartTime + note.time;
            if (this.synth.setPan && note.pan !== undefined) {
                this.synth.setPan(note.pan);
            }
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
       
       const isBassPart = this.partName === 'bass';
       const preset = isBassPart
           ? BASS_PRESETS[instrumentName as keyof typeof BASS_PRESETS]
           : V2_PRESETS[instrumentName as keyof typeof V2_PRESETS];

       if (preset) {
           await this.loadInstrument(instrumentName, isBassPart ? 'bass' : (preset.type || 'synth'));
       } else {
           if (this.synth) {
               const fadingSynth = this.synth;
               setTimeout(() => { try { fadingSynth.disconnect(); } catch(e) {} }, 5000);
               this.synth = null;
           }
           this.activePresetName = instrumentName;
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
        this.preamp.disconnect();
    }
}
