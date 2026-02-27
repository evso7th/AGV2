'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { WorkerSettings, Score, InstrumentPart, BassInstrument, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, ScoreName, Note, DrumsScore, EffectsScore, InstrumentType, Genre, Mood } from '@/types/music';
import { DrumMachine } from '@/lib/drum-machine';
import { SamplerPlayer } from '@/lib/sampler-player';
import { ViolinSamplerPlayer } from '@/lib/violin-sampler-player';
import { FluteSamplerPlayer } from '@/lib/flute-sampler-player';
import { AccompanimentSynthManager } from '@/lib/accompaniment-synth-manager';
import { BassSynthManager } from '@/lib/bass-synth-manager';
import { AccompanimentSynthManagerV2 } from '@/lib/accompaniment-synth-manager-v2';
import { MelodySynthManager } from '@/lib/melody-synth-manager';
import { SparklePlayer } from '@/lib/sparkle-player';
import { SfxSynthManager } from '@/lib/sfx-synth-manager';
import { PIANO_SAMPLES, VIOLIN_SAMPLES, FLUTE_SAMPLES, ACOUSTIC_GUITAR_CHORD_SAMPLES, ACOUSTIC_GUITAR_SOLO_SAMPLES } from '@/lib/samples';
import { GuitarChordsSampler } from '@/lib/guitar-chords-sampler';
import { AcousticGuitarSoloSampler } from '@/lib/acoustic-guitar-solo-sampler';
import { BlackGuitarSampler } from '@/lib/black-guitar-sampler';
import { TelecasterGuitarSampler } from '@/lib/telecaster-guitar-sampler';
import type { FractalEvent, InstrumentHints } from '@/types/fractal';
import * as Tone from 'tone';
import { MelodySynthManagerV2 } from '@/lib/melody-synth-manager-v2';
import { V2_PRESETS } from '@/lib/presets-v2';
import { HarmonySynthManager } from '@/lib/harmony-synth-manager';
import { buildMultiInstrument } from '@/lib/instrument-factory';

export function noteToMidi(note: string): number {
    return new (Tone.Frequency as any)(note).toMidi();
}

// --- Type Definitions ---
type WorkerMessage = {
    type: 'SCORE_READY' | 'HARMONY_SCORE_READY' | 'error' | 'debug' | 'sparkle' | 'sfx';
    command?: 'reset' | 'SUITE_ENDED';
    payload?: {
        events?: FractalEvent[];
        barDuration?: number;
        instrumentHints?: InstrumentHints;
        barCount?: number; 
    } | FractalEvent; 
    error?: string;
    message?: string;
};


// --- Constants ---
const VOICE_BALANCE: Record<InstrumentPart, number> = {
  bass: 0.5, melody: 0.7, accompaniment: 0.6, drums: 1.0,
  effects: 0.6, sparkles: 0.7, piano: 1.0, violin: 0.8, flute: 0.8, guitarChords: 0.9,
  acousticGuitarSolo: 0.9, blackAcoustic: 0.9, sfx: 0.8, harmony: 0.8,
  telecaster: 0.9,
};

const EQ_FREQUENCIES = [60, 125, 250, 500, 1000, 2000, 4000];

// --- React Context ---
interface AudioEngineContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  isPlaying: boolean;
  useMelodyV2: boolean;
  initialize: () => Promise<boolean>;
  setIsPlaying: (playing: boolean) => void;
  updateSettings: (settings: Partial<WorkerSettings>) => void;
  resetWorker: () => void;
  setVolume: (part: InstrumentPart, volume: number) => void;
  setInstrument: (part: 'bass' | 'melody' | 'accompaniment' | 'harmony', name: BassInstrument | MelodyInstrument | AccompanimentInstrument | 'piano' | 'guitarChords' | 'violin' | 'flute' | 'none') => void;
  setBassTechnique: (technique: BassTechnique) => void;
  setTextureSettings: (settings: Omit<TextureSettings, 'pads' | 'sfx'>) => void;
  setEQGain: (bandIndex: number, gain: number) => void;
  startMasterFadeOut: (durationInSeconds: number) => void;
  cancelMasterFadeOut: () => void;
  toggleMelodyEngine: () => void;
}

const AudioEngineContext = createContext<AudioEngineContextType | null>(null);

export const useAudioEngine = () => {
  const context = useContext(AudioEngineContext);
  if (!context) throw new Error('useAudioEngine must be used within an AudioEngineProvider');
  return context;
};

