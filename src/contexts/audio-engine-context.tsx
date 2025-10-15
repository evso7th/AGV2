
'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { WorkerSettings, Score, InstrumentPart, BassInstrument, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, ScoreName, Note, DrumsScore, EffectsScore, InstrumentType } from '@/types/music';
import { DrumMachine } from '@/lib/drum-machine';
import { SamplerPlayer } from '@/lib/sampler-player';
import { ViolinSamplerPlayer } from '@/lib/violin-sampler-player';
import { FluteSamplerPlayer } from '@/lib/flute-sampler-player';
import { AccompanimentSynthManager } from '@/lib/accompaniment-synth-manager';
import { BassSynthManager } from '@/lib/bass-synth-manager';
import { SparklePlayer } from '@/lib/sparkle-player';
import { PadPlayer } from '@/lib/pad-player';
import { getPresetParams } from "@/lib/presets";
import { PIANO_SAMPLES, VIOLIN_SAMPLES, FLUTE_SAMPLES, ACOUSTIC_GUITAR_CHORD_SAMPLES, ACOUSTIC_GUITAR_SOLO_SAMPLES } from '@/lib/samples';
import { GuitarChordsSampler } from '@/lib/guitar-chords-sampler';
import { AcousticGuitarSoloSampler } from '@/lib/acoustic-guitar-solo-sampler';
import type { FractalEvent } from '@/types/fractal';
import * as Tone from 'tone';

export function noteToMidi(note: string): number {
    return new Tone.Frequency(note).toMidi();
}

// --- Type Definitions ---
type WorkerMessage = {
    type: 'SCORE_READY' | 'error' | 'debug';
    events?: FractalEvent[];
    barDuration?: number;
    error?: string;
    message?: string;
};

// --- Constants ---
const VOICE_BALANCE: Record<InstrumentPart, number> = {
  bass: 1.0, melody: 0.7, accompaniment: 0.6, drums: 1.0,
  effects: 0.6, sparkles: 0.35, pads: 0.9, piano: 1.0, violin: 0.8, flute: 0.8, guitarChords: 0.9,
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
  setInstrument: (part: 'bass' | 'melody' | 'accompaniment', name: BassInstrument | MelodyInstrument | AccompanimentInstrument) => void;
  setBassTechnique: (technique: BassTechnique) => void;
  setTextureSettings: (settings: TextureSettings) => void;
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
  
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const gainNodesRef = useRef<Record<InstrumentPart, GainNode | null>>({
    bass: null, melody: null, accompaniment: null, effects: null, drums: null, sparkles: null, pads: null, piano: null, violin: null, flute: null, guitarChords: null, acousticGuitarSolo: null,
  });

  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  const nextBarTimeRef = useRef<number>(0);
  
  const { toast } = useToast();

  const scheduleEvents = useCallback((events: FractalEvent[], barStartTime: number, tempo: number) => {
    console.log('[AudioEngine] scheduleEvents called with', events.length, 'events for time', barStartTime);
    const drumEvents: FractalEvent[] = [];
    const bassEvents: FractalEvent[] = [];

    for (const event of events) {
      if (event.type.startsWith('drum_')) {
        drumEvents.push(event);
      } else if (event.type === 'bass') {
        bassEvents.push(event);
      }
    }

    if (drumMachineRef.current && drumEvents.length > 0) {
      drumMachineRef.current.schedule(drumEvents, barStartTime, tempo);
    }
    
    if (bassManagerRef.current && bassEvents.length > 0) {
        bassManagerRef.current.play(bassEvents, barStartTime);
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
        nextBarTimeRef.current = context.currentTime + 0.1; // Add small buffer
        
        if (!masterGainNodeRef.current) {
            masterGainNodeRef.current = context.createGain();
            masterGainNodeRef.current.connect(context.destination);
        }

        if (!gainNodesRef.current.bass) {
            const parts: InstrumentPart[] = ['bass', 'drums']; // Only initialize what we use
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

        if (!workerRef.current) {
            const worker = new Worker(new URL('../lib/ambient.worker.ts', import.meta.url), { type: 'module' });
            worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
                const { type, events, barDuration, error } = event.data;
                console.log('[AudioEngine] Received message from worker:', event.data);
                if (type === 'SCORE_READY' && events && barDuration && settingsRef.current) {
                    scheduleEvents(events, nextBarTimeRef.current, settingsRef.current.bpm);
                    nextBarTimeRef.current += barDuration;
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

  const stopAllSounds = useCallback(() => {
    bassManagerRef.current?.allNotesOff();
    drumMachineRef.current?.stop();
  }, []);
  
  const setIsPlayingCallback = useCallback((playing: boolean) => {
    setIsPlaying(playing);
    if (!isInitialized || !workerRef.current || !audioContextRef.current) return;
    if (playing) {
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        nextBarTimeRef.current = audioContextRef.current.currentTime + 0.1;
        workerRef.current.postMessage({ command: 'start' });
    } else {
        stopAllSounds();
        workerRef.current.postMessage({ command: 'stop' });
    }
  }, [isInitialized, stopAllSounds]);

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

  // Dummy implementations for unused functions
  const setInstrumentCallback = useCallback((part: any, name: any) => {}, []);
  const setBassTechniqueCallback = useCallback((technique: any) => {}, []);
  const setTextureSettingsCallback = useCallback((settings: any) => {}, []);
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
