class BassProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 400, minValue: 50, maxValue: 2000 },
      { name: 'resonance', defaultValue: 0.7, minValue: 0.1, maxValue: 5 },
      { name: 'distortion', defaultValue: 0.05, minValue: 0, maxValue: 1 },
      { name: 'portamento', defaultValue: 0.0, minValue: 0, maxValue: 0.5 }
    ];
  }

  constructor(options) {
    super(options);
    this.activeNotes = new Map();
    this.lastFreq = 0;
    this.portamentoTarget = 0;
    this.portamentoProgress = 1.0;
    this.portamentoTime = 0;
    this.portamentoStartTime = 0;
    this.technique = 'pluck';
    
    this.pulseCounter = -1; // -1 means inactive
    this.pulseFrequency = 0;
    this.pulseInterval = 0;
    this.pulseNotes = [0, 7, 12, 7]; // Root, 5th, Octave, 5th
    
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    const { type, ...data } = event.data;
    console.log(`[BassProcessor] Received message:`, event.data);
    
    if (type === 'noteOn') {
      const { frequency, velocity, technique, portamentoDuration } = data;
      this.technique = technique || 'pluck';
      
      const isLegato = this.activeNotes.size > 0 && portamentoDuration > 0;

      if (isLegato) {
        this.portamentoTarget = frequency;
        this.portamentoTime = portamentoDuration;
        this.portamentoStartTime = currentTime;
      } else {
        this.lastFreq = frequency;
        this.portamentoTarget = frequency;
        this.portamentoTime = 0;
        this.portamentoProgress = 1.0;
      }
      
      this.activeNotes.clear(); // Monosynth
      this.pulseCounter = -1; // Stop any previous pulse

      if (this.technique === 'pulse') {
        this.pulseFrequency = frequency;
        this.pulseCounter = 0;
        this.pulseInterval = Math.floor(sampleRate / 8); // 16th notes at 120 bpm, adjust if needed
      } else {
        this.activeNotes.set(frequency, {
          phase: 0,
          gain: velocity,
          targetGain: velocity,
          state: 'attack',
          attackTime: 0.01, // Quick attack
          releaseTime: 0.3 // Default release
        });
      }
    } else if (type === 'noteOff') {
      if (this.technique === 'pulse') {
          this.pulseCounter = -1; // Stop the pulse
      }
      for (const note of this.activeNotes.values()) {
        note.state = 'release';
        note.targetGain = 0;
      }
    }
  }

  // --- Synthesis Functions ---
  pulseWave(phase, width) { return phase % (2 * Math.PI) < width * 2 * Math.PI ? 1 : -1; }
  softClip(input, drive) {
    const k = 2 * drive;
    if (drive === 0) return input;
    return (input * (1 + k)) / (1 + k * Math.abs(input));
  }
  
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    
    // --- Pulse/Arpeggio logic ---
    if (this.pulseCounter >= 0) {
        this.pulseCounter++;
        if (this.pulseCounter >= this.pulseInterval) {
            this.pulseCounter = 0;
            const noteOffset = this.pulseNotes[this.pulseCounter % this.pulseNotes.length];
            const pulseNoteFreq = this.pulseFrequency * Math.pow(2, noteOffset / 12);
            
            // Trigger a short note
            this.activeNotes.clear();
            this.activeNotes.set(pulseNoteFreq, {
                phase: 0,
                gain: 0, 
                targetGain: 0.8,
                state: 'attack',
                attackTime: 0.005,
                releaseTime: 0.05 // short release for pulse
            });
            this.lastFreq = pulseNoteFreq;
        }
    }

    // --- Portamento logic ---
    const portamentoDuration = parameters.portamento[0];
    if (this.portamentoTime > 0) {
        const t = (currentTime - this.portamentoStartTime) / sampleRate;
        if (t >= this.portamentoTime) {
            this.lastFreq = this.portamentoTarget;
            this.portamentoTime = 0;
        } else {
            const progress = t / this.portamentoTime;
            this.lastFreq = this.lastFreq * (1 - progress) + this.portamentoTarget * progress;
        }
    } else if (this.activeNotes.size > 0) {
        // If not doing portamento, ensure lastFreq is the current note's frequency.
        // For simplicity, we just take the first, as it's a monosynth.
        this.lastFreq = this.activeNotes.keys().next().value;
    }


    // --- Main processing loop ---
    for (let i = 0; i < output[0].length; i++) {
      let sample = 0;
      const cutoff = parameters.cutoff.length > 1 ? parameters.cutoff[i] : parameters.cutoff[0];
      const resonance = parameters.resonance.length > 1 ? parameters.resonance[i] : parameters.resonance[0];
      const distortion = parameters.distortion.length > 1 ? parameters.distortion[i] : parameters.distortion[0];
      
      for (const [freq, note] of this.activeNotes) {
        
        // --- ADSR Envelope ---
        if (note.state === 'attack') {
            note.gain += (1 / (note.attackTime * sampleRate));
            if (note.gain >= note.targetGain) {
                note.gain = note.targetGain;
                note.state = 'sustain';
            }
        } else if (note.state === 'release') {
            note.gain -= (1 / (note.releaseTime * sampleRate));
            if (note.gain <= 0) {
                note.gain = 0;
                this.activeNotes.delete(freq);
                continue;
            }
        }
        
        const currentFreq = this.portamentoTime > 0 ? this.lastFreq : freq;
        const phase = note.phase;
        const wave1 = this.pulseWave(phase, 0.5);
        const wave2 = Math.sin(phase * 0.5);
        
        // Simplified filter (not shown for brevity, assume pass-through for now)
        let filteredSample = wave1 + wave2 * 0.7;

        const distorted = this.softClip(filteredSample, distortion);
        
        sample += distorted * note.gain;
        note.phase += (currentFreq * 2 * Math.PI) / sampleRate;
        if (note.phase > 2 * Math.PI) note.phase -= 2 * Math.PI;
      }
      
      output[0][i] = sample * 0.5; // Final gain
    }
    
    // Copy to other channels if they exist
    for (let channel = 1; channel < output.length; channel++) {
        output[channel].set(output[0]);
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);

    