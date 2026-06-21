
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
  Lock,
  Zap,
  Mic2,
  FileText,
  UploadCloud,
  ClipboardCheck,
  CloudLightning,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, query, updateDoc } from 'firebase/firestore';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { saveHeritageAxiom, saveProjectDocument } from '@/lib/firebase-service';
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

const PROCESSED_FILES_KEY = 'AuraGroove_ImportedFiles';

const AVAILABLE_GENRES: Genre[] = [
  'ambient', 'psybient', 'blues', 'progressive', 'rock', 'house', 'rnb', 'ballad', 'reggae', 'celtic'
];

const AVAILABLE_MOODS: Mood[] = [
  'epic', 'joyful', 'enthusiastic', 'melancholic', 'dark', 'anxious', 'dreamy', 'contemplative', 'calm', 'gloomy'
];

const AVAILABLE_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

const AVAILABLE_SCALES = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];

const ROLE_OPTIONS = ['melody', 'accomp', 'bass', 'drums', 'pianoAccompaniment'];

const INSTRUMENT_GROUPS = [
  {
    label: "Pads",
    options: ['synth', 'synth_ambient_pad_lush', 'synth_cave_pad', 'dynamicPad', 'mellotron']
  },
  {
    label: "Organs",
    options: ['organ', 'organ_soft_jazz', 'organ_jimmy_smith', 'organ_prog', 'reggae_organ', 'dynamicOrgan']
  },
  {
    label: "Basses",
    options: [
      'bass_jazz_warm', 'bass_jazz_fretless', 'bass_blues', 'bass_ambient', 'bass_ambient_dark', 
      'bass_trance_acid', 'bass_reggae', 'bass_dub', 'bass_house', 'bass_808', 'bass_deep_house', 
      'bass_rock_pick', 'bass_slap', 'bass_cs80'
    ]
  },
  {
    label: "⚡ Dynamic Basses",
    options: [
      'dyn_bass_warm_blues',
      'dyn_bass_warm_blues_slap',
      'dyn_bass_fretless_jazz',
      'dyn_bass_fretless_jazz_slap',
      'dyn_bass_ambient_cs80'
    ]
  },
  {
    label: "Sampled Guitars",
    options: ['blackAcoustic', 'guitarChords']
  },
  {
    label: "Electric Guitars",
    options: ['telecaster', 'darkTelecaster', 'guitar_shineOn', 'guitar_muffLead', 'reggae_guitar']
  },
  {
    label: "⚡ Dynamic Guitars",
    options: [
        'dyn_tele_dark',
        'dyn_black_tele_dark',
        'dyn_tele_cs80_black',
        'dyn_black_cs80_tele',
        'dyn_tele_cs80_shine',
        'dyn_tele_cs80_muff',
        'dyn_black_cs80_shine',
        'dyn_black_cs80_muff',
        'dyn_shine_muff'
    ]
  },
  {
    label: "⚡ Dynamic Piano",
    options: [
      'dyn_rhodes_piano',
      'dyn_piano_rhodes'
    ]
  },
  {
    label: "Others",
    options: ['ep_rhodes_warm', 'cs80', 'theremin', 'piano', 'violin', 'flute', 'none']
  }
];

