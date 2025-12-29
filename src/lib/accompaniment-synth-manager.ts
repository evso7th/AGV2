
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
    soundSources: (OscillatorNode | AudioBufferSourceNode)[]; // ИЗМЕНЕНО: теперь может содержать и осцилляторы, и источники шума
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
    private noiseBuffer: AudioBuffer | null = null; // ДОБАВЛЕНО: буфер для белого шума

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
        this.createNoiseBuffer(); // ДОБАВЛЕНО: создаем буфер шума при инициализации
        this.initVoicePool(6); 
        this.isInitialized = true;
        console.log('[AccompManager] Native voices initialized.');
    }

    private createNoiseBuffer() {
        const bufferSize = this.audioContext.sampleRate; // 1 секунда шума
        this.noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    }

    private initVoicePool(poolSize: number) {
        for (let i = 0; i < poolSize; i++) {
            // ... (код инициализации голоса остается почти без изменений)
            const envGain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            const panner = this.audioContext.createStereoPanner();
            const dryGain = this.audioContext.createGain();
            const wetGain = this.audioContext.createGain();
            const delayNode = this.audioContext.createDelay(1.0);
            const feedbackGain = this.audioContext.createGain();
            const chorusLfo = this.audioContext.createOscillator();
            const chorusLfoGain = this.audioContext.createGain();
            const chorusDelayNode = this.audioContext.createDelay(0.1);

            chorusLfo.connect(chorusLfoGain);
            chorusLfoGain.connect(chorusDelayNode.delayTime);
            chorusLfo.start();

            envGain.connect(filter);
            filter.connect(dryGain);
            filter.connect(wetGain);
            dryGain.connect(panner);
            wetGain.connect(chorusDelayNode).connect(delayNode).connect(panner);
            delayNode.connect(feedbackGain);
            feedbackGain.connect(delayNode);
            panner.connect(this.preamp);
            envGain.gain.value = 0;

            this.voicePool.push({
                envGain, filter, dryGain, wetGain, delayNode, feedbackGain,
                chorusDelayNode, chorusLfo, chorusLfoGain, panner,
                soundSources: [], isActive: false, // ИЗМЕНЕНО: oscillators -> soundSources
            });
        }
    }

    public schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: AccompanimentInstrument, composerControlsInstruments: boolean = true) {
        if (!this.isInitialized) return;
        const instrumentToPlay = (composerControlsInstruments && instrumentHint) ? instrumentHint : this.activeInstrumentName;
        if (instrumentToPlay === 'none' || !(instrumentToPlay in SYNTH_PRESETS)) return;

        const beatDuration = 60 / tempo;
        const notes: Note[] = events.map(event => ({ midi: event.note, time: event.time * beatDuration, duration: event.duration * beatDuration, velocity: event.weight }));
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
        if (noteOnTime < now) return;

        voice.isActive = true;
        
        // --- CONFIGURE VOICE (Filter, Chorus, Delay) --- 
        // ... (этот блок без изменений)
        voice.filter.type = preset.filter.type === 'lpf' ? 'lowpass' : preset.filter.type === 'hpf' ? 'highpass' : preset.filter.type === 'bpf' ? 'bandpass' : 'notch';
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

        // --- ADSR ENVELOPE ---
        // ... (этот блок без изменений)
        const gainParam = voice.envGain.gain;
        const velocity = note.velocity ?? 0.7;
        const peakGain = velocity * 0.5;
        const attackEndTime = noteOnTime + preset.adsr.attack;
        const sustainValue = peakGain * preset.adsr.sustain;
        const decayEndTime = attackEndTime + preset.adsr.decay;
        const noteOffTime = noteOnTime + note.duration;
        const releaseEndTime = noteOffTime + preset.adsr.release;
        gainParam.cancelScheduledValues(noteOnTime);
        gainParam.setValueAtTime(0, noteOnTime);
        gainParam.linearRampToValueAtTime(peakGain, attackEndTime);
        gainParam.linearRampToValueAtTime(sustainValue, decayEndTime);
        gainParam.setValueAtTime(sustainValue, noteOffTime);
        gainParam.linearRampToValueAtTime(0, releaseEndTime);
        
        // --- SOUND SOURCES (Oscillators and Noise) ---
        voice.soundSources = [];
        const baseFrequency = midiToFreq(note.midi);
        
        preset.layers.forEach(layer => {
            let sourceNode: OscillatorNode | AudioBufferSourceNode;

            if (layer.type === 'noise') {
                // ИЗМЕНЕНО: Обработка слоя шума
                if (!this.noiseBuffer) return;
                const noiseSource = this.audioContext.createBufferSource();
                noiseSource.buffer = this.noiseBuffer;
                noiseSource.loop = true;
                sourceNode = noiseSource;
            } else {
                // Как и раньше, создаем осциллятор для тональных слоев
                const osc = this.audioContext.createOscillator();
                const detuneFactor = Math.pow(2, layer.detune / 1200);
                const octaveFactor = Math.pow(2, layer.octave);
                osc.frequency.value = baseFrequency * detuneFactor * octaveFactor;
                osc.type = layer.type as OscillatorType;
                sourceNode = osc;
                
                if (preset.lfo.target === 'pitch' && preset.lfo.amount > 0) {
                     const lfo = this.audioContext.createOscillator();
                     lfo.frequency.value = preset.lfo.rate;
                     const lfoGain = this.audioContext.createGain();
                     lfoGain.gain.value = preset.lfo.amount; // Direct cents value
                     lfo.connect(lfoGain).connect(osc.detune);
                     lfo.start(noteOnTime);
                     lfo.stop(releaseEndTime + 0.1);
                }
            }

            const sourceGain = this.audioContext.createGain();
            sourceGain.gain.value = layer.gain;
            
            sourceNode.connect(sourceGain).connect(voice.envGain);
            
            sourceNode.start(noteOnTime);
            sourceNode.stop(releaseEndTime + 0.1); 
            voice.soundSources.push(sourceNode);
        });

        // --- CLEANUP ---
        setTimeout(() => {
            voice.isActive = false;
            voice.soundSources.forEach(source => source.disconnect());
            voice.soundSources = [];
        }, (releaseEndTime - now + 0.2) * 1000);
    }

    public setInstrument(instrumentName: AccompanimentInstrument | 'none') {
        if (!this.isInitialized) return;
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
                voice.envGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.05);
                voice.soundSources.forEach(source => {
                    try { source.stop(this.audioContext.currentTime + 0.1); } catch (e) {}
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
            // ... (код отсоединения нод)
        });
        this.preamp.disconnect();
    }
}
