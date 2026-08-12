
import type { Genre, Mood } from '@/types/music';

/**
 * @fileOverview Плеер текстур V13.5 — "Absolute Registry Sync".
 * #ЗАЧЕМ: 100% синхронизация с физическим реестром (sparkles + droplets).
 * #ЧТО: ПЛАН №13.5 — Исправлен баг инициализации и добавлены все сэмплы из sparks.txt.
 */
const SPARKLE_SAMPLES = {
    MELODIC: [
        // --- Core Sparkles Folder ---
        '/assets/music/sparkles/180181__ecfike__slow-motion-music_(1).ogg',
        '/assets/music/sparkles/330392__talan_pl__deepspacepad_(1).ogg',
        '/assets/music/sparkles/330392__talan_pl__deepspacepad_(2).ogg',
        '/assets/music/sparkles/381234__waveplaysfx__synth-seq-filtered-atmospheric-pluck-loop.ogg',
        '/assets/music/sparkles/400830__waveplaysfx__synth-seq-cute-sine-tone-pluck-sequence-e5-c4.ogg',
        '/assets/music/sparkles/401268__erokia__401225__rheynemusic__rheyne-rhodes-2-erokia-remix-1_(1).ogg',
        '/assets/music/sparkles/413585__sergeyionov__cr-ambient-chord_(1).ogg',
        '/assets/music/sparkles/414892__erokia__gis-sweden-electronic-minute-no-26-affordance-2-414229-erokia-remix-3_(1).ogg',
        '/assets/music/sparkles/414893__erokia__gis-sweden-electronic-minute-no-26-affordance-2-414229-erokia-remix-2_(1).ogg',
        '/assets/music/sparkles/414895__erokia__gis-sweden-electronic-minute-no-26-affordance-2-414229-erokia-remix-4_(1).ogg',
        '/assets/music/sparkles/516493__gregorquendel__ambience-musical-cosmic-shift-02_(1).ogg',
        '/assets/music/sparkles/516493__gregorquendel__ambience-musical-cosmic-shift-02_(2).ogg',
        '/assets/music/sparkles/516496__gregorquendel__ambience-musical-space-guitar_(1).ogg',
        '/assets/music/sparkles/516496__gregorquendel__ambience-musical-space-guitar_(2).ogg',
        '/assets/music/sparkles/528382__deleted_user_6725533__microfreak-pad-12_(1).ogg',
        '/assets/music/sparkles/528383__deleted_user_6725533__microfreak-pad-11_(1).ogg',
        '/assets/music/sparkles/528384__deleted_user_6725533__microfreak-pad-10_(1).ogg',
        '/assets/music/sparkles/528385__deleted_user_6725533__microfreak-pad-1_(1).ogg',
        '/assets/music/sparkles/528386__deleted_user_6725533__microfreak-pad-16_(1).ogg',
        '/assets/music/sparkles/528387__deleted_user_6725533__microfreak-pad-15_(1).ogg',
        '/assets/music/sparkles/528388__deleted_user_6725533__microfreak-pad-14_(1).ogg',
        '/assets/music/sparkles/528389__deleted_user_6725533__microfreak-pad-13_(1).ogg',
        '/assets/music/sparkles/528390__deleted_user_6725533__microfreak-pad-18_(1).ogg',
        '/assets/music/sparkles/528391__deleted_user_6725533__microfreak-pad-17_(1).ogg',
        '/assets/music/sparkles/528392__deleted_user_6725533__microfreak-pad-8_(1).ogg',
        '/assets/music/sparkles/528393__deleted_user_6725533__microfreak-pad-9_(1).ogg',
        '/assets/music/sparkles/528394__deleted_user_6725533__microfreak-pad-6_(1).ogg',
        '/assets/music/sparkles/528395__deleted_user_6725533__microfreak-pad-7_(1).ogg',
        '/assets/music/sparkles/528396__deleted_user_6725533__microfreak-pad-21_(1).ogg',
        '/assets/music/sparkles/528397__deleted_user_6725533__microfreak-pad-20_(1).ogg',
        '/assets/music/sparkles/528398__deleted_user_6725533__microfreak-pad-2_(1).ogg',
        '/assets/music/sparkles/528399__deleted_user_6725533__microfreak-pad-19_(1).ogg',
        '/assets/music/sparkles/528400__deleted_user_6725533__microfreak-pad-3_(1).ogg',
        '/assets/music/sparkles/528401__deleted_user_6725533__microfreak-pad-24_(1).ogg',
        '/assets/music/sparkles/555547__waveplaysfx__synth-granular-untitled-atmos-sequence-pad-darkish.ogg',
        '/assets/music/sparkles/620113__waveplaysfx__synth-atmos-blue-pad-phrase.ogg',
        '/assets/music/sparkles/700901__laffik__smooth-pad-sytrus-02_(1).ogg',
        '/assets/music/sparkles/812623__cvltiv8r__illusion-spell-synth-pad-burst_(1)_(1).ogg',
        // --- Droplets Melodic (from sparks.txt) ---
        '/assets/music/droplets/EPstein.ogg',
        '/assets/music/droplets/SweetHarpRev1.ogg',
        '/assets/music/droplets/vibes_a.ogg',
        '/assets/music/droplets/belldom.ogg',
        '/assets/music/droplets/GlassBell.ogg',
        '/assets/music/droplets/Koto1.ogg',
        '/assets/music/droplets/dreams.mp3'
    ],
    ORGANIC: [
        // --- Core Sparkles Folder ---
        '/assets/music/sparkles/231573__keweldog__treesconversion_(1).ogg',
        '/assets/music/sparkles/256441__adeathy__ambience_04_white_(1).ogg',
        '/assets/music/sparkles/256442__adeathy__ambience_03_lightgrey_(1).ogg',
        '/assets/music/sparkles/256444__adeathy__ambience_01_black_(1).ogg',
        '/assets/music/sparkles/256445__adeathy__ambience_02_darkgrey_(1).ogg',
        '/assets/music/sparkles/294463__deleted_user_4798915__sfx-robotic-take-me-to-your-leader_(1)_(1).ogg',
        '/assets/music/sparkles/384844__waveplaysfx__ambient-bass-deep-dark-phasing-bassy-swell.ogg',
        '/assets/music/sparkles/388950__waveplaysfx__ambient-bass-deep-soft-bassy-hit-alternate.ogg',
        '/assets/music/sparkles/394268__waveplaysfx__sfx-sci-fi-space-sound-effect.ogg',
        '/assets/music/sparkles/396351__waveplaysfx__ambient-bass-bassy-liquidy-phasing-sfx.ogg',
        '/assets/music/sparkles/396943__waveplaysfx__ambient-bass-bassy-liquidy-phasing-sfx-3.ogg',
        '/assets/music/sparkles/413583__sergeyionov__cr-deep-glitch-percussion_(1).ogg',
        '/assets/music/sparkles/413584__sergeyionov__cr-atmospheric-alarm_(1).ogg',
        '/assets/music/sparkles/413588__sergeyionov__cr-ambient-glitch_(1).ogg',
        '/assets/music/sparkles/413589__sergeyionov__cr-atmospheric-percussion_(1).ogg',
        '/assets/music/sparkles/413590__sergeyionov__cr-noise-in-huge-space_(1).ogg',
        '/assets/music/sparkles/413591__sergeyionov__cr-lasers-reflection_(1).ogg',
        '/assets/music/sparkles/413597__sergeyionov__cr-water-sonar_(1).ogg',
        '/assets/music/sparkles/456101__burghrecords__future-ambience-background_(1).ogg',
        '/assets/music/sparkles/467569__samuelgremaud__railway-platform_(1).ogg',
        '/assets/music/sparkles/468068__dersinnsspace__industrial-crane-movement_(1).ogg',
        '/assets/music/sparkles/506285__fartmuffin__bird-chirps-short.ogg',
        '/assets/music/sparkles/511571__guidofm__street-ambience-muezzin-2_(1).ogg',
        '/assets/music/sparkles/513184__eliwynnmusic__ambient-4_(1).ogg',
        '/assets/music/sparkles/513185__eliwynnmusic__ambient-3_(1).ogg',
        '/assets/music/sparkles/513186__eliwynnmusic__ambient-2_(1).ogg',
        '/assets/music/sparkles/513187__eliwynnmusic__ambient-1_(1).ogg',
        '/assets/music/sparkles/515723__waveplaysfx__sfx-ambience-silent-hill-style-background.ogg',
        '/assets/music/sparkles/515753__waveplaysfx__sfx-ambience-0-silent-hill-style-background.ogg',
        '/assets/music/sparkles/516477__gregorquendel__ambience-cosmic-rain-01_(1).ogg',
        '/assets/music/sparkles/516477__gregorquendel__ambience-cosmic-rain-01_(2).ogg',
        '/assets/music/sparkles/516478__gregorquendel__ambience-cosmic-bubbles_(1).ogg',
        '/assets/music/sparkles/516478__gregorquendel__ambience-cosmic-bubbles_(2).ogg',
        '/assets/music/sparkles/516479__gregorquendel__deep-space-ambience_(1).ogg',
        '/assets/music/sparkles/516479__gregorquendel__deep-space-ambience_(2).ogg',
        '/assets/music/sparkles/516497__gregorquendel__ambience-musical-glitch-cosmic-drift_(1).ogg',
        '/assets/music/sparkles/516497__gregorquendel__ambience-musical-glitch-cosmic-drift_(2).ogg',
        '/assets/music/sparkles/529138__waveplaysfx__ambient-loop-deep-ambient-pulses-3-added-drums.ogg',
        '/assets/music/sparkles/536776__egomassive__wind_(1)_(1).ogg',
        '/assets/music/sparkles/536957__samuelgremaud__street-sweeper-4_(1).ogg',
        '/assets/music/sparkles/538071__waveplaysfx__sfx-timestretched-noise-lofi-reverb.ogg',
        '/assets/music/sparkles/546067__waveplaysfx__sfx-hit-edm-hit-001.ogg',
        '/assets/music/sparkles/546492__waveplaysfx__edm-hit-002-120-bpm.ogg',
        '/assets/music/sparkles/546494__waveplaysfx__sfx-hit-dropbomb-effect-11.ogg',
        '/assets/music/sparkles/546495__waveplaysfx__sfx-hit-dropbomb-effect-10.ogg',
        '/assets/music/sparkles/546524__samuelgremaud__thunderstorm-rain-2_(1).ogg',
        '/assets/music/sparkles/572127__kazarin0v__atmosphere-noise_(1).ogg',
        '/assets/music/sparkles/632103__el_boss__robo-voice-and-yell_(1).ogg',
        '/assets/music/sparkles/647909__arc-en-ciel__mystical_short_atmo_(1).ogg',
        '/assets/music/sparkles/677359__saha213131__horrorcinematicdarkhorrorroomtone20_(1).ogg',
        '/assets/music/sparkles/776959__reathance__reath-ambience-clickets_CC0_(1).ogg',
        '/assets/music/sparkles/799303__cvltiv8r__ambient-drone-df-h-df-g-jh-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799305__cvltiv8r__ambient-drone-234896806485-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799307__cvltiv8r__ambient-drone-304583405683058-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799310__cvltiv8r__ambient-drone-4-t-2-34-rt-tt-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799311__cvltiv8r__ambient-drone-40693-04569-03-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799312__cvltiv8r__ambient-drone-456-7-7ws-ss-sss-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799324__cvltiv8r__ambient-drone-_ety__y_rh__fh_d_yh_fu-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799333__cvltiv8r__ambient-drone-dgjk-j-l-u-k-d-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799334__cvltiv8r__ambient-drone-ds-sd-d-fgc-v-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799339__cvltiv8r__ambient-drone-fg-h-jk-fg-gg-g-g-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799341__cvltiv8r__ambient-drone-j-l-j-o-hi-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799351__cvltiv8r__ambient-drone-u-e-tu-d-tg-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/799354__cvltiv8r__ambient-drone-wq-hj-meh-o-u-u-io-by-cvltiv8r_(1).ogg',
        '/assets/music/sparkles/813142__cvltiv8r__magic-potion-fx_(1)_(1).ogg',
        '/assets/music/sparkles/814946__cvltiv8r__magical-mystery-spell-burst_(1)_(1).ogg',
        '/assets/music/sparkles/817275__cvltiv8r__magic-spell-impact-and-trail-off_(1)_(1).ogg',
        '/assets/music/sparkles/847621__cvltiv8r__magic-spell-whir-and-boom_(1)_(1).ogg',
        '/assets/music/sparkles/849412__cvltiv8r__magical-impact-with-trippy-trail-fx_(1)_(1).ogg',
        '/assets/music/sparkles/849523__cvltiv8r__alien-craft-ambience-fx_(1).ogg',
        '/assets/music/sparkles/857848__cvltiv8r__space-craft-wind-leaving-atmosphere-fx_(1).ogg',
        '/assets/music/sparkles/861358__qubodup__vespa-driveby-tunnel_(1).ogg',
        // --- Droplets Organic (from sparks.txt) ---
        '/assets/music/droplets/Confusion.ogg',
        '/assets/music/droplets/dark/Fearsome.ogg',
        '/assets/music/droplets/dark/Grounding.ogg',
        '/assets/music/droplets/dark/Gulls.ogg',
        '/assets/music/droplets/Freakystones.ogg',
        '/assets/music/droplets/sweepingbells.ogg',
        '/assets/music/droplets/icepad.ogg',
        '/assets/music/droplets/Sleep.ogg',
        '/assets/music/droplets/AcChord.ogg',
        '/assets/music/droplets/BirdFX.ogg',
        '/assets/music/droplets/Abstruse.ogg',
        '/assets/music/droplets/BladeWalker.ogg',
        '/assets/music/droplets/merimbo.ogg',
        '/assets/music/droplets/electro/Tubator.ogg',
        '/assets/music/droplets/electro/SalvingPad.ogg',
        '/assets/music/droplets/electro/NoiseFxB06.ogg',
        '/assets/music/droplets/electro/CloseA.ogg',
        '/assets/music/droplets/electro/E_Rhythm.ogg',
        '/assets/music/droplets/electro/HousedBass7.ogg',
        '/assets/music/droplets/electro/Dizzy.ogg',
        '/assets/music/droplets/electro/Drill.ogg',
        '/assets/music/droplets/electro/Starter.ogg',
        '/assets/music/droplets/electro/ElectroShock.ogg',
        '/assets/music/droplets/electro/MelancholicPad.ogg',
        '/assets/music/droplets/electro/Electricity.ogg',
        '/assets/music/droplets/BeepFreak.ogg',
        '/assets/music/droplets/ocean.mp3',
        '/assets/music/droplets/end.mp3'
    ]
};

