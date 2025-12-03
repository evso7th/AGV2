// public/worklets/chord-processor.js

// PLAN 2.0: Apply effects (distortion, chorus, delay) to the mixed signal post-voice processing.
// This significantly improves performance by running heavy effects only once per block,
// instead of once per voice per block.

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
        const f = 2 * Math.sin(Math.PI * Math.min(0.25, cutoff / (this.sampleRate * 2)));
        const qVal = 1 / q;

        this.lp += this.bp * f;
        this.hp = input - this.lp - this.bp * qVal;
        this.bp += this.hp * f;

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
        this.lfoPhase = 0;
        this.reset();
    }

    reset() {
        this.noteId = null;
        this.baseFrequency = 0;
        this.velocity = 0;
        this.adsrState = 'idle';
        this.adsrGain = 0;
        this.params = null; 
    }

    noteOn(noteId, frequency, velocity, params) {
        this.reset();
        this.noteId = noteId;
        this.baseFrequency = frequency;
        this.velocity = velocity;
        this.adsrState = 'attack';
        this.params = params;
    }

    noteOff() {
        this.adsrState = 'release';
    }

    isActive() {
        return this.adsrState !== 'idle';
    }

    process() {
        if (!this.isActive() || !this.params) return 0;

        let lfoValue = 0;
        const lfoParams = this.params.lfo;
        if (lfoParams && lfoParams.amount > 0) {
            const lfoRate = lfoParams.rate / this.sampleRate;
            this.lfoPhase += lfoRate * 2 * Math.PI;
            if (this.lfoPhase > 2 * Math.PI) this.lfoPhase -= 2 * Math.PI;
            
            if(lfoParams.shape === 'sine') {
                lfoValue = Math.sin(this.lfoPhase) * lfoParams.amount;
            } else {
                 lfoValue = (this.lfoPhase < Math.PI ? 1 : -1) * lfoParams.amount;
            }
        }
        
        let pitchMod = (this.params.lfo.target === 'pitch') ? lfoValue : 0;
        let mixedSample = 0;
        for (let i = 0; i < this.params.layers.length; i++) {
            const layerParams = this.params.layers[i];
            mixedSample += this.layers[i].process(this.baseFrequency, layerParams.type, layerParams.detune + pitchMod, layerParams.octave, layerParams.gain);
        }
        if (this.params.layers.length > 0) {
           mixedSample /= this.params.layers.length;
        }

        let filterCutoffMod = this.params.lfo.target === 'filter' ? lfoValue : 0;
        let filteredSample = this.filter.process(mixedSample, this.params.filter.cutoff + filterCutoffMod, this.params.filter.q, this.params.filter.type);
        
        const { attack, decay, sustain, release } = this.params.adsr;
        switch (this.adsrState) {
            case 'attack':
                this.adsrGain += 1 / (Math.max(0.001, attack) * this.sampleRate);
                if (this.adsrGain >= 1) {
                    this.adsrGain = 1;
                    this.adsrState = 'decay';
                }
                break;
            case 'decay':
                this.adsrGain -= (1 - sustain) / (Math.max(0.001, decay) * this.sampleRate);
                if (this.adsrGain <= sustain) {
                    this.adsrGain = sustain;
                    this.adsrState = 'sustain';
                }
                break;
            case 'release':
                this.adsrGain -= this.adsrGain / (Math.max(0.001, release) * this.sampleRate);
                if (this.adsrGain <= 0.0001) {
                    this.adsrGain = 0;
                    this.adsrState = 'idle';
                }
                break;
        }

        return filteredSample * this.adsrGain * this.velocity;
    }
}

class ChordProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        const sampleRate = options.processorOptions?.sampleRate || sampleRate;
        this.voices = Array.from({ length: MAX_VOICES }, () => new Voice(sampleRate));
        this.pendingEvents = [];
        
        this.sampleRate = sampleRate;

        // Effect states
        this.delayBufferL = new Float32Array(sampleRate * 2);
        this.delayBufferR = new Float32Array(sampleRate * 2);
        this.delayWritePos = 0;
        this.chorusLFOPhase = 0;
        this.chorusBuffer = new Float32Array(sampleRate * 0.1);
        this.chorusWritePos = 0;

        this.currentEffects = null;

        this.port.onmessage = this.handleMessage.bind(this);
        console.log(`[ChordProcessor] Initialized with ${MAX_VOICES} voices.`);
    }

    handleMessage(event) {
        const events = Array.isArray(event.data) ? event.data : [event.data];
        for(const msg of events){
            switch (msg.type) {
                case 'noteOn':
                    this.assignVoiceToNote(msg);
                    break;
                case 'noteOff':
                    this.releaseVoiceForNote(msg.noteId, msg.when);
                    break;
                case 'clear':
                    this.voices.forEach(v => v.reset());
                    break;
            }
        }
    }

    assignVoiceToNote({ noteId, frequency, velocity, params, when }) {
        if(when > currentTime) {
            this.pendingEvents.push({ type: 'noteOn', noteId, frequency, velocity, params, when });
            return;
        }

        // Use the effects from the first note of a new "batch"
        if (this.voices.every(v => !v.isActive())) {
            this.currentEffects = params.effects;
        }
        
        let voice = this.voices.find(v => !v.isActive());
        if (!voice) {
            voice = this.voices.sort((a,b) => a.adsrGain - b.adsrGain)[0];
        }
        if (voice) {
            voice.noteOn(noteId, frequency, velocity, params);
        }
    }

    releaseVoiceForNote(noteId, when) {
         if(when > currentTime) {
            this.pendingEvents.push({ type: 'noteOff', noteId, when });
            return;
        }
        const voice = this.voices.find(v => v.noteId === noteId);
        if (voice) {
            voice.noteOff();
        }
    }
    
    applyEffects(sample) {
        let finalL = sample;
        let finalR = sample;
        const fx = this.currentEffects;

        if (!fx) return [finalL, finalR];

        // Distortion
        if (fx.distortion > 0) {
            finalL = Math.tanh(finalL * (1 + fx.distortion * 5));
            finalR = Math.tanh(finalR * (1 + fx.distortion * 5));
        }

        // Chorus
        if (fx.chorus && fx.chorus.mix > 0) {
            this.chorusLFOPhase += (fx.chorus.rate / this.sampleRate) * 2 * Math.PI;
            if (this.chorusLFOPhase >= 2 * Math.PI) this.chorusLFOPhase -= 2 * Math.PI;
            
            const chorusDelay = (Math.sin(this.chorusLFOPhase) * fx.chorus.depth + fx.chorus.depth) * this.sampleRate * 0.05;
            const readPos = (this.chorusWritePos - chorusDelay + this.chorusBuffer.length) % this.chorusBuffer.length;
            const chorusSample = this.chorusBuffer[Math.floor(readPos)];
            
            this.chorusBuffer[this.chorusWritePos] = sample;
            this.chorusWritePos = (this.chorusWritePos + 1) % this.chorusBuffer.length;

            finalL = finalL * (1 - fx.chorus.mix) + chorusSample * fx.chorus.mix;
            finalR = finalR * (1 - fx.chorus.mix) - chorusSample * fx.chorus.mix; // Invert for stereo
        }

        // Stereo Delay
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

    process(inputs, outputs, parameters) {
        const outputL = outputs[0][0];
        const outputR = outputs[0][1];
        const blockEndTime = currentTime + 128 / sampleRate;
        
        // --- Process scheduled events for this block ---
        let i = this.pendingEvents.length;
        while(i--) {
            const event = this.pendingEvents[i];
            if (event.when < blockEndTime) {
                this.pendingEvents.splice(i, 1);
                
                if (event.type === 'noteOn') {
                    this.assignVoiceToNote(event);
                } else if (event.type === 'noteOff') {
                    this.releaseVoiceForNote(event.noteId, event.when);
                }
            }
        }
        
        // --- Process each sample in the block ---
        for (let i = 0; i < outputL.length; i++) {
            let monoSample = 0;

            // 1. Sum all active voices
            for (const voice of this.voices) {
                if (voice.isActive()) {
                    monoSample += voice.process();
                }
            }
            
            // Normalize by number of voices to prevent clipping
            monoSample /= MAX_VOICES;

            // 2. Apply effects to the mixed signal
            const [processedL, processedR] = this.applyEffects(monoSample);
            
            // 3. Output
            outputL[i] = processedL;
            outputR[i] = processedR;
        }
        
        // If no voices are active, reset effect parameters for the next batch
        if (this.voices.every(v => !v.isActive())) {
            this.currentEffects = null;
        }

        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
