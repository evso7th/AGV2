
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
import { DarkTelecasterSampler } from '@/lib/dark-telecaster-sampler';
import { CS80GuitarSampler } from '@/lib/cs80-guitar-sampler';
import type { FractalEvent, InstrumentHints, NavigationInfo } from '@/types/fractal';
import * as Tone from 'tone';
import { MelodySynthManagerV2 } from '@/lib/melody-synth-manager-v2';
import { V2_PRESETS } from '@/lib/presets-v2';
import { HarmonySynthManager } from '@/lib/harmony-synth-manager';
import { PianoAccompanimentManager } from '@/lib/piano-accompaniment-manager';
import { buildMultiInstrument } from '@/lib/instrument-factory';
import { useFirestore, useFirebase, initiateAnonymousSignIn } from '@/firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { saveMasterpiece } from '@/lib/firebase-service';
import { BroadcastEngine } from '@/lib/broadcast-engine';

export function noteToMidi(note: string): number {
    return new (Tone.Frequency as any)(note).toMidi();
}

// --- Type Definitions ---
type WorkerMessage = {
    type: 'SCORE_READY' | 'HARMONY_SCORE_READY' | 'error' | 'debug' | 'sparkle' | 'sfx' | 'HIGH_RESONANCE_DETECTED';
    command?: 'reset' | 'SUITE_ENDED';
    payload?: {
        events?: FractalEvent[];
        barDuration?: number;
        instrumentHints?: InstrumentHints;
        barCount?: number;
        beautyScore?: number;
        seed?: number;
        actualBpm?: number;
    } | FractalEvent;
    error?: string;
    message?: string;
};


// --- Constants ---
const VOICE_BALANCE: Record<InstrumentPart, number> = {
  bass: 0.5, 
  melody: 1.0, 
  accompaniment: 0.6, 
  drums: 1.0,
  effects: 0.6, sparkles: 0.7, piano: 1.0, violin: 0.8, flute: 0.8, guitarChords: 0.9,
  acousticGuitarSolo: 0.9, blackAcoustic: 0.9, sfx: 0.8, harmony: 0.8,
  telecaster: 0.9,
  darkTelecaster: 0.9,
  cs80: 1.0,
  pianoAccompaniment: 0.7,
};

