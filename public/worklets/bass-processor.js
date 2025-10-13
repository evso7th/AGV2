
class BassProcessor extends AudioWorkletProcessor {
    // --- State ---
    frequency = 440;
    gain = 0;
    targetGain = 0;
    
    // --- Synth Parameters (can be controlled via messages) ---
    attack = 0.01;
    release = 0.2;
    oscType = 'sawtooth';
    filterCutoff = 800;
    filterQ = 1;
    distortion = 0;

    // --- Internal processing state ---
    phase = 0;
    filterState = 0;

    constructor() {
        super();
        this.port.onmessage = (event) => this.handleMessage(event.data);
        console.log('[bass-processor] Worklet constructed.');
    }
    
    handleMessage(data) {
        console.log('[bass-processor] 1. Received message:', JSON.stringify(data));
        if (data.type === 'noteOn') {
            this.frequency = data.frequency;
            this.targetGain = data.velocity;
            this.attack = data.attack || 0.01;
            this.release = data.release || 0.2;
            this.gain = 0; // Start attack phase
            console.log(`[bass-processor] 2. State updated: Freq=${this.frequency}, TargetGain=${this.targetGain}`);
        } else if (data.type === 'noteOff') {
            this.targetGain = 0; // Start release phase
        }
    }

    generateOsc(phase) {
        // Simple sawtooth for performance.
        return 1.0 - (2.0 * phase / (2 * Math.PI));
    }

    applyFilter(input) {
        const coeff = 1 - Math.exp(-2 * Math.PI * this.filterCutoff / sampleRate);
        this.filterState += coeff * (input - this.filterState);
        return this.filterState;
    }
    
    process(inputs, outputs, parameters) {
        const outputChannel = outputs[0][0];

        // This log will run for every single audio block. It's very verbose.
        console.log(`[bass-processor] 3. Processing block. Current Freq: ${this.frequency}, Current Gain: ${this.gain}`);

        for (let i = 0; i < outputChannel.length; i++) {
            // Envelope logic
            if (this.gain < this.targetGain) {
                this.gain = Math.min(this.targetGain, this.gain + (1 / (this.attack * sampleRate)));
            } else if (this.gain > this.targetGain) {
                this.gain = Math.max(this.targetGain, this.gain - (1 / (this.release * sampleRate)));
            }

            if (this.gain <= 0.0001) {
                outputChannel[i] = 0;
                continue;
            }
            
            // Oscillator
            this.phase += (this.frequency / sampleRate) * 2 * Math.PI;
            if (this.phase >= 2 * Math.PI) this.phase -= 2 * Math.PI;
            
            const rawSample = this.generateOsc(this.phase);
            const filteredSample = this.applyFilter(rawSample);
            
            outputChannel[i] = filteredSample * this.gain * 0.7; // Apply gain and a master volume
        }

        return true;
    }
}

registerProcessor('bass-processor', BassProcessor);
