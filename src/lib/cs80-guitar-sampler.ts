import type { Note } from "@/types/music";
import { dbToGain } from './guitar-loudness';
import { vault } from './audio-cache';

/**
 * @fileOverview Сэмплер Yamaha CS-80 V4.7 — "Vault Integration".
 * #ЗАЧЕМ: Перевод на оффлайн-кэш (ПЛАН №2220).
 */

const CS80_NOTE_NAMES = ["c", "c", "d", "eb", "e", "f", "f", "g", "g", "a", "bb", "b"];

const getCS80Path = (layer: 1 | 2, midi: number) => {
    const octave = Math.floor(midi / 12) - 1;
    const name = CS80_NOTE_NAMES[midi % 12];
    const layerFolder = layer === 1 ? "norm_notes" : "long_notes";
    return `/assets/acoustic_guitar_samples/CS80/${layerFolder}/cs-80-guitar-${layer}-${midi}-${name}${octave}-vel-127.ogg`;
};

type CS80Layer = {
    norm: AudioBuffer;
    long: AudioBuffer;
};

export class CS80GuitarSampler {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private buffers = new Map<number, CS80Layer>();
    public isInitialized = false;
    private isLoading = false;
    private preamp: GainNode;
    private outputTrim: GainNode;
    private activeSources: Set<AudioBufferSourceNode> = new Set();

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 0.4; 

        this.outputTrim = this.audioContext.createGain();
        this.outputTrim.gain.value = 1.0;

        this.preamp.connect(this.outputTrim);
        this.outputTrim.connect(this.destination);
    }

    public setOutputTrim(db: number) {
        if (isFinite(db)) this.outputTrim.gain.setTargetAtTime(dbToGain(db), this.audioContext.currentTime, 0.02);
    }

    public setPreampGain(gain: number) {
        if (isFinite(gain)) {
            this.preamp.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.02);
        }
    }

    async init(): Promise<boolean> {
        if (this.isInitialized || this.isLoading) return true;
        this.isLoading = true;
        
        try {
            const loadSample = async (url: string) => {
                const arrayBuffer = await vault.fetch(url);
                return await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
            };

            const loadPromises: Promise<void>[] = [];
            for (let midi = 36; midi <= 96; midi++) {
                loadPromises.push((async () => {
                    const [norm, long] = await Promise.all([
                        loadSample(getCS80Path(1, midi)),
                        loadSample(getCS80Path(2, midi))
                    ]);
                    this.buffers.set(midi, { norm, long });
                })());
            }

            await Promise.all(loadPromises);
            this.isInitialized = true;
            this.isLoading = false;
            return true;
        } catch (error) {
            this.isLoading = false;
            return false;
        }
    }

    public schedule(notes: Note[], time: number, tempo: number = 72) {
        if (!this.isInitialized) return;
        const barDuration = (60 / tempo) * 4;

        notes.forEach(note => {
            const layer = this.buffers.get(note.midi);
            const isLong = (note.duration || 0) >= barDuration;

            if (!layer) {
                this.playClosest(note, time, isLong, tempo);
                return;
            }

            const buffer = isLong ? layer.long : layer.norm;
            this.playSample(buffer, note.midi, note.midi, time + note.time, note.velocity || 0.7, tempo);
        });
    }

    private playClosest(note: Note, time: number, isLong: boolean, tempo: number = 72) {
        const keys = Array.from(this.buffers.keys());
        if (keys.length === 0) return;
        const closestMidi = keys.reduce((prev, curr) => 
            Math.abs(curr - note.midi) < Math.abs(prev - note.midi) ? curr : prev
        );
        const layer = this.buffers.get(closestMidi);
        if (!layer) return;

        const buffer = isLong ? layer.long : layer.norm;
        this.playSample(buffer, closestMidi, note.midi, time + note.time, note.velocity || 0.7);
    }

    private playSample(buffer: AudioBuffer, sampleMidi: number, targetMidi: number, startTime: number, velocity: number, tempo: number = 72) {
        if (!isFinite(startTime) || !isFinite(velocity)) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = this.audioContext.createGain();

        source.connect(gainNode).connect(this.preamp);

        const pitchRate = Math.pow(2, (targetMidi - sampleMidi) / 12);
        const tempoScale = tempo / 72;
        const playbackRate = (isFinite(pitchRate) ? pitchRate : 1.0) * tempoScale;
        source.playbackRate.value = playbackRate;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(velocity, startTime + 0.01);
        gainNode.gain.setTargetAtTime(0, startTime + 3.0, 0.4);

        source.start(startTime);
        this.activeSources.add(source);

        source.onended = () => {
            this.activeSources.delete(source);
            try { source.disconnect(); } catch(e) {}
            try { gainNode.disconnect(); } catch(e) {}
        };
    }

    public stopAll() {
        this.activeSources.forEach(source => {
            try { source.stop(0); } catch(e) {}
        });
        this.activeSources.clear();
    }

    public dispose() { this.stopAll(); this.preamp.disconnect(); this.outputTrim.disconnect(); }
}