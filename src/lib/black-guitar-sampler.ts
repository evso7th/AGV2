

import type { Note, Technique } from "@/types/music";
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';


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
    'ab4f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_ab4_f_rr3.ogg',
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
    'g4_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_g4_mf_rr2.ogg',
    'ab5_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_ab5_p_rr1.ogg',
    'f5_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_f5_f_rr1.ogg',
    'bb5_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_bb5_mf_rr1.ogg',
    'd4_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_d4_f_rr4.ogg',
    'eb6_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_eb6_f_rr1.ogg',
    'd7_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_d7_f_rr2.ogg',
    'e5_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_e5_p_rr1.ogg',
    'g3_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_g3_f_rr1.ogg',
    'f6_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_f6_p_rr1.ogg',
    'db7_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_db7_p_rr2.ogg',
    'a4_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_a4_p_rr2.ogg',
    'e4_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_e4_mf_rr4.ogg',
    'g5_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_g5_p_rr2.ogg',
    'c6_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_c6_mf_rr2.ogg',
    'db5_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_db5_mf_rr3.ogg',
    'eb5_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_eb5_mf_rr1.ogg',
    'eb6_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_eb6_mf_rr2.ogg',
    'b4_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_b4_p_rr1.ogg',
    'b6_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_b6_mf_rr2.ogg',
    'e3_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_e3_f_rr2.ogg',
    'eb6_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_eb6_f_rr4.ogg',
    'ab4_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_ab4_mf_rr2.ogg',
    'eb6_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_eb6_p_rr2.ogg',
    'a4_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_a4_mf_rr3.ogg',
    'g4_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_g4_mf_rr4.ogg',
    'bb3_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_bb3_p_rr1.ogg',
    'e5_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_e5_f_rr1.ogg',
    'g6_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_g6_mf_rr2.ogg',
    'a5_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_a5_mf_rr4.ogg',
    'a5_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_a5_mf_rr2.ogg',
    'db5_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_db5_p_rr2.ogg',
    'eb6_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_eb6_p_rr1.ogg',
    'd4_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_d4_mf_rr3.ogg',
    'eb4_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_eb4_p_rr1.ogg',
    'f5_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_f5_f_rr4.ogg',
    'eb5_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_eb5_f_rr2.ogg',
    'bb4_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_bb4_mf_rr2.ogg',
    'a3_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_a3_f_rr4.ogg',
    'a5_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_a5_f_rr2.ogg',
    'a5_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_a5_f_rr3.ogg',
    'bb4_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_bb4_mf_rr3.ogg',
    'd7_mf_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_d7_mf_rr2.ogg',
    'gb5_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_gb5_f_rr4.ogg',
    'f4_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_f4_mf_rr3.ogg',
    'e4_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_e4_f_rr2.ogg',
    'ab5_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_ab5_f_rr4.ogg',
    'd5_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_d5_f_rr1.ogg',
    'f3_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_f3_p_rr1.ogg',
    'c6_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_c6_f_rr1.ogg',
    'bb4_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_bb4_mf_rr4.ogg',
    'b5_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_b5_mf_rr1.ogg',
    'c4_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_c4_p_rr2.ogg',
    'e6_p_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_e6_p_rr1.ogg',
    'b3_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_b3_mf_rr4.ogg',
    'ab6_f_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_ab6_f_rr1.ogg',
    'bb3_mf_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_bb3_mf_rr4.ogg',
    'e4_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_e4_mf_rr1.ogg',
    'd6_f_rr4': '/assets/acoustic_guitar_samples/black/ord/twang_d6_f_rr4.ogg',
    'c6_mf_rr1': '/assets/acoustic_guitar_samples/black/ord/twang_c6_mf_rr1.ogg',
    'gb3_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_gb3_f_rr2.ogg',
    'c5_mf_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_c5_mf_rr3.ogg',
    'ab5_p_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_ab5_p_rr2.ogg',
    'gb4_f_rr3': '/assets/acoustic_guitar_samples/black/ord/twang_gb4_f_rr3.ogg',
    'c4_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_c4_f_rr2.ogg',
    'b5_f_rr2': '/assets/acoustic_guitar_samples/black/ord/twang_b5_f_rr2.ogg',
};

type SamplerInstrument = {
    buffers: Map<number, AudioBuffer>;
};

export class BlackGuitarSampler {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private instruments = new Map<string, SamplerInstrument>();
    public isInitialized = false;
    private isLoading = false;
    private preamp: GainNode;
    
    private distortion: WaveShaperNode;
    private delay: DelayNode;
    private feedback: GainNode;
    private chorusLFO: OscillatorNode;
    private chorusDepth: GainNode;
    private chorusDelay: DelayNode;
    private fxChainInput: GainNode;
    private wetMix: GainNode;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;

        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.0;

        // Distortion
        this.distortion = this.audioContext.createWaveShaper();
        this.distortion.curve = this.makeDistortionCurve(0.1);

        // Chorus
        this.chorusLFO = this.audioContext.createOscillator();
        this.chorusDepth = this.audioContext.createGain();
        this.chorusDelay = this.audioContext.createDelay(0.1);
        this.chorusLFO.type = 'sine';
        this.chorusLFO.frequency.value = 4;
        this.chorusDepth.gain.value = 0.005;
        this.chorusLFO.connect(this.chorusDepth);
        this.chorusDepth.connect(this.chorusDelay.delayTime);
        this.chorusLFO.start();

