import type { Note as NoteEvent } from "@/types/music";
import { ACOUSTIC_GUITAR_CHORD_SAMPLES } from "./samples";
import { vault } from './audio-cache';

const CHORD_SAMPLE_MAP = ACOUSTIC_GUITAR_CHORD_SAMPLES;

/**
 * @fileOverview Сэмплер аккордов V4.8 — "The 150Hz Barrier".
 */
export class GuitarChordsSampler {
    private audioContext: AudioContext;
    private samples: Map<string, AudioBuffer[]> = new Map();
    private loadedUrls: Set<string> = new Set();
    public output: GainNode;
    public isInitialized: boolean = false;
    private isFullyInitialized: boolean = false;
    private isLoading: boolean = false;
    private preamp: GainNode;
    private hpf: BiquadFilterNode; // #ЗАЧЕМ: Пункт 5. Барьер 150 Гц.
    private activeSources: Set<AudioBufferSourceNode> = new Set();
    private readonly MAX_CACHED_CHORDS = 24; 

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.output = this.audioContext.createGain();
        
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.2;

        this.hpf = this.audioContext.createBiquadFilter();
        this.hpf.type = 'highpass';
        this.hpf.frequency.value = 150;
        
        this.preamp.connect(this.hpf);
        this.hpf.connect(this.output);
        this.output.connect(destination);
    }

    public setPreampGain(gain: number) {
        if (isFinite(gain)) {
            this.preamp.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.02);
        }
    }

    async init(minimal = false) {
        if (this.isFullyInitialized) return;
        if (minimal && this.isInitialized) return;
        
        this.isLoading = true;
        const coreChords = ['C', 'Cm', 'G', 'D', 'Dm', 'A', 'Am', 'E', 'Em', 'F', 'Bm'];
        const loadTasks: Promise<void>[] = [];
        for (const chordName in CHORD_SAMPLE_MAP) {
            if (minimal && !coreChords.includes(chordName)) continue;
            const urls = CHORD_SAMPLE_MAP[chordName];
            const targetUrls = minimal ? [urls[0]] : urls;
            loadTasks.push(this.loadChordBuffers(chordName, targetUrls));
        }
        await Promise.all(loadTasks);
        this.isInitialized = true;
        if (!minimal) this.isFullyInitialized = true;
        this.isLoading = false;
    }

    private async loadChordBuffers(chordName: string, urls: string[]) {
        if (!this.samples.has(chordName)) {
            if (this.samples.size >= this.MAX_CACHED_CHORDS) {
                const firstKey = this.samples.keys().next().value;
                if (firstKey) this.samples.delete(firstKey);
            }
            this.samples.set(chordName, []);
        }
        const bufferList = this.samples.get(chordName)!;
        for (const url of urls) {
            if (this.loadedUrls.has(url)) continue;
            try {
                const arrayBuffer = await vault.fetch(url);
                if (arrayBuffer) {
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
                    bufferList.push(audioBuffer);
                    this.loadedUrls.add(url);
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
                noteGain.gain.value = note.velocity ?? 0.7;
                source.connect(noteGain).connect(this.preamp);
                const t0 = startTime + note.time;
                source.start(t0);
                const CAP = 5.0, FADE = 0.6;
                if (buffer.duration > CAP) {
                    const vel = Math.max(note.velocity ?? 0.7, 0.0001);
                    noteGain.gain.setValueAtTime(vel, t0 + CAP - FADE);
                    noteGain.gain.exponentialRampToValueAtTime(0.0001, t0 + CAP);
                    source.stop(t0 + CAP + 0.05);
                }
                this.activeSources.add(source);
                source.onended = () => {
                    this.activeSources.delete(source);
                    try { source.stop(); } catch(e) {}
                    source.disconnect();
                    noteGain.disconnect();
                    source.onended = null; // FIX: Nullify
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
        this.output.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.02);
    }

    public stopAll() {
        this.activeSources.forEach(source => { try { source.stop(); } catch(e) {} source.disconnect(); });
        this.activeSources.clear();
    }

    public dispose() { this.stopAll(); this.preamp.disconnect(); this.hpf.disconnect(); this.output.disconnect(); }
}