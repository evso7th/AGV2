
/**
 * @fileOverview Audio Engine Context V62.6 — "Stability Shield".
 * #ЗАЧЕМ: Защита от тишины и критических ошибок планирования.
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
import { GUITAR_LOUDNESS_TRIM_DB } from '@/lib/guitar-loudness';
import { loadDnaCache, saveDnaCache } from '@/lib/dna-cache';
import { BroadcastEngine } from '@/lib/broadcast-engine';
import { buildMultiInstrument, type InstrumentAPI, setGlobalVoiceLimit, globalAllNotesOff } from '@/lib/instrument-factory';
import type { FractalEvent } from '@/types/fractal';
import { collection, getDocs, query } from 'firebase/firestore';
import { useFirestore, useAuth } from '@/firebase/provider';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { V2_PRESETS } from '@/lib/presets-v2';
import { BASS_PRESETS } from '@/lib/bass-presets';
import { TRANSLATIONS, type Language } from '@/lib/translations';

const VOICE_BALANCE: Record<string, number> = {
  bass: 0.35,
  melody: 0.45,
  accompaniment: 0.55,
  drums: 0.65,
  sparkles: 0.45,
  sfx: 0.45,
  harmony: 0.55,
  pianoAccompaniment: 0.45,
};

const SAMPLER_DEFAULTS: Record<string, number> = {
    master: 0.65, 
    acoustic: 0.15,
    electric: 0.15, 
    piano: 0.6,
    orchecial: 0.0725, 
    chords: 1.2,
    bass: 1.0
};

interface AudioEngineContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  isPlaying: boolean;
  isRecording: boolean;
  isBroadcastActive: boolean;
  isPreviewPlaying: boolean;
  isPreviewLooping: boolean;
  backgroundLoadInProgress: boolean;
  backgroundLoadComplete: boolean;
  availableCompositions: { id: string; count: number; genres: string[]; moods: string[] }[];
  currentBar: number;
  totalBars: number;
  currentTrackName: string;
  tension: number;
  initialize: () => Promise<boolean>;
  setIsPlaying: (playing: boolean) => void;
  updateSettings: (settings: Partial<WorkerSettings>) => void;
  refreshCloudAxioms: () => Promise<void>;
  syncDna: () => Promise<void>;
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
  calculateMasterFade: (target: number, duration: number) => void;
  cancelMasterFadeOut: () => void;
  startRecording: (prefix?: string) => void;
  stopRecording: () => void;
  toggleBroadcast: () => void;
  triggerVinyl: () => void;
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
  const [isRecording, setIsRecordingState] = useState(false);
  const [isBroadcastActive, setIsBroadcastActive] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPreviewLooping, setIsPreviewLooping] = useState(false);
  const [availableCompositions, setAvailableCompositions] = useState<{ id: string; count: number; genres: string[]; moods: string[] }[]>([]);
  const [backgroundLoadInProgress, setBackgroundLoadInProgress] = useState(false);
  const [backgroundLoadComplete, setBackgroundLoadComplete] = useState(false);
  const [tension, setTension] = useState(0.5);

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
  const authenticationRef = useRef<any>(null);
  const cs80SamplerRef = useRef<CS80GuitarSampler | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const samplersMasterGainRef = useRef<GainNode | null>(null);
  const speakerGainNodeRef = useRef<GainNode | null>(null);
  const broadcastEngineRef = useRef<BroadcastEngine | null>(null);
  const transitionGainRef = useRef<GainNode | null>(null);
  const gainNodesRef = useRef<Record<string, GainNode>>({});
  const nextBarTimeRef = useRef<number>(0);
  const previewInstrumentRef = useRef<InstrumentAPI | null>(null);
  const previewTimeoutRef = useRef<any>(null);
  const loopingRef = useRef(false);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  const [calibrationGains, setCalibrationGains] = useState<Record<string, number>>(() => {
      const defaults = { master: 0.65, acoustic: 1.0, electric: 1.0, piano: 1.0, orchestral: 1.0, chords: 1.0, bass: 1.0 };
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

  const calibrationGainsRef = useRef(calibrationGains);
  useEffect(() => {
      calibrationGainsRef.current = calibrationGains;
  }, [calibrationGains]);

  const { toast } = useToast();
  const db = useFirestore();
  const auth = useAuth();

  const getLanguage = (): Language => {
    return 'en';
  };

  const getEffectivePreset = useCallback((presetName: string) => {
      const base = (V2_PRESETS as any)[presetName] || (BASS_PRESETS as any)[presetName];
      if (!base) return null;
      const override = timbreOverridesRef.current[presetName];
      return override ? { ...base, ...override } : base;
  }, []);

  const applyCalibration = useCallback((gains: Record<string, number>) => {
      if (!audioContextRef.current) return;
      const now = audioContextRef.current.currentTime;
      const m = gains.master ?? 0.65;
      
      if (masterGainNodeRef.current) {
          masterGainNodeRef.current.gain.cancelScheduledValues(now);
          masterGainNodeRef.current.gain.setTargetAtTime(m, now, 0.05);
      }
      
      blackGuitarSamplerRef.current?.setPreampGain(SAMPLER_DEFAULTS.acoustic * (gains.acoustic || 1.0));
      telecasterSamplerRef.current?.setPreampGain(SAMPLER_DEFAULTS.electric * (gains.electric || 1.0));
      darkTelecasterSamplerRef.current?.setPreampGain(2.2 * (gains.electric || 1.0)); 
      cs80SamplerRef.current?.setPreampGain(SAMPLER_DEFAULTS.cs80 * (gains.cs80 || 1.0));
      melodyManagerV2Ref.current?.setPreampGain(gains.electric || 1.0); 
      bassManagerV2Ref.current?.setPreampGain(SAMPLER_DEFAULTS.bass * (gains.bass || 1.0));
      pianoAccompanimentManagerRef.current?.setVolume(gains.piano || 1.0); 
      
      harmonyManagerRef.current?.setPreampGains(
          SAMPLER_DEFAULTS.orchecial * (gains.orchestral || 1.0),
          SAMPLER_DEFAULTS.chords * (gains.chords || 1.0)
      );
  }, []);

  const stopAllSounds = useCallback(() => {
    globalAllNotesOff();
    [melodyManagerV2Ref, bassManagerV2Ref, accompanimentManagerV2Ref, harmonyManagerRef, pianoAccompanimentManagerRef].forEach(r => r.current?.allNotesOff());
    drumMachineRef.current?.stop(); 
    sparklePlayerRef.current?.stopAll(); 
    sfxSynthManagerRef.current?.allNotesOff();
    [blackGuitarSamplerRef, telecasterSamplerRef, darkTelecasterSamplerRef, cs80SamplerRef].forEach(r => r.current?.stopAll());
  }, []);

  const triggerVinyl = useCallback(() => {
      if (sfxSynthManagerRef.current && audioContextRef.current) {
          sfxSynthManagerRef.current.triggerManual('vinyl', audioContextRef.current.currentTime + 0.1, 0.4);
      }
  }, []);

  const handleTogglePlay = useCallback(async (playing: boolean) => {
      const context = audioContextRef.current; if (!context || !workerRef.current) return;
      if (playing) { 
          if (context.state === 'suspended') await context.resume(); 
          setIsPlayingState(true); 
          
          if (masterGainNodeRef.current) {
              masterGainNodeRef.current.gain.cancelScheduledValues(context.currentTime);
              masterGainNodeRef.current.gain.setTargetAtTime(calibrationGainsRef.current.master, context.currentTime, 0.05); 
          }
          
          stopAllSounds(); 
          nextBarTimeRef.current = context.currentTime + 0.5; 
          workerRef.current.postMessage({ command: 'start' }); 
      } else { 
          setIsPlayingState(false); 
          
          if (masterGainNodeRef.current) {
              masterGainNodeRef.current.gain.cancelScheduledValues(context.currentTime);
              masterGainNodeRef.current.gain.setTargetAtTime(0.0, context.currentTime, 0.01); 
          }
          
          workerRef.current.postMessage({ command: 'stop' }); 
          stopAllSounds(); 
      }
  }, [stopAllSounds]);

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
    if (part === 'master') {
        setCalibrationGain('master', volume);
        return;
    }
    const balancedVolume = volume * (VOICE_BALANCE[part] ?? 1);
    const gainNode = gainNodesRef.current[part];
    if (gainNode && audioContextRef.current) {
        const now = audioContextRef.current.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setTargetAtTime(balancedVolume, now, 0.015);
    }
  }, [setCalibrationGain]);

  const setVoiceLimit = useCallback((limit: number) => {
      setVoiceLimitState(limit);
      setGlobalVoiceLimit(limit);
      localStorage.setItem('AuraGroove_VoiceLimit', limit.toString());
  }, []);

  const scheduleEvents = useCallback((events: FractalEvent[], barStartTime: number, tempo: number, barCount: number, instrumentHints?: InstrumentHints) => {
    // #ЗАЧЕМ: SILENCE SHIELD. Проверяем валидность массива событий перед планированием.
    if (!Array.isArray(events)) {
        console.warn('[AudioEngine] Skipping bar scheduling: events is not an array.');
        return;
    }
    
    const beatDuration = 60 / tempo;
    if (drumMachineRef.current) drumMachineRef.current.schedule(events, barStartTime, tempo);
    if (bassManagerV2Ref.current) bassManagerV2Ref.current.schedule(events, barStartTime, tempo, instrumentHints?.bass, barCount);
    if (accompanimentManagerV2Ref.current) accompanimentManagerV2Ref.current.schedule(events, barStartTime, tempo, barCount, instrumentHints?.accompaniment);
    if (melodyManagerV2Ref.current) melodyManagerV2Ref.current.schedule(events, barStartTime, tempo, instrumentHints?.melody, barCount);
    if (harmonyManagerRef.current) harmonyManagerRef.current.schedule(events, barStartTime, tempo, instrumentHints?.harmony as any, barCount);
    
    if (pianoAccompanimentManagerRef.current) { 
        const pianoHint = instrumentHints?.pianoAccompaniment; 
        pianoAccompanimentManagerRef.current.setInstrumentType(pianoHint === 'piano' ? 'acoustic' : 'rhodes'); 
        pianoAccompanimentManagerRef.current.schedule(events, barStartTime, tempo); 
    }
    if (sparklePlayerRef.current) { 
        events.filter(e => e.type === 'sparkle').forEach(s => sparklePlayerRef.current!.playRandomSparkle(barStartTime + (s.time * beatDuration), s.params?.genre, s.params?.mood, s.params?.category)); 
    }
    if (sfxSynthManagerRef.current) sfxSynthManagerRef.current.trigger(events, barStartTime, tempo);
  }, []);

  const applyAxiomsToEngine = useCallback((rawAxioms: any[]) => {
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
  }, []);

  const refreshCloudAxioms = useCallback(async () => {
    if (!db) return;
    try {
      const [axSnap, mpSnap] = await Promise.all([
        getDocs(query(collection(db, 'heritage_axioms'))),
        getDocs(query(collection(db, 'masterpieces'))),
      ]);
      const rawAxioms = axSnap.docs.map(d => ({ ...d.data(), id: d.id }));
      const rawMasterpieces = mpSnap.docs.map(d => ({ ...d.data(), id: d.id }));
      applyAxiomsToEngine(rawAxioms);
      saveDnaCache(rawAxioms, rawMasterpieces, Date.now());
    } catch (e) {}
  }, [db, applyAxiomsToEngine]);

  const loadDnaFromCache = useCallback(async (): Promise<boolean> => {
    const cache = await loadDnaCache();
    if (cache.axioms && cache.axioms.length > 0) {
      applyAxiomsToEngine(cache.axioms);
      return true;
    }
    return false;
  }, [applyAxiomsToEngine]);

  const syncDna = useCallback(async () => {
    const l = getLanguage();
    await refreshCloudAxioms();
    toast({ title: TRANSLATIONS.toast_dna_synced[l], description: TRANSLATIONS.toast_dna_synced_desc[l] });
  }, [refreshCloudAxioms, toast]);

  const initialize = useCallback(async () => {
    if (isInitialized || initializationInFlightRef.current) return true;
    initializationInFlightRef.current = true; setIsInitializing(true);
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
        const context = audioContextRef.current; if (context.state === 'suspended') await context.resume();
        if (auth && !auth.currentUser) initiateAnonymousSignIn(auth);
        setGlobalVoiceLimit(voiceLimit);
        
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
            if (!gainNodesRef.current[p]) { 
                gainNodesRef.current[p] = context.createGain(); 
                gainNodesRef.current[p].connect(['melody', 'harmony'].includes(p) ? samplersMasterGainRef.current! : masterGainNodeRef.current!); 
            }
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

        blackGuitarSamplerRef.current.setOutputTrim(GUITAR_LOUDNESS_TRIM_DB.blackAcoustic);
        telecasterSamplerRef.current.setOutputTrim(GUITAR_LOUDNESS_TRIM_DB.telecaster);
        darkTelecasterSamplerRef.current.setOutputTrim(GUITAR_LOUDNESS_TRIM_DB.darkTelecaster);
        cs80SamplerRef.current.setOutputTrim(GUITAR_LOUDNESS_TRIM_DB.cs80);

        await Promise.all([
          drumMachineRef.current.init(true),
          blackGuitarSamplerRef.current.init(true),
          harmonyManagerRef.current.init(true),
          pianoAccompanimentManagerRef.current.init(),
          sparklePlayerRef.current.init(5),
          sfxSynthManagerRef.current.init(5)
        ]);

        setBackgroundLoadInProgress(true);
        setTimeout(async () => {
          try {
            await Promise.all([
              telecasterSamplerRef.current?.init(),
              darkTelecasterSamplerRef.current?.init(),
              cs80SamplerRef.current?.init(),
              accompanimentManagerV2Ref.current?.init(),
              melodyManagerV2Ref.current?.init(),
              bassManagerV2Ref.current?.init()
            ]);
            setBackgroundLoadInProgress(false);
            setBackgroundLoadComplete(true);
          } catch (bgError) {
            setBackgroundLoadInProgress(false);
          }
        }, 5000);

        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('@/app/ambient.worker.ts', import.meta.url), { type: 'module' });
            workerRef.current.onmessage = (e) => {
                const { type, payload, error } = e.data;
                if (type === 'SCORE_READY' && payload) {
                    const ctx = audioContextRef.current; if (!ctx) return;
                    setCurrentBar(payload.barCount); setTotalBars(payload.totalBars);
                    if (payload.trackName) setCurrentTrackName(payload.trackName);
                    if (isFinite(payload.tension)) setTension(payload.tension); 
                    
                    let scheduleTime = nextBarTimeRef.current;
                    const now = ctx.currentTime;
                    // #ЗАЧЕМ: Расширенный допуск планирования (0.03 -> 0.05) для предотвращения разрывов на мобильных.
                    if (payload.barCount === 0 || scheduleTime < now + 0.05) { scheduleTime = now + 0.15; }
                    
                    const tempo = payload.actualBpm || 75;
                    const bDur = 60 / tempo;
                    payload.events.forEach((e: any) => {
                        const et = Array.isArray(e.type) ? e.type[0] : e.type;
                        const isKick = typeof et === 'string' && (et.toLowerCase().includes('kick') || et.toLowerCase().includes('drum_kick'));
                        const isStrongBass = et === 'bass' && Math.abs(e.time % 2) < 0.01; 
                        
                        if (isKick || isStrongBass) {
                            const hitT = scheduleTime + (e.time * bDur);
                            window.dispatchEvent(new CustomEvent('AG_CORE_PULSE', { detail: { time: hitT } }));
                        }
                    });

                    scheduleEvents(payload.events, scheduleTime, tempo, payload.barCount, payload.instrumentHints);
                    nextBarTimeRef.current = scheduleTime + payload.barDuration;
                } else if (type === 'HISTORY_UPDATE' && payload) { localStorage.setItem('AuraGroove_TrackHistory', JSON.stringify(payload)); }
                else if (type === 'BPM_SYNC' && payload) { window.dispatchEvent(new CustomEvent('AG_BPM_SYNC', { detail: { bpm: payload } })); }
                else if (type === 'SUITE_TRANSITION') { 
                    window.dispatchEvent(new CustomEvent('AG_SUITE_TRANSITION')); 
                    triggerVinyl();
                }
                else if (type === 'error') {
                    const l = getLanguage();
                    toast({ variant: "destructive", title: TRANSLATIONS.toast_sync_fail[l], description: error });
                }
            };
            try {
                const savedHist = localStorage.getItem('AuraGroove_TrackHistory');
                const parsed = savedHist ? JSON.parse(savedHist) : null;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    workerRef.current.postMessage({ command: 'init', data: { playedTrackHistory: parsed } });
                }
            } catch (e) {}
        }
        const hadCache = await loadDnaFromCache();
        if (hadCache) { void refreshCloudAxioms(); } else { await refreshCloudAxioms(); }
        applyCalibration(calibrationGainsRef.current);
        setIsInitialized(true); setIsInitializing(false); initializationInFlightRef.current = false;
        return true;
    } catch (e) { return false; }
  }, [auth, refreshCloudAxioms, loadDnaFromCache, db, applyCalibration, scheduleEvents, voiceLimit, toast, triggerVinyl]);

  const toggleBroadcastCallback = useCallback(async () => {
      if (!isInitialized) { const success = await initialize(); if (!success) return; }
      if (broadcastEngineRef.current && audioContextRef.current && speakerGainNodeRef.current) {
          const now = audioContextRef.current.currentTime;
          if (isBroadcastActive) {
              broadcastEngineRef.current.stop();
              speakerGainNodeRef.current.gain.cancelScheduledValues(now);
              speakerGainNodeRef.current.gain.setTargetAtTime(1.0, now, 0.05);
              setIsBroadcastActive(false);
          } else {
              broadcastEngineRef.current.start();
              speakerGainNodeRef.current.gain.cancelScheduledValues(now);
              speakerGainNodeRef.current.gain.setTargetAtTime(0.0, now, 0.05);
              setIsBroadcastActive(true);
          }
      }
  }, [isInitialized, initialize, isBroadcastActive]);

  const contextValue = useMemo(() => ({
      isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, isPreviewPlaying, isPreviewLooping, backgroundLoadInProgress, backgroundLoadComplete, availableCompositions, initialize,
      analyser: analyserNodeRef.current, voiceLimit, setVoiceLimit, currentBar, totalBars, currentTrackName, tension,
      setIsPlaying: handleTogglePlay,
      updateSettings: (s: any) => { if (workerRef.current) { settingsRef.current = { ...settingsRef.current, ...s }; workerRef.current.postMessage({ command: 'update_settings', data: s }); } },
      refreshCloudAxioms, syncDna, getWorker: () => workerRef.current, resetWorker: () => { setCurrentBar(0); workerRef.current?.postMessage({ command: 'reset' }); },
      setVolume: setVolumeCallback, 
      setInstrument: async (part: any, name: any) => { if (!isInitialized) return; const preset = getEffectivePreset(name); if (part === 'bass' && bassManagerV2Ref.current) await bassManagerV2Ref.current.setInstrument(preset || name); else if (part === 'melody' && melodyManagerV2Ref.current) await melodyManagerV2Ref.current.setInstrument(preset || name); else if (part === 'accompaniment' && accompanimentManagerV2Ref.current) await accompanimentManagerV2Ref.current.setInstrument(preset || name); else if (part === 'harmony' && harmonyManagerRef.current) await harmonyManagerRef.current.setInstrument(preset || name); },
      setBassTechnique: () => {}, setTextureSettings: (s: any) => { setVolumeCallback('sparkles', s.sparkles.enabled ? s.sparkles.volume : 0); setVolumeCallback('sfx', s.sfx.enabled ? s.sfx.volume : 0); },
      setEQGain: () => {}, setCalibrationGain, calibrationGains, startMasterFadeOut: () => {}, cancelMasterFadeOut: () => {}, 
      calculateMasterFade: () => {},
      startRecording: (prefix?: string) => { 
        if (!recDestRef.current || isRecording) return; 
        recordedChunksRef.current = []; 
        const mediaRecorder = new MediaRecorder(recDestRef.current.stream); 
        
        mediaRecorder.ondataavailable = (e) => { 
          if (e.data.size > 0) recordedChunksRef.current.push(e.data); 
        }; 
        
        mediaRecorder.onstop = () => { 
            if (recordedChunksRef.current.length === 0) {
              console.warn('[AudioEngine] No data recorded. Chunks are empty.');
              return;
            }
            const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' }); 
            const url = URL.createObjectURL(blob); 
            const a = document.createElement('a'); 
            a.href = url; 
            const prefixStr = prefix ? `${prefix}_` : '';
            const genreStr = settingsRef.current?.genre || 'ambient';
            const moodStr = settingsRef.current?.mood || 'melancholic';
            const dateStr = new Date().toISOString().split('T')[0];
            const uidStr = Math.random().toString(36).substring(2, 7);
            a.download = `${prefixStr}AuraGroove_${genreStr}-${moodStr}_${dateStr}_${uidStr}.webm`; 
            a.click(); 
        }; 
        
        mediaRecorder.start(); 
        mediaRecorderRef.current = mediaRecorder; 
        setIsRecordingState(true); 
      }, 
      stopRecording: () => { 
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') { 
          mediaRecorderRef.current.stop(); 
          setIsRecordingState(false); 
        } 
      },
      toggleBroadcast: toggleBroadcastCallback, 
      triggerVinyl,
      playRawEvents: (ev: any, h: any, t: any) => { if(audioContextRef.current) scheduleEvents(ev, audioContextRef.current.currentTime + 0.1, t || 72, 0, h); },
      stopAllSounds, startPreview: async (p: any, t: any, l: any) => { if (!isInitialized) await initialize(); loopingRef.current = l; setIsPreviewPlaying(true); const previewInst = await buildMultiInstrument(audioContextRef.current!, { type: t, preset: p, output: masterGainNodeRef.current! }); previewInstrumentRef.current = previewInst; const scheduleSeq = () => { const now = audioContextRef.current!.currentTime + 0.1; const seq = [{m:60,t:0,d:0.5},{m:64,t:0.5,d:0.5},{m:67,t:1,d:1},{m:72,t:2,d:2}]; seq.forEach(n => { previewInst.noteOn(n.m, now + n.t, 0.8, n.d); }); const totalDur = 4.0; if (loopingRef.current) { previewTimeoutRef.current = setTimeout(scheduleSeq, totalDur * 1000); } else { previewTimeoutRef.current = setTimeout(() => setIsPreviewPlaying(false), totalDur * 1000); } }; scheduleSeq(); }, stopPreview: () => { if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current); if (previewInstrumentRef.current) { previewInstrumentRef.current.allNotesOff(); previewInstrumentRef.current.disconnect(); previewInstrumentRef.current = null; } setIsPreviewPlaying(false); }, updatePreviewPreset: (p: any) => { previewInstrumentRef.current?.setPreset(p); }, togglePreviewLoop: () => { loopingRef.current = !loopingRef.current; setIsPreviewLooping(loopingRef.current); }
  }), [
      isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, isPreviewPlaying, isPreviewLooping, backgroundLoadInProgress, backgroundLoadComplete,
      availableCompositions, initialize, voiceLimit, setVoiceLimit, handleTogglePlay, refreshCloudAxioms, syncDna,
      setVolumeCallback, calibrationGains, setCalibrationGain, toggleBroadcastCallback, triggerVinyl,
      stopAllSounds, getEffectivePreset, currentBar, totalBars, currentTrackName, tension, scheduleEvents
  ]);

  return <AudioEngineContext.Provider value={contextValue}>{children}</AudioEngineContext.Provider>;
};
