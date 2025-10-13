
// Fallback for globalThis
const g = typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : global));

class ChordProcessor extends AudioWorkletProcessor {

  static get parameterDescriptors() {
    return [
      { name: 'attack', defaultValue: 0.01, minValue: 0.001, maxValue: 2 },
      { name: 'release', defaultValue: 0.1, minValue: 0.01, maxValue: 5 },
      { name: 'filterCutoff', defaultValue: 8000, minValue: 20, maxValue: 20000 },
      { name: 'filterQ', defaultValue: 1, minValue: 0.01, maxValue: 20 },
      { name: 'distortion', defaultValue: 0, minValue: 0, maxValue: 1 },
    ];
  }

  constructor(options) {
    super(options);
    
    this.notes = []; // { frequency, velocity, phase, gain, startTime, duration, state }
    this.stagger = 0;
    this.port.onmessage = this.handleMessage.bind(this);

    // Filter state for each channel
    this.filterStateL = 0;
    this.filterStateR = 0;
    
    this.oscType = 'sawtooth';
    this.releaseTime = 0.1; // default
  }

  handleMessage(event) {
    const { type, ...data } = event.data;
    if (type === 'playChord' && data.notes && data.notes.length > 0) {
        this.stagger = data.stagger || 0;
        const now = currentTime;
        this.notes = data.notes.map(n => ({
            frequency: 440 * Math.pow(2, (n.midi - 69) / 12),
            velocity: n.velocity || 0.7,
            duration: n.duration,
            phase: 0,
            gain: 0, // start at 0
            startTime: data.when || now,
            state: 'attack'
        }));
    } else if (type === 'noteOff') {
        this.notes.forEach(note => { note.state = 'release'; });
    } else if (type === 'setPreset') {
        this.oscType = data.oscType || this.oscType;
        this.releaseTime = data.release || 0.1;
    }
  }

  applyFilter(input, filterCutoff, filterQ, channel) {
    const coeff = 1 - Math.exp(-2 * Math.PI * filterCutoff / sampleRate);
    let filterState = channel === 0 ? this.filterStateL : this.filterStateR;
    
    filterState += coeff * (input - filterState);
    const feedback = filterQ * (filterState - input);
    filterState += feedback;

    if (channel === 0) {
      this.filterStateL = filterState;
    } else {
      this.filterStateR = filterState;
    }
    return filterState;
  }
  
  applyDistortion(input, distortionAmount) {
    if (distortionAmount <= 0) return input;
    const k = distortionAmount * 5; // Scale for a more noticeable effect
    return (2 / Math.PI) * Math.atan(input * k);
  }

  generateOsc(phase) {
    switch (this.oscType) {
      case 'sine': return Math.sin(phase);
      case 'triangle': return 1 - 4 * Math.abs(0.5 - (phase / (2 * Math.PI)) % 1);
      case 'square': return (phase % (2 * Math.PI)) < Math.PI ? 1 : -1;
      case 'sawtooth': return 1 - (phase / Math.PI);
      case 'fatsine':
      case 'fmsine':
      case 'amsine':
      case 'pwm':
      case 'fatsawtooth':
        // A simple detuned sine for "fat" sounds
        return (Math.sin(phase) + Math.sin(phase * 1.01)) * 0.5;
      default: return Math.sin(phase);
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const attack = parameters.attack[0];
    const filterCutoff = parameters.filterCutoff[0];
    const filterQ = parameters.filterQ[0];
    const distortion = parameters.distortion[0];
    const release = this.releaseTime; // Use the value from setPreset

    const attackSamples = attack * sampleRate;
    const releaseSamples = release * sampleRate;
    
    for (let i = 0; i < output[0].length; ++i) {
        let sample = 0;

        this.notes.forEach((note, index) => {
            const timeSinceStart = (currentTime + i/sampleRate) - note.startTime;
            const staggerDelay = this.stagger * index;
            
            if (timeSinceStart < staggerDelay) {
              return; // Wait for stagger time
            }

            // Envelope calculation
            if (note.state === 'attack') {
                note.gain = Math.min(note.velocity, note.gain + note.velocity / attackSamples);
                if (timeSinceStart >= note.duration + staggerDelay) {
                    note.state = 'release';
                }
            } else if (note.state === 'release') {
                note.gain = Math.max(0, note.gain - note.velocity / releaseSamples);
            }

            if (note.gain > 0) {
                note.phase += (note.frequency / sampleRate) * 2 * Math.PI;
                if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;
                sample += this.generateOsc(note.phase) * note.gain;
            }
        });

        if (this.notes.length > 0) {
            sample /= this.notes.length > 1 ? this.notes.length * 0.7 : 1; // Basic mixdown
        }

        sample = this.applyFilter(sample, filterCutoff, filterQ, 0); // Apply to one channel
        sample = this.applyDistortion(sample, distortion);

        output[0][i] = sample;
        // Copy to other channels if they exist
        for (let channel = 1; channel < output.length; ++channel) {
            output[channel][i] = sample;
        }
    }
    
    this.notes = this.notes.filter(note => note.gain > 1e-5);

    return true;
  }
}

registerProcessor('chord-processor', ChordProcessor);
