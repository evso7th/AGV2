
/**
 * #ЗАЧЕМ: UI AuraGroove V5.2 — "The Navigator Ergo-Logic".
 * #ЧТО: ПЛАН №1255 — 1. Переназначение кнопок Header (Settings2 -> Mixer, Navigation -> EQ).
 *       2. Перенос доступа к Expert Mode на вкладку Samples.
 *       3. Модальные окна с поддержкой пресетов в LocalStorage.
 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Plus, X, Shuffle, Music, Pause, Settings2, 
    Activity, Timer, ThumbsUp, Radio, TowerControl,
    Home, RefreshCw, SlidersHorizontal, ArrowUp, ArrowDown, Mic2,
    Save, FolderOpen, Trash2, Check, Navigation, Sliders, Cog
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

const EQ_BANDS = [
  { freq: '60', label: '60' }, { freq: '125', label: '125' }, { freq: '250', label: '250' },
  { freq: '500', label: '500' }, { freq: '1k', label: '1k' }, { freq: '2k', label: '2k' }, { freq: '4k', label: '4k' },
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
        if (selected && selected.id !== value) onChange(selected.id);
    }, [value, items, infiniteItems, onChange]);

    const handleWheel = (e: React.WheelEvent) => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop += e.deltaY * 0.03;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!scrollRef.current) return;
        if (e.key === 'ArrowUp') { e.preventDefault(); scrollRef.current.scrollTop -= itemHeight; }
        else if (e.key === 'ArrowDown') { e.preventDefault(); scrollRef.current.scrollTop += itemHeight; }
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

function PresetManager({ 
    presets, 
    onSave, 
    onLoad, 
    onDelete, 
    title 
}: { 
    presets: PresetItem[], 
    onSave: (name: string) => void, 
    onLoad: (id: string) => void, 
    onDelete: (id: string) => void,
    title: string
}) {
    const [name, setName] = useState("");
    return (
        <div className="space-y-4 pt-4 border-t border-primary/10 mt-4">
            <Label className="text-[10px] font-black uppercase opacity-50 tracking-widest">{title} Presets</Label>
            <div className="flex gap-2">
                <Input placeholder="Preset Name" value={name} onChange={e => setName(e.target.value)} className="h-8 text-xs bg-background" />
                <Button size="sm" onClick={() => { if(name.trim()){ onSave(name); setName(""); }}} className="h-8 px-3"><Save className="h-3.5 w-3.5" /></Button>
            </div>
            <ScrollArea className="h-32">
                <div className="space-y-1">
                    {presets.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-1.5 rounded bg-muted/30 border border-transparent hover:border-primary/20 group">
                            <span className="text-[10px] font-bold uppercase cursor-pointer flex-grow" onClick={() => onLoad(p.id)}>{p.name}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => onDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
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
    const [routeName, setRouteName] = useState("");

    const handleAdd = () => props.addToRoute(selectedGenre, selectedMood);
    const handleSave = () => { if (!routeName.trim()) return; props.saveRoute(routeName); setRouteName(""); setIsSaveRouteOpen(false); };

    return (
        <div className="w-full h-full flex flex-col bg-card overflow-hidden">
            <header className="p-3 border-b border-primary/10 bg-background/40">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-row items-center gap-2">
                        <Image src="/assets/icon8.jpeg" alt="AuraGroove Logo" width={32} height={32} className="rounded-full" />
                        <h1 className="text-lg font-bold text-primary tracking-tighter">AuraGroove</h1>
                    </div>
                    <div className="flex items-center gap-1">
                        {/* #ЗАЧЕМ: ПЛАН №1255. Кнопки Header переназначены на модальные окна. */}
                        <Button variant="ghost" size="icon" onClick={() => setIsStudioOpen(true)} title="Simple Mixer"><Settings2 className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsEqOpen(true)} title="Equalizer"><Navigation className="h-5 w-5" /></Button>
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
                    <Button variant="outline" onClick={props.handleRegenerate} className="h-10 w-10 p-0"><RefreshCw className={cn("h-5 w-5", props.isRegenerating && "animate-spin")} /></Button>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-px bg-primary/10 border-b border-primary/10 shrink-0">
                <div className="bg-card flex flex-col"><Label className="text-[8px] font-black uppercase text-center py-1 opacity-50 tracking-[0.2em]">Genre</Label><VerticalSpinner items={GENRES} value={selectedGenre} onChange={setSelectedGenre} /></div>
                <div className="bg-card flex flex-col"><Label className="text-[8px] font-black uppercase text-center py-1 opacity-50 tracking-[0.2em]">Mood</Label><VerticalSpinner items={MOODS} value={selectedMood} onChange={setSelectedMood} /></div>
            </div>

            <div className="p-2 flex gap-2 bg-muted/20 shrink-0">
                <Button onClick={handleAdd} className="flex-grow font-black uppercase text-[10px] tracking-widest h-9 shadow-lg"><Plus className="h-3.5 w-3.5 mr-2" /> Add to Route</Button>
                <div className="flex gap-1">
                    <Dialog open={isSaveRouteOpen} onOpenChange={setIsSaveRouteOpen}>
                        <DialogTrigger asChild><Button variant="outline" size="icon" className="h-9 w-9" title="Save Journey"><Save className="h-4 w-4" /></Button></DialogTrigger>
                        <DialogContent className="bg-card border-primary/20"><DialogHeader><DialogTitle className="font-black uppercase text-primary">Capture Journey</DialogTitle></DialogHeader><div className="py-4"><Input placeholder="Name..." value={routeName} onChange={e => setRouteName(e.target.value)} className="bg-background" /></div><DialogFooter><Button onClick={handleSave} className="w-full font-black uppercase tracking-widest">Store Journey</Button></DialogFooter></DialogContent>
                    </Dialog>
                    <Dialog open={isLoadRouteOpen} onOpenChange={setIsLoadRouteOpen}>
                        <DialogTrigger asChild><Button variant="outline" size="icon" className="h-9 w-9" title="My Journeys"><FolderOpen className="h-4 w-4" /></Button></DialogTrigger>
                        <DialogContent className="bg-card border-primary/20"><DialogHeader><DialogTitle className="font-black uppercase text-primary">Library</DialogTitle></DialogHeader><ScrollArea className="h-64 pr-3">{props.savedRoutes?.map(saved => (<div key={saved.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:border-primary/20 border border-transparent group mb-1"><div className="cursor-pointer flex-grow" onClick={() => { props.loadRoute(saved); setIsLoadRouteOpen(false); }}><div className="text-xs font-black uppercase">{saved.name}</div><div className="text-[9px] font-bold opacity-40 uppercase">{saved.items.length} steps</div></div><Button variant="ghost" size="icon" onClick={() => props.deleteSavedRoute(saved.id)} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button></div>))}</ScrollArea></DialogContent>
                    </Dialog>
                    <Button variant="outline" size="icon" onClick={() => props.setShuffle(!props.isShuffle)} className={cn("h-9 w-9", props.isShuffle && "bg-primary/10 border-primary/40 text-primary")}><Shuffle className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="flex-grow overflow-hidden flex flex-col p-3 gap-2">
                <div className="flex items-center justify-between px-1"><Label className="text-[10px] font-black uppercase opacity-50">Current Path</Label><Badge variant="outline" className="text-[9px] font-mono opacity-50">{props.route.length} steps</Badge></div>
                <ScrollArea className="flex-grow pr-3"><div className="space-y-1.5 pb-4">{props.route.map((item, idx) => (<div key={item.id} className={cn("flex items-center justify-between p-2 rounded-lg border transition-all group", idx === props.activeRouteIndex && props.isPlaying ? "bg-primary/10 border-primary/40" : "bg-muted/30 border-transparent")}><div className="flex items-center gap-3 overflow-hidden"><div className="flex flex-col gap-0.5"><Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground" onClick={() => props.moveRouteItem(item.id, 'up')} disabled={idx === 0}><ArrowUp className="h-3 w-3" /></Button><Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground" onClick={() => props.moveRouteItem(item.id, 'down')} disabled={idx === props.route.length - 1}><ArrowDown className="h-3 w-3" /></Button></div><div className="truncate"><div className="text-[11px] font-black uppercase">{item.genre} / {item.mood}</div></div></div><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => props.removeFromRoute(item.id)}><X className="h-4 w-4" /></Button></div>))}</div></ScrollArea>
            </div>

            <footer className="p-4 bg-background border-t border-primary/10 flex items-center justify-between shrink-0">
                <Button variant="outline" size="icon" onClick={() => setIsSpectrumOpen(true)} className="h-10 w-10" title="Spectrum Monitor"><Activity className="h-5 w-5" /></Button>
                
                {/* #ЗАЧЕМ: Кнопка перехода в Expert Mode спрятана здесь, как вы и просили. */}
                <Button variant="ghost" size="icon" onClick={() => router.push('/aura-groove')} className="h-10 w-10 opacity-20 hover:opacity-100 transition-opacity" title="Expert System"><Cog className="h-4 w-4" /></Button>

                <Button variant="outline" className={cn("h-10 gap-2 font-black uppercase text-[10px] tracking-widest", props.timerSettings.isActive && "border-destructive text-destructive")} onClick={() => props.handleToggleTimer()}>
                    <Timer className="h-4 w-4" /> {props.timerSettings.isActive ? formatTime(props.timerSettings.timeLeft) : 'Timer'}
                </Button>
            </footer>

            <Dialog open={isStudioOpen} onOpenChange={setIsStudioOpen}>
                <DialogContent className="sm:max-w-xl bg-card border-primary/20 shadow-2xl">
                    <DialogHeader><DialogTitle className="font-black uppercase text-primary flex items-center gap-2"><Mic2 className="h-5 w-5"/> Studio Mixer</DialogTitle></DialogHeader>
                    <div className="flex justify-between items-end h-48 gap-2 py-4">{MIXER_CHANNELS.map(ch => {
                        const vol = ch.key === 'master' ? props.calibrationGains.master : (ch.key === 'drums' ? props.drumSettings.volume : (['sparkles','sfx'].includes(ch.key) ? (props.textureSettings as any)[ch.key].volume : (props.instrumentSettings as any)[ch.key]?.volume ?? 0.5));
                        return (<div key={ch.key} className="flex flex-col items-center gap-2 flex-1 h-full group"><span className="text-[8px] font-mono opacity-50">{Math.round(vol * 100)}</span><Slider orientation="vertical" value={[vol]} max={ch.key === 'master' ? 1.5 : 1.0} step={0.01} onValueChange={v => { if(ch.key === 'master') props.handleCalibrationChange('master', v[0]); else props.handleVolumeChange(ch.key as any, v[0]); }} className="h-full" /><span className="text-[8px] font-black uppercase opacity-50 group-hover:text-primary">{ch.label}</span></div>);
                    })}</div>
                    <PresetManager title="Mixer" presets={props.mixerPresets} onSave={props.saveMixerPreset} onLoad={props.loadMixerPreset} onDelete={props.deleteMixerPreset} />
                </DialogContent>
            </Dialog>

            <Dialog open={isEqOpen} onOpenChange={setIsEqOpen}>
                <DialogContent className="sm:max-w-md bg-card border-primary/20 shadow-2xl">
                    <DialogHeader><DialogTitle className="font-black uppercase text-primary flex items-center gap-2"><Sliders className="h-5 w-5" /> Equalizer</DialogTitle></DialogHeader>
                    <div className="flex justify-around items-end pt-4 h-48">{EQ_BANDS.map((band, index) => (<div key={index} className="flex flex-col items-center justify-end space-y-2 flex-1 h-full group"><span className="text-[10px] font-mono text-muted-foreground">{props.eqSettings[index] > 0 ? '+' : ''}{props.eqSettings[index].toFixed(1)}</span><Slider value={[props.eqSettings[index]]} min={-10} max={10} step={0.5} onValueChange={v => props.handleEqChange(index, v[0])} orientation="vertical" className="h-32" /><Label className="text-[10px] font-black uppercase opacity-50 group-hover:text-primary">{band.label}</Label></div>))}</div>
                    <PresetManager title="EQ" presets={props.eqPresets} onSave={props.saveEqPreset} onLoad={props.loadEqPreset} onDelete={props.deleteEqPreset} />
                </DialogContent>
            </Dialog>

            <Dialog open={isSpectrumOpen} onOpenChange={setIsSpectrumOpen}>
                <DialogContent className="sm:max-w-2xl bg-card border-primary/20"><DialogHeader><DialogTitle className="font-black uppercase text-primary">Spectrum Monitor</DialogTitle></DialogHeader><div className="h-64"><SpectrumAnalyzer /></div></DialogContent>
            </Dialog>
        </div>
    );
}
