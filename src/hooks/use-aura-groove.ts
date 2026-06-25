/**
 * @fileOverview Music Control Hook V28.0 — "Localization Engine".
 * #ЗАЧЕМ: Внедрение мультиязычности и авто-детекции локали.
 */
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { 
    DrumSettings, InstrumentSettings, ScoreName, WorkerSettings, 
    InstrumentPart, BassTechnique, TextureSettings, TimerSettings, 
    Mood, Genre, RouteItem, SavedRoute
} from '@/types/music';
import { useAudioEngine } from "@/contexts/audio-engine-context";
import { GENRE_MASTER_MIX } from "@/lib/master-mix";
import { useToast } from "./use-toast";
import { arrayMove } from "@dnd-kit/sortable";
import { useFirestore } from "@/firebase/provider";
import { TRANSLATIONS, type Language } from "@/lib/translations";

const SAVED_JOURNEYS_KEY = 'AuraGroove_SavedJourneys';
const CURRENT_ROUTE_KEY = 'AuraGroove_CurrentRoute';
const EQ_PRESETS_KEY = 'AuraGroove_EQPresets';
const MIXER_PRESETS_KEY = 'AuraGroove_MixerPresets';
const ACTIVE_EQ_ID_KEY = 'AuraGroove_ActiveEqPresetId';
const ACTIVE_MIXER_ID_KEY = 'AuraGroove_ActiveMixerPresetId';
const LAST_MIX_BY_GENRE_KEY = 'AuraGroove_LastMixByGenre';
const LAST_EQ_BY_GENRE_KEY = 'AuraGroove_LastEqByGenre';
const LANG_KEY = 'AuraGroove_Language';

export type PresetItem = { id: string; name: string; values: any; genre?: string };

