// src/lib/synthesis/bass-processor.ts

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

        if (type === 'noteOn') {
            const { frequency, velocity, technique, when } = data;
            this.technique = technique || 'pluck';
            
            const isLegato = this.notes.size > 0 && (this.technique === 'portamento' || this.technique === 'glide' || this.technique === 'glissando');

            if (isLegato) {
                this.portamentoStartFreq = this.portamentoTargetFreq;
                this.portamentoTargetFreq = frequency;
                this.portamentoProgress = 0; // Start the slide
            } else {
                this.portamentoStartFreq = frequency;
                this.portamentoTargetFreq = frequency;
                this.portamentoProgress = 1.0; // No slide
            }
            
            this.isPulsing = false;
            this.notes.clear();

            if (this.technique === 'pulse') {
                this.isPulsing = true;
                this.pulseBaseFrequency = frequency;
                this.pulseNextTriggerTime = currentTime;
                this.pulseNoteCounter = 0;
            } else {
                 this.notes.set(frequency, {
                    frequency,
                    phase: 0,
                    gain: 0,
                    targetGain: velocity,
                    state: 'attack',
                    attackTime: 0.02,
                    releaseTime: 0.4,
                    velocity
                });
            }
           
        } else if (type === 'noteOff') {
            this.isPulsing = false;
            for (const note of this.notes.values()) {
                note.state = 'release';
                note.targetGain = 0;
            }
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
        // --- 1. Process incoming messages ---
        while (this.messageQueue.length > 0) {
            this.handleMessage(this.messageQueue.shift());
        }

        const output = outputs[0];
        const channelCount = output.length;
        const frameCount = output[0].length;

        // Get parameters for this block
        const cutoff = parameters.cutoff[0];
        const distortion = parameters.distortion[0];
        const portamentoDuration = parameters.portamento[0];

        // --- 2. Handle Pulse Generation ---
        if (this.isPulsing && currentTime >= this.pulseNextTriggerTime) {
            const pulseInterval = 60 / (32 * 4); // 32nd note at current tempo (approx)
            this.pulseNextTriggerTime = currentTime + pulseInterval;
            const noteOffset = this.PULSE_NOTES[this.pulseNoteCounter++ % this.PULSE_NOTES.length];
            const pulseNoteFreq = this.pulseBaseFrequency * Math.pow(2, noteOffset / 12);
            
            this.notes.clear(); // Ensure only one pulse note at a time
            this.notes.set(pulseNoteFreq, {
                frequency: pulseNoteFreq, phase: 0, gain: 0, targetGain: 0.9,
                state: 'attack', attackTime: 0.005, releaseTime: 0.08, velocity: 0.9,
            });
        }
        
        // --- 3. Main processing loop ---
        for (let i = 0; i < frameCount; i++) {
            let leftSample = 0;
            let rightSample = 0;
            
            // --- Portamento update ---
            if (this.portamentoProgress < 1.0 && portamentoDuration > 0) {
                this.portamentoProgress += 1.0 / (portamentoDuration * sampleRate);
                if (this.portamentoProgress > 1.0) this.portamentoProgress = 1.0;
            }
            const currentSlideFreq = this.portamentoStartFreq * (1 - this.portamentoProgress) + this.portamentoTargetFreq * this.portamentoProgress;

            // --- Synthesize active notes ---
            for (const [key, note] of this.notes.entries()) {
                // ADSR Envelope
                if (note.state === 'attack') {
                    note.gain += (1 / (note.attackTime * sampleRate));
                    if (note.gain >= note.targetGain) { note.gain = note.targetGain; note.state = 'sustain'; }
                } else if (note.state === 'release') {
                    note.gain -= (1 / (note.releaseTime * sampleRate));
                    if (note.gain <= 0) { this.notes.delete(key); continue; }
                }

                const freq = (this.portamentoProgress < 1.0) ? currentSlideFreq : note.frequency;
                const rawSample = this.generateOsc(note.phase);
                
                note.phase += (freq * 2 * Math.PI) / sampleRate;
                if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;

                leftSample += rawSample * note.gain;
            }
            
            // Apply master effects
            const filteredSample = this.applyFilter(leftSample, cutoff, true);
            const distortedSample = this.softClip(filteredSample, distortion);

            // Simple stereo pan (optional, could be improved)
            rightSample = distortedSample;
            
            // Write to output channels
            for (let channel = 0; channel < channelCount; channel++) {
                if(channel % 2 === 0) output[channel][i] = distortedSample * 0.6; // Left
                else output[channel][i] = distortedSample * 0.6; // Right
            }
        }

        return true;
    }
}

registerProcessor('bass-processor', BassProcessor);
