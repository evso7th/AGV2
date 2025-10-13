

/**
 * A radically simplified subtractive synthesizer for debugging purposes.
 * It does one thing: plays the frequency it's told to play.
 * All complex state management (portamento, multiple notes) is removed.
 */
class BassProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // --- Simple State ---
    this.phase = 0;
    this.frequency = 0; // The frequency we are currently playing
    this.gain = 0;      // Current gain of the envelope
    this.targetGain = 0;// Target gain (0 for off, >0 for on)
    this.attack = 0.02; // Attack time in seconds
    this.release = 0.4; // Release time in seconds
    this.oscType = 'sawtooth';

    // Filter state
    this.filterState = 0;
    
    this.port.onmessage = (event) => this.handleMessage(event.data);
  }

  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 800, minValue: 50, maxValue: 10000 },
      { name: 'resonance', defaultValue: 0.7, minValue: 0.1, maxValue: 5 },
      { name: 'distortion', defaultValue: 0.1, minValue: 0, maxValue: 1 },
      { name: 'portamento', defaultValue: 0.05, minValue: 0, maxValue: 0.5 },
    ];
  }

  handleMessage(message) {
    const { type, frequency, velocity } = message;

    if (type === 'noteOn') {
      // --- Direct and "Stupid" Assignment ---
      // What comes in is what we play. No questions asked.
      this.frequency = frequency;
      this.targetGain = velocity;
      this.gain = 0; // Reset gain for a new attack envelope
    } else if (type === 'noteOff') {
      this.targetGain = 0; // Start the release phase
    }
  }

  // Simple one-pole low-pass filter
  applyFilter(input, cutoff) {
    const coeff = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
    this.filterState += coeff * (input - this.filterState);
    return this.filterState;
  }
  
  // Simple soft-clipper for distortion
  softClip(input, drive) {
      if (drive === 0) return input;
      const k = 2 + drive * 10;
      return (1 + k) * input / (1 + k * Math.abs(input));
  }

  // Simple oscillator
  generateOsc() {
      const saw = 1 - (this.phase / Math.PI);
      const sub = Math.sin(this.phase * 0.5); // Sub-oscillator for body
      return saw * 0.7 + sub * 0.3;
  }

  process(inputs, outputs, parameters) {
    const outputChannel = outputs[0][0];
    const cutoff = parameters.cutoff[0];
    const distortion = parameters.distortion[0];
    
    // If there's no frequency, we don't need to do anything.
    if (this.frequency === 0 && this.gain === 0) {
      return true; // Keep processor alive
    }

    for (let i = 0; i < outputChannel.length; i++) {
        // --- Envelope ---
        if (this.gain < this.targetGain) { // Attack phase
            this.gain = Math.min(this.targetGain, this.gain + 1.0 / (this.attack * sampleRate));
        } else if (this.gain > this.targetGain) { // Release phase
            this.gain = Math.max(0, this.gain - 1.0 / (this.release * sampleRate));
        }
        
        let sample = 0;
        if (this.gain > 0) {
            // --- Oscillator ---
            this.phase += (this.frequency * 2 * Math.PI) / sampleRate;
            if (this.phase >= 2 * Math.PI) this.phase -= 2 * Math.PI;
            
            sample = this.generateOsc();
            
            // --- Filter & Distortion ---
            sample = this.applyFilter(sample, cutoff);
            sample = this.softClip(sample, distortion);

            // Apply envelope
            sample *= this.gain;
        }
        
        outputChannel[i] = sample * 0.6; // Final gain adjustment
    }
    
    console.log(`[bass-processor] Playing frequency: ${this.frequency}`);

    return true; // Keep the processor alive
  }
}

registerProcessor('bass-processor', BassProcessor);
