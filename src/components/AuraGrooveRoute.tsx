
/**
 * #ЗАЧЕМ: UI AuraGroove V7.9 — "Syntax & DND Fix".
 * #ЧТО: ПЛАН №1185 — Исправление критической ошибки Unexpected token div.
 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Plus, X, Shuffle, Music, Pause, Settings2,
    Activity, Timer, ThumbsUp, Radio, TowerControl,
    Home, RefreshCw, SlidersHorizontal, ArrowUp, ArrowDown, Mic2,
    Save, FolderOpen, Trash2, Check, Navigation, Sliders, Cog,
    GripVertical, Zap, Dna, SaveAll, RotateCcw, Layers, Repeat, Moon, Sun, Sparkles, DownloadCloud
} from 'lucide-react';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import type { AuraGrooveProps, PresetItem } from "@/hooks/use-aura-groove";
import type { RouteItem } from "@/types/music";
import { cn, formatTime } from "@/lib/utils";
import { SpectrumAnalyzer } from "./SpectrumAnalyzer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";

// DND Kit Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const GENRES = [
    { id: 'ambient', label: 'Deep Ambient' },
    { id: 'psybient', label: 'Neuro Space' },
    { id: 'blues', label: "Cafe's Blues" },
    { id: 'reggae', label: 'Root Reggey' },
    { id: 'random', label: '⚡ SURPRISE' }
];

const MOODS = [
    { id: 'melancholic', label: 'Melancholic' },
    { id: 'dreamy', label: 'Dreamy' },
    { id: 'calm', label: 'Calm' },
    { id: 'joyful', label: 'Joyful' },
    { id: 'random', label: '⚡ ANY' }
];

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

function SimpleVerticalList({ 
    items, 
    value, 
    onChange 
}: { 
    items: {id: string, label: string}[], 
    value: string, 
    onChange: (id: string) => void 
}) {
    return (
        <ScrollArea className="flex-grow w-full bg-background/10 border-r border-primary/5 last:border-r-0">
            <div className="flex flex-col p-1 gap-1">
                {items.map((item) => {
                    const isActive = item.id === value;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onChange(item.id)}
                            className={cn(
                                "flex items-center justify-center h-8 px-2 rounded-md transition-all text-[10px] font-black uppercase tracking-tight",
                                isActive 
                                    ? "bg-primary text-primary-foreground shadow-md scale-[0.98]" 
                                    : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </ScrollArea>
    );
}

const BIND_GENRES = GENRES.filter(g => g.id !== 'random');

function PresetManager({
    presets,
    activeId,
    onSave,
    onUpdate,
    onLoad,
    onDelete,
    title,
    onReset,
    onSetGenre
}: {
    presets: PresetItem[],
    activeId: string | null,
    onSave: (name: string) => void,
    onUpdate?: () => void,
    onLoad: (id: string) => void,
    onDelete: (id: string) => void,
    title: string,
    onReset?: () => void,
    onSetGenre?: (id: string, genre: string) => void
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
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onReset} title="Reset to System">
                            <RotateCcw className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>
            
            {/* #ЗАЧЕМ: адаптив — на мобильном инпут сверху, кнопки рядом снизу; на sm+ одна строка. */}
            <div className="flex flex-col sm:flex-row gap-2">
                <Input placeholder="New preset name…" value={name} onChange={e => setName(e.target.value)} className="h-8 text-xs bg-background w-full sm:flex-1 min-w-0" />
                <div className="flex gap-2">
                    {/* подпись + disabled-аффорданс — кнопка явно «создать новый из имени» */}
                    <Button
                        size="sm"
                        disabled={!name.trim()}
                        onClick={() => { if (name.trim()) { onSave(name); setName(""); } }}
                        className="h-8 px-3 gap-1.5 font-black uppercase text-[10px] flex-1 sm:flex-none"
                        title="Create a new preset from the entered name"
                    >
                        <Save className="h-3.5 w-3.5" />
                        Save New
                    </Button>
                    {activeId && onUpdate && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={onUpdate}
                            className="h-8 px-3 gap-1.5 font-black uppercase text-[10px] flex-1 sm:flex-none"
                            title={`Overwrite loaded preset "${activePreset?.name ?? ''}"`}
                        >
                            <SaveAll className="h-3.5 w-3.5" />
                            Save Changes
                        </Button>
                    )}
                </div>
            </div>
            
            <ScrollArea className="h-32">
                <div className="space-y-1">
                    {presets.map(p => (
                        <div key={p.id} className={cn(
                            "flex items-center justify-between p-1.5 rounded border transition-all group",
                            p.id === activeId ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-transparent hover:border-primary/20"
                        )}>
                            <span className="text-[10px] font-bold uppercase cursor-pointer flex-grow truncate min-w-0" onClick={() => onLoad(p.id)}>{p.name}</span>
                            {onSetGenre && (
                                <select
                                    value={p.genre || ''}
                                    onChange={e => onSetGenre(p.id, e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                    title="Bind to genre (auto-applied on genre change)"
                                    className="h-7 mr-1 rounded bg-background border border-primary/20 text-[9px] font-bold uppercase px-1 w-[74px] shrink-0"
                                >
                                    <option value="">— genre —</option>
                                    {BIND_GENRES.map(g => (
                                        <option key={g.id} value={g.id}>{g.label}</option>
                                    ))}
                                </select>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => onDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

function SortableRouteItem({
    item,
    isActive,
    progress,
    onRemove,
    onSelect,
    isDarkTheme
}: {
    item: RouteItem,
    isActive: boolean,
    progress?: number,
    onRemove: (id: string) => void,
    onSelect: (id: string) => void,
    isDarkTheme: boolean
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                ...(!isDarkTheme && !isDragging
                    ? isActive
                        ? { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6', color: '#1F2937' }
                        : { backgroundColor: '#FFFFFF', borderColor: '#D1D5DB', color: '#1F2937' }
                    : {})
            }}
            onClick={() => !isActive && onSelect(item.id)}
            className={cn(
                "flex items-center justify-between p-2 rounded-lg border transition-all group relative overflow-hidden cursor-pointer",
                isActive ? "bg-primary/10 border-primary/40 shadow-inner" : "bg-muted/30 border-transparent hover:border-primary/20",
                isDragging && "opacity-50 z-50 scale-105 shadow-2xl ring-2 ring-primary/50"
            )}
        >
            {isActive && progress !== undefined && (
                <div
                    className="absolute bottom-0 left-0 h-[2px] w-full bg-primary/20"
                    style={!isDarkTheme ? { backgroundColor: '#DDD6FE' } : undefined}
                >
                    <div
                        className="h-full bg-primary transition-all duration-1000 ease-linear"
                        style={{
                            width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                            ...(!isDarkTheme ? { backgroundColor: '#5B21B6' } : {})
                        }}
                    />
                </div>
            )}

            <div className="flex items-center gap-3 overflow-hidden z-10 pointer-events-none">
                <div 
                    {...attributes} 
                    {...listeners} 
                    onClick={(e) => e.stopPropagation()} 
                    className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-primary transition-colors touch-none pointer-events-auto"
                >
                    <GripVertical className="h-4 w-4" />
                </div>
                <div className="truncate">
                    <div className="text-[11px] font-black uppercase tracking-tight">
                        {item.genre} / {item.mood}
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
    const router = useRouter();
    const [selectedGenre, setSelectedGenre] = useState<any>('ambient');
    const [selectedMood, setSelectedMood] = useState<any>('melancholic');
    const [isSpectrumOpen, setIsSpectrumOpen] = useState(false);
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const [isEqOpen, setIsEqOpen] = useState(false);
    const [isSaveRouteOpen, setIsSaveRouteOpen] = useState(false);
    const [isLoadRouteOpen, setIsLoadRouteOpen] = useState(false);
    const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);
    const [isCapacityDialogOpen, setIsCapacityDialogOpen] = useState(false);
    const [routeName, setRouteName] = useState("");
    const [isDarkTheme, setIsDarkTheme] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor, { 
            activationConstraint: { 
                distance: 8 
            } 
        }),
        useSensor(TouchSensor, { 
            activationConstraint: { 
                delay: 250, 
                tolerance: 5 
            } 
        }),
        useSensor(KeyboardSensor, { 
            coordinateGetter: sortableKeyboardCoordinates 
        })
    );

    const handleAdd = () => props.addToRoute(selectedGenre, selectedMood);
    const handleSave = () => { if (!routeName.trim()) return; props.saveRoute(routeName); setRouteName(""); setIsSaveRouteOpen(false); };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            props.reorderRoute(active.id as string, over.id as string);
        }
    };

    const bgClass = isDarkTheme ? 'bg-neutral-950' : 'bg-white';
    const textClass = isDarkTheme ? 'text-neutral-100' : 'text-gray-900';
    const borderClass = isDarkTheme ? 'border-neutral-800' : 'border-gray-200';
    const headerBgClass = isDarkTheme ? 'bg-neutral-900/80' : 'bg-gray-50/80';
    const buttonBgClass = isDarkTheme
        ? 'bg-violet-600 hover:bg-violet-500 text-white'
        : 'bg-violet-600 hover:bg-violet-700 text-white';
    const outlineStyle = !isDarkTheme
        ? { backgroundColor: '#FFFFFF', color: '#1F2937', borderColor: '#D1D5DB', borderWidth: '1px' }
        : undefined;

    return (
        <div className={cn("w-full h-full flex flex-col overflow-hidden transition-colors duration-200", bgClass, textClass)}>
            {/* TOP: Header + Selectors — natural height */}
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
                        <Button 
                            onClick={props.handlePlayPause} 
                            disabled={props.isInitializing} 
                            className="h-8 px-4 text-[10px] font-black uppercase tracking-tight shadow-md"
                        >
                            {props.isPlaying ? <Pause className="mr-1.5 h-4 w-4" /> : <Music className="mr-1.5 h-4 w-4" />}
                            {props.isPlaying ? "Pause" : "Play"}
                        </Button>
                    </div>
                    
                    <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={props.handleGoHome} className="h-8 w-8 shrink-0"><Home className="h-4 w-4" /></Button>
                            <Button variant="outline" onClick={props.handleToggleBroadcast} style={outlineStyle} className="h-8 w-8 p-0 shrink-0">
                                <TowerControl className={cn("h-4 w-4", props.isBroadcastActive && "animate-pulse text-primary")} />
                            </Button>
                            <Button variant="outline" onClick={props.handleToggleRecording} style={outlineStyle} className="h-8 w-8 p-0 shrink-0">
                                <Radio className={cn("h-4 w-4", props.isRecording && "animate-pulse")} />
                            </Button>
                            <Button variant="outline" onClick={props.handleSaveMasterpiece} disabled={!props.isPlaying} style={outlineStyle} className="h-8 w-8 p-0 shrink-0" title="Like">
                                <ThumbsUp className="h-4 w-4 text-primary" />
                            </Button>
                            <Button variant="outline" onClick={props.handleRegenerate} style={outlineStyle} className="h-8 w-8 p-0 shrink-0">
                                <RefreshCw className={cn("h-4 w-4", props.isRegenerating && "animate-spin")} />
                            </Button>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setIsEqOpen(true)} className="h-8 w-8 text-xs font-black shrink-0">EQ</Button>
                            <Button variant="ghost" size="icon" onClick={() => setIsStudioOpen(true)} className="h-8 w-8 shrink-0"><Settings2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col">
                    <div className="px-3 py-2 flex-shrink-0">
                        <Label className="text-[10px] font-black uppercase opacity-60 tracking-wider">Genre</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {GENRES.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedGenre(item.id)}
                                    style={
                                        selectedGenre === item.id
                                            ? {}
                                            : !isDarkTheme
                                            ? { backgroundColor: '#FFFFFF', color: '#1F2937', borderColor: '#D1D5DB', borderWidth: '1px' }
                                            : {}
                                    }
                                    className={cn(
                                        "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tight transition-all border",
                                        selectedGenre === item.id
                                            ? "bg-violet-600 text-white shadow-md"
                                            : isDarkTheme
                                            ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700"
                                            : "hover:bg-gray-50"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="px-3 py-2 flex-shrink-0">
                        <Label className="text-[10px] font-black uppercase opacity-60 tracking-wider">Mood</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {MOODS.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedMood(item.id)}
                                    style={
                                        selectedMood === item.id
                                            ? {}
                                            : !isDarkTheme
                                            ? { backgroundColor: '#FFFFFF', color: '#1F2937', borderColor: '#D1D5DB', borderWidth: '1px' }
                                            : {}
                                    }
                                    className={cn(
                                        "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tight transition-all border",
                                        selectedMood === item.id
                                            ? "bg-violet-600 text-white shadow-md"
                                            : isDarkTheme
                                            ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700"
                                            : "hover:bg-gray-50"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM: Controls + Path List + Footer — fills remaining space */}
            <div className={cn("flex-1 min-h-0 flex flex-col relative overflow-hidden transition-colors", isDarkTheme ? 'bg-neutral-900' : 'bg-gray-50')}>
                <div className={cn("p-2 flex gap-2 shrink-0 transition-colors", isDarkTheme ? 'bg-neutral-800/50' : 'bg-gray-100/50')}>
                    <Button onClick={handleAdd} className="flex-grow font-black uppercase text-[10px] tracking-widest h-10 shadow-lg"><Plus className="h-4 w-4 mr-2" /> Add to Route</Button>
                    <div className="flex gap-1">
                        <Dialog open={isSaveRouteOpen} onOpenChange={setIsSaveRouteOpen}>
                            <DialogTrigger asChild><Button variant="outline" size="icon" style={outlineStyle} className="h-10 w-10"><Save className="h-4 w-4" /></Button></DialogTrigger>
                            <DialogContent className="bg-card border-primary/20"><DialogHeader><DialogTitle className="font-black uppercase text-primary">Capture Journey</DialogTitle></DialogHeader><div className="py-4"><Input placeholder="Name..." value={routeName} onChange={e => setRouteName(e.target.value)} className="bg-background" /></div><DialogFooter><Button onClick={handleSave} className="w-full font-black uppercase tracking-widest">Store Journey</Button></DialogFooter></DialogContent>
                        </Dialog>
                        <Dialog open={isLoadRouteOpen} onOpenChange={setIsLoadRouteOpen}>
                            <DialogTrigger asChild><Button variant="outline" size="icon" style={outlineStyle} className="h-10 w-10"><FolderOpen className="h-4 w-4" /></Button></DialogTrigger>
                            <DialogContent className="bg-card border-primary/20"><DialogHeader><DialogTitle className="font-black uppercase text-primary">Library</DialogTitle></DialogHeader><ScrollArea className="h-64 pr-3">{props.savedRoutes?.map(saved => (<div key={saved.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:border-primary/20 border border-transparent group mb-1"><div className="cursor-pointer flex-grow" onClick={() => { props.loadRoute(saved); setIsLoadRouteOpen(false); }}><div className="text-xs font-black uppercase">{saved.name}</div><div className="text-[9px] font-bold opacity-40 uppercase">{saved.items.length} steps</div></div><Button variant="ghost" size="icon" onClick={() => props.deleteSavedRoute(saved.id)} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button></div>))}</ScrollArea></DialogContent>
                        </Dialog>
                        <Button variant="outline" size="icon" onClick={() => props.setShuffle(!props.isShuffle)} style={outlineStyle} className="h-10 w-10" title="Shuffle">
                            <Shuffle className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => props.syncDna()} style={outlineStyle} className="h-10 w-10" title="Sync DNA — refresh Heritage from cloud">
                            <DownloadCloud className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col p-3 pt-1 gap-2">
                    <div className="flex items-center justify-between px-1 shrink-0"><Label className="text-[10px] font-black uppercase opacity-50">Current Path</Label><Badge variant="outline" className="text-[9px] font-mono opacity-50">{props.route.length} steps</Badge></div>
                    <ScrollArea className="flex-grow pr-3">
                        <div className="space-y-1.5 pb-24">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={props.route.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                    {props.route.map((item, idx) => {
                                        const isActive = idx === props.activeRouteIndex && props.isPlaying;
                                        const progress = isActive ? (props.currentBar / (props.totalBars || 1)) : 0;
                                        return (
                                            <SortableRouteItem
                                                key={item.id}
                                                item={item}
                                                isActive={isActive}
                                                progress={progress}
                                                onRemove={props.removeFromRoute}
                                                onSelect={props.selectRouteItem}
                                                isDarkTheme={isDarkTheme}
                                            />
                                        );
                                    })}
                                </SortableContext>
                            </DndContext>
                            {props.route.length === 0 && (
                                <div className={cn("py-10 text-center flex flex-col items-center gap-3 rounded-lg mx-4", isDarkTheme ? 'bg-neutral-800/50' : 'bg-gray-100/50')}>
                                    <Sparkles className={cn("h-10 w-10 animate-pulse", isDarkTheme ? 'text-violet-500' : 'text-violet-400')} />
                                    <div>
                                        <p className={cn("text-[11px] font-black uppercase tracking-widest mb-1", isDarkTheme ? 'text-neutral-300' : 'text-gray-600')}>No journey yet</p>
                                        <p className={cn("text-[9px] uppercase tracking-wide leading-relaxed", isDarkTheme ? 'text-neutral-500' : 'text-gray-500')}>
                                            Pick a genre and mood<br />then tap <span className="font-black">+ Add to Route</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <footer className={cn("p-4 backdrop-blur-sm flex items-center justify-between shrink-0 absolute bottom-0 left-0 right-0 z-40 transition-colors border-t", isDarkTheme ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white/80 border-gray-200')}>
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" onClick={() => setIsSpectrumOpen(true)} style={outlineStyle} className="h-10 w-10" title="Spectrum"><Activity className="h-5 w-5" /></Button>
                        <Button variant="outline" size="icon" onClick={props.refreshRoute} style={outlineStyle} className="h-10 w-10" title="Refresh Path"><RefreshCw className="h-5 w-5 text-primary" /></Button>
                        <Button
                            variant={props.useHeritage ? "default" : "outline"}
                            size="icon"
                            onClick={() => props.setUseHeritage(!props.useHeritage)}
                            style={!props.useHeritage ? outlineStyle : undefined}
                            className={cn("h-10 w-10", !props.useHeritage && "opacity-40")}
                            title={props.useHeritage ? "DNA Active" : "DNA Off"}
                        >
                            <Dna className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex gap-1 items-center">
                        <Dialog open={isCapacityDialogOpen} onOpenChange={setIsCapacityDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" style={outlineStyle} className="h-10 w-10" title="Voice Limit">
                                    <Layers className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-card border-primary/20 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="font-black uppercase text-primary flex items-center gap-2">
                                        <Layers className="h-5 w-5" /> Polyphony Control
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Global active voice limit</DialogDescription>
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
                                            Lower limit saves CPU on mobile. Higher limit provides richer tails.
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
                            title={isDarkTheme ? 'Light mode' : 'Dark mode'}
                        >
                            {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>

                        <Dialog open={isTimerDialogOpen} onOpenChange={setIsTimerDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" style={!props.timerSettings.isActive ? outlineStyle : undefined} className={cn("h-10 w-10", props.timerSettings.isActive && "border-destructive text-destructive")} title="Timer">
                                    <Timer className="h-5 w-5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-card border-primary/20 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="font-black uppercase text-primary flex items-center gap-2">
                                        <Timer className="h-5 w-5" /> Sleep Timer
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Set session duration</DialogDescription>
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
                                        {props.timerSettings.isActive ? `Stop Timer` : 'Activate Timer'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </footer>
            </div>

            {/* Modals */}
            <Dialog open={isStudioOpen} onOpenChange={setIsStudioOpen}>
                <DialogContent className="sm:max-w-xl bg-card border-primary/20 shadow-2xl">
                    <DialogHeader><DialogTitle className="font-black uppercase text-primary flex items-center gap-2"><Mic2 className="h-5 w-5"/> Studio Mixer</DialogTitle></DialogHeader>
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
                                <span className="text-[8px] font-mono opacity-50">{Math.round(vol * 100)}</span>
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
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isEqOpen} onOpenChange={setIsEqOpen}>
                <DialogContent className="sm:max-w-md bg-card border-primary/20 shadow-2xl">
                    <DialogHeader><DialogTitle className="font-black uppercase text-primary flex items-center gap-2"><Sliders className="h-5 w-5" /> Equalizer</DialogTitle></DialogHeader>
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
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isSpectrumOpen} onOpenChange={setIsSpectrumOpen}>
                <DialogContent className="sm:max-w-2xl bg-card border-primary/20"><DialogHeader><DialogTitle className="font-black uppercase text-primary">Spectrum Monitor</DialogTitle></DialogHeader><div className="h-64"><SpectrumAnalyzer /></div></DialogContent>
            </Dialog>
        </div>
    );
}
