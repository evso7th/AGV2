
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
        this.reset();
    }
    
    reset() {
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

        // Band-limiting to prevent excessive resonance
        this.lp = Math.max(-1, Math.min(1, this.lp));
        this.bp = Math.max(-1, Math.min(1, this.bp));
        this.hp = Math.max(-1, Math.min(1, this.hp));

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
        this.delayBufferL = new Float32Array(sampleRate * 2);
        this.delayBufferR = new Float32Array(sampleRate * 2);
        this.delayWritePos = 0;
        this.chorusBuffer = new Float32Array(Math.floor(sampleRate * 0.1));
        this.chorusWritePos = 0;
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
        
        // --- PLAN 4.1: Create a robust, default-driven parameter structure ---
        const p = params || {};
        this.params = {
            layers: p.layers || [{ type: 'sawtooth', detune: 0, octave: 0, gain: 1 }],
            adsr: { 
                attack: p.attack ?? 0.01, 
                decay: p.decay ?? 0.1, 
                sustain: p.sustain ?? 0.7, 
                release: p.release ?? 0.5 
            },
            filter: { 
                type: p.type || 'lpf', 
                cutoff: p.cutoff ?? 8000, 
                q: p.q ?? 1 
            },
            lfo: { 
                shape: p.shape || 'sine', 
                rate: p.rate ?? 5, 
                amount: p.amount ?? 0, 
                target: p.target || 'pitch' 
            },
            effects: { 
                distortion: p.distortion ?? 0,
                chorus: p.chorus || { rate: 0, depth: 0, mix: 0 },
                delay: p.delay || { time: 0, feedback: 0, mix: 0 }
            },
            portamento: p.portamento ?? 0
        };
    }

    noteOff() {
        this.adsrState = 'release';
    }

    isActive() {
        return this.adsrState !== 'idle';
    }

    process() {
        if (!this.isActive() || !this.params.filter) return [0, 0];

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
        let pitchMod = (lfoParams?.target === 'pitch') ? lfoValue : 0;
        let mixedSample = 0;
        if (this.params.layers) {
            for (let i = 0; i < this.params.layers.length; i++) {
                const layerParams = this.params.layers[i];
                mixedSample += this.layers[i].process(this.baseFrequency, layerParams.type, layerParams.detune + pitchMod, layerParams.octave, layerParams.gain);
            }
            if (this.params.layers.length > 0) {
               mixedSample /= this.params.layers.length; // Normalize
            }
        }


        // --- 3. Filter ---
        let filterCutoffMod = (lfoParams?.target === 'filter') ? lfoValue : 0;
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
                // Ensure sustain is not 0 to avoid division by zero in the original formula
                const sustainLevel = Math.max(0.0001, sustain);
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
                    this.noteId = null; // PLAN 4.0 - Actually free the voice
                }
                break;
        }
        let finalSample = filteredSample * this.adsrGain * this.velocity;
        
        return [finalSample, finalSample]; // Return mono signal for now
    }
}

class ChordProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        const sampleRate = options.processorOptions?.sampleRate || 44100;
        this.voices = Array.from({ length: MAX_VOICES }, () => new Voice(sampleRate));
        this.pendingEvents = [];
        this.nextVoiceIndex = 0; // For round-robin

        // Global Effects
        this.delayBufferL = new Float32Array(sampleRate * 2);
        this.delayBufferR = new Float32Array(sampleRate * 2);
        this.delayWritePos = 0;
        this.currentDelayParams = null;
        
        this.chorusBuffer = new Float32Array(Math.floor(sampleRate * 0.1));
        this.chorusWritePos = 0;
        this.chorusLfoPhase = 0;
        this.currentChorusParams = null;


        this.port.onmessage = this.handleMessage.bind(this);
        console.log(`[ChordProcessor] Initialized with ${MAX_VOICES} voices.`);
    }

    handleMessage(event) {
        const events = Array.isArray(event.data) ? event.data : [event.data];
        for(const msg of events){
             // Defer processing to the main process loop to ensure time-ordering
             if (msg.when && msg.when > currentTime) {
                this.pendingEvents.push(msg);
             } else {
                 this.processEvent(msg);
             }
        }
    }
    
    processEvent(msg) {
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
        // PLAN 5.0 - Implement Round-Robin voice allocation
        let attempts = 0;
        let voice = null;
        
        // Find the next available voice using round-robin
        while (attempts < MAX_VOICES) {
            const currentVoice = this.voices[this.nextVoiceIndex];
            if (!currentVoice.isActive()) {
                voice = currentVoice;
                break;
            }
            this.nextVoiceIndex = (this.nextVoiceIndex + 1) % MAX_VOICES;
            attempts++;
        }
        
        // If all voices are active, steal the quietest one
        if (!voice) {
             voice = this.voices.sort((a,b) => a.adsrGain - b.adsrGain)[0];
             console.log(`[ChordProcessor] Stealing voice for noteId ${noteId}`);
        } else {
             console.log(`[ChordProcessor] Assigning noteId ${noteId} to voice ${this.nextVoiceIndex}`);
        }
        
        if (voice) {
            voice.noteOn(noteId, frequency, velocity, params);
            // After assigning, move to the next index for the next note
            this.nextVoiceIndex = (this.voices.indexOf(voice) + 1) % MAX_VOICES;

            // Set up effects params from the first note of a chord
            if (params.effects) {
                if (!this.currentDelayParams && params.effects.delay?.mix > 0) {
                    this.currentDelayParams = params.effects.delay;
                }
                 if (!this.currentChorusParams && params.effects.chorus?.mix > 0) {
                    this.currentChorusParams = params.effects.chorus;
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
        while(i--) {
            const event = this.pendingEvents[i];
            if (event.when < blockEndTime) {
                this.pendingEvents.splice(i, 1);
                this.processEvent(event);
            }
        }

        // Process each audio frame
        for (let frame = 0; frame < outputL.length; frame++) {
            let sampleL = 0;
            let sampleR = 0;

            // Sum all active voices
            for (const voice of this.voices) {
                if (voice.isActive()) {
                    const [voiceSampleL, voiceSampleR] = voice.process();
                    sampleL += voiceSampleL;
                    sampleR += voiceSampleR;
                }
            }
            
            // --- Global Effects ---
            let finalL = sampleL;
            let finalR = sampleR;

            const fx = this.voices[0]?.params?.effects; // Use effects from the first voice as a reference
            if (!fx) { // Fallback if no voice has effects params
                 outputL[frame] = Math.tanh(sampleL / MAX_VOICES);
                 outputR[frame] = Math.tanh(sampleR / MAX_VOICES);
                 continue;
            }

            // Distortion (applied to mono sum)
            if (fx.distortion > 0) {
                const monoSample = (finalL + finalR) * 0.5;
                const distorted = Math.tanh(monoSample * (1 + fx.distortion * 5));
                finalL = distorted;
                finalR = distorted;
            }
            
            // Chorus
            if (this.currentChorusParams && this.currentChorusParams.mix > 0) {
                 const { rate, depth, mix } = this.currentChorusParams;
                 this.chorusLfoPhase += (rate / sampleRate) * 2 * Math.PI;
                 if (this.chorusLfoPhase > 2 * Math.PI) this.chorusLfoPhase -= 2 * Math.PI;
                 
                 const chorusDelay = (Math.sin(this.chorusLfoPhase) * depth + depth) * sampleRate;
                 const readPos = (this.chorusWritePos - chorusDelay + this.chorusBuffer.length) % this.chorusBuffer.length;
                 const chorusSample = this.chorusBuffer[Math.floor(readPos)];

                 this.chorusBuffer[this.chorusWritePos] = (finalL + finalR) * 0.5;
                 this.chorusWritePos = (this.chorusWritePos + 1) % this.chorusBuffer.length;

                 finalL = finalL * (1 - mix) + chorusSample * mix;
                 finalR = finalR * (1 - mix) - chorusSample * mix; // Invert phase for stereo
            } else {
                this.currentChorusParams = null; // Reset if mix is 0
            }

            // Stereo Delay
            if (this.currentDelayParams && this.currentDelayParams.mix > 0) {
                const { time, feedback, mix } = this.currentDelayParams;
                const readPosL = (this.delayWritePos - (time * sampleRate) + this.delayBufferL.length) % this.delayBufferL.length;
                const readPosR = (this.delayWritePos - (time * 0.75 * sampleRate) + this.delayBufferR.length) % this.delayBufferR.length;
                
                const delayedL = this.delayBufferL[Math.floor(readPosL)];
                const delayedR = this.delayBufferR[Math.floor(readPosR)];

                this.delayBufferL[this.delayWritePos] = finalL + delayedL * feedback;
                this.delayBufferR[this.delayWritePos] = finalR + delayedR * feedback;
                
                finalL = finalL * (1 - mix) + delayedL * mix;
                finalR = finalR * (1 - mix) + delayedR * mix;

            } else {
                this.currentDelayParams = null; // Reset if mix is 0
            }
            this.delayWritePos = (this.delayWritePos + 1) % this.delayBufferL.length;

            // Final output with clipping
            outputL[frame] = Math.tanh(finalL);
            outputR[frame] = Math.tanh(finalR);
        }
        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
