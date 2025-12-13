// public/worklets/chord-processor.js

const MAX_VOICES = 8;
const MAX_LAYERS_PER_VOICE = 8;

class Layer {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.phase = Math.random() * 2 * Math.PI;
    }

    process(baseFrequency, type, detune, octave, gain, pitchLfoValue) {
        const detuneFactor = Math.pow(2, (detune + pitchLfoValue) / 1200);
        const octaveFactor = Math.pow(2, octave);
        const frequency = baseFrequency * detuneFactor * octaveFactor;
        const phaseIncrement = (frequency / this.sampleRate) * 2 * Math.PI;

        this.phase += phaseIncrement;
        if (this.phase >= 2 * Math.PI) this.phase -= 2 * Math.PI;

        let sample = 0;
        switch (type) {
            case 'sine': sample = Math.sin(this.phase); break;
            case 'triangle': sample = 1 - 4 * Math.abs((this.phase / (2 * Math.PI)) - 0.5); break;
            case 'square': sample = this.phase < Math.PI ? 1 : -1; break;
            case 'noise': sample = Math.random() * 2 - 1; break;
            case 'sawtooth': default: sample = 1 - (this.phase / Math.PI); break;
        }
        return sample * gain;
    }
}

class StateVariableFilter {
    constructor() {
        this.lp = 0;
        this.bp = 0;
        this.hp = 0;
    }

    process(input, f, qVal) {
        this.lp += this.bp * f;
        this.hp = input - this.lp - this.bp * qVal;
        this.bp += this.hp * f;
        return this.lp; // Only low-pass is used for now
    }
}


class Voice {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.layers = Array.from({ length: MAX_LAYERS_PER_VOICE }, () => new Layer(sampleRate));
        this.filter = new StateVariableFilter();
        this.reset();
    }

    reset() {
        this.noteId = null;
        this.baseFrequency = 0;
        this.isActive = false;
        this.releaseTime = Infinity;
        this.params = {};
    }

    noteOn(noteId, frequency, params, when) {
        this.reset();
        this.noteId = noteId;
        this.baseFrequency = frequency;
        this.params = params; // Store layers, LFO config for pitch, etc.
        this.isActive = true;
        this.releaseTime = Infinity;
    }

    noteOff(when) {
        if (!this.isActive) return;
        this.releaseTime = when;
    }

    process(parameters, sampleIndex) {
        if (!this.isActive) {
            return 0;
        }
        
        // --- Get per-sample values from AudioParams ---
        const cutoff = parameters.cutoff.length > 1 ? parameters.cutoff[sampleIndex] : parameters.cutoff[0];
        const q = parameters.q.length > 1 ? parameters.q[sampleIndex] : parameters.q[0];
        const distortion = parameters.distortion.length > 1 ? parameters.distortion[sampleIndex] : parameters.distortion[0];
        const lfoAmount = parameters.lfoAmount.length > 1 ? parameters.lfoAmount[sampleIndex] : parameters.lfoAmount[0];
        
        let pitchLfoValue = 0;
        if (this.params.lfo && this.params.lfo.target === 'pitch') {
             // Simple internal LFO for pitch only
             const lfoRate = (this.params.lfo.rate || 5) / this.sampleRate;
             this.lfoPhase = (this.lfoPhase || 0) + lfoRate * 2 * Math.PI;
             if (this.lfoPhase > 2 * Math.PI) this.lfoPhase -= 2 * Math.PI;
             pitchLfoValue = Math.sin(this.lfoPhase) * (this.params.lfo.amount || 0);
        }

        // --- 1. Oscillators (Layers) ---
        let mixedSample = 0;
        if (this.params.layers) {
            for (let i = 0; i < this.params.layers.length; i++) {
                const layerParams = this.params.layers[i];
                mixedSample += this.layers[i].process(this.baseFrequency, layerParams.type, layerParams.detune, layerParams.octave, layerParams.gain, pitchLfoValue);
            }
            if (this.params.layers.length > 0) {
                mixedSample /= this.params.layers.length;
            }
        }
        
        // --- 2. Filter ---
        const f = 2 * Math.sin(Math.PI * Math.min(0.25, (cutoff + lfoAmount) / (this.sampleRate * 2)));
        const qVal = 1 / q;
        let filteredSample = this.filter.process(mixedSample, f, qVal);

        // --- 3. Distortion ---
        if (distortion > 0) {
            filteredSample = Math.tanh(filteredSample * (1 + distortion * 5));
        }

        return filteredSample;
    }
}

class ChordProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        const sampleRate = options.processorOptions?.sampleRate || sampleRate;
        this.voices = Array.from({ length: MAX_VOICES }, () => new Voice(sampleRate));
        this.pendingEvents = [];

        this.port.onmessage = this.handleMessage.bind(this);
    }
    
    static get parameterDescriptors() {
        return [
            { name: 'cutoff', defaultValue: 8000, minValue: 20, maxValue: 20000 },
            { name: 'q', defaultValue: 1, minValue: 0.1, maxValue: 20 },
            { name: 'lfoAmount', defaultValue: 0, minValue: -5000, maxValue: 5000 },
            { name: 'distortion', defaultValue: 0, minValue: 0, maxValue: 1 },
        ];
    }

    handleMessage(event) {
        const messages = Array.isArray(event.data) ? event.data : [event.data];
        for(const msg of messages){
            this.pendingEvents.push(msg);
        }
    }

    assignVoiceToNote({ noteId, frequency, params }) {
        let voice = this.voices.find(v => !v.isActive);
        if (!voice) {
            // Voice stealing: find the one that's been in release the longest or has lowest gain
            voice = this.voices.sort((a,b) => a.adsrGain - b.adsrGain)[0];
        }
        if (voice) {
            voice.noteOn(noteId, frequency, params, currentTime);
        }
    }

    releaseVoiceForNote(noteId, when) {
        const voice = this.voices.find(v => v.noteId === noteId);
        if (voice) {
            voice.noteOff(when);
        }
    }

    process(inputs, outputs, parameters) {
        const outputL = outputs[0][0];
        const outputR = outputs[0][1];
        const blockEndTime = currentTime + outputL.length / sampleRate;

        // Process scheduled events
        let i = this.pendingEvents.length;
        while (i--) {
            const event = this.pendingEvents[i];
            if (event.when < blockEndTime) {
                this.pendingEvents.splice(i, 1);
                
                if (event.type === 'noteOn') {
                    this.assignVoiceToNote(event);
                } else if (event.type === 'noteOff') {
                    this.releaseVoiceForNote(event.noteId, event.when);
                } else if (event.type === 'clear') {
                     this.voices.forEach(v => v.reset());
                }
            }
        }
        
        for (let i = 0; i < outputL.length; i++) {
            let sampleL = 0;
            let sampleR = 0;

            for (const voice of this.voices) {
                if (voice.isActive) {
                    const sample = voice.process(parameters, i);
                    sampleL += sample;
                    sampleR += sample;

                    // Deactivate voice if release time has passed. The gain envelope is handled outside.
                    if (voice.releaseTime !== Infinity && currentTime + i/sampleRate >= voice.releaseTime) {
                        voice.isActive = false;
                    }
                }
            }
            
            // Basic hard clipping to prevent explosion, master gain is handled outside
            outputL[i] = Math.tanh(sampleL / MAX_VOICES);
            outputR[i] = Math.tanh(sampleR / MAX_VOICES);
        }

        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
