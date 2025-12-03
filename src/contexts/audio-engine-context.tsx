

'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { WorkerSettings, Score, InstrumentPart, BassInstrument, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, ScoreName, Note, DrumsScore, EffectsScore, InstrumentType, Genre, Mood } from '@/types/music';
import { DrumMachine } from '@/lib/drum-machine';
import { AccompanimentSynthManager } from '@/lib/accompaniment-synth-manager';
import { BassSynthManager } from '@/lib/bass-synth-manager';
import { MelodyPadManager } from '@/lib/melody-pad-manager';
import { SparklePlayer } from '@/lib/sparkle-player';
import { SfxSynthManager } from '@/lib/sfx-synth-manager';
import { HarmonySynthManager } from '@/lib/harmony-synth-manager';
import type { FractalEvent, InstrumentHints } from '@/types/fractal';
import * as Tone from 'tone';

export function noteToMidi(note: string): number {
    return new (Tone.Frequency as any)(note).toMidi();
}

// --- Type Definitions ---
type WorkerMessage = {
    type: 'SCORE_READY' | 'error' | 'debug' | 'sparkle';
    payload?: {
        events?: FractalEvent[];
        barDuration?: number;
        instrumentHints?: InstrumentHints;
        time?: number;
        genre?: Genre;
        mood?: Mood;
        currentSectionName?: string;
    };
    error?: string;
    message?: string;
};


// --- Constants ---
const VOICE_BALANCE: Record<string, number> = {
  bass: 1.0, melody: 0.7, accompaniment: 0.6, harmony: 0.8, drums: 1.0,
  sparkles: 0.7, sfx: 0.8,
  // These are sampler-specific and handled internally by their managers
  piano: 1.0, violin: 0.8, flute: 0.8, guitarChords: 0.9,
  acousticGuitarSolo: 0.9, 
};

const EQ_FREQUENCIES = [60, 125, 250, 500, 1000, 2000, 4000];

// --- React Context ---
interface AudioEngineContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  isPlaying: boolean;
  initialize: () => Promise<boolean>;
  setIsPlaying: (playing: boolean) => void;
  updateSettings: (settings: Partial<WorkerSettings>) => void;
  resetWorker: () => void;
  setVolume: (part: InstrumentPart, volume: number) => void;
  setPreampGain: (part: string, gain: number) => void;
  setInstrument: (part: 'bass' | 'melody' | 'accompaniment' | 'harmony', name: BassInstrument | MelodyInstrument | AccompanimentInstrument) => void;
  setBassTechnique: (technique: BassTechnique) => void;
  setTextureSettings: (settings: Omit<TextureSettings, 'pads'>) => void;
  setEQGain: (bandIndex: number, gain: number) => void;
  startMasterFadeOut: (durationInSeconds: number) => void;
  cancelMasterFadeOut: () => void;
}

const AudioEngineContext = createContext<AudioEngineContextType | null>(null);

export const useAudioEngine = () => {
  const context = useContext(AudioEngineContext);
  if (!context) {
    throw new Error('useAudioEngine must be used within an AudioEngineProvider');
  }
  return context;
};

