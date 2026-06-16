
/**
 * @fileOverview Audio Engine Context V51.2 — "Master Control Protocol".
 * #ЗАЧЕМ: Реализация ПЛАНА №1181. Добавлен мастер-канал в общий поток громкости.
 * #ЧТО: setVolume теперь умеет управлять системным Master Gain.
 */
'use client';

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
import { saveMasterpiece } from '@/lib/firebase-service';
import { buildMultiInstrument, type InstrumentAPI, setGlobalVoiceLimit, globalAllNotesOff } from '@/lib/instrument-factory';
import type { FractalEvent } from '@/types/fractal';
import { collection, getDocs, query, where, limit, onSnapshot } from 'firebase/firestore';
import { useFirestore, useAuth } from '@/firebase/provider';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { V2_PRESETS } from '@/lib/presets-v2';
import { BASS_PRESETS } from '@/lib/bass-presets';

const VOICE_BALANCE: Record<string, number> = {
  bass: 0.50,            
  melody: 0.65,           
  accompaniment: 0.80,
  drums: 0.85,            
  sparkles: 0.45,       
  sfx: 0.45,            
  harmony: 0.80,        
  pianoAccompaniment: 0.325, 
};

const SAMPLER_DEFAULTS: Record<string, number> = {
    master: 1.0,
    acoustic: 0.15,
    electric: 0.15, 
    piano: 0.6,
    orchestral: 0.29,
    cs80: 0.2, 
    chords: 1.2,
    bass: 1.0
};

const EPIC_TEST_SEQUENCE = [
    { m: 60, t: 0, d: 0.5 }, { m: 64, t: 0.5, d: 0.5 }, { m: 67, t: 1.0, d: 1.0 }, { m: 72, t: 2.0, d: 2.0 },
    { m: 67, t: 4.0, d: 0.3 }, { m: 65, t: 4.3, d: 0.3 }, { m: 64, t: 4.6, d: 0.4 }, { m: 62, t: 5.0, d: 1.0 },
    { m: 60, t: 6.0, d: 0.2 }, { m: 60, t: 6.2, d: 0.2 }, { m: 60, t: 6.4, d: 0.2 }, { m: 60, t: 6.6, d: 0.2 },
    { m: 67, t: 7.0, d: 3.0 }, { m: 74, t: 10.0, d: 0.5 }, { m: 76, t: 10.5, d: 0.5 }, { m: 79, t: 11.0, d: 5.0 },
    { m: 60, t: 16.0, d: 8.0 } 
];

interface AudioEngineContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  isPlaying: boolean;
  isRecording: boolean;
  isBroadcastActive: boolean;
  isPreviewPlaying: boolean;
  isPreviewLooping: boolean;
  availableCompositions: { id: string; count: number; genres: string[]; moods: string[] }[];
  currentBar: number;
  totalBars: number;
  currentTrackName: string;
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
  startMasterFadeOut: (durationInSeconds: number) => void;
  cancelMasterFadeOut: () => void;
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
  if (!context) throw new Error('useAudioEngine must be used within an AudioEngineProvider');
  return context;
};

