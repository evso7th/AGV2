/**
 * @fileOverview UI AuraGroove V5.2 — "Unified Master Control".
 * #ЗАЧЕМ: ПЛАН №1181. Добавление мастер-канала в Expert UI Mixer.
 */
'use client';

import { useState, useEffect } from "react";
import {
  Music, Pause, Speaker, FileMusic, Drum, Atom, Piano, Home,
  Sparkles, Sprout, Timer, RefreshCw, Bot, Waves, Radio,
  ThumbsUp, TowerControl, Database, Filter, Check, RotateCcw,
  Search, Eye, EyeOff, SlidersHorizontal, Cog, GitBranch, LayoutGrid, X,
  Guitar, Lock, Dna, Settings2, Mic2, Activity, Navigation, Volume2, Moon, Sun
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AuraGrooveProps } from "@/hooks/use-aura-groove";
import { useRouter } from "next/navigation";
import { formatTime, cn } from "@/lib/utils";
import type { Mood, Genre, InstrumentPart } from '@/types/music';
import { V2_PRESETS } from "@/lib/presets-v2";
import { BASS_PRESET_INFO } from "@/lib/bass-presets";
import { SpectrumAnalyzer } from "@/components/SpectrumAnalyzer";
import { THEME_COLORS, type ThemeMode } from "@/lib/theme-colors";

// ───── CONSTANTS ─────

const EQ_BANDS = [
  { freq: '60', label: '60' }, { freq: '125', label: '125' }, { freq: '250', label: '250' },
  { freq: '500', label: '500' }, { freq: '1k', label: '1k' }, { freq: '2k', label: '2k' }, { freq: '4k', label: '4k' },
];

const CALIBRATION_CHANNELS = [
    { key: 'master', label: 'Master Gain', color: 'text-primary' },
    { key: 'acoustic', label: 'Black Acoustic', color: 'text-orange-400' },
    { key: 'electric', label: 'Telecaster', color: 'text-blue-400' },
    { key: 'piano', label: 'Rhodes', color: 'text-yellow-200' },
    { key: 'orchestral', label: 'Violin & Flute', color: 'text-purple-400' },
    { key: 'cs80', label: 'CS80', color: 'text-cyan-400' },
    { key: 'chords', label: 'Guitar Chords', color: 'text-green-400' },
    { key: 'bass', label: 'Bass', color: 'text-red-400' }
];

const MOOD_CATEGORIES: Record<Mood, 'light' | 'neutral' | 'dark'> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

const MOOD_COLOR_CLASSES = {
  light: 'text-primary',
  neutral: 'text-primary/75',
  dark: 'text-primary/50',
};

const AVAILABLE_GENRES: Genre[] = ['psybient', 'ambient', 'progressive', 'rock', 'house', 'rnb', 'ballad', 'reggae', 'blues', 'celtic'];
const AVAILABLE_MOODS: Mood[] = ['epic', 'joyful', 'enthusiastic', 'melancholic', 'dark', 'anxious', 'dreamy', 'contemplative', 'calm', 'gloomy'];

