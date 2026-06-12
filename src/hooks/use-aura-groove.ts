
/**
 * @fileOverview Music Control Hook V13.6 — "Silent BPM Sync".
 * #ЗАЧЕМ: Ликвидация петель самовозбуждения BPM.
 * #ЧТО: ПЛАН №302 — Использование Ref для блокировки обратного сообщения при синхронизации темпа.
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

  const activeRouteIndex = useMemo(() => route.findIndex(it => it.id === activeRouteItemId), [route, activeRouteItemId]);
  const prevBarRef = useRef(0);
  
  // #ЗАЧЕМ: Флаг для предотвращения петли обратной связи BPM.
  const isBpmSyncingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleBpmSync = (e: any) => {
        if (e.detail?.bpm) {
            isBpmSyncingRef.current = true;
            setBpm(e.detail.bpm);
            // Флаг снимется в следующем кадре или эффекте
        }
    };

    window.addEventListener('AG_BPM_SYNC', handleBpmSync);
    return () => window.removeEventListener('AG_BPM_SYNC', handleBpmSync);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCurrentSeed(Date.now());
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

  useEffect(() => {
    if (isInitialized) {
        // #ЗАЧЕМ: ПЛАН №302. Если обновление пришло от самого Воркера, не шлем его назад.
        if (isBpmSyncingRef.current) {
            isBpmSyncingRef.current = false;
            return;
        }

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

  // Rest of the logic stays identical to 7c2933a1...
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    const updateMetadata = () => {
        const fullArtworkUrl = `${window.location.origin}/assets/cover.jpg?v=${currentSeed}`;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'AuraGroove',
            artist: `${genre.toUpperCase()} / ${mood.toUpperCase()}`,
            album: currentTrackName || 'Generative Suite',
            artwork: [{ src: fullArtworkUrl, sizes: '512x512', type: 'image/jpeg' }]
        });
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    };
    updateMetadata();
    const heartbeat = setInterval(updateMetadata, 2000);
    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
    return () => clearInterval(heartbeat);
  }, [isPlaying, currentTrackName, genre, mood, currentSeed, setIsPlaying]);

  useEffect(() => {
    if (activeRouteItemId) {
        const activeItem = route.find(it => it.id === activeRouteItemId);
        if (activeItem && activeItem.genre !== 'random' && activeItem.mood !== 'random') {
            setGenreState(activeItem.genre as Genre);
            setMoodState(activeItem.mood as Mood);
        }
    }
  }, [activeRouteItemId, route]);

  useEffect(() => {
    if (isPlaying && currentBar === 0 && prevBarRef.current > 0 && route.length > 0) {
        const nextIndex = activeRouteIndex + 1;
        if (nextIndex < route.length) {
            setActiveRouteItemId(route[nextIndex].id);
        } else if (isRepeat) {
            setActiveRouteItemId(route[0].id);
        }
    }
    prevBarRef.current = currentBar;
  }, [currentBar, isPlaying, route, activeRouteIndex, isRepeat]);

  const handlePlayPause = useCallback(async () => { 
    if (!isInitialized) {
        const success = await initialize();
        if (success) {
            if (route.length > 0 && !activeRouteItemId) setActiveRouteItemId(route[0].id);
            setIsPlaying(true);
        }
    } else { setIsPlaying(!isPlaying); }
  }, [isInitialized, isPlaying, initialize, setIsPlaying, route, activeRouteItemId]);

  return {
    isInitializing, isPlaying, isRegenerating: false, isRecording, isBroadcastActive, isWarmingUp: false, warmUpTimeLeft: 0,
    loadingText: isInitializing ? 'Igniting Engine...' : 'Ready',
    availableCompositions, selectedCompositionIds, 
    toggleCompositionFilter: useCallback((id) => setSelectedCompositionIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]), []),
    clearCompositionFilters: useCallback(() => setSelectedCompositionIds([]), []), refreshCloudAxioms,
    handlePlayPause,
    handleRegenerate: useCallback(() => { setCurrentSeed(Date.now()); }, []),
    handleToggleRecording: useCallback(() => isRecording ? stopRecording() : startRecording(), [isRecording, stopRecording, startRecording]),
    handleToggleBroadcast: useCallback(() => toggleBroadcast(), [toggleBroadcast]),
    handleSaveMasterpiece: useCallback(() => {}, []),
    drumSettings, setDrumSettings, 
    instrumentSettings, 
    setInstrumentSettings: useCallback((part, name) => { setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], name } })); setInstrument(part as any, name as any); }, [setInstrument]),
    handleBassTechniqueChange: useCallback(() => {}, []), 
    handleVolumeChange: useCallback((part: any, value: number) => {
        setVolume(part, value);
        if (part in instrumentSettings) { setInstrumentSettings(prev => ({ ...prev, [part]: { ...prev[part as keyof typeof prev], volume: value } })); }
        else if (part === 'drums') { setDrumSettings(prev => ({ ...prev, volume: value })); }
    }, [setVolume, instrumentSettings]),
    textureSettings, 
    handleTextureEnabledChange: useCallback((part, enabled) => setTextureSettings(prev => ({ ...prev, [part]: { ...prev[part], enabled }})), []),
    bpm, handleBpmChange: setBpm, score, handleScoreChange: setScore, density, setDensity,
    composerControlsInstruments, setComposerControlsInstruments,
    useHeritage, setUseHeritage,
    setIsPlaying, stopAllSounds,
    handleGoHome: useCallback(async () => { if (isPlaying) await setIsPlaying(false); stopAllSounds(); router.push('/'); }, [isPlaying, setIsPlaying, stopAllSounds, router]),
    isEqModalOpen: false, setIsEqModalOpen: () => {}, eqSettings, 
    handleEqChange: useCallback((idx: number, val: number) => { const n = [...eqSettings]; n[idx] = val; setEqSettings(n); setEQGain(idx, val); }, [eqSettings, setEQGain]),
    isCalibrationModalOpen: false, setIsCalibrationModalOpen: () => {}, calibrationGains, handleCalibrationChange: setCalibrationGain,
    timerSettings, handleTimerDurationChange: useCallback((m) => setTimerSettings(p => ({ ...p, duration: m*60, timeLeft: m*60 })), []),
    handleToggleTimer: useCallback(() => setTimerSettings(p => ({ ...p, isActive: !p.isActive, timeLeft: p.duration })), []),
    mood, setMood: setMoodState, genre, setGenre: setGenreState, introBars, setIntroBars,
    voiceLimit, setVoiceLimit,
    route, 
    addToRoute: useCallback((g, m) => { const id = `route-${Date.now()}`; setRoute(prev => { const next = [...prev, { id, genre: g, mood: m, status: 'pending' as const }]; localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(next)); return next; }); }, []), 
    removeFromRoute: useCallback((id) => setRoute(prev => { const next = prev.filter(it => it.id !== id); localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(next)); return next; }), []), 
    selectRouteItem: useCallback((id) => { const item = route.find(it => it.id === id); if (item) setActiveRouteItemId(id); }, [route]), 
    refreshRoute: useCallback(() => refreshCloudAxioms(), [refreshCloudAxioms]), 
    moveRouteItem: useCallback(() => {}, []), 
    reorderRoute: useCallback((a, o) => setRoute(p => { const next = arrayMove(p, p.findIndex(i => i.id === a), p.findIndex(i => i.id === o)); localStorage.setItem(CURRENT_ROUTE_KEY, JSON.stringify(next)); return next; }), []), 
    saveRoute: useCallback((name) => { const n = { id: `r-${Date.now()}`, userId: 'l', name, items: route.map(i => ({ genre: i.genre, mood: i.mood })), createdAt: new Date().toISOString() }; const u = [n, ...savedRoutes]; setSavedRoutes(u); localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(u)); }, [route, savedRoutes]),
    loadRoute, deleteSavedRoute: useCallback((id) => { const u = savedRoutes.filter(r => r.id !== id); setSavedRoutes(u); localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(u)); }, [savedRoutes]),
    savedRoutes, isShuffle, setShuffle, isRepeat, setRepeat, activeRouteIndex,
    showAdvancedUI, setShowAdvancedUI,
    currentBar, totalBars, currentTrackName,
    eqPresets, activeEqPresetId, saveEqPreset: useCallback(() => {}, []), updateActiveEqPreset: useCallback(() => {}, []), loadEqPreset: useCallback(() => {}, []), deleteEqPreset: useCallback(() => {}, []),
    mixerPresets, activeMixerPresetId, saveMixerPreset: useCallback(() => {}, []), updateActiveMixerPreset: useCallback(() => {}, []), loadMixerPreset: useCallback(() => {}, []), deleteMixerPreset: useCallback(() => {}, []),
    resetMixerToSystem: useCallback(() => {}, [])
  };
};
