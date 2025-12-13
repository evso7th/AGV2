

import type { FractalEvent, AccompanimentInstrument } from '@/types/fractal';
import type { Note } from "@/types/music";
import { SYNTH_PRESETS, type SynthPreset } from './synth-presets';


function midiToFreq(midi: number): number {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

type SynthVoice = {
    envGain: GainNode;
    filter: BiquadFilterNode;
    lfo: OscillatorNode;
    lfoGain: GainNode;
    distortion: WaveShaperNode | null;
    panner: StereoPannerNode;
    oscillators: OscillatorNode[];
    isActive: boolean;
};

/**
 * Manages multiple synth voices for the accompaniment part using native AudioNodes.
 * This approach avoids worklets for maximum performance and compatibility.
 */
export class AccompanimentSynthManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private activeInstrumentName: AccompanimentInstrument | 'none' = 'organ';
    public isInitialized = false;

    private voicePool: SynthVoice[] = [];
    private nextVoice = 0;
    private preamp: GainNode;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.0;
        this.preamp.connect(this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[AccompManager] Initializing native synth voices...');
        this.initVoicePool(8);
        this.isInitialized = true;
        console.log('[AccompManager] Native voices initialized.');
    }

    private initVoicePool(poolSize: number) {
        for (let i = 0; i < poolSize; i++) {
            const envGain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            const panner = this.audioContext.createStereoPanner();
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();

            lfo.connect(lfoGain);
            lfo.start();

            envGain.connect(filter).connect(panner).connect(this.preamp);
            envGain.gain.value = 0;

            this.voicePool.push({
                envGain,
                filter,
                panner,
                lfo,
                lfoGain,
                distortion: null,
                oscillators: [],
                isActive: false,
            });
        }
    }

    public schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: AccompanimentInstrument, composerControlsInstruments: boolean = true) {
        if (!this.isInitialized) return;

        const instrumentToPlay = (composerControlsInstruments && instrumentHint) ? instrumentHint : this.activeInstrumentName;
        
        if (instrumentToPlay === 'none' || !(instrumentToPlay in SYNTH_PRESETS)) {
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
        const preset = SYNTH_PRESETS[instrumentName];
        if (!preset) {
            console.warn(`[AccompManager] Synth preset not found: ${instrumentName}`);
            return;
        }

        for (const note of notes) {
            const voice = this.voicePool[this.nextVoice % this.voicePool.length];
            this.nextVoice++;

            this.triggerVoice(voice, note, preset, barStartTime);
        }
    }
    
    private triggerVoice(voice: SynthVoice, note: Note, preset: SynthPreset, barStartTime: number) {
        const now = this.audioContext.currentTime;
        const noteOnTime = barStartTime + note.time;
        const noteOffTime = noteOnTime + note.duration;

        if (noteOnTime < now) {
            console.warn("[AccompManager] Attempted to schedule a note in the past. Skipping.");
            return;
        }

        voice.isActive = true;
        
        // --- CONFIGURE ---
        voice.filter.type = preset.filter.type;
        voice.filter.Q.value = preset.filter.q;
        voice.filter.frequency.setValueAtTime(preset.filter.cutoff, noteOnTime);
        
        // LFO
        if (preset.lfo.amount > 0) {
            voice.lfo.type = preset.lfo.shape;
            voice.lfo.frequency.setValueAtTime(preset.lfo.rate, noteOnTime);
            voice.lfoGain.gain.setValueAtTime(preset.lfo.target === 'pitch' ? preset.lfo.amount : preset.lfo.amount * 1000, noteOnTime); // Scale for filter
        }

        // --- ADSR ENVELOPE on Gain ---
        const gainParam = voice.envGain.gain;
        const velocity = note.velocity ?? 0.7;
        const peakGain = velocity * 0.5; // Avoid clipping
        
        gainParam.cancelScheduledValues(noteOnTime);
        gainParam.setValueAtTime(0, noteOnTime);
        gainParam.linearRampToValueAtTime(peakGain, noteOnTime + preset.adsr.attack);
        gainParam.setTargetAtTime(peakGain * preset.adsr.sustain, noteOnTime + preset.adsr.attack, preset.adsr.decay / 3 + 0.001);
        gainParam.setTargetAtTime(0, noteOffTime, preset.adsr.release / 3 + 0.001);

        // --- OSCILLATORS ---
        voice.oscillators = [];
        const baseFrequency = midiToFreq(note.midi);
        
        preset.layers.forEach(layer => {
            const osc = this.audioContext.createOscillator();
            const detuneFactor = Math.pow(2, layer.detune / 1200);
            const octaveFactor = Math.pow(2, layer.octave);
            osc.frequency.value = baseFrequency * detuneFactor * octaveFactor;
            osc.type = layer.type;

            const oscGain = this.audioContext.createGain();
            oscGain.gain.value = layer.gain;
            
            osc.connect(oscGain).connect(voice.envGain);

            // Connect LFO if target is pitch
            if (preset.lfo.target === 'pitch' && preset.lfo.amount > 0) {
                voice.lfoGain.connect(osc.detune);
            }
            
            osc.start(noteOnTime);
            osc.stop(noteOffTime + preset.adsr.release + 0.5); // Stop after release
            voice.oscillators.push(osc);
        });

        // --- CLEANUP ---
        setTimeout(() => {
            voice.isActive = false;
            voice.oscillators.forEach(osc => {
                 if (voice.lfo.numberOfOutputs > 0 && preset.lfo.target === 'pitch') {
                    voice.lfoGain.disconnect(osc.detune);
                }
                osc.disconnect();
            });
            voice.oscillators = [];
        }, (noteOffTime - now + preset.adsr.release + 1.0) * 1000);
    }

    public setInstrument(instrumentName: AccompanimentInstrument | 'none') {
        if (!this.isInitialized) {
            console.warn('[AccompManager] setInstrument called before initialization.');
            return;
        }
        this.activeInstrumentName = instrumentName;
    }
    
    public setPreampGain(gain: number) {
      if (this.preamp) {
        this.preamp.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.01);
      }
    }

    public allNotesOff() {
        this.voicePool.forEach(voice => {
            if (voice.isActive) {
                voice.envGain.gain.cancelScheduledValues(this.audioContext.currentTime);
                voice.envGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.05); // Quick fade out
                voice.oscillators.forEach(osc => {
                    try { osc.stop(this.audioContext.currentTime + 0.1); } catch (e) {}
                });
                voice.isActive = false;
            }
        });
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
        this.voicePool.forEach(voice => {
            voice.lfo.disconnect();
            voice.envGain.disconnect();
            voice.filter.disconnect();
            voice.panner.disconnect();
        });
        this.preamp.disconnect();
    }
}
