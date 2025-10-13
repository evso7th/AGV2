
class BassProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.notes = new Map(); // noteId -> { phase, gain, state, releaseTime, velocity, frequency }
        this.eventQueue = [];
        this.port.onmessage = (event) => {
            this.eventQueue.push(event.data);
        };
    }

    process(inputs, outputs, parameters) {
        // --- Event Handling ---
        // Process all events scheduled for the current block
        let nextEventIndex = 0;
        while (nextEventIndex < this.eventQueue.length && this.eventQueue[nextEventIndex].when <= currentTime + (128 / sampleRate)) {
            nextEventIndex++;
        }
        const eventsToProcess = this.eventQueue.splice(0, nextEventIndex);

        for (const event of eventsToProcess) {
             if (event.when > currentTime) {
                // This logic is tricky in process(). A simpler way is just to queue and process.
                // For now, let's assume we process if it's 'due'.
             }

            if (event.type === 'noteOn') {
                console.log(`[Worklet] Received noteOn at T=${currentTime.toFixed(2)} for when=${event.when.toFixed(2)}: Note ID ${event.noteId}, Freq ${event.frequency.toFixed(2)}`);
                this.notes.set(event.noteId, {
                    phase: 0,
                    gain: 0,
                    state: 'attack',
                    attackTime: 0.01, // Quick attack
                    releaseTime: 0.3,  // Quick release
                    velocity: event.velocity,
                    frequency: event.frequency
                });
            } else if (event.type === 'noteOff') {
                console.log(`[Worklet] Received noteOff at T=${currentTime.toFixed(2)} for when=${event.when.toFixed(2)}: Note ID ${event.noteId}`);
                const note = this.notes.get(event.noteId);
                if (note) {
                    note.state = 'release';
                }
            } else if (event.type === 'clear') {
                console.log(`[Worklet] Clearing all notes`);
                this.notes.clear();
            }
        }

        // --- Audio Generation ---
        const output = outputs[0];
        const channel = output[0];

        for (let i = 0; i < channel.length; ++i) {
            let sampleValue = 0;

            for (const [noteId, note] of this.notes.entries()) {
                // Basic ADSR envelope
                if (note.state === 'attack') {
                    note.gain += (note.velocity / (note.attackTime * sampleRate));
                    if (note.gain >= note.velocity) {
                        note.gain = note.velocity;
                        note.state = 'sustain';
                    }
                } else if (note.state === 'release') {
                    note.gain -= (note.velocity / (note.releaseTime * sampleRate));
                    if (note.gain <= 0) {
                        this.notes.delete(noteId);
                        continue;
                    }
                }

                // Simple sine wave oscillator
                if (note.frequency > 0 && note.gain > 0) {
                     sampleValue += Math.sin(note.phase) * note.gain;
                     if(i === 0 && noteId === 28) {
                        // console.log(`[Worklet] Playing note ${noteId} with gain ${note.gain.toFixed(3)}`);
                     }
                }
                
                note.phase += (note.frequency * 2 * Math.PI) / sampleRate;
                if (note.phase >= 2 * Math.PI) {
                    note.phase -= 2 * Math.PI;
                }
            }
            channel[i] = sampleValue * 0.5; // Master gain
        }

        return true;
    }
}

registerProcessor('bass-processor', BassProcessor);
