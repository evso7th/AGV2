export const SCALES = [
  'C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major',
  'F Major', 'Bb Major', 'Eb Major', 'Ab Major', 'Db Major', 'Gb Major',
  'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor', 'G# Minor',
  'D Minor', 'G Minor', 'C Minor', 'F Minor', 'Bb Minor', 'Eb Minor',
  'Chromatic', 'Blues', 'Major Pentatonic', 'Minor Pentatonic'
].sort();

export const INSTRUMENTS = [
  'Synth', 'FMSynth', 'AMSynth', 'MetalSynth', 'MembraneSynth'
];

export const PATTERNS = ['up', 'down', 'upDown', 'random'];

export const DEFAULT_PARAMS = {
  tempo: 120,
  scale: 'C Major',
  instrument: 'Synth',
  pattern: 'up',
  noteDensity: 0.7
};
