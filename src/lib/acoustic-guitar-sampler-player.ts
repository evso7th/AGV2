
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
        return `${rootNote}m`; // Defaulting to minor for now
    }

    public schedule(instrumentName: string, notesOrChord: Note[] | ChordSampleNote, time: number) {
        console.log(`[DEBUG] schedule_AcousticChords called at time ${time}. Received:`, notesOrChord);

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

        if (Array.isArray(notesOrChord)) {
            console.log("[DEBUG] Handling Note[] from Fractal Engine.");
            if (notesOrChord.length === 0) {
                console.log("[DEBUG] Note array is empty, exiting.");
                return;
            };
            const rootNote = notesOrChord[0];
            const chordName = this.midiToChordName(rootNote.midi);
            console.log(`[DEBUG] Converted MIDI ${rootNote.midi} to chord name: ${chordName}`);

            const hasMinor = instrument.buffers.has(chordName);
            const majorChordName = chordName.slice(0, -1);
            const hasMajor = instrument.buffers.has(majorChordName);
            
            console.log(`[DEBUG] Sample check: has minor '${chordName}'? ${hasMinor}. Has major '${majorChordName}'? ${hasMajor}.`);

            let finalChordName = chordName;
            if(!hasMinor && hasMajor) {
                finalChordName = majorChordName;
                console.log(`[DEBUG] Minor sample not found, falling back to major: ${finalChordName}`);
            }

            chordToPlay = {
                chord: finalChordName,
                time: rootNote.time,
                duration: rootNote.duration,
                velocity: rootNote.velocity
            };

        } else {
             console.log("[DEBUG] Handling ChordSampleNote from old composer.");
            chordToPlay = notesOrChord;
        }

        console.log(`[DEBUG] Attempting to play chord: ${chordToPlay.chord}`);
        const buffer = instrument.buffers.get(chordToPlay.chord);

        if (!buffer) {
            console.warn(`[DEBUG] Sample for chord "${chordToPlay.chord}" not found. No sound will be played.`);
            return;
        };

        console.log(`[DEBUG] Found sample for "${chordToPlay.chord}". Scheduling playback.`);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.outputNode);

        const startTime = time + chordToPlay.time;
        const endTime = startTime + chordToPlay.duration;
        const fadeOutTime = endTime - 0.5;

        gainNode.gain.setValueAtTime(chordToPlay.velocity ?? 0.7, startTime);
        
        if (this.audioContext.currentTime < fadeOutTime) {
            gainNode.gain.linearRampToValueAtTime(chordToPlay.velocity ?? 0.7, fadeOutTime);
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
