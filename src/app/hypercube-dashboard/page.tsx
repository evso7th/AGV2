'use client';

/**
 * @fileOverview DNA Auditor V5.8 — "Syntax & Logic Integrity".
 * #ЗАЧЕМ: Исправление критической ошибки синтаксиса (Unexpected token div).
 * #ЧТО: Полное восстановление структуры компонента AuditorContent, реализация V5.5.
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
  Moon,
  Sun,
  RefreshCw,
  FileText,
  CloudLightning,
  ClipboardCheck,
  Lock,
  Unlock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc, writeBatch, query, updateDoc } from 'firebase/firestore';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { saveHeritageAxiom, saveProjectDocument, saveMasterpiece } from '@/lib/firebase-service';
import { 
    decompressCompactPhrase, 
    repairLegacyPhrase, 
    DEGREE_KEYS, 
    TECHNIQUE_KEYS, 
    DEGREE_TO_SEMITONE, 
    keyToMidiRoot, 
    resolveSemanticTimbre,
    TICKS_PER_BAR,
    TICK_TO_BEAT,
    mergeIdenticalNotes,
    SEMITONE_TO_DEGREE,
    normalizeStr
} from '@/lib/music-theory';
import { readProjectRootManifests } from '@/app/actions/manifest-actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { FractalEvent, InstrumentHints, Mood, CommonMood } from '@/types/fractal';
import type { Genre } from '@/types/music';

// ───── CONSTANTS & CONFIG ─────

const ACCESS_TOKEN = "96dmhwmnfgn";
const STORAGE_ACCESS_KEY = "AG_Auditor_Access_V55";

const AVAILABLE_GENRES: Genre[] = [
  'ambient', 'psybient', 'blues', 'progressive', 'rock', 'house', 'rnb', 'ballad', 'reggae', 'celtic'
];

const AVAILABLE_MOODS: Mood[] = [
  'epic', 'joyful', 'enthusiastic', 'melancholic', 'dark', 'anxious', 'dreamy', 'contemplative', 'calm', 'gloomy'
];

const AVAILABLE_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const ROLE_OPTIONS = ['melody', 'accomp', 'bass', 'drums', 'pianoAccompaniment'];

const DYNASTY_CONFIG: Record<string, { color: string, label: string }> = {
  'slow-burn': { color: '#FF6B6B', label: 'Slow Burn' }, 'texas': { color: '#4D96FF', label: 'Texas' }, 'soul': { color: '#6BCB77', label: 'Soul' },
  'chromatic': { color: '#FFD93D', label: 'Chromatic' }, 'legacy': { color: '#9B59B6', label: 'Legacy' }, 'lyrical': { color: '#1ABC9C', label: 'Lyrical' }
};

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light', dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

// ───── HELPER UI COMPONENTS ─────

function MultiSelector<T extends string>({ options, values, onValuesChange, placeholder, className }: { options: T[], values: T[], onValuesChange: (vals: T[]) => void, placeholder: string, className?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild><Button variant="outline" size="sm" className={cn("h-8 text-xs bg-background justify-between font-normal", className)}><span className="truncate pr-4">{values.length > 0 ? values.join(", ") : placeholder}</span><LayoutGrid className="ml-2 h-3 w-3 opacity-50 shrink-0" /></Button></PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start"><div className="max-h-48 overflow-y-auto p-2">{options.map(opt => (<div key={opt} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-sm cursor-pointer group" onClick={() => { const next = values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]; onValuesChange(next); }}><Checkbox checked={values.includes(opt)} onCheckedChange={() => {}} /><Label className="text-[11px] font-bold uppercase cursor-pointer flex-grow leading-none">{opt}</Label></div>))}</div></PopoverContent>
    </Popover>
  );
}

// ───── AUDITOR CONTENT ─────

function AuditorContent() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { isInitialized, initialize, playRawEvents, stopAllSounds } = useAudioEngine();
  const { user } = useUser();

  const axiomsQuery = useMemoFirebase(() => query(collection(db, 'heritage_axioms')), [db]);
  const { data: globalAxioms, isLoading: isDbLoading } = useCollection(axiomsQuery);

  const masterpiecesQuery = useMemoFirebase(() => query(collection(db, 'masterpieces')), [db]);
  const { data: globalMasterpieces, isLoading: isMpiecesLoading } = useCollection(masterpiecesQuery);

  const docsQuery = useMemoFirebase(() => query(collection(db, 'project_documents')), [db]);
  const { data: projectDocs, isLoading: isDocsLoading } = useCollection(docsQuery);

  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedAxioms, setStagedAxioms] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<Genre[]>(['blues']);
  const [playingAxiomId, setPlayingAxiomId] = useState<string | null>(null);
  const [explorerSearch, setFilterSearchText] = useState("");
  
  const [selectedFilterGenres, setSelectedFilterGenres] = useState<Genre[]>([]);
  const [selectedFilterMoods, setSelectedFilterMoods] = useState<Mood[]>([]);
  const [axiomFilterRole, setAxiomFilterRole] = useState("");
  const [axiomFilterOffset, setAxiomFilterOffset] = useState("");

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
    }, { total: 0, genres: {} as Record<string, number>, moods: {} as Record<string, number>, commonMoods: {} as Record<string, number> });
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
            return {
                ...ax, phrase: repairedPhrase, role: ax.role || 'melody', id: `${compId}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
                compositionId: compId, genre: Array.isArray(ax.genre) ? ax.genre : [ax.genre || 'blues'],
                mood: Array.isArray(ax.mood) ? ax.mood : [ax.mood || 'melancholic'],
                vector: ax.vector || { t: 0.5, b: 0.5, e: 0.5, h: 0.5 }
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
            role: editAxiomData.role, narrative: editAxiomData.narrative, vector: editAxiomData.vector,
            nativeBpm: parseInt(editAxiomData.nativeBpm) || null, nativeKey: editAxiomData.nativeKey
        });
        toast({ title: "Axiom Updated" }); setEditingAxiomId(null);
    } finally { setIsProcessing(false); }
  };

  const handleCommitInjection = async () => {
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

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 flex-grow flex flex-col">
      <header className="flex items-center justify-between shrink-0">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-3"><Database className="h-10 w-10" /> DNA Auditor</h1>
          <p className="text-muted-foreground uppercase text-[10px] font-black tracking-widest">Heritage Restoration Station</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { stopAllSounds(); setPlayingAxiomId(null); }} className="gap-2 text-destructive border-destructive/50"><Square className="h-4 w-4" /> Stop Audition</Button>
          <Button variant="ghost" onClick={() => router.push('/home')} className="gap-2"><ArrowLeft className="h-4 w-4" /> Return</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase opacity-70">Total DNA</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-primary font-mono">{isDbLoading ? '---' : globalStats.total}</div></CardContent></Card>
          <Card className="bg-primary/5 border-primary/20"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase opacity-70">Masterpieces</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-primary font-mono">{isMpiecesLoading ? '---' : globalMasterpieces?.length || 0}</div></CardContent></Card>
          <Card className="bg-primary/5 border-primary/20"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase opacity-70">Cloud Status</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] font-black uppercase text-green-500">Live</span></div></CardContent></Card>
          <Card className="bg-primary/5 border-primary/20"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase opacity-70">User Session</CardTitle></CardHeader><CardContent><div className="text-xs font-mono truncate opacity-60">{user?.uid || 'Awaiting Auth...'}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="explore" className="flex-grow flex flex-col space-y-6">
        <TabsList className="grid grid-cols-4 h-12 bg-muted/30 p-1 border border-border/50">
          <TabsTrigger value="explore" className="text-xs font-bold uppercase tracking-wider">Explore</TabsTrigger>
          <TabsTrigger value="genetic" className="text-xs font-bold uppercase tracking-wider">Genetic Map</TabsTrigger>
          <TabsTrigger value="masterpieces" className="text-xs font-bold uppercase tracking-wider">Masterpieces</TabsTrigger>
          <TabsTrigger value="inject" className="text-xs font-bold uppercase tracking-wider">Inject DNA</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-4">
          <Card className="border-border/50 shadow-xl bg-card/50">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-col gap-1"><CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><Search className="h-5 w-5" /> Cloud Inventory</CardTitle><CardDescription className="text-[10px] uppercase font-bold tracking-widest">Inspect and Curate Heritage Axioms</CardDescription></div>
                <div className="flex wrap items-center gap-2">
                  <Input placeholder="Search..." className="h-9 w-[180px] text-xs" value={explorerSearch} onChange={(e) => setFilterSearchText(e.target.value)} />
                  <MultiSelector options={AVAILABLE_GENRES} values={selectedFilterGenres} onValuesChange={setSelectedFilterGenres} placeholder="Genre" className="w-[120px]" />
                  <MultiSelector options={AVAILABLE_MOODS} values={selectedFilterMoods} onValuesChange={setSelectedFilterMoods} placeholder="Mood" className="w-[120px]" />
                  {selectedTrackGroups.size > 0 && <Button variant="destructive" size="sm" onClick={handleWipeSelected} className="h-9 text-[10px] font-black uppercase gap-2"><Trash2 className="h-4 w-4" /> Wipe ({selectedTrackGroups.size})</Button>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <ScrollArea className="h-[500px] px-4 py-2">
                {isDbLoading ? <div className="py-20 text-center animate-pulse text-xs font-black uppercase tracking-widest">Reading Cloud...</div> : groupedAxioms.length === 0 ? <div className="py-20 text-center opacity-40 uppercase text-xs font-black">No DNA Found</div> : (
                  <Accordion type="multiple" className="space-y-2">
                    {groupedAxioms.map(([compId, licks]) => (
                      <AccordionItem key={compId} value={compId} className="border border-border/50 rounded-lg overflow-hidden bg-background/30">
                        <div className="flex items-center justify-between py-3 px-4 bg-card/95 hover:bg-primary/5 transition-colors group">
                          <div className="flex items-center gap-4 flex-grow">
                            <Checkbox checked={selectedTrackGroups.has(compId)} onCheckedChange={() => { const n = new Set(selectedTrackGroups); n.has(compId) ? n.delete(compId) : n.add(compId); setSelectedTrackGroups(n); }} />
                            <AccordionTrigger className="hover:no-underline p-0 border-none bg-transparent">
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 text-[10px] font-black">{licks.length}</Badge>
                            </AccordionTrigger>
                            <div className="flex-grow">
                                <div className="text-sm font-black">{compId.replace(/_/g, ' ')}</div>
                                <div className="text-[9px] uppercase font-bold opacity-50">G: {(licks[0].genre || []).join(', ')} | M: {(licks[0].mood || []).join(', ')}</div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDeleteTrack(compId, licks); }} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <AccordionContent className="p-0 border-t overflow-visible">
                            <table className="w-full text-left text-sm border-collapse">
                                <tbody className="divide-y divide-border/20">
                                  {getSortedLicks(licks).map((ax: any) => (
                                    <tr key={ax.id} className="hover:bg-primary/5 transition-colors group/row">
                                      <td className="p-3 pl-12 font-mono text-[10px] opacity-70">{ax.id.split('_').pop()}</td>
                                      <td className="p-3"><Badge variant="outline" className="text-[9px] uppercase font-black px-1.5">{ax.role}</Badge></td>
                                      <td className="p-3 font-mono text-[10px] opacity-60">O:{ax.barOffset || 0} / B:{ax.bars || 1}</td>
                                      <td className="p-3 text-xs italic text-muted-foreground line-clamp-1">{ax.narrative}</td>
                                      <td className="p-3 text-right">
                                        <div className="flex justify-end gap-1">
                                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePlayAxiom(ax)}>{playingAxiomId === ax.id ? <Square className="h-4 w-4 fill-current text-destructive" /> : <Play className="h-4 w-4 fill-current" />}</Button>
                                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteAxiom(ax.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

        <TabsContent value="genetic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-border/50 shadow-xl bg-card/50 overflow-hidden">
                    <CardHeader className="pb-2"><CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><TrendingUp className="h-5 w-5" /> Genetic Spectrum</CardTitle></CardHeader>
                    <CardContent className="h-[450px] p-4 pt-0">
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
                <Card className="border-border/50 shadow-xl bg-card/50">
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Genotype Distribution</CardTitle></CardHeader>
                    <CardContent><ScrollArea className="h-[400px] px-4"><div className="space-y-3 pb-4">{dynastyStats.map(dyn => (<div key={dyn.id} className="space-y-1"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: dyn.color }} /><span className="text-[10px] font-black uppercase">{dyn.label}</span></div><span className="text-[10px] font-mono opacity-60">{dyn.count} phrases</span></div><Progress value={(dyn.count / (globalStats.total || 1)) * 100} className="h-1 bg-muted" style={{ "--progress-color": dyn.color } as any} /></div>))}</div></ScrollArea></CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="masterpieces" className="flex-grow">
          <Card className="border-border/50 shadow-xl bg-card/50 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {globalMasterpieces?.map((m: any) => (
                <Card key={m.id} className="bg-background/40 border-border/50 p-4 space-y-2 group relative">
                  <Badge variant="outline" className="text-[10px] font-black uppercase text-primary">{m.genre}</Badge>
                  <div className="text-xs font-black uppercase truncate">{m.mood}</div>
                  <div className="text-[10px] font-mono opacity-70">Seed: {m.seed}</div>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteDocumentNonBlocking(doc(db, 'masterpieces', m.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </Card>
              ))}</div>
          </Card>
        </TabsContent>

        <TabsContent value="inject" className="space-y-6">
          <div className="flex wrap items-center gap-4 bg-muted/20 p-6 rounded-xl border border-border/50">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="bg-primary hover:bg-primary/90 font-black h-12 px-8 shadow-lg uppercase tracking-wider"><Upload className="mr-3 h-5 w-5" /> Load Local DNA</Button>
            <div className="flex items-center gap-3 pl-6 border-l border-border/50"><Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Target Genres:</Label><MultiSelector options={AVAILABLE_GENRES} values={selectedGenre} onValuesChange={setSelectedGenre} placeholder="Select genres..." className="w-[240px] h-10 font-bold" /></div>
          </div>
          {stagedAxioms.length > 0 && (
            <Card className="border-primary/30 shadow-2xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-4">
                <div><CardTitle className="text-xl font-bold flex items-center gap-2"><Wind className="h-6 w-6 text-primary"/> Staging Buffer: {currentFileName}</CardTitle><CardDescription className="text-[10px] uppercase font-bold text-primary/70">Heritage Ready for Injection</CardDescription></div>
                <div className="flex gap-3"><Button variant="ghost" size="sm" onClick={() => setStagedAxioms([])} className="text-muted-foreground uppercase text-[10px] font-bold">Clear Buffer</Button><Button onClick={handleCommitInjection} disabled={isProcessing || selectedIds.size === 0} className="gap-3 font-black uppercase tracking-widest px-8 h-11"><Check className={cn("h-5 w-5", isProcessing && "animate-spin")} />Inject {selectedIds.size} Axioms</Button></div>
              </CardHeader>
              <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                      <table className="w-full text-left text-sm border-collapse">
                          <thead className="bg-muted sticky top-0 z-10 text-[10px] uppercase font-black">
                              <tr><th className="p-4 w-12 text-center"><Checkbox checked={selectedIds.size === stagedAxioms.length} onCheckedChange={c => { if(c) setSelectedIds(new Set(stagedAxioms.map(a => a.id))); else setSelectedIds(new Set()); }} /></th><th className="p-4">Source</th><th className="p-4">Role</th><th className="p-4">Struct</th><th className="p-4 text-right">Preview</th></tr>
                          </thead>
                          <tbody className="divide-y divide-border/20">
                              {stagedAxioms.map(ax => (
                                  <tr key={ax.id} className="hover:bg-primary/5 transition-colors">
                                      <td className="p-4 text-center"><Checkbox checked={selectedIds.has(ax.id)} onCheckedChange={() => { const n = new Set(selectedIds); n.has(ax.id) ? n.delete(ax.id) : n.add(ax.id); setSelectedIds(n); }} /></td>
                                      <td className="p-4 font-bold text-primary text-[11px] uppercase tracking-tight">{ax.compositionId}</td>
                                      <td className="p-4"><Badge variant="outline" className="text-[9px] font-black uppercase">{ax.role}</Badge></td>
                                      <td className="p-4 text-[10px] font-mono opacity-60">O:{ax.barOffset} / B:{ax.bars}</td>
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
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary font-black uppercase tracking-tight">{confirmConfig?.title || "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-bold">{confirmConfig?.desc || "Critical action."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="uppercase text-[10px] font-black">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { confirmConfig?.action(); setConfirmOpen(false); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 uppercase text-[10px] font-black">Confirm</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ───── GATEKEEPER COMPONENT ─────

function Gatekeeper({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_ACCESS_KEY);
    if (saved === "true") setIsAuthorized(true);
    else setIsAuthorized(false);
  }, []);

  const handleLogin = () => {
    if (tokenInput === ACCESS_TOKEN) {
      localStorage.setItem(STORAGE_ACCESS_KEY, "true");
      setIsAuthorized(true);
      setError(false);
    } else {
      setError(true);
      setTokenInput("");
    }
  };

  if (isAuthorized === null) return null;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-body">
        <Card className="w-full max-w-sm border-primary/20 bg-card shadow-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10 text-center space-y-2">
            <div className="mx-auto bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center text-primary mb-2"><Lock className="h-6 w-6" /></div>
            <CardTitle className="text-xl font-black uppercase tracking-tight">DNA Gatekeeper</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Masterforge Access Required</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-8 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-50 ml-1">Access Token</Label>
              <div className="relative">
                <Input 
                  type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter secret code..." className={cn("h-11 bg-background text-sm font-mono tracking-widest pl-4", error && "border-destructive")} autoFocus
                />
              </div>
              {error && <p className="text-[9px] text-destructive font-black uppercase text-center mt-2 animate-bounce">Access Denied</p>}
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button onClick={handleLogin} className="w-full h-11 font-black uppercase tracking-widest shadow-lg">Unlock Terminal <Unlock className="ml-2 h-4 w-4" /></Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export default function HypercubeDashboard() {
    return (
        <div className="min-h-screen bg-background p-4 sm:p-8 font-body overflow-x-hidden flex flex-col">
            <Gatekeeper>
                <AuditorContent />
            </Gatekeeper>
        </div>
    );
}

