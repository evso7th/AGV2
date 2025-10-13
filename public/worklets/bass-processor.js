
// public/worklets/bass-processor.js

class BassProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.sampleRate = options.processorOptions.sampleRate;
    this.activeNotes = new Map(); // noteId -> { frequency, gain, state, phase, attack, release }
    this.noteQueue = [];
    this.enableLogging = true;

    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    if (this.enableLogging) {
      console.log(`[Worklet] BassProcessor constructed. Sample rate: ${this.sampleRate}`);
    }
  }

  handleMessage(message) {
    // Defensive logging to prevent crash
    if (this.enableLogging) {
        if (message.type === 'noteOn' || message.type === 'noteOff') {
            const timeLog = message.when !== undefined ? `for when=${message.when.toFixed(2)}` : '';
            console.log(`[Worklet] Received ${message.type} for noteId ${message.noteId} at T=${currentTime.toFixed(2)} ${timeLog}`);
        } else {
            console.log(`[Worklet] Received ${message.type}`);
        }
    }

    if (message.type === 'clear') {
        this.activeNotes.clear();
        this.noteQueue = [];
        return;
    }

    // All other messages are assumed to be note events and are queued
    this.noteQueue.push(message);
  }

  process(inputs, outputs, parameters) {
    const outputChannel = outputs[0][0];

    // Process the note queue at the beginning of each block
    for (let i = this.noteQueue.length - 1; i >= 0; i--) {
        const event = this.noteQueue[i];
        if (event.when <= currentTime) {
            if (event.type === 'noteOn') {
                this.activeNotes.set(event.noteId, {
                    frequency: event.frequency,
                    gain: 0,
                    state: 'attack',
                    phase: 0,
                    attack: event.attack || 0.01,
                    release: event.release || 0.3
                });
            } else if (event.type === 'noteOff') {
                const note = this.activeNotes.get(event.noteId);
                if (note) {
                    note.state = 'decay';
                }
            }
            this.noteQueue.splice(i, 1);
        }
    }

    for (let i = 0; i < outputChannel.length; i++) {
        let sample = 0;

        for (const [noteId, note] of this.activeNotes) {
             // Envelope calculation
            if (note.state === 'attack') {
                note.gain += (1 / (note.attack * this.sampleRate));
                if (note.gain >= 1.0) {
                    note.gain = 1.0;
                    note.state = 'sustain';
                }
            } else if (note.state === 'decay') {
                note.gain -= (1 / (note.release * this.sampleRate));
                if (note.gain <= 0) {
                    this.activeNotes.delete(noteId);
                    continue; // Skip to next note
                }
            }
            
            // Oscillator
            const wave = Math.sin(note.phase);
            sample += wave * note.gain;
            note.phase += (note.frequency * 2 * Math.PI) / this.sampleRate;
            if (note.phase > 2 * Math.PI) {
                note.phase -= 2 * Math.PI;
            }

            // --- DIAGNOSTIC LOG ---
            if (this.enableLogging && i === 0 && this.activeNotes.size > 0) {
                 if (noteId === Array.from(this.activeNotes.keys())[0]) { // Log only for the first active note to avoid spam
                    console.log(`[Worklet Process] Note ${noteId}: Sample=${sample.toFixed(3)}, Gain=${note.gain.toFixed(3)}, Phase=${note.phase.toFixed(3)}`);
                 }
            }
        }
        
        // Final output sample, with some clipping protection
        outputChannel[i] = Math.max(-1, Math.min(1, sample * 0.5));
    }
    
    // This MUST be at the end of the process method.
    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
