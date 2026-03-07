
/**
 * #ЗАЧЕМ: Хук управления UI музыкой V5.4 — "Seed Sovereignty".
 * #ЧТО: ПЛАН №744 — Play/Pause больше не генерирует семя. Семя управляется только Regenerate.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DrumSettings, InstrumentSettings, ScoreName, WorkerSettings, InstrumentPart, BassInstrument, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, TimerSettings, Mood, Genre } from '@/types/music';
import { useAudioEngine } from "@/contexts/audio-engine-context";
import { useFirestore } from "@/firebase";
import { saveMasterpiece } from "@/lib/firebase-service";

const LICK_HISTORY_KEY = 'AuraGroove_LickHistory';

export type AuraGrooveProps = {
  isPlaying: boolean;
  isInitializing: boolean;
  isRegenerating: boolean;
  isRecording: boolean;
  isBroadcastActive: boolean;
  isWarmingUp: boolean;
  warmUpTimeLeft: number;
  loadingText: string;
  availableCompositions: { id: string; count: number }[];
  selectedCompositionIds: string[];
  toggleCompositionFilter: (id: string) => void;
  clearCompositionFilters: () => void;
  refreshCloudAxioms: () => Promise<void>; 
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
};

export const useAuraGroove = (): AuraGrooveProps => {
  const { 
    isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, availableCompositions, initialize, 
    setIsPlaying: setEngineIsPlaying, updateSettings, refreshCloudAxioms, resetWorker, setVolume, setInstrument,
    setTextureSettings: setEngineTextureSettings, toggleBroadcast, getWorker, startRecording, stopRecording,
    setEQGain
  } = useAudioEngine(); 
  
  const db = useFirestore();
  
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
  
  // #ЗАЧЕМ: Семя инициализируется сразу, чтобы Play не вызывал регенерацию.
  const [currentSeed, setCurrentSeed] = useState<number>(() => Date.now());
  
  const [sessionLickHistory, setSessionLickHistory] = useState<string[]>([]);
  const [selectedCompositionIds, setSelectedCompositionIds] = useState<string[]>([]);
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({ duration: 0, timeLeft: 0, isActive: false });
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [warmUpTimeLeft, setWarmUpTimeLeft] = useState(0);

  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [eqSettings, setEqSettings] = useState<number[]>(new Array(7).fill(0));

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    const handleBpmSync = (e: any) => {
        if (e.detail && e.detail.bpm) {
            setBpm(e.detail.bpm);
        }
    };
    window.addEventListener('AG_BPM_SYNC', handleBpmSync);
    return () => window.removeEventListener('AG_BPM_SYNC', handleBpmSync);
  }, []);

  const updateAllVolumes = useCallback(() => {
    if (!isInitialized) return;
    Object.entries(instrumentSettings).forEach(([part, s]) => setVolume(part, s.volume));
    setVolume('drums', drumSettings.volume);
    setVolume('sparkles', textureSettings.sparkles.enabled ? textureSettings.sparkles.volume : 0);
    setVolume('sfx', textureSettings.sfx.enabled ? textureSettings.sfx.volume : 0);
  }, [isInitialized, instrumentSettings, drumSettings, textureSettings, setVolume]);

  useEffect(() => {
    if (isInitialized) {
        updateSettings({
          bpm, score, genre, instrumentSettings,
          drumSettings: { ...drumSettings, enabled: drumSettings.pattern !== 'none' },
          textureSettings: {
              sparkles: { enabled: textureSettings.sparkles.enabled, volume: textureSettings.sparkles.volume },
              sfx: { enabled: textureSettings.sfx.enabled, volume: textureSettings.sfx.volume },
          },
          density, composerControlsInstruments, mood, introBars, sessionLickHistory, selectedCompositionIds,
          seed: currentSeed
        });
        updateAllVolumes();
    }
  }, [isInitialized, bpm, score, genre, instrumentSettings, drumSettings, textureSettings, density, composerControlsInstruments, mood, introBars, selectedCompositionIds, currentSeed, updateSettings, updateAllVolumes]);

  const handleVolumeChange = (part: InstrumentPart, value: number) => {
    setVolume(part as string, value);
    if (part in instrumentSettings) {
      setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], volume: value } }));
    } else if (part === 'drums') {
      setDrumSettings(prev => ({ ...prev, volume: value }));
    } else if (part === 'sparkles' || part === 'sfx') {
      setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part as 'sparkles' | 'sfx'], volume: value } }));
    }
  };

  return {
    isInitializing, isPlaying, isRegenerating, isRecording, isBroadcastActive, isWarmingUp, warmUpTimeLeft,
    loadingText: isInitializing ? 'Initializing...' : 'Ready',
    availableCompositions, selectedCompositionIds, toggleCompositionFilter: (id) => setSelectedCompositionIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]),
    clearCompositionFilters: () => setSelectedCompositionIds([]), refreshCloudAxioms,
    handlePlayPause: async () => {
        if (!isInitialized) return;
        // #ЗАЧЕМ: Play теперь только играет. Никакой скрытой регенерации.
        setEngineIsPlaying(!isPlaying);
    },
    handleRegenerate: () => {
        setIsRegenerating(true);
        // #ЗАЧЕМ: Regenerate — единственный источник нового семени.
        const nextSeed = Date.now();
        setCurrentSeed(nextSeed);
        setTimeout(() => setIsRegenerating(false), 500); 
    },
    handleToggleRecording: () => isRecording ? stopRecording() : startRecording(),
    handleToggleBroadcast: () => {
        if (!isBroadcastActive && !isPlaying) {
            setIsWarmingUp(true); setWarmUpTimeLeft(5);
            const tid = setInterval(() => setWarmUpTimeLeft(p => { if(p<=1){clearInterval(tid); setIsWarmingUp(false); return 0;} return p-1; }), 1000);
        }
        toggleBroadcast();
    },
    handleSaveMasterpiece: () => {
        if (!isInitialized) return;
        saveMasterpiece(db, { 
            seed: currentSeed, 
            mood, 
            genre, 
            density, 
            bpm, 
            instrumentSettings 
        });
    },
    drumSettings, setDrumSettings, instrumentSettings, setInstrumentSettings: (part, name) => {
        setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], name } }));
        setInstrument(part as any, name as any);
    },
    handleBassTechniqueChange: () => {}, handleVolumeChange, textureSettings, 
    handleTextureEnabledChange: (part, enabled) => setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part], enabled }})),
    bpm, handleBpmChange: setBpm, score, handleScoreChange: setScore, density, setDensity,
    composerControlsInstruments, setComposerControlsInstruments, handleGoHome: () => { setEngineIsPlaying(false); window.location.href = '/'; },
    isEqModalOpen, setIsEqModalOpen, eqSettings, 
    handleEqChange: (index: number, value: number) => {
        const next = [...eqSettings];
        next[index] = value;
        setEqSettings(next);
        setEQGain(index, value);
    },
    timerSettings, handleTimerDurationChange: (m) => setTimerSettings(p => ({ ...p, duration: m*60, timeLeft: m*60 })),
    handleToggleTimer: () => setTimerSettings(p => ({ ...p, isActive: !p.isActive, timeLeft: p.duration })),
    mood, setMood, genre, setGenre, introBars, setIntroBars,
  };
};
