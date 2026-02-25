'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Database, 
  Play, 
  Square,
  Upload, 
  Activity, 
  Music, 
  Wind, 
  ShieldAlert,
  ArrowLeft,
  Save,
  RotateCcw,
  FileJson,
  Timer,
  Key,
  Globe,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, getDocs, writeBatch, query } from 'firebase/firestore';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { saveHeritageAxiom } from '@/lib/firebase-service';
import { decompressCompactPhrase, DEGREE_TO_SEMITONE, repairLegacyPhrase } from '@/lib/music-theory';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { FractalEvent, InstrumentHints } from '@/types/fractal';
import type { Genre } from '@/types/music';

const PROCESSED_FILES_KEY = 'AuraGroove_ImportedFiles';

const AVAILABLE_GENRES: Genre[] = [
  'ambient', 'blues', 'trance', 'progressive', 'rock', 'house', 'rnb', 'ballad', 'reggae', 'celtic'
];

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
  const [selectedGenre, setSelectedGenre] = useState<Genre>('blues');
  const [playingAxiomId, setPlayingAxiomId] = useState<string | null>(null);
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
      acc.genres[ax.genre] = (acc.genres[ax.genre] || 0) + 1;
      acc.moods[ax.mood] = (acc.moods[ax.mood] || 0) + 1;
      acc.commonMoods[ax.commonMood] = (acc.commonMoods[ax.commonMood] || 0) + 1;
      return acc;
    }, { 
        total: 0, 
        genres: {} as Record<string, number>, 
        moods: {} as Record<string, number>, 
        commonMoods: {} as Record<string, number> 
    });
  }, [globalAxioms]);

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

    // Очистка имени файла от технических суффиксов
    const cleanFileName = file.name
        .replace(/\.[^/.]+$/, "") // убираем расширение
        .replace(/-axiom.*$/, "") // убираем суффикс аксиомы
        .replace(/\(\d+\)$/, "") // убираем номер копии (1)
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
                nativeBpm: ax.nativeBpm || ax.bpm || null,
                nativeKey: ax.nativeKey || ax.key || null,
                timeSignature: ax.timeSignature || ax.ts || null
            };
        };

        if (Array.isArray(json)) {
            // #ЗАЧЕМ: Приоритет имени файла для одиночных треков.
            // #ЧТО: Игнорируем внутреннее TestSong_1, если имя файла известно.
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
        await saveHeritageAxiom(db, {
          ...ax,
          genre: selectedGenre, 
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

  const handlePurge = async () => {
    if (!window.confirm("CRITICAL: Wipe database?")) return;
    setIsProcessing(true);
    try {
      const snapshot = await getDocs(collection(db, 'heritage_axioms'));
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setProcessedFiles([]);
      toast({ title: "Hypercube Cleared" });
    } catch (e) {
      toast({ variant: "destructive", title: "Purge Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-body">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-3">
              <Database className="h-10 w-10" /> DNA Auditor
            </h1>
            <p className="text-muted-foreground">Heritage Repair & Selective Injection Station</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { stopAllSounds(); setPlayingAxiomId(null); }} className="gap-2 text-destructive border-destructive/50">
                <Square className="h-4 w-4" /> Stop Audition
            </Button>
            <Button variant="ghost" onClick={() => router.push('/aura-groove')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Player
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Capacity</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-black text-primary font-mono">{isDbLoading ? '---' : globalStats.total}</div></CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-muted-foreground">Genre Coverage</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {Object.entries(globalStats.genres).map(([g, count]) => (
                    <Badge key={g} variant="secondary" className="text-[10px] uppercase font-mono">{g}: {count}</Badge>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-muted-foreground">Mood Balance</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {Object.entries(globalStats.commonMoods).map(([cm, count]) => (
                    <Badge key={cm} className="text-[10px] uppercase font-bold">{cm}: {count}</Badge>
                ))}
              </CardContent>
            </Card>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-4 rounded-lg border border-border/50">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="bg-primary h-12 shadow-lg">
            <Upload className="mr-2 h-5 w-5" /> Load Local DNA
          </Button>
          <div className="flex items-center gap-3 pl-4 border-l">
            <Label htmlFor="genre-inject" className="text-xs uppercase font-bold text-muted-foreground">Genre:</Label>
            <Select value={selectedGenre} onValueChange={(v) => setSelectedGenre(v as Genre)}>
              <SelectTrigger id="genre-inject" className="w-[160px] h-10 font-mono"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AVAILABLE_GENRES.map(g => <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={handlePurge} disabled={isProcessing} className="ml-auto text-destructive border-destructive/20">
            <ShieldAlert className="h-4 w-4 mr-2" /> Master Purge
          </Button>
        </div>

        {stagedAxioms.length > 0 && (
          <Card className="border-primary/30 shadow-2xl overflow-hidden animate-in fade-in duration-700">
            <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2"><Wind className="h-6 w-6 text-primary"/> Staging Buffer: {currentFileName}</CardTitle>
                <CardDescription>Auditing local forge data with Native Metadata check</CardDescription>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" onClick={resetStaging} className="text-muted-foreground">Clear Session</Button>
                <Button onClick={handleCommitInjection} disabled={isProcessing || selectedIds.size === 0} className="gap-2 font-bold px-10 h-11">
                  <Save className={cn("h-5 w-5", isProcessing && "animate-spin")} />
                  Commit {selectedIds.size} Axioms
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[650px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0 z-10 border-b">
                    <tr className="text-left text-muted-foreground text-[10px] uppercase tracking-widest">
                      <th className="p-4 w-12 text-center">
                        <Checkbox checked={selectedIds.size === stagedAxioms.length} onCheckedChange={(checked) => {
                            if (checked) setSelectedIds(new Set(stagedAxioms.map(a => a.id)));
                            else setSelectedIds(new Set());
                        }} />
                      </th>
                      <th className="p-4 font-bold">Source</th>
                      <th className="p-4 font-bold">Role</th>
                      <th className="p-4 font-bold">Native Meta</th>
                      <th className="p-4 font-bold">Vector (t,b,e,h)</th>
                      <th className="p-4 font-bold">Sentient Narrative</th>
                      <th className="p-4 font-bold text-right">Preview</th>
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
                        <td className="p-4 font-bold text-primary text-xs">{ax.compositionId}</td>
                        <td className="p-4"><Badge variant="outline" className="capitalize text-[10px]">{ax.role}</Badge></td>
                        <td className="p-4 text-[10px] font-mono text-muted-foreground">
                            {ax.nativeBpm || 'Elastic'} / {ax.nativeKey || 'Universal'}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-muted-foreground">
                          [{ax.vector?.t?.toFixed(1) || 0}, {ax.vector?.b?.toFixed(1) || 0}, {ax.vector?.e?.toFixed(1) || 0}, {ax.vector?.h?.toFixed(1) || 0}]
                        </td>
                        <td className="p-4 text-xs italic text-muted-foreground line-clamp-2">{ax.narrative}</td>
                        <td className="p-4 text-right">
                          <Button size="icon" variant="ghost" onClick={() => handlePlayAxiom(ax)} className="h-10 w-10">
                            {playingAxiomId === ax.id ? <Square className="h-5 w-5 fill-current text-destructive" /> : <Play className="h-5 w-5 fill-current" />}
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

      </div>
    </div>
  );
}
