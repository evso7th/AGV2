/**
 * #ЗАЧЕМ: Audio Engine Context V5.2 — "ReferenceError & Logic Fix".
 * #ЧТО: 1. Исправлена ошибка ReferenceError: setInstrumentCallback is not defined.
 *       2. Гарантирована инициализация V2-менеджеров.
 */
'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { WorkerSettings, InstrumentPart, BassInstrument, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, ScoreName, Note, Genre, Mood } from '@/types/music';
import { DrumMachine } from '@/lib/drum-machine';
import { AccompanimentSynthManagerV2 } from '@/lib/accompaniment-synth-manager-v2';
import { SparklePlayer } from '@/lib/sparkle-player';
import { SfxSynthManager } from '@/lib/sfx-synth-manager';
import { BlackGuitarSampler } from '@/lib/black-guitar-sampler';
import { TelecasterGuitarSampler } from '@/lib/telecaster-guitar-sampler';
import { DarkTelecasterSampler } from '@/lib/dark-telecaster-sampler';
import { CS80GuitarSampler } from '@/lib/cs80-guitar-sampler';
import { MelodySynthManagerV2 } from '@/lib/melody-synth-manager-v2';
import { HarmonySynthManager } from '@/lib/harmony-synth-manager';
import { PianoAccompanimentManager } from '@/lib/piano-accompaniment-manager';
import { BroadcastEngine } from '@/lib/broadcast-engine';
import { useFirebase, initiateAnonymousSignIn } from '@/firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import type { FractalEvent, InstrumentHints, NavigationInfo } from '@/types/fractal';
import * as Tone from 'tone';

// --- Constants ---
const VOICE_BALANCE: Record<InstrumentPart, number> = {
  bass: 0.55, melody: 1.0, accompaniment: 0.6, drums: 1.0,
  effects: 0.6, sparkles: 0.7, piano: 1.0, violin: 0.8, flute: 0.8, guitarChords: 0.9,
  acousticGuitarSolo: 0.9, blackAcoustic: 0.9, sfx: 0.8, harmony: 0.8,
  telecaster: 0.9, darkTelecaster: 0.9, cs80: 1.0, pianoAccompaniment: 0.7,
};

// --- React Context ---
interface AudioEngineContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  isPlaying: boolean;
  isRecording: boolean;
  isBroadcastActive: boolean;
  initialize: () => Promise<boolean>;
  setIsPlaying: (playing: boolean) => void;
  updateSettings: (settings: Partial<WorkerSettings>) => void;
  resetWorker: () => void;
  setVolume: (part: InstrumentPart, volume: number) => void;
  setInstrument: (part: 'bass' | 'melody' | 'accompaniment' | 'harmony' | 'pianoAccompaniment', name: any) => void;
  setBassTechnique: (technique: BassTechnique) => void;
  setTextureSettings: (settings: Omit<TextureSettings, 'pads' | 'sfx'>) => void;
  setEQGain: (bandIndex: number, gain: number) => void;
  startMasterFadeOut: (durationInSeconds: number) => void;
  cancelMasterFadeOut: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleBroadcast: () => void;
  getWorker: () => Worker | null;
  playRawEvents: (events: FractalEvent[], instrumentHints?: InstrumentHints) => void;
}

const AudioEngineContext = createContext<AudioEngineContextType | null>(null);

export const useAudioEngine = () => {
  const context = useContext(AudioEngineContext);
  if (!context) throw new Error('useAudioEngine must be used within an AudioEngineProvider');
  return context;
};

