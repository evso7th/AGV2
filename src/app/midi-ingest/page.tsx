/**
 * #ЗАЧЕМ: Heritage Alchemist V17.0 — "The AI Oracle".
 * #ЧТО: 1. Интеграция с Genkit: кнопка "AI Deep Insight" для интеллектуальной калибровки.
 *       2. Визуальная индикация процесса анализа ИИ.
 */
'use client';

import { useState, useEffect } from 'react';
import { Midi } from '@tonejs/midi';
import { 
    Upload, FileMusic, Sparkles, CloudUpload, Music, Waves, Drum, LayoutGrid, Factory, 
    Play, StopCircle, Database, RefreshCcw, Compass, Zap, Sun, Activity, Target, Wand2,
    BrainCircuit, Loader2
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
import { collection, getCountFromServer } from 'firebase/firestore';
import { saveHeritageAxiom } from '@/lib/firebase-service';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Mood, Genre, FractalEvent, CommonMood, AxiomVector } from '@/types/fractal';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { analyzeAxiom } from '@/ai/flows/analyze-axiom-flow';

type IngestionRole = 'melody' | 'bass' | 'drums' | 'accomp';

const MOOD_OPTIONS: Mood[] = ['epic', 'joyful', 'enthusiastic', 'melancholic', 'dark', 'anxious', 'dreamy', 'contemplative', 'calm', 'gloomy'];
const GENRE_OPTIONS: Genre[] = ['ambient', 'trance', 'blues', 'progressive', 'rock', 'house', 'rnb', 'ballad', 'reggae', 'celtic'];
const COMMON_MOODS: CommonMood[] = ['dark', 'neutral', 'light'];

const detectTrackRole = (track: any): IngestionRole => {
    const name = (track.name || "").toLowerCase();
    if (name.includes("bass")) return 'bass';
    if (track.channel === 9 || name.match(/drum|perc|kick|snare|hihat|kit|beat/)) return 'drums';
    if (name.match(/lead|solo|melody/)) return 'melody';
    if (name.match(/piano|key|chord|pad|str|string|organ/)) return 'accomp';
    const avgPitch = track.notes.reduce((sum: number, n: any) => sum + n.midi, 0) / (track.notes.length || 1);
    if (avgPitch < 48) return 'bass';
    return 'melody';
};

