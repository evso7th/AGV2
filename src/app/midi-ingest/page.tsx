/**
 * #ЗАЧЕМ: Heritage Alchemist V21.0 — "Orchestral Intelligence".
 * #ЧТО: 1. Добавлен Track Inspector для отображения всех дорожек MIDI.
 *       2. Внедрен AI-анализ структуры файла для предложения ролей.
 *       3. Добавлена кнопка "Play Full Material" для прослушивания исходника.
 *       4. Исправлены права доступа к Firestore (через правила) для работы Purge.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Midi } from '@tonejs/midi';
import { 
    Upload, FileMusic, Sparkles, CloudUpload, Music, Waves, Drum, LayoutGrid, Factory, 
    Play, StopCircle, Database, RefreshCcw, Compass, Zap, Sun, Activity, Target, Wand2,
    BrainCircuit, Loader2, Trash2, AlertTriangle, ArrowLeft, CheckCircle2, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    detectKeyFromNotes, 
    SEMITONE_TO_DEGREE, 
    DEGREE_KEYS, 
    TECHNIQUE_KEYS, 
    DEGREE_TO_SEMITONE,
    analyzeAxiomVector,
    decompressCompactPhrase
} from '@/lib/music-theory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore } from '@/firebase';
import { collection, getCountFromServer, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { saveHeritageAxiom } from '@/lib/firebase-service';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Mood, Genre, FractalEvent, CommonMood, AxiomVector } from '@/types/fractal';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { analyzeAxiom } from '@/ai/flows/analyze-axiom-flow';
import { analyzeMidiStructure } from '@/ai/flows/analyze-midi-structure-flow';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type IngestionRole = 'melody' | 'bass' | 'drums' | 'accomp' | 'ignore';

const MOOD_OPTIONS: Mood[] = ['epic', 'joyful', 'enthusiastic', 'melancholic', 'dark', 'anxious', 'dreamy', 'contemplative', 'calm', 'gloomy'];
const GENRE_OPTIONS: Genre[] = ['ambient', 'trance', 'blues', 'progressive', 'rock', 'house', 'rnb', 'ballad', 'reggae', 'celtic'];
const COMMON_MOODS: CommonMood[] = ['dark', 'neutral', 'light'];

export default function MidiIngestPage() {
    const db = useFirestore();
    const router = useRouter();
    const { initialize, isInitialized, playRawEvents, setIsPlaying } = useAudioEngine();
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [isPurging, setIsPurging] = useState(false);
    const [midiFile, setMidiFile] = useState<Midi | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [trackStates, setTrackStates] = useState<Record<number, { role: IngestionRole, selected: boolean, suggestion?: string }>>({});
    const [extractedLicks, setExtractedLicks] = useState<any[]>([]);
    const [selectedMood, setSelectedMood] = useState<Mood>('melancholic');
    const [selectedGenre, setSelectedGenre] = useState<Genre>('blues');
    const [commonMood, setCommonMood] = useState<CommonMood>('dark');
    const [compositionId, setCompositionId] = useState("");
    const [detectedKey, setDetectedKey] = useState<{ root: number, mode: string } | null>(null);
    const [globalAdvice, setGlobalAdvice] = useState<string>("");
    
    // Hypercube Vector State
    const [vector, setVector] = useState<AxiomVector>({ t: 0.5, b: 0.5, e: 0.5, h: 0.5 });
    const [aiReasoning, setAIReasoning] = useState<string>("");
    
    const [playingLickIdx, setPlayingLickIdx] = useState<number | null>(null);
    const [isPlayingFull, setIsPlayingFull] = useState(false);
    const [selectedLickIds, setSelectedLickIds] = useState<Set<string>>(new Set());
    const [globalAxiomCount, setGlobalAxiomCount] = useState<number | null>(null);
    const [isFetchingCount, setIsFetchingCount] = useState(false);

    const fetchGlobalCount = async () => {
        setIsFetchingCount(true);
        try {
            const coll = collection(db, 'heritage_axioms');
            const snapshot = await getCountFromServer(coll);
            setGlobalAxiomCount(snapshot.data().count);
        } catch (e) {
            console.error("[Census] Failed to fetch global count:", e);
        } finally {
            setIsFetchingCount(false);
        }
    };

    useEffect(() => {
        fetchGlobalCount();
    }, [db]);

    const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setCompositionId(file.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/\s+/g, "_"));
        setIsAnalyzing(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const midi = new Midi(event.target?.result as ArrayBuffer);
                setMidiFile(midi);
                
                // Initial track states
                const initialStates: any = {};
                midi.tracks.forEach((track, idx) => {
                    const avgPitch = track.notes.reduce((sum, n) => sum + n.midi, 0) / (track.notes.length || 1);
                    let role: IngestionRole = 'ignore';
                    if (track.notes.length > 5) {
                        if (avgPitch < 45) role = 'bass';
                        else if (track.channel === 9) role = 'drums';
                        else role = 'melody';
                    }
                    initialStates[idx] = { role, selected: role !== 'ignore' };
                });
                setTrackStates(initialStates);

                // Initial Key detection from all notes
                const allNotes = midi.tracks.flatMap(t => t.notes.map(n => n.midi));
                setDetectedKey(detectKeyFromNotes(allNotes));
            } catch (err) {
                toast({ variant: "destructive", title: "MIDI Analysis Failed" });
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleOrchestralAI = async () => {
        if (!midiFile) return;
        setIsAIAnalyzing(true);
        try {
            const trackSummaries = midiFile.tracks.map((t, i) => ({
                index: i,
                name: t.name || `Track ${i}`,
                noteCount: t.notes.length,
                avgPitch: t.notes.reduce((sum, n) => sum + n.midi, 0) / (t.notes.length || 1),
                minPitch: Math.min(...t.notes.map(n => n.midi)),
                maxPitch: Math.max(...t.notes.map(n => n.midi)),
            }));

            const result = await analyzeMidiStructure({ tracks: trackSummaries, fileName });
            
            const nextStates = { ...trackStates };
            result.suggestions.forEach(s => {
                nextStates[s.trackIndex] = {
                    ...nextStates[s.trackIndex],
                    role: s.suggestedRole,
                    selected: s.suggestedRole !== 'ignore',
                    suggestion: s.reasoning
                };
            });
            setTrackStates(nextStates);
            setGlobalAdvice(result.globalAdvice);
            toast({ title: "Orchestral Analysis Complete", description: "AI suggested roles for each track." });
        } catch (e) {
            toast({ variant: "destructive", title: "AI Analysis Failed" });
        } finally {
            setIsAIAnalyzing(false);
        }
    };

    const handlePlayFull = async () => {
        if (!midiFile) return;
        if (isPlayingFull) {
            setIsPlaying(false);
            setIsPlayingFull(false);
            return;
        }
        if (!isInitialized) await initialize();

        const events: FractalEvent[] = [];
        midiFile.tracks.forEach((track, tIdx) => {
            const state = trackStates[tIdx];
            if (!state || state.role === 'ignore') return;

            track.notes.forEach(n => {
                events.push({
                    type: (state.role === 'drums' ? 'drum_kick' : state.role) as any,
                    note: n.midi,
                    time: n.time,
                    duration: n.duration,
                    weight: 0.7,
                    technique: 'pick',
                    dynamics: 'mf',
                    phrasing: 'legato'
                });
            });
        });

        setIsPlayingFull(true);
        playRawEvents(events);
    };

    const extractMaterial = () => {
        if (!midiFile || !detectedKey) return;
        
        const result: any[] = [];
        const barsPerLick = 4;
        const bpm = 72; 
        const secondsPerBar = (60 / bpm) * 4;
        const root = detectedKey.root;

        midiFile.tracks.forEach((track, tIdx) => {
            const state = trackStates[tIdx];
            if (!state || !state.selected || state.role === 'ignore') return;

            for (let i = 0; i < track.duration / (secondsPerBar * barsPerLick); i++) {
                const start = i * secondsPerBar * barsPerLick;
                const end = (i + 1) * secondsPerBar * barsPerLick;
                
                const phraseNotes = track.notes.filter((n: any) => n.time >= start && n.time < end);
                if (phraseNotes.length < 4) continue; 

                const compactPhrase: number[] = [];
                phraseNotes.forEach((n: any) => {
                    const relativeTime = n.time - start;
                    const tick = Math.round((relativeTime / (secondsPerBar / 12))); 
                    const durationTicks = Math.max(1, Math.round(n.duration / (secondsPerBar / 12)));
                    let degreeIdx = 0;
                    if (state.role === 'drums') {
                        degreeIdx = n.midi; 
                    } else {
                        const degreeStr = SEMITONE_TO_DEGREE[(n.midi - root + 120) % 12] || 'R';
                        degreeIdx = DEGREE_KEYS.indexOf(degreeStr);
                    }
                    compactPhrase.push(tick, durationTicks, degreeIdx, 0);
                });

                result.push({
                    id: `LICK_${compositionId}_T${tIdx}_B${i}`,
                    phrase: compactPhrase,
                    role: state.role,
                    barOffset: i * barsPerLick,
                    tags: [selectedMood, selectedGenre, state.role]
                });
            }
        });
        setExtractedLicks(result);
        setSelectedLickIds(new Set(result.map(l => l.id)));
    };

    const handleAutoCalibrate = () => {
        if (extractedLicks.length === 0 || !detectedKey) return;
        const firstId = Array.from(selectedLickIds)[0];
        const lick = extractedLicks.find(l => l.id === (firstId || extractedLicks[0].id));
        if (!lick) return;

        const decompressed = decompressCompactPhrase(lick.phrase);
        const newVector = analyzeAxiomVector(decompressed, detectedKey.root);
        setVector(newVector);
        setAIReasoning(""); 
        
        toast({ title: "Heuristic Calibration Complete", description: "Mathematical analysis applied to sliders." });
    };

    const handleAIDeepInsight = async () => {
        if (extractedLicks.length === 0) return;
        const firstId = Array.from(selectedLickIds)[0];
        const lick = extractedLicks.find(l => l.id === (firstId || extractedLicks[0].id));
        if (!lick) return;

        setIsAIAnalyzing(true);
        try {
            const result = await analyzeAxiom({
                phrase: lick.phrase,
                genre: selectedGenre,
                mood: selectedMood,
                rootNote: detectedKey?.root
            });

            setVector(result.vector);
            setAIReasoning(result.reasoning);
            toast({ title: "AI Analysis Complete", description: "Hypercube coordinates updated by the Oracle." });
        } catch (e) {
            toast({ variant: "destructive", title: "AI Analysis Failed" });
        } finally {
            setIsAIAnalyzing(false);
        }
    };

    const handlePurgeDatabase = async () => {
        setIsPurging(true);
        try {
            const collRef = collection(db, 'heritage_axioms');
            const snapshot = await getDocs(collRef);
            console.log(`[Forge] Purging ${snapshot.size} documents...`);
            
            const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'heritage_axioms', docSnap.id)));
            await Promise.all(deletePromises);
            
            toast({ title: "The Great Purge Complete", description: "The Hypercube is now a clean slate." });
            fetchGlobalCount();
        } catch (e) {
            console.error("[Forge] Purge failed:", e);
            toast({ variant: "destructive", title: "Purge Failed", description: "Check permissions or network." });
        } finally {
            setIsPurging(false);
        }
    };

    const transmit = async () => {
        const toTransmit = extractedLicks.filter(l => selectedLickIds.has(l.id));
        if (toTransmit.length === 0) return;

        setIsTransmitting(true);
        try {
            for (const lick of toTransmit) {
                await saveHeritageAxiom(db, {
                    phrase: lick.phrase,
                    role: lick.role,
                    genre: selectedGenre,
                    commonMood: commonMood,
                    mood: selectedMood,
                    compositionId: compositionId,
                    barOffset: lick.barOffset,
                    vector: vector,
                    origin: fileName || 'Heritage Forge',
                    tags: lick.tags
                });
            }
            toast({ title: "Hypercube Updated", description: `Transmitted ${toTransmit.length} axioms.` });
            setExtractedLicks([]);
            fetchGlobalCount();
        } catch (e) {
            toast({ variant: "destructive", title: "Transmission Failed" });
        } finally {
            setIsTransmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-background text-foreground">
            <Card className="w-full max-w-6xl shadow-2xl border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-6 bg-primary/5">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/aura-groove')} className="mr-2 hover:bg-primary/10 text-primary">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Factory className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold tracking-tight">The Heritage Forge v21.0</CardTitle>
                            <CardDescription className="text-muted-foreground flex items-center gap-2">
                                <BrainCircuit className="h-3 w-3 text-primary" /> Orchestral Intelligence & Multi-Track Ingestion
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" disabled={isPurging}>
                                    {isPurging ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                        <AlertTriangle className="h-5 w-5" /> Execute The Great Purge?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will permanently delete all {globalAxiomCount} axioms from the cloud Hypercube. This process is irreversible.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Abort</AlertDialogCancel>
                                    <AlertDialogAction onClick={handlePurgeDatabase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Burn Everything
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-primary flex items-center gap-2 justify-end">
                                <Database className="h-5 w-5" />
                                {isFetchingCount ? '...' : (globalAxiomCount ?? '0')}
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Hypercube Axioms</span>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-8">
                    {/* --- Column 1: Source & Orchestration Advice --- */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="p-5 border rounded-2xl bg-muted/30 space-y-4 shadow-inner">
                            <Label className="text-xs font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
                                <FileMusic className="h-3 w-3" /> Material Discovery
                            </Label>
                            <div className="group border-2 border-dashed border-primary/20 rounded-2xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all relative overflow-hidden">
                                <input type="file" accept=".mid,.midi" onChange={onFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <Upload className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                                <p className="text-xs font-medium text-muted-foreground group-hover:text-primary">Sow MIDI Material</p>
                            </div>
                            
                            {midiFile && (
                                <div className="flex flex-col gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="w-full gap-2 h-9" onClick={handlePlayFull}>
                                        {isPlayingFull ? <StopCircle className="h-4 w-4 text-destructive" /> : <Play className="h-4 w-4 text-primary" />}
                                        {isPlayingFull ? 'Stop Material' : 'Play Full Material'}
                                    </Button>
                                    <Button variant="secondary" size="sm" className="w-full gap-2 h-9" onClick={handleOrchestralAI} disabled={isAIAnalyzing}>
                                        {isAIAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                                        AI Orchestrator
                                    </Button>
                                </div>
                            )}

                            {globalAdvice && (
                                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                                    <div className="flex items-center gap-2 mb-1 text-primary font-bold text-[10px] uppercase">
                                        <Info className="h-3 w-3" /> Oracle Advice
                                    </div>
                                    <p className="text-[10px] leading-relaxed text-muted-foreground italic">"{globalAdvice}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- Column 2: Track Inspector --- */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="flex flex-col h-full">
                            <Label className="text-xs font-bold uppercase tracking-widest text-primary/80 mb-3 block">Track Inspector</Label>
                            <ScrollArea className="flex-grow border rounded-2xl bg-black/20 p-2 min-h-[400px]">
                                {!midiFile ? (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic pt-20">Waiting for upload...</div>
                                ) : (
                                    <div className="space-y-3">
                                        {midiFile.tracks.map((track, idx) => {
                                            const state = trackStates[idx];
                                            if (!state) return null;
                                            return (
                                                <div key={idx} className={cn("p-3 border rounded-xl space-y-2 transition-all", state.selected ? "bg-card border-primary/30" : "bg-muted/20 opacity-50")}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox checked={state.selected} onCheckedChange={(c) => setTrackStates(prev => ({...prev, [idx]: {...prev[idx], selected: !!c}}))} />
                                                            <span className="text-[10px] font-bold truncate max-w-[100px]">{track.name || `Trk ${idx}`}</span>
                                                        </div>
                                                        <Select value={state.role} onValueChange={(v) => setTrackStates(prev => ({...prev, [idx]: {...prev[idx], role: v as any}}))}>
                                                            <SelectTrigger className="h-6 w-[80px] text-[9px] px-1"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="melody" className="text-[10px]">Melody</SelectItem>
                                                                <SelectItem value="bass" className="text-[10px]">Bass</SelectItem>
                                                                <SelectItem value="accomp" className="text-[10px]">Accomp</SelectItem>
                                                                <SelectItem value="drums" className="text-[10px]">Drums</SelectItem>
                                                                <SelectItem value="ignore" className="text-[10px]">Ignore</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {state.suggestion && <div className="text-[8px] text-primary/70 border-t pt-1 italic">{state.suggestion}</div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                            <Button className="mt-4 w-full h-10 gap-2 font-bold" disabled={!midiFile} onClick={extractMaterial}>
                                <Wand2 className="h-4 w-4" /> Extract Axioms
                            </Button>
                        </div>
                    </div>

                    {/* --- Column 3: Buffer & Vector Calibration --- */}
                    <div className="space-y-6 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Sub-column: Buffer */}
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center mb-3">
                                <Label className="text-xs font-bold uppercase tracking-widest text-primary/80">Extraction Buffer</Label>
                                <span className="text-[10px] font-bold text-primary px-2 bg-primary/10 rounded-full">{extractedLicks.length}</span>
                            </div>
                            <ScrollArea className="flex-grow border rounded-2xl bg-black/20 p-2 min-h-[300px]">
                                {extractedLicks.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic pt-20">Extract to preview...</div>
                                ) : (
                                    <div className="space-y-2">
                                        {extractedLicks.map((lick, idx) => (
                                            <div key={idx} className="p-3 border rounded-xl flex items-center justify-between bg-card/80 hover:bg-muted/50 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox checked={selectedLickIds.has(lick.id)} onCheckedChange={() => {
                                                        const next = new Set(selectedLickIds);
                                                        if (next.has(lick.id)) next.delete(lick.id); else next.add(lick.id);
                                                        setSelectedLickIds(next);
                                                    }} />
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-mono opacity-70 uppercase">{lick.role} @ BAR_{lick.barOffset}</span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-primary h-8 w-8" onClick={() => playPreview(lick, idx)}>
                                                    {playingLickIdx === idx ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        {/* Sub-column: Vector & Transmit */}
                        <div className="flex flex-col h-full gap-4">
                            <div className="p-5 border rounded-2xl bg-primary/5 space-y-6 shadow-sm border-primary/10 flex-grow relative">
                                <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 mb-2">
                                    <Zap className="h-3 w-3" /> Vector Calibration
                                </Label>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 flex-1 text-[10px] gap-1" onClick={handleAutoCalibrate} disabled={extractedLicks.length === 0}>
                                        Heuristic
                                    </Button>
                                    <Button variant="default" size="sm" className="h-7 flex-1 text-[10px] gap-1 bg-primary/80" onClick={handleAIDeepInsight} disabled={extractedLicks.length === 0 || isAIAnalyzing}>
                                        {isAIAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <BrainCircuit className="h-3 w-3" />}
                                        AI Insight
                                    </Button>
                                </div>
                                
                                <div className="space-y-4 pt-4">
                                    <VectorSlider label="Tension" value={vector.t} icon={<Activity className="h-3 w-3" />} onChange={(v) => setVector({...vector, t: v})} />
                                    <VectorSlider label="Brightness" value={vector.b} icon={<Sun className="h-3 w-3" />} onChange={(v) => setVector({...vector, b: v})} />
                                    <VectorSlider label="Entropy" value={vector.e} icon={<RefreshCcw className="h-3 w-3" />} onChange={(v) => setVector({...vector, e: v})} />
                                    <VectorSlider label="Stability" value={vector.h} icon={<Target className="h-3 w-3" />} onChange={(v) => setVector({...vector, h: v})} />
                                </div>

                                {aiReasoning && (
                                    <div className="mt-4 p-3 bg-background/50 rounded-xl border border-primary/10">
                                        <p className="text-[10px] italic leading-relaxed text-muted-foreground">
                                            <span className="font-bold text-primary not-italic">Oracle:</span> {aiReasoning}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border rounded-2xl bg-muted/20 space-y-3">
                                <Label className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Metadata Sync</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Select value={selectedGenre} onValueChange={(v) => setSelectedGenre(v as Genre)}>
                                        <SelectTrigger className="h-8 text-[10px] bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>{GENRE_OPTIONS.map(g => <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select value={commonMood} onValueChange={(v) => setCommonMood(v as CommonMood)}>
                                        <SelectTrigger className="h-8 text-[10px] bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>{COMMON_MOODS.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={transmit} disabled={isTransmitting || selectedLickIds.size === 0 || isAIAnalyzing || isPurging} className="w-full h-12 rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20">
                                    <CloudUpload className="h-5 w-5" />
                                    {isTransmitting ? 'Transmitting...' : `Forge ${selectedLickIds.size} Axioms`}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
    );

    function VectorSlider({ label, value, icon, onChange }: { label: string, value: number, icon: any, onChange: (v: number) => void }) {
        return (
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                    <span className="flex items-center gap-1">{icon} {label}</span>
                    <span className="text-primary">{value.toFixed(2)}</span>
                </div>
                <Slider value={[value]} min={0} max={1} step={0.01} onValueChange={([v]) => onChange(v)} />
            </div>
        );
    }

    async function playPreview(lick: any, idx: number) {
        if (playingLickIdx === idx) { setIsPlaying(false); setPlayingLickIdx(null); return; }
        if (!isInitialized) await initialize();
        const events: FractalEvent[] = [];
        const root = detectedKey?.root || 60;
        for (let i = 0; i < lick.phrase.length; i += 4) {
            const t = lick.phrase[i]; const d = lick.phrase[i+1]; const degIdx = lick.phrase[i+2];
            events.push({
                type: (lick.role === 'drums' ? 'drum_kick' : lick.role) as any,
                note: lick.role === 'drums' ? degIdx : root + (DEGREE_TO_SEMITONE[DEGREE_KEYS[degIdx]] || 0),
                time: t / 3, duration: d / 3, weight: 0.8, technique: 'pick', dynamics: 'mf', phrasing: 'legato'
            });
        }
        setPlayingLickIdx(idx); playRawEvents(events);
    }
}
