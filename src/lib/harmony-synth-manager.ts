
import type { FractalEvent } from '@/types/fractal';
import type { Note } from "@/types/music";
import { SamplerPlayer } from '@/lib/sampler-player';
import { GuitarChordsSampler } from '@/lib/guitar-chords-sampler';
import { VIOLIN_SAMPLES } from "@/lib/samples";
import { ViolinSamplerPlayer } from './violin-sampler-player';
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP } from './presets-v2';

/**
 * #ЗАЧЕМ: Менеджер слоя гармонии V4.1 — "Lazy Loading Support".
 * #ЧТО: ПЛАН №888 — Добавлена поддержка поэтапной инициализации (minimal флаг).
 */
export class HarmonySynthManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private activeInstrumentName: string = 'guitarChords';
    public isInitialized = false;

    private guitarChords: GuitarChordsSampler;
    private violin: ViolinSamplerPlayer;
    
    private synth: any | null = null;
    private activeSynthPreset: string = 'none';

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.guitarChords = new GuitarChordsSampler(audioContext, this.destination);
        this.violin = new ViolinSamplerPlayer(audioContext, this.destination);
    }

    /**
     * #ЗАЧЕМ: Поэтапная загрузка.
     * #ЧТО: minimal=true загружает только гитарные аккорды.
     */
    async init(minimal = false) {
        if (this.isInitialized && !minimal) return;
        
        if (minimal) {
            console.log('%c[HarmonyManager] Level 1: Initializing Guitar Chords...', 'color: #DA70D6;');
            await this.guitarChords.init();
            this.isInitialized = true;
            this.guitarChords.setVolume(1.0);
        } else {
            console.log('%c[HarmonyManager] Level 2: Initializing Violin...', 'color: #DA70D6;');
            await this.violin.loadInstrument('violin', VIOLIN_SAMPLES);
            this.violin.setVolume(1.0);
        }
    }
    
    private async loadSynth(presetName: string) {
        if (this.synth) {
            const oldSynth = this.synth;
            setTimeout(() => { try { oldSynth.disconnect(); } catch(e){} }, 10000);
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
        } catch (e) {
            console.error('[HarmonyManager] Synth load failed:', e);
        }
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
        this.guitarChords.dispose();
        this.violin.dispose();
        if (this.synth) this.synth.disconnect();
    }
}
