/**
 * @fileOverview Melody Synth Manager V2.2 — "Soft Entrance Protocol".
 * #ЗАЧЕМ: Реализация ПЛАНА №1401 — Линейное нарастание громкости на старте трека.
 */
import type { FractalEvent } from '@/types/fractal';
import type { Note } from "@/types/music";
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP } from './presets-v2';
import { BASS_PRESETS } from './bass-presets';
import { normalizeEventType } from './music-theory';
import type { BlackGuitarSampler } from './black-guitar-sampler';
import type { TelecasterGuitarSampler } from './telecaster-guitar-sampler';
import type { DarkTelecasterSampler } from './dark-telecaster-sampler';
import type { CS80GuitarSampler } from './cs80-guitar-sampler';

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
    private cleanupControllers = new Map<string, AbortController>();

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
            this.preamp.gain.cancelScheduledValues(this.audioContext.currentTime);
            this.preamp.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.02);
        }
    }

    private scheduleCleanup(inst: any, delayMs: number, id: string) {
        const controller = new AbortController();
        this.cleanupControllers.set(id, controller);

        setTimeout(() => {
            if (!controller.signal.aborted) {
                try { inst.disconnect(); } catch (e) {}
                this.cleanupControllers.delete(id);
            }
        }, delayMs, controller.signal);
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
                this.scheduleCleanup(oldInst, 5000, `loadInstrument-${Date.now()}`);
            }
        } catch (error) {
            // console.error(`[MelodySynthManagerV2] Error loading synth:`, error);
        } finally {
            this.isChangingInstrument = false;
        }
    }

    public schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: string, barCount: number = 0) {
        if (!isFinite(barStartTime) || !isFinite(tempo) || tempo <= 0) return;
        if (barStartTime < this.audioContext.currentTime) {
            return;
        }
        const boundedTempo = Math.max(20, Math.min(300, tempo));
        const beatDuration = 60 / boundedTempo;

        // #ЗАЧЕМ: Протокол Мягкого Входа. Линейное нарастание за 6 тактов.
        const isMelody = this.partName === 'melody';
        const entranceMultiplier = (isMelody && barCount < 6) 
            ? (0.3 + (barCount / 6) * 0.7) 
            : 1.0;

        const notesToPlay = events.filter(e => normalizeEventType(e).has(this.partName)).map(e => {
            const extraDuration = this.partName === 'bass' ? 2.5 : 1.2; 
            return { 
                midi: e.note, 
                time: e.time * beatDuration, 
                duration: (e.duration * beatDuration) + extraDuration, 
                velocity: e.weight * entranceMultiplier, // Применение множителя входа
                technique: e.technique, 
                pan: e.pan, 
                params: { ...e.params, tempo: boundedTempo }
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
        
        if (currentActive === 'guitar_muffLead' || currentActive === 'guitar_shineOn') {
            this.blackAcousticSampler.schedule(notesToPlay, barStartTime, tempo, true);
        }
        
        notesToPlay.forEach(note => {
            const noteOnTime = barStartTime + note.time;
            if (noteOnTime < this.audioContext.currentTime) {
                return;
            }
            if (this.synth.setPan && note.pan !== undefined) {
                this.synth.setPan(note.pan);
            }
            if (note.params?.filterCutoff && this.synth.setParam) {
                this.synth.setParam('filterCutoff', note.params.filterCutoff);
                this.synth.setParam('lpf', note.params.filterCutoff);
            }
            if (isFinite(note.duration) && note.duration > 0) {
                 this.synth.noteOn(note.midi, noteOnTime, note.velocity, note.duration, note.params);
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
               this.scheduleCleanup(fadingSynth, 5000, `setInstrument-${Date.now()}`);
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
        for (const [, controller] of this.cleanupControllers) {
            controller.abort();
        }
        this.cleanupControllers.clear();
        if (this.synth) this.synth.disconnect();
        this.preamp.disconnect();
    }
}
