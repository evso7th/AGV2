// public/worklets/sfx-processor.js

class SfxProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.activeNotes = [];
        this.port.onmessage = this.handleMessage.bind(this);
        console.log('[SFXProcessor] Worklet created and ready.');
    }

    // A simple pseudo-random number generator
    random() {
        return Math.random();
    }

    handleMessage(event) {
        const { type, time, noteParams = {} } = event.data;
        if (type === 'trigger') {
            const duration = noteParams.duration || (0.1 + this.random() * 0.4); // 100ms to 500ms
            const attack = noteParams.attack || 0.01;
            const decay = noteParams.decay || duration * 0.3;
            const release = noteParams.release || 0.1;
            const sustainLevel = noteParams.sustainLevel || 0.4;
            
            const note = {
                startTime: time,
                // Envelope
                attackTime: attack,
                decayTime: decay,
                sustainLevel: sustainLevel,
                releaseTime: release,
                endTime: time + duration,
                released: false,
                releaseStartTime: 0,
                releaseStartAmp: 0,
                // Oscillator
                phase: 0, // Persistent phase for smooth frequency changes
                oscType: noteParams.oscType || ['sawtooth', 'square', 'sine'][Math.floor(this.random() * 3)],
                startFreq: noteParams.startFreq || (100 + this.random() * 1000),
                endFreq: noteParams.endFreq || (100 + this.random() * 1000),
                // Panning
                pan: noteParams.pan !== undefined ? noteParams.pan : (this.random() * 2 - 1),
                // Chorus/Delay
                chorus: noteParams.chorus !== undefined ? noteParams.chorus : this.random() > 0.5,
                delayLine: new Float32Array(Math.floor(sampleRate * 0.2)), // 200ms max delay
                delayWritePos: 0,
            };
            this.activeNotes.push(note);
        }
    }

    process(inputs, outputs, parameters) {
        const outputChannels = outputs[0];
        const leftChannel = outputChannels[0];
        const rightChannel = outputChannels.length > 1 ? outputChannels[1] : leftChannel;


        if (!leftChannel || this.activeNotes.length === 0) {
             if (rightChannel) rightChannel.fill(0);
             if (leftChannel) leftChannel.fill(0);
            return true; // No notes or no output, output silence and keep processor alive.
        }
        
        // Zero out the buffers before processing
        leftChannel.fill(0);
        if (rightChannel !== leftChannel) {
            rightChannel.fill(0);
        }


        for (let i = 0; i < leftChannel.length; i++) {
            let leftSample = 0;
            let rightSample = 0;
            const time = currentTime + i / sampleRate;

            for (let j = this.activeNotes.length - 1; j >= 0; j--) {
                const note = this.activeNotes[j];
                let amplitude = 0;
                const noteTime = time - note.startTime;

                // 1. Calculate Envelope
                if (noteTime < 0) {
                    continue; // Note hasn't started yet
                }
                
                if (!note.released && time >= note.endTime) {
                    note.released = true;
                    note.releaseStartTime = note.endTime;
                    note.releaseStartAmp = note.sustainLevel;
                }

                if (noteTime < note.attackTime) {
                    amplitude = noteTime / note.attackTime;
                } else if (noteTime < note.attackTime + note.decayTime) {
                    amplitude = 1.0 - ((noteTime - note.attackTime) / note.decayTime) * (1.0 - note.sustainLevel);
                } else if (!note.released) {
                    amplitude = note.sustainLevel;
                } else {
                    const releaseTimeElapsed = time - note.releaseStartTime;
                    if (releaseTimeElapsed < note.releaseTime) {
                         amplitude = note.releaseStartAmp * (1.0 - releaseTimeElapsed / note.releaseTime);
                    } else {
                        this.activeNotes.splice(j, 1);
                        continue;
                    }
                }
                
                amplitude = Math.max(0, amplitude);

                // 2. Calculate Oscillator Signal
                const progress = Math.max(0, Math.min(1, noteTime / (note.endTime - note.startTime)));
                const freq = note.startFreq + (note.endFreq - note.startFreq) * progress;
                
                note.phase += (freq * 2 * Math.PI) / sampleRate;
                if (note.phase >= 2 * Math.PI) note.phase -= (2 * Math.PI);
                
                let signal = 0;
                switch (note.oscType) {
                    case 'sine':
                        signal = Math.sin(note.phase);
                        break;
                    case 'square':
                        signal = Math.sign(Math.sin(note.phase));
                        break;
                    case 'sawtooth':
                         signal = 1.0 - (note.phase / Math.PI);
                        break;
                }
                
                let sample = signal * amplitude * 0.3; // 0.3 gain to prevent clipping

                // 3. Apply Chorus (simple delay)
                if (note.chorus) {
                    const delayReadPos = (note.delayWritePos - Math.floor(sampleRate * 0.025) + note.delayLine.length) % note.delayLine.length;
                    const delayedSample = note.delayLine[delayReadPos];
                    note.delayLine[note.delayWritePos] = sample;
                    note.delayWritePos = (note.delayWritePos + 1) % note.delayLine.length;
                    sample += delayedSample * 0.5;
                }

                // 4. Apply Panning
                const panValue = (note.pan + 1) / 2;
                const leftPan = Math.cos(panValue * Math.PI / 2);
                const rightPan = Math.sin(panValue * Math.PI / 2);

                leftSample += sample * leftPan;
                rightSample += sample * rightPan;
            }

            leftChannel[i] = leftSample;
            rightChannel[i] = rightSample;
        }

        return true;
    }
}

registerProcessor('sfx-processor', SfxProcessor);
