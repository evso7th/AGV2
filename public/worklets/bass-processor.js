// public/worklets/bass-processor.js

/**
 * A robust subtractive synthesizer running inside an AudioWorklet.
 * It handles messages for note events and parameter changes, generating audio
 * in a separate, high-priority thread to ensure smooth playback.
 */
class BassProcessor extends AudioWorkletProcessor {
    // --- Parameters exposed to the AudioWorkletNode ---
    static get parameterDescriptors() {
        return [
            { name: 'attack', defaultValue: 0.01, minValue: 0.001, maxValue: 1 },
            { name: 'release', defaultValue: 0.3, minValue: 0.05, maxValue: 2 },
            { name: 'cutoff', defaultValue: 800, minValue: 100, maxValue: 10000 },
            { name: 'resonance', defaultValue: 0.7, minValue: 0.1, maxValue: 5 },
            { name: 'distortion', defaultValue: 0.1, minValue: 0, maxValue: 1 },
            { name: 'portamento', defaultValue: 0.05, minValue: 0, maxValue: 0.5 },
        ];
    }

    constructor() {
        super();
        this.port.onmessage = (event) => this.handleMessage(event.data);
        
        // Synthesis state
        this.phase = 0;
        this.currentGain = 0;
        this.targetGain = 0;
        this.frequency = 0;
        this.isActive = false;

        // Filter state
        this.filterStateL = 0;
        this.filterStateR = 0;
    }

    handleMessage(message) {
        const { type, ...data } = message;

        if (type === 'noteOn') {
            this.frequency = data.frequency;
            this.targetGain = data.velocity || 0.7; // Fallback to a default velocity
            this.isActive = true;
        } else if (type === 'noteOff') {
            this.targetGain = 0;
        }
    }
    
    // --- Synthesis Functions ---

    // Simple sawtooth + sine sub-oscillator
    generateOsc(phase) {
        const saw = 1 - (phase / Math.PI);
        const sub = Math.sin(phase * 0.5);
        return saw * 0.7 + sub * 0.3;
    }

    // Basic one-pole low-pass filter
    applyFilter(input, coeff, isLeft) {
        if (isLeft) {
            this.filterStateL += coeff * (input - this.filterStateL);
            return this.filterStateL;
        }
        this.filterStateR += coeff * (input - this.filterStateR);
        return this.filterStateR;
    }
    
    // Simple soft-clipping distortion
    softClip(input, drive) {
        if (drive === 0) return input;
        const k = 2 + drive * 10;
        return (1 + k) * input / (1 + k * Math.abs(input));
    }
    
    // --- Main Audio Processing Block ---
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channelCount = output.length;
        const frameCount = output[0].length;

        // Get parameters for this block. Using index 0 assumes they are not being automated per-sample.
        const attackTime = parameters.attack[0];
        const releaseTime = parameters.release[0];
        const cutoff = parameters.cutoff[0];
        const resonance = parameters.resonance[0]; // Resonance not used in this simple filter
        const distortion = parameters.distortion[0];
        
        const attackStep = 1 / (attackTime * sampleRate);
        const releaseStep = 1 / (releaseTime * sampleRate);
        
        const filterCoeff = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);

        for (let i = 0; i < frameCount; i++) {
            let sample = 0;

            if (this.isActive) {
                // Envelope logic
                if (this.currentGain < this.targetGain) {
                    this.currentGain = Math.min(this.targetGain, this.currentGain + attackStep);
                } else if (this.currentGain > this.targetGain) {
                    this.currentGain = Math.max(this.targetGain, this.currentGain - releaseStep);
                }

                if (this.currentGain > 0.001) {
                    // Oscillator
                    this.phase += (this.frequency * 2 * Math.PI) / sampleRate;
                    if (this.phase >= 2 * Math.PI) this.phase -= 2 * Math.PI;
                    sample = this.generateOsc(this.phase);
                } else {
                    this.isActive = false; // Note has fully faded out
                    this.currentGain = 0;
                }
            }
            
            // Apply gain, filter, and distortion
            const gainedSample = sample * this.currentGain;
            const filteredSample = this.applyFilter(gainedSample, filterCoeff, true);
            const distortedSample = this.softClip(filteredSample, distortion);
            
            // Output to all channels
            for (let channel = 0; channel < channelCount; channel++) {
                output[channel][i] = distortedSample * 0.5; // Final master volume
            }
        }

        return true;
    }
}

registerProcessor('bass-processor', BassProcessor);
