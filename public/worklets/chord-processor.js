// public/worklets/chord-processor.js

// PLAN 3.0: Add diagnostic logging to track voice assignment and stealing.
// This allows us to observe the polyphony engine's behavior in real-time.

const MAX_VOICES = 8;
const MAX_LAYERS_PER_VOICE = 8;

const mtof = (midi) => Math.pow(2, (midi - 69) / 12) * 440;

class StateVariableFilter {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.reset();
    }

    reset() {
        this.lp = 0;
        this.bp = 0;
        this.hp = 0;
    }

    process(input, cutoff, q, type) {
        // Clamp cutoff to avoid issues with Math.sin
        const f = 2 * Math.sin(Math.PI * Math.min(0.25, cutoff / (this.sampleRate * 2)));
        const qVal = 1 / Math.max(0.001, q); // Prevent division by zero

        this.lp = this.lp + this.bp * f;
        this.hp = input - this.lp - this.bp * qVal;
        this.bp = this.bp + this.hp * f;

        // Stability improvements
        if (isNaN(this.lp) || !isFinite(this.lp)) this.lp = 0;
        if (isNaN(this.bp) || !isFinite(this.bp)) this.bp = 0;
        if (isNaN(this.hp) || !isFinite(this.hp)) this.hp = 0;

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
        this.params = {};
        this.filter.reset();
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

    getGain() {
        return this.adsrGain * this.velocity;
    }

    process() {
        if (!this.isActive() || !this.params) return 0;
        
        let lfoValue = 0;
        if (this.params.lfo && this.params.lfo.amount > 0) {
            const lfoRate = this.params.lfo.rate / this.sampleRate;
            this.lfoPhase += lfoRate * 2 * Math.PI;
            if (this.lfoPhase > 2 * Math.PI) this.lfoPhase -= 2 * Math.PI;
            
            if(this.params.lfo.shape === 'sine') {
                lfoValue = Math.sin(this.lfoPhase) * this.params.lfo.amount;
            } else {
                lfoValue = (this.lfoPhase < Math.PI ? 1 : -1) * this.params.lfo.amount;
            }
        }
        
        const pitchMod = (this.params.lfo?.target === 'pitch') ? lfoValue : 0;
        let mixedSample = 0;
        if (this.params.layers) {
            for (let i = 0; i < this.params.layers.length; i++) {
                const layerParams = this.params.layers[i];
                mixedSample += this.layers[i].process(this.baseFrequency, layerParams.type, layerParams.detune + pitchMod, layerParams.octave, layerParams.gain);
            }
            if (this.params.layers.length > 0) {
               mixedSample /= this.params.layers.length;
            }
        }

        const filterCutoffMod = this.params.lfo?.target === 'filter' ? lfoValue : 0;
        let filteredSample = this.filter.process(
            mixedSample, 
            this.params.filter.cutoff + filterCutoffMod, 
            this.params.filter.q, 
            this.params.filter.type
        );
        
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
        this.sampleRate = options.processorOptions?.sampleRate || sampleRate;
        this.voices = Array.from({ length: MAX_VOICES }, () => new Voice(this.sampleRate));
        this.pendingEvents = [];
        
        this.delayBufferL = new Float32Array(this.sampleRate * 2);
        this.delayBufferR = new Float32Array(this.sampleRate * 2);
        this.delayWritePos = 0;
        
        this.chorusBuffer = new Float32Array(this.sampleRate * 0.1);
        this.chorusWritePos = 0;
        this.chorusLfoPhase = 0;

        this.port.onmessage = this.handleMessage.bind(this);
    }

    handleMessage(event) {
        const events = Array.isArray(event.data) ? event.data : [event.data];
        for(const msg of events){
            if (msg.when && msg.when > currentTime) {
                this.pendingEvents.push(msg);
            } else {
                this.processMessage(msg);
            }
        }
    }
    
    processMessage(msg) {
        switch (msg.type) {
            case 'noteOn':
                this.assignVoiceToNote(msg);
                break;
            case 'noteOff':
                this.releaseVoiceForNote(msg.noteId);
                break;
            case 'clear':
                this.voices.forEach(v => v.reset());
                break;
        }
    }

    assignVoiceToNote({ noteId, frequency, velocity, params }) {
        let voice = this.voices.find(v => !v.isActive());
        let voiceIndex = this.voices.indexOf(voice);

        if (!voice) {
            // Voice stealing: find the quietest voice
            voice = this.voices.reduce((a, b) => (a.getGain() < b.getGain() ? a : b));
            voiceIndex = this.voices.indexOf(voice);
            console.log(`[ChordProcessor] Stealing quietest voice ${voiceIndex} for noteId ${noteId}`);
        } else {
             console.log(`[ChordProcessor] Assigning noteId ${noteId} to voice ${voiceIndex}`);
        }
        
        if (voice) {
            voice.noteOn(noteId, frequency, velocity, params);
        }
    }

    releaseVoiceForNote(noteId) {
        const voice = this.voices.find(v => v.noteId === noteId);
        if (voice) {
            voice.noteOff();
        }
    }
    
    applyEffects(sampleL, sampleR, params) {
        const fx = params.effects;
        if (!fx) return [sampleL, sampleR];
        
        let finalL = sampleL;
        let finalR = sampleR;

        // Distortion
        if (fx.distortion > 0) {
            finalL = Math.tanh(finalL * (1 + fx.distortion * 5));
            finalR = Math.tanh(finalR * (1 + fx.distortion * 5));
        }

        // Chorus
        if(fx.chorus && fx.chorus.mix > 0){
            const chorusRate = fx.chorus.rate / this.sampleRate;
            this.chorusLfoPhase += chorusRate * 2 * Math.PI;
            if (this.chorusLfoPhase > 2 * Math.PI) this.chorusLfoPhase -= 2 * Math.PI;

            const chorusDelay = (Math.sin(this.chorusLfoPhase) * fx.chorus.depth + fx.chorus.depth) * this.sampleRate * 0.05;
            const readPos = (this.chorusWritePos - chorusDelay + this.chorusBuffer.length) % this.chorusBuffer.length;
            const chorusSample = this.chorusBuffer[Math.floor(readPos)];
            
            this.chorusBuffer[this.chorusWritePos] = (finalL + finalR) / 2;
            this.chorusWritePos = (this.chorusWritePos + 1) % this.chorusBuffer.length;
            
            const wetChorus = chorusSample * fx.chorus.mix;
            finalL += wetChorus;
            finalR -= wetChorus; // Create stereo effect
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

        return [finalL, finalR];
    }


    process(inputs, outputs, parameters) {
        const outputL = outputs[0][0];
        const outputR = outputs[0][1];
        const blockEndTime = currentTime + 128 / this.sampleRate;
        
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
            let activeVoiceCount = 0;

            for (const voice of this.voices) {
                if (voice.isActive()) {
                    const voiceSample = voice.process();
                    sampleL += voiceSample;
                    sampleR += voiceSample;
                    activeVoiceCount++;
                }
            }
            
            // Normalize by number of active voices to prevent clipping
            const normalizationFactor = activeVoiceCount > 0 ? (1 / Math.sqrt(activeVoiceCount)) * 0.8 : 0;
            sampleL *= normalizationFactor;
            sampleR *= normalizationFactor;

            // Apply global effects only if there's an active voice with effects
            const firstActiveVoiceWithEffects = this.voices.find(v => v.isActive() && v.params.effects);
            if (firstActiveVoiceWithEffects) {
                [sampleL, sampleR] = this.applyEffects(sampleL, sampleR, firstActiveVoiceWithEffects.params);
            }

            outputL[i] = sampleL;
            outputR[i] = sampleR;
        }
        
        this.delayWritePos = (this.delayWritePos + outputL.length) % this.delayBufferL.length;

        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
