
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

type SamplerInstrument = { buffers: Map<number, AudioBuffer>; };

export class TelecasterGuitarSampler {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private instruments = new Map<string, SamplerInstrument>();
    public isInitialized = false;
    private isLoading = false;
    private preamp: GainNode;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 3.0;
        this.preamp.connect(this.destination);
    }

    async init(): Promise<boolean> {
        return this.loadInstrument('telecaster', TELECASTER_SAMPLES);
    }

    async loadInstrument(instrumentName: 'telecaster', sampleMap: Record<string, string>): Promise<boolean> {
        if (this.isInitialized || this.isLoading) return true;
        this.isLoading = true;
        try {
            const loadedBuffers = new Map<number, AudioBuffer>();
            const loadSample = async (url: string) => {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                return await this.audioContext.decodeAudioData(arrayBuffer);
            };
            const promises = Object.entries(sampleMap).map(async ([key, url]) => {
                const midi = this.keyToMidi(key);
                if (midi) loadedBuffers.set(midi, await loadSample(url));
            });
            await Promise.all(promises);
            this.instruments.set(instrumentName, { buffers: loadedBuffers });
            this.isInitialized = true;
            this.isLoading = false;
            return true;
        } catch (error) {
            this.isLoading = false;
            return false;
        }
    }
    
    public schedule(notes: Note[], time: number, tempo: number = 120) {
        const instrument = this.instruments.get('telecaster');
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
        const voicing = BLUES_GUITAR_VOICINGS[note.params?.voicingName || 'E7_open'];
        if (!patternData || !voicing) return;
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
        if (buffer) this.playSample(buffer, sampleMidi, note.midi, startTime + note.time, note.velocity || 0.7, note.duration);
    }
    
    private playSample(buffer: AudioBuffer, sampleMidi: number, targetMidi: number, startTime: number, velocity: number, duration?: number) {
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = this.audioContext.createGain();
        source.connect(gainNode).connect(this.preamp);
        source.playbackRate.value = Math.pow(2, (targetMidi - sampleMidi) / 12);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(velocity, startTime + 0.005);
        if (duration) gainNode.gain.setTargetAtTime(0, startTime + duration, 0.4);
        source.start(startTime);
        source.onended = () => { try { gainNode.disconnect(); } catch(e){} };
    }

    private findBestSample(instrument: SamplerInstrument, targetMidi: number): { buffer: AudioBuffer | null, midi: number } {
        const availableMidiNotes = Array.from(instrument.buffers.keys());
        const closestMidi = availableMidiNotes.reduce((prev, curr) => 
            Math.abs(curr - targetMidi) < Math.abs(prev - targetMidi) ? curr : prev
        , availableMidiNotes[0]);
        return { buffer: instrument.buffers.get(closestMidi) ?? null, midi: closestMidi };
    }
    
    private keyToMidi(key: string): number | null {
        const noteMatch = key.toLowerCase().match(/([a-g][b#]?)(\d)/);
        if (!noteMatch) return null;
        let [, name, octaveStr] = noteMatch;
        const noteMap: Record<string, number> = { 'c':0,'c#':1,'db':1,'d':2,'d#':3,'eb':3,'e':4,'f':5,'f#':6,'gb':6,'g':7,'g#':8,'ab':8,'a':9,'a#':10,'bb':10,'b':11 };
        return 12 * (parseInt(octaveStr) + 1) + noteMap[name];
    }

    public stopAll() {}
    public dispose() { this.preamp.disconnect(); }
}
