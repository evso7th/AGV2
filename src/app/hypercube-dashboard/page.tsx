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
  Globe
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
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, query } from 'firebase/firestore';
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
  const [explorerSearch, setFilterSearchText] = useState("");
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

  const handleDeleteAxiom = (id: string) => {
    if (!window.confirm("CRITICAL: Delete this specific axiom from Cloud?")) return;
    const docRef = doc(db, 'heritage_axioms', id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Purge Initiated", description: "Deleting axiom..." });
  };

  const handleDeleteTrack = async (compId: string, axioms: any[]) => {
    if (!window.confirm(`CRITICAL: Purge entire track "${compId.replace(/_/g, ' ')}" and all its ${axioms.length} axioms?`)) return;
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      axioms.forEach(ax => {
        batch.delete(doc(db, 'heritage_axioms', ax.id));
      });
      await batch.commit();
      toast({ title: "Track Purged", description: `Successfully deleted ${compId}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Purge Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurgeAll = async () => {
    if (!window.confirm("MASTER PURGE: Wipe entire database? This cannot be undone.")) return;
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      globalAxioms?.forEach(d => batch.delete(doc(db, 'heritage_axioms', d.id)));
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
          <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/30 p-1 border border-border/50">
            <TabsTrigger value="explore" className="text-xs font-bold uppercase tracking-wider data-[state=active]:bg-card">
              <Globe className="h-4 w-4 mr-2" /> Explore Cloud Heritage
            </TabsTrigger>
            <TabsTrigger value="inject" className="text-xs font-bold uppercase tracking-wider data-[state=active]:bg-card">
              <Upload className="h-4 w-4 mr-2" /> Inject New DNA
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
                    <div className="relative group">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder="Search composition..." 
                        className="pl-9 h-9 w-[240px] text-xs bg-background/50"
                        value={explorerSearch}
                        onChange={(e) => setFilterSearchText(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={handlePurgeAll} disabled={isProcessing} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                      <ShieldAlert className="h-4 w-4 mr-2" /> Wipe Base
                    </Button>
                  </div>
                </div>
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
                          <div className="flex items-center justify-between px-4 hover:bg-primary/5 transition-colors group">
                            <AccordionTrigger className="flex-grow hover:no-underline py-4">
                              <div className="flex items-center gap-4 text-left">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 text-[10px] font-black">{licks.length}</Badge>
                                <div className="space-y-0.5">
                                  <div className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{compId.replace(/_/g, ' ')}</div>
                                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Genre: {licks[0].genre} | Mood: {licks[0].commonMood}</div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteTrack(compId, licks); }} className="text-muted-foreground hover:text-destructive h-8 w-8 ml-2">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <AccordionContent className="p-0 bg-muted/10 border-t">
                            <div className="divide-y divide-border/20">
                              {licks.map((ax: any, idx: number) => (
                                <div key={ax.id} className="flex items-center gap-4 p-3 pl-12 hover:bg-primary/5 transition-colors">
                                  <Badge variant="outline" className="text-[10px] uppercase font-black w-16 justify-center bg-background/50">{ax.role}</Badge>
                                  <div className="flex-grow min-w-0">
                                    <div className="text-xs italic text-muted-foreground line-clamp-1 opacity-80">{ax.narrative}</div>
                                    <div className="text-[9px] font-mono text-muted-foreground mt-0.5">Vector: [{ax.vector?.t?.toFixed(1)}, {ax.vector?.b?.toFixed(1)}, {ax.vector?.e?.toFixed(1)}, {ax.vector?.h?.toFixed(1)}]</div>
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

          {/* TAB: INJECT */}
          <TabsContent value="inject" className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-6 rounded-xl border border-border/50 shadow-inner">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="bg-primary hover:bg-primary/90 h-12 px-8 shadow-lg active:scale-95 transition-transform font-bold uppercase tracking-wider">
                <Upload className="mr-3 h-5 w-5" /> Load Local DNA
              </Button>
              <div className="flex items-center gap-3 pl-6 border-l border-border/50">
                <Label htmlFor="genre-inject" className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Target Genre:</Label>
                <Select value={selectedGenre} onValueChange={(v) => setSelectedGenre(v as Genre)}>
                  <SelectTrigger id="genre-inject" className="w-[180px] h-10 font-bold bg-background shadow-sm border-primary/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_GENRES.map(g => <SelectItem key={g} value={g} className="capitalize font-bold">{g}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                                {ax.nativeBpm || 'Elastic'} / {ax.nativeKey || 'Universal'}
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
    </div>
  );
}
