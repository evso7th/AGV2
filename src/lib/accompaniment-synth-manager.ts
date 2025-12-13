

import type { FractalEvent, MelodyInstrument, AccompanimentInstrument, BassSynthParams } from '@/types/fractal';
import type { Note } from "@/types/music";
import { SYNTH_PRESETS, type SynthPreset } from './synth-presets';


function midiToFreq(midi: number): number {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

type SynthVoice = {
    worklet: AudioWorkletNode;
    gain: GainNode; // For ADSR envelope
    lfo: OscillatorNode; // For LFO modulation
    lfoGain: GainNode; // To control LFO depth
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
                    outputChannelCount: [2],
                     // Define custom AudioParams that can be modulated
                    parameterData: {
                        'cutoff': SYNTH_PRESETS.synth.filter.cutoff,
                        'q': SYNTH_PRESETS.synth.filter.q,
                        'lfoAmount': 0, // No modulation by default
                        'distortion': 0,
                    }
                });
                
                const gain = this.audioContext.createGain();
                gain.gain.value = 0;

                // Create LFO components for this voice
                const lfo = this.audioContext.createOscillator();
                const lfoGain = this.audioContext.createGain();
                lfo.connect(lfoGain);
                lfo.start(); // LFOs run continuously

                worklet.connect(gain);
                gain.connect(this.synthOutput);

                this.synthPool.push({ worklet, gain, lfo, lfoGain });
            }
            this.isSynthPoolInitialized = true;
            console.log('[AccompManager] Synth pool initialized with 8 voices (Worklet + Gain + LFO).');
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

        if (instrumentToPlay === 'none' || !Object.keys(SYNTH_PRESETS).includes(instrumentToPlay)) {
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

        this.scheduleSynth(instrumentToPlay as keyof typeof SYNTH_PRESETS, notes, barStartTime);
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
                const noteOnTime = barStartTime + note.time;
                const noteOffTime = noteOnTime + note.duration;
                
                // === 1. GET PARAMS FROM PRESET ===
                const { adsr, filter, layers, lfo, effects, portamento } = preset;

                // === 2. SETUP AUDIO PARAMS ON WORKLET ===
                const cutoffParam = voice.worklet.parameters.get('cutoff');
                const qParam = voice.worklet.parameters.get('q');
                const lfoAmountParam = voice.worklet.parameters.get('lfoAmount');
                const distortionParam = voice.worklet.parameters.get('distortion');

                if (!cutoffParam || !qParam || !lfoAmountParam || !distortionParam) {
                    console.error("A required AudioParam was not found on the worklet.");
                    continue;
                }
                
                // Reset any previous automations
                cutoffParam.cancelScheduledValues(noteOnTime);
                qParam.cancelScheduledValues(noteOnTime);
                lfoAmountParam.cancelScheduledValues(noteOnTime);
                distortionParam.cancelScheduledValues(noteOnTime);
                
                // Set initial values from preset
                cutoffParam.setValueAtTime(filter.cutoff, noteOnTime);
                qParam.setValueAtTime(filter.q, noteOnTime);
                distortionParam.setValueAtTime(effects.distortion, noteOnTime);

                // === 3. SETUP LFO (NATIVE) ===
                // Disconnect previous LFO target
                voice.lfoGain.disconnect();
                
                if (lfo && lfo.amount > 0) {
                    voice.lfo.type = lfo.shape;
                    voice.lfo.frequency.setValueAtTime(lfo.rate, noteOnTime);
                    
                    if (lfo.target === 'filter') {
                        lfoAmountParam.setValueAtTime(lfo.amount, noteOnTime); // Use a dedicated param for LFO amount
                        voice.lfoGain.connect(cutoffParam);
                    } else if (lfo.target === 'pitch') {
                        // Pitch modulation is still done in the worklet via postMessage
                        lfoAmountParam.setValueAtTime(0, noteOnTime); // ensure no filter mod
                    }
                } else {
                     lfoAmountParam.setValueAtTime(0, noteOnTime);
                }

                // === 4. SETUP ADSR ENVELOPE (NATIVE) ===
                const gainParam = voice.gain.gain;
                const peakLevel = (note.velocity ?? 0.7) * 0.5; // Global volume reduction for multiple voices
                
                gainParam.cancelScheduledValues(noteOnTime);
                gainParam.setValueAtTime(0, noteOnTime);
                gainParam.linearRampToValueAtTime(peakLevel, noteOnTime + adsr.attack);
                gainParam.setTargetAtTime(peakLevel * adsr.sustain, noteOnTime + adsr.attack, adsr.decay / 3 + 0.001); 
                gainParam.setTargetAtTime(0, noteOffTime, adsr.release / 3 + 0.001);
                
                // === 5. SEND NOTE-SPECIFIC INFO TO WORKLET (NON-MODULATABLE) ===
                const noteId = `${noteOnTime.toFixed(4)}-${note.midi}`;
                const frequency = midiToFreq(note.midi);

                const workletMessage = {
                    type: 'noteOn',
                    noteId,
                    frequency,
                    layers,
                    lfo: { ...lfo, target: lfo.target === 'pitch' ? 'pitch' : 'none' }, // Only send pitch LFO info
                    effects,
                    portamento: portamento || 0,
                    when: noteOnTime
                };
                
                voice.worklet.port.postMessage(workletMessage);
                
                voice.worklet.port.postMessage({
                    type: 'noteOff',
                    noteId: noteId,
                    when: noteOffTime
                });
            }
        }
    }
    
    public setInstrument(instrumentName: AccompanimentInstrument | 'none') {
        if (!this.isInitialized) {
            console.warn('[AccompManager] setInstrument called before initialization.');
            return;
        }
        console.log(`[AccompManager] Setting active instrument to: ${instrumentName}`);
        this.activeInstrumentName = instrumentName;
    }
    
    public setPreampGain(gain: number) {
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
            voice.lfo.disconnect();
            voice.lfoGain.disconnect();
        });
        this.synthOutput.disconnect();
    }
}
