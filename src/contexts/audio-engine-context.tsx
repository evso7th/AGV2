
/**
 * #ЗАЧЕМ: Audio Engine Context V12.3 — "BPM Synchronization".
 * #ЧТО: ПЛАН №704 — Добавлена поддержка BPM_SYNC для автоматического обновления UI.
 */
'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { WorkerSettings, InstrumentPart, BassTechnique, TextureSettings, InstrumentHints } from '@/types/music';
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
import type { FractalEvent } from '@/types/fractal';
import { collection, getDocs, query } from 'firebase/firestore';
import { useFirestore, useAuth, initiateAnonymousSignIn } from '@/firebase';

const VOICE_BALANCE: Record<string, number> = {
  bass: 0.60, 
  melody: 0.70, 
  accompaniment: 0.55, 
  drums: 0.65, 
  sparkles: 0.40, 
  sfx: 0.50, 
  harmony: 1.0, 
  pianoAccompaniment: 0.45,
};

interface AudioEngineContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  isPlaying: boolean;
  isRecording: boolean;
  isBroadcastActive: boolean;
  availableCompositions: { id: string; count: number }[];
  initialize: () => Promise<boolean>;
  setIsPlaying: (playing: boolean) => void;
  updateSettings: (settings: Partial<WorkerSettings>) => void;
  refreshCloudAxioms: () => Promise<void>;
  resetWorker: () => void;
  setVolume: (part: string, volume: number) => void;
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
  playRawEvents: (events: FractalEvent[], instrumentHints?: InstrumentHints, tempo?: number) => void;
  stopAllSounds: () => void;
}

const AudioEngineContext = createContext<AudioEngineContextType | null>(null);

export const useAudioEngine = () => {
  const context = useContext(AudioEngineContext);
  if (!context) throw new Error('useAudioEngine must be used within an AudioEngineProvider');
  return context;
};

