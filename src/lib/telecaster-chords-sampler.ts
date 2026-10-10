import type { Note as NoteEvent } from "@/types/music";
import { TELECASTER_CHORD_SAMPLES } from "./assets/telecaster-chord-samples";
import { dbToGain } from './guitar-loudness';
import { vault } from './audio-cache';

/**
 * @fileOverview Telecaster Chords Sampler V3.5 — "Velocity Precision Fix".
 * #ЗАЧЕМ: Устранение прямого обращения к .value для гарантии динамики.
 */
export class TelecasterChordsSampler {
    private audioContext: AudioContext;
    private samples: Map<string, AudioBuffer[]> = new Map();
    public output: GainNode;
    public isInitialized: boolean = false;
    private isFullyInitialized: boolean = false;
    private isLoading: boolean = false;
    private preamp: GainNode;
    private activeSources: Set<AudioBufferSourceNode> = new Set();
    private readonly MAX_CACHED_CHORDS = 24; // Лимит памяти

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.output = this.audioContext.createGain();
        
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 0.9; 
        this.preamp.connect(this.output);
        
        this.output.connect(destination);
    }

    public setPreampGain(gain: number) {
        if (isFinite(gain)) {
            const now = this.audioContext.currentTime;
            this.preamp.gain.cancelScheduledValues(now);
            this.preamp.gain.setTargetAtTime(gain, now, 0.02);
        }
    }

    async init(minimal = false) {
        if (this.isFullyInitialized) return;
        if (minimal && this.isInitialized) return;
        this.isLoading = true;

        const coreChords = ['C', 'Cm', 'G', 'D', 'Dm', 'A', 'Am', 'E', 'Em', 'F', 'Bm'];
        const samplePromises: Promise<void>[] = [];

        for (const chordName in TELECASTER_CHORD_SAMPLES) {
            if (minimal && !coreChords.includes(chordName)) continue;
            const urls = TELECASTER_CHORD_SAMPLES[chordName];
            samplePromises.push(this.loadChordBuffers(chordName, urls));
        }

        await Promise.all(samplePromises);
        this.isInitialized = true;
        if (!minimal) this.isFullyInitialized = true;
        this.isLoading = false;
    }

    private async loadChordBuffers(chordName: string, urls: string[]) {
        if (!this.samples.has(chordName)) {
            // Реализация LRU-вытеснения
            if (this.samples.size >= this.MAX_CACHED_CHORDS) {
                const firstKey = this.samples.keys().next().value;
                if (firstKey) this.samples.delete(firstKey);
            }
            this.samples.set(chordName, []);
        }
        const bufferList = this.samples.get(chordName)!;
        
        for (const url of urls) {
            try {
                const arrayBuffer = await vault.fetch(url);
                if (arrayBuffer) {
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
                    bufferList.push(audioBuffer);
                }
            } catch (e) {}
        }
    }
    
    public schedule(notes: (NoteEvent & { chordName?: string })[], startTime: number) {
        if (!this.isInitialized || notes.length === 0) return;

        notes.forEach(note => {
            const matchedName = this.findBestChordMatch(note.chordName || '');
            if (!matchedName) return;

            const buffers = this.samples.get(matchedName);
            if (buffers && buffers.length > 0) {
                const buffer = buffers[Math.floor(Math.random() * buffers.length)];
                
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                
                const noteGain = this.audioContext.createGain();
                const velocity = note.velocity ?? 0.7;
                
                source.connect(noteGain);
                noteGain.connect(this.preamp);
                
                const t0 = startTime + note.time;
                
                // #ЗАЧЕМ: Детерминированное управление громкостью.
                noteGain.gain.setValueAtTime(0, t0);
                noteGain.gain.linearRampToValueAtTime(velocity, t0 + 0.01);
                
                const CAP = 10.0;
                const FADE = 1.0;
                
                source.start(t0);
                
                if (buffer.duration > CAP) {
                    const safeVel = Math.max(velocity, 0.0001);
                    noteGain.gain.setValueAtTime(safeVel, t0 + CAP - FADE);
                    noteGain.gain.exponentialRampToValueAtTime(0.0001, t0 + CAP);
                    source.stop(t0 + CAP + 0.1);
                }

                this.activeSources.add(source);
                source.onended = () => {
                    this.activeSources.delete(source);
                    try { 
                        source.onended = null;
                        source.stop(); 
                        source.disconnect();
                        noteGain.disconnect();
                    } catch(e) {}
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

        const root = target.match(/^[A-G][#b]?/)?.[0];
        if (root && this.samples.has(root)) return root;

        return null;
    }

    public setVolume(volume: number) {
        if (isFinite(volume)) {
            const now = this.audioContext.currentTime;
            this.output.gain.cancelScheduledValues(now);
            this.output.gain.setTargetAtTime(volume, now, 0.02);
        }
    }

    public stopAll() {
        this.activeSources.forEach(source => {
            try { 
                source.onended = null;
                source.stop(); 
                source.disconnect();
            } catch(e) {}
        });
        this.activeSources.clear();
    }

    public dispose() {
        this.stopAll();
        this.preamp.disconnect();
        this.output.disconnect();
    }
}