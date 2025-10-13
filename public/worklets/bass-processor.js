
class BassProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 800, minValue: 50, maxValue: 5000, automationRate: 'a-rate' },
      { name: 'resonance', defaultValue: 0.7, minValue: 0.1, maxValue: 5, automationRate: 'a-rate' },
      { name: 'distortion', defaultValue: 0.05, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
      { name: 'portamento', defaultValue: 0.0, minValue: 0, maxValue: 0.2, automationRate: 'k-rate' }
    ];
  }

  constructor(options) {
    super(options);
    
    // --- State ---
    this.phase = 0;
    this.currentGain = 0;
    this.targetGain = 0;
    this.currentFreq = 0;
    this.portamentoTargetFreq = 0;
    this.portamentoProgress = 1.0;
    
    // --- Envelope ---
    this.attackTime = 0.01;
    this.releaseTime = 0.5;
    
    // --- Filter ---
    this.b1 = 0;
    this.b2 = 0;
    
    // --- Pulse/Arpeggio ---
    this.technique = 'pluck';
    this.pulseCounter = -1;
    this.pulseNoteIndex = 0;
    this.pulseIntervalSamples = 0;
    this.pulseBaseFreq = 0;
    // Arpeggio pattern: Root, 5th, Octave, 5th
    this.PULSE_NOTES = [0, 7, 12, 7];

    // --- Tracing ---
    this.lastLogTime = -1;

    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    console.log('[BassProcessor] Received message:', JSON.stringify(event.data));
    const { type, ...data } = event.data;

    if (type === 'noteOn') {
      this.technique = data.technique || 'pluck';

      this.portamentoTargetFreq = data.frequency;
      if (this.currentGain > 0.01 && data.portamento > 0) {
        this.portamentoProgress = 0;
      } else {
        this.currentFreq = data.frequency;
        this.portamentoProgress = 1.0;
      }

      this.targetGain = data.velocity || 0.7;
      this.attackTime = 0.02; // A bit of punch
      
      this.pulseCounter = -1; // Deactivate pulse by default
      if (this.technique === 'pulse') {
        this.pulseBaseFreq = data.frequency;
        // 16th notes
        this.pulseIntervalSamples = Math.floor((sampleRate * 60) / (this.parameters.get('bpm')?.value || 120) / 4);
        this.pulseCounter = 0;
        this.pulseNoteIndex = 0;
      }

    } else if (type === 'noteOff') {
      this.targetGain = 0;
      this.releaseTime = data.release || 0.5;
      this.pulseCounter = -1;
    }
  }

  // --- DSP Functions ---
  pulseWave(phase, width) { return phase % (2 * Math.PI) < width * 2 * Math.PI ? 1 : -1; }
  sawWave(phase) { return 1.0 - 2.0 * (phase / (2 * Math.PI)); }
  softClip(x, drive) { return (1 + drive) * x / (1 + drive * Math.abs(x)); }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channel = output[0];

    const cutoffValues = parameters.cutoff;
    const resonanceValues = parameters.resonance;
    const distortionValues = parameters.distortion;
    const portamentoParam = parameters.portamento;

    // --- TRACING ---
    if (currentTime > this.lastLogTime + 5) {
        console.log(`[BassProcessor] process() running. activeNotes: ${this.currentGain > 0}, gain: ${this.currentGain.toFixed(2)}, freq: ${this.currentFreq.toFixed(2)}`);
        this.lastLogTime = currentTime;
    }

    for (let i = 0; i < channel.length; i++) {
        // --- Parameter handling ---
        const cutoff = cutoffValues.length > 1 ? cutoffValues[i] : cutoffValues[0];
        const resonance = resonanceValues.length > 1 ? resonanceValues[i] : resonanceValues[0];
        const distortion = distortionValues.length > 1 ? distortionValues[i] : distortionValues[0];
        const portamentoTime = portamentoParam[0];
        
        // --- Pulse/Arpeggio logic ---
        if (this.pulseCounter !== -1) {
            this.pulseCounter++;
            if (this.pulseCounter >= this.pulseIntervalSamples) {
                this.pulseCounter = 0;
                const noteOffset = this.PULSE_NOTES[this.pulseNoteIndex % this.PULSE_NOTES.length];
                this.currentFreq = this.pulseBaseFreq * Math.pow(2, noteOffset / 12);
                this.currentGain = 0; // Reset envelope for each pulse note
                this.targetGain = 0.8;
                this.releaseTime = this.pulseIntervalSamples / sampleRate * 0.9; // Short release
                this.pulseNoteIndex++;
            }
        }

        // --- Portamento (Glide) ---
        if (this.portamentoProgress < 1.0) {
            const step = 1.0 / (portamentoTime * sampleRate);
            this.portamentoProgress = Math.min(1.0, this.portamentoProgress + step);
            const easedProgress = 1 - Math.pow(1 - this.portamentoProgress, 2);
            this.currentFreq = this.currentFreq * (1 - easedProgress) + this.portamentoTargetFreq * easedProgress;
        }

        // --- Envelope ---
        if (this.currentGain < this.targetGain) {
            this.currentGain += 1 / (this.attackTime * sampleRate);
            this.currentGain = Math.min(this.currentGain, this.targetGain);
        } else if (this.currentGain > this.targetGain) {
            this.currentGain -= 1 / (this.releaseTime * sampleRate);
            this.currentGain = Math.max(this.currentGain, 0);
        }

        if (this.currentGain <= 0.0001) {
            channel[i] = 0;
            continue;
        }

        // --- Oscillator ---
        this.phase += (this.currentFreq * 2 * Math.PI) / sampleRate;
        if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI;
        const osc_out = this.pulseWave(this.phase, 0.5) * 0.7 + this.sawWave(this.phase + 0.1) * 0.3;

        // --- Filter ---
        const f = cutoff * 1.16;
        const fb = resonance * (1.0 - 0.15 * f * f);
        const q = 1 - Math.exp(-2 * Math.PI * f / sampleRate);
        const input = osc_out;
        
        this.b1 = (1.0 - q) * this.b1 + q * input;
        this.b2 = (1.0 - q) * this.b2 + q * this.b1;
        const lowpass = this.b2;
        
        // --- Distortion & Output ---
        const finalSample = this.softClip(lowpass, distortion) * this.currentGain;
        channel[i] = finalSample * 0.5; // Master gain
    }
    
    // Copy to other channels if stereo
    for (let c = 1; c < output.length; c++) {
        output[c].set(channel);
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);

    