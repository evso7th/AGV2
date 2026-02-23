'use client';

import { useState, useMemo } from 'react';
import { 
  Database, 
  Play, 
  Trash2, 
  FileJson, 
  Activity, 
  Music, 
  Wind, 
  Brain, 
  RefreshCcw,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection } from '@/firebase';
import { collection, doc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { saveHeritageAxiom } from '@/lib/firebase-service';
import { decompressCompactPhrase, DEGREE_TO_SEMITONE } from '@/lib/music-theory';
import { useToast } from '@/hooks/use-toast';
import type { FractalEvent } from '@/types/fractal';

// #ЗАЧЕМ: Статические данные Moody Blues для первичного импорта.
const MOODY_BLUES_ASSET = [
  {
    "phrase": [0, 24, 7, 4, 24, 12, 5, 4, 36, 12, 3, 4, 48, 24, 2, 4, 72, 24, 0, 4],
    "role": "melody",
    "commonMood": "dark",
    "mood": "melancholic",
    "compositionId": "Nights_in_White_Satin",
    "vector": { "t": 0.4, "b": 0.5, "e": 0.2, "h": 0.7 },
    "tags": ["melancholic", "flute-like", "descending"],
    "narrative": "Меланхоличное тяготение вниз от квинты к тонике. Идеально для меланхолии."
  },
  {
    "phrase": [0, 96, 0, 10, 0, 96, 3, 10, 0, 96, 7, 10],
    "role": "accomp",
    "commonMood": "dark",
    "mood": "dreamy",
    "compositionId": "Nights_in_White_Satin",
    "vector": { "t": 0.2, "b": 0.4, "e": 0.1, "h": 0.9 },
    "tags": ["pad", "sustained", "minor"],
    "narrative": "Устойчивое гармоническое поле минорной тоники. Фундамент покоя."
  }
];

export default function HypercubeDashboard() {
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { isInitialized, initialize, playRawEvents, isPlaying, setIsPlaying } = useAudioEngine();
  const [isProcessing, setIsProcessing] = useState(false);

  // Подписка на коллекцию аксиом
  const { data: axioms, isLoading } = useCollection(collection(db, 'heritage_axioms'));

  // Статистика
  const stats = useMemo(() => {
    if (!axioms) return { total: 0, genres: {}, moods: {}, compositionIds: new Set() };
    
    return axioms.reduce((acc, ax) => {
      acc.total++;
      acc.genres[ax.genre] = (acc.genres[ax.genre] || 0) + 1;
      acc.moods[ax.mood] = (acc.moods[ax.mood] || 0) + 1;
      acc.compositionIds.add(ax.compositionId);
      return acc;
    }, { total: 0, genres: {} as any, moods: {} as any, compositionIds: new Set<string>() });
  }, [axioms]);

  // #ЗАЧЕМ: Умный импорт с защитой от дубликатов.
  const handleImportAsset = async () => {
    setIsProcessing(true);
    
    // Создаем набор существующих "отпечатков" для быстрой проверки
    const existingFingerprints = new Set(axioms?.map(a => 
      `${a.compositionId}_${a.role}_${a.phrase.join(',')}`
    ) || []);

    let addedCount = 0;
    let skippedCount = 0;

    try {
      for (const ax of MOODY_BLUES_ASSET) {
        const fingerprint = `${ax.compositionId}_${ax.role}_${ax.phrase.join(',')}`;
        
        if (existingFingerprints.has(fingerprint)) {
          skippedCount++;
          continue;
        }

        await saveHeritageAxiom(db, {
          ...ax,
          phrase: ax.phrase,
          role: ax.role as any,
          genre: 'blues',
          commonMood: ax.commonMood as any,
          mood: ax.mood,
          compositionId: ax.compositionId,
          barOffset: 0,
          vector: ax.vector,
          origin: 'Legacy_Asset',
          tags: ax.tags,
          timestamp: new Date().toISOString() as any
        });
        addedCount++;
      }

      if (addedCount > 0) {
        toast({ 
          title: "Injection Successful", 
          description: `Added ${addedCount} new axioms. ${skippedCount} duplicates skipped.` 
        });
      } else {
        toast({ 
          title: "No New Data", 
          description: `All ${skippedCount} axioms already exist in Hypercube.`,
          variant: "secondary" 
        });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Injection Failed", description: String(e) });
    } finally {
      setIsProcessing(false);
    }
  };

  // Удаление одной аксиомы
  const handleDeleteAxiom = async (id: string) => {
    if (!window.confirm("Delete this memory?")) return;
    await deleteDoc(doc(db, 'heritage_axioms', id));
    toast({ title: "Axiom Deleted" });
  };

  // Полная очистка
  const handlePurge = async () => {
    if (!window.confirm("CRITICAL: This will wipe the entire Hypercube database. Are you absolutely sure?")) return;
    setIsProcessing(true);
    try {
      const snapshot = await getDocs(collection(db, 'heritage_axioms'));
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      toast({ title: "Hypercube Purged", description: `${snapshot.size} axioms removed.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Purge Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Прослушивание
  const handlePlayAxiom = async (axiom: any) => {
    if (!isInitialized) await initialize();
    
    // Останавливаем основной поток если играет, чтобы услышать аксиому
    if (isPlaying) setIsPlaying(false);

    const rawPhrase = decompressCompactPhrase(axiom.phrase);
    const events: FractalEvent[] = rawPhrase.map(n => ({
      type: axiom.role === 'accomp' ? 'accompaniment' : (axiom.role === 'drums' ? 'drums' : axiom.role),
      note: (axiom.role === 'bass' ? 31 : 60) + (DEGREE_TO_SEMITONE[n.deg] || 0),
      time: n.t / 3, // Конвертируем тики в доли (12/8 стандарт)
      duration: n.d / 3,
      weight: 0.8,
      technique: n.tech as any,
      dynamics: 'p',
      phrasing: 'legato'
    }));

    const hints = {
      [axiom.role === 'accomp' ? 'accompaniment' : (axiom.role === 'drums' ? 'drums' : axiom.role)]: 
        axiom.role === 'melody' ? 'blackAcoustic' : 
        (axiom.role === 'bass' ? 'bass_jazz_warm' : 'organ_soft_jazz')
    };

    playRawEvents(events, hints);
    toast({ title: `Playing: ${axiom.compositionId}`, description: `Role: ${axiom.role}` });
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
            <p className="text-muted-foreground">Legacy Management & Axiom Navigation Protocol v2.1</p>
          </div>
          <Button variant="ghost" onClick={() => router.push('/aura-groove')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to AgV2
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-primary/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary"/> Total Axioms</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-mono">{isLoading ? '...' : stats.total}</p></CardContent>
          </Card>
          <Card className="bg-card border-primary/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Music className="h-4 w-4 text-primary"/> Genres</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-mono">{Object.keys(stats.genres).length}</p></CardContent>
          </Card>
          <Card className="bg-card border-primary/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4 text-primary"/> Moods</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-mono">{Object.keys(stats.moods).length}</p></CardContent>
          </Card>
          <Card className="bg-card border-primary/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileJson className="h-4 w-4 text-primary"/> Sources</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-mono">{stats.compositionIds.size}</p></CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4">
          <Button 
            onClick={handleImportAsset} 
            disabled={isProcessing} 
            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50"
          >
            <RefreshCcw className={cn("mr-2 h-4 w-4", isProcessing && "animate-spin")} />
            Inject Legacy Asset (Moody Blues)
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
            <CardTitle className="text-lg flex items-center gap-2"><Wind className="h-5 w-5"/> DNA Repository</CardTitle>
            <CardDescription>Live list of vector-indexed musical fragments</CardDescription>
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
                      <td className="p-4 font-medium text-primary">{ax.compositionId}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize">{ax.role}</Badge>
                      </td>
                      <td className="p-4 capitalize">{ax.mood}</td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">
                        [{ax.vector.t.toFixed(1)}, {ax.vector.b.toFixed(1)}, {ax.vector.e.toFixed(1)}, {ax.vector.h.toFixed(1)}]
                      </td>
                      <td className="p-4 text-xs max-w-xs italic text-muted-foreground line-clamp-2">
                        {ax.narrative || 'No cognitive notes.'}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handlePlayAxiom(ax)} title="Listen">
                          <Play className="h-4 w-4 text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteAxiom(ax.id)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!axioms || axioms.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground">
                        Hypercube is empty. Inject legacy data or upload MIDI via external Forge.
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

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
