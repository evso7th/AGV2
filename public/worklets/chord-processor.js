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
    }

    noteOn(noteId, frequency, velocity, params) {
        this.noteId = noteId;
        this.baseFrequency = frequency;
        this.velocity = velocity;
        this.adsrState = 'attack';
        this.adsrGain = 0;

        // Create a full, valid parameter structure, using defaults if properties are missing
        this.params = {
            layers: params.layers || [{ type: 'sawtooth', detune: 0, octave: 0, gain: 1 }],
            adsr: { 
                attack: params.attack ?? 0.01, 
                decay: params.decay ?? 0.1, 
                sustain: params.sustain ?? 0.7, 
                release: params.release ?? 0.5 
            },
            filter: { 
                type: params.filter?.type || 'lpf', 
                cutoff: params.cutoff ?? params.filter?.cutoff ?? 8000, 
                q: params.q ?? params.filter?.q ?? 1 
            },
            lfo: params.lfo || { shape: 'sine', rate: 5, amount: 0, target: 'pitch' },
            effects: params.effects || { 
                distortion: params.distortion ?? 0,
                chorus: params.chorus ?? { rate: 0, depth: 0, mix: 0 },
                delay: params.delay ?? { time: 0, feedback: 0, mix: 0 }
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

        // --- ADSR Envelope ---
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
                // Check if sustain is a valid number
                const sustainLevel = (sustain !== undefined && sustain >= 0) ? sustain : 0.7;
                this.adsrGain -= (1 - sustainLevel) / (Math.max(0.001, decay) * this.sampleRate);
                if (this.adsrGain <= sustainLevel) {
                    this.adsrGain = sustainLevel;
                    this.adsrState = 'sustain';
                }
                break;
            case 'release':
                this.adsrGain -= this.adsrGain / (Math.max(0.001, release) * this.sampleRate);
                if (this.adsrGain <= 0.0001) {
                    this.adsrGain = 0;
                    this.adsrState = 'idle';
                    this.noteId = null; // Mark voice as free
                }
                break;
            case 'sustain':
                // Sustain level is maintained
                break;
        }

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
        let pitchMod = (this.params.lfo.target === 'pitch') ? lfoValue : 0; // Modulate in cents
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


        let finalSample = filteredSample * this.adsrGain * this.velocity;
        
        return [finalSample, finalSample];
    }
}

class ChordProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        const sampleRate = options.processorOptions?.sampleRate || sampleRate;
        this.voices = Array.from({ length: MAX_VOICES }, () => new Voice(sampleRate));
        this.pendingEvents = [];
        this.nextVoice = 0; // For round-robin allocation

        // --- Effects ---
        this.delayBufferL = new Float32Array(sampleRate * 2);
        this.delayBufferR = new Float32Array(sampleRate * 2);
        this.delayWritePos = 0;
        this.chorusBuffer = new Float32Array(sampleRate * 0.1);
        this.chorusWritePos = 0;
        this.currentEffects = {}; // Holds effects for the current block

        this.port.onmessage = this.handleMessage.bind(this);
        console.log(`[ChordProcessor] Initialized with ${MAX_VOICES} voices.`);
    }

    handleMessage(event) {
        const events = Array.isArray(event.data) ? event.data : [event.data];
        for(const msg of events){
            // Ensure scheduling is handled correctly
            if (msg.when && msg.when > currentTime) {
                this.pendingEvents.push(msg);
            } else {
                this.processMessage(msg);
            }
        }
        // Sort pending events by time
        this.pendingEvents.sort((a, b) => a.when - b.when);
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
                this.pendingEvents = [];
                break;
        }
    }
    
    assignVoiceToNote({ noteId, frequency, velocity, params }) {
        let voice = null;
        // Round-robin search for an idle voice
        for (let i = 0; i < MAX_VOICES; i++) {
            const voiceIndex = (this.nextVoice + i) % MAX_VOICES;
            if (!this.voices[voiceIndex].isActive()) {
                voice = this.voices[voiceIndex];
                this.nextVoice = (voiceIndex + 1) % MAX_VOICES;
                console.log(`[ChordProcessor] Assigning noteId ${noteId} to voice ${voiceIndex}`);
                break;
            }
        }

        // If no idle voice, steal the oldest/quietest one
        if (!voice) {
            // Simple voice stealing: find the one with the lowest gain.
            voice = this.voices.reduce((prev, curr) => (curr.adsrGain < prev.adsrGain ? curr : prev));
            const voiceIndex = this.voices.indexOf(voice);
            console.log(`[ChordProcessor] Stealing quietest voice ${voiceIndex} (gain: ${voice.adsrGain.toFixed(3)}) for noteId ${noteId}`);
            this.nextVoice = (voiceIndex + 1) % MAX_VOICES;
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

        // Process pending events
        while (this.pendingEvents.length > 0 && this.pendingEvents[0].when < blockEndTime) {
            const event = this.pendingEvents.shift();
            this.processMessage(event);
        }

        // Use the parameters from the first active voice for shared effects
        const firstActiveVoice = this.voices.find(v => v.isActive());
        const fx = firstActiveVoice?.params?.effects || { distortion: 0, chorus: { mix:0 }, delay: { mix: 0 } };


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
            
            // Normalize
            let finalL = Math.tanh(sampleL / MAX_VOICES);
            let finalR = Math.tanh(sampleR / MAX_VOICES);

            // --- 5. Shared Effects ---
            // Distortion
            if (fx.distortion > 0) {
                finalL = Math.tanh(finalL * (1 + fx.distortion * 5));
                finalR = Math.tanh(finalR * (1 + fx.distortion * 5));
            }
            
            // Chorus (simplified mono-to-stereo)
            let chorusSample = 0;
            if(fx.chorus && fx.chorus.mix > 0){
                const chorusDelay = (Math.sin(this.chorusWritePos / this.chorusBuffer.length * 2 * Math.PI * fx.chorus.rate) * fx.chorus.depth + fx.chorus.depth) * this.sampleRate;
                const readPos = (this.chorusWritePos - chorusDelay + this.chorusBuffer.length) % this.chorusBuffer.length;
                chorusSample = this.chorusBuffer[Math.floor(readPos)];
                this.chorusBuffer[this.chorusWritePos] = (finalL + finalR) / 2; // Mix to mono for chorus buffer
                this.chorusWritePos = (this.chorusWritePos + 1) % this.chorusBuffer.length;
            }
            finalL += chorusSample * (fx.chorus?.mix ?? 0);
            finalR -= chorusSample * (fx.chorus?.mix ?? 0); // Invert for stereo effect

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

            outputL[i] = finalL;
            outputR[i] = finalR;
        }
        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