        // Delay
        this.delay = this.audioContext.createDelay(1.0);
        this.feedback = this.audioContext.createGain();
        this.wetMix = this.audioContext.createGain();
        this.delay.delayTime.value = 0.4;
        this.feedback.gain.value = 0.3;
        this.wetMix.gain.value = 0.35;

        // FX Chain Input
        this.fxChainInput = this.audioContext.createGain();

        // --- Audio Graph ---
        // DRY PATH: preamp -> destination
        this.preamp.connect(this.destination);
        
        // WET PATH: preamp -> fxChainInput -> distortion -> chorus -> delay -> wetMix -> destination
        this.preamp.connect(this.fxChainInput);
        this.fxChainInput.connect(this.distortion);
        this.distortion.connect(this.chorusDelay);
        this.chorusDelay.connect(this.delay);
        
        this.delay.connect(this.feedback);
        this.feedback.connect(this.delay);

        this.delay.connect(this.wetMix);
        this.wetMix.connect(this.destination);
    }

    private makeDistortionCurve(amount: number): Float32Array {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        let i = 0;
        let x;
        for ( ; i < n_samples; ++i ) {
            x = i * 2 / n_samples - 1;
            curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
        }
        return curve;
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
                if (!response.ok) throw new Error(`HTTP error! status: ${'' + response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                return await this.audioContext.decodeAudioData(arrayBuffer);
            };
            
            const notePromises = Object.entries(sampleMap).map(async ([key, url]) => {
                const midi = this.keyToMidi(key);
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
    
    public schedule(notes: Note[], time: number, tempo: number = 120) {
        const instrument = this.instruments.get('blackAcoustic');
        if (!this.isInitialized || !instrument) return;

        const ticksPerBeat = 3;
        const beatDuration = 60 / tempo;

        notes.forEach(note => {
            // Check for complex pattern techniques
            if (note.technique && (note.technique.startsWith('F_') || note.technique.startsWith('S_'))) {
                this.playPattern(instrument, note, time);
            } else {
                // Play single note
                this.playSingleNote(instrument, note, time);
            }
        });
    }

    private playPattern(instrument: SamplerInstrument, note: Note, barStartTime: number) {
        const patternName = note.technique as string;
        const patternData = GUITAR_PATTERNS[patternName];
        if (!patternData) {
            console.warn(`[BlackGuitarSampler] Pattern not found: ${patternName}`);
            this.playSingleNote(instrument, note, barStartTime); // Fallback to single note
            return;
        }

        const voicingName = note.params?.voicingName || 'E7_open';
        const voicing = BLUES_GUITAR_VOICINGS[voicingName];
        if (!voicing) {
            console.warn(`[BlackGuitarSampler] Voicing not found: ${voicingName}`);
            this.playSingleNote(instrument, note, barStartTime); // Fallback
            return;
        }

        const ticksPerBeat = 3;
        const beatDuration = 60 / 120; // Assuming 120BPM for now

        for (const event of patternData.pattern) {
            for (const tick of event.ticks) {
                const noteTime = barStartTime + (tick / ticksPerBeat) * beatDuration;
                
                for (const stringIndex of event.stringIndices) {
                    if (stringIndex < voicing.length) {
                        const midiNote = voicing[stringIndex];
                        const { buffer, midi: sampleMidi } = this.findBestSample(instrument, midiNote);
                        if (buffer) {
                            this.playSample(buffer, sampleMidi, midiNote, noteTime, note.velocity || 0.7);
                        }
                    }
                }
            }
        }
    }

    private playSingleNote(instrument: SamplerInstrument, note: Note, startTime: number) {
        const { buffer, midi: sampleMidi } = this.findBestSample(instrument, note.midi);
        if (!buffer) return;

        const noteStartTime = startTime + note.time;
        this.playSample(buffer, sampleMidi, note.midi, noteStartTime, note.velocity || 0.7, note.duration);
    }
    
    private playSample(buffer: AudioBuffer, sampleMidi: number, targetMidi: number, startTime: number, velocity: number, duration?: number) {
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.audioContext.createGain();
        source.connect(gainNode);
        gainNode.connect(this.preamp);

        const playbackRate = Math.pow(2, (targetMidi - sampleMidi) / 12);
        source.playbackRate.value = playbackRate;

        gainNode.gain.setValueAtTime(velocity, startTime);

        if (duration) {
            gainNode.gain.setTargetAtTime(0, startTime + duration * 0.8, 0.1);
            source.start(startTime);
            source.stop(startTime + duration * 1.2);
        } else {
            source.start(startTime);
        }
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
    
    private keyToMidi(key: string): number | null {
        const parts = key.split('_');
        if (parts.length < 1) return null;
    
        const noteStr = parts[0].toLowerCase();
        const noteMatch = noteStr.match(/([a-g][b#]?)(\d)/);
    
        if (!noteMatch) return null;
    
        let [, name, octaveStr] = noteMatch;
        const octave = parseInt(octaveStr, 10);
    
        const noteMap: Record<string, number> = {
            'c': 0, 'c#': 1, 'db': 1, 'd': 2, 'd#': 3, 'eb': 3, 'e': 4, 'f': 5, 'f#': 6, 'gb': 6, 'g': 7, 'g#': 8, 'ab': 8, 'a': 9, 'a#': 10, 'bb': 10, 'b': 11
        };
    
        const noteValue = noteMap[name];
        
        if (noteValue === undefined) return null;
    
        return 12 * (octave + 1) + noteValue;
    }
    

    public stopAll() {
    }

    public dispose() {
        this.preamp.disconnect();
        this.fxChainInput.disconnect();
    }
}

    

    

    
