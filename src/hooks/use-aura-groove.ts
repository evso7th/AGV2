
/**
 * @fileOverview Хук управления музыкой V10.2 — "Atomic Path Synchronization".
 * #ЗАЧЕМ: Реализация мгновенного переключения точек маршрута.
 * #ЧТО: ПЛАН №9950 — Внедрен handleJumpToRoute для управления очередью.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from "react";
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
import { saveMasterpiece } from "@/lib/firebase-service";
import { useFirestore } from "@/firebase/provider";

const SAVED_JOURNEYS_KEY = 'AuraGroove_SavedJourneys';
const CURRENT_ROUTE_KEY = 'AuraGroove_CurrentRoute';
const EQ_PRESETS_KEY = 'AuraGroove_EQPresets';
const MIXER_PRESETS_KEY = 'AuraGroove_MixerPresets';
const ACTIVE_MIXER_KEY = 'AuraGroove_ActiveMixerPreset';
const ACTIVE_EQ_KEY = 'AuraGroove_ActiveEqPreset';

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
  handleUpdatePath: () => void;
  handleJumpToRoute: (index: number) => void;
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
  route: RouteItem[];
  addToRoute: (genre: Genre | 'random', mood: Mood | 'random') => void;
  removeFromRoute: (id: string) => void;
  moveRouteItem: (id: string, direction: 'up' | 'down') => void;
  reorderRoute: (activeId: string, overId: string) => void;
  saveRoute: (name: string) => void;
  loadRoute(route: SavedRoute): void;
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
  voiceLimit: number;
  activeVoiceCount: number;
  setVoiceLimit: (limit: number) => void;
  eqPresets: PresetItem[];
  activeEqPresetId: string | null;
  saveEqPreset: (name: string) => void;
  updateEqPreset: () => void;
  loadEqPreset: (id: string) => void;
  deleteEqPreset: (id: string) => void;
  mixerPresets: PresetItem[];
  activeMixerPresetId: string | null;
  saveMixerPreset: (name: string) => void;
  updateMixerPreset: () => void;
  loadMixerPreset: (id: string) => void;
  deleteMixerPreset: (id: string) => void;
};

export const useAuraGroove = (options: { isNavigatorMode: boolean } = { isNavigatorMode: false }): AuraGrooveProps => {
  const { 
    isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, availableCompositions, initialize, 
    setIsPlaying: setEngineIsPlaying, updateSettings, refreshCloudAxioms, setVolume, setInstrument,
    setTextureSettings: setEngineTextureSettings, toggleBroadcast, getWorker, startRecording, stopRecording,
    setEQGain, setCalibrationGain, calibrationGains, stopAllSounds, resetWorker,
    voiceLimit, activeVoiceCount, setVoiceLimit
  } = useAudioEngine(); 
  
  const { toast } = useToast();
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
  const [activeRouteIndex, setActiveRouteIndex] = useState(-1);
  const [isShuffle, setShuffle] = useState(false);
  const [isRepeat, setRepeat] = useState(false);
  const [showAdvancedUI, setShowAdvancedUI] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  
  const [eqPresets, setEqPresets] = useState<PresetItem[]>([]);
  const [activeEqPresetId, setActiveEqPresetId] = useState<string | null>(null);
  const [mixerPresets, setMixerPresets] = useState<PresetItem[]>([]);
  const [activeMixerPresetId, setActiveMixerPresetId] = useState<string | null>(null);
  
  const [currentBar, setCurrentBar] = useState(0);
  const [totalBars, setTotalBars] = useState(144);

  const lastBarCountRef = useRef(-1);

  // --- Initial Load ---
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
      
      const activeMixer = localStorage.getItem(ACTIVE_MIXER_KEY);
      if (activeMixer) {
          setActiveMixerPresetId(activeMixer);
          const presets = savedMixer ? JSON.parse(savedMixer) : [];
          const found = presets.find((p: any) => p.id === activeMixer);
          if (found) {
              setTimeout(() => {
                  const v = found.values;
                  handleVolumeChange('bass', v.bass);
                  handleVolumeChange('melody', v.melody);
                  handleVolumeChange('accompaniment', v.accompaniment);
                  handleVolumeChange('harmony', v.harmony);
                  handleVolumeChange('pianoAccompaniment', v.pianoAccompaniment);
                  handleVolumeChange('drums', v.drums);
                  handleVolumeChange('sparkles', v.sparkles);
                  handleVolumeChange('sfx', v.sfx);
                  setCalibrationGain('master', v.master);
              }, 1000);
          }
      }

      const activeEq = localStorage.getItem(ACTIVE_EQ_KEY);
      if (activeEq) {
          setActiveEqPresetId(activeEq);
          const presets = savedEq ? JSON.parse(savedEq) : [];
          const found = presets.find((p: any) => p.id === activeEq);
          if (found) {
              setTimeout(() => {
                  setEqSettings(found.values);
                  found.values.forEach((val: number, idx: number) => setEQGain(idx, val));
              }, 1000);
          }
      }
  }, []);

  const saveEqPreset = (name: string) => {
      const id = `eq-${Date.now()}`;
      const newPreset: PresetItem = { id, name, values: [...eqSettings] };
      const updated = [...eqPresets, newPreset];
      setEqPresets(updated);
      setActiveEqPresetId(id);
      localStorage.setItem(EQ_PRESETS_KEY, JSON.stringify(updated));
      localStorage.setItem(ACTIVE_EQ_KEY, id);
      toast({ title: "EQ Preset Saved" });
  };

  const updateEqPreset = () => {
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
          setActiveEqPresetId(id);
          localStorage.setItem(ACTIVE_EQ_KEY, id);
          preset.values.forEach((val: number, idx: number) => setEQGain(idx, val));
          toast({ title: "EQ Preset Loaded", description: preset.name });
      }
  };

  const deleteEqPreset = (id: string) => {
      const updated = eqPresets.filter(p => p.id !== id);
      setEqPresets(updated);
      if (activeEqPresetId === id) {
          setActiveEqPresetId(null);
          localStorage.removeItem(ACTIVE_EQ_KEY);
      }
      localStorage.setItem(EQ_PRESETS_KEY, JSON.stringify(updated));
  };

  const getMixerSnapshot = () => ({
      bass: instrumentSettings.bass.volume,
      melody: instrumentSettings.melody.volume,
      accompaniment: instrumentSettings.accompaniment.volume,
      harmony: instrumentSettings.harmony.volume,
      pianoAccompaniment: instrumentSettings.pianoAccompaniment.volume,
      drums: drumSettings.volume,
      sparkles: textureSettings.sparkles.volume,
      sfx: textureSettings.sfx.volume,
      master: calibrationGains.master
  });

  const saveMixerPreset = (name: string) => {
      const id = `mixer-${Date.now()}`;
      const newPreset: PresetItem = { id, name, values: getMixerSnapshot() };
      const updated = [...mixerPresets, newPreset];
      setMixerPresets(updated);
      setActiveMixerPresetId(id);
      localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(updated));
      localStorage.setItem(ACTIVE_MIXER_KEY, id);
      toast({ title: "Mixer Preset Saved" });
  };

  const updateMixerPreset = () => {
      if (!activeMixerPresetId) return;
      const updated = mixerPresets.map(p => p.id === activeMixerPresetId ? { ...p, values: getMixerSnapshot() } : p);
      setMixerPresets(updated);
      localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(updated));
      toast({ title: "Mixer Preset Updated" });
  };

  const loadMixerPreset = (id: string) => {
      const preset = mixerPresets.find(p => p.id === id);
      if (preset) {
          const v = preset.values;
          setActiveMixerPresetId(id);
          localStorage.setItem(ACTIVE_MIXER_KEY, id);
          
          handleVolumeChange('bass', v.bass);
          handleVolumeChange('melody', v.melody);
          handleVolumeChange('accompaniment', v.accompaniment);
          handleVolumeChange('harmony', v.harmony);
          handleVolumeChange('pianoAccompaniment', v.pianoAccompaniment);
          handleVolumeChange('drums', v.drums);
          handleVolumeChange('sparkles', v.sparkles);
          handleVolumeChange('sfx', v.sfx);
          setCalibrationGain('master', v.master);

          toast({ title: "Mixer Preset Loaded", description: preset.name });
      }
  };

  const deleteMixerPreset = (id: string) => {
      const updated = mixerPresets.filter(p => p.id !== id);
      setMixerPresets(updated);
      if (activeMixerPresetId === id) {
          setActiveMixerPresetId(null);
          localStorage.removeItem(ACTIVE_MIXER_KEY);
      }
      localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(updated));
  };

  // --- Route Handlers ---

  const addToRoute = (genre: Genre | 'random', mood: Mood | 'random') => {
    const newItem: RouteItem = {
      id: `route-${Date.now()}`,
      genre,
      mood,
      status: 'pending'
    };
    const nextRoute = [...route, newItem];
    setRoute(nextRoute);
    localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(nextRoute));
    toast({ title: "Added to Path", description: `${genre.toUpperCase()} / ${mood.toUpperCase()}` });
  };

  const removeFromRoute = (id: string) => {
    const nextRoute = route.filter(item => item.id !== id);
    setRoute(nextRoute);
    localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(nextRoute));
  };

  const moveRouteItem = (id: string, direction: 'up' | 'down') => {
    const index = route.findIndex(item => item.id === id);
    if (index === -1) return;
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= route.length) return;
    const nextRoute = [...route];
    [nextRoute[index], nextRoute[nextIndex]] = [nextRoute[nextIndex], nextRoute[index]];
    setRoute(nextRoute);
    localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(nextRoute));
  };

  const reorderRoute = (activeId: string, overId: string) => {
    const oldIndex = route.findIndex(item => item.id === activeId);
    const newIndex = route.findIndex(item => item.id === overId);
    if (oldIndex !== -1 && newIndex !== -1) {
      const nextRoute = arrayMove(route, oldIndex, newIndex);
      
      // #ЗАЧЕМ: ПЛАН №2230. Сохранение активного индекса при перемещении элемента.
      if (activeRouteIndex !== -1) {
          const currentId = route[activeRouteIndex].id;
          const newActiveIndex = nextRoute.findIndex(item => item.id === currentId);
          setActiveRouteIndex(newActiveIndex);
      }
      
      setRoute(nextRoute);
      localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(nextRoute));
    }
  };

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
  }, []);

  const loadRoute = (saved: SavedRoute) => {
      const items: RouteItem[] = saved.items.map((it, idx) => ({
          id: `route-${Date.now()}-${idx}`,
          genre: it.genre,
          mood: it.mood,
          status: 'pending'
      }));
      setRoute(items);
      setActiveRouteIndex(0);
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
      if (isShuffle) {
          if (route.length > 1) {
              let newIdx;
              do {
                  newIdx = Math.floor(Math.random() * route.length);
              } while (newIdx === activeRouteIndex);
              nextIndex = newIdx;
          } else {
              nextIndex = 0;
          }
      } else {
          nextIndex = (activeRouteIndex + 1) % route.length;
      }

      stopAllSounds();

      setActiveRouteIndex(nextIndex);
      applyRouteItem(route[nextIndex]);
      
      toast({
          title: "Navigator: Next Station",
          description: `Moving to ${route[nextIndex].genre.toUpperCase()} / ${route[nextIndex].mood.toUpperCase()}`
      });
  }, [activeRouteIndex, route, isShuffle, applyRouteItem, stopAllSounds, toast]);

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
            if (currentBarNum === 0 && lastBarCountRef.current > 0 && isPlaying && activeRouteIndex >= 0 && route.length > 0 && options.isNavigatorMode) {
                handleRouteTransition();
            }
            lastBarCountRef.current = currentBarNum;
        }
    };
    worker.addEventListener('message', handleMessage);
    return () => worker.removeEventListener('message', handleMessage);
  }, [isPlaying, activeRouteIndex, route.length, getWorker, handleRouteTransition, options.isNavigatorMode]);

  const applyAutoMix = useCallback(() => {
      if (!isInitialized || activeMixerPresetId) return;
      
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
      if (finalMix.drums !== undefined) { 
          setVolume('drums', finalMix.drums); 
          setDrumSettings(prev => ({ ...prev, volume: finalMix.drums! })); 
      }
      if (finalMix.sparkles !== undefined) { 
          setVolume('sparkles', textureSettings.sparkles.enabled ? finalMix.sparkles : 0); 
          setTextureSettings(prev => ({ ...prev, sparkles: { ...prev.sparkles, volume: finalMix.sparkles! } })); 
      }
      if (finalMix.sfx !== undefined) { 
          setVolume('sfx', textureSettings.sfx.enabled ? finalMix.sfx : 0); 
          setTextureSettings(prev => ({ ...prev, sfx: { ...prev.sfx, volume: finalMix.sfx! } })); 
      }
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

  const handleSaveMasterpieceCallback = useCallback(() => {
    if (!isInitialized || !isPlaying) return;
    saveMasterpiece(db, {
      seed: currentSeed, mood, genre, density, bpm,
      instrumentSettings: instrumentSettings
    });
  }, [isInitialized, isPlaying, db, currentSeed, mood, genre, density, bpm, instrumentSettings]);

  return {
    isInitializing, isPlaying, isRegenerating, isRecording, isBroadcastActive, isWarmingUp, warmUpTimeLeft,
    loadingText: isInitializing ? 'Initializing...' : 'Ready',
    availableCompositions, selectedCompositionIds, 
    toggleCompositionFilter: (id) => setSelectedCompositionIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]),
    clearCompositionFilters: () => setSelectedCompositionIds([]), refreshCloudAxioms,
    handlePlayPause: async () => {
        if (!isInitialized) return;
        if (!isPlaying) {
            if (options.isNavigatorMode && route.length > 0 && activeRouteIndex === -1) {
                setActiveRouteIndex(0);
                applyRouteItem(route[0]);
            }
            lastBarCountRef.current = -1;
            setEngineIsPlaying(true);
        } else { 
            setEngineIsPlaying(false); 
            stopAllSounds();
        }
    },
    handleRegenerate: () => { 
        setIsRegenerating(true);
        stopAllSounds();
        
        if (options.isNavigatorMode && activeRouteIndex >= 0 && route[activeRouteIndex]) {
            const item = route[activeRouteIndex];
            const g = item.genre === 'random' ? (['ambient', 'psybient', 'blues', 'reggae'] as Genre[])[Math.floor(Math.random() * 4)] : item.genre;
            const m = item.mood === 'random' ? (['melancholic', 'dreamy', 'joyful', 'calm'] as Mood[])[Math.floor(Math.random() * 4)] : item.mood;
            
            updateSettings({ genre: g, mood: m, seed: Date.now() });
            setGenreState(g);
            setMoodState(m);
            setCurrentSeed(Date.now());
        } else {
            setCurrentSeed(Date.now());
        }

        resetWorker();
        lastBarCountRef.current = -1; 
        setTimeout(() => {
            setIsRegenerating(false);
            if (isPlaying) {
                setEngineIsPlaying(false);
                setTimeout(() => setEngineIsPlaying(true), 150);
            }
        }, 400);
        toast({ title: "System Rebirth" });
    },
    handleUpdatePath: () => {
        if (route.length === 0) return;
        stopAllSounds();
        const nextIndex = 0;
        setActiveRouteIndex(nextIndex);
        const item = route[nextIndex];
        
        const g = item.genre === 'random' ? (['ambient', 'psybient', 'blues', 'reggae'] as Genre[])[Math.floor(Math.random() * 4)] : item.genre;
        const m = item.mood === 'random' ? (['melancholic', 'dreamy', 'joyful', 'calm'] as Mood[])[Math.floor(Math.random() * 4)] : item.mood;
        
        updateSettings({ genre: g, mood: m, seed: Date.now() });
        setGenreState(g);
        setMoodState(m);
        setCurrentSeed(Date.now());
        
        resetWorker();
        if (isPlaying) {
            setEngineIsPlaying(false);
            setTimeout(() => setEngineIsPlaying(true), 150);
        }
        toast({ title: "Path Updated", description: "Returning to start of route with fresh DNA." });
    },
    handleJumpToRoute: (index: number) => {
        if (index < 0 || index >= route.length) return;
        stopAllSounds();
        const item = route[index];
        setActiveRouteIndex(index);
        
        const g = item.genre === 'random' ? (['ambient', 'psybient', 'blues', 'reggae'] as Genre[])[Math.floor(Math.random() * 4)] : item.genre;
        const m = item.mood === 'random' ? (['melancholic', 'dreamy', 'joyful', 'calm'] as Mood[])[Math.floor(Math.random() * 4)] : item.mood;
        
        updateSettings({ genre: g, mood: m, seed: Date.now() });
        setGenreState(g);
        setMoodState(m);
        setCurrentSeed(Date.now());
        
        resetWorker();
        if (isPlaying) {
            setEngineIsPlaying(false);
            setTimeout(() => setEngineIsPlaying(true), 150);
        }
        toast({ title: "Jumping Route", description: `${g.toUpperCase()} / ${m.toUpperCase()}` });
    },
    handleToggleRecording: () => isRecording ? stopRecording() : startRecording(),
    handleToggleBroadcast: () => {
        if (!isBroadcastActive && !isPlaying) {
            setIsWarmingUp(true); setWarmUpTimeLeft(5);
            const tid = setInterval(() => setWarmUpTimeLeft(p => { if(p<=1){clearInterval(tid); setIsWarmingUp(false); return 0;} return p-1; }), 1000);
        }
        toggleBroadcast();
    },
    handleSaveMasterpiece: handleSaveMasterpieceCallback,
    drumSettings, setDrumSettings, instrumentSettings, setInstrumentSettings: (part, name) => { setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], name } })); setInstrument(part as any, name as any); },
    handleBassTechniqueChange: () => {}, handleVolumeChange, textureSettings, 
    handleTextureEnabledChange: (part, enabled) => setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part], enabled }})),
    bpm, handleBpmChange: setBpm, score, handleScoreChange: setScore, density, setDensity,
    composerControlsInstruments, setComposerControlsInstruments,
    useHeritage, setUseHeritage,
    handleGoHome: () => { 
        setEngineIsPlaying(false); 
        stopAllSounds(); 
        window.location.href = '/'; 
    },
    isEqModalOpen, setIsEqModalOpen, eqSettings, 
    handleEqChange: (index: number, value: number) => { const next = [...eqSettings]; next[index] = value; setEqSettings(next); setEQGain(index, value); },
    isCalibrationModalOpen, setIsCalibrationModalOpen, calibrationGains, handleCalibrationChange: setCalibrationGain,
    timerSettings, handleTimerDurationChange: (m) => setTimerSettings(p => ({ ...p, duration: m*60, timeLeft: m*60 })),
    handleToggleTimer: () => setTimerSettings(p => ({ ...p, isActive: !p.isActive, timeLeft: p.duration })),
    mood, setMood: setMoodState, genre, setGenre: setGenreState, introBars, setIntroBars,
    route, addToRoute, removeFromRoute, moveRouteItem, reorderRoute, saveRoute, loadRoute, deleteSavedRoute, savedRoutes,
    isShuffle, setShuffle, isRepeat, setRepeat, activeRouteIndex,
    showAdvancedUI, setShowAdvancedUI,
    currentBar, totalBars,
    voiceLimit, activeVoiceCount, setVoiceLimit,
    eqPresets, activeEqPresetId, saveEqPreset, updateEqPreset, loadEqPreset, deleteEqPreset,
    mixerPresets, activeMixerPresetId, saveMixerPreset, updateMixerPreset, loadMixerPreset, deleteMixerPreset
  };
};
