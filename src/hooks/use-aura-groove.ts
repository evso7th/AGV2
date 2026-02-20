/**
 * #ЗАЧЕМ: Хук управления UI музыкой V4.3 — "Timer & Sync Restoration".
 * #ЧТО: 1. Внедрены отсутствующие обработчики таймера (handleTimerDurationChange, handleToggleTimer).
 *       2. Реализована логика обратного отсчета и авто-остановки.
 *       3. Исправлена ошибка ReferenceError.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DrumSettings, InstrumentSettings, ScoreName, WorkerSettings, BassInstrument, InstrumentPart, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, TimerSettings, Mood, Genre } from '@/types/music';
import { useAudioEngine } from "@/contexts/audio-engine-context";
import { useFirestore } from "@/firebase";
import { saveMasterpiece } from "@/lib/firebase-service";
import { useToast } from "@/hooks/use-toast";

const LICK_HISTORY_KEY = 'AuraGroove_LickHistory';

export type AuraGrooveProps = {
  isPlaying: boolean;
  isInitializing: boolean;
  isRegenerating: boolean;
  isRecording: boolean;
  isBroadcastActive: boolean;
  loadingText: string;
  drumSettings: DrumSettings;
  setDrumSettings: (settings: React.SetStateAction<DrumSettings>) => void;
  instrumentSettings: InstrumentSettings;
  setInstrumentSettings: (part: keyof InstrumentSettings, name: any) => void;
  handleBassTechniqueChange: (technique: BassTechnique) => void;
  handleVolumeChange: (part: InstrumentPart, value: number) => void;
  textureSettings: Omit<TextureSettings, 'pads'>;
  handleTextureEnabledChange: (part: 'sparkles' | 'sfx', enabled: boolean) => void;
  bpm: number;
  handleBpmChange: (value: number) => void;
  score: ScoreName;
  handleScoreChange: (value: ScoreName) => void;
  handlePlayPause: () => void;
  handleRegenerate: () => void;
  handleToggleRecording: () => void;
  handleToggleBroadcast: () => void;
  handleSaveMasterpiece: () => void;
  density: number;
  setDensity: (value: number) => void;
  composerControlsInstruments: boolean;
  setComposerControlsInstruments: (value: boolean) => void;
  handleGoHome: () => void;
  handleExit?: () => void;
  isEqModalOpen: boolean;
  setIsEqModalOpen: (isOpen: boolean) => void;
  eqSettings: number[];
  handleEqChange: (bandIndex: number, gain: number) => void;
  timerSettings: TimerSettings;
  handleTimerDurationChange: (minutes: number) => void;
  handleToggleTimer: () => void;
  mood: Mood;
  setMood: (mood: Mood) => void;
  genre: Genre;
  setGenre: (genre: Genre) => void;
  introBars: number;
  setIntroBars: (bars: number) => void;
  useMelodyV2: boolean;
  toggleMelodyEngine: () => void;
};

export const useAuraGroove = (): AuraGrooveProps => {
  const { 
    isInitialized,
    isInitializing,
    isPlaying,
    isRecording,
    isBroadcastActive,
    useMelodyV2,
    initialize, 
    setIsPlaying: setEngineIsPlaying, 
    updateSettings,
    resetWorker, 
    setVolume, 
    setInstrument,
    setBassTechnique,
    setTextureSettings: setEngineTextureSettings,
    toggleBroadcast,
    getWorker,
    startRecording,
    stopRecording,
    toggleMelodyEngine
  } = useAudioEngine(); 
  
  const db = useFirestore();
  const { toast } = useToast();
  
  const [drumSettings, setDrumSettings] = useState<DrumSettings>({ pattern: 'composer', volume: 0.4, kickVolume: 1.0, enabled: true });
  
  const [instrumentSettings, setInstrumentSettings] = useState<InstrumentSettings>({
    bass: { name: "bass_jazz_warm" as any, volume: 0.5, technique: 'walking' as any },
    melody: { name: "blackAcoustic" as any, volume: 0.25 },
    accompaniment: { name: "organ_soft_jazz" as any, volume: 0.18 },
    harmony: { name: "guitarChords", volume: 0.10 }, 
    pianoAccompaniment: { name: "piano", volume: 0.12 },
  });

  const [textureSettings, setTextureSettings] = useState<TextureSettings>({
      sparkles: { enabled: true, volume: 0.12 },
      sfx: { enabled: true, volume: 0.12 },
  });
  const [bpm, setBpm] = useState(75);
  const [score, setScore] = useState<ScoreName>('neuro_f_matrix');
  const [genre, setGenre] = useState<Genre>('ambient');
  const [density, setDensity] = useState(0.5);
  const [composerControlsInstruments, setComposerControlsInstruments] = useState(true);
  const [mood, setMood] = useState<Mood>('melancholic');
  const [introBars, setIntroBars] = useState(12);
  const [currentSeed, setCurrentSeed] = useState<number>(0);
  const [sessionLickHistory, setSessionLickHistory] = useState<string[]>([]);

  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [eqSettings, setEqSettings] = useState<number[]>(Array(7).fill(0));
  
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    duration: 0, 
    timeLeft: 0,
    isActive: false
  });
  
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LICK_HISTORY_KEY);
    if (saved) {
        try {
            setSessionLickHistory(JSON.parse(saved));
        } catch(e) {}
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // --- TIMER HANDLERS ---
  const handleTimerDurationChange = (minutes: number) => {
    const seconds = minutes * 60;
    setTimerSettings(prev => ({
      ...prev,
      duration: seconds,
      timeLeft: seconds
    }));
  };

  const handleToggleTimer = () => {
    setTimerSettings(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };

  // --- COUNTDOWN EFFECT ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerSettings.isActive && timerSettings.timeLeft > 0) {
      interval = setInterval(() => {
        setTimerSettings(prev => ({
          ...prev,
          timeLeft: Math.max(0, prev.timeLeft - 1)
        }));
      }, 1000);
    } else if (timerSettings.timeLeft === 0 && timerSettings.isActive) {
      setEngineIsPlaying(false);
      setTimerSettings(prev => ({ ...prev, isActive: false }));
      toast({
        title: "Sleep Timer",
        description: "Playback stopped by timer."
      });
    }
    return () => clearInterval(interval);
  }, [timerSettings.isActive, timerSettings.timeLeft, setEngineIsPlaying, toast]);

  useEffect(() => {
    const worker = getWorker?.();
    if (!worker) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'SCORE_READY' && e.data.payload?.actualBpm) {
        setBpm(e.data.payload.actualBpm);
      }
      if (e.data.type === 'LICK_BORN' && e.data.lickId) {
          setSessionLickHistory(prev => {
              const next = [...prev, e.data.lickId].slice(-10);
              localStorage.setItem(LICK_HISTORY_KEY, JSON.stringify(next));
              return next;
          });
      }
    };

    worker.addEventListener('message', handleMessage);
    return () => worker.removeEventListener('message', handleMessage);
  }, [getWorker]);


  const getFullSettings = useCallback((): Omit<WorkerSettings, 'seed'> => {
    return {
      bpm,
      score,
      genre,
      instrumentSettings,
      drumSettings: { ...drumSettings, enabled: drumSettings.pattern !== 'none' },
      textureSettings: {
          sparkles: { enabled: textureSettings.sparkles.enabled, volume: textureSettings.sparkles.volume },
          sfx: { enabled: textureSettings.sfx.enabled, volume: textureSettings.sfx.volume },
      },
      density,
      composerControlsInstruments,
      mood,
      introBars,
      sessionLickHistory 
    };
  }, [bpm, score, genre, instrumentSettings, drumSettings, textureSettings, density, composerControlsInstruments, mood, introBars, sessionLickHistory]);

  useEffect(() => {
    if (isInitialized) {
        const fullSettings = getFullSettings();
        updateSettings(fullSettings);
        
        Object.entries(instrumentSettings).forEach(([part, settings]) => {
            const instrumentPart = part as InstrumentPart;
            if (settings && 'volume' in settings) {
              setVolume(instrumentPart, settings.volume);
            }
        });
        setVolume('drums', drumSettings.volume);
        setEngineTextureSettings({sparkles: textureSettings.sparkles, sfx: textureSettings.sfx});
    }
  }, [isInitialized, genre, mood, getFullSettings, updateSettings, instrumentSettings, drumSettings, textureSettings, setVolume, setEngineTextureSettings]);

  const handlePlayPause = useCallback(async () => {
    if (!isInitialized) return;
    
    if (!hasPlayedOnce && !isPlaying) {
      const newSeed = Date.now();
      setCurrentSeed(newSeed);
      resetWorker();
      setHasPlayedOnce(true);
    }

    setEngineIsPlaying(!isPlaying);
  }, [isInitialized, isPlaying, setEngineIsPlaying, hasPlayedOnce, resetWorker]);

  const handleRegenerate = useCallback(() => {
      setIsRegenerating(true);
      const newSeed = Date.now();
      setCurrentSeed(newSeed);
      setTimeout(() => setIsRegenerating(false), 500); 
      resetWorker();
  }, [resetWorker]);

  const handleToggleBroadcast = useCallback(() => {
    if (!isInitialized || !isPlaying) return;
    toggleBroadcast();
  }, [isInitialized, isPlaying, toggleBroadcast]);

  const handleSaveMasterpiece = useCallback(() => {
    if (!isInitialized || !isPlaying) return;
    
    saveMasterpiece(db, {
      seed: currentSeed,
      mood,
      genre,
      density,
      bpm,
      instrumentSettings
    });
  }, [isInitialized, isPlaying, db, currentSeed, mood, genre, density, bpm, instrumentSettings]);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, stopRecording, startRecording]);

  const handleInstrumentChange = (part: keyof InstrumentSettings, name: any) => {
    setInstrumentSettings(prev => ({
        ...prev,
        [part]: { ...prev[part as keyof typeof prev], name }
    }));
    setInstrument(part as any, name as any);
  };
  
  const handleBassTechniqueChange = (technique: BassTechnique) => {
      setInstrumentSettings(prev => ({
        ...prev,
        bass: { ...prev.bass, technique }
      }));
      setBassTechnique(technique);
  };

  const handleVolumeChange = (part: InstrumentPart, value: number) => {
    setVolume(part, value);
    
    if (part in instrumentSettings) {
      setInstrumentSettings(prev => ({
        ...prev,
        [part]: { ...prev[part as keyof typeof prev], volume: value }
      }));
    } else if (part === 'drums') {
      setDrumSettings(prev => ({ ...prev, volume: value }));
    } else if (part === 'sparkles' || part === 'sfx') {
      setTextureSettings(prev => ({
        ...prev,
        [part]: { ...prev[part as 'sparkles' | 'sfx'], volume: value }
      }));
    }
  };

  const handleTextureEnabledChange = (part: 'sparkles' | 'sfx', enabled: boolean) => {
      setTextureSettings(prev => {
          const newSettings = { ...prev, [part]: { ...prev[part], enabled }};
          setEngineTextureSettings(newSettings);
          return newSettings;
      });
  };

  const handleEqChange = (bandIndex: number, gain: number) => {
      setEQGain(bandIndex, gain);
  };

  const handleGoHome = () => {
    setEngineIsPlaying(false);
    window.location.href = '/';
  };

  return {
    isInitializing, isPlaying, isRegenerating, isRecording, isBroadcastActive,
    loadingText: isInitializing ? 'Initializing...' : (isInitialized ? 'Ready' : 'Click to initialize audio'),
    handlePlayPause, handleRegenerate, handleToggleRecording, handleToggleBroadcast, handleSaveMasterpiece,
    drumSettings, setDrumSettings,
    instrumentSettings, setInstrumentSettings: handleInstrumentChange,
    handleBassTechniqueChange, handleVolumeChange,
    textureSettings, handleTextureEnabledChange,
    bpm, handleBpmChange: setBpm,
    score, handleScoreChange: setScore,
    density, setDensity,
    composerControlsInstruments, setComposerControlsInstruments,
    handleGoHome,
    handleExit: handleGoHome,
    isEqModalOpen, setIsEqModalOpen, eqSettings, handleEqChange,
    timerSettings, handleTimerDurationChange, handleToggleTimer,
    mood, setMood, genre, setGenre,
    introBars, setIntroBars,
    useMelodyV2, toggleMelodyEngine
  };
};