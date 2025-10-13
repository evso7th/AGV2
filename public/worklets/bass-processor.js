// public/worklets/bass-processor.js

// --- State and Poly-what-not ---
let phase = 0;
let currentFreq = 0;
let targetFreq = 0;
let portamentoProgress = 1;
let noteState = 'off'; // 'attack', 'decay', 'sustain', 'release', 'off'
let envelopeGain = 0;
let env_attack = 0.01;
let env_decay = 0.1;
let env_sustain = 0.8;
let env_release = 0.5;

let pulseCounter = -1;
let pulseStep = 0;
const PULSE_NOTES = [0, 7, 12, 7];
let pulseIntervalSamples = 0;
let pulseNoteDurationSamples = 0;
let technique = 'pluck';

let lfoPhase = 0;

// Filter state
let lp_b0 = 1.0, lp_b1 = 0.0, lp_b2 = 0.0, lp_a1 = 0.0, lp_a2 = 0.0;
let lp_x1 = 0, lp_x2 = 0, lp_y1 = 0, lp_y2 = 0;

function setFilterCoefficients(cutoff, Q, sampleRate) {
    const omega = 2 * Math.PI * cutoff / sampleRate;
    const sinOmega = Math.sin(omega);
    const cosOmega = Math.cos(omega);
    const alpha = sinOmega / (2 * Q);

    const b0 = (1 - cosOmega) / 2;
    const b1 = 1 - cosOmega;
    const b2 = (1 - cosOmega) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosOmega;
    const a2 = 1 - alpha;

    lp_b0 = b0 / a0;
    lp_b1 = b1 / a0;
    lp_b2 = b2 / a0;
    lp_a1 = a1 / a0;
    lp_a2 = a2 / a0;
}


class BassProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'cutoff', defaultValue: 800, minValue: 20, maxValue: 10000 },
            { name: 'resonance', defaultValue: 1, minValue: 0.1, maxValue: 20 },
            { name: 'distortion', defaultValue: 0.1, minValue: 0, maxValue: 1 },
            { name: 'portamento', defaultValue: 0.0, minValue: 0, maxValue: 0.5 }
        ];
    }
    
    constructor(options) {
        super(options);
        
        console.log('[bass-processor] worklet created');

        this.port.onmessage = (event) => {
            const { type, ...data } = event.data;
            const time = data.when || currentTime;
            
            if (type === 'noteOn') {
                console.log(`[bass-processor] Received noteOn:`, data);
                targetFreq = data.frequency;
                technique = data.technique || 'pluck';
                
                const portamentoDuration = this.parameters.get('portamento').value;
                if (noteState !== 'off' && portamentoDuration > 0) {
                   portamentoProgress = 0;
                } else {
                   currentFreq = targetFreq;
                   portamentoProgress = 1;
                }
                
                noteState = 'attack';
                envelopeGain = 0;
                
                if (technique === 'pulse') {
                    pulseCounter = 0;
                    pulseStep = 0;
                    pulseIntervalSamples = Math.floor(sampleRate / 8); // 16th notes at 120bpm
                    pulseNoteDurationSamples = Math.floor(pulseIntervalSamples * 0.9);
                }

            } else if (type === 'noteOff') {
                 console.log(`[bass-processor] Received noteOff`);
                 noteState = 'release';
                 pulseCounter = -1;
            }
        };
    }
    
    softClip(input, drive) {
      const k = Math.max(0, Math.min(1, drive));
      return (input * (1 + k)) / (1 + k * Math.abs(input));
    }
    
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const cutoff = parameters.cutoff[0];
        const resonance = parameters.resonance[0];
        const distortion = parameters.distortion[0];
        const portamento = parameters.portamento[0];
        
        setFilterCoefficients(cutoff, resonance, sampleRate);
        
        const attackSamples = env_attack * sampleRate;
        const decaySamples = env_decay * sampleRate;
        const releaseSamples = env_release * sampleRate;

        for (let i = 0; i < output[0].length; i++) {
            let sample = 0;

            // --- Portamento ---
            if (portamentoProgress < 1.0) {
                portamentoProgress += 1.0 / (portamento * sampleRate);
                if (portamentoProgress >= 1.0) {
                    portamentoProgress = 1.0;
                    currentFreq = targetFreq;
                } else {
                    const eased = 1 - Math.pow(1 - portamentoProgress, 2);
                    currentFreq = currentFreq * (1 - eased) + targetFreq * eased;
                }
            }

            // --- Pulse Technique ---
            if (technique === 'pulse' && pulseCounter !== -1) {
                if (pulseCounter % pulseIntervalSamples === 0) {
                    const noteOffset = PULSE_NOTES[pulseStep % PULSE_NOTES.length];
                    currentFreq = targetFreq * Math.pow(2, noteOffset/12);
                    phase = 0;
                    noteState = 'attack';
                    envelopeGain = 0;
                    pulseStep++;
                }
                if (pulseCounter % pulseIntervalSamples > pulseNoteDurationSamples) {
                    noteState = 'release';
                }
                pulseCounter++;
            }
            
            // --- Envelope ---
            switch (noteState) {
                case 'attack':
                    envelopeGain += 1.0 / attackSamples;
                    if (envelopeGain >= 1.0) {
                        envelopeGain = 1.0;
                        noteState = 'decay';
                    }
                    break;
                case 'decay':
                    envelopeGain -= (1.0 - env_sustain) / decaySamples;
                    if (envelopeGain <= env_sustain) {
                        envelopeGain = env_sustain;
                        noteState = 'sustain';
                    }
                    break;
                case 'sustain':
                    // Gain is constant
                    break;
                case 'release':
                    envelopeGain -= env_sustain / releaseSamples;
                    if (envelopeGain <= 0) {
                        envelopeGain = 0;
                        noteState = 'off';
                    }
                    break;
                case 'off':
                    envelopeGain = 0;
                    break;
            }

            if (noteState !== 'off') {
                // --- Oscillator ---
                const osc1 = 1 - 2 * (phase / (2 * Math.PI)); // Sawtooth
                const osc2 = Math.sin(phase * 0.5); // Sub-octave sine
                sample = (osc1 * 0.7) + (osc2 * 0.3);

                // --- Filter ---
                const filteredSample = lp_b0*sample + lp_b1*lp_x1 + lp_b2*lp_x2 - lp_a1*lp_y1 - lp_a2*lp_y2;
                lp_x2 = lp_x1; lp_x1 = sample;
                lp_y2 = lp_y1; lp_y1 = filteredSample;

                // --- Distortion & Output ---
                sample = this.softClip(filteredSample, distortion);
                sample *= envelopeGain;
                
                phase += (currentFreq * 2 * Math.PI) / sampleRate;
                if (phase > 2 * Math.PI) phase -= 2 * Math.PI;
            }

            output[0][i] = sample * 0.5; // Master volume
        }
        
        for (let channel = 1; channel < output.length; channel++) {
            output[channel].set(output[0]);
        }

        // Log state periodically
        if (currentTime > (this.lastLogTime || 0) + 5) {
             console.log(`[bass-processor] state: ${noteState}, gain: ${envelopeGain.toFixed(2)}, freq: ${currentFreq.toFixed(2)}`);
             this.lastLogTime = currentTime;
        }

        return true;
    }
}

registerProcessor('bass-processor', BassProcessor);
