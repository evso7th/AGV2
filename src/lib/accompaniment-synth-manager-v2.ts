
import type { FractalEvent } from '@/types/fractal';
import type { Note } from "@/types/music";
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP } from './presets-v2';
import type { BlackGuitarSampler } from './black-guitar-sampler';
import type { TelecasterGuitarSampler } from './telecaster-guitar-sampler';

/**
 * #ЗАЧЕМ: V2 менеджер для Аккомпанемента.
 * #ЧТО: ПЛАН №839 — Динамическое управление громкостью (summonProgress) полностью отключено.
 */
export class AccompanimentSynthManagerV2 {
    private audioContext: AudioContext;
    private destination: AudioNode;
    public isInitialized = false;
    private instrument: any | null = null; 
    private activePresetName: string = 'none';

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
    }

    async init() {
        if (this.isInitialized) return;
        await this.setInstrument('organ_soft_jazz');
        this.isInitialized = true;
    }
    
    private async loadInstrument(presetName: string, instrumentType: 'synth' | 'organ' | 'guitar' = 'synth') {
        if (this.instrument) {
            const oldInst = this.instrument;
            setTimeout(() => {
                try { oldInst.disconnect(); } catch (e) {}
            }, 10000); 
            this.instrument = null;
        }
        
        const preset = V2_PRESETS[presetName as keyof typeof V2_PRESETS];
        if (!preset) return;
        
        try {
            this.instrument = await buildMultiInstrument(this.audioContext, {
                type: instrumentType,
                preset: preset,
                output: this.destination
            });
            this.activePresetName = presetName;
        } catch (error) {
            console.error(`[AccompanimentManagerV2] Error loading:`, error);
        }
    }

    public async schedule(events: FractalEvent[], barStartTime: number, tempo: number, barCount: number, instrumentHint?: string) {
        const beatDuration = 60 / tempo;
        
        const filtered = events.filter(e => 
            e.type === 'accompaniment' || 
            e.type === 'pianoAccompaniment' || 
            e.type === 'harmony'
        );

        const notesToPlay = filtered.map(e => ({
            midi: e.note,
            time: e.time * beatDuration,
            duration: e.duration * beatDuration,
            velocity: e.weight,
            technique: e.technique,
            params: e.params
        }));

        if (instrumentHint) {
            const mappedHint = V1_TO_V2_PRESET_MAP[instrumentHint] || instrumentHint;
            if (mappedHint !== this.activePresetName) {
                if (notesToPlay.length === 0 || this.activePresetName === 'none') {
                    await this.setInstrument(mappedHint);
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
               setTimeout(() => { try { oldInst.disconnect(); } catch(e) {} }, 10000);
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
    public dispose() { this.stop(); if (this.instrument) this.instrument.disconnect(); }
}
