// public/worklets/chord-processor.js

/**
 * A simple subtractive synthesizer running in an AudioWorklet.
 * It's designed to be lightweight and is controlled by messages from its corresponding AudioWorkletNode.
 */
class ChordProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 1200, minValue: 20, maxValue: 20000 },
      { name: 'resonance', defaultValue: 0.8, minValue: 0, maxValue: 20 },
      { name: 'distortion', defaultValue: 0.1, minValue: 0, maxValue: 1 },
    ];
  }

  constructor(options) {
    super(options);
    
    this.activeNotes = new Map(); // Maps noteId to { phase, frequency, gain, targetGain, noteOffTime }
    
    // Message port for receiving commands from the main thread
    this.port.onmessage = (event) => {
      const messages = Array.isArray(event.data) ? event.data : [event.data];
      
      for (const message of messages) {
          if (message.type === 'noteOn' && isFinite(message.when)) {
            this.activeNotes.set(message.noteId, {
                phase: 0,
                frequency: message.frequency,
                gain: 0,
                targetGain: message.velocity || 0.7,
                attack: message.params?.attack || 0.02,
                release: message.params?.release || 0.3,
                noteOffTime: Infinity, 
            });
          } else if (message.type === 'noteOff' && isFinite(message.when)) {
            const note = this.activeNotes.get(message.noteId);
            if (note) {
              note.targetGain = 0;
              note.noteOffTime = message.when;
            }
          } else if (message.type === 'clear') {
              this.activeNotes.forEach(note => {
                  note.targetGain = 0;
                  note.noteOffTime = currentTime;
              });
          }
      }
    };
  }

  generateOsc(type, phase) {
    switch (type) {
      case 'sine': return Math.sin(phase);
      case 'triangle': return 1 - 4 * Math.abs(0.5 - (phase / (2 * Math.PI)));
      case 'square': return phase < Math.PI ? 1.0 : -1.0;
      case 'sawtooth': return 1.0 - (phase / Math.PI);
      default: return Math.sin(phase);
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channelCount = output.length;

    // Correct way to access parameters
    const distortionAmount = parameters.distortion[0];
    
    for (let i = 0; i < output[0].length; ++i) {
      let sample = 0;

      for (const [noteId, note] of this.activeNotes.entries()) {
        // Envelope
        if (note.targetGain > note.gain) {
            note.gain = Math.min(note.targetGain, note.gain + (1 / (note.attack * sampleRate)));
        } else if (note.targetGain < note.gain) {
            note.gain = Math.max(note.targetGain, note.gain - (1 / (note.release * sampleRate)));
        }

        if (note.gain > 0) {
            let noteSample = this.generateOsc('triangle', note.phase);
            note.phase += (note.frequency / sampleRate) * 2 * Math.PI;
            if (note.phase > 2 * Math.PI) note.phase -= 2 * Math.PI;
            sample += noteSample * note.gain;
        } else if (currentTime >= note.noteOffTime) {
            this.activeNotes.delete(noteId);
        }
      }
      
      // Distortion (tanh)
      if (distortionAmount > 0) {
          sample = Math.tanh(sample * (1 + distortionAmount * 4));
      }

      // Output to all channels
      for (let j = 0; j < channelCount; j++) {
        output[j][i] = sample * 0.4; // Reduce volume to prevent clipping
      }
    }
    return true;
  }
}

registerProcessor('chord-processor', ChordProcessor);
