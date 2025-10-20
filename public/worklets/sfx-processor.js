class SfxProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.activeNotes = [];
        this.port.onmessage = this.handleMessage.bind(this);
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
                // Oscillator
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
        const output = outputs[0];
        const leftChannel = output[0];
        const rightChannel = output[1];

        if (this.activeNotes.length === 0) {
            return true; // No notes, output silence and keep processor alive.
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
                if (noteTime < note.attackTime) {
                    amplitude = noteTime / note.attackTime;
                } else if (noteTime < note.attackTime + note.decayTime) {
                    amplitude = 1.0 - ((noteTime - note.attackTime) / note.decayTime) * (1.0 - note.sustainLevel);
                } else if (time < note.endTime) {
                    amplitude = note.sustainLevel;
                } else {
                    if (!note.released) {
                        note.released = true;
                        note.releaseStartTime = note.endTime;
                        note.releaseStartAmp = note.sustainLevel;
                    }
                    const releaseTime = time - note.releaseStartTime;
                    if (releaseTime < note.releaseTime) {
                         amplitude = note.releaseStartAmp * (1.0 - releaseTime / note.releaseTime);
                    } else {
                        this.activeNotes.splice(j, 1);
                        continue;
                    }
                }
                
                amplitude = Math.max(0, amplitude);

                // 2. Calculate Oscillator Signal
                const progress = Math.min(1, noteTime / (note.endTime - note.startTime));
                const freq = note.startFreq + (note.endFreq - note.startFreq) * progress;
                const phase = (time - note.startTime) * freq;
                let signal = 0;
                switch (note.oscType) {
                    case 'sine':
                        signal = Math.sin(2 * Math.PI * phase);
                        break;
                    case 'square':
                        signal = Math.sign(Math.sin(2 * Math.PI * phase));
                        break;
                    case 'sawtooth':
                        signal = 2 * (phase / sampleRate - Math.floor(phase / sampleRate + 0.5));
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
