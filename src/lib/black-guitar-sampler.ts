import type { Note, Technique } from "@/types/music";
import { GUITAR_PATTERNS } from './assets/guitar-patterns';
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';

/**
 * #ЗАЧЕМ: Сэмплер Black Acoustic V4.3 — "Melodic Silk Update".
 * #ЧТО: ПЛАН №855 — Атака смягчена до 22мс для устранения эффекта пулемета в мелодии.
 */

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
        { m: 52, key: 'e3', layers: { p: 3, mf: 3, f: 3 } },
        { m: 53, key: 'f3', layers: { p: 1, mf: 1, f: 1 } },
        { m: 55, key: 'g3', layers: { p: 1, mf: 1, f: 1 } },
        { m: 57, key: 'a3', layers: { p: 1, mf: 3, f: 4 } },
        { m: 59, key: 'b3', layers: { p: 3, mf: 3, f: 3 } },
        { m: 60, key: 'c4', layers: { p: 2, mf: 2, f: 2 } },
        { m: 64, key: 'e4', layers: { p: 1, mf: 1, f: 1 } },
        { m: 65, key: 'f4', layers: { p: 1, mf: 1, f: 1 } },
        { m: 67, key: 'g4', layers: { p: 2, mf: 2, f: 2 } },
        { m: 69, key: 'a4', layers: { p: 2, mf: 2, f: 2 } },
        { m: 71, key: 'b4', layers: { p: 2, mf: 2, f: 2 } },
        { m: 72, key: 'c5', layers: { p: 3, mf: 3, f: 3 } },
        { m: 74, key: 'd5', layers: { p: 1, mf: 1, f: 1 } },
        { m: 76, key: 'e5', layers: { p: 1, mf: 1, f: 1 } },
        { m: 77, key: 'f5', layers: { p: 3, mf: 3, f: 3 } },
        { m: 79, key: 'g5', layers: { p: 2, mf: 2, f: 2 } },
        { m: 81, key: 'a5', layers: { p: 2, mf: 2, f: 2 } },
        { m: 83, key: 'b5', layers: { p: 2, mf: 2, f: 2 } },
        { m: 84, key: 'c6', layers: { p: 1, mf: 1, f: 1 } },
        { m: 86, key: 'd6', layers: { p: 1, mf: 1, f: 1 } },
        { m: 88, key: 'e6', layers: { p: 1, mf: 1, f: 1 } },
    ]
};

export class BlackGuitarSampler {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private noteBuffers = new Map<number, NoteBuffers>();
    public isInitialized = false;
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
        if (isFinite(gain)) {
            this.preamp.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.02);
        }
    }

    async init(): Promise<boolean> {
        if (this.isInitialized || this.isLoading) return true;
        this.isLoading = true;

        try {
            const loadSample = async (url: string) => {
                const response = await fetch(url);
                if (!response.ok) return null;
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                return audioBuffer;
            };

            const loadPromises: Promise<void>[] = [];

            BLACK_GUITAR_MANIFEST.notes.forEach(noteDef => {
                const noteInfo: NoteBuffers = { p: [], mf: [], f: [] };
                this.noteBuffers.set(noteDef.m, noteInfo);

                (['p', 'mf', 'f'] as VelocityLayer[]).forEach(layer => {
                    const count = noteDef.layers[layer];
                    for (let rr = 1; rr <= count; rr++) {
                        const fileName = `twang_${noteDef.key}_${layer}_rr${rr}.ogg`;
                        const url = `/assets/acoustic_guitar_samples/black/ord/${fileName}`;
                        loadPromises.push(loadSample(url).then(buf => {
                            if (buf) noteInfo[layer].push({ buffer: buf, name: fileName });
                        }));
                    }
                });
            });

            await Promise.all(loadPromises);
            this.isInitialized = true;
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error('[BlackSampler] Init failed:', error);
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
        if (!patternData) return;

        const voicingName = note.params?.voicingName || 'E7_open';
        const voicing = BLUES_GUITAR_VOICINGS[voicingName];
        if (!voicing) return;

        const beatDuration = 60 / tempo;
        const ticksPerBeat = 3;

        for (const event of patternData.pattern) {
            for (const tick of event.ticks) {
                const noteTimeInBar = (tick / ticksPerBeat) * beatDuration;
                for (const stringIndex of event.stringIndices) {
                    if (stringIndex < voicing.length) {
                        const midiNote = voicing[voicing.length - 1 - stringIndex];
                        this.playSingleNote({
                            ...note,
                            midi: midiNote,
                            time: noteTimeInBar + ((patternData.rollDuration / ticksPerBeat) * beatDuration * (voicing.length - 1 - stringIndex))
                        }, barStartTime, false);
                    }
                }
            }
        }
    }

    private playSingleNote(note: Note, startTime: number, isTransientMode: boolean = false) {
        const velocity = note.velocity || 0.7;
        const mood = note.params?.mood;
        const { buffer, sampleMidi, name } = this.findBestDynamicSample(note.midi, velocity, mood);
        if (!buffer) return;

        this.playSample(buffer, sampleMidi, note.midi, startTime + (note.time || 0), velocity, name, mood, isTransientMode);
    }

    private findBestDynamicSample(targetMidi: number, velocity: number, mood?: string): { buffer: AudioBuffer | null, sampleMidi: number, name: string } {
        const availableMidis = Array.from(this.noteBuffers.keys());
        if (availableMidis.length === 0) return { buffer: null, sampleMidi: targetMidi, name: 'none' };

        const closestMidi = availableMidis.reduce((prev, curr) => 
            Math.abs(curr - targetMidi) < Math.abs(prev - targetMidi) ? curr : prev
        );

        const layers = this.noteBuffers.get(closestMidi);
        if (!layers) return { buffer: null, sampleMidi: closestMidi, name: 'none' };

        let layerKey: VelocityLayer = 'mf';
        const isSoftMood = mood === 'melancholic' || mood === 'calm' || mood === 'gloomy' || mood === 'dreamy';

        if (isSoftMood) {
            layerKey = Math.random() < 0.15 ? 'mf' : 'p';
        } else {
            if (velocity < 0.45) layerKey = 'p';
            else if (velocity > 0.8) layerKey = 'f';
            else layerKey = 'mf';
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

        const fixedGain = 1.0; 
        gainNode.gain.setValueAtTime(0, startTime);
        // #ЗАЧЕМ: Мягкая атака (ПЛАН №855). С 0.005 до 0.022 для ликвидации стаккато.
        gainNode.gain.linearRampToValueAtTime(fixedGain, startTime + 0.022);
        
        if (isTransientMode) {
            gainNode.gain.setTargetAtTime(0.0001, startTime + 0.02, 0.005);
            source.start(startTime);
            source.stop(startTime + 0.05);
        } else {
            gainNode.gain.setTargetAtTime(0, startTime + 15.0, 0.8);
            source.start(startTime);
        }
        
        console.log(`%c[BlackSampler] Playing: ${name} | Context: ${mood || 'default'} | Velocity: ${velocity.toFixed(2)}`, 'color: #DA70D6');

        this.activeSources.add(source);
        source.onended = () => {
            this.activeSources.delete(source);
            try { gainNode.disconnect(); } catch(e) {}
        };
    }

    public stopAll() {
        this.activeSources.forEach(source => {
            try { source.stop(0); } catch(e) {}
        });
        this.activeSources.clear();
    }

    public dispose() { this.stopAll(); this.preamp.disconnect(); }
}
