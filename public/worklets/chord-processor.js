// public/worklets/chord-processor.js

const MAX_VOICES = 8;
const MAX_LAYERS_PER_VOICE = 8;

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
        this.delayBufferL = new Float32Array(sampleRate * 2);
        this.delayBufferR = new Float32Array(sampleRate * 2);
        this.delayWritePos = 0;
        this.chorusBuffer = new Float32Array(sampleRate * 0.1);
        this.chorusWritePos = 0;
        this.reset();
    }

    reset() {
        this.noteId = null;
        this.baseFrequency = 0;
        this.velocity = 0;
        this.adsrState = 'idle';
        this.adsrGain = 0;
        // Ensure params object is always initialized safely
        this.params = {
            layers: [],
            adsr: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.5 },
            filter: { type: 'lpf', cutoff: 8000, q: 1 },
            lfo: { shape: 'sine', rate: 5, amount: 0, target: 'pitch' },
            effects: { 
                distortion: 0,
                chorus: { rate: 0, depth: 0, mix: 0 },
                delay: { time: 0, feedback: 0, mix: 0 }
            }
        };
    }

    noteOn(noteId, frequency, velocity, rawParams) {
        this.reset();
        this.noteId = noteId;
        this.baseFrequency = frequency;
        this.velocity = velocity;
        this.adsrState = 'attack';
        
        const p = rawParams || {};
        
        this.params = {
            layers: p.layers || [{ type: 'sawtooth', detune: 0, octave: 0, gain: 1 }],
            adsr: p.adsr || { attack: p.attack || 0.01, decay: p.decay || 0.1, sustain: p.sustain || 0.7, release: p.release || 0.5 },
            filter: p.filter || { type: p.filterType || 'lpf', cutoff: p.cutoff || 8000, q: p.q || 1 },
            lfo: p.lfo || { shape: p.lfoShape || 'sine', rate: p.lfoRate || 5, amount: p.lfoAmount || 0, target: p.lfoTarget || 'pitch' },
            effects: p.effects || { 
                distortion: p.distortion || 0,
                chorus: p.chorus || { rate: 0, depth: 0, mix: 0 },
                delay: p.delay || { time: 0, feedback: 0, mix: 0 }
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
        if (!this.isActive()) return [0, 0];

        // --- 1. LFO --- 
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
        let pitchMod = (this.params.lfo.target === 'pitch') ? lfoValue : 0;
        let mixedSample = 0;
        if (this.params.layers && this.params.layers.length > 0) {
            for (let i = 0; i < this.params.layers.length; i++) {
                const layerParams = this.params.layers[i];
                mixedSample += this.layers[i].process(this.baseFrequency, layerParams.type, layerParams.detune + pitchMod, layerParams.octave, layerParams.gain);
            }
            mixedSample /= this.params.layers.length; // Normalize
        }

        // --- 3. Filter ---
        let filterCutoffMod = (this.params.lfo.target === 'filter') ? lfoValue : 0;
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
        let finalSample = filteredSample * this.adsrGain * this.velocity;

        // --- 5. Effects ---
        const fx = this.params.effects;

        if (fx.distortion > 0) {
            finalSample = Math.tanh(finalSample * (1 + fx.distortion * 5));
        }

        let chorusSample = 0;
        if(fx.chorus && fx.chorus.mix > 0){
            const chorusDelay = (Math.sin(this.lfoPhase * fx.chorus.rate) * fx.chorus.depth + fx.chorus.depth) * this.sampleRate;
            const readPos = (this.chorusWritePos - chorusDelay + this.chorusBuffer.length) % this.chorusBuffer.length;
            chorusSample = this.chorusBuffer[Math.floor(readPos)];
            this.chorusBuffer[this.chorusWritePos] = finalSample;
            this.chorusWritePos = (this.chorusWritePos + 1) % this.chorusBuffer.length;
        }
        finalSample += chorusSample * (fx.chorus?.mix ?? 0);

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
    constructor(options) {
        super();
        this.voices = Array.from({ length: MAX_VOICES }, () => new Voice(options.processorOptions?.sampleRate || sampleRate));
        this.pendingEvents = [];
        this.port.onmessage = this.handleMessage.bind(this);
        console.log(`[ChordProcessor] Initialized with ${MAX_VOICES} voices at ${options.processorOptions?.sampleRate || sampleRate}Hz.`);
    }

    handleMessage(event) {
        const events = Array.isArray(event.data) ? event.data : [event.data];
        for (const msg of events) {
            this.pendingEvents.push(msg);
        }
    }

    processPendingEvents(blockEndTime) {
        let i = this.pendingEvents.length;
        while (i--) {
            const event = this.pendingEvents[i];
            if (event.when <= blockEndTime) {
                this.pendingEvents.splice(i, 1);
                
                switch (event.type) {
                    case 'noteOn':
                        this.assignVoiceToNote(event);
                        break;
                    case 'noteOff':
                        this.releaseVoiceForNote(event.noteId);
                        break;
                    case 'clear':
                         this.voices.forEach(v => v.reset());
                         break;
                }
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
        const blockEndTime = currentTime + (128 / sampleRate);

        this.processPendingEvents(blockEndTime);

        for (let i = 0; i < outputL.length; i++) {
            let sampleL = 0;
            let sampleR = 0;

            for (const voice of this.voices) {
                if (voice.isActive()) {
                    const [voiceSampleL, voiceSampleR] = voice.process();
                    sampleL += voiceSampleL;
                    sampleR += voiceSampleR;
                }
            }
            
            // Basic clipping to prevent distortion from summing voices
            outputL[i] = Math.tanh(sampleL);
            outputR[i] = Math.tanh(sampleR);
        }
        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
