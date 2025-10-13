
class BassProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 400, minValue: 50, maxValue: 5000, automationRate: 'a-rate' },
      { name: 'resonance', defaultValue: 0.7, minValue: 0.1, maxValue: 5, automationRate: 'a-rate' },
      { name: 'distortion', defaultValue: 0.05, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
      { name: 'portamento', defaultValue: 0.0, minValue: 0, maxValue: 0.5, automationRate: 'k-rate' } // k-rate is fine here
    ];
  }

  constructor(options) {
    super(options);

    this.sampleRate = options.processorOptions?.sampleRate || sampleRate; // Get sampleRate from constructor

    this.activeNotes = new Map();
    this.note = null; // Current playing note details
    
    // Envelope
    this.envState = 'idle'; // idle, attack, decay, sustain, release
    this.envValue = 0;
    this.attackTime = 0.01;
    this.decayTime = 0.1;
    this.sustainLevel = 0.8;
    this.releaseTime = 0.3;

    // Oscillator
    this.osc1Phase = 0;
    this.osc2Phase = 0;
    
    // Filter
    this.b1 = 0; this.b2 = 0; this.b3 = 0; this.b4 = 0;
    this.t1 = 0; this.t2 = 0;

    // Portamento
    this.portamentoProgress = 1.0;
    this.portamentoStartFreq = 0;
    this.portamentoEndFreq = 0;
    this.portamentoDurationFrames = 0;
    this.portamentoFrameCount = 0;

    // Pulse/Arpeggio
    this.pulseCounter = -1;
    this.pulseBaseFreq = 0;
    this.pulseIntervalFrames = 0;
    this.pulseStep = 0;
    this.pulseNotes = [0, 7, 12, 7]; // Root, 5th, Octave, 5th

    this.port.onmessage = (event) => {
        const { type, ...data } = event.data;
        console.log(`[BassProcessor] Received message:`, event.data);

        switch(type) {
            case 'noteOn': {
                const { frequency, velocity, technique, when } = data;
                const portamento = this.parameters.get('portamento').value;
                const noteOnTime = when || currentTime;
                
                if (this.note && portamento > 0) { // If a note is already playing and portamento is on
                    this.portamentoStartFreq = this.note.frequency;
                    this.portamentoEndFreq = frequency;
                    this.portamentoDurationFrames = portamento * this.sampleRate;
                    this.portamentoFrameCount = 0;
                } else {
                    this.portamentoProgress = 1.0; // No glide
                }
                
                this.note = {
                    frequency,
                    velocity: velocity || 0.7,
                    technique: technique || 'pluck',
                };
                
                this.envState = 'attack';
                this.targetGain = this.note.velocity;
                this.attackTime = 0.02; // A default, could be part of the preset
                this.releaseTime = 0.5;

                if (this.note.technique === 'pulse') {
                    this.pulseBaseFreq = frequency;
                    this.pulseCounter = 0;
                    this.pulseStep = 0;
                    // 16th note at current tempo
                    this.pulseIntervalFrames = Math.floor((60 / 120) / 4 * this.sampleRate);
                    // Start the first pulse note immediately
                    this.triggerPulseNote();
                }
                break;
            }
            case 'noteOff': {
                if (this.note) {
                    this.envState = 'release';
                    this.pulseCounter = -1; // Stop pulsing
                }
                break;
            }
        }
    };
  }

  triggerPulseNote() {
    if (!this.note) return;
    const noteOffset = this.pulseNotes[this.pulseStep % this.pulseNotes.length];
    this.note.frequency = this.pulseBaseFreq * Math.pow(2, noteOffset / 12);
    this.osc1Phase = 0;
    this.osc2Phase = 0;
    this.envState = 'attack';
    this.targetGain = 0.8;
    this.attackTime = 0.005;
    this.releaseTime = (this.pulseIntervalFrames / this.sampleRate) * 0.8;
    this.pulseStep++;
  }

  // --- DSP Functions ---
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channel = output[0];
    
    // Get parameter values. a-rate params need to be read per-frame.
    const cutoffParam = parameters.cutoff;
    const resonanceParam = parameters.resonance;
    const distortionParam = parameters.distortion;
    const portamentoParam = parameters.portamento;

    for (let i = 0; i < channel.length; i++) {
        let currentFreq = this.note ? this.note.frequency : 0;
        
        // --- Portamento ---
        if (this.portamentoFrameCount < this.portamentoDurationFrames) {
            const t = this.portamentoFrameCount / this.portamentoDurationFrames;
            const easedT = t * t; // simple ease-in
            currentFreq = this.portamentoStartFreq * (1 - easedT) + this.portamentoEndFreq * easedT;
            this.note.frequency = currentFreq;
            this.portamentoFrameCount++;
        }

        // --- Pulse ---
        if (this.pulseCounter !== -1) {
            this.pulseCounter++;
            if (this.pulseCounter >= this.pulseIntervalFrames) {
                this.pulseCounter = 0;
                this.triggerPulseNote();
            }
        }

        // --- Envelope ---
        const attackFrames = this.attackTime * this.sampleRate;
        const decayFrames = this.decayTime * this.sampleRate;
        const releaseFrames = this.releaseTime * this.sampleRate;

        switch (this.envState) {
            case 'attack':
                this.envValue += 1.0 / attackFrames;
                if (this.envValue >= 1.0) {
                    this.envValue = 1.0;
                    this.envState = 'decay';
                }
                break;
            case 'decay':
                this.envValue -= (1.0 - this.sustainLevel) / decayFrames;
                if (this.envValue <= this.sustainLevel) {
                    this.envValue = this.sustainLevel;
                    this.envState = 'sustain';
                }
                break;
            case 'release':
                this.envValue -= this.sustainLevel / releaseFrames;
                if (this.envValue <= 0) {
                    this.envValue = 0;
                    this.envState = 'idle';
                    this.note = null; // Note is finished
                }
                break;
        }

        if (!this.note || this.envState === 'idle') {
            channel[i] = 0;
            continue;
        }

        // --- Oscillator ---
        const osc1 = Math.sin(this.osc1Phase);
        this.osc1Phase += 2 * Math.PI * currentFreq / this.sampleRate;
        if(this.osc1Phase > 2 * Math.PI) this.osc1Phase -= 2 * Math.PI;
        
        const osc2 = (this.osc2Phase / Math.PI) % 2 - 1; // Sawtooth
        this.osc2Phase += 2 * Math.PI * currentFreq / this.sampleRate;
        if(this.osc2Phase > 2 * Math.PI) this.osc2Phase -= 2 * Math.PI;
        
        let sample = (osc1 * 0.6 + osc2 * 0.4);

        // --- Filter ---
        const cutoff = cutoffParam.length > 1 ? cutoffParam[i] : cutoffParam[0];
        const resonance = resonanceParam.length > 1 ? resonanceParam[i] : resonanceParam[0];
        const f = 2 * Math.sin(Math.PI * Math.min(0.25, cutoff / (this.sampleRate * 2)));
        this.b4 += f * (sample - this.b4);
        this.b3 += f * (this.b4 - this.b3);
        this.b2 += f * (this.b3 - this.b2);
        this.b1 += f * (this.b2 - this.b1);
        const q = 1 - resonance;
        let filteredSample = this.b1;
        filteredSample -= (this.t2 + this.t1) * q;
        this.t1 = this.b3;
        this.t2 = this.b4;

        // --- Distortion ---
        const distortion = distortionParam.length > 1 ? distortionParam[i] : distortionParam[0];
        const k = 2 * distortion;
        const distorted = (filteredSample * (1 + k)) / (1 + k * Math.abs(filteredSample));

        channel[i] = distorted * this.envValue * this.note.velocity * 0.7; // Apply envelope and velocity
    }

    // --- Copy to other channels ---
    for (let j = 1; j < output.length; j++) {
      output[j].set(channel);
    }
    
    // Logging for debug
    if (this.logCounter === undefined) this.logCounter = 0;
    this.logCounter++;
    if (this.logCounter > 5 * this.sampleRate) { // ~ every 5 seconds
        console.log(`[BassProcessor.process] note: ${this.note ? this.note.frequency : 'none'}, envState: ${this.envState}, envValue: ${this.envValue.toFixed(2)}`);
        this.logCounter = 0;
    }

    return true;
  }
}

registerProcessor('bass-processor', BassProcessor);
