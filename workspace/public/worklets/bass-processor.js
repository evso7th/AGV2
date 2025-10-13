// public/worklets/bass-processor.js

/**
 * A dead-simple "steam pipe" synthesizer running inside an AudioWorklet.
 * Its only job is to receive scheduled noteOn/noteOff messages and produce a sine wave.
 * This version corrects previous bugs related to constructor, sampleRate, and event queue handling.
 */
class BassProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options); // CRITICAL: Call super() first.
    
    this.noteQueue = [];
    this.activeNotes = new Map();
    this.sampleRate = options.processorOptions.sampleRate;
    this.enableLogging = true;

    this.port.onmessage = (event) => {
      this.noteQueue.push(event.data);
    };
  }

  handleMessage(message) {
    const { type, noteId, frequency, velocity, release } = message;

    if (type === 'noteOn') {
      if (this.enableLogging) {
        console.log(`[Worklet] Handled noteOn for ID ${noteId} at T=${currentTime.toFixed(2)}`);
      }
      this.activeNotes.set(noteId, {
        frequency,
        phase: 0,
        gain: 0,
        targetGain: velocity,
        state: 'attack',
        attackTime: 0.01, 
        releaseTime: release || 0.4,
      });
    } else if (type === 'noteOff') {
      const note = this.activeNotes.get(noteId);
      if (note) {
        if (this.enableLogging) {
          console.log(`[Worklet] Handled noteOff for ID ${noteId} at T=${currentTime.toFixed(2)}`);
        }
        note.state = 'release';
        note.targetGain = 0;
      }
    } else if (type === 'clear') {
       if (this.enableLogging) {
          console.log(`[Worklet] Clearing all notes.`);
       }
       this.activeNotes.clear();
    } else if (type === 'setLogging') {
        this.enableLogging = !!message.enable;
    }
  }

  process(inputs, outputs, parameters) {
    // Process all events scheduled for the current block.
    while (this.noteQueue.length > 0 && this.noteQueue[0].when <= currentTime) {
      const message = this.noteQueue.shift(); // Remove event from queue
      this.handleMessage(message);
    }
    
    const output = outputs[0];
    const frameCount = output[0].length;

    for (let i = 0; i < frameCount; i++) {
      let sampleValue = 0;

      for (const [key, note] of this.activeNotes.entries()) {
        // --- Envelope ---
        if (note.state === 'attack') {
          note.gain += (1 / (note.attackTime * this.sampleRate));
          if (note.gain >= note.targetGain) {
            note.gain = note.targetGain;
            note.state = 'sustain';
          }
        } else if (note.state === 'release') {
          note.gain -= (1 / (note.releaseTime * this.sampleRate));
          if (note.gain <= 0) {
            this.activeNotes.delete(key);
            continue;
          }
        }

        // --- Oscillator ---
        if (note.frequency > 0 && this.sampleRate > 0) {
          const rawSample = Math.sin(note.phase);
          note.phase += (note.frequency * 2 * Math.PI) / this.sampleRate;
          if (note.phase >= 2 * Math.PI) {
            note.phase -= 2 * Math.PI;
          }
          sampleValue += rawSample * note.gain;
        }
      }

      // --- Output ---
      for (let channel = 0; channel < output.length; channel++) {
        output[channel][i] = Math.max(-1, Math.min(1, sampleValue * 0.5));
      }
    }
    
    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