const DISPLAY_NAMES: Record<string, string> = {
    'genre_ambient': 'Slow Fusion',
    'ambient': 'Slow Fusion',
    'guitar': 'Dynamic Guitar',
    'telecaster': 'Telecaster Clean',
    'blackAcoustic': 'Black Acoustic',
    'darkTelecaster': 'Dark Telecaster',
    'cs80': 'CS-80 / Vangelis',
    'guitar_shineOn': 'Shine On Lead',
    'guitar_muffLead': 'Muff Lead',
    'reggae_guitar': 'Roots Skank Guitar',
    'organ': 'Cathedral Organ',
    'organ_soft_jazz': 'Soft Jazz Organ',
    'organ_jimmy_smith': 'Jimmy Smith B3',
    'organ_prog': 'Prog Rock B3',
    'reggae_organ': 'Roots Bubbler B3',
    'dynamicOrgan': '⚡ DYNAMIC ORGAN',
    'synth': 'Emerald Pad',
    'synth_ambient_pad_lush': 'Lush Pad',
    'synth_cave_pad': 'Cave Pad (Dark)',
    'dynamicPad': '⚡ DYNAMIC PAD',
    'theremin': 'Vocal Theremin',
    'mellotron': 'Majestic Strings',
    'mellotron_flute_intimate': 'Intimate Flute',
    'piano': 'Rhodes EPiano',
    'violin': 'Solo Violin',
    'flute': 'Silver Flute',
    'bass_jazz_warm': 'Warm Jazz Bass',
    'psybient': 'Psy-Ambient',
    'dyn_tele_dark': '⚡ Tele → Dark Tele',
    'dyn_black_tele_dark': '⚡ Black → Tele → Dark',
    'dyn_tele_cs80_black': '⚡ Tele → CS80 → Black',
    'dyn_black_cs80_tele': '⚡ Black → CS80 → Tele',
    'dyn_tele_cs80_shine': '⚡ Tele → CS80 → Shine',
    'dyn_tele_cs80_muff': '⚡ Tele → CS80 → Muff',
    'dyn_black_cs80_shine': '⚡ Black → CS80 → Shine',
    'dyn_black_cs80_muff': '⚡ Black → CS80 → Muff',
    'dyn_shine_muff': '⚡ Shine ↔ Muff (Dist)',
    'dyn_bass_warm_blues': '⚡ Warm Jazz → Blues',
    'dyn_bass_warm_blues_slap': '⚡ Warm → Blues → Slap',
    'dyn_bass_fretless_jazz': '⚡ Fretless → Jazz',
    'dyn_bass_fretless_jazz_slap': '⚡ Fretless → Jazz → Slap',
    'dyn_bass_ambient_cs80': '⚡ Ambient → CS80 Sub',
    'dyn_rhodes_piano': '⚡ Rhodes → Piano',
    'dyn_piano_rhodes': '⚡ Piano → Rhodes'
};

const INSTRUMENT_GROUPS = [
  { label: "Pads", options: ['synth', 'synth_ambient_pad_lush', 'synth_cave_pad', 'dynamicPad', 'mellotron'] },
  { label: "Organs", options: ['organ', 'organ_soft_jazz', 'organ_jimmy_smith', 'organ_prog', 'reggae_organ', 'dynamicOrgan'] },
  { label: "Basses", options: ['bass_jazz_warm', 'bass_jazz_fretless', 'bass_blues', 'bass_ambient', 'bass_ambient_dark', 'bass_trance_acid', 'bass_reggae', 'bass_dub', 'bass_house', 'bass_808', 'bass_deep_house', 'bass_rock_pick', 'bass_slap', 'bass_cs80'] },
  { label: "⚡ Dynamic Basses", options: ['dyn_bass_warm_blues', 'dyn_bass_warm_blues_slap', 'dyn_bass_fretless_jazz', 'dyn_bass_fretless_jazz_slap', 'dyn_bass_ambient_cs80'] },
  { label: "Electric Guitars", options: ['telecaster', 'darkTelecaster', 'guitar_shineOn', 'guitar_muffLead', 'reggae_guitar'] },
  { label: "⚡ Dynamic Guitars", options: ['dyn_tele_dark', 'dyn_black_tele_dark', 'dyn_tele_cs80_black', 'dyn_black_cs80_tele', 'dyn_tele_cs80_shine', 'dyn_tele_cs80_muff', 'dyn_black_cs80_shine', 'dyn_black_cs80_muff', 'dyn_shine_muff'] },
  { label: "Others", options: ['blackAcoustic', 'guitarChords', 'ep_rhodes_warm', 'cs80', 'theremin', 'piano', 'violin', 'flute', 'none'] }
];

// ───── HELPER UI ─────

