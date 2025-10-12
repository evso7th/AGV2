// public/worklets/bass-processor.js
class BassProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 400, minValue: 50, maxValue: 2000 },
      { name: 'resonance', defaultValue: 0.7, minValue: 0.1, maxValue: 5 },
      { name: 'distortion', defaultValue: 0.05, minValue: 0, maxValue: 1 },
      { name: 'portamento', defaultValue: 0.0, minValue: 0, maxValue: 0.5 }
    ];
  }

  constructor() {
    super();
    this.sampleRate = 44100; // This will be sampleRate from the processor
    this.activeNotes = new Map();
    this.lastFreq = 0;
    this.portamentoTarget = 0;
    this.portamentoStartTime = 0;
    this.portamentoDuration = 0;

    this.port.onmessage = this.handleMessage.bind(this);
  }
  
  handleMessage(event) {
    const { type, ...data } = event.data;
    if (type === 'noteOn') {
      const { frequency, velocity, when } = data;
      
      const isLegato = this.activeNotes.size > 0;
      
      // Stop all other notes for mono synth behavior
      for (const note of this.activeNotes.values()) {
        note.state = 'release';
      }
      
      this.portamentoTarget = frequency;
      
      if (isLegato && this.portamentoDuration > 0) {
        this.portamentoStartTime = currentTime;
      } else {
        this.lastFreq = frequency;
        this.portamentoDuration = 0; // No portamento if not legato
      }
      
      this.activeNotes.set(frequency, {
        phase: 0,
        gain: velocity,
        state: 'attack', // 'attack' will now be handled inside process
        envelope: 0, // A value from 0 to 1 for the envelope
      });

    } else if (type === 'noteOff') {
      for (const note of this.activeNotes.values()) {
        note.state = 'release';
      }
    }
  }

  // Waveform generators
  pulseWave(phase, width) { return (phase % (2 * Math.PI)) < width * 2 * Math.PI ? 1 : -1; }
  
  // DSP functions
  lowpassFilter(input, cutoff, q, state) {
    const coeff = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
    state.z1 += coeff * (input - state.z1);
    const filtered = state.z1 + q * (state.z1 - state.z2);
    state.z2 = state.z1;
    return filtered;
  }
  softClip(input, drive) {
    if (drive <= 0) return input;
    const k = 2 + drive * 10;
    return (input * (k + 1)) / (1 + k * Math.abs(input));
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const cutoff = parameters.cutoff;
    const resonance = parameters.resonance;
    const distortion = parameters.distortion;
    const portamento = parameters.portamento;

    this.portamentoDuration = portamento[0]; // Update portamento time constantly

    // Portamento frequency calculation
    if (this.portamentoDuration > 0 && this.portamentoTarget !== this.lastFreq) {
      const t = (currentTime - this.portamentoStartTime) / this.portamentoDuration;
      if (t >= 1) {
        this.lastFreq = this.portamentoTarget;
      } else {
        // Simple linear interpolation for glide
        this.lastFreq = this.lastFreq * (1 - t) + this.portamentoTarget * t;
      }
    }

    for (let channel = 0; channel < output.length; channel++) {
      const channelData = output[channel];
      for (let i = 0; i < channelData.length; i++) {
        let sample = 0;

        for (const [freq, note] of this.activeNotes) {
           // ADSR-like envelope
          if (note.state === 'attack') {
            note.envelope += 1.0 / (0.01 * sampleRate); // Fast attack
            if (note.envelope >= 1.0) {
              note.envelope = 1.0;
              note.state = 'sustain';
            }
          } else if (note.state === 'release') {
            note.envelope -= 1.0 / (0.3 * sampleRate); // Fixed release
            if (note.envelope <= 0) {
              this.activeNotes.delete(freq);
              continue;
            }
          }

          // Use the glided frequency
          const currentFreq = this.lastFreq;
          note.phase += (currentFreq * 2 * Math.PI) / sampleRate;

          // Oscillator mix: pulse + sub-octave sine
          const osc1 = this.pulseWave(note.phase, 0.5);
          const osc2 = Math.sin(note.phase * 0.5);
          let mixedOsc = osc1 * 0.6 + osc2 * 0.4;
          
          // Simple state for filter per note - can be improved
          note.filterState = note.filterState || { z1: 0, z2: 0 };
          
          // Filter
          const currentCutoff = cutoff.length > 1 ? cutoff[i] : cutoff[0];
          const currentResonance = resonance.length > 1 ? resonance[i] : resonance[0];
          const filtered = this.lowpassFilter(mixedOsc, currentCutoff, currentResonance, note.filterState);
          
          // Distortion
          const currentDistortion = distortion.length > 1 ? distortion[i] : distortion[0];
          const distorted = this.softClip(filtered, currentDistortion);
          
          sample += distorted * note.envelope * note.gain;
        }

        channelData[i] = sample * 0.4; // Master gain
      }
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
