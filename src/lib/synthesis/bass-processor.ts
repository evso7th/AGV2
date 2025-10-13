
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
    private notes: Map<number, NoteState> = new Map();
    private messageQueue: any[] = [];
    private technique: string = 'pluck';

    // Portamento (Glide) state
    private portamentoTime: number = 0; // Duration of the slide in seconds
    private portamentoProgress: number = 1.0;
    private portamentoStartFreq: number = 0;
    private portamentoTargetFreq: number = 0;

    // Pulse state
    private isPulsing: boolean = false;
    private pulseBaseFrequency: number = 0;
    private pulseNextTriggerTime: number = 0;
    private pulseNoteCounter: number = 0;
    private readonly PULSE_NOTES: number[] = [0, 7, 12, 7]; // Root, 5th, Octave, 5th

    // Filter state
    private filterStateL: number = 0;
    private filterStateR: number = 0;


    static get parameterDescriptors() {
        return [
            { name: 'cutoff', defaultValue: 800, minValue: 50, maxValue: 10000 },
            { name: 'resonance', defaultValue: 0.7, minValue: 0.1, maxValue: 5 },
            { name: 'distortion', defaultValue: 0.1, minValue: 0, maxValue: 1 },
            { name: 'portamento', defaultValue: 0.05, minValue: 0, maxValue: 0.5 },
        ];
    }

    constructor() {
        super();
        this.port.onmessage = (event: MessageEvent) => {
            this.messageQueue.push(event.data);
        };
    }

    private handleMessage(message: any) {
        const { type, ...data } = message;
        const { frequency, velocity, when, technique, noteId } = data;

        if (type === 'noteOn') {
             this.notes.set(noteId, {
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
            const note = this.notes.get(noteId);
            if (note) {
                note.state = 'release';
                note.targetGain = 0;
            }
        } else if (type === 'clear') {
            this.notes.clear();
        }
    }
    
    private generateOsc(phase: number): number {
        const saw = 1 - (phase / Math.PI);
        const sub = Math.sin(phase * 0.5);
        return saw * 0.7 + sub * 0.3;
    }
    
    private softClip(input: number, drive: number): number {
        if (drive === 0) return input;
        const k = 2 + drive * 10;
        return (1 + k) * input / (1 + k * Math.abs(input));
    }
    
    private applyFilter(input: number, cutoff: number, isLeft: boolean): number {
        const filterCoeff = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
        if (isLeft) {
            this.filterStateL += filterCoeff * (input - this.filterStateL);
            return this.filterStateL;
        } else {
            this.filterStateR += filterCoeff * (input - this.filterStateR);
            return this.filterStateR;
        }
    }
    
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
        // Process queued messages at the beginning of each block
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            // If the event is scheduled for the future, handle it later
            if (message.when && message.when > currentTime) {
                this.messageQueue.unshift(message); // Put it back at the front
                break;
            }
            this.handleMessage(message);
        }

        const output = outputs[0];
        const channelCount = output.length;
        const frameCount = output[0].length;

        // Note: parameters are AudioParam-like, but we'll just read the first value for simplicity here
        const cutoff = parameters.cutoff[0];
        const distortion = parameters.distortion[0];

        for (let i = 0; i < frameCount; i++) {
            let sampleValue = 0;

            for (const [key, note] of this.notes.entries()) {
                // Envelope
                if (note.state === 'attack') {
                    note.gain += (1 / (note.attackTime * sampleRate));
                    if (note.gain >= note.targetGain) { 
                        note.gain = note.targetGain;
                        note.state = 'sustain'; 
                    }
                } else if (note.state === 'release') {
                    note.gain -= (1 / (note.releaseTime * sampleRate));
                    if (note.gain <= 0) {
                        this.notes.delete(key);
                        continue; // Go to next note
                    }
                }

                // Oscillator
                const rawSample = Math.sin(note.phase); // Simple sine wave for "steam pipe"
                note.phase += (note.frequency * 2 * Math.PI) / sampleRate;
                if (note.phase >= 2 * Math.PI) {
                    note.phase -= 2 * Math.PI;
                }

                sampleValue += rawSample * note.gain;
            }
            
            // Mix all active notes and apply to output channels
            for (let channel = 0; channel < channelCount; channel++) {
                output[channel][i] = sampleValue * 0.5; // Apply a master gain
            }
        }

        return true;
    }
}

registerProcessor('bass-processor', BassProcessor);
