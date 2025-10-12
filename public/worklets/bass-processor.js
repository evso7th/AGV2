class BassProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 400, minValue: 50, maxValue: 2000 },
      { name: 'resonance', defaultValue: 0.7, minValue: 0.1, maxValue: 5 },
      { name: 'distortion', defaultValue: 0.05, minValue: 0, maxValue: 1 },
      { name: 'portamento', defaultValue: 0.0, minValue: 0, maxValue: 0.5 }
    ];
  }

  constructor(options) {
    super(options);
    this.phase = 0;
    this.frequency = 0;
    this.isActive = false;
    this.gain = 0;
    this.targetGain = 0;
    this.release = 0.1;
    this.oscType = 'sawtooth';
    
    this.filterState = 0;
    this.lastFreq = 0;
    this.portamentoTarget = 0;
    this.portamentoTime = 0;
    this.portamentoStartTime = 0;

    this.port.onmessage = (event) => {
        const { type, ...data } = event.data;

        if (type === 'noteOn') {
            const { frequency, velocity, when } = data;
            const isLegato = this.activeNotes && this.activeNotes.size > 0;
            
            // Portamento logic
            const portamentoParam = this.parameters.get('portamento');
            const portamentoValue = (portamentoParam && portamentoParam.length > 0) ? portamentoParam[0] : 0;
            if (isLegato && portamentoValue > 0) {
                this.portamentoTarget = frequency;
                this.portamentoTime = portamentoValue;
                this.portamentoStartTime = currentTime; 
            } else {
                this.lastFreq = frequency;
                this.portamentoTime = 0;
            }

            this.frequency = frequency;
            this.targetGain = velocity;
            this.isActive = true;
            this.gain = 0; // Reset gain for new note attack

        } else if (type === 'noteOff') {
            this.targetGain = 0;
        }
    };

    // For compatibility, even though we are moving away from it
    this.activeNotes = new Map();
  }

  softClip(input, drive) {
    if (drive <= 0) return input;
    const k = 2 + drive * 10;
    return (1 + k) * input / (1 + k * Math.abs(input));
  }

  lowpassFilter(input, cutoff, q) {
      if (cutoff >= sampleRate / 2) return input; // bypass if cutoff is too high
      const coeff = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
      this.filterState += coeff * (input - this.filterState);
      // Simplified resonance - this adds a bit of 'peak' but isn't a true resonance
      const feedback = q * (this.filterState - input);
      return this.filterState + feedback;
  }
  
  pulseWave(phase, width = 0.5) {
    return (phase % (2 * Math.PI)) < width * 2 * Math.PI ? 1 : -1;
  }
  
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const attack = 0.005; // Fast attack for bass
    const releaseVal = this.release;

    const cutoff = parameters.cutoff;
    const resonance = parameters.resonance;
    const distortion = parameters.distortion;
    const portamento = parameters.portamento;

    for (let channel = 0; channel < output.length; channel++) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; i++) {
        let currentFreq = this.lastFreq;

        if (this.portamentoTime > 0) {
            const t = (currentTime + i / sampleRate) - this.portamentoStartTime;
            if (t >= this.portamentoTime) {
                currentFreq = this.portamentoTarget;
                this.portamentoTime = 0;
            } else {
                const progress = t / this.portamentoTime;
                currentFreq = this.lastFreq * (1 - progress) + this.portamentoTarget * progress;
            }
        } else {
           currentFreq = this.frequency;
        }
        this.lastFreq = currentFreq;
        
        let sample = 0;
        if (this.isActive) {
          // Envelope
          if (this.gain < this.targetGain) {
            this.gain += 1.0 / (attack * sampleRate);
            if (this.gain > this.targetGain) this.gain = this.targetGain;
          } else if (this.gain > this.targetGain) { // Note is releasing
            this.gain -= 1.0 / (releaseVal * sampleRate);
            if (this.gain < 0) {
              this.gain = 0;
              this.isActive = false;
            }
          }

          if (this.gain > 0) {
            this.phase += (currentFreq * 2 * Math.PI) / sampleRate;
            if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI;

            // Oscillator
            const osc1 = this.pulseWave(this.phase, 0.5);
            const osc2 = Math.sin(this.phase * 0.5); // Sub-oscillator
            
            sample = osc1 * 0.7 + osc2 * 0.3;

            // Filter
            sample = this.lowpassFilter(sample, cutoff[0], resonance[0]);

            // Distortion
            sample = this.softClip(sample, distortion[0]);
            
            sample *= this.gain;
          }
        }
        outputChannel[i] = sample * 0.4; // Master volume
      }
    }
    
    if (this.gain <= 0 && this.targetGain === 0) {
        this.isActive = false;
    }

    return true;
  }
}

try {
  registerProcessor('bass-processor', BassProcessor);
} catch(e) {
  // Already registered
}
