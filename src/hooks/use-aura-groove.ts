
/**
 * @fileOverview Music Control Hook V13.5 — "Eternal Journey Protocol".
 * #ЗАЧЕМ: Реализация бесконечного автономного воспроизведения.
 * #ЧТО: ПЛАН №107.1 — Repeat ON по умолчанию, исправлено зацикливание маршрута.
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
import { useFirestore } from "@/firebase/provider";
import { saveMasterpiece } from "@/lib/firebase-service";

const SAVED_JOURNEYS_KEY = 'AuraGroove_SavedJourneys';
const CURRENT_ROUTE_KEY = 'AuraGroove_CurrentRoute';
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
  setIsPlaying: (playing: boolean) => void;
  stopAllSounds: () => void;
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
  route: RouteItem[];
  addToRoute: (genre: Genre | 'random', mood: Mood | 'random') => void;
  removeFromRoute: (id: string) => void;
  selectRouteItem: (id: string) => void; 
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
  currentTrackName: string;
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
  const router = useRouter();
  const { 
    isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, availableCompositions, initialize, 
    setIsPlaying, updateSettings, refreshCloudAxioms, setVolume, setInstrument, stopAllSounds,
    setTextureSettings: setEngineTextureSettings, toggleBroadcast, startRecording, stopRecording,
    setEQGain, setCalibrationGain, calibrationGains, voiceLimit, setVoiceLimit, currentBar, totalBars, currentTrackName
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
  const [eqSettings, setEqSettings] = useState<number[]>(new Array(7).fill(0));
  const [selectedCompositionIds, setSelectedCompositionIds] = useState<string[]>([]);
  const [route, setRoute] = useState<RouteItem[]>([]);
  const [activeRouteItemId, setActiveRouteItemId] = useState<string | null>(null);
  const [isShuffle, setShuffle] = useState(false);
  // #ЗАЧЕМ: Repeat ON по умолчанию (ПЛАН №107.1).
  const [isRepeat, setRepeat] = useState(true);
  const [showAdvancedUI, setShowAdvancedUI] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [eqPresets, setEqPresets] = useState<PresetItem[]>([]);
  const [activeEqPresetId, setActiveEqPresetId] = useState<string | null>(null);
  const [mixerPresets, setMixerPresets] = useState<PresetItem[]>([]);
  const [activeMixerPresetId, setActiveMixerPresetId] = useState<string | null>(null);

  const activeRouteIndex = useMemo(() => route.findIndex(it => it.id === activeRouteItemId), [route, activeRouteItemId]);
  const prevBarRef = useRef(0);

  // --- 1. MEDIA SESSION INTEGRATION (PLAN №103) ---
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const updateMetadata = () => {
        const fullArtworkUrl = `${window.location.origin}/assets/cover.jpg?v=${currentSeed}`;
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'AuraGroove',
            artist: `${genre.toUpperCase()} / ${mood.toUpperCase()}`,
            album: currentTrackName || 'Generative Suite',
            artwork: [
                { src: fullArtworkUrl, sizes: '96x96', type: 'image/jpeg' },
                { src: fullArtworkUrl, sizes: '128x128', type: 'image/jpeg' },
                { src: fullArtworkUrl, sizes: '192x192', type: 'image/jpeg' },
                { src: fullArtworkUrl, sizes: '256x256', type: 'image/jpeg' },
                { src: fullArtworkUrl, sizes: '384x384', type: 'image/jpeg' },
                { src: fullArtworkUrl, sizes: '512x512', type: 'image/jpeg' },
            ]
        });
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        
        try {
            (navigator.mediaSession as any).setPositionState({
                duration: 3600,
                playbackRate: 1.0,
                position: currentBar * (60/bpm * 4)
            });
        } catch(e) {}
    };

    updateMetadata();

    const heartbeat = setInterval(updateMetadata, 2000);

    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
    navigator.mediaSession.setActionHandler('stop', () => { setIsPlaying(false); stopAllSounds(); });
    navigator.mediaSession.setActionHandler('nexttrack', () => { setIsRegenerating(true); setCurrentSeed(Date.now()); setTimeout(() => setIsRegenerating(false), 500); });

    return () => {
        clearInterval(heartbeat);
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
    };
  }, [isPlaying, currentTrackName, genre, mood, currentSeed, currentBar, bpm, setIsPlaying, stopAllSounds]);

  // --- 2. SYNC ROUTE ITEM TO ENGINE STATE ---
  useEffect(() => {
    if (activeRouteItemId) {
        const activeItem = route.find(it => it.id === activeRouteItemId);
        if (activeItem && activeItem.genre !== 'random' && activeItem.mood !== 'random') {
            setGenreState(activeItem.genre as Genre);
            setMoodState(activeItem.mood as Mood);
        }
    }
  }, [activeRouteItemId, route]);

  // --- 3. JOURNEY AUTO-PROGRESSION (FIXED - PLAN №107.1) ---
  useEffect(() => {
    if (isPlaying && currentBar === 0 && prevBarRef.current > 0 && route.length > 0) {
        const nextIndex = activeRouteIndex + 1;
        
        if (nextIndex < route.length) {
            setActiveRouteItemId(route[nextIndex].id);
            toast({ title: "Next Chapter", description: `Transitioning to ${route[nextIndex].genre} / ${route[nextIndex].mood}` });
        } else if (isRepeat) {
            // #ЗАЧЕМ: Бесшовный цикл. Если маршрут закончился — возвращаемся в начало.
            setActiveRouteItemId(route[0].id);
            toast({ title: "Journey Loop", description: "Returning to the start of the path." });
        } else {
            // Если повтор выключен вручную — переходим в свободный режим.
            setActiveRouteItemId(null);
            toast({ title: "Journey Complete", description: "Transitioning to Free Flow mode." });
        }
    }
    prevBarRef.current = currentBar;
  }, [currentBar, isPlaying, route, activeRouteIndex, isRepeat, setIsPlaying, toast]);

  const loadEqPreset = useCallback((id: string) => {
      const preset = eqPresets.find(p => p.id === id);
      if (preset) {
          setEqSettings(preset.values);
          preset.values.forEach((val: number, idx: number) => setEQGain(idx, val));
          setActiveEqPresetId(id);
          localStorage.setItem(ACTIVE_EQ_ID_KEY, id);
      }
  }, [eqPresets, setEQGain]);

  const loadMixerPreset = useCallback((id: string) => {
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
      }
  }, [mixerPresets, setVolume, setCalibrationGain]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sJ = localStorage.getItem(SAVED_JOURNEYS_KEY);
    if (sJ) { try { setSavedRoutes(JSON.parse(sJ)); } catch (e) {} }
    const lR = localStorage.getItem(CURRENT_ROUTE_KEY);
    if (lR) { try { setRoute(JSON.parse(lR)); } catch (e) {} }
    const sE = localStorage.getItem(EQ_PRESETS_KEY);
    if (sE) { try { setEqPresets(JSON.parse(sE)); } catch (e) {} }
    const sM = localStorage.getItem(MIXER_PRESETS_KEY);
    if (sM) { try { setMixerPresets(JSON.parse(sM)); } catch (e) {} }
    const aM = localStorage.getItem(ACTIVE_MIXER_ID_KEY);
    if (aM) setActiveMixerPresetId(aM);
    const aE = localStorage.getItem(ACTIVE_EQ_ID_KEY);
    if (aE) setActiveEqPresetId(aE);
  }, []);

  const applyAutoMix = useCallback(() => {
      if (!isInitialized || activeMixerPresetId) return;
      const finalMix = GENRE_MASTER_MIX[genre]; 
      if (!finalMix) return;
      const parts: (keyof InstrumentSettings)[] = ['bass', 'melody', 'accompaniment', 'harmony', 'pianoAccompaniment'];
      parts.forEach(part => {
          const vol = finalMix[part];
          if (vol !== undefined) {
              setVolume(part, vol);
              setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], volume: vol } }));
          }
      });
      if (finalMix.drums !== undefined) { 
        setVolume('drums', finalMix.drums); 
        setDrumSettings(prev => ({ ...prev, volume: finalMix.drums! })); 
      }
  }, [isInitialized, genre, setVolume, activeMixerPresetId]);

  useEffect(() => { applyAutoMix(); }, [genre, isInitialized, applyAutoMix]);

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

  const handlePlayPause = useCallback(async () => { 
    if (!isInitialized) {
        const success = await initialize();
        if (success) {
            if (route.length > 0 && !activeRouteItemId) setActiveRouteItemId(route[0].id);
            setIsPlaying(true);
        }
    } else {
        setIsPlaying(!isPlaying);
    }
  }, [isInitialized, isPlaying, initialize, setIsPlaying, route, activeRouteItemId]);

  const resetMixerToSystem = useCallback(() => {
      setActiveMixerPresetId(null);
      localStorage.removeItem(ACTIVE_MIXER_ID_KEY);
      setCalibrationGain('master', 1.0);
  }, [setCalibrationGain]);

  const loadRoute = useCallback((s: SavedRoute) => { 
      const i = s.items.map((it, idx) => ({ id: `r-${idx}-${Date.now()}`, genre: it.genre as Genre, mood: it.mood as Mood, status: 'pending' as const })); 
      setRoute(i); 
      if (i.length > 0) setActiveRouteItemId(i[0].id); 
      localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(i));
  }, []);

  const saveRoute = useCallback((name: string) => { 
      const n = { id: `r-${Date.now()}`, userId: 'l', name, items: route.map(i => ({ genre: i.genre, mood: i.mood })), createdAt: new Date().toISOString() }; 
      const u = [n, ...savedRoutes]; 
      setSavedRoutes(u); 
      localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(u)); 
  }, [route, savedRoutes]);

  const deleteSavedRoute = useCallback((id: string) => {
      const u = savedRoutes.filter(r => r.id !== id);
      setSavedRoutes(u);
      localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(u));
  }, [savedRoutes]);

  const handleSaveMasterpieceCallback = useCallback(() => {
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

  return {
    isInitializing, isPlaying, isRegenerating, isRecording, isBroadcastActive, isWarmingUp: false, warmUpTimeLeft: 0,
    loadingText: isInitializing ? 'Igniting Engine...' : 'Ready',
    availableCompositions, selectedCompositionIds, 
    toggleCompositionFilter: useCallback((id) => setSelectedCompositionIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]), []),
    clearCompositionFilters: useCallback(() => setSelectedCompositionIds([]), []), refreshCloudAxioms,
    handlePlayPause,
    handleRegenerate: useCallback(() => { setIsRegenerating(true); setCurrentSeed(Date.now()); setTimeout(() => setIsRegenerating(false), 500); }, []),
    handleToggleRecording: useCallback(() => isRecording ? stopRecording() : startRecording(), [isRecording, stopRecording, startRecording]),
    handleToggleBroadcast: useCallback(() => toggleBroadcast(), [toggleBroadcast]),
    handleSaveMasterpiece: handleSaveMasterpieceCallback,
    drumSettings, setDrumSettings, 
    instrumentSettings, 
    setInstrumentSettings: useCallback((part, name) => { setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], name } })); setInstrument(part as any, name as any); }, [setInstrument]),
    handleBassTechniqueChange: useCallback(() => {}, []), 
    handleVolumeChange: useCallback((part: any, value: number) => {
        setVolume(part, value);
        if (part in instrumentSettings) { 
            setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], volume: value } })); 
        } else if (part === 'drums') { 
            setDrumSettings(prev => ({ ...prev, volume: value })); 
        } else if (part === 'sparkles' || part === 'sfx') { 
            setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part as 'sparkles' | 'sfx'], volume: value } })); 
        }
    }, [setVolume, instrumentSettings]),
    textureSettings, 
    handleTextureEnabledChange: useCallback((part, enabled) => setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part], enabled }})), []),
    bpm, handleBpmChange: setBpm, score, handleScoreChange: setScore, density, setDensity,
    composerControlsInstruments, setComposerControlsInstruments,
    useHeritage, setUseHeritage,
    setIsPlaying,
    stopAllSounds,
    handleGoHome: useCallback(async () => { 
        if (isPlaying) {
            await setIsPlaying(false); 
        }
        stopAllSounds(); 
        router.push('/'); 
    }, [isPlaying, setIsPlaying, stopAllSounds, router]),
    isEqModalOpen: false, setIsEqModalOpen: () => {}, eqSettings, 
    handleEqChange: useCallback((idx: number, val: number) => { const n = [...eqSettings]; n[idx] = val; setEqSettings(n); setEQGain(idx, val); }, [eqSettings, setEQGain]),
    isCalibrationModalOpen: false, setIsCalibrationModalOpen: () => {}, calibrationGains, handleCalibrationChange: setCalibrationGain,
    timerSettings, handleTimerDurationChange: useCallback((m) => setTimerSettings(p => ({ ...p, duration: m*60, timeLeft: m*60 })), []),
    handleToggleTimer: useCallback(() => setTimerSettings(p => ({ ...p, isActive: !p.isActive, timeLeft: p.duration })), []),
    mood, setMood: setMoodState, genre, setGenre: setGenreState, introBars, setIntroBars,
    voiceLimit, setVoiceLimit,
    route, 
    addToRoute: useCallback((g, m) => {
        const id = `route-${Date.now()}`;
        setRoute(prev => {
            const next = [...prev, { id, genre: g, mood: m, status: 'pending' as const }];
            localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(next));
            return next;
        });
    }, []), 
    removeFromRoute: useCallback((id) => setRoute(prev => {
        const next = prev.filter(it => it.id !== id);
        localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(next));
        return next;
    }), []), 
    selectRouteItem: useCallback((id) => { const item = route.find(it => it.id === id); if (item) setActiveRouteItemId(id); }, [route]), 
    refreshRoute: useCallback(() => refreshCloudAxioms(), [refreshCloudAxioms]), 
    moveRouteItem: useCallback(() => {}, []), 
    reorderRoute: useCallback((a, o) => setRoute(p => {
        const next = arrayMove(p, p.findIndex(i => i.id === a), p.findIndex(i => i.id === o));
        localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(next));
        return next;
    }), []), 
    saveRoute, loadRoute, deleteSavedRoute,
    savedRoutes,
    isShuffle, setShuffle, isRepeat, setRepeat, activeRouteIndex,
    showAdvancedUI, setShowAdvancedUI,
    currentBar, totalBars, currentTrackName,
    eqPresets, activeEqPresetId, 
    saveEqPreset: useCallback((name) => { 
        const n = { id: `eq-${Date.now()}`, name, values: [...eqSettings] }; 
        const u = [...eqPresets, n]; 
        setEqPresets(u); 
        localStorage.setItem(EQ_PRESETS_KEY, JSON.stringify(u)); 
    }, [eqSettings, eqPresets]), 
    updateActiveEqPreset: useCallback(() => { 
        if (!activeEqPresetId) return; 
        const u = eqPresets.map(p => p.id === activeEqPresetId ? { ...p, values: [...eqSettings] } : p); 
        setEqPresets(u); 
        localStorage.setItem(EQ_PRESETS_KEY, JSON.stringify(u)); 
    }, [activeEqPresetId, eqSettings, eqPresets]), 
    loadEqPreset, 
    deleteEqPreset: useCallback((id) => setEqPresets(prev => prev.filter(p => p.id !== id)), []),
    mixerPresets, activeMixerPresetId, 
    saveMixerPreset: useCallback((name) => { 
        const v = { 
            bass: instrumentSettings.bass.volume, melody: instrumentSettings.melody.volume, 
            accompaniment: instrumentSettings.accompaniment.volume, harmony: instrumentSettings.harmony.volume, 
            pianoAccompaniment: instrumentSettings.pianoAccompaniment.volume, drums: drumSettings.volume, 
            sparkles: textureSettings.sparkles.volume, sfx: textureSettings.sfx.volume, master: calibrationGains.master 
        }; 
        const n = { id: `mix-${Date.now()}`, name, values: v }; 
        const u = [...mixerPresets, n]; 
        setMixerPresets(u); 
        localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(u)); 
    }, [instrumentSettings, drumSettings, textureSettings, calibrationGains, mixerPresets]), 
    updateActiveMixerPreset: useCallback(() => { 
        if (!activeMixerPresetId) return; 
        const v = { 
            bass: instrumentSettings.bass.volume, melody: instrumentSettings.melody.volume, 
            accompaniment: instrumentSettings.accompaniment.volume, harmony: instrumentSettings.harmony.volume, 
            pianoAccompaniment: instrumentSettings.pianoAccompaniment.volume, drums: drumSettings.volume, 
            sparkles: textureSettings.sparkles.volume, sfx: textureSettings.sfx.volume, master: calibrationGains.master 
        }; 
        const u = mixerPresets.map(p => p.id === activeMixerPresetId ? { ...p, values: v } : p); 
        setMixerPresets(u); 
        localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(u)); 
    }, [activeMixerPresetId, instrumentSettings, drumSettings, textureSettings, calibrationGains, mixerPresets]), 
    loadMixerPreset, 
    deleteMixerPreset: useCallback((id) => setMixerPresets(prev => prev.filter(p => p.id !== id)), []),
    resetMixerToSystem
  };
};
