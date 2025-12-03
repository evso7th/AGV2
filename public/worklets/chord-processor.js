// PLAN 2.1: This file is modified to fix a TypeError.
// The `params` object in the Voice class is now fully initialized on `noteOn`,
// preventing errors when accessing properties like `filter` or `effects`.
// The actual application of chorus and delay effects remains in the main
// processor loop for performance optimization.

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
        this.phase = Math.random() * 2 * Math.PI; // Randomize phase to prevent phasing issues
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
        
        // PLAN 2.1 FIX: Restore full parameter structure to prevent undefined access.
        this.params = {
            layers: params.layers || [{ type: 'sawtooth', detune: 0, octave: 0, gain: 1 }],
            adsr: params.adsr || { attack: params.attack || 0.01, decay: params.decay || 0.1, sustain: params.sustain || 0.7, release: params.release || 0.5 },
            filter: params.filter || { type: 'lpf', cutoff: params.cutoff || 8000, q: params.q || 1 },
            lfo: params.lfo || { shape: 'sine', rate: 5, amount: 0, target: 'pitch' },
            effects: params.effects || { 
                distortion: params.distortion || 0,
                chorus: params.chorus || { rate: 0, depth: 0, mix: 0 },
                delay: params.delay || { time: 0, feedback: 0, mix: 0 }
            }
        };
    }

    noteOff() {
        this.adsrState = 'release';
    }

    isActive() {
        return this.adsrState !== 'idle';
    }

    process() {
        if (!this.isActive() || !this.params) return 0;

        // --- 1. LFO (Calculated once per block) --- 
        let lfoValue = 0;
        const lfoParams = this.params.lfo;
        if (lfoParams && lfoParams.amount > 0) {
            const lfoRate = lfoParams.rate / this.sampleRate;
            this.lfoPhase += lfoRate * 2 * Math.PI;
            if (this.lfoPhase > 2 * Math.PI) this.lfoPhase -= 2 * Math.PI;
            
            if(lfoParams.shape === 'sine') {
                lfoValue = Math.sin(this.lfoPhase) * lfoParams.amount;
            } else { // Square LFO
                lfoValue = (this.lfoPhase < Math.PI ? 1 : -1) * lfoParams.amount;
            }
        }
        
        // --- 2. Oscillators (Layers) --- 
        let pitchMod = (lfoParams.target === 'pitch') ? lfoValue : 0;
        let mixedSample = 0;
        for (let i = 0; i < this.params.layers.length; i++) {
            const layerParams = this.params.layers[i];
            mixedSample += this.layers[i].process(this.baseFrequency, layerParams.type, layerParams.detune + pitchMod, layerParams.octave, layerParams.gain);
        }
        if (this.params.layers.length > 0) {
           mixedSample /= this.params.layers.length; // Normalize
        }


        // --- 3. Filter ---
        let filterCutoffMod = this.params.lfo.target === 'filter' ? lfoValue : 0;
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
            case 'release':
                this.adsrGain -= this.adsrGain / (Math.max(0.001, release) * this.sampleRate);
                if (this.adsrGain <= 0.0001) {
                    this.adsrGain = 0;
                    this.adsrState = 'idle';
                }
                break;
        }

        // --- 5. Final Gain (without post-effects) ---
        // PLAN 2.0 Change: Effects are now applied after summing all voices.
        return filteredSample * this.adsrGain * this.velocity;
    }
}

class ChordProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        const sampleRate = options.processorOptions?.sampleRate || sampleRate;
        this.voices = Array.from({ length: MAX_VOICES }, () => new Voice(sampleRate));
        this.pendingEvents = [];
        
        // PLAN 2.0: Add effect components to the main processor
        this.delayBufferL = new Float32Array(sampleRate * 2);
        this.delayBufferR = new Float32Array(sampleRate * 2);
        this.delayWritePos = 0;
        this.chorusBuffer = new Float32Array(sampleRate * 0.1);
        this.chorusWritePos = 0;
        this.chorusLFOPhase = 0;
        
        // Store params from the *first active voice* to control global effects
        this.currentEffectParams = {};

        this.port.onmessage = this.handleMessage.bind(this);
        console.log(`[ChordProcessor] Initialized with ${MAX_VOICES} voices.`);
    }

    handleMessage(event) {
        const events = Array.isArray(event.data) ? event.data : [event.data];
        for(const msg of events){
            // Ensure events are scheduled with a small delay if 'when' is in the past
            const scheduleTime = Math.max(msg.when || 0, currentTime + 0.001);
            
            if (scheduleTime > currentTime) {
                this.pendingEvents.push({ ...msg, when: scheduleTime });
                this.pendingEvents.sort((a, b) => a.when - b.when);
                continue;
            }

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
    }

    assignVoiceToNote({ noteId, frequency, velocity, params }) {
        let voice = this.voices.find(v => !v.isActive());
        if (!voice) {
            voice = this.voices.sort((a,b) => a.adsrGain - b.adsrGain)[0];
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

    process(inputs, outputs, parameters) {
        const outputL = outputs[0][0];
        const outputR = outputs[0][1];
        const blockEndTime = currentTime + 128 / sampleRate;

        // Process scheduled events
        while (this.pendingEvents.length > 0 && this.pendingEvents[0].when < blockEndTime) {
            const event = this.pendingEvents.shift();
            if (event.type === 'noteOn') {
                this.assignVoiceToNote(event);
            } else if (event.type === 'noteOff') {
                this.releaseVoiceForNote(event.noteId);
            }
        }

        // Find the parameters of the most prominent voice to control global effects
        const activeVoices = this.voices.filter(v => v.isActive() && v.params);
        if (activeVoices.length > 0) {
            this.currentEffectParams = activeVoices.reduce((prev, curr) => (curr.adsrGain > prev.adsrGain ? curr : prev)).params.effects;
        } else {
             this.currentEffectParams = {};
        }

        const fx = this.currentEffectParams || {};

        for (let i = 0; i < outputL.length; i++) {
            let sampleL = 0;
            let sampleR = 0;

            // Sum all active voices
            for (const voice of this.voices) {
                if (voice.isActive()) {
                    const voiceSample = voice.process();
                    sampleL += voiceSample;
                    sampleR += voiceSample;
                }
            }

            // --- Apply global effects to the mixed signal ---
            
            // Distortion
            if (fx.distortion > 0) {
                sampleL = Math.tanh(sampleL * (1 + fx.distortion * 5));
                sampleR = Math.tanh(sampleR * (1 + fx.distortion * 5));
            }
            
            // Chorus
            if (fx.chorus && fx.chorus.mix > 0) {
                const chorusRate = (fx.chorus.rate || 0.1) / sampleRate;
                this.chorusLFOPhase += chorusRate * 2 * Math.PI;
                if (this.chorusLFOPhase > 2 * Math.PI) this.chorusLFOPhase -= 2 * Math.PI;

                const chorusDelay = (Math.sin(this.chorusLFOPhase) * fx.chorus.depth + fx.chorus.depth) * sampleRate;
                const readPos = (this.chorusWritePos - chorusDelay + this.chorusBuffer.length) % this.chorusBuffer.length;
                const chorusSample = this.chorusBuffer[Math.floor(readPos)] || 0;
                
                this.chorusBuffer[this.chorusWritePos] = sampleL;
                this.chorusWritePos = (this.chorusWritePos + 1) % this.chorusBuffer.length;
                
                sampleL = sampleL * (1 - fx.chorus.mix) + chorusSample * fx.chorus.mix;
                sampleR = sampleR * (1 - fx.chorus.mix) + chorusSample * fx.chorus.mix;
            }

            // Stereo Delay
            if (fx.delay && fx.delay.mix > 0) {
                const readPosL = (this.delayWritePos - (fx.delay.time * sampleRate) + this.delayBufferL.length) % this.delayBufferL.length;
                const readPosR = (this.delayWritePos - (fx.delay.time * 0.75 * sampleRate) + this.delayBufferR.length) % this.delayBufferR.length;
                
                const delayedL = this.delayBufferL[Math.floor(readPosL)] || 0;
                const delayedR = this.delayBufferR[Math.floor(readPosR)] || 0;

                this.delayBufferL[this.delayWritePos] = sampleL + delayedL * fx.delay.feedback;
                this.delayBufferR[this.delayWritePos] = sampleR + delayedR * fx.delay.feedback;
                
                sampleL = sampleL * (1 - fx.delay.mix) + delayedL * fx.delay.mix;
                sampleR = sampleR * (1 - fx.delay.mix) + delayedR * fx.delay.mix;
            }

            this.delayWritePos = (this.delayWritePos + 1) % this.delayBufferL.length;

            // Final output with clipping
            outputL[i] = Math.tanh(sampleL);
            outputR[i] = Math.tanh(sampleR);
        }
        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
