// public/worklets/chord-processor.js

// This processor is designed to be a lightweight "voice" engine.
// All expensive, per-sample calculations like ADSR envelopes and LFOs
// are handled by native AudioNodes in the main thread before the signal
// reaches this worklet.
// This worklet's primary job is to generate the core oscillator tone based on layers.

const MAX_LAYERS_PER_VOICE = 8;

// Basic oscillator functions
function processOscillator(phase, type) {
    let sample = 0;
    switch (type) {
        case 'sine': sample = Math.sin(phase); break;
        case 'triangle': sample = 1 - 4 * Math.abs((phase / (2 * Math.PI)) - 0.5); break;
        case 'square': sample = phase < Math.PI ? 1 : -1; break;
        case 'noise': sample = Math.random() * 2 - 1; break;
        case 'sawtooth': default: sample = 1 - (phase / Math.PI); break;
    }
    return sample;
}

class ChordProcessor extends AudioWorkletProcessor {
    // Define the AudioParams that can be controlled from the main thread
    static get parameterDescriptors() {
        return [
            { name: 'cutoff', defaultValue: 8000, minValue: 20, maxValue: 20000 },
            { name: 'q', defaultValue: 1, minValue: 0.1, maxValue: 20 },
            { name: 'distortion', defaultValue: 0, minValue: 0, maxValue: 1 },
            { name: 'lfoAmount', defaultValue: 0, minValue: 0, maxValue: 10000 } // Can be filter freq or pitch cents
        ];
    }

    constructor(options) {
        super();
        this.sampleRate = options.processorOptions?.sampleRate || sampleRate; // Use global sampleRate from constructor
        
        // --- Per-voice state ---
        this.noteId = null;
        this.baseFrequency = 0;
        this.phase = 0;
        this.portamentoTarget = 0;
        this.portamentoStep = 0;

        // --- Synth Parameters (set by noteOn) ---
        this.layers = [];
        this.filterType = 'lpf';
        this.lfo = { target: 'none' };
        this.portamento = 0;
        
        // --- Filter State (one per voice) ---
        this.lp = 0; this.bp = 0; this.hp = 0;

        this.port.onmessage = this.handleMessage.bind(this);
    }

    handleMessage(event) {
        const msg = event.data;
        if (msg.type === 'noteOn') {
            this.noteOn(msg);
        } else if (msg.type === 'noteOff') {
            // Note off is now handled by the GainNode in the main thread
        } else if (msg.type === 'clear') {
            this.baseFrequency = 0;
            this.portamentoTarget = 0;
        }
    }

    noteOn({ noteId, frequency, layers, filterType, lfo, portamento }) {
        this.noteId = noteId;
        this.layers = layers || [{ type: 'sawtooth', detune: 0, octave: 0, gain: 1 }];
        this.filterType = filterType || 'lpf';
        this.lfo = lfo || { target: 'none' };
        this.portamento = portamento || 0;
        
        if (this.portamento > 0 && this.baseFrequency > 0) {
            this.portamentoTarget = frequency;
            const steps = this.sampleRate * this.portamento;
            this.portamentoStep = (this.portamentoTarget - this.baseFrequency) / steps;
        } else {
            this.baseFrequency = frequency;
            this.portamentoTarget = frequency;
            this.portamentoStep = 0;
        }
    }
    
    // Simple state-variable filter implementation
    processFilter(input, cutoff, q) {
        const f = 2 * Math.sin(Math.PI * Math.min(0.25, cutoff / (this.sampleRate * 2)));
        const qVal = 1 / Math.max(0.01, q); // Prevent division by zero

        this.lp += this.bp * f;
        this.hp = input - this.lp - this.bp * qVal;
        this.bp += this.hp * f;

        switch (this.filterType) {
            case 'hpf': return this.hp;
            case 'bpf': return this.bp;
            case 'notch': return this.hp + this.lp;
            case 'lpf': default: return this.lp;
        }
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        
        // Get parameter values for the current block
        const cutoffValues = parameters.cutoff;
        const qValues = parameters.q;
        const distortionValues = parameters.distortion;
        const lfoAmountValues = parameters.lfoAmount;
        
        const isCutoffConstant = cutoffValues.length === 1;
        const isQConstant = qValues.length === 1;
        const isDistortionConstant = distortionValues.length === 1;
        const isLfoAmountConstant = lfoAmountValues.length === 1;
        
        for (let i = 0; i < output[0].length; i++) {
            if (this.baseFrequency === 0) {
                output[0][i] = 0;
                output[1][i] = 0;
                continue;
            }
            
            // --- 1. Portamento (Glide) ---
            if (this.portamentoStep !== 0) {
                 if (Math.abs(this.baseFrequency - this.portamentoTarget) > Math.abs(this.portamentoStep)) {
                     this.baseFrequency += this.portamentoStep;
                 } else {
                     this.baseFrequency = this.portamentoTarget;
                     this.portamentoStep = 0;
                 }
            }

            // --- 2. Pitch LFO ---
            let lfoPitchMod = 1.0;
            if (this.lfo.target === 'pitch' && this.lfo.amount > 0) {
                const lfoPhase = (currentTime + i / this.sampleRate) * this.lfo.rate * 2 * Math.PI;
                const lfoValue = this.lfo.shape === 'sine' ? Math.sin(lfoPhase) : (lfoPhase % (2 * Math.PI) < Math.PI ? 1 : -1);
                lfoPitchMod = Math.pow(2, (lfoValue * this.lfo.amount) / 1200);
            }
            const currentFrequency = this.baseFrequency * lfoPitchMod;
            
            // --- 3. Oscillator Layers ---
            const phaseIncrement = (currentFrequency / this.sampleRate) * 2 * Math.PI;
            this.phase = (this.phase + phaseIncrement) % (2 * Math.PI);
            
            let mixedSample = 0;
            for (const layer of this.layers) {
                const detuneFactor = Math.pow(2, (layer.detune || 0) / 1200);
                const octaveFactor = Math.pow(2, layer.octave || 0);
                const layerPhase = (this.phase * detuneFactor * octaveFactor) % (2 * Math.PI);
                mixedSample += processOscillator(layerPhase, layer.type) * (layer.gain || 1);
            }
            if (this.layers.length > 1) {
                mixedSample /= this.layers.length; // Normalize to prevent clipping
            }

            // --- 4. Filter ---
            const cutoff = isCutoffConstant ? cutoffValues[0] : cutoffValues[i];
            const q = isQConstant ? qValues[0] : qValues[i];
            // The LFO for the filter is now applied externally via AudioParams
            let filteredSample = this.processFilter(mixedSample, cutoff, q);
            
            // --- 5. Distortion ---
            const distortion = isDistortionConstant ? distortionValues[0] : distortionValues[i];
            if (distortion > 0) {
                 filteredSample = Math.tanh(filteredSample * (1 + distortion * 5));
            }
            
            // The final output is just the processed sample. ADSR is handled by a GainNode outside.
            output[0][i] = filteredSample;
            output[1][i] = filteredSample; // Mono to Stereo
        }

        // Return true to keep the processor alive
        return true;
    }
}

registerProcessor('chord-processor', ChordProcessor);
