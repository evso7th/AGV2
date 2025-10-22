// public/worklets/chord-processor.js
class ChordProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    
    this.activeNotes = new Map();
    this.port.onmessage = this.handleMessage.bind(this);
    
    this.phase = 0;
    this.sampleRate = options?.processorOptions?.sampleRate || 44100;
  }

  handleMessage(event) {
    console.log('[ChordProcessor] Received message:', event.data);
    const messages = Array.isArray(event.data) ? event.data : [event.data];

    for (const message of messages) {
        switch (message.type) {
          case 'noteOn': {
            const { noteId, when, frequency, velocity, params } = message;
            if (when > currentTime) {
              const noteData = {
                id: noteId,
                freq: frequency,
                startTime: when,
                velocity: velocity || 0.7,
                attack: params.attack || 0.02,
                release: params.release || 0.3,
                
                // Synth params
                oscType: params.oscType || 'sawtooth',
                cutoff: params.cutoff || 800,
                resonance: params.resonance || 0.5,
                distortion: params.distortion || 0.1,
                
                // Envelope state
                gain: 0,
                targetGain: velocity || 0.7,
                isReleasing: false,

                // Filter state
                filterState: 0,
                filterCoeff: 1 - Math.exp(-2 * Math.PI * (params.cutoff || 800) / this.sampleRate),

                // Phase for this specific note
                phase: 0
              };
              this.activeNotes.set(noteId, noteData);
            }
            break;
          }
          case 'noteOff': {
            const { noteId, when } = message;
            const note = this.activeNotes.get(noteId);
            if (note && when > currentTime) {
               note.releaseTime = when;
               note.isReleasing = true;
               note.targetGain = 0;
            }
            break;
          }
          case 'clear':
            this.activeNotes.clear();
            break;
        }
    }
  }
  
  applyFilter(input, noteState) {
    noteState.filterState += noteState.filterCoeff * (input - noteState.filterState);
    return noteState.filterState;
  }

  generateOsc(noteState) {
    switch (noteState.oscType) {
      case 'sine':
        return Math.sin(noteState.phase);
      case 'triangle':
        return 1 - 4 * Math.abs((noteState.phase / (2 * Math.PI)) - 0.5);
      case 'square':
        return noteState.phase < Math.PI ? 1 : -1;
      case 'sawtooth':
        return 1 - (noteState.phase / Math.PI);
      default:
        return Math.sin(noteState.phase);
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channelCount = output.length;

    if (this.activeNotes.size === 0) {
        return true; 
    }
    
    // Log active notes state periodically
    if (Math.random() < 0.01) { // Roughly once per second
       console.log(`[ChordProcessor] Active notes: ${this.activeNotes.size}, CurrentTime: ${currentTime.toFixed(2)}`);
       this.activeNotes.forEach(note => {
          console.log(`  - Note ${note.id}: Freq=${note.freq}, Gain=${note.gain.toFixed(2)}, Releasing=${note.isReleasing}`);
       });
    }

    for (let i = 0; i < output[0].length; ++i) {
      let sample = 0;
      const now = currentTime + i / this.sampleRate;

      for (const [noteId, note] of this.activeNotes.entries()) {
        
        if (now < note.startTime) continue;
        if (note.gain <= 0.0001 && note.isReleasing) {
            this.activeNotes.delete(noteId);
            continue;
        }
        
        if(note.releaseTime && now >= note.releaseTime){
            note.isReleasing = true;
            note.targetGain = 0;
        }
        
        // --- Generate Signal ---
        note.phase += (note.freq / this.sampleRate) * 2 * Math.PI;
        if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;
        let noteSample = this.generateOsc(note);

        // --- Apply Filter ---
        noteSample = this.applyFilter(noteSample, note);

        // --- Apply Envelope ---
        if (!note.isReleasing) {
            note.gain += (note.targetGain - note.gain) / (note.attack * this.sampleRate);
        } else {
            note.gain -= note.gain / (note.release * this.sampleRate);
        }
        note.gain = Math.max(0, note.gain);

        sample += noteSample * note.gain;
      }
      
      sample = Math.tanh(sample); // Soft clipping to prevent harsh distortion

      for (let channel = 0; channel < channelCount; ++channel) {
        output[channel][i] = sample * 0.3; // Final output gain
      }
    }

    return true;
  }
}

registerProcessor('chord-processor', ChordProcessor);
