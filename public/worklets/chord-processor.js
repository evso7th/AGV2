// public/worklets/chord-processor.js

const MAX_VOICES = 8;
const MAX_LAYERS_PER_VOICE = 8;

// Helper to convert MIDI to frequency
const mtof = (midi) => Math.pow(2, (midi - 69) / 12) * 440;

// --- DSP Components ---

class StateVariableFilter {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.lp = 0;
        this.bp = 0;
        this.hp = 0;
    }

    process(input, cutoff, q, type) {
        // Clamp cutoff to avoid instability issues with high frequencies
        const f = 2 * Math.sin(Math.PI * Math.min(0.25, cutoff / (this.sampleRate * 2)));
        const qVal = 1 / q;

        this.lp += this.bp * f;
        this.hp = input - this.lp - this.bp * qVal;
        this.bp += this.hp * f;
        
        this.lp = isNaN(this.lp) ? 0 : this.lp;
        this.hp = isNaN(this.hp) ? 0 : this.hp;
        this.bp = isNaN(this.bp) ? 0 : this.bp;


        switch (type) {
            case 'lpf': return this.lp;
            case 'hpf': return this.hp;
            case 'bpf': return this.bp;
            case 'notch': return this.hp + this.lp;
            default: return this.lp;
        }
    }
}

class Layer {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.phase = Math.random() * 2 * Math.PI;
    }

    process(baseFrequency, type, detune, octave, gain) {
        const detuneFactor = Math.pow(2, detune / 1200);
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

class Voice {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.layers = Array.from({ length: MAX_LAYERS_PER_VOICE }, () => new Layer(sampleRate));
        this.filter = new StateVariableFilter(sampleRate);
        this.delayBufferL = new Float32Array(sampleRate * 2);
        this.delayBufferR = new Float32Array(sampleRate * 2);
        this.delayWritePos = 0;
        this.chorusBuffer = new Float32Array(sampleRate * 0.1);
        this.chorusWritePos = 0;
        this.chorusLfoPhase = Math.random() * 2 * Math.PI;
        this.reset();
    }

    reset() {
        this.noteId = null;
        this.baseFrequency = 0;
        this.velocity = 0;
        this.adsrState = 'idle';
        this.adsrGain = 0;
    }

    noteOn(noteId, frequency, velocity, params, when) {
        this.reset();
        this.noteId = noteId;
        this.baseFrequency = frequency;
        this.velocity = velocity;
        this.adsrState = 'attack';
        this.params = params; // Keep the whole preset
    }

    noteOff() {
        this.adsrState = 'release';
    }

    isActive() {
        return this.adsrState !== 'idle';
    }

    process(parameters) {
        if (!this.isActive() || !this.params) return [0, 0];

        // --- Read modulated parameters ---
        const cutoff = parameters.cutoff[parameters.cutoff.length > 1 ? i : 0];
        const q = parameters.q[parameters.q.length > 1 ? i : 0];
        const distortion = parameters.distortion[parameters.distortion.length > 1 ? i : 0];
        const pitchMod = parameters.lfoPitch[parameters.lfoPitch.length > 1 ? i : 0];


        // --- Oscillators (Layers) --- 
        let mixedSample = 0;
        for (let j = 0; j < this.params.layers.length; j++) {
            const layerParams = this.params.layers[j];
            const layerPitchMod = this.params.lfo.target === 'pitch' ? pitchMod : 0;
            mixedSample += this.layers[j].process(this.baseFrequency, layerParams.type, layerParams.detune + layerPitchMod, layerParams.octave, layerParams.gain);
        }
        if (this.params.layers.length > 0) {
           mixedSample /= this.params.layers.length;
        }

        // --- Filter ---
        let filteredSample = this.filter.process(mixedSample, cutoff, q, this.params.filter.type);
        
        // --- ADSR Envelope ---
        const { attack, decay, sustain, release } = this.params.adsr;
        switch (this.adsrState) {
            case 'attack':
                this.adsrGain += 1 / (Math.max(0.001, attack) * this.sampleRate);
                if (this.adsrGain >= 1) { this.adsrGain = 1; this.adsrState = 'decay'; }
                break;
            case 'decay':
                this.adsrGain -= (1 - sustain) / (Math.max(0.001, decay) * this.sampleRate);
                if (this.adsrGain <= sustain) { this.adsrGain = sustain; this.adsrState = 'sustain'; }
                break;
            case 'release':
                this.adsrGain -= this.adsrGain / (Math.max(0.001, release) * this.sampleRate);
                if (this.adsrGain <= 0.0001) { this.adsrGain = 0; this.adsrState = 'idle'; }
                break;
        }
        let finalSample = filteredSample * this.adsrGain * this.velocity;

        // --- Effects ---
        const fx = this.params.effects;

        // Distortion
        if (distortion > 0) {
            finalSample = Math.tanh(finalSample * (1 + distortion * 5));
        }

        // Chorus
        let chorusSample = 0;
        if(fx.chorus && fx.chorus.mix > 0){
            this.chorusLfoPhase += (fx.chorus.rate / this.sampleRate) * 2 * Math.PI;
            if (this.chorusLfoPhase >= 2 * Math.PI) this.chorusLfoPhase -= 2 * Math.PI;

            const chorusDelay = (Math.sin(this.chorusLfoPhase) * fx.chorus.depth + fx.chorus.depth) * this.sampleRate * 0.05;
            const readPos = (this.chorusWritePos - chorusDelay + this.chorusBuffer.length) % this.chorusBuffer.length;
            chorusSample = this.chorusBuffer[Math.floor(readPos)];
            this.chorusBuffer[this.chorusWritePos] = finalSample;
            this.chorusWritePos = (this.chorusWritePos + 1) % this.chorusBuffer.length;
        }
        finalSample = finalSample * (1 - (fx.chorus?.mix ?? 0)) + chorusSample * (fx.chorus?.mix ?? 0);

        // Stereo Delay
        let finalL = finalSample, finalR = finalSample;
        if (fx.delay && fx.delay.mix > 0) {
            const readPosL = (this.delayWritePos - (fx.delay.time * this.sampleRate) + this.delayBufferL.length) % this.delayBufferL.length;
            const readPosR = (this.delayWritePos - (fx.delay.time * 0.75 * this.sampleRate) + this.delayBufferR.length) % this.delayBufferR.length;
            
            const delayedL = this.delayBufferL[Math.floor(readPosL)];
            const delayedR = this.delayBufferR[Math.floor(readPosR)];

            this.delayBufferL[this.delayWritePos] = finalL + delayedL * fx.delay.feedback;
            this.delayBufferR[this.delayWritePos] = finalR + delayedR * fx.delay.feedback;
            
            finalL = finalL * (1 - fx.delay.mix) + delayedL * fx.delay.mix;
            finalR = finalR * (1 - fx.delay.mix) + delayedR * fx.delay.mix;
        }
        this.delayWritePos = (this.delayWritePos + 1) % this.delayBufferL.length;

        return [finalL, finalR];
    }
}

class ChordProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'cutoff', defaultValue: 8000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' },
            { name: 'q', defaultValue: 1, minValue: 0.1, maxValue: 20, automationRate: 'a-rate' },
            { name: 'distortion', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
            { name: 'lfoPitch', defaultValue: 0, minValue: -1200, maxValue: 1200, automationRate: 'a-rate' }
        ];
    }

    constructor(options) {
        super();
        const sampleRate = options.processorOptions?.sampleRate || 44100;
        this.voices = Array.from({ length: MAX_VOICES }, () => new Voice(sampleRate));
        this.pendingEvents = [];
        this.port.onmessage = this.handleMessage.bind(this);
    }

    handleMessage(event) {
        const events = Array.isArray(event.data) ? event.data : [event.data];
        for(const msg of events){
            const executionTime = msg.when || currentTime;
            if (executionTime > currentTime) {
                this.pendingEvents.push(msg);
            } else {
                this.processMessage(msg);
            }
        }
    }

    processMessage(msg) {
        switch (msg.type) {
            case 'noteOn':
                let voice = this.voices.find(v => !v.isActive());
                if (!voice) {
                    voice = this.voices.sort((a,b) => a.adsrGain - b.adsrGain)[0]; // Voice stealing
                }
                if (voice) {
                    voice.noteOn(msg.noteId, msg.frequency, msg.velocity, msg.params, msg.when);
                }
                break;
            case 'noteOff':
                const voiceToRelease = this.voices.find(v => v.noteId === msg.noteId);
                if (voiceToRelease) {
                    voiceToRelease.noteOff();
                }
                break;
            case 'clear':
                this.voices.forEach(v => v.reset());
                break;
        }
    }
    
    process(inputs, outputs, parameters) {
        const outputL = outputs[0][0];
        const outputR = outputs[0][1];
        const blockEndTime = currentTime + 128 / sampleRate;

        // Process scheduled messages
        let i = this.pendingEvents.length;
        while(i--) {
            const event = this.pendingEvents[i];
            if (event.when < blockEndTime) {
                this.pendingEvents.splice(i, 1);
                this.processMessage(event);
            }
        }

        for (let i = 0; i < outputL.length; i++) {
            let sampleL = 0;
            let sampleR = 0;
            
            // This is a snapshot of parameters for this sample frame
            const frameParameters = {
                cutoff: parameters.cutoff.length > 1 ? parameters.cutoff[i] : parameters.cutoff[0],
                q: parameters.q.length > 1 ? parameters.q[i] : parameters.q[0],
                distortion: parameters.distortion.length > 1 ? parameters.distortion[i] : parameters.distortion[0],
                lfoPitch: parameters.lfoPitch.length > 1 ? parameters.lfoPitch[i] : parameters.lfoPitch[0]
            };

            for (const voice of this.voices) {
                if (voice.isActive()) {
                    const [voiceSampleL, voiceSampleR] = voice.process(frameParameters, i);
                    sampleL += voiceSampleL;
                    sampleR += voiceSampleR;
                }
            }
            
            outputL[i] = Math.tanh(sampleL * 0.5); // Apply soft clipping
            outputR[i] = Math.tanh(sampleR * 0.5);
        }
        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