export const AudioEngineProvider = ({ children }: { children: React.ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPlaying, setIsPlayingState] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isBroadcastActive, setIsBroadcastActive] = useState(false);
  
  const firebase = useFirebase();
  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef<WorkerSettings | null>(null);
  const ancestorsRef = useRef<any[]>([]); 
  
  const drumMachineRef = useRef<DrumMachine | null>(null);
  const accompanimentManagerV2Ref = useRef<AccompanimentSynthManagerV2 | null>(null);
  const melodyManagerV2Ref = useRef<MelodySynthManagerV2 | null>(null);
  const bassManagerV2Ref = useRef<MelodySynthManagerV2 | null>(null);
  const harmonyManagerRef = useRef<HarmonySynthManager | null>(null);
  const pianoAccompanimentManagerRef = useRef<PianoAccompanimentManager | null>(null);
  const sparklePlayerRef = useRef<SparklePlayer | null>(null);
  const sfxSynthManagerRef = useRef<SfxSynthManager | null>(null);
  
  const blackGuitarSamplerRef = useRef<BlackGuitarSampler | null>(null);
  const telecasterSamplerRef = useRef<TelecasterGuitarSampler | null>(null);
  const darkTelecasterSamplerRef = useRef<DarkTelecasterSampler | null>(null);
  const cs80SamplerRef = useRef<CS80GuitarSampler | null>(null);
  
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const speakerGainNodeRef = useRef<GainNode | null>(null);
  const recorderDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const broadcastEngineRef = useRef<BroadcastEngine | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const gainNodesRef = useRef<any>({});
  const nextBarTimeRef = useRef<number>(0);
  const impulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const setInstrumentCallback = useCallback(async (part: string, name: string) => {
    if (!isInitialized) return;
    if (part === 'bass' && bassManagerV2Ref.current) {
        await bassManagerV2Ref.current.setInstrument(name as any);
    } else if (part === 'melody' && melodyManagerV2Ref.current) {
        await melodyManagerV2Ref.current.setInstrument(name as any);
    } else if (part === 'accompaniment' && accompanimentManagerV2Ref.current) {
        await accompanimentManagerV2Ref.current.setInstrument(name as any);
    } else if (part === 'harmony' && harmonyManagerRef.current) {
        harmonyManagerRef.current.setInstrument(name as any);
    }
  }, [isInitialized]);

  const scheduleEvents = useCallback((events: FractalEvent[], barStartTime: number, tempo: number, barCount: number, instrumentHints?: InstrumentHints) => {
    if (!Array.isArray(events)) return;
    
    const drumEvents: FractalEvent[] = [];
    const bassEvents: FractalEvent[] = [];
    const accompanimentEvents: FractalEvent[] = [];
    const melodyEvents: FractalEvent[] = [];
    const harmonyEvents: FractalEvent[] = [];
    const sfxEvents: FractalEvent[] = [];

    for (const event of events) {
      const et = Array.isArray(event.type) ? event.type[0] : event.type;
      if (typeof et === 'string' && (et.startsWith('drum_') || et.startsWith('perc-'))) drumEvents.push(event);
      else if (et === 'bass') bassEvents.push(event);
      else if (et === 'accompaniment') accompanimentEvents.push(event);
      else if (et === 'melody') melodyEvents.push(event);
      else if (et === 'harmony') harmonyEvents.push(event);
      else if (et === 'sfx') sfxEvents.push(event);
    }

    if (drumMachineRef.current && drumEvents.length > 0) drumMachineRef.current.schedule(drumEvents, barStartTime, tempo);
    if (bassEvents.length > 0 && bassManagerV2Ref.current) bassManagerV2Ref.current.schedule(bassEvents, barStartTime, tempo, instrumentHints?.bass);
    if (accompanimentEvents.length > 0 && accompanimentManagerV2Ref.current) accompanimentManagerV2Ref.current.schedule(accompanimentEvents, barStartTime, tempo, barCount, instrumentHints?.accompaniment);
    if (melodyEvents.length > 0 && melodyManagerV2Ref.current) melodyManagerV2Ref.current.schedule(melodyEvents, barStartTime, tempo, instrumentHints?.melody);
    if (harmonyManagerRef.current && harmonyEvents.length > 0) harmonyManagerRef.current.schedule(harmonyEvents, barStartTime, tempo, instrumentHints?.harmony);
    if (sfxSynthManagerRef.current && sfxEvents.length > 0) sfxSynthManagerRef.current.trigger(sfxEvents, barStartTime, tempo);
  }, []);

  const initialize = useCallback(async () => {
    if (isInitialized || isInitializing) return true;
    setIsInitializing(true);
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
        }
        const context = audioContextRef.current;
        if (context.state === 'suspended') await context.resume();

        if (!masterGainNodeRef.current) {
            masterGainNodeRef.current = context.createGain();
            speakerGainNodeRef.current = context.createGain();
            masterGainNodeRef.current.connect(speakerGainNodeRef.current);
            speakerGainNodeRef.current.connect(context.destination);
            recorderDestinationRef.current = context.createMediaStreamDestination();
            masterGainNodeRef.current.connect(recorderDestinationRef.current);
            broadcastEngineRef.current = new BroadcastEngine(context, recorderDestinationRef.current.stream);
        }

        const parts = ['bass', 'melody', 'accompaniment', 'drums', 'sparkles', 'sfx', 'harmony', 'pianoAccompaniment'];
        parts.forEach(p => {
            if (!gainNodesRef.current[p]) {
                gainNodesRef.current[p] = context.createGain();
                gainNodesRef.current[p].connect(masterGainNodeRef.current);
            }
        });

        drumMachineRef.current = new DrumMachine(context, gainNodesRef.current.drums);
        blackGuitarSamplerRef.current = new BlackGuitarSampler(context, gainNodesRef.current.melody);
        telecasterSamplerRef.current = new TelecasterGuitarSampler(context, gainNodesRef.current.melody);
        darkTelecasterSamplerRef.current = new DarkTelecasterSampler(context, gainNodesRef.current.melody);
        cs80SamplerRef.current = new CS80GuitarSampler(context, gainNodesRef.current.melody);
        
        accompanimentManagerV2Ref.current = new AccompanimentSynthManagerV2(context, gainNodesRef.current.accompaniment);
        melodyManagerV2Ref.current = new MelodySynthManagerV2(context, gainNodesRef.current.melody, telecasterSamplerRef.current, blackGuitarSamplerRef.current, darkTelecasterSamplerRef.current, cs80SamplerRef.current, 'melody');
        bassManagerV2Ref.current = new MelodySynthManagerV2(context, gainNodesRef.current.bass, telecasterSamplerRef.current, blackGuitarSamplerRef.current, darkTelecasterSamplerRef.current, cs80SamplerRef.current, 'bass');
        
        harmonyManagerRef.current = new HarmonySynthManager(context, gainNodesRef.current.harmony);
        pianoAccompanimentManagerRef.current = new PianoAccompanimentManager(context, gainNodesRef.current.pianoAccompaniment);
        sparklePlayerRef.current = new SparklePlayer(context, gainNodesRef.current.sparkles);
        sfxSynthManagerRef.current = new SfxSynthManager(context, gainNodesRef.current.sfx);

        await Promise.all([
            drumMachineRef.current.init(),
            blackGuitarSamplerRef.current.init(),
            telecasterSamplerRef.current.init(),
            darkTelecasterSamplerRef.current.init(),
            cs80SamplerRef.current.init(),
            accompanimentManagerV2Ref.current.init(),
            melodyManagerV2Ref.current.init(),
            bassManagerV2Ref.current.init(),
            harmonyManagerRef.current.init(),
            pianoAccompanimentManagerRef.current.init(),
            sparklePlayerRef.current.init(),
            sfxSynthManagerRef.current.init()
        ]);

        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('@/app/ambient.worker.ts', import.meta.url), { type: 'module' });
            workerRef.current.postMessage({ command: 'init', data: {} });
        }

        setIsInitialized(true);
        return true;
    } catch (e) {
        toast({ variant: "destructive", title: "Audio Error" });
        return false;
    } finally { setIsInitializing(false); }
  }, [isInitialized, isInitializing, toast]);

  const setIsPlayingCallback = useCallback((playing: boolean) => {
    setIsPlayingState(playing);
    if (!isInitialized || !workerRef.current) return;
    if (playing) {
        nextBarTimeRef.current = audioContextRef.current!.currentTime + 0.5;
        workerRef.current.postMessage({ command: 'start' });
    } else {
        workerRef.current.postMessage({ command: 'stop' });
        [melodyManagerV2Ref, bassManagerV2Ref, accompanimentManagerV2Ref].forEach(r => r.current?.allNotesOff());
    }
  }, [isInitialized]);

  return (
    <AudioEngineContext.Provider value={{
        isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, initialize,
        setIsPlaying: setIsPlayingCallback, updateSettings: (s) => {},
        resetWorker: () => {}, setVolume: (p, v) => {}, setInstrument: setInstrumentCallback as any,
        setBassTechnique: (t) => {}, setTextureSettings: (s) => {},
        setEQGain: (i, g) => {}, startMasterFadeOut: (d) => {}, cancelMasterFadeOut: () => {},
        startRecording: () => {}, stopRecording: () => {}, toggleBroadcast: () => {}, 
        getWorker: () => workerRef.current, playRawEvents: (e, h) => {}
    }}>
      {children}
    </AudioEngineContext.Provider>
  );
};