// --- Provider Component ---
export const AudioEngineProvider = ({ children }: { children: React.ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef<WorkerSettings | null>(null);
  
  const drumMachineRef = useRef<DrumMachine | null>(null);
  const bassManagerRef = useRef<BassSynthManager | null>(null);
  const melodyPadManagerRef = useRef<MelodyPadManager | null>(null);
  const accompanimentManagerRef = useRef<AccompanimentSynthManager | null>(null);
  const harmonyManagerRef = useRef<HarmonySynthManager | null>(null);
  const sparklePlayerRef = useRef<SparklePlayer | null>(null);
  const sfxSynthManagerRef = useRef<SfxSynthManager | null>(null);
  
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const gainNodesRef = useRef<Record<string, GainNode | null>>({
    bass: null, melody: null, accompaniment: null, harmony: null, drums: null, sparkles: null, sfx: null,
  });

  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  const nextBarTimeRef = useRef<number>(0);
  const impulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  const setInstrumentCallback = useCallback((part: 'bass' | 'melody' | 'accompaniment' | 'harmony', name: BassInstrument | MelodyInstrument | AccompanimentInstrument) => {
    if (!isInitialized) return;
    if (part === 'melody' && melodyPadManagerRef.current) {
        melodyPadManagerRef.current.setInstrument(name as MelodyInstrument);
    } else if (part === 'accompaniment' && accompanimentManagerRef.current) {
        accompanimentManagerRef.current.setInstrument(name as AccompanimentInstrument);
    } else if (part === 'bass' && bassManagerRef.current) {
        bassManagerRef.current.setPreset(name as BassInstrument);
    } else if (part === 'harmony' && harmonyManagerRef.current) {
        harmonyManagerRef.current.setInstrument(name as 'piano' | 'guitarChords' | 'violin' | 'flute' | 'none');
    }
  }, [isInitialized]);

  const scheduleEvents = useCallback((events: FractalEvent[], barStartTime: number, tempo: number, instrumentHints?: InstrumentHints, composerControlsInstruments?: boolean, mood?: Mood, genre?: Genre, lfoEnabled?: boolean) => {
    if (!Array.isArray(events)) {
        console.error('[AudioEngine] scheduleEvents received non-array "events":', events);
        return;
    }
    const validEvents = events.filter(e => e && e.type);
    const drumEvents: FractalEvent[] = [];
    const bassEvents: FractalEvent[] = [];
    const melodyEvents: FractalEvent[] = [];
    const accompanimentEvents: FractalEvent[] = [];
    const harmonyEvents: FractalEvent[] = [];
    const sfxEvents: FractalEvent[] = [];

    for (const event of validEvents) {
      const eventType = Array.isArray(event.type) ? event.type[0] : event.type;
      if (typeof eventType === 'string' && (eventType.startsWith('drum_') || eventType.startsWith('perc-'))) {
        drumEvents.push(event);
      } else if (eventType === 'bass') {
        bassEvents.push(event);
      } else if (eventType === 'melody') {
        melodyEvents.push(event);
      } else if (eventType === 'accompaniment') {
        accompanimentEvents.push(event);
      } else if (eventType === 'harmony') {
        harmonyEvents.push(event);
      } else if (eventType === 'sfx') {
        sfxEvents.push(event);
      }
    }
    
    if (drumMachineRef.current && drumEvents.length > 0) {
      drumMachineRef.current.schedule(drumEvents, barStartTime, tempo);
    }
    
    if (bassManagerRef.current && bassEvents.length > 0) {
        bassManagerRef.current.play(bassEvents, barStartTime, tempo);
    }

    if (melodyPadManagerRef.current && melodyEvents.length > 0) {
        melodyPadManagerRef.current.schedule(melodyEvents, barStartTime, tempo, instrumentHints?.melody, composerControlsInstruments, lfoEnabled);
    }

    if (accompanimentManagerRef.current && accompanimentEvents.length > 0) {
        accompanimentManagerRef.current.schedule(accompanimentEvents, barStartTime, tempo, instrumentHints?.accompaniment, composerControlsInstruments, lfoEnabled);
    }

    if (harmonyManagerRef.current && harmonyEvents.length > 0) {
      harmonyManagerRef.current.schedule(harmonyEvents, barStartTime, tempo, instrumentHints?.harmony);
    }
    
    if (sfxSynthManagerRef.current && sfxEvents.length > 0 && mood && genre) {
        console.log(`[AudioEngine] Triggering SFX phrase with ${sfxEvents.length} events`);
        sfxSynthManagerRef.current.trigger(sfxEvents, barStartTime, tempo);
    }

  }, []);

  const setBassTechniqueCallback = useCallback((technique: BassTechnique) => {
    if (bassManagerRef.current) {
        bassManagerRef.current.setTechnique(technique);
    }
  }, []);


  const initialize = useCallback(async () => {
    if (isInitialized || isInitializing) return true;
    
    setIsInitializing(true);
    
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                 sampleRate: 44100, latencyHint: 'interactive'
            });
            console.log('[AudioEngine] AudioContext created. Initial state:', audioContextRef.current.state);
        }

        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
            console.log('[AudioEngine] AudioContext resumed. Current state:', audioContextRef.current.state);
        }

        const context = audioContextRef.current;
        
        if (!masterGainNodeRef.current) {
            masterGainNodeRef.current = context.createGain();
            masterGainNodeRef.current.connect(context.destination);
        }

        if (!gainNodesRef.current.bass) {
            const parts: InstrumentPart[] = ['bass', 'melody', 'accompaniment', 'harmony', 'drums', 'sparkles', 'sfx'];
            parts.forEach(part => {
                const gainNode = context.createGain();
                gainNode.connect(masterGainNodeRef.current!);
                gainNodesRef.current[part] = gainNode;
            });
        }
        
        const destinationFor = (part: keyof typeof gainNodesRef.current) => gainNodesRef.current[part]!;

        const initPromises: Promise<any>[] = [];
        if (!drumMachineRef.current) {
            drumMachineRef.current = new DrumMachine(context, destinationFor('drums'));
            initPromises.push(drumMachineRef.current.init());
        }
       
        if (!bassManagerRef.current) {
            bassManagerRef.current = new BassSynthManager(context, destinationFor('bass'));
            initPromises.push(bassManagerRef.current.init());
        }

        if (!melodyPadManagerRef.current) {
            melodyPadManagerRef.current = new MelodyPadManager(context, destinationFor('melody'));
            initPromises.push(melodyPadManagerRef.current.init());
        }

        if (!accompanimentManagerRef.current) {
            accompanimentManagerRef.current = new AccompanimentSynthManager(context, destinationFor('accompaniment'));
            initPromises.push(accompanimentManagerRef.current.init());
        }
        
        if (!harmonyManagerRef.current) {
            harmonyManagerRef.current = new HarmonySynthManager(context, destinationFor('harmony'));
            initPromises.push(harmonyManagerRef.current.init());
        }
        
        if (!sparklePlayerRef.current) {
            sparklePlayerRef.current = new SparklePlayer(context, destinationFor('sparkles'));
            initPromises.push(sparklePlayerRef.current.init());
        }
        
        if (!sfxSynthManagerRef.current) {
            sfxSynthManagerRef.current = new SfxSynthManager(context, destinationFor('sfx'));
            initPromises.push(sfxSynthManagerRef.current.init());
        }


        if (!workerRef.current) {
            const worker = new Worker(new URL('@/app/ambient.worker.ts', import.meta.url), { type: 'module' });
            worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
                const { type, payload, error } = event.data;
                
                if (type === 'SCORE_READY' && payload && payload.events && payload.barDuration && settingsRef.current && audioContextRef.current) {
                    
                    const { events, barDuration, instrumentHints, mood, genre } = payload;
                    let scheduleTime = nextBarTimeRef.current;
                    const now = audioContextRef.current.currentTime;
                    const lookahead = 0.1; 

                    if (scheduleTime < now) {
                        scheduleTime = now + lookahead;
                        console.warn(`[AudioEngine] Worker tick was late. Resyncing schedule time from ${nextBarTimeRef.current.toFixed(3)} to ${scheduleTime.toFixed(3)}.`);
                    }
                    
                    const { composerControlsInstruments, lfoEnabled } = settingsRef.current;
                    
                    scheduleEvents(events, scheduleTime, settingsRef.current.bpm, instrumentHints, composerControlsInstruments, mood, genre, lfoEnabled);
                    
                    nextBarTimeRef.current = scheduleTime + barDuration;

                } else if (type === 'sparkle' && payload?.time !== undefined && audioContextRef.current) {
                    sparklePlayerRef.current?.playRandomSparkle(nextBarTimeRef.current + payload.time, payload.genre, payload.mood);
                } else if (type === 'error') {
                    toast({ variant: "destructive", title: "Worker Error", description: error });
                }
            };
            workerRef.current = worker;
        }
        
        await Promise.all(initPromises);

        setIsInitialized(true);
        return true;
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        toast({ variant: "destructive", title: "Audio Initialization Error", description: `Could not start audio: ${errorMessage}`});
        console.error(e);
        return false;
    } finally {
        setIsInitializing(false);
    }
  }, [isInitialized, isInitializing, toast, scheduleEvents]);

  const scheduleNextImpulse = useCallback(() => {
    if (impulseTimerRef.current) {
        clearTimeout(impulseTimerRef.current);
    }
    const randomInterval = Math.random() * 90000 + 30000; // 30-120 seconds
    impulseTimerRef.current = setTimeout(() => {
        if (workerRef.current && isPlaying) {
            console.log('[AudioEngine] Sending external impulse to worker.');
            workerRef.current.postMessage({ command: 'external_impulse' });
            scheduleNextImpulse(); // Schedule the next one
        }
    }, randomInterval);
  }, [isPlaying]);

  const stopAllSounds = useCallback(() => {
    bassManagerRef.current?.allNotesOff();
    melodyPadManagerRef.current?.allNotesOff();
    drumMachineRef.current?.stop();
    accompanimentManagerRef.current?.allNotesOff();
    harmonyManagerRef.current?.allNotesOff();
    sparklePlayerRef.current?.stopAll();
    sfxSynthManagerRef.current?.allNotesOff();
    if (impulseTimerRef.current) {
        clearTimeout(impulseTimerRef.current);
        impulseTimerRef.current = null;
    }
  }, []);
  
  const setIsPlayingCallback = useCallback((playing: boolean) => {
    setIsPlaying(playing);
    if (!isInitialized || !workerRef.current || !audioContextRef.current) return;
    if (playing) {
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        stopAllSounds(); // Clear any lingering sounds before starting
        nextBarTimeRef.current = audioContextRef.current.currentTime + 0.2; // Add a buffer
        workerRef.current.postMessage({ command: 'start' });
        scheduleNextImpulse();
    } else {
        stopAllSounds();
        workerRef.current.postMessage({ command: 'stop' });
    }
  }, [isInitialized, stopAllSounds, scheduleNextImpulse]);

  const resetWorkerCallback = useCallback(() => {
    if (!workerRef.current) return;
    if (settingsRef.current) {
      workerRef.current.postMessage({ command: 'init', data: settingsRef.current });
    }
  }, []);


  const updateSettingsCallback = useCallback((settings: Partial<WorkerSettings>) => {
     if (!isInitialized || !workerRef.current) return;
     const newSettings = { ...settingsRef.current, ...settings } as WorkerSettings;
     settingsRef.current = newSettings;
     workerRef.current.postMessage({ command: 'update_settings', data: newSettings });
  }, [isInitialized]);

  const setVolumeCallback = useCallback((part: InstrumentPart, volume: number) => {
    const gainNode = gainNodesRef.current[part];
    if (gainNode && audioContextRef.current) {
        const balancedVolume = volume * (VOICE_BALANCE[part] ?? 1);
        gainNode.gain.setTargetAtTime(balancedVolume, audioContextRef.current.currentTime, 0.01);
    }
  }, []);

  const setPreampGainCallback = useCallback((part: string, gain: number) => {
    const manager = 
        part === 'bass' ? bassManagerRef.current :
        part === 'melody' ? melodyPadManagerRef.current :
        part === 'accompaniment' ? accompanimentManagerRef.current :
        part === 'harmony' ? harmonyManagerRef.current :
        part === 'drums' ? drumMachineRef.current :
        part === 'sparkles' ? sparklePlayerRef.current :
        part === 'sfx' ? sfxSynthManagerRef.current :
        null;
    
    if (manager && 'setPreampGain' in manager) {
      (manager as any).setPreampGain(gain);
    }
  }, []);

  const setTextureSettingsCallback = useCallback((settings: Omit<TextureSettings, 'pads'>) => {
    if (!settings) return;
    if (settings.sparkles) {
      setVolumeCallback('sparkles', settings.sparkles.enabled ? settings.sparkles.volume : 0);
    }
    if (settings.sfx) {
      setVolumeCallback('sfx', settings.sfx.enabled ? settings.sfx.volume : 0);
    }
  }, [setVolumeCallback]);
  
  const setEQGainCallback = useCallback((bandIndex: number, gain: number) => {}, []);
  const startMasterFadeOut = useCallback((durationInSeconds: number) => {}, []);
  const cancelMasterFadeOut = useCallback(() => {}, []);

  return (
    <AudioEngineContext.Provider value={{
        isInitialized, isInitializing, isPlaying, initialize,
        setIsPlaying: setIsPlayingCallback, updateSettings: updateSettingsCallback,
        resetWorker: resetWorkerCallback,
        setVolume: setVolumeCallback, setInstrument: setInstrumentCallback,
        setBassTechnique: setBassTechniqueCallback, setTextureSettings: setTextureSettingsCallback,
        setEQGain: setEQGainCallback, startMasterFadeOut, cancelMasterFadeOut,
        setPreampGain: setPreampGainCallback,
    }}>
      {children}
    </AudioEngineContext.Provider>
  );
};
