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
        this.noteId = noteId;
        this.baseFrequency = frequency;
        this.velocity = velocity;
        this.adsrState = 'attack';
        this.adsrGain = 0;

        // --- PLAN 4.1: Robust Parameter Initialization ---
        // Create a complete, nested params object with defaults,
        // then override with any values provided in the incoming `params`.
        const p = params || {};
        this.params = {
            layers: p.layers || [{ type: 'sawtooth', detune: 0, octave: 0, gain: 1 }],
            adsr: {
                attack: p.attack ?? 0.01,
                decay: p.decay ?? 0.1,
                sustain: p.sustain ?? 0.7,
                release: p.release ?? 0.5,
            },
            filter: {
                type: p.filter?.type ?? p.filterType ?? 'lpf',
                cutoff: p.filter?.cutoff ?? p.cutoff ?? 8000,
                q: p.filter?.q ?? p.q ?? p.resonance ?? 1,
            },
            lfo: {
                shape: p.lfo?.shape ?? 'sine',
                rate: p.lfo?.rate ?? 5,
                amount: p.lfo?.amount ?? 0,
                target: p.lfo?.target ?? 'pitch',
            },
            effects: {
                distortion: p.effects?.distortion ?? p.distortion ?? 0,
                chorus: {
                    rate: p.effects?.chorus?.rate ?? 0,
                    depth: p.effects?.chorus?.depth ?? 0,
                    mix: p.effects?.chorus?.mix ?? 0,
                },
                delay: {
                    time: p.effects?.delay?.time ?? 0,
                    feedback: p.effects?.delay?.feedback ?? 0,
                    mix: p.effects?.delay?.mix ?? 0,
                }
            }
        };
    }

    noteOff() {
        if (this.isActive()) {
            this.adsrState = 'release';
        }
    }

    isActive() {
        return this.adsrState !== 'idle';
    }

    process() {
        if (!this.isActive() || !this.params) return 0;

        // --- 1. LFO --- 
        let lfoValue = 0;
        const lfoParams = this.params.lfo;
        if (lfoParams.amount > 0) {
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
        const pitchMod = (this.params.lfo.target === 'pitch') ? lfoValue : 0;
        let mixedSample = 0;
        for (let i = 0; i < this.params.layers.length; i++) {
            const layerParams = this.params.layers[i];
            mixedSample += this.layers[i].process(this.baseFrequency, layerParams.type, layerParams.detune + pitchMod, layerParams.octave, layerParams.gain);
        }
        if (this.params.layers.length > 0) {
           mixedSample /= this.params.layers.length; // Normalize
        }

        // --- 3. Filter ---
        const filterCutoffMod = this.params.lfo.target === 'filter' ? lfoValue : 0;
        const filteredSample = this.filter.process(mixedSample, this.params.filter.cutoff + filterCutoffMod, this.params.filter.q, this.params.filter.type);

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
                   this.reset(); // Fully deactivate the voice
                }
                break;
        }

        return filteredSample * this.adsrGain * this.velocity;
    }
}

class ChordProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        const sampleRate = options.processorOptions?.sampleRate || 44100;
        this.voices = Array.from({ length: MAX_VOICES }, () => new Voice(sampleRate));
        this.pendingEvents = [];

        // Effects moved here for single processing
        this.delayBufferL = new Float32Array(sampleRate * 2);
        this.delayBufferR = new Float32Array(sampleRate * 2);
        this.delayWritePos = 0;
        this.chorusBuffer = new Float32Array(sampleRate * 0.1);
        this.chorusWritePos = 0;
        
        // These will be updated by the most recent noteOn event
        this.activeEffects = {
            distortion: 0,
            chorus: { rate: 0, depth: 0, mix: 0 },
            delay: { time: 0, feedback: 0, mix: 0 }
        };

        this.port.onmessage = this.handleMessage.bind(this);
        console.log(`[ChordProcessor] Initialized with ${MAX_VOICES} voices.`);
    }

    handleMessage(event) {
        const events = Array.isArray(event.data) ? event.data : [event.data];
        for (const msg of events) {
            switch (msg.type) {
                case 'noteOn':
                    this.assignVoiceToNote(msg);
                    // Update the processor-level effects with the latest note's settings
                    if(msg.params?.effects) {
                        this.activeEffects = { ...this.activeEffects, ...msg.params.effects };
                    } else { // Fallback for flat params
                         this.activeEffects = {
                            distortion: msg.params?.distortion ?? this.activeEffects.distortion,
                            chorus: msg.params?.chorus ?? this.activeEffects.chorus,
                            delay: msg.params?.delay ?? this.activeEffects.delay
                        }
                    }
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
        if (when > currentTime) {
            this.pendingEvents.push({ type: 'noteOn', noteId, frequency, velocity, params, when });
            return;
        }

        let voice = this.voices.find(v => !v.isActive());
        if (!voice) {
            voice = this.voices.sort((a, b) => a.adsrGain - b.adsrGain)[0];
            if (voice && voice.isActive()) {
                console.log(`[ChordProcessor] Stealing quietest voice ${this.voices.indexOf(voice)} for noteId ${noteId}`);
            }
        }

        if (voice) {
             console.log(`[ChordProcessor] Assigning noteId ${noteId} to voice ${this.voices.indexOf(voice)}`);
            voice.noteOn(noteId, frequency, velocity, params);
        } else {
             console.warn(`[ChordProcessor] No available voices for noteId ${noteId}`);
        }
    }

    releaseVoiceForNote(noteId, when) {
        if (when > currentTime) {
            this.pendingEvents.push({ type: 'noteOff', noteId, when });
            return;
        }
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
            if (event.when < blockEndTime) {
                this.pendingEvents.splice(i, 1);
                if (event.type === 'noteOn') {
                    this.assignVoiceToNote(event);
                } else if (event.type === 'noteOff') {
                    this.releaseVoiceForNote(event.noteId, event.when);
                }
            }
        }

        for (let i = 0; i < outputL.length; i++) {
            let mixedSample = 0;

            // --- 1. Mix all active voices ---
            for (const voice of this.voices) {
                mixedSample += voice.process();
            }
            
            // Normalize
            mixedSample = Math.tanh(mixedSample / MAX_VOICES);

            // --- 2. Apply effects to the mixed signal ---
            let finalSample = mixedSample;
            const fx = this.activeEffects;

            // Distortion
            if (fx.distortion > 0) {
                finalSample = Math.tanh(finalSample * (1 + fx.distortion * 5));
            }
            
            // Chorus
            let chorusSample = 0;
            if (fx.chorus && fx.chorus.mix > 0) {
                const chorusDelay = (Math.sin((currentTime + i / sampleRate) * fx.chorus.rate) * fx.chorus.depth + fx.chorus.depth) * sampleRate;
                const readPos = (this.chorusWritePos - chorusDelay + this.chorusBuffer.length) % this.chorusBuffer.length;
                chorusSample = this.chorusBuffer[Math.floor(readPos)];
                this.chorusBuffer[this.chorusWritePos] = finalSample;
                this.chorusWritePos = (this.chorusWritePos + 1) % this.chorusBuffer.length;
            }
            finalSample += chorusSample * (fx.chorus?.mix ?? 0);

            // Stereo Delay
            let finalL = finalSample, finalR = finalSample;
            if (fx.delay && fx.delay.mix > 0) {
                const readPosL = (this.delayWritePos - (fx.delay.time * sampleRate) + this.delayBufferL.length) % this.delayBufferL.length;
                const readPosR = (this.delayWritePos - (fx.delay.time * 0.75 * sampleRate) + this.delayBufferR.length) % this.delayBufferR.length;
                
                const delayedL = this.delayBufferL[Math.floor(readPosL)];
                const delayedR = this.delayBufferR[Math.floor(readPosR)];

                this.delayBufferL[this.delayWritePos] = finalL + delayedL * fx.delay.feedback;
                this.delayBufferR[this.delayWritePos] = finalR + delayedR * fx.delay.feedback;
                
                finalL = finalL * (1 - fx.delay.mix) + delayedL * fx.delay.mix;
                finalR = finalR * (1 - fx.delay.mix) + delayedR * fx.delay.mix;
            }
            this.delayWritePos = (this.delayWritePos + 1) % this.delayBufferL.length;
            
            outputL[i] = Math.tanh(finalL);
            outputR[i] = Math.tanh(finalR);
        }
        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
