
import type { Genre, Mood } from '@/types/music';

const SPARKLE_SAMPLES = {
    PROMENADE: [
        '/assets/music/promenade_ogg/promenade-1.ogg',
        '/assets/music/promenade_ogg/promenade-2.ogg',
        '/assets/music/promenade_ogg/promenade-3.ogg',
        '/assets/music/promenade_ogg/promenade-4.ogg',
        '/assets/music/promenade_ogg/promenade-5.ogg',
        '/assets/music/promenade_ogg/promenade-6.ogg',
        '/assets/music/promenade_ogg/promenade-7.ogg',
        '/assets/music/promenade_ogg/promenade-8.ogg',
    ],
    BLUES: [
        '/assets/music/promenade_ogg/blues/1_Guitar_Riff_in_E_144_bpm.ogg',
        '/assets/music/promenade_ogg/blues/2_Guitar_Riff__in_E_144_bpm.ogg',
        '/assets/music/promenade_ogg/blues/3_Guitar_Riff__in_E_144_bpm.ogg',
        '/assets/music/promenade_ogg/blues/4_Guitar_Riff__in_E_144_bpm.ogg',
        '/assets/music/promenade_ogg/blues/5_Guitar_Riff_in_E_144_bpm.ogg',
        '/assets/music/promenade_ogg/blues/6_Guitar_Riff_in_E_144_bpm.ogg',
        '/assets/music/promenade_ogg/blues/7_Guitar_Riff_in_E_144_bpm_.ogg',
        '/assets/music/promenade_ogg/blues/8_Guitar_Riff_in_E_144_bpm.ogg',
        '/assets/music/promenade_ogg/blues/9_Guitar_Riff__in_E_144_bpm.ogg',
        '/assets/music/promenade_ogg/blues/10_Guitar_Riff__in_E_144_bpm.ogg',
        '/assets/music/promenade_ogg/blues/11_Guitar_Riff_in_E_166_bpm.ogg',
        '/assets/music/promenade_ogg/blues/12_Guitar_Riff__in_E_166_bpm.ogg',
        '/assets/music/promenade_ogg/blues/13_Guitar_Riff_in_E_166_bpm_.ogg',
        '/assets/music/promenade_ogg/blues/14_Guitar_Riff__in_E_166_bpm.ogg',
        '/assets/music/promenade_ogg/blues/15_Guitar_Riff__in_E_166_bpm.ogg',
        '/assets/music/promenade_ogg/blues/promenade_blues1.ogg',
        '/assets/music/promenade_ogg/blues/promenade_blues2.ogg',
        '/assets/music/promenade_ogg/blues/promenade_blues3.ogg',
    ],
    ROOT: [
        '/assets/music/droplets/EPstein.ogg',
        '/assets/music/droplets/Fearsome.ogg',
        '/assets/music/droplets/Confusion.ogg',
        '/assets/music/droplets/Freakystones.ogg',
        '/assets/music/droplets/sweepingbells.ogg',
        '/assets/music/droplets/icepad.ogg',
        '/assets/music/droplets/dreams.mp3',
        '/assets/music/droplets/Sleep.ogg',
        '/assets/music/droplets/Dizzy.ogg',
        '/assets/music/droplets/AcChord.ogg',
        '/assets/music/droplets/SweetHarpRev1.ogg',
        '/assets/music/droplets/end.mp3',
        '/assets/music/droplets/BirdFX.ogg',
        '/assets/music/droplets/vibes_a.ogg',
        '/assets/music/droplets/belldom.ogg',
        '/assets/music/droplets/BladeWalker.ogg',
        '/assets/music/droplets/merimbo.ogg',
        '/assets/music/droplets/BeepFreak.ogg',
        '/assets/music/droplets/GlassBell.ogg',
        '/assets/music/droplets/Koto1.ogg',
    ],
    DARK: [
        '/assets/music/droplets/dark/00_-_Curse_of_Darkness.ogg',
        '/assets/music/droplets/dark/00_-_Dark_spell_-_2.ogg',
        '/assets/music/droplets/dark/00_-_Dark_whispers.ogg',
        '/assets/music/droplets/dark/00_-_Door_to_Darkness.ogg',
        '/assets/music/droplets/dark/00_-_Multiverse_Gate.ogg',
        '/assets/music/droplets/dark/00_-_Rumbling_Kick.ogg',
        '/assets/music/droplets/dark/00_-_The_Darkness_Occupied.ogg',
        '/assets/music/droplets/dark/00_-_Unholy_Bells.ogg',
        '/assets/music/droplets/dark/01_Synth_2.ogg',
        '/assets/music/droplets/dark/03Rain_On_Mars_Am.ogg',
        '/assets/music/droplets/dark/04In_The_Shadows_Am_70Bpm.ogg',
        '/assets/music/droplets/dark/07Space_Chimes_Am.ogg',
        '/assets/music/droplets/dark/09_SFX_Hit.ogg',
        '/assets/music/droplets/dark/09Martian_Forrest_Am_70Bpm.ogg',
        '/assets/music/droplets/dark/10The_Light_That_Burns_Am_70Bpm.ogg',
        '/assets/music/droplets/dark/11-Synth.ogg',
        '/assets/music/droplets/dark/12Broken_Replicant_70Bpm.ogg',
        '/assets/music/droplets/dark/27_SFX_2.ogg',
        '/assets/music/droplets/dark/28_SFX.ogg',
        '/assets/music/droplets/dark/50_SFX_2.ogg',
        '/assets/music/droplets/dark/683625__dneproman__agony-labyrinth.ogg',
        '/assets/music/droplets/dark/683626__dneproman__cave-breath.ogg',
        '/assets/music/droplets/dark/683627__dneproman__dark-spell-1.ogg',
        '/assets/music/droplets/dark/683629__dneproman__dark-whispers.ogg',
        '/assets/music/droplets/dark/683631__dneproman__multiverse-gate.ogg',
        '/assets/music/droplets/dark/683636__dneproman__urse-of-darkness.ogg',
        '/assets/music/droplets/dark/Analog_Stab_Cm_70Bpm.ogg',
        '/assets/music/droplets/dark/Big_Synth_Pad_Hit_Cm_70Bpm.ogg',
        '/assets/music/droplets/dark/Cosmic_FX_C_70Bpm.ogg',
        '/assets/music/droplets/dark/CS_Grit_Synth_Dm_70Bpm.ogg',
        '/assets/music/droplets/dark/Dark_Kick_70Bpm.ogg',
        '/assets/music/droplets/dark/Dark_Matter_Synth_C_70Bpm.ogg',
        '/assets/music/droplets/dark/Deep_Kick_FX_70Bpm.ogg',
        '/assets/music/droplets/dark/Drill.ogg',
        '/assets/music/droplets/dark/Fearsome.ogg',
        '/assets/music/droplets/dark/Grounding.ogg',
        '/assets/music/droplets/dark/Gulls.ogg',
        '/assets/music/droplets/dark/Panning_Synth_C_70Bpm.ogg',
        '/assets/music/droplets/dark/Reverse_SynthAm_90Bpm.ogg',
        '/assets/music/droplets/dark/Synth_Cm.ogg',
    ],
    LIGHT: [
        '/assets/music/droplets/light/Bpm174_E_MixedFeelings_Pad.ogg',
        '/assets/music/droplets/light/Bpm174_E_China_Pad.ogg',
        '/assets/music/droplets/light/Bpm174_F_Docfly_Synth.ogg',
        '/assets/music/droplets/light/Bpm174_E_Vintage_Pad.ogg',
        '/assets/music/droplets/light/Bpm174_E_StreetArp_Synth.ogg',
        '/assets/music/droplets/light/Bpm174_E_BackgroundNotes_Pad.ogg',
        '/assets/music/droplets/light/Bpm174_F__TweebHarder_Pad.ogg',
        '/assets/music/droplets/light/Bpm174_E_HappyArp_Synth.ogg',
        '/assets/music/droplets/light/Bpm174_E_Notes_Pad.ogg',
        '/assets/music/droplets/light/ElectroKettle_SP_01.ogg',
        '/assets/music/droplets/light/Bpm174_C_PorsonPhaser_Pad.ogg',
        '/assets/music/droplets/light/Bpm174_E_Temple_Synth.ogg',
        //'/assets/music/droplets/light/Bpm174_F_MarkIn_Synth.ogg',
        '/assets/music/droplets/light/Bpm174_E_MotiveStab_Synth.ogg',
        '/assets/music/droplets/light/Bpm174_E_OurSoul_Pad.ogg',
        '/assets/music/droplets/light/Bpm174_B_Heart_Pad.ogg',
        '/assets/music/droplets/light/Bpm174_E_MotiveArp_Pad.ogg',
        '/assets/music/droplets/light/Bpm174_E_Thiny_Synth.ogg',
        '/assets/music/droplets/light/Bpm174_E_Lucky_Synth.ogg',
        '/assets/music/droplets/light/Bpm174_E_Love_Pad.ogg',
    ],
    ELECTRONIC: [
        '/assets/music/droplets/electro/Tubator.ogg',
        '/assets/music/droplets/electro/SalvingPad.ogg',
        '/assets/music/droplets/electro/Coil.ogg',
        '/assets/music/droplets/electro/Plucker (1).ogg',
        '/assets/music/droplets/electro/NoiseFxB06.ogg',
        '/assets/music/droplets/electro/Plucker.ogg',
        '/assets/music/droplets/electro/CloseA.ogg',
        '/assets/music/droplets/electro/E_Rhythm.ogg',
        '/assets/music/droplets/electro/HousedBass7.ogg',
        '/assets/music/droplets/electro/Brass Pad.ogg',
        '/assets/music/droplets/electro/Slow Motion.ogg',
        '/assets/music/droplets/electro/WhooshB.ogg',
        '/assets/music/droplets/electro/New Rave.ogg',
        '/assets/music/droplets/electro/Metallix.ogg',
        '/assets/music/droplets/electro/Deep Sea.ogg',
        '/assets/music/droplets/electro/Raw Oscillator.ogg',
        '/assets/music/droplets/electro/Flanged Bells.ogg',
        '/assets/music/droplets/electro/Starter.ogg',
        '/assets/music/droplets/electro/ElectroShock.ogg',
        '/assets/music/droplets/electro/Electro Train.ogg',
        '/assets/music/droplets/electro/MelancholicPad.ogg',
        '/assets/music/droplets/electro/African Night.ogg',
        '/assets/music/droplets/electro/Barebelli.ogg',
        '/assets/music/droplets/electro/Electricity.ogg',
        '/assets/music/droplets/electro/Triologic.ogg',
        '/assets/music/droplets/electro/Repeated.ogg',
        '/assets/music/droplets/electro/Solina.ogg',
        '/assets/music/droplets/electro/Smoking.ogg',
        '/assets/music/droplets/electro/Collision.ogg',
        '/assets/music/droplets/electro/Riot.ogg',
        '/assets/music/droplets/electro/Tekki.ogg',
    ],
    AMBIENT_COMMON: [
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-031.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-025.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-032.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-008.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-034.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-011.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-022.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-007.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-005.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-001.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-006.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-013.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-018.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-009.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-026.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-004.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-020.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-014.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-017.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-023.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-033.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-015.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-027.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-021.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-003.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-028.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-002.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-010.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-016.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-029.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-024.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-019.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-012.ogg',
        '/assets/music/droplets/ambient_common/Bluezone-Dbox-atm-030.ogg',
    ],
};


