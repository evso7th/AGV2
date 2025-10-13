
// public/worklets/bass-processor.js

/**
 * Interface for the state of a single note being synthesized.
 * @typedef {object} NoteState
 * @property {number} frequency - The target frequency of the note in Hz.
 * @property {number} phase - The current phase of the oscillator.
 * @property {number} gain - The current amplitude of the note's envelope.
 * @property {number} targetGain - The target amplitude for the envelope.
 * @property {'attack' | 'sustain' | 'release' | 'pulsing'} state - The current state of the envelope.
 * @property {number} attackTime - The attack duration in seconds.
 * @property {number} releaseTime - The release duration in seconds.
 * @property {number} velocity - The initial velocity of the note (0-1).
 */

/**
 * A robust subtractive synthesizer running inside an AudioWorklet.
 * It handles messages within the `process` loop to avoid race conditions and
 * ensures access to `currentTime` and `parameters` is always valid.
 *
 * This processor implements various bass techniques like pluck, portamento,
 * and a self-generating pulse, all dictated by the composer's events.
 */
class BassProcessor extends AudioWorkletProcessor {
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
        /** @type {Map<number, NoteState>} */
        this.notes = new Map();
        /** @type {any[]} */
        this.messageQueue = [];

        // --- State variables ---
        this.portamentoTime = 0; // Duration of the slide in seconds
        this.portamentoProgress = 1.0;
        this.portamentoStartFreq = 0;
        this.portamentoTargetFreq = 0;
        this.currentFreq = 0; // The frequency that is actually being rendered

        // Filter state
        this.filterStateL = 0;
        this.filterStateR = 0;

        this.port.onmessage = (event) => {
            this.messageQueue.push(event.data);
        };
    }

    /**
     * Handles incoming messages from the main thread.
     * @param {any} message
     */
    handleMessage(message) {
        const { type, ...data } = message;
        const { frequency, velocity, when, technique } = data;

        if (type === 'noteOn') {
            const isLegato = this.notes.size > 0 && ['portamento', 'glide', 'glissando'].includes(technique);

            if (isLegato && this.notes.size > 0) {
                const firstNote = this.notes.values().next().value;
                this.portamentoStartFreq = this.currentFreq;
                this.portamentoTargetFreq = frequency;
                this.portamentoProgress = 0;
                
                // Update all existing notes to the new target frequency and velocity
                for (const note of this.notes.values()) {
                    note.frequency = frequency;
                    note.targetGain = velocity;
                    note.state = 'attack'; // Re-trigger envelope
                }

            } else {
                // Not a legato note, so clear all existing notes and start fresh.
                // This is the crucial fix to prevent old notes from lingering.
                this.notes.clear();

                const newNote = {
                    frequency,
                    phase: 0,
                    gain: 0,
                    targetGain: velocity,
                    state: 'attack',
                    attackTime: 0.02,
                    releaseTime: 0.4,
                    velocity,
                };
                this.notes.set(frequency, newNote);
                this.portamentoStartFreq = frequency;
                this.portamentoTargetFreq = frequency;
                this.currentFreq = frequency;
                this.portamentoProgress = 1.0;
            }
           
        } else if (type === 'noteOff') {
            for (const note of this.notes.values()) {
                note.state = 'release';
                note.targetGain = 0;
            }
        }
    }
    
    /** Generates the raw oscillator sound. */
    generateOsc(phase) {
        const saw = 1 - (phase / Math.PI);
        const sub = Math.sin(phase * 0.5);
        return saw * 0.7 + sub * 0.3;
    }
    
    /** Applies a simple soft-clipping distortion. */
    softClip(input, drive) {
        if (drive === 0) return input;
        const k = 2 + drive * 10;
        return (1 + k) * input / (1 + k * Math.abs(input));
    }
    
    /** Applies a simple one-pole low-pass filter. */
    applyFilter(input, cutoff, isLeft) {
        const filterCoeff = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
        if (isLeft) {
            this.filterStateL += filterCoeff * (input - this.filterStateL);
            return this.filterStateL;
        } else {
            this.filterStateR += filterCoeff * (input - this.filterStateR);
            return this.filterStateR;
        }
    }
    
    process(inputs, outputs, parameters) {
        while (this.messageQueue.length > 0) {
            this.handleMessage(this.messageQueue.shift());
        }

        const output = outputs[0];
        const channelCount = output.length;
        const frameCount = output[0].length;

        const cutoff = parameters.cutoff[0];
        const distortion = parameters.distortion[0];
        const portamentoDuration = parameters.portamento[0];

        // If there are no notes to play, output silence.
        if (this.notes.size === 0) {
            for (let channel = 0; channel < channelCount; channel++) {
                output[channel].fill(0);
            }
            return true;
        }

        // Apply portamento if active
        if (this.portamentoProgress < 1.0 && portamentoDuration > 0) {
            this.portamentoProgress += 1.0 / (portamentoDuration * sampleRate * (frameCount / 128));
             if (this.portamentoProgress >= 1.0) {
                this.portamentoProgress = 1.0;
                this.currentFreq = this.portamentoTargetFreq;
            } else {
                this.currentFreq = this.portamentoStartFreq * (1 - this.portamentoProgress) + this.portamentoTargetFreq * this.portamentoProgress;
            }
        } else if (this.notes.size > 0) {
            // Ensure currentFreq is up-to-date even without portamento
             const firstNote = this.notes.values().next().value;
             if (firstNote) {
                 this.currentFreq = firstNote.frequency;
             }
        }
        
        // Log the frequency being played for debugging
        if (this.notes.size > 0) {
           console.log(`[bass-processor] Playing frequency: ${this.currentFreq}`);
        }

        for (let i = 0; i < frameCount; i++) {
            let sample = 0;

            for (const [key, note] of this.notes.entries()) {
                // Update envelope
                if (note.state === 'attack') {
                    note.gain += 1 / (note.attackTime * sampleRate);
                    if (note.gain >= note.targetGain) {
                        note.gain = note.targetGain;
                        note.state = 'sustain';
                    }
                } else if (note.state === 'release') {
                    note.gain -= 1 / (note.releaseTime * sampleRate);
                    if (note.gain <= 0) {
                        this.notes.delete(key);
                        continue;
                    }
                }

                const rawSample = this.generateOsc(note.phase);
                note.phase += (this.currentFreq * 2 * Math.PI) / sampleRate;
                if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;

                sample += rawSample * note.gain;
            }
            
            const filteredSample = this.applyFilter(sample, cutoff, true);
            const distortedSample = this.softClip(filteredSample, distortion);
            
            for (let channel = 0; channel < channelCount; channel++) {
                output[channel][i] = distortedSample * 0.6;
            }
        }

        return true;
    }
}

registerProcessor('bass-processor', BassProcessor);
