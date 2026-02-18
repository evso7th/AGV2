
import type { Note, Technique } from "@/types/music";
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';

const TELECASTER_SAMPLES: Record<string, string> = {
    'c6': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_C6.ogg',
    'b5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_B5.ogg',
    'a5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_A5.ogg',
    'g5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_G5.ogg',
    'f5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_F5.ogg',
    'e5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_E5.ogg',
    'd5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_D5.ogg',
    'c5': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_C5.ogg',
    'b4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_B4.ogg',
    'a4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_A4.ogg',
    'g4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_G4.ogg',
    'f4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_F4.ogg',
    'e4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_E4.ogg',
    'd4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_D4.ogg',
    'c4': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_C4.ogg',
    'b3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_B3.ogg',
    'a3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_A3.ogg',
    'g3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_G3.ogg',
    'f3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_F3.ogg',
    'e3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_E3.ogg',
    'd3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_D3.ogg',
    'c3': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_C3.ogg',
    'b2': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_B2.ogg',
    'a2': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_A2.ogg',
    'g2': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_G2.ogg',
    'f2': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_F2.ogg',
    'e2': '/assets/acoustic_guitar_samples/telecaster/TELECASTER_E2.ogg',
};

// Distortion curve function for Fuzz effect
function makeDistortionCurve(amount: number) {
  const k = isFinite(amount) ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i ) {
    const x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
};


type SamplerInstrument = {
    buffers: Map<number, AudioBuffer>;
};

export class DarkTelecasterSampler {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private instruments = new Map<string, SamplerInstrument>();
    public isInitialized = false;
    private isLoading = false;

    // Effects chain nodes
    private preamp: GainNode;
    private distortion: WaveShaperNode;
    private compressor: DynamicsCompressorNode;
    private cabinetFilter: BiquadFilterNode;
    
    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 2.2; 

        this.distortion = this.audioContext.createWaveShaper();
        this.distortion.curve = makeDistortionCurve(600); 
        this.distortion.oversample = '4x';
        
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.value = -35; 
        this.compressor.knee.value = 20;
        this.compressor.ratio.value = 10;
        this.compressor.attack.value = 0.005;
        this.compressor.release.value = 0.4;

        this.cabinetFilter = this.audioContext.createBiquadFilter();
        this.cabinetFilter.type = 'lowpass';
        this.cabinetFilter.frequency.value = 3200;
        this.cabinetFilter.Q.value = 0.7;
        