export class SparklePlayer {
    private audioContext: AudioContext;
    private gainNode: GainNode;
    private preamp: GainNode;
    private promenadeBuffers: AudioBuffer[] = [];
    private bluesBuffers: AudioBuffer[] = [];
    private rootBuffers: AudioBuffer[] = [];
    private darkBuffers: AudioBuffer[] = [];
    private lightBuffers: AudioBuffer[] = [];
    private electronicBuffers: AudioBuffer[] = [];
    private ambientCommonBuffers: AudioBuffer[] = [];
    public isInitialized = false;
    private activeSources: Set<AudioBufferSourceNode> = new Set();


    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.gainNode = this.audioContext.createGain();
        this.preamp = this.audioContext.createGain();
        // #ЗАЧЕМ: Системное снижение громкости в 3 раза по требованию пользователя.
        // #ЧТО: gain изменен с 2.0 на 0.66.
        this.preamp.gain.value = 0.66; 
        this.preamp.connect(this.gainNode);
        this.gainNode.connect(destination);
    }

    async init() {
        if (this.isInitialized) return;
        try {
            const allUrls = [
                ...SPARKLE_SAMPLES.PROMENADE,
                ...SPARKLE_SAMPLES.BLUES,
                ...SPARKLE_SAMPLES.ROOT,
                ...SPARKLE_SAMPLES.DARK,
                ...SPARKLE_SAMPLES.LIGHT,
                ...SPARKLE_SAMPLES.ELECTRONIC,
                ...SPARKLE_SAMPLES.AMBIENT_COMMON,
            ];
            
            const uniqueUrls = [...new Set(allUrls)];
            const allBuffers = await Promise.all(uniqueUrls.map(url => this.loadSample(url)));
            const urlBufferMap = new Map(uniqueUrls.map((url, i) => [url, allBuffers[i]]));

            this.promenadeBuffers = SPARKLE_SAMPLES.PROMENADE.map(url => urlBufferMap.get(url)).filter(Boolean) as AudioBuffer[];
            this.bluesBuffers = SPARKLE_SAMPLES.BLUES.map(url => urlBufferMap.get(url)).filter(Boolean) as AudioBuffer[];
            this.rootBuffers = SPARKLE_SAMPLES.ROOT.map(url => urlBufferMap.get(url)).filter(Boolean) as AudioBuffer[];
            this.darkBuffers = SPARKLE_SAMPLES.DARK.map(url => urlBufferMap.get(url)).filter(Boolean) as AudioBuffer[];
            this.lightBuffers = SPARKLE_SAMPLES.LIGHT.map(url => urlBufferMap.get(url)).filter(Boolean) as AudioBuffer[];
            this.electronicBuffers = SPARKLE_SAMPLES.ELECTRONIC.map(url => urlBufferMap.get(url)).filter(Boolean) as AudioBuffer[];
            this.ambientCommonBuffers = SPARKLE_SAMPLES.AMBIENT_COMMON.map(url => urlBufferMap.get(url)).filter(Boolean) as AudioBuffer[];

            this.isInitialized = true;
            console.log(`[SparklePlayer] Initialized. Loaded: Promenade(${this.promenadeBuffers.length}), Blues(${this.bluesBuffers.length}), Root(${this.rootBuffers.length}), Dark(${this.darkBuffers.length}), Light(${this.lightBuffers.length}), Electronic(${this.electronicBuffers.length}), Ambient(${this.ambientCommonBuffers.length})`);
        } catch (e) {
            console.error('[SparklePlayer] Failed to initialize:', e);
        }
    }
    
    private async loadSample(url: string): Promise<AudioBuffer | null> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch sparkle sample: ${url}`);
                return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
            (buffer as any).url = url; 
            return buffer;
        } catch (error) {
            console.error(`Error loading sparkle sample ${url}:`, error);
            return null;
        }
    }

    public playRandomSparkle(time: number, genre?: Genre, mood?: Mood, category?: string) {
        if (!this.isInitialized) return;

        let samplePool: AudioBuffer[] = [];
        let poolName: string = 'DEFAULT';
        const rand = Math.random();

        if (category === 'promenade_blues' && this.bluesBuffers.length > 0) {
            samplePool = this.bluesBuffers;
            poolName = 'BLUES';
        } else if (category === 'promenade' && this.promenadeBuffers.length > 0) {
            samplePool = this.promenadeBuffers;
            poolName = 'PROMENADE';
        } else if (mood === 'dark' || mood === 'anxious') {
            samplePool = this.darkBuffers;
            poolName = 'DARK';
        } else if (genre === 'ambient') {
            switch (mood) {
                case 'calm':
                    samplePool = rand < 0.9 ? this.ambientCommonBuffers : this.lightBuffers;
                    poolName = rand < 0.9 ? 'AMBIENT_COMMON' : 'LIGHT';
                    break;
                case 'contemplative':
                    samplePool = rand < 0.8 ? this.ambientCommonBuffers : this.lightBuffers;
                    poolName = rand < 0.8 ? 'AMBIENT_COMMON' : 'LIGHT';
                    break;
                case 'dreamy':
                    samplePool = rand < 0.7 ? this.ambientCommonBuffers : this.lightBuffers;
                    poolName = rand < 0.7 ? 'AMBIENT_COMMON' : 'LIGHT';
                    break;
                case 'joyful':
                    samplePool = rand < 0.2 ? this.ambientCommonBuffers : this.lightBuffers;
                    poolName = rand < 0.2 ? 'AMBIENT_COMMON' : 'LIGHT';
                    break;
                case 'enthusiastic':
                    samplePool = rand < 0.3 ? this.ambientCommonBuffers : this.lightBuffers;
                    poolName = rand < 0.3 ? 'AMBIENT_COMMON' : 'LIGHT';
                    break;
                case 'epic':
                    if (rand < 0.4) { samplePool = this.lightBuffers; poolName = 'LIGHT'; }
                    else if (rand < 0.8) { samplePool = this.ambientCommonBuffers; poolName = 'AMBIENT_COMMON'; }
                    else { samplePool = this.darkBuffers; poolName = 'DARK'; }
                    break;
                case 'melancholic':
                    if (rand < 0.5) { samplePool = this.ambientCommonBuffers; poolName = 'AMBIENT_COMMON'; }
                    else if (rand < 0.8) { samplePool = this.lightBuffers; poolName = 'LIGHT'; }
                    else { samplePool = this.darkBuffers; poolName = 'DARK'; }
                    break;
                default:
                    samplePool = this.ambientCommonBuffers;
                    poolName = 'AMBIENT_COMMON';
            }
        } else {
            samplePool = this.rootBuffers;
            poolName = 'ROOT';
        }

        if (samplePool.length === 0) {
             if (this.rootBuffers.length > 0) {
                 samplePool = this.rootBuffers;
                 poolName = 'ROOT (fallback)';
             } else {
                 return;
             }
        }
        
        const buffer = samplePool[Math.floor(Math.random() * samplePool.length)];
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.preamp);
        
        const sampleUrlForLogging = (buffer as any)?.url || 'Unknown';
        console.log(`%c[SparklePlayer] Playing from pool "${poolName}". Sample: ${sampleUrlForLogging.substring(sampleUrlForLogging.lastIndexOf('/') + 1)} at time ${time.toFixed(2)}`, 'color: #00FFFF');
        source.start(time);
        
        this.activeSources.add(source);
        source.onended = () => {
            this.activeSources.delete(source);
            source.disconnect();
        };
    }
    
    public setVolume(volume: number) {
        this.gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
    }
    
    public stopAll() {
        this.activeSources.forEach(source => {
            try {
                source.stop();
            } catch(e) {}
        });
        this.activeSources.clear();
    }

    public dispose() {
        this.stopAll();
        this.gainNode.disconnect();
    }
}
