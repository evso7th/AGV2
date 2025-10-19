
import type { FractalEvent, MelodyInstrument, AccompanimentInstrument } from "@/types/fractal";
import type { Note } from "@/types/music";
import * as Tone from 'tone';
import { SamplerPlayer } from './sampler-player';
import { ViolinSamplerPlayer } from './violin-sampler-player';
import { FluteSamplerPlayer } from './flute-sampler-player';
import { GuitarChordsSampler } from './guitar-chords-sampler';
import { AcousticGuitarSoloSampler } from './acoustic-guitar-solo-sampler';
import { PIANO_SAMPLES, VIOLIN_SAMPLES, FLUTE_SAMPLES, ACOUSTIC_GUITAR_CHORD_SAMPLES, ACOUSTIC_GUITAR_SOLO_SAMPLES } from './samples';

function midiToFreq(midi: number): number {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

type SynthVoice = {
    worklet: AudioWorkletNode;
    isBusy: boolean;
    noteId: string | null;
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
    private nextSynthVoice = 0;
    private isSynthPoolInitialized = false;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.piano = new SamplerPlayer(audioContext, destination);
        this.violin = new ViolinSamplerPlayer(audioContext, destination);
        this.flute = new FluteSamplerPlayer(audioContext, destination);
        this.guitarChords = new GuitarChordsSampler(audioContext, destination);
        this.acousticGuitarSolo = new AcousticGuitarSoloSampler(audioContext, destination);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[AccompanimentManager] Initializing all instruments...');

        await Promise.all([
            this.piano.loadInstrument('piano', PIANO_SAMPLES),
            this.violin.loadInstrument('violin', VIOLIN_SAMPLES),
            this.flute.loadInstrument('flute', FLUTE_SAMPLES),
            this.guitarChords.init(),
            this.acousticGuitarSolo.loadInstrument('acousticGuitarSolo', ACOUSTIC_GUITAR_SOLO_SAMPLES),
            this.initSynthPool()
        ]);

        this.isInitialized = true;
        console.log('[AccompanimentManager] All instruments initialized.');
    }

    private async initSynthPool() {
        if (this.isSynthPoolInitialized) return;
        try {
            await this.audioContext.audioWorklet.addModule('/worklets/bass-processor.js');
            for (let i = 0; i < 4; i++) {
                const worklet = new AudioWorkletNode(this.audioContext, 'bass-processor', {
                    processorOptions: { sampleRate: this.audioContext.sampleRate }
                });
                worklet.connect(this.destination);
                this.synthPool.push({ worklet, isBusy: false, noteId: null });
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

        const notes: Note[] = events.map(event => {
            const beatDuration = 60 / tempo;
            return {
                midi: event.note,
                time: event.time * beatDuration,
                duration: event.duration * beatDuration,
                velocity: event.weight,
                params: event.params
            };
        });

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
                this.acousticGuitarSolo.schedule('acousticGuitarSolo', notes, barStartTime);
                break;
            case 'electricGuitar': // Fallthrough to synth for now
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
                console.warn(`[AccompanimentManager] Preset not handled: ${this.activeInstrumentName}`);
        }
    }

    private scheduleSynth(notes: Note[], barStartTime: number) {
        if (!this.isSynthPoolInitialized || this.synthPool.length === 0) return;

        const messages: any[] = [];

        notes.forEach((note, i) => {
            const voice = this.synthPool[this.nextSynthVoice % this.synthPool.length];
            this.nextSynthVoice++;
            
            const frequency = midiToFreq(note.midi);
            const noteOnTime = barStartTime + note.time;
            const noteOffTime = noteOnTime + note.duration;
            const noteId = `${noteOnTime}-${note.midi}-${i}`;

            messages.push({
                type: 'noteOn',
                frequency,
                velocity: note.velocity,
                when: noteOnTime,
                noteId: noteId,
                params: note.params
            });
            messages.push({
                type: 'noteOff',
                noteId: noteId,
                when: noteOffTime
            });
        });

        if (messages.length > 0) {
            // Since each voice is a separate worklet, we need to send messages to the correct one.
            // For now, let's just blast it to all of them, the noteId will ensure only the correct notes are played/stopped.
            // A more sophisticated routing could be implemented if needed.
             this.synthPool.forEach(voice => {
                if (voice.worklet.port) {
                    voice.worklet.port.postMessage(messages);
                }
            });
        }
    }

    public setPreset(instrumentName: MelodyInstrument | AccompanimentInstrument) {
        console.log(`[AccompanimentManager] Setting preset to: ${instrumentName}`);
        this.activeInstrumentName = instrumentName;
        
        // Mute all other instruments and unmute the selected one
        const instruments = [this.piano, this.violin, this.flute, this.guitarChords, this.acousticGuitarSolo];
        const synthIsActive = !['piano', 'violin', 'flute', 'guitarChords', 'acousticGuitarSolo', 'none'].includes(instrumentName);
        
        this.piano.setVolume(instrumentName === 'piano' ? 1 : 0);
        this.violin.setVolume(instrumentName === 'violin' ? 1 : 0);
        this.flute.setVolume(instrumentName === 'flute' ? 1 : 0);
        this.guitarChords.setVolume(instrumentName === 'guitarChords' ? 1 : 0);
        this.acousticGuitarSolo.setVolume(instrumentName === 'acousticGuitarSolo' ? 1 : 0);

        // Control synth pool volume
        this.synthPool.forEach(voice => {
             const gainParam = (voice.worklet as any).parameters.get('gain'); // Assuming gain is a registered parameter
             if (gainParam) {
                 gainParam.setTargetAtTime(synthIsActive ? 1 : 0, this.audioContext.currentTime, 0.01);
             } else if (this.destination instanceof GainNode) {
                // Fallback to the manager's output gain if the worklet doesn't have one
                this.destination.gain.setTargetAtTime(synthIsActive ? 1 : 0, this.audioContext.currentTime, 0.01);
             }
        });
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
    }
}
