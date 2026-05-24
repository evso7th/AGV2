
import type { FractalEvent, InstrumentType } from "@/types/fractal";

const DRUM_SAMPLES: Record<string, string> = {
    '25677__walter_odington__alex-hat': '/assets/drums/25677__walter_odington__alex-hat.ogg',
    '25678__walter_odington__avalanche-hat': '/assets/drums/25678__walter_odington__avalanche-hat.ogg',
    '25687__walter_odington__blip-hat': '/assets/drums/25687__walter_odington__blip-hat.ogg',
    '25688__walter_odington__brushed-bell-hat': '/assets/drums/25688__walter_odington__brushed-bell-hat.ogg',
    '25691__walter_odington__fastlinger': '/assets/drums/25691__walter_odington__fastlinger.ogg',
    '25693__walter_odington__hackney-hat-1': '/assets/drums/25693__walter_odington__hackney-hat-1.ogg',
    '25694__walter_odington__hackney-hat-2': '/assets/drums/25694__walter_odington__hackney-hat-2.ogg',
    '25695__walter_odington__hackney-hat-3': '/assets/drums/25695__walter_odington__hackney-hat-3.ogg',
    '25696__walter_odington__hackney-hat-4': '/assets/drums/25696__walter_odington__hackney-hat-4.ogg',
    '25701__walter_odington__new-years-hat-1': '/assets/drums/25701__walter_odington__new-years-hat-1.ogg',
    '25702__walter_odington__new-years-hat-2': '/assets/drums/25702__walter_odington__new-years-hat-2.ogg',
    'a-ride1': '/assets/drums/a-ride1.ogg',
    'a-ride2': '/assets/drums/a-ride2.ogg',
    'a-ride3': '/assets/drums/a-ride3.ogg',
    'a-ride4': '/assets/drums/a-ride4.ogg',
    'Bell_-_Ambient': '/assets/drums/bells/Bell_-_Ambient.ogg',
    'Bell_-_Analog': '/assets/drums/bells/Bell_-_Analog.ogg',
    'Bell_-_Astro': '/assets/drums/bells/Bell_-_Astro.ogg',
    'Bell_-_Background': '/assets/drums/bells/Bell_-_Background.ogg',
    'Bell_-_Bright': '/assets/drums/bells/Bell_-_Bright.ogg',
    'Bell_-_Broken': '/assets/drums/bells/Bell_-_Broken.ogg',
    'Bell_-_Cheap': '/assets/drums/bells/Bell_-_Cheap.ogg',
    'Bell_-_Cheesy': '/assets/drums/bells/Bell_-_Cheesy.ogg',
    'Bell_-_Chorus': '/assets/drums/bells/Bell_-_Chorus.ogg',
    'Bell_-_Click': '/assets/drums/bells/Bell_-_Click.ogg',
    'Bell_-_Crystals': '/assets/drums/bells/Bell_-_Crystals.ogg',
    'Bell_-_Deep': '/assets/drums/bells/Bell_-_Deep.ogg',
    'Bell_-_Detuned': '/assets/drums/bells/Bell_-_Detuned.ogg',
    'Bell_-_Easy': '/assets/drums/bells/Bell_-_Easy.ogg',
    'Bell_-_Echo': '/assets/drums/bells/Bell_-_Echo.ogg',
    'Bell_-_Evil': '/assets/drums/bells/Bell_-_Evil.ogg',
    'Bell_-_Faded': '/assets/drums/bells/Bell_-_Faded.ogg',
    'Bell_-_Far_Away': '/assets/drums/bells/Bell_-_Far_Away.ogg',
    'Bell_-_Fast': '/assets/drums/bells/Bell_-_Fast.ogg',
    'Bell_-_Futuristic': '/assets/drums/bells/Bell_-_Futuristic.ogg',
    'Bell_-_Glide': '/assets/drums/bells/Bell_-_Glide.ogg',
    'Bell_-_Gong': '/assets/drums/bells/Bell_-_Gong.ogg',
    'Bell_-_Higher': '/assets/drums/bells/Bell_-_Higher.ogg',
    'Bell_-_High': '/assets/drums/bells/Bell_-_High.ogg',
    'Bell_-_Horror': '/assets/drums/bells/Bell_-_Horror.ogg',
    'Bell_-_Long': '/assets/drums/bells/Bell_-_Long.ogg',
    'Bell_-_Moonlight': '/assets/drums/bells/Bell_-_Moonlight.ogg',
    'Bell_-_Nasty': '/assets/drums/bells/Bell_-_Nasty.ogg',
    'Bell_-_Normal': '/assets/drums/bells/Bell_-_Normal.ogg',
    'Bell_-_Plug': '/assets/drums/bells/Bell_-_Plug.ogg',
    'Bell_-_Quick': '/assets/drums/bells/Bell_-_Quick.ogg',
    'Bell_-_Reverb': '/assets/drums/bells/Bell_-_Reverb.ogg',
    'Bell_-_Ring': '/assets/drums/bells/Bell_-_Ring.ogg',
    'Bell_-_Slide': '/assets/drums/bells/Bell_-_Slide.ogg',
    'Bell_-_Smooth': '/assets/drums/bells/Bell_-_Smooth.ogg',
    'Bell_-_Soft': '/assets/drums/bells/Bell_-_Soft.ogg',
    'Bell_-_Tap': '/assets/drums/bells/Bell_-_Tap.ogg',
    'Bell_-_Too_Easy': '/assets/drums/bells/Bell_-_Too_Easy.ogg',
    'Bell_-_Unstable': '/assets/drums/bells/Bell_-_Unstable.ogg',
    'Bell_-_Vintage': '/assets/drums/bells/Bell_-_Vintage.ogg',
    'Bell_-_Weird': '/assets/drums/bells/Bell_-_Weird.ogg',
    'Bell_-_Wind': '/assets/drums/bells/Bell_-_Wind.ogg',
    'bongo_pc-01': '/assets/drums/bongo/pc-01.ogg',
    'bongo_pc-02': '/assets/drums/bongo/pc-02.ogg',
    'bongo_pc-03': '/assets/drums/bongo/pc-03.ogg',
    'bongo_pvc-tube-01': '/assets/drums/bongo/pvc-tube-01.ogg',
    'bongo_pvc-tube-02': '/assets/drums/bongo/pvc-tube-02.ogg',
    'bongo_pvc-tube-03': '/assets/drums/bongo/pvc-tube-03.ogg',
    'brush1': '/assets/drums/brush1.ogg',
    'brush2': '/assets/drums/brush2.ogg',
    'brush3': '/assets/drums/brush3.ogg',
    'brush4': '/assets/drums/brush4.ogg',
    'cajon_kick': '/assets/drums/cajon_kick.ogg',
    'closed_hi_hat_ghost': '/assets/drums/closed_hi_hat_ghost.ogg',
    'cowbell': '/assets/drums/cowbell.ogg',
    'crash2': '/assets/drums/crash2.ogg',
    'cymbal1': '/assets/drums/cymbal1.ogg',
    'cymbal2': '/assets/drums/cymbal2.ogg',
    'cymbal3': '/assets/drums/cymbal3.ogg',
    'cymbal4': '/assets/drums/cymbal4.ogg',
    'cymbal_bell1': '/assets/drums/cymbal_bell1.ogg',
    'cymbal_bell2': '/assets/drums/cymbal_bell2.ogg',
    'drum_kick_reso': '/assets/drums/drum_kick_reso.ogg',
    'hightom': '/assets/drums/hightom.ogg',
    'hightom_soft': '/assets/drums/hightom_soft.ogg',
    'kick_drum6': '/assets/drums/kick_drum6.ogg',
    'kick_soft': '/assets/drums/kick_soft.ogg',
    'lowtom': '/assets/drums/lowtom.ogg',
    'lowtom_soft': '/assets/drums/lowtom_soft.ogg',
    'midtom': '/assets/drums/midtom.ogg',
    'midtom_soft': '/assets/drums/midtom_soft.ogg',
    'open_hh_bottom2': '/assets/drums/open_hh_bottom2.ogg',
    'open_hh_top2': '/assets/drums/open_hh_top2.ogg',
    'perc-001': '/assets/drums/perc-001.ogg',
    'perc-002': '/assets/drums/perc-002.ogg',
    'perc-003': '/assets/drums/perc-003.ogg',
    'perc-004': '/assets/drums/perc-004.ogg',
    'perc-005': '/assets/drums/perc-005.ogg',
    'perc-006': '/assets/drums/perc-006.ogg',
    'perc-007': '/assets/drums/perc-007.ogg',
    'perc-008': '/assets/drums/perc-008.ogg',
    'perc-009': '/assets/drums/perc-009.ogg',
    'perc-010': '/assets/drums/perc-010.ogg',
    'perc-011': '/assets/drums/perc-011.ogg',
    'perc-012': '/assets/drums/perc-012.ogg',
    'perc-013': '/assets/drums/perc-013.ogg',
    'perc-014': '/assets/drums/perc-014.ogg',
    'perc-015': '/assets/drums/perc-015.ogg',
    'ride': '/assets/drums/ride.ogg',
    'ride_wetter': '/assets/drums/ride_wetter.ogg',
    'snare_ghost_note': '/assets/drums/snare_ghost_note.ogg',
    'snare_off': '/assets/drums/snare_off.ogg',
    'snare': '/assets/drums/snare.ogg',
    'snarepress': '/assets/drums/snarepress.ogg',
    'Sonor_Classix_High_Tom': '/assets/drums/Sonor_Classix_High_Tom.ogg',
    'Sonor_Classix_Low_Tom': '/assets/drums/Sonor_Classix_Low_Tom.ogg',
    'Sonor_Classix_Mid_Tom': '/assets/drums/Sonor_Classix_Mid_Tom.ogg',
};

