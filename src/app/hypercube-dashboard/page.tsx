'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Database, 
  Play, 
  Square,
  Upload, 
  Music, 
  Wind, 
  ShieldAlert,
  ArrowLeft,
  Save,
  RotateCcw,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Globe,
  Edit2,
  Check,
  X,
  Dna,
  Zap,
  Activity,
  History,
  TrendingUp,
  LayoutGrid,
  Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend
} from 'recharts';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, query, updateDoc } from 'firebase/firestore';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { saveHeritageAxiom } from '@/lib/firebase-service';
import { decompressCompactPhrase, DEGREE_TO_SEMITONE, repairLegacyPhrase } from '@/lib/music-theory';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { FractalEvent, InstrumentHints, Mood, CommonMood } from '@/types/fractal';
import type { Genre } from '@/types/music';

const PROCESSED_FILES_KEY = 'AuraGroove_ImportedFiles';

const AVAILABLE_GENRES: Genre[] = [
  'ambient', 'blues', 'trance', 'progressive', 'rock', 'house', 'rnb', 'ballad', 'reggae', 'celtic'
];

const AVAILABLE_MOODS: Mood[] = [
  'epic', 'joyful', 'enthusiastic', 'melancholic', 'dark', 'anxious', 'dreamy', 'contemplative', 'calm', 'gloomy'
];

const AVAILABLE_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

const DYNASTY_CONFIG: Record<string, { color: string, label: string }> = {
  'slow-burn': { color: '#FF6B6B', label: 'Slow Burn' },
  'texas': { color: '#4D96FF', label: 'Texas' },
  'soul': { color: '#6BCB77', label: 'Soul' },
  'chromatic': { color: '#FFD93D', label: 'Chromatic' },
  'legacy': { color: '#9B59B6', label: 'Legacy' },
  'lyrical': { color: '#1ABC9C', label: 'Lyrical' },
  'moody-blues': { color: '#34495E', label: 'Moody Blues' },
  'fifth-dimension': { color: '#E67E22', label: '5th Dimension' }
};

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light',
  joyful: 'light',
  enthusiastic: 'light',
  dreamy: 'neutral',
  contemplative: 'neutral',
  calm: 'neutral',
  melancholic: 'dark',
  dark: 'dark',
  anxious: 'dark',
  gloomy: 'dark'
};

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

