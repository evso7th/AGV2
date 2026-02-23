
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
  Brain, 
  ShieldAlert,
  ArrowLeft,
  Save,
  X,
  History,
  RotateCcw,
  FileJson
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore } from '@/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { saveHeritageAxiom } from '@/lib/firebase-service';
import { decompressCompactPhrase, DEGREE_TO_SEMITONE } from '@/lib/music-theory';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { FractalEvent, InstrumentHints } from '@/types/fractal';

const PROCESSED_FILES_KEY = 'AuraGroove_ImportedFiles';

/**
 * #ЗАЧЕМ: Дашборд Аудитора ДНК v3.0.
 * #ЧТО: 1. Отображает ТОЛЬКО содержимое загруженного локального JSON.
 *       2. Содержимое живой базы скрыто для чистоты сессии.
 *       3. Позволяет прослушивать и выборочно инжектировать Наследие.
 */
export default function HypercubeDashboard() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { isInitialized, initialize, playRawEvents, stopAllSounds, isPlaying, setIsPlaying } = useAudioEngine();
  
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Stats derived EXCLUSIVELY from the LOADED FILE
  const stats = useMemo(() => {
    return stagedAxioms.reduce((acc, ax) => {
      acc.total++;
      acc.genres[ax.genre || 'blues'] = (acc.genres[ax.genre || 'blues'] || 0) + 1;
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
  }, [stagedAxioms]);

  const resetStaging = () => {
    setStagedAxioms([]);
    setSelectedIds(new Set());
    setCurrentFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetStaging();

    if (processedFiles.includes(file.name)) {
      toast({ 
        variant: "destructive", 
        title: "Duplicate Check", 
        description: `File "${file.name}" was imported before. Audit carefully.` 
      });
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const flattened: any[] = [];
        
        // Handle both Array and Object (Batch) formats
        if (Array.isArray(json)) {
            json.forEach((ax, idx) => {
                flattened.push({ ...ax, id: `local_${idx}`, compositionId: ax.compositionId || file.name });
            });
        } else {
            Object.entries(json).forEach(([trackName, licks]) => {
                (licks as any[]).forEach((lick, idx) => {
                    flattened.push({
                        ...lick,
                        id: `${trackName}_${lick.role}_${idx}`,
                        compositionId: trackName
                    });
                });
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
          origin: `Manual_Forge_Injection_${currentFileName}`,
          timestamp: new Date().toISOString() as any
        });
        addedCount++;
      }

      // Update local history
      const nextFiles = [...new Set([...processedFiles, currentFileName])];
      setProcessedFiles(nextFiles);
      localStorage.setItem(PROCESSED_FILES_KEY, JSON.stringify(nextFiles));

      toast({ 
        title: "DNA Injected", 
        description: `Successfully committed ${addedCount} axioms to the live Hypercube.` 
      });
      
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

  const handlePurge = async () => {
    if (!window.confirm("CRITICAL: Wipe the whole cloud database? This cannot be undone.")) return;
    setIsProcessing(true);
    try {
      const snapshot = await getDocs(collection(db, 'heritage_axioms'));
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setProcessedFiles([]);
      localStorage.removeItem(PROCESSED_FILES_KEY);
      toast({ title: "Hypercube Cleared" });
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

    const phrase = Array.isArray(axiom.phrase) && typeof axiom.phrase[0] === 'number' 
        ? decompressCompactPhrase(axiom.phrase) 
        : axiom.phrase;

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
            <p className="text-muted-foreground">Axiom Factory Asset Auditing & Selective Injection Protocol</p>
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

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-4 rounded-lg border border-border/50 shadow-inner">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-12 shadow-lg transition-transform active:scale-95">
            <Upload className="mr-2 h-5 w-5" /> Load DNA File from Disk
          </Button>
          <div className="h-10 w-px bg-border mx-2" />
          <div className="flex flex-col">
             <span className="text-[10px] uppercase text-muted-foreground tracking-widest font-bold">Session History</span>
             <span className="text-sm font-mono"><strong>{processedFiles.length}</strong> Files Injected</span>
          </div>
          <div className="ml-auto flex gap-3">
             <Button variant="outline" size="sm" onClick={handlePurge} disabled={isProcessing} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                <ShieldAlert className="h-4 w-4 mr-2" /> Global Purge (Cloud)
             </Button>
          </div>
        </div>

        {/* Local File Stats Breakdown */}
        {stagedAxioms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <Card className="bg-card border-primary/20 shadow-md">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Asset</CardTitle>
                <Badge variant="outline" className="font-mono text-primary border-primary/30">{stats.total} Total Axioms</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold truncate text-primary">{currentFileName}</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">Source: {stagedAxioms[0]?.compositionId || 'Unknown'}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-primary/20 shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Genre Composition</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {Object.entries(stats.genres).map(([g, count]) => (
                  <Badge key={g} variant="secondary" className="text-[10px] uppercase font-mono bg-primary/10 text-primary border-primary/20">{g}: {count}</Badge>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-primary/20 shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mood Variance</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.commonMoods).map(([cm, count]) => (
                    <Badge key={cm} className="text-[10px] uppercase font-bold px-2">{cm}: {count}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Auditor Workspace */}
        {stagedAxioms.length > 0 ? (
          <Card className="border-primary/30 shadow-2xl overflow-hidden animate-in fade-in duration-700">
            <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2"><Wind className="h-6 w-6 text-primary"/> DNA Buffer: {currentFileName}</CardTitle>
                <CardDescription>Auditing local forge data before cloud injection</CardDescription>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" onClick={resetStaging} className="text-muted-foreground hover:text-foreground">
                  <RotateCcw className="h-4 w-4 mr-2" /> Reset Buffer
                </Button>
                <Button onClick={handleCommitInjection} disabled={isProcessing || selectedIds.size === 0} className="gap-2 font-bold px-10 h-11 shadow-lg active:scale-95">
                  <Save className={cn("h-5 w-5", isProcessing && "animate-spin")} />
                  Commit {selectedIds.size} Selective Axioms
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[650px] scrollbar-thin scrollbar-thumb-primary/20">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0 z-10 shadow-sm border-b">
                    <tr className="text-left text-muted-foreground text-[10px] uppercase tracking-widest">
                      <th className="p-4 w-12 text-center">
                        <Checkbox 
                          checked={selectedIds.size === stagedAxioms.length} 
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedIds(new Set(stagedAxioms.map(a => a.id)));
                            else setSelectedIds(new Set());
                          }} 
                        />
                      </th>
                      <th className="p-4 font-bold">Axiom Source / ID</th>
                      <th className="p-4 font-bold">Role</th>
                      <th className="p-4 font-bold">Mood</th>
                      <th className="p-4 font-bold">Vector (t,b,e,h)</th>
                      <th className="p-4 font-bold">Sentient Narrative</th>
                      <th className="p-4 font-bold text-right">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {stagedAxioms.map((ax) => (
                      <tr key={ax.id} className="hover:bg-primary/5 transition-colors group">
                        <td className="p-4 text-center">
                          <Checkbox checked={selectedIds.has(ax.id)} onCheckedChange={() => toggleSelect(ax.id)} />
                        </td>
                        <td className="p-4 font-bold text-primary whitespace-normal break-words max-w-[200px] leading-tight text-xs">
                          {ax.compositionId}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="capitalize text-[10px] border-primary/20 text-primary/80">{ax.role}</Badge>
                        </td>
                        <td className="p-4 capitalize text-xs font-medium">{ax.mood}</td>
                        <td className="p-4 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                          [{ax.vector?.t?.toFixed(1) || 0}, {ax.vector?.b?.toFixed(1) || 0}, {ax.vector?.e?.toFixed(1) || 0}, {ax.vector?.h?.toFixed(1) || 0}]
                        </td>
                        <td className="p-4 text-xs italic text-muted-foreground leading-relaxed max-w-md">
                          <p className="line-clamp-2 group-hover:line-clamp-none transition-all duration-300">{ax.narrative || 'Axiom Narrative Missing'}</p>
                        </td>
                        <td className="p-4 text-right">
                          <Button size="icon" variant="ghost" onClick={() => handlePlayAxiom(ax)} className="h-10 w-10 hover:bg-primary/20 hover:text-primary transition-all">
                            <Play className="h-5 w-5 fill-current" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 space-y-8 border-2 border-dashed rounded-3xl border-primary/20 bg-primary/5 animate-in fade-in duration-1000">
             <div className="relative">
                <FileJson className="h-24 w-16 text-primary/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                </div>
             </div>
             <div className="text-center space-y-3">
                <h3 className="text-3xl font-bold tracking-tight text-muted-foreground/80">Hypercube Buffer Empty</h3>
                <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
                    DNA list is dormant. Load a JSON asset from the local forge to begin auditing the Heritage Axioms. 
                    <br/><span className="text-xs opacity-60 italic">Live cloud repository is hidden for session purity.</span>
                </p>
             </div>
             <Button onClick={() => fileInputRef.current?.click()} size="lg" className="px-12 h-14 text-xl font-black shadow-xl hover:shadow-primary/20 transition-all">
                Select Forge File
             </Button>
          </div>
        )}

      </div>
    </div>
  );
}
