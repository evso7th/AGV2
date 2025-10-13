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
    this.technique = 'pluck';
    
    // Pulse/Arpeggio state
    this.pulseCounter = -1; // -1 means inactive
    this.pulseFrequency = 0;
    this.pulseInterval = 0;
    this.pulseNotes = [0, 7, 12, 7]; // Root, 5th, Octave, 5th
    
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    const { type, ...data } = event.data;
    const time = data.when || currentTime;
    const parameters = this.parameters;

    if (type === 'noteOn') {
      const { frequency, velocity, technique } = data;
      this.technique = technique || 'pluck';
      
      const portamentoParam = parameters.get('portamento');
      const portamentoDuration = portamentoParam ? portamentoParam[0] : 0;

      if (this.activeNotes.size > 0 && portamentoDuration > 0) {
        this.portamentoTarget = frequency;
        this.portamentoProgress = 0;
      } else {
        this.lastFreq = frequency;
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
          state: 'attack'
        });
      }
    } else if (type === 'noteOff') {
      if (this.technique === 'pulse') {
          this.pulseCounter = -1; // Stop the pulse
      }
      for (const note of this.activeNotes.values()) {
        note.state = 'release';
      }
    }
  }

  // --- Synthesis Functions ---
  pulseWave(phase, width) { return phase % (2 * Math.PI) < width * 2 * Math.PI ? 1 : -1; }
  softClip(input, drive) {
    const k = 2 * drive;
    return (input * (1 + k)) / (1 + k * Math.abs(input));
  }
  
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const portamentoParam = parameters.portamento[0];
    
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
                gain: 0.8, // Fixed velocity for pulse
                state: 'attack',
                short_release: true // Custom flag for fast release
            });
            this.lastFreq = pulseNoteFreq;
        }
    }

    // --- Portamento logic ---
    if (this.portamentoProgress < 1.0) {
      this.portamentoProgress += 1.0 / (portamentoParam * sampleRate);
      if (this.portamentoProgress >= 1.0) {
        this.portamentoProgress = 1.0;
        this.lastFreq = this.portamentoTarget;
      } else {
         const easedProgress = 1 - Math.pow(1 - this.portamentoProgress, 2);
         this.lastFreq = this.lastFreq * (1 - easedProgress) + this.portamentoTarget * easedProgress;
      }
    }

    // --- Main processing loop ---
    for (let i = 0; i < output[0].length; i++) {
      let sample = 0;
      const cutoff = parameters.cutoff[i] || parameters.cutoff[0];
      const resonance = parameters.resonance[i] || parameters.resonance[0];
      const distortion = parameters.distortion[i] || parameters.distortion[0];
      
      for (const [freq, note] of this.activeNotes) {
        if (note.state === 'decay') {
            note.gain *= note.short_release ? 0.95 : 0.995; // Faster decay for pulse notes
            if (note.gain < 0.001) {
                this.activeNotes.delete(freq);
                continue;
            }
        }
        
        const phase = note.phase;
        const wave1 = this.pulseWave(phase, 0.5);
        const wave2 = Math.sin(phase * 0.5);
        
        // Simplified filter (not shown for brevity, assume pass-through for now)
        let filteredSample = wave1 + wave2 * 0.7;

        const distorted = this.softClip(filteredSample, distortion);
        
        sample += distorted * note.gain;
        note.phase += (this.lastFreq * 2 * Math.PI) / sampleRate;
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