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
        this.preamp.gain.value = 1.5; 
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
            console.error(`Failed to load sample: ${chordName} from ${url}`, e);
        }
    }
    
    public schedule(notes: (NoteEvent & { chordName?: string })[], startTime: number) {
        if (!this.isInitialized || notes.length === 0) return;

        notes.forEach(note => {
            // #ЗАЧЕМ: Использует точное имя аккорда, переданное от композитора.
            // #ЧТО: Читает `note.chordName` и напрямую ищет сэмпл в карте.
            // #СВЯЗИ: Устраняет необходимость в "угадывании" аккорда по MIDI-ноте.
            const chordName = this.findBestChordMatch(note.chordName || '');
            
            if (!chordName) {
                console.warn(`[GuitarChordsSampler] Could not find a suitable match for chord: ${note.chordName}`);
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
            } else {
                console.warn(`[GuitarChordsSampler] Sample for resolved chord "${chordName}" not found.`);
            }
        });
    }

    private findBestChordMatch(requestedChord: string): string | null {
        if (this.samples.has(requestedChord)) {
            return requestedChord;
        }

        const root = requestedChord.replace(/m$/, '');
        if (this.samples.has(root)) {
            return root;
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
