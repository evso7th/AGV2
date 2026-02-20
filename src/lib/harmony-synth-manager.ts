import type { FractalEvent } from '@/types/fractal';
import type { Note } from "@/types/music";
import { SamplerPlayer } from '@/lib/sampler-player';
import { GuitarChordsSampler } from '@/lib/guitar-chords-sampler';
import { PIANO_SAMPLES, VIOLIN_SAMPLES, FLUTE_SAMPLES } from "@/lib/samples";
import { ViolinSamplerPlayer } from './violin-sampler-player';
import { FluteSamplerPlayer } from './flute-sampler-player';


/**
 * Manages the "harmony" layer, specifically for rhythmic/harmonic instruments
 * like piano and guitar chords. It's a specialized sampler player.
 * #ОБНОВЛЕНО (ПЛАН №528): Исправлено "немое" переключение. Все громкости теперь независимы.
 */
export class HarmonySynthManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private activeInstrumentName: 'piano' | 'guitarChords' | 'violin' | 'flute' | 'none' = 'piano';
    public isInitialized = false;

    // Sampler Instruments
    private piano: SamplerPlayer;
    private guitarChords: GuitarChordsSampler;
    private violin: ViolinSamplerPlayer;
    private flute: FluteSamplerPlayer;


    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.piano = new SamplerPlayer(audioContext, this.destination);
        this.guitarChords = new GuitarChordsSampler(audioContext, this.destination);
        this.violin = new ViolinSamplerPlayer(audioContext, this.destination);
        this.flute = new FluteSamplerPlayer(audioContext, this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[HarmonyManager] Initializing harmony instruments...');

        await Promise.all([
            this.piano.loadInstrument('piano', PIANO_SAMPLES),
            this.guitarChords.init(),
            this.violin.loadInstrument('violin', VIOLIN_SAMPLES),
            this.flute.loadInstrument('flute', FLUTE_SAMPLES),
        ]);
        
        this.isInitialized = true;
        
        // #ЗАЧЕМ: Установка дефолтных громкостей для всех сэмплеров.
        this.piano.setVolume(0.8);
        this.guitarChords.setVolume(0.9);
        this.violin.setVolume(1.0);
        this.flute.setVolume(0.8);

        console.log('[HarmonyManager] Harmony instruments initialized.');
    }
    
    public schedule(events: FractalEvent[], barStartTime: number, tempo: number, instrumentHint?: 'piano' | 'guitarChords' | 'violin' | 'flute' | 'none') {
        if (!this.isInitialized) {
            return;
        }
        
        let instrumentToPlay = instrumentHint || this.activeInstrumentName;

        if (instrumentToPlay === 'flute') {
            instrumentToPlay = 'violin';
        }

        if (instrumentToPlay === 'none') {
            return;
        }

        const beatDuration = 60 / tempo;
        const notes: (Note & { chordName?: string, params?: any })[] = events.map(event => ({
            midi: event.note,
            time: event.time * beatDuration,
            duration: event.duration * beatDuration,
            velocity: event.weight,
            chordName: event.chordName,
            params: event.params,
        }));
        
        if (notes.length === 0) {
            return;
        }

        switch (instrumentToPlay) {
            case 'piano':
                this.piano.schedule('piano', notes, barStartTime);
                break;
            case 'guitarChords':
                this.guitarChords.schedule(notes, barStartTime);
                break;
            case 'violin':
                this.violin.schedule(notes, barStartTime);
                break;
            case 'flute':
                this.violin.schedule(notes, barStartTime);
                break;
        }
    }

    public setInstrument(instrumentName: 'piano' | 'guitarChords' | 'violin' | 'flute' | 'none') {
        if (!this.isInitialized) return;
        
        let name = instrumentName;
        if (name === 'flute') name = 'violin';

        this.activeInstrumentName = name;
        // #ЗАЧЕМ: Мы больше не глушим другие инструменты здесь, чтобы не мешать instrumentHint.
        // Громкость регулируется системным VOICE_BALANCE и индивидуальными setVolume в init.
    }

    public allNotesOff() {
        this.piano.stopAll();
        this.guitarChords.stopAll();
        this.violin.stopAll();
        this.flute.stopAll();
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
        this.piano.dispose();
        this.guitarChords.dispose();
        this.violin.dispose();
        this.flute.dispose();
    }
}
