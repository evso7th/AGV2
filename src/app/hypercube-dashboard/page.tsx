'use client';

/**
 * @fileOverview DNA Auditor V6.8 — "Full Editor Restoration".
 * #ЗАЧЕМ: Восстановление колонки инструментов и параметра Note Count.
 * #ЧТО: ПЛАН №1330 — Интеграция Preferred Instrument (пресеты + динамические группы).
 */

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
  Search,
  Trash2,
  Globe,
  Edit2,
  Check,
  X,
  Dna,
  TrendingUp,
  LayoutGrid,
  RotateCcw,
  Download,
  FileJson,
  History,
  Heart,
  Star,
  Eye,
  EyeOff,
  Settings2,
  Mic2,
  Activity,
  Navigation,
  Volume2,
  Lock,
  Unlock,
  Plus,
  RefreshCw,
  FileText,
  UserCheck,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, useUser, useAuth } from '@/firebase';
import { collection, doc, writeBatch, query, updateDoc } from 'firebase/firestore';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { saveHeritageAxiom, saveProjectDocument } from '@/lib/firebase-service';
import { decompressCompactPhrase, repairLegacyPhrase, SEMITONE_TO_DEGREE, DEGREE_KEYS, TECHNIQUE_KEYS, keyToMidiRoot, DEGREE_TO_SEMITONE, normalizeStr, TICK_TO_BEAT, mergeIdenticalNotes } from '@/lib/music-theory';
import { readProjectRootManifests } from '@/app/actions/manifest-actions';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { FractalEvent, InstrumentHints, Mood, CommonMood } from '@/types/fractal';
import type { Genre } from '@/types/music';

// ───── ROOT ACCESS CONSTANTS ─────
const ROOT_OPERATOR_ID = "ER24LvlifBafiYPf5sLRkYW0aUD3";
const ROOT_MASTER_KEY = "96dmhwmnfgn";
const STORAGE_ACCESS_KEY = "AG_ROOT_ACCESS_V6.8";

const AVAILABLE_GENRES: Genre[] = [
  'ambient', 'blues', 'psybient', 'progressive', 'rock', 'house', 'rnb', 'ballad', 'reggae', 'celtic'
];

const AVAILABLE_MOODS: Mood[] = [
  'epic', 'joyful', 'enthusiastic', 'melancholic', 'dark', 'anxious', 'dreamy', 'contemplative', 'calm', 'gloomy'
];

const AVAILABLE_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

const ROLE_OPTIONS = ['melody', 'accomp', 'bass', 'drums', 'pianoAccompaniment'];

const PREFERRED_INST_OPTIONS = [
    'none', 'telecaster', 'blackAcoustic', 'darkTelecaster', 'cs80', 'guitar_shineOn', 'guitar_muffLead',
    'organ_soft_jazz', 'organ_prog', 'organ', 'synth', 'synth_ambient_pad_lush', 'synth_cave_pad',
    'piano', 'ep_rhodes_warm', 'violin', 'flute', 'bass_jazz_warm', 'bass_blues', 'bass_808',
    'dynamicOrgan', 'dynamicPad', 'dynteledark', 'dynblackteledark', 'dyntelecs80black', 'dynblackcs80shine', 'dynshinemuff',
    'dynbasswarmblues', 'dynbassfretlessjazz', 'dynrhodespiano'
];

const DYNASTY_CONFIG: Record<string, { color: string, label: string }> = {
  'slow-burn': { color: '#FF6B6B', label: 'Slow Burn' },
  'texas': { color: '#4D96FF', label: 'Texas' },
  'soul': { color: '#6BCB77', label: 'Soul' },
  'chromatic': { color: '#FFD93D', label: 'Chromatic' },
  'legacy': { color: '#9B59B6', label: 'Legacy' },
  'lyrical': { color: '#1ABC9C', label: 'Lyrical' }
};

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

// ───── HELPER COMPONENTS ─────

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

// ───── MAIN AUDITOR CONTENT ─────