export const AudioEngineProvider = ({ children }: { children: React.SetStateAction<React.ReactNode> }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPlaying, setIsPlayingState] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isBroadcastActive, setIsBroadcastActive] = useState(false);
  const [availableCompositions, setAvailableCompositions] = useState<{ id: string; count: number }[]>([]);
  
  const initializationInFlightRef = useRef(false);
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
  const broadcastEngineRef = useRef<BroadcastEngine | null>(null);
  const gainNodesRef = useRef<Record<string, GainNode>>({});
  const nextBarTimeRef = useRef<number>(0);
  
  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();

  const setVolumeCallback = useCallback((part: string, volume: number) => {
    const balancedVolume = volume * (VOICE_BALANCE[part] ?? 1);
    const gainNode = gainNodesRef.current[part];
    if (gainNode && audioContextRef.current) {
        gainNode.gain.setTargetAtTime(balancedVolume, audioContextRef.current.currentTime, 0.01);
    }
  }, []);

  const refreshCloudAxioms = useCallback(async () => {
    if (!db) return;
    try {
      const snapshot = await getDocs(query(collection(db, 'heritage_axioms')));
      const axioms = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const counts: Record<string, number> = {};
      axioms.forEach(ax => {
          const compId = (ax as any).compositionId;
          if (compId) counts[compId] = (counts[compId] || 0) + 1;
      });
      const meta = Object.entries(counts).map(([id, count]) => ({ id, count })).sort((a,b) => a.id.localeCompare(b.id));
      setAvailableCompositions(meta);
      if (workerRef.current) workerRef.current.postMessage({ command: 'update_cloud_axioms', data: axioms });
    } catch (e) { console.error('[CloudSync] Failed:', e); }
  }, [db]);

  const stopAllSounds = useCallback(() => {
    [melodyManagerV2Ref, bassManagerV2Ref, accompanimentManagerV2Ref, harmonyManagerRef, pianoAccompanimentManagerRef].forEach(r => r.current?.allNotesOff());
    drumMachineRef.current?.stop();
    sparklePlayerRef.current?.stopAll();
    sfxSynthManagerRef.current?.allNotesOff();
    [blackGuitarSamplerRef, telecasterSamplerRef, darkTelecasterSamplerRef, cs80SamplerRef].forEach(r => r.current?.stopAll());
  }, []);

  const scheduleEvents = useCallback((events: FractalEvent[], barStartTime: number, tempo: number, barCount: number, instrumentHints?: InstrumentHints) => {
    if (!Array.isArray(events)) return;
    
    if (drumMachineRef.current) drumMachineRef.current.schedule(events, barStartTime, tempo);
    if (bassManagerV2Ref.current) bassManagerV2Ref.current.schedule(events, barStartTime, tempo, instrumentHints?.bass, barCount);
    if (accompanimentManagerV2Ref.current) accompanimentManagerV2Ref.current.schedule(events, barStartTime, tempo, barCount, instrumentHints?.accompaniment);
    if (melodyManagerV2Ref.current) melodyManagerV2Ref.current.schedule(events, barStartTime, tempo, instrumentHints?.melody, barCount);
    if (harmonyManagerRef.current) harmonyManagerRef.current.schedule(events, barStartTime, tempo, instrumentHints?.harmony as any);
    if (pianoAccompanimentManagerRef.current) pianoAccompanimentManagerRef.current.schedule(events, barStartTime, tempo);
    if (sfxSynthManagerRef.current) sfxSynthManagerRef.current.trigger(events, barStartTime, tempo);
  }, []);

  const initialize = useCallback(async () => {
    if (isInitialized || initializationInFlightRef.current) return true;
    initializationInFlightRef.current = true;
    setIsInitializing(true);

    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
        const context = audioContextRef.current;
        if (context.state === 'suspended') await context.resume();

        if (auth && !auth.currentUser) {
            initiateAnonymousSignIn(auth);
        }

        if (!masterGainNodeRef.current) {
            masterGainNodeRef.current = context.createGain();
            speakerGainNodeRef.current = context.createGain();
            masterGainNodeRef.current.connect(speakerGainNodeRef.current);
            speakerGainNodeRef.current.connect(context.destination);
            const recDest = context.createMediaStreamDestination();
            masterGainNodeRef.current.connect(recDest);
            broadcastEngineRef.current = new BroadcastEngine(context, recDest.stream);
        }

        const parts = ['bass', 'melody', 'accompaniment', 'drums', 'sparkles', 'sfx', 'harmony', 'pianoAccompaniment'];
        parts.forEach(p => {
            if (!gainNodesRef.current[p]) {
                gainNodesRef.current[p] = context.createGain();
                gainNodesRef.current[p].connect(masterGainNodeRef.current!);
            }
        });

        drumMachineRef.current = new DrumMachine(context, gainNodesRef.current.drums!);
        blackGuitarSamplerRef.current = new BlackGuitarSampler(context, gainNodesRef.current.melody);
        telecasterSamplerRef.current = new TelecasterGuitarSampler(context, gainNodesRef.current.melody);
        darkTelecasterSamplerRef.current = new DarkTelecasterSampler(context, gainNodesRef.current.melody);
        cs80SamplerRef.current = new CS80GuitarSampler(context, gainNodesRef.current.melody);
        
        // #ЗАЧЕМ: Усиление аккомпанемента гитарными сэмплерами.
        accompanimentManagerV2Ref.current = new AccompanimentSynthManagerV2(context, gainNodesRef.current.accompaniment, telecasterSamplerRef.current!, blackGuitarSamplerRef.current!);
        
        melodyManagerV2Ref.current = new MelodySynthManagerV2(context, gainNodesRef.current.melody, telecasterSamplerRef.current!, blackGuitarSamplerRef.current!, darkTelecasterSamplerRef.current!, cs80SamplerRef.current!, 'melody');
        bassManagerV2Ref.current = new MelodySynthManagerV2(context, gainNodesRef.current.bass, telecasterSamplerRef.current!, blackGuitarSamplerRef.current!, darkTelecasterSamplerRef.current!, cs80SamplerRef.current!, 'bass');
        harmonyManagerRef.current = new HarmonySynthManager(context, gainNodesRef.current.harmony);
        pianoAccompanimentManagerRef.current = new PianoAccompanimentManager(context, gainNodesRef.current.pianoAccompaniment);
        sparklePlayerRef.current = new SparklePlayer(context, gainNodesRef.current.sparkles);
        sfxSynthManagerRef.current = new SfxSynthManager(context, gainNodesRef.current.sfx);

        await Promise.all([
            drumMachineRef.current.init(), blackGuitarSamplerRef.current.init(), telecasterSamplerRef.current.init(), 
            darkTelecasterSamplerRef.current.init(), cs80SamplerRef.current.init(), accompanimentManagerV2Ref.current.init(), 
            melodyManagerV2Ref.current.init(), bassManagerV2Ref.current.init(), harmonyManagerRef.current.init(), 
            pianoAccompanimentManagerRef.current.init(), sparklePlayerRef.current.init(), sfxSynthManagerRef.current.init()
        ]);

        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('@/app/ambient.worker.ts', import.meta.url), { type: 'module' });
            workerRef.current.onmessage = (e) => {
                const { type, payload, error } = e.data;
                if (type === 'SCORE_READY' && payload) {
                    scheduleEvents(payload.events, nextBarTimeRef.current, payload.actualBpm || 75, payload.barCount, payload.instrumentHints);
                    nextBarTimeRef.current += payload.barDuration;
                } else if (type === 'BPM_SYNC' && payload) {
                    // #ЗАЧЕМ: Проброс события синхронизации темпа в UI.
                    window.dispatchEvent(new CustomEvent('AG_BPM_SYNC', { detail: { bpm: payload } }));
                } else if (type === 'sparkle' && payload) {
                    sparklePlayerRef.current?.playRandomSparkle(nextBarTimeRef.current + payload.time, payload.params?.genre, payload.params?.mood, payload.params?.category);
                } else if (type === 'sfx' && payload) {
                    sfxSynthManagerRef.current?.trigger([payload], nextBarTimeRef.current, 75);
                } else if (type === 'error') {
                    toast({ variant: "destructive", title: "Worker Error", description: error });
                }
            };
        }

        setIsInitialized(true);
        return true;
    } catch (e) {
        toast({ variant: "destructive", title: "Audio Error" });
        return false;
    } finally { 
        setIsInitializing(false); 
        initializationInFlightRef.current = false;
    }
  }, [toast, scheduleEvents, auth]);

  return (
    <AudioEngineContext.Provider value={{
        isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, availableCompositions, initialize,
        setIsPlaying: (playing) => {
            setIsPlayingState(playing);
            const context = audioContextRef.current;
            if (!context || !workerRef.current) return;
            if (playing) {
                if (context.state === 'suspended') context.resume();
                masterGainNodeRef.current?.gain.setTargetAtTime(1.0, context.currentTime, 0.05);
                stopAllSounds(); 
                nextBarTimeRef.current = context.currentTime + 0.5;
                workerRef.current.postMessage({ command: 'start' });
            } else {
                masterGainNodeRef.current?.gain.setTargetAtTime(0.0, context.currentTime, 0.01);
                workerRef.current.postMessage({ command: 'stop' });
                setTimeout(() => stopAllSounds(), 50); 
            }
        },
        updateSettings: (s) => {
            if (workerRef.current) {
                settingsRef.current = { ...settingsRef.current, ...s } as any;
                workerRef.current.postMessage({ command: 'update_settings', data: s });
            }
        },
        refreshCloudAxioms,
        resetWorker: () => workerRef.current?.postMessage({ command: 'reset' }), 
        setVolume: setVolumeCallback, 
        setInstrument: async (part, name) => {
            if (!isInitialized) return;
            if (part === 'bass' && bassManagerV2Ref.current) await bassManagerV2Ref.current.setInstrument(name);
            else if (part === 'melody' && melodyManagerV2Ref.current) await melodyManagerV2Ref.current.setInstrument(name);
            else if (part === 'accompaniment' && accompanimentManagerV2Ref.current) await accompanimentManagerV2Ref.current.setInstrument(name);
            else if (part === 'harmony' && harmonyManagerRef.current) harmonyManagerRef.current.setInstrument(name as any);
        },
        setBassTechnique: () => {}, 
        setTextureSettings: (s) => {
            setVolumeCallback('sparkles', s.sparkles.enabled ? s.sparkles.volume : 0);
            setVolumeCallback('sfx', s.sfx.enabled ? s.sfx.volume : 0);
        },
        setEQGain: () => {}, startMasterFadeOut: () => {}, cancelMasterFadeOut: () => {},
        toggleBroadcast: () => {
            if (broadcastEngineRef.current) {
                if (isBroadcastActive) broadcastEngineRef.current.stop();
                else broadcastEngineRef.current.start();
                setIsBroadcastActive(!isBroadcastActive);
            }
        }, 
        getWorker: () => workerRef.current, 
        playRawEvents: (e, h, t) => {
            if(audioContextRef.current) scheduleEvents(e, audioContextRef.current.currentTime + 0.8, t || 72, 0, h)
        },
        stopAllSounds,
        startRecording: () => setIsRecording(true),
        stopRecording: () => setIsRecording(false)
    }}>
      {children}
    </AudioEngineContext.Provider>
  );
};
