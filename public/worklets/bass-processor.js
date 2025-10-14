
// public/worklets/bass-processor.js

class BassProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 800, minValue: 20, maxValue: 10000 },
      { name: 'resonance', defaultValue: 1.0, minValue: 0.1, maxValue: 20 },
      { name: 'distortion', defaultValue: 0.0, minValue: 0, maxValue: 1 },
      { name: 'portamento', defaultValue: 0.0, minValue: 0, maxValue: 1 },
    ];
  }

  constructor() {
    super();
    this.phase = 0;
    this.currentFreq = 440;
    this.targetFreq = 440;
    this.gain = 0;
    this.noteState = 'off'; // 'off', 'attack', 'release'

    // Filter state
    this.y1 = 0;
    this.y2 = 0;

    this.port.onmessage = this.onmessage.bind(this);
  }

  onmessage(event) {
    const { type, time, frequency, velocity } = event.data;

    if (type === 'noteOn') {
      this.targetFreq = frequency;
      
      if (this.noteState === 'off') {
        this.currentFreq = frequency;
      }
      
      this.gain = velocity;
      this.noteState = 'attack';
      this.y1 = 0;
      this.y2 = 0;

    } else if (type === 'noteOff') {
      this.noteState = 'release';
    } else if (type === 'allNotesOff') {
      this.noteState = 'off';
      this.gain = 0;
    }
  }

  softClip(input, drive) {
    if (drive <= 0.01) return input;
    const k = 1 + drive * 5;
    return Math.tanh(input * k);
  }

  process(inputs, outputs, parameters) {
    const outputChannel = outputs[0][0];

    const cutoffValues = parameters.cutoff;
    const resonanceValues = parameters.resonance;
    const distortionValues = parameters.distortion;
    const portamentoValues = parameters.portamento;

    for (let i = 0; i < outputChannel.length; i++) {
      if (this.noteState === 'release') {
        this.gain *= 0.999; 
        if (this.gain < 0.0001) {
          this.noteState = 'off';
          this.gain = 0;
        }
      }
      
      if (this.noteState === 'off') {
        outputChannel[i] = 0;
        continue;
      }

      const portamento = portamentoValues.length > 1 ? portamentoValues[i] : portamentoValues[0];

      const glideFactor = 1.0 - Math.exp(-1.0 / (sampleRate * (portamento * 0.1 + 0.003)));
      this.currentFreq += (this.targetFreq - this.currentFreq) * glideFactor;

      const pulse = this.phase < 0.5 ? 1.0 : -1.0;
      const sub = Math.sin(this.phase * Math.PI);
      
      this.phase += this.currentFreq / sampleRate;
      if (this.phase >= 1.0) this.phase -= 1.0;

      const oscOutput = (pulse * 0.7) + (sub * 0.3);

      const cutoff = cutoffValues.length > 1 ? cutoffValues[i] : cutoffValues[0];
      const resonance = resonanceValues.length > 1 ? resonanceValues[i] : resonanceValues[0];
      
      const g = Math.tan(Math.PI * cutoff / sampleRate);
      const r = 1 / Math.max(0.1, resonance);
      
      const hp = oscOutput - (r * this.y1) - this.y2;
      const bp = (g * hp) + this.y1;
      const lp = (g * bp) + this.y2;
      
      this.y1 = bp;
      this.y2 = lp;
      
      const filteredSample = this.y2;

      const distortion = distortionValues.length > 1 ? distortionValues[i] : distortionValues[0];
      const distortedSample = this.softClip(filteredSample, distortion);

      outputChannel[i] = distortedSample * this.gain;
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
