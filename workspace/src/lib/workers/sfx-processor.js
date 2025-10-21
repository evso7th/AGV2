// public/worklets/sfx-processor.js

class SfxProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super(options);
        this.activeNotes = new Map();
        this.port.onmessage = this.handleMessage.bind(this);
        console.log('[SFXProcessor] Worklet created and ready.');
    }

    handleMessage(event) {
        const messages = Array.isArray(event.data) ? event.data : [event.data];
        
        for (const message of messages) {
             const { type, when, noteId } = message;

            if (type === 'noteOn') {
              const { params } = message;
              if (!params) continue;

              this.activeNotes.set(noteId, {
                state: 'scheduled',
                startTime: when,
                endTime: when + params.duration,
                phase: 0,
                gain: 0,
                targetGain: 1.0, 
                frequency: params.startFreq,
                endFrequency: params.endFreq,
                params: params,
                filterState: { y1: 0, y2: 0, oldx: 0, oldy: 0 },
                oscillators: params.oscillators,
              });
             
            } else if (type === 'noteOff') {
               const note = this.activeNotes.get(noteId);
               if (note) {
                 note.endTime = when;
                 note.state = 'decay';
                 note.targetGain = 0;
                 note.releaseStartTime = when;
                 note.releaseStartGain = note.gain;
               }
            } else if (type === 'clear') {
                this.activeNotes.clear();
            }
        }
    }
  
  applyFilter(input, cutoff, resonance, state) {
    const g = Math.tan(Math.PI * cutoff / sampleRate);
    const r = 1 / resonance;
    const h = 1 / (1 + r * g + g * g);

    let band = (input - state.y2 - r * state.y1) * h;
    let low = g * band + state.y1;
    state.y1 = g * band + low;
    state.y2 = g * state.y1 + state.y2;
    
    return state.y2;
  }

  softClip(input, drive) {
    if (drive <= 0.01) return input;
    const k = 2 * drive / (1 - drive);
    return (1 + k) * input / (1 + k * Math.abs(input));
  }
  
  generateOsc(note) {
      let sample = 0;
      if (!note.oscillators || note.oscillators.length === 0) return 0;
      
      const numOscillators = note.oscillators.length;

      for (const osc of note.oscillators) {
          const phaseIncrement = (note.frequency * 2 * Math.PI) / sampleRate;
          note.phase += phaseIncrement;
          if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;

          let oscSample = 0;
          switch (osc.type) {
              case 'sine': oscSample = Math.sin(note.phase + osc.detune); break;
              case 'square': oscSample = Math.sign(Math.sin(note.phase + osc.detune)); break;
              case 'sawtooth': oscSample = 1.0 - (note.phase / Math.PI); break;
              case 'triangle': oscSample = 1 - 4 * Math.abs((note.phase / (2 * Math.PI)) - 0.5); break;
              case 'fatsine':
                oscSample = (Math.sin(note.phase + osc.detune) + Math.sin(note.phase * 1.01 + osc.detune) + Math.sin(note.phase * 0.99 + osc.detune)) / 3;
                break;
              default: oscSample = Math.sin(note.phase + osc.detune);
          }
          sample += oscSample;
      }
      
      return sample / numOscillators;
  }


  process(inputs, outputs, parameters) {
    const outputChannels = outputs[0];
    const leftChannel = outputChannels[0];
    const rightChannel = outputChannels.length > 1 ? outputChannels[1] : leftChannel;
    
    leftChannel.fill(0);
    if(rightChannel !== leftChannel) rightChannel.fill(0);

    const now = currentTime;

    for (const [noteId, note] of this.activeNotes.entries()) {
        const noteProgress = Math.max(0, Math.min(1, (now - note.startTime) / (note.endTime - note.startTime)));
        note.frequency = note.params.startFreq + (note.params.endFreq - note.params.startFreq) * noteProgress;
        
        for (let i = 0; i < leftChannel.length; i++) {
            const frameTime = now + i / sampleRate;
            let finalSample = 0;

            if (frameTime >= note.startTime) {
                 // --- Envelope ---
                const timeInNote = frameTime - note.startTime;
                let amplitude;
                if (frameTime >= note.endTime) {
                    const releaseProgress = Math.min(1.0, (frameTime - note.endTime) / note.params.release);
                    amplitude = note.gain * (1.0 - releaseProgress);
                    if (releaseProgress >= 1.0) {
                        this.activeNotes.delete(noteId);
                        continue;
                    }
                } else if (timeInNote < note.params.attack) {
                    amplitude = note.targetGain * (timeInNote / note.params.attack);
                } else if (timeInNote < note.params.attack + note.params.decay) {
                    const decayProgress = (timeInNote - note.params.attack) / note.params.decay;
                    amplitude = note.targetGain - decayProgress * (note.targetGain - note.params.sustainLevel);
                } else {
                    amplitude = note.params.sustainLevel;
                }
                note.gain = amplitude;

                if (note.gain > 0) {
                     // --- Oscillator ---
                     const oscSample = this.generateOsc(note);
                     
                     // --- Distortion ---
                     const distorted = this.softClip(oscSample, note.params.distortion);
                     
                     finalSample = distorted * note.gain * 0.4;
                }
            }
            
            // --- Panning ---
            const panValue = (note.params.pan + 1) / 2;
            const leftPan = Math.cos(panValue * Math.PI / 2);
            const rightPan = Math.sin(panValue * Math.PI / 2);
            
            leftChannel[i] += finalSample * leftPan;
            rightChannel[i] += finalSample * rightPan;
        }
    }
    return true;
  }
}

registerProcessor('sfx-processor', SfxProcessor);
