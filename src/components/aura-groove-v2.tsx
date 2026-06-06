
/**
 * #ЗАЧЕМ: UI AuraGroove V4.0 — "Dynamic Group Expansion".
 * #ЧТО: ПЛАН №88 — Добавлены динамические группы пианиста.
 */
'use client';

import { useState, useEffect } from "react";
import { 
  Music, Pause, Speaker, FileMusic, Drum, Atom, Piano, Home, 
  Sparkles, Sprout, Timer, RefreshCw, Bot, Waves, Radio, 
  ThumbsUp, TowerControl, Database, Filter, Check, RotateCcw, 
  Search, Eye, EyeOff, SlidersHorizontal, Cog, GitBranch, LayoutGrid, X,
  Guitar, Lock, Dna, Settings2, Mic2, Activity, Navigation
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import type { Mood, Genre, InstrumentPart, BassInstrument, MelodyInstrument, AccompanimentInstrument } from '@/types/music';
import { V2_PRESETS } from "@/lib/presets-v2";
import { BASS_PRESET_INFO } from "@/lib/bass-presets";
import { SpectrumAnalyzer } from "@/components/SpectrumAnalyzer";

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

type MoodCategory = 'light' | 'neutral' | 'dark';

const MOOD_CATEGORIES: Record<Mood, MoodCategory> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

const MOOD_COLOR_CLASSES: Record<MoodCategory, string> = {
  light: 'text-primary',
  neutral: 'text-primary/75',
  dark: 'text-primary/50',
};

const AVAILABLE_GENRES: Genre[] = ['psybient', 'ambient', 'progressive', 'rock', 'house', 'rnb', 'ballad', 'reggae', 'blues', 'celtic'];
const AVAILABLE_MOODS: Mood[] = ['epic', 'joyful', 'enthusiastic', 'melancholic', 'dark', 'anxious', 'dreamy', 'contemplative', 'calm', 'gloomy'];

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
        <Button variant="outline" size="sm" className={cn("h-8 text-[10px] bg-background justify-between font-bold uppercase", className)}>
          <span className="truncate pr-2">
            {values.length > 0 ? values.join(", ") : placeholder}
          </span>
          <Filter className="h-3 w-3 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0" align="start">
        <div className="max-h-48 overflow-y-auto p-2">
          {options.map(opt => (
            <div key={opt} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-sm cursor-pointer group"
                 onClick={() => {
                   const next = values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt];
                   onValuesChange(next);
                 }}>
              <Checkbox checked={values.includes(opt)} onCheckedChange={() => {}} className="border-primary/30" />
              <Label className="text-[10px] font-bold uppercase cursor-pointer flex-grow leading-none">{opt}</Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AuraGrooveV2({
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
}: AuraGrooveProps) {

  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterSearchText, setFilterSearchText] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  
  const [selectedFilterGenres, setSelectedFilterGenres] = useState<Genre[]>([]);
  const [selectedFilterMoods, setSelectedFilterMoods] = useState<Mood[]>([]);
  const [isSpectrumOpen, setIsSpectrumOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const bassInstrumentList = Object.keys(BASS_PRESET_INFO);
  const v2MelodyInstruments = Object.keys(V2_PRESETS).filter(k => 
    V2_PRESETS[k as keyof typeof V2_PRESETS].type !== 'bass' && k !== 'ep_rhodes_warm'
  );
  
  const melodyInstrumentList = v2MelodyInstruments;
  const textureInstrumentList = v2MelodyInstruments; 
  const harmonyInstrumentList: ('guitarChords' | 'flute' | 'violin' | 'none')[] = ['guitarChords', 'violin', 'none'];
  const moodList: Mood[] = ['epic', 'joyful', 'enthusiastic', 'melancholic', 'dark', 'anxious', 'dreamy', 'contemplative', 'calm', 'gloomy'];
  const isFractalStyle = score === 'neuro_f_matrix';
  const composerControl = isFractalStyle && composerControlsInstruments;

  const genreList: Genre[] = isFractalStyle
    ? ['ambient', 'psybient', 'blues', 'reggae']
    : ['psybient', 'ambient', 'progressive', 'rock', 'house', 'rnb', 'ballad', 'reggae', 'blues', 'celtic'];

  const displayNames: Record<string, string> = {
    'guitarChords': 'Acoustic Chords',
    'neuro_f_matrix': 'Neuro F-Matrix',
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
    'guitar_shineOn': 'Shine On Guitar',
    'guitar_muffLead': 'Muff Lead',
    'reggae_guitar': 'Roots Skank Guitar',
    'organ': 'Cathedral Organ',
    'organ_soft_jazz': 'Soft Jazz Organ',
    'synth': 'Emerald Pad',
    'theremin': 'Vocal Theremin',
    'mellotron': 'Majestic Strings',
    'mellotron_flute_intimate': 'Intimate Flute',
    'guitar_shineOn': 'Shine On Guitar',
    'synth_ambient_pad_lush': 'Lush Pad',
    'piano': 'Rhodes EPiano',
    'violin': 'Solo Violin',
    'flute': 'Silver Flute',
    'bass_jazz_warm': 'Warm Jazz Bass',
    'blackAcoustic': 'Black Acoustic',
    'reggae': 'Roots Reggae',
    'psybient': 'Psy-Ambient',
    // Dynamic Guitars
    'dyn_tele_dark': '⚡ Tele → Dark Tele',
    'dyn_black_tele_dark': '⚡ Black → Tele → Dark',
    'dyn_tele_cs80_black': '⚡ Tele → CS80 → Black',
    'dyn_black_cs80_tele': '⚡ Black → CS80 → Tele',
    'dyn_tele_cs80_shine': '⚡ Tele → CS80 → Shine',
    'dyn_tele_cs80_muff': '⚡ Tele → CS80 → Muff',
    'dyn_black_cs80_shine': '⚡ Black → CS80 → Shine',
    'dyn_black_cs80_muff': '⚡ Black → CS80 → Muff',
    'dyn_shine_muff': '⚡ Shine ↔ Muff (Dist)',
    // Dynamic Basses
    'dyn_bass_warm_blues': '⚡ Warm Jazz → Blues',
    'dyn_bass_warm_blues_slap': '⚡ Warm → Blues → Slap',
    'dyn_bass_fretless_jazz': '⚡ Fretless → Jazz',
    'dyn_bass_fretless_jazz_slap': '⚡ Fretless → Jazz → Slap',
    'dyn_bass_ambient_cs80': '⚡ Ambient → CS80 Sub',
    // Dynamic Piano
    'dyn_rhodes_piano': '⚡ Rhodes → Piano',
    'dyn_piano_rhodes': '⚡ Piano → Rhodes'
  };

  const filteredCompositions = availableCompositions.filter(comp => {
      const matchesSearch = comp.id.toLowerCase().includes(filterSearchText.toLowerCase());
      const matchesSelected = showSelectedOnly ? selectedCompositionIds.includes(comp.id) : true;
      const matchesGenre = selectedFilterGenres.length === 0 || selectedFilterGenres.some(g => comp.genres.includes(g));
      const matchesMood = selectedFilterMoods.length === 0 || selectedFilterMoods.some(m => comp.moods.includes(m));
      return matchesSearch && matchesSelected && matchesGenre && matchesMood;
  });

  const getPartIcon = (part: string) => {
    switch(part) {
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
  };

  const getAnchorButtonText = () => {
      const count = selectedCompositionIds.length;
      if (!useHeritage) return "DNA Locked (Local)";
      if (count === 0) return "DNA Anchor";
      if (count === 1) return "DNA Locked";
      return `DNA Hybrid (${count})`;
  };

  const isBpmSliderDisabled = isInitializing || (isPlaying && selectedCompositionIds.length === 0);

  return (
    <div className="w-full h-full flex flex-col p-3 bg-card overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-row items-center gap-2 pl-1">
            <Image src="/assets/icon8.jpeg" alt="AuraGroove Logo" width={32} height={32} className="rounded-full" />
            <h1 className="text-lg font-bold text-primary">AuraGroove</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => router.push('/home')} title="Return to Navigator"><Navigation className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/timbre-lab')} aria-label="Open Timbre Lab"><Settings2 className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/hypercube-dashboard')} aria-label="Open Dashboard"><Database className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={handleGoHome} aria-label="Go to Home"><Home className="h-5 w-5" /></Button>
            
            {isClient && (
              <>
                <Dialog open={isCalibrationModalOpen} onOpenChange={setIsCalibrationModalOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hidden md:inline-flex" aria-label="Open Studio Console">
                            <SlidersHorizontal className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-none w-screen h-screen m-0 p-0 border-0 rounded-none bg-background/95 backdrop-blur-3xl flex flex-col z-[100]">
                        <DialogHeader className="flex-shrink-0 p-6 border-b border-primary/10 flex flex-row items-center justify-between space-y-0 bg-card/50">
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-primary flex items-center gap-3">
                                    <SlidersHorizontal className="h-8 w-8" /> Grand Studio Console
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-70">Ensemble Calibration & Channel Strip v3.3</DialogDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsCalibrationModalOpen(false)} className="h-12 w-12 hover:bg-destructive/10 hover:text-destructive">
                                <X className="h-8 w-8" />
                            </Button>
                        </DialogHeader>

                        <ScrollArea className="flex-grow">
                            <div className="flex gap-12 p-10 min-w-max h-[calc(100vh-120px)] items-stretch">
                                <div className="flex flex-col gap-6 pr-12 border-r border-primary/10">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                                        <TowerControl className="h-4 w-4" /> System Preamps
                                    </h3>
                                    <div className="flex gap-8 h-full pb-12">
                                        {CALIBRATION_CHANNELS.map(ch => (
                                            <div key={ch.key} className="flex flex-col items-center gap-4 w-20 group">
                                                <span className="text-xs font-mono text-primary font-black bg-primary/10 px-2 py-1 rounded">
                                                    {Math.round((calibrationGains[ch.key] || 1.0) * 100)}%
                                                </span>
                                                <Slider 
                                                    value={[calibrationGains[ch.key] || 1.0]} 
                                                    min={0} max={2} step={0.01} 
                                                    onValueChange={(v) => handleCalibrationChange(ch.key, v[0])} 
                                                    orientation="vertical"
                                                    className="h-full"
                                                />
                                                <Label className={cn("text-[10px] font-black uppercase text-center leading-tight h-10 flex items-center justify-center transition-colors group-hover:text-primary", ch.color)}>
                                                    {ch.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                                        <Mic2 className="h-4 w-4" /> Ensemble Mixer
                                    </h3>
                                    <div className="flex gap-8 h-full pb-12">
                                        {(['bass', 'melody', 'accompaniment', 'pianoAccompaniment', 'harmony', 'drums', 'sparkles', 'sfx'] as const).map((partKey) => {
                                            const isPart = partKey in instrumentSettings;
                                            const settings = isPart ? instrumentSettings[partKey as keyof typeof instrumentSettings] : (textureSettings as any)[partKey as any] || drumSettings;
                                            
                                            let instrumentList: string[] = [];
                                            if (partKey === 'bass') instrumentList = bassInstrumentList;
                                            else if (partKey === 'melody') instrumentList = melodyInstrumentList;
                                            else if (partKey === 'accompaniment') instrumentList = textureInstrumentList;
                                            else if (partKey === 'harmony') instrumentList = harmonyInstrumentList as any;
                                            else if (partKey === 'pianoAccompaniment') instrumentList = ['piano'];

                                            return (
                                                <div key={partKey} className="flex flex-col items-center gap-4 w-32 bg-card/30 rounded-xl p-4 border border-primary/5 hover:border-primary/20 transition-all group">
                                                    <span className="text-[10px] font-mono text-muted-foreground font-bold">{Math.round((settings.volume || 0) * 100)}%</span>
                                                    
                                                    <Slider 
                                                        value={[settings.volume || 0]} 
                                                        max={1} step={0.01} 
                                                        onValueChange={(v) => handleVolumeChange(partKey as any, v[0])} 
                                                        orientation="vertical"
                                                        className="h-full"
                                                    />

                                                    <div className="w-full space-y-3 mt-auto">
                                                        {isPart && partKey !== 'pianoAccompaniment' && (
                                                            <Select value={settings.name} onValueChange={(v) => setInstrumentSettings(partKey as any, v as any)} disabled={composerControl}>
                                                                <SelectTrigger className="h-8 text-[10px] bg-background/50 font-bold border-primary/10">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {instrumentList.map(inst => (
                                                                        <SelectItem key={inst} value={inst} className="text-xs font-bold">{displayNames[inst] || inst}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        
                                                        {partKey === 'drums' && (
                                                            <Select value={drumSettings.pattern} onValueChange={(v) => setDrumSettings(d => ({...d, pattern: v as any}))} disabled={isPlaying}>
                                                                <SelectTrigger className="h-8 text-[10px] bg-background/50 font-bold border-primary/10">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none" className="text-xs font-bold">None</SelectItem>
                                                                    <SelectItem value="ambient_beat" className="text-xs font-bold">Ambient</SelectItem>
                                                                    <SelectItem value="composer" className="text-xs font-bold">Composer</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        )}

                                                        {['sparkles', 'sfx'].includes(partKey) && (
                                                            <div className="flex justify-center py-1">
                                                                <Switch checked={settings.enabled} onCheckedChange={(c) => handleTextureEnabledChange(partKey as any, c)} />
                                                            </div>
                                                        )}

                                                        <Label className="text-[10px] font-black uppercase text-center block text-muted-foreground group-hover:text-primary transition-colors truncate w-full">
                                                            <span className="flex items-center justify-center gap-2">
                                                                {getPartIcon(partKey as string)}
                                                                {partKey === 'pianoAccompaniment' ? 'Rhodes' : (partKey === 'harmony' ? 'RTM' : partKey)}
                                                            </span>
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
                    <DialogTrigger asChild>
                    <Button variant="ghost" className="h-9 w-9 px-2" aria-label="Open Equalizer">EQ</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md border-primary/20 bg-card">
                    <DialogHeader>
                        <DialogTitle className="text-primary uppercase font-black tracking-tight">System Equalizer</DialogTitle>
                        <DialogDescription className="sr-only">Adjust the frequency balance of the master audio stream.</DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-around items-end pt-4 h-48">
                        {EQ_BANDS.map((band, index) => {
                        const val = eqSettings && eqSettings[index] !== undefined ? eqSettings[index] : 0;
                        return (
                            <div key={index} className="flex flex-col items-center justify-end space-y-2">
                            <span className="text-xs font-mono text-muted-foreground">{val > 0 ? '+' : ''}{val.toFixed(1)}</span>
                            <Slider value={[val]} min={-10} max={10} step={0.5} onValueChange={(v) => handleEqChange(index, v[0])} orientation="vertical" className="h-32" />
                            <Label className="text-xs text-muted-foreground">{band.label}</Label>
                            </div>
                        );
                        })}
                    </div>
                    </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2 pb-1.5">
           <Button type="button" onClick={handlePlayPause} disabled={isInitializing} className="w-[35%] text-base h-10">
              {isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Music className="mr-2 h-5 w-5" />}
              {isPlaying ? "Pause" : "Play"}
           </Button>
           <Button type="button" onClick={handleToggleBroadcast} disabled={isInitializing} variant={isBroadcastActive ? "destructive" : "outline"} className="h-10 w-10 p-0" title="Radio">
             <TowerControl className={cn("h-5 w-5", isBroadcastActive && "animate-pulse text-primary")} />
           </Button>
           <Button type="button" onClick={handleToggleRecording} disabled={isInitializing} variant={isRecording ? "destructive" : "outline"} className="h-10 w-10 p-0" title="Record">
             <Radio className={cn("h-5 w-5", isRecording && "animate-pulse")} />
           </Button>
           <Button type="button" onClick={handleSaveMasterpiece} disabled={isInitializing || !isPlaying} variant="outline" className="h-10 w-10 p-0" title="Like">
             <ThumbsUp className="h-5 w-5 text-primary" />
           </Button>
           <Button type="button" onClick={handleRegenerate} disabled={isInitializing} variant="outline" className="h-10 w-10 p-0">
             <RefreshCw className={cn("h-5 w-5", isRegenerating && "animate-spin")} />
           </Button>
        </div>
      </header>

      {/* Content */}
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
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={!useHeritage} className={cn("h-7 px-2 gap-1.5 text-[10px] font-bold uppercase tracking-tighter transition-all", selectedCompositionIds.length > 0 && useHeritage ? "text-primary bg-primary/10 border border-primary/20" : "opacity-70")}>
                                {selectedCompositionIds.length === 1 && useHeritage ? <Lock className="h-3 w-3" /> : <TowerControl className="h-3 w-3" />}
                                {getAnchorButtonText()}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[420px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-card border-primary/20 shadow-2xl">
                            <DialogHeader className="p-4 pb-2 border-b border-primary/10">
                                <DialogTitle className="flex items-center gap-2 text-primary font-black uppercase tracking-tight text-base">
                                    <Database className="h-5 w-5" /> DNA Selection Station
                                </DialogTitle>
                                <DialogDescription className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-70">Define Genetic Anchor or Hybrid Mix</DialogDescription>
                            </DialogHeader>
                            
                            <div className="p-3 pb-1 space-y-3 bg-muted/20">
                                <div className="relative group">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input placeholder="Search..." className="pl-9 h-9 text-xs border-primary/10 bg-background" value={filterSearchText} onChange={(e) => setFilterSearchText(e.target.value)}/>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 px-1">
                                    <MultiSelector options={AVAILABLE_GENRES} values={selectedFilterGenres} onValuesChange={setSelectedFilterGenres} placeholder="Genre" className="w-[110px]" />
                                    <MultiSelector options={AVAILABLE_MOODS} values={selectedFilterMoods} onValuesChange={setSelectedFilterMoods} placeholder="Mood" className="w-[110px]" />
                                    <Button variant="outline" size="sm" onClick={() => setShowSelectedOnly(!showSelectedOnly)} className={cn("h-8 px-2 text-[10px] uppercase font-bold transition-all ml-auto", showSelectedOnly && "bg-primary text-primary-foreground")}>
                                        {showSelectedOnly ? <Eye className="h-3 w-3 mr-1.5" /> : <EyeOff className="h-3 w-3 mr-1.5" />}
                                        {showSelectedOnly ? "Picked" : "All"}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => { setFilterSearchText(""); setSelectedFilterGenres([]); setSelectedFilterMoods([]); clearCompositionFilters(); }} className="h-8 px-2 text-[10px] uppercase font-bold text-destructive hover:bg-destructive/10"><RotateCcw className="h-3 w-3 mr-1.5" /> Reset</Button>
                                </div>
                            </div>

                            <div className="flex-grow overflow-hidden bg-card/50">
                                <ScrollArea className="h-[350px] px-2 py-1">
                                    <div className="space-y-1">
                                        {filteredCompositions.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                                <Database className="h-10 w-10 mb-2 stroke-1" /><p className="text-[10px] uppercase font-bold tracking-widest">No matching DNA</p>
                                            </div>
                                        ) : (
                                            filteredCompositions.map(comp => {
                                                const isSelected = selectedCompositionIds.includes(comp.id);
                                                return (
                                                    <div key={comp.id} className={cn("flex items-center space-x-3 p-2.5 rounded-lg transition-all border border-transparent cursor-pointer group mb-1", isSelected ? "bg-primary/10 border-primary/20" : "hover:bg-muted/50")} onClick={() => toggleCompositionFilter(comp.id)}>
                                                        <Checkbox checked={isSelected} onCheckedChange={() => {}} className="border-primary/30" />
                                                        <div className="flex-grow flex flex-col min-w-0">
                                                            <Label className={cn("text-[11px] font-bold cursor-pointer transition-colors", isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>{comp.id.replace(/_/g, ' ')}</Label>
                                                            <div className="text-[8px] uppercase font-black opacity-40 truncate">{comp.genres.join(', ')} | {comp.moods.join(', ')}</div>
                                                        </div>
                                                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 opacity-70 font-mono">{comp.count}</Badge>
                                                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                            <DialogFooter className="p-4 border-t bg-muted/30">
                                <Button size="sm" onClick={() => setIsFilterModalOpen(false)} className="w-full h-10 font-black uppercase tracking-widest shadow-xl">Set Genetic Anchor</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="space-y-2 p-3 pt-0">
                  <div className="grid grid-cols-3 items-center gap-2">
                      <Label htmlFor="score-selector" className="text-right text-xs">Style</Label>
                      <Select value={score} onValueChange={(v) => handleScoreChange(v as any)} disabled={isInitializing || isPlaying}>
                          <SelectTrigger id="score-selector" className="col-span-2 h-8 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="neuro_f_matrix">{displayNames['neuro_f_matrix'] || 'Neuro F-Matrix'}</SelectItem></SelectContent>
                      </Select>
                  </div>
                   {isFractalStyle && (
                    <>
                     <div className="grid grid-cols-3 items-center gap-2">
                          <Label htmlFor="genre-selector" className="text-right text-xs">Genre</Label>
                          <Select value={genre} onValueChange={(v) => setGenre(v as Genre)} disabled={isInitializing || isPlaying}>
                              <SelectTrigger id="genre-selector" className="col-span-2 h-8 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                              <SelectContent>{genreList.map(g => <SelectItem key={g} value={g} className="text-xs capitalize">{displayNames[g] || g}</SelectItem>)}</SelectContent>
                          </Select>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-2">
                          <Label htmlFor="mood-selector" className="text-right text-xs">Mood</Label>
                          <Select value={mood} onValueChange={(v) => setMood(v as Mood)} disabled={isInitializing || isPlaying}>
                              <SelectTrigger id="mood-selector" className="col-span-2 h-8 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {moodList.map(m => (
                                    <SelectItem key={m} value={m} className={cn("text-xs capitalize", MOOD_COLOR_CLASSES[MOOD_CATEGORIES[m]])}>{m}</SelectItem>
                                ))}
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-2">
                          <Label htmlFor="heritage-switch" className="text-right text-xs flex items-center gap-1.5 justify-end"><Dna className="h-3.5 w-3.5 text-primary" /> Heritage</Label>
                          <div className="col-span-2 flex items-center"><Switch id="heritage-switch" checked={useHeritage} onCheckedChange={setUseHeritage} disabled={isInitializing || isPlaying}/></div>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-2">
                          <Label htmlFor="composer-control-switch" className="text-right text-xs flex items-center gap-1.5 justify-end"><Bot className="h-3 w-3" /> Control</Label>
                          <div className="col-span-2 flex items-center"><Switch id="composer-control-switch" checked={composerControlsInstruments} onCheckedChange={setComposerControlsInstruments} disabled={isInitializing || isPlaying}/></div>
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-2">
                    <Label htmlFor="bpm-slider" className="text-right text-xs">BPM</Label>
                    <Slider id="bpm-slider" value={[bpm]} min={60} max={160} step={1} onValueChange={(v) => handleBpmChange(v[0])} className="col-span-1" disabled={isBpmSliderDisabled}/>
                    <span className="text-xs w-8 text-right font-mono">{bpm}</span>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <Label htmlFor="density-slider" className="text-right text-xs">Density</Label>
                    <Slider id="density-slider" value={[density]} min={0.1} max={1} step={0.05} onValueChange={(v) => setDensity(v[0])} className="col-span-2" disabled={isInitializing}/>
                  </div>
                </CardContent>
              </Card>
              
               <Card className="border-0 shadow-none bg-transparent mt-2">
                <CardHeader className="p-2 py-1"><CardTitle className="flex items-center gap-2 text-sm"><Timer className="h-4 w-4"/> Systems</CardTitle></CardHeader>
                <CardContent className="space-y-3 p-3 pt-0">
                    <div className="flex items-center gap-2">
                         <Button
                            onClick={handleToggleTimer}
                            disabled={isInitializing || timerSettings.isActive}
                            variant={timerSettings.isActive ? 'destructive' : 'secondary'}
                            className="flex-grow h-8 text-[10px] uppercase font-black"
                        >
                            {timerSettings.isActive ? `Stop (${formatTime(timerSettings.timeLeft)})` : `Timer (${timerSettings.duration / 60}m)`}
                        </Button>
                        
                        <Dialog open={isSpectrumOpen} onOpenChange={setIsSpectrumOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-10 h-8 p-0" title="Spectrum Analyzer">
                                    <Activity className={cn("h-4 w-4", isPlaying && "text-primary animate-pulse")} />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl bg-card border-primary/20 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-primary font-black uppercase tracking-tight">
                                        <Activity className="h-5 w-5" /> Spectrum Analyzer
                                    </Activity>
                                    <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-70">Real-time Frequency Distribution</DialogDescription>
                                </DialogHeader>
                                <div className="py-4 h-[350px]">
                                    <SpectrumAnalyzer />
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" size="sm" onClick={() => setIsSpectrumOpen(false)} className="uppercase text-[10px] font-black">Close Monitor</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {!timerSettings.isActive && (
                        <Slider 
                            value={[timerSettings.duration / 60]} 
                            min={0} max={30} step={5} 
                            onValueChange={(v) => handleTimerDurationChange(v[0])}
                            className="px-1"
                        />
                    )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="instruments" className="space-y-1 pt-0 px-1">
               <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader className="p-2 py-1"><CardTitle className="flex items-center gap-2 text-sm"><SlidersHorizontal className="h-4 w-4"/> Instruments</CardTitle></CardHeader>
                  <CardContent className="space-y-1.5 p-3 pt-0">
                      {(Object.keys(instrumentSettings) as Array<keyof typeof instrumentSettings>).map((part) => {
                          const settings = instrumentSettings[part];
                          if (!settings) return null;
                          let instrumentList: (string | 'none')[] = [];
                           if (part === 'bass') instrumentList = bassInstrumentList;
                           else if (part === 'melody') instrumentList = melodyInstrumentList;
                           else if (part === 'accompaniment') instrumentList = textureInstrumentList;
                           else if (part === 'harmony') instrumentList = harmonyInstrumentList as any;
                           else if (part === 'pianoAccompaniment') instrumentList = ['piano'];
                          
                          const isDisabled = isInitializing || isPlaying || composerControl;
                          return (
                            <div key={part} className="p-2 border rounded-md space-y-2 bg-background/30 border-primary/10">
                               <div className="grid grid-cols-2 items-center gap-2">
                                    <Label className="font-semibold flex items-center gap-1.5 capitalize text-xs">{getPartIcon(part as string)}{part === 'pianoAccompaniment' ? 'Rhodes' : part}</Label>
                                    {part !== 'pianoAccompaniment' ? (
                                        <Select value={settings.name} onValueChange={(v) => setInstrumentSettings(part as any, v as any)} disabled={isDisabled}>
                                            <SelectTrigger className="h-8 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                                            <SelectContent>{instrumentList.map(inst => <SelectItem key={inst} value={inst} className="text-xs">{displayNames[inst] || inst}</SelectItem>)}</SelectContent>
                                        </Select>
                                    ) : <div className="h-8 text-xs flex items-center justify-end pr-2 text-muted-foreground">Fixed</div>}
                                </div>
                                 <div className="flex items-center gap-2">
                                    <Label className="text-xs text-muted-foreground"><Speaker className="h-3 w-3 inline-block mr-1"/>Volume</Label>
                                    <Slider value={[settings.volume]} max={1} step={0.05} onValueChange={(v) => handleVolumeChange(part as any, v[0])} disabled={isInitializing || settings.name === 'none'}/>
                                    <span className="text-xs w-8 text-right font-mono">{Math.round(settings.volume * 100)}</span>
                                </div>
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
                          <div className="flex justify-between items-center mb-1">
                              <Label className="font-semibold flex items-center gap-1.5 text-sm"><Sparkles className="h-4 w-4"/>Sparkles</Label>
                              <Switch checked={textureSettings.sparkles.enabled} onCheckedChange={(checked) => handleTextureEnabledChange('sparkles', checked)} disabled={isInitializing}/>
                          </div>
                          <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground"><Speaker className="h-3 w-3 inline-block mr-1"/>Volume</Label>
                              <Slider value={[textureSettings.sparkles.volume]} max={1} step={0.05} onValueChange={(v) => handleVolumeChange('sparkles', v[0])} disabled={isInitializing || !textureSettings.sparkles.enabled}/>
                               <span className="text-xs w-8 text-right font-mono">{Math.round(textureSettings.sparkles.volume * 100)}</span>
                          </div>
                      </div>
                      <div className="p-2 border rounded-md bg-background/30 border-primary/10">
                          <div className="flex justify-between items-center mb-1">
                              <Label className="font-semibold flex items-center gap-1.5 text-sm"><Sprout className="h-4 w-4"/>SFX</Label>
                              <Switch checked={textureSettings.sfx.enabled} onCheckedChange={(c) => handleTextureEnabledChange('sfx', c)} disabled={isInitializing}/>
                          </div>
                          <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground"><Speaker className="h-3 w-3 inline-block mr-1"/>Volume</Label>
                              <Slider value={[textureSettings.sfx.volume]} max={1} step={0.05} onValueChange={(v) => handleVolumeChange('sfx' as any, v[0])} disabled={isInitializing || !textureSettings.sfx.enabled}/>
                               <span className="text-xs w-8 text-right font-mono">{Math.round(textureSettings.sfx.volume * 100)}</span>
                          </div>
                      </div>
                       <div className="p-2 border rounded-md bg-background/30 border-primary/10">
                          <div className="flex justify-between items-center mb-1">
                              <Label className="font-semibold flex items-center gap-1.5 text-sm"><Drum className="h-4 w-4"/>Drums</Label>
                               <Select value={drumSettings.pattern} onValueChange={(v) => setDrumSettings(d => ({...d, pattern: v as any}))} disabled={isInitializing || isPlaying}>
                                  <SelectTrigger className="w-[140px] h-8 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                                  <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="ambient_beat">Ambient</SelectItem><SelectItem value="composer">Composer</SelectItem></SelectContent>
                               </Select>
                          </div>
                          <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground"><Speaker className="h-3 w-3"/> Vol</Label>
                              <Slider value={[drumSettings.volume]} max={1} step={0.05} onValueChange={(v) => handleVolumeChange('drums', v[0])} disabled={isInitializing || drumSettings.pattern === 'none'}/>
                          </div>
                           <div className="flex items-center gap-2 pt-2"><Label className="text-xs text-muted-foreground"><Speaker className="h-4 w-4"/> Kick</Label><Slider value={[drumSettings.kickVolume]} max={1.5} step={0.05} onValueChange={(v) => setDrumSettings(d => ({...d, kickVolume: v[0]}))} disabled={isInitializing || drumSettings.pattern === 'none'}/></div>
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

