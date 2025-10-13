// public/worklets/bass-processor.js

/**
 * A radically simplified monophonic synthesizer for Web Audio.
 * It directly plays the frequency and velocity from 'noteOn' messages
 * and ramps down the gain on 'noteOff'. This removes all internal
* state management for techniques, portamento, or multi-note handling
 * to ensure it acts as a predictable, "dumb" executor.
 */
class BassProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'attack', defaultValue: 0.01, minValue: 0, maxValue: 1 },
      { name: 'release', defaultValue: 0.5, minValue: 0, maxValue: 5 },
      { name: 'cutoff', defaultValue: 800, minValue: 50, maxValue: 10000 },
      { name: 'resonance', defaultValue: 0.7, minValue: 0.1, maxValue: 5 },
      { name: 'distortion', defaultValue: 0.1, minValue: 0, maxValue: 1 },
    ];
  }

  constructor(options) {
    super(options);
    
    // --- State ---
    this.frequency = 0;
    this.targetGain = 0; // The volume to ramp towards
    this.currentGain = 0; // The current volume, frame by frame
    this.phase = 0;
    
    // --- Filter State ---
    this.filterState = 0;

    this.port.onmessage = (event) => this.handleMessage(event.data);
  }

  handleMessage(message) {
    const { type, frequency, velocity, attack, release } = message;

    if (type === 'noteOn') {
      this.frequency = frequency;
      this.targetGain = velocity;
      this.currentGain = 0; // Reset gain for the new note
    } else if (type === 'noteOff') {
      this.targetGain = 0;
    }
  }

  // Simple sawtooth oscillator
  generateOsc(phase) {
    return 1 - (phase / Math.PI);
  }

  // Simple one-pole low-pass filter
  applyFilter(input, cutoff) {
    const filterCoeff = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
    this.filterState += filterCoeff * (input - this.filterState);
    return this.filterState;
  }
  
  // Simple soft-clipper
  softClip(input, drive) {
      if (drive === 0) return input;
      const k = 2 + drive * 10;
      return (1 + k) * input / (1 + k * Math.abs(input));
  }


  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channelCount = output.length;
    const frameCount = output[0].length;

    const attackTime = parameters.attack[0];
    const releaseTime = parameters.release[0];
    const cutoff = parameters.cutoff[0];
    const distortion = parameters.distortion[0];
    
    const attackStep = 1 / (attackTime * sampleRate);
    const releaseStep = 1 / (releaseTime * sampleRate);

    for (let i = 0; i < frameCount; i++) {
      
      // Envelope logic
      if (this.currentGain < this.targetGain) {
        this.currentGain = Math.min(this.targetGain, this.currentGain + attackStep);
      } else if (this.currentGain > this.targetGain) {
        this.currentGain = Math.max(this.targetGain, this.currentGain - releaseStep);
      }
      
      let sample = 0;
      if (this.currentGain > 0 && this.frequency > 0) {
          // --- Log the actual frequency being used for synthesis ---
          if (i === 0) console.log(`[bass-processor] Playing frequency: ${this.frequency}`);

          this.phase += (this.frequency * 2 * Math.PI) / sampleRate;
          if (this.phase >= 2 * Math.PI) {
              this.phase -= 2 * Math.PI;
          }
          
          sample = this.generateOsc(this.phase);
          sample = this.applyFilter(sample, cutoff);
          sample = this.softClip(sample, distortion);
          sample *= this.currentGain;
      }
      
      for (let channel = 0; channel < channelCount; channel++) {
        output[channel][i] = sample * 0.7; // Apply master volume
      }
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
