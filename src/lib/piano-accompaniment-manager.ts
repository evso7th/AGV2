
// src/lib/piano-accompaniment-manager.ts
import type { Note } from "@/types/music";
import type { FractalEvent } from "@/types/fractal";
import { buildMultiInstrument, type InstrumentAPI } from './instrument-factory';
import { V2_PRESETS } from './presets-v2';
import { SamplerPlayer } from './sampler-player';
import { PIANO_SAMPLES } from './samples';

/**
 * #ЗАЧЕМ: Реформа пианиста V2.2 — "Cohesion Fix".
 * #ЧТО: ПЛАН №85 — Сокращение хвостов релиза.
 */
export class PianoAccompanimentManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    public isInitialized = false;
    
    private rhodesInstrument: InstrumentAPI | null = null;
    private acousticSampler: SamplerPlayer;
    private currentMode: 'rhodes' | 'acoustic' = 'rhodes';

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;
        this.acousticSampler = new SamplerPlayer(audioContext, destination);
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // 1. Load Synth Rhodes
            this.rhodesInstrument = await buildMultiInstrument(this.audioContext, {
                type: 'synth',
                preset: V2_PRESETS.ep_rhodes,
                output: this.destination
            });

            // 2. Load Sampler Piano
            await this.acousticSampler.loadInstrument('piano', PIANO_SAMPLES);
            this.acousticSampler.setVolume(1.0);

            this.isInitialized = true;
        } catch (e) {
            console.error('[PianoManager] Init failed:', e);
        }
    }

    public setInstrumentType(type: 'rhodes' | 'acoustic') {
        this.currentMode = type;
    }
    
    public schedule(events: FractalEvent[], startTime: number, tempo: number) {
        if (!this.isInitialized) return;
        
        const filteredEvents = events.filter(e => e.type === 'pianoAccompaniment');
        if (filteredEvents.length === 0) return;

        const beatDuration = 60 / tempo;
        const notes: Note[] = filteredEvents.map(e => ({
            midi: e.note,
            time: e.time * beatDuration,
            // #ЗАЧЕМ: ПЛАН №85. Уменьшение релизов.
            duration: (e.duration * beatDuration) + 0.5, 
            velocity: e.weight
        }));

        if (this.currentMode === 'acoustic') {
            this.acousticSampler.schedule('piano', notes, startTime);
        } else if (this.rhodesInstrument) {
            notes.forEach(note => {
                const noteOnTime = startTime + note.time;
                if (isFinite(noteOnTime) && isFinite(note.duration) && note.duration > 0) {
                    this.rhodesInstrument!.noteOn(note.midi, noteOnTime, note.velocity, note.duration);
                }
            });
        }
    }

    public setVolume(volume: number) {
        if (this.rhodesInstrument) this.rhodesInstrument.setVolume(volume);
        this.acousticSampler.setVolume(volume);
    }

    public allNotesOff() {
        if (this.rhodesInstrument) this.rhodesInstrument.allNotesOff();
        this.acousticSampler.stopAll();
    }

    public stop() { this.allNotesOff(); }
    public dispose() {
        this.stop();
        if (this.rhodesInstrument) this.rhodesInstrument.disconnect();
        this.acousticSampler.dispose();
    }
}