const BLUES_KIT_CORE = [
    'drum_kick_reso', 'kick_drum6', 'snare', 'snare_ghost_note', 
    '25693__walter_odington__hackney-hat-1', 'closed_hi_hat_ghost', 
    'open_hh_bottom2', 'ride_wetter', 'ride', 'crash2',
    'perc-001', 'perc-005', 'bongo_pvc-tube-01', 'Bell_-_Ambient'
];

type Sampler = {
    buffers: Map<string, AudioBuffer>;
    load: (samples: Record<string, string>) => Promise<void>;
    triggerAttack: (note: string, time: number, velocity?: number, pan?: number) => void;
    stopAll: () => void;
}

function createSampler(audioContext: AudioContext, output: AudioNode): Sampler {
    const buffers = new Map<string, AudioBuffer>();
    const activeSources = new Set<AudioBufferSourceNode>();

    const load = async (samples: Record<string, string>) => {
        const promises = Object.entries(samples).map(async ([note, url]) => {
            if (buffers.has(note)) return;
            try {
                const response = await fetch(url);
                if (!response.ok) return;
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                buffers.set(note, audioBuffer);
            } catch (error) {}
        });
        await Promise.all(promises);
    };

    const triggerAttack = (note: string, time: number, velocity = 1, pan = 0) => {
        const buffer = buffers.get(note);
        if (!buffer || !isFinite(time)) return;
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = velocity;
        
        const panner = audioContext.createStereoPanner();
        panner.pan.value = pan;

        source.connect(gainNode).connect(panner).connect(output);
        source.start(time);
        
        activeSources.add(source);
        source.onended = () => {
            activeSources.delete(source);
            try {
                gainNode.disconnect();
                panner.disconnect();
            } catch(e) {}
        };
    };

    const stopAll = () => {
        activeSources.forEach(s => {
            try { s.stop(); } catch(e) {}
        });
        activeSources.clear();
    };

    return { buffers, load, triggerAttack, stopAll };
}

