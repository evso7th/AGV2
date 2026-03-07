
import type { FractalEvent } from '@/types/fractal';
import type { Note } from "@/types/music";
import { SamplerPlayer } from '@/lib/sampler-player';
import { GuitarChordsSampler } from '@/lib/guitar-chords-sampler';
import { PIANO_SAMPLES, VIOLIN_SAMPLES, FLUTE_SAMPLES } from "@/lib/samples";
import { ViolinSamplerPlayer } from './violin-sampler-player';
import { FluteSamplerPlayer } from './flute-sampler-player';
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS, V1_TO_V2_PRESET_MAP } from './presets-v2';

/**
 * #ЗАЧЕМ: Менеджер слоя гармонии V3.0.
 * #ЧТО: ПЛАН №746 — Научил менеджер играть на синтезаторах и органах V2.
 *       Теперь это универсальный исполнитель: и сэмплы, и синтез.
 */
export class HarmonySynthManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private activeInstrumentName: string = 'piano';
    public isInitialized = false;

    private piano: SamplerPlayer;
    private guitarChords: GuitarChordsSampler;
    private violin: ViolinSamplerPlayer;
    private flute: FluteSamplerPlayer;
    
    private synth: any | null = null;
    private activeSynthPreset: string = 'none';

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.piano = new SamplerPlayer(audioContext, this.destination);
        this.guitarChords = new GuitarChordsSampler(audioContext, this.destination);
        this.violin = new ViolinSamplerPlayer(audioContext, this.destination);
        this.flute = new FluteSamplerPlayer(audioContext, this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[HarmonyManager] Initializing Hybrid Engine (Samples + Synth)...');

        await Promise.all([
            this.piano.loadInstrument('piano', PIANO_SAMPLES),
            this.guitarChords.init(),
            this.violin.loadInstrument('violin', VIOLIN_SAMPLES),
            this.flute.loadInstrument('flute', FLUTE_SAMPLES),
        ]);
        
        this.isInitialized = true;
        this.piano.setVolume(0.85);
        this.guitarChords.setVolume(1.0);
        this.violin.setVolume(1.0);
        this.flute.setVolume(0.8);
    }
    
    private async loadSynth(presetName: string) {
        if (this.synth) {
            this.synth.disconnect();
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
        if (targetInstrument === 'none') return;

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

        // --- Routing Logic ---
        const isSampler = ['piano', 'guitarChords', 'violin', 'flute'].includes(targetInstrument);

        if (isSampler) {
            switch (targetInstrument) {
                case 'piano': this.piano.schedule('piano', notes, barStartTime); break;
                case 'guitarChords': this.guitarChords.schedule(notes, barStartTime); break;
                case 'violin': this.violin.schedule(notes, barStartTime); break;
                case 'flute': this.flute.schedule(notes, barStartTime); break;
            }
        } else {
            // #ЗАЧЕМ: Динамическая подгрузка синтезатора для слоя гармонии.
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
        
        const isSampler = ['piano', 'guitarChords', 'violin', 'flute'].includes(instrumentName);
        if (!isSampler && instrumentName !== 'none') {
            await this.loadSynth(instrumentName);
        }
    }

    public setVolume(volume: number) {
        this.piano.setVolume(volume * 0.85);
        this.guitarChords.setVolume(volume);
        this.violin.setVolume(volume);
        this.flute.setVolume(volume * 0.8);
        if (this.synth) this.synth.setVolume(volume);
    }

    public allNotesOff() {
        this.piano.stopAll();
        this.guitarChords.stopAll();
        this.violin.stopAll();
        this.flute.stopAll();
        if (this.synth) this.synth.allNotesOff();
    }

    public stop() { this.allNotesOff(); }
    public dispose() {
        this.stop();
        this.piano.dispose();
        this.guitarChords.dispose();
        this.violin.dispose();
        this.flute.dispose();
        if (this.synth) this.synth.disconnect();
    }
}