// --- Provider Component ---
export const AudioEngineProvider = ({ children }: { children: React.ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useMelodyV2, setUseMelodyV2] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef<WorkerSettings | null>(null);
  
  const drumMachineRef = useRef<DrumMachine | null>(null);
  const bassManagerRef = useRef<BassSynthManager | null>(null);
  const accompanimentManagerRef = useRef<AccompanimentSynthManager | null>(null);
  const accompanimentManagerV2Ref = useRef<AccompanimentSynthManagerV2 | null>(null);
  const melodyManagerRef = useRef<MelodySynthManager | null>(null);
  const melodyManagerV2Ref = useRef<MelodySynthManagerV2 | null>(null);
  const bassManagerV2Ref = useRef<MelodySynthManagerV2 | null>(null);
  const harmonyManagerRef = useRef<HarmonySynthManager | null>(null);
  const pianoAccompanimentManagerRef = useRef<PianoAccompanimentManager | null>(null);
  const sparklePlayerRef = useRef<SparklePlayer | null>(null);
  const sfxSynthManagerRef = useRef<SfxSynthManager | null>(null);
  const blackGuitarSamplerRef = useRef<BlackGuitarSampler | null>(null);
  const telecasterSamplerRef = useRef<TelecasterGuitarSampler | null>(null);
  
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const gainNodesRef = useRef<any>({});

  const nextBarTimeRef = useRef<number>(0);
  const impulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const resetWorkerCallback = useCallback(() => {
    if (workerRef.current) workerRef.current.postMessage({ command: 'reset' });
  }, []);

  const updateSettingsCallback = useCallback((settings: Partial<WorkerSettings>) => {
     if (!isInitialized || !workerRef.current) return;
     settingsRef.current = { ...settingsRef.current, ...settings } as WorkerSettings;
     workerRef.current.postMessage({ command: 'update_settings', data: settingsRef.current });
  }, [isInitialized]);

  const toggleMelodyEngine = useCallback(() => {
    setUseMelodyV2(prev => {
        const newValue = !prev;
        updateSettingsCallback({ useMelodyV2: newValue });
        return newValue;
    });
  }, [updateSettingsCallback]);


  const setInstrumentCallback = useCallback(async (part: any, name: any) => {
    if (!isInitialized) return;
    if (part === 'accompaniment') {
      if(useMelodyV2) accompanimentManagerV2Ref.current?.setInstrument(name);
      else accompanimentManagerRef.current?.setInstrument(name);
    } else if (part === 'melody') {
        if(useMelodyV2) melodyManagerV2Ref.current?.setInstrument(name);
        else melodyManagerRef.current?.setInstrument(name);
    } else if (part === 'bass') {
        if(useMelodyV2) bassManagerV2Ref.current?.setInstrument(name);
        else bassManagerRef.current?.setInstrument(name);
    } else if (part === 'harmony') {
        harmonyManagerRef.current?.setInstrument(name);
    }
  }, [isInitialized, useMelodyV2]);

  const scheduleEvents = useCallback((events: FractalEvent[], barStartTime: number, tempo: number, barCount: number, instrumentHints?: InstrumentHints) => {
    if (!Array.isArray(events)) return;
    const composerControls = settingsRef.current?.composerControlsInstruments;

    const drumEvents: FractalEvent[] = [];
    const bassEvents: FractalEvent[] = [];
    const accompanimentEvents: FractalEvent[] = [];
    const melodyEvents: FractalEvent[] = [];
    const harmonyEvents: FractalEvent[] = [];
    const sfxEvents: FractalEvent[] = [];

    for (const event of events) {
      const eventType = Array.isArray(event.type) ? event.type[0] : event.type;
      if (typeof eventType === 'string' && (eventType.startsWith('drum_') || eventType.startsWith('perc-'))) drumEvents.push(event);
      else if (eventType === 'bass') bassEvents.push(event);
      else if (eventType === 'accompaniment') accompanimentEvents.push(event);
      else if (eventType === 'melody') melodyEvents.push(event);
      else if (eventType === 'harmony') harmonyEvents.push(event);
      else if (eventType === 'sfx') sfxEvents.push(event);
    }

    if (drumMachineRef.current && drumEvents.length > 0) drumMachineRef.current.schedule(drumEvents, barStartTime, tempo);
    if (bassEvents.length > 0) {
        if (useMelodyV2) bassManagerV2Ref.current?.schedule(bassEvents, barStartTime, tempo, instrumentHints?.bass, barCount);
        else bassManagerRef.current?.schedule(bassEvents, barStartTime, tempo, barCount, instrumentHints?.bass, composerControls);
    }

    if (accompanimentEvents.length > 0) {
        if (useMelodyV2) accompanimentManagerV2Ref.current?.schedule(accompanimentEvents, barStartTime, tempo, barCount, instrumentHints?.accompaniment as any);
        else accompanimentManagerRef.current?.schedule(accompanimentEvents, barStartTime, tempo, barCount, instrumentHints?.accompaniment, composerControls);
    }
    
    if (melodyEvents.length > 0) {
        if (useMelodyV2) melodyManagerV2Ref.current?.schedule(melodyEvents, barStartTime, tempo, instrumentHints?.melody);
        else melodyManagerRef.current?.schedule(melodyEvents, barStartTime, tempo, barCount, instrumentHints?.melody, composerControls);
    }

    if (harmonyManagerRef.current && harmonyEvents.length > 0) harmonyManagerRef.current.schedule(harmonyEvents, barStartTime, tempo, instrumentHints?.harmony);
    if (sfxSynthManagerRef.current && sfxEvents.length > 0) sfxSynthManagerRef.current.trigger(sfxEvents, barStartTime, settingsRef.current?.bpm || 75);
  }, [useMelodyV2]);

  /**
   * #ЗАЧЕМ: Улучшенная калибровка громкости ансамбля.
   * #ЧТО: ПЛАН №660 — Реализована сквозная поддержка balancedVolume для всех типов менеджеров.
   */
  const setVolumeCallback = useCallback((part: InstrumentPart, volume: number) => {
    if (part === 'pads' || part === 'effects') return;

    const balancedVolume = volume * (VOICE_BALANCE[part] ?? 1);

    if (part === 'bass') {
        if (useMelodyV2) bassManagerV2Ref.current?.setPreampGain(balancedVolume);
        else bassManagerRef.current?.setPreampGain(balancedVolume);
        return;
    }
    if (part === 'melody') {
        if (useMelodyV2) melodyManagerV2Ref.current?.setPreampGain(balancedVolume);
        else melodyManagerRef.current?.setPreampGain(balancedVolume);
        return;
    }
    if (part === 'accompaniment') {
        if (useMelodyV2) accompanimentManagerV2Ref.current?.setPreampGain(balancedVolume);
        else accompanimentManagerRef.current?.setPreampGain(balancedVolume);
        return;
    }
    if (part === 'harmony' && harmonyManagerRef.current) {
        harmonyManagerRef.current.setVolume(balancedVolume);
        return;
    }
    if (part === 'pianoAccompaniment' && pianoAccompanimentManagerRef.current) {
        pianoAccompanimentManagerRef.current.setVolume(balancedVolume);
        return;
    }

    const gainNode = gainNodesRef.current[part];
    if (gainNode && audioContextRef.current) {
        gainNode.gain.setTargetAtTime(balancedVolume, audioContextRef.current.currentTime, 0.01);
    }
  }, [useMelodyV2]);

  useEffect(() => {
    if (workerRef.current) {
        workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
             const { type, command, payload, error } = event.data;
                if (command === 'SUITE_ENDED') {
                    resetWorkerCallback();
                    return;
                }
                if (type === 'SCORE_READY' && payload && 'events' in payload) {
                    const { events, barDuration, instrumentHints, barCount } = payload;
                    if(events && barDuration && settingsRef.current && barCount !== undefined){
                        scheduleEvents(events, nextBarTimeRef.current, settingsRef.current.bpm, barCount, instrumentHints);
                        nextBarTimeRef.current += barDuration;
                    }
                } else if (type === 'sparkle' && payload && 'params' in payload) {
                    const { mood, genre, category } = (payload as FractalEvent).params;
                    sparklePlayerRef.current?.playRandomSparkle(nextBarTimeRef.current + (payload as FractalEvent).time, genre, mood, category);
                } else if (type === 'sfx' && payload && 'params' in payload) {
                    sfxSynthManagerRef.current?.trigger([payload as FractalEvent], nextBarTimeRef.current, settingsRef.current?.bpm || 75);
                } else if (type === 'error') {
                    toast({ variant: "destructive", title: "Worker Error", description: error });
                }
        };
    }
  }, [scheduleEvents, toast, resetWorkerCallback]);

  const initialize = useCallback(async () => {
    if (isInitialized || isInitializing) return true;
    setIsInitializing(true);
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
        const context = audioContextRef.current;
        nextBarTimeRef.current = context.currentTime + 0.1; 
        if (!masterGainNodeRef.current) {
            masterGainNodeRef.current = context.createGain();
            masterGainNodeRef.current.connect(context.destination);
        }
        const parts = ['bass', 'melody', 'accompaniment', 'drums', 'sparkles', 'sfx', 'harmony', 'pianoAccompaniment'];
        parts.forEach(part => {
            if (!gainNodesRef.current[part]) {
                gainNodesRef.current[part] = context.createGain();
                gainNodesRef.current[part].connect(masterGainNodeRef.current);
            }
        });
        if (!drumMachineRef.current) drumMachineRef.current = new DrumMachine(context, gainNodesRef.current.drums);
        if (!bassManagerRef.current) bassManagerRef.current = new BassSynthManager(context, gainNodesRef.current.bass);
        if (!accompanimentManagerRef.current) accompanimentManagerRef.current = new AccompanimentSynthManager(context, gainNodesRef.current.accompaniment);
        if (!accompanimentManagerV2Ref.current) accompanimentManagerV2Ref.current = new AccompanimentSynthManagerV2(context, gainNodesRef.current.accompaniment);
        if (!blackGuitarSamplerRef.current) blackGuitarSamplerRef.current = new BlackGuitarSampler(context, gainNodesRef.current.melody);
        if (!telecasterSamplerRef.current) telecasterSamplerRef.current = new TelecasterGuitarSampler(context, gainNodesRef.current.melody);
        if (!melodyManagerRef.current) melodyManagerRef.current = new MelodySynthManager(context, gainNodesRef.current.melody, blackGuitarSamplerRef.current, telecasterSamplerRef.current, 'melody');
        if (!melodyManagerV2Ref.current) melodyManagerV2Ref.current = new MelodySynthManagerV2(context, gainNodesRef.current.melody, telecasterSamplerRef.current, blackGuitarSamplerRef.current, {} as any, {} as any, 'melody');
        if (!bassManagerV2Ref.current) bassManagerV2Ref.current = new MelodySynthManagerV2(context, gainNodesRef.current.bass, telecasterSamplerRef.current, blackGuitarSamplerRef.current, {} as any, {} as any, 'bass');
        if (!harmonyManagerRef.current) harmonyManagerRef.current = new HarmonySynthManager(context, gainNodesRef.current.harmony);
        if (!pianoAccompanimentManagerRef.current) pianoAccompanimentManagerRef.current = new PianoAccompanimentManager(context, gainNodesRef.current.pianoAccompaniment);
        if (!sparklePlayerRef.current) sparklePlayerRef.current = new SparklePlayer(context, gainNodesRef.current.sparkles);
        if (!sfxSynthManagerRef.current) sfxSynthManagerRef.current = new SfxSynthManager(context, gainNodesRef.current.sfx);
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('@/app/ambient.worker.ts', import.meta.url), { type: 'module' });
            workerRef.current.postMessage({ command: 'init', data: {} });
        }
        setIsInitialized(true);
        return true;
    } catch (e) {
        return false;
    } finally { setIsInitializing(false); }
  }, [isInitialized, isInitializing]);

  return (
    <AudioEngineContext.Provider value={{
        isInitialized, isInitializing, isPlaying, useMelodyV2, initialize,
        setIsPlaying: (playing) => {
            setIsPlaying(playing);
            if (!isInitialized || !workerRef.current || !audioContextRef.current) return;
            const context = audioContextRef.current;
            if (playing) {
                if (context.state === 'suspended') context.resume();
                masterGainNodeRef.current?.gain.setTargetAtTime(1.0, context.currentTime, 0.05);
                nextBarTimeRef.current = context.currentTime + 0.2;
                workerRef.current.postMessage({ command: 'start' });
            } else {
                masterGainNodeRef.current?.gain.setTargetAtTime(0.0, context.currentTime, 0.01);
                workerRef.current.postMessage({ command: 'stop' });
            }
        }, 
        updateSettings: updateSettingsCallback,
        resetWorker: resetWorkerCallback,
        setVolume: setVolumeCallback, setInstrument: setInstrumentCallback,
        setBassTechnique: (t) => {}, 
        setTextureSettings: (s) => {
            setVolumeCallback('sparkles', s.sparkles.enabled ? s.sparkles.volume : 0);
            setVolumeCallback('sfx', s.sfx.enabled ? s.sfx.volume : 0);
        },
        setEQGain: (i, g) => {}, startMasterFadeOut: (d) => {}, cancelMasterFadeOut: () => {},
        toggleMelodyEngine,
    }}>
      {children}
    </AudioEngineContext.Provider>
  );
};
