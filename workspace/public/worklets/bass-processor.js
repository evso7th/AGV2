// public/worklets/bass-processor.js

class BassProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.sampleRate = options?.processorOptions?.sampleRate || 44100;
    this.activeNotes = new Map(); // { noteId: { phase, gain, state, params } }
    console.log(`[BassWorklet] Initialized with sample rate ${this.sampleRate}`);

    this.port.onmessage = (event) => {
      const messages = event.data;
      if (!Array.isArray(messages)) {
        console.error('[BassWorklet] Received non-array message:', messages);
        return;
      }
      
      console.log(`[BassWorklet] Received ${messages.length} messages.`);
      messages.forEach(message => this.handleMessage(message));
    };
  }

  handleMessage(message) {
    const { type, noteId, when } = message;
    const now = currentTime;
    const delay = (when - now) * 1000;

    if (type === 'noteOn') {
      const { frequency, velocity, params } = message;
      this.activeNotes.set(noteId, {
        phase: 0,
        gain: 0, // Start from 0 for attack envelope
        targetGain: velocity,
        state: 'attack',
        params: {
          attack: params?.attack ?? 0.01,
          release: params?.release ?? 0.5,
          cutoff: params?.cutoff ?? 800,
          resonance: params?.resonance ?? 0.5,
          distortion: params?.distortion ?? 0.1,
          oscType: params?.oscType ?? 'sawtooth',
        }
      });
      console.log(`[BassWorklet] noteOn scheduled for noteId: ${noteId} at time: ${when}`);
    } else if (type === 'noteOff') {
       // Schedule note off
       setTimeout(() => {
         const note = this.activeNotes.get(noteId);
         if (note && note.state === 'attack') {
           note.state = 'decay';
           console.log(`[BassWorklet] noteOff triggered for noteId: ${noteId}`);
         }
       }, Math.max(0, delay));
    } else if (type === 'clear') {
      this.activeNotes.clear();
      console.log('[BassWorklet] All notes cleared.');
    }
  }

  // Simple one-pole low-pass filter
  applyFilter(input, cutoff, state) {
    const coeff = 1.0 - Math.exp(-2.0 * Math.PI * cutoff / this.sampleRate);
    state.y1 = input * coeff + (1.0 - coeff) * state.y1;
    return state.y1;
  }

  // Soft clip distortion
  softClip(input, drive) {
    if (drive <= 0.01) return input;
    const k = 2 * drive / (1 - drive);
    return (1 + k) * input / (1 + k * Math.abs(input));
  }
  
  // Waveform generator
  generateOsc(phase, oscType) {
    switch (oscType) {
      case 'sine': return Math.sin(phase);
      case 'square': return phase < Math.PI ? 1 : -1;
      case 'sawtooth': return 1 - (phase / Math.PI);
      case 'triangle': return 1 - 4 * Math.abs(0.5 - (phase / (2 * Math.PI)));
      default: return Math.sin(phase);
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputChannel.length; i++) {
        let sample = 0;

        for (const [noteId, note] of this.activeNotes.entries()) {
          const { params } = note;

          // Envelope logic
          if (note.state === 'attack') {
            note.gain += 1 / (params.attack * this.sampleRate);
            if (note.gain >= note.targetGain) {
                note.gain = note.targetGain;
                // note.state remains 'attack' until a noteOff is received
            }
          } else if (note.state === 'decay') {
            note.gain -= 1 / (params.release * this.sampleRate);
            if (note.gain <= 0) {
              this.activeNotes.delete(noteId);
              continue;
            }
          }
          
          if (note.gain > 0) {
             const freq = 440 * Math.pow(2, (noteId - 69) / 12);
             note.phase += (freq / this.sampleRate) * 2 * Math.PI;
             if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;

             let oscSample = this.generateOsc(note.phase, params.oscType);
             oscSample = this.applyFilter(oscSample, params.cutoff, note.filterState = note.filterState || {y1:0});
             oscSample = this.softClip(oscSample, params.distortion);
             
             sample += oscSample * note.gain;
          }
        }
        outputChannel[i] = sample * 0.4; // Master volume
      }
    }
    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
