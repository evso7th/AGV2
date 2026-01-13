
'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { WorkerSettings, Score, InstrumentPart, BassInstrument, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, ScoreName, Note, DrumsScore, EffectsScore, InstrumentType, Genre, Mood } from '@/types/music';
import { DrumMachine } from '@/lib/drum-machine';
import { SamplerPlayer } from '@/lib/sampler-player';
import { ViolinSamplerPlayer } from '@/lib/violin-sampler-player';
import { FluteSamplerPlayer } from '@/lib/flute-sampler-player';
import { AccompanimentSynthManager } from '@/lib/accompaniment-synth-manager';
import { AccompanimentSynthManagerV2 } from '@/lib/accompaniment-synth-manager-v2';
import { MelodySynthManager } from '@/lib/melody-synth-manager';
import { BassSynthManager } from '@/lib/bass-synth-manager';
import { SparklePlayer } from '@/lib/sparkle-player';
import { SfxSynthManager } from '@/lib/sfx-synth-manager';
import { getPresetParams } from "@/lib/presets";
import { PIANO_SAMPLES, VIOLIN_SAMPLES, FLUTE_SAMPLES, ACOUSTIC_GUITAR_CHORD_SAMPLES, ACOUSTIC_GUITAR_SOLO_SAMPLES } from '@/lib/samples';
import { GuitarChordsSampler } from '@/lib/guitar-chords-sampler';
import { AcousticGuitarSoloSampler } from '@/lib/acoustic-guitar-solo-sampler';
import { BlackGuitarSampler } from '@/lib/black-guitar-sampler';
import { TelecasterGuitarSampler } from '@/lib/telecaster-guitar-sampler';
import type { FractalEvent, InstrumentHints } from '@/types/fractal';
import * as Tone from 'tone';
import { MelodySynthManagerV2 } from '@/lib/melody-synth-manager-v2';
import { V2_PRESETS } from '@/lib/presets-v2';

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
        barCount?: number; // Added for logging
    } | FractalEvent; // payload can be the full score payload or a single event
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
  initialize: (initialSettings: Omit<WorkerSettings, 'seed'>) => Promise<boolean>;
  setIsPlaying: (playing: boolean) => void;
  updateSettings: (settings: Partial<WorkerSettings>) => void;
  resetWorker: () => void;
  setVolume: (part: InstrumentPart, volume: number) => void;
  setInstrument: (part: 'bass' | 'melody' | 'accompaniment' | 'harmony', name: BassInstrument | MelodyInstrument | AccompanimentInstrument | keyof typeof V2_PRESETS) => void;
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
  const harmonyManagerRef = useRef<HarmonySynthManager | null>(null);
  const sparklePlayerRef = useRef<SparklePlayer | null>(null);
  const sfxSynthManagerRef = useRef<SfxSynthManager | null>(null);
  const blackGuitarSamplerRef = useRef<BlackGuitarSampler | null>(null);
  const telecasterSamplerRef = useRef<TelecasterGuitarSampler | null>(null);
  
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const gainNodesRef = useRef<Record<Exclude<InstrumentPart, 'pads' | 'effects'>, GainNode | null>>({
    bass: null, melody: null, accompaniment: null, drums: null, sparkles: null, piano: null, violin: null, flute: null, guitarChords: null, acousticGuitarSolo: null, blackAcoustic: null, sfx: null, harmony: null, telecaster: null,
  });

  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  const nextBarTimeRef = useRef<number>(0);
  const impulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  const resetWorkerCallback = useCallback(() => {
    if (workerRef.current) {
        console.log("[AudioEngineContext] Calling resetWorker, posting 'reset' command to worker.");
        workerRef.current.postMessage({ command: 'reset' });
    }
  }, []);

  const updateSettingsCallback = useCallback((settings: Partial<WorkerSettings>) => {
     if (!isInitialized || !workerRef.current) return;
     settingsRef.current = { ...settingsRef.current, ...settings } as WorkerSettings;
     workerRef.current.postMessage({ command: 'update_settings', data: settingsRef.current });
  }, [isInitialized]);

  const toggleMelodyEngine = useCallback(() => {
    setUseMelodyV2(prev => {
        const newValue = !prev;
        console.log(`[AudioEngineContext] Toggling V2 Engine for Melody & Accompaniment: ${newValue}`);
        
        if(newValue) {
            melodyManagerRef.current?.allNotesOff();
            accompanimentManagerRef.current?.allNotesOff();
        } else {
            melodyManagerV2Ref.current?.allNotesOff();
            accompanimentManagerV2Ref.current?.allNotesOff();
        }

        updateSettingsCallback({ useMelodyV2: newValue });

        return newValue;
    });
  }, [updateSettingsCallback]);


  const setInstrumentCallback = useCallback((part: 'bass' | 'melody' | 'accompaniment' | 'harmony', name: BassInstrument | MelodyInstrument | AccompanimentInstrument | 'piano' | 'guitarChords' | 'violin' | 'flute' | 'acousticGuitarSolo' | keyof typeof V2_PRESETS) => {
    if (!isInitialized) return;
    if (part === 'accompaniment') {
      if(useMelodyV2 && accompanimentManagerV2Ref.current) {
        accompanimentManagerV2Ref.current.setInstrument(name as keyof typeof V2_PRESETS);
      } else if (accompanimentManagerRef.current) {
        accompanimentManagerRef.current.setInstrument(name as AccompanimentInstrument);
      }
    } else if (part === 'melody') {
        if(useMelodyV2 && melodyManagerV2Ref.current) {
            melodyManagerV2Ref.current.setInstrument(name as keyof typeof V2_PRESETS);
        } else if (melodyManagerRef.current) {
            melodyManagerRef.current.setInstrument(name as AccompanimentInstrument);
        }
    } else if (part === 'bass' && bassManagerRef.current) {
        bassManagerRef.current.setPreset(name as BassInstrument);
    } else if (part === 'harmony' && harmonyManagerRef.current) {
        harmonyManagerRef.current.setInstrument(name as 'piano' | 'guitarChords' | 'violin' | 'flute' | 'acousticGuitarSolo' | 'none');
    }
  }, [isInitialized, useMelodyV2]);

  const scheduleEvents = useCallback((events: FractalEvent[], barStartTime: number, tempo: number, barCount: number, instrumentHints?: InstrumentHints) => {
    if (!Array.isArray(events)) {
        console.warn("[AudioEngine] scheduleEvents received non-array:", events);
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

    if (accompanimentEvents.length > 0) {
        if (useMelodyV2) {
            if (accompanimentManagerV2Ref.current) {
                accompanimentManagerV2Ref.current.schedule(accompanimentEvents, barStartTime, tempo, barCount, instrumentHints?.accompaniment as keyof typeof V2_PRESETS);
            }
        } else {
            if (accompanimentManagerRef.current) {
                accompanimentManagerRef.current.schedule(accompanimentEvents, barStartTime, tempo, barCount, instrumentHints?.accompaniment);
            }
        }
    }
    
    if (melodyEvents.length > 0) {
        if (useMelodyV2) {
            if (melodyManagerV2Ref.current) {
                melodyManagerV2Ref.current.schedule(melodyEvents, barStartTime, tempo, instrumentHints?.melody);
            }
        } else {
            if (melodyManagerRef.current) {
                melodyManagerRef.current.schedule(melodyEvents, barStartTime, tempo, barCount, instrumentHints?.melody);
            }
        }
    }

    if (harmonyManagerRef.current && harmonyEvents.length > 0) {
      harmonyManagerRef.current.schedule(harmonyEvents, barStartTime, tempo, instrumentHints?.harmony);
    }

    if (sfxSynthManagerRef.current && sfxEvents.length > 0) {
        sfxSynthManagerRef.current.trigger(sfxEvents, barStartTime, settingsRef.current?.bpm || 75);
    }
  }, [useMelodyV2]);

  const setBassTechniqueCallback = useCallback((technique: BassTechnique) => {
    if (bassManagerRef.current) {
        bassManagerRef.current.setTechnique(technique);
    }
  }, []);

  useEffect(() => {
    if (workerRef.current) {
        const worker = workerRef.current;
        const messageHandler = (event: MessageEvent<WorkerMessage>) => {
             const { type, command, payload, error } = event.data;

                if (command === 'SUITE_ENDED') {
                    console.log(`[AudioEngineContext] Received "${command}" command from worker. Triggering seamless regeneration...`);
                    resetWorkerCallback();
                    return;
                }
                
                if (type === 'SCORE_READY' && payload && 'events' in payload) {
                    const { events, barDuration, instrumentHints, barCount } = payload;
                    
                    if(events && barDuration && settingsRef.current && barCount !== undefined){
                        const composerControls = settingsRef.current.composerControlsInstruments;
                        scheduleEvents(events, nextBarTimeRef.current, settingsRef.current.bpm, barCount, composerControls ? instrumentHints : undefined);
                        nextBarTimeRef.current += barDuration;
                    }

                } else if (type === 'HARMONY_SCORE_READY' && payload && 'events' in payload) {
                     const { events, barDuration, instrumentHints, barCount } = payload;
                     console.log(`%c[AudioEngine] Received HARMONY_SCORE_READY for bar ${barCount} with ${events?.length} events.`, 'color: violet');
                     if(events && barDuration && settingsRef.current && barCount !== undefined){
                        scheduleEvents(events, nextBarTimeRef.current, settingsRef.current.bpm, barCount, instrumentHints);
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
        
        worker.onmessage = messageHandler;

        return () => {
            worker.onmessage = null; 
        };
    }
  }, [scheduleEvents, toast, resetWorkerCallback]);

  const initialize = useCallback(async (initialSettings: Omit<WorkerSettings, 'seed'>) => {
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
            const parts: Exclude<InstrumentPart, 'pads' | 'effects'>[] = ['bass', 'melody', 'accompaniment', 'drums', 'sparkles', 'piano', 'violin', 'flute', 'guitarChords', 'acousticGuitarSolo', 'blackAcoustic', 'sfx', 'harmony', 'telecaster'];
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

        if (!accompanimentManagerV2Ref.current) {
            accompanimentManagerV2Ref.current = new AccompanimentSynthManagerV2(context, gainNodesRef.current.accompaniment!);
            initPromises.push(accompanimentManagerV2Ref.current.init());
        }

        if (!melodyManagerRef.current) {
            melodyManagerRef.current = new MelodySynthManager(context, gainNodesRef.current.melody!);
            initPromises.push(melodyManagerRef.current.init());
        }

        if (!blackGuitarSamplerRef.current) {
            blackGuitarSamplerRef.current = new BlackGuitarSampler(context, gainNodesRef.current.melody!);
            initPromises.push(blackGuitarSamplerRef.current.init());
        }

        if (!telecasterSamplerRef.current) {
            telecasterSamplerRef.current = new TelecasterGuitarSampler(context, gainNodesRef.current.melody!);
            initPromises.push(telecasterSamplerRef.current.init());
        }

        if (!melodyManagerV2Ref.current) {
            melodyManagerV2Ref.current = new MelodySynthManagerV2(
                context, 
                gainNodesRef.current.melody!, 
                telecasterSamplerRef.current!, 
                blackGuitarSamplerRef.current!
            );
            initPromises.push(melodyManagerV2Ref.current.init());
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
            workerRef.current = new Worker(new URL('@/app/ambient.worker.ts', import.meta.url), { type: 'module' });
             // Send initial settings to the worker
            const finalInitialSettings = { ...initialSettings, seed: Date.now() };
            settingsRef.current = finalInitialSettings;
            workerRef.current.postMessage({ command: 'init', data: finalInitialSettings });
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
  }, [isInitialized, isInitializing, toast]);

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
    accompanimentManagerV2Ref.current?.allNotesOff();
    melodyManagerRef.current?.allNotesOff();
    melodyManagerV2Ref.current?.allNotesOff();
    harmonyManagerRef.current?.allNotesOff();
    sparklePlayerRef.current?.stopAll();
    sfxSynthManagerRef.current?.allNotesOff();
    blackGuitarSamplerRef.current?.stopAll();
    telecasterSamplerRef.current?.stopAll();
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
        isInitialized, isInitializing, isPlaying, useMelodyV2, initialize,
        setIsPlaying: setIsPlayingCallback, updateSettings: updateSettingsCallback,
        resetWorker: resetWorkerCallback,
        setVolume: setVolumeCallback, setInstrument: setInstrumentCallback,
        setBassTechnique: setBassTechniqueCallback, setTextureSettings: setTextureSettingsCallback,
        setEQGain: setEQGainCallback, startMasterFadeOut, cancelMasterFadeOut,
        toggleMelodyEngine,
    }}>
      {children}
    </AudioEngineContext.Provider>
  );
};
 