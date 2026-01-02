
'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DrumSettings, InstrumentSettings, ScoreName, WorkerSettings, BassInstrument, InstrumentPart, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, TimerSettings, Mood, Genre, SfxSettings } from '@/types/music';
import { useAudioEngine } from "@/contexts/audio-engine-context";
import { V2_PRESETS } from "@/lib/presets-v2";
import { getBlueprint } from "@/lib/blueprints";

const FADE_OUT_DURATION = 120; // 2 minutes

export type AuraGrooveProps = {
  isPlaying: boolean;
  isInitializing: boolean;
  isRegenerating: boolean;
  loadingText: string;
  drumSettings: DrumSettings;
  setDrumSettings: (settings: React.SetStateAction<DrumSettings>) => void;
  instrumentSettings: InstrumentSettings;
  setInstrumentSettings: (part: keyof InstrumentSettings, name: BassInstrument | MelodyInstrument | AccompanimentInstrument | keyof typeof V2_PRESETS) => void;
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
  } = useAudioEngine();
  
  const router = useRouter();
  
  const [drumSettings, setDrumSettings] = useState<DrumSettings>({ pattern: 'composer', volume: 0.5, kickVolume: 1.0, enabled: true });
  const [instrumentSettings, setInstrumentSettings] = useState<InstrumentSettings>({
    bass: { name: "glideBass", volume: 0.5, technique: 'portamento' },
    melody: { name: "ambientPad", volume: 0.5 },
    accompaniment: { name: "synth", volume: 0.7 },
    harmony: { name: "guitarChords", volume: 0.25 },
  });
  const [textureSettings, setTextureSettings] = useState<TextureSettings>({
      sparkles: { enabled: true, volume: 0.35 },
      sfx: { enabled: true, volume: 0.35 },
  });
  const [bpm, setBpm] = useState(75);
  const [score, setScore] = useState<ScoreName>('neuro_f_matrix');
  const [genre, setGenre] = useState<Genre>('ambient');
  const [density, setDensity] = useState(0.5);
  const [composerControlsInstruments, setComposerControlsInstruments] = useState(true);
  const [mood, setMood] = useState<Mood>('melancholic');
  const [introBars, setIntroBars] = useState(7);

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

  // #ЗАЧЕМ: Этот useEffect гарантирует, что воркер ВСЕГДА будет знать актуальное состояние V2-движка.
  // #ЧТО: Он следит за изменением флага `useMelodyV2`. Как только флаг меняется,
  //      он немедленно вызывает `updateSettings` для отправки полного, обновленного объекта
  //      настроек в Web Worker.
  // #СВЯЗИ: Решает проблему "разделенного сознания", когда UI и воркер имели разные
  //         представления о том, какой движок мелодии активен.
  useEffect(() => {
      if (isInitialized) {
          console.log(`[useAuraGroove] Syncing settings with worker, useMelodyV2 is now: ${useMelodyV2}`);
          updateSettings(getFullSettings());
      }
  }, [useMelodyV2, isInitialized, getFullSettings, updateSettings]);

  // #ЗАЧЕМ: Этот useEffect синхронизирует BPM в UI с темпом, заданным в блюпринте.
  // #ЧТО: При смене жанра или настроения он асинхронно загружает нужный блюпринт,
  //      извлекает из него базовый темп и устанавливает его в состояние `bpm`.
  // #СВЯЗИ: Обеспечивает, что UI всегда отражает актуальный темп композитора.
  useEffect(() => {
    const fetchBlueprintBpm = async () => {
      try {
        const blueprint = await getBlueprint(genre, mood);
        if (blueprint && blueprint.musical.bpm.base) {
          setBpm(blueprint.musical.bpm.base);
          console.log(`[useAuraGroove] BPM updated from blueprint: ${blueprint.musical.bpm.base}`);
        }
      } catch (error) {
        console.error("Failed to fetch blueprint BPM:", error);
      }
    };

    if (isInitialized && score === 'neuro_f_matrix') {
        fetchBlueprintBpm();
    }
  }, [genre, mood, score, isInitialized]);


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
    // #ИЗМЕНЕНО: Удалена логика с setInitialSeed. Теперь воркер сам генерирует seed.
    setTimeout(() => setIsRegenerating(false), 500); 

    if (isPlaying) {
      setEngineIsPlaying(false);
    }
    resetWorker();
  }, [isPlaying, setEngineIsPlaying, resetWorker]);


  const handleInstrumentChange = (part: keyof InstrumentSettings, name: BassInstrument | MelodyInstrument | AccompanimentInstrument | keyof typeof V2_PRESETS) => {
    
    let newInstrumentName = name;
    
    setInstrumentSettings(prev => ({
        ...prev,
        [part]: { ...prev[part], name: newInstrumentName }
    }));
    
    setInstrument(part, newInstrumentName as any);
  };
  
  const handleBassTechniqueChange = (technique: BassTechnique) => {
      setInstrumentSettings(prev => ({
        ...prev,
        bass: { ...prev.bass, technique }
      }));
      setBassTechnique(technique);
  };

  const handleVolumeChange = (part: InstrumentPart, value: number) => {
    if (part === 'bass' || part === 'melody' || part === 'accompaniment' || part === 'harmony' || part === 'piano' || part === 'violin' || part === 'flute' || part === 'guitarChords' || part === 'acousticGuitarSolo' || part === 'electricGuitar') {
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
    setGenre,
    useMelodyV2,
    toggleMelodyEngine,
    introBars,
    setIntroBars,
  };
};

    