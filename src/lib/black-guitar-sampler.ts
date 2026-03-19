import type { Note, Technique } from "@/types/music";
import { GUITAR_PATTERNS } from './assets/guitar-patterns';
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';

type VelocityLayer = 'p' | 'mf' | 'f';

interface NamedBuffer {
    buffer: AudioBuffer;
    name: string;
}

interface NoteBuffers {
    p: NamedBuffer[];
    mf: NamedBuffer[];
    f: NamedBuffer[];
}

const BLACK_GUITAR_MANIFEST = {
    notes: [
        { m: 52, key: 'e3', layers: { f: [2, 3], mf: [], p: [2] } },
        { m: 53, key: 'f3', layers: { f: [], mf: [2, 4], p: [1, 2] } },
        { m: 54, key: 'gb3', layers: { f: [2], mf: [3], p: [2] } },
        { m: 55, key: 'g3', layers: { f: [1], mf: [1, 3], p: [1] } },
        { m: 56, key: 'ab3', layers: { f: [3], mf: [3, 4], p: [] } },
        { m: 57, key: 'a3', layers: { f: [2, 4], mf: [3], p: [1] } },
        { m: 58, key: 'bb3', layers: { f: [3, 4], mf: [4], p: [1] } },
        { m: 59, key: 'b3', layers: { f: [1], mf: [1, 2, 3, 4], p: [1] } },
        { m: 60, key: 'c4', layers: { f: [2, 3, 4], mf: [2], p: [1, 2] } },
        { m: 61, key: 'db4', layers: { f: [1], mf: [2, 3], p: [1, 2] } },
        { m: 62, key: 'd4', layers: { f: [1, 2, 3, 4], mf: [3], p: [] } },
        { m: 63, key: 'eb4', layers: { f: [], mf: [2], p: [1, 2] } },
        { m: 64, key: 'e4', layers: { f: [1, 2], mf: [1, 4], p: [1] } },
        { m: 65, key: 'f4', layers: { f: [1, 4], mf: [1, 2, 3, 4], p: [] } },
        { m: 66, key: 'gb4', layers: { f: [1, 3], mf: [1], p: [] } },
        { m: 67, key: 'g4', layers: { f: [3, 4], mf: [2, 4], p: [] } },
        { m: 68, key: 'ab4', layers: { f: [2, 3, 4], mf: [2, 4], p: [1] } },
        { m: 69, key: 'a4', layers: { f: [1, 3], mf: [2, 3], p: [2] } },
        { m: 70, key: 'bb4', layers: { f: [], mf: [2, 3, 4], p: [] } },
        { m: 71, key: 'b4', layers: { f: [1], mf: [2], p: [1] } },
        { m: 72, key: 'c5', layers: { f: [3], mf: [3], p: [2] } },
        { m: 73, key: 'db5', layers: { f: [1, 2, 4], mf: [3], p: [2] } },
        { m: 74, key: 'd5', layers: { f: [1], mf: [], p: [2] } },
        { m: 75, key: 'eb5', layers: { f: [2], mf: [1, 2], p: [2] } },
        { m: 76, key: 'e5', layers: { f: [1, 2, 3], mf: [], p: [1, 2] } },
        { m: 77, key: 'f5', layers: { f: [1, 2, 4], mf: [2, 3, 4], p: [2] } },
        { m: 78, key: 'gb5', layers: { f: [4], mf: [2], p: [] } },
        { m: 79, key: 'g5', layers: { f: [], mf: [2, 4], p: [2] } },
        { m: 80, key: 'ab5', layers: { f: [1, 3, 4], mf: [], p: [1, 2] } },
        { m: 81, key: 'a5', layers: { f: [2, 3, 4], mf: [1, 2, 4], p: [2] } },
        { m: 82, key: 'bb5', layers: { f: [3], mf: [1, 3], p: [1, 2] } },
        { m: 83, key: 'b5', layers: { f: [2, 3], mf: [1, 3], p: [2] } },
        { m: 84, key: 'c6', layers: { f: [1, 2, 4], mf: [1, 2, 3, 4], p: [1, 2] } },
        { m: 85, key: 'db6', layers: { f: [2, 4], mf: [1, 4], p: [] } },
        { m: 86, key: 'd6', layers: { f: [1, 4], mf: [1], p: [2] } },
        { m: 87, key: 'eb6', layers: { f: [1, 3, 4], mf: [1, 2], p: [1, 2] } },
        { m: 88, key: 'e6', layers: { f: [], mf: [1], p: [1] } },
        { m: 89, key: 'f6', layers: { f: [1], mf: [1], p: [1, 2] } },
        { m: 90, key: 'gb6', layers: { f: [2], mf: [2], p: [] } },
        { m: 91, key: 'g6', layers: { f: [2], mf: [1, 2], p: [] } },
        { m: 92, key: 'ab6', layers: { f: [1], mf: [], p: [1] } },
        { m: 93, key: 'a6', layers: { f: [2], mf: [], p: [] } },
        { m: 94, key: 'bb6', layers: { f: [2], mf: [2], p: [1, 2] } },
        { m: 95, key: 'b6', layers: { f: [], mf: [2], p: [2] } },
        { m: 96, key: 'c7', layers: { f: [1], mf: [], p: [1, 2] } },
        { m: 97, key: 'db7', layers: { f: [1, 2], mf: [1, 2], p: [1, 2] } },
        { m: 98, key: 'd7', layers: { f: [2], mf: [2], p: [] } },
    ]
};

