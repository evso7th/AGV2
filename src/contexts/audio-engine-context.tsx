'use client';

/**
 * @fileOverview Audio Engine Context V57.0 — "Cold Start Synchronization".
 * #ЗАЧЕМ: Устранение спотыканий в первые 3-4 такта.
 * #ЧТО: ПЛАН №8900 — Стартовое окно расширено до 1.5с (синхронно с фейдом Бродкаста).
 */

import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
import { buildMultiInstrument, type InstrumentAPI, setGlobalVoiceLimit, globalAllNotesOff } from '@/lib/instrument-factory';
import type { FractalEvent } from '@/types/fractal';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useFirestore, useAuth } from '@/firebase/provider';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { V2_PRESETS } from '@/lib/presets-v2';
import { BASS_PRESETS } from '@/lib/bass-presets';

const VOICE_BALANCE: Record<string, number> = {
  bass: 0.55,            
  melody: 0.65,           
  accompaniment: 0.70,
  drums: 0.85,            
  sparkles: 0.85,       
  sfx: 0.90,            
  harmony: 0.85,        
  pianoAccompaniment: 0.45, 
};

const SAMPLER_DEFAULTS: Record<string, number> = {
    master: 1.0, acoustic: 0.15, electric: 0.30, piano: 0.6,
    orchestral: 0.29, cs80: 0.1, chords: 0.6, bass: 1.0
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

interface AudioEngineContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  isPlaying: boolean;
  isRecording: boolean;
  isBroadcastActive: boolean;
  isPreviewPlaying: boolean;
  isPreviewLooping: boolean;
  availableCompositions: { id: string; count: number; genres: string[]; moods: string[] }[];
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
  setCalibrationGain: (key: string, value: number) => void;
  calibrationGains: Record<string, number>;
  voiceLimit: number;
  setVoiceLimit: (limit: number) => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleBroadcast: () => void;
  getWorker: () => Worker | null;
  playRawEvents: (events: FractalEvent[], instrumentHints?: InstrumentHints, tempo?: number) => void;
  stopAllSounds: () => void;
  startPreview: (preset: any, type: string, loop: boolean) => Promise<void>;
  stopPreview: () => void;
  updatePreviewPreset: (preset: any) => void;
  togglePreviewLoop: () => void;
  analyser: AnalyserNode | null;
}

const AudioEngineContext = createContext<AudioEngineContextType | null>(null);

export const useAudioEngine = () => {
  const context = useContext(AudioEngineContext);
  return context || ({} as AudioEngineContextType);
};

