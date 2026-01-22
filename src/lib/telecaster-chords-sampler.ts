
import type { Note as NoteEvent } from "@/types/music";
import { TELECASTER_CHORD_SAMPLES } from "./assets/telecaster-chord-samples";

/**
 * #ЗАЧЕМ: Этот сэмплер отвечает за воспроизведение аккордов гитары Telecaster.
 * #ЧТО: Он загружает сэмплы из `telecaster-chord-samples.ts` и проигрывает
 *       их на основе точного имени аккорда, полученного от композитора.
 * #СВЯЗИ: Управляется `HarmonySynthManager`.
 */
export class TelecasterChordsSampler {
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
        console.log(`[TelecasterSampler] Initializing...`);

        const samplePromises: Promise<void>[] = [];
        for (const chordName in TELECASTER_CHORD_SAMPLES) {
            const url = TELECASTER_CHORD_SAMPLES[chordName as keyof typeof TELECASTER_CHORD_SAMPLES];
            samplePromises.push(this.loadSample(chordName, url));
        }

        await Promise.all(samplePromises);
        this.isInitialized = true;
        this.isLoading = false;
        console.log(`[TelecasterSampler] ${this.samples.size} samples loaded. Ready.`);
    }

    private async loadSample(chordName: string, url: string) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.samples.set(chordName, audioBuffer);
        } catch (e) {
            console.error(`[TelecasterSampler] Failed to load sample: ${chordName} from ${url}`, e);
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
                console.warn(`[TelecasterSampler] Could not find a suitable match for chord: ${note.chordName}`);
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
                
                source.start(startTime + note.time);

                source.onended = () => {
                    noteGain.disconnect();
                };
            } else {
                console.warn(`[TelecasterSampler] Sample for resolved chord "${chordName}" not found.`);
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
