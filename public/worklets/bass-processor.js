// public/worklets/bass-processor.js

// A simple one-pole low-pass filter
class LowPassFilter {
    constructor() {
        this.y1 = 0;
        this.a0 = 1.0;
        this.b1 = 0.0;
    }

    setCutoff(cutoff, sampleRate) {
        if (cutoff >= sampleRate / 2) {
            this.a0 = 1.0;
            this.b1 = 0.0;
        } else {
            const rc = 1.0 / (2 * Math.PI * cutoff);
            this.a0 = 1.0 / (1.0 + sampleRate * rc);
            this.b1 = 1.0 - this.a0;
        }
    }

    process(input) {
        this.y1 = this.a0 * input + this.b1 * this.y1;
        // Basic check to prevent denormals
        if (this.y1 < 1.0e-25 && this.y1 > -1.0e-25) {
            this.y1 = 0;
        }
        return this.y1;
    }
}


class BassProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'cutoff', defaultValue: 800, minValue: 20, maxValue: 10000, automationRate: 'a-rate' },
            { name: 'resonance', defaultValue: 1, minValue: 0.1, maxValue: 20, automationRate: 'a-rate' },
            { name: 'distortion', defaultValue: 0.1, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
            { name: 'portamento', defaultValue: 0.05, minValue: 0, maxValue: 0.5, automationRate: 'k-rate' }
        ];
    }

    constructor() {
        super();
        this.phase = 0;
        this.frequency = 0;
        this.targetFrequency = 0;
        
        this.envelope = {
            attackTime: 0.01,
            releaseTime: 0.3,
            gain: 0,
            targetGain: 0,
            state: 'idle', // idle, attack, decay, sustain, release
        };
        
        this.technique = 'pluck';
        this.pulse = {
            counter: -1,
            interval: 0,
            notes: [0, 7, 12, 7], // root, 5th, octave, 5th
            step: 0,
            baseFrequency: 0,
        };

        this.filter = new LowPassFilter();
        
        this.port.onmessage = (event) => this.handleMessage(event);
        console.log('[BassProcessor] Instance created.');
    }

    handleMessage(event) {
        const { type, ...data } = event.data;
        console.log(`[BassProcessor] Received message:`, event.data);

        const time = data.when || currentTime;

        switch(type) {
            case 'noteOn':
                this.technique = data.technique || 'pluck';
                
                if (this.envelope.gain > 0 && data.portamento > 0) {
                    this.targetFrequency = data.frequency;
                } else {
                    this.frequency = data.frequency;
                    this.targetFrequency = data.frequency;
                }

                this.envelope.targetGain = data.velocity;
                this.envelope.state = 'attack';

                if (this.technique === 'pulse') {
                    this.pulse.baseFrequency = data.frequency;
                    this.pulse.counter = 0;
                    this.pulse.step = 0;
                    this.pulse.interval = Math.floor(sampleRate / (8 / (120/60))); // 16th notes
                } else {
                    this.pulse.counter = -1;
                }
                break;
            case 'noteOff':
                 this.envelope.targetGain = 0;
                 this.envelope.state = 'release';
                 this.pulse.counter = -1;
                 break;
        }
    }
    
    pulseWave(phase, width) { return phase % (2 * Math.PI) < width * 2 * Math.PI ? 1 : -1; }
    softClip(input, drive) {
        const k = Math.max(0, drive * 5); // Ensure k is non-negative
        return (1 + k) * input / (1 + k * Math.abs(input));
    }


    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channel = output[0];
        
        const cutoff = parameters.cutoff;
        const resonance = parameters.resonance; // Not used in this simplified filter
        const distortion = parameters.distortion;
        const portamento = parameters.portamento[0]; // k-rate

        for (let i = 0; i < channel.length; i++) {
            // -- Handle Time-based logic first --

            // Pulse technique
            if (this.technique === 'pulse' && this.pulse.counter !== -1) {
                if (this.pulse.counter % this.pulse.interval === 0) {
                    const noteOffset = this.pulse.notes[this.pulse.step % this.pulse.notes.length];
                    this.frequency = this.pulse.baseFrequency * Math.pow(2, noteOffset / 12);
                    this.targetFrequency = this.frequency;
                    this.envelope.gain = this.envelope.targetGain; // Re-trigger envelope
                    this.envelope.state = 'attack';
                    this.pulse.step++;
                }
                this.pulse.counter++;
            }
            
            // Portamento
            if (this.frequency !== this.targetFrequency && portamento > 0) {
                const step = (this.targetFrequency - this.frequency) / (portamento * sampleRate);
                this.frequency += step;
                if (Math.abs(this.frequency - this.targetFrequency) < Math.abs(step)) {
                    this.frequency = this.targetFrequency;
                }
            }
            
            // Envelope
            if (this.envelope.state === 'attack') {
                this.envelope.gain += 1.0 / (this.envelope.attackTime * sampleRate);
                if (this.envelope.gain >= this.envelope.targetGain) {
                    this.envelope.gain = this.envelope.targetGain;
                    this.envelope.state = 'decay'; // or sustain if we have it
                }
            } else if (this.envelope.state === 'release') {
                this.envelope.gain -= 1.0 / (this.envelope.releaseTime * sampleRate);
                if (this.envelope.gain <= 0) {
                    this.envelope.gain = 0;
                    this.envelope.state = 'idle';
                    this.frequency = 0;
                }
            }


            // -- Audio Synthesis --
            let sample = 0;
            if (this.envelope.gain > 0 && this.frequency > 0) {
                 this.phase += (this.frequency * 2 * Math.PI) / sampleRate;
                 if (this.phase >= 2 * Math.PI) this.phase -= 2 * Math.PI;

                 const osc1 = this.pulseWave(this.phase, 0.5);
                 const osc2 = Math.sin(this.phase * 0.5);
                 let rawSample = osc1 * 0.6 + osc2 * 0.4;
                 
                 const currentCutoff = cutoff.length > 1 ? cutoff[i] : cutoff[0];
                 this.filter.setCutoff(currentCutoff, sampleRate);
                 let filteredSample = this.filter.process(rawSample);
                 
                 const currentDistortion = distortion.length > 1 ? distortion[i] : distortion[0];
                 sample = this.softClip(filteredSample, currentDistortion);
                 sample *= this.envelope.gain;
            }

            channel[i] = sample * 0.5; // Master gain
        }

        // Copy mono output to all channels
        for (let j = 1; j < output.length; j++) {
            output[j].set(channel);
        }
        
        return true;
    }
}

registerProcessor('bass-processor', BassProcessor);
