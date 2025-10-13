
class BassProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.frequency = 0;
    this.targetGain = 0;
    this.gain = 0;
    this.phase = 0;
    
    // Envelope settings
    this.attackTime = 0.01;
    this.releaseTime = 0.3;

    // Filter state
    this.filterStateL = 0;
    this.filterStateR = 0;

    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };
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
    console.log(`[bass-processor] 1. Received message:`, message);
    if (type === 'noteOn') {
      this.frequency = frequency;
      this.targetGain = velocity;
      console.log(`[bass-processor] 2. State updated: Freq=${this.frequency}, TargetGain=${this.targetGain}`);
    } else if (type === 'noteOff') {
      this.targetGain = 0;
      console.log(`[bass-processor] 2. State updated: TargetGain=0`);
    }
  }

  generateOsc(phase) {
    const saw = 1 - (phase / Math.PI);
    const sub = Math.sin(phase * 0.5);
    return saw * 0.7 + sub * 0.3;
  }

  softClip(input, drive) {
    if (drive === 0) return input;
    const k = 2 + drive * 10;
    return (1 + k) * input / (1 + k * Math.abs(input));
  }

  applyFilter(input, cutoff, q, isLeft) {
    const filterCoeff = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
    if (isLeft) {
      this.filterStateL += filterCoeff * (input - this.filterStateL);
      return this.filterStateL;
    } else {
      this.filterStateR += filterCoeff * (input - this.filterStateR);
      return this.filterStateR;
    }
  }

  process(inputs, outputs, parameters) {
    console.log(`[bass-processor] 3. Processing block. Current Freq: ${this.frequency}, Current Gain: ${this.gain}`);
    const output = outputs[0];
    const cutoff = parameters.cutoff[0];
    const resonance = parameters.resonance[0];
    const distortion = parameters.distortion[0];
    
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        // Envelope
        if (this.gain < this.targetGain) {
          this.gain = Math.min(this.targetGain, this.gain + 1 / (this.attackTime * sampleRate));
        } else if (this.gain > this.targetGain) {
          this.gain = Math.max(this.targetGain, this.gain - 1 / (this.releaseTime * sampleRate));
        }
        
        let sample = 0;
        if (this.gain > 0 && this.frequency > 0) {
            this.phase += (this.frequency * 2 * Math.PI) / sampleRate;
            if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI;
            
            sample = this.generateOsc(this.phase);
            sample = this.applyFilter(sample, cutoff, resonance, channel === 0);
            sample = this.softClip(sample, distortion);
        }
        
        outputChannel[i] = sample * this.gain * 0.6; // Apply gain and master volume
      }
    }
    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