export class DrumMachine {
    private audioContext: AudioContext;
    private sampler: Sampler | null = null;
    private preamp: GainNode;
    public isInitialized = false;
    private isFullyInitialized = false;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 0.85;
        this.preamp.connect(destination);
    }

    async init(minimal = false) {
        if (this.isFullyInitialized) return;
        if (minimal && this.isInitialized) return;

        if (!this.sampler) this.sampler = createSampler(this.audioContext, this.preamp);
        
        if (minimal) {
            const coreSamples: Record<string, string> = {};
            BLUES_KIT_CORE.forEach(k => { if(DRUM_SAMPLES[k]) coreSamples[k] = DRUM_SAMPLES[k]; });
            await this.sampler.load(coreSamples);
            this.isInitialized = true;
        } else {
            await this.sampler.load(DRUM_SAMPLES);
            this.isInitialized = true;
            this.isFullyInitialized = true;
        }
    }

    schedule(score: FractalEvent[], barStartTime: number, tempo: number) {
        if (!this.sampler || !this.isInitialized) return;
        const beatDuration = 60 / tempo;
        for (const event of score) {
            const eventType = Array.isArray(event.type) ? event.type[0] : event.type;
            if (typeof eventType !== 'string') continue;
            
            let sampleName = eventType;
            
            if (eventType === 'drums' || eventType === 'drum') {
                const n = event.note;
                if (n === 36) sampleName = 'drum_kick_reso';
                else if (n === 38) sampleName = 'drum_snare';
                else if (n === 42 || n === 44) sampleName = 'drum_25693__walter_odington__hackney-hat-1';
                else if (n === 46) sampleName = 'drum_open_hh_top2';
                else if (n === 41 || n === 43) sampleName = 'drum_Sonor_Classix_Low_Tom';
                else if (n === 45 || n === 47) sampleName = 'drum_Sonor_Classix_High_Tom';
                else if (n === 49) sampleName = 'drum_crash2';
                else if (n === 51) sampleName = 'drum_ride_wetter';
                else sampleName = 'drum_perc-001';
            }

            if (!this.sampler.buffers.has(sampleName)) sampleName = sampleName.replace('drum_', '');
            if (!this.sampler.buffers.has(sampleName)) {
                if (sampleName.includes('kick')) sampleName = 'drum_kick_reso';
                else if (sampleName.includes('snare')) sampleName = 'drum_snare';
                else if (sampleName.includes('hat')) sampleName = 'drum_25693__walter_odington__hackney-hat-1';
                else continue;
            }
            
            const absoluteTime = barStartTime + (event.time * beatDuration);
            if (!isFinite(absoluteTime)) continue;
            
            let velocity = event.weight;
            if (sampleName.startsWith('perc-')) velocity *= 0.4; // #ЗАЧЕМ: ПЛАН №2095. Снижено в 2 раза.
            else if (sampleName.includes('ride')) velocity *= 0.7;
            
            const pan = event.pan || 0;
            this.sampler.triggerAttack(sampleName, absoluteTime, velocity, pan);
        }
    }

    public stop() {
        if (this.sampler) {
            this.sampler.stopAll();
        }
    }
}
