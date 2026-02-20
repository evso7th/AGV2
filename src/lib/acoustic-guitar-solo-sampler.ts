
import type { Note, Technique } from "@/types/music";
import { ACOUSTIC_GUITAR_SOLO_SAMPLES, ACOUSTIC_GUITAR_SLIDE_SAMPLES, type GuitarTechniqueSamples } from "./samples";

/**
 * #ЗАЧЕМ: Соло-сэмплер акустики с сохранением хвостов.
 * #ЧТО: ПЛАН №467 — Полный отказ от обрезания длительности. Ноты затухают сами.
 */
export class AcousticGuitarSoloSampler {
    private audioContext: AudioContext;
    private outputNode: GainNode;
    private instruments = new Map<string, any>();
    public isInitialized = false;
    private preamp: GainNode;
    private isLoading = false;
    private slideBuffers: AudioBuffer[] = [];
    private activeSources: Set<AudioBufferSourceNode> = new Set();

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.outputNode = this.audioContext.createGain();
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.8; 
        this.preamp.connect(this.outputNode);
        this.outputNode.connect(destination);
    }
    
    public setVolume(volume: number) {
        this.outputNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
    }

    async init(): Promise<boolean> {
        return this.loadInstrument('acousticGuitarSolo', ACOUSTIC_GUITAR_SOLO_SAMPLES, ACOUSTIC_GUITAR_SLIDE_SAMPLES);
    }

    async loadInstrument(instrumentName: string, sampleMap: any, slideSamples: string[]): Promise<boolean> {
        if (this.isInitialized || this.isLoading) return true;
        this.isLoading = true;
        try {
            const loadedBuffers = new Map<number, any>();
            const loadSample = async (url: string) => {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                return await this.audioContext.decodeAudioData(arrayBuffer);
            };
            
            const notePromises = Object.entries(sampleMap).map(async ([noteStr, techniques]: [string, any]) => {
                const midi = this.noteToMidi(noteStr);
                if (midi === null) return;
                loadedBuffers.set(midi, {});
                for (const [tech, url] of Object.entries(techniques)) {
                    if (url) loadedBuffers.get(midi)[tech] = await loadSample(url as string);
                }
            });

            const slidePromises = slideSamples.map(async (url) => {
                this.slideBuffers.push(await loadSample(url));
            });

            await Promise.all([...notePromises, ...slidePromises]);
            this.instruments.set(instrumentName, { buffers: loadedBuffers });
            this.isInitialized = true;
            this.isLoading = false;
            return true;
        } catch (error) {
            this.isLoading = false;
            return false;
        }
    }
    
    public schedule(notes: Note[], time: number) {
        const instrument = this.instruments.get('acousticGuitarSolo');
        if (!this.isInitialized || !instrument) return;

        notes.forEach((note, index) => {
            const tech: Technique = (note as any).technique || 'pick';
            const { buffer, midi: sampleMidi } = this.findBestSample(instrument, note.midi, tech);
            if (!buffer) return;

            const startTime = time + note.time;
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            const gainNode = this.audioContext.createGain();
            source.connect(gainNode).connect(this.preamp);

            source.playbackRate.value = Math.pow(2, (note.midi - sampleMidi) / 12);
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(note.velocity || 0.7, startTime + 0.005);
            
            // #ЗАЧЕМ: Закон Сохранения Хвостов.
            // #ЧТО: Удалено принудительное завершение сэмпла. Нота звучит до конца буфера.
            gainNode.gain.setTargetAtTime(0, startTime + 15.0, 0.8);
            
            source.start(startTime);
            this.activeSources.add(source);
            source.onended = () => {
                this.activeSources.delete(source);
                try { gainNode.disconnect(); } catch(e){} 
            };
        });
    }

    private findBestSample(instrument: any, targetMidi: number, technique: Technique): { buffer: AudioBuffer | null, midi: number } {
        const availableMidiNotes = Array.from(instrument.buffers.keys()) as number[];
        if (availableMidiNotes.length === 0) return { buffer: null, midi: targetMidi };
        const closestMidi = availableMidiNotes.reduce((prev, curr) => 
            Math.abs(curr - targetMidi) < Math.abs(prev - targetMidi) ? curr : prev
        );
        const techSamples = instrument.buffers.get(closestMidi);
        return { buffer: techSamples[technique] || techSamples.pluck || techSamples.pick, midi: closestMidi };
    }

    private noteToMidi(note: string): number | null {
        const noteMap: Record<string, number> = { 'C':0,'C#':1,'DB':1,'D':2,'D#':3,'EB':3,'E':4,'F':5,'F#':6,'GB':6,'G':7,'G#':8,'AB':8,'A':9,'A#':10,'BB':10,'B':11 };
        const match = note.match(/([A-G])([#b]?)(-?\d+)/);
        if (!match) return null;
        return 12 * (parseInt(match[3]) + 1) + noteMap[match[1].toUpperCase() + match[2]];
    }

    public stopAll() {
        this.activeSources.forEach(source => {
            try {
                source.stop(0);
            } catch(e) {}
        });
        this.activeSources.clear();
    }

    public dispose() { this.stopAll(); this.outputNode.disconnect(); }
}
