// public/worklets/bass-processor.js
class BassProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 400, minValue: 50, maxValue: 2000 },
      { name: 'resonance', defaultValue: 0.7, minValue: 0.1, maxValue: 5 },
      { name: 'distortion', defaultValue: 0.05, minValue: 0, maxValue: 1 },
      { name: 'portamento', defaultValue: 0.0, minValue: 0, maxValue: 0.5 }
    ];
  }

  constructor() {
    super();
    this.activeNotes = new Map();
    this.portamentoTime = 0;
    this.portamentoTarget = 0;
    this.portamentoStartTime = 0;
    this.technique = 'pluck';
    
    this.port.onmessage = (event) => {
        console.log('[bass-processor] Received message:', JSON.stringify(event.data));
        this.handleMessage(event.data);
    };
  }
  
  handleMessage(message) {
      const { type, ...data } = message;
      if (type === 'noteOn') {
        const { frequency, velocity, when } = data;
        
        // This is a simplified logic. If multiple notes are active, it will restart.
        // This is OK for a simple monophonic bass.
        this.activeNotes.clear();
        
        const note = {
            phase: 0,
            gain: 0,
            targetGain: velocity,
            state: 'attack',
            attackTime: 0.01,
            releaseTime: 0.4, // A default release time
            frequency: frequency
        };
        this.activeNotes.set(frequency, note);

      } else if (type === 'noteOff') {
        for (const note of this.activeNotes.values()) {
          note.state = 'release';
          note.targetGain = 0;
        }
      } else if (type === 'setTechnique') {
          this.technique = data.technique;
      }
  }


  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const cutoff = parameters.cutoff[0];
    const resonance = parameters.resonance[0];
    const distortion = parameters.distortion[0];
    
    for (let channel = 0; channel < output.length; channel++) {
      const channelData = output[channel];
      for (let i = 0; i < channelData.length; i++) {
        let sample = 0;

        for (const [key, note] of this.activeNotes.entries()) {
            if (i === 0) { // Log only once per process block to avoid spam
                console.log(`[bass-processor] Processing note with frequency: ${note.frequency}`);
            }

            // --- Envelope ---
            if (note.state === 'attack') {
                note.gain += (1 / (note.attackTime * sampleRate));
                if (note.gain >= note.targetGain) {
                    note.gain = note.targetGain;
                    note.state = 'sustain';
                }
            } else if (note.state === 'release') {
                note.gain -= (1 / (note.releaseTime * sampleRate));
                if (note.gain <= 0) {
                    this.activeNotes.delete(key);
                    continue; // Skip to next note
                }
            }

            // --- Oscillator ---
            const saw = 1 - (note.phase / Math.PI);
            const sub = Math.sin(note.phase * 0.5);
            let oscSample = saw * 0.7 + sub * 0.3;

            note.phase += (note.frequency * 2 * Math.PI) / sampleRate;
            if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;

            sample += oscSample * note.gain;
        }

        channelData[i] = sample * 0.6; // Final gain
      }
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