// --- React Context ---
interface AudioEngineContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  isPlaying: boolean;
  useMelodyV2: boolean;
  isRecording: boolean;
  isBroadcastActive: boolean;
  initialize: () => Promise<boolean>;
  setIsPlaying: (playing: boolean) => void;
  updateSettings: (settings: Partial<WorkerSettings>) => void;
  resetWorker: () => void;
  setVolume: (part: InstrumentPart, volume: number) => void;
  setInstrument: (part: 'bass' | 'melody' | 'accompaniment' | 'harmony' | 'pianoAccompaniment', name: BassInstrument | MelodyInstrument | AccompanimentInstrument | 'piano' | 'guitarChords' | 'violin' | 'flute' | 'none') => void;
  setBassTechnique: (technique: BassTechnique) => void;
  setTextureSettings: (settings: Omit<TextureSettings, 'pads' | 'sfx'>) => void;
  setEQGain: (bandIndex: number, gain: number) => void;
  startMasterFadeOut: (durationInSeconds: number) => void;
  cancelMasterFadeOut: () => void;
  toggleMelodyEngine: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleBroadcast: () => void;
  getWorker: () => Worker | null;
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
  const [isPlaying, setIsPlayingState] = useState(false);
  const [useMelodyV2, setUseMelodyV2] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isBroadcastActive, setIsBroadcastActive] = useState(false);
  
  const firebase = useFirebase();
  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef<WorkerSettings | null>(null);
  const db = firebase.firestore;
  const auth = firebase.auth;
  const ancestorsRef = useRef<any[]>([]); 
  
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
  const darkTelecasterSamplerRef = useRef<DarkTelecasterSampler | null>(null);
  const cs80SamplerRef = useRef<CS80GuitarSampler | null>(null);
  
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const speakerGainNodeRef = useRef<GainNode | null>(null);
  const recorderDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const broadcastEngineRef = useRef<BroadcastEngine | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const gainNodesRef = useRef<Record<Exclude<InstrumentPart, 'pads' | 'effects'>, GainNode | null>>({
    bass: null, melody: null, accompaniment: null, drums: null, sparkles: null, piano: null, violin: null, flute: null, guitarChords: null, acousticGuitarSolo: null, blackAcoustic: null, sfx: null, harmony: null, telecaster: null, darkTelecaster: null, cs80: null, pianoAccompaniment: null,
  });

  const nextBarTimeRef = useRef<number>(0);
  const impulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  const getWorker = useCallback(() => workerRef.current, []);

  const loadAncestors = useCallback(async () => {
      try {
          const masterpiecesRef = collection(db, 'masterpieces');
          const q = query(masterpiecesRef, orderBy('timestamp', 'desc'), limit(20));
          const snapshot = await getDocs(q);
          
          ancestorsRef.current = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          }));

          console.log(`%c[GENEPOOL] Global memory audit: ${ancestorsRef.current.length} ancestors found. Cross-session evolution active.`, 'color: #00BFFF; font-weight: bold;');
      } catch (e) {
          console.warn('[Ancestors] Could not load global memory. Operating in "isolated session" mode.', e);
      }
  }, [db]);

  const startRecording = useCallback(() => {
    if (!recorderDestinationRef.current || !isInitialized) return;
    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(recorderDestinationRef.current.stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `auragroove-session-${Date.now()}.webm`; a.click();
      URL.revokeObjectURL(url);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    toast({ title: "Recording Started" });
  }, [isInitialized, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: "Recording Stopped" });
    }
  }, [isRecording, toast]);

  /**
   * #ЗАЧЕМ: Переключение в режим "Радио".
   * #ЧТО: Активирует BroadcastEngine и приглушает прямой выход AudioContext.
   */
  const toggleBroadcast = useCallback(() => {
    if (!broadcastEngineRef.current || !speakerGainNodeRef.current) return;
    
    const nextActive = !isBroadcastActive;
    setIsBroadcastActive(nextActive);

    if (nextActive) {
        // Включаем радио: приглушаем колонки, запускаем поток
        speakerGainNodeRef.current.gain.setTargetAtTime(0, audioContextRef.current!.currentTime, 0.1);
        broadcastEngineRef.current.start();
        toast({ title: "Broadcast Mode ON", description: "Audio is routed through system player buffer." });
    } else {
        // Выключаем радио: включаем колонки, останавливаем поток
        speakerGainNodeRef.current.gain.setTargetAtTime(1, audioContextRef.current!.currentTime, 0.1);
        broadcastEngineRef.current.stop();
        toast({ title: "Broadcast Mode OFF", description: "Switched back to direct AudioContext output." });
    }
  }, [isBroadcastActive, toast]);

  const resetWorkerCallback = useCallback(() => {
    if (workerRef.current) {
        const ancestor = ancestorsRef.current.length > 0 
            ? ancestorsRef.current[Math.floor(Math.random() * ancestorsRef.current.length)]
            : null;
            
        workerRef.current.postMessage({ 
            command: 'update_settings', 
            data: { ancestor } 
        });
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
        if(newValue) {
            melodyManagerRef.current?.allNotesOff();
            accompanimentManagerRef.current?.allNotesOff();
            bassManagerRef.current?.allNotesOff();
        } else {
            melodyManagerV2Ref.current?.allNotesOff();
            accompanimentManagerV2Ref.current?.allNotesOff();
            bassManagerV2Ref.current?.allNotesOff();
        }
        updateSettingsCallback({ useMelodyV2: newValue });
        return newValue;
    });
  }, [updateSettingsCallback]);


  const setInstrumentCallback = useCallback(async (part: any, name: any) => {
    if (!isInitialized) return;
    if (part === 'accompaniment') {
      if(useMelodyV2 && accompanimentManagerV2Ref.current) {
        accompanimentManagerV2Ref.current.setInstrument(name);
      } else if (accompanimentManagerRef.current) {
        accompanimentManagerRef.current.setInstrument(name);
      }
    } else if (part === 'melody') {
        if(useMelodyV2 && melodyManagerV2Ref.current) {
            melodyManagerV2Ref.current.setInstrument(name);
        } else if (melodyManagerRef.current) {
            melodyManagerRef.current.setInstrument(name);
        }
    } else if (part === 'bass') {
        if (useMelodyV2 && bassManagerV2Ref.current) {
            await bassManagerV2Ref.current.setInstrument(name);
        } else if (bassManagerRef.current) {
            bassManagerRef.current.setInstrument(name);
        }
    } else if (part === 'harmony' && harmonyManagerRef.current) {
        harmonyManagerRef.current.setInstrument(name);
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
    const pianoEvents: FractalEvent[] = [];
    const sfxEvents: FractalEvent[] = [];

    for (const event of events) {
      const et = Array.isArray(event.type) ? event.type[0] : event.type;
      if (typeof et === 'string' && (et.startsWith('drum_') || et.startsWith('perc-'))) drumEvents.push(event);
      else if (et === 'bass') bassEvents.push(event);
      else if (et === 'accompaniment') accompanimentEvents.push(event);
      else if (et === 'melody') melodyEvents.push(event);
      else if (et === 'harmony') harmonyEvents.push(event);
      else if (et === 'pianoAccompaniment') pianoEvents.push(event);
      else if (et === 'sfx') sfxEvents.push(event);
    }

    if (drumMachineRef.current && drumEvents.length > 0) drumMachineRef.current.schedule(drumEvents, barStartTime, tempo);
    if (bassEvents.length > 0) {
        if (useMelodyV2 && bassManagerV2Ref.current) bassManagerV2Ref.current.schedule(bassEvents, barStartTime, tempo, instrumentHints?.bass);
        else if (bassManagerRef.current) bassManagerRef.current.schedule(bassEvents, barStartTime, tempo, barCount, instrumentHints?.bass, composerControls);
    }
    if (accompanimentEvents.length > 0) {
        if (useMelodyV2 && accompanimentManagerV2Ref.current) accompanimentManagerV2Ref.current.schedule(accompanimentEvents, barStartTime, tempo, barCount, instrumentHints?.accompaniment as any);
        else if (accompanimentManagerRef.current) accompanimentManagerRef.current.schedule(accompanimentEvents, barStartTime, tempo, barCount, instrumentHints?.accompaniment);
    }
    if (melodyEvents.length > 0) {
        if (useMelodyV2 && melodyManagerV2Ref.current) melodyManagerV2Ref.current.schedule(melodyEvents, barStartTime, tempo, instrumentHints?.melody);
        else if (melodyManagerRef.current) melodyManagerRef.current.schedule(melodyEvents, barStartTime, tempo, barCount, instrumentHints?.melody);
    }
    if (harmonyManagerRef.current && harmonyEvents.length > 0) harmonyManagerRef.current.schedule(harmonyEvents, barStartTime, tempo, instrumentHints?.harmony);
    if (pianoAccompanimentManagerRef.current && pianoEvents.length > 0) pianoAccompanimentManagerRef.current.schedule(pianoEvents, barStartTime, tempo);
    if (sfxSynthManagerRef.current && sfxEvents.length > 0) sfxSynthManagerRef.current.trigger(sfxEvents, barStartTime, settingsRef.current?.bpm || 75);
  }, [useMelodyV2]);

  useEffect(() => {
    if (workerRef.current) {
        workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
             const { type, command, payload, error } = event.data;
                if (command === 'reset' || command === 'SUITE_ENDED') { resetWorkerCallback(); return; }
                
                if (type === 'HIGH_RESONANCE_DETECTED' && payload && 'seed' in payload) {
                    if (settingsRef.current) {
                        console.info(`%c[GENEPOOL] AI ARBITRATOR: Resonance ${payload.beautyScore?.toFixed(3)}! Adding seed ${payload.seed} to global memory.`, 'color: #ff00ff; font-weight: bold; background: #222; padding: 2px 5px; border-radius: 3px;');
                        saveMasterpiece(db, {
                            seed: payload.seed!,
                            mood: settingsRef.current.mood,
                            genre: settingsRef.current.genre,
                            density: settingsRef.current.density,
                            bpm: settingsRef.current.bpm,
                            instrumentSettings: settingsRef.current.instrumentSettings
                        });
                    }
                }

                if (type === 'SCORE_READY' && payload && 'events' in payload) {
                    const { events, barDuration, instrumentHints, barCount, actualBpm } = payload;
                    
                    if (actualBpm && settingsRef.current) {
                        settingsRef.current.bpm = actualBpm;
                    }

                    if(events && barDuration && settingsRef.current && barCount !== undefined){
                        const bufferHealth = nextBarTimeRef.current - audioContextRef.current!.currentTime;
                        if (bufferHealth < 0.25) { 
                            console.warn(`%c[CHRONOS] BUFFER LOW! Health: ${Math.round(bufferHealth * 1000)}ms. High scheduling jitter risk.`, 'color: #f87171; font-weight: bold;');
                        }

                        scheduleEvents(events, nextBarTimeRef.current, settingsRef.current.bpm, barCount, settingsRef.current.composerControlsInstruments ? instrumentHints : undefined);
                        nextBarTimeRef.current += barDuration;
                    }
                } else if (type === 'HARMONY_SCORE_READY' && payload && 'events' in payload) {
                     const { events, barDuration, instrumentHints, barCount } = payload;
                     if(events && barDuration && settingsRef.current && barCount !== undefined){
                        scheduleEvents(events, nextBarTimeRef.current, settingsRef.current.bpm, barCount, instrumentHints);
                    }
                } else if (type === 'sparkle' && payload && 'params' in payload && 'time' in payload) {
                    const { mood, genre, category } = (payload as FractalEvent).params as any;
                    sparklePlayerRef.current?.playRandomSparkle(nextBarTimeRef.current + (payload as FractalEvent).time, genre, mood, category);
                } else if (type === 'sfx' && payload && 'params' in payload) {
                    sfxSynthManagerRef.current?.trigger([payload as FractalEvent], nextBarTimeRef.current, settingsRef.current?.bpm || 75);
                } else if (type === 'error') {
                    toast({ variant: "destructive", title: "Worker Error", description: error });
                }
        };
    }
  }, [scheduleEvents, toast, resetWorkerCallback, db]);

  const initialize = useCallback(async () => {
    if (isInitialized || isInitializing) return true;
    setIsInitializing(true);
    try {
        if (!auth.currentUser) {
            try {
                await initiateAnonymousSignIn(auth);
            } catch (authError) {
                console.warn('[AudioEngine] Anonymous auth failed. Offline mode.', authError);
            }
        }

        if (!audioContextRef.current) {
            // #ЗАЧЕМ: Переход на 48кГц для идеальной совместимости с Opus и Bluetooth.
            // #ЧТО: sampleRate изменен с 44100 на 48000.
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ 
                sampleRate: 48000, 
                latencyHint: 'interactive' 
            });
        }
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
        const context = audioContextRef.current;
        
        nextBarTimeRef.current = context.currentTime + 1.0; 

        if (!masterGainNodeRef.current) {
            masterGainNodeRef.current = context.createGain();
            
            speakerGainNodeRef.current = context.createGain();
            masterGainNodeRef.current.connect(speakerGainNodeRef.current);
            speakerGainNodeRef.current.connect(context.destination);

            recorderDestinationRef.current = context.createMediaStreamDestination(); 
            masterGainNodeRef.current.connect(recorderDestinationRef.current);

            broadcastEngineRef.current = new BroadcastEngine(context, recorderDestinationRef.current.stream);
        }

        if (!gainNodesRef.current.bass) {
            const parts: any[] = ['bass', 'melody', 'accompaniment', 'drums', 'sparkles', 'piano', 'violin', 'flute', 'guitarChords', 'acousticGuitarSolo', 'blackAcoustic', 'sfx', 'harmony', 'telecaster', 'darkTelecaster', 'cs80', 'pianoAccompaniment'];
            parts.forEach(part => { gainNodesRef.current[part] = context.createGain(); gainNodesRef.current[part]!.connect(masterGainNodeRef.current!); });
        }
        const initPromises: Promise<any>[] = [];
        if (!drumMachineRef.current) { drumMachineRef.current = new DrumMachine(context, gainNodesRef.current.drums!); initPromises.push(drumMachineRef.current.init()); }
        if (!bassManagerRef.current) { bassManagerRef.current = new BassSynthManager(context, gainNodesRef.current.bass!); initPromises.push(bassManagerRef.current.init()); }
        if (!accompanimentManagerRef.current) { accompanimentManagerRef.current = new AccompanimentSynthManager(context, gainNodesRef.current.accompaniment!); initPromises.push(accompanimentManagerRef.current.init()); }
        if (!accompanimentManagerV2Ref.current) { accompanimentManagerV2Ref.current = new AccompanimentSynthManagerV2(context, gainNodesRef.current.accompaniment!); initPromises.push(accompanimentManagerV2Ref.current.init()); }
        if (!blackGuitarSamplerRef.current) { blackGuitarSamplerRef.current = new BlackGuitarSampler(context, gainNodesRef.current.melody!); initPromises.push(blackGuitarSamplerRef.current.init()); }
        if (!telecasterSamplerRef.current) { telecasterSamplerRef.current = new TelecasterGuitarSampler(context, gainNodesRef.current.melody!); initPromises.push(telecasterSamplerRef.current.init()); }
        if (!darkTelecasterSamplerRef.current) { darkTelecasterSamplerRef.current = new DarkTelecasterSampler(context, gainNodesRef.current.melody!); initPromises.push(darkTelecasterSamplerRef.current.init()); }
        if (!cs80SamplerRef.current) { cs80SamplerRef.current = new CS80GuitarSampler(context, gainNodesRef.current.melody!); initPromises.push(cs80SamplerRef.current.init()); }
        
        if (!melodyManagerRef.current) { melodyManagerRef.current = new MelodySynthManager(context, gainNodesRef.current.melody!, blackGuitarSamplerRef.current!, telecasterSamplerRef.current!, 'melody'); initPromises.push(melodyManagerRef.current.init()); }
        if (!melodyManagerV2Ref.current) { melodyManagerV2Ref.current = new MelodySynthManagerV2(context, gainNodesRef.current.melody!, telecasterSamplerRef.current!, blackGuitarSamplerRef.current!, darkTelecasterSamplerRef.current!, cs80SamplerRef.current!, 'melody'); initPromises.push(melodyManagerV2Ref.current.init()); }
        if (!bassManagerV2Ref.current) { bassManagerV2Ref.current = new MelodySynthManagerV2(context, gainNodesRef.current.bass!, telecasterSamplerRef.current!, blackGuitarSamplerRef.current!, darkTelecasterSamplerRef.current!, cs80SamplerRef.current!, 'bass'); initPromises.push(bassManagerV2Ref.current.init()); }
        if (!harmonyManagerRef.current) { harmonyManagerRef.current = new HarmonySynthManager(context, gainNodesRef.current.harmony!); initPromises.push(harmonyManagerRef.current.init()); }
        if(!pianoAccompanimentManagerRef.current) { pianoAccompanimentManagerRef.current = new PianoAccompanimentManager(context, gainNodesRef.current.pianoAccompaniment!); initPromises.push(pianoAccompanimentManagerRef.current.init()); }
        if (!sparklePlayerRef.current) { sparklePlayerRef.current = new SparklePlayer(context, gainNodesRef.current.sparkles!); initPromises.push(sparklePlayerRef.current.init()); }
        if (!sfxSynthManagerRef.current) { sfxSynthManagerRef.current = new SfxSynthManager(context, gainNodesRef.current.sfx!); initPromises.push(sfxSynthManagerRef.current.init()); }
        if (!workerRef.current) { workerRef.current = new Worker(new URL('@/app/ambient.worker.ts', import.meta.url), { type: 'module' }); workerRef.current.postMessage({ command: 'init', data: {} }); }
        
        await Promise.all(initPromises);
        await loadAncestors(); 
        setIsInitialized(true);
        return true;
    } catch (e) {
        toast({ variant: "destructive", title: "Audio Initialization Error" });
        return false;
    } finally { setIsInitializing(false); }
  }, [isInitialized, isInitializing, toast, loadAncestors, auth]);

  const scheduleNextImpulse = useCallback(() => {
    if (impulseTimerRef.current) clearTimeout(impulseTimerRef.current);
    impulseTimerRef.current = setTimeout(() => {
        if (workerRef.current && isPlaying) { workerRef.current.postMessage({ command: 'external_impulse' }); scheduleNextImpulse(); }
    }, Math.random() * 90000 + 30000);
  }, [isPlaying]);

  const stopAllSounds = useCallback(() => {
    drumMachineRef.current?.stop();
    [bassManagerRef, accompanimentManagerRef, melodyManagerRef, accompanimentManagerV2Ref, melodyManagerV2Ref, bassManagerV2Ref, harmonyManagerRef, pianoAccompanimentManagerRef, sfxSynthManagerRef].forEach(r => r.current?.allNotesOff());
    sparklePlayerRef.current?.stopAll();
    [blackGuitarSamplerRef, telecasterSamplerRef, darkTelecasterSamplerRef, cs80SamplerRef].forEach(r => r.current?.stopAll());
    if (impulseTimerRef.current) { clearTimeout(impulseTimerRef.current); impulseTimerRef.current = null; }
  }, []);
  
  const setIsPlayingCallback = useCallback((playing: boolean) => {
    setIsPlayingState(playing);
    if (!isInitialized || !workerRef.current || !audioContextRef.current) return;
    if (playing) {
        if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
        stopAllSounds(); 
        nextBarTimeRef.current = audioContextRef.current.currentTime + 1.0; 
        workerRef.current.postMessage({ command: 'start' }); scheduleNextImpulse();
    } else { 
        stopAllSounds(); 
        workerRef.current.postMessage({ command: 'stop' }); 
        if (broadcastEngineRef.current?.isActive()) {
            broadcastEngineRef.current.stop();
            setIsBroadcastActive(false);
            if (speakerGainNodeRef.current) {
                speakerGainNodeRef.current.gain.setTargetAtTime(1, audioContextRef.current.currentTime, 0.1);
            }
        }
    }
  }, [isInitialized, stopAllSounds, scheduleNextImpulse]);

  const setVolumeCallback = useCallback((part: InstrumentPart, volume: number) => {
    if (part === 'pads' || part === 'effects') return;
    if (part === 'bass') {
      if (useMelodyV2 && bassManagerV2Ref.current) (bassManagerV2Ref.current as any).setPreampGain(volume);
      else if (bassManagerRef.current) bassManagerRef.current.setPreampGain(volume);
      return; 
    }
    const gainNode = gainNodesRef.current[part as any];
    if (gainNode && audioContextRef.current) {
        gainNode.gain.setTargetAtTime(volume * (VOICE_BALANCE[part] ?? 1), audioContextRef.current.currentTime, 0.01);
    }
  }, [useMelodyV2]);

  const setTextureSettingsCallback = useCallback((settings: any) => { setVolumeCallback('sparkles', settings.sparkles.enabled ? settings.sparkles.volume : 0); }, [setVolumeCallback]);
  
  return (
    <AudioEngineContext.Provider value={{
        isInitialized, isInitializing, isPlaying, useMelodyV2, isRecording, isBroadcastActive, initialize,
        setIsPlaying: setIsPlayingCallback, updateSettings: updateSettingsCallback,
        resetWorker: resetWorkerCallback, setVolume: setVolumeCallback, setInstrument: setInstrumentCallback,
        setBassTechnique: (t) => {}, setTextureSettings: setTextureSettingsCallback,
        setEQGain: (i, g) => {}, startMasterFadeOut: (d) => {}, cancelMasterFadeOut: () => {},
        toggleMelodyEngine, startRecording, stopRecording, toggleBroadcast, getWorker
    }}>
      {children}
    </AudioEngineContext.Provider>
  );
};