export default function HypercubeDashboard() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { isInitialized, initialize, playRawEvents, stopAllSounds } = useAudioEngine();
  
  const axiomsQuery = useMemoFirebase(() => query(collection(db, 'heritage_axioms')), [db]);
  const { data: globalAxioms, isLoading: isDbLoading } = useCollection(axiomsQuery);

  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedAxioms, setStagedAxioms] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processedFiles, setProcessedFiles] = useState<string[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<Genre[]>(['blues']);
  const [playingAxiomId, setPlayingAxiomId] = useState<string | null>(null);
  const [explorerSearch, setFilterSearchText] = useState("");
  
  // Batch Track Selection
  const [selectedTrackGroups, setSelectedTrackGroups] = useState<Set<string>>(new Set());

  // Confirmation Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmAction] = useState<{ title: string, desc: string, action: () => void } | null>(null);

  // Renaming & Metadata State
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [editGenreValue, setEditGenreValue] = useState<Genre[]>([]);
  const [editMoodValue, setEditMoodValue] = useState<Mood[]>([]);
  const [editBpmValue, setEditBpmValue] = useState<string>("72");
  const [editKeyValue, setEditKeyValue] = useState<string>("E");
  const [editTsValue, setEditTsValue] = useState<string>("4/4");

  const [editingAxiomId, setEditingAxiomId] = useState<string | null>(null);
  const [editNarrativeValue, setEditNarrativeValue] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(PROCESSED_FILES_KEY);
    if (saved) {
      try {
        setProcessedFiles(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse import history");
      }
    }
  }, []);

  const globalStats = useMemo(() => {
    if (!globalAxioms) return { total: 0, genres: {}, moods: {}, commonMoods: {} };
    return globalAxioms.reduce((acc, ax) => {
      acc.total++;
      const genres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
      const moods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
      const commons = Array.isArray(ax.commonMood) ? ax.commonMood : [ax.commonMood];
      
      genres.forEach(g => { acc.genres[g] = (acc.genres[g] || 0) + 1; });
      moods.forEach(m => { acc.moods[m] = (acc.moods[m] || 0) + 1; });
      commons.forEach(cm => { acc.commonMoods[cm] = (acc.commonMoods[cm] || 0) + 1; });
      return acc;
    }, { 
        total: 0, 
        genres: {} as Record<string, number>, 
        moods: {} as Record<string, number>, 
        commonMoods: {} as Record<string, number> 
    });
  }, [globalAxioms]);

  const groupedAxioms = useMemo(() => {
    if (!globalAxioms) return [];
    const groups = globalAxioms.reduce((acc, ax) => {
      const id = ax.compositionId || "Unknown_Track";
      if (!acc[id]) acc[id] = [];
      acc[id].push(ax);
      return acc;
    }, {} as Record<string, any[]>);
    
    return Object.entries(groups)
      .filter(([id]) => id.toLowerCase().includes(explorerSearch.toLowerCase()))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [globalAxioms, explorerSearch]);

  const dynastyStats = useMemo(() => {
    if (!globalAxioms) return [];
    
    return Object.keys(DYNASTY_CONFIG).map(dynasty => {
        const relatedAxioms = globalAxioms.filter(ax => ax.tags?.includes(dynasty));
        const axiomCount = relatedAxioms.length;
        const compositions = Array.from(new Set(relatedAxioms.map(ax => ax.compositionId)));
        
        const avgVector = relatedAxioms.reduce((acc, ax) => {
            acc.t += ax.vector?.t || 0;
            acc.b += ax.vector?.b || 0;
            acc.e += ax.vector?.e || 0;
            acc.h += ax.vector?.h || 0;
            return acc;
        }, { t: 0, b: 0, e: 0, h: 0 });

        if (axiomCount > 0) {
            avgVector.t /= axiomCount;
            avgVector.b /= axiomCount;
            avgVector.e /= axiomCount;
            avgVector.h /= axiomCount;
        }

        return {
            id: dynasty,
            label: DYNASTY_CONFIG[dynasty].label,
            color: DYNASTY_CONFIG[dynasty].color,
            count: axiomCount,
            compositions,
            vector: avgVector
        };
    }).sort((a, b) => b.count - a.count);
  }, [globalAxioms]);

  const radarData = useMemo(() => {
    if (dynastyStats.length === 0) return [];
    
    const attributes = [
        { key: 't', label: 'Tension' },
        { key: 'b', label: 'Brightness' },
        { key: 'e', label: 'Entropy' },
        { key: 'h', label: 'Stability' }
    ];

    return attributes.map(attr => {
        const entry: any = { subject: attr.label };
        dynastyStats.forEach(dyn => {
            if (dyn.count > 0) {
                entry[dyn.id] = (dyn.vector as any)[attr.key] * 100;
            }
        });
        return entry;
    });
  }, [dynastyStats]);

  const resetStaging = () => {
    setStagedAxioms([]);
    setSelectedIds(new Set());
    setCurrentFileName('');
    setPlayingAxiomId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetStaging();

    const cleanFileName = file.name
        .replace(/\.[^/.]+$/, "") 
        .replace(/-axiom.*$/, "") 
        .replace(/\(\d+\)$/, "") 
        .trim();

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const flattened: any[] = [];
        
        const processAxiom = (ax: any, idx: number, compId: string) => {
            const repairedPhrase = repairLegacyPhrase(ax.phrase);
            return {
                ...ax,
                phrase: repairedPhrase,
                id: `${compId}_${ax.role}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
                compositionId: compId,
                genre: Array.isArray(ax.genre) ? ax.genre : (ax.genre ? [ax.genre] : []),
                mood: Array.isArray(ax.mood) ? ax.mood : (ax.mood ? [ax.mood] : []),
                commonMood: Array.isArray(ax.commonMood) ? ax.commonMood : (ax.commonMood ? [ax.commonMood] : (ax.mood ? [MOOD_TO_COMMON[Array.isArray(ax.mood) ? (ax.mood[0] as Mood) : (ax.mood as Mood)]] : ['neutral'])),
                nativeBpm: ax.nativeBpm || ax.bpm || null,
                nativeKey: ax.nativeKey || ax.key || null,
                timeSignature: ax.timeSignature || ax.ts || null
            };
        };

        if (Array.isArray(json)) {
            const targetId = cleanFileName || "Unknown_Heritage";
            json.forEach((ax, idx) => flattened.push(processAxiom(ax, idx, targetId)));
        } else {
            Object.entries(json).forEach(([trackName, licks]) => {
                (licks as any[]).forEach((lick, idx) => flattened.push(processAxiom(lick, idx, trackName)));
            });
        }

        setStagedAxioms(flattened);
        setSelectedIds(new Set(flattened.map(a => a.id)));
        setCurrentFileName(file.name);
      } catch (err) {
        toast({ variant: "destructive", title: "Parse Error", description: "Invalid AuraGroove DNA format." });
      }
    };
    reader.readAsText(file);
  };

  const handlePlayAxiom = async (axiom: any) => {
    if (playingAxiomId === axiom.id) {
        stopAllSounds();
        setPlayingAxiomId(null);
        return;
    }

    if (!isInitialized) await initialize();
    stopAllSounds();

    const phrase = decompressCompactPhrase(axiom.phrase);
    const roleToType: Record<string, string> = {
        'melody': 'melody',
        'bass': 'bass',
        'accomp': 'accompaniment',
        'drums': 'drums'
    };
    const type = roleToType[axiom.role] || 'melody';

    const events: FractalEvent[] = phrase.map((n: any) => ({
      type: type,
      note: (axiom.role === 'bass' ? 31 : (axiom.role === 'drums' ? 36 : 60)) + (DEGREE_TO_SEMITONE[n.deg] || 0),
      time: n.t / 3, 
      duration: n.d / 3,
      weight: 0.8,
      technique: n.tech as any,
      dynamics: 'p',
      phrasing: 'legato',
      params: { barCount: 0 },
      chordName: axiom.role === 'accomp' ? 'Am' : undefined
    }));

    const hints: InstrumentHints = {
        [type]: axiom.role === 'melody' ? 'blackAcoustic' : 
                (axiom.role === 'bass' ? 'bass_jazz_warm' : 
                (axiom.role === 'drums' ? 'melancholic' : 'organ_soft_jazz'))
    };

    playRawEvents(events, hints);
    setPlayingAxiomId(axiom.id);
  };

  const handleCommitInjection = async () => {
    setIsProcessing(true);
    let addedCount = 0;
    try {
      const toInject = stagedAxioms.filter(a => selectedIds.has(a.id));
      for (const ax of toInject) {
        const newMoods = ax.mood.length > 0 ? ax.mood : ['melancholic'];
        const newCommons = Array.from(new Set(newMoods.map((m: Mood) => MOOD_TO_COMMON[m])));
        
        await saveHeritageAxiom(db, {
          ...ax,
          genre: selectedGenre, 
          mood: newMoods,
          commonMood: newCommons,
          barOffset: 0,
          origin: `Manual_Forge_Injection_${currentFileName}`,
          timestamp: new Date().toISOString() as any,
          narrative: ax.narrative || "Heritage component.",
        });
        addedCount++;
      }
      setProcessedFiles(prev => [...new Set([...prev, currentFileName])]);
      localStorage.setItem(PROCESSED_FILES_KEY, JSON.stringify([...new Set([...processedFiles, currentFileName])]));
      toast({ title: "DNA Injected", description: `Committed ${addedCount} axioms.` });
      resetStaging();
    } catch (e) {
      toast({ variant: "destructive", title: "Injection Failed", description: String(e) });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAxiom = (id: string) => {
    setConfirmAction({
        title: "Delete Axiom",
        desc: "CRITICAL: Delete this specific axiom from Cloud? This action cannot be undone.",
        action: () => {
            const docRef = doc(db, 'heritage_axioms', id);
            deleteDocumentNonBlocking(docRef);
            toast({ title: "Purge Initiated", description: "Deleting axiom..." });
        }
    });
    setConfirmOpen(true);
  };

  const handleDeleteTrack = (compId: string, axioms: any[]) => {
    setConfirmAction({
        title: `Purge Track: ${compId.replace(/_/g, ' ')}`,
        desc: `CRITICAL: Delete entire track and all its ${axioms.length} axioms from Cloud?`,
        action: async () => {
            setIsProcessing(true);
            try {
                const CHUNK_SIZE = 450;
                for (let i = 0; i < axioms.length; i += CHUNK_SIZE) {
                    const chunk = axioms.slice(i, i + CHUNK_SIZE);
                    const batch = writeBatch(db);
                    chunk.forEach(ax => {
                        batch.delete(doc(db, 'heritage_axioms', ax.id));
                    });
                    await batch.commit();
                }
                toast({ title: "Track Purged", description: `Successfully deleted ${compId}` });
            } catch (e) {
                toast({ variant: "destructive", title: "Purge Failed" });
            } finally {
                setIsProcessing(false);
            }
        }
    });
    setConfirmOpen(true);
  };

  const handleWipeSelected = () => {
    if (selectedTrackGroups.size === 0) return;
    
    setConfirmAction({
        title: `WIPE SELECTED (${selectedTrackGroups.size} tracks)`,
        desc: `CRITICAL: Permanently delete all axioms associated with the ${selectedTrackGroups.size} selected tracks?`,
        action: async () => {
            setIsProcessing(true);
            try {
                const selectedAxioms = groupedAxioms
                    .filter(([compId]) => selectedTrackGroups.has(compId))
                    .flatMap(([, licks]) => licks);

                const CHUNK_SIZE = 450;
                for (let i = 0; i < selectedAxioms.length; i += CHUNK_SIZE) {
                    const chunk = selectedAxioms.slice(i, i + CHUNK_SIZE);
                    const batch = writeBatch(db);
                    chunk.forEach(ax => {
                        batch.delete(doc(db, 'heritage_axioms', ax.id));
                    });
                    await batch.commit();
                }
                
                setSelectedTrackGroups(new Set());
                toast({ title: "Selective Purge Complete", description: `Wiped ${selectedAxioms.length} axioms from ${selectedTrackGroups.size} tracks.` });
            } catch (e) {
                toast({ variant: "destructive", title: "Batch Purge Failed" });
            } finally {
                setIsProcessing(false);
            }
        }
    });
    setConfirmOpen(true);
  };

  const handleUpdateTrackMetadata = async (oldId: string, newId: string, newGenres: Genre[], newMoods: Mood[], newBpm: number, newKey: string, newTs: string, licks: any[]) => {
    setIsProcessing(true);
    try {
        const batch = writeBatch(db);
        const newCommonMoods = Array.from(new Set(newMoods.map(m => MOOD_TO_COMMON[m])));
        
        licks.forEach(ax => {
            const ref = doc(db, 'heritage_axioms', ax.id);
            batch.update(ref, { 
                compositionId: newId,
                genre: newGenres,
                mood: newMoods,
                commonMood: newCommonMoods,
                nativeBpm: newBpm,
                nativeKey: newKey,
                timeSignature: newTs
            });
        });
        await batch.commit();
        toast({ title: "Track Updated", description: `Updated ${licks.length} axioms successfully.` });
    } catch (e) {
        toast({ variant: "destructive", title: "Update Failed" });
    } finally {
        setIsProcessing(false);
        setEditingGroupId(null);
    }
  };

  const handleUpdateNarrative = async (axiomId: string, newNarrative: string) => {
    try {
        const ref = doc(db, 'heritage_axioms', axiomId);
        await updateDoc(ref, { narrative: newNarrative });
        toast({ title: "Narrative Updated" });
    } catch (e) {
        toast({ variant: "destructive", title: "Update Failed" });
    } finally {
        setEditingAxiomId(null);
    }
  };

  const handlePurgeAll = () => {
    setConfirmAction({
        title: "MASTER PURGE",
        desc: "Wipe entire database? This will delete ALL heritage axioms. This cannot be undone.",
        action: async () => {
            setIsProcessing(true);
            try {
                if (!globalAxioms || globalAxioms.length === 0) return;

                const CHUNK_SIZE = 450;
                for (let i = 0; i < globalAxioms.length; i += CHUNK_SIZE) {
                    const chunk = globalAxioms.slice(i, i + CHUNK_SIZE);
                    const batch = writeBatch(db);
                    chunk.forEach(axiom => {
                        batch.delete(doc(db, 'heritage_axioms', axiom.id));
                    });
                    await batch.commit();
                }

                setProcessedFiles([]);
                localStorage.removeItem(PROCESSED_FILES_KEY);
                toast({ title: "Hypercube Cleared", description: "All heritage DNA has been successfully purged." });
            } catch (e) {
                console.error("[MasterPurge] Critical failure:", e);
                toast({ variant: "destructive", title: "Purge Failed", description: "Batch limit or quota exceeded." });
            } finally {
                setIsProcessing(false);
            }
        }
    });
    setConfirmOpen(true);
  };

  const toggleTrackSelection = (compId: string) => {
    const next = new Set(selectedTrackGroups);
    if (next.has(compId)) next.delete(compId);
    else next.add(compId);
    setSelectedTrackGroups(next);
  };

  const selectAllFiltered = () => {
    if (selectedTrackGroups.size === groupedAxioms.length) {
        setSelectedTrackGroups(new Set());
    } else {
        setSelectedTrackGroups(new Set(groupedAxioms.map(([compId]) => compId)));
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-body">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-3">
              <Database className="h-10 w-10" /> DNA Auditor
            </h1>
            <p className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.2em] opacity-70">Heritage Repair & Selective Injection Station</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { stopAllSounds(); setPlayingAxiomId(null); }} className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10">
                <Square className="h-4 w-4" /> Stop Audition
            </Button>
            <Button variant="ghost" onClick={() => router.push('/aura-groove')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Return to Плеер
            </Button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20 shadow-lg">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global Capacity</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-black text-primary font-mono">{isDbLoading ? '---' : globalStats.total}</div></CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20 shadow-lg">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Genre Map</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {Object.entries(globalStats.genres).map(([g, count]) => (
                    <Badge key={g} variant="secondary" className="text-[10px] uppercase font-bold py-0.5">{g}: {count}</Badge>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20 shadow-lg">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mood Balance</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {Object.entries(globalStats.commonMoods).map(([cm, count]) => (
                    <Badge key={cm} className="text-[10px] uppercase font-black">{cm}: {count}</Badge>
                ))}
              </CardContent>
            </Card>
        </div>

        {/* Main Interface */}
        <Tabs defaultValue="explore" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/30 p-1 border border-border/50">
            <TabsTrigger value="explore" className="text-xs font-bold uppercase tracking-wider data-[state=active]:bg-card">
              <Globe className="h-4 w-4 mr-2" /> Explore
            </TabsTrigger>
            <TabsTrigger value="genetic" className="text-xs font-bold uppercase tracking-wider data-[state=active]:bg-card">
              <Dna className="h-4 w-4 mr-2" /> Genetic Map
            </TabsTrigger>
            <TabsTrigger value="inject" className="text-xs font-bold uppercase tracking-wider data-[state=active]:bg-card">
              <Upload className="h-4 w-4 mr-2" /> Inject DNA
            </TabsTrigger>
          </TabsList>

          {/* TAB: EXPLORE */}
          <TabsContent value="explore" className="space-y-4">
            <Card className="border-border/50 shadow-xl bg-card/50">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                      <Search className="h-5 w-5" /> Cloud Inventory
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold">Inspect and Curate Heritage Axioms</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedTrackGroups.size > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleWipeSelected} disabled={isProcessing} className="shadow-lg animate-in fade-in zoom-in duration-200">
                            <Trash2 className="h-4 w-4 mr-2" /> Wipe Selected ({selectedTrackGroups.size})
                        </Button>
                    )}
                    <div className="relative group">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder="Search composition..." 
                        className="pl-9 h-9 text-xs bg-background/50"
                        value={explorerSearch}
                        onChange={(e) => setFilterSearchText(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={handlePurgeAll} disabled={isProcessing} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                      <ShieldAlert className="h-4 w-4 mr-2" /> Wipe Base
                    </Button>
                  </div>
                </div>
                {groupedAxioms.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 px-1">
                        <Button variant="ghost" size="sm" onClick={selectAllFiltered} className="h-7 text-[10px] uppercase font-black tracking-tighter">
                            {selectedTrackGroups.size === groupedAxioms.length ? "Deselect All" : "Select All Tracks"}
                        </Button>
                    </div>
                )}
              </CardHeader>
              <CardContent className="p-0 border-t">
                <ScrollArea className="h-[600px] px-4 py-2">
                  {isDbLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40 animate-pulse">
                      <Database className="h-12 w-12 mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">Reading Cloud...</p>
                    </div>
                  ) : groupedAxioms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                      <Database className="h-12 w-12 mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">No DNA Found</p>
                    </div>
                  ) : (
                    <Accordion type="multiple" className="space-y-2">
                      {groupedAxioms.map(([compId, licks]) => (
                        <AccordionItem key={compId} value={compId} className="border border-border/50 rounded-lg overflow-hidden bg-background/30">
                          <div className="flex flex-col px-4 hover:bg-primary/5 transition-colors group">
                            <div className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-4 flex-grow">
                                    <Checkbox 
                                        checked={selectedTrackGroups.has(compId)} 
                                        onCheckedChange={() => toggleTrackSelection(compId)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="border-primary/30"
                                    />
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 text-[10px] font-black">{licks.length}</Badge>
                                    
                                    {editingGroupId === compId ? (
                                        <div className="flex flex-col gap-3 w-full max-w-2xl bg-background/80 p-4 rounded-lg border border-primary/20" onClick={(e) => e.stopPropagation()}>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] uppercase font-black opacity-70">Track Name</Label>
                                                <Input 
                                                    value={editNameValue} 
                                                    onChange={(e) => setEditNameValue(e.target.value)}
                                                    className="h-8 text-sm"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase font-black opacity-70">Genre</Label>
                                                    <MultiSelector 
                                                      options={AVAILABLE_GENRES} 
                                                      values={editGenreValue} 
                                                      onValuesChange={setEditGenreValue}
                                                      placeholder="Select genres..."
                                                      className="w-full"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase font-black opacity-70">Mood</Label>
                                                    <MultiSelector 
                                                      options={AVAILABLE_MOODS} 
                                                      values={editMoodValue} 
                                                      onValuesChange={setEditMoodValue}
                                                      placeholder="Select moods..."
                                                      className="w-full"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase font-black opacity-70">BPM</Label>
                                                    <Input value={editBpmValue} onChange={(e) => setEditBpmValue(e.target.value)} className="h-8 text-xs bg-background" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase font-black opacity-70">Key</Label>
                                                    <Select value={editKeyValue} onValueChange={setEditKeyValue}>
                                                        <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {AVAILABLE_KEYS.map(k => <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase font-black opacity-70">Signature</Label>
                                                    <Select value={editTsValue} onValueChange={setEditTsValue}>
                                                        <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="4/4" className="text-xs">4/4</SelectItem>
                                                            <SelectItem value="3/4" className="text-xs">3/4</SelectItem>
                                                            <SelectItem value="5/4" className="text-xs">5/4</SelectItem>
                                                            <SelectItem value="7/8" className="text-xs">7/8</SelectItem>
                                                            <SelectItem value="12/8" className="text-xs">12/8</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-2">
                                                <Button size="sm" className="gap-2 font-black uppercase text-[10px]" onClick={() => handleUpdateTrackMetadata(compId, editNameValue, editGenreValue, editMoodValue, parseInt(editBpmValue) || 72, editKeyValue, editTsValue, licks)}>
                                                    <Check className="h-3.5 w-3.5" /> Save Changes
                                                </Button>
                                                <Button size="sm" variant="ghost" className="gap-2 font-black uppercase text-[10px]" onClick={() => setEditingGroupId(null)}>
                                                    <X className="h-3.5 w-3.5" /> Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-0.5 flex-grow cursor-pointer" onClick={() => {
                                            setEditingGroupId(compId);
                                            setEditNameValue(compId);
                                            setEditGenreValue(Array.isArray(licks[0].genre) ? licks[0].genre : [licks[0].genre]);
                                            setEditMoodValue(Array.isArray(licks[0].mood) ? licks[0].mood : [licks[0].mood]);
                                            setEditBpmValue(String(licks[0].nativeBpm || 72));
                                            setEditKeyValue(licks[0].nativeKey || "E");
                                            setEditTsValue(licks[0].timeSignature || "4/4");
                                        }}>
                                            <div className="text-sm font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                                {compId.replace(/_/g, ' ')}
                                                <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter flex gap-2">
                                                <span>Genre: <span className="text-foreground">{(Array.isArray(licks[0].genre) ? licks[0].genre : [licks[0].genre]).join(', ')}</span></span>
                                                <span className="opacity-30">|</span>
                                                <span>Mood: <span className="text-foreground">{(Array.isArray(licks[0].mood) ? licks[0].mood : [licks[0].mood]).join(', ')}</span></span>
                                                <span className="opacity-30">|</span>
                                                <span>Meta: <span className="text-foreground">{licks[0].nativeBpm || '??'} BPM / {licks[0].nativeKey || '??'} / {licks[0].timeSignature || '??'}</span></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <AccordionTrigger className="hover:no-underline w-auto px-4" />
                                
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteTrack(compId, licks); }} className="text-muted-foreground hover:text-destructive h-8 w-8 ml-2">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                          </div>
                          <AccordionContent className="p-0 bg-muted/10 border-t">
                            <div className="divide-y divide-border/20">
                              {licks.map((ax: any, idx: number) => (
                                <div key={ax.id} className="flex items-center gap-4 p-3 pl-12 hover:bg-primary/5 transition-colors group/row">
                                  <Badge variant="outline" className="text-[10px] uppercase font-black w-16 justify-center bg-background/50">{ax.role}</Badge>
                                  
                                  <div className="flex-grow min-w-0">
                                    {editingAxiomId === ax.id ? (
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                value={editNarrativeValue} 
                                                onChange={(e) => setEditNarrativeValue(e.target.value)}
                                                className="h-7 text-xs w-full"
                                                autoFocus
                                            />
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => handleUpdateNarrative(ax.id, editNarrativeValue)}>
                                                <Check className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingAxiomId(null)}>
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="cursor-pointer" onClick={() => {
                                            setEditingAxiomId(ax.id);
                                            setEditNarrativeValue(ax.narrative || "");
                                        }}>
                                            <div className="text-xs italic text-muted-foreground line-clamp-1 opacity-80 flex items-center gap-2">
                                                {ax.narrative}
                                                <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-[9px] font-mono text-muted-foreground mt-0.5">Vector: [{ax.vector?.t?.toFixed(1)}, {ax.vector?.b?.toFixed(1)}, {ax.vector?.e?.toFixed(1)}, {ax.vector?.h?.toFixed(1)}]</div>
                                        </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button size="icon" variant="ghost" onClick={() => handlePlayAxiom(ax)} className="h-8 w-8 hover:bg-primary/20">
                                      {playingAxiomId === ax.id ? <Square className="h-4 w-4 fill-current text-destructive" /> : <Play className="h-4 w-4 fill-current" />}
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteAxiom(ax.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: GENETIC MAP */}
          <TabsContent value="genetic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Radar Chart Card */}
                <Card className="lg:col-span-2 border-border/50 shadow-xl bg-card/50 overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                            <TrendingUp className="h-5 w-5" /> Genetic Spectrum
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Multi-dimensional Dynasty Profiling</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[450px] p-4 pt-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 900 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                
                                {dynastyStats.map(dyn => (
                                    dyn.count > 0 && (
                                        <Radar
                                            key={dyn.id}
                                            name={dyn.label}
                                            dataKey={dyn.id}
                                            stroke={dyn.color}
                                            fill={dyn.color}
                                            fillOpacity={0.15}
                                            strokeWidth={2}
                                        />
                                    )
                                ))}
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "10px" }}
                                    itemStyle={{ fontWeight: "bold" }}
                                />
                                <RechartsLegend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Quick Legend / Distribution */}
                <Card className="border-border/50 shadow-xl bg-card/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Genotype Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[400px] px-4">
                            <div className="space-y-3 pb-4">
                                {dynastyStats.map(dyn => (
                                    <div key={dyn.id} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: dyn.color }} />
                                                <span className="text-[10px] font-black uppercase">{dyn.label}</span>
                                            </div>
                                            <span className="text-[10px] font-mono opacity-60">{dyn.count} phrases</span>
                                        </div>
                                        <Progress value={(dyn.count / (globalStats.total || 1)) * 100} className="h-1 bg-muted" style={{ "--progress-color": dyn.color } as any} />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/50 shadow-xl bg-card/50">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                  <Dna className="h-5 w-5" /> Detailed Ancestry
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Global DNA Pool Segmentation & Analytical Mapping</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dynastyStats.map((dynasty) => (
                      <Card key={dynasty.id} className="bg-background/40 border-border/50 hover:border-primary/30 transition-all group overflow-hidden">
                        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                          <div className="space-y-0.5">
                            <CardTitle className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors" style={{ color: dynasty.color }}>{dynasty.label}</CardTitle>
                            <CardDescription className="text-[10px] font-bold opacity-70">{dynasty.compositions.length} Bloodlines Injected</CardDescription>
                          </div>
                          <Badge className="font-mono text-xs" style={{ backgroundColor: `${dynasty.color}20`, color: dynasty.color, borderColor: `${dynasty.color}40` }}>{dynasty.count}</Badge>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 space-y-4">
                          {/* Vector Visuals */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] uppercase font-black opacity-60"><span>Tension</span><span>{Math.round(dynasty.vector.t * 100)}%</span></div>
                              <Progress value={dynasty.vector.t * 100} className="h-1.5 bg-muted" style={{ "--progress-color": dynasty.color } as any} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] uppercase font-black opacity-60"><span>Brightness</span><span>{Math.round(dynasty.vector.b * 100)}%</span></div>
                              <Progress value={dynasty.vector.b * 100} className="h-1.5 bg-muted" style={{ "--progress-color": dynasty.color } as any} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] uppercase font-black opacity-60"><span>Entropy</span><span>{Math.round(dynasty.vector.e * 100)}%</span></div>
                              <Progress value={dynasty.vector.e * 100} className="h-1.5 bg-muted" style={{ "--progress-color": dynasty.color } as any} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] uppercase font-black opacity-60"><span>Stability</span><span>{Math.round(dynasty.vector.h * 100)}%</span></div>
                              <Progress value={dynasty.vector.h * 100} className="h-1.5 bg-muted" style={{ "--progress-color": dynasty.color } as any} />
                            </div>
                          </div>

                          {/* Member Tracks */}
                          <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-black opacity-40 flex items-center gap-1.5">
                              <History className="h-3 w-3" /> Member Records
                            </Label>
                            <div className="flex flex-wrap gap-1">
                              {dynasty.compositions.slice(0, 5).map(c => (
                                <Badge key={c} variant="outline" className="text-[9px] font-bold border-primary/10 bg-background/50 px-1.5">{c.replace(/_/g, ' ')}</Badge>
                              ))}
                              {dynasty.compositions.length > 5 && (
                                <Badge variant="secondary" className="text-[9px] font-black opacity-50">+{dynasty.compositions.length - 5} more</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: INJECT */}
          <TabsContent value="inject" className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-6 rounded-xl border border-border/50 shadow-inner">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="bg-primary hover:bg-primary/90 h-12 px-8 shadow-lg active:scale-95 transition-transform font-bold uppercase tracking-wider">
                <Upload className="mr-3 h-5 w-5" /> Load Local DNA
              </Button>
              <div className="flex items-center gap-3 pl-6 border-l border-border/50">
                <Label htmlFor="genre-inject" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Target Genres:</Label>
                <MultiSelector 
                  options={AVAILABLE_GENRES} 
                  values={selectedGenre} 
                  onValuesChange={setSelectedGenre}
                  placeholder="Select genres..."
                  className="w-[240px] h-10 font-bold"
                />
              </div>
            </div>

            {stagedAxioms.length > 0 && (
              <Card className="border-primary/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-4">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2"><Wind className="h-6 w-6 text-primary"/> Staging Buffer: {currentFileName}</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold text-primary/70">Local Heritage Ready for Synchronization</CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" size="sm" onClick={resetStaging} className="text-muted-foreground uppercase text-[10px] font-bold">Clear Buffer</Button>
                    <Button onClick={handleCommitInjection} disabled={isProcessing || selectedIds.size === 0} className="gap-3 font-black uppercase tracking-widest px-8 h-11 shadow-xl">
                      <Save className={cn("h-5 w-5", isProcessing && "animate-spin")} />
                      Inject {selectedIds.size} Axioms
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto max-h-[550px]">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0 z-10 border-b">
                        <tr className="text-left text-muted-foreground text-[10px] uppercase tracking-widest">
                          <th className="p-4 w-12 text-center">
                            <Checkbox checked={selectedIds.size === stagedAxioms.length} onCheckedChange={(checked) => {
                                if (checked) setSelectedIds(new Set(stagedAxioms.map(a => a.id)));
                                else setSelectedIds(new Set());
                            }} />
                          </th>
                          <th className="p-4 font-black">Source</th>
                          <th className="p-4 font-black">Role</th>
                          <th className="p-4 font-black">Native Meta</th>
                          <th className="p-4 font-black">Vector (t,b,e,h)</th>
                          <th className="p-4 font-black">Narrative</th>
                          <th className="p-4 font-black text-right">Preview</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {stagedAxioms.map((ax) => (
                          <tr key={ax.id} className="hover:bg-primary/5 transition-colors group">
                            <td className="p-4 text-center">
                              <Checkbox checked={selectedIds.has(ax.id)} onCheckedChange={() => {
                                  const next = new Set(selectedIds);
                                  if (next.has(ax.id)) next.delete(ax.id); else next.add(ax.id);
                                  setSelectedIds(next);
                              }} />
                            </td>
                            <td className="p-4 font-bold text-primary text-[11px] uppercase tracking-tight">{ax.compositionId.replace(/_/g, ' ')}</td>
                            <td className="p-4"><Badge variant="outline" className="capitalize text-[10px] font-black px-2">{ax.role}</Badge></td>
                            <td className="p-4 text-[10px] font-mono text-muted-foreground opacity-70">
                                {ax.nativeBpm || 'Elastic'} / {ax.nativeKey || 'Universal'} / {ax.timeSignature || '4/4'}
                            </td>
                            <td className="p-4 font-mono text-[10px] text-muted-foreground">
                              [{ax.vector?.t?.toFixed(1) || 0}, {ax.vector?.b?.toFixed(1) || 0}, {ax.vector?.e?.toFixed(1) || 0}, {ax.vector?.h?.toFixed(1) || 0}]
                            </td>
                            <td className="p-4 text-xs italic text-muted-foreground line-clamp-2">{ax.narrative}</td>
                            <td className="p-4 text-right">
                              <Button size="icon" variant="ghost" onClick={() => handlePlayAxiom(ax)} className="h-10 w-10 hover:bg-primary/20">
                                {playingAxiomId === ax.id ? <Square className="h-5 w-5 fill-current text-destructive animate-pulse" /> : <Play className="h-5 w-5 fill-current" />}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

      </div>

      {/* Global Alert Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-primary/20 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary font-black uppercase tracking-tight">
              {confirmConfig?.title || "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-bold">
              {confirmConfig?.desc || "This action is critical and cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="uppercase text-[10px] font-black">Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => {
                    confirmConfig?.action();
                    setConfirmOpen(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 uppercase text-[10px] font-black"
            >
              Confirm Execution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
