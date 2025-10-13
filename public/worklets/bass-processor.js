/**
 * A robust, simplified synthesizer running inside an AudioWorklet.
 * This version fixes previous syntax and logic errors and adds extensive logging.
 */
class BassProcessor extends AudioWorkletProcessor {
    noteQueue = [];
    activeNotes = new Map();
    sampleRate;
    enableLogging = true;

    constructor(options) {
        super(options); // CRITICAL: Must be called first.
        this.sampleRate = options.processorOptions.sampleRate;
        
        // Correctly assign the onmessage handler
        this.port.onmessage = (event) => {
            this.noteQueue.push(event.data);
        };
        if (this.enableLogging) console.log('[Worklet] BassProcessor constructed and ready.');
    }

    handleMessage(message) {
        const { type, noteId, when, frequency, velocity } = message;

        if (this.enableLogging) {
            console.log(`[Worklet] Received ${type} for noteId ${noteId} at T=${currentTime.toFixed(2)} for when=${when ? when.toFixed(2) : 'N/A'}`);
        }

        if (type === 'noteOn') {
             this.activeNotes.set(noteId, {
                frequency,
                phase: 0,
                gain: 0,
                targetGain: velocity,
                state: 'attack',
                attackTime: 0.02,
                releaseTime: 0.4,
                velocity,
            });
        } else if (type === 'noteOff') {
            const note = this.activeNotes.get(noteId);
            if (note) {
                note.state = 'release';
                note.targetGain = 0;
            }
        } else if (type === 'clear') {
            this.activeNotes.clear();
             if (this.enableLogging) console.log('[Worklet] All notes cleared.');
        } else if (type === 'setLogging') {
            this.enableLogging = !!message.enable;
        }
    }
    
    process(inputs, outputs, parameters) {
        // Process queued messages that are ready to be played
        while (this.noteQueue.length > 0 && this.noteQueue[0].when <= currentTime) {
            const message = this.noteQueue.shift();
            this.handleMessage(message);
        }

        const output = outputs[0];
        const channelCount = output.length;
        const frameCount = output[0].length;

        // If no notes are active, we can just output silence and return early.
        if (this.activeNotes.size === 0) {
            for (let channel = 0; channel < channelCount; channel++) {
                output[channel].fill(0);
            }
            return true;
        }

        for (let i = 0; i < frameCount; i++) {
            let sampleValue = 0;

            for (const [key, note] of this.activeNotes.entries()) {
                // Envelope calculation
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

                // Oscillator calculation
                if (note.frequency > 0 && this.sampleRate > 0) {
                    const rawSample = Math.sin(note.phase);
                    note.phase += (note.frequency * 2 * Math.PI) / this.sampleRate;
                    if (note.phase >= 2 * Math.PI) {
                        note.phase -= 2 * Math.PI;
                    }
                    sampleValue += rawSample * note.gain;
                }
            }
            
            // Mixdown and clipping prevention for all channels
            for (let channel = 0; channel < channelCount; channel++) {
                output[channel][i] = Math.max(-1, Math.min(1, sampleValue * 0.5));
            }
        }

        return true;
    }
}

registerProcessor('bass-processor', BassProcessor);
