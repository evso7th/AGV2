/**
 * #ЗАЧЕМ: Хук управления музыкой V10.0 — "Manual Route Jump".
 * #ЧТО: ПЛАН №36 — Добавлен метод selectRouteItem для мгновенного переключения и перезапуска с 0 такта.
 */
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { 
    DrumSettings, InstrumentSettings, ScoreName, WorkerSettings, 
    InstrumentPart, BassTechnique, TextureSettings, TimerSettings, 
    Mood, Genre, SoundMix, RouteItem, SavedRoute
} from '@/types/music';
import { useAudioEngine } from "@/contexts/audio-engine-context";
import { GENRE_MASTER_MIX } from "@/lib/master-mix";
import { getBlueprint } from "@/lib/blueprints";
import { useToast } from "./use-toast";
import { arrayMove } from "@dnd-kit/sortable";

const SAVED_JOURNEYS_KEY = 'AuraGroove_SavedJourneys';
const CURRENT_ROUTE_KEY = 'AuraGroove_CurrentRoute';
const TRACK_HISTORY_KEY = 'AuraGroove_TrackHistory';
const EQ_PRESETS_KEY = 'AuraGroove_EQPresets';
const MIXER_PRESETS_KEY = 'AuraGroove_MixerPresets';
const ACTIVE_EQ_ID_KEY = 'AuraGroove_ActiveEqPresetId';
const ACTIVE_MIXER_ID_KEY = 'AuraGroove_ActiveMixerPresetId';

export type PresetItem = { id: string; name: string; values: any };

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
  handleEqChange: (index: number, value: number) => void;
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
  voiceLimit: number;
  setVoiceLimit: (limit: number) => void;
  // --- Route Specific ---
  route: RouteItem[];
  addToRoute: (genre: Genre | 'random', mood: Mood | 'random') => void;
  removeFromRoute: (id: string) => void;
  selectRouteItem: (id: string) => void; // NEW: ПЛАН №36
  refreshRoute: () => void;
  moveRouteItem: (id: string, direction: 'up' | 'down') => void;
  reorderRoute: (activeId: string, overId: string) => void;
  saveRoute: (name: string) => void;
  loadRoute: (route: SavedRoute) => void;
  deleteSavedRoute: (id: string) => void;
  savedRoutes: SavedRoute[];
  isShuffle: boolean;
  setShuffle: (val: boolean) => void;
  isRepeat: boolean;
  setRepeat: (val: boolean) => void;
  activeRouteIndex: number;
  showAdvancedUI: boolean;
  setShowAdvancedUI: (val: boolean) => void;
  currentBar: number;
  totalBars: number;
  // --- Preset Stewardship ---
  eqPresets: PresetItem[];
  activeEqPresetId: string | null;
  saveEqPreset: (name: string) => void;
  updateActiveEqPreset: () => void;
  loadEqPreset: (id: string) => void;
  deleteEqPreset: (id: string) => void;
  mixerPresets: PresetItem[];
  activeMixerPresetId: string | null;
  saveMixerPreset: (name: string) => void;
  updateActiveMixerPreset: () => void;
  loadMixerPreset: (id: string) => void;
  deleteMixerPreset: (id: string) => void;
  resetMixerToSystem: () => void;
};

