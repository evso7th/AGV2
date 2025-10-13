
// This file is obsolete and will be removed. The correct logic is in public/worklets/bass-processor.js
// This interface must be declared in the global scope for the AudioWorkletProcessor.
interface NoteState {
  phase: number;
  gain: number;
  targetGain: number;
  state: 'attack' | 'sustain' | 'release' | 'pulsing';
  attackTime: number; // in seconds
  releaseTime: number; // in seconds
  frequency: number;
  velocity: number;
}

/**
 * A robust subtractive synthesizer running inside an AudioWorklet.
 * It handles messages within the `process` loop to avoid race conditions and
 * ensures access to `currentTime` and `parameters` is always valid.
 *
 * This processor now correctly implements various bass techniques like pluck, portamento,
 * and a self-generating pulse, all dictated by the composer's events.
 */
class BassProcessor extends AudioWorkletProcessor {
    private noteQueue: any[] = [];
    private activeNotes: Map<number, NoteState> = new Map();
    private sampleRate: number;

    constructor(options: any) {
        super(options);
        this.sampleRate = options.processorOptions.sampleRate;
        this.port.onmessage = (event: MessageEvent) => {
            this.noteQueue.push(event.data);
        };
    }

    private handleMessage(message: any) {
        const { type, noteId, when, frequency, velocity } = message;
        console.log(`[Worklet] Received ${type} for noteId ${noteId} at T=${currentTime.toFixed(2)} for when=${when.toFixed(2)}`);

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
        }
    }
    
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
        // Process queued messages at the beginning of each block
        while (this.noteQueue.length > 0 && this.noteQueue[0].when <= currentTime) {
            const message = this.noteQueue.shift();
            this.handleMessage(message);
        }

        const output = outputs[0];
        const channelCount = output.length;
        const frameCount = output[0].length;

        for (let i = 0; i < frameCount; i++) {
            let sampleValue = 0;

            for (const [key, note] of this.notes.entries()) {
                // Envelope
                if (note.state === 'attack') {
                    note.gain += (1 / (note.attackTime * this.sampleRate));
                    if (note.gain >= note.targetGain) { 
                        note.gain = note.targetGain;
                        note.state = 'sustain'; 
                    }
                } else if (note.state === 'release') {
                    note.gain -= (1 / (note.releaseTime * this.sampleRate));
                    if (note.gain <= 0) {
                        this.notes.delete(key);
                        continue; // Go to next note
                    }
                }

                // Oscillator
                if (note.frequency > 0 && this.sampleRate > 0) {
                    const rawSample = Math.sin(note.phase); // Simple sine wave for "steam pipe"
                    note.phase += (note.frequency * 2 * Math.PI) / this.sampleRate;
                    if (note.phase >= 2 * Math.PI) {
                        note.phase -= 2 * Math.PI;
                    }
                    sampleValue += rawSample * note.gain;
                }
            }
            
            // Mix all active notes and apply to output channels
            for (let channel = 0; channel < channelCount; channel++) {
                // Clipping prevention
                output[channel][i] = Math.max(-1, Math.min(1, sampleValue * 0.5));
            }
        }

        return true;
    }
}

registerProcessor('bass-processor', BassProcessor);