function AuditorContent() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { isInitialized, initialize, playRawEvents, stopAllSounds } = useAudioEngine();
  
  const axiomsQuery = useMemoFirebase(() => query(collection(db, 'heritage_axioms')), [db]);
  const { data: globalAxioms, isLoading: isDbLoading } = useCollection(axiomsQuery);

  const masterpiecesQuery = useMemoFirebase(() => query(collection(db, 'masterpieces')), [db]);
  const { data: globalMasterpieces, isLoading: isMpiecesLoading } = useCollection(masterpiecesQuery);

  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedAxioms, setStagedAxioms] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<Genre[]>(['blues']);
  const [playingAxiomId, setPlayingAxiomId] = useState<string | null>(null);
  const [explorerSearch, setFilterSearchText] = useState("");
  
  const [selectedFilterGenres, setSelectedFilterGenres] = useState<Genre[]>([]);
  const [selectedFilterMoods, setSelectedFilterMoods] = useState<Mood[]>([]);
  
  const [selectedTrackGroups, setSelectedTrackGroups] = useState<Set<string>>(new Set());
  const [bulkMoodValue, setBulkMoodValue] = useState<Mood[]>([]);
  const [bulkMoodOpen, setBulkMoodOpen] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmAction] = useState<{ title: string, desc: string, action: () => void } | null>(null);

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [editGenreValue, setEditGenreValue] = useState<Genre[]>([]);
  const [editMoodValue, setEditMoodValue] = useState<Mood[]>([]);
  const [editBpmValue, setEditBpmValue] = useState<string>("72");
  const [editKeyValue, setEditKeyValue] = useState<string>("E");
  const [editTsValue, setEditTsValue] = useState<string>("4/4");

  const [editingAxiomId, setEditingAxiomId] = useState<string | null>(null);
  const [editAxiomData, setEditAxiomData] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats computation
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
      .filter(([id, licks]) => {
        const matchesSearch = id.toLowerCase().includes(explorerSearch.toLowerCase());
        const firstLick = licks[0];
        const lickGenres = Array.isArray(firstLick.genre) ? firstLick.genre : [firstLick.genre];
        const lickMoods = Array.isArray(firstLick.mood) ? firstLick.mood : [firstLick.mood];
        const matchesGenre = selectedFilterGenres.length === 0 || selectedFilterGenres.some(g => lickGenres.includes(g));
        const matchesMood = selectedFilterMoods.length === 0 || selectedFilterMoods.some(m => lickMoods.includes(m));
        return matchesSearch && matchesGenre && matchesMood;
      })
      .sort(([a], [b]) => a.localeCompare(b));
  }, [globalAxioms, explorerSearch, selectedFilterGenres, selectedFilterMoods]);

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
            avgVector.t /= axiomCount; avgVector.b /= axiomCount; avgVector.e /= axiomCount; avgVector.h /= axiomCount;
        }
        return { id: dynasty, label: DYNASTY_CONFIG[dynasty].label, color: DYNASTY_CONFIG[dynasty].color, count: axiomCount, compositions, vector: avgVector };
    }).sort((a, b) => b.count - a.count);
  }, [globalAxioms]);

  const radarData = useMemo(() => {
    return [
      { subject: 'Tension', ...Object.fromEntries(dynastyStats.map(d => [d.id, d.vector.t * 100])) },
      { subject: 'Brightness', ...Object.fromEntries(dynastyStats.map(d => [d.id, d.vector.b * 100])) },
      { subject: 'Entropy', ...Object.fromEntries(dynastyStats.map(d => [d.id, d.vector.e * 100])) },
      { subject: 'Stability', ...Object.fromEntries(dynastyStats.map(d => [d.id, d.vector.h * 100])) },
    ];
  }, [dynastyStats]);

  // Handler Logic
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cleanFileName = file.name.replace(/\.[^/.]+$/, "").replace(/-axiom.*$/, "").trim();
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        let flattened: any[] = [];
        const processAxiom = (ax: any, idx: number, compId: string) => {
            const repairedPhrase = repairLegacyPhrase(ax.phrase || []);
            const calculatedNoteCount = Math.floor(repairedPhrase.length / 4);
            return {
                ...ax, 
                phrase: repairedPhrase, 
                role: ax.role || 'melody', 
                id: `${compId}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
                compositionId: compId, 
                genre: Array.isArray(ax.genre) ? ax.genre : [ax.genre || 'blues'],
                mood: Array.isArray(ax.mood) ? ax.mood : [ax.mood || 'melancholic'],
                vector: ax.vector || { t: 0.5, b: 0.5, e: 0.5, h: 0.5 },
                noteCount: ax.noteCount || calculatedNoteCount,
                preferredInstrument: ax.preferredInstrument || null
            };
        };

        if (Array.isArray(json)) {
            json.forEach((ax, idx) => flattened.push(processAxiom(ax, idx, cleanFileName)));
        } else {
            Object.entries(json).forEach(([trackName, licks]) => {
                if (Array.isArray(licks)) licks.forEach((lick, idx) => flattened.push(processAxiom(lick, idx, trackName)));
            });
        }
        setStagedAxioms(flattened);
        setSelectedIds(new Set(flattened.map(a => a.id)));
        setCurrentFileName(file.name);
      } catch (err) { toast({ variant: "destructive", title: "Parse Error" }); }
    };
    reader.readAsText(file);
  };

  const handlePlayAxiom = async (axiom: any) => {
    if (playingAxiomId === axiom.id) { stopAllSounds(); setPlayingAxiomId(null); return; }
    if (!isInitialized) await initialize();
    stopAllSounds();
    const phrase = decompressCompactPhrase(axiom.phrase);
    if (phrase.length === 0) return;
    const minTick = Math.min(...phrase.map(n => n.t));
    const events: FractalEvent[] = phrase.map(n => ({
        type: axiom.role === 'bass' ? 'bass' : 'melody',
        note: (axiom.role === 'bass' ? 31 : 60) + (DEGREE_TO_SEMITONE[n.deg] || 0),
        time: (n.t - minTick) * TICK_TO_BEAT,
        duration: n.d * TICK_TO_BEAT,
        weight: 0.8, technique: n.tech as any, dynamics: 'p', phrasing: 'legato'
    }));
    playRawEvents(events, {}, axiom.nativeBpm || 72);
    setPlayingAxiomId(axiom.id);
  };

  const handleUpdateTrackMetadata = async (oldId: string, newId: string, newG: Genre[], newM: Mood[], newBpm: number, newKey: string, newTs: string, licks: any[]) => {
    setIsProcessing(true);
    try {
        const batch = writeBatch(db);
        const newCommonMoods = Array.from(new Set(newM.map(m => MOOD_TO_COMMON[m])));
        licks.forEach(ax => { 
            batch.update(doc(db, 'heritage_axioms', ax.id), { 
                compositionId: newId, genre: newG, mood: newM, commonMood: newCommonMoods,
                nativeBpm: newBpm, nativeKey: newKey, timeSignature: newTs 
            }); 
        });
        await batch.commit();
        toast({ title: "Track Updated" });
    } finally { setIsProcessing(false); setEditingGroupId(null); }
  };

  const handleBulkSetMood = async (moods: Mood[]) => {
    if (selectedTrackGroups.size === 0) return;
    setIsProcessing(true);
    try {
        const batch = writeBatch(db);
        const newCommonMoods = Array.from(new Set(moods.map(m => MOOD_TO_COMMON[m])));
        groupedAxioms.filter(([id]) => selectedTrackGroups.has(id)).forEach(([, licks]) => {
            licks.forEach(ax => batch.update(doc(db, 'heritage_axioms', ax.id), { mood: moods, commonMood: newCommonMoods }));
        });
        await batch.commit();
        setBulkMoodOpen(false);
        toast({ title: "Bulk Update Complete" });
    } finally { setIsProcessing(false); }
  };

  const handleDeleteAxiom = (id: string) => {
    setConfirmAction({ title: "Delete Axiom", desc: "Permanently delete this specific axiom?", action: () => { deleteDocumentNonBlocking(doc(db, 'heritage_axioms', id)); toast({ title: "Purge Initiated" }); } });
    setConfirmOpen(true);
  };

  const handleDeleteTrack = (compId: string, licks: any[]) => {
    setConfirmAction({ title: `Purge Track: ${compId}`, desc: `Delete entire track and all ${licks.length} axioms?`, action: async () => {
            setIsProcessing(true);
            try {
                const batch = writeBatch(db);
                licks.forEach(ax => batch.delete(doc(db, 'heritage_axioms', ax.id)));
                await batch.commit();
                toast({ title: "Track Purged" });
            } finally { setIsProcessing(false); }
        }
    });
    setConfirmOpen(true);
  };

  const handleWipeSelected = async () => {
    setConfirmAction({
        title: `WIPE SELECTED (${selectedTrackGroups.size} tracks)`,
        desc: "Permanently delete all selected axioms?",
        action: async () => {
            setIsProcessing(true);
            try {
                const batch = writeBatch(db);
                const selected = groupedAxioms.filter(([id]) => selectedTrackGroups.has(id)).flatMap(([, l]) => l);
                selected.forEach(ax => batch.delete(doc(db, 'heritage_axioms', ax.id)));
                await batch.commit();
                setSelectedTrackGroups(new Set());
                toast({ title: "Batch Purged" });
            } finally { setIsProcessing(false); }
        }
    });
    setConfirmOpen(true);
  };

  const handlePushRootToCloud = async () => {
      setIsProcessing(true);
      try {
          const files = await readProjectRootManifests();
          for (const file of files) {
              await saveProjectDocument(db, { filename: file.filename, content: file.content, version: '1.1' });
          }
          toast({ title: "Sync Complete" });
      } finally { setIsProcessing(false); }
  };

  const handleSaveAxiomEdits = async () => {
    if (!editAxiomData) return;
    setIsProcessing(true);
    try {
        await updateDoc(doc(db, 'heritage_axioms', editAxiomData.id), { 
            role: editAxiomData.role, 
            narrative: editAxiomData.narrative, 
            vector: editAxiomData.vector,
            nativeBpm: parseInt(editAxiomData.nativeBpm) || null, 
            nativeKey: editAxiomData.nativeKey,
            noteCount: parseInt(editAxiomData.noteCount) || 0,
            barOffset: parseInt(editAxiomData.barOffset) || 0,
            preferredInstrument: editAxiomData.preferredInstrument || null
        });
        toast({ title: "Axiom Updated" }); setEditingAxiomId(null);
    } finally { setIsProcessing(false); }
  };

  const handleCommitSelection = async () => {
    setIsProcessing(true);
    try {
      const toInject = stagedAxioms.filter(a => selectedIds.has(a.id));
      for (const ax of toInject) {
        await saveHeritageAxiom(db, { ...ax, genre: selectedGenre });
      }
      toast({ title: "DNA Injected" }); setStagedAxioms([]);
    } finally { setIsProcessing(false); }
  };

  const getSortedLicks = (licks: any[]) => {
      return [...licks].sort((a, b) => (a.barOffset || 0) - (b.barOffset || 0));
  };

  const handleExportTrack = (compId: string, licks: any[]) => {
    const cleanLicks = licks.map(({ id, timestamp, ...rest }) => ({ ...rest }));
    const blob = new Blob([JSON.stringify(cleanLicks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${compId.replace(/\s+/g, '_')}-axiom.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast({ title: "DNA Exported" });
  };

  const handleToggleIgnore = async (axiom: any) => {
    setIsProcessing(true);
    try {
        await updateDoc(doc(db, 'heritage_axioms', axiom.id), { ignored: !axiom.ignored });
        toast({ title: axiom.ignored ? "Axiom Restored" : "Axiom Ignored" });
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 flex-grow flex flex-col">
      <header className="flex items-center justify-between shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-3"><Database className="h-10 w-10" /> DNA Auditor</h1>
             <Badge className="bg-green-500/10 text-green-500 border-green-500/20 uppercase font-black px-2 py-1 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" /> Root Access: Full Control
             </Badge>
          </div>
          <p className="text-muted-foreground uppercase text-[10px] font-black tracking-widest opacity-60">Masterforge Terminal | Ver 6.8</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePushRootToCloud} disabled={isProcessing} className="gap-2 text-primary border-primary/30"><RefreshCw className="h-4 w-4" /> Push Manifests</Button>
          <Button variant="outline" size="sm" onClick={() => { stopAllSounds(); setPlayingAxiomId(null); }} className="gap-2 text-destructive border-destructive/50"><Square className="h-4 w-4" /> Stop Audition</Button>
          <Button variant="ghost" onClick={() => router.push('/home')} className="gap-2"><ArrowLeft className="h-4 w-4" /> Return</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20 shadow-lg"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase opacity-70">Cloud DNA Pool</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-primary font-mono">{isDbLoading ? '---' : globalStats.total}</div></CardContent></Card>
          <Card className="bg-primary/5 border-primary/20 shadow-lg"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase opacity-70">Masterpieces</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-primary font-mono">{isMpiecesLoading ? '---' : globalMasterpieces?.length || 0}</div></CardContent></Card>
          <Card className="bg-primary/5 border-primary/20 shadow-lg"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase opacity-70">Operator ID</CardTitle></CardHeader><CardContent><div className="text-xs font-mono truncate opacity-60">{ROOT_OPERATOR_ID}</div></CardContent></Card>
          <Card className="bg-primary/5 border-primary/20 shadow-lg"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase opacity-70">System Health</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2 text-[10px] font-black uppercase text-green-500">Nominal <Activity className="h-3 w-3" /></div></CardContent></Card>
      </div>

      <Tabs defaultValue="explore" className="flex-grow flex flex-col space-y-6">
        <TabsList className="grid grid-cols-4 h-12 bg-muted/30 p-1 border border-border/50 shrink-0">
          <TabsTrigger value="explore" className="text-xs font-bold uppercase tracking-wider">Explore DNA</TabsTrigger>
          <TabsTrigger value="genetic" className="text-xs font-bold uppercase tracking-wider">Genetic Map</TabsTrigger>
          <TabsTrigger value="masterpieces" className="text-xs font-bold uppercase tracking-wider">Masterpieces</TabsTrigger>
          <TabsTrigger value="inject" className="text-xs font-bold uppercase tracking-wider">Inject DNA</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="flex-grow flex flex-col overflow-hidden space-y-4 m-0">
          <Card className="border-border/50 shadow-xl bg-card/50 flex-grow flex flex-col overflow-hidden">
            <CardHeader className="pb-4 shrink-0">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-col gap-1"><CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><Search className="h-5 w-5" /> Cloud Inventory</CardTitle><CardDescription className="text-[10px] uppercase font-bold tracking-widest">Full Control Mode Active</CardDescription></div>
                <div className="flex wrap items-center gap-2">
                  <Input placeholder="Search tracks..." className="h-9 w-[200px] text-xs" value={explorerSearch} onChange={(e) => setFilterSearchText(e.target.value)} />
                  <MultiSelector options={AVAILABLE_GENRES} values={selectedFilterGenres} onValuesChange={setSelectedFilterGenres} placeholder="Genre" className="w-[120px]" />
                  <MultiSelector options={AVAILABLE_MOODS} values={selectedFilterMoods} onValuesChange={setSelectedFilterMoods} placeholder="Mood" className="w-[120px]" />
                  {selectedTrackGroups.size > 0 && (
                      <div className="flex gap-1 animate-in slide-in-from-right-2">
                        <Button variant="secondary" size="sm" onClick={() => setBulkMoodOpen(true)} className="h-9 text-[10px] font-black uppercase"><Edit2 className="h-3.5 w-3.5 mr-1" /> Bulk Mood</Button>
                        <Button variant="destructive" size="sm" onClick={handleWipeSelected} className="h-9 text-[10px] font-black uppercase"><Trash2 className="h-4 w-4 mr-1" /> Wipe ({selectedTrackGroups.size})</Button>
                      </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 border-t flex-grow overflow-hidden relative">
              <ScrollArea className="h-full px-4 py-2">
                {isDbLoading ? <div className="py-20 text-center animate-pulse text-xs font-black uppercase tracking-widest">Scanning Repository...</div> : groupedAxioms.length === 0 ? <div className="py-20 text-center opacity-40 uppercase text-xs font-black">No matching DNA records found</div> : (
                  <Accordion type="multiple" className="space-y-2 pb-24">
                    {groupedAxioms.map(([compId, licks]) => (
                      <AccordionItem key={compId} value={compId} className="border border-border/50 rounded-lg overflow-hidden bg-background/30">
                        <div className="flex items-center justify-between py-3 px-4 bg-card/95 hover:bg-primary/5 transition-colors group">
                          <div className="flex items-center gap-4 flex-grow">
                            <Checkbox checked={selectedTrackGroups.has(compId)} onCheckedChange={() => { const n = new Set(selectedTrackGroups); n.has(compId) ? n.delete(compId) : n.add(compId); setSelectedTrackGroups(n); }} />
                            <AccordionTrigger className="hover:no-underline p-0 border-none bg-transparent">
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 text-[10px] font-black">{licks.length}</Badge>
                            </AccordionTrigger>
                            {editingGroupId === compId ? (
                                <div className="flex flex-col gap-3 w-full max-w-2xl bg-background/80 p-4 rounded-lg border border-primary/20" onClick={(e) => e.stopPropagation()}>
                                    <div className="space-y-1.5"><Label className="text-[10px] uppercase font-black opacity-70">Track Name</Label><Input value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} className="h-8 text-sm" autoFocus /></div>
                                    <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><Label className="text-[10px] uppercase font-black opacity-70">Genre</Label><MultiSelector options={AVAILABLE_GENRES} values={editGenreValue} onValuesChange={setEditGenreValue} placeholder="Select genres..." className="w-full" /></div><div className="space-y-1.5"><Label className="text-[10px] uppercase font-black opacity-70">Mood</Label><MultiSelector options={AVAILABLE_MOODS} values={editMoodValue} onValuesChange={setEditMoodValue} placeholder="Select moods..." className="w-full" /></div></div>
                                    <div className="grid grid-cols-3 gap-4"><div className="space-y-1.5"><Label className="text-[10px] uppercase font-black opacity-70">BPM</Label><Input value={editBpmValue} onChange={(e) => setEditBpmValue(e.target.value)} className="h-8 text-xs bg-background" /></div><div className="space-y-1.5"><Label className="text-[10px] uppercase font-black opacity-70">Key</Label><Select value={editKeyValue} onValueChange={setEditKeyValue}><SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger><SelectContent>{AVAILABLE_KEYS.map(k => <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label className="text-[10px] uppercase font-black opacity-70">Signature</Label><Select value={editTsValue} onValueChange={setEditTsValue}><SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="4/4" className="text-xs">4/4</SelectItem><SelectItem value="12/8" className="text-xs">12/8</SelectItem></SelectContent></Select></div></div>
                                    <div className="flex items-center gap-2 pt-2"><Button size="sm" className="gap-2 font-black uppercase text-[10px]" onClick={() => handleUpdateTrackMetadata(compId, editNameValue, editGenreValue, editMoodValue, parseInt(editBpmValue) || 72, editKeyValue, editTsValue, licks)}><Check className="h-3.5 w-3.5" /> Save Changes</Button><Button size="sm" variant="ghost" className="gap-2 font-black uppercase text-[10px]" onClick={() => setEditingGroupId(null)}><X className="h-3.5 w-3.5" /> Cancel</Button></div>
                                </div>
                            ) : (
                                <div className="flex-grow cursor-pointer" onClick={() => { setEditingGroupId(compId); setEditNameValue(compId); setEditGenreValue(licks[0].genre || []); setEditMoodValue(licks[0].mood || []); setEditBpmValue(String(licks[0].nativeBpm || 72)); setEditKeyValue(licks[0].nativeKey || "E"); setEditTsValue(licks[0].timeSignature || "4/4"); }}>
                                    <div className="text-sm font-black flex items-center gap-2">{compId.replace(/_/g, ' ')} <Edit2 className="h-3 w-3" /></div>
                                    <div className="text-[9px] uppercase font-bold opacity-50">{(licks[0].genre || []).join(', ')} | {(licks[0].mood || []).join(', ')}</div>
                                </div>
                            )}
                          </div>
                          <div className="flex gap-1 pr-2">
                             <Button variant="ghost" size="icon" onClick={() => handleExportTrack(compId, licks)} className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDeleteTrack(compId, licks)} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        <AccordionContent className="p-0 border-t overflow-visible bg-background/20">
                            <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
                                <thead className="bg-muted/50 border-b border-border/10">
                                    <tr className="text-[10px] uppercase font-black opacity-60">
                                        <th className="p-3 pl-12 w-24">Hash</th>
                                        <th className="p-3 w-32">Role</th>
                                        <th className="p-3 w-40">Pref. Inst</th>
                                        <th className="p-3 w-32">Struct (O/B/N)</th>
                                        <th className="p-3">Narrative</th>
                                        <th className="p-3 text-right w-40">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10">
                                  {getSortedLicks(licks).map((ax: any) => (
                                    <tr key={ax.id} className={cn("hover:bg-primary/5 transition-colors group/row", ax.ignored && "opacity-40")}>
                                      <td className="p-3 pl-12 font-mono text-[10px] opacity-70">{ax.id.split('_').pop()}</td>
                                      <td className="p-3">
                                        {editingAxiomId === ax.id ? (
                                            <Select value={editAxiomData.role} onValueChange={(v) => setEditAxiomData({...editAxiomData, role: v})}><SelectTrigger className="h-7 text-[10px] uppercase font-black px-2 bg-background"><SelectValue /></SelectTrigger><SelectContent>{ROLE_OPTIONS.map(r => <SelectItem key={r} value={r} className="text-[10px] uppercase font-black">{r}</SelectItem>)}</SelectContent></Select>
                                        ) : <Badge variant="outline" className="text-[9px] uppercase font-black px-1.5">{ax.role}</Badge>}
                                      </td>
                                      <td className="p-3">
                                        {editingAxiomId === ax.id ? (
                                            <Select value={editAxiomData.preferredInstrument || "none"} onValueChange={(v) => setEditAxiomData({...editAxiomData, preferredInstrument: v === "none" ? null : v})}><SelectTrigger className="h-7 text-[10px] uppercase font-black px-2 bg-background"><SelectValue /></SelectTrigger><SelectContent>{PREFERRED_INST_OPTIONS.map(inst => <SelectItem key={inst} value={inst} className="text-[10px] font-black uppercase">{inst}</SelectItem>)}</SelectContent></Select>
                                        ) : <span className="text-[10px] font-black uppercase opacity-60">{ax.preferredInstrument || "none"}</span>}
                                      </td>
                                      <td className="p-3 font-mono text-[10px] opacity-60">
                                         {editingAxiomId === ax.id ? (
                                            <div className="flex gap-1">
                                                <Input type="number" value={editAxiomData.barOffset || 0} onChange={e => setEditAxiomData({...editAxiomData, barOffset: parseInt(e.target.value)})} className="h-7 w-10 text-[9px] p-1" title="Offset" />
                                                <Input type="number" value={editAxiomData.bars || 1} onChange={e => setEditAxiomData({...editAxiomData, bars: parseInt(e.target.value)})} className="h-7 w-10 text-[9px] p-1" title="Bars" />
                                                <Input type="number" value={editAxiomData.noteCount || 0} onChange={e => setEditAxiomData({...editAxiomData, noteCount: parseInt(e.target.value)})} className="h-7 w-10 text-[9px] p-1" title="Note Count" />
                                            </div>
                                         ) : `O:${ax.barOffset || 0} / B:${ax.bars || 1} / N:${ax.noteCount || 0}`}
                                      </td>
                                      <td className="p-3 text-xs italic text-muted-foreground">
                                         {editingAxiomId === ax.id ? <Input value={editAxiomData.narrative} onChange={e => setEditAxiomData({...editAxiomData, narrative: e.target.value})} className="h-7 text-xs w-full" /> : <div className="line-clamp-1">{ax.narrative}</div>}
                                      </td>
                                      <td className="p-3 text-right">
                                        <div className="flex justify-end gap-1">
                                          {editingAxiomId === ax.id ? (
                                              <>
                                                <Button size="icon" variant="ghost" onClick={handleSaveAxiomEdits} className="h-7 w-7 text-primary" disabled={isProcessing}><Check className="h-3.5 w-3.5" /></Button>
                                                <Button size="icon" variant="ghost" onClick={() => setEditingAxiomId(null)} className="h-7 w-7 text-muted-foreground"><X className="h-3.5 w-3.5" /></Button>
                                              </>
                                          ) : (
                                              <>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => { setEditingAxiomId(ax.id); setEditAxiomData({...ax}); }}><Edit2 className="h-3.5 w-3.5" /></Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePlayAxiom(ax)}>{playingAxiomId === ax.id ? <Square className="h-4 w-4 fill-current text-destructive animate-pulse" /> : <Play className="h-4 w-4 fill-current" />}</Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleToggleIgnore(ax)} className={cn("h-7 w-7", ax.ignored ? "text-destructive" : "text-muted-foreground")}>{ax.ignored ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteAxiom(ax.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                              </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                            </table>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="genetic" className="flex-grow space-y-6 m-0 overflow-hidden flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
                <Card className="lg:col-span-2 border-border/50 shadow-xl bg-card/50 flex flex-col overflow-hidden">
                    <CardHeader className="pb-2 shrink-0"><CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><TrendingUp className="h-5 w-5" /> Genetic Spectrum</CardTitle></CardHeader>
                    <CardContent className="flex-grow p-4 pt-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 900 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                {dynastyStats.map(dyn => (dyn.count > 0 && (<Radar key={dyn.id} name={dyn.label} dataKey={dyn.id} stroke={dyn.color} fill={dyn.color} fillOpacity={0.15} strokeWidth={2} />)))}
                                <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "10px" }} />
                                <RechartsLegend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="border-border/50 shadow-xl bg-card/50 flex flex-col overflow-hidden">
                    <CardHeader className="pb-2 shrink-0"><CardTitle className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Genotype Distribution</CardTitle></CardHeader>
                    <CardContent className="flex-grow overflow-hidden"><ScrollArea className="h-full px-4"><div className="space-y-3 pb-4">{dynastyStats.map(dyn => (<div key={dyn.id} className="space-y-1"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: dyn.color }} /><span className="text-[10px] font-black uppercase">{dyn.label}</span></div><span className="text-[10px] font-mono opacity-60">{dyn.count}</span></div><Progress value={(dyn.count / (globalStats.total || 1)) * 100} className="h-1 bg-muted" style={{ "--progress-color": dyn.color } as any} /></div>))}</div></ScrollArea></CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="masterpieces" className="flex-grow m-0 overflow-hidden flex flex-col">
          <Card className="border-border/50 shadow-xl bg-card/50 flex-grow overflow-hidden flex flex-col">
              <CardHeader className="shrink-0"><CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><Heart className="h-5 w-5" /> Masterpieces Collection</CardTitle></CardHeader>
              <CardContent className="flex-grow overflow-hidden p-6"><ScrollArea className="h-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                  {globalMasterpieces?.map((m: any) => (
                    <Card key={m.id} className="bg-background/40 border-border/50 p-4 space-y-2 group relative hover:border-primary/40 transition-all">
                      <Badge variant="outline" className="text-[9px] font-black uppercase text-primary border-primary/20">{m.genre}</Badge>
                      <div className="text-xs font-black uppercase truncate">{m.mood}</div>
                      <div className="text-[10px] font-mono opacity-50">Seed: {m.seed} | BPM: {m.bpm}</div>
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive" onClick={() => deleteDocumentNonBlocking(doc(db, 'masterpieces', m.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </Card>
                  ))}</div>
              </ScrollArea></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inject" className="flex-grow flex flex-col overflow-hidden space-y-6 m-0">
          <div className="flex wrap items-center gap-4 bg-muted/20 p-6 rounded-xl border border-border/50 shrink-0">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="bg-primary hover:bg-primary/90 font-black h-12 px-8 shadow-lg uppercase tracking-wider"><Upload className="mr-3 h-5 w-5" /> Load Local DNA</Button>
            <div className="flex items-center gap-3 pl-6 border-l border-border/50"><Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Target Genres:</Label><MultiSelector options={AVAILABLE_GENRES} values={selectedGenre} onValuesChange={setSelectedGenre} placeholder="Select genres..." className="w-[240px] h-10 font-bold" /></div>
          </div>
          {stagedAxioms.length > 0 && (
            <Card className="border-primary/30 shadow-2xl overflow-hidden flex-grow flex flex-col m-0">
              <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-4 shrink-0">
                <div><CardTitle className="text-xl font-bold flex items-center gap-2"><Wind className="h-6 w-6 text-primary"/> Staging Buffer: {currentFileName}</CardTitle><CardDescription className="text-[10px] uppercase font-bold text-primary/70">Heritage Ready for Injection</CardDescription></div>
                <div className="flex gap-3"><Button variant="ghost" size="sm" onClick={() => setStagedAxioms([])} className="text-muted-foreground uppercase text-[10px] font-bold">Clear Buffer</Button><Button onClick={handleCommitSelection} disabled={isProcessing || selectedIds.size === 0} className="gap-3 font-black uppercase tracking-widest px-8 h-11"><Check className={cn("h-5 w-5", isProcessing && "animate-spin")} />Inject {selectedIds.size} Axioms</Button></div>
              </CardHeader>
              <CardContent className="p-0 flex-grow overflow-hidden">
                  <ScrollArea className="h-full">
                      <table className="w-full text-left text-sm border-collapse">
                          <thead className="bg-muted sticky top-0 z-10 text-[10px] uppercase font-black border-b border-border/20">
                              <tr><th className="p-4 w-12 text-center"><Checkbox checked={selectedIds.size === stagedAxioms.length} onCheckedChange={c => { if(c) setSelectedIds(new Set(stagedAxioms.map(a => a.id))); else setSelectedIds(new Set()); }} /></th><th className="p-4">Source</th><th className="p-4">Role</th><th className="p-4">Struct</th><th className="p-4 text-right w-24">Preview</th></tr>
                          </thead>
                          <tbody className="divide-y divide-border/10">
                              {stagedAxioms.map(ax => (
                                  <tr key={ax.id} className="hover:bg-primary/5 transition-colors group">
                                      <td className="p-4 text-center"><Checkbox checked={selectedIds.has(ax.id)} onCheckedChange={() => { const n = new Set(selectedIds); n.has(ax.id) ? n.delete(ax.id) : n.add(ax.id); setSelectedIds(n); }} /></td>
                                      <td className="p-4 font-bold text-primary text-[11px] uppercase tracking-tight">{ax.compositionId}</td>
                                      <td className="p-4"><Badge variant="outline" className="text-[9px] uppercase font-black uppercase">{ax.role}</Badge></td>
                                      <td className="p-4 text-[10px] font-mono opacity-60">O:{ax.barOffset} / B:{ax.bars} / N:{ax.noteCount}</td>
                                      <td className="p-4 text-right"><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handlePlayAxiom(ax)}>{playingAxiomId === ax.id ? <Square className="h-4 w-4 fill-current text-destructive" /> : <Play className="h-4 w-4 fill-current" />}</Button></td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-primary/20 bg-card">
          <AlertDialogHeader><AlertDialogTitle className="text-primary font-black uppercase tracking-tight">{confirmConfig?.title || "Confirm Execution"}</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground font-bold">{confirmConfig?.desc || "This action is critical and permanent."}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="uppercase text-[10px] font-black">Abort</AlertDialogCancel><AlertDialogAction onClick={() => { confirmConfig?.action(); setConfirmOpen(false); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 uppercase text-[10px] font-black">Execute Purge</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={bulkMoodOpen} onOpenChange={setBulkMoodOpen}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-primary">Bulk Mood Settings</DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Update mood for all {selectedTrackGroups.size} selected tracks.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <MultiSelector options={AVAILABLE_MOODS} values={bulkMoodValue} onValuesChange={setBulkMoodValue} placeholder="Select target moods" className="w-full h-11 font-bold" />
            <Button className="w-full h-11 font-black uppercase tracking-widest shadow-lg" onClick={() => handleBulkSetMood(bulkMoodValue)} disabled={isProcessing || bulkMoodValue.length === 0}><Check className="h-4 w-4 mr-2" /> Apply Transformation</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Gatekeeper({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [idInput, setIdInput] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_ACCESS_KEY);
    if (saved === "true") {
        setIsAuthorized(true);
        if (auth && !auth.currentUser) initiateAnonymousSignIn(auth);
    } else {
        setIsAuthorized(false);
    }
  }, [auth]);

  const handleLogin = async () => {
    if (idInput === ROOT_OPERATOR_ID && keyInput === ROOT_MASTER_KEY) {
      setLoading(true);
      try {
          if (auth && !auth.currentUser) {
              await initiateAnonymousSignIn(auth);
          }
          localStorage.setItem(STORAGE_ACCESS_KEY, "true");
          setIsAuthorized(true);
          setError(false);
      } finally { setLoading(false); }
    } else {
      setError(true);
      setKeyInput("");
    }
  };

  if (isAuthorized === null) return null;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-body overflow-hidden">
        <Card className="w-full max-w-sm border-primary/20 bg-card shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent animate-pulse" />
          <CardHeader className="bg-primary/5 border-b border-primary/10 text-center space-y-2 py-8">
            <div className="mx-auto bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center text-primary mb-2 shadow-inner"><Lock className="h-8 w-8" /></div>
            <CardTitle className="text-2xl font-black uppercase tracking-tighter">DNA Auditor</CardTitle>
            <CardDescription className="text-[10px] uppercase font-black opacity-60 tracking-[0.3em]">Masterforge Root Terminal</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase opacity-40 ml-1 tracking-widest">Operator ID</Label>
                <Input 
                  value={idInput} onChange={(e) => setIdInput(e.target.value)}
                  placeholder="ID..." className="h-10 bg-background/50 text-xs border-primary/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase opacity-40 ml-1 tracking-widest">Master Key (Track UID)</Label>
                <Input 
                  type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••" className={cn("h-10 bg-background/50 text-sm border-primary/10 text-center tracking-[0.4em]", error && "border-destructive")}
                />
              </div>
              {error && <p className="text-[9px] text-destructive font-black uppercase text-center mt-3 animate-bounce">Access Denied: Terminal Locked</p>}
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <Button onClick={handleLogin} disabled={loading} className="w-full h-12 font-black uppercase tracking-[0.2em] shadow-xl">
               {loading ? "Establishing Link..." : "Establish Link"} <UserCheck className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export default function HypercubeDashboard() {
    return (
        <div className="min-h-screen bg-background p-4 sm:p-8 font-body overflow-x-hidden flex flex-col selection:bg-primary/30">
            <Gatekeeper>
                <AuditorContent />
            </Gatekeeper>
        </div>
    );
}
