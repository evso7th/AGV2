
class ChordProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'attack', defaultValue: 0.01, minValue: 0.001, maxValue: 1 },
            { name: 'release', defaultValue: 0.5, minValue: 0.01, maxValue: 5 },
            { name: 'filterCutoff', defaultValue: 4000, minValue: 100, maxValue: 10000 },
            { name: 'filterQ', defaultValue: 1, minValue: 0.1, maxValue: 10 },
            { name: 'distortion', defaultValue: 0.0, minValue: 0, maxValue: 1 },
        ];
    }

    constructor() {
        super();
        this.notes = []; // { phase, gain, targetGain, state, frequency, release, velocity }
        this.preset = {
            attack: 0.02,
            release: 0.5,
            filterCutoff: 4000,
            q: 1,
            oscType: 'triangle',
            distortion: 0
        };
        this.filterState = { z1: 0, z2: 0 };
        this.port.onmessage = this.handleMessage.bind(this);
        console.log('[ChordProcessor] Initialized.');
    }

    handleMessage(event) {
        const { type, data } = event;
        // console.log(`[ChordProcessor] Received message:`, event.data);

        if (data.type === 'playChord') {
            this.notes = data.notes.map((note, i) => {
                const staggerDelay = (data.stagger || 0) * i;
                return {
                    phase: 0,
                    gain: 0,
                    targetGain: note.velocity,
                    state: 'attack',
                    frequency: 440 * Math.pow(2, (note.midi - 69) / 12),
                    attackStartTime: currentTime + staggerDelay
                };
            });
        } else if (data.type === 'noteOff') {
            this.notes.forEach(note => note.state = 'release');
        } else if (data.type === 'setPreset') {
            this.preset = { ...this.preset, ...data.preset };
            // console.log('[ChordProcessor] New Preset:', this.preset);
        }
    }

    applyFilter(input, cutoff, q) {
        const f = cutoff * 1.16 / sampleRate;
        const fb = q * (1.0 - 0.15 * f * f);
        const lp = this.filterState.z1 + f * (input - this.filterState.z1 + fb * (this.filterState.z1 - this.filterState.z2));
        this.filterState.z1 = lp;
        this.filterState.z2 = this.filterState.z1;
        return lp;
    }

    generateOsc(phase) {
        switch (this.preset.oscType) {
            case 'fatsine':
            case 'sine':
                return Math.sin(phase);
            case 'fatsawtooth':
            case 'sawtooth':
                return 1 - 2 * (phase / (2 * Math.PI));
            case 'square':
                return phase < Math.PI ? 1 : -1;
            case 'triangle':
            default:
                let val = 2 * (phase / (2 * Math.PI));
                return val < 1 ? val * 2 - 1 : 1 - (val - 1) * 2;
        }
    }
    
    softClip(x, drive) {
      if (drive === 0) return x;
      const k = 2 * drive / (1 - drive);
      return (1 + k) * x / (1 + k * Math.abs(x));
    }


    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channel = output[0];

        const attack = parameters.get('attack')[0] || this.preset.attack;
        const release = parameters.get('release')[0] || this.preset.release;
        const filterCutoff = parameters.get('filterCutoff')[0] || this.preset.filterCutoff;
        const filterQ = parameters.get('filterQ')[0] || this.preset.q;
        const distortion = parameters.get('distortion')[0] || this.preset.distortion;


        for (let i = 0; i < channel.length; ++i) {
            let sample = 0;
            const t = currentTime + i / sampleRate;

            this.notes.forEach(note => {
                if (note.state === 'attack' && t >= note.attackStartTime) {
                    note.gain += 1 / (attack * sampleRate);
                    if (note.gain >= note.targetGain) {
                        note.gain = note.targetGain;
                        note.state = 'sustain';
                    }
                } else if (note.state === 'release') {
                    note.gain -= note.targetGain / (release * sampleRate);
                    if (note.gain <= 0) {
                        note.gain = 0;
                        note.state = 'off';
                    }
                }

                if (note.gain > 0 && note.frequency > 0) {
                    note.phase += (note.frequency * 2 * Math.PI) / sampleRate;
                    if (note.phase >= 2 * Math.PI) note.phase -= 2 * Math.PI;

                    sample += this.generateOsc(note.phase) * note.gain;
                }
            });
            
            sample = this.applyFilter(sample, filterCutoff, filterQ);
            sample = this.softClip(sample, distortion);
            
            channel[i] = sample * 0.2; // Master gain for chord synth
        }

        this.notes = this.notes.filter(note => note.state !== 'off');

        for (let j = 1; j < output.length; j++) {
            output[j].set(channel);
        }

        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
