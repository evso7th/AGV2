// src/lib/synthesis/bass-processor.ts
/**
 * A robust subtractive synthesizer running inside an AudioWorklet.
 * It handles messages within the `process` loop to avoid race conditions and
 * ensures access to `currentTime` and `parameters` is always valid.
 *
 * This processor now correctly implements various bass techniques like pluck, portamento,
 * and a self-generating pulse, all dictated by the composer's events.
 */
class BassProcessor extends AudioWorkletProcessor {
  notes = /* @__PURE__ */ new Map();
  messageQueue = [];
  technique = "pluck";
  // Portamento (Glide) state
  portamentoTime = 0;
  // Duration of the slide in seconds
  portamentoProgress = 1;
  portamentoStartFreq = 0;
  portamentoTargetFreq = 0;
  // Pulse state
  isPulsing = false;
  pulseBaseFrequency = 0;
  pulseNextTriggerTime = 0;
  pulseNoteCounter = 0;
  PULSE_NOTES = [0, 7, 12, 7];
  // Root, 5th, Octave, 5th
  // Filter state
  filterStateL = 0;
  filterStateR = 0;
  static get parameterDescriptors() {
    return [
      { name: "cutoff", defaultValue: 800, minValue: 50, maxValue: 1e4 },
      { name: "resonance", defaultValue: 0.7, minValue: 0.1, maxValue: 5 },
      { name: "distortion", defaultValue: 0.1, minValue: 0, maxValue: 1 },
      { name: "portamento", defaultValue: 0.05, minValue: 0, maxValue: 0.5 }
    ];
  }
  constructor() {
    super();
    this.port.onmessage = (event) => {
      this.messageQueue.push(event.data);
    };
  }
  handleMessage(message) {
    const { type, ...data } = message;
    if (type === "noteOn") {
      const { frequency, velocity, technique, when } = data;
      this.technique = technique || "pluck";
      const isLegato = this.notes.size > 0 && (this.technique === "portamento" || this.technique === "glide" || this.technique === "glissando");
      if (isLegato) {
        this.portamentoStartFreq = this.portamentoTargetFreq;
        this.portamentoTargetFreq = frequency;
        this.portamentoProgress = 0;
      } else {
        this.portamentoStartFreq = frequency;
        this.portamentoTargetFreq = frequency;
        this.portamentoProgress = 1;
      }
      this.isPulsing = false;
      this.notes.clear();
      if (this.technique === "pulse") {
        this.isPulsing = true;
        this.pulseBaseFrequency = frequency;
        this.pulseNextTriggerTime = currentTime;
        this.pulseNoteCounter = 0;
      } else {
        this.notes.set(frequency, {
          frequency,
          phase: 0,
          gain: 0,
          targetGain: velocity,
          state: "attack",
          attackTime: 0.02,
          releaseTime: 0.4,
          velocity
        });
      }
    } else if (type === "noteOff") {
      this.isPulsing = false;
      for (const note of this.notes.values()) {
        note.state = "release";
        note.targetGain = 0;
      }
    }
  }
  generateOsc(phase) {
    const saw = 1 - phase / Math.PI;
    const sub = Math.sin(phase * 0.5);
    return saw * 0.7 + sub * 0.3;
  }
  softClip(input, drive) {
    if (drive === 0)
      return input;
    const k = 2 + drive * 10;
    return (1 + k) * input / (1 + k * Math.abs(input));
  }
  applyFilter(input, cutoff, isLeft) {
    const filterCoeff = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
    if (isLeft) {
      this.filterStateL += filterCoeff * (input - this.filterStateL);
      return this.filterStateL;
    } else {
      this.filterStateR += filterCoeff * (input - this.filterStateR);
      return this.filterStateR;
    }
  }
  process(inputs, outputs, parameters) {
    while (this.messageQueue.length > 0) {
      this.handleMessage(this.messageQueue.shift());
    }
    const output = outputs[0];
    const channelCount = output.length;
    const frameCount = output[0].length;
    const cutoff = parameters.cutoff[0];
    const distortion = parameters.distortion[0];
    const portamentoDuration = parameters.portamento[0];
    if (this.isPulsing && currentTime >= this.pulseNextTriggerTime) {
      const pulseInterval = 60 / 32 / 4;
      this.pulseNextTriggerTime = currentTime + pulseInterval;
      const noteOffset = this.PULSE_NOTES[this.pulseNoteCounter++ % this.PULSE_NOTES.length];
      const pulseNoteFreq = this.pulseBaseFrequency * Math.pow(2, noteOffset / 12);
      this.notes.clear();
      this.notes.set(pulseNoteFreq, {
        frequency: pulseNoteFreq,
        phase: 0,
        gain: 0,
        targetGain: 0.9,
        state: "attack",
        attackTime: 5e-3,
        releaseTime: 0.08,
        velocity: 0.9
      });
    }
    for (let i = 0; i < frameCount; i++) {
      let leftSample = 0;
      let rightSample = 0;
      if (this.portamentoProgress < 1 && portamentoDuration > 0) {
        this.portamentoProgress += 1 / (portamentoDuration * sampleRate);
        if (this.portamentoProgress > 1)
          this.portamentoProgress = 1;
      }
      const currentSlideFreq = this.portamentoStartFreq * (1 - this.portamentoProgress) + this.portamentoTargetFreq * this.portamentoProgress;
      for (const [key, note] of this.notes.entries()) {
        if (note.state === "attack") {
          note.gain += 1 / (note.attackTime * sampleRate);
          if (note.gain >= note.targetGain) {
            note.gain = note.targetGain;
            note.state = "sustain";
          }
        } else if (note.state === "release") {
          note.gain -= 1 / (note.releaseTime * sampleRate);
          if (note.gain <= 0) {
            this.notes.delete(key);
            continue;
          }
        }
        const freq = this.portamentoProgress < 1 ? currentSlideFreq : note.frequency;
        const rawSample = this.generateOsc(note.phase);
        note.phase += freq * 2 * Math.PI / sampleRate;
        if (note.phase >= 2 * Math.PI)
          note.phase -= 2 * Math.PI;
        leftSample += rawSample * note.gain;
      }
      const filteredSample = this.applyFilter(leftSample, cutoff, true);
      const distortedSample = this.softClip(filteredSample, distortion);
      rightSample = distortedSample;
      for (let channel = 0; channel < channelCount; channel++) {
        if (channel % 2 === 0)
          output[channel][i] = distortedSample * 0.6;
        else
          output[channel][i] = distortedSample * 0.6;
      }
    }
    return true;
  }
}
registerProcessor("bass-processor", BassProcessor);
