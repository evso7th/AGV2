

import type { FractalEvent, AccompanimentInstrument } from '@/types/fractal';
import type { Note } from "@/types/music";
import { SYNTH_PRESETS, type SynthPreset } from './synth-presets';


function midiToFreq(midi: number): number {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

type SynthVoice = {
    envGain: GainNode;
    filter: BiquadFilterNode;
    dryGain: GainNode;
    wetGain: GainNode;
    delayNode: DelayNode;
    feedbackGain: GainNode;
    chorusDelayNode: DelayNode;
    chorusLfo: OscillatorNode;
    chorusLfoGain: GainNode;
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
        this.initVoicePool(12); // Increased pool size for longer releases
        this.isInitialized = true;
        console.log('[AccompManager] Native voices initialized.');
    }

    private initVoicePool(poolSize: number) {
        for (let i = 0; i < poolSize; i++) {
            const envGain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            const panner = this.audioContext.createStereoPanner();
            
            // Effect chain nodes
            const dryGain = this.audioContext.createGain();
            const wetGain = this.audioContext.createGain();
            const delayNode = this.audioContext.createDelay(1.0);
            const feedbackGain = this.audioContext.createGain();
            const chorusLfo = this.audioContext.createOscillator();
            const chorusLfoGain = this.audioContext.createGain();
            const chorusDelayNode = this.audioContext.createDelay(0.1);

            // Start LFO for chorus
            chorusLfo.connect(chorusLfoGain);
            chorusLfoGain.connect(chorusDelayNode.delayTime);
            chorusLfo.start();

            // Main signal path
            envGain.connect(filter);

            // Dry/Wet path for effects
            filter.connect(dryGain);
            filter.connect(wetGain);
            
            dryGain.connect(panner);

            // Wet path: Chorus -> Delay -> Panner
            wetGain.connect(chorusDelayNode).connect(delayNode).connect(panner);

            // Delay feedback loop
            delayNode.connect(feedbackGain);
            feedbackGain.connect(delayNode);
            
            // Final output
            panner.connect(this.preamp);
            
            envGain.gain.value = 0;

            this.voicePool.push({
                envGain, filter, dryGain, wetGain, delayNode, feedbackGain,
                chorusDelayNode, chorusLfo, chorusLfoGain, panner,
                oscillators: [], isActive: false,
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
        }));

        this.scheduleSynth(instrumentToPlay as keyof typeof SYNTH_PRESETS, notes, barStartTime);
    }

    private scheduleSynth(instrumentName: keyof typeof SYNTH_PRESETS, notes: Note[], barStartTime: number) {
        const preset = SYNTH_PRESETS[instrumentName];
        if (!preset) return;

        for (const note of notes) {
            const voice = this.voicePool.find(v => !v.isActive) || this.voicePool[this.nextVoice % this.voicePool.length];
            this.nextVoice++;

            this.triggerVoice(voice, note, preset, barStartTime);
        }
    }
    
    private triggerVoice(voice: SynthVoice, note: Note, preset: SynthPreset, barStartTime: number) {
        const now = this.audioContext.currentTime;
        const noteOnTime = barStartTime + note.time;
        
        if (noteOnTime < now) {
            console.warn("[AccompManager] Attempted to schedule a note in the past. Skipping.");
            return;
        }

        voice.isActive = true;
        
        // --- CONFIGURE VOICE ---
        voice.filter.type = preset.filter.type;
        voice.filter.Q.value = preset.filter.q;
        voice.filter.frequency.setValueAtTime(preset.filter.cutoff, noteOnTime);
        
        const chorus = preset.effects.chorus;
        voice.chorusLfo.frequency.setValueAtTime(chorus.rate, noteOnTime);
        voice.chorusLfoGain.gain.setValueAtTime(chorus.depth, noteOnTime);

        const delay = preset.effects.delay;
        voice.delayNode.delayTime.setValueAtTime(delay.time, noteOnTime);
        voice.feedbackGain.gain.setValueAtTime(delay.feedback, noteOnTime);

        const wetMix = Math.max(chorus.mix, delay.mix);
        voice.wetGain.gain.setValueAtTime(wetMix, noteOnTime);
        voice.dryGain.gain.setValueAtTime(1.0 - wetMix, noteOnTime);

        // --- ADSR ENVELOPE (CORRECTED TIMING CALCULATION) ---
        const gainParam = voice.envGain.gain;
        const velocity = note.velocity ?? 0.7;
        const peakGain = velocity * 0.5;
        
        // --- Этап 1.1: Расчет корректных временных точек ---
        const attackEndTime = noteOnTime + preset.adsr.attack;
        const decayEndTime = attackEndTime + preset.adsr.decay;
        const noteOffTime = noteOnTime + note.duration;
        const releaseEndTime = noteOffTime + preset.adsr.release;

        // --- Этап 1.2: Будет реализован на следующем шаге ---
        // Пока используется старая, некорректная логика
        gainParam.cancelScheduledValues(noteOnTime);
        gainParam.setValueAtTime(0, noteOnTime);
        gainParam.linearRampToValueAtTime(peakGain, noteOnTime + preset.adsr.attack);
        gainParam.setTargetAtTime(peakGain * preset.adsr.sustain, noteOnTime + preset.adsr.attack, preset.adsr.decay / 3 + 0.001); // Incorrect but kept for now
        gainParam.setTargetAtTime(0, noteOnTime + note.duration, preset.adsr.release / 3 + 0.001); // Incorrect but kept for now

        
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
            
            if (preset.lfo.target === 'pitch' && preset.lfo.amount > 0) {
                 const lfo = this.audioContext.createOscillator();
                 lfo.frequency.value = preset.lfo.rate;
                 const lfoGain = this.audioContext.createGain();
                 lfoGain.gain.value = preset.lfo.amount;
                 lfo.connect(lfoGain).connect(osc.detune);
                 lfo.start(noteOnTime);
                 lfo.stop(releaseEndTime + 0.1);
            }
            
            osc.start(noteOnTime);
            osc.stop(releaseEndTime + 0.1); 
            voice.oscillators.push(osc);
        });

        // --- CLEANUP ---
        setTimeout(() => {
            voice.isActive = false;
            voice.oscillators.forEach(osc => osc.disconnect());
            voice.oscillators = [];
        }, (releaseEndTime - now + 0.2) * 1000);
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
            voice.envGain.disconnect();
            voice.filter.disconnect();
            voice.panner.disconnect();
            voice.dryGain.disconnect();
            voice.wetGain.disconnect();
            voice.delayNode.disconnect();
            voice.feedbackGain.disconnect();
            voice.chorusDelayNode.disconnect();
            voice.chorusLfo.disconnect();
            voice.chorusLfoGain.disconnect();
        });
        this.preamp.disconnect();
    }
}
