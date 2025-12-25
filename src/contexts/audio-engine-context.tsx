

'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { WorkerSettings, Score, InstrumentPart, BassInstrument, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, ScoreName, Note, DrumsScore, EffectsScore, InstrumentType, Genre, Mood } from '@/types/music';
import { DrumMachine } from '@/lib/drum-machine';
import { SamplerPlayer } from '@/lib/sampler-player';
import { ViolinSamplerPlayer } from '@/lib/violin-sampler-player';
import { FluteSamplerPlayer } from '@/lib/flute-sampler-player';
import { AccompanimentSynthManager } from '@/lib/accompaniment-synth-manager';
import { MelodySynthManager } from '@/lib/melody-synth-manager';
import { BassSynthManager } from '@/lib/bass-synth-manager';
import { SparklePlayer } from '@/lib/sparkle-player';
import { SfxSynthManager } from '@/lib/sfx-synth-manager';
import { HarmonySynthManager } from '@/lib/harmony-synth-manager';
import { getPresetParams } from "@/lib/presets";
import { PIANO_SAMPLES, VIOLIN_SAMPLES, FLUTE_SAMPLES, ACOUSTIC_GUITAR_CHORD_SAMPLES, ACOUSTIC_GUITAR_SOLO_SAMPLES } from '@/lib/samples';
import { GuitarChordsSampler } from '@/lib/guitar-chords-sampler';
import { AcousticGuitarSoloSampler } from '@/lib/acoustic-guitar-solo-sampler';
import type { FractalEvent, InstrumentHints } from '@/types/fractal';
import * as Tone from 'tone';

export function noteToMidi(note: string): number {
    return new (Tone.Frequency as any)(note).toMidi();
}

// --- Type Definitions ---
type WorkerMessage = {
    type: 'SCORE_READY' | 'error' | 'debug' | 'sparkle' | 'sfx';
    payload?: {
        events?: FractalEvent[];
        barDuration?: number;
        instrumentHints?: InstrumentHints;
    } | FractalEvent; // payload can be the full score payload or a single event
    error?: string;
    message?: string;
};


