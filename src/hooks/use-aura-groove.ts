
/**
 * #ЗАЧЕМ: Хук управления UI музыкой V3.7.
 * #ЧТО: Обновленный "Имперский Баланс". Lead Guitar доминирует.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DrumSettings, InstrumentSettings, ScoreName, WorkerSettings, BassInstrument, InstrumentPart, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, TimerSettings, Mood, Genre, SfxSettings } from '@/types/music';
import { useAudioEngine } from "@/contexts/audio-engine-context";
import { useFirestore } from "@/firebase";
import { saveMasterpiece } from "@/lib/firebase-service";
import { toast } from "@/hooks/use-toast";

const FADE_OUT_DURATION = 120; // 2 minutes
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
  setInstrumentSettings: (part: keyof InstrumentSettings, name: BassInstrument | MelodyInstrument | AccompanimentInstrument | 'piano' | 'pianoAccompaniment' | 'none') => void;
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
};

export const useAuraGroove = (): AuraGrooveProps => {
  const { 
    isInitialized,
    isInitializing,
    isPlaying,
    isRecording,
    isBroadcastActive,
    initialize, 
    setIsPlaying: setEngineIsPlaying, 
    updateSettings,
    resetWorker, 
    setVolume, 
    setInstrument,
    setBassTechnique,
    setTextureSettings: setEngineTextureSettings,
    setEQGain,
    startMasterFadeOut,
    cancelMasterFadeOut,
    startRecording,
    stopRecording,
    toggleBroadcast,
    getWorker
  } = useAudioEngine() as any; 
  
  const db = useFirestore();
  const router = useRouter();
  
  const [drumSettings, setDrumSettings] = useState<DrumSettings>({ pattern: 'composer', volume: 0.12, kickVolume: 1.0, enabled: true });
  
  // #ЗАЧЕМ: Улучшенный имперский баланс V3.7.
  // #ОБНОВЛЕНО: Гитара (Melody) стала громче, Пианино и Органы снижены еще сильнее.
  const [instrumentSettings, setInstrumentSettings] = useState<InstrumentSettings>({
    bass: { name: "bass_jazz_warm", volume: 0.5, technique: 'portamento' },
    melody: { name: "blackAcoustic", volume: 0.25 }, // Громкость Лида поднята
    accompaniment: { name: "organ_soft_jazz", volume: 0.18 }, // Органы снижены
    harmony: { name: "guitarChords", volume: 0.10 }, 
    pianoAccompaniment: { name: "piano", volume: 0.12 }, // Пианино подавлено
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

  // #ЗАЧЕМ: Автоматический сброс громкости при переключении на Амбиент/Блюз.
  useEffect(() => {
    if (genre === 'ambient' || genre === 'blues') {
      console.log(`%c[UI] Genre switched to ${genre.toUpperCase()}. Applying Narrative Balance.`, 'color: #DA70D6; font-weight: bold;');
      const ambientDefaults = {
        melody: 0.25,
        accompaniment: 0.18,
        harmony: 0.10,
        pianoAccompaniment: 0.12,
        drums: 0.12
      };

      setInstrumentSettings(prev => ({
        ...prev,
        melody: { ...prev.melody, volume: ambientDefaults.melody },
        accompaniment: { ...prev.accompaniment, volume: ambientDefaults.accompaniment },
        harmony: { ...prev.harmony, volume: ambientDefaults.harmony },
        pianoAccompaniment: { ...prev.pianoAccompaniment, volume: ambientDefaults.pianoAccompaniment },
      }));

      setDrumSettings(prev => ({ ...prev, volume: ambientDefaults.drums }));

      if (isInitialized) {
        setVolume('melody', ambientDefaults.melody);
        setVolume('accompaniment', ambientDefaults.accompaniment);
        setVolume('harmony', ambientDefaults.harmony);
        setVolume('pianoAccompaniment', ambientDefaults.pianoAccompaniment);
        setVolume('drums', ambientDefaults.drums);
      }
    }
  }, [genre, isInitialized, setVolume]);

  useEffect(() => {
    initialize();
  }, [initialize]);

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
    
    console.log(`%c[GENEPOOL] USER FEEDBACK: Liking seed ${currentSeed}. Archiving to Masterpieces.`, 'color: #4ade80; font-weight: bold;');

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
  }, [isRecording, startRecording, stopRecording]);

  const handleInstrumentChange = (part: keyof InstrumentSettings, name: BassInstrument | MelodyInstrument | AccompanimentInstrument | 'piano' | 'pianoAccompaniment' | 'none') => {
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
    if (['bass', 'melody', 'accompaniment', 'harmony', 'pianoAccompaniment', 'piano', 'violin', 'flute', 'guitarChords', 'acousticGuitarSolo', 'electricGuitar', 'telecaster', 'blackAcoustic'].includes(part)) {
      setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], volume: value }}));
      setVolume(part, value);
    } else if (part === 'drums') {
        setDrumSettings(prev => ({ ...prev, volume: value }));
        setVolume('drums', value);
    } else if (part === 'sparkles' || part === 'sfx') {
        setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part], volume: value }}));
        setVolume(part, value);
    }
  };

  const handleTextureEnabledChange = (part: 'sparkles' | 'sfx', enabled: boolean) => {
      setTextureSettings(prev => {
          const newSettings = { ...prev, [part]: { ...prev[part], enabled }};
          setEngineTextureSettings(newSettings);
          return newSettings;
      });
  };

  const handleDrumSettingsChange = (settings: React.SetStateAction<DrumSettings>) => {
    const newSettings = typeof settings === 'function' ? settings(drumSettings) : settings;
    setDrumSettings(newSettings);
    setVolume('drums', newSettings.volume);
  };

  const handleEqChange = (bandIndex: number, gain: number) => {
      setEqSettings(prev => {
          const newSettings = [...prev];
          newSettings[bandIndex] = gain;
          setEQGain(bandIndex, gain);
          return newSettings;
      });
  };

  const handleTimerDurationChange = (minutes: number) => {
      setTimerSettings(prev => ({...prev, duration: minutes * 60, timeLeft: minutes * 60 }));
  };

  const handleToggleTimer = () => {
    setTimerSettings(prev => {
        const newIsActive = !prev.isActive;
        if (newIsActive) return { ...prev, timeLeft: prev.duration, isActive: true };
        cancelMasterFadeOut();
        return { ...prev, timeLeft: prev.duration, isActive: false };
    });
  };

  const handleGoHome = () => {
    setEngineIsPlaying(false);
    window.location.href = '/';
  };

  return {
    isInitializing, isPlaying, isRegenerating, isRecording, isBroadcastActive,
    loadingText: isInitializing ? 'Initializing...' : (isInitialized ? 'Ready' : 'Click to initialize audio'),
    handlePlayPause, handleRegenerate, handleToggleRecording, handleToggleBroadcast, handleSaveMasterpiece,
    drumSettings, setDrumSettings: handleDrumSettingsChange,
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
  };
};
