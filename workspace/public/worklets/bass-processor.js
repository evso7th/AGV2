// public/worklets/bass-processor.js

// Function to convert MIDI note number to frequency
function noteIdToFreq(noteId) {
    return 440 * Math.pow(2, (noteId - 69) / 12);
}

class BassProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    // Get sample rate from processor options, with a fallback
    this.sampleRate = options?.processorOptions?.sampleRate || 44100;
    this.activeNotes = new Map(); // Map<noteId, { phase, gain, state, filterState, params }>
    
    this.port.onmessage = (event) => {
        const messages = event.data;
        if (!Array.isArray(messages)) {
            // Handle single message objects for flexibility
            this.handleMessage(messages);
            return;
        }
        messages.forEach(message => this.handleMessage(message));
    };

    console.log('[BassProcessor] Worklet created with sample rate:', this.sampleRate);
  }

  handleMessage(message) {
    const { type, noteId, when, ...rest } = message;
    
    // console.log(`[BassProcessor] Received message:`, message);

    if (type === 'noteOn') {
        // Validate required fields
        if (noteId === undefined || !isFinite(when) || !isFinite(rest.frequency) || !isFinite(rest.velocity)) {
            console.error('[BassProcessor] Invalid noteOn message received:', message);
            return;
        }

        console.log(`[BassProcessor] Scheduling NOTE ON for noteId ${noteId} at ${when}`);
        this.activeNotes.set(noteId, {
            phase: 0,
            gain: 0, // Start gain at 0 for attack phase
            targetGain: rest.velocity,
            state: 'attack',
            startTime: when,
            filterState: { y1: 0, y2: 0, y3: 0, y4: 0, oldx: 0, oldy: 0 },
            params: rest.params, // *** CRITICAL FIX: Store the params for the note ***
        });
    } else if (type === 'noteOff') {
        if (noteId !== undefined && this.activeNotes.has(noteId)) {
           console.log(`[BassProcessor] Scheduling NOTE OFF for noteId ${noteId} at ${when}`);
           const note = this.activeNotes.get(noteId);
           note.state = 'decay'; // Start decay phase
           note.targetGain = 0;
        }
    } else if (type === 'clear') {
        console.log('[BassProcessor] Clearing all active notes.');
        this.activeNotes.clear();
    }
  }


  // 24dB/oct resonant low-pass filter (Moog-style)
  lowpassFilter(input, cutoff, resonance, state) {
    const f = cutoff * 1.16;
    const fb = resonance * (1.0 - 0.15 * f * f);
    const q = 1 - f;
    
    input -= state.y4 * fb;
    input = Math.max(-1.0, Math.min(1.0, input)); // Clip input
    
    state.y1 = input * 0.35013 * (q*q) + state.oldx * 0.35013 * (q*q) - state.y1 * q;
    state.y2 = state.y1 * q + state.oldy - state.y2 * q;
    state.y3 = state.y2 * q + state.y1 * q - state.y3 * q;
    state.y4 = state.y3 * q + state.y2 * q - state.y4 * q;
    
    state.y4 = state.y4 - state.y4 * state.y4 * state.y4 * 0.166667; // Clipping
    
    state.oldx = input;
    state.oldy = state.y1;
    
    return state.y4;
  }

  softClip(input, drive) {
    if (drive <= 0.01) return input;
    const k = 2 * drive / (1 - drive);
    return (1 + k) * input / (1 + k * Math.abs(input));
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    for (let channel = 0; channel < output.length; ++channel) {
      const channelData = output[channel];

      for (let i = 0; i < channelData.length; ++i) {
        let sample = 0;
        const now = currentTime + i / this.sampleRate;

        for (const [noteId, note] of this.activeNotes.entries()) {
            
            // Note is only active after its scheduled start time
            if (now < note.startTime) continue;

            // *** CRITICAL FIX: Use note-specific params, with defaults ***
            const params = note.params || { cutoff: 500, resonance: 0.1, distortion: 0 };
            const cutoff = params.cutoff || 500;
            const resonance = params.resonance || 0.1;
            const distortion = params.distortion || 0;
            
            // Envelope
            if (note.state === 'attack') {
                note.gain += 1 / (0.01 * this.sampleRate); // Fast attack
                if (note.gain >= note.targetGain) {
                    note.gain = note.targetGain;
                    note.state = 'sustain';
                }
            } else if (note.state === 'decay') {
                note.gain -= 1 / (0.3 * this.sampleRate); // Fixed release
                if (note.gain <= 0) {
                    this.activeNotes.delete(noteId);
                    continue; // Skip the rest of the processing for this note
                }
            }
          
            const freq = noteIdToFreq(noteId);
            const rawOsc = Math.sin(note.phase); // Simple sine oscillator
            note.phase += (freq * 2 * Math.PI) / this.sampleRate;
            if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;

            const filtered = this.lowpassFilter(rawOsc, cutoff, resonance, note.filterState);
            const distorted = this.softClip(filtered, distortion);

            sample += distorted * note.gain;
        }

        channelData[i] = sample * 0.4; // Master gain
      }
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
