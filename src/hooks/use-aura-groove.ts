

'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DrumSettings, InstrumentSettings, ScoreName, WorkerSettings, BassInstrument, InstrumentPart, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, TimerSettings, Mood, Genre, SfxSettings } from '@/types/music';
import { useAudioEngine } from "@/contexts/audio-engine-context";

const FADE_OUT_DURATION = 120; // 2 minutes

/**
 * Полная версия хука для основного UI управления музыкой.
 */
export const useAuraGroove = () => {
  const { 
    isInitialized,
    isInitializing,
    isPlaying, 
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
  } = useAudioEngine();
  
  const router = useRouter();
  
  const [drumSettings, setDrumSettings] = useState<DrumSettings>({ pattern: 'composer', volume: 0.5, kickVolume: 1.0, enabled: true });
  const [instrumentSettings, setInstrumentSettings] = useState<InstrumentSettings>({
    bass: { name: "glideBass", volume: 0.7, technique: 'portamento' },
    melody: { name: "ambientPad", volume: 0.8 },
    accompaniment: { name: "synth", volume: 0.7 },
    harmony: { name: "guitarChords", volume: 0.6 },
  });
  const [textureSettings, setTextureSettings] = useState<TextureSettings>({
      sparkles: { enabled: true, volume: 0.7 },
      sfx: { enabled: true, volume: 0.5 },
  });
  const [bpm, setBpm] = useState(75);
  const [score, setScore] = useState<ScoreName>('neuro_f_matrix');
  const [genre, setGenre] = useState<Genre>('ambient');
  const [density, setDensity] = useState(0.5);
  const [composerControlsInstruments, setComposerControlsInstruments] = useState(true);
  const [mood, setMood] = useState<Mood>('melancholic');

  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [eqSettings, setEqSettings] = useState<number[]>(Array(7).fill(0));
  
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    duration: 0, // in seconds
    timeLeft: 0,
    isActive: false
  });
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isRegenerating, setIsRegenerating] = useState(false);

  // Automatically initialize the engine when the component mounts
  useEffect(() => {
    initialize();
  }, [initialize]);


  const getFullSettings = useCallback((): WorkerSettings => {
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
    };
  }, [bpm, score, genre, instrumentSettings, drumSettings, textureSettings, density, composerControlsInstruments, mood]);

  // Initial settings sync
  useEffect(() => {
    if (isInitialized) {
        updateSettings(getFullSettings());
        
        Object.entries(instrumentSettings).forEach(([part, settings]) => {
            const instrumentPart = part as InstrumentPart;
            if ('volume' in settings) {
              setVolume(instrumentPart, settings.volume);
            }
        });
        setVolume('drums', drumSettings.volume);
        setEngineTextureSettings({sparkles: textureSettings.sparkles, sfx: textureSettings.sfx});
        setBassTechnique(instrumentSettings.bass.technique);
    }
  }, [isInitialized]);

  // Sync settings with engine whenever they change
  useEffect(() => {
      if (isInitialized) {
          const fullSettings = getFullSettings();
          updateSettings(fullSettings);
      }
  }, [bpm, score, genre, density, drumSettings, textureSettings, composerControlsInstruments, mood, isInitialized, updateSettings, getFullSettings]);

  // Timer logic
  useEffect(() => {
    if (timerSettings.isActive && timerSettings.timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSettings(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft === FADE_OUT_DURATION) {
            startMasterFadeOut(FADE_OUT_DURATION);
          }
          if (newTimeLeft <= 0) {
            clearInterval(timerIntervalRef.current!);
            setEngineIsPlaying(false);
            return { ...prev, timeLeft: 0, isActive: false };
          }
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
    }
    
    return () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
    };
  }, [timerSettings.isActive, timerSettings.timeLeft, setEngineIsPlaying, startMasterFadeOut]);
  
  const handlePlayPause = useCallback(async () => {
    if (!isInitialized) {
      return;
    }
    setEngineIsPlaying(!isPlaying);
  }, [isInitialized, isPlaying, setEngineIsPlaying]);

  const handleRegenerate = useCallback(() => {
    setIsRegenerating(true);
    setTimeout(() => setIsRegenerating(false), 500); 

    if (isPlaying) {
      setEngineIsPlaying(false);
    }
    resetWorker();
  }, [isPlaying, setEngineIsPlaying, resetWorker]);

  // === NEW: Automatic regeneration on initialization ===
  useEffect(() => {
    if (isInitialized) {
      console.log('[useAuraGroove] Initializing with a new seed...');
      handleRegenerate();
    }
  }, [isInitialized, handleRegenerate]);


  const handleInstrumentChange = (part: keyof InstrumentSettings, name: BassInstrument | MelodyInstrument | AccompanimentInstrument | 'piano' | 'guitarChords') => {
    const newSettings = {
      ...instrumentSettings,
      [part]: { ...instrumentSettings[part as keyof typeof instrumentSettings], name }
    };
    setInstrumentSettings(newSettings);
    setInstrument(part, name as any);

    if (isInitialized) {
      updateSettings({
        ...getFullSettings(),
        instrumentSettings: newSettings
      });
    }
  };
  
  const handleBassTechniqueChange = (technique: BassTechnique) => {
      setInstrumentSettings(prev => ({
        ...prev,
        bass: { ...prev.bass, technique }
      }));
      setBassTechnique(technique);
  };

  const handleVolumeChange = (part: InstrumentPart, value: number) => {
    if (part === 'bass' || part === 'melody' || part === 'accompaniment' || part === 'harmony' || part === 'piano' || part === 'violin' || part === 'flute' || part === 'guitarChords' || part === 'acousticGuitarSolo') {
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
        if (newIsActive) {
            return { ...prev, timeLeft: prev.duration, isActive: true };
        } else { // Stopping timer
            cancelMasterFadeOut();
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            return { ...prev, timeLeft: prev.duration, isActive: false };
        }
    });
  };


  const handleExit = () => {
    setEngineIsPlaying(false);
    window.location.href = '/';
  };

  const handleGoHome = () => {
    handleExit();
  };


  return {
    isInitializing,
    isPlaying,
    isRegenerating,
    loadingText: isInitializing ? 'Initializing...' : (isInitialized ? 'Ready' : 'Click to initialize audio'),
    handlePlayPause,
    handleRegenerate,
    drumSettings,
    setDrumSettings: handleDrumSettingsChange,
    instrumentSettings,
    setInstrumentSettings: handleInstrumentChange,
    handleBassTechniqueChange,
    handleVolumeChange,
    textureSettings,
    handleTextureEnabledChange,
    bpm,
    handleBpmChange: setBpm,
    score,
    handleScoreChange: setScore,
    density,
    setDensity,
    composerControlsInstruments,
    setComposerControlsInstruments,
    handleGoHome,
    handleExit,
    isEqModalOpen,
    setIsEqModalOpen,
    eqSettings,
    handleEqChange,
    timerSettings,
    handleTimerDurationChange,
    handleToggleTimer,
    mood,
    setMood,
    genre,
    setGenre
  };
};
