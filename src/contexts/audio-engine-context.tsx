/**
 * #ЗАЧЕМ: Audio Engine Context V6.0 — "The V2 Sovereignty".
 * #ЧТО: 1. Полное удаление V1-менеджеров (Bass, Melody, Accomp).
 *       2. Вся маршрутизация переведена на V2-менеджеры и фабрику buildMultiInstrument.
 *       3. Бас теперь использует MelodySynthManagerV2 для обеспечения качества Tier 2/3.
 */
'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { WorkerSettings, InstrumentPart, BassInstrument, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, ScoreName, Mood, Genre } from '@/types/music';
import { DrumMachine } from '@/lib/drum-machine';
import { AccompanimentSynthManagerV2 } from '@/lib/accompaniment-synth-manager-v2';
import { MelodySynthManagerV2 } from '@/lib/melody-synth-manager-v2';
import { HarmonySynthManager } from '@/lib/harmony-synth-manager';
import { PianoAccompanimentManager } from '@/lib/piano-accompaniment-manager';
import { SparklePlayer } from '@/lib/sparkle-player';
import { SfxSynthManager } from '@/lib/sfx-synth-manager';
import { BlackGuitarSampler } from '@/lib/black-guitar-sampler';
import { TelecasterGuitarSampler } from '@/lib/telecaster-guitar-sampler';
import { DarkTelecasterSampler } from '@/lib/dark-telecaster-sampler';
import { CS80GuitarSampler } from '@/lib/cs80-guitar-sampler';
import { BroadcastEngine } from '@/lib/broadcast-engine';
import type { FractalEvent, InstrumentHints } from '@/types/fractal';