        // --- Routing ---
        this.preamp.connect(this.distortion);
        this.distortion.connect(this.cabinetFilter);
        this.cabinetFilter.connect(this.compressor);
        this.compressor.connect(this.destination);
    }

    async init(): Promise<boolean> {
        return this.loadInstrument('darkTelecaster', TELECASTER_SAMPLES);
    }

    async loadInstrument(instrumentName: 'darkTelecaster', sampleMap: Record<string, string>): Promise<boolean> {
        if (this.isInitialized || this.isLoading) return true;
        this.isLoading = true;

        if (this.instruments.has(instrumentName)) {
            this.isLoading = false;
            return true;
        }

        try {
            const loadedBuffers = new Map<number, AudioBuffer>();
            const loadSample = async (url: string) => {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                return await this.audioContext.decodeAudioData(arrayBuffer);
            };
            
            const notePromises = Object.entries(sampleMap).map(async ([key, url]) => {
                const midi = this.keyToMidi(key);
                if (midi === null) return;
                try {
                    const buffer = await loadSample(url);
                    loadedBuffers.set(midi, buffer);
                } catch(e) { console.error(`Error loading sample for ${key}`, e); }
            });

            await Promise.all(notePromises);
            this.instruments.set(instrumentName, { buffers: loadedBuffers });
            this.isInitialized = true;
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error(`[DarkTelecasterSampler] Failed:`, error);
            this.isLoading = false;
            return false;
        }
    }
    
    public schedule(notes: Note[], time: number, tempo: number = 120) {
        const instrument = this.instruments.get('darkTelecaster');
        if (!this.isInitialized || !instrument) return;

        notes.forEach(note => {
            if (note.technique && (note.technique.startsWith('F_') || note.technique.startsWith('S_'))) {
                this.playPattern(instrument, note, time, tempo);
            } else {
                this.playSingleNote(instrument, note, time);
            }
        });
    }

    private playPattern(instrument: SamplerInstrument, note: Note, barStartTime: number, tempo: number) {
        const patternName = note.technique as string;
        const patternData = GUITAR_PATTERNS[patternName];
        if (!patternData) {
            this.playSingleNote(instrument, note, barStartTime);
            return;
        }

        const voicingName = note.params?.voicingName || 'E7_open';
        const voicing = BLUES_GUITAR_VOICINGS[voicingName];
        if (!voicing) {
            this.playSingleNote(instrument, note, barStartTime);
            return;
        }

        const beatDuration = 60 / tempo;
        const ticksPerBeat = 3;

        for (const event of patternData.pattern) {
            for (const tick of event.ticks) {
                const noteTimeInBar = (tick / ticksPerBeat) * beatDuration;
                for (const stringIndex of event.stringIndices) {
                    if (stringIndex < voicing.length) {
                        const midiNote = voicing[voicing.length - 1 - stringIndex];
                        const { buffer, midi: sampleMidi } = this.findBestSample(instrument, midiNote);
                        if (buffer) {
                             const playTime = barStartTime + noteTimeInBar + ((patternData.rollDuration / ticksPerBeat) * beatDuration * (voicing.length - 1 - stringIndex));
                             this.playSample(buffer, sampleMidi, midiNote, playTime, note.velocity || 0.7);
                        }
                    }
                }
            }
        }
    }

    private playSingleNote(instrument: SamplerInstrument, note: Note, startTime: number) {
        const { buffer, midi: sampleMidi } = this.findBestSample(instrument, note.midi);
        if (!buffer) return;
        const noteStartTime = startTime + (note.time || 0);
        this.playSample(buffer, sampleMidi, note.midi, noteStartTime, note.velocity || 0.7);
    }
    
    private playSample(buffer: AudioBuffer, sampleMidi: number, targetMidi: number, startTime: number, velocity: number) {
        if (!isFinite(startTime) || !isFinite(velocity) || !isFinite(targetMidi) || !isFinite(sampleMidi)) {
            return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = this.audioContext.createGain();
        source.connect(gainNode);
        gainNode.connect(this.preamp);

        const playbackRate = Math.pow(2, (targetMidi - sampleMidi) / 12);
        source.playbackRate.value = isFinite(playbackRate) ? playbackRate : 1.0;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(velocity, startTime + 0.005);

        // #ЗАЧЕМ: Закон Сохранения Хвостов.
        // #ЧТО: Удалено обрезание по note.duration.
        gainNode.gain.setTargetAtTime(0, startTime + 15.0, 0.8);
        
        source.start(startTime);
        source.onended = () => {
            try { gainNode.disconnect(); } catch(e) {}
        };
    }

    private findBestSample(instrument: SamplerInstrument, targetMidi: number): { buffer: AudioBuffer | null, midi: number } {
        const availableMidiNotes = Array.from(instrument.buffers.keys());
        if (availableMidiNotes.length === 0) return { buffer: null, midi: targetMidi };
        const closestMidi = availableMidiNotes.reduce((prev, curr) => 
            Math.abs(curr - targetMidi) < Math.abs(prev - targetMidi) ? curr : prev
        );
        return { buffer: instrument.buffers.get(closestMidi) ?? null, midi: closestMidi };
    }
    
    private keyToMidi(key: string): number | null {
        const noteMatch = key.toLowerCase().match(/([a-g][b#]?)(\d)/);
        if (!noteMatch) return null;
        let [, name, octaveStr] = noteMatch;
        const octave = parseInt(octaveStr, 10) + 1;
        const noteMap: Record<string, number> = {
            'c': 0, 'c#': 1, 'db': 1, 'd': 2, 'd#': 3, 'eb': 3, 'e': 4, 'f': 5, 'f#': 6, 'gb': 6, 'g': 7, 'g#': 8, 'ab': 8, 'a': 9, 'a#': 10, 'bb': 10, 'b': 11
        };
        const noteValue = noteMap[name];
        if (noteValue === undefined) return null;
        return 12 * octave + noteValue;
    }

    public setParam(key: string, value: any) {
        if (key === 'cutoff' && isFinite(value)) {
            this.cabinetFilter.frequency.setTargetAtTime(value, this.audioContext.currentTime, 0.05);
        } else if (key === 'drive' && isFinite(value)) {
            this.distortion.curve = makeDistortionCurve(value);
        }
    }

    public stopAll() {}
    public dispose() { this.preamp.disconnect(); }
}
