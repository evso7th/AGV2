
import type { Note, Technique } from "@/types/music";

// #ЗАЧЕМ: Эта карта содержит полный список сэмплов для гитары 'black',
//          чтобы обеспечить максимальное разнообразие звучания.
const BLACK_GUITAR_ORD_SAMPLES: Record<string, string> = {
    'c6_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_c6_p_rr2.ogg',
    'gb4_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_gb4_mf_rr1.ogg',
    'c5_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_c5_p_rr2.ogg',
    'e6_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_e6_mf_rr1.ogg',
    'a4_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_a4_f_rr1.ogg',
    'c6_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_c6_f_rr2.ogg',
    'gb4_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_gb4_f_rr1.ogg',
    'bb5_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_bb5_p_rr1.ogg',
    'eb5_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_eb5_p_rr2.ogg',
    'eb6_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_eb6_mf_rr1.ogg',
    'g3_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_g3_p_rr1.ogg',
    'gb6_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_gb6_mf_rr2.ogg',
    'c5_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_c5_f_rr3.ogg',
    'f4_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_f4_mf_rr4.ogg',
    'a3_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_a3_f_rr2.ogg',
    'b3_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_b3_p_rr1.ogg',
    'db6_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_db6_mf_rr4.ogg',
    'bb6_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_bb6_p_rr2.ogg',
    'eb6_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_eb6_f_rr3.ogg',
    'db6_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_db6_mf_rr1.ogg',
    'eb4_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_eb4_mf_rr2.ogg',
    'bb3_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_bb3_f_rr4.ogg',
    'f6_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_f6_f_rr1.ogg',
    'bb3_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_bb3_f_rr3.ogg',
    'db4_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_db4_p_rr2.ogg',
    'a4_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_a4_mf_rr2.ogg',
    'e3_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_e3_p_rr2.ogg',
    'c6_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_c6_f_rr4.ogg',
    'f4_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_f4_mf_rr1.ogg',
    'c6_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_c6_p_rr1.ogg',
    'd6_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_d6_p_rr2.ogg',
    'd6_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_d6_mf_rr1.ogg',
    'ab4_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_ab4_f_rr4.ogg',
    'db7_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_db7_mf_rr1.ogg',
    'd6_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_d6_f_rr1.ogg',
    'b3_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_b3_mf_rr1.ogg',
    'a6_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_a6_f_rr2.ogg',
    'd4_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_d4_f_rr2.ogg',
    'c7_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_c7_f_rr1.ogg',
    'e3_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_e3_f_rr3.ogg',
    'b3_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_b3_f_rr1.ogg',
    'b3_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_b3_mf_rr3.ogg',
    'd5_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_d5_p_rr2.ogg',
    'db7_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_db7_f_rr2.ogg',
    'f4_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_f4_f_rr1.ogg',
    'a5_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_a5_p_rr2.ogg',
    'b5_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_b5_f_rr3.ogg',
    'f6_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_f6_p_rr2.ogg',
    'e4_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_e4_p_rr1.ogg',
    'a5_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_a5_f_rr4.ogg',
    'g3_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_g3_mf_rr3.ogg',
    'g5_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_g5_mf_rr4.ogg',
    'g6_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_g6_mf_rr1.ogg',
    'db5_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_db5_f_rr2.ogg',
    'gb3_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_gb3_mf_rr3.ogg',
    'c7_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_c7_p_rr1.ogg',
    'f5_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_f5_mf_rr4.ogg',
    'a3_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_a3_mf_rr3.ogg',
    'f3_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_f3_mf_rr4.ogg',
    'f5_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_f5_f_rr2.ogg',
    'f5_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_f5_mf_rr3.ogg',
    'db7_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_db7_p_rr1.ogg',
    'd4_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_d4_f_rr3.ogg',
    'f3_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_f3_p_rr2.ogg',
    'g4_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_g4_f_rr3.ogg',
    'eb4_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_eb4_p_rr2.ogg',
    'g6_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_g6_f_rr2.ogg',
    'ab5_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_ab5_f_rr3.ogg',
    'bb6_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_bb6_f_rr2.ogg',
    'db6_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_db6_f_rr2.ogg',
    'g3_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_g3_mf_rr1.ogg',
    'ab6_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_ab6_p_rr1.ogg',
    'f4_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_f4_mf_rr2.ogg',
    'ab4_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_ab4_f_rr2.ogg',
    'bb6_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_bb6_p_rr1.ogg',
    'b5_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_b5_mf_rr3.ogg',
    'ab4_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_ab4_p_rr1.ogg',
    'a4_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_a4_f_rr3.ogg',
    'c6_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_c6_mf_rr4.ogg',
    'bb5_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_bb5_f_rr3.ogg',
    'ab4_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_ab4_f_rr3.ogg',
    'e5_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_e5_p_rr2.ogg',
    'b5_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_b5_p_rr2.ogg',
    'c6_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_c6_mf_rr3.ogg',
    'gb6_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_gb6_f_rr2.ogg',
    'bb5_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_bb5_mf_rr3.ogg',
    'db4_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_db4_p_rr1.ogg',
    'db4_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_db4_f_rr1.ogg',
    'ab3_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_ab3_f_rr3.ogg',
    'b4_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_b4_mf_rr2.ogg',
    'db5_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_db5_f_rr4.ogg',
    'gb5_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_gb5_mf_rr2.ogg',
    'b6_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_b6_p_rr2.ogg',
    'db4_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_db4_mf_rr3.ogg',
    'd4_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_d4_f_rr1.ogg',
    'ab5_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_ab5_f_rr1.ogg',
    'ab3_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_ab3_mf_rr4.ogg',
    'db5_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_db5_f_rr1.ogg',
    'ab3_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_ab3_mf_rr3.ogg',
    'ab4_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_ab4_mf_rr4.ogg',
    'c7_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_c7_p_rr2.ogg',
    'db7_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_db7_f_rr1.ogg',
    'g5_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_g5_mf_rr2.ogg',
    'db6_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_db6_f_rr4.ogg',
    'db4_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_db4_mf_rr2.ogg',
    'c4_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_c4_p_rr1.ogg',
    'eb5_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_eb5_mf_rr2.ogg',
    'bb6_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_bb6_mf_rr2.ogg',
    'c4_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_c4_f_rr4.ogg',
    'f6_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_f6_mf_rr1.ogg',
    'c4_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_c4_f_rr3.ogg',
    'f4_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_f4_f_rr4.ogg',
    'f5_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_f5_mf_rr2.ogg',
    'db7_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_db7_mf_rr2.ogg',
    'b3_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_b3_mf_rr2.ogg',
    'f5_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_f5_p_rr2.ogg',
    'bb5_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_bb5_p_rr2.ogg',
    'b4_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_b4_f_rr1.ogg',
    'a5_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_a5_mf_rr1.ogg',
    'e4_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_e4_f_rr1.ogg',
    'e5_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_e5_f_rr2.ogg',
    'f3_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_f3_mf_rr2.ogg',
    'e5_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_e5_f_rr3.ogg',
    'c4_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_c4_mf_rr2.ogg',
    'a3_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_a3_p_rr1.ogg',
    'g4_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_g4_f_rr4.ogg',
    'gb3_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_gb3_p_rr2.ogg',
};

