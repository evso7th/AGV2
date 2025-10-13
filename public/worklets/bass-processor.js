
/**
 * A simple Subtractive Synth Voice processor.
 * It's designed to be lightweight and responsive, running in the audio thread.
 * It handles note on/off events, ADSR envelope, and a basic low-pass filter.
 *
 * This version processes messages in a batch to improve performance.
 */
class BassProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super(options);
        this.sampleRate = options.processorOptions.sampleRate || currentTime;
        this.activeNotes = new Map(); // Maps noteId to note state
        this.noteQueue = [];
        this.enableLogging = true;
        this.port.onmessage = this.handleMessage.bind(this);
        if (this.enableLogging) console.log(`[Worklet] BassProcessor constructed. Sample rate: ${this.sampleRate}`);
    }

    handleMessage(event) {
        // We now expect an array of messages
        const messages = event.data;
        for (const message of messages) {
            if (this.enableLogging && (message.type === 'noteOn' || message.type === 'noteOff')) {
                console.log(`[Worklet] Received ${message.type} for noteId ${message.noteId} at T=${currentTime.toFixed(2)} for when=${message.when.toFixed(2)}`);
            }

            if (message.type === 'clear') {
                this.noteQueue = [];
                this.activeNotes.clear();
                if (this.enableLogging) console.log('[Worklet] All notes cleared.');
            } else {
                this.noteQueue.push(message);
            }
        }
    }

    process(inputs, outputs) {
        const output = outputs[0];
        const outputChannel = output[0];
        const now = currentTime;

        // Process the message queue for events that should happen now
        this.noteQueue = this.noteQueue.filter(noteEvent => {
            if (noteEvent.when <= now) {
                if (noteEvent.type === 'noteOn') {
                    this.activeNotes.set(noteEvent.noteId, {
                        phase: 0,
                        gain: 0,
                        targetGain: noteEvent.velocity * 0.5, // Start with a velocity-based gain
                        state: 'attack',
                        frequency: noteEvent.frequency,
                        // Simple ADSR values
                        attack: 0.02,
                        decay: 0.1,
                        sustain: 0.7,
                        release: 0.8,
                    });
                } else if (noteEvent.type === 'noteOff') {
                    const note = this.activeNotes.get(noteEvent.noteId);
                    if (note) {
                        note.state = 'release';
                        note.targetGain = 0; // Target gain is now 0 for the release phase
                    }
                }
                return false; // Remove from queue
            }
            return true; // Keep in queue
        });
        
        // Process each sample in the block
        for (let i = 0; i < outputChannel.length; ++i) {
            let sample = 0;

            for (const [noteId, note] of this.activeNotes) {
                // --- Envelope ---
                if (note.state === 'attack') {
                    note.gain += 1.0 / (note.attack * this.sampleRate);
                    if (note.gain >= note.targetGain) {
                        note.gain = note.targetGain;
                        note.state = 'decay';
                    }
                } else if (note.state === 'decay') {
                    const sustainGain = note.targetGain * note.sustain;
                    if (note.gain > sustainGain) {
                        note.gain -= 1.0 / (note.decay * this.sampleRate);
                    } else {
                        note.gain = sustainGain;
                        note.state = 'sustain';
                    }
                } else if (note.state === 'release') {
                    note.gain -= note.targetGain / (note.release * this.sampleRate);
                    if (note.gain <= 0) {
                        this.activeNotes.delete(noteId);
                        continue; 
                    }
                }

                // --- Oscillator ---
                const wave = Math.sin(note.phase) * 0.5 + Math.sin(note.phase * 0.5) * 0.5; // Sine + Sub-octave
                sample += wave * note.gain;
                
                note.phase += (note.frequency * 2 * Math.PI) / this.sampleRate;
                if (note.phase >= 2 * Math.PI) {
                    note.phase -= 2 * Math.PI;
                }
            }
            outputChannel[i] = sample;
        }

        return true;
    }
}

registerProcessor('bass-processor', BassProcessor);
