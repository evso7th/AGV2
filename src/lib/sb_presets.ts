/**
@fileOverview Cyber Blues Presets Library V1.4 — "Maximum Aggression".
#ЗАЧЕМ: Финальная "закалка" органов для Cyber Blues.
#ЧТО: Повышен уровень дисторшна, расширен спектр фильтров, усилены "зубастые" гармоники.
*/
export const SB_PRESETS = {
// ───── PADS & SYNTHS (Dynamic Group: dynamicPad) ─────
synth: {
type: 'synth',
name: 'Cyber Lead Synth',
volume: 0.72,
osc: [
{ type: 'sawtooth', detune: -10, octave: -1, gain: 0.6 },
{ type: 'sawtooth', detune: +10, octave: -1, gain: 0.5 },
{ type: 'square', detune: 0, octave: -2, gain: 0.4 }
],
noise: { on: true, gain: 0.04 },
adsr: { a: 0.005, d: 0.4, s: 0.8, r: 0.8 },
lpf: { cutoff: 4200, q: 4.5 },
lfo: { rate: 2.5, amount: 1200, target: 'filter' },
drive: { type: 'fuzz', amount: 0.75 },
reverbMix: 0.08
},
synth_ambient_pad_lush: {
type: 'synth',
name: 'Cyber Wall Pad',
volume: 0.68,
osc: [
{ type: 'sawtooth', detune: -8, octave: -1, gain: 0.65 },
{ type: 'sawtooth', detune: +8, octave: -1, gain: 0.55 },
{ type: 'square', detune: 0, octave: -2, gain: 0.45 }
],
adsr: { a: 0.8, d: 1.5, s: 0.85, r: 2.0 },
lpf: { cutoff: 1200, q: 2.5 },
lfo: { rate: 0.3, amount: 600, target: 'filter' },
drive: { type: 'soft', amount: 0.55 },
reverbMix: 0.15
},
synth_cave_pad: {
type: 'synth',
name: 'Cyber Abyssal Wall',
volume: 0.65,
osc: [
{ type: 'sawtooth', detune: -15, octave: -2, gain: 0.7 },
{ type: 'square', detune: 15, octave: -2, gain: 0.6 },
{ type: 'sine', detune: 0, octave: -3, gain: 0.9 }
],
adsr: { a: 1.5, d: 2.5, s: 0.9, r: 3.5 },
lpf: { cutoff: 600, q: 3.0 },
drive: { type: 'fuzz', amount: 0.65 },
reverbMix: 0.25
},
// ───── ORGANS (Dynamic Group: dynamicOrgan) ─────
// #ЗАЧЕМ: ПЛАН №2155. Максимальная агрессия (fuzz 0.92, lpf 4500).
organ: {
type: 'synth',
name: 'Cyber Rock B3 (Lord)',
volume: 0.58,
osc: [
{ type: 'sine', octave: 0, detune: 0, gain: 0.6 },
{ type: 'sawtooth', octave: 0, detune: 4, gain: 0.28 },
{ type: 'square', octave: 1, detune: -4, gain: 0.22 },
{ type: 'sine', octave: -1, detune: 0, gain: 0.4 }
],
adsr: { a: 0.005, d: 0.08, s: 0.95, r: 0.4 },
lpf: { cutoff: 4500, q: 3.2 },
drive: { type: 'fuzz', amount: 0.92 },
reverbMix: 0.12
},
organ_soft_jazz: {
type: 'synth',
name: 'Cyber Gritty Jazz B3',
volume: 0.52,
osc: [
{ type: 'sine', octave: 0, detune: 0, gain: 0.7 },
{ type: 'sawtooth', octave: 1, detune: 0, gain: 0.18 },
{ type: 'square', octave: 0, detune: 5, gain: 0.18 }
],
adsr: { a: 0.01, d: 0.12, s: 0.88, r: 0.35 },
lpf: { cutoff: 2800, q: 2.2 },
drive: { type: 'fuzz', amount: 0.78 },
reverbMix: 0.08
},
organ_prog: {
type: 'synth',
name: 'Cyber Prog B3',
volume: 0.56,
osc: [
{ type: 'sine', octave: 0, detune: 0, gain: 0.55 },
{ type: 'sawtooth', octave: 0, detune: 8, gain: 0.35 },
{ type: 'square', octave: 1, detune: -8, gain: 0.3 },
{ type: 'sine', octave: 1, detune: 0, gain: 0.3 }
],
adsr: { a: 0.008, d: 0.1, s: 0.92, r: 0.5 },
lpf: { cutoff: 5200, q: 2.8 },
drive: { type: 'muff', amount: 0.88 },
reverbMix: 0.15
},
organ_jimmy_smith: {
type: 'synth',
name: 'Cyber Percussive B3',
volume: 0.48,
osc: [
{ type: 'sine', octave: 0, detune: 0, gain: 0.75 },
{ type: 'sawtooth', octave: 1, detune: 0, gain: 0.25 },
{ type: 'square', octave: 0, detune: 0, gain: 0.22 }
],
adsr: { a: 0.003, d: 0.06, s: 0.75, r: 0.25 },
lpf: { cutoff: 3800, q: 1.8 },
drive: { type: 'fuzz', amount: 0.76 },
reverbMix: 0.06
},
// ───── GUITARS ─────
guitar_clean: {
type: 'guitar',
name: 'Cyber Clean Guitar',
volume: 0.75,
osc: { width: 0.55 },
adsr: { a: 0.003, d: 0.3, s: 0.75, r: 0.7 },
lpf: 3200,
pluckBrightness: 0.45,
reverbMix: 0.03,
drive: { type: 'fuzz', amount: 0.65 }
},
guitar_shineOn: {
type: 'guitar',
name: 'Cyber Shine Lead',
volume: 0.68,
osc: { width: 0.5 },
drive: { type: 'muff', amount: 0.7 },
post: { lpf: 3800 },
adsr: { a: 0.015, d: 0.6, s: 0.7, r: 2.2 },
delay: { time: 0.35, fb: 0.25, mix: 0.18 },
reverbMix: 0.05,
attackTransient: 0.12,
pluckBrightness: 0.55,
vibrato: { rate: 6.0, depthCents: 18, delay: 0.35 },
calibrationTrimDb: 4.5
},
guitar_muffLead: {
type: 'guitar',
name: 'Cyber Muff Lead',
volume: 0.72,
osc: { width: 0.6 },
drive: { type: 'muff', amount: 0.85 },
post: { lpf: 3000 },
adsr: { a: 0.018, d: 0.7, s: 0.65, r: 2.8 },
delay: { time: 0.28, fb: 0.2, mix: 0.15 },
reverbMix: 0.04,
attackTransient: 0.08,
pluckBrightness: 0.4,
vibrato: { rate: 5.5, depthCents: 22, delay: 0.28 },
calibrationTrimDb: 2.8
},
ep_rhodes_warm: {
type: 'synth',
name: 'Cyber Rhodes',
volume: 0.7,
osc: [
{ type: 'sine', octave: 0, detune: 0, gain: 0.65 },
{ type: 'triangle', octave: 1, detune: 0, gain: 0.2 }
],
adsr: { a: 0.008, d: 0.35, s: 0.65, r: 0.5 },
lpf: { cutoff: 2000, q: 1.2 },
reverbMix: 0.05,
drive: { type: 'soft', amount: 0.45 }
}
};