function MultiSelector<T extends string>({ 
  options, 
  values, 
  onValuesChange, 
  placeholder,
  className 
}: { 
  options: T[], 
  values: T[], 
  onValuesChange: (vals: T[]) => void, 
  placeholder: string,
  className?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-8 text-xs bg-background justify-between font-normal", className)}>
          <span className="truncate pr-4">
            {values.length > 0 ? values.join(", ") : placeholder}
          </span>
          <LayoutGrid className="ml-2 h-3 w-3 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <ScrollArea className="h-48 p-2">
          {options.map(opt => (
            <div key={opt} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-sm cursor-pointer group" 
                 onClick={() => {
                   const next = values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt];
                   onValuesChange(next);
                 }}>
              <Checkbox checked={values.includes(opt)} onCheckedChange={() => {}} />
              <Label className="text-[11px] font-bold uppercase cursor-pointer flex-grow leading-none">{opt}</Label>
            </div>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function getPartIcon(part: string) {
    switch(part) {
        case 'master': return <Volume2 className="h-4 w-4 text-primary"/>;
        case 'bass': return <Waves className="h-4 w-4"/>;
        case 'melody': return <GitBranch className="h-4 w-4"/>;
        case 'accompaniment': return <Piano className="h-4 w-4"/>;
        case 'harmony': return <Waves className="h-4 w-4"/>;
        case 'pianoAccompaniment': return <Piano className="h-4 w-4"/>;
        case 'drums': return <Drum className="h-4 w-4"/>;
        case 'sparkles': return <Sparkles className="h-4 w-4"/>;
        case 'sfx': return <Sprout className="h-4 w-4"/>;
        default: return <Music className="h-4 w-4"/>;
    }
}

// ───── MAIN COMPONENT ─────

export function AuraGrooveV2(props: AuraGrooveProps) {
  const {
    isPlaying, isInitializing, isRecording, isBroadcastActive, handlePlayPause, handleRegenerate, handleToggleRecording, handleToggleBroadcast, handleSaveMasterpiece, drumSettings, setDrumSettings, instrumentSettings,
    setInstrumentSettings, handleVolumeChange, textureSettings, handleTextureEnabledChange,
    bpm, handleBpmChange, score, handleScoreChange, density, setDensity, handleGoHome,
    isEqModalOpen, setIsEqModalOpen, eqSettings, handleEqChange,
    isCalibrationModalOpen, setIsCalibrationModalOpen, calibrationGains, handleCalibrationChange,
    timerSettings, handleTimerDurationChange, handleToggleTimer,
    composerControlsInstruments, setComposerControlsInstruments,
    useHeritage, setUseHeritage,
    mood, setMood, genre, setGenre, isRegenerating,
    availableCompositions, selectedCompositionIds, toggleCompositionFilter, clearCompositionFilters, refreshCloudAxioms
  } = props;

  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterSearchText, setFilterSearchText] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [selectedFilterGenres, setSelectedFilterGenres] = useState<Genre[]>([]);
  const [selectedFilterMoods, setSelectedFilterMoods] = useState<Mood[]>([]);
  const [isSpectrumOpen, setIsSpectrumOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredCompositions = availableCompositions.filter(comp => {
      const ms = comp.id.toLowerCase().includes(filterSearchText.toLowerCase());
      const msel = showSelectedOnly ? selectedCompositionIds.includes(comp.id) : true;
      const mg = selectedFilterGenres.length === 0 || selectedFilterGenres.some(g => comp.genres.includes(g));
      const mm = selectedFilterMoods.length === 0 || selectedFilterMoods.some(m => comp.moods.includes(m));
      return ms && msel && mg && mm;
  });

  const anchorBtnText = !useHeritage 
    ? "DNA Locked (Local)" 
    : (selectedCompositionIds.length === 0 
        ? "DNA Anchor" 
        : (selectedCompositionIds.length === 1 ? "DNA Locked" : `DNA Hybrid (${selectedCompositionIds.length})`));

  const isBpmDisabled = isInitializing || (isPlaying && selectedCompositionIds.length === 0);
  const isFractalStyle = score === 'neuro_f_matrix';
  const composerControl = isFractalStyle && composerControlsInstruments;

  const bassInstrumentList = Object.keys(BASS_PRESET_INFO);
  const melodyInstrumentList = Object.keys(V2_PRESETS).filter(k => V2_PRESETS[k as keyof typeof V2_PRESETS].type !== 'bass' && k !== 'ep_rhodes');
  const textureInstrumentList = melodyInstrumentList;
  const harmonyInstrumentList = ['guitarChords', 'violin', 'none'];

  if (!isClient) return null;

  const theme = isDarkTheme ? 'dark' : 'light';
  const bgClass = isDarkTheme ? 'bg-neutral-950' : 'bg-neutral-50';
  const textClass = isDarkTheme ? 'text-neutral-100' : 'text-gray-900';
  const borderClass = isDarkTheme ? 'border-neutral-800' : 'border-gray-200';

  return (
    <div className={cn("w-full h-full flex flex-col p-3 overflow-hidden transition-colors duration-200", bgClass, textClass)}>
      {/* Header */}
      <header className={cn("flex-shrink-0 pb-2 border-b transition-colors", isDarkTheme ? borderClass : "border-gray-200")}>
        <div className="flex items-center justify-between">
          <div className="flex flex-row items-center gap-2 pl-1">
            <Image src="/assets/icon8.jpeg" alt="Logo" width={32} height={32} className="rounded-full" />
            <h1 className={cn("text-lg font-bold", isDarkTheme ? "text-violet-400" : "text-violet-600")}>AuraGroove</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => router.push('/home')} title="Navigator"><Navigation className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/timbre-lab')} title="Lab"><Settings2 className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/hypercube-dashboard')} title="DNA"><Database className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={handleGoHome}><Home className="h-5 w-5" /></Button>

            <Dialog open={isCalibrationModalOpen} onOpenChange={setIsCalibrationModalOpen}>
                <DialogTrigger asChild><Button variant="ghost" size="icon" className="hidden md:inline-flex"><SlidersHorizontal className="h-5 w-5" /></Button></DialogTrigger>
                <DialogContent className="max-w-none w-screen h-screen m-0 p-0 border-0 rounded-none bg-background/95 backdrop-blur-3xl flex flex-col z-[100]">
                    <DialogHeader className="p-6 border-b border-primary/10 flex flex-row items-center justify-between bg-card/50">
                        <DialogTitle className="text-2xl font-black uppercase text-primary flex items-center gap-3">
                           <SlidersHorizontal className="h-8 w-8" /> Grand Studio Console
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={() => setIsCalibrationModalOpen(false)}><X className="h-8 w-8" /></Button>
                    </DialogHeader>
                    <ScrollArea className="flex-grow">
                      <div className="flex gap-12 p-10 min-w-max h-full">
                        <div className="flex flex-col gap-6 pr-12 border-r border-primary/10">
                            <h3 className="text-xs font-black uppercase text-primary mb-2 flex items-center gap-2"><TowerControl className="h-4 w-4" /> Preamps</h3>
                            <div className="flex gap-8 h-full pb-12">
                              {CALIBRATION_CHANNELS.map(ch => (
                                <div key={ch.key} className="flex flex-col items-center gap-4 w-20 group">
                                    <span className="text-xs font-mono text-primary font-black">{Math.round((calibrationGains[ch.key] || 1.0) * 100)}%</span>
                                    <Slider value={[calibrationGains[ch.key] || 1.0]} min={0} max={2} step={0.01} onValueChange={(v) => handleCalibrationChange(ch.key, v[0])} orientation="vertical" className="h-full" />
                                    <Label className={cn("text-[10px] font-black uppercase text-center h-10 flex items-center", ch.color)}>{ch.label}</Label>
                                </div>
                              ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-6">
                            <h3 className="text-xs font-black uppercase text-primary mb-2 flex items-center gap-2"><Mic2 className="h-4 w-4" /> Mixer</h3>
                            <div className="flex gap-8 h-full pb-12">
                              {(['master', 'bass', 'melody', 'accompaniment', 'pianoAccompaniment', 'harmony', 'drums', 'sparkles', 'sfx'] as const).map((partKey) => {
                                const isMaster = partKey === 'master';
                                const settings = isMaster ? { volume: calibrationGains.master } : (partKey in instrumentSettings ? (instrumentSettings as any)[partKey] : ((textureSettings as any)[partKey] || drumSettings));
                                let ilist: string[] = partKey === 'bass' ? bassInstrumentList : (partKey === 'melody' ? melodyInstrumentList : (partKey === 'accompaniment' ? textureInstrumentList : (partKey === 'harmony' ? harmonyInstrumentList : ['piano'])));
                                
                                return (
                                    <div key={partKey} className={cn("flex flex-col items-center gap-4 w-32 bg-card/30 rounded-xl p-4 border border-primary/5 group", isMaster && "bg-primary/5 border-primary/20")}>
                                        <span className="text-[10px] font-mono opacity-50">{Math.round((settings.volume || 0) * 100)}%</span>
                                        <Slider value={[settings.volume || 0]} max={1} step={0.01} onValueChange={(v) => handleVolumeChange(partKey as any, v[0])} orientation="vertical" className="h-full" />
                                        <div className="w-full space-y-3 mt-auto">
                                            {partKey in instrumentSettings && partKey !== 'pianoAccompaniment' && (
                                                <Select value={settings.name} onValueChange={(v) => setInstrumentSettings(partKey as any, v as any)} disabled={composerControl}>
                                                    <SelectTrigger className="h-8 text-[10px] font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent>{ilist.map(inst => <SelectItem key={inst} value={inst} className="text-xs font-bold">{DISPLAY_NAMES[inst] || inst}</SelectItem>)}</SelectContent>
                                                </Select>
                                            )}
                                            {partKey === 'drums' && (
                                                <Select value={drumSettings.pattern} onValueChange={(v) => setDrumSettings(d => ({...d, pattern: v as any}))} disabled={isPlaying}>
                                                    <SelectTrigger className="h-8 text-[10px] font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="ambient_beat">Ambient</SelectItem><SelectItem value="composer">Composer</SelectItem></SelectContent>
                                                </Select>
                                            )}
                                            {['sparkles', 'sfx'].includes(partKey) && <div className="flex justify-center py-1"><Switch checked={settings.enabled} onCheckedChange={(c) => handleTextureEnabledChange(partKey as any, c)} /></div>}
                                            {isMaster && <div className="h-8 flex items-center justify-center"><Badge variant="outline" className="text-[9px] font-black uppercase text-primary border-primary/30">Master</Badge></div>}
                                            <Label className={cn("text-[10px] font-black uppercase text-center block opacity-50 truncate w-full flex items-center justify-center gap-2", isMaster && "text-primary opacity-100")}>
                                              {getPartIcon(partKey as string)}
                                              {partKey === 'pianoAccompaniment' ? 'Rhodes' : (partKey === 'harmony' ? 'RTM' : partKey)}
                                            </Label>
                                        </div>
                                    </div>
                                );
                              })}
                            </div>
                        </div>
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <Dialog open={isEqModalOpen} onOpenChange={setIsEqModalOpen}>
                <DialogTrigger asChild><Button variant="ghost" className="h-9 w-9 px-2">EQ</Button></DialogTrigger>
                <DialogContent className="sm:max-w-md border-primary/20 bg-card">
                    <DialogHeader><DialogTitle className="text-primary uppercase font-black">System Equalizer</DialogTitle></DialogHeader>
                    <div className="flex justify-around items-end pt-4 h-48">{EQ_BANDS.map((band, index) => (
                        <div key={index} className="flex flex-col items-center justify-end space-y-2">
                            <span className="text-xs font-mono text-muted-foreground">{eqSettings[index] > 0 ? '+' : ''}{eqSettings[index].toFixed(1)}</span>
                            <Slider value={[eqSettings[index]]} min={-10} max={10} step={0.5} onValueChange={(v) => handleEqChange(index, v[0])} orientation="vertical" className="h-32" />
                            <Label className="text-xs text-muted-foreground">{band.label}</Label>
                        </div>
                    ))}</div>
                </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 pt-2 pb-1.5">
           <Button
            type="button"
            onClick={handlePlayPause}
            disabled={isInitializing}
            className={cn(
              "h-8 px-4 text-[10px] font-black uppercase tracking-tight shadow-md transition-all",
              isDarkTheme
                ? "bg-gradient-to-r from-violet-600 to-violet-400 hover:from-violet-500 hover:to-violet-300 text-white"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            )}
           >
                {isPlaying ? <Pause className="mr-1.5 h-4 w-4" /> : <Music className="mr-1.5 h-4 w-4" />}
                {isPlaying ? "Pause" : "Play"}
           </Button>
           <Button type="button" onClick={handleToggleBroadcast} variant={isBroadcastActive ? "destructive" : "outline"} className="h-10 w-10 p-0"><TowerControl className={cn("h-5 w-5", isBroadcastActive && "animate-pulse text-primary")} /></Button>
           <Button type="button" onClick={handleToggleRecording} variant={isRecording ? "destructive" : "outline"} className="h-10 w-10 p-0"><Radio className={cn("h-5 w-5", isRecording && "animate-pulse")} /></Button>
           <Button type="button" onClick={handleSaveMasterpiece} disabled={!isPlaying} variant="outline" className="h-10 w-10 p-0"><ThumbsUp className="h-5 w-5 text-primary" /></Button>
           <Button type="button" onClick={handleRegenerate} variant="outline" className="h-10 w-10 p-0"><RefreshCw className={cn("h-5 w-5", isRegenerating && "animate-spin")} /></Button>
        </div>
      </header>

      {/* Main Tabs */}
      <main className="flex-grow overflow-hidden flex flex-col">
        <Tabs defaultValue="composition" className="w-full h-full flex flex-col">
          <TabsList className="grid grid-cols-3 h-8 shrink-0">
            <TabsTrigger value="composition" className="text-xs">Composition</TabsTrigger>
            <TabsTrigger value="instruments" className="text-xs">Instruments</TabsTrigger>
            <TabsTrigger value="samples" className="text-xs">Samples</TabsTrigger>
          </TabsList>
          
          <div className="flex-grow overflow-y-auto mt-2">
            <TabsContent value="composition" className="space-y-1.5 pt-0 px-1">
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader className="p-2 py-1 flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm"><FileMusic className="h-4 w-4"/> Composition</CardTitle>
                    <Dialog open={isFilterModalOpen} onOpenChange={(open) => { setIsFilterModalOpen(open); if (open) refreshCloudAxioms(); }}>
                        <DialogTrigger asChild><Button variant="ghost" size="sm" disabled={!useHeritage} className={cn("h-7 px-2 gap-1.5 text-[10px] font-bold uppercase tracking-tighter transition-all", selectedCompositionIds.length > 0 && useHeritage ? "text-primary bg-primary/10 border border-primary/20" : "opacity-70")}>{anchorBtnText}</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-[420px] max-h-[85vh] flex flex-col p-0 bg-card border-primary/20">
                            <DialogHeader className="p-4 pb-2 border-b border-primary/10"><DialogTitle className="flex items-center gap-2 text-primary font-black uppercase text-base"><Database className="h-5 w-5" /> DNA Selection</DialogTitle></DialogHeader>
                            <div className="p-3 pb-1 space-y-3 bg-muted/20">
                                <div className="relative group"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary" /><Input placeholder="Search..." className="pl-9 h-9 text-xs border-primary/10 bg-background" value={filterSearchText} onChange={(e) => setFilterSearchText(e.target.value)}/></div>
                                <div className="flex flex-wrap items-center gap-2 px-1">
                                    <MultiSelector options={AVAILABLE_GENRES} values={selectedFilterGenres} onValuesChange={setSelectedFilterGenres} placeholder="Genre" className="w-[110px]" />
                                    <MultiSelector options={AVAILABLE_MOODS} values={selectedFilterMoods} onValuesChange={setSelectedFilterMoods} placeholder="Mood" className="w-[110px]" />
                                    <Button variant="outline" size="sm" onClick={() => setShowSelectedOnly(!showSelectedOnly)} className={cn("h-8 px-2 text-[10px] uppercase font-bold", showSelectedOnly && "bg-primary text-primary-foreground")}>{showSelectedOnly ? "Picked" : "All"}</Button>
                                    <Button variant="ghost" size="sm" onClick={() => clearCompositionFilters()} className="h-8 px-2 text-[10px] font-bold text-destructive">Reset</Button>
                                </div>
                            </div>
                            <ScrollArea className="h-[350px] p-2">
                                {filteredCompositions.map(comp => (
                                    <div key={comp.id} className={cn("flex items-center space-x-3 p-2.5 rounded-lg border cursor-pointer transition-all", selectedCompositionIds.includes(comp.id) ? "bg-primary/10 border-primary/20" : "border-transparent hover:bg-muted/50")} onClick={() => toggleCompositionFilter(comp.id)}>
                                        <Checkbox checked={selectedCompositionIds.includes(comp.id)} onCheckedChange={() => {}} />
                                        <div className="flex-grow min-w-0"><Label className="text-[11px] font-bold truncate block">{comp.id.replace(/_/g, ' ')}</Label><div className="text-[8px] uppercase opacity-40">{comp.genres.join(', ')}</div></div>
                                        <Badge variant="secondary" className="text-[9px] font-mono">{comp.count}</Badge>
                                    </div>
                                ))}
                            </ScrollArea>
                            <DialogFooter className="p-4 border-t"><Button size="sm" onClick={() => setIsFilterModalOpen(false)} className="w-full font-black uppercase">Set DNA Anchor</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="space-y-2 p-3 pt-0">
                  <div className="grid grid-cols-3 items-center gap-2"><Label className="text-right text-xs">Style</Label><Select value={score} onValueChange={(v) => handleScoreChange(v as any)} disabled={isPlaying}><SelectTrigger className="col-span-2 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="neuro_f_matrix">Neuro F-Matrix</SelectItem></SelectContent></Select></div>
                   {isFractalStyle && (<>
                     <div className="grid grid-cols-3 items-center gap-2"><Label className="text-right text-xs">Genre</Label><Select value={genre} onValueChange={(v) => setGenre(v as Genre)} disabled={isPlaying}><SelectTrigger className="col-span-2 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{AVAILABLE_GENRES.map(g => <SelectItem key={g} value={g} className="text-xs capitalize">{DISPLAY_NAMES[g] || g}</SelectItem>)}</SelectContent></Select></div>
                      <div className="grid grid-cols-3 items-center gap-2"><Label className="text-right text-xs">Mood</Label><Select value={mood} onValueChange={(v) => setMood(v as Mood)} disabled={isPlaying}><SelectTrigger className="col-span-2 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{AVAILABLE_MOODS.map(m => <SelectItem key={m} value={m} className={cn("text-xs capitalize", MOOD_COLOR_CLASSES[MOOD_CATEGORIES[m]])}>{m}</SelectItem>)}</SelectContent></Select></div>
                      <div className="grid grid-cols-3 items-center gap-2"><Label className="text-right text-xs flex items-center gap-1.5 justify-end"><Dna className="h-3.5 w-3.5 text-primary" /> Heritage</Label><div className="col-span-2 flex items-center"><Switch checked={useHeritage} onCheckedChange={setUseHeritage} disabled={isPlaying}/></div></div>
                      <div className="grid grid-cols-3 items-center gap-2"><Label className="text-right text-xs flex items-center gap-1.5 justify-end"><Bot className="h-3 w-3" /> Control</Label><div className="col-span-2 flex items-center"><Switch checked={composerControlsInstruments} onCheckedChange={setComposerControlsInstruments} disabled={isPlaying}/></div></div>
                    </>)}
                  <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-2"><Label className="text-right text-xs">BPM</Label><Slider value={[bpm]} min={60} max={160} step={1} onValueChange={(v) => handleBpmChange(v[0])} className="col-span-1" disabled={isBpmDisabled}/><span className="text-xs w-8 text-right font-mono">{bpm}</span></div>
                  <div className="grid grid-cols-3 items-center gap-2"><Label className="text-right text-xs">Density</Label><Slider value={[density]} min={0.1} max={1} step={0.05} onValueChange={(v) => setDensity(v[0])} className="col-span-2" disabled={isInitializing}/></div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-none bg-transparent mt-2">
                <CardHeader className="p-2 py-1"><CardTitle className="flex items-center gap-2 text-sm"><Timer className="h-4 w-4"/> Systems</CardTitle></CardHeader>
                <CardContent className="space-y-3 p-3 pt-0">
                    <div className="flex items-center gap-2">
                         <Button onClick={handleToggleTimer} disabled={timerSettings.isActive} variant={timerSettings.isActive ? 'destructive' : 'secondary'} className="flex-grow h-8 text-[10px] uppercase font-black">{timerSettings.isActive ? `Stop (${formatTime(timerSettings.timeLeft)})` : `Timer (${timerSettings.duration / 60}m)`}</Button>
                        <Dialog open={isSpectrumOpen} onOpenChange={setIsSpectrumOpen}>
                            <DialogTrigger asChild><Button variant="outline" className="w-10 h-8 p-0"><Activity className={cn("h-4 w-4", isPlaying && "text-primary animate-pulse")} /></Button></DialogTrigger>
                            <DialogContent className="sm:max-w-[480px] bg-card border-primary/20"><DialogHeader><DialogTitle className="flex items-center gap-2 text-primary font-black uppercase text-base"><Activity className="h-5 w-5" /> Spectrum Analyzer</DialogTitle></DialogHeader><div className="py-4 h-[250px]"><SpectrumAnalyzer /></div></DialogContent>
                        </Dialog>
                    </div>
                    {!timerSettings.isActive && <Slider value={[timerSettings.duration / 60]} min={0} max={30} step={5} onValueChange={(v) => handleTimerDurationChange(v[0])} className="px-1" />}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="instruments" className="space-y-1 pt-0 px-1">
              <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader className="p-2 py-1"><CardTitle className="flex items-center gap-2 text-sm"><SlidersHorizontal className="h-4 w-4"/> Instruments</CardTitle></CardHeader>
                  <CardContent className="space-y-1.5 p-3 pt-0">
                      {(Object.keys(instrumentSettings) as Array<keyof typeof instrumentSettings>).map((part) => {
                          const settings = instrumentSettings[part];
                          const ilist = part === 'bass' ? bassInstrumentList : (part === 'melody' ? melodyInstrumentList : (part === 'accompaniment' ? textureInstrumentList : (part === 'harmony' ? harmonyInstrumentList : ['piano'])));
                          return (
                            <div key={part} className="p-2 border rounded-md space-y-2 bg-background/30 border-primary/10">
                               <div className="grid grid-cols-2 items-center gap-2">
                                    <Label className="font-semibold flex items-center gap-1.5 capitalize text-xs">{getPartIcon(part)}{part === 'pianoAccompaniment' ? 'Rhodes' : part}</Label>
                                    {part !== 'pianoAccompaniment' ? (
                                        <Select value={settings.name} onValueChange={(v) => setInstrumentSettings(part, v as any)} disabled={isPlaying || composerControl}>
                                            <SelectTrigger className="h-8 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                                            <SelectContent>{ilist.map(inst => <SelectItem key={inst} value={inst} className="text-xs">{DISPLAY_NAMES[inst] || inst}</SelectItem>)}</SelectContent>
                                        </Select>
                                    ) : <div className="h-8 text-xs flex items-center justify-end pr-2 text-muted-foreground">Fixed</div>}
                                </div>
                                <div className="flex items-center gap-2"><Label className="text-xs text-muted-foreground">Vol</Label><Slider value={[settings.volume]} max={1} step={0.05} onValueChange={(v) => handleVolumeChange(part as any, v[0])} disabled={settings.name === 'none'}/><span className="text-xs w-8 text-right font-mono">{Math.round(settings.volume * 100)}</span></div>
                            </div>
                          );
                      })}
                  </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="samples" className="space-y-1.5 pt-0 px-1">
              <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader className="p-2 py-1"><CardTitle className="flex items-center gap-2 text-sm"><Atom className="h-4 w-4"/> Sampled Textures</CardTitle></CardHeader>
                  <CardContent className="space-y-1.5 p-3 pt-0">
                      <div className="p-2 border rounded-md bg-background/30 border-primary/10">
                          <div className="flex justify-between items-center mb-1"><Label className="font-semibold flex items-center gap-1.5 text-sm"><Sparkles className="h-4 w-4"/>Sparkles</Label><Switch checked={textureSettings.sparkles.enabled} onCheckedChange={(checked) => handleTextureEnabledChange('sparkles', checked)} /></div>
                          <div className="flex items-center gap-2"><Label className="text-xs text-muted-foreground">Vol</Label><Slider value={[textureSettings.sparkles.volume]} max={1} step={0.05} onValueChange={(v) => handleVolumeChange('sparkles', v[0])} disabled={!textureSettings.sparkles.enabled}/><span className="text-xs w-8 text-right font-mono">{Math.round(textureSettings.sparkles.volume * 100)}</span></div>
                      </div>
                      <div className="p-2 border rounded-md bg-background/30 border-primary/10">
                          <div className="flex justify-between items-center mb-1"><Label className="font-semibold flex items-center gap-1.5 text-sm"><Sprout className="h-4 w-4"/>SFX</Label><Switch checked={textureSettings.sfx.enabled} onCheckedChange={(checked) => handleTextureEnabledChange('sfx', checked)} /></div>
                          <div className="flex items-center gap-2"><Label className="text-xs text-muted-foreground">Vol</Label><Slider value={[textureSettings.sfx.volume]} max={1} step={0.05} onValueChange={(v) => handleVolumeChange('sfx' as any, v[0])} disabled={!textureSettings.sfx.enabled}/><span className="text-xs w-8 text-right font-mono">{Math.round(textureSettings.sfx.volume * 100)}</span></div>
                      </div>
                       <div className="p-2 border rounded-md bg-background/30 border-primary/10">
                          <div className="flex justify-between items-center mb-1"><Label className="font-semibold flex items-center gap-1.5 text-sm"><Drum className="h-4 w-4"/>Drums</Label><Select value={drumSettings.pattern} onValueChange={(v) => setDrumSettings(d => ({...d, pattern: v as any}))} disabled={isPlaying}><SelectTrigger className="w-[140px] h-8 text-xs bg-background/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="ambient_beat">Ambient</SelectItem><SelectItem value="composer">Composer</SelectItem></SelectContent></Select></div>
                          <div className="flex items-center gap-2"><Label className="text-xs text-muted-foreground">Vol</Label><Slider value={[drumSettings.volume]} max={1} step={0.05} onValueChange={(v) => handleVolumeChange('drums', v[0])} disabled={drumSettings.pattern === 'none'}/><span className="text-xs w-8 text-right font-mono">{Math.round(drumSettings.volume * 100)}</span></div>
                           <div className="flex items-center gap-2 pt-2"><Label className="text-xs text-muted-foreground">Kick</Label><Slider value={[drumSettings.kickVolume]} max={1.5} step={0.05} onValueChange={(v) => setDrumSettings(d => ({...d, kickVolume: v[0]}))} disabled={drumSettings.pattern === 'none'}/><span className="text-xs w-8 text-right font-mono">{Math.round(drumSettings.kickVolume * 100)}</span></div>
                      </div>
                  </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
