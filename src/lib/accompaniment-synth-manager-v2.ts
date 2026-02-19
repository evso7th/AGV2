import type { FractalEvent, AccompanimentInstrument } from '@/types/fractal';
import type { Note } from "@/types/music";
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP } from './presets-v2';

/**
 * A V2 manager for the accompaniment synthesizer.
 * Updated to support Deferred Preset Switching and Identity Guard.
 */
export class AccompanimentSynthManagerV2 {
    private audioContext: AudioContext;
    private destination: AudioNode;
    public isInitialized = false;
    private instrument: any | null = null; 
    
    private activePresetName: string = 'none';
    private preamp: GainNode;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;
        
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.0;
        this.preamp.connect(this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        console.log('[AccompanimentManagerV2] Initializing...');
        await this.setInstrument('organ_soft_jazz');
        this.isInitialized = true;
    }
    
    private async loadInstrument(presetName: string, instrumentType: 'synth' | 'organ' | 'guitar' = 'synth') {
        if (this.instrument) {
            this.instrument.disconnect();
            this.instrument = null;
        }
        
        const preset = V2_PRESETS[presetName as keyof typeof V2_PRESETS];
        if (!preset) return;
        
        try {
            console.log(`[AccompanimentManagerV2] Loading: ${presetName}`);
            this.instrument = await buildMultiInstrument(this.audioContext, {
                type: instrumentType,
                preset: preset,
                output: this.preamp
            });
            this.activePresetName = presetName;
        } catch (error) {
            console.error(`[AccompanimentManagerV2] Error loading instrument for preset ${presetName}:`, error);
        }
    }

    public async schedule(events: FractalEvent[], barStartTime: number, tempo: number, barCount: number, instrumentHint?: string) {
        const beatDuration = 60 / tempo;
        const notesToPlay = events.filter(e => e.type === 'accompaniment').map(e => ({
            midi: e.note,
            time: e.time * beatDuration,
            duration: e.duration * beatDuration,
            velocity: e.weight,
            params: e.params
        }));

        // --- DEFERRED PRESET SWITCH ---
        // #ЗАЧЕМ: Аккомпанементу нельзя резко менять тембр во время игры.
        if (instrumentHint) {
            const mappedHint = V1_TO_V2_PRESET_MAP[instrumentHint] || instrumentHint;
            if (mappedHint !== this.activePresetName) {
                // Смена происходит только если текущий такт пуст или мы выходим из тишины.
                if (notesToPlay.length === 0 || this.activePresetName === 'none') {
                    await this.setInstrument(mappedHint);
                }
            }
        }

        if (this.activePresetName === 'none' || !this.instrument) return;
        if (notesToPlay.length === 0) return;

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
       // #ЗАЧЕМ: Equality Guard. Предотвращает бессмысленные перезагрузки графа.
       if (instrumentName === this.activePresetName) return;

       if (this.instrument) {
           this.instrument.disconnect();
           this.instrument = null;
       }

       if (instrumentName === 'none') {
            this.activePresetName = 'none';
            return;
       }

       const newPreset = V2_PRESETS[instrumentName as keyof typeof V2_PRESETS];
       if (!newPreset) return;

       await this.loadInstrument(instrumentName, (newPreset as any).type || 'synth');
    }

    public setPreampGain(volume: number) {
        if (this.preamp) {
            this.preamp.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
        }
    }

    public allNotesOff() {
        if (this.instrument && this.instrument.allNotesOff) {
            this.instrument.allNotesOff();
        }
    }

    public stop() { this.allNotesOff(); }
    public dispose() { this.stop(); if (this.instrument) this.instrument.disconnect(); this.preamp.disconnect(); }
}
