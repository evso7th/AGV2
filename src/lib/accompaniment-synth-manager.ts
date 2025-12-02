

import type { FractalEvent, MelodyInstrument, AccompanimentInstrument, BassSynthParams } from '@/types/fractal';
import type { Note } from "@/types/music";
import { SYNTH_PRESETS, type SynthPreset } from './synth-presets';


function midiToFreq(midi: number): number {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

type SynthVoice = {
    worklet: AudioWorkletNode;
};

/**
 * Manages multiple instruments for the accompaniment part.
 * Acts as an orchestrator, directing musical events to the currently active instrument,
 * which can be a sampler (piano, guitar, etc.) or a synth.
 */
export class AccompanimentSynthManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private activeInstrumentName: AccompanimentInstrument | 'none' = 'organ';
    public isInitialized = false;

    // Synth Instruments (Worklet-based)
    private worklet: AudioWorkletNode | null = null;
    private synthOutput: GainNode;
    private preamp: GainNode; // Pre-amplifier for the synth section

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.synthOutput = this.audioContext.createGain();
        this.synthOutput.connect(this.destination);

        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.4; // Final volume calibration
        this.preamp.connect(this.synthOutput);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[AccompManager] Initializing...');

        try {
            await this.audioContext.audioWorklet.addModule('/worklets/chord-processor.js');
            this.worklet = new AudioWorkletNode(this.audioContext, 'chord-processor', {
                processorOptions: { sampleRate: this.audioContext.sampleRate },
                outputChannelCount: [2]
            });
            this.worklet.connect(this.preamp);
            this.isInitialized = true;
            console.log('[AccompManager] Initialized.');
        } catch (e) {
            console.error('[AccompManager] Failed to init synth pool:', e);
        }
    }

    public schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: AccompanimentInstrument, composerControlsInstruments: boolean = true) {
        if (!this.isInitialized || !this.worklet) {
            console.warn('[AccompManager] Tried to schedule before initialized.');
            return;
        }

        const instrumentToPlay = (composerControlsInstruments && instrumentHint) ? instrumentHint : this.activeInstrumentName;
        
        console.log(`[AccompManager] schedule called. Control: ${composerControlsInstruments}, Hint: ${instrumentHint}, Active: ${this.activeInstrumentName}. Will play: ${instrumentToPlay}`);

        if (instrumentToPlay === 'none') {
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

        this.scheduleSynth(instrumentToPlay as Exclude<AccompanimentInstrument, 'piano' | 'violin' | 'flute' | 'guitarChords' | 'acousticGuitarSolo' | 'none'>, notes, barStartTime);
    }

    private scheduleSynth(instrumentName: keyof typeof SYNTH_PRESETS, notes: Note[], barStartTime: number) {
        if (!this.worklet) return;

        let preset = SYNTH_PRESETS[instrumentName];
        if (!preset) {
            console.warn(`[AccompManager] Synth preset not found for: ${instrumentName}. Using default 'synth'.`);
            instrumentName = 'synth';
            preset = SYNTH_PRESETS[instrumentName];
        }

        const messages: any[] = [];

        for (const note of notes) {
            const noteId = `${barStartTime + note.time}-${note.midi}`;
            const frequency = midiToFreq(note.midi);
            
            const noteOnTime = barStartTime + note.time;
            const noteOffTime = noteOnTime + note.duration;
            
            // We create a flat object of parameters to send to the worklet.
            // The worklet now knows how to read both the old flat format and the new structured format.
            const finalFlatParams = {
                ...preset.adsr,
                ...preset.filter,
                layers: preset.layers,
                lfo: preset.lfo,
                effects: preset.effects,
                portamento: preset.portamento
            };

            messages.push({
                type: 'noteOn',
                noteId,
                frequency,
                velocity: note.velocity,
                when: noteOnTime,
                params: finalFlatParams
            });
            
            messages.push({
                type: 'noteOff',
                noteId: noteId,
                when: noteOffTime
            });
        }
        if (messages.length > 0) {
            this.worklet.port.postMessage(messages);
        }
    }
    
    /**
     * Sets the active instrument for the accompaniment part.
     */
    public setInstrument(instrumentName: AccompanimentInstrument | 'none') {
        if (!this.isInitialized) {
            console.warn('[AccompManager] setInstrument called before initialization.');
            return;
        }
        console.log(`[AccompManager] Setting active instrument to: ${instrumentName}`);
        this.activeInstrumentName = instrumentName;
    }
    
    public setPreampGain(gain: number) {
      if (this.preamp) {
        this.preamp.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.01);
      }
    }

    public allNotesOff() {
        if (this.worklet) {
            this.worklet.port.postMessage({ type: 'clear' });
        }
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
        if (this.worklet) {
            this.worklet.disconnect();
        }
        this.preamp.disconnect();
        this.synthOutput.disconnect();
    }
}
