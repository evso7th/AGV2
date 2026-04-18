
/**
 * #ЗАЧЕМ: Хук управления музыкой V7.2 — "The Route Navigator".
 * #ЧТО: ПЛАН №1230 — Исправлена остановка после такта 0. Переход по маршруту теперь ждет завершения пьесы.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { 
    DrumSettings, InstrumentSettings, ScoreName, WorkerSettings, 
    InstrumentPart, BassTechnique, TextureSettings, TimerSettings, 
    Mood, Genre, SoundMix, RouteItem 
} from '@/types/music';
import { useAudioEngine } from "@/contexts/audio-engine-context";
import { useFirestore } from "@/firebase";
import { saveMasterpiece } from "@/lib/firebase-service";
import { GENRE_MASTER_MIX } from "@/lib/master-mix";
import { getBlueprint } from "@/lib/blueprints";

const TRACK_HISTORY_KEY = 'AuraGroove_TrackHistory';

export type AuraGrooveProps = {
  isPlaying: boolean;
  isInitializing: boolean;
  isRegenerating: boolean;
  isRecording: boolean;
  isBroadcastActive: boolean;
  isWarmingUp: boolean;
  warmUpTimeLeft: number;
  loadingText: string;
  availableCompositions: { id: string; count: number; genres: string[]; moods: string[] }[];
  selectedCompositionIds: string[];
  toggleCompositionFilter: (id: string) => void;
  clearCompositionFilters: () => void;
  refreshCloudAxioms: () => Promise<void>; 
  drumSettings: DrumSettings;
  setDrumSettings: (settings: React.SetStateAction<DrumSettings>) => void;
  instrumentSettings: InstrumentSettings;
  setInstrumentSettings: (part: keyof InstrumentSettings, name: any) => void;
  handleBassTechniqueChange: (technique: BassTechnique) => void;
  handleVolumeChange: (part: InstrumentPart | 'drums' | 'sparkles' | 'sfx', value: number) => void;
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
  useHeritage: boolean; 
  setUseHeritage: (value: boolean) => void;
  handleGoHome: () => void;
  isEqModalOpen: boolean;
  setIsEqModalOpen: (isOpen: boolean) => void;
  eqSettings: number[];
  handleEqChange: (bandIndex: number, gain: number) => void;
  isCalibrationModalOpen: boolean;
  setIsCalibrationModalOpen: (isOpen: boolean) => void;
  calibrationGains: Record<string, number>;
  handleCalibrationChange: (key: string, value: number) => void;
  timerSettings: TimerSettings;
  handleTimerDurationChange: (minutes: number) => void;
  handleToggleTimer: () => void;
  mood: Mood;
  setMood: (mood: Mood) => void;
  genre: Genre;
  setGenre: (genre: Genre) => void;
  introBars: number;
  setIntroBars: (bars: number) => void;
  // --- Route Specific ---
  route: RouteItem[];
  addToRoute: (genre: Genre | 'random', mood: Mood | 'random') => void;
  removeFromRoute: (id: string) => void;
  moveRouteItem: (id: string, direction: 'up' | 'down') => void;
  isShuffle: boolean;
  setShuffle: (val: boolean) => void;
  isRepeat: boolean;
  setRepeat: (val: boolean) => void;
  activeRouteIndex: number;
  showAdvancedUI: boolean;
  setShowAdvancedUI: (val: boolean) => void;
};

export const useAuraGroove = (): AuraGrooveProps => {
  const { 
    isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, availableCompositions, initialize, 
    setIsPlaying: setEngineIsPlaying, updateSettings, refreshCloudAxioms, resetWorker, setVolume, setInstrument,
    setTextureSettings: setEngineTextureSettings, toggleBroadcast, getWorker, startRecording, stopRecording,
    setEQGain, setCalibrationGain, calibrationGains
  } = useAudioEngine(); 
  
  const db = useFirestore();
  
  const [drumSettings, setDrumSettings] = useState<DrumSettings>({ pattern: 'composer', volume: 0.5, kickVolume: 1.0, enabled: true });
  const [instrumentSettings, setInstrumentSettings] = useState<InstrumentSettings>({
    bass: { name: "bass_jazz_warm" as any, volume: 0.5, technique: 'walking' as any },
    melody: { name: "blackAcoustic" as any, volume: 0.5 },
    accompaniment: { name: "organ_soft_jazz" as any, volume: 0.5 },
    harmony: { name: "guitarChords", volume: 0.5 }, 
    pianoAccompaniment: { name: "piano", volume: 0.5 },
  });
  const [textureSettings, setTextureSettings] = useState<TextureSettings>({
      sparkles: { enabled: true, volume: 0.5 },
      sfx: { enabled: true, volume: 0.5 },
  });
  
  const [bpm, setBpm] = useState(75);
  const [score, setScore] = useState<ScoreName>('neuro_f_matrix');
  const [genre, setGenre] = useState<Genre>('ambient');
  const [density, setDensity] = useState(0.5);
  const [composerControlsInstruments, setComposerControlsInstruments] = useState(true);
  const [useHeritage, setUseHeritage] = useState(true); 
  const [mood, setMood] = useState<Mood>('melancholic');
  const [introBars, setIntroBars] = useState(8); 
  const [currentSeed, setCurrentSeed] = useState<number>(() => Date.now());
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({ duration: 0, timeLeft: 0, isActive: false });
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [warmUpTimeLeft, setWarmUpTimeLeft] = useState(0);
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [eqSettings, setEqSettings] = useState<number[]>(new Array(7).fill(0));
  const [selectedCompositionIds, setSelectedCompositionIds] = useState<string[]>([]);
  const [route, setRoute] = useState<RouteItem[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState(-1);
  const [isShuffle, setShuffle] = useState(false);
  const [isRepeat, setRepeat] = useState(false);
  const [showAdvancedUI, setShowAdvancedUI] = useState(false);

  const lastBarCountRef = useRef(-1);

  useEffect(() => { initialize(); }, [initialize]);

  const applyRouteItem = useCallback((item: RouteItem) => {
    const g = item.genre === 'random' ? (['ambient', 'psybient', 'blues', 'reggae'] as Genre[])[Math.floor(Math.random() * 4)] : item.genre;
    const m = item.mood === 'random' ? (['melancholic', 'dreamy', 'joyful', 'calm'] as Mood[])[Math.floor(Math.random() * 4)] : item.mood;
    setGenre(g); 
    setMood(m); 
    setCurrentSeed(Date.now());
    // We update the route status in a follow-up to keep visual sync
  }, []);

  const handleRouteTransition = useCallback(() => {
      let nextIndex = activeRouteIndex + 1;
      if (nextIndex >= route.length) {
          if (isRepeat) {
              nextIndex = 0;
          } else if (isShuffle) {
              const nextGenre = (['ambient', 'psybient', 'blues', 'reggae'] as Genre[])[Math.floor(Math.random() * 4)];
              const nextMood = (['melancholic', 'dreamy', 'joyful', 'calm'] as Mood[])[Math.floor(Math.random() * 4)];
              const newItem: RouteItem = { id: `route-${Date.now()}`, genre: nextGenre, mood: nextMood, status: 'pending' };
              setRoute(prev => [...prev, newItem]);
              // Index will stay the same for now, effectively pointing to the new item
              nextIndex = activeRouteIndex + 1;
          } else {
              setEngineIsPlaying(false);
              return;
          }
      }
      setActiveRouteIndex(nextIndex);
      applyRouteItem(route[nextIndex]);
  }, [activeRouteIndex, route, isRepeat, isShuffle, setEngineIsPlaying, applyRouteItem]);

  useEffect(() => {
    const worker = getWorker();
    if (!worker) return;
    const handleMessage = (e: MessageEvent) => {
        const { type, payload } = e.data;
        if (type === 'SCORE_READY' && payload) {
            setBpm(payload.actualBpm);
            const currentBar = payload.barCount;
            
            // #ЗАЧЕМ: Детекция реального перехода.
            // Если такт стал 0, а до этого был > 0 — значит пьеса закончилась и пошел мост/новый цикл.
            if (currentBar === 0 && lastBarCountRef.current > 0 && isPlaying && activeRouteIndex >= 0) {
                console.log(`%c[Navigator] Piece finished. Moving to next route item.`, 'color: #primary; font-weight: bold;');
                handleRouteTransition();
            }
            lastBarCountRef.current = currentBar;
        }
    };
    worker.addEventListener('message', handleMessage);
    return () => worker.removeEventListener('message', handleMessage);
  }, [isPlaying, activeRouteIndex, getWorker, handleRouteTransition]);

  useEffect(() => {
    if (activeRouteIndex >= 0 && activeRouteIndex < route.length) {
        setRoute(prev => prev.map((it, idx) => ({ 
            ...it, 
            status: idx === activeRouteIndex ? 'playing' : (idx < activeRouteIndex ? 'completed' : 'pending') 
        })));
    }
  }, [activeRouteIndex]);


  const addToRoute = (g: Genre | 'random', m: Mood | 'random') => {
      const newItem: RouteItem = { id: `route-${Date.now()}`, genre: g, mood: m, status: 'pending' };
      setRoute(prev => [...prev, newItem]);
      if (activeRouteIndex === -1) {
          setActiveRouteIndex(0);
          if (isPlaying) applyRouteItem(newItem);
      }
  };

  const removeFromRoute = (id: string) => {
      setRoute(prev => {
          const idx = prev.findIndex(it => it.id === id);
          const next = prev.filter(it => it.id !== id);
          if (idx === activeRouteIndex) {
              setActiveRouteIndex(-1); // Stop or move? For now just stop logic.
          } else if (idx < activeRouteIndex) {
              setActiveRouteIndex(activeRouteIndex - 1);
          }
          return next;
      });
  };

  const moveRouteItem = (id: string, direction: 'up' | 'down') => {
      setRoute(prev => {
          const idx = prev.findIndex(it => it.id === id);
          if (idx === -1) return prev;
          const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (nextIdx < 0 || nextIdx >= prev.length) return prev;
          const n = [...prev];
          [n[idx], n[nextIdx]] = [n[nextIdx], n[idx]];
          
          // Keep active index pointed to the same physical item
          if (activeRouteIndex === idx) setActiveRouteIndex(nextIdx);
          else if (activeRouteIndex === nextIdx) setActiveRouteIndex(idx);
          
          return n;
      });
  };

  const applyAutoMix = useCallback(() => {
      if (!isInitialized) return;
      const masterGenreMix = GENRE_MASTER_MIX[genre];
      const blueprint = getBlueprint(genre, mood);
      const moodOverrideMix = blueprint.soundMix || {};
      const finalMix: SoundMix = { ...masterGenreMix, ...moodOverrideMix };
      const parts: (keyof InstrumentSettings)[] = ['bass', 'melody', 'accompaniment', 'harmony', 'pianoAccompaniment'];
      parts.forEach(part => {
          const vol = finalMix[part];
          if (vol !== undefined) {
              setVolume(part, vol);
              setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part], volume: vol } }));
          }
      });
      if (finalMix.drums !== undefined) { setVolume('drums', finalMix.drums); setDrumSettings(prev => ({ ...prev, volume: finalMix.drums! })); }
      if (finalMix.sparkles !== undefined) { setVolume('sparkles', textureSettings.sparkles.enabled ? finalMix.sparkles : 0); setTextureSettings(prev => ({ ...prev, sparkles: { ...prev.sparkles, volume: finalMix.sparkles! } })); }
      if (finalMix.sfx !== undefined) { setVolume('sfx', textureSettings.sfx.enabled ? finalMix.sfx : 0); setTextureSettings(prev => ({ ...prev, sfx: { ...prev.sfx, volume: finalMix.sfx! } })); }
  }, [isInitialized, genre, mood, setVolume, textureSettings.sparkles.enabled, textureSettings.sfx.enabled]);

  useEffect(() => { applyAutoMix(); }, [genre, mood, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
        updateSettings({
          bpm, score, genre, instrumentSettings,
          drumSettings: { ...drumSettings, enabled: drumSettings.pattern !== 'none' },
          textureSettings: {
              sparkles: { enabled: textureSettings.sparkles.enabled, volume: textureSettings.sparkles.volume },
              sfx: { enabled: textureSettings.sfx.enabled, volume: textureSettings.sfx.volume },
          },
          density, composerControlsInstruments, useHeritage, mood, introBars, 
          selectedCompositionIds, seed: currentSeed
        });
    }
  }, [isInitialized, bpm, score, genre, instrumentSettings, drumSettings, textureSettings, density, composerControlsInstruments, useHeritage, mood, introBars, selectedCompositionIds, currentSeed, updateSettings]);

  const handleVolumeChange = (part: any, value: number) => {
    setVolume(part, value);
    if (part in instrumentSettings) { setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], volume: value } })); }
    else if (part === 'drums') { setDrumSettings(prev => ({ ...prev, volume: value })); }
    else if (part === 'sparkles' || part === 'sfx') { setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part as 'sparkles' | 'sfx'], volume: value } })); }
  };

  return {
    isInitializing, isPlaying, isRegenerating, isRecording, isBroadcastActive, isWarmingUp, warmUpTimeLeft,
    loadingText: isInitializing ? 'Initializing...' : 'Ready',
    availableCompositions, selectedCompositionIds, 
    toggleCompositionFilter: (id) => setSelectedCompositionIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]),
    clearCompositionFilters: () => setSelectedCompositionIds([]), refreshCloudAxioms,
    handlePlayPause: async () => {
        if (!isInitialized) return;
        if (!isPlaying) {
            // Если маршрут не пуст, но индекс -1 (первый запуск), стартуем с первого
            if (activeRouteIndex === -1 && route.length > 0) {
                setActiveRouteIndex(0);
                applyRouteItem(route[0]);
            }
            // Сбрасываем счетчик тактов для корректной детекции следующего перехода
            lastBarCountRef.current = -1;
        }
        setEngineIsPlaying(!isPlaying);
    },
    handleRegenerate: () => { setIsRegenerating(true); setCurrentSeed(Date.now()); setTimeout(() => setIsRegenerating(false), 500); },
    handleToggleRecording: () => isRecording ? stopRecording() : startRecording(),
    handleToggleBroadcast: () => {
        if (!isBroadcastActive && !isPlaying) {
            setIsWarmingUp(true); setWarmUpTimeLeft(5);
            const tid = setInterval(() => setWarmUpTimeLeft(p => { if(p<=1){clearInterval(tid); setIsWarmingUp(false); return 0;} return p-1; }), 1000);
        }
        toggleBroadcast();
    },
    handleSaveMasterpiece: () => { if (!isInitialized) return; saveMasterpiece(db, { seed: currentSeed, mood, genre, density, bpm, instrumentSettings }); },
    drumSettings, setDrumSettings, instrumentSettings, setInstrumentSettings: (part, name) => { setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], name } })); setInstrument(part as any, name as any); },
    handleBassTechniqueChange: () => {}, handleVolumeChange, textureSettings, 
    handleTextureEnabledChange: (part, enabled) => setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part], enabled }})),
    bpm, handleBpmChange: setBpm, score, handleScoreChange: setScore, density, setDensity,
    composerControlsInstruments, setComposerControlsInstruments,
    useHeritage, setUseHeritage,
    handleGoHome: () => { setEngineIsPlaying(false); window.location.href = '/'; },
    isEqModalOpen, setIsEqModalOpen, eqSettings, 
    handleEqChange: (index: number, value: number) => { const next = [...eqSettings]; next[index] = value; setEqSettings(next); setEQGain(index, value); },
    isCalibrationModalOpen, setIsCalibrationModalOpen, calibrationGains, handleCalibrationChange: setCalibrationGain,
    timerSettings, handleTimerDurationChange: (m) => setTimerSettings(p => ({ ...p, duration: m*60, timeLeft: m*60 })),
    handleToggleTimer: () => setTimerSettings(p => ({ ...p, isActive: !p.isActive, timeLeft: p.duration })),
    mood, setMood, genre, setGenre, introBars, setIntroBars,
    route, addToRoute, removeFromRoute, moveRouteItem, isShuffle, setShuffle, isRepeat, setRepeat, activeRouteIndex,
    showAdvancedUI, setShowAdvancedUI
  };
};
