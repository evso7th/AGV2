

// PLAN 1.1 Correction: This file was modified to ensure robust parameter handling.
// The logic now ensures that even if an unknown instrument is requested,
// it gracefully defaults to a 'synth' preset instead of failing.
import type { FractalEvent, MelodyInstrument, AccompanimentInstrument, BassSynthParams } from '@/types/fractal';
import type { Note, WorkerSettings } from "@/types/music";
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
    private activeInstrumentName: AccompanimentInstrument | 'none' = 'synth';
    public isInitialized = false;

    // Synth Instruments (Worklet-based pool)
    private synthPool: SynthVoice[] = [];
    private synthOutput: GainNode;
    private preamp: GainNode; // Pre-amplifier for the synth section
    private isSynthPoolInitialized = false;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.synthOutput = this.audioContext.createGain();
        this.synthOutput.connect(this.destination);

        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.4; // PLAN-90: Final volume calibration
        this.preamp.connect(this.synthOutput);
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
            // We only need ONE chord processor, as it handles polyphony internally.
            const worklet = new AudioWorkletNode(this.audioContext, 'chord-processor', {
                processorOptions: { sampleRate: this.audioContext.sampleRate },
                outputChannelCount: [2]
            });
            worklet.connect(this.preamp);
            this.synthPool.push({ worklet });
            
            this.isSynthPoolInitialized = true;
            console.log('[AccompManager] Synth pool initialized with a single chord processor.');
        } catch (e) {
            console.error('[AccompManager] Failed to init synth pool:', e);
        }
    }

    public schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: AccompanimentInstrument, composerControlsInstruments: boolean = true, lfoEnabled: boolean = true) {
        if (!this.isInitialized) {
            console.warn('[AccompManager] Tried to schedule before initialized.');
            return;
        }

        const instrumentToPlay = (composerControlsInstruments && instrumentHint) ? instrumentHint : this.activeInstrumentName;
        
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

        this.scheduleSynth(instrumentToPlay as Exclude<AccompanimentInstrument, 'piano' | 'violin' | 'flute' | 'guitarChords' | 'acousticGuitarSolo' | 'none'>, notes, barStartTime, lfoEnabled);
    }

    private scheduleSynth(instrumentName: keyof typeof SYNTH_PRESETS, notes: Note[], barStartTime: number, lfoEnabled: boolean) {
        if (!this.isSynthPoolInitialized || this.synthPool.length === 0) return;

        let preset = SYNTH_PRESETS[instrumentName];
        if (!preset) {
            console.warn(`[AccompManager] Synth preset not found for: ${instrumentName}. Using default 'synth'.`);
            instrumentName = 'synth';
            preset = SYNTH_PRESETS[instrumentName];
        }

        const workletNode = this.synthPool[0]?.worklet;
        if (!workletNode) return;

        const messages: any[] = [];
        
        const notesByTime = new Map<number, Note[]>();
        for (const note of notes) {
            const timeKey = Math.round(note.time * 1000);
            if (!notesByTime.has(timeKey)) {
                notesByTime.set(timeKey, []);
            }
            notesByTime.get(timeKey)!.push(note);
        }

        for (const noteGroup of notesByTime.values()) {
            let strumOffset = 0;
            for (const note of noteGroup) {
                const humanizedTime = note.time + strumOffset;
                const noteOnTime = barStartTime + humanizedTime;
                const noteOffTime = noteOnTime + note.duration;
                const noteId = `${noteOnTime.toFixed(4)}-${note.midi}`;
                const frequency = midiToFreq(note.midi);
                
                const paramsToUse = { ...preset };

                if (!lfoEnabled) {
                    paramsToUse.lfo = { ...paramsToUse.lfo, amount: 0 };
                }

                const finalFlatParams = {
                    ...paramsToUse.adsr,
                    ...paramsToUse.filter,
                    layers: paramsToUse.layers,
                    lfo: paramsToUse.lfo,
                    effects: paramsToUse.effects,
                    portamento: paramsToUse.portamento
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
                
                strumOffset += (Math.random() * 0.008) + 0.002; // 2ms to 10ms
            }
        }
        
        if (messages.length > 0) {
            workletNode.port.postMessage(messages);
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
