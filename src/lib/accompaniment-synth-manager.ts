
import type { FractalEvent, MelodyInstrument, AccompanimentInstrument, BassSynthParams } from '@/types/fractal';
import type { Note } from "@/types/music";
import * as Tone from 'tone';
import { SamplerPlayer } from './sampler-player';
import { ViolinSamplerPlayer } from './violin-sampler-player';
import { FluteSamplerPlayer } from './flute-sampler-player';
import { GuitarChordsSampler } from './guitar-chords-sampler';
import { AcousticGuitarSoloSampler } from './acoustic-guitar-solo-sampler';
import { PRESETS } from "./presets";


function midiToFreq(midi: number): number {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

type SynthVoice = {
    worklet: AudioWorkletNode;
};

const VOICE_BALANCE: Record<string, number> = {
  bass: 1.0, melody: 0.7, accompaniment: 0.6, drums: 1.0,
  effects: 0.6, sparkles: 0.7, piano: 1.0, violin: 0.8, flute: 0.8, guitarChords: 0.9,
  acousticGuitarSolo: 0.9,
};


/**
 * Manages multiple instruments for the accompaniment part.
 * Acts as an orchestrator, directing musical events to the currently active instrument,
 * which can be a sampler (piano, guitar, etc.) or a synth.
 */
export class AccompanimentSynthManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private activeInstrumentName: MelodyInstrument | AccompanimentInstrument = 'piano';
    public isInitialized = false;

    // Sampler Instruments
    private piano: SamplerPlayer;
    private violin: ViolinSamplerPlayer;
    private flute: FluteSamplerPlayer;
    private guitarChords: GuitarChordsSampler;
    private acousticGuitarSolo: AcousticGuitarSoloSampler;

    // Synth Instruments (Worklet-based pool)
    private synthPool: SynthVoice[] = [];
    private synthOutput: GainNode;
    private nextSynthVoice = 0;
    private isSynthPoolInitialized = false;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.piano = new SamplerPlayer(audioContext, this.destination);
        this.violin = new ViolinSamplerPlayer(audioContext, this.destination);
        this.flute = new FluteSamplerPlayer(audioContext, this.destination);
        this.guitarChords = new GuitarChordsSampler(audioContext, this.destination);
        this.acousticGuitarSolo = new AcousticGuitarSoloSampler(audioContext, this.destination);
        
        this.synthOutput = this.audioContext.createGain();
        this.synthOutput.connect(this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[AccompanimentManager] Initializing all instruments...');

        await Promise.all([
            this.piano.loadInstrument('piano', (PRESETS['piano'] as any).urls),
            this.violin.loadInstrument('violin', (PRESETS['violin'] as any).urls),
            this.flute.loadInstrument('flute', (PRESETS['flute'] as any).urls),
            this.guitarChords.init(),
            this.acousticGuitarSolo.init(),
            this.initSynthPool()
        ]);

        this.isInitialized = true;
        console.log('[AccompanimentManager] All instruments initialized.');
    }

    private async initSynthPool() {
        if (this.isSynthPoolInitialized) return;
        try {
            await this.audioContext.audioWorklet.addModule('/worklets/bass-processor.js');
            for (let i = 0; i < 4; i++) { // Pool of 4 voices for chords/arpeggios
                const worklet = new AudioWorkletNode(this.audioContext, 'bass-processor', {
                    processorOptions: { sampleRate: this.audioContext.sampleRate }
                });
                worklet.connect(this.synthOutput);
                this.synthPool.push({ worklet });
            }
            this.isSynthPoolInitialized = true;
            console.log('[AccompanimentManager] Synth pool initialized.');
        } catch (e) {
            console.error('[AccompanimentManager] Failed to init synth pool:', e);
        }
    }

    public schedule(events: FractalEvent[], barStartTime: number, tempo: number) {
        if (!this.isInitialized) {
            console.warn('[AccompanimentManager] Tried to schedule before initialized.');
            return;
        }

        const beatDuration = 60 / tempo;
        const notes: Note[] = events.map(event => ({
            midi: event.note,
            time: event.time * beatDuration,
            duration: event.duration * beatDuration,
            velocity: event.weight,
            params: event.params
        }));

        console.log(`[AccompanimentManager] Scheduling ${notes.length} notes for instrument: ${this.activeInstrumentName}`);

        switch (this.activeInstrumentName) {
            case 'piano':
                this.piano.schedule('piano', notes, barStartTime);
                break;
            case 'violin':
                this.violin.schedule(notes, barStartTime);
                break;
            case 'flute':
                this.flute.schedule(notes, barStartTime);
                break;
            case 'guitarChords':
                this.guitarChords.schedule(notes, barStartTime);
                break;
            case 'acousticGuitarSolo':
                this.acousticGuitarSolo.schedule(notes, barStartTime);
                break;
            case 'electricGuitar':
            case 'synth':
            case 'organ':
            case 'mellotron':
            case 'theremin':
            case 'E-Bells_melody':
            case 'G-Drops':
                this.scheduleSynth(notes, barStartTime);
                break;
            case 'none':
                // Do nothing
                break;
            default:
                // Fallback to synth for any other unhandled preset
                this.scheduleSynth(notes, barStartTime);
        }
    }

    private scheduleSynth(notes: Note[], barStartTime: number) {
        if (!this.isSynthPoolInitialized || this.synthPool.length === 0) return;

        const messages: any[] = [];
        notes.forEach((note, i) => {
            const voiceIndex = (this.nextSynthVoice + i) % this.synthPool.length;
            
            const frequency = midiToFreq(note.midi);
            const noteOnTime = barStartTime + note.time;
            const noteOffTime = noteOnTime + note.duration;
            const noteId = `${noteOnTime.toFixed(4)}-${note.midi}-${voiceIndex}`;
            
            const presetParams = PRESETS[this.activeInstrumentName] || PRESETS['synth'];

            const finalParams: BassSynthParams = {
                cutoff: note.params?.cutoff ?? presetParams.filterCutoff ?? 800,
                resonance: note.params?.resonance ?? presetParams.q ?? 0.5,
                distortion: note.params?.distortion ?? presetParams.distortion ?? 0.1,
                portamento: note.params?.portamento ?? presetParams.portamento ?? 0,
                attack: note.params?.attack ?? presetParams.attack ?? 0.02,
                release: note.params?.release ?? presetParams.release ?? 0.3,
            };

            messages.push({
                type: 'noteOn',
                frequency,
                velocity: note.velocity,
                when: noteOnTime,
                noteId,
                params: finalParams
            });
            messages.push({
                type: 'noteOff',
                noteId,
                when: noteOffTime
            });
        });

        if (messages.length > 0) {
             // Send all messages for the bar in a single batch
             this.synthPool.forEach(voice => voice.worklet.port.postMessage(messages));
             this.nextSynthVoice = (this.nextSynthVoice + notes.length) % this.synthPool.length;
        }
    }

    public setInstrument(instrumentName: MelodyInstrument | AccompanimentInstrument) {
        if (!this.isInitialized) {
            console.warn('[AccompanimentManager] setInstrument called before initialization.');
            return;
        }
        console.log(`[AccompanimentManager] Setting active instrument to: ${instrumentName}`);
        this.activeInstrumentName = instrumentName;

        const isSampler = ['piano', 'violin', 'flute', 'guitarChords', 'acousticGuitarSolo'].includes(instrumentName);
        const synthIsActive = !isSampler && instrumentName !== 'none';
        
        const balance = VOICE_BALANCE['accompaniment'] || 0.7;

        this.piano.setVolume(instrumentName === 'piano' ? balance : 0);
        this.violin.setVolume(instrumentName === 'violin' ? balance : 0);
        this.flute.setVolume(instrumentName === 'flute' ? balance : 0);
        this.guitarChords.setVolume(instrumentName === 'guitarChords' ? balance : 0);
        this.acousticGuitarSolo.setVolume(instrumentName === 'acousticGuitarSolo' ? balance : 0);

        this.synthOutput.gain.setTargetAtTime(synthIsActive ? balance : 0, this.audioContext.currentTime, 0.01);
    }

    public allNotesOff() {
        this.piano.stopAll();
        this.violin.stopAll();
        this.flute.stopAll();
        this.guitarChords.stopAll();
        this.acousticGuitarSolo.stopAll();
        this.synthPool.forEach(voice => {
            if (voice.worklet.port) {
                 voice.worklet.port.postMessage([{ type: 'clear' }]);
            }
        });
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
        this.piano.dispose();
        this.violin.dispose();
        this.flute.dispose();
        this.guitarChords.dispose();
        this.acousticGuitarSolo.dispose();
        this.synthPool.forEach(voice => voice.worklet.disconnect());
        this.synthOutput.disconnect();
    }
}
