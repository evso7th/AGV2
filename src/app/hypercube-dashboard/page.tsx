
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Database, 
  Play, 
  Square,
  Trash2, 
  Upload, 
  Activity, 
  Music, 
  Wind, 
  Brain, 
  ShieldAlert,
  ArrowLeft,
  ListFilter,
  Save,
  X,
  History,
  RotateCcw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { saveHeritageAxiom } from '@/lib/firebase-service';
import { decompressCompactPhrase, DEGREE_TO_SEMITONE } from '@/lib/music-theory';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { FractalEvent, InstrumentHints } from '@/types/fractal';

const PROCESSED_FILES_KEY = 'AuraGroove_ImportedFiles';

export default function HypercubeDashboard() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { isInitialized, initialize, playRawEvents, stopAllSounds, isPlaying, setIsPlaying } = useAudioEngine();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStaging, setIsStaging] = useState(false);
  const [stagedAxioms, setStagedAxioms] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processedFiles, setProcessedFiles] = useState<string[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
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

  // Firebase Query
  const axiomsQuery = useMemoFirebase(() => collection(db, 'heritage_axioms'), [db]);
  const { data: axioms, isLoading } = useCollection(axiomsQuery);

  // Stats
  const stats = useMemo(() => {
    if (!axioms) return { total: 0, genres: {}, moods: {}, commonMoods: {}, compositionIds: new Set() };
    
    return axioms.reduce((acc, ax) => {
      acc.total++;
      acc.genres[ax.genre] = (acc.genres[ax.genre] || 0) + 1;
      acc.moods[ax.mood] = (acc.moods[ax.mood] || 0) + 1;
      acc.commonMoods[ax.commonMood] = (acc.commonMoods[ax.commonMood] || 0) + 1;
      acc.compositionIds.add(ax.compositionId);
      return acc;
    }, { 
        total: 0, 
        genres: {} as Record<string, number>, 
        moods: {} as Record<string, number>, 
        commonMoods: {} as Record<string, number>, 
        compositionIds: new Set<string>() 
    });
  }, [axioms]);

  // #ЗАЧЕМ: Сброс текущей сессии импорта. Очищает все временные данные.
  const resetStaging = () => {
    setStagedAxioms([]);
    setSelectedIds(new Set());
    setIsStaging(false);
    setCurrentFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // #ЗАЧЕМ: Загрузка локального файла с диска пользователя.
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Сначала очищаем старые следы
    resetStaging();

    if (processedFiles.includes(file.name)) {
      toast({ 
        variant: "destructive", 
        title: "Duplicate Blocked", 
        description: `File "${file.name}" has already been imported into the Hypercube.` 
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const flattened: any[] = [];
        Object.entries(json).forEach(([trackName, licks]) => {
          (licks as any[]).forEach((lick, idx) => {
            const id = `${trackName}_${lick.role}_${idx}`;
            flattened.push({
              ...lick,
              id,
              compositionId: trackName
            });
          });
        });
        setStagedAxioms(flattened);
        setSelectedIds(new Set(flattened.map(a => a.id)));
        setCurrentFileName(file.name);
        setIsStaging(true);
      } catch (err) {
        toast({ variant: "destructive", title: "Parse Error", description: "The selected file is not a valid AuraGroove Axiom JSON." });
      }
    };
    reader.readAsText(file);
  };

  const handleCommitInjection = async () => {
    setIsProcessing(true);
    let addedCount = 0;
    
    try {
      const toInject = stagedAxioms.filter(a => selectedIds.has(a.id));
      
      for (const ax of toInject) {
        await saveHeritageAxiom(db, {
          ...ax,
          genre: ax.genre || 'blues',
          barOffset: 0,
          origin: `Forge_Local_Import_${currentFileName}`,
          timestamp: new Date().toISOString() as any
        });
        addedCount++;
      }

      // Update local history
      const nextFiles = [...processedFiles, currentFileName];
      setProcessedFiles(nextFiles);
      localStorage.setItem(PROCESSED_FILES_KEY, JSON.stringify(nextFiles));

      toast({ 
        title: "Injection Successful", 
        description: `Committed ${addedCount} axioms from "${currentFileName}".` 
      });
      
      // #ЗАЧЕМ: Очистка после коммита.
      resetStaging();
    } catch (e) {
      toast({ variant: "destructive", title: "Injection Failed", description: String(e) });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteAxiom = async (id: string) => {
    if (!window.confirm("Delete this memory?")) return;
    await deleteDoc(doc(db, 'heritage_axioms', id));
    toast({ title: "Axiom Deleted" });
  };

  const handlePurge = async () => {
    if (!window.confirm("CRITICAL: This will wipe the entire Hypercube database. Are you absolutely sure?")) return;
    setIsProcessing(true);
    try {
      const snapshot = await getDocs(collection(db, 'heritage_axioms'));
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      
      // Also clear file history
      setProcessedFiles([]);
      localStorage.removeItem(PROCESSED_FILES_KEY);
      resetStaging();

      toast({ title: "Hypercube Purged", description: `${snapshot.size} axioms removed.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Purge Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayAxiom = async (axiom: any) => {
    if (!isInitialized) await initialize();
    if (isPlaying) setIsPlaying(false);
    stopAllSounds();

    const rawPhrase = decompressCompactPhrase(axiom.phrase);
    const roleToType: Record<string, string> = {
        'melody': 'melody',
        'bass': 'bass',
        'accomp': 'accompaniment',
        'drums': 'drums'
    };
    const type = roleToType[axiom.role] || 'melody';

    const events: FractalEvent[] = rawPhrase.map(n => ({
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
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-body">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-3">
              <Database className="h-10 w-10" /> Hypercube Dashboard
            </h1>
            <p className="text-muted-foreground">Legacy Management & Selective Injection Protocol v2.5</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => stopAllSounds()} className="gap-2 text-destructive border-destructive/50">
                <Square className="h-4 w-4" /> Stop Audition
            </Button>
            <Button variant="ghost" onClick={() => router.push('/aura-groove')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Player
            </Button>
          </div>
        </div>

        {/* Staging UI (Selective Import) */}
        {isStaging && (
          <Card className="border-primary bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2"><ListFilter className="h-5 w-5"/> Injection Stage (From Local File): {currentFileName}</CardTitle>
                <CardDescription>Select axioms to commit from the current file</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={resetStaging}>
                  <RotateCcw className="h-4 w-4" /> Reset Staging
                </Button>
                <Button variant="ghost" size="icon" onClick={resetStaging}><X className="h-4 w-4"/></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[400px] overflow-y-auto border rounded-md bg-background shadow-inner">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted z-10 shadow-sm">
                    <tr className="border-b">
                      <th className="p-3 w-10 text-center">
                        <Checkbox 
                          checked={selectedIds.size === stagedAxioms.length} 
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedIds(new Set(stagedAxioms.map(a => a.id)));
                            else setSelectedIds(new Set());
                          }} 
                        />
                      </th>
                      <th className="p-3 text-left">Track / Source</th>
                      <th className="p-3 text-left">Role</th>
                      <th className="p-3 text-left">Narrative</th>
                      <th className="p-3 text-right">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stagedAxioms.map((ax) => (
                      <tr key={ax.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-3 text-center">
                          <Checkbox checked={selectedIds.has(ax.id)} onCheckedChange={() => toggleSelect(ax.id)} />
                        </td>
                        <td className="p-3 font-medium text-xs whitespace-normal break-all max-w-[150px] leading-tight">{ax.compositionId}</td>
                        <td className="p-3"><Badge variant="secondary" className="text-[10px]">{ax.role}</Badge></td>
                        <td className="p-3 text-xs italic text-muted-foreground leading-relaxed">{ax.narrative}</td>
                        <td className="p-3 text-right">
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-primary" onClick={() => handlePlayAxiom(ax)}>
                            <Play className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={resetStaging}>Cancel & Clear</Button>
                <Button onClick={handleCommitInjection} disabled={isProcessing || selectedIds.size === 0} className="gap-2 px-8 font-bold">
                  <Save className={cn("h-4 w-4", isProcessing && "animate-spin")} />
                  Commit {selectedIds.size} Axioms to Hypercube
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-primary/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary"/> Total Axioms</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-mono">{isLoading ? '...' : stats.total}</p></CardContent>
          </Card>
          <Card className="bg-card border-primary/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4 text-primary"/> Import History</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-mono">{processedFiles.length}</p><p className="text-[10px] text-muted-foreground uppercase">Processed Files</p></CardContent>
          </Card>
          <Card className="bg-card border-primary/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Music className="h-4 w-4 text-primary"/> Genres Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {Object.entries(stats.genres).map(([g, count]) => (
                  <Badge key={g} variant="secondary" className="text-[10px] uppercase font-mono">{g}: {count}</Badge>
                ))}
                {Object.keys(stats.genres).length === 0 && <span className="text-xs text-muted-foreground italic">None found</span>}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-primary/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4 text-primary"/> Mood Distribution</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1 border-b border-border/50 pb-1.5">
                {Object.entries(stats.commonMoods).map(([cm, count]) => (
                  <Badge key={cm} className="text-[10px] uppercase font-bold">{cm}: {count}</Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 pt-0.5 opacity-80">
                {Object.entries(stats.moods).map(([m, count]) => (
                  <Badge key={m} variant="outline" className="text-[9px] lowercase px-1 h-4">{m}: {count}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".json" 
            className="hidden" 
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isProcessing || isStaging} 
            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 font-bold"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Local Forge Batch
          </Button>
          <Button 
            variant="destructive" 
            onClick={handlePurge} 
            disabled={isProcessing || stats.total === 0}
            className="gap-2"
          >
            <ShieldAlert className="h-4 w-4" /> PURGE HYPERCUBE
          </Button>
        </div>

        {/* Axiom List */}
        <Card className="border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2"><Wind className="h-5 w-5"/> Hypercube Repository (Live Database)</CardTitle>
            <CardDescription>Vector-indexed musical fragments from {stats.compositionIds.size} sources</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b text-left">
                  <tr>
                    <th className="p-4 font-semibold">Source</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold">Mood</th>
                    <th className="p-4 font-semibold">Vector (t,b,e,h)</th>
                    <th className="p-4 font-semibold">Narrative</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {axioms?.map((ax) => (
                    <tr key={ax.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-medium text-primary whitespace-normal break-words max-w-[200px] leading-tight">
                        {ax.compositionId}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize text-[10px]">{ax.role}</Badge>
                      </td>
                      <td className="p-4 capitalize text-xs">{ax.mood}</td>
                      <td className="p-4 font-mono text-[10px] text-muted-foreground">
                        [{ax.vector.t.toFixed(1)}, {ax.vector.b.toFixed(1)}, {ax.vector.e.toFixed(1)}, {ax.vector.h.toFixed(1)}]
                      </td>
                      <td className="p-4 text-xs max-w-xs italic text-muted-foreground">
                        <p className="line-clamp-3">{ax.narrative || 'Axiom Narrative Missing'}</p>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handlePlayAxiom(ax)} title="Listen" className="h-8 w-8">
                          <Play className="h-4 w-4 text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteAxiom(ax.id)} title="Delete" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!axioms || axioms.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground">
                        Hypercube is empty. Upload a local batch to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