export class SparklePlayer {
    private audioContext: AudioContext;
    private gainNode: GainNode;
    private preamp: GainNode;
    private melodicBuffers: AudioBuffer[] = [];
    private organicBuffers: AudioBuffer[] = [];
    public isInitialized = false;
    private isFullyInitialized = false;
    private activeSources: Set<AudioBufferSourceNode> = new Set();

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.gainNode = this.audioContext.createGain();
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 0.45; // Default volume
        this.preamp.connect(this.gainNode);
        this.gainNode.connect(destination);
    }

    async init(limitPerCategory: number = -1) {
        if (this.isFullyInitialized) return;
        if (limitPerCategory > 0 && this.isInitialized) return;

        try {
            const categories = Object.keys(SPARKLE_SAMPLES) as (keyof typeof SPARKLE_SAMPLES)[];
            const loadTasks: Promise<void>[] = [];

            for (const cat of categories) {
                const urls = SPARKLE_SAMPLES[cat];
                const targetUrls = limitPerCategory > 0 ? urls.slice(0, limitPerCategory) : urls;
                
                const bufferTarget = cat === 'MELODIC' ? this.melodicBuffers : this.organicBuffers;

                targetUrls.forEach(url => {
                    loadTasks.push(this.loadSample(url).then(buf => {
                        if (buf && !bufferTarget.includes(buf)) bufferTarget.push(buf);
                    }));
                });
            }

            await Promise.all(loadTasks);
            this.isInitialized = true;
            if (limitPerCategory === -1) this.isFullyInitialized = true;

        } catch (e) {
            console.warn('[SparklePlayer] Init error:', e);
        }
    }
    
    private async loadSample(url: string): Promise<AudioBuffer | null> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`[SparklePlayer] Sample not found: ${url}`);
                return null;
            }
            const arrayBuffer = await response.arrayBuffer();
            return await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`[SparklePlayer] Error loading sample: ${url}`, error);
            return null;
        }
    }

    public playRandomSparkle(time: number, genre?: Genre, mood?: Mood, category?: 'MELODIC' | 'ORGANIC') {
        if (!this.isInitialized) return;
        if (genre === 'blues' || genre === 'reggae') return;

        let samplePool: AudioBuffer[] = [];
        
        if (category) {
            samplePool = category === 'MELODIC' ? this.melodicBuffers : this.organicBuffers;
        } else {
            const melodicChance = (genre === 'ambient' || genre === 'psybient') ? 0.3 : 0.7;
            samplePool = Math.random() < melodicChance ? this.melodicBuffers : this.organicBuffers;
        }

        if (samplePool.length === 0) {
             // Fallback to any available buffer if the chosen pool is empty
            samplePool = this.melodicBuffers.length > 0 ? this.melodicBuffers : this.organicBuffers;
        }

        if (samplePool.length === 0) return;
        
        const buffer = samplePool[Math.floor(Math.random() * samplePool.length)];
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.preamp);
        
        const now = Math.max(time, this.audioContext.currentTime);
        source.start(now);
        
        this.activeSources.add(source);
        source.onended = () => {
            this.activeSources.delete(source);
            try { source.disconnect(); } catch(e) {}
        };
    }
    
    public setVolume(volume: number) {
        if (isFinite(volume)) {
            this.gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.05);
        }
    }
    
    public stopAll() {
        this.activeSources.forEach(source => { try { source.stop(0); } catch(e) {} });
        this.activeSources.clear();
    }

    public dispose() { 
        this.stopAll(); 
        this.gainNode.disconnect(); 
        this.preamp.disconnect();
    }
}
