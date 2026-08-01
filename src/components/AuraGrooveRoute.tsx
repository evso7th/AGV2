/**
 * @fileOverview UI AuraGroove V15.4 — "Responsive Info Center".
 * #ЗАЧЕМ: Приведение Инфоцентра к 90vw (5% margins) и предотвращение обрезания текста.
 */
'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    Plus, X, Shuffle, Music, Pause, Settings2,
    Activity, Timer, ThumbsUp, Radio, TowerControl,
    Home, RefreshCw, SlidersHorizontal, ArrowUp, ArrowDown, Mic2,
    Save, FolderOpen, Trash2, Check, Navigation, Sliders, Cog,
    GripVertical, Zap, Dna, SaveAll, RotateCcw, Layers, Repeat, Moon, Sun, Sparkles, DownloadCloud, Info, CircleHelp,
    SkipBack, SkipForward, Play
} from 'lucide-react';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import type { AuraGrooveProps, PresetItem } from "@/hooks/use-aura-groove";
import type { RouteItem, TextureSettings, InstrumentSettings } from "@/types/music";
import { cn, formatTime } from "@/lib/utils";
import { SpectrumAnalyzer } from "./SpectrumAnalyzer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { GUIDE_RU, GUIDE_EN, DISCLAIMER_RU, DISCLAIMER_EN, CREDITS_HTML } from '@/lib/info-docs';
import { OrbitalAnimation } from "./orbital-animation";

const GENRE_IDS = ['ambient', 'psybient', 'blues', 'reggae'];
const MOOD_IDS = ['melancholic', 'dreamy', 'calm', 'joyful'];

const MIXER_CHANNELS = [
    { key: 'master', label: 'MST' },
    { key: 'bass', label: 'BASS' },
    { key: 'melody', label: 'LEAD' },
    { key: 'accompaniment', label: 'KEYB' },
    { key: 'pianoAccompaniment', label: 'PIANO' },
    { key: 'harmony', label: 'RTM' },
    { key: 'sparkles', label: 'SP' },
    { key: 'sfx', label: 'SFX' },
    { key: 'drums', label: 'DRM' }
];

const EQ_BANDS = [
  { freq: '60', label: '60' }, { freq: '125', label: '125' }, { freq: '250', label: '250' },
  { freq: '500', label: '500' }, { freq: '1k', label: '1k' }, { freq: '2k', label: '2k' }, { freq: '4k', label: '4k' },
];