const DISPLAY_NAMES: Record<string, string> = {
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
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
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
        <div className="max-h-48 overflow-y-auto p-2">
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
        </div>
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

  const masterpiecesQuery = useMemoFirebase(() => query(collection(db, 'masterpieces')), [db]);
  const { data: globalMasterpieces, isLoading: isMpiecesLoading } = useCollection(masterpiecesQuery);

  const docsQuery = useMemoFirebase(() => query(collection(db, 'project_documents')), [db]);
  const { data: projectDocs, isLoading: isDocsLoading } = useCollection(docsQuery);

  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedAxioms, setStagedAxioms] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processedFiles, setProcessedFiles] = useState<string[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<Genre[]>(['blues']);
  const [playingAxiomId, setPlayingAxiomId] = useState<string | null>(null);
  const [explorerSearch, setFilterSearchText] = useState("");

  const [selectedFilterGenres, setSelectedFilterGenres] = useState<Genre[]>([]);
  const [selectedFilterMoods, setSelectedFilterMoods] = useState<Mood[]>([]);
  const [axiomFilterRole, setAxiomFilterRole] = useState("");
  const [axiomFilterOffset, setAxiomFilterOffset] = useState("");

  const [selectedTrackGroups, setSelectedTrackGroups] = useState<Set<string>>(new Set());
  const [openItems, setOpenItems] = useState<string[]>([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmAction] = useState<{ title: string, desc: string, action: () => void } | null>(null);

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [editGenreValue, setEditGenreValue] = useState<Genre[]>([]);
  const [editMoodValue, setEditMoodValue] = useState<Mood[]>([]);
  const [editBpmValue, setEditBpmValue] = useState<string>("72");
  const [editKeyValue, setEditKeyValue] = useState<string>("E");
  const [editScaleValue, setEditScaleValue] = useState<string>("dorian");
  const [editTsValue, setEditTsValue] = useState<string>("4/4");

  const [editingAxiomId, setEditingAxiomId] = useState<string | null>(null);
  const [editAxiomData, setEditAxiomData] = useState<any>(null);

  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [editingDocContent, setEditingDocContent] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(PROCESSED_FILES_KEY);
    if (saved) {
      try { setProcessedFiles(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  // #ЗАЧЕМ: ПЛАН №1260. Автоматическое раскрытие аккордеона при поиске по хэшу.
  useEffect(() => {
      if (explorerSearch.length > 3 && globalAxioms) {
          const matchingAxiom = globalAxioms.find(ax => 
              ax.id.toLowerCase().endsWith(explorerSearch.toLowerCase())
          );
          if (matchingAxiom && !openItems.includes(matchingAxiom.compositionId)) {
              setOpenItems(prev => [...prev, matchingAxiom.compositionId]);
          }
      }
  }, [explorerSearch, globalAxioms]);

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

  const masterpieceStats = useMemo(() => {
      if (!globalMasterpieces) return { total: 0, userLikes: 0, arbiterFinds: 0 };
      return globalMasterpieces.reduce((acc, m) => {
          acc.total++;
          if (m.origin === 'AI_Arbiter') acc.arbiterFinds++;
          else acc.userLikes++;
          return acc;
      }, { total: 0, userLikes: 0, arbiterFinds: 0 });
  }, [globalMasterpieces]);

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
        const trackMatch = id.toLowerCase().includes(explorerSearch.toLowerCase());
        const axiomMatch = licks.some(ax => (ax.id.split('_').pop() || "").toLowerCase().includes(explorerSearch.toLowerCase()));
        const matchesSearch = trackMatch || axiomMatch;
        const firstLick = licks[0];
        const lickGenres = Array.isArray(firstLick.genre) ? firstLick.genre : [firstLick.genre];
        const lickMoods = Array.isArray(firstLick.mood) ? firstLick.mood : [firstLick.mood];
        const matchesGenre = selectedFilterGenres.length === 0 || selectedFilterGenres.some(g => lickGenres.includes(g));
        const matchesMood = selectedFilterMoods.length === 0 || selectedFilterMoods.some(m => lickMoods.includes(m));
        return matchesSearch && matchesGenre && matchesMood;
      })
      .sort(([a], [b]) => a.localeCompare(b));
  }, [globalAxioms, explorerSearch, selectedFilterGenres, selectedFilterMoods]);

  const radarData = useMemo(() => {
    if (!globalAxioms) return [];
    return Object.keys(DYNASTY_CONFIG).map(dynasty => {
        const relatedAxioms = globalAxioms.filter(ax => ax.tags?.includes(dynasty));
        const count = relatedAxioms.length;
        const vector = relatedAxioms.reduce((acc, ax) => {
            acc.t += ax.vector?.t || 0; acc.b += ax.vector?.b || 0; acc.e += ax.vector?.e || 0; acc.h += ax.vector?.h || 0;
            return acc;
        }, { t: 0, b: 0, e: 0, h: 0 });
        if (count > 0) { vector.t /= count; vector.b /= count; vector.e /= count; vector.h /= count; }
        return { id: dynasty, label: DYNASTY_CONFIG[dynasty].label, color: DYNASTY_CONFIG[dynasty].color, count, vector };
    }).sort((a, b) => b.count - a.count);
  }, [globalAxioms]);

  const handlePlayAxiom = async (axiom: any) => {
    if (playingAxiomId === axiom.id) { stopAllSounds(); setPlayingAxiomId(null); return; }
    if (!isInitialized) await initialize();
    stopAllSounds();
    const phrase = decompressCompactPhrase(axiom.phrase);
    if (phrase.length === 0) return;
    
    const minTick = Math.min(...phrase.map(n => n.t));
    const role = (axiom.role || 'melody').toLowerCase();
    let channel: any = 'melody';
    if (role === 'bass') channel = 'bass';
    else if (role.startsWith('drums')) channel = 'drums';
    else if (role.includes('piano')) channel = 'pianoAccompaniment';
    else if (role.includes('accomp')) channel = 'accompaniment';

    const instrument = resolveSemanticTimbre(axiom.preferredInstrument || (channel === 'bass' ? 'bass_jazz_warm' : 'organ_soft_jazz'), 0.5, channel);
    
    const events: FractalEvent[] = phrase.map(n => ({
        type: channel,
        note: (channel === 'bass' ? 31 : (channel === 'drums' ? 36 : 60)) + (DEGREE_TO_SEMITONE[n.deg] || 0),
        time: (n.t - minTick) * TICK_TO_BEAT,
        duration: n.d * TICK_TO_BEAT,
        weight: 0.8, technique: n.tech as any, dynamics: 'p', phrasing: 'legato'
    }));
    
    playRawEvents(events, { [channel]: instrument }, axiom.nativeBpm || 72);
    setPlayingAxiomId(axiom.id);
    
    const maxDuration = Math.max(...events.map(e => e.time + e.duration));
    setTimeout(() => {
        setPlayingAxiomId(prev => prev === axiom.id ? null : prev);
    }, (maxDuration + 1) * 1000);
  };

  const handleToggleIgnore = async (axiom: any) => {
      setIsProcessing(true);
      try {
          const ref = doc(db, 'heritage_axioms', axiom.id);
          await updateDoc(ref, { ignored: !axiom.ignored });
          toast({ title: axiom.ignored ? "Axiom Restored" : "Axiom Ignored" });
      } catch (e) { toast({ variant: "destructive", title: "Action Failed" }); }
      finally { setIsProcessing(false); }
  };

  const handleUpdateTrackMetadata = async (oldId: string, newId: string, newG: Genre[], newM: Mood[], newBpm: number, newKey: string, newScale: string, newTs: string, licks: any[]) => {
    setIsProcessing(true);
    try {
        const batch = writeBatch(db);
        const newCommonMoods = Array.from(new Set(newM.map(m => MOOD_TO_COMMON[m])));
        licks.forEach(ax => { 
            batch.update(doc(db, 'heritage_axioms', ax.id), { 
                compositionId: newId, genre: newG, mood: newM, commonMood: newCommonMoods,
                nativeBpm: newBpm, nativeKey: newKey, nativeScale: newScale, timeSignature: newTs 
            }); 
        });
        await batch.commit();
        toast({ title: "Track Metadata Updated" });
    } finally { setIsProcessing(false); setEditingGroupId(null); }
  };

  const handleWipeSelected = async () => {
    setConfirmAction({
        title: `WIPE SELECTED (${selectedTrackGroups.size} tracks)`,
        desc: `CRITICAL: Permanently delete all axioms associated with the ${selectedTrackGroups.size} selected tracks?`,
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

  const handleUidMigration = async () => {
    if (!globalAxioms || globalAxioms.length === 0) return;
    
    setConfirmAction({
        title: `UID MIGRATION (${globalAxioms.length} axioms)`,
        desc: "CRITICAL: This will migrate ALL existing axioms to the new UID standard. Old records will be deleted and recreated with unique cryptographic IDs. Continue?",
        action: async () => {
            setIsProcessing(true);
            try {
                const snapshot = [...globalAxioms];
                const CHUNK_SIZE = 450;
                
                // 1. Delete all old ones
                for (let i = 0; i < snapshot.length; i += CHUNK_SIZE) {
                    const chunk = snapshot.slice(i, i + CHUNK_SIZE);
                    const batch = writeBatch(db);
                    chunk.forEach(ax => batch.delete(doc(db, 'heritage_axioms', ax.id)));
                    await batch.commit();
                }

                // 2. Re-save with UID
                for (let i = 0; i < snapshot.length; i++) {
                    await saveHeritageAxiom(db, snapshot[i], i);
                }
                
                toast({ title: "UID Migration Complete", description: "All heritage axioms are now unique." });
            } catch (e) {
                toast({ variant: "destructive", title: "Migration Failed", description: String(e) });
            } finally {
                setIsProcessing(false);
            }
        }
    });
    setConfirmOpen(true);
  };

  const handleExportTrack = (compId: string, licks: any[]) => {
      const cleanLicks = licks.map(({ id, timestamp, ...rest }) => ({ ...rest }));
      const blob = new Blob([JSON.stringify(cleanLicks, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${compId.replace(/\s+/g, '_')}-axiom.json`; a.click(); URL.revokeObjectURL(url);
      toast({ title: "DNA Exported" });
  };

  const handleExportFullRegistry = () => {
      if (!globalAxioms) return;
      const cleanRegistry = globalAxioms.map(({ id, timestamp, ...rest }) => ({ ...rest }));
      const blob = new Blob([JSON.stringify(cleanRegistry, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `AuraGroove_Full_DNA_Registry_${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url);
      toast({ title: "Registry Downloaded" });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        let flattened: any[] = [];
        
        const processAxiom = (ax: any, idx: number, compId: string) => {
            const phrase = ax.phrase || [];
            const repaired = repairLegacyPhrase(phrase);
            
            let maxTick = 0;
            for (let i = 0; i < repaired.length; i += 4) {
                const end = (repaired[i] || 0) + (repaired[i+1] || 0);
                if (end > maxTick) maxTick = end;
            }
            
            const calculatedBars = Math.max(1, Math.ceil(maxTick / TICKS_PER_BAR));
            const calculatedNoteCount = Math.floor(repaired.length / 4);
            const narrative = ax.narrative || ax.instrument || "Heritage component.";
            
            const uniqueSuffix = Math.random().toString(36).substring(2, 8);
            
            return {
                ...ax, 
                phrase: repaired, 
                role: (ax.role || 'melody').toLowerCase(), 
                id: `${compId}_${idx}_${uniqueSuffix}`,
                compositionId: compId, 
                genre: Array.isArray(ax.genre) ? ax.genre : [ax.genre || 'blues'],
                mood: Array.isArray(ax.mood) ? ax.mood : [ax.mood || 'melancholic'],
                vector: ax.vector || { t: 0.5, b: 0.5, e: 0.5, h: 0.5 }, 
                narrative: narrative,
                noteCount: ax.noteCount || calculatedNoteCount,
                bars: ax.bars || calculatedBars,
                barOffset: ax.barOffset ?? 0,
                nativeBpm: ax.nativeBpm || ax.bpm || null,
                nativeKey: ax.nativeKey || ax.key || 'C',
                nativeScale: ax.nativeScale || ax.scale || 'dorian',
                preferredInstrument: ax.preferredInstrument || null,
                ignored: ax.ignored ?? false
            };
        };
        
        if (json.header && json.tracks && Array.isArray(json.tracks)) {
            const targetId = json.header.name || file.name.replace(/\.[^/.]+$/, "");
            const bpm = Math.round(json.header.tempos?.[0]?.bpm || 120);
            json.tracks.forEach((track: any, tIdx: number) => {
                if (!track.notes || track.notes.length === 0) return;
                const phrase: number[] = [];
                track.notes.forEach((note: any) => {
                    const tick = Math.round(note.time * 3); 
                    const duration = Math.max(1, Math.round(note.duration * 3));
                    const semitone = note.midi % 12;
                    const degIdx = DEGREE_KEYS.indexOf(SEMITONE_TO_DEGREE[semitone] || 'R');
                    phrase.push(tick, duration, degIdx, TECHNIQUE_KEYS.indexOf('pick'));
                });
                const instrInfo = track.instrument?.name || track.name || 'Unnamed';
                flattened.push(processAxiom({ 
                    phrase, role: 'melody', instrument: instrInfo, nativeBpm: bpm 
                }, tIdx, targetId));
            });
        } else if (Array.isArray(json)) {
            json.forEach((ax, idx) => flattened.push(processAxiom(ax, idx, ax.compositionId || file.name)));
        } else {
            Object.entries(json).forEach(([compId, licks]: any) => { 
                if(Array.isArray(licks)) {
                    licks.forEach((l, i) => flattened.push(processAxiom(l, i, compId))); 
                } else if (licks.phrase) {
                    flattened.push(processAxiom(licks, 0, compId));
                }
            });
        }
        
        if (flattened.length === 0) {
            toast({ variant: "destructive", title: "Empty File", description: "No valid music data found." });
            return;
        }

        setStagedAxioms(flattened);
        setSelectedIds(new Set(flattened.map(a => a.id)));
        setCurrentFileName(file.name);
      } catch (err) { 
          console.error("[Parser] Error:", err);
          toast({ variant: "destructive", title: "Parse Error", description: "Invalid JSON format." }); 
      }
    };
    reader.readAsText(file);
  };

  const handleSaveAxiomEdits = async () => {
    if (!editAxiomData) return;
    setIsProcessing(true);
    try {
        const ref = doc(db, 'heritage_axioms', editAxiomData.id);
        const newMoods = Array.isArray(editAxiomData.mood) ? editAxiomData.mood : [editAxiomData.mood];
        const newCommons = Array.from(new Set(newMoods.map((m: Mood) => MOOD_TO_COMMON[m] || 'neutral')));
        await updateDoc(ref, { 
            role: editAxiomData.role, 
            narrative: editAxiomData.narrative, 
            vector: editAxiomData.vector, 
            mood: newMoods, 
            commonMood: newCommons, 
            nativeBpm: editAxiomData.nativeBpm ? parseInt(editAxiomData.nativeBpm) : null,
            nativeKey: editAxiomData.nativeKey || 'C',
            nativeScale: editAxiomData.nativeScale || 'dorian',
            preferredInstrument: editAxiomData.preferredInstrument || null,
            noteCount: editAxiomData.noteCount || 0,
            barOffset: editAxiomData.barOffset || 0,
            bars: editAxiomData.bars || 1
        });
        toast({ title: "Axiom Updated" }); setEditingAxiomId(null); setEditAxiomData(null);
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
    finally { setIsProcessing(false); }
  };

  const handleCommitInjection = async () => {
    setIsProcessing(true);
    let count = 0;
    try {
      const toInject = stagedAxioms.filter(a => selectedIds.has(a.id));
      for (let i = 0; i < toInject.length; i++) {
        await saveHeritageAxiom(db, { ...toInject[i], genre: selectedGenre }, i);
        count++;
      }
      toast({ title: "DNA Injected", description: `Added ${count} axioms to Cloud.` }); 
      setStagedAxioms([]);
      setSelectedIds(new Set());
    } finally { setIsProcessing(false); }
  };

  const handlePushRootToCloud = async () => {
      setIsProcessing(true);
      try {
          const files = await readProjectRootManifests();
          let count = 0;
          for (const file of files) {
              if (!file.content || file.content.trim().length === 0) continue;
              const category: any = file.filename.toLowerCase().includes('protocol') ? 'protocol' : 
                                file.filename.toLowerCase().includes('spec') ? 'spec' : 
                                file.filename.toLowerCase().includes('contract') ? 'contract' : 'backlog';
              
              await saveProjectDocument(db, {
                  filename: file.filename,
                  content: file.content,
                  category: category,
                  version: '1.1'
              });
              count++;
          }
          toast({ title: "Sync Complete", description: `Uploaded ${count} manifests with full content.` });
      } catch (e) {
          toast({ variant: "destructive", title: "Sync Failed" });
      } finally {
          setIsProcessing(false);
      }
  };

  const handleUpdateDocContent = async () => {
      if (!viewingDocId || !editingDocContent) return;
      setIsProcessing(true);
      try {
          const docRef = doc(db, 'project_documents', viewingDocId);
          await updateDoc(docRef, { content: editingDocContent, timestamp: new Date().toISOString() });
          toast({ title: "Manifest Updated" }); setViewingDocId(null);
      } finally { setIsProcessing(false); }
  };

  const filtersActive = explorerSearch || selectedFilterGenres.length > 0 || selectedFilterMoods.length > 0;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-body overflow-x-hidden flex flex-col">
      <div className="max-w-6xl mx-auto w-full space-y-8 flex-grow flex flex-col">
        <header className="flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-3"><Database className="h-10 w-10" /> DNA Auditor</h1>
            <p className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.2em] opacity-70">Heritage Repair & Root Manifest Station</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportFullRegistry} disabled={isDbLoading || !globalAxioms?.length} className="gap-2 text-primary border-primary/20"><FileJson className="h-4 w-4" /> Export Registry</Button>
            <Button variant="outline" size="sm" onClick={() => { stopAllSounds(); setPlayingAxiomId(null); }} className="gap-2 text-destructive border-destructive/50"><Square className="h-4 w-4" /> Stop Audition</Button>
            <Button variant="ghost" onClick={() => router.push('/aura-groove')} className="gap-2"><ArrowLeft className="h-4 w-4" /> Return to Player</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
            <Card className="bg-primary/5 border-primary/20"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase opacity-70">Total DNA</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-primary font-mono">{globalStats.total}</div></CardContent></Card>
            <Card className="bg-primary/5 border-primary/20"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase opacity-70">Masterpieces</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-primary font-mono">{masterpieceStats.total}</div></CardContent></Card>
            <Card className="bg-primary/5 border-primary/20"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase opacity-70">Manifests</CardTitle></CardHeader><CardContent><div className="text-3xl font-black text-primary font-mono">{projectDocs?.length || 0}</div></CardContent></Card>
            <Card className="bg-primary/5 border-primary/20"><CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase opacity-70">Cloud Sync</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] font-black uppercase">Active</span></div></CardContent></Card>
        </div>

        <Tabs defaultValue="explore" className="flex-grow flex flex-col overflow-hidden space-y-6">
          <TabsList className="grid grid-cols-5 h-12 bg-muted/30 p-1 border border-border/50 shrink-0">
            <TabsTrigger value="explore" className="text-xs font-bold uppercase tracking-wider">Explore</TabsTrigger>
            <TabsTrigger value="genetic" className="text-xs font-bold uppercase tracking-wider">Genetic Map</TabsTrigger>
            <TabsTrigger value="masterpieces" className="text-xs font-bold uppercase tracking-wider">Masterpieces</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs font-bold uppercase tracking-wider">Manifest</TabsTrigger>
            <TabsTrigger value="inject" className="text-xs font-bold uppercase tracking-wider">Inject DNA</TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="flex-grow flex flex-col overflow-hidden space-y-4 m-0">
            <Card className="border-border/50 shadow-xl bg-card/50 flex-grow flex flex-col overflow-hidden">
              <CardHeader className="pb-4 shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><Search className="h-5 w-5" /> Cloud Inventory</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Inspect and Curate Heritage Axioms</CardDescription>
                  </div>
                  <div className="flex wrap items-center gap-2">
                    {filtersActive && <Button variant="ghost" size="sm" onClick={() => { setFilterSearchText(""); setSelectedFilterGenres([]); setSelectedFilterMoods([]); }} className="text-muted-foreground h-8 px-2 text-[10px] uppercase font-bold"><RotateCcw className="h-3 w-3 mr-1.5" /> Clear</Button>}
                    <Input placeholder="Search..." className="h-9 w-[180px] text-xs" value={explorerSearch} onChange={(e) => setFilterSearchText(e.target.value)} />
                    <MultiSelector options={AVAILABLE_GENRES} values={selectedFilterGenres} onValuesChange={setSelectedFilterGenres} placeholder="Genre" className="w-[120px]" />
                    <MultiSelector options={AVAILABLE_MOODS} values={selectedFilterMoods} onValuesChange={setSelectedFilterMoods} placeholder="Mood" className="w-[120px]" />
                    <div className="flex gap-1">
                        {selectedTrackGroups.size > 0 && <Button variant="destructive" size="sm" onClick={handleWipeSelected} className="h-9 text-[10px] font-black uppercase"><Trash2 className="h-4 w-4 mr-2" /> Wipe ({selectedTrackGroups.size})</Button>}
                        <Button variant="outline" size="sm" onClick={handleUidMigration} disabled={isProcessing} className="h-9 text-[10px] font-black uppercase border-primary/20 hover:bg-primary/5 text-primary gap-2"><RefreshCw className={cn("h-4 w-4", isProcessing && "animate-spin")} /> Repair Global IDs</Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 border-t flex-grow overflow-hidden">
                <ScrollArea className="h-full px-4 py-2">
                  {isDbLoading ? <div className="py-20 text-center animate-pulse font-black opacity-40 uppercase tracking-widest text-xs">Accessing Cloud...</div> : (
                    <Accordion type="multiple" value={openItems} onValueChange={setOpenItems} className="space-y-2 pb-10">
                      {groupedAxioms.length === 0 && explorerSearch.length > 0 && (
                          <div className="py-20 text-center opacity-40">
                              <Search className="h-10 w-10 mx-auto mb-2" />
                              <p className="text-xs font-black uppercase tracking-widest">Nothing found. Try again with different data.</p>
                          </div>
                      )}
                      {groupedAxioms.map(([compId, licks]) => (
                        <AccordionItem key={compId} value={compId} className="border border-border/50 rounded-lg overflow-hidden bg-background/30">
                          <div className="flex items-center justify-between py-3 px-4 bg-card/95 hover:bg-primary/5 transition-colors group">
                            <div className="flex items-center gap-4 flex-grow">
                              <Checkbox checked={selectedTrackGroups.has(compId)} onCheckedChange={() => { const n = new Set(selectedTrackGroups); n.has(compId) ? n.delete(compId) : n.add(compId); setSelectedTrackGroups(n); }} />
                              <AccordionTrigger className="hover:no-underline p-0 border-none bg-transparent">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 text-[10px] font-black">{licks.length}</Badge>
                              </AccordionTrigger>
                              {editingGroupId === compId ? (
                                <div className="flex flex-col gap-2 p-2 bg-background/80 rounded border border-primary/20 w-full max-2xl" onClick={e => e.stopPropagation()}>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-50">Name</Label><Input value={editNameValue} onChange={e => setEditNameValue(e.target.value)} className="h-7 text-xs" /></div>
                                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-50">BPM</Label><Input value={editBpmValue} onChange={e => setEditBpmValue(e.target.value)} className="h-7 text-xs" /></div>
                                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-50">Scale</Label>
                                        <Select value={editScaleValue} onValueChange={setEditScaleValue}>
                                            <SelectTrigger className="h-7 text-xs bg-background"><SelectValue /></SelectTrigger>
                                            <SelectContent>{AVAILABLE_SCALES.map(s => <SelectItem key={s} value={s} className="text-xs uppercase">{s}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-50">Key</Label>
                                        <Select value={editKeyValue} onValueChange={setEditKeyValue}>
                                            <SelectTrigger className="h-7 text-xs bg-background"><SelectValue /></SelectTrigger>
                                            <SelectContent>{AVAILABLE_KEYS.map(k => <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-50">Genre</Label><MultiSelector options={AVAILABLE_GENRES} values={editGenreValue} onValuesChange={setEditGenreValue} placeholder="Genres" className="w-full" /></div>
                                    <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-50">Mood</Label><MultiSelector options={AVAILABLE_MOODS} values={editMoodValue} onValuesChange={setEditMoodValue} placeholder="Moods" className="w-full" /></div>
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    <Button size="sm" onClick={() => handleUpdateTrackMetadata(compId, editNameValue, editGenreValue, editMoodValue, parseInt(editBpmValue) || 72, editKeyValue, editScaleValue, editTsValue, licks)}><Check className="h-4 w-4" /> Save</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingGroupId(null)}><X className="h-4 w-4" /> Cancel</Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="cursor-pointer flex-grow" onClick={() => { setEditingGroupId(compId); setEditNameValue(compId); setEditGenreValue(licks[0].genre || []); setEditMoodValue(licks[0].mood || []); setEditBpmValue(String(licks[0].nativeBpm || 72)); setEditKeyValue(licks[0].nativeKey || 'C'); setEditScaleValue(licks[0].nativeScale || 'dorian'); }}>
                                  <div className="text-sm font-black flex items-center gap-2">{compId.replace(/_/g, ' ')} <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100" /></div>
                                  <div className="text-[9px] uppercase font-bold opacity-50">G: {(licks[0].genre || []).join(', ')} | M: {(licks[0].mood || []).join(', ')} | {licks[0].nativeKey} {licks[0].nativeScale}</div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 pr-4">
                               <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleExportTrack(compId, licks); }} className="h-8 w-8 text-muted-foreground hover:text-primary"><Download className="h-4 w-4" /></Button>
                               <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); licks.forEach(l => deleteDocumentNonBlocking(doc(db, 'heritage_axioms', l.id))); }} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                          <AccordionContent className="p-0 border-t overflow-visible">
                            <ScrollArea className="w-full">
                              <div className="min-w-[1000px]">
                                <table className="w-full text-left text-sm border-collapse">
                                  <thead className="bg-muted/50 text-[10px] uppercase font-black opacity-60">
                                    <tr>
                                        <th className="p-3 pl-12">Axiom ID</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">Instrument</th>
                                        <th className="p-3">Struct</th>
                                        <th className="p-3">Vector</th>
                                        <th className="p-3">Narrative</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/20">
                                    {licks.map((ax: any) => (
                                      // #ЗАЧЕМ: ПЛАН №1260. Желтая подсветка найденной аксиомы.
                                      <tr key={ax.id} className={cn(
                                          "hover:bg-primary/5 transition-colors group/row", 
                                          ax.ignored && "opacity-40",
                                          explorerSearch.length > 3 && ax.id.toLowerCase().endsWith(explorerSearch.toLowerCase()) && "outline outline-1 outline-yellow-400 bg-yellow-400/5 shadow-[0_0_15px_rgba(250,204,21,0.1)]"
                                      )}>
                                        <td className="p-3 pl-12 font-mono text-[10px] opacity-70">
                                            {ax.id.split('_').pop()}
                                        </td>
                                        <td className="p-3">
                                          {editingAxiomId === ax.id ? (
                                            <Select value={editAxiomData.role} onValueChange={v => setEditAxiomData({...editAxiomData, role: v})}><SelectTrigger className="h-7 text-[10px] uppercase font-black"><SelectValue /></SelectTrigger><SelectContent>{ROLE_OPTIONS.map(r => <SelectItem key={r} value={r} className="text-[10px] uppercase font-black">{r}</SelectItem>)}</SelectContent></Select>
                                          ) : <Badge variant="outline" className="text-[9px] uppercase font-black px-1.5">{ax.role}</Badge>}
                                        </td>
                                        <td className="p-3">
                                          {editingAxiomId === ax.id ? (
                                            <Select value={editAxiomData.preferredInstrument || "none"} onValueChange={v => setEditAxiomData({...editAxiomData, preferredInstrument: v === 'none' ? null : v})}>
                                              <SelectTrigger className="h-7 text-[10px] uppercase font-black w-32"><SelectValue /></SelectTrigger>
                                              <SelectContent>
                                                {INSTRUMENT_GROUPS.map(group => (
                                                  <SelectGroup key={group.label}>
                                                    <SelectLabel className="text-[9px] uppercase font-black opacity-40 px-2 py-1.5">{group.label}</SelectLabel>
                                                    {group.options.map(i => (
                                                      <SelectItem key={i} value={i} className="text-[10px] font-black">{DISPLAY_NAMES[i] || i}</SelectItem>
                                                    ))}
                                                  </SelectGroup>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          ) : (
                                            ax.preferredInstrument ? <Badge variant="secondary" className="bg-accent/10 text-accent text-[9px] font-black px-1.5">{DISPLAY_NAMES[String(ax.preferredInstrument)] || String(ax.preferredInstrument).toUpperCase()}</Badge> : <span className="text-[9px] opacity-30 font-black">BP DEFAULT</span>
                                          )}
                                        </td>
                                        <td className="p-3 font-mono text-[10px] opacity-60 whitespace-nowrap">
                                            O:{ax.barOffset || 0} / B:{ax.bars || 1} / N:{ax.noteCount || 0}
                                        </td>
                                        <td className="p-3 font-mono text-[10px] opacity-60">[{ax.vector?.t?.toFixed(1)}, {ax.vector?.b?.toFixed(1)}, {ax.vector?.e?.toFixed(1)}, {ax.vector?.h?.toFixed(1)}]</td>
                                        <td className="p-3 text-xs italic text-muted-foreground">{editingAxiomId === ax.id ? <Input value={editAxiomData.narrative} onChange={e => setEditAxiomData({...editAxiomData, narrative: e.target.value})} className="h-7 text-xs" /> : <div className="line-clamp-1 max-w-[200px]">{ax.narrative}</div>}</td>
                                        <td className="p-3 text-right">
                                          <div className="flex justify-end gap-1">
                                            {editingAxiomId === ax.id ? (
                                              <><Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={handleSaveAxiomEdits}><Check className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingAxiomId(null)}><X className="h-4 w-4" /></Button></>
                                            ) : (
                                              <><Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover/row:opacity-100" onClick={() => { setEditingAxiomId(ax.id); setEditAxiomData({...ax}); }}><Edit2 className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePlayAxiom(ax)}>{playingAxiomId === ax.id ? <Square className="h-4 w-4 fill-current text-destructive animate-pulse" /> : <Play className="h-4 w-4 fill-current" />}</Button><Button size="icon" variant="ghost" onClick={() => handleToggleIgnore(ax)} className={cn("h-7 w-7", ax.ignored ? "text-destructive" : "text-muted-foreground")}>{ax.ignored ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button><Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteDocumentNonBlocking(doc(db, 'heritage_axioms', ax.id))}><Trash2 className="h-3.5 w-3.5" /></Button></>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="genetic" className="flex-grow">
            <Card className="border-border/50 shadow-xl bg-card/50 h-full flex flex-col">
              <CardHeader className="shrink-0"><CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><TrendingUp className="h-5 w-5" /> Genetic Spectrum</CardTitle></CardHeader>
              <CardContent className="flex-grow p-4 pt-0 min-h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                    <PolarAngleAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 900 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    {radarData.map(dyn => dyn.count > 0 && <Radar key={dyn.id} name={dyn.label} dataKey="vector.t" stroke={dyn.color} fill={dyn.color} fillOpacity={0.1} />)}
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="masterpieces" className="flex-grow overflow-hidden">
            <Card className="border-border/50 shadow-xl bg-card/50 h-full flex flex-col overflow-hidden">
              <CardHeader className="shrink-0"><CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><Star className="h-5 w-5" /> Masterpieces</CardTitle></CardHeader>
              <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-full px-6 py-4"><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                {globalMasterpieces?.map((m: any) => (
                  <Card key={m.id} className="bg-background/40 border-border/50 p-4 space-y-2 group relative">
                    <div className="flex justify-between items-start"><Badge variant="outline" className="text-[10px] font-black uppercase text-primary">{m.genre}</Badge></div>
                    <div className="text-xs font-black uppercase truncate">{m.mood}</div>
                    <div className="text-[10px] font-mono opacity-70">Seed: {m.seed}</div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteDocumentNonBlocking(doc(db, 'masterpieces', m.id))}><Trash2 className="h-3.5 w-3.5" /></Button></div>
                  </Card>
                ))}</div></ScrollArea></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="flex-grow flex flex-col overflow-hidden space-y-4 m-0">
            <Card className="border-border/50 shadow-xl bg-card/50 flex-grow flex flex-col overflow-hidden">
              <CardHeader className="pb-4 shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary"><FileText className="h-5 w-5" /> Project Root Manifests</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Synchronize key documents from your project root directly with the Cloud context.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={handlePushRootToCloud} disabled={isProcessing} className="bg-primary hover:bg-primary/90 font-black h-10 px-6 shadow-lg uppercase tracking-wider gap-2">
                      <CloudLightning className={cn("h-4 w-4", isProcessing && "animate-pulse")} /> 
                      {isProcessing ? "Syncing..." : "Push Root to Cloud"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 border-t flex-grow overflow-hidden">
                <ScrollArea className="h-full">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-muted/50 text-[10px] uppercase font-black opacity-60 sticky top-0 z-10 border-b">
                      <tr>
                        <th className="p-4 pl-8">Manifest File</th>
                        <th className="p-4">Category</th>
                        <th className="p-4 text-center">Version</th>
                        <th className="p-4 text-right pr-8">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {[...(projectDocs || [])].sort((a,b) => a.filename.localeCompare(b.filename)).map((d: any) => (
                        <tr key={d.id} className="hover:bg-primary/5 transition-colors group">
                          <td className="p-4 pl-8"><div className="flex items-center gap-3"><FileText className="h-4 w-4 text-primary opacity-70" /><span className="font-bold">{d.filename}</span></div></td>
                          <td className="p-4"><Badge variant="outline" className="text-[9px] uppercase font-black">{d.category || 'general'}</Badge></td>
                          <td className="p-4 text-center font-mono text-[10px] opacity-60">v{d.version || '1.0'}</td>
                          <td className="p-4 text-right pr-8">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setViewingDocId(d.id); setEditingDocContent(d.content); }}><Edit2 className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-accent" onClick={() => { const blob = new Blob([d.content], { type: 'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = d.filename; a.click(); }}><Download className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteDocumentNonBlocking(doc(db, 'project_documents', d.id))}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inject" className="flex-grow flex flex-col overflow-hidden space-y-6 m-0">
            <div className="flex wrap items-center gap-4 bg-muted/20 p-6 rounded-xl border border-border/50 shrink-0">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="bg-primary hover:bg-primary/90 font-black h-12 px-8 shadow-lg uppercase tracking-wider"><Upload className="mr-3 h-5 w-5" /> Load Local DNA</Button>
              <div className="flex items-center gap-3 pl-6 border-l border-border/50">
                <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Target Genres:</Label>
                <MultiSelector options={AVAILABLE_GENRES} values={selectedGenre} onValuesChange={setSelectedGenre} placeholder="Select genres..." className="w-[240px] h-10 font-bold" />
              </div>
            </div>
            {stagedAxioms.length > 0 && (
              <Card className="border-primary/30 shadow-2xl overflow-hidden flex-grow flex flex-col m-0">
                <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-4 shrink-0">
                  <div><CardTitle className="text-xl font-bold flex items-center gap-2"><Wind className="h-6 w-6 text-primary"/> Staging Buffer: {currentFileName}</CardTitle><CardDescription className="text-[10px] uppercase font-bold text-primary/70">Heritage Ready for Injection</CardDescription></div>
                  <div className="flex gap-3"><Button variant="ghost" size="sm" onClick={() => setStagedAxioms([])} className="text-muted-foreground uppercase text-[10px] font-bold">Clear Buffer</Button><Button onClick={handleCommitInjection} disabled={isProcessing || selectedIds.size === 0} className="gap-3 font-black uppercase tracking-widest px-8 h-11"><Check className={cn("h-5 w-5", isProcessing && "animate-spin")} />Inject {selectedIds.size} Axioms</Button></div>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                    <ScrollArea className="h-full">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-muted sticky top-0 z-10 text-[10px] uppercase font-black">
                                <tr>
                                    <th className="p-4 w-12 text-center"><Checkbox checked={selectedIds.size === stagedAxioms.length} onCheckedChange={c => { if(c) setSelectedIds(new Set(stagedAxioms.map(a => a.id))); else setSelectedIds(new Set()); }} /></th>
                                    <th className="p-4">Source</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Struct</th>
                                    <th className="p-4">Meta</th>
                                    <th className="p-4 text-right">Preview</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {stagedAxioms.map(ax => (
                                    <tr key={ax.id} className="hover:bg-primary/5 transition-colors">
                                        <td className="p-4 text-center"><Checkbox checked={selectedIds.has(ax.id)} onCheckedChange={() => { const n = new Set(selectedIds); n.has(ax.id) ? n.delete(ax.id) : n.add(ax.id); setSelectedIds(n); }} /></td>
                                        <td className="p-4 font-bold text-primary text-[11px] uppercase tracking-tight">{ax.compositionId}</td>
                                        <td className="p-4"><Badge variant="outline" className="text-[9px] font-black uppercase">{ax.role}</Badge></td>
                                        <td className="p-4 text-[10px] font-mono opacity-60">O:{ax.barOffset} / B:{ax.bars} / N:{ax.noteCount}</td>
                                        <td className="p-4 text-[10px] font-mono opacity-60">{ax.nativeBpm || '??'}B / {ax.nativeKey} / {ax.nativeScale}</td>
                                        <td className="p-4 text-right"><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handlePlayAxiom(ax)}>{playingAxiomId === ax.id ? <Square className="h-4 w-4 fill-current text-destructive animate-pulse" /> : <Play className="h-4 w-4 fill-current" />}</Button></td>
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
      </div>

      <Dialog open={!!viewingDocId} onOpenChange={(open) => !open && setViewingDocId(null)}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col border-primary/20 bg-card shadow-2xl">
              <DialogHeader><DialogTitle className="flex items-center gap-2 text-primary font-black uppercase tracking-tight text-xl"><FileText className="h-6 w-6" /> Manifest Editor</DialogTitle></DialogHeader>
              <div className="flex-grow overflow-hidden mt-4 bg-background/30 rounded-lg p-1"><Textarea value={editingDocContent} onChange={(e) => setEditingDocContent(e.target.value)} className="h-full font-mono text-[13px] leading-relaxed bg-transparent resize-none p-4" /></div>
              <DialogFooter className="pt-4 border-t border-primary/10 flex flex-row justify-between items-center w-full"><div className="text-[10px] uppercase font-black opacity-40">Sync: Firestore Overwrite</div><div className="flex gap-2"><Button variant="ghost" onClick={() => setViewingDocId(null)} className="uppercase text-[10px] font-black h-10 px-6">Cancel</Button><Button onClick={handleUpdateDocContent} disabled={isProcessing} className="gap-2 uppercase text-[10px] font-black h-10 px-8 shadow-xl bg-primary hover:bg-primary/90"><ClipboardCheck className="h-4 w-4" /> Push Changes to Cloud</Button></div></DialogFooter>
          </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-primary/20 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary font-black uppercase tracking-tight">{confirmConfig?.title || "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-bold">{confirmConfig?.desc || "This action is critical and cannot be undone."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="uppercase text-[10px] font-black">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirmConfig?.action(); setConfirmOpen(false); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 uppercase text-[10px] font-black">Confirm Execution</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
