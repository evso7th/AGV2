
/**
 * @fileOverview Хук управления музыкой V10.5 — "Infinite Loop Mitigation".
 * #ЗАЧЕМ: Устранение ошибки рекурсивного рендеринга и исправление импортов.
 * #ЧТО: ПЛАН №92 — Тотальный useCallback и исправление typo в dnd-kit.
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
  const [eqSettings, setEqSettings] = useState<number[]>(new Array(7).fill(0));
  const [selectedCompositionIds, setSelectedCompositionIds] = useState<string[]>([]);
  const [route, setRoute] = useState<RouteItem[]>([]);
  const [activeRouteItemId, setActiveRouteItemId] = useState<string | null>(null);
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

  const activeRouteIndex = useMemo(() => route.findIndex(it => it.id === activeRouteItemId), [route, activeRouteItemId]);

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
              setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part], volume: vol } }));
          }
      });
      if (finalMix.drums !== undefined) { setVolume('drums', finalMix.drums); setDrumSettings(prev => ({ ...prev, volume: finalMix.drums! })); }
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

  const handleVolumeChange = useCallback((part: any, value: number) => {
    setVolume(part, value);
    if (part in instrumentSettings) { 
        setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], volume: value } })); 
    }
    else if (part === 'drums') { setDrumSettings(prev => ({ ...prev, volume: value })); }
    else if (part === 'sparkles' || part === 'sfx') { setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part as 'sparkles' | 'sfx'], volume: value } })); }
  }, [setVolume, instrumentSettings]);

  return {
    isInitializing, isPlaying, isRegenerating, isRecording, isBroadcastActive, isWarmingUp, warmUpTimeLeft,
    loadingText: isInitializing ? 'Initializing...' : 'Ready',
    availableCompositions, selectedCompositionIds, 
    toggleCompositionFilter: useCallback((id) => setSelectedCompositionIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]), []),
    clearCompositionFilters: useCallback(() => setSelectedCompositionIds([]), []), refreshCloudAxioms,
    handlePlayPause: useCallback(() => { if (!isInitialized) return; setIsPlaying(!isPlaying); }, [isInitialized, isPlaying, setIsPlaying]),
    handleRegenerate: useCallback(() => { setIsRegenerating(true); setCurrentSeed(Date.now()); setTimeout(() => setIsRegenerating(false), 500); }, []),
    handleToggleRecording: useCallback(() => isRecording ? stopRecording() : startRecording(), [isRecording, stopRecording, startRecording]),
    handleToggleBroadcast: useCallback(() => toggleBroadcast(), [toggleBroadcast]),
    handleSaveMasterpiece: useCallback(() => {}, []),
    drumSettings, setDrumSettings, instrumentSettings, setInstrumentSettings: useCallback((part, name) => { setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], name } })); setInstrument(part as any, name as any); }, [setInstrument]),
    handleBassTechniqueChange: useCallback(() => {}, []), handleVolumeChange, textureSettings, 
    handleTextureEnabledChange: useCallback((part, enabled) => setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part], enabled }})), []),
    bpm, handleBpmChange: setBpm, score, handleScoreChange: setScore, density, setDensity,
    composerControlsInstruments, setComposerControlsInstruments,
    useHeritage, setUseHeritage,
    handleGoHome: useCallback(() => { setIsPlaying(false); stopAllSounds(); router.push('/'); }, [setIsPlaying, stopAllSounds, router]),
    isEqModalOpen: false, setIsEqModalOpen: () => {}, eqSettings, 
    handleEqChange: useCallback((idx: number, val: number) => { const n = [...eqSettings]; n[idx] = val; setEqSettings(n); setEQGain(idx, val); }, [eqSettings, setEQGain]),
    isCalibrationModalOpen: false, setIsCalibrationModalOpen: () => {}, calibrationGains, handleCalibrationChange: setCalibrationGain,
    timerSettings, handleTimerDurationChange: useCallback((m) => setTimerSettings(p => ({ ...p, duration: m*60, timeLeft: m*60 })), []),
    handleToggleTimer: useCallback(() => setTimerSettings(p => ({ ...p, isActive: !p.isActive, timeLeft: p.duration })), []),
    mood, setMood: setMoodState, genre, setGenre: setGenreState, introBars, setIntroBars,
    voiceLimit, setVoiceLimit,
    route, addToRoute: useCallback((g, m) => setRoute(prev => [...prev, { id: `route-${Date.now()}`, genre: g, mood: m, status: 'pending' }]), []), removeFromRoute: useCallback((id) => setRoute(prev => prev.filter(it => it.id !== id)), []), selectRouteItem: useCallback((id) => { const item = route.find(it => it.id === id); if (item) setActiveRouteItemId(id); }, [route]), refreshRoute: useCallback(() => refreshCloudAxioms(), [refreshCloudAxioms]), moveRouteItem: useCallback(() => {}, []), reorderRoute: useCallback((a, o) => setRoute(p => arrayMove(p, p.findIndex(i => i.id === a), p.findIndex(i => i.id === o))), []), saveRoute: useCallback((name) => { const n = { id: `r-${Date.now()}`, userId: 'l', name, items: route.map(i => ({ genre: i.genre, mood: i.mood })), createdAt: new Date().toISOString() }; const u = [n, ...savedRoutes]; setSavedRoutes(u); localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(u)); }, [route, savedRoutes]), loadRoute: useCallback((s) => { const i = s.items.map((it, idx) => ({ id: `r-${idx}-${Date.now()}`, genre: it.genre, mood: it.mood, status: 'pending' as const })); setRoute(i); if (i.length > 0) setActiveRouteItemId(i[0].id); }, []), deleteSavedRoute: useCallback((id) => setSavedRoutes(p => p.filter(r => r.id !== id)), []), savedRoutes,
    isShuffle, setShuffle, isRepeat, setRepeat, activeRouteIndex,
    showAdvancedUI, setShowAdvancedUI,
    currentBar, totalBars,
    eqPresets, activeEqPresetId, saveEqPreset: useCallback((name) => { const n = { id: `eq-${Date.now()}`, name, values: [...eqSettings] }; const u = [...eqPresets, n]; setEqPresets(u); localStorage.setItem(EQ_PRESETS_KEY, JSON.stringify(u)); }, [eqSettings, eqPresets]), updateActiveEqPreset: useCallback(() => { if (!activeEqPresetId) return; const u = eqPresets.map(p => p.id === activeEqPresetId ? { ...p, values: [...eqSettings] } : p); setEqPresets(u); localStorage.setItem(EQ_PRESETS_KEY, JSON.stringify(u)); }, [activeEqPresetId, eqSettings, eqPresets]), loadEqPreset, deleteEqPreset: useCallback((id) => setEqPresets(prev => prev.filter(p => p.id !== id)), []),
    mixerPresets, activeMixerPresetId, saveMixerPreset: useCallback((name) => { const v = { bass: instrumentSettings.bass.volume, melody: instrumentSettings.melody.volume, accompaniment: instrumentSettings.accompaniment.volume, harmony: instrumentSettings.harmony.volume, pianoAccompaniment: instrumentSettings.pianoAccompaniment.volume, drums: drumSettings.volume, sparkles: textureSettings.sparkles.volume, sfx: textureSettings.sfx.volume, master: calibrationGains.master }; const n = { id: `mix-${Date.now()}`, name, values: v }; const u = [...mixerPresets, n]; setMixerPresets(u); localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(u)); }, [instrumentSettings, drumSettings, textureSettings, calibrationGains, mixerPresets]), updateActiveMixerPreset: useCallback(() => { if (!activeMixerPresetId) return; const v = { bass: instrumentSettings.bass.volume, melody: instrumentSettings.melody.volume, accompaniment: instrumentSettings.accompaniment.volume, harmony: instrumentSettings.harmony.volume, pianoAccompaniment: instrumentSettings.pianoAccompaniment.volume, drums: drumSettings.volume, sparkles: textureSettings.sparkles.volume, sfx: textureSettings.sfx.volume, master: calibrationGains.master }; const u = mixerPresets.map(p => p.id === activeMixerPresetId ? { ...p, values: v } : p); setMixerPresets(u); localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(u)); }, [activeMixerPresetId, instrumentSettings, drumSettings, textureSettings, calibrationGains, mixerPresets]), loadMixerPreset, deleteMixerPreset: useCallback((id) => setMixerPresets(prev => prev.filter(p => p.id !== id)), []),
    resetMixerToSystem: useCallback(() => { setActiveMixerPresetId(null); localStorage.removeItem(ACTIVE_MIXER_ID_KEY); applyAutoMix(); }, [applyAutoMix])
  };
};