function PresetManager({
    presets,
    activeId,
    onSave,
    onUpdate,
    onLoad,
    onDelete,
    title,
    onReset,
    onSetGenre,
    t
}: {
    presets: PresetItem[],
    activeId: string | null,
    onSave: (name: string) => void,
    onUpdate?: () => void,
    onLoad: (id: string) => void,
    onDelete: (id: string) => void,
    title: string,
    onReset?: () => void,
    onSetGenre?: (id: string, genre: string) => void,
    t: (k: any) => string
}) {
    const [name, setName] = useState("");
    const activePreset = presets.find(p => p.id === activeId);

    return (
        <div className="space-y-4 pt-4 border-t border-primary/10 mt-4">
            <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase opacity-50 tracking-widest">{title} Control</Label>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-[8px] font-black uppercase", activeId ? "text-primary border-primary/30" : "opacity-40")}>
                        {activeId ? activePreset?.name : "System Default"}
                    </Badge>
                    {onReset && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onReset}>
                            <RotateCcw className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
                <Input placeholder={t('dialog_capture_name')} value={name} onChange={e => setName(e.target.value)} className="h-8 text-xs bg-background w-full sm:flex-1 min-w-0" />
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        disabled={!name.trim()}
                        onClick={() => { if (name.trim()) { onSave(name); setName(""); } }}
                        className="h-8 px-3 gap-1.5 font-black uppercase text-[10px] flex-1 sm:flex-none"
                    >
                        <Save className="h-3.5 w-3.5" />
                        {t('btn_preset_save')}
                    </Button>
                    {activeId && onUpdate && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={onUpdate}
                            className="h-8 px-3 gap-1.5 font-black uppercase text-[10px] flex-1 sm:flex-none"
                        >
                            <SaveAll className="h-3.5 w-3.5" />
                            {t('btn_preset_update')}
                        </Button>
                    )}
                </div>
            </div>
            
            <ScrollArea className="h-32">
                <div className="space-y-1">
                    {presets.map(p => (
                        <div key={p.id} className={cn(
                            "flex items-center justify-between p-1.5 rounded border transition-all group",
                            p.id === activeId ? "bg-primary/10 border-primary/30" : "border-transparent hover:bg-muted/50"
                        )}>
                            <span className="text-[10px] font-bold uppercase cursor-pointer flex-grow truncate min-w-0 mr-2" onClick={() => onLoad(p.id)}>{p.name}</span>
                            
                            {onSetGenre && (
                                <Select 
                                    value={p.genre || "none"} 
                                    onValueChange={(v) => onSetGenre(p.id, v === "none" ? "" : v)}
                                >
                                    <SelectTrigger className="h-6 w-24 text-[9px] font-black uppercase px-2 bg-background/50 border-none shadow-none">
                                        <SelectValue placeholder="Genre" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card">
                                        <SelectItem value="none" className="text-[10px] uppercase font-black">---</SelectItem>
                                        {['ambient', 'psybient', 'blues', 'reggae'].map(g => (
                                            <SelectItem key={g} value={g} className="text-[10px] uppercase font-black">{t(`g_${g}` as any)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 shrink-0" onClick={() => onDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

function SimpleRouteItem({
    item,
    isActive,
    trackName,
    progress,
    onRemove,
    onSelect,
    isDarkTheme,
    t
}: {
    item: RouteItem,
    isActive: boolean,
    trackName?: string,
    progress?: number,
    onRemove: (id: string) => void,
    onSelect: (id: string) => void,
    isDarkTheme: boolean,
    t: (k: any) => string
}) {
    const getGenreLabel = (id: string) => t(`g_${id}` as any);
    const getMoodLabel = (id: string) => t(`m_${id}` as any);

    return (
        <div
            onClick={() => !isActive && onSelect(item.id)}
            className={cn(
                "flex items-center justify-between p-2 rounded-lg border transition-all group relative overflow-hidden cursor-pointer",
                isActive ? "bg-primary/10 border-primary/40 shadow-inner" : "bg-muted/30 border-transparent hover:border-primary/20",
            )}
        >
            {isActive && progress !== undefined && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary/20">
                    <div
                        className="h-full bg-primary transition-all duration-1000 ease-linear"
                        style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
                    />
                </div>
            )}

            <div className="flex items-center gap-3 overflow-hidden z-10 pointer-events-none">
                <div className="p-1 text-muted-foreground hover:text-primary transition-colors touch-none pointer-events-auto">
                    <GripVertical className="h-4 w-4" />
                </div>
                <div className="truncate">
                    <div className="flex flex-col gap-0.5">
                        <div className="text-[11px] font-black uppercase tracking-tight">
                            {getGenreLabel(item.genre)} / {getMoodLabel(item.mood)}
                        </div>
                        {isActive && trackName && (
                            <div className="text-[8px] font-mono opacity-60 normal-case tracking-normal truncate">
                                DNA: {trackName.replace(/_/g, ' ')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10" 
                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} 
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}

export function AuraGrooveRoute(props: AuraGrooveProps) {
    const { t } = props;
    const router = useRouter();
    const [selectedGenre, setSelectedGenre] = useState<any>('ambient');
    const [selectedMood, setSelectedMood] = useState<any>('melancholic');
    const [isSpectrumOpen, setIsSpectrumOpen] = useState(false);
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const [isEqOpen, setIsEqOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isSaveRouteOpen, setIsSaveRouteOpen] = useState(false);
    const [isLoadRouteOpen, setIsLoadRouteOpen] = useState(false);
    const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);
    const [isCapacityDialogOpen, setIsCapacityDialogOpen] = useState(false);
    const [routeName, setRouteName] = useState("");
    const [isDarkTheme, setIsDarkTheme] = useState(true);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showFeedback = useCallback((msg: string) => {
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        setFeedbackMessage(msg);
        feedbackTimeoutRef.current = setTimeout(() => setFeedbackMessage(null), 3000);
    }, []);
    
    const [isAmbientMode, setIsAmbientMode] = useState(false);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

    const resetIdleTimer = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (props.isPlaying && !isAmbientMode) {
            idleTimerRef.current = setTimeout(() => {
                setIsAmbientMode(true);
            }, 10000); 
        }
    }, [props.isPlaying, isAmbientMode]);

    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'touchstart', 'keydown'];
        events.forEach(e => window.addEventListener(e, resetIdleTimer));
        resetIdleTimer();
        return () => {
            events.forEach(e => window.removeEventListener(e, resetIdleTimer));
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [resetIdleTimer]);

    const hudColor = useMemo(() => {
        const hue = 270 + (props.tension * 20);
        const saturation = 70 + (props.tension * 25); 
        const light = 60 + (props.tension * 25);      
        return `hsl(${hue}, ${saturation}%, ${light}%)`;
    }, [props.tension]);

    const handleAdd = () => props.addToRoute(selectedGenre, selectedMood);
    const handleSave = () => { if (!routeName.trim()) return; props.saveRoute(routeName); setRouteName(""); setIsSaveRouteOpen(false); };

    const bgClass = isDarkTheme ? 'bg-neutral-950' : 'bg-white';
    const textClass = isDarkTheme ? 'text-neutral-100' : 'text-gray-900';
    const borderClass = isDarkTheme ? 'border-neutral-800' : 'border-gray-200';
    const headerBgClass = isDarkTheme ? 'bg-neutral-900/80' : 'bg-gray-50/80';
    const outlineStyle = !isDarkTheme
        ? { backgroundColor: '#FFFFFF', color: '#1F2937', borderColor: '#D1D5DB', borderWidth: '1px' }
        : undefined;

    return (
        <div className={cn("w-full h-full flex flex-col overflow-hidden transition-colors duration-200", bgClass, textClass)}>
            
            {/* Ambient Overlay - THE PURE TERMINAL */}
            {isAmbientMode && (
                <div className="fixed inset-0 z-[9999] backdrop-blur-3xl bg-black/80 animate-in fade-in duration-1000 cursor-default">
                    
                    {/* Top Status */}
                    <div className="absolute top-12 left-0 right-0 text-center select-none pointer-events-none opacity-30">
                        <div 
                            className="text-[9px] font-black uppercase tracking-[0.5em] transition-colors duration-500"
                            style={{ color: hudColor }}
                        >
                            AURAGROOVE INFINITY TAKE ORCHESTRA
                        </div>
                    </div>

                    {/* Focused Core */}
                    <div 
                        className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none flex items-center justify-center"
                        style={{ width: '90vw', height: '90vw', maxWidth: '60vh', maxHeight: '60vh' }}
                    >
                        <OrbitalAnimation 
                            tension={props.tension} 
                            isPlaying={true} 
                            size="100%" 
                            className="opacity-90"
                        />
                    </div>

                    {/* Feedback Message */}
                    {feedbackMessage && (
                        <div className="absolute top-[65%] left-1/2 -translate-x-1/2 z-[10000] animate-in fade-in zoom-in duration-300">
                            <Badge 
                                variant="outline" 
                                className="px-6 py-2 bg-black/60 backdrop-blur-xl border-primary/40 text-primary font-black uppercase text-[10px] tracking-widest shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                                style={{ color: hudColor, borderColor: hudColor }}
                            >
                                {feedbackMessage}
                            </Badge>
                        </div>
                    )}
                    
                    {/* Control Pill */}
                    <div 
                        className="absolute top-[80%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-around gap-2 px-6 py-4 rounded-full bg-black/50 border border-white/10 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)] w-[90vw] max-w-[400px] transition-all active:scale-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Button 
                            variant="ghost" size="icon" 
                            disabled={props.activeRouteIndex <= 0}
                            onClick={() => props.selectRouteItem(props.route[props.activeRouteIndex - 1].id)}
                            className="h-10 w-10 hover:bg-white/5 disabled:opacity-10"
                            style={{ color: hudColor }}
                        >
                            <SkipBack className="h-5 w-5" />
                        </Button>

                        <Button 
                            variant="ghost" size="icon" 
                            onClick={props.handlePlayPause}
                            className="h-12 w-12 hover:bg-white/5 transition-transform active:scale-90"
                            style={{ color: hudColor }}
                        >
                            {props.isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 fill-current" />}
                        </Button>

                        <Button 
                            variant="ghost" size="icon" 
                            disabled={props.activeRouteIndex >= props.route.length - 1}
                            onClick={() => props.selectRouteItem(props.route[props.activeRouteIndex + 1].id)}
                            className="h-10 w-10 hover:bg-white/5 disabled:opacity-10"
                            style={{ color: hudColor }}
                        >
                            <SkipForward className="h-5 w-5" />
                        </Button>

                        <div className="w-[1px] h-8 bg-white/10 mx-1" />

                        <Button 
                            variant="ghost" size="icon" 
                            onClick={() => { props.handleSaveMasterpiece(); showFeedback(t('toast_masterpiece_saved')); }}
                            className="h-10 w-10 hover:bg-white/5"
                            style={{ color: hudColor }}
                        >
                            <ThumbsUp className="h-5 w-5" />
                        </Button>

                        <Button 
                            variant="ghost" size="icon" 
                            onClick={() => { props.handleToggleRecording(); showFeedback(props.isRecording ? 'Recording Stopped' : 'Recording Started'); }}
                            className="h-10 w-10 hover:bg-white/5"
                            style={{ color: hudColor, opacity: props.isRecording ? 1 : 0.4 }}
                        >
                            <Radio className={cn("h-5 w-5", props.isRecording && "animate-pulse")} />
                        </Button>

                        <Button 
                            variant="ghost" size="icon" 
                            onClick={() => setIsAmbientMode(false)}
                            className="h-10 w-10 hover:bg-white/5 text-white/20"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Bottom Info Stack */}
                    <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center select-none pointer-events-none gap-0.5">
                        <div 
                            className="text-[12px] font-black uppercase tracking-widest transition-colors duration-500 opacity-50"
                            style={{ color: hudColor }}
                        >
                            {t(`g_${props.genre}` as any)}
                        </div>
                        <div 
                            className="text-[12px] font-black uppercase tracking-widest transition-colors duration-500 opacity-50"
                            style={{ color: hudColor }}
                        >
                            {t(`m_${props.mood}` as any)}
                        </div>
                        <div 
                            className="text-[8px] font-mono font-black uppercase tracking-tight opacity-40 transition-colors duration-500 mt-1" 
                            style={{ color: hudColor }}
                        >
                            STEP {props.activeRouteIndex + 1} / {props.route.length}
                        </div>
                    </div>
                </div>
            )}

            {/* TOP: Header + Selectors */}
            <div className={cn("shrink-0 flex flex-col border-b transition-colors", borderClass)}>
                <header className={cn("p-3 shrink-0 transition-colors", headerBgClass)}>
                    <div className="flex items-center justify-between mb-2">
                        <div 
                            onClick={props.handleGoHome}
                            className="flex flex-row items-center gap-2 cursor-pointer hover:opacity-80 transition-all"
                        >
                            <Image src="/assets/icon8.jpeg" alt="AuraGroove Logo" width={32} height={32} className="rounded-full" />
                            <div className="flex flex-col relative">
                                <div className="relative">
                                    <h1 className="text-lg font-bold text-primary tracking-tighter relative z-0">AuraGroove</h1>
                                    <Badge 
                                        variant="outline" 
                                        className="absolute left-[0.5px] bottom-[-4px] z-10 h-3.5 px-1 text-[9px] font-mono font-black border-none bg-purple-200 text-purple-950 flex items-center justify-center min-w-[20px] shadow-sm"
                                    >
                                        {props.voiceLimit}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setIsInfoOpen(true)} 
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                            >
                                <CircleHelp className="h-5 w-5" />
                            </Button>
                            <Button 
                                onClick={props.handlePlayPause} 
                                disabled={props.isInitializing} 
                                className="h-8 px-4 text-[10px] font-black uppercase tracking-tight shadow-md"
                            >
                                {props.isPlaying ? <Pause className="mr-1.5 h-4 w-4" /> : <Music className="mr-1.5 h-4 w-4" />}
                                {props.isPlaying ? t('btn_pause') : t('btn_play')}
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-0.5 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" onClick={props.handleGoHome} className="h-8 w-8 shrink-0"><Home className="h-4 w-4" /></Button>
                            <Button variant="outline" onClick={props.handleToggleBroadcast} style={outlineStyle} className="h-8 w-8 p-0 shrink-0">
                                <TowerControl className={cn("h-4 w-4", props.isBroadcastActive && "animate-pulse text-primary")} />
                            </Button>
                            <Button variant="outline" onClick={props.handleToggleRecording} style={outlineStyle} className="h-8 w-8 p-0 shrink-0">
                                <Radio className={cn("h-4 w-4", props.isRecording && "animate-pulse")} />
                            </Button>
                            <Button variant="outline" onClick={props.handleSaveMasterpiece} disabled={!props.isPlaying} style={outlineStyle} className="h-8 w-8 p-0 shrink-0">
                                <ThumbsUp className="h-4 w-4 text-primary" />
                            </Button>
                            <Button variant="outline" onClick={props.handleRegenerate} style={outlineStyle} className="h-8 w-8 p-0 shrink-0">
                                <RefreshCw className={cn("h-4 w-4", props.isRegenerating && "animate-spin")} />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={props.toggleLanguage} 
                                style={outlineStyle}
                                className="h-8 px-1.5 text-[10px] font-black uppercase tracking-tighter text-primary shrink-0"
                            >
                                {props.language}
                            </Button>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" onClick={() => setIsEqOpen(true)} className="h-8 w-8 text-xs font-black shrink-0">EQ</Button>
                            <Button variant="ghost" size="icon" onClick={() => setIsStudioOpen(true)} className="h-8 w-8 shrink-0"><Settings2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col">
                    <div className="px-3 py-2 flex-shrink-0">
                        <Label className="text-[10px] font-black uppercase opacity-60 tracking-wider">{t('label_genre')}</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {GENRE_IDS.map(id => (
                                <button
                                    key={id}
                                    onClick={() => setSelectedGenre(id)}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tight transition-all border",
                                        selectedGenre === id
                                            ? "bg-violet-600 text-white shadow-md border-violet-500"
                                            : isDarkTheme
                                            ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700"
                                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    {t(`g_${id}` as any)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="px-3 py-2 flex-shrink-0">
                        <Label className="text-[10px] font-black uppercase opacity-60 tracking-wider">{t('label_mood')}</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {MOOD_IDS.map(id => (
                                <button
                                    key={id}
                                    onClick={() => setSelectedMood(id)}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tight transition-all border",
                                        selectedMood === id
                                            ? "bg-violet-600 text-white shadow-md border-violet-500"
                                            : isDarkTheme
                                            ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700"
                                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    {t(`m_${id}` as any)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM: Route List */}
            <div className={cn("flex-1 min-0 flex flex-col relative overflow-hidden transition-colors", isDarkTheme ? 'bg-neutral-900' : 'bg-gray-50')}>
                <div className={cn("p-2 flex gap-2 shrink-0 transition-colors", isDarkTheme ? 'bg-neutral-800/50' : 'bg-gray-100/50')}>
                    <Button onClick={handleAdd} className="flex-grow font-black uppercase text-[10px] tracking-tight h-10 shadow-lg px-1.5">
                        <Plus className="h-4 w-4 mr-1" /> {t('btn_add_to_route')}
                    </Button>
                    <div className="flex gap-1">
                        <Dialog open={isSaveRouteOpen} onOpenChange={setIsSaveRouteOpen}>
                            <DialogTrigger asChild><Button variant="outline" size="icon" style={outlineStyle} className="h-10 w-10"><Save className="h-4 w-4" /></Button></DialogTrigger>
                            <DialogContent className="bg-card border-primary/20"><DialogHeader><DialogTitle className="font-black uppercase text-primary">{t('dialog_capture_title')}</DialogTitle></DialogHeader><div className="py-4"><Input placeholder={t('dialog_capture_name')} value={routeName} onChange={e => setRouteName(e.target.value)} className="bg-background" /></div><DialogFooter><Button onClick={handleSave} className="w-full font-black uppercase tracking-widest">{t('btn_capture_save')}</Button></DialogFooter></DialogContent>
                        </Dialog>
                        <Dialog open={isLoadRouteOpen} onOpenChange={setIsLoadRouteOpen}>
                            <DialogTrigger asChild><Button variant="outline" size="icon" style={outlineStyle} className="h-10 w-10"><FolderOpen className="h-4 w-4" /></Button></DialogTrigger>
                            <DialogContent className="bg-card border-primary/20"><DialogHeader><DialogTitle className="font-black uppercase text-primary">{t('dialog_library_title')}</DialogTitle></DialogHeader><ScrollArea className="h-64 pr-3">{props.savedRoutes?.map(saved => (<div key={saved.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:border-primary/20 border border-transparent group mb-1"><div className="cursor-pointer flex-grow" onClick={() => { props.loadRoute(saved); setIsLoadRouteOpen(false); }}><div className="text-xs font-black uppercase">{saved.name}</div><div className="text-[9px] font-bold opacity-40 uppercase">{saved.items.length} {t('steps_count')}</div></div><Button variant="ghost" size="icon" onClick={() => props.deleteSavedRoute(saved.id)} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button></div>))}</ScrollArea></DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col p-3 pt-1 gap-2">
                    <div className="flex items-center justify-between px-1 shrink-0"><Label className="text-[10px] font-black uppercase opacity-50">{t('label_current_path')}</Label><Badge variant="outline" className="text-[9px] font-mono opacity-50">{props.route.length} {t('label_steps')}</Badge></div>
                    <ScrollArea className="flex-grow pr-3">
                        <div className="space-y-1.5 pb-24">
                            {props.route.map((item, idx) => {
                                const isActive = idx === props.activeRouteIndex && props.isPlaying;
                                const progress = isActive ? (props.currentBar / (props.totalBars || 1)) : 0;
                                return (
                                    <SimpleRouteItem
                                        key={item.id}
                                        item={item}
                                        isActive={isActive}
                                        trackName={isActive ? props.currentTrackName : undefined}
                                        progress={progress}
                                        onRemove={props.removeFromRoute}
                                        onSelect={props.selectRouteItem}
                                        isDarkTheme={isDarkTheme}
                                        t={t}
                                    />
                                );
                            })}
                            {props.route.length === 0 && (
                                <div className={cn("py-10 text-center flex flex-col items-center gap-3 rounded-lg mx-4", isDarkTheme ? 'bg-neutral-800/50' : 'bg-gray-100/50')}>
                                    <Sparkles className={cn("h-10 w-10 animate-pulse", isDarkTheme ? 'text-violet-500' : 'text-violet-400')} />
                                    <div>
                                        <p className={cn("text-[11px] font-black uppercase tracking-widest mb-1", isDarkTheme ? 'text-neutral-300' : 'text-gray-600')}>{t('empty_route_title')}</p>
                                        <p className={cn("text-[9px] uppercase tracking-wide leading-relaxed", isDarkTheme ? 'text-neutral-500' : 'text-gray-500')}>
                                            {t('empty_route_desc')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <footer className={cn("px-4 pt-3 pb-1 backdrop-blur-sm flex flex-col shrink-0 absolute bottom-0 left-0 right-0 z-40 transition-colors border-t", isDarkTheme ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white/80 border-gray-200')}>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" onClick={() => setIsSpectrumOpen(true)} style={outlineStyle} className="h-10 w-10"><Activity className="h-5 w-5" /></Button>
                            <Button variant="outline" size="icon" onClick={props.refreshRoute} style={outlineStyle} className="h-10 w-10"><RefreshCw className="h-5 w-5 text-primary" /></Button>
                        </div>

                        <div className="flex gap-1 items-center">
                            <Dialog open={isCapacityDialogOpen} onOpenChange={setIsCapacityDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" style={outlineStyle} className="h-10 w-10">
                                        <Layers className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md bg-card border-primary/20 shadow-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="font-black uppercase text-primary flex items-center gap-2">
                                            <Layers className="h-5 w-5" /> {t('dialog_capacity_title')}
                                        </DialogTitle>
                                        <DialogDescription className="text-[10px] uppercase font-bold opacity-50 tracking-widest">{t('dialog_capacity_desc')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-8 py-6">
                                        <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-4 px-2">
                                            <Label className="text-right text-[10px] font-black uppercase opacity-50">Limit</Label>
                                            <Slider
                                                value={[props.voiceLimit]}
                                                min={32}
                                                max={512}
                                                step={8}
                                                onValueChange={(v) => props.setVoiceLimit(v[0])}
                                            />
                                            <span className="text-xs w-10 text-right font-mono font-bold text-primary">{props.voiceLimit}</span>
                                        </div>
                                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                            <p className="text-[9px] text-muted-foreground uppercase leading-relaxed text-center font-bold">
                                                {t('dialog_capacity_hint')}
                                            </p>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsDarkTheme(!isDarkTheme)}
                                style={outlineStyle}
                                className="h-10 w-10"
                            >
                                {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>

                            <Dialog open={isTimerDialogOpen} onOpenChange={setIsTimerDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" style={!props.timerSettings.isActive ? outlineStyle : undefined} className={cn("h-10 w-10", props.timerSettings.isActive && "border-destructive text-destructive")}>
                                        <Timer className="h-5 w-5" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md bg-card border-primary/20 shadow-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="font-black uppercase text-primary flex items-center gap-2">
                                            <Timer className="h-5 w-5" /> {t('dialog_timer_title')}
                                        </DialogTitle>
                                        <DialogDescription className="text-[10px] uppercase font-bold opacity-50 tracking-widest">{t('dialog_timer_desc')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-8 py-6">
                                        <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-4 px-2">
                                            <Label className="text-right text-[10px] font-black uppercase opacity-50">Minutes</Label>
                                            <Slider
                                                value={[props.timerSettings.duration / 60]}
                                                min={0}
                                                max={30}
                                                step={5}
                                                onValueChange={(v) => props.handleTimerDurationChange(v[0])}
                                                disabled={props.timerSettings.isActive}
                                            />
                                            <span className="text-xs w-10 text-right font-mono font-bold text-primary">{props.timerSettings.duration / 60}</span>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                props.handleToggleTimer();
                                                if (!props.timerSettings.isActive) setIsTimerDialogOpen(false);
                                            }}
                                            disabled={props.timerSettings.duration === 0}
                                            variant={props.timerSettings.isActive ? 'destructive' : 'default'}
                                            className="w-full h-12 font-black uppercase tracking-widest text-xs shadow-lg"
                                        >
                                            {props.timerSettings.isActive ? t('btn_timer_stop') : t('btn_timer_activate')}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    <div className="text-center mt-1.5 opacity-30 pointer-events-none select-none">
                        <span className="text-[7px] font-black uppercase tracking-[0.1em]">
                            © 2026 Eugene Somov · AuraGroove - Infinite Take Orchestra
                        </span>
                    </div>
                </footer>
            </div>

            {/* Mixer & EQ */}
            <Dialog open={isStudioOpen} onOpenChange={setIsStudioOpen}>
                <DialogContent className="sm:max-w-xl bg-card border-primary/20 shadow-2xl">
                    <DialogHeader><DialogTitle className="font-black uppercase text-primary flex items-center gap-2"><Mic2 className="h-5 w-5"/> {t('dialog_mixer_title')}</DialogTitle></DialogHeader>
                    <div className="flex justify-between items-end h-48 gap-2 py-4">{MIXER_CHANNELS.map(ch => {
                        const vol = ch.key === 'master' 
                            ? (props.calibrationGains?.master ?? 1.0)
                            : (ch.key === 'drums' 
                                ? (props.drumSettings?.volume ?? 0.5) 
                                : (['sparkles','sfx'].includes(ch.key) 
                                    ? (props.textureSettings?.[ch.key as keyof TextureSettings]?.volume ?? 0.5) 
                                    : (props.instrumentSettings?.[ch.key as keyof InstrumentSettings]?.volume ?? 0.5)));
                        
                        return (
                            <div key={ch.key} className="flex flex-col items-center gap-4 flex-1 h-full group">
                                <span className="text-[8px] font-mono opacity-50">{Math.round(vol * 100)}%</span>
                                <Slider orientation="vertical" value={[vol]} max={1.0} step={0.01} onValueChange={v => props.handleVolumeChange(ch.key as any, v[0])} className="h-full" />
                                <span className={cn("text-[8px] font-black uppercase opacity-50 group-hover:text-primary", ch.key === 'master' && "text-primary opacity-100")}>{ch.label}</span>
                            </div>
                        );
                    })}</div>
                    <PresetManager 
                        title="Mixer" 
                        presets={props.mixerPresets} 
                        activeId={props.activeMixerPresetId}
                        onSave={props.saveMixerPreset} 
                        onUpdate={props.updateActiveMixerPreset}
                        onLoad={props.loadMixerPreset}
                        onDelete={props.deleteMixerPreset}
                        onReset={props.resetMixerToSystem}
                        onSetGenre={props.setMixerPresetGenre}
                        t={t}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isEqOpen} onOpenChange={setIsEqOpen}>
                <DialogContent className="sm:max-w-md bg-card border-primary/20 shadow-2xl">
                    <DialogHeader><DialogTitle className="font-black uppercase text-primary flex items-center gap-2"><Sliders className="h-5 w-5" /> {t('dialog_eq_title')}</DialogTitle></DialogHeader>
                    <div className="flex justify-around items-end pt-4 h-48">{EQ_BANDS.map((band, index) => (<div key={index} className="flex flex-col items-center justify-end space-y-2 flex-1 h-full group"><span className="text-[10px] font-mono text-muted-foreground">{props.eqSettings && props.eqSettings[index] !== undefined ? (props.eqSettings[index] > 0 ? '+' : '') + props.eqSettings[index].toFixed(1) : '0.0'}</span><Slider value={[props.eqSettings && props.eqSettings[index] !== undefined ? props.eqSettings[index] : 0]} min={-10} max={10} step={0.5} onValueChange={v => props.handleEqChange(index, v[0])} orientation="vertical" className="h-32" /><Label className="text-[10px] font-black uppercase opacity-50 group-hover:text-primary">{band.label}</Label></div>))}</div>
                    <PresetManager 
                        title="EQ" 
                        presets={props.eqPresets} 
                        activeId={props.activeEqPresetId}
                        onSave={name => props.saveEqPreset(name)} 
                        onUpdate={props.updateActiveEqPreset}
                        onLoad={id => props.loadEqPreset(id)}
                        onDelete={id => props.deleteEqPreset(id)}
                        onSetGenre={props.setEqPresetGenre}
                        t={t}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isSpectrumOpen} onOpenChange={setIsSpectrumOpen}>
                <DialogContent className="sm:max-w-2xl bg-card border-primary/20">
                    <DialogHeader><DialogTitle className="font-black uppercase text-primary">Spectrum Monitor</DialogTitle></DialogHeader>
                    <div className="h-64">
                        <SpectrumAnalyzer info={props.isPlaying ? `[DNA: ${props.currentTrackName.replace(/_/g, ' ')}] ${props.genre}/${props.mood}` : `${props.genre}/${props.mood}`} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
                <DialogContent className="w-[90vw] max-w-2xl bg-card border-primary/20 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="font-black uppercase text-primary flex items-center gap-2 pr-8">
                            <CircleHelp className="h-5 w-5" /> {t('dialog_info_title')}
                        </DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="guide" className="full">
                        <div className="px-6 flex items-center justify-between border-b border-primary/10">
                            <TabsList className="bg-transparent border-none p-0 h-10 gap-6">
                                <TabsTrigger value="guide" className="px-0 border-b-2 border-transparent data-[state=active]:border-primary rounded-none font-black uppercase text-[10px] tracking-widest bg-transparent">{t('tab_user_guide')}</TabsTrigger>
                                <TabsTrigger value="disclaimer" className="px-0 border-b-2 border-transparent data-[state=active]:border-primary rounded-none font-black uppercase text-[10px] tracking-widest bg-transparent">{t('tab_disclaimer')}</TabsTrigger>
                                <TabsTrigger value="credits" className="px-0 border-b-2 border-transparent data-[state=active]:border-primary rounded-none font-black uppercase text-[10px] tracking-widest bg-transparent">{t('tab_credits')}</TabsTrigger>
                            </TabsList>
                            <Badge variant="outline" className="hidden sm:inline-flex text-[9px] font-black uppercase border-primary/20 text-primary">{props.language}</Badge>
                        </div>
                        
                        <ScrollArea className="h-[60vh] px-4 sm:px-10 py-6">
                            <TabsContent value="guide" className="m-0 focus-visible:ring-0">
                                <div dangerouslySetInnerHTML={{ __html: props.language === 'ru' ? GUIDE_RU : GUIDE_EN }} />
                            </TabsContent>
                            <TabsContent value="disclaimer" className="m-0 focus-visible:ring-0">
                                <div dangerouslySetInnerHTML={{ __html: props.language === 'ru' ? DISCLAIMER_RU : DISCLAIMER_EN }} />
                            </TabsContent>
                            <TabsContent value="credits" className="m-0 focus-visible:ring-0">
                                <div dangerouslySetInnerHTML={{ __html: CREDITS_HTML }} />
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                    <div className="p-4 bg-muted/30 border-t border-primary/10 flex justify-between items-center px-6">
                        <span className="text-[9px] font-black uppercase opacity-40">AuraGroove v0.4.12</span>
                        <Button variant="ghost" size="sm" onClick={() => setIsInfoOpen(false)} className="text-[10px] font-black uppercase h-8 px-4">{t('btn_close')}</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}