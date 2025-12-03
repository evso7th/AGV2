

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

    // Synth Instruments (Worklet-based pool)
    private synthPool: SynthVoice[] = [];
    private synthOutput: GainNode;
    private preamp: GainNode; // Pre-amplifier for the synth section
    private nextSynthVoice = 0;
    private isSynthPoolInitialized = false;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.synthOutput = this.audioContext.createGain();
        this.synthOutput.connect(this.destination);

        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 2.8; // Doubled from 1.4 to compensate for filter volume loss
        this.preamp.connect(this.synthOutput);
        this.nextSynthVoice = 0;
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[AccompManager] Initializing all instruments...');

        await this.initSynthPool();

        this.isInitialized = true;
        console.log('[AccompManager] All instruments initialized.');
    }

    private async initSynthPool() {
        if (this.isSynthPoolInitialized) return;
        try {
            await this.audioContext.audioWorklet.addModule('/worklets/chord-processor.js');
            for (let i = 0; i < 8; i++) { // Increased pool size to 8
                const worklet = new AudioWorkletNode(this.audioContext, 'chord-processor', {
                    processorOptions: { sampleRate: this.audioContext.sampleRate },
                    outputChannelCount: [2]
                });
                worklet.connect(this.preamp);
                this.synthPool.push({ worklet });
            }
            this.isSynthPoolInitialized = true;
            console.log('[AccompManager] Synth pool initialized with 8 voices.');
        } catch (e) {
            console.error('[AccompManager] Failed to init synth pool:', e);
        }
    }

    public schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: AccompanimentInstrument, composerControlsInstruments: boolean = true) {
        if (!this.isInitialized) {
            console.warn('[AccompManager] Tried to schedule before initialized.');
            return;
        }

        const instrumentToPlay = (composerControlsInstruments && instrumentHint) ? instrumentHint : this.activeInstrumentName;
        
        // GUARD CLAUSE
        if (instrumentToPlay === 'none' || !SYNTH_PRESETS.hasOwnProperty(instrumentToPlay)) {
            if (instrumentToPlay !== 'none') {
                // This logs when a sampler instrument is incorrectly routed here. It's a non-critical info message.
                // console.log(`[AccompManager] Instrument "${instrumentToPlay}" is not a synth preset. Skipping.`);
            }
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
        if (!this.isSynthPoolInitialized || this.synthPool.length === 0) return;

        let preset = SYNTH_PRESETS[instrumentName];
      
        for (const note of notes) {
            const voice = this.synthPool[this.nextSynthVoice % this.synthPool.length];
            this.nextSynthVoice++;
            if (voice && voice.worklet && voice.worklet.port) {
                const noteId = `${barStartTime + note.time}-${note.midi}`;
                const frequency = midiToFreq(note.midi);
                
                const noteOnTime = barStartTime + note.time;
                const noteOffTime = noteOnTime + note.duration;
                
                const paramsToUse = preset;

                const finalFlatParams = {
                    ...paramsToUse.adsr,
                    ...paramsToUse.filter,
                    layers: paramsToUse.layers,
                    lfo: paramsToUse.lfo,
                    effects: paramsToUse.effects,
                    portamento: paramsToUse.portamento
                };

                const message = {
                    type: 'noteOn',
                    noteId,
                    frequency,
                    velocity: note.velocity,
                    when: noteOnTime,
                    params: finalFlatParams
                };
                
                voice.worklet.port.postMessage(message);
                
                voice.worklet.port.postMessage({
                    type: 'noteOff',
                    noteId: noteId,
                    when: noteOffTime
                });
            }
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
        // No volume changes needed here anymore, as `schedule` handles routing.
    }
    
    public setPreampGain(gain: number) {
      if (this.preamp) {
        this.preamp.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.01);
      }
    }

    public allNotesOff() {
        this.synthPool.forEach(voice => {
            if (voice && voice.worklet && voice.worklet.port) {
                 voice.worklet.port.postMessage({ type: 'clear' });
            }
        });
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
        this.synthPool.forEach(voice => voice.worklet.disconnect());
        this.preamp.disconnect();
        this.synthOutput.disconnect();
    }
}
