
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
        for (const message of messages) {
            const { type, noteId, when, params } = message;
            if (type === 'noteOn') {
                if (this.activeNotes.has(noteId)) continue;
                this.activeNotes.set(noteId, {
                    state: 'scheduled',
                    startTime: when,
                    endTime: Infinity,
                    phase: 0,
                    gain: 0,
                    targetGain: 1.0,
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
        }
    }

    // Simple LFO
    lfo(phase) {
        return Math.sin(phase);
    }
    
    // Generate wave based on type
    generateOsc(note) {
        switch (note.params.oscType) {
            case 'sine': return Math.sin(note.phase);
            case 'square': return Math.sign(Math.sin(note.phase));
            case 'sawtooth': return 1.0 - 2.0 * (note.phase / (2 * Math.PI));
            default: return Math.sin(note.phase);
        }
    }

    process(inputs, outputs, parameters) {
        const outputChannels = outputs[0];
        const leftChannel = outputChannels[0];
        const rightChannel = outputChannels.length > 1 ? outputChannels[1] : leftChannel;

        if (!leftChannel || this.activeNotes.size === 0) {
             if (rightChannel) rightChannel.fill(0);
             if (leftChannel) leftChannel.fill(0);
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
                if (note.state === 'scheduled' && time >= note.startTime) {
                    note.state = 'attack';
                }
                
                if (note.state !== 'decay' && time >= note.endTime) {
                    note.state = 'decay';
                    note.releaseStartTime = note.endTime;
                    note.releaseStartGain = note.gain;
                }

                if (note.state === 'finished') {
                    this.activeNotes.delete(noteId);
                    continue;
                }
                
                if (note.state === 'attack' || note.state === 'sustain' || note.state === 'decay') {
                    // Envelope
                    const attackTime = note.params.attack || 0.01;
                    const decayTime = note.params.decay || 0.1;
                    const sustainLevel = note.params.sustainLevel || 0.5;
                    const releaseTime = note.params.release || 0.3;
                    const noteTime = time - note.startTime;
                    
                    if (note.state === 'attack') {
                        note.gain = (noteTime / attackTime) * sustainLevel;
                        if (noteTime >= attackTime) {
                            note.gain = sustainLevel;
                            note.state = 'sustain';
                        }
                    } else if (note.state === 'sustain') {
                       // Sustain level is maintained until release
                       note.gain = sustainLevel;
                    } else if (note.state === 'decay') {
                        const releaseElapsed = time - note.releaseStartTime;
                        note.gain = note.releaseStartGain * (1.0 - releaseElapsed / releaseTime);
                        if (releaseElapsed >= releaseTime) {
                            note.state = 'finished';
                            continue;
                        }
                    }

                    // Oscillator & LFO
                    const lfoPhase = time * 2 * Math.PI * (note.params.lfoFreq || 0);
                    const lfoValue = this.lfo(lfoPhase);
                    
                    const freqProgress = Math.min(1, noteTime / (note.endTime - note.startTime));
                    const currentFreq = note.params.startFreq + (note.params.endFreq - note.params.startFreq) * freqProgress;
                    
                    note.phase += (currentFreq * (1 + lfoValue * 0.1)) * 2 * Math.PI / sampleRate;
                    if(note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;

                    let signal = this.generateOsc(note);
                    
                    // Basic Chorus effect
                    if (note.params.chorus) {
                        note.chorusPhase = (note.chorusPhase || 0) + (currentFreq * 1.05 * 2 * Math.PI) / sampleRate;
                        signal = (signal + this.generateOsc({...note, phase: note.chorusPhase})) / 2;
                    }
                    
                    let sample = signal * note.gain * 0.5;
                    
                    // Panning
                    const panValue = (note.params.pan + 1) / 2; // pan from -1..1 to 0..1
                    leftSample += sample * Math.cos(panValue * Math.PI / 2);
                    rightSample += sample * Math.sin(panValue * Math.PI / 2);
                }
            }
            leftChannel[i] = leftSample;
            rightChannel[i] = rightSample;
        }

        return true;
    }
}

registerProcessor('sfx-processor', SfxProcessor);

    