import type { FractalEvent } from '@/types/fractal';
import type { Note } from "@/types/music";
import { ViolinSamplerPlayer } from './violin-sampler-player';
import { TelecasterChordsSampler } from './telecaster-chords-sampler';
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP } from './presets-v2';
import { VIOLIN_SAMPLES } from "@/lib/samples";

/**
 * @fileOverview Менеджер слоя гармонии V5.0 — "Telecaster Alignment".
 * #ЗАЧЕМ: ПЛАН №1325 — Переход на TelecasterChordsSampler (10s limit).
 * #ЧТО: Замена GuitarChordsSampler на TelecasterChordsSampler.
 */
export class HarmonySynthManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private activeInstrumentName: string = 'guitarChords';
    public isInitialized = false;
    private isFullyInitialized = false;

    private guitarChords: TelecasterChordsSampler;
    private violin: ViolinSamplerPlayer;

    private synth: any | null = null;
    private activeSynthPreset: string = 'none';
    private cleanupAbortController: AbortController | null = null;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        // #ЗАЧЕМ: Используем специализированный сэмплер для Telecaster
        this.guitarChords = new TelecasterChordsSampler(audioContext, this.destination);
        this.violin = new ViolinSamplerPlayer(audioContext, this.destination);
    }

    async init(minimal = false) {
        if (this.isFullyInitialized) return;
        if (minimal && this.isInitialized) return;
        
        if (minimal) {
            await this.guitarChords.init(true);
            this.isInitialized = true;
            this.guitarChords.setVolume(1.0);
        } else {
            await Promise.all([
                this.guitarChords.init(false),
                this.violin.loadInstrument('violin', VIOLIN_SAMPLES)
            ]);
            this.violin.setVolume(1.0);
            this.isInitialized = true;
            this.isFullyInitialized = true;
        }
    }
    
    private scheduleCleanup(inst: any, delayMs: number) {
        if (this.cleanupAbortController) {
            this.cleanupAbortController.abort();
        }
        this.cleanupAbortController = new AbortController();
        const signal = this.cleanupAbortController.signal;

        const timeoutId = setTimeout(() => {
            if (!signal.aborted) {
                try { inst.disconnect(); } catch(e) {}
            }
        }, delayMs);

        signal.addEventListener('abort', () => clearTimeout(timeoutId));
    }

    private async loadSynth(presetName: string) {
        if (this.synth) {
            const oldSynth = this.synth;
            this.scheduleCleanup(oldSynth, 10000);
            this.synth = null;
        }

        const mappedName = V1_TO_V2_PRESET_MAP[presetName] || presetName;
        const preset = V2_PRESETS[mappedName as keyof typeof V2_PRESETS];
        if (!preset) return;

        try {
            this.synth = await buildMultiInstrument(this.audioContext, {
                type: (preset as any).type || 'synth',
                preset: preset,
                output: this.destination
            });
            this.activeSynthPreset = presetName;
        } catch (e) {}
    }

    public async schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: string) {
        if (!this.isInitialized) return;
        
        const targetInstrument = instrumentHint || this.activeInstrumentName;
        if (targetInstrument === 'none' || targetInstrument === 'flute' || targetInstrument === 'piano') return;

        const harmonyEvents = events.filter(e => e.type === 'harmony');
        if (harmonyEvents.length === 0) return;

        const beatDuration = 60 / tempo;
        const notes: (Note & { chordName?: string, params?: any })[] = harmonyEvents.map(event => ({
            midi: event.note,
            time: event.time * beatDuration,
            duration: event.duration * beatDuration,
            velocity: event.weight,
            chordName: event.chordName,
            params: event.params,
        }));

        const isSampler = ['guitarChords', 'violin'].includes(targetInstrument);

        if (isSampler) {
            switch (targetInstrument) {
                case 'guitarChords': this.guitarChords.schedule(notes, barStartTime); break;
                case 'violin': this.violin.schedule(notes, barStartTime); break;
            }
        } else {
            if (this.activeSynthPreset !== targetInstrument) {
                await this.loadSynth(targetInstrument);
            }
            if (this.synth) {
                notes.forEach(note => {
                    this.synth.noteOn(note.midi, barStartTime + note.time, note.velocity, note.duration);
                });
            }
        }
    }

    public async setInstrument(instrumentName: string) {
        if (!this.isInitialized) return;
        this.activeInstrumentName = instrumentName;
        
        const isSampler = ['guitarChords', 'violin'].includes(instrumentName);
        if (!isSampler && instrumentName !== 'none' && instrumentName !== 'flute' && instrumentName !== 'piano') {
            await this.loadSynth(instrumentName);
        }
    }

    public setVolume(volume: number) {
        this.guitarChords.setVolume(volume);
        this.violin.setVolume(volume);
        if (this.synth) this.synth.setVolume(volume);
    }

    public allNotesOff() {
        this.guitarChords.stopAll();
        this.violin.stopAll();
        if (this.synth) this.synth.allNotesOff();
    }

    public stop() { this.allNotesOff(); }
    public dispose() {
        this.stop();
        if (this.cleanupAbortController) {
            this.cleanupAbortController.abort();
            this.cleanupAbortController = null;
        }
        this.guitarChords.dispose();
        this.violin.dispose();
        if (this.synth) this.synth.disconnect();
    }
}