export interface AuraGrooveProps {
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
  syncDna: () => Promise<void>;
  handlePlayPause: () => void;
  handleRegenerate: () => void;
  handleToggleRecording: () => void;
  handleToggleBroadcast: () => void;
  handleSaveMasterpiece: () => void;
  drumSettings: DrumSettings;
  setDrumSettings: React.Dispatch<React.SetStateAction<DrumSettings>>;
  instrumentSettings: InstrumentSettings;
  setInstrumentSettings: (part: keyof InstrumentSettings, name: any) => void;
  handleBassTechniqueChange: (technique: BassTechnique) => void;
  handleVolumeChange: (part: InstrumentPart | 'sparkles' | 'sfx' | 'drums' | 'master', value: number) => void;
  textureSettings: TextureSettings;
  handleTextureEnabledChange: (part: 'sparkles' | 'sfx', enabled: boolean) => void;
  bpm: number;
  handleBpmChange: (value: number) => void;
  score: ScoreName;
  handleScoreChange: (value: ScoreName) => void;
  density: number;
  setDensity: (value: number) => void;
  composerControlsInstruments: boolean;
  setComposerControlsInstruments: (value: boolean) => void;
  useHeritage: boolean;
  setUseHeritage: (value: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  stopAllSounds: () => void;
  handleGoHome: () => void;
  isEqModalOpen: boolean;
  setIsEqModalOpen: (isOpen: boolean) => void;
  eqSettings: number[];
  handleEqChange: (idx: number, val: number) => void;
  isCalibrationModalOpen: boolean;
  setIsCalibrationModalOpen: (isOpen: boolean) => void;
  calibrationGains: Record<string, number>;
  handleCalibrationChange: (key: string, val: number) => void;
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
  addToRoute: (g: Genre | 'random', m: Mood | 'random') => void;
  removeFromRoute: (id: string) => void;
  selectRouteItem: (id: string) => void;
  refreshRoute: () => void;
  moveRouteItem: (oldIdx: number, newIdx: number) => void;
  reorderRoute: (activeId: string, overId: string) => void;
  saveRoute: (name: string) => void;
  loadRoute: (saved: SavedRoute) => void;
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
  setEqPresetGenre: (id: string, genre: string) => void;
  mixerPresets: PresetItem[];
  activeMixerPresetId: string | null;
  saveMixerPreset: (name: string) => void;
  updateActiveMixerPreset: () => void;
  loadMixerPreset: (id: string) => void;
  deleteMixerPreset: (id: string) => void;
  setMixerPresetGenre: (id: string, genre: string) => void;
  resetMixerToSystem: () => void;
  useMelodyV2: boolean;
  toggleMelodyEngine: (val: boolean) => void;
  language: Language;
  toggleLanguage: () => void;
  t: (key: keyof typeof TRANSLATIONS) => string;
}

export const useAuraGroove = (): AuraGrooveProps => {
  const router = useRouter();
  const { 
    isInitialized, isInitializing, isPlaying, isRecording, isBroadcastActive, availableCompositions, initialize, 
    setIsPlaying, updateSettings, refreshCloudAxioms, syncDna: engineSyncDna, setVolume, setInstrument, stopAllSounds,
    setTextureSettings: setEngineTextureSettings, toggleBroadcast, startRecording, stopRecording,
    setEQGain, setCalibrationGain, calibrationGains, voiceLimit, setVoiceLimit, currentBar, totalBars, currentTrackName,
    resetWorker
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
  const [currentSeed, setCurrentSeed] = useState<number>(0);
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({ duration: 0, timeLeft: 0, isActive: false });
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [eqSettings, setEqSettings] = useState<number[]>(new Array(7).fill(0));
  const [selectedCompositionIds, setSelectedCompositionIds] = useState<string[]>([]);
  const [route, setRoute] = useState<RouteItem[]>([]);
  const [activeRouteItemId, setActiveRouteItemId] = useState<string | null>(null);
  const [isShuffle, setShuffle] = useState(false);
  const [isRepeat, setRepeat] = useState(true);
  const [showAdvancedUI, setShowAdvancedUI] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  
  const [eqPresets, setEqPresets] = useState<PresetItem[]>([]);
  const [activeEqPresetId, setActiveEqPresetId] = useState<string | null>(null);
  const [mixerPresets, setMixerPresets] = useState<PresetItem[]>([]);
  const [activeMixerPresetId, setActiveMixerPresetId] = useState<string | null>(null);

  // --- Localization Logic ---
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(LANG_KEY) as Language;
    if (saved) {
        setLanguage(saved);
    } else {
        const sysLang = navigator.language.toLowerCase();
        // Детекция кириллических локалей (RU, UA, BE, KK)
        const isCyrillic = sysLang.includes('ru') || sysLang.includes('uk') || sysLang.includes('be') || sysLang.includes('kk');
        const detected: Language = isCyrillic ? 'ru' : 'en';
        setLanguage(detected);
        localStorage.setItem(LANG_KEY, detected);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
        const next = prev === 'ru' ? 'en' : 'ru';
        localStorage.setItem(LANG_KEY, next);
        return next;
    });
  }, []);

  const t = useCallback((key: keyof typeof TRANSLATIONS) => {
    return TRANSLATIONS[key][language] || String(key);
  }, [language]);

  const activeRouteIndex = useMemo(() => route.findIndex(it => it.id === activeRouteItemId), [route, activeRouteItemId]);
  const prevBarRef = useRef(0);
  const sessionStartTimeRef = useRef<number>(0);

  const handleGoHome = useCallback(async () => {
    if (isPlaying) await setIsPlaying(false);
    stopAllSounds();
    router.push('/');
    setTimeout(() => {
      if (typeof window !== 'undefined') window.location.reload();
    }, 300);
  }, [isPlaying, setIsPlaying, stopAllSounds, router]);

  const handleVolumeChange = useCallback((part: any, value: number) => {
    setVolume(part, value);
    if (part === 'bass' || part === 'melody' || part === 'accompaniment' || part === 'harmony' || part === 'pianoAccompaniment') {
        setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], volume: value } }));
    } else if (part === 'drums') {
        setDrumSettings(prev => ({ ...prev, volume: value }));
    } else if (part === 'sparkles' || part === 'sfx') {
        setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], volume: value } }));
    }
  }, [setVolume]);

  const handleEqChange = useCallback((idx: number, val: number) => {
    const n = [...eqSettings];
    n[idx] = val;
    setEqSettings(n);
    setEQGain(idx, val);
  }, [eqSettings, setEQGain]);

  const applyCurrentMixToEngine = useCallback(() => {
      setVolume('master', calibrationGains.master);
      setVolume('bass', instrumentSettings.bass.volume);
      setVolume('melody', instrumentSettings.melody.volume);
      setVolume('accompaniment', instrumentSettings.accompaniment.volume);
      setVolume('pianoAccompaniment', instrumentSettings.pianoAccompaniment.volume);
      setVolume('harmony', instrumentSettings.harmony.volume);
      setVolume('sparkles', textureSettings.sparkles.volume);
      setVolume('sfx', textureSettings.sfx.volume);
      setVolume('drums', drumSettings.volume);
  }, [setVolume, instrumentSettings, textureSettings, drumSettings, calibrationGains.master]);

  const loadMixerPreset = useCallback((id: string) => {
    const saved = localStorage.getItem(MIXER_PRESETS_KEY);
    if (!saved) return;
    try {
        const list: PresetItem[] = JSON.parse(saved);
        const target = list.find(p => p.id === id);
        if (target && target.values) {
            const v = target.values;
            if (v.master !== undefined) handleVolumeChange('master', v.master);
            if (v.bass !== undefined) handleVolumeChange('bass', v.bass);
            if (v.melody !== undefined) handleVolumeChange('melody', v.melody);
            if (v.accompaniment !== undefined) handleVolumeChange('accompaniment', v.accompaniment);
            if (v.pianoAccompaniment !== undefined) handleVolumeChange('pianoAccompaniment', v.pianoAccompaniment);
            if (v.harmony !== undefined) handleVolumeChange('harmony', v.harmony);
            if (v.sparkles !== undefined) handleVolumeChange('sparkles', v.sparkles);
            if (v.sfx !== undefined) handleVolumeChange('sfx', v.sfx);
            if (v.drums !== undefined) handleVolumeChange('drums', v.drums);
            setActiveMixerPresetId(id);
            localStorage.setItem(ACTIVE_MIXER_ID_KEY, id);
            if (target.genre) {
                try {
                    const m = JSON.parse(localStorage.getItem(LAST_MIX_BY_GENRE_KEY) || '{}');
                    m[target.genre] = id;
                    localStorage.setItem(LAST_MIX_BY_GENRE_KEY, JSON.stringify(m));
                } catch (e) {}
            }
            toast({ title: t('toast_journey_loaded'), description: target.name });
        }
    } catch (e) {}
  }, [handleVolumeChange, toast, t]);

  const saveMixerPreset = useCallback((name: string) => {
    const values = {
        master: calibrationGains.master,
        bass: instrumentSettings.bass.volume,
        melody: instrumentSettings.melody.volume,
        accompaniment: instrumentSettings.accompaniment.volume,
        pianoAccompaniment: instrumentSettings.pianoAccompaniment.volume,
        harmony: instrumentSettings.harmony.volume,
        sparkles: textureSettings.sparkles.volume,
        sfx: textureSettings.sfx.volume,
        drums: drumSettings.volume
    };
    const newPreset: PresetItem = { id: `mix-${Date.now()}`, name, values };
    setMixerPresets(prev => {
        const next = [newPreset, ...prev];
        localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(next));
        return next;
    });
    setActiveMixerPresetId(newPreset.id);
    localStorage.setItem(ACTIVE_MIXER_ID_KEY, newPreset.id);
    toast({ title: "Mixer Preset Saved", description: name });
  }, [instrumentSettings, textureSettings, drumSettings, calibrationGains.master, toast]);

  const updateActiveMixerPreset = useCallback(() => {
    if (!activeMixerPresetId) return;
    const values = {
        master: calibrationGains.master,
        bass: instrumentSettings.bass.volume,
        melody: instrumentSettings.melody.volume,
        accompaniment: instrumentSettings.accompaniment.volume,
        pianoAccompaniment: instrumentSettings.pianoAccompaniment.volume,
        harmony: instrumentSettings.harmony.volume,
        sparkles: textureSettings.sparkles.volume,
        sfx: textureSettings.sfx.volume,
        drums: drumSettings.volume
    };
    setMixerPresets(prev => {
        const next = prev.map(p => p.id === activeMixerPresetId ? { ...p, values } : p);
        localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(next));
        return next;
    });
    toast({ title: "Mixer Preset Updated" });
  }, [activeMixerPresetId, instrumentSettings, textureSettings, drumSettings, calibrationGains.master, toast]);

  const deleteMixerPreset = useCallback((id: string) => {
    setMixerPresets(prev => {
        const next = prev.filter(p => p.id !== id);
        localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(next));
        return next;
    });
    if (activeMixerPresetId === id) {
        setActiveMixerPresetId(null);
        localStorage.removeItem(ACTIVE_MIXER_ID_KEY);
    }
  }, [activeMixerPresetId]);

  const resetMixerToSystem = useCallback(() => {
    const mix = GENRE_MASTER_MIX[genre] ?? GENRE_MASTER_MIX['ambient'];
    handleVolumeChange('master', 1.0);
    Object.entries(mix).forEach(([part, vol]) => handleVolumeChange(part, vol as number));
    setActiveMixerPresetId(null);
    localStorage.removeItem(ACTIVE_MIXER_ID_KEY);
    toast({ title: "System Mix Restored" });
  }, [handleVolumeChange, toast, genre]);

  const loadEqPreset = useCallback((id: string) => {
    const saved = localStorage.getItem(EQ_PRESETS_KEY);
    if (!saved) return;
    try {
        const list: PresetItem[] = JSON.parse(saved);
        const target = list.find(p => p.id === id);
        if (target && Array.isArray(target.values)) {
            target.values.forEach((val: number, idx: number) => {
                handleEqChange(idx, val);
            });
            setActiveEqPresetId(id);
            localStorage.setItem(ACTIVE_EQ_ID_KEY, id);
            if (target.genre) {
                try {
                    const m = JSON.parse(localStorage.getItem(LAST_EQ_BY_GENRE_KEY) || '{}');
                    m[target.genre] = id;
                    localStorage.setItem(LAST_EQ_BY_GENRE_KEY, JSON.stringify(m));
                } catch (e) {}
            }
            toast({ title: t('dialog_eq_title'), description: target.name });
        }
    } catch (e) {}
  }, [handleEqChange, toast, t]);

  const saveEqPreset = useCallback((name: string) => {
    const newPreset: PresetItem = { id: `eq-${Date.now()}`, name, values: [...eqSettings] };
    setEqPresets(prev => {
        const next = [newPreset, ...prev];
        localStorage.setItem(EQ_PRESETS_KEY, JSON.stringify(next));
        return next;
    });
    setActiveEqPresetId(newPreset.id);
    localStorage.setItem(ACTIVE_EQ_ID_KEY, newPreset.id);
    toast({ title: "EQ Preset Saved", description: name });
  }, [eqSettings, toast]);

  const updateActiveEqPreset = useCallback(() => {
    if (!activeEqPresetId) return;
    setEqPresets(prev => {
        const next = prev.map(p => p.id === activeEqPresetId ? { ...p, values: [...eqSettings] } : p);
        localStorage.setItem(EQ_PRESETS_KEY, JSON.stringify(next));
        return next;
    });
    toast({ title: "EQ Preset Updated" });
  }, [activeEqPresetId, eqSettings, toast]);

  const deleteEqPreset = useCallback((id: string) => {
    setEqPresets(prev => {
        const next = prev.filter(p => p.id !== id);
        localStorage.setItem(EQ_PRESETS_KEY, JSON.stringify(next));
        return next;
    });
    if (activeEqPresetId === id) {
        setActiveEqPresetId(null);
        localStorage.removeItem(ACTIVE_EQ_ID_KEY);
    }
  }, [activeEqPresetId]);

  const setMixerPresetGenre = useCallback((id: string, g: string) => {
    setMixerPresets(prev => {
        const next = prev.map(p => p.id === id ? { ...p, genre: g || undefined } : p);
        localStorage.setItem(MIXER_PRESETS_KEY, JSON.stringify(next));
        return next;
    });
  }, []);

  const setEqPresetGenre = useCallback((id: string, g: string) => {
    setEqPresets(prev => {
        const next = prev.map(p => p.id === id ? { ...p, genre: g || undefined } : p);
        localStorage.setItem(EQ_PRESETS_KEY, JSON.stringify(next));
        return next;
    });
  }, []);

  const applyGenreMix = useCallback((g: Genre) => {
    let presets: PresetItem[] = [];
    let lastMap: Record<string, string> = {};
    try { presets = JSON.parse(localStorage.getItem(MIXER_PRESETS_KEY) || '[]'); } catch (e) {}
    try { lastMap = JSON.parse(localStorage.getItem(LAST_MIX_BY_GENRE_KEY) || '{}'); } catch (e) {}
    const chosen = presets.find(p => p.id === lastMap[g] && p.genre === g) || presets.find(p => p.genre === g);
    if (chosen && chosen.values && !Array.isArray(chosen.values)) {
        const v = chosen.values;
        if (v.master !== undefined) handleVolumeChange('master', v.master);
        if (v.bass !== undefined) handleVolumeChange('bass', v.bass);
        if (v.melody !== undefined) handleVolumeChange('melody', v.melody);
        if (v.accompaniment !== undefined) handleVolumeChange('accompaniment', v.accompaniment);
        if (v.pianoAccompaniment !== undefined) handleVolumeChange('pianoAccompaniment', v.pianoAccompaniment);
        if (v.harmony !== undefined) handleVolumeChange('harmony', v.harmony);
        if (v.sparkles !== undefined) handleVolumeChange('sparkles', v.sparkles);
        if (v.sfx !== undefined) handleVolumeChange('sfx', v.sfx);
        if (v.drums !== undefined) handleVolumeChange('drums', v.drums);
        setActiveMixerPresetId(chosen.id);
    } else {
        const mix = GENRE_MASTER_MIX[g] ?? GENRE_MASTER_MIX['ambient'];
        handleVolumeChange('master', 1.0);
        Object.entries(mix).forEach(([part, vol]) => handleVolumeChange(part, vol as number));
        setActiveMixerPresetId(null);
    }
  }, [handleVolumeChange]);

  const applyGenreEq = useCallback((g: Genre) => {
    let presets: PresetItem[] = [];
    let lastMap: Record<string, string> = {};
    try { presets = JSON.parse(localStorage.getItem(EQ_PRESETS_KEY) || '[]'); } catch (e) {}
    try { lastMap = JSON.parse(localStorage.getItem(LAST_EQ_BY_GENRE_KEY) || '{}'); } catch (e) {}
    const chosen = presets.find(p => p.id === lastMap[g] && p.genre === g) || presets.find(p => p.genre === g);
    if (chosen && Array.isArray(chosen.values)) {
        chosen.values.forEach((val: number, idx: number) => handleEqChange(idx, val));
        setActiveEqPresetId(chosen.id);
    }
  }, [handleEqChange]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCurrentSeed(Date.now());
    const sJ = localStorage.getItem(SAVED_JOURNEYS_KEY);
    if (sJ) { try { setSavedRoutes(JSON.parse(sJ)); } catch (e) {} }
    const lR = localStorage.getItem(CURRENT_ROUTE_KEY);
    if (lR) { try { setRoute(JSON.parse(lR)); } catch (e) {} }
    const savedMixes = localStorage.getItem(MIXER_PRESETS_KEY);
    if (savedMixes) {
        try {
            const list = JSON.parse(savedMixes);
            setMixerPresets(list);
            const activeId = localStorage.getItem(ACTIVE_MIXER_ID_KEY);
            if (activeId) {
                const target = list.find((p: any) => p.id === activeId);
                if (target && target.values) {
                    const v = target.values;
                    if (v.master !== undefined) setCalibrationGain('master', v.master);
                    setInstrumentSettings(prev => ({
                        ...prev,
                        bass: { ...prev.bass, volume: v.bass ?? prev.bass.volume },
                        melody: { ...prev.melody, volume: v.melody ?? prev.melody.volume },
                        accompaniment: { ...prev.accompaniment, volume: v.accompaniment ?? prev.accompaniment.volume },
                        pianoAccompaniment: { ...prev.pianoAccompaniment, volume: v.pianoAccompaniment ?? prev.pianoAccompaniment.volume },
                        harmony: { ...prev.harmony, volume: v.harmony ?? prev.harmony.volume },
                    }));
                    setDrumSettings(prev => ({ ...prev, volume: v.drums ?? prev.volume }));
                    setTextureSettings(prev => ({
                        ...prev,
                        sparkles: { ...prev.sparkles, volume: v.sparkles ?? prev.sparkles.volume },
                        sfx: { ...prev.sfx, volume: v.sfx ?? prev.sfx.volume },
                    }));
                    setActiveMixerPresetId(activeId);
                }
            }
        } catch(e) {}
    }
    const savedEqs = localStorage.getItem(EQ_PRESETS_KEY);
    if (savedEqs) {
        try {
            const list = JSON.parse(savedEqs);
            setEqPresets(list);
            const activeId = localStorage.getItem(ACTIVE_EQ_ID_KEY);
            if (activeId) {
                const target = list.find((p: any) => p.id === activeId);
                if (target && Array.isArray(target.values)) {
                    setEqSettings(target.values);
                    setActiveEqPresetId(activeId);
                }
            }
        } catch(e) {}
    }
  }, []);

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

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const origin = window.location.origin;
    const version = "1.1"; 

    navigator.mediaSession.metadata = new MediaMetadata({
        title: `${genre.toUpperCase()} / ${mood.toUpperCase()}`,
        artist: currentTrackName !== 'Generative' ? currentTrackName : 'AuraGroove',
        album: 'The Infinite Take Orchestra',
        artwork: [
            { src: `${origin}/assets/cover/cover96.jpg?v=${version}`, sizes: '96x96', type: 'image/jpeg' },
            { src: `${origin}/assets/cover/cover128.jpg?v=${version}`, sizes: '128x128', type: 'image/jpeg' },
            { src: `${origin}/assets/cover/cover192.jpg?v=${version}`, sizes: '192x192', type: 'image/jpeg' },
            { src: `${origin}/assets/cover/cover256.jpg?v=${version}`, sizes: '256x256', type: 'image/jpeg' },
            { src: `${origin}/assets/cover/cover512.jpg?v=${version}`, sizes: '512x512', type: 'image/jpeg' },
        ]
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    if ('setPositionState' in navigator.mediaSession) {
        if (isPlaying) {
            if (sessionStartTimeRef.current === 0) sessionStartTimeRef.current = Date.now();
            const position = (Date.now() - sessionStartTimeRef.current) / 1000;
            try { 
                navigator.mediaSession.setPositionState({ 
                    duration: 7200, 
                    playbackRate: 1.0, 
                    position: Math.min(position, 7199) 
                }); 
            } catch(e) {}
        } else {
            sessionStartTimeRef.current = 0;
            try {
                navigator.mediaSession.setPositionState({ duration: 7200, playbackRate: 0, position: 0 });
            } catch(e) {}
        }
    }

    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
    navigator.mediaSession.setActionHandler('stop', () => { setIsPlaying(false); stopAllSounds(); });
    navigator.mediaSession.setActionHandler('nexttrack', () => { 
        toast({ title: t('toast_next_pattern'), description: t('toast_next_desc') });
        setIsRegenerating(true); setCurrentSeed(Date.now());
        setTimeout(() => setIsRegenerating(false), 500);
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
        toast({ title: t('toast_prev_pattern'), description: t('toast_prev_desc') });
        resetWorker();
    });

  }, [isPlaying, genre, mood, currentTrackName, setIsPlaying, stopAllSounds, toast, resetWorker, t]);

  const prevAppliedGenreRef = useRef<Genre | null>(null);
  useEffect(() => {
    if (activeRouteItemId) {
        const activeItem = route.find(it => it.id === activeRouteItemId);
        if (activeItem && activeItem.genre !== 'random' && activeItem.mood !== 'random') {
            const g = activeItem.genre as Genre;
            setGenreState(g);
            setMoodState(activeItem.mood as Mood);
            if (g !== prevAppliedGenreRef.current) {
                prevAppliedGenreRef.current = g;
                applyGenreMix(g);
                applyGenreEq(g);
            }
        }
    }
  }, [activeRouteItemId, route, applyGenreMix, applyGenreEq]);

  useEffect(() => {
    const onTransition = () => {
        if (route.length > 0) {
            const nextIndex = activeRouteIndex + 1;
            if (nextIndex < route.length) { setActiveRouteItemId(route[nextIndex].id); return; }
            if (isRepeat) {
                if (route[0].id === activeRouteItemId) { setCurrentSeed(Date.now()); }
                else { setActiveRouteItemId(route[0].id); }
                return;
            }
        }
        setCurrentSeed(Date.now());
    };
    window.addEventListener('AG_SUITE_TRANSITION', onTransition);
    return () => window.removeEventListener('AG_SUITE_TRANSITION', onTransition);
  }, [route, activeRouteIndex, isRepeat, activeRouteItemId]);

  const handlePlayPauseCallback = useCallback(async () => { 
    if (!isInitialized) {
        const success = await initialize();
        if (success) {
            applyCurrentMixToEngine();
            eqSettings.forEach((v, i) => setEQGain(i, v));
            if (route.length > 0 && !activeRouteItemId) setActiveRouteItemId(route[0].id);
            prevBarRef.current = 0; setIsPlaying(true);
        }
    } else { 
        if (!isPlaying) prevBarRef.current = 0;
        setIsPlaying(!isPlaying); 
    }
  }, [isInitialized, isPlaying, initialize, setIsPlaying, route, activeRouteItemId, applyCurrentMixToEngine, eqSettings, setEQGain]);

  const loadRoute = useCallback((saved: SavedRoute) => {
    const next: RouteItem[] = saved.items.map((it, idx) => ({
      id: `route-${Date.now()}-${idx}`,
      genre: it.genre,
      mood: it.mood,
      status: 'pending' as const
    }));
    setRoute(next);
    localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(next));
    if (next.length > 0) setActiveRouteItemId(next[0].id);
    toast({ title: t('toast_journey_loaded'), description: saved.name });
  }, [toast, t]);

  const syncDna = useCallback(async () => {
    await engineSyncDna();
    toast({ title: t('toast_dna_synced'), description: t('toast_dna_synced_desc') });
  }, [engineSyncDna, toast, t]);

  return useMemo(() => ({
    isInitializing, isPlaying, isRegenerating, isRecording, isBroadcastActive, isWarmingUp: false, warmUpTimeLeft: 0,
    loadingText: isInitializing ? 'Igniting Engine...' : 'Ready',
    availableCompositions, selectedCompositionIds, 
    toggleCompositionFilter: (id: string) => setSelectedCompositionIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]),
    clearCompositionFilters: () => setSelectedCompositionIds([]), refreshCloudAxioms, syncDna,
    handlePlayPause: handlePlayPauseCallback,
    handleRegenerate: () => { prevBarRef.current = 0; setCurrentSeed(Date.now()); setIsRegenerating(true); setTimeout(() => setIsRegenerating(false), 1000); },
    handleToggleRecording: () => isRecording ? stopRecording() : startRecording(),
    handleToggleBroadcast: () => toggleBroadcast(),
    handleSaveMasterpiece: () => { 
        if (isInitialized) { 
            saveMasterpiece(db, { seed: currentSeed, mood, genre, density, bpm, instrumentSettings }); 
            toast({ title: t('toast_masterpiece_saved'), description: t('toast_masterpiece_desc') });
        } 
    },
    drumSettings, setDrumSettings, instrumentSettings, 
    setInstrumentSettings: (part: any, name: any) => { setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], name } })); setInstrument(part as any, name as any); },
    handleBassTechniqueChange: () => {}, handleVolumeChange,
    textureSettings, handleTextureEnabledChange: (part: any, enabled: boolean) => setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], enabled }})),
    bpm, handleBpmChange: setBpm, score, handleScoreChange: setScore, density, setDensity,
    composerControlsInstruments, setComposerControlsInstruments,
    useHeritage, setUseHeritage,
    setIsPlaying, stopAllSounds,
    handleGoHome,
    isEqModalOpen: false, setIsEqModalOpen: () => {}, eqSettings, handleEqChange,
    isCalibrationModalOpen: false, setIsCalibrationModalOpen: () => {}, calibrationGains, handleCalibrationChange: setCalibrationGain,
    timerSettings, handleTimerDurationChange: (m: number) => setTimerSettings(p => ({ ...p, duration: m*60, timeLeft: m*60 })),
    handleToggleTimer: () => setTimerSettings(p => ({ ...p, isActive: !p.isActive, timeLeft: p.duration })),
    mood, setMood: setMoodState, genre, setGenre: setGenreState, introBars, setIntroBars,
    voiceLimit, setVoiceLimit,
    route, addToRoute: (g: any, m: any) => { const id = `route-${Date.now()}`; setRoute(prev => { const next = [...prev, { id, genre: g, mood: m, status: 'pending' as const }]; localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(next)); return next; }); },
    removeFromRoute: (id: string) => setRoute(prev => { const next = prev.filter(it => it.id !== id); localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(next)); return next; }),
    selectRouteItem: (id: string) => { const item = route.find(it => it.id === id); if (item) setActiveRouteItemId(id); },
    refreshRoute: () => { if (isPlaying) { toast({ variant: "destructive", title: t('toast_action_blocked'), description: t('toast_only_in_pause') }); return; } prevBarRef.current = 0; resetWorker(); if (route.length > 0) { setActiveRouteItemId(route[0].id); } toast({ title: "Refresh Path" }); },
    moveRouteItem: () => {}, reorderRoute: (a: any, o: any) => setRoute(p => { const next = arrayMove(p, p.findIndex(i => i.id === a), p.findIndex(i => i.id === o)); localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(next)); return next; }),
    saveRoute: (name: string) => { const n = { id: `r-${Date.now()}`, userId: 'l', name, items: route.map(i => ({ genre: i.genre, mood: i.mood })), createdAt: new Date().toISOString() }; const u = [n, ...savedRoutes]; setSavedRoutes(u); localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(u)); },
    loadRoute, deleteSavedRoute: (id: string) => { const u = savedRoutes.filter(r => r.id !== id); setSavedRoutes(u); localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(u)); },
    savedRoutes, isShuffle, setShuffle, isRepeat, setRepeat, activeRouteIndex, showAdvancedUI, setShowAdvancedUI,
    currentBar, totalBars, currentTrackName,
    eqPresets, activeEqPresetId, saveEqPreset, updateActiveEqPreset, loadEqPreset, deleteEqPreset, setEqPresetGenre,
    mixerPresets, activeMixerPresetId, saveMixerPreset, updateActiveMixerPreset, loadMixerPreset, deleteMixerPreset, setMixerPresetGenre, resetMixerToSystem,
    useMelodyV2: true, toggleMelodyEngine: () => {},
    language, toggleLanguage, t
  }), [
      isInitializing, isPlaying, isRegenerating, isRecording, isBroadcastActive, availableCompositions, selectedCompositionIds, refreshCloudAxioms, syncDna,
      handlePlayPauseCallback, isRecording, stopRecording, startRecording, toggleBroadcast, isInitialized, db, currentSeed, mood, genre, density, bpm, instrumentSettings,
      setInstrument, handleVolumeChange, textureSettings, bpm, setBpm, score, setScore, density, setDensity, composerControlsInstruments, 
      setComposerControlsInstruments, useHeritage, setUseHeritage, setIsPlaying, stopAllSounds, handleGoHome, eqSettings, handleEqChange,
      calibrationGains, setCalibrationGain, timerSettings, mood, genre, introBars, voiceLimit, setVoiceLimit, route, activeRouteIndex, isRepeat,
      savedRoutes, isShuffle, activeRouteItemId, loadRoute, currentBar, totalBars, currentTrackName, eqPresets, activeEqPresetId, 
      saveEqPreset, updateActiveEqPreset, loadEqPreset, deleteEqPreset, setEqPresetGenre, mixerPresets, activeMixerPresetId, saveMixerPreset,
      updateActiveMixerPreset, deleteMixerPreset, setMixerPresetGenre, resetMixerToSystem,
      language, toggleLanguage, t
  ]);
};
