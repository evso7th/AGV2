
import type { FractalEvent } from '@/types/fractal';
import type { Note } from "@/types/music";
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP } from './presets-v2';
import { normalizeEventType } from './music-theory';
import type { BlackGuitarSampler } from './black-guitar-sampler';
import type { TelecasterGuitarSampler } from './telecaster-guitar-sampler';

/**
 * #ЗАЧЕМ: V2 менеджер для Аккомпанемента.
 * #ЧТО: ПЛАН №85 — Сокращение хвостов релиза для устранения гудения.
 */
export class AccompanimentSynthManagerV2 {
    private audioContext: AudioContext;
    private destination: AudioNode;
    public isInitialized = false;
    private instrument: any | null = null;
    private activePresetName: string = 'none';
    private preamp: GainNode;
    private isChangingInstrument = false;
    private cleanupControllers = new Map<string, AbortController>();

    private telecasterSampler: TelecasterGuitarSampler;
    private blackAcousticSampler: BlackGuitarSampler;

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

        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.0;
        this.preamp.connect(this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        await this.setInstrument('organ_soft_jazz');
        this.isInitialized = true;
    }

    public setPreampGain(gain: number) {
        if (isFinite(gain)) {
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
    
    private async loadInstrument(presetName: string, instrumentType: 'synth' | 'organ' | 'guitar' = 'synth') {
        if (this.isChangingInstrument) return;
        this.isChangingInstrument = true;

        const preset = V2_PRESETS[presetName as keyof typeof V2_PRESETS];
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

            const oldInst = this.instrument;
            this.instrument = newInstrument;
            this.activePresetName = presetName;

            if (oldInst) {
                this.scheduleCleanup(oldInst, 5000, `loadInstrument-${Date.now()}`);
            }
        } catch (error) {
            console.error(`[AccompanimentManagerV2] Error loading:`, error);
        } finally {
            this.isChangingInstrument = false;
        }
    }

    public schedule(events: FractalEvent[], barStartTime: number, tempo: number, barCount: number, instrumentHint?: string) {
        if (!isFinite(barStartTime) || !isFinite(tempo) || tempo <= 0) return;
        if (barStartTime < this.audioContext.currentTime) {
            console.warn(`[AccompanimentSynthManagerV2] barStartTime in past: ${barStartTime} < ${this.audioContext.currentTime}`);
            return;
        }
        const boundedTempo = Math.max(20, Math.min(300, tempo));
        const beatDuration = 60 / boundedTempo;
        const filtered = events.filter(e => normalizeEventType(e).has('accompaniment'));

        const notesToPlay = filtered.map(e => {
            // #ЗАЧЕМ: ПЛАН №85. Уменьшение релизов для устранения гудения.
            const extraDuration = 0.5; 
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

        if (instrumentHint && instrumentHint !== this.activePresetName && !this.isChangingInstrument) {
            const mappedHint = V1_TO_V2_PRESET_MAP[instrumentHint] || instrumentHint;
            if (mappedHint !== this.activePresetName) {
                if (notesToPlay.length === 0 || this.activePresetName === 'none' || barCount % 4 === 0) {
                    this.setInstrument(mappedHint);
                }
            }
        }

        if (this.activePresetName === 'none') return;
        if (notesToPlay.length === 0) return;

        if (this.activePresetName === 'blackAcoustic') {
            this.blackAcousticSampler.schedule(notesToPlay, barStartTime, tempo);
            return;
        }
        if (this.activePresetName === 'telecaster') {
            this.telecasterSampler.schedule(notesToPlay, barStartTime, tempo);
            return;
        }

        if (!this.instrument) return;

        notesToPlay.forEach(note => {
            const noteOnTime = barStartTime + note.time;
            if (noteOnTime < this.audioContext.currentTime) {
                console.warn(`[AccompanimentSynthManagerV2] Skipped note in past: ${noteOnTime} < ${this.audioContext.currentTime}`);
                return;
            }
            if (this.instrument.setPan && note.pan !== undefined) {
                this.instrument.setPan(note.pan);
            }
            if (note.params?.filterCutoff && this.instrument.setParam) {
                this.instrument.setParam('filterCutoff', note.params.filterCutoff);
                this.instrument.setParam('lpf', note.params.filterCutoff);
            }
            if (isFinite(note.duration) && note.duration > 0) {
                 this.instrument.noteOn(note.midi, noteOnTime, note.velocity, note.duration);
            }
        });
    }
    
    public async setInstrument(instrumentName: string) {
       if (instrumentName === this.activePresetName) return;

       const newPreset = V2_PRESETS[instrumentName as keyof typeof V2_PRESETS];
       if (newPreset) {
           await this.loadInstrument(instrumentName, (newPreset as any).type || 'synth');
       } else {
           if (this.instrument) {
               const oldInst = this.instrument;
               this.scheduleCleanup(oldInst, 5000, `setInstrument-${Date.now()}`);
               this.instrument = null;
           }
           this.activePresetName = instrumentName;
       }
    }

    public allNotesOff() {
        if (this.instrument && this.instrument.allNotesOff) {
            this.instrument.allNotesOff();
        }
    }

    public stop() { this.allNotesOff(); }

    public dispose() {
        this.stop();
        for (const [, controller] of this.cleanupControllers) {
            controller.abort();
        }
        this.cleanupControllers.clear();
        if (this.instrument) this.instrument.disconnect();
        this.preamp.disconnect();
    }
}