export const AudioEngineProvider = ({ children }: { children: React.ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPlaying, setIsPlayingState] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isBroadcastActive, setIsBroadcastActive] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPreviewLooping, setIsPreviewLooping] = useState(false);
  const [availableCompositions, setAvailableCompositions] = useState<{ id: string; count: number; genres: string[]; moods: string[] }[]>([]);
  
  const [voiceLimit, setVoiceLimitState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('AuraGroove_VoiceLimit');
        return saved ? parseInt(saved, 10) : 512;
    }
    return 512;
  });

  const [currentBar, setCurrentBar] = useState(0);
  const [totalBars, setTotalBars] = useState(144);
  const [currentTrackName, setCurrentTrackName] = useState('Generative Suite');

  const timbreOverridesRef = useRef<Record<string, any>>({});
  const initializationInFlightRef = useRef(false);
  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef<WorkerSettings | null>(null);
  const lastSavedArbiterSeedRef = useRef<number | null>(null);
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
  const transitionGainRef = useRef<GainNode | null>(null);
  const transitionBufferRef = useRef<AudioBuffer | null>(null);
  const gainNodesRef = useRef<Record<string, GainNode>>({});
  const nextBarTimeRef = useRef<number>(0);
  const previewInstrumentRef = useRef<InstrumentAPI | null>(null);
  const previewTimeoutRef = useRef<any>(null);
  const loopingRef = useRef(false);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  const [calibrationGains, setCalibrationGains] = useState<Record<string, number>>(() => {
      const defaults = { master: 1.0, acoustic: 1.0, electric: 1.0, piano: 1.0, orchestral: 1.0, cs80: 1.0, chords: 1.0, bass: 1.0 };
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('AuraGroove_Calibration');
          if (saved) {
              try {
                  const parsed = JSON.parse(saved);
                  return { ...defaults, ...parsed };
              } catch (e) { return defaults; }
          }
      }
      return defaults;
  });

  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();

  const getEffectivePreset = useCallback((presetName: string) => {
      const base = (V2_PRESETS as any)[presetName] || (BASS_PRESETS as any)[presetName];
      if (!base) return null;
      const override = timbreOverridesRef.current[presetName];
      return override ? { ...base, ...override } : base;
  }, []);

  const applyCalibration = useCallback((gains: Record<string, number>) => {
      if (!audioContextRef.current) return;
      const now = audioContextRef.current.currentTime;
      const m = gains.master ?? 1.0;
      masterGainNodeRef.current?.gain.setTargetAtTime(m, now, 0.05);
      blackGuitarSamplerRef.current?.setPreampGain(SAMPLER_DEFAULTS.acoustic * (gains.acoustic || 1.0));
      telecasterSamplerRef.current?.setPreampGain(SAMPLER_DEFAULTS.electric * (gains.electric || 1.0));
      darkTelecasterSamplerRef.current?.setPreampGain(2.2 * (gains.electric || 1.0)); 
      cs80SamplerRef.current?.setPreampGain(SAMPLER_DEFAULTS.cs80 * (gains.cs80 || 1.0));
      melodyManagerV2Ref.current?.setPreampGain(gains.electric || 1.0); 
      bassManagerV2Ref.current?.setPreampGain(SAMPLER_DEFAULTS.bass * (gains.bass || 1.0));
      pianoAccompanimentManagerRef.current?.setVolume(gains.piano || 1.0); 
      harmonyManagerRef.current?.setVolume(gains.orchestral || 1.0); 
      accompanimentManagerV2Ref.current?.setPreampGain(1.0);
      const chordsSampler = (harmonyManagerRef.current as any)?.guitarChords as any;
      if (chordsSampler) chordsSampler.setPreampGain(SAMPLER_DEFAULTS.chords * (gains.chords || 1.0));
  }, []);

  const setCalibrationGain = useCallback((key: string, val: number) => {
      setCalibrationGains(prev => {
          const next = { ...prev, [key]: val };
          localStorage.setItem('AuraGroove_Calibration', JSON.stringify(next));
          applyCalibration(next);
          return next;
      });
  }, [applyCalibration]);

  const setVolumeCallback = useCallback((part: string, volume: number) => {
    if (!isFinite(volume)) return;
    
    // #ЗАЧЕМ: ПЛАН №1181. Поддержка мастер-канала через системную калибровку.
    if (part === 'master') {
        setCalibrationGain('master', volume);
        return;
    }

    const balancedVolume = volume * (VOICE_BALANCE[part] ?? 1);
    const gainNode = gainNodesRef.current[part];
    if (gainNode && audioContextRef.current) {
        const now = audioContextRef.current.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.setTargetAtTime(balancedVolume, now, 0.015);
    }
  }, [setCalibrationGain]);

  const setVoiceLimit = useCallback((limit: number) => {
      setVoiceLimitState(limit);
      setGlobalVoiceLimit(limit);
      localStorage.setItem('AuraGroove_VoiceLimit', limit.toString());
  }, []);

  const stopAllSounds = useCallback(() => {
    globalAllNotesOff();
    [melodyManagerV2Ref, bassManagerV2Ref, accompanimentManagerV2Ref, harmonyManagerRef, pianoAccompanimentManagerRef].forEach(r => r.current?.allNotesOff());
    drumMachineRef.current?.stop(); sparklePlayerRef.current?.stopAll(); sfxSynthManagerRef.current?.allNotesOff();
    [blackGuitarSamplerRef, telecasterSamplerRef, darkTelecasterSamplerRef, cs80SamplerRef].forEach(r => r.current?.stopAll());
  }, []);

  const playTransitionSound = useCallback(() => {
      if (!audioContextRef.current || !transitionBufferRef.current || !transitionGainRef.current) return;
      
      const now = audioContextRef.current.currentTime;
      console.log('%c[Chronos] Playing Vinyl Transition...', 'color: #a855f7; font-weight: bold;');
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = transitionBufferRef.current;
      source.connect(transitionGainRef.current);
      source.start(now);
      
      masterGainNodeRef.current?.gain.cancelScheduledValues(now);
      masterGainNodeRef.current?.gain.setTargetAtTime(calibrationGains.master * 0.25, now, 0.4);
      
      setTimeout(() => {
          if(audioContextRef.current) {
              const resumeNow = audioContextRef.current.currentTime;
              masterGainNodeRef.current?.gain.setTargetAtTime(calibrationGains.master, resumeNow, 0.6);
          }
      }, 1800);
  }, [calibrationGains.master]);

  const scheduleEvents = useCallback((events: FractalEvent[], barStartTime: number, tempo: number, barCount: number, instrumentHints?: InstrumentHints) => {
    if (!Array.isArray(events)) return;
    const beatDuration = 60 / tempo;
    if (drumMachineRef.current) drumMachineRef.current.schedule(events, barStartTime, tempo);
    if (bassManagerV2Ref.current) bassManagerV2Ref.current.schedule(events, barStartTime, tempo, instrumentHints?.bass, barCount);
    if (accompanimentManagerV2Ref.current) accompanimentManagerV2Ref.current.schedule(events, barStartTime, tempo, barCount, instrumentHints?.accompaniment);
    if (melodyManagerV2Ref.current) melodyManagerV2Ref.current.schedule(events, barStartTime, tempo, instrumentHints?.melody, barCount);
    if (harmonyManagerRef.current) harmonyManagerRef.current.schedule(events, barStartTime, tempo, instrumentHints?.harmony as any);
    if (pianoAccompanimentManagerRef.current) { const pianoHint = instrumentHints?.pianoAccompaniment; pianoAccompanimentManagerRef.current.setInstrumentType(pianoHint === 'piano' ? 'acoustic' : 'rhodes'); pianoAccompanimentManagerRef.current.schedule(events, barStartTime, tempo); }
    if (sparklePlayerRef.current) { events.filter(e => e.type === 'sparkle').forEach(s => sparklePlayerRef.current!.playRandomSparkle(barStartTime + (s.time * beatDuration), s.params?.genre, s.params?.mood, s.params?.category)); }
    if (sfxSynthManagerRef.current) sfxSynthManagerRef.current.trigger(events, barStartTime, tempo);
  }, []);

  const refreshCloudAxioms = useCallback(async () => {
    if (!db) return;
    try {
      const snapshot = await getDocs(query(collection(db, 'heritage_axioms')));
      const rawAxioms = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      workerRef.current?.postMessage({ command: 'update_cloud_axioms', data: rawAxioms });

      const compMeta: Record<string, { count: number, genres: Set<string>, moods: Set<string> }> = {};
      rawAxioms.forEach(data => {
          const compId = data.compositionId;
          if (compId) {
              if (!compMeta[compId]) { compMeta[compId] = { count: 0, genres: new Set(), moods: new Set() }; }
              compMeta[compId].count++;
              const genres = Array.isArray(data.genre) ? data.genre : [data.genre];
              genres.forEach(g => compMeta[compId].genres.add(g));
              const moods = Array.isArray(data.mood) ? data.mood : [data.mood];
              moods.forEach(m => compMeta[compId].moods.add(m));
          }
      });
      const meta = Object.entries(compMeta).map(([id, info]) => ({ id, count: info.count, genres: Array.from(info.genres), moods: Array.from(info.moods) })).sort((a,b) => a.id.localeCompare(b.id));
      setAvailableCompositions(meta);
    } catch (e) {
      console.error('[AudioEngine] Failed to refresh axioms:', e);
    }
  }, [db]);

  useEffect(() => {
    if (isInitialized && db && workerRef.current) {
        const unsubscribe = onSnapshot(collection(db, 'heritage_axioms'), (snapshot) => {
            const rawAxioms = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            workerRef.current?.postMessage({ command: 'update_cloud_axioms', data: rawAxioms });
            
            const compMeta: Record<string, { count: number, genres: Set<string>, moods: Set<string> }> = {};
            rawAxioms.forEach(data => {
                const compId = data.compositionId;
                if (compId) {
                    if (!compMeta[compId]) compMeta[compId] = { count: 0, genres: new Set(), moods: new Set() };
                    compMeta[compId].count++;
                    const genres = Array.isArray(data.genre) ? data.genre : [data.genre];
                    genres.forEach(g => compMeta[compId].genres.add(g));
                    const moods = Array.isArray(data.mood) ? data.mood : [data.mood];
                    moods.forEach(m => compMeta[compId].moods.add(m));
                }
            });
            const meta = Object.entries(compMeta).map(([id, info]) => ({ id, count: info.count, genres: Array.from(info.genres), moods: Array.from(info.moods) })).sort((a,b) => a.id.localeCompare(b.id));
            setAvailableCompositions(meta);
        });
        return () => unsubscribe();
    }
  }, [isInitialized, db]);

  const initialize = useCallback(async () => {
    if (isInitialized || initializationInFlightRef.current) return true;
    initializationInFlightRef.current = true; setIsInitializing(true);
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
        const context = audioContextRef.current; if (context.state === 'suspended') await context.resume();
        if (auth && !auth.currentUser) initiateAnonymousSignIn(auth);
        
        setGlobalVoiceLimit(voiceLimit);

        if (!transitionBufferRef.current) {
            try {
                const res = await fetch('/assets/music/vinyl_disk.ogg');
                const arrayBuffer = await res.arrayBuffer();
                transitionBufferRef.current = await context.decodeAudioData(arrayBuffer);
            } catch (e) { console.warn('[AudioEngine] Vinyl sample not found.'); }
        }

        if (!masterGainNodeRef.current) {
            masterGainNodeRef.current = context.createGain(); 
            samplersMasterGainRef.current = context.createGain(); 
            speakerGainNodeRef.current = context.createGain();
            speakerGainNodeRef.current.gain.value = 1.0; 
            
            transitionGainRef.current = context.createGain();
            transitionGainRef.current.gain.value = 0.6;
            
            analyserNodeRef.current = context.createAnalyser(); 
            analyserNodeRef.current.fftSize = 512;
            
            samplersMasterGainRef.current.connect(masterGainNodeRef.current); 
            masterGainNodeRef.current.connect(analyserNodeRef.current);
            transitionGainRef.current.connect(analyserNodeRef.current);
            
            analyserNodeRef.current.connect(speakerGainNodeRef.current); 
            speakerGainNodeRef.current.connect(context.destination);
            
            const recDest = context.createMediaStreamDestination(); 
            masterGainNodeRef.current.connect(recDest); 
            transitionGainRef.current.connect(recDest);
            recDestRef.current = recDest;
            broadcastEngineRef.current = new BroadcastEngine(context, recDest.stream);
        }
        ['bass', 'melody', 'accompaniment', 'drums', 'sparkles', 'sfx', 'harmony', 'pianoAccompaniment'].forEach(p => {
            if (!gainNodesRef.current[p]) { gainNodesRef.current[p] = context.createGain(); gainNodesRef.current[p].connect(['melody', 'harmony'].includes(p) ? samplersMasterGainRef.current! : masterGainNodeRef.current!); }
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
        await Promise.all([ drumMachineRef.current.init(true), blackGuitarSamplerRef.current.init(true), telecasterSamplerRef.current.init(), accompanimentManagerV2Ref.current.init(), melodyManagerV2Ref.current.init(), bassManagerV2Ref.current.init(), pianoAccompanimentManagerRef.current.init(), harmonyManagerRef.current.init(true), sparklePlayerRef.current.init(5), sfxSynthManagerRef.current.init(5) ]);
        
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('@/app/ambient.worker.ts', import.meta.url), { type: 'module' });
            workerRef.current.onmessage = (e) => {
                const { type, payload, error } = e.data;
                if (type === 'SCORE_READY' && payload) {
                    const ctx = audioContextRef.current;
                    if (!ctx) return;

                    setCurrentBar(payload.barCount);
                    setTotalBars(payload.totalBars);
                    if (payload.trackName) setCurrentTrackName(payload.trackName);
                    
                    let scheduleTime = nextBarTimeRef.current;
                    const now = ctx.currentTime;
                    
                    if (payload.barCount === 0 || scheduleTime < now - 0.1) {
                         scheduleTime = now + 0.15; 
                    }

                    scheduleEvents(payload.events, scheduleTime, payload.actualBpm || 75, payload.barCount, payload.instrumentHints);
                    nextBarTimeRef.current = scheduleTime + payload.barDuration;

                    if (payload.beautyScore >= 0.88 && settingsRef.current && payload.seed !== lastSavedArbiterSeedRef.current) {
                        saveMasterpiece(db, { seed: payload.seed, mood: settingsRef.current.mood, genre: settingsRef.current.genre, density: settingsRef.current.density, bpm: payload.actualBpm || settingsRef.current.bpm, instrumentSettings: settingsRef.current.instrumentSettings, isArbiterFind: true });
                        lastSavedArbiterSeedRef.current = payload.seed;
                    }
                } else if (type === 'SUITE_TRANSITION') {
                    playTransitionSound();
                } else if (type === 'HISTORY_UPDATE' && payload) { localStorage.setItem('AuraGroove_TrackHistory', JSON.stringify(payload)); }
                else if (type === 'BPM_SYNC' && payload) { window.dispatchEvent(new CustomEvent('AG_BPM_SYNC', { detail: { bpm: payload } })); }
                else if (type === 'error') toast({ variant: "destructive", title: "Worker Error", description: error });
            };
        }
        
        await refreshCloudAxioms(); 
        applyCalibration(calibrationGains);
        setIsInitialized(true); setIsInitializing(false); initializationInFlightRef.current = false;
        return true;
    } catch (e) { toast({ variant: "destructive", title: "Audio Error" }); return false; }
  }, [toast, auth, refreshCloudAxioms, db, applyCalibration, calibrationGains, scheduleEvents, playTransitionSound, voiceLimit]);

  const handleTogglePlay = useCallback(async (playing: boolean) => {
      const context = audioContextRef.current; if (!context || !workerRef.current) return;
      if (playing) { 
          if (context.state === 'suspended') await context.resume(); 
          setIsPlayingState(true); 
          masterGainNodeRef.current?.gain.setTargetAtTime(calibrationGains.master, context.currentTime, 0.05); 
          stopAllSounds(); 
          nextBarTimeRef.current = context.currentTime + 0.5; 
          workerRef.current.postMessage({ command: 'start' }); 
      } else { 
          setIsPlayingState(false); 
          masterGainNodeRef.current?.gain.setTargetAtTime(0.0, context.currentTime, 0.01); 
          workerRef.current.postMessage({ command: 'stop' }); 
          stopAllSounds(); 
      }
  }, [calibrationGains.master, stopAllSounds]);

  const toggleBroadcastCallback = useCallback(async () => {
      if (!isInitialized) {
          const success = await initialize();
          if (!success) return;
      }

      if (broadcastEngineRef.current && audioContextRef.current && speakerGainNodeRef.current) {
          const now = audioContextRef.current.currentTime;
          if (isBroadcastActive) {
              broadcastEngineRef.current.stop();
              speakerGainNodeRef.current.gain.setTargetAtTime(1.0, now, 0.05);
              setIsBroadcastActive(false);
          } else {
              broadcastEngineRef.current.start();
              speakerGainNodeRef.current.gain.setTargetAtTime(0.0, now, 0.05);
              setIsBroadcastActive(true);
          }
      }
  }, [isInitialized, initialize, isBroadcastActive]);

  const contextValue = useMemo(() => ({
      isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, isPreviewPlaying, isPreviewLooping, availableCompositions, initialize,
      analyser: analyserNodeRef.current, voiceLimit, setVoiceLimit, currentBar, totalBars, currentTrackName,
      setIsPlaying: handleTogglePlay,
      updateSettings: (s: any) => { if (workerRef.current) { settingsRef.current = { ...settingsRef.current, ...s }; workerRef.current.postMessage({ command: 'update_settings', data: s }); } },
      refreshCloudAxioms, getWorker: () => workerRef.current, 
      resetWorker: () => {
          setCurrentBar(0); 
          workerRef.current?.postMessage({ command: 'reset' });
      }, 
      setVolume: setVolumeCallback, 
      setInstrument: async (part: any, name: any) => { if (!isInitialized) return; const preset = getEffectivePreset(name); if (part === 'bass' && bassManagerV2Ref.current) await bassManagerV2Ref.current.setInstrument(preset || name); else if (part === 'melody' && melodyManagerV2Ref.current) await melodyManagerV2Ref.current.setInstrument(preset || name); else if (part === 'accompaniment' && accompanimentManagerV2Ref.current) await accompanimentManagerV2Ref.current.setInstrument(preset || name); else if (part === 'harmony' && harmonyManagerRef.current) await harmonyManagerRef.current.setInstrument(preset || name); },
      setBassTechnique: () => {}, setTextureSettings: (s: any) => { setVolumeCallback('sparkles', s.sparkles.enabled ? s.sparkles.volume : 0); setVolumeCallback('sfx', s.sfx.enabled ? s.sfx.volume : 0); },
      setEQGain: () => {}, setCalibrationGain, calibrationGains, startMasterFadeOut: () => {}, cancelMasterFadeOut: () => {}, startRecording: () => { if (!recDestRef.current || isRecording) return; recordedChunksRef.current = []; const mediaRecorder = new MediaRecorder(recDestRef.current.stream); mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); }; mediaRecorder.onstop = () => { const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `AuraGroove_Session_${new Date().toISOString()}.webm`; a.click(); }; mediaRecorder.start(); mediaRecorderRef.current = mediaRecorder; setIsRecording(true); }, stopRecording: () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); } },
      toggleBroadcast: toggleBroadcastCallback, 
      playRawEvents: (ev: any, h: any, t: any) => { if(audioContextRef.current) scheduleEvents(ev, audioContextRef.current.currentTime + 0.1, t || 72, 0, h); },
      stopAllSounds, startPreview: async (p: any, t: any, l: any) => { if (!isInitialized) await initialize(); loopingRef.current = l; setIsPreviewPlaying(true); const previewInst = await buildMultiInstrument(audioContextRef.current!, { type: t, preset: p, output: masterGainNodeRef.current! }); previewInstrumentRef.current = previewInst; const scheduleSeq = () => { const now = audioContextRef.current!.currentTime + 0.1; EPIC_TEST_SEQUENCE.forEach(n => { previewInst.noteOn(n.m, now + n.t, 0.8, n.d); }); const totalDur = Math.max(...EPIC_TEST_SEQUENCE.map(n => n.t + n.d)) + 1.0; if (loopingRef.current) { previewTimeoutRef.current = setTimeout(scheduleSeq, totalDur * 1000); } else { previewTimeoutRef.current = setTimeout(() => setIsPreviewPlaying(false), totalDur * 1000); } }; scheduleSeq(); }, stopPreview: () => { if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current); if (previewInstrumentRef.current) { previewInstrumentRef.current.allNotesOff(); previewInstrumentRef.current.disconnect(); previewInstrumentRef.current = null; } setIsPreviewPlaying(false); }, updatePreviewPreset: (p: any) => { previewInstrumentRef.current?.setPreset(p); }, togglePreviewLoop: () => { loopingRef.current = !loopingRef.current; setIsPreviewLooping(loopingRef.current); }
  }), [
      isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, isPreviewPlaying, isPreviewLooping, 
      availableCompositions, initialize, voiceLimit, setVoiceLimit, handleTogglePlay, refreshCloudAxioms, 
      setVolumeCallback, calibrationGains, setCalibrationGain, toggleBroadcastCallback, 
      stopAllSounds, getEffectivePreset, currentBar, totalBars, currentTrackName, scheduleEvents
  ]);

  return <AudioEngineContext.Provider value={contextValue}>{children}</AudioEngineContext.Provider>;
};
