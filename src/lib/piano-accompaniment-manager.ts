
// src/lib/piano-accompaniment-manager.ts
import type { Note } from "@/types/music";
import type { FractalEvent } from "@/types/fractal";
import { buildMultiInstrument, type InstrumentAPI } from './instrument-factory';
import { V2_PRESETS } from './presets-v2';

/**
 * #ЗАЧЕМ: Реформа пианиста (ПЛАН №871).
 * #ЧТО: Полный отказ от сэмплов. Теперь пианист играет на синтезированном Rhodes V2.
 */
export class PianoAccompanimentManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    public isInitialized = false;
    private instrument: InstrumentAPI | null = null;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('%c[RhodesManager] Initializing Synth V2 engine...', 'color: #FFD700; font-weight: bold;');
        
        try {
            this.instrument = await buildMultiInstrument(this.audioContext, {
                type: 'synth',
                preset: V2_PRESETS.ep_rhodes_warm,
                output: this.destination
            });
            this.isInitialized = true;
            console.log('%c[RhodesManager] Ready.', 'color: #32CD32;');
        } catch (e) {
            console.error('[RhodesManager] Init failed:', e);
        }
    }
    
    public schedule(events: FractalEvent[], startTime: number, tempo: number) {
        if (!this.isInitialized || !this.instrument) return;
        
        const filteredEvents = events.filter(e => e.type === 'pianoAccompaniment');
        if (filteredEvents.length === 0) return;

        const beatDuration = 60 / tempo;
        if (!isFinite(beatDuration)) return;

        filteredEvents.forEach(event => {
            const noteOnTime = startTime + (event.time * beatDuration);
            const duration = event.duration * beatDuration;
            const velocity = event.weight ?? 0.7;

            if (isFinite(noteOnTime) && isFinite(duration) && duration > 0) {
                this.instrument!.noteOn(event.note, noteOnTime, velocity, duration);
            }
        });
    }

    /**
     * #ЗАЧЕМ: Прямая трансляция громкости из UI.
     */
    public setVolume(volume: number) {
        if (this.instrument) {
            this.instrument.setVolume(volume);
        }
    }

    public allNotesOff() {
        if (this.instrument) {
            this.instrument.allNotesOff();
        }
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
        if (this.instrument) {
            this.instrument.disconnect();
        }
    }
}