export class BlackGuitarSampler {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private noteBuffers = new Map<number, NoteBuffers>();
    public isInitialized = false;
    private isFullyInitialized = false;
    private isLoading = false;
    private preamp: GainNode;
    private activeSources: Set<AudioBufferSourceNode> = new Set();
    
    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 0.15; 
        this.preamp.connect(this.destination);
    }

    public setPreampGain(gain: number) {
        if (isFinite(gain)) this.preamp.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.02);
    }

    async init(minimal = false): Promise<boolean> {
        if (this.isFullyInitialized) return true;
        if (minimal && this.isInitialized) return true;
        this.isLoading = true;

        try {
            const loadSample = async (url: string) => {
                const response = await fetch(url);
                if (!response.ok) return null;
                const arrayBuffer = await response.arrayBuffer();
                return await this.audioContext.decodeAudioData(arrayBuffer);
            };

            const loadPromises: Promise<void>[] = [];

            BLACK_GUITAR_MANIFEST.notes.forEach(noteDef => {
                if (!this.noteBuffers.has(noteDef.m)) {
                    this.noteBuffers.set(noteDef.m, { p: [], mf: [], f: [] });
                }
                const noteInfo = this.noteBuffers.get(noteDef.m)!;

                (['p', 'mf', 'f'] as VelocityLayer[]).forEach(layer => {
                    if (minimal && layer !== 'mf') return;

                    const rrIndices = (noteDef.layers as any)[layer] as number[];
                    const targetIndices = minimal ? (rrIndices.length > 0 ? [rrIndices[0]] : []) : rrIndices;
                    
                    targetIndices.forEach(rrIndex => {
                        const fileName = `twang_${noteDef.key}_${layer}_rr${rrIndex}.ogg`;
                        const url = `/assets/acoustic_guitar_samples/black/ord/${fileName}`;
                        
                        if (noteInfo[layer].some(b => b.name === fileName)) return;

                        loadPromises.push(loadSample(url).then(buf => {
                            if (buf) noteInfo[layer].push({ buffer: buf, name: fileName });
                        }));
                    });
                });
            });

            await Promise.all(loadPromises);
            this.isInitialized = true;
            if (!minimal) this.isFullyInitialized = true;
            this.isLoading = false;
            return true;
        } catch (error) {
            this.isLoading = false;
            return false;
        }
    }
    
    public schedule(notes: Note[], time: number, tempo: number = 120, isTransientMode: boolean = false) {
        if (!this.isInitialized) return;
        notes.forEach(note => {
            if (!isTransientMode && note.technique && (note.technique.startsWith('F_') || note.technique.startsWith('S_'))) {
                this.playPattern(note, time, tempo);
            } else {
                this.playSingleNote(note, time, isTransientMode);
            }
        });
    }

    private playPattern(note: Note, barStartTime: number, tempo: number) {
        const patternName = note.technique as string;
        const patternData = GUITAR_PATTERNS[patternName];
        const voicing = BLUES_GUITAR_VOICINGS[note.params?.voicingName || 'E7_open'];
        if (!patternData || !voicing) return;
        const beatDuration = 60 / tempo;
        const ticksPerBeat = 3;
        for (const event of patternData.pattern) {
            for (const tick of event.ticks) {
                const noteTimeInBar = (tick / ticksPerBeat) * beatDuration;
                for (const stringIndex of event.stringIndices) {
                    if (stringIndex < voicing.length) {
                        const midiNote = voicing[voicing.length - 1 - stringIndex];
                        this.playSingleNote({ ...note, midi: midiNote, time: noteTimeInBar + ((patternData.rollDuration / ticksPerBeat) * beatDuration * (voicing.length - 1 - stringIndex)) }, barStartTime, false);
                    }
                }
            }
        }
    }

    private playSingleNote(note: Note, startTime: number, isTransientMode: boolean = false) {
        const velocity = note.velocity || 0.7;
        const mood = note.params?.mood;
        const { buffer, sampleMidi, name } = this.findBestDynamicSample(note.midi, velocity, mood);
        if (buffer) this.playSample(buffer, sampleMidi, note.midi, startTime + (note.time || 0), velocity, name, mood, isTransientMode);
    }

    private findBestDynamicSample(targetMidi: number, velocity: number, mood?: string): { buffer: AudioBuffer | null, sampleMidi: number, name: string } {
        const availableMidis = Array.from(this.noteBuffers.keys());
        if (availableMidis.length === 0) return { buffer: null, sampleMidi: targetMidi, name: 'none' };
        const closestMidi = availableMidis.reduce((prev, curr) => Math.abs(curr - targetMidi) < Math.abs(prev - targetMidi) ? curr : prev);
        const layers = this.noteBuffers.get(closestMidi);
        if (!layers) return { buffer: null, sampleMidi: closestMidi, name: 'none' };
        
        let layerKey: VelocityLayer = 'mf';
        const isSoftMood = mood === 'melancholic' || mood === 'calm' || mood === 'gloomy' || mood === 'dreamy';
        
        if (isSoftMood) {
            layerKey = (layers.p.length > 0 && Math.random() < 0.85) ? 'p' : (layers.mf.length > 0 ? 'mf' : 'f');
        } else {
            if (velocity < 0.45 && layers.p.length > 0) layerKey = 'p';
            else if (velocity > 0.8 && layers.f.length > 0) layerKey = 'f';
            else layerKey = layers.mf.length > 0 ? 'mf' : (layers.f.length > 0 ? 'f' : 'p');
        }
        
        const pool = layers[layerKey].length > 0 ? layers[layerKey] : (layers.mf.length > 0 ? layers.mf : layers.f);
        if (pool.length === 0) return { buffer: null, sampleMidi: closestMidi, name: 'none' };
        const namedBuf = pool[Math.floor(Math.random() * pool.length)];
        return { buffer: namedBuf.buffer, sampleMidi: closestMidi, name: namedBuf.name };
    }
    
    private playSample(buffer: AudioBuffer, sampleMidi: number, targetMidi: number, startTime: number, velocity: number, name: string, mood?: string, isTransientMode: boolean = false) {
        if (!isFinite(startTime)) return;
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = this.audioContext.createGain();
        source.connect(gainNode).connect(this.preamp);
        const playbackRate = Math.pow(2, (targetMidi - sampleMidi) / 12);
        source.playbackRate.value = isFinite(playbackRate) ? playbackRate : 1.0;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(1.0, startTime + 0.022);
        
        if (isTransientMode) {
            // #ЗАЧЕМ: Сокращение длины транзиента до 12мс (ПЛАН №895).
            gainNode.gain.setTargetAtTime(0.0001, startTime + 0.012, 0.005);
            source.start(startTime);
            source.stop(startTime + 0.03);
        } else {
            gainNode.gain.setTargetAtTime(0, startTime + 15.0, 0.8);
            source.start(startTime);
        }
        this.activeSources.add(source);
        source.onended = () => { this.activeSources.delete(source); try { gainNode.disconnect(); } catch(e) {} };
    }

    public stopAll() {
        this.activeSources.forEach(source => { try { source.stop(0); } catch(e) {} });
        this.activeSources.clear();
    }

    public dispose() { this.stopAll(); this.preamp.disconnect(); }
}