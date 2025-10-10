

// worklets/chord-processor.js
class ChordProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.phase = 0;
    this.frequency = 0;
    this.isActive = false;
    this.attack = 0.01;
    this.release = 0.1;
    this.gain = 0;
    this.targetGain = 0;
    this.sampleRate = globalThis.sampleRate;

    // Subtractive Synth Parameters
    this.oscType = 'sawtooth';
    this.filterCutoff = 20000;
    this.filterQ = 0.7;
    this.filterState = 0; // for one-pole LPF
    this.distortionAmount = 0; // NEW distortion parameter

    // Chord-specific parameters
    this.notes = [];
    this.stagger = 0;

    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    const { type, ...data } = event.data;
    if (type === 'playChord') {
        this.notes = data.notes;
        this.stagger = data.stagger || 0;
        this.isActive = true;
        this.targetGain = 1; // Start fade in
    } else if (type === 'noteOff') {
        this.targetGain = 0; // Start fade out
    } else if (type === 'setPreset') {
        this.oscType = data.oscType || this.oscType;
        this.attack = data.attack ?? this.attack;
        this.release = data.release ?? this.release;
        this.filterCutoff = data.filterCutoff ?? this.filterCutoff;
        this.filterQ = data.q ?? this.filterQ;
        this.distortionAmount = data.distortion || 0;
    }
  }
  
  // Simple one-pole low-pass filter
  applyFilter(input) {
    const coeff = 1 - Math.exp(-2 * Math.PI * this.filterCutoff / this.sampleRate);
    this.filterState += coeff * (input - this.filterState);
    // Simple resonance simulation (not physically accurate but effective)
    const feedback = this.filterQ * (input - this.filterState);
    return this.filterState + feedback;
  }
  
  // Simple distortion effect
  applyDistortion(input) {
    if (this.distortionAmount <= 0) {
      return input;
    }
    // Simple waveshaper distortion
    const k = this.distortionAmount * 5; // Scale for more effect
    return ( (2 / Math.PI) * Math.atan(input * k) );
  }

  generateOsc(phase) {
    switch (this.oscType) {
      case 'sine': return Math.sin(phase);
      case 'triangle': return 1 - 4 * Math.abs((phase / (2 * Math.PI)) - 0.5);
      case 'square': return phase < Math.PI ? 1 : -1;
      case 'sawtooth': return 1 - (phase / Math.PI);
      default: return Math.sin(phase);
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        let sample = 0;

        // Envelope
        if (this.isActive && this.gain < this.targetGain) {
            this.gain = Math.min(this.targetGain, this.gain + 1 / (this.attack * this.sampleRate));
        } else if (!this.isActive && this.gain > 0) {
            this.gain = Math.max(0, this.gain - 1 / (this.release * this.sampleRate));
        }

        if (this.gain > 0 && this.notes.length > 0) {
          this.notes.forEach((note, index) => {
            const timeSinceStart = this.audioContext.currentTime - note.startTime;
            if (timeSinceStart >= this.stagger * index && timeSinceStart < note.duration) {
                note.phase += (note.frequency / this.sampleRate) * 2 * Math.PI;
                if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;
                sample += this.generateOsc(note.phase) * (note.velocity || 0.7);
            }
          });
          
          if (this.notes.length > 0) {
              sample /= this.notes.length; // Average samples to prevent clipping
          }
          
          sample = this.applyFilter(sample);
          sample = this.applyDistortion(sample);
          sample *= this.gain * 0.5; // Final gain stage
        }
        
        outputChannel[i] = sample;
      }
    }
    
    if (this.gain <= 0 && this.targetGain === 0) {
      this.isActive = false;
      this.notes = [];
    }

    return true;
  }
}

// Redefining a minimal version of AudioWorkletProcessor and related globals
// for type-checking and to avoid relying on a specific TS lib version.
class AudioWorkletProcessor {
  constructor(options) {
    this.port = {
      onmessage: null,
      postMessage: (message) => {},
    };
    this.audioContext = {
      currentTime: 0,
      sampleRate: 44100
    };
  }
  process(inputs, outputs, parameters) { return true; }
}
const globalThis = { sampleRate: 44100 };
function registerProcessor(name, processor) {}


registerProcessor('chord-processor', ChordProcessor);
