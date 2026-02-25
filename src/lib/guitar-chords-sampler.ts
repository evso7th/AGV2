import type { Note as NoteEvent } from "@/types/music";
import { ACOUSTIC_GUITAR_CHORD_SAMPLES } from "./samples";

const CHORD_SAMPLE_MAP = ACOUSTIC_GUITAR_CHORD_SAMPLES;

/**
 * #ЗАЧЕМ: Сэмплер аккордов V3.0 — "The Sonic Hypercube".
 * #ЧТО: 1. Поддержка Round Robin через массивы сэмплов (200+ файлов).
 *       2. Расширенная логика Smart Match.
 */
export class GuitarChordsSampler {
    private audioContext: AudioContext;
    private samples: Map<string, AudioBuffer[]> = new Map();
    public output: GainNode;
    public isInitialized: boolean = false;
    private isLoading: boolean = false;
    private preamp: GainNode;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.output = this.audioContext.createGain();
        
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.2;
        this.preamp.connect(this.output);
        
        this.output.connect(destination);
    }

    async init() {
        if (this.isInitialized || this.isLoading) return;
        this.isLoading = true;
        
        const totalSamplePaths = Object.values(CHORD_SAMPLE_MAP).flat().length;
        console.log(`%c[GuitarChordsSampler] Initializing sonic cube with ${totalSamplePaths} assets...`, 'color: #DA70D6; font-weight: bold;');

        const loadTasks: Promise<void>[] = [];
        for (const chordName in CHORD_SAMPLE_MAP) {
            const urls = CHORD_SAMPLE_MAP[chordName];
            loadTasks.push(this.loadChordBuffers(chordName, urls));
        }

        await Promise.all(loadTasks);
        this.isInitialized = true;
        this.isLoading = false;
        
        const loadedCount = Array.from(this.samples.values()).flat().length;
        console.log(`%c[GuitarChordsSampler] ${loadedCount} samples successfully loaded across ${this.samples.size} chord types.`, 'color: #32CD32; font-weight: bold;');
    }

    private async loadChordBuffers(chordName: string, urls: string[]) {
        const buffers: AudioBuffer[] = [];
        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (!response.ok) continue;
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                buffers.push(audioBuffer);
            } catch (e) {
                console.warn(`[GuitarChordsSampler] Failed to load: ${url}`);
            }
        }
        if (buffers.length > 0) {
            this.samples.set(chordName, buffers);
        }
    }
    
    public schedule(notes: (NoteEvent & { chordName?: string })[], startTime: number) {
        if (!this.isInitialized || notes.length === 0) return;

        notes.forEach(note => {
            const matchedName = this.findBestChordMatch(note.chordName || '');
            if (!matchedName) return;

            const buffers = this.samples.get(matchedName);
            if (buffers && buffers.length > 0) {
                // Round Robin / Random selection
                const buffer = buffers[Math.floor(Math.random() * buffers.length)];
                
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                
                const noteGain = this.audioContext.createGain();
                noteGain.gain.value = note.velocity ?? 0.7;
                
                source.connect(noteGain);
                noteGain.connect(this.preamp);
                
                source.start(startTime + note.time);

                source.onended = () => {
                    try { noteGain.disconnect(); } catch(e) {}
                };
            }
        });
    }

    private findBestChordMatch(requestedChord: string): string | null {
        if (!requestedChord) return null;
        const target = requestedChord.trim();
        
        if (this.samples.has(target)) return target;

        let simplified = target.replace(/(m?)(maj|dim|aug|sus|add|dim)?\d+$/, '$1');
        if (this.samples.has(simplified)) return simplified;

        if (target.includes('m') && !simplified.endsWith('m')) {
            const minorBase = simplified + 'm';
            if (this.samples.has(minorBase)) return minorBase;
        }

        const root = target.match(/^[A-G][#b]?/)?.[0];
        if (root && this.samples.has(root)) return root;

        return null;
    }

    public setVolume(volume: number) {
        const now = this.audioContext.currentTime;
        this.output.gain.setTargetAtTime(volume, now, 0.02);
    }

    public stopAll() {}

    public dispose() {
        this.preamp.disconnect();
        this.output.disconnect();
    }
}
