
import type { ChordSampleNote, Note } from "@/types/music";

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
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const rootNote = noteNames[midi % 12];
        // For simplicity in this context, we'll assume minor chords as the fractal engine uses a minor scale.
        // A more complex system could infer major/minor from the full chord.
        return `${rootNote}m`;
    }

    public schedule(instrumentName: string, notesOrChord: Note[] | ChordSampleNote, time: number) {
        if (!this.isInitialized) return;
        
        const instrument = this.instruments.get(instrumentName);
        if (!instrument) {
            console.warn(`[AcousticGuitarChordSamplerPlayer] Instrument "${instrumentName}" not loaded.`);
            return;
        }
        
        let chordToPlay: ChordSampleNote;

        if (Array.isArray(notesOrChord)) {
            // Logic for handling an array of Notes (from Fractal Engine)
            if (notesOrChord.length === 0) return;
            const rootNote = notesOrChord[0]; // Use the first note to determine the chord
            const chordName = this.midiToChordName(rootNote.midi);

            // Find if we have a direct match for the minor chord
            const hasMinor = instrument.buffers.has(chordName);
            // If not, try the major equivalent (e.g., 'Em' -> 'E')
            const majorChordName = chordName.slice(0, -1);
            const hasMajor = instrument.buffers.has(majorChordName);

            let finalChordName = chordName;
            if(!hasMinor && hasMajor) {
                finalChordName = majorChordName;
            }

            chordToPlay = {
                chord: finalChordName,
                time: rootNote.time,
                duration: rootNote.duration,
                velocity: rootNote.velocity
            };

        } else {
            // Logic for handling a single ChordSampleNote (from old composers)
            chordToPlay = notesOrChord;
        }


        const buffer = instrument.buffers.get(chordToPlay.chord);
        if (!buffer) {
            // This is a common case, as not all chords might be sampled.
            // console.warn(`[AcousticGuitarChordSamplerPlayer] Sample for chord "${chordToPlay.chord}" not found.`);
            return;
        };

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.outputNode);

        const startTime = time + chordToPlay.time;
        const endTime = startTime + chordToPlay.duration;
        const fadeOutTime = endTime - 0.5; // Start fading out 0.5s before the end

        // Set initial gain
        gainNode.gain.setValueAtTime(chordToPlay.velocity ?? 0.7, startTime);
        
        // Schedule the fade out
        if (this.audioContext.currentTime < fadeOutTime) {
            gainNode.gain.linearRampToValueAtTime(chordToPlay.velocity ?? 0.7, fadeOutTime);
            gainNode.gain.linearRampToValueAtTime(0, endTime);
        } else {
             gainNode.gain.setValueAtTime(0, endTime);
        }

        source.connect(gainNode);
        source.start(startTime);
        
        // Stop the source node after the sound has completely faded out
        source.stop(endTime + 0.1);
    }

    public stopAll() {
        // One-shot samples, no central stop needed.
    }

    public dispose() {
        this.outputNode.disconnect();
    }
}
