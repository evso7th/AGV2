

import type { Note as NoteEvent } from "@/types/music";
import { ACOUSTIC_GUITAR_CHORD_SAMPLES } from "./samples";
import * as Tone from 'tone';

const CHORD_SAMPLE_MAP = ACOUSTIC_GUITAR_CHORD_SAMPLES;

/**
 * #ЗАЧЕМ: Этот сэмплер отвечает за воспроизведение аккордов акустической гитары.
 * #ЧТО: Он загружает сэмплы из `samples.ts` и проигрывает
 *       их на основе точного имени аккорда, полученного от композитора.
 * #СВЯЗИ: Управляется `HarmonySynthManager`.
 */
export class GuitarChordsSampler {
    private audioContext: AudioContext;
    private samples: Map<string, AudioBuffer> = new Map();
    public output: GainNode;
    public isInitialized: boolean = false;
    private isLoading: boolean = false;
    private preamp: GainNode;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.output = this.audioContext.createGain();
        
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 0.9;
        this.preamp.connect(this.output);
        
        this.output.connect(destination);
    }

    async init() {
        if (this.isInitialized || this.isLoading) return;
        this.isLoading = true;
        console.log(`[GuitarChordsSampler] Initializing... Loading ${Object.keys(CHORD_SAMPLE_MAP).length} samples.`);

        const samplePromises: Promise<void>[] = [];
        for (const chordName in CHORD_SAMPLE_MAP) {
            const url = CHORD_SAMPLE_MAP[chordName as keyof typeof CHORD_SAMPLE_MAP];
            samplePromises.push(this.loadSample(chordName, url));
        }

        await Promise.all(samplePromises);
        this.isInitialized = true;
        this.isLoading = false;
        console.log(`[GuitarChordsSampler] ${this.samples.size} samples loaded. Ready.`);
    }

    private async loadSample(chordName: string, url: string) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.samples.set(chordName, audioBuffer);
        } catch (e) {
            console.error(`[GuitarChordsSampler] Failed to load sample: ${chordName} from ${url}`, e);
        }
    }
    
    public schedule(notes: (NoteEvent & { chordName?: string })[], startTime: number) {
        if (!this.isInitialized || notes.length === 0) return;

        notes.forEach(note => {
            const barCount = (note.params as any)?.barCount ?? 'N/A';
            console.log(`[HarmonyAudit] [Sampler Exec] Bar: ${barCount} - Received note. Requesting chordName: "${note.chordName}"`);

            const chordName = this.findBestChordMatch(note.chordName || '');
            
            console.log(`[HarmonyAudit] [Sampler Exec] Bar: ${barCount} - Matched to: "${chordName}". Playing sample.`);
            
            if (!chordName) {
                return;
            }

            const buffer = this.samples.get(chordName);
            if (buffer) {
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                
                const noteGain = this.audioContext.createGain();
                noteGain.gain.value = note.velocity ?? 0.7;
                
                source.connect(noteGain);
                noteGain.connect(this.preamp);
                
                const playTime = startTime + note.time;
                source.start(playTime);

                source.onended = () => {
                    noteGain.disconnect();
                };
            }
        });
    }

    private findBestChordMatch(requestedChord: string): string | null {
        if (!requestedChord) return null;
    
        const originalChord = requestedChord.trim();
        
        // 1. Direct Match
        if (this.samples.has(originalChord)) {
            return originalChord;
        }
    
        // Enharmonic equivalents map
        const enharmonics: Record<string, string> = {
            'A#': 'Bb', 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab'
        };
        const reverseEnharmonics: Record<string, string> = {
            'Bb': 'A#', 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#'
        };
        
        let currentChord = originalChord;
        
        // 2. Enharmonic Match
        for (const [from, to] of Object.entries(enharmonics)) {
            if (currentChord.startsWith(from)) {
                const enharmonicChord = currentChord.replace(from, to);
                if (this.samples.has(enharmonicChord)) return enharmonicChord;
            }
        }
         for (const [from, to] of Object.entries(reverseEnharmonics)) {
            if (currentChord.startsWith(from)) {
                const enharmonicChord = currentChord.replace(from, to);
                if (this.samples.has(enharmonicChord)) return enharmonicChord;
            }
        }

        // 3. Simplify and search (e.g., Am7 -> Am -> A)
        let simplifiedChord = currentChord;
    
        // Try removing extensions and complex types (m7, maj9, dim, aug, etc.)
        simplifiedChord = simplifiedChord.replace(/(m?)(maj|dim|aug|sus|add)?\d+$/, '$1'); // Cmaj9 -> C, Am7 -> Am
        
        if (simplifiedChord !== currentChord && this.samples.has(simplifiedChord)) {
            return simplifiedChord;
        }
    
        // If it's a minor chord, try finding the major equivalent (e.g., Am -> A)
        if (simplifiedChord.endsWith('m')) {
            const majorEquivalent = simplifiedChord.slice(0, -1);
            if (this.samples.has(majorEquivalent)) {
                return majorEquivalent;
            }
        }
        
        // Fallback: just the root note
        const rootNote = currentChord.match(/^[A-G][#b]?/);
        if (rootNote) {
            if(this.samples.has(rootNote[0])) return rootNote[0];
            const enharmonicRoot = enharmonics[rootNote[0]] || reverseEnharmonics[rootNote[0]];
            if(enharmonicRoot && this.samples.has(enharmonicRoot)) return enharmonicRoot;
        }
    
        return null;
    }


    public setVolume(volume: number) {
        this.output.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
    }

    public stopAll() {
        // Since sources are short-lived, we don't need to track them to stop them.
    }

    public dispose() {
        this.preamp.disconnect();
        this.output.disconnect();
    }
}
