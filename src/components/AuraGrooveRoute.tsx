
/**
 * #ЗАЧЕМ: UI AuraGroove V4.1 — "The Navigator".
 * #ЧТО: ПЛАН №1215 — Простой интерфейс с маршрутами и вертикальными колесами.
 * #ОБНОВЛЕНО: Исправлен импорт Label.
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
    Plus, X, Shuffle, Repeat, Music, Pause, Play, Settings2, 
    ChevronUp, ChevronDown, Activity, Timer, ThumbsUp, Radio, TowerControl
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const itemHeight = 40; 
        const scrollTop = container.scrollTop;
        const index = Math.round(scrollTop / itemHeight);
        const selected = items[index % items.length];
        if (selected && selected.id !== value) {
            onChange(selected.id);
        }
    };

    return (
        <div className="relative h-40 w-full overflow-hidden group">
            {/* Overlay gradient mask */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-card via-transparent to-card opacity-90" />
            <div className="absolute top-[40px] left-0 right-0 h-[40px] border-y border-primary/20 z-0 pointer-events-none" />
            
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto scroll-smooth snap-y snap-mandatory no-scrollbar py-[40px]"
                style={{ scrollbarWidth: 'none' }}
            >
                {/* Loop items for infinite feel */}
                {[...items, ...items, ...items].map((item, idx) => (
                    <div 
                        key={`${item.id}-${idx}`}
                        className={cn(
                            "h-10 flex items-center justify-center snap-center transition-all duration-300",
                            item.id === value ? "text-primary font-black text-sm scale-110" : "text-muted-foreground/40 text-xs"
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
    const [selectedGenre, setSelectedGenre] = useState<any>('ambient');
    const [selectedMood, setSelectedMood] = useState<any>('melancholic');
    const [isSpectrumOpen, setIsSpectrumOpen] = useState(false);

    const handleAdd = () => {
        props.addToRoute(selectedGenre, selectedMood);
    };

    return (
        <div className="w-full h-full flex flex-col bg-card overflow-hidden">
            {/* Header: Core Status */}
            <header className="p-4 border-b border-primary/10 flex items-center justify-between bg-background/20">
                <div className="flex items-center gap-3">
                    <TowerControl className={cn("h-6 w-6", props.isPlaying ? "text-primary animate-pulse" : "text-muted-foreground")} />
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-tighter">Navigator Mode</h2>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                            {props.isPlaying ? `Playing: ${props.genre} / ${props.mood}` : 'Ready for flight'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => props.setShowAdvancedUI(true)} className="h-8 w-8">
                        <Settings2 className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* Wheels Section */}
            <div className="grid grid-cols-2 gap-px bg-primary/10 border-b border-primary/10">
                <div className="bg-card flex flex-col">
                    <Label className="text-[9px] font-black uppercase text-center py-1 opacity-50 tracking-widest">Select Genre</Label>
                    <VerticalSpinner items={GENRES} value={selectedGenre} onChange={setSelectedGenre} />
                </div>
                <div className="bg-card flex flex-col">
                    <Label className="text-[9px] font-black uppercase text-center py-1 opacity-50 tracking-widest">Select Mood</Label>
                    <VerticalSpinner items={MOODS} value={selectedMood} onChange={setSelectedMood} />
                </div>
            </div>

            {/* Interaction Bar */}
            <div className="p-2 flex gap-2 bg-muted/20">
                <Button onClick={handleAdd} className="flex-grow font-black uppercase text-[10px] tracking-widest h-9 shadow-lg">
                    <Plus className="h-3.5 w-3.5 mr-2" /> Add to Route
                </Button>
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => props.setShuffle(!props.isShuffle)}
                    className={cn("h-9 w-9", props.isShuffle && "bg-primary/10 border-primary/40 text-primary")}
                >
                    <Shuffle className="h-4 w-4" />
                </Button>
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => props.setRepeat(!props.isRepeat)}
                    className={cn("h-9 w-9", props.isRepeat && "bg-primary/10 border-primary/40 text-primary")}
                >
                    <Repeat className="h-4 w-4" />
                </Button>
            </div>

            {/* Route List */}
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
                                        <div className="w-4 text-[10px] font-mono opacity-30 font-black">{idx + 1}</div>
                                        <div className="truncate">
                                            <div className="text-[11px] font-black uppercase truncate">{item.genre} / {item.mood}</div>
                                            <div className="text-[8px] font-bold opacity-40 uppercase">Ready for restauration</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => props.removeFromRoute(item.id)}>
                                            <X className="h-3.5 w-3.5" />
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

            {/* Compact Mixer */}
            <div className="p-3 bg-muted/10 border-t border-primary/10">
                <div className="flex justify-between items-end h-28 gap-1.5">
                    {MIXER_CHANNELS.map(ch => {
                        let vol = 0.5;
                        if (ch.key === 'master') vol = props.calibrationGains.master;
                        else if (ch.key === 'drums') vol = props.drumSettings.volume;
                        else if (ch.key === 'sparkles' || ch.key === 'sfx') vol = (props.textureSettings as any)[ch.key].volume;
                        else vol = (props.instrumentSettings as any)[ch.key]?.volume ?? 0.5;

                        return (
                            <div key={ch.key} className="flex flex-col items-center gap-1 flex-1 h-full group">
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
                                <span className="text-[8px] font-black uppercase opacity-50 group-hover:text-primary group-hover:opacity-100 transition-all">{ch.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Controls */}
            <footer className="p-4 bg-background border-t border-primary/10 flex items-center justify-between gap-4">
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => props.handleToggleBroadcast()} className={cn("h-10 w-10", props.isBroadcastActive && "text-primary border-primary/40")}>
                        <Radio className="h-5 w-5" />
                    </Button>
                    <Dialog open={isSpectrumOpen} onOpenChange={setIsSpectrumOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-10 w-10">
                                <Activity className={cn("h-5 w-5", props.isPlaying && "text-primary animate-pulse")} />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl bg-card border-primary/20">
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase text-primary">Spectrum Monitor</DialogTitle>
                            </DialogHeader>
                            <div className="h-64"><SpectrumAnalyzer /></div>
                        </DialogContent>
                    </Dialog>
                </div>

                <Button 
                    onClick={props.handlePlayPause} 
                    disabled={props.isInitializing}
                    className="flex-grow h-12 text-sm font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-transform"
                >
                    {props.isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                    {props.isPlaying ? "PAUSE MISSION" : "START VOYAGE"}
                </Button>

                <div className="flex flex-col items-end gap-1">
                    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={props.handleToggleTimer}>
                        <Timer className={cn("h-5 w-5", props.timerSettings.isActive && "text-destructive animate-pulse")} />
                    </Button>
                    {props.timerSettings.isActive && <span className="text-[8px] font-mono font-black">{formatTime(props.timerSettings.timeLeft)}</span>}
                </div>
            </footer>
        </div>
    );
}
