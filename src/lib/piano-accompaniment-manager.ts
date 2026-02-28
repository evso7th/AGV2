// src/lib/piano-accompaniment-manager.ts
import type { Note } from "@/types/music";
import type { FractalEvent } from "@/types/fractal";
import { SamplerPlayer } from '@/lib/sampler-player';
import { PIANO_SAMPLES } from "@/lib/samples";

/**
 * #ЗАЧЕМ: Этот менеджер управляет независимой партией фортепианного аккомпанемента.
 * #ЧТО: ПЛАН №688 — Внедрена фильтрация событий. Слышит только тип 'pianoAccompaniment'.
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
        
        console.log('[pianosacc] Initializing...');
        await this.piano.loadInstrument('piano', PIANO_SAMPLES);
        this.isInitialized = true;
        console.log('[pianosacc] Initialized.');
    }
    
    public schedule(events: FractalEvent[], startTime: number, tempo: number) {
        if (!this.isInitialized) return;
        
        // #ЗАЧЕМ: "Обрезаем уши". Игнорируем всё, что не является типом 'pianoAccompaniment'.
        const filteredEvents = events.filter(e => e.type === 'pianoAccompaniment');
        if (filteredEvents.length === 0) return;

        const beatDuration = 60 / tempo;
        if (!isFinite(beatDuration)) {
            console.error(`[pianosacc] Invalid tempo resulted in non-finite beatDuration: ${tempo}`);
            return;
        }

        const notes: Note[] = filteredEvents.map(event => ({
            midi: event.note,
            time: event.time * beatDuration,
            duration: event.duration * beatDuration,
            velocity: event.weight,
            params: event.params
        }));
        
        console.log(`[pianosacc] Received ${filteredEvents.length} relevant events, converted to ${notes.length} notes to play.`);
        this.piano.schedule('piano', notes, startTime, 'pianosacc');
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
