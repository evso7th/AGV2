// public/worklets/bass-processor.js

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
    this.notes = new Map();
    this.messageQueue = [];
    this.technique = 'pluck';
    
    // Portamento (Glide) state
    this.portamentoTime = 0;
    this.portamentoProgress = 1.0;
    this.portamentoStartFreq = 0;
    this.portamentoTargetFreq = 0;
    
    // Filter state
    this.filterStateL = 0;
    this.filterStateR = 0;
    
    this.port.onmessage = (event) => {
        // We queue messages and process them in the process() loop
        // to ensure we have access to the latest parameters and currentTime.
        this.messageQueue.push(event.data);
    };
  }

  handleMessage(message) {
      const { type, ...data } = message;
      const { frequency, velocity, when, technique } = data;

      if (type === 'noteOn') {
          // Whether it's a new note or a legato slide, a new note event arrives.
          // Clear all existing notes to ensure monophonic behavior.
          this.allNotesOff();
          
          this.technique = technique || 'pluck';
          
          const isLegato = this.technique === 'portamento' || this.technique === 'glide' || this.technique === 'glissando';

          // Set the target frequency for the new note.
          this.portamentoTargetFreq = frequency;
          
          // If it's a legato slide, start the portamento effect.
          if (isLegato && this.portamentoStartFreq !== 0) {
              this.portamentoProgress = 0.0;
          } else {
              // Otherwise, snap directly to the new frequency.
              this.portamentoStartFreq = frequency;
              this.portamentoProgress = 1.0;
          }
          
          // Create the new note state.
          const newNote = {
              frequency: frequency, // This now holds the final target frequency.
              phase: 0,
              gain: 0,
              targetGain: velocity,
              state: 'attack',
              attackTime: 0.02,
              releaseTime: 0.4,
              velocity,
          };
          this.notes.set(frequency, newNote); // Use frequency as a unique key

      } else if (type === 'noteOff') {
          this.allNotesOff();
      }
  }

  allNotesOff() {
    for (const note of this.notes.values()) {
        note.state = 'release';
        note.targetGain = 0;
    }
  }
  
  generateOsc(phase) {
    const saw = 1 - (phase / Math.PI);
    const sub = Math.sin(phase * 0.5);
    return saw * 0.7 + sub * 0.3;
  }
  
  softClip(input, drive) {
    if (drive === 0) return input;
    const k = 2 + drive * 10;
    return (1 + k) * input / (1 + k * Math.abs(input));
  }
  
  applyFilter(input, cutoff, resonance, isLeft) {
    const filterCoeff = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
    let state = isLeft ? this.filterStateL : this.filterStateR;
    
    // Simple one-pole low-pass filter
    state += filterCoeff * (input - state);
    
    if (isLeft) this.filterStateL = state;
    else this.filterStateR = state;
    
    return state;
  }
  
  process(inputs, outputs, parameters) {
    while (this.messageQueue.length > 0) {
        this.handleMessage(this.messageQueue.shift());
    }

    const output = outputs[0];
    const channelCount = output.length;
    const frameCount = output[0].length;

    const cutoff = parameters.cutoff[0];
    const resonance = parameters.resonance[0];
    const distortion = parameters.distortion[0];
    const portamentoDuration = parameters.portamento[0];

    for (let i = 0; i < frameCount; i++) {
        let leftSample = 0;
        let rightSample = 0;
        let currentActiveFreq = 0;

        // --- Portamento Calculation ---
        if (this.portamentoProgress < 1.0 && portamentoDuration > 0) {
            this.portamentoProgress += 1.0 / (portamentoDuration * sampleRate);
            if (this.portamentoProgress >= 1.0) {
                this.portamentoProgress = 1.0;
                this.portamentoStartFreq = this.portamentoTargetFreq;
            }
        }
        
        currentActiveFreq = this.portamentoStartFreq * (1 - this.portamentoProgress) + this.portamentoTargetFreq * this.portamentoProgress;

        for (const [key, note] of this.notes.entries()) {
            if (note.state === 'attack') {
                note.gain += (1 / (note.attackTime * sampleRate));
                if (note.gain >= note.targetGain) { note.gain = note.targetGain; note.state = 'sustain'; }
            } else if (note.state === 'release') {
                note.gain -= (1 / (note.releaseTime * sampleRate));
                if (note.gain <= 0) { this.notes.delete(key); continue; }
            }

            if(i === 0 && this.notes.size > 0){
               console.log(`[bass-processor] Playing frequency: ${currentActiveFreq.toFixed(2)}`);
            }
            
            const rawSample = this.generateOsc(note.phase);
            note.phase += (currentActiveFreq * 2 * Math.PI) / sampleRate;
            if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;

            leftSample += rawSample * note.gain;
        }
        
        const filteredSample = this.applyFilter(leftSample, cutoff, resonance, true);
        const distortedSample = this.softClip(filteredSample, distortion);
        
        rightSample = distortedSample;
        
        for (let channel = 0; channel < channelCount; channel++) {
            output[channel][i] = distortedSample * 0.6; // Final gain staging
        }
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);

    