// --- Constants ---
const VOICE_BALANCE: Record<InstrumentPart, number> = {
  bass: 1.0, melody: 0.7, accompaniment: 0.6, drums: 1.0,
  effects: 0.6, sparkles: 0.7, piano: 1.0, violin: 0.8, flute: 0.8, guitarChords: 0.9,
  acousticGuitarSolo: 0.9, sfx: 0.8, harmony: 0.8, electricGuitar: 0.9,
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
  setInstrument: (part: 'bass' | 'melody' | 'accompaniment' | 'harmony', name: BassInstrument | MelodyInstrument | AccompanimentInstrument) => void;
  setBassTechnique: (technique: BassTechnique) => void;
  setTextureSettings: (settings: Omit<TextureSettings, 'pads' | 'sfx'>) => void;
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
  const accompanimentManagerRef = useRef<AccompanimentSynthManager | null>(null);
  const melodyManagerRef = useRef<MelodySynthManager | null>(null);
  const harmonyManagerRef = useRef<HarmonySynthManager | null>(null);
  const sparklePlayerRef = useRef<SparklePlayer | null>(null);
  const sfxSynthManagerRef = useRef<SfxSynthManager | null>(null);
  
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const gainNodesRef = useRef<Record<Exclude<InstrumentPart, 'pads' | 'effects'>, GainNode | null>>({
    bass: null, melody: null, accompaniment: null, drums: null, sparkles: null, piano: null, violin: null, flute: null, guitarChords: null, acousticGuitarSolo: null, sfx: null, harmony: null, electricGuitar: null
  });

  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  const nextBarTimeRef = useRef<number>(0);
  const impulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  const setInstrumentCallback = useCallback((part: 'bass' | 'melody' | 'accompaniment' | 'harmony', name: BassInstrument | MelodyInstrument | AccompanimentInstrument | 'piano' | 'guitarChords' | 'violin' | 'flute' | 'acousticGuitarSolo') => {
    if (!isInitialized) return;
    if (part === 'accompaniment' && accompanimentManagerRef.current) {
      accompanimentManagerRef.current.setInstrument(name as AccompanimentInstrument);
    } else if (part === 'melody' && melodyManagerRef.current) {
      melodyManagerRef.current.setInstrument(name as AccompanimentInstrument);
    } else if (part === 'bass' && bassManagerRef.current) {
        bassManagerRef.current.setPreset(name as BassInstrument);
    } else if (part === 'harmony' && harmonyManagerRef.current) {
        harmonyManagerRef.current.setInstrument(name as 'piano' | 'guitarChords' | 'violin' | 'flute' | 'acousticGuitarSolo' | 'none');
    }
  }, [isInitialized]);

  const scheduleEvents = useCallback((events: FractalEvent[], barStartTime: number, tempo: number, instrumentHints?: InstrumentHints) => {
    if (!Array.isArray(events)) {
        return;
    }

    const composerControls = settingsRef.current?.composerControlsInstruments;

    const drumEvents: FractalEvent[] = [];
    const bassEvents: FractalEvent[] = [];
    const accompanimentEvents: FractalEvent[] = [];
    const melodyEvents: FractalEvent[] = [];
    const harmonyEvents: FractalEvent[] = [];
    const sfxEvents: FractalEvent[] = [];

    for (const event of events) {
      const eventType = Array.isArray(event.type) ? event.type[0] : event.type;
      if (typeof eventType === 'string' && (eventType.startsWith('drum_') || eventType.startsWith('perc-'))) {
        drumEvents.push(event);
      } else if (eventType === 'bass') {
        bassEvents.push(event);
      } else if (eventType === 'accompaniment') {
        accompanimentEvents.push(event);
      } else if (eventType === 'melody') {
        melodyEvents.push(event);
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
        if (composerControls === false) {
            const cleanedBassEvents = bassEvents.map(event => {
                const { params, ...rest } = event;
                return rest;
            });
            bassManagerRef.current.play(cleanedBassEvents, barStartTime, tempo);
        } else {
             bassManagerRef.current.play(bassEvents, barStartTime, tempo);
        }
    }

    if (accompanimentManagerRef.current && accompanimentEvents.length > 0) {
        accompanimentManagerRef.current.schedule(accompanimentEvents, barStartTime, tempo, instrumentHints?.accompaniment);
    }
    
    if (melodyManagerRef.current && melodyEvents.length > 0) {
        melodyManagerRef.current.schedule(melodyEvents, barStartTime, tempo, instrumentHints?.melody);
    }

    if (harmonyManagerRef.current && harmonyEvents.length > 0) {
      harmonyManagerRef.current.schedule(harmonyEvents, barStartTime, tempo, instrumentHints?.harmony);
    }

    if (sfxSynthManagerRef.current && sfxEvents.length > 0) {
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
        }

        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const context = audioContextRef.current;
        nextBarTimeRef.current = context.currentTime + 0.1; 
        
        if (!masterGainNodeRef.current) {
            masterGainNodeRef.current = context.createGain();
            masterGainNodeRef.current.connect(context.destination);
        }

        if (!gainNodesRef.current.bass) {
            const parts: Exclude<InstrumentPart, 'pads' | 'effects'>[] = ['bass', 'melody', 'accompaniment', 'drums', 'sparkles', 'piano', 'violin', 'flute', 'guitarChords', 'acousticGuitarSolo', 'sfx', 'harmony', 'electricGuitar'];
            parts.forEach(part => {
                gainNodesRef.current[part] = context.createGain();
                gainNodesRef.current[part]!.connect(masterGainNodeRef.current!);
            });
        }

        const initPromises: Promise<any>[] = [];
        if (!drumMachineRef.current) {
            drumMachineRef.current = new DrumMachine(context, gainNodesRef.current.drums!);
            initPromises.push(drumMachineRef.current.init());
        }
       
        if (!bassManagerRef.current) {
            bassManagerRef.current = new BassSynthManager(context, gainNodesRef.current.bass!);
            initPromises.push(bassManagerRef.current.init());
        }

        if (!accompanimentManagerRef.current) {
            accompanimentManagerRef.current = new AccompanimentSynthManager(context, gainNodesRef.current.accompaniment!);
            initPromises.push(accompanimentManagerRef.current.init());
        }

        if (!melodyManagerRef.current) {
            melodyManagerRef.current = new MelodySynthManager(context, gainNodesRef.current.melody!);
            initPromises.push(melodyManagerRef.current.init());
        }
        
        if (!harmonyManagerRef.current) {
            harmonyManagerRef.current = new HarmonySynthManager(context, gainNodesRef.current.harmony!);
            initPromises.push(harmonyManagerRef.current.init());
        }
        
        if (!sparklePlayerRef.current) {
            sparklePlayerRef.current = new SparklePlayer(context, gainNodesRef.current.sparkles!);
            initPromises.push(sparklePlayerRef.current.init());
        }
        
        if (!sfxSynthManagerRef.current) {
            sfxSynthManagerRef.current = new SfxSynthManager(context, gainNodesRef.current.sfx!);
            initPromises.push(sfxSynthManagerRef.current.init());
        }


        if (!workerRef.current) {
            const worker = new Worker(new URL('@/app/ambient.worker.ts', import.meta.url), { type: 'module' });
            worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
                const { type, payload, error } = event.data;
                
                if (type === 'SCORE_READY' && payload && 'events' in payload) {
                    const { events, barDuration, instrumentHints } = payload;
                    
                    if(events && barDuration && settingsRef.current){
                        const composerControls = settingsRef.current.composerControlsInstruments;
                        scheduleEvents(events, nextBarTimeRef.current, settingsRef.current.bpm, composerControls ? instrumentHints : undefined);
                        nextBarTimeRef.current += barDuration;
                    }

                } else if (type === 'sparkle' && payload && 'params' in payload && 'time' in payload) {
                    const { mood, genre } = (payload as FractalEvent).params as { mood: Mood, genre: Genre };
                    sparklePlayerRef.current?.playRandomSparkle(nextBarTimeRef.current + (payload as FractalEvent).time, genre, mood);
                } else if (type === 'sfx' && payload && 'params' in payload) {
                    sfxSynthManagerRef.current?.trigger([payload as FractalEvent], nextBarTimeRef.current, settingsRef.current?.bpm || 75);
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
            workerRef.current.postMessage({ command: 'external_impulse' });
            scheduleNextImpulse(); // Schedule the next one
        }
    }, randomInterval);
  }, [isPlaying]);

  const stopAllSounds = useCallback(() => {
    bassManagerRef.current?.allNotesOff();
    drumMachineRef.current?.stop();
    accompanimentManagerRef.current?.allNotesOff();
    melodyManagerRef.current?.allNotesOff();
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
    if (part === 'pads' || part === 'effects') return;
    const gainNode = gainNodesRef.current[part as Exclude<InstrumentPart, 'pads' | 'effects'>];
    if (gainNode && audioContextRef.current) {
        const balancedVolume = volume * (VOICE_BALANCE[part] ?? 1);
        gainNode.gain.setTargetAtTime(balancedVolume, audioContextRef.current.currentTime, 0.01);
    }
  }, []);

  const setTextureSettingsCallback = useCallback((settings: Omit<TextureSettings, 'pads' | 'sfx'>) => {
    setVolumeCallback('sparkles', settings.sparkles.enabled ? settings.sparkles.volume : 0);
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
    }}>
      {children}
    </AudioEngineContext.Provider>
  );
};
