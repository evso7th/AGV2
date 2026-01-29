
import type { FractalEvent, AccompanimentInstrument, MelodyInstrument } from '@/types/fractal';
import type { Note } from "@/types/music";
import { SYNTH_PRESETS, type SynthPreset } from './synth-presets';
import { V1_TO_V2_PRESET_MAP } from './presets-v2';
import type { BlackGuitarSampler } from './black-guitar-sampler';

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
    soundSources: (OscillatorNode | AudioBufferSourceNode)[];
    isActive: boolean;
};

/**
 * Manages multiple synth voices for the melody part using native AudioNodes.
 * Now includes a "smart router" to delegate to samplers.
 */
export class MelodySynthManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private activeInstrumentName: AccompanimentInstrument | 'none' = 'organ';
    public isInitialized = false;
    private partName: 'melody';

    private voicePool: SynthVoice[] = [];
    private nextVoice = 0;
    private preamp: GainNode;
    private noiseBuffer: AudioBuffer | null = null;
    
    // Sampler dependencies
    private blackAcousticSampler: BlackGuitarSampler;

    constructor(
        audioContext: AudioContext, 
        destination: AudioNode,
        blackAcousticSampler: BlackGuitarSampler,
        partName: 'melody'
    ) {
        this.audioContext = audioContext;
        this.destination = destination;
        this.blackAcousticSampler = blackAcousticSampler;
        this.partName = partName;

        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.0;
        this.preamp.connect(this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[MelodyManagerV1] Initializing native synth voices...');
        this.createNoiseBuffer();
        this.initVoicePool(3); 
        this.isInitialized = true;
        console.log('[MelodyManagerV1] Native voices initialized.');
    }

    private createNoiseBuffer() {
        const bufferSize = this.audioContext.sampleRate;
        this.noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    }

    private initVoicePool(poolSize: number) {
        for (let i = 0; i < poolSize; i++) {
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
                soundSources: [], isActive: false,
            });
        }
    }

    public schedule(events: FractalEvent[], barStartTime: number, tempo: number, barCount: number, instrumentHint?: MelodyInstrument, composerControlsInstruments: boolean = true) {
        const logPrefix = `%c[MelodyManagerV1 @ Bar ${barCount}]`;
        const logCss = 'color: #DA70D6';
        
        console.log(`${logPrefix} Received schedule command. Instrument Hint: ${instrumentHint}, Events: ${events.length}`, logCss);

        if (!this.isInitialized) return;
        
        const melodyEvents = events.filter(e => 
            Array.isArray(e.type) ? e.type.includes(this.partName) : e.type === this.partName
        );

        if (melodyEvents.length === 0) return;

        const hint = (composerControlsInstruments && instrumentHint) ? instrumentHint : this.activeInstrumentName;
        
        // --- SMART ROUTER ---
        if (hint === 'blackAcoustic') {
            console.log(`${logPrefix} Routing to BlackGuitarSampler`, logCss);
            const notesToPlay = melodyEvents.map(e => ({ midi: e.note, time: e.time * (60/tempo), duration: e.duration * (60/tempo), velocity: e.weight, technique: e.technique, params: e.params }));
            this.blackAcousticSampler.schedule(notesToPlay, barStartTime, tempo);
            return; // Stop further execution
        }
        
        // --- V1 SYNTH LOGIC (Fallback) ---
        const finalInstrument = V1_TO_V2_PRESET_MAP[hint as keyof typeof V1_TO_V2_PRESET_MAP] || hint;
        
        if (!finalInstrument || finalInstrument === 'none' || !(finalInstrument in SYNTH_PRESETS)) {
            console.warn(`${logPrefix} Hint "${finalInstrument}" not found in V1 SYNTH_PRESETS. Skipping.`, logCss);
            return;
        }

        console.log(`${logPrefix} Using internal synth. Instrument: ${finalInstrument} | Scheduling ${melodyEvents.length} notes...`, logCss);

        const beatDuration = 60 / tempo;
        const notes: Note[] = melodyEvents.map(event => ({ midi: event.note, time: event.time * beatDuration, duration: event.duration * beatDuration, velocity: event.weight }));
        this.scheduleSynth(finalInstrument as keyof typeof SYNTH_PRESETS, notes, barStartTime);
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
        const velocity = note.velocity ?? 0.7;
        const noteTime = note.time;
        const noteDuration = note.duration;

        if (!isFinite(noteTime) || !isFinite(noteDuration) || !isFinite(velocity) || !isFinite(barStartTime)) {
            console.error('[MelodyManagerV1] Triggering aborted due to non-finite value:', { noteTime, noteDuration, velocity, barStartTime });
            return;
        }
        
        const now = this.audioContext.currentTime;
        const noteOnTime = barStartTime + noteTime;
        if (noteOnTime < now) return;

        voice.isActive = true;
        
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

        const gainParam = voice.envGain.gain;
        const peakGain = velocity * 0.9;
        const sustainValue = peakGain * preset.adsr.sustain;
        
        const attackEndTime = noteOnTime + preset.adsr.attack;
        const noteOffTime = noteOnTime + noteDuration;
        const releaseEndTime = noteOffTime + preset.adsr.release;

        if (!isFinite(attackEndTime) || !isFinite(noteOffTime) || !isFinite(releaseEndTime) || !preset.adsr.attack || !preset.adsr.sustain || !preset.adsr.release) {
            console.error('[MelodyManagerV1] Aborting due to non-finite envelope time calculation.');
            voice.isActive = false;
            return;
        }

        gainParam.cancelScheduledValues(noteOnTime);
        gainParam.setValueAtTime(0.0001, noteOnTime);
        gainParam.linearRampToValueAtTime(peakGain, attackEndTime);
        gainParam.setTargetAtTime(sustainValue, attackEndTime, Math.max(preset.adsr.decay / 5, 0.001));
        gainParam.setTargetAtTime(0.0001, noteOffTime, preset.adsr.release / 5);
        
        voice.soundSources = [];
        const baseFrequency = midiToFreq(note.midi);
        
        preset.layers.forEach(layer => {
            let sourceNode: OscillatorNode | AudioBufferSourceNode;

            if (layer.type === 'noise') {
                if (!this.noiseBuffer) return;
                const noiseSource = this.audioContext.createBufferSource();
                noiseSource.buffer = this.noiseBuffer;
                noiseSource.loop = true;
                sourceNode = noiseSource;
            } else {
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
            voice.soundSources.push(sourceNode);
        });
        
        const primarySource = voice.soundSources.find(s => s instanceof OscillatorNode) || voice.soundSources[0];
        if (primarySource) {
            primarySource.onended = () => {
                voice.isActive = false;
                voice.soundSources.forEach(source => {
                    try { source.disconnect(); } catch (e) {}
                });
                voice.soundSources = [];
            };
        }

        voice.soundSources.forEach(source => {
            try {
                source.stop(releaseEndTime + 0.1);
            } catch(e) {}
        });
    }

    public setInstrument(instrumentName: MelodyInstrument | 'none') {
        if (!this.isInitialized) return;
        this.activeInstrumentName = instrumentName as AccompanimentInstrument;
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
        });
        this.preamp.disconnect();
    }
}
