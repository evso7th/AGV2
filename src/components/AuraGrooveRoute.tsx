
/**
 * #ЗАЧЕМ: UI AuraGroove V4.8 — "The Route Architect".
 * #ЧТО: ПЛАН №1240 — 1. Снижена чувствительность скролла. 2. Добавлен раздел сохранения маршрутов.
 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Plus, X, Shuffle, Music, Pause, Settings2, 
    Activity, Timer, ThumbsUp, Radio, TowerControl,
    Home, RefreshCw, SlidersHorizontal, ArrowUp, ArrowDown, Mic2,
    Save, FolderOpen, Trash2, Check, Navigation
} from 'lucide-react';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import type { AuraGrooveProps } from "@/hooks/use-aura-groove";
import { cn, formatTime } from "@/lib/utils";
import { SpectrumAnalyzer } from "./SpectrumAnalyzer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";

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
    { id: 'dark', label: 'Dark Ritual' },
    { id: 'epic', label: 'Epic Call' },
    { id: 'random', label: '⚡ ANY' }
];

const MIXER_CHANNELS = [
    { key: 'master', label: 'M' },
    { key: 'bass', label: 'B' },
    { key: 'melody', label: 'Mel' },
    { key: 'accompaniment', label: 'Acc' },
    { key: 'harmony', label: 'Har' },
    { key: 'pianoAccompaniment', label: 'Rh' },
    { key: 'sparkles', label: 'Sp' },
    { key: 'sfx', label: 'SFX' },
    { key: 'drums', label: 'D' }
];

function VerticalSpinner({ 
    items, 
    value, 
    onChange 
}: { 
    items: {id: string, label: string}[], 
    value: string, 
    onChange: (id: string) => void 
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemHeight = 36;
    
    const infiniteItems = React.useMemo(() => [...items, ...items, ...items, ...items, ...items], [items]);
    const middleOffset = items.length * 2 * itemHeight;

    useEffect(() => {
        if (scrollRef.current) {
            const idx = items.findIndex(i => i.id === value);
            scrollRef.current.scrollTop = middleOffset + (idx * itemHeight);
        }
    }, [items, value, middleOffset]);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const scrollTop = container.scrollTop;
        
        if (scrollTop < itemHeight * items.length) {
            container.scrollTop = scrollTop + (itemHeight * items.length * 2);
        } else if (scrollTop > itemHeight * items.length * 3) {
            container.scrollTop = scrollTop - (itemHeight * items.length * 2);
        }

        const index = Math.round(container.scrollTop / itemHeight);
        const selected = infiniteItems[index % infiniteItems.length];
        
        if (selected && selected.id !== value) {
            onChange(selected.id);
        }
    }, [value, items, infiniteItems, onChange]);

    // #ЗАЧЕМ: Снижение чувствительности скролла (ПЛАН №1240).
    const handleWheel = (e: React.WheelEvent) => {
        if (!scrollRef.current) return;
        // Демпфирование входного сигнала в 10 раз.
        scrollRef.current.scrollTop += e.deltaY * 0.1;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!scrollRef.current) return;
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            scrollRef.current.scrollTop -= itemHeight;
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            scrollRef.current.scrollTop += itemHeight;
        }
    };

    return (
        <div 
            className="relative h-72 w-full overflow-hidden group bg-background/20 outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
            onWheel={handleWheel}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-card via-transparent to-card" />
            
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto scroll-smooth snap-y snap-mandatory no-scrollbar py-[124px]"
                style={{ scrollbarWidth: 'none' }}
            >
                {infiniteItems.map((item, idx) => (
                    <div 
                        key={`${item.id}-${idx}`}
                        className={cn(
                            "h-9 flex items-center justify-center snap-center transition-all duration-300",
                            item.id === value ? "text-primary font-black text-xs scale-125" : "text-muted-foreground/20 text-[10px]"
                        )}
                    >
                        {item.label.toUpperCase()}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AuraGrooveRoute(props: AuraGrooveProps) {
    const router = useRouter();
    const [selectedGenre, setSelectedGenre] = useState<any>('ambient');
    const [selectedMood, setSelectedMood] = useState<any>('melancholic');
    const [isSpectrumOpen, setIsSpectrumOpen] = useState(false);
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const [isSystemsOpen, setIsSystemsOpen] = useState(false);
    const [isSaveRouteOpen, setIsSaveRouteOpen] = useState(false);
    const [isLoadRouteOpen, setIsLoadRouteOpen] = useState(false);
    const [routeName, setRouteName] = useState("");

    const handleAdd = () => {
        props.addToRoute(selectedGenre, selectedMood);
    };

    const handleSave = async () => {
        if (!routeName.trim()) return;
        await props.saveRoute(routeName);
        setRouteName("");
        setIsSaveRouteOpen(false);
    };

    return (
        <div className="w-full h-full flex flex-col bg-card overflow-hidden">
            <header className="p-3 border-b border-primary/10 bg-background/40">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-row items-center gap-2">
                        <Image src="/assets/icon8.jpeg" alt="AuraGroove Logo" width={32} height={32} className="rounded-full" />
                        <h1 className="text-lg font-bold text-primary tracking-tighter">AuraGroove</h1>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/aura-groove')} title="Expert Mode"><Settings2 className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsSpectrumOpen(true)}><Activity className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={props.handleGoHome}><Home className="h-5 w-5" /></Button>
                    </div>
                </div>
                
                <div className="flex items-center justify-center gap-2">
                    <Button onClick={props.handlePlayPause} disabled={props.isInitializing} className="w-[35%] h-10 font-black uppercase tracking-widest">
                        {props.isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Music className="mr-2 h-5 w-5" />}
                        {props.isPlaying ? "Pause" : "Play"}
                    </Button>
                    <Button variant={props.isBroadcastActive ? "destructive" : "outline"} onClick={props.handleToggleBroadcast} className="h-10 w-10 p-0">
                        <TowerControl className={cn("h-5 w-5", props.isBroadcastActive && "animate-pulse text-primary")} />
                    </Button>
                    <Button variant={props.isRecording ? "destructive" : "outline"} onClick={props.handleToggleRecording} className="h-10 w-10 p-0">
                        <Radio className={cn("h-5 w-5", props.isRecording && "animate-pulse")} />
                    </Button>
                    <Button variant="outline" onClick={props.handleSaveMasterpiece} disabled={!props.isPlaying} className="h-10 w-10 p-0">
                        <ThumbsUp className="h-5 w-5 text-primary" />
                    </Button>
                    <Button variant="outline" onClick={props.handleRegenerate} className="h-10 w-10 p-0">
                        <RefreshCw className={cn("h-5 w-5", props.isRegenerating && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-px bg-primary/10 border-b border-primary/10 shrink-0">
                <div className="bg-card flex flex-col">
                    <Label className="text-[8px] font-black uppercase text-center py-1 opacity-50 tracking-[0.2em]">Genre</Label>
                    <VerticalSpinner items={GENRES} value={selectedGenre} onChange={setSelectedGenre} />
                </div>
                <div className="bg-card flex flex-col">
                    <Label className="text-[8px] font-black uppercase text-center py-1 opacity-50 tracking-[0.2em]">Mood</Label>
                    <VerticalSpinner items={MOODS} value={selectedMood} onChange={setSelectedMood} />
                </div>
            </div>

            <div className="p-2 flex gap-2 bg-muted/20 shrink-0">
                <Button onClick={handleAdd} className="flex-grow font-black uppercase text-[10px] tracking-widest h-9 shadow-lg">
                    <Plus className="h-3.5 w-3.5 mr-2" /> Add to Route
                </Button>
                <div className="flex gap-1">
                    <Dialog open={isSaveRouteOpen} onOpenChange={setIsSaveRouteOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9" title="Save Route"><Save className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-primary/20">
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase text-primary">Save Current Route</DialogTitle>
                                <DialogDescription className="text-xs">Enter a name for this sequence of scenes.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Input 
                                    placeholder="e.g. Morning Meditation" 
                                    value={routeName} 
                                    onChange={(e) => setRouteName(e.target.value)}
                                    className="border-primary/10 bg-background"
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSave} className="w-full font-black uppercase tracking-widest"><Check className="mr-2 h-4 w-4" /> Save to Cloud</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isLoadRouteOpen} onOpenChange={setIsLoadRouteOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9" title="Load Route"><FolderOpen className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-primary/20 sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase text-primary">My Journeys</DialogTitle>
                                <DialogDescription className="text-xs uppercase font-bold opacity-50">Select a saved route to play.</DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-64 pr-3 mt-2">
                                <div className="space-y-2">
                                    {props.savedRoutes?.length === 0 ? (
                                        <div className="py-20 text-center opacity-30 text-[10px] font-bold uppercase tracking-widest">No saved journeys</div>
                                    ) : (
                                        props.savedRoutes?.map(saved => (
                                            <div key={saved.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 group">
                                                <div className="cursor-pointer flex-grow" onClick={() => { props.loadRoute(saved); setIsLoadRouteOpen(false); }}>
                                                    <div className="text-xs font-black uppercase">{saved.name}</div>
                                                    <div className="text-[9px] font-bold opacity-40 uppercase">{saved.items.length} scenes</div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => props.deleteSavedRoute(saved.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>

                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => props.setShuffle(!props.isShuffle)}
                        className={cn("h-9 w-9", props.isShuffle && "bg-primary/10 border-primary/40 text-primary")}
                    >
                        <Shuffle className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-grow overflow-hidden flex flex-col p-3 gap-2">
                <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-black uppercase opacity-50">Playing Route</Label>
                    <Badge variant="outline" className="text-[9px] font-mono opacity-50">{props.route.length} steps</Badge>
                </div>
                <ScrollArea className="flex-grow pr-3">
                    <div className="space-y-1.5 pb-4">
                        {props.route.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center opacity-30 text-center">
                                <Music className="h-8 w-8 mb-2 stroke-1" />
                                <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">Route is empty.<br/>Add scenes or hit Shuffle.</p>
                            </div>
                        ) : (
                            props.route.map((item, idx) => (
                                <div 
                                    key={item.id} 
                                    className={cn(
                                        "flex items-center justify-between p-2 rounded-lg border transition-all group",
                                        idx === props.activeRouteIndex && props.isPlaying ? "bg-primary/10 border-primary/40" : "bg-muted/30 border-transparent hover:border-primary/10"
                                    )}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex flex-col gap-0.5">
                                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground hover:text-primary" onClick={() => props.moveRouteItem(item.id, 'up')} disabled={idx === 0}><ArrowUp className="h-3 w-3" /></Button>
                                            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground hover:text-primary" onClick={() => props.moveRouteItem(item.id, 'down')} disabled={idx === props.route.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                                        </div>
                                        <div className="truncate">
                                            <div className="text-[11px] font-black uppercase truncate">{item.genre} / {item.mood}</div>
                                            <div className="text-[8px] font-bold opacity-40 uppercase">
                                                {idx === props.activeRouteIndex && props.isPlaying ? 'Now Flying' : 'Ready for flight'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => props.removeFromRoute(item.id)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {idx === props.activeRouteIndex && props.isPlaying && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping ml-2 shrink-0" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            <footer className="p-4 bg-background border-t border-primary/10 flex items-center justify-between gap-4 shrink-0">
                <div className="flex gap-2">
                    <Dialog open={isStudioOpen} onOpenChange={setIsStudioOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-10 w-10">
                                <SlidersHorizontal className="h-5 w-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl bg-card border-primary/20">
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase text-primary flex items-center gap-2"><Mic2 className="h-5 w-5"/> Studio Mixer</DialogTitle>
                            </DialogHeader>
                            <div className="flex justify-between items-end h-48 gap-2 py-4">
                                {MIXER_CHANNELS.map(ch => {
                                    let vol = 0.5;
                                    if (ch.key === 'master') vol = props.calibrationGains.master;
                                    else if (ch.key === 'drums') vol = props.drumSettings.volume;
                                    else if (ch.key === 'sparkles' || ch.key === 'sfx') vol = (props.textureSettings as any)[ch.key].volume;
                                    else vol = (props.instrumentSettings as any)[ch.key]?.volume ?? 0.5;

                                    return (
                                        <div key={ch.key} className="flex flex-col items-center gap-2 flex-1 h-full group">
                                            <span className="text-[8px] font-mono opacity-50">{Math.round(vol * 100)}</span>
                                            <Slider 
                                                orientation="vertical"
                                                value={[vol]}
                                                max={ch.key === 'master' ? 1.5 : 1.0}
                                                step={0.01}
                                                onValueChange={(v) => {
                                                    if(ch.key === 'master') props.handleCalibrationChange('master', v[0]);
                                                    else props.handleVolumeChange(ch.key as any, v[0]);
                                                }}
                                                className="h-full"
                                            />
                                            <span className="text-[8px] font-black uppercase opacity-50 group-hover:text-primary transition-all">{ch.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isSpectrumOpen} onOpenChange={setIsSpectrumOpen}>
                        <DialogContent className="sm:max-w-2xl bg-card border-primary/20">
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase text-primary">Spectrum Monitor</DialogTitle>
                            </DialogHeader>
                            <div className="h-64"><SpectrumAnalyzer /></div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex items-center gap-3">
                    <Dialog open={isSystemsOpen} onOpenChange={setIsSystemsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className={cn("h-10 gap-2 font-black uppercase text-[10px] tracking-widest", props.timerSettings.isActive && "border-destructive text-destructive")}>
                                <Timer className="h-4 w-4" /> 
                                {props.timerSettings.isActive ? formatTime(props.timerSettings.timeLeft) : 'Timer'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-card border-primary/20">
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase text-primary flex items-center gap-2"><Timer className="h-5 w-5"/> Sleep Station</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-6 px-2">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs font-black uppercase opacity-50">Minutes</Label>
                                        <span className="text-xl font-black text-primary font-mono">{props.timerSettings.duration / 60}m</span>
                                    </div>
                                    <Slider 
                                        value={[props.timerSettings.duration / 60]} 
                                        min={0} max={30} step={5} 
                                        onValueChange={(v) => props.handleTimerDurationChange(v[0])}
                                        disabled={props.timerSettings.isActive}
                                    />
                                </div>
                                <Button 
                                    onClick={props.handleToggleTimer} 
                                    className="w-full h-12 font-black uppercase tracking-widest"
                                    variant={props.timerSettings.isActive ? 'destructive' : 'default'}
                                >
                                    {props.timerSettings.isActive ? "ABORT TIMER" : "ACTIVATE"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </footer>
        </div>
    );
}
