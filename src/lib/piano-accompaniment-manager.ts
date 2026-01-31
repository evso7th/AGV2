// src/lib/piano-accompaniment-manager.ts
import type { Note } from "@/types/music";
import { SamplerPlayer } from '@/lib/sampler-player';
import { PIANO_SAMPLES } from "@/lib/samples";

/**
 * #ЗАЧЕМ: Этот менеджер управляет независимой партией фортепианного аккомпанемента.
 * #ЧТО: Он использует сэмплер для воспроизведения фортепианных нот,
 *       полученных от FractalMusicEngine.
 * #СВЯЗИ: Управляется AudioEngineContext, получает события типа 'pianoAccompaniment'.
 */
export class PianoAccompanimentManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    public isInitialized = false;
    private piano: SamplerPlayer;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.piano = new SamplerPlayer(audioContext, this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[PianoAccompManager] Initializing...');
        await this.piano.loadInstrument('piano', PIANO_SAMPLES);
        this.isInitialized = true;
        console.log('[PianoAccompManager] Initialized.');
    }
    
    public schedule(notes: Note[], startTime: number) {
        if (!this.isInitialized) return;
        this.piano.schedule('piano', notes, startTime);
    }

    public setVolume(volume: number) {
        this.piano.setVolume(volume);
    }

    public allNotesOff() {
        this.piano.stopAll();
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
        this.piano.dispose();
    }
}
