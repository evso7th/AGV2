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
        this.reset();
    }
    
    reset() {
        this.lp = 0;
        this.bp = 0;
        this.hp = 0;
    }

    process(input, cutoff, q, type) {
        const f = 2 * Math.sin(Math.PI * Math.min(0.25, cutoff / (this.sampleRate * 2)));
        const qVal = 1 / Math.max(0.01, q); // Prevent division by zero

        this.lp += this.bp * f;
        this.hp = input - this.lp - this.bp * qVal;
        this.bp += this.hp * f;
        
        // Fix for instability at high frequencies
        this.lp = Number.isFinite(this.lp) ? this.lp : 0;
        this.bp = Number.isFinite(this.bp) ? this.bp : 0;
        this.hp = Number.isFinite(this.hp) ? this.hp : 0;

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
        this.filter.reset();
    }

    noteOn(noteId, frequency, velocity, params) {
        this.noteId = noteId;
        this.baseFrequency = frequency;
        this.velocity = velocity;
        this.params = params;
        this.adsrState = 'attack';
        this.adsrGain = 0; // Start gain from 0 for every new note
    }

    noteOff() {
        if (this.adsrState !== 'idle') {
            this.adsrState = 'release';
        }
    }

    isActive() {
        return this.adsrState !== 'idle';
    }

    isReleasing() {
        return this.adsrState === 'release';
    }

    process() {
        if (!this.isActive() || !this.params) return 0;

        // --- 1. LFO --- 
        let lfoValue = 0;
        const lfoParams = this.params.lfo;
        if (lfoParams && lfoParams.amount > 0) {
            const lfoRate = lfoParams.rate / this.sampleRate;
            this.lfoPhase += lfoRate * 2 * Math.PI;
            if (this.lfoPhase > 2 * Math.PI) this.lfoPhase -= 2 * Math.PI;
            
            if (lfoParams.shape === 'sine') {
                lfoValue = Math.sin(this.lfoPhase) * lfoParams.amount;
            } else { // Square LFO
                 lfoValue = (this.lfoPhase < Math.PI ? 1 : -1) * lfoParams.amount;
            }
        }
        
        // --- 2. Oscillators (Layers) --- 
        let pitchMod = (lfoParams.target === 'pitch') ? lfoValue : 0;
        let mixedSample = 0;
        if (this.params.layers && this.params.layers.length > 0) {
            for (let i = 0; i < this.params.layers.length; i++) {
                const layerParams = this.params.layers[i];
                mixedSample += this.layers[i].process(this.baseFrequency, layerParams.type, layerParams.detune + pitchMod, layerParams.octave, layerParams.gain);
            }
           mixedSample /= this.params.layers.length;
        }

        // --- 3. Filter ---
        let filterCutoffMod = lfoParams.target === 'filter' ? lfoValue : 0;
        let filteredSample = this.filter.process(mixedSample, this.params.filter.cutoff + filterCutoffMod, this.params.filter.q, this.params.filter.type);

        // --- 4. ADSR Envelope ---
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
            case 'sustain':
                this.adsrGain = sustain;
                break;
            case 'release':
                this.adsrGain -= this.adsrGain / (Math.max(0.001, release) * this.sampleRate);
                if (this.adsrGain <= 0.0001) {
                    this.reset(); // Correctly reset the voice when it becomes idle
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

        // Effect parameters
        this.distortion = 0;
        
        this.chorusRate = 0;
        this.chorusDepth = 0;
        this.chorusMix = 0;
        this.chorusBuffer = new Float32Array(sampleRate * 0.1);
        this.chorusWritePos = 0;
        this.chorusLfoPhase = 0;

        this.delayTime = 0;
        this.delayFeedback = 0;
        this.delayMix = 0;
        this.delayBufferL = new Float32Array(sampleRate * 2);
        this.delayBufferR = new Float32Array(sampleRate * 2);
        this.delayWritePos = 0;

        this.port.onmessage = this.handleMessage.bind(this);
        console.log(`[ChordProcessor] Initialized with ${MAX_VOICES} voices.`);
    }

    handleMessage(event) {
        const events = Array.isArray(event.data) ? event.data : [event.data];
        for(const msg of events){
             // Always push to pending events to handle timing correctly
            if (msg.type === 'noteOn' || msg.type === 'noteOff') {
                this.pendingEvents.push(msg);
            } else if (msg.type === 'clear') {
                this.voices.forEach(v => v.reset());
                this.pendingEvents = [];
            }
        }
    }

    assignVoiceToNote({ noteId, frequency, velocity, params }) {
        let voice = this.voices.find(v => !v.isActive());
        if (!voice) {
            // Voice stealing logic: find the quietest voice in release phase first
            const releasingVoices = this.voices.filter(v => v.isReleasing());
            if(releasingVoices.length > 0) {
                 voice = releasingVoices.sort((a,b) => a.adsrGain - b.adsrGain)[0];
                 console.log(`[ChordProcessor] Stealing releasing voice ${this.voices.indexOf(voice)} for noteId ${noteId}`);
            } else {
                // If no voice is releasing, steal the quietest one overall
                voice = this.voices.sort((a,b) => a.adsrGain - b.adsrGain)[0];
                console.log(`[ChordProcessor] Stealing quietest voice ${this.voices.indexOf(voice)} for noteId ${noteId}`);
            }
        } else {
             console.log(`[ChordProcessor] Assigning noteId ${noteId} to voice ${this.voices.indexOf(voice)}`);
        }

        if (voice) {
            voice.noteOn(noteId, frequency, velocity, params);
            
            // Assuming the params of the first note in a chord dictate the effects for this block
            const fx = params.effects;
            if (fx) {
                this.distortion = fx.distortion || 0;
                if (fx.chorus) {
                    this.chorusRate = fx.chorus.rate || 0;
                    this.chorusDepth = fx.chorus.depth || 0;
                    this.chorusMix = fx.chorus.mix || 0;
                }
                if (fx.delay) {
                    this.delayTime = fx.delay.time || 0;
                    this.delayFeedback = fx.delay.feedback || 0;
                    this.delayMix = fx.delay.mix || 0;
                }
            }
        }
    }

    releaseVoiceForNote(noteId) {
        const voice = this.voices.find(v => v.noteId === noteId);
        if (voice) {
            voice.noteOff();
        }
    }

    process(inputs, outputs, parameters) {
        const outputL = outputs[0][0];
        const outputR = outputs[0][1];
        const blockEndTime = currentTime + 128 / sampleRate;

        // Process scheduled events
        let i = this.pendingEvents.length;
        while (i--) {
            const event = this.pendingEvents[i];
            if (event.when <= blockEndTime) {
                if (event.when >= currentTime) { // Ensure event is not in the past
                    if (event.type === 'noteOn') {
                        this.assignVoiceToNote(event);
                    } else if (event.type === 'noteOff') {
                        this.releaseVoiceForNote(event.noteId);
                    }
                }
                this.pendingEvents.splice(i, 1);
            }
        }

        for (let i = 0; i < outputL.length; i++) {
            let mixedSample = 0;

            for (const voice of this.voices) {
                 mixedSample += voice.process();
            }

            let finalSample = mixedSample / MAX_VOICES;

            // --- 5. Global Effects ---
            
            // Distortion
            if (this.distortion > 0) {
                finalSample = Math.tanh(finalSample * (1 + this.distortion * 5));
            }
            
            // Chorus
            let chorusSample = 0;
            if (this.chorusMix > 0) {
                const chorusRate = this.chorusRate / sampleRate;
                this.chorusLfoPhase += chorusRate * 2 * Math.PI;
                if (this.chorusLfoPhase > 2 * Math.PI) this.chorusLfoPhase -= 2 * Math.PI;

                const chorusDelay = (Math.sin(this.chorusLfoPhase) * this.chorusDepth + this.chorusDepth) * sampleRate;
                const readPos = (this.chorusWritePos - chorusDelay + this.chorusBuffer.length) % this.chorusBuffer.length;
                chorusSample = this.chorusBuffer[Math.floor(readPos)];
                this.chorusBuffer[this.chorusWritePos] = finalSample;
                this.chorusWritePos = (this.chorusWritePos + 1) % this.chorusBuffer.length;
            }
            
            finalSample += chorusSample * this.chorusMix;

            // Stereo Delay
            let finalL = finalSample, finalR = finalSample;
            if (this.delayMix > 0) {
                const readPosL = (this.delayWritePos - (this.delayTime * sampleRate) + this.delayBufferL.length) % this.delayBufferL.length;
                const readPosR = (this.delayWritePos - (this.delayTime * 0.75 * sampleRate) + this.delayBufferR.length) % this.delayBufferR.length;
                
                const delayedL = this.delayBufferL[Math.floor(readPosL)];
                const delayedR = this.delayBufferR[Math.floor(readPosR)];

                this.delayBufferL[this.delayWritePos] = finalL + delayedL * this.delayFeedback;
                this.delayBufferR[this.delayWritePos] = finalR + delayedR * this.delayFeedback;
                
                finalL = finalL * (1 - this.delayMix) + delayedL * this.delayMix;
                finalR = finalR * (1 - this.delayMix) + delayedR * this.delayMix;
            }
            this.delayWritePos = (this.delayWritePos + 1) % this.delayBufferL.length;

            outputL[i] = Math.tanh(finalL);
            outputR[i] = Math.tanh(finalR);
        }
        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
