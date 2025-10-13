
// public/worklets/bass-processor.js

class BassProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.sampleRate = options.processorOptions.sampleRate;
    if (!this.sampleRate) {
        console.error("[Worklet] sampleRate is not defined. Defaulting to 44100.");
        this.sampleRate = 44100;
    }
    this.notes = new Map();
    this.noteQueue = [];
    this.port.onmessage = (event) => this.noteQueue.push(event.data);
  }

  handleMessage(message) {
    const { type, noteId, frequency, when } = message;
    
    if (type === 'noteOn') {
      this.notes.set(noteId, {
        frequency,
        phase: 0,
        gain: 0,
        state: 'attack',
        attackTime: 0.01,
        releaseTime: 0.3,
      });
    } else if (type === 'noteOff') {
      const note = this.notes.get(noteId);
      if (note) {
        note.state = 'release';
      }
    } else if (type === 'clear') {
      this.notes.clear();
    }
  }
    
  process(inputs, outputs, parameters) {
    while (this.noteQueue.length > 0 && this.noteQueue[0].when <= currentTime) {
        const message = this.noteQueue.shift();
        this.handleMessage(message);
    }

    const output = outputs[0];
    const channelCount = output.length;
    const frameCount = output[0].length;
    const sampleRate = this.sampleRate;

    for (let i = 0; i < frameCount; i++) {
        let sampleValue = 0;

        for (const [key, note] of this.notes.entries()) {
            // Envelope
            if (note.state === 'attack') {
                note.gain += (1 / (note.attackTime * sampleRate));
                if (note.gain >= 1) { 
                    note.gain = 1;
                    note.state = 'sustain'; 
                }
            } else if (note.state === 'release') {
                note.gain -= (1 / (note.releaseTime * sampleRate));
                if (note.gain <= 0) {
                    this.notes.delete(key);
                    continue;
                }
            }
            
            // Oscillator
            const rawSample = Math.sin(note.phase); // Simple sine wave
            note.phase += (note.frequency * 2 * Math.PI) / sampleRate;
            if (note.phase >= 2 * Math.PI) {
                note.phase -= 2 * Math.PI;
            }

            sampleValue += rawSample * note.gain;
        }
        
        for (let channel = 0; channel < channelCount; channel++) {
            output[channel][i] = sampleValue * 0.3; // Master gain
        }
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);

