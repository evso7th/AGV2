
// bass-processor.ts

interface NoteState {
  phase: number;
  gain: number;
  targetGain: number;
  state: 'attack' | 'sustain' | 'release';
  attackTime: number;
  releaseTime: number;
  frequency: number;
}

class BassProcessor extends AudioWorkletProcessor {
  private activeNotes: Map<number, NoteState> = new Map();
  private technique: string = 'pluck';
  
  // Filter state
  private filterState: number = 0;
  private filterCoeff: number = 0;
  private filterResonance: number = 0.7;

  // Portamento state
  private portamentoTime: number = 0;
  private portamentoProgress: number = 1;
  private portamentoStartFreq: number = 0;
  private portamentoTargetFreq: number = 0;

  // Pulse state
  private pulseCounter: number = -1;
  private pulseNoteCounter: number = 0;
  private pulseFrequency: number = 0;
  private pulseInterval: number = 0;
  private readonly pulseNotes: number[] = [0, 7, 12, 7]; // Root, 5th, Octave, 5th

  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 800, minValue: 50, maxValue: 5000 },
      { name: 'resonance', defaultValue: 0.7, minValue: 0.1, maxValue: 5 },
      { name: 'distortion', defaultValue: 0.1, minValue: 0, maxValue: 1 },
      { name: 'portamento', defaultValue: 0.05, minValue: 0, maxValue: 0.5 },
    ];
  }

  constructor() {
    super();
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event: MessageEvent) {
    const { type, ...data } = event.data;
    
    if (type === 'noteOn') {
      const { frequency, velocity, technique, when } = data;
      this.technique = technique || 'pluck';
      
      const isLegato = this.activeNotes.size > 0 && this.portamentoTime > 0;

      if (isLegato) {
          this.portamentoStartFreq = this.portamentoTargetFreq;
          this.portamentoTargetFreq = frequency;
          this.portamentoProgress = 0;
      } else {
          this.portamentoStartFreq = frequency;
          this.portamentoTargetFreq = frequency;
          this.portamentoProgress = 1.0;
      }

      this.activeNotes.clear();
      this.pulseCounter = -1;

      if (this.technique === 'pulse') {
          this.pulseFrequency = frequency;
          this.pulseCounter = 0;
          this.pulseNoteCounter = 0;
      } else {
          this.activeNotes.set(frequency, {
              frequency,
              phase: 0,
              gain: 0,
              targetGain: velocity,
              state: 'attack',
              attackTime: 0.02,
              releaseTime: 0.4
          });
      }
    } else if (type === 'noteOff') {
        if (this.technique === 'pulse') {
            this.pulseCounter = -1;
        }
        for (const note of this.activeNotes.values()) {
            note.state = 'release';
            note.targetGain = 0;
        }
    }
  }

  pulseWave(phase: number, width: number) { return phase % (2 * Math.PI) < width * 2 * Math.PI ? 1 : -1; }
  sawtoothWave(phase: number) { return 1 - (phase / Math.PI); }
  
  softClip(input: number, drive: number) {
    if (drive === 0) return input;
    const k = 2 + drive * 10;
    return (1 + k) * input / (1 + k * Math.abs(input));
  }

  applyFilter(input: number, cutoff: number, q: number) {
    this.filterCoeff = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
    this.filterResonance = q; // Simple resonance mapping
    
    const feedback = this.filterResonance + this.filterResonance / (1 - this.filterCoeff);
    this.filterState += this.filterCoeff * (input - this.filterState + feedback * (this.filterState - this.applyFilter(this.filterState, cutoff, q))); // Simplified feedback
    
    return this.filterState;
  }


  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    const output = outputs[0];
    const cutoff = parameters.cutoff[0];
    const resonance = parameters.resonance[0];
    const distortion = parameters.distortion[0];
    const portamentoDuration = parameters.portamento[0];

    // --- Pulse logic ---
    if (this.pulseCounter >= 0) {
        this.pulseInterval = Math.floor(sampleRate / (this.technique === 'pulse' ? 32 : 8));
        this.pulseCounter++;
        if (this.pulseCounter >= this.pulseInterval) {
            this.pulseCounter = 0;
            const noteOffset = this.pulseNotes[this.pulseNoteCounter++ % this.pulseNotes.length];
            const pulseNoteFreq = this.pulseFrequency * Math.pow(2, noteOffset / 12);
            this.activeNotes.clear();
            this.activeNotes.set(pulseNoteFreq, {
                frequency: pulseNoteFreq, phase: 0, gain: 0, targetGain: 0.9, 
                state: 'attack', attackTime: 0.005, releaseTime: 0.08
            });
        }
    }

    // --- Portamento logic ---
    if (this.portamentoProgress < 1.0) {
        this.portamentoProgress += 1.0 / (portamentoDuration * sampleRate);
        if (this.portamentoProgress >= 1.0) {
            this.portamentoProgress = 1.0;
        }
    }
    const currentSlideFreq = this.portamentoStartFreq * (1 - this.portamentoProgress) + this.portamentoTargetFreq * this.portamentoProgress;
    
    // --- Main processing loop ---
    for (let i = 0; i < output[0].length; i++) {
        let sample = 0;
        
        for (const [key, note] of this.activeNotes) {
            // ADSR Envelope
            if (note.state === 'attack') {
                note.gain += (1 / (note.attackTime * sampleRate));
                if (note.gain >= note.targetGain) { note.gain = note.targetGain; note.state = 'sustain'; }
            } else if (note.state === 'release') {
                note.gain -= (1 / (note.releaseTime * sampleRate));
                if (note.gain <= 0) { this.activeNotes.delete(key); continue; }
            }

            const freq = (this.portamentoProgress < 1.0) ? currentSlideFreq : note.frequency;
            
            const saw = this.sawtoothWave(note.phase);
            const sub = Math.sin(note.phase * 0.5);
            let rawSample = saw * 0.7 + sub * 0.3;

            // Simple one-pole low-pass filter
            this.filterCoeff = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
            this.filterState += this.filterCoeff * (rawSample - this.filterState);
            const filteredSample = this.filterState;

            const distorted = this.softClip(filteredSample, distortion);
            sample += distorted * note.gain;
            
            note.phase += (freq * 2 * Math.PI) / sampleRate;
            if (note.phase > 2 * Math.PI) note.phase -= 2 * Math.PI;
        }

        output[0][i] = sample * 0.6;
    }

    if (output.length > 1) {
        output[1].set(output[0]);
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);

    