export const AudioEngineProvider = ({ children }: { children: React.ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isBroadcastActive, setIsBroadcastActive] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPreviewLooping, setIsPreviewLooping] = useState(false);
  const [availableCompositions, setAvailableCompositions] = useState<{ id: string; count: number; genres: string[]; moods: string[] }[]>([]);
  
  const [voiceLimit, setVoiceLimitState] = useState<number>(180);

  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef<WorkerSettings | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
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
  const samplersMasterGainRef = useRef<GainNode | null>(null);
  const speakerGainNodeRef = useRef<GainNode | null>(null);
  const broadcastEngineRef = useRef<BroadcastEngine | null>(null);
  const gainNodesRef = useRef<Record<string, GainNode>>({});
  const nextBarTimeRef = useRef<number>(0);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  const hasAutoStartedBroadcastRef = useRef<boolean>(false);

  const [calibrationGains, setCalibrationGains] = useState<Record<string, number>>({ master: 1.0, acoustic: 1.0, electric: 1.0, piano: 1.0, orchestral: 1.0, cs80: 1.0, chords: 1.0, bass: 1.0 });

  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();

  useEffect(() => {
      if (typeof window === 'undefined') return;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const defaultLimit = isMobile ? 60 : 180;
      const savedLimit = localStorage.getItem('AuraGroove_VoiceLimit');
      const finalLimit = savedLimit ? parseInt(savedLimit) : defaultLimit;
      const safeLimit = isFinite(finalLimit) ? clamp(finalLimit, 50, 250) : defaultLimit;
      
      setVoiceLimitState(safeLimit);
      setGlobalVoiceLimit(safeLimit);
      
      const savedCal = localStorage.getItem('AuraGroove_Calibration');
      if (savedCal) try { setCalibrationGains(JSON.parse(savedCal)); } catch(e) {}
  }, []);

  useEffect(() => {
    if (!db || !isInitialized) return;

    const axiomsRef = collection(db, 'heritage_axioms');
    const unsubscribe = onSnapshot(axiomsRef, (snapshot) => {
        const axioms = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        const compMap = new Map<string, any>();
        axioms.forEach((ax: any) => {
            const id = ax.compositionId || 'Unknown';
            if (!compMap.has(id)) {
                compMap.set(id, { id, count: 0, genres: new Set(), moods: new Set() });
            }
            const info = compMap.get(id);
            info.count++;
            if (ax.genre) (Array.isArray(ax.genre) ? ax.genre : [ax.genre]).forEach((g:any) => info.genres.add(g));
            if (ax.mood) (Array.isArray(ax.mood) ? ax.mood : [ax.mood]).forEach((m:any) => info.moods.add(m));
        });

        const comps = Array.from(compMap.values()).map(c => ({
            id: c.id,
            count: c.count,
            genres: Array.from(c.genres) as string[],
            moods: Array.from(c.moods) as string[]
        }));

        setAvailableCompositions(comps);
        if (workerRef.current) {
            workerRef.current.postMessage({ command: 'update_cloud_axioms', data: axioms });
        }
    });
    return () => unsubscribe();
  }, [db, isInitialized]);

  const setVoiceLimit = useCallback((limit: number) => {
      const safeLimit = clamp(limit, 50, 250);
      setVoiceLimitState(safeLimit);
      setGlobalVoiceLimit(safeLimit);
      localStorage.setItem('AuraGroove_VoiceLimit', safeLimit.toString());
  }, []);

  const setVolumeCallback = useCallback((part: string, volume: number) => {
    if (!isFinite(volume)) return;
    const balancedVolume = volume * (VOICE_BALANCE[part] ?? 1);
    const gainNode = gainNodesRef.current[part];
    if (gainNode && audioContextRef.current) {
        const now = audioContextRef.current.currentTime;
        gainNode.gain.setTargetAtTime(balancedVolume, now, 0.015);
    }
  }, []);

  const applyCalibration = useCallback((gains: Record<string, number>) => {
      if (!audioContextRef.current) return;
      const now = audioContextRef.current.currentTime;
      masterGainNodeRef.current?.gain.setTargetAtTime(gains.master ?? 1.0, now, 0.05);
      blackGuitarSamplerRef.current?.setPreampGain(SAMPLER_DEFAULTS.acoustic * (gains.acoustic || 1.0));
      telecasterSamplerRef.current?.setPreampGain(SAMPLER_DEFAULTS.electric * (gains.electric || 1.0));
      darkTelecasterSamplerRef.current?.setPreampGain(4.4 * (gains.electric || 1.0)); 
      cs80SamplerRef.current?.setPreampGain(SAMPLER_DEFAULTS.cs80 * (gains.cs80 || 1.0));
      melodyManagerV2Ref.current?.setPreampGain(gains.electric || 1.0); 
      bassManagerV2Ref.current?.setPreampGain(SAMPLER_DEFAULTS.bass * (gains.bass || 1.0));
      pianoAccompanimentManagerRef.current?.setVolume(gains.piano || 1.0); 
      harmonyManagerRef.current?.setVolume(gains.orchestral || 1.0); 
      const chordsSampler = (harmonyManagerRef.current as any)?.guitarChords as any;
      if (chordsSampler) chordsSampler.setPreampGain(SAMPLER_DEFAULTS.chords * (gains.chords || 1.0));
  }, []);

  const stopAllSounds = useCallback(() => {
    globalAllNotesOff();
    [melodyManagerV2Ref, bassManagerV2Ref, accompanimentManagerV2Ref, harmonyManagerRef, pianoAccompanimentManagerRef].forEach(r => r.current?.allNotesOff());
    drumMachineRef.current?.stop();
    sparklePlayerRef.current?.stopAll();
    sfxSynthManagerRef.current?.allNotesOff();
    [blackGuitarSamplerRef, telecasterSamplerRef, darkTelecasterSamplerRef, cs80SamplerRef].forEach(r => r.current?.stopAll());
    
    if (audioContextRef.current && masterGainNodeRef.current) {
        masterGainNodeRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
        masterGainNodeRef.current.gain.setValueAtTime(calibrationGains.master, audioContextRef.current.currentTime);
    }
  }, [calibrationGains.master]);

  const initialize = useCallback(async () => {
    if (isInitialized) return true;
    if (isInitializing) return new Promise<boolean>((resolve) => {
        const check = setInterval(() => {
            if (isInitialized) { clearInterval(check); resolve(true); }
        }, 100);
    });

    setIsInitializing(true);
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ 
            sampleRate: 44100,
            latencyHint: 'playback'
        });
        const context = audioContextRef.current;
        if (context.state === 'suspended') await context.resume();
        if (auth && !auth.currentUser) initiateAnonymousSignIn(auth);
        
        masterGainNodeRef.current = context.createGain();
        masterGainNodeRef.current.gain.value = calibrationGains.master || 1.0; 

        samplersMasterGainRef.current = context.createGain(); 
        samplersMasterGainRef.current.gain.value = 1.0;

        speakerGainNodeRef.current = context.createGain();
        speakerGainNodeRef.current.gain.value = 1.0;

        analyserNodeRef.current = context.createAnalyser();
        analyserNodeRef.current.fftSize = 512; 
        
        samplersMasterGainRef.current.connect(masterGainNodeRef.current);
        masterGainNodeRef.current.connect(analyserNodeRef.current);
        analyserNodeRef.current.connect(speakerGainNodeRef.current);
        speakerGainNodeRef.current.connect(context.destination);
        
        const recDest = context.createMediaStreamDestination();
        masterGainNodeRef.current.connect(recDest);
        recDestRef.current = recDest;
        broadcastEngineRef.current = new BroadcastEngine(context, recDest.stream);
        
        ['bass', 'melody', 'accompaniment', 'drums', 'sparkles', 'sfx', 'harmony', 'pianoAccompaniment'].forEach(p => {
            gainNodesRef.current[p] = context.createGain();
            gainNodesRef.current[p].gain.value = VOICE_BALANCE[p] || 0.5;
            gainNodesRef.current[p].connect(['melody', 'harmony'].includes(p) ? samplersMasterGainRef.current! : masterGainNodeRef.current!);
        });
        
        drumMachineRef.current = new DrumMachine(context, gainNodesRef.current.drums!);
        blackGuitarSamplerRef.current = new BlackGuitarSampler(context, gainNodesRef.current.melody);
        telecasterSamplerRef.current = new TelecasterGuitarSampler(context, gainNodesRef.current.melody);
        darkTelecasterSamplerRef.current = new DarkTelecasterSampler(context, gainNodesRef.current.melody);
        cs80SamplerRef.current = new CS80GuitarSampler(context, gainNodesRef.current.melody);
        accompanimentManagerV2Ref.current = new AccompanimentSynthManagerV2(context, gainNodesRef.current.accompaniment, telecasterSamplerRef.current!, blackGuitarSamplerRef.current!);
        melodyManagerV2Ref.current = new MelodySynthManagerV2(context, gainNodesRef.current.melody, telecasterSamplerRef.current!, blackGuitarSamplerRef.current!, darkTelecasterSamplerRef.current!, cs80SamplerRef.current!, 'melody');
        bassManagerV2Ref.current = new MelodySynthManagerV2(context, gainNodesRef.current.bass, telecasterSamplerRef.current!, blackGuitarSamplerRef.current!, darkTelecasterSamplerRef.current!, cs80SamplerRef.current!, 'bass');
        harmonyManagerRef.current = new HarmonySynthManager(context, gainNodesRef.current.harmony);
        pianoAccompanimentManagerRef.current = new PianoAccompanimentManager(context, gainNodesRef.current.pianoAccompaniment);
        sparklePlayerRef.current = new SparklePlayer(context, gainNodesRef.current.sparkles);
        sfxSynthManagerRef.current = new SfxSynthManager(context, gainNodesRef.current.sfx);
        
        await Promise.all([
            drumMachineRef.current.init(true), blackGuitarSamplerRef.current.init(true),
            telecasterSamplerRef.current.init(), accompanimentManagerV2Ref.current.init(), 
            melodyManagerV2Ref.current.init(), bassManagerV2Ref.current.init(), 
            pianoAccompanimentManagerRef.current.init(), harmonyManagerRef.current.init(false),
            sparklePlayerRef.current.init(5), sfxSynthManagerRef.current.init(5)
        ]);
        
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('@/app/ambient.worker.ts', import.meta.url), { type: 'module' });
            workerRef.current.onmessage = (e) => {
                const { type, payload } = e.data;
                if (type === 'SCORE_READY' && payload) {
                    const bpm = payload.actualBpm || 72;
                    const beatDur = 60 / bpm;
                    const now = context.currentTime;

                    if (payload.barCount === 0) {
                        masterGainNodeRef.current?.gain.setTargetAtTime(calibrationGains.master, now, 0.05);
                    }
                    if (payload.totalBars && payload.barCount >= payload.totalBars - 2) {
                        masterGainNodeRef.current?.gain.setTargetAtTime(0.0001, nextBarTimeRef.current, 1.5);
                    }

                    if (drumMachineRef.current) drumMachineRef.current.schedule(payload.events, nextBarTimeRef.current, bpm);
                    if (bassManagerV2Ref.current) bassManagerV2Ref.current.schedule(payload.events, nextBarTimeRef.current, bpm, payload.instrumentHints?.bass);
                    if (melodyManagerV2Ref.current) melodyManagerV2Ref.current.schedule(payload.events, nextBarTimeRef.current, bpm, payload.instrumentHints?.melody);
                    if (accompanimentManagerV2Ref.current) accompanimentManagerV2Ref.current.schedule(payload.events, nextBarTimeRef.current, bpm, payload.barCount, payload.instrumentHints?.accompaniment);
                    if (harmonyManagerRef.current) harmonyManagerRef.current.schedule(payload.events, nextBarTimeRef.current, bpm, payload.instrumentHints?.harmony);
                    if (pianoAccompanimentManagerRef.current) pianoAccompanimentManagerRef.current.schedule(payload.events, nextBarTimeRef.current, bpm);
                    
                    const sparkles = payload.events.filter((ev: any) => ev.type === 'sparkle');
                    if (sparkles.length > 0 && sparklePlayerRef.current) {
                        sparkles.forEach((s: any) => {
                            const playTime = nextBarTimeRef.current + (s.time * beatDur);
                            sparklePlayerRef.current!.playRandomSparkle(playTime, payload.genre, payload.mood, s.params?.category);
                        });
                    }

                    const sfxEvents = payload.events.filter((ev: any) => ev.type === 'sfx');
                    if (sfxEvents.length > 0 && sfxSynthManagerRef.current) {
                        sfxSynthManagerRef.current.trigger(sfxEvents, nextBarTimeRef.current, bpm);
                    }

                    nextBarTimeRef.current += payload.barDuration;
                }
            };
        }

        applyCalibration(calibrationGains);
        setIsInitialized(true);
        setIsInitializing(false);
        return true;
    } catch (e) { 
        setIsInitializing(false); 
        return false; 
    }
  }, [auth, db, applyCalibration, calibrationGains, isInitialized, isInitializing]);

  const value = useMemo(() => {
    return {
        isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, isPreviewPlaying, isPreviewLooping, availableCompositions,
        initialize, calibrationGains, voiceLimit, setVoiceLimit,
        analyser: analyserNodeRef.current,
        setIsPlaying: async (playing: boolean) => {
            const ready = await initialize();
            if (!ready) return;

            const context = audioContextRef.current;
            if (!context || !workerRef.current) return;

            if (playing) {
                if (context.state === 'suspended') await context.resume();

                if (!hasAutoStartedBroadcastRef.current && broadcastEngineRef.current) {
                    await broadcastEngineRef.current.start();
                    setIsBroadcastActive(true);
                    speakerGainNodeRef.current?.gain.setTargetAtTime(0.0001, context.currentTime, 0.1);
                    hasAutoStartedBroadcastRef.current = true;
                    console.log('%c[AudioEngine] Sequence-Locked Auto-Ignition: Direct Stream Bridge activated.', 'color: #4ade80; font-weight: bold;');
                }

                setIsPlaying(true);
                stopAllSounds(); 
                // #ЗАЧЕМ: ПЛАН №8900. Буфер 1.5с для синхронизации с фейдом Бродкаста и устранения спотыканий.
                nextBarTimeRef.current = context.currentTime + 1.5;
                console.log(`%c[AudioEngine] Start sequence initialized. Scheduled for T+1.5s`, 'color: #DA70D6;');
                workerRef.current.postMessage({ command: 'start' });
            } else {
                setIsPlaying(false);
                workerRef.current.postMessage({ command: 'stop' });
                stopAllSounds(); 
            }
        },
        updateSettings: (s: any) => { 
            if (workerRef.current) { 
                settingsRef.current = { ...(settingsRef.current || {}), ...s }; 
                workerRef.current.postMessage({ command: 'update_settings', data: s }); 
                
                if ((s.genre || s.mood) && 'mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: 'AuraGroove',
                        artist: String(s.genre || settingsRef.current.genre).toUpperCase(),
                        album: String(s.mood || settingsRef.current.mood).toUpperCase(),
                        artwork: [{ src: '/cover.jpg', sizes: '512x512', type: 'image/jpeg' }]
                    });
                }
            } 
        },
        refreshCloudAxioms: async () => {},
        resetWorker: () => workerRef.current?.postMessage({ command: 'reset' }), 
        setVolume: setVolumeCallback, 
        setInstrument: async (part: any, name: any) => {
            if (!isInitialized) return;
            const preset = (V2_PRESETS as any)[name] || (BASS_PRESETS as any)[name];
            if (part === 'bass' && bassManagerV2Ref.current) await bassManagerV2Ref.current.setInstrument(preset || name);
            else if (part === 'melody' && melodyManagerV2Ref.current) await melodyManagerV2Ref.current.setInstrument(preset || name);
            else if (part === 'accompaniment' && accompanimentManagerV2Ref.current) await accompanimentManagerV2Ref.current.setInstrument(preset || name);
            else if (part === 'harmony' && harmonyManagerRef.current) await harmonyManagerRef.current.setInstrument(preset || name);
        },
        setBassTechnique: () => {}, 
        setTextureSettings: (s: any) => {
            setVolumeCallback('sparkles', s.sparkles.enabled ? s.sparkles.volume : 0);
            setVolumeCallback('sfx', s.sfx.enabled ? s.sfx.volume : 0);
        },
        setEQGain: () => {}, 
        setCalibrationGain: (key: string, val: number) => {
            const next = { ...calibrationGains, [key]: val };
            setCalibrationGains(next);
            localStorage.setItem('AuraGroove_Calibration', JSON.stringify(next));
            applyCalibration(next);
        },
        startRecording: () => {
            if (!recDestRef.current) return;
            try {
                recordedChunksRef.current = [];
                const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
                const recorder = new MediaRecorder(recDestRef.current.stream, { mimeType });
                mediaRecorderRef.current = recorder;
                recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
                recorder.onstop = () => {
                    const blob = new Blob(recordedChunksRef.current, { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.style.display = 'none';
                    a.href = url; a.download = `AuraGroove_Session_${Date.now()}.webm`;
                    document.body.appendChild(a); a.click();
                    setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
                };
                recorder.start(1000); 
                setIsRecording(true);
                toast({ title: "Recording Started" });
            } catch (e) {
                toast({ variant: "destructive", title: "Recording Failed" });
            }
        },
        stopRecording: () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
                toast({ title: "Recording Stopped" });
            }
        },
        toggleBroadcast: () => { 
            if (broadcastEngineRef.current && audioContextRef.current) { 
                const now = audioContextRef.current.currentTime;
                if (isBroadcastActive) { 
                    broadcastEngineRef.current.stop(); 
                    setIsBroadcastActive(false); 
                    speakerGainNodeRef.current?.gain.setTargetAtTime(1.0, now, 0.1);
                } else { 
                    broadcastEngineRef.current.start(); 
                    setIsBroadcastActive(true); 
                    speakerGainNodeRef.current?.gain.setTargetAtTime(0.0001, now, 0.1);
                } 
            } 
        }, 
        getWorker: () => workerRef.current,
        playRawEvents: (events: FractalEvent[], instrumentHints?: InstrumentHints, tempo?: number) => {
            if (!audioContextRef.current || !isInitialized) return;
            const now = audioContextRef.current.currentTime;
            const bpm = tempo || 72;
            stopAllSounds();
            if (drumMachineRef.current) drumMachineRef.current.schedule(events, now, bpm);
            if (bassManagerV2Ref.current) bassManagerV2Ref.current.schedule(events, now, bpm);
            if (melodyManagerV2Ref.current) melodyManagerV2Ref.current.schedule(events, now, bpm);
            if (accompanimentManagerV2Ref.current) accompanimentManagerV2Ref.current.schedule(events, now, bpm);
            if (harmonyManagerRef.current) harmonyManagerRef.current.schedule(events, now, bpm);
            if (pianoAccompanimentManagerRef.current) pianoAccompanimentManagerRef.current.schedule(events, now, bpm);
        },
        stopAllSounds,
        startPreview: async (p: any, t: any, l: any) => {},
        stopPreview: () => {},
        updatePreviewPreset: () => {},
        togglePreviewLoop: () => {}
    };
  }, [isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, availableCompositions, calibrationGains, voiceLimit, initialize, applyCalibration, setVolumeCallback, stopAllSounds, setVoiceLimit, toast]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => value.setIsPlaying(true));
        navigator.mediaSession.setActionHandler('pause', () => value.setIsPlaying(false));
        navigator.mediaSession.setActionHandler('stop', () => value.setIsPlaying(false));
    }
  }, [value]);

  return <AudioEngineContext.Provider value={value}>{children}</AudioEngineContext.Provider>;
};