type SamplerInstrument = {
    buffers: Map<number, AudioBuffer>;
};

export class BlackGuitarSampler {
    private audioContext: AudioContext;
    private outputNode: GainNode;
    private instruments = new Map<string, SamplerInstrument>();
    public isInitialized = false;
    private preamp: GainNode;
    private isLoading = false;

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
        return this.loadInstrument('blackAcoustic', BLACK_GUITAR_ORD_SAMPLES);
    }

    async loadInstrument(instrumentName: 'blackAcoustic', sampleMap: Record<string, string>): Promise<boolean> {
        if (this.isInitialized || this.isLoading) return true;
        this.isLoading = true;

        if (this.instruments.has(instrumentName)) {
            this.isLoading = false;
            return true;
        }

        try {
            const loadedBuffers = new Map<number, AudioBuffer>();
            
            const loadSample = async (url: string) => {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                return await this.audioContext.decodeAudioData(arrayBuffer);
            };
            
            const notePromises = Object.entries(sampleMap).map(async ([key, url]) => {
                const midi = this.noteToMidi(key);
                if (midi === null) {
                    console.warn(`[BlackGuitarSampler] Could not parse MIDI from key: ${key}`);
                    return;
                };

                try {
                    const buffer = await loadSample(url);
                    loadedBuffers.set(midi, buffer);
                } catch(e) { console.error(`Error loading sample for ${key}`, e); }
            });

            await Promise.all(notePromises);
            
            this.instruments.set(instrumentName, { buffers: loadedBuffers });
            console.log(`[BlackGuitarSampler] Instrument "${instrumentName}" loaded with ${loadedBuffers.size} samples.`);
            this.isInitialized = true;
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error(`[BlackGuitarSampler] Failed to load instrument "${instrumentName}":`, error);
            this.isLoading = false;
            return false;
        }
    }
    
    public schedule(notes: Note[], time: number) {
        const instrument = this.instruments.get('blackAcoustic');
        if (!this.isInitialized || !instrument) return;

        notes.forEach(note => {
            // Ignore technique, find closest note from the 'ord' samples.
            const { buffer, midi: sampleMidi } = this.findBestSample(instrument, note.midi);
            if (!buffer) return;

            const noteStartTime = time + note.time;

            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(note.velocity ?? 0.7, this.audioContext.currentTime);

            source.connect(gainNode);
            gainNode.connect(this.preamp);

            const playbackRate = Math.pow(2, (note.midi - sampleMidi) / 12);
            source.playbackRate.value = playbackRate;
            
            source.start(noteStartTime);
        });
    }

    private findBestSample(instrument: SamplerInstrument, targetMidi: number): { buffer: AudioBuffer | null, midi: number } {
        const availableMidiNotes = Array.from(instrument.buffers.keys());
        
        if (availableMidiNotes.length === 0) return { buffer: null, midi: targetMidi };
        const closestMidi = availableMidiNotes.reduce((prev, curr) => 
            Math.abs(curr - targetMidi) < Math.abs(prev - targetMidi) ? curr : prev
        );

        const sampleBuffer = instrument.buffers.get(closestMidi);
        
        return { buffer: sampleBuffer || null, midi: closestMidi };
    }

    private noteToMidi(key: string): number | null {
        const cleanedKey = key.toLowerCase().replace(/_p|_f|_mf|_rr\d/g, '');
        const match = cleanedKey.match(/([a-g][b#]?\d+)/);
        if (!match) return null;
        
        const noteStr = match[1];
        const noteMatch = noteStr.match(/([a-g])(b|#)?(\d)/);
        if (!noteMatch) return null;

        let [, name, accidental, octaveStr] = noteMatch;
        const octave = parseInt(octaveStr, 10);

        let noteValue = 0;
        switch (name) {
            case 'c': noteValue = 0; break;
            case 'd': noteValue = 2; break;
            case 'e': noteValue = 4; break;
            case 'f': noteValue = 5; break;
            case 'g': noteValue = 7; break;
            case 'a': noteValue = 9; break;
            case 'b': noteValue = 11; break;
        }

        if (accidental === '#') noteValue++;
        if (accidental === 'b') noteValue--;

        return 12 * (octave + 1) + noteValue;
    }


    public stopAll() {
        // One-shot samples, no central stop needed.
    }

    public dispose() {
        this.outputNode.disconnect();
    }
}
