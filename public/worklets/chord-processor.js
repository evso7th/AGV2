// public/worklets/chord-processor.js

const MAX_VOICES = 8;
const MAX_LAYERS_PER_VOICE = 8;

// --- DSP Components ---

class StateVariableFilter {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.lp = 0;
        this.bp = 0;
        this.hp = 0;
    }

    process(input, cutoff, q, type) {
        // Clamp cutoff to avoid instability at Nyquist frequency
        const f = 2 * Math.sin(Math.PI * Math.min(0.25, cutoff / (this.sampleRate * 2)));
        const qVal = 1 / Math.max(0.01, q); // Prevent Q from being zero

        // Double-sampled SVF for stability at high frequencies
        for (let i = 0; i < 2; i++) {
            this.lp += this.bp * f;
            this.hp = input - this.lp - this.bp * qVal;
            this.bp += this.hp * f;
        }

        switch (type) {
            case 'hpf': return this.hp;
            case 'bpf': return this.bp;
            case 'notch': return this.hp + this.lp;
            case 'lpf':
            default: return this.lp;
        }
    }
}

class Layer {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.phase = Math.random() * 2 * Math.PI; // Randomize phase
    }

    process(baseFrequency, type, detune, octave, gain) {
        const detuneFactor = Math.pow(2, detune / 1200);
        const octaveFactor = Math.pow(2, octave);
        const frequency = baseFrequency * detuneFactor * octaveFactor;
        
        if (frequency <= 0) return 0;

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

class Voice {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.layers = Array.from({ length: MAX_LAYERS_PER_VOICE }, () => new Layer(sampleRate));
        this.filter = new StateVariableFilter(sampleRate);
        this.lfoPhase = 0;
        this.isActive = false;
        this.noteId = null;
        this.baseFrequency = 0;
        this.params = {};
    }

    noteOn(noteId, frequency, params) {
        this.noteId = noteId;
        this.baseFrequency = frequency;
        this.params = params; // Store filter, lfo, layers, effects
        this.isActive = true;
    }

    noteOff() {
        this.isActive = false;
        this.baseFrequency = 0;
        this.noteId = null;
    }

    process() {
        if (!this.isActive || !this.params) return [0, 0];

        // --- LFO ---
        let lfoValue = 0;
        if (this.params.lfo && this.params.lfo.amount > 0) {
            const lfoRate = this.params.lfo.rate / this.sampleRate;
            this.lfoPhase += lfoRate * 2 * Math.PI;
            if (this.lfoPhase > 2 * Math.PI) this.lfoPhase -= 2 * Math.PI;
            
            if (this.params.lfo.shape === 'sine') {
                lfoValue = Math.sin(this.lfoPhase) * this.params.lfo.amount;
            } else { // Square
                lfoValue = (this.lfoPhase < Math.PI ? 1 : -1) * this.params.lfo.amount;
            }
        }
        
        // --- Oscillators (Layers) ---
        let pitchMod = (this.params.lfo?.target === 'pitch') ? lfoValue : 0;
        let mixedSample = 0;
        if (this.params.layers) {
            for (let i = 0; i < this.params.layers.length; i++) {
                const layerParams = this.params.layers[i];
                mixedSample += this.layers[i].process(this.baseFrequency, layerParams.type, layerParams.detune + pitchMod, layerParams.octave, layerParams.gain);
            }
            if (this.params.layers.length > 0) {
               mixedSample /= this.params.layers.length; // Normalize to prevent clipping
            }
        }

        // --- Filter ---
        let filterCutoffMod = (this.params.lfo?.target === 'filter') ? lfoValue : 0;
        let filteredSample = this.filter.process(
            mixedSample, 
            (this.params.filter?.cutoff || 8000) + filterCutoffMod, 
            this.params.filter?.q || 1, 
            this.params.filter?.type || 'lpf'
        );

        // --- Effects (Simplified for Worklet) ---
        let finalSample = filteredSample;
        if (this.params.effects?.distortion > 0) {
            const k = this.params.effects.distortion * 5;
            finalSample = Math.tanh(finalSample * (1 + k));
        }

        // ADSR is now handled by a GainNode in the main thread.
        // The output from the worklet is a raw, continuous signal.
        return [finalSample, finalSample]; // Mono to stereo
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

    handleMessage(event) {
        const msg = event.data;
        // Schedule event to be processed at the correct time in the audio thread
        this.pendingEvents.push(msg);
    }

    process(inputs, outputs, parameters) {
        const outputL = outputs[0][0];
        const outputR = outputs[0][1];
        const blockEndTime = currentTime + 128 / sampleRate;

        // Process scheduled events
        let i = this.pendingEvents.length;
        while(i--) {
            const event = this.pendingEvents[i];
            if (event.when <= blockEndTime) {
                this.pendingEvents.splice(i, 1);
                
                if (event.type === 'noteOn') {
                    let voice = this.voices.find(v => !v.isActive);
                    if (!voice) { // Voice stealing: find the first one to reuse
                        voice = this.voices[0];
                    }
                    voice.noteOn(event.noteId, event.frequency, event.params);
                } else if (event.type === 'noteOff') {
                    const voice = this.voices.find(v => v.noteId === event.noteId);
                    if (voice) {
                        voice.noteOff();
                    }
                } else if (event.type === 'clear') {
                     this.voices.forEach(v => v.noteOff());
                }
            }
        }
        
        // Process each sample in the block
        for (let i = 0; i < outputL.length; i++) {
            let sampleL = 0;
            let sampleR = 0;

            for (const voice of this.voices) {
                if (voice.isActive) {
                    const [voiceSampleL, voiceSampleR] = voice.process();
                    sampleL += voiceSampleL;
                    sampleR += voiceSampleR;
                }
            }
            
            // Basic hard clipping to prevent overload. A compressor would be better.
            outputL[i] = Math.max(-1, Math.min(1, sampleL));
            outputR[i] = Math.max(-1, Math.min(1, sampleR));
        }

        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
