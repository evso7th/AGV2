
import type { ChordSampleNote, Note } from "@/types/music";
import * as Tone from 'tone';

type SamplerInstrument = {
    buffers: Map<string, AudioBuffer>; // Map from Chord name to AudioBuffer
};

export class AcousticGuitarChordSamplerPlayer {
    private audioContext: AudioContext;
    private outputNode: GainNode;
    private instruments = new Map<string, SamplerInstrument>();
    public isInitialized = false;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.outputNode = this.audioContext.createGain();
        this.outputNode.connect(destination);
    }
    
    public setVolume(volume: number) {
        this.outputNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
    }

    async loadInstrument(instrumentName: string, sampleMap: Record<string, string>): Promise<boolean> {
        if (this.instruments.has(instrumentName)) {
            return true;
        }

        try {
            const loadedBuffers = new Map<string, AudioBuffer>();
            
            const loadPromises = Object.entries(sampleMap).map(async ([chordName, url]) => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    loadedBuffers.set(chordName, audioBuffer);
                } catch (error) {
                    console.error(`Error loading sample ${chordName} from ${url}:`, error);
                }
            });

            await Promise.all(loadPromises);

            if (loadedBuffers.size === 0) {
                 console.error(`[AcousticGuitarChordSamplerPlayer] No samples were loaded for instrument "${instrumentName}".`);
                 return false;
            }
            
            this.instruments.set(instrumentName, { buffers: loadedBuffers });
            
            console.log(`[AcousticGuitarChordSamplerPlayer] Instrument "${instrumentName}" loaded.`);
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error(`[AcousticGuitarChordSamplerPlayer] Failed to load instrument "${instrumentName}":`, error);
            return false;
        }
    }
    
    private midiToChordName(midi: number): string {
        const noteName = new Tone.Frequency(midi, 'midi').toNote();
        const rootNote = noteName.slice(0, -1);
        // Simple logic: for now, assume minor chords are preferred
        return `${rootNote}m`;
    }

    public schedule(instrumentName: string, notesOrChord: Note[] | ChordSampleNote, time: number) {
        if (!this.isInitialized) {
            console.warn('[AcousticGuitarChordSamplerPlayer] Tried to schedule before initialized.');
            return;
        }
        
        const instrument = this.instruments.get(instrumentName);
        if (!instrument) {
            console.warn(`[AcousticGuitarChordSamplerPlayer] Instrument "${instrumentName}" not loaded.`);
            return;
        }
        
        let chordToPlay: ChordSampleNote;

        if (Array.isArray(notesOrChord) && notesOrChord.length > 0) {
            const rootNote = notesOrChord.sort((a,b) => a.midi - b.midi)[0]; // Use the lowest note as the root
            const chordName = this.midiToChordName(rootNote.midi);

            // Fallback logic: if a minor chord isn't found, try the major equivalent.
            let finalChordName = chordName;
            if (!instrument.buffers.has(chordName)) {
                const majorChordName = chordName.replace('m', '');
                if (instrument.buffers.has(majorChordName)) {
                    finalChordName = majorChordName;
                }
            }

            chordToPlay = {
                chord: finalChordName,
                time: rootNote.time,
                duration: rootNote.duration,
                velocity: rootNote.velocity
            };

        } else if (!Array.isArray(notesOrChord)) {
            chordToPlay = notesOrChord;
        } else {
            return; // Empty array, nothing to play
        }

        const buffer = instrument.buffers.get(chordToPlay.chord);

        if (!buffer) {
            // console.warn(`[AcousticGuitarChordSamplerPlayer] Sample for chord "${chordToPlay.chord}" not found.`);
            return;
        };

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.outputNode);

        const startTime = time + chordToPlay.time;
        const endTime = startTime + chordToPlay.duration;
        const fadeOutTime = endTime - 0.5;

        const velocity = chordToPlay.velocity ?? 0.7;
        gainNode.gain.setValueAtTime(velocity, startTime);
        
        if (this.audioContext.currentTime < fadeOutTime) {
            gainNode.gain.linearRampToValueAtTime(velocity, fadeOutTime);
            gainNode.gain.linearRampToValueAtTime(0, endTime);
        } else {
             gainNode.gain.setValueAtTime(0, endTime);
        }

        source.connect(gainNode);
        source.start(startTime);
        
        source.stop(endTime + 0.1);
    }

    public stopAll() {
        // One-shot samples, no central stop needed.
    }

    public dispose() {
        this.outputNode.disconnect();
    }
}
