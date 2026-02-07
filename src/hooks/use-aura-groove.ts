
'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DrumSettings, InstrumentSettings, ScoreName, WorkerSettings, BassInstrument, InstrumentPart, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, TimerSettings, Mood, Genre, SfxSettings } from '@/types/music';
import { useAudioEngine } from "@/contexts/audio-engine-context";
import { useFirestore } from "@/firebase";
import { saveMasterpiece } from "@/lib/firebase-service";
import { toast } from "@/hooks/use-toast";

const FADE_OUT_DURATION = 120; // 2 minutes

export type AuraGrooveProps = {
  isPlaying: boolean;
  isInitializing: boolean;
  isRegenerating: boolean;
  isRecording: boolean;
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
  useMelodyV2: boolean;
  toggleMelodyEngine: () => void;
  introBars: number;
  setIntroBars: (bars: number) => void;
};


/**
 * Полная версия хука для основного UI управления музыкой.
 */
export const useAuraGroove = (): AuraGrooveProps => {
  const { 
    isInitialized,
    isInitializing,
    isPlaying,
    useMelodyV2, 
    isRecording,
    toggleMelodyEngine,
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
    stopRecording
  } = useAudioEngine();
  
  const db = useFirestore();
  const router = useRouter();
  
  const [drumSettings, setDrumSettings] = useState<DrumSettings>({ pattern: 'composer', volume: 0.25, kickVolume: 1.0, enabled: true });
  const [instrumentSettings, setInstrumentSettings] = useState<InstrumentSettings>({
    bass: { name: "bass_jazz_warm", volume: 0.5, technique: 'portamento' },
    melody: { name: "blackAcoustic", volume: 0.5 }, 
    accompaniment: { name: "organ_soft_jazz", volume: 0.35 },
    harmony: { name: "guitarChords", volume: 0.25 },
    pianoAccompaniment: { name: "piano", volume: 0.65 },
  });
  const [textureSettings, setTextureSettings] = useState<TextureSettings>({
      sparkles: { enabled: true, volume: 0.35 },
      sfx: { enabled: true, volume: 0.35 },
  });
  const [bpm, setBpm] = useState(75);
  const [score, setScore] = useState<ScoreName>('neuro_f_matrix');
  const [genre, setGenre] = useState<Genre>('blues');
  const [density, setDensity] = useState(0.5);
  const [composerControlsInstruments, setComposerControlsInstruments] = useState(true);
  const [mood, setMood] = useState<Mood>('melancholic');
  const [introBars, setIntroBars] = useState(12);
  const [currentSeed, setCurrentSeed] = useState<number>(0);

  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [eqSettings, setEqSettings] = useState<number[]>(Array(7).fill(0));
  
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    duration: 0, 
    timeLeft: 0,
    isActive: false
  });
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);


  useEffect(() => {
    initialize();
  }, [initialize]);


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
      useMelodyV2,
      introBars,
    };
  }, [bpm, score, genre, instrumentSettings, drumSettings, textureSettings, density, composerControlsInstruments, mood, useMelodyV2, introBars]);

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

  const handleSaveMasterpiece = useCallback(async () => {
    if (!isInitialized || !isPlaying) return;
    
    // #ЗАЧЕМ: Логирование в консоль для подтверждения пополнения генофонда.
    console.log(`%c[GENEPOOL] USER FEEDBACK: Liking seed ${currentSeed}. Archiving to Masterpieces.`, 'color: #4ade80; font-weight: bold;');

    const { dismiss: dismissLoading } = toast({ 
      title: "Memory Activation", 
      description: "Saving this state to the Elder Knowledge..." 
    });
    
    const success = await saveMasterpiece(db, {
      seed: currentSeed,
      mood,
      genre,
      density,
      bpm,
      instrumentSettings
    });

    dismissLoading();

    if (success) {
      const { dismiss } = toast({ 
        title: "Masterpiece Saved!", 
        description: "This soul will help build future generations." 
      });
      setTimeout(dismiss, 1000);
    } else {
      const { dismiss } = toast({ 
        variant: "destructive", 
        title: "Memory Error", 
        description: "Could not save the state." 
      });
      setTimeout(dismiss, 3000);
    }
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

  const handleExit = () => {
    setEngineIsPlaying(false);
    window.location.href = '/';
  };

  return {
    isInitializing, isPlaying, isRegenerating, isRecording,
    loadingText: isInitializing ? 'Initializing...' : (isInitialized ? 'Ready' : 'Click to initialize audio'),
    handlePlayPause, handleRegenerate, handleToggleRecording, handleSaveMasterpiece,
    drumSettings, setDrumSettings: handleDrumSettingsChange,
    instrumentSettings, setInstrumentSettings: handleInstrumentChange,
    handleBassTechniqueChange, handleVolumeChange,
    textureSettings, handleTextureEnabledChange,
    bpm, handleBpmChange: setBpm,
    score, handleScoreChange: setScore,
    density, setDensity,
    composerControlsInstruments, setComposerControlsInstruments,
    handleGoHome: handleExit,
    handleExit,
    isEqModalOpen, setIsEqModalOpen, eqSettings, handleEqChange,
    timerSettings, handleTimerDurationChange, handleToggleTimer,
    mood, setMood, genre, setGenre, useMelodyV2, toggleMelodyEngine,
    introBars, setIntroBars,
  };
};
