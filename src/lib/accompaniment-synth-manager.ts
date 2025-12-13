

import type { FractalEvent, MelodyInstrument, AccompanimentInstrument, BassSynthParams } from '@/types/fractal';
import type { Note } from "@/types/music";
import { SYNTH_PRESETS, type SynthPreset } from './synth-presets';


function midiToFreq(midi: number): number {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

type SynthVoice = {
    worklet: AudioWorkletNode;
    gain: GainNode;
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
    private nextSynthVoice = 0;
    private isSynthPoolInitialized = false;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.synthOutput = this.audioContext.createGain();
        this.synthOutput.connect(this.destination);
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
            for (let i = 0; i < 8; i++) {
                const worklet = new AudioWorkletNode(this.audioContext, 'chord-processor', {
                    processorOptions: { sampleRate: this.audioContext.sampleRate },
                    outputChannelCount: [2]
                });
                const gain = this.audioContext.createGain();
                gain.gain.value = 0; // Start silent
                worklet.connect(gain);
                gain.connect(this.synthOutput);
                this.synthPool.push({ worklet, gain });
            }
            this.isSynthPoolInitialized = true;
            console.log('[AccompManager] Synth pool initialized with 8 voices (Worklet + GainNode).');
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
        
        console.log(`[AccompManager] schedule called. Control: ${composerControlsInstruments}, Hint: ${instrumentHint}, Active: ${this.activeInstrumentName}. Will play: ${instrumentToPlay}`);

        if (instrumentToPlay === 'none' || !['synth', 'organ', 'mellotron', 'theremin', 'E-Bells_melody', 'G-Drops', 'electricGuitar', 'ambientPad'].includes(instrumentToPlay)) {
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
        if (!preset) {
            console.warn(`[AccompManager] Synth preset not found for: ${instrumentName}. Using default 'synth'.`);
            instrumentName = 'synth';
            preset = SYNTH_PRESETS[instrumentName];
        }

        for (const note of notes) {
            const voice = this.synthPool[this.nextSynthVoice % this.synthPool.length];
            this.nextSynthVoice++;
            
            if (voice && voice.worklet && voice.worklet.port) {
                const noteId = `${barStartTime + note.time}-${note.midi}`;
                const frequency = midiToFreq(note.midi);
                
                const noteOnTime = barStartTime + note.time;
                const noteOffTime = noteOnTime + note.duration;
                
                const paramsToUse = preset;
                const { adsr, filter, layers, lfo, effects } = paramsToUse;

                // --- ADSR Automation via GainNode ---
                const gainParam = voice.gain.gain;
                const peakLevel = (note.velocity ?? 0.7) * 0.7; // Global volume reduction
                
                gainParam.cancelScheduledValues(noteOnTime);
                gainParam.setValueAtTime(0, noteOnTime);
                // Attack
                gainParam.linearRampToValueAtTime(peakLevel, noteOnTime + adsr.attack);
                // Decay to Sustain
                gainParam.setTargetAtTime(peakLevel * adsr.sustain, noteOnTime + adsr.attack, adsr.decay / 4); // time-constant for decay
                // Release
                gainParam.setTargetAtTime(0.0001, noteOffTime, adsr.release / 4); // time-constant for release

                // --- Send messages to Worklet ---
                const workletParams = {
                    filter,
                    layers,
                    lfo,
                    effects,
                };
                
                const noteOnMessage = {
                    type: 'noteOn',
                    noteId,
                    frequency,
                    params: workletParams
                };
                
                const noteOffMessage = {
                    type: 'noteOff',
                    noteId: noteId
                };

                voice.worklet.port.postMessage({ ...noteOnMessage, when: noteOnTime });
                voice.worklet.port.postMessage({ ...noteOffMessage, when: noteOffTime });
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
      // This is now handled by the per-voice gain nodes.
      // We could apply a global multiplier here if needed.
      this.synthOutput.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.01);
    }

    public allNotesOff() {
        this.synthPool.forEach(voice => {
            if (voice && voice.worklet && voice.worklet.port) {
                 voice.worklet.port.postMessage({ type: 'clear' });
                 voice.gain.gain.cancelScheduledValues(this.audioContext.currentTime);
                 voice.gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            }
        });
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
        this.synthPool.forEach(voice => {
            voice.worklet.disconnect();
            voice.gain.disconnect();
        });
        this.synthOutput.disconnect();
    }
}