export default function MidiIngestPage() {
    const db = useFirestore();
    const { initialize, isInitialized, playRawEvents, setIsPlaying } = useAudioEngine();
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [midiFile, setMidiFile] = useState<Midi | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [extractedLicks, setExtractedLicks] = useState<any[]>([]);
    const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(-1);
    const [selectedRole, setSelectedRole] = useState<IngestionRole>('melody');
    const [selectedMood, setSelectedMood] = useState<Mood>('melancholic');
    const [selectedGenre, setSelectedGenre] = useState<Genre>('blues');
    const [commonMood, setCommonMood] = useState<CommonMood>('dark');
    const [compositionId, setCompositionId] = useState("");
    const [detectedKey, setDetectedKey] = useState<{ root: number, mode: string } | null>(null);
    const [origin, setOrigin] = useState("");
    
    // Hypercube Vector State
    const [vector, setVector] = useState<AxiomVector>({ t: 0.5, b: 0.5, e: 0.5, h: 0.5 });
    const [aiReasoning, setAIReasoning] = useState<string>("");
    
    const [playingLickIdx, setPlayingLickIdx] = useState<number | null>(null);
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
                const longestTrackIdx = midi.tracks.reduce((prev, curr, idx) => 
                    curr.notes.length > midi.tracks[prev].notes.length ? idx : prev, 0);
                setSelectedTrackIndex(longestTrackIdx);
                setSelectedRole(detectTrackRole(midi.tracks[longestTrackIdx]));
                const key = detectKeyFromNotes(midi.tracks[longestTrackIdx].notes.map(n => n.midi));
                setDetectedKey(key);
            } catch (err) {
                toast({ variant: "destructive", title: "MIDI Analysis Failed" });
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const segmentTrack = () => {
        if (!midiFile || selectedTrackIndex === -1 || !detectedKey) return;
        
        const track = midiFile.tracks[selectedTrackIndex];
        const result = [];
        const barsPerLick = 4;
        const bpm = 72; 
        const secondsPerBar = (60 / bpm) * 4;
        const root = detectedKey.root;

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
                if (selectedRole === 'drums') {
                    degreeIdx = n.midi; 
                } else {
                    const degreeStr = SEMITONE_TO_DEGREE[(n.midi - root + 120) % 12] || 'R';
                    degreeIdx = DEGREE_KEYS.indexOf(degreeStr);
                }
                compactPhrase.push(tick, durationTicks, degreeIdx, 0);
            });

            result.push({
                id: `LICK_${Date.now()}_${i}`,
                phrase: compactPhrase,
                role: selectedRole,
                barOffset: i * barsPerLick,
                tags: [selectedMood, selectedGenre, selectedRole]
            });
        }
        setExtractedLicks(result);
        setSelectedLickIds(new Set(result.map(l => l.id)));
    };

    useEffect(() => {
        if (midiFile && selectedTrackIndex !== -1) segmentTrack();
    }, [midiFile, selectedTrackIndex, selectedRole, detectedKey]);

    const handleAutoCalibrate = () => {
        if (extractedLicks.length === 0 || !detectedKey) return;
        const firstId = Array.from(selectedLickIds)[0];
        const lick = extractedLicks.find(l => l.id === (firstId || extractedLicks[0].id));
        if (!lick) return;

        const decompressed = decompressCompactPhrase(lick.phrase);
        const newVector = analyzeAxiomVector(decompressed, detectedKey.root);
        setVector(newVector);
        setAIReasoning(""); 
        
        toast({
            title: "Heuristic Calibration Complete",
            description: "Mathematical analysis applied to sliders."
        });
    };

    /**
     * #ЗАЧЕМ: Глубокий анализ ИИ через Genkit.
     * #ЧТО: Отправляет данные фразы в ИИ-поток для музыковедческой оценки.
     */
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

            toast({
                title: "AI Analysis Complete",
                description: "Hypercube coordinates updated by the Oracle."
            });
        } catch (e) {
            toast({ variant: "destructive", title: "AI Analysis Failed", description: String(e) });
        } finally {
            setIsAIAnalyzing(false);
        }
    };

    const playPreview = async (lick: any, idx: number) => {
        if (playingLickIdx === idx) {
            setIsPlaying(false);
            setPlayingLickIdx(null);
            return;
        }
        if (!isInitialized) await initialize();

        const events: FractalEvent[] = [];
        const root = detectedKey?.root || 60;

        for (let i = 0; i < lick.phrase.length; i += 4) {
            const t = lick.phrase[i];
            const d = lick.phrase[i+1];
            const degIdx = lick.phrase[i+2];
            events.push({
                type: (lick.role === 'drums' ? 'drum_kick' : lick.role) as any,
                note: lick.role === 'drums' ? degIdx : root + (DEGREE_TO_SEMITONE[DEGREE_KEYS[degIdx]] || 0),
                time: t / 3, duration: d / 3, weight: 0.8, technique: 'pick', dynamics: 'mf', phrasing: 'legato'
            });
        }

        setPlayingLickIdx(idx);
        playRawEvents(events);
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
                    origin: origin || 'Heritage Forge',
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
            <Card className="w-full max-w-5xl shadow-2xl border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-6 bg-primary/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Factory className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold tracking-tight">The Heritage Forge v17.0</CardTitle>
                            <CardDescription className="text-muted-foreground flex items-center gap-2">
                                <BrainCircuit className="h-3 w-3 text-primary" /> AI Musicological Insight & Hypercube Vectorization
                            </CardDescription>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary flex items-center gap-2 justify-end">
                            <Database className="h-5 w-5" />
                            {globalAxiomCount ?? '...'}
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Hypercube Axioms</span>
                    </div>
                </CardHeader>
                
                <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
                    {/* --- Column 1: Source & Metadata --- */}
                    <div className="space-y-6">
                        <div className="p-5 border rounded-2xl bg-muted/30 space-y-4 shadow-inner">
                            <Label className="text-xs font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
                                <FileMusic className="h-3 w-3" /> Material Discovery
                            </Label>
                            <div className="group border-2 border-dashed border-primary/20 rounded-2xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all relative overflow-hidden">
                                <input type="file" accept=".mid,.midi" onChange={onFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <Upload className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                                <p className="text-xs font-medium text-muted-foreground group-hover:text-primary">Sow MIDI Material</p>
                            </div>
                            
                            <Input placeholder="Composition ID (Affinity Key)" value={compositionId} onChange={(e) => setCompositionId(e.target.value)} className="h-10 text-sm bg-background/50" />
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Common Mood</Label>
                                    <Select value={commonMood} onValueChange={(v) => setCommonMood(v as CommonMood)}>
                                        <SelectTrigger className="h-9 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {COMMON_MOODS.map(m => <SelectItem key={m} value={m} className="text-xs capitalize">{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Specific Mood</Label>
                                    <Select value={selectedMood} onValueChange={(v) => setSelectedMood(v as Mood)}>
                                        <SelectTrigger className="h-9 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {MOOD_OPTIONS.map(m => <SelectItem key={m} value={m} className="text-xs capitalize">{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Column 2: Vector Calibration --- */}
                    <div className="space-y-6">
                        <div className="p-5 border rounded-2xl bg-primary/5 space-y-6 shadow-sm border-primary/10 relative">
                            <div className="flex flex-col gap-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Zap className="h-3 w-3" /> Vector Calibration
                                </Label>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 flex-1 text-[10px] gap-1 text-primary hover:bg-primary/5"
                                        onClick={handleAutoCalibrate}
                                        disabled={extractedLicks.length === 0 || isAIAnalyzing}
                                    >
                                        <Wand2 className="h-3 w-3" /> Heuristic
                                    </Button>
                                    <Button 
                                        variant="default" 
                                        size="sm" 
                                        className="h-7 flex-1 text-[10px] gap-1 bg-primary/80 hover:bg-primary"
                                        onClick={handleAIDeepInsight}
                                        disabled={extractedLicks.length === 0 || isAIAnalyzing}
                                    >
                                        {isAIAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <BrainCircuit className="h-3 w-3" />}
                                        AI Insight
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                                        <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> Tension</span>
                                        <span className="text-primary">{vector.t.toFixed(2)}</span>
                                    </div>
                                    <Slider value={[vector.t]} min={0} max={1} step={0.01} onValueChange={([v]) => setVector({...vector, t: v})} />
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                                        <span className="flex items-center gap-1"><Sun className="h-3 w-3" /> Brightness</span>
                                        <span className="text-primary">{vector.b.toFixed(2)}</span>
                                    </div>
                                    <Slider value={[vector.b]} min={0} max={1} step={0.01} onValueChange={([v]) => setVector({...vector, b: v})} />
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                                        <span className="flex items-center gap-1"><RefreshCcw className="h-3 w-3" /> Entropy</span>
                                        <span className="text-primary">{vector.e.toFixed(2)}</span>
                                    </div>
                                    <Slider value={[vector.e]} min={0} max={1} step={0.01} onValueChange={([v]) => setVector({...vector, e: v})} />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                                        <span className="flex items-center gap-1"><Target className="h-3 w-3" /> Harmonic Stability</span>
                                        <span className="text-primary">{vector.h.toFixed(2)}</span>
                                    </div>
                                    <Slider value={[vector.h]} min={0} max={1} step={0.01} onValueChange={([v]) => setVector({...vector, h: v})} />
                                </div>
                            </div>

                            {aiReasoning && (
                                <div className="mt-4 p-3 bg-background/50 rounded-xl border border-primary/10">
                                    <p className="text-[10px] italic leading-relaxed text-muted-foreground">
                                        <span className="font-bold text-primary not-italic">AI Verdict:</span> {aiReasoning}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- Column 3: Buffer & Transmit --- */}
                    <div className="space-y-6">
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center mb-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-primary/80">Extraction Buffer</Label>
                                <span className="text-[10px] font-bold text-primary px-2 bg-primary/10 rounded-full">{extractedLicks.length}</span>
                            </div>
                            <ScrollArea className="flex-grow border rounded-2xl bg-black/20 p-2 min-h-[300px]">
                                {extractedLicks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs italic gap-2 opacity-50 pt-20">
                                        Waiting for material...
                                    </div>
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
                                                    <span className="text-[10px] font-mono opacity-70">BAR_{lick.barOffset}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => playPreview(lick, idx)}>
                                                    {playingLickIdx === idx ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                            
                            <Button 
                                onClick={transmit} 
                                disabled={isTransmitting || selectedLickIds.size === 0 || isAIAnalyzing}
                                className="w-full mt-4 h-12 rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20"
                            >
                                <CloudUpload className="h-5 w-5" />
                                {isTransmitting ? 'Transmitting...' : `Forge ${selectedLickIds.size} Axioms`}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
