
// public/worklets/sfx-processor.js

class SfxProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.activeNotes = new Map();
        this.port.onmessage = this.handleMessage.bind(this);
        console.log('[SFXProcessor] Worklet created and ready.');
    }

    handleMessage(event) {
        const messages = Array.isArray(event.data) ? event.data : [event.data];
        messages.forEach(message => {
            const { type, when, noteId, params } = message;

            if (type === 'noteOn') {
                this.activeNotes.set(noteId, {
                    state: 'scheduled',
                    startTime: when,
                    endTime: Infinity,
                    phase: 0,
                    gain: 0,
                    targetGain: params.sustainLevel,
                    releaseStartAmp: 0,
                    params: params || {},
                });
            } else if (type === 'noteOff') {
                const note = this.activeNotes.get(noteId);
                if (note) {
                    note.endTime = when;
                }
            } else if (type === 'clear') {
                this.activeNotes.clear();
            }
        });
    }

    // Simple LFO
    lfo(phase) {
        return Math.sin(phase);
    }
    
    // Simple Filter (one-pole low-pass)
    applyFilter(input, cutoff, state) {
        const g = Math.tan(Math.PI * cutoff / sampleRate);
        const k = g / (1.0 + g);
        state.y1 = (1.0 - k) * state.y1 + k * input;
        return state.y1;
    }

    process(inputs, outputs, parameters) {
        const outputChannels = outputs[0];
        const leftChannel = outputChannels[0];
        const rightChannel = outputChannels.length > 1 ? outputChannels[1] : leftChannel;

        if (!leftChannel) {
            return true;
        }

        leftChannel.fill(0);
        if (rightChannel !== leftChannel) {
            rightChannel.fill(0);
        }

        for (let i = 0; i < leftChannel.length; i++) {
            const time = currentTime + i / sampleRate;
            let leftSample = 0;
            let rightSample = 0;

            for (const [noteId, note] of this.activeNotes.entries()) {
                if (time < note.startTime) {
                    continue;
                }

                if (note.state === 'scheduled') {
                    note.state = 'attack';
                    note.filterState = { y1: 0 };
                    note.lfoPhase = 0;
                }

                if (note.state !== 'decay' && time >= note.endTime) {
                    note.state = 'decay';
                    note.releaseStartTime = note.endTime;
                    note.releaseStartAmp = note.gain;
                }

                // Envelope
                let amp = 0;
                if (note.state === 'attack') {
                    amp = (note.gain += (1 / (note.params.attack * sampleRate)));
                    if (note.gain >= 1.0) {
                        note.gain = 1.0;
                        note.state = 'decay-sustain';
                    }
                } else if (note.state === 'decay-sustain') {
                     amp = note.gain -= (1.0 - note.params.sustainLevel) / (note.params.decay * sampleRate);
                     if (note.gain <= note.params.sustainLevel) {
                         note.gain = note.params.sustainLevel;
                         note.state = 'sustain';
                     }
                } else if (note.state === 'sustain') {
                    amp = note.gain;
                } else if (note.state === 'decay') {
                    const releaseTimeElapsed = time - note.releaseStartTime;
                    amp = note.releaseStartAmp * (1.0 - releaseTimeElapsed / note.params.release);
                    if (amp <= 0) {
                        this.activeNotes.delete(noteId);
                        continue;
                    }
                }
                amp = Math.max(0, amp);
                
                // Oscillator
                const noteTime = time - note.startTime;
                const progress = Math.min(1, noteTime / note.params.duration);
                const freq = note.params.startFreq + (note.params.endFreq - note.params.startFreq) * progress;

                note.phase += (freq * 2 * Math.PI) / sampleRate;
                if (note.phase >= 2 * Math.PI) note.phase -= (2 * Math.PI);
                
                let signal = 0;
                switch (note.params.oscType) {
                    case 'sine': signal = Math.sin(note.phase); break;
                    case 'square': signal = Math.sign(Math.sin(note.phase)); break;
                    case 'sawtooth': signal = 1.0 - (note.phase / Math.PI); break;
                    default: signal = Math.sin(note.phase); break;
                }

                let finalSample = signal * amp * 0.3;

                // Panning
                const panValue = (note.params.pan + 1) / 2;
                leftSample += finalSample * Math.cos(panValue * Math.PI / 2);
                rightSample += finalSample * Math.sin(panValue * Math.PI / 2);
            }
            
            leftChannel[i] = leftSample;
            rightChannel[i] = rightSample;
        }

        return true;
    }
}

registerProcessor('sfx-processor', SfxProcessor);

    