
// Fallback for globalThis
const g = typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : global));

class ChordProcessor extends AudioWorkletProcessor {

  static get parameterDescriptors() {
    return [
      { name: 'attack', defaultValue: 0.01, minValue: 0.001, maxValue: 2 },
      { name: 'release', defaultValue: 0.1, minValue: 0.01, maxValue: 5 },
      { name: 'filterCutoff', defaultValue: 20000, minValue: 20, maxValue: 20000 },
      { name: 'filterQ', defaultValue: 0.7, minValue: 0.01, maxValue: 20 },
      { name: 'distortion', defaultValue: 0, minValue: 0, maxValue: 1 },
      { name: 'portamento', defaultValue: 0, minValue: 0, maxValue: 0.2 },
    ];
  }

  constructor(options) {
    super(options);
    
    this.notes = []; // { frequency, velocity, phase, gain, startTime, duration }
    this.stagger = 0;
    this.port.onmessage = this.handleMessage.bind(this);
    this.filterState = 0;
    this.oscType = 'sawtooth';
  }

  handleMessage(event) {
    const { type, ...data } = event.data;
    if (type === 'playChord' && data.notes && data.notes.length > 0) {
        this.stagger = data.stagger || 0;
        this.notes = data.notes.map(n => ({
            frequency: 440 * Math.pow(2, (n.midi - 69) / 12),
            velocity: n.velocity || 0.7,
            duration: n.duration,
            phase: 0,
            gain: 0,
            startTime: data.when || currentTime,
            state: 'attack'
        }));
    } else if (type === 'noteOff') {
        this.notes.forEach(note => note.state = 'release');
    } else if (type === 'setPreset') {
        this.oscType = data.oscType || this.oscType;
        // The parameters will now be driven by the AudioParamMap
    }
  }

  applyFilter(input, filterCutoff, filterQ) {
    const coeff = 1 - Math.exp(-2 * Math.PI * filterCutoff / sampleRate);
    this.filterState += coeff * (input - this.filterState);
    const feedback = filterQ * (this.filterState - input); // Simplified resonance
    return this.filterState + feedback;
  }
  
  applyDistortion(input, distortionAmount) {
    if (distortionAmount <= 0) return input;
    const k = distortionAmount * 5;
    return (2 / Math.PI) * Math.atan(input * k);
  }

  generateOsc(phase) {
    switch (this.oscType) {
      case 'sine': return Math.sin(phase);
      case 'triangle': return 1 - 4 * Math.abs((phase / (2 * Math.PI)) - 0.5);
      case 'square': return (phase % (2 * Math.PI)) < Math.PI ? 1 : -1;
      case 'sawtooth': return 1 - (phase / Math.PI);
      case 'fatsine':
      case 'fmsine':
      case 'amsine':
      case 'pwm':
      case 'fatsawtooth':
        // Simplified fallback for complex types
        return Math.sin(phase) + Math.sin(phase * 1.01) * 0.5;
      default: return Math.sin(phase);
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const attack = parameters.attack[0];
    const release = parameters.release[0];
    const filterCutoff = parameters.filterCutoff[0];
    const filterQ = parameters.filterQ[0];
    const distortion = parameters.distortion[0];

    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        let sample = 0;

        if (this.notes.length > 0) {
            this.notes.forEach((note, index) => {
                const timeSinceStart = currentTime - note.startTime;
                
                // Envelope calculation per note
                if (note.state === 'attack' && timeSinceStart >= this.stagger * index) {
                    note.gain = Math.min(1, note.gain + 1 / (attack * sampleRate));
                    if(timeSinceStart >= note.duration) {
                      note.state = 'release';
                    }
                } else if (note.state === 'release') {
                    note.gain = Math.max(0, note.gain - 1 / (release * sampleRate));
                }

                if (note.gain > 0) {
                    note.phase += (note.frequency / sampleRate) * 2 * Math.PI;
                    if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;
                    sample += this.generateOsc(note.phase) * note.velocity * note.gain;
                }
            });

            if (this.notes.length > 0) {
                sample /= this.notes.length;
            }

            sample = this.applyFilter(sample, filterCutoff, filterQ);
            sample = this.applyDistortion(sample, distortion);
            sample *= 0.5; // Final gain stage
        }
        
        outputChannel[i] = sample;
      }
    }
    
    // Clean up finished notes
    this.notes = this.notes.filter(note => note.gain > 0);

    return true;
  }
}

// Ensure processor is registered only once and works in different environments
if (typeof registerProcessor === 'function') {
    registerProcessor('chord-processor', ChordProcessor);
}
