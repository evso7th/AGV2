
class BassProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 800, minValue: 50, maxValue: 5000 },
      { name: 'resonance', defaultValue: 0.7, minValue: 0.1, maxValue: 5 },
      { name: 'distortion', defaultValue: 0.1, minValue: 0, maxValue: 1 },
      { name: 'portamento', defaultValue: 0.05, minValue: 0, maxValue: 0.5 },
      // ADSR-like parameters
      { name: 'attack', defaultValue: 0.01, minValue: 0.001, maxValue: 2 },
      { name: 'decay', defaultValue: 0.2, minValue: 0.01, maxValue: 2 },
      { name: 'sustain', defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'release', defaultValue: 0.3, minValue: 0.01, maxValue: 5 },
    ];
  }

  constructor(options) {
    super(options);
    this.phase = 0;
    this.gain = 0;
    this.noteState = 'off'; // 'attack', 'decay', 'sustain', 'release', 'off'
    this.frequency = 0;
    this.velocity = 0;
    this.technique = 'pluck';
    
    // Pulse/Arp state
    this.pulseCounter = 0;
    this.pulseNoteIndex = 0;
    this.pulseNotes = [0, 7, 12, 7]; // Root, 5th, Octave, 5th
    this.lastPulseTime = 0;

    // Portamento state
    this.portamentoStartFreq = 0;
    this.portamentoEndFreq = 0;
    this.portamentoStartTime = -1;

    // Filter state
    this.filterState = { z1: 0, z2: 0 };
    
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    console.log(`[BassProcessor] Received message:`, event.data);
    const { type, ...data } = event.data;
    const time = data.when || currentTime;

    if (type === 'noteOn') {
      const { frequency, velocity, technique, when } = data;
      this.technique = technique || 'pluck';
      this.velocity = velocity || 0.7;

      if (this.noteState !== 'off' && this.noteState !== 'release') {
        this.portamentoStartFreq = this.frequency;
        this.portamentoEndFreq = frequency;
        this.portamentoStartTime = currentTime; 
      } else {
        this.portamentoProgress = 1.0;
        this.frequency = frequency;
      }
      
      this.noteState = 'attack';
      this.gain = 0;
      
      if (this.technique === 'pulse') {
        this.pulseNoteIndex = 0;
        this.lastPulseTime = when; // Use scheduled time to start pulse sequence
      }

    } else if (type === 'noteOff') {
      this.noteState = 'release';
    }
  }

  // --- Synthesis Functions ---
  pulseWave(phase, width) { return phase % (2 * Math.PI) < width * 2 * Math.PI ? 1 : -1; }
  sawtoothWave(phase) { return 1 - 2 * (phase / (2 * Math.PI)); }
  softClip(input, drive) {
    if (drive <= 0) return input;
    const k = 2 * drive / (1 - drive);
    return (1 + k) * input / (1 + k * Math.abs(input));
  }
  
  applyFilter(input, cutoff, q) {
    const f = cutoff * 1.16;
    const fb = q * (1.0 - 0.15 * f * f);
    const lp = this.filterState.z1 + f * (input - this.filterState.z1 + fb * (this.filterState.z1 - this.filterState.z2));
    this.filterState.z1 = lp;
    this.filterState.z2 = this.filterState.z1;
    return lp;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channel = output[0];
    const portamentoDuration = parameters.portamento[0] > 0 ? parameters.portamento[0] : 0.05;

    for (let i = 0; i < channel.length; ++i) {
      const t = currentTime + i / sampleRate;

      // Handle envelope
      const attack = parameters.attack[0];
      const decay = parameters.decay[0];
      const sustain = parameters.sustain[0];
      const release = parameters.release[0];
      
      switch (this.noteState) {
        case 'attack':
          this.gain += 1 / (attack * sampleRate);
          if (this.gain >= this.velocity) {
            this.gain = this.velocity;
            this.noteState = 'decay';
          }
          break;
        case 'decay':
          this.gain -= (this.velocity - sustain * this.velocity) / (decay * sampleRate);
          if (this.gain <= sustain * this.velocity) {
            this.gain = sustain * this.velocity;
            this.noteState = 'sustain';
          }
          break;
        case 'sustain':
          // Gain remains at sustain level
          break;
        case 'release':
          this.gain -= (sustain * this.velocity) / (release * sampleRate);
          if (this.gain <= 0) {
            this.gain = 0;
            this.noteState = 'off';
            this.frequency = 0;
          }
          break;
        case 'off':
          this.gain = 0;
          break;
      }
      
      // Handle portamento
      if (this.portamentoStartTime > 0) {
        const elapsed = t - this.portamentoStartTime;
        if (elapsed >= portamentoDuration) {
            this.frequency = this.portamentoEndFreq;
            this.portamentoStartTime = -1;
        } else {
            const progress = elapsed / portamentoDuration;
            this.frequency = this.portamentoStartFreq * (1 - progress) + this.portamentoEndFreq * progress;
        }
      }

      // Handle pulsing
      if (this.technique === 'pulse' && this.noteState !== 'off' && this.noteState !== 'release') {
        const pulseInterval = 60 / (parameters.tempo?.[0] || 120) / 4; // 16th notes
        if (t >= this.lastPulseTime + pulseInterval) {
            this.lastPulseTime += pulseInterval;
            const noteOffset = this.pulseNotes[this.pulseNoteIndex++ % this.pulseNotes.length];
            this.frequency = this.portamentoEndFreq * Math.pow(2, noteOffset / 12);
            // Re-trigger short attack/decay
            this.gain = this.velocity;
            this.noteState = 'decay'; // go directly to a short decay
        }
      }

      let sample = 0;
      if (this.gain > 0 && this.frequency > 0) {
        this.phase += (this.frequency * 2 * Math.PI) / sampleRate;
        if (this.phase >= 2 * Math.PI) this.phase -= 2 * Math.PI;

        const osc = this.sawtoothWave(this.phase) * 0.6 + this.pulseWave(this.phase, 0.5) * 0.4;
        const cutoff = parameters.cutoff[i] ?? parameters.cutoff[0];
        const resonance = parameters.resonance[i] ?? parameters.resonance[0];
        const filtered = this.applyFilter(osc, cutoff, resonance);
        const distortion = parameters.distortion[i] ?? parameters.distortion[0];
        sample = this.softClip(filtered, distortion);
      }
      
      channel[i] = sample * this.gain * 0.7;
    }
    
    // Copy to other channels
    for (let j = 1; j < output.length; j++) {
        output[j].set(channel);
    }
    
    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