export const useAuraGroove = (): AuraGrooveProps => {
  const { 
    isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, availableCompositions, initialize, 
    setIsPlaying: setEngineIsPlaying, updateSettings, refreshCloudAxioms, setVolume, setInstrument,
    setTextureSettings: setEngineTextureSettings, toggleBroadcast, getWorker, startRecording, stopRecording,
    setEQGain, setCalibrationGain, calibrationGains, voiceLimit, setVoiceLimit
  } = useAudioEngine(); 
  
  const { toast } = useToast();
  
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
  const [genre, setGenreState] = useState<Genre>('ambient');
  const [density, setDensity] = useState(0.5);
  const [composerControlsInstruments, setComposerControlsInstruments] = useState(true);
  const [useHeritage, setUseHeritage] = useState(true); 
  const [mood, setMoodState] = useState<Mood>('melancholic');
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
  
  const [activeRouteItemId, setActiveRouteItemId] = useState<string | null>(null);
  
  const activeRouteIndex = useMemo(() => 
    route.findIndex(it => it.id === activeRouteItemId), 
    [route, activeRouteItemId]
  );

  const [isShuffle, setShuffle] = useState(false);
  const [isRepeat, setRepeat] = useState(false);
  const [showAdvancedUI, setShowAdvancedUI] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  
  // --- Preset States ---
  const [eqPresets, setEqPresets] = useState<PresetItem[]>([]);
  const [activeEqPresetId, setActiveEqPresetId] = useState<string | null>(null);
  const [mixerPresets, setMixerPresets] = useState<PresetItem[]>([]);
  const [activeMixerPresetId, setActiveMixerPresetId] = useState<string | null>(null);

  const [currentBar, setCurrentBar] = useState(0);
  const [totalBars, setTotalBars] = useState(144);

  const lastBarCountRef = useRef(-1);

  useEffect(() => {
      if (typeof window === 'undefined') return;
      const savedJourneys = localStorage.getItem(SAVED_JOURNEYS_KEY);
      if (savedJourneys) { try { setSavedRoutes(JSON.parse(savedJourneys)); } catch (e) {} }
      const lastRoute = localStorage.getItem(CURRENT_ROUTE_KEY);
      if (lastRoute) { try { setRoute(JSON.parse(lastRoute)); } catch (e) {} }
      const savedEq = localStorage.getItem(EQ_PRESETS_KEY);
      if (savedEq) { try { setEqPresets(JSON.parse(savedEq)); } catch (e) {} }
      const savedMixer = localStorage.getItem(MIXER_PRESETS_KEY);
      if (savedMixer) { try { setMixerPresets(JSON.parse(savedMixer)); } catch (e) {} }
      
      const activeMixerId = localStorage.getItem(ACTIVE_MIXER_ID_KEY);
      if (activeMixerId) setActiveMixerPresetId(activeMixerId);
      const activeEqId = localStorage.getItem(ACTIVE_EQ_ID_KEY);
      if (activeEqId) setActiveEqPresetId(activeEqId);
  }, []);

  const saveEqPreset = (name: string) => {
      const newPreset: PresetItem = { id: `eq-${Date.now()}`, name, values: [...eqSettings] };
      const updated = [...eqPresets, newPreset];
      setEqPresets(updated);
      localStorage.setItem(EQ_PRESETS_KEY, JSON.stringify(updated));
      setActiveEqPresetId(newPreset.id);
      localStorage.setItem(ACTIVE_EQ_ID_KEY, newPreset.id);
      toast({ title: "EQ Preset Saved" });
  };

  const updateActiveEqPreset = () => {
    if (!activeEqPresetId) return;
    const updated = eqPresets.map(p => p.id === activeEqPresetId ? { ...p, values: [...eqSettings] } : p);
    setEqPresets(updated);
    localStorage.setItem(EQ_PRESETS_KEY, JSON.stringify(updated));
    toast({ title: "EQ Preset Updated" });
  };

  const loadEqPreset = (id: string) => {
      const preset = eqPresets.find(p => p.id === id);
      if (preset) {
          setEqSettings(preset.values);
          preset.values.forEach((val: number, idx: number) => setEQGain(idx, val));
          setActiveEqPresetId(id);
          localStorage.setItem(ACTIVE_EQ_ID_KEY, id);
          toast({ title: "EQ Preset Loaded", description: preset.name });
      }
  };

  const deleteEqPreset = (id: string) => {
      if (id === activeEqPresetId) {
          setActiveEqPresetId(null);
          localStorage.removeItem(ACTIVE_EQ_ID_KEY);
      }
      const updated = eqPresets.filter(p => p.id !== id);
      setEqPresets(updated);
      localStorage.setItem(EQ_PRESETS_KEY, JSON.stringify(updated));
  };

  const getMixerValues = useCallback(() => ({
    bass: instrumentSettings.bass.volume,
    melody: instrumentSettings.melody.volume,
    accompaniment: instrumentSettings.accompaniment.volume,
    harmony: instrumentSettings.harmony.volume,
    pianoAccompaniment: instrumentSettings.pianoAccompaniment.volume,
    drums: drumSettings.volume,
    sparkles: textureSettings.sparkles.volume,
    sfx: textureSettings.sfx.volume,
    master: calibrationGains.master
  }), [instrumentSettings, drumSettings, textureSettings, calibrationGains.master]);

  const saveMixerPreset = (name: string) => {
      const values = getMixerValues();
      const newPreset: PresetItem = { id: `mixer-${Date.now()}`, name, values };
      const updated = [...mixerPresets, newPreset];
      setMixerPresets(updated);
      localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(updated));
      setActiveMixerPresetId(newPreset.id);
      localStorage.setItem(ACTIVE_MIXER_ID_KEY, newPreset.id);
      toast({ title: "Mixer Preset Saved" });
  };

  const updateActiveMixerPreset = () => {
    if (!activeMixerPresetId) return;
    const values = getMixerValues();
    const updated = mixerPresets.map(p => p.id === activeMixerPresetId ? { ...p, values } : p);
    setMixerPresets(updated);
    localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(updated));
    toast({ title: "Mixer Preset Updated" });
  };

  const loadMixerPreset = (id: string) => {
      const preset = mixerPresets.find(p => p.id === id);
      if (preset) {
          const v = preset.values;
          setVolume('bass', v.bass);
          setVolume('melody', v.melody);
          setVolume('accompaniment', v.accompaniment);
          setVolume('harmony', v.harmony);
          setVolume('pianoAccompaniment', v.pianoAccompaniment);
          setVolume('drums', v.drums);
          setVolume('sparkles', v.sparkles);
          setVolume('sfx', v.sfx);
          setCalibrationGain('master', v.master);

          setInstrumentSettings(prev => ({
              ...prev,
              bass: { ...prev.bass, volume: v.bass },
              melody: { ...prev.melody, volume: v.melody },
              accompaniment: { ...prev.accompaniment, volume: v.accompaniment },
              harmony: { ...prev.harmony, volume: v.harmony },
              pianoAccompaniment: { ...prev.pianoAccompaniment, volume: v.pianoAccompaniment }
          }));
          setDrumSettings(prev => ({ ...prev, volume: v.drums }));
          setTextureSettings(prev => ({
              ...prev,
              sparkles: { ...prev.sparkles, volume: v.sparkles },
              sfx: { ...prev.sfx, volume: v.sfx }
          }));
          setActiveMixerPresetId(id);
          localStorage.setItem(ACTIVE_MIXER_ID_KEY, id);
          toast({ title: "Mixer Preset Loaded", description: preset.name });
      }
  };

  const deleteMixerPreset = (id: string) => {
      if (id === activeMixerPresetId) {
          setActiveMixerPresetId(null);
          localStorage.removeItem(ACTIVE_MIXER_ID_KEY);
      }
      const updated = mixerPresets.filter(p => p.id !== id);
      setMixerPresets(updated);
      localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(updated));
  };

  const resetMixerToSystem = () => {
    setActiveMixerPresetId(null);
    localStorage.removeItem(ACTIVE_MIXER_ID_KEY);
    applyAutoMix();
    toast({ title: "Switched to System Default" });
  };

  useEffect(() => {
      if (route.length > 0) { localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(route)); }
  }, [route]);

  const saveRoute = (name: string) => {
      if (route.length === 0) { toast({ title: "Route Empty" }); return; }
      const newSavedRoute: SavedRoute = {
          id: `local-route-${Date.now()}`,
          userId: 'local-user',
          name,
          items: route.map(it => ({ genre: it.genre, mood: it.mood })),
          createdAt: new Date().toISOString()
      };
      const updated = [newSavedRoute, ...savedRoutes];
      setSavedRoutes(updated);
      localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(updated));
      toast({ title: "Journey Saved", description: name });
  };

  const applyRouteItem = useCallback((item: RouteItem) => {
    const g = item.genre === 'random' ? (['ambient', 'psybient', 'blues', 'reggae'] as Genre[])[Math.floor(Math.random() * 4)] : item.genre;
    const m = item.mood === 'random' ? (['melancholic', 'dreamy', 'joyful', 'calm'] as Mood[])[Math.floor(Math.random() * 4)] : item.mood;
    setGenreState(g); 
    setMoodState(m); 
    setCurrentSeed(Date.now());
    setActiveRouteItemId(item.id); 
  }, []);

  const loadRoute = (saved: SavedRoute) => {
      const items: RouteItem[] = saved.items.map((it, idx) => ({
          id: `route-${Date.now()}-${idx}`,
          genre: it.genre,
          mood: it.mood,
          status: 'pending'
      }));
      setRoute(items);
      applyRouteItem(items[0]);
      toast({ title: "Journey Loaded", description: saved.name });
  };

  const deleteSavedRoute = (id: string) => {
      const updated = savedRoutes.filter(r => r.id !== id);
      setSavedRoutes(updated);
      localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(updated));
  };

  useEffect(() => { initialize(); }, [initialize]);

  const handleRouteTransition = useCallback(() => {
      if (route.length === 0) return;
      let nextIndex = 0;
      const currentIndex = activeRouteIndex;
      
      if (isShuffle) {
          if (route.length > 1) {
              let newIdx;
              do { newIdx = Math.floor(Math.random() * route.length); } while (newIdx === currentIndex);
              nextIndex = newIdx;
          } else { nextIndex = 0; }
      } else { 
          nextIndex = (currentIndex + 1) % route.length; 
      }
      
      applyRouteItem(route[nextIndex]);
      toast({ 
        title: "Journey Progression", 
        description: `Moving to ${route[nextIndex].genre.toUpperCase()} / ${route[nextIndex].mood.toUpperCase()}` 
      });
  }, [activeRouteIndex, route, isShuffle, applyRouteItem, toast]);

  const refreshRouteAction = useCallback(() => {
    const lastRoute = localStorage.getItem(CURRENT_ROUTE_KEY);
    if (lastRoute) {
        try {
            const parsed = JSON.parse(lastRoute);
            setRoute(parsed);
            refreshCloudAxioms();
            toast({ title: "Path Refreshed", description: "Route and DNA pool synchronized." });
        } catch (e) {}
    }
  }, [refreshCloudAxioms, toast]);

  useEffect(() => {
    const worker = getWorker();
    if (!worker) return;
    const handleMessage = (e: MessageEvent) => {
        const { type, payload } = e.data;
        if (type === 'SCORE_READY' && payload) {
            setBpm(payload.actualBpm);
            setCurrentBar(payload.barCount);
            if (payload.totalBars) setTotalBars(payload.totalBars);
            const currentBarNum = payload.barCount;
            if (currentBarNum === 0 && lastBarCountRef.current > 0 && isPlaying && activeRouteIndex >= 0 && route.length > 0) {
                handleRouteTransition();
            }
            lastBarCountRef.current = currentBarNum;
        }
    };
    worker.addEventListener('message', handleMessage);
    return () => worker.removeEventListener('message', handleMessage);
  }, [isPlaying, activeRouteIndex, route.length, getWorker, handleRouteTransition]);

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
  };

  const removeFromRoute = (id: string) => {
      if (id === activeRouteItemId && isPlaying) {
          handleRouteTransition();
      }
      setRoute(prev => prev.filter(it => it.id !== id));
  };

  // #ЗАЧЕМ: ПЛАН №36. Ручное переключение точки маршрута.
  const selectRouteItem = useCallback((id: string) => {
      const item = route.find(it => it.id === id);
      if (!item) return;

      // Принудительная остановка для чистого старта с 0 такта
      setEngineIsPlaying(false);
      
      // Небольшая задержка для завершения текущих процессов в воркере
      setTimeout(() => {
          applyRouteItem(item);
          setEngineIsPlaying(true);
          toast({ 
              title: "Manual Journey Jump", 
              description: `Jumping to: ${item.genre.toUpperCase()} / ${item.mood.toUpperCase()}` 
          });
      }, 50);
  }, [route, applyRouteItem, setEngineIsPlaying, toast]);

  const moveRouteItem = (id: string, direction: 'up' | 'down') => {
      setRoute(prev => {
          const idx = prev.findIndex(it => it.id === id);
          if (idx === -1) return prev;
          const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (nextIdx < 0 || nextIdx >= prev.length) return prev;
          const n = [...prev];
          [n[idx], n[nextIdx]] = [n[nextIdx], n[idx]];
          return n;
      });
  };

  const reorderRoute = (activeId: string, overId: string) => {
      if (activeId === overId) return;
      setRoute(prev => {
          const oldIndex = prev.findIndex(item => item.id === activeId);
          const newIndex = prev.findIndex(item => item.id === overId);
          return arrayMove(prev, oldIndex, newIndex);
      });
  };

  /**
   * #ЗАЧЕМ: Применение автоматического баланса жанра.
   * #ЧТО: ПЛАН №30 — Добавлена блокировка, если активен пользовательский пресет.
   */
  const applyAutoMix = useCallback(() => {
      if (!isInitialized) return;
      
      // #ЗАЧЕМ: Если пользователь загрузил свои настройки, система не должна их перетирать.
      if (activeMixerPresetId) {
          console.log(`[AutoMix] Blocked: User Preset "${activeMixerPresetId}" is active.`);
          return;
      }

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
  }, [isInitialized, genre, mood, setVolume, textureSettings.sparkles.enabled, textureSettings.sfx.enabled, activeMixerPresetId]);

  useEffect(() => { applyAutoMix(); }, [genre, mood, isInitialized, applyAutoMix]);

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
    if (part in instrumentSettings) { 
        setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], volume: value } })); 
    }
    else if (part === 'drums') { setDrumSettings(prev => ({ ...prev, volume: value })); }
    else if (part === 'sparkles' || part === 'sfx') { setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part as 'sparkles' | 'sfx'], volume: value } })); }
  };

  const setGenre = (g: Genre) => {
      if (g !== genre) {
          setGenreState(g);
          setSelectedCompositionIds([]); 
      }
  };

  const setMood = (m: Mood) => {
      if (m !== mood) {
          setMoodState(m);
          setSelectedCompositionIds([]); 
      }
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
            if (route.length > 0 && activeRouteIndex === -1) { 
                applyRouteItem(route[0]); 
            }
            lastBarCountRef.current = -1; setEngineIsPlaying(true);
        } else { setEngineIsPlaying(false); }
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
    handleSaveMasterpiece: () => {},
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
    voiceLimit, setVoiceLimit,
    route, addToRoute, removeFromRoute, selectRouteItem, refreshRoute: refreshRouteAction, moveRouteItem, reorderRoute, saveRoute, loadRoute, deleteSavedRoute, savedRoutes,
    isShuffle, setShuffle, isRepeat, setRepeat, activeRouteIndex,
    showAdvancedUI, setShowAdvancedUI,
    currentBar, totalBars,
    // --- Preset Stewardship ---
    eqPresets, activeEqPresetId, saveEqPreset, updateActiveEqPreset, loadEqPreset, deleteEqPreset,
    mixerPresets, activeMixerPresetId, saveMixerPreset, updateActiveMixerPreset, loadMixerPreset, deleteMixerPreset, resetMixerToSystem
  };
};
