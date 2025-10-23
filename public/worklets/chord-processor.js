// public/worklets/chord-processor.js

/**
 * A simple voice for our polyphonic synth. Each voice handles one note.
 */
class Voice {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.reset();
    }

    reset() {
        this.noteId = null;
        this.frequency = 0;
        this.phase = 0;
        this.gain = 0;
        this.targetGain = 0;
        this.velocity = 0;

        // Envelope params
        this.attack = 0.01;
        this.release = 0.3;
        this.sustainLevel = 0.7; // Not used in this simple version yet
        this.decay = 0.1; // Not used in this simple version yet

        // Filter params
        this.filterState = 0;
        this.filterCoeff = 0;
        this.filterCutoff = 20000;
        this.q = 0.7;

        // Osc
        this.oscType = 'sawtooth';
    }

    noteOn(noteId, frequency, velocity, params) {
        this.reset();
        this.noteId = noteId;
        this.frequency = frequency;
        this.velocity = velocity;
        this.targetGain = velocity; // Target gain is the velocity
        this.gain = 0; // Start from 0 for attack phase

        // Apply params
        this.attack = params.attack ?? 0.01;
        this.release = params.release ?? 0.3;
        this.filterCutoff = params.cutoff ?? 20000;
        this.q = params.resonance ?? 0.7;
        this.oscType = params.oscType || 'sawtooth';

        this.filterCoeff = 1 - Math.exp(-2 * Math.PI * this.filterCutoff / this.sampleRate);
    }

    noteOff(releaseTime) {
        this.targetGain = 0; // Start the release phase
        this.release = releaseTime ?? this.release;
    }

    /**
     * Generates a single sample for this voice.
     */
    process() {
        if (this.frequency === 0) {
            return 0;
        }

        // --- Envelope ---
        if (this.gain < this.targetGain) { // Attack phase
            this.gain = Math.min(this.targetGain, this.gain + (1 / (this.attack * this.sampleRate)));
        } else if (this.gain > this.targetGain) { // Release phase
            this.gain = Math.max(this.targetGain, this.gain - (1 / (this.release * this.sampleRate)));
        }

        if (this.gain <= 0.0001 && this.targetGain === 0) {
            this.reset();
            return 0;
        }

        // --- Oscillator ---
        this.phase += (this.frequency / this.sampleRate) * 2 * Math.PI;
        if (this.phase >= 2 * Math.PI) this.phase -= 2 * Math.PI;
        
        let sample = 0;
        switch (this.oscType) {
            case 'sine': sample = Math.sin(this.phase); break;
            case 'triangle': sample = 1 - 4 * Math.abs((this.phase / (2 * Math.PI)) - 0.5); break;
            case 'square': sample = this.phase < Math.PI ? 1 : -1; break;
            case 'sawtooth': default: sample = 1 - (this.phase / Math.PI); break;
        }

        // --- Filter (simple one-pole LPF) ---
        this.filterState += this.filterCoeff * (sample - this.filterState);
        
        return this.filterState * this.gain;
    }

    isActive() {
        return this.frequency > 0;
    }
}


/**
 * A polyphonic synthesizer processor that manages multiple voices.
 */
class ChordProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        this.voices = [];
        const sampleRate = options.processorOptions?.sampleRate || 44100;
        for (let i = 0; i < 4; i++) { // 4 voices for polyphony
            this.voices.push(new Voice(sampleRate));
        }

        this.port.onmessage = this.handleMessage.bind(this);
        console.log('[ChordProcessor] Initialized with 4 voices.');
    }

    handleMessage(event) {
        const message = event.data;
        // Check if message is an array (batch) or single object
        const messages = Array.isArray(message) ? message : [message];

        for (const msg of messages) {
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
            // Simple voice stealing: find the one with the lowest gain
            voice = this.voices.reduce((prev, curr) => (curr.gain < prev.gain ? curr : prev));
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
        const output = outputs[0];
        const numChannels = output.length;

        for (let i = 0; i < output[0].length; i++) {
            let sample = 0;
            for (const voice of this.voices) {
                if (voice.isActive()) {
                    sample += voice.process();
                }
            }
            // Clip to avoid distortion
            sample = Math.max(-1, Math.min(1, sample * 0.5)); // Mixdown with gain reduction

            for (let channel = 0; channel < numChannels; channel++) {
                output[channel][i] = sample;
            }
        }
        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