// --- Constants ---
const VOICE_BALANCE: Record<InstrumentPart, number> = {
  bass: 0.55, 
  melody: 1.0, 
  accompaniment: 0.6, 
  drums: 0.5, 
  effects: 0.6, 
  sparkles: 0.7, 
  piano: 1.0, 
  violin: 0.8, 
  flute: 0.8, 
  guitarChords: 0.9,
  acousticGuitarSolo: 0.9, 
  blackAcoustic: 0.45, 
  sfx: 0.8, 
  harmony: 0.8,
  telecaster: 0.45, 
  darkTelecaster: 0.45, 
  cs80: 0.25, 
  guitar_shineOn: 0.72, 
  pianoAccompaniment: 0.7, 
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
  
  const isInitializingRef = useRef(false);
  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef<WorkerSettings | null>(null);
  
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
  const { toast } = useToast();

  const stopAllSounds = useCallback(() => {
    [melodyManagerV2Ref, bassManagerV2Ref, accompanimentManagerV2Ref, harmonyManagerRef, pianoAccompanimentManagerRef].forEach(r => r.current?.allNotesOff());
    drumMachineRef.current?.stop();
    sparklePlayerRef.current?.stopAll();
    sfxSynthManagerRef.current?.allNotesOff();
    blackGuitarSamplerRef.current?.stopAll();
    telecasterSamplerRef.current?.stopAll();
    darkTelecasterSamplerRef.current?.stopAll();
    cs80SamplerRef.current?.stopAll();
  }, []);

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
      if (typeof et === 'string' && (et.startsWith('drum_') || et.startsWith('perc-') || et === 'drums')) drumEvents.push(event);
      else if (et === 'bass') bassEvents.push(event);
      else if (et === 'accompaniment') accompanimentEvents.push(event);
      else if (et === 'melody') melodyEvents.push(event);
      else if (et === 'harmony') harmonyEvents.push(event);
      else if (et === 'sfx') sfxEvents.push(event);
    }

    if (drumMachineRef.current && drumEvents.length > 0) drumMachineRef.current.schedule(drumEvents, barStartTime, tempo);
    
    // #ЗАЧЕМ: Тотальная V2 маршрутизация.
    if (bassEvents.length > 0 && bassManagerV2Ref.current) {
        bassManagerV2Ref.current.schedule(bassEvents, barStartTime, tempo, instrumentHints?.bass);
    }
    if (accompanimentEvents.length > 0 && accompanimentManagerV2Ref.current) {
        accompanimentManagerV2Ref.current.schedule(accompanimentEvents, barStartTime, tempo, barCount, instrumentHints?.accompaniment);
    }
    if (melodyEvents.length > 0 && melodyManagerV2Ref.current) {
        melodyManagerV2Ref.current.schedule(melodyEvents, barStartTime, tempo, instrumentHints?.melody);
    }
    if (harmonyManagerRef.current && harmonyEvents.length > 0) {
        harmonyManagerRef.current.schedule(harmonyEvents, barStartTime, tempo, instrumentHints?.harmony);
    }
    if (sfxSynthManagerRef.current && sfxEvents.length > 0) {
        sfxSynthManagerRef.current.trigger(sfxEvents, barStartTime, tempo);
    }
  }, []);

  const initialize = useCallback(async () => {
    if (isInitialized || isInitializingRef.current) return true;
    isInitializingRef.current = true;
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

        if (!drumMachineRef.current) drumMachineRef.current = new DrumMachine(context, gainNodesRef.current.drums!);
        if (!blackGuitarSamplerRef.current) blackGuitarSamplerRef.current = new BlackGuitarSampler(context, gainNodesRef.current.melody);
        if (!telecasterSamplerRef.current) telecasterSamplerRef.current = new TelecasterGuitarSampler(context, gainNodesRef.current.melody);
        if (!darkTelecasterSamplerRef.current) darkTelecasterSamplerRef.current = new DarkTelecasterSampler(context, gainNodesRef.current.melody);
        if (!cs80SamplerRef.current) cs80SamplerRef.current = new CS80GuitarSampler(context, gainNodesRef.current.melody);
        
        // V2 Managers Only
        if (!accompanimentManagerV2Ref.current) accompanimentManagerV2Ref.current = new AccompanimentSynthManagerV2(context, gainNodesRef.current.accompaniment);
        
        if (!melodyManagerV2Ref.current) {
            melodyManagerV2Ref.current = new MelodySynthManagerV2(context, gainNodesRef.current.melody!, telecasterSamplerRef.current!, blackGuitarSamplerRef.current!, darkTelecasterSamplerRef.current!, cs80SamplerRef.current!, 'melody');
        }
        
        if (!bassManagerV2Ref.current) {
            bassManagerV2Ref.current = new MelodySynthManagerV2(context, gainNodesRef.current.bass!, telecasterSamplerRef.current!, blackGuitarSamplerRef.current!, darkTelecasterSamplerRef.current!, cs80SamplerRef.current!, 'bass');
        }
        
        if (!harmonyManagerRef.current) harmonyManagerRef.current = new HarmonySynthManager(context, gainNodesRef.current.harmony);
        if (!pianoAccompanimentManagerRef.current) pianoAccompanimentManagerRef.current = new PianoAccompanimentManager(context, gainNodesRef.current.pianoAccompaniment);
        if (!sparklePlayerRef.current) sparklePlayerRef.current = new SparklePlayer(context, gainNodesRef.current.sparkles);
        if (!sfxSynthManagerRef.current) sfxSynthManagerRef.current = new SfxSynthManager(context, gainNodesRef.current.sfx);

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
            workerRef.current.onmessage = (e) => {
                const { type, payload, error } = e.data;
                if (type === 'SCORE_READY' && payload && settingsRef.current) {
                    scheduleEvents(payload.events, nextBarTimeRef.current, settingsRef.current.bpm, payload.barCount, payload.instrumentHints);
                    nextBarTimeRef.current += payload.barDuration;
                } else if (type === 'sparkle' && payload) {
                    sparklePlayerRef.current?.playRandomSparkle(nextBarTimeRef.current + payload.time, payload.params?.genre, payload.params?.mood, payload.params?.category);
                } else if (type === 'sfx' && payload) {
                    sfxSynthManagerRef.current?.trigger([payload], nextBarTimeRef.current, settingsRef.current?.bpm || 75);
                } else if (type === 'error') {
                    toast({ variant: "destructive", title: "Worker Error", description: error });
                }
            };
            workerRef.current.postMessage({ command: 'init', data: {} });
        }

        setIsInitialized(true);
        return true;
    } catch (e) {
        console.error('[AudioEngine] Init error:', e);
        toast({ variant: "destructive", title: "Audio Error" });
        return false;
    } finally { 
        setIsInitializing(false); 
        isInitializingRef.current = false;
    }
  }, [isInitialized, isInitializing, toast, scheduleEvents]);

  const setIsPlayingStateCallback = useCallback((playing: boolean) => {
    setIsPlayingState(playing);
    if (!isInitialized || !workerRef.current) return;
    if (playing) {
        nextBarTimeRef.current = audioContextRef.current!.currentTime + 0.5;
        workerRef.current.postMessage({ command: 'start' });
    } else {
        workerRef.current.postMessage({ command: 'stop' });
        stopAllSounds();
    }
  }, [isInitialized, stopAllSounds]);

  const setVolumeCallback = useCallback((part: InstrumentPart, volume: number) => {
    if (part === 'pads' || part === 'effects') return;
    
    // Target V2 Managers preamps
    if (part === 'bass' && bassManagerV2Ref.current) {
        bassManagerV2Ref.current.setPreampGain(volume);
        return;
    }
    if (part === 'melody' && melodyManagerV2Ref.current) {
        melodyManagerV2Ref.current.setPreampGain(volume);
        return;
    }
    if (part === 'accompaniment' && accompanimentManagerV2Ref.current) {
        accompanimentManagerV2Ref.current.setPreampGain(volume);
        return;
    }

    const gainNode = gainNodesRef.current[part];
    if (gainNode && audioContextRef.current) {
        const balancedVolume = volume * (VOICE_BALANCE[part] ?? 1);
        gainNode.gain.setTargetAtTime(balancedVolume, audioContextRef.current.currentTime, 0.01);
    }
  }, []);

  return (
    <AudioEngineContext.Provider value={{
        isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, useMelodyV2: true, initialize,
        setIsPlaying: setIsPlayingStateCallback, updateSettings: (s) => {
            if (workerRef.current) {
                settingsRef.current = { ...settingsRef.current, ...s } as WorkerSettings;
                workerRef.current.postMessage({ command: 'update_settings', data: s });
            }
        },
        resetWorker: () => workerRef.current?.postMessage({ command: 'reset' }), 
        setVolume: setVolumeCallback, 
        setInstrument: setInstrumentCallback as any,
        setBassTechnique: (t) => {}, 
        setTextureSettings: (s) => {
            setVolumeCallback('sparkles', s.sparkles.enabled ? s.sparkles.volume : 0);
            setVolumeCallback('sfx', s.sfx.enabled ? s.sfx.volume : 0);
        },
        setEQGain: (i, g) => {}, 
        startMasterFadeOut: (d) => {}, 
        cancelMasterFadeOut: () => {},
        startRecording: () => {}, 
        stopRecording: () => {}, 
        toggleBroadcast: () => {
            if (broadcastEngineRef.current) {
                if (isBroadcastActive) broadcastEngineRef.current.stop();
                else broadcastEngineRef.current.start();
                setIsBroadcastActive(!isBroadcastActive);
            }
        }, 
        getWorker: () => workerRef.current, 
        playRawEvents: (e, h) => {
            scheduleEvents(e, audioContextRef.current!.currentTime + 0.8, 72, 0, h)
        },
        toggleMelodyEngine: () => {} // No-op, always V2
    }}>
      {children}
    </AudioEngineContext.Provider>
  );
};
