
'use client';

import { useState, useEffect } from 'react';
import { Midi } from '@tonejs/midi';
import { Upload, FileMusic, Download, Search, Settings2, Sparkles, Tags, Heart, CloudUpload, Music, Waves, Drum, LayoutGrid, Factory, Trash2, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { detectKeyFromNotes, SEMITONE_TO_DEGREE, DEGREE_KEYS, TECHNIQUE_KEYS } from '@/lib/music-theory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { saveHeritageAxiom } from '@/lib/firebase-service';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Mood, Genre } from '@/types/music';

type IngestionRole = 'melody' | 'bass' | 'drums' | 'accomp';

const MOOD_OPTIONS: Mood[] = ['epic', 'joyful', 'enthusiastic', 'melancholic', 'dark', 'anxious', 'dreamy', 'contemplative', 'calm'];
const GENRE_OPTIONS: Genre[] = ['ambient', 'trance', 'blues', 'progressive', 'rock', 'house', 'rnb', 'ballad', 'reggae', 'celtic'];

/**
 * #ЗАЧЕМ: Компактное форматирование ликов для экспорта (линейный JSON).
 */
const formatLicksToText = (licks: any[]) => {
    return "[\n" + licks.map(lick => {
        const { phrase, ...rest } = lick;
        return `  {
    "phrase": [${phrase.join(', ')}],
    "role": "${rest.role}",
    "origin": "${rest.origin}",
    "tags": ${JSON.stringify(rest.tags)}
  }`;
    }).join(",\n") + "\n]";
};

/**
 * #ЗАЧЕМ: Эвристический определитель роли дорожки.
 * #ЧТО: Анализирует питчи, полифонию и метаданные.
 */
const detectTrackRole = (track: any): IngestionRole => {
    const name = (track.name || "").toLowerCase();
    
    // 1. Ударные (Канал 10 или ключевые слова)
    if (track.channel === 9 || name.match(/drum|perc|kick|snare|hihat|kit|beat/)) return 'drums';
    
    if (track.notes.length === 0) return 'melody';

    // 2. Расчет среднего питча (Центр тяжести)
    const avgPitch = track.notes.reduce((sum: number, n: any) => sum + n.midi, 0) / track.notes.length;
    
    // 3. Проверка полифонии (аккорды)
    // Проверяем, сколько нот звучит одновременно в среднем
    let overlaps = 0;
    const sampleSize = Math.min(track.notes.length, 20);
    for (let i = 0; i < sampleSize - 1; i++) {
        if (track.notes[i+1].time < track.notes[i].time + track.notes[i].duration) overlaps++;
    }
    const isPolyphonic = overlaps > (sampleSize * 0.3);

    // Логика принятия решения
    if (name.includes("bass") || (avgPitch < 48 && !isPolyphonic)) return 'bass';
    if (name.match(/piano|key|chord|gtr|guitar|pad|str|string|organ/) || isPolyphonic) return 'accomp';
    
    return 'melody';
};

/**
 * #ЗАЧЕМ: Универсальный сегментатор треков.
 */
const segmentTrackToCompactLicks = (track: any, root: number, role: IngestionRole, origin: string, selectedMood: Mood, selectedGenre: Genre) => {
    const result = [];
    const barsPerLick = 4;
    const bpm = 72; 
    const secondsPerBar = (60 / bpm) * 4;
    const standardTags = [selectedMood, selectedGenre, 'heritage', role];

    for (let i = 0; i < track.duration / (secondsPerBar * barsPerLick); i++) {
        const start = i * secondsPerBar * barsPerLick;
        const end = (i + 1) * secondsPerBar * barsPerLick;
        
        const phraseNotes = track.notes.filter((n: any) => n.time >= start && n.time < end);
        if (phraseNotes.length < 2) continue;

        const compactPhrase: number[] = [];
        phraseNotes.forEach((n: any) => {
            const relativeTime = n.time - start;
            const tick = Math.round((relativeTime / (secondsPerBar / 12))); 
            const durationTicks = Math.max(1, Math.round(n.duration / (secondsPerBar / 12)));
            
            let degreeIdx = 0;
            if (role === 'drums') {
                degreeIdx = n.midi; 
            } else {
                const degreeStr = SEMITONE_TO_DEGREE[(n.midi - root + 120) % 12] || 'R';
                degreeIdx = DEGREE_KEYS.indexOf(degreeStr);
            }
            
            const techIdx = 0;
            compactPhrase.push(tick, durationTicks, degreeIdx, techIdx);
        });

        result.push({
            id: `LICK_${Date.now()}_${role.toUpperCase()}_${i}`,
            phrase: compactPhrase,
            role: role,
            tags: standardTags,
            origin: origin.trim() || 'Unknown Source'
        });
    }
    return result;
};

export default function MidiIngestPage() {
    const router = useRouter();
    const db = useFirestore();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [midiFile, setMidiFile] = useState<Midi | null>(null);
    const [extractedLicks, setExtractedLicks] = useState<any[]>([]);
    const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(-1);
    const [selectedRole, setSelectedRole] = useState<IngestionRole>('melody');
    const [selectedMood, setSelectedMood] = useState<Mood>('melancholic');
    const [selectedGenre, setSelectedGenre] = useState<Genre>('blues');
    const [detectedKey, setDetectedKey] = useState<{ root: number, mode: string } | null>(null);
    const [origin, setOrigin] = useState("");
    const [trackRoles, setTrackRoles] = useState<Map<number, IngestionRole>>(new Map());

    const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const midi = new Midi(event.target?.result as ArrayBuffer);
                setMidiFile(midi);
                
                // Авто-детекция ролей для всех треков
                const rolesMap = new Map<number, IngestionRole>();
                midi.tracks.forEach((track, i) => {
                    rolesMap.set(i, detectTrackRole(track));
                });
                setTrackRoles(rolesMap);

                // Выбираем самый интересный трек (обычно самый длинный тональный)
                const longestTrackIdx = midi.tracks.reduce((prev, curr, idx) => 
                    curr.notes.length > midi.tracks[prev].notes.length ? idx : prev, 0
                );
                
                setSelectedTrackIndex(longestTrackIdx);
                setSelectedRole(rolesMap.get(longestTrackIdx) || 'melody');

                const track = midi.tracks[longestTrackIdx];
                const key = detectKeyFromNotes(track.notes.map(n => n.midi));
                setDetectedKey(key);
            } catch (err) {
                toast({ variant: "destructive", title: "MIDI Analysis Failed" });
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleTrackSelect = (idx: number) => {
        setSelectedTrackIndex(idx);
        setSelectedRole(trackRoles.get(idx) || 'melody');
    };

    useEffect(() => {
        if (midiFile && selectedTrackIndex !== -1 && detectedKey) {
            const track = midiFile.tracks[selectedTrackIndex];
            const licks = segmentTrackToCompactLicks(track, detectedKey.root, selectedRole, origin, selectedMood, selectedGenre);
            setExtractedLicks(licks);
        }
    }, [midiFile, selectedTrackIndex, selectedRole, detectedKey, origin, selectedMood, selectedGenre]);

    const transmitToGlobalMemory = async () => {
        if (extractedLicks.length === 0) return;
        setIsTransmitting(true);
        try {
            for (const lick of extractedLicks) {
                await saveHeritageAxiom(db, {
                    phrase: lick.phrase,
                    role: lick.role,
                    dynasty: origin.toLowerCase().replace(/\s+/g, '-') || 'heritage',
                    origin: lick.origin,
                    tags: lick.tags
                });
            }
            toast({ title: "Genetic Ingestion Success", description: `Transmitted ${extractedLicks.length} axioms to the cloud.` });
        } catch (e) {
            toast({ variant: "destructive", title: "Transmission Failed" });
        } finally {
            setIsTransmitting(false);
        }
    };

    const clearPreview = () => {
        setMidiFile(null);
        setExtractedLicks([]);
        setSelectedTrackIndex(-1);
        setDetectedKey(null);
        setTrackRoles(new Map());
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-background">
            <Card className="w-full max-w-5xl shadow-xl border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Factory className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold tracking-tight">Heritage Alchemist v5.0</CardTitle>
                            <CardDescription className="text-muted-foreground flex items-center gap-2">
                                <BrainCircuit className="h-3 w-3" /> Heuristic Ensemble Ingestion Console
                            </CardDescription>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/aura-groove')} className="text-xs hover:bg-primary hover:text-primary-foreground transition-all">
                        Return to Studio
                    </Button>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Metadata & File */}
                        <div className="space-y-6 lg:col-span-1">
                            <div className="p-5 border rounded-2xl bg-muted/30 space-y-4 shadow-inner">
                                <Label className="text-xs font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
                                    <Tags className="h-3 w-3" /> Identity & Taxonomy
                                </Label>
                                <Input placeholder="Artist / Group / Dynasty" value={origin} onChange={(e) => setOrigin(e.target.value)} className="h-10 text-sm bg-background/50" />
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Target Genre</Label>
                                        <Select value={selectedGenre} onValueChange={(v) => setSelectedGenre(v as Genre)}>
                                            <SelectTrigger className="h-9 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {GENRE_OPTIONS.map(g => <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Target Mood</Label>
                                        <Select value={selectedMood} onValueChange={(v) => setSelectedMood(v as Mood)}>
                                            <SelectTrigger className="h-9 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {MOOD_OPTIONS.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t space-y-4">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-primary/80">File Discovery</Label>
                                    <div className="group border-2 border-dashed border-muted-foreground/30 rounded-2xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all relative overflow-hidden">
                                        <input type="file" accept=".mid,.midi" onChange={onFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                                        <p className="text-xs font-medium text-muted-foreground group-hover:text-primary">Click to scan MIDI DNA</p>
                                        <p className="text-[10px] text-muted-foreground/60 mt-1">Multi-track analysis v5.0</p>
                                    </div>
                                    {midiFile && (
                                        <Button variant="ghost" size="sm" onClick={clearPreview} className="w-full text-[10px] h-8 gap-2 text-destructive hover:bg-destructive/10">
                                            <Trash2 className="h-3 w-3" /> Clear Laboratory
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Track Map & Orchestrator */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex justify-between items-end mb-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
                                    <LayoutGrid className="h-3 w-3" /> Ensemble Map {midiFile ? `(${midiFile.name})` : ''}
                                </Label>
                                {detectedKey && (
                                    <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground font-bold">KEY:</span>
                                        <span className="text-xs font-bold text-primary">{detectedKey.root} {detectedKey.mode.toUpperCase()}</span>
                                    </div>
                                )}
                            </div>
                            
                            <ScrollArea className="h-[280px] rounded-2xl border bg-black/30 p-3 shadow-inner">
                                {!midiFile ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs italic gap-2 opacity-50">
                                        <FileMusic className="h-10 w-10 mb-2" />
                                        Waiting for source material...
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {midiFile.tracks.map((track, i) => {
                                            const role = trackRoles.get(i);
                                            return (
                                                <div 
                                                    key={i} 
                                                    onClick={() => handleTrackSelect(i)}
                                                    className={cn(
                                                        "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border",
                                                        selectedTrackIndex === i 
                                                            ? "bg-primary/20 border-primary shadow-lg scale-[1.01]" 
                                                            : "bg-background/40 border-transparent hover:bg-muted/50 hover:border-muted"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center font-mono text-xs opacity-50">
                                                            {i.toString().padStart(2, '0')}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold truncate max-w-[200px]">
                                                                {track.name || `Track ${i + 1}`}
                                                            </span>
                                                            <span className="text-[10px] text-primary/70 font-bold uppercase tracking-tighter flex items-center gap-1">
                                                                <BrainCircuit className="h-2 w-2" /> Suggested: {role}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-xs font-mono opacity-70">{track.notes.length} events</span>
                                                            <span className="text-[10px] opacity-50">{(track.duration / 4).toFixed(1)} bars</span>
                                                        </div>
                                                        <div className={cn(
                                                            "p-2 rounded-full",
                                                            selectedTrackIndex === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {role === 'melody' && <Music className="h-4 w-4"/>}
                                                            {role === 'bass' && <Waves className="h-4 w-4"/>}
                                                            {role === 'drums' && <Drum className="h-4 w-4"/>}
                                                            {role === 'accomp' && <LayoutGrid className="h-4 w-4"/>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>

                            {selectedTrackIndex !== -1 && (
                                <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Override Detected Role</Label>
                                        <div className="flex gap-2">
                                            {(['melody', 'bass', 'drums', 'accomp'] as IngestionRole[]).map(role => (
                                                <Button 
                                                    key={role}
                                                    size="sm"
                                                    variant={selectedRole === role ? "default" : "outline"}
                                                    onClick={() => setSelectedRole(role)}
                                                    className="h-8 px-4 text-[10px] capitalize gap-2 rounded-full transition-all"
                                                >
                                                    {role === 'melody' && <Music className="h-3 w-3"/>}
                                                    {role === 'bass' && <Waves className="h-3 w-3"/>}
                                                    {role === 'drums' && <Drum className="h-3 w-3"/>}
                                                    {role === 'accomp' && <LayoutGrid className="h-3 w-3"/>}
                                                    {role}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col justify-center">
                                        <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Analysis Active</p>
                                        <p className="text-xs font-medium text-primary/80">Segmenting into 4-bar axioms...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {extractedLicks.length > 0 && (
                        <div className="space-y-4 border-t pt-8 animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-primary">
                                    <Settings2 className="h-4 w-4" /> Genetic Buffer ({extractedLicks.length} Axioms Ready)
                                </Label>
                                <Button 
                                    onClick={transmitToGlobalMemory} 
                                    disabled={isTransmitting}
                                    className="gap-2 text-xs h-10 px-6 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/30 rounded-full transition-all active:scale-95"
                                >
                                    <CloudUpload className="h-4 w-4" /> 
                                    {isTransmitting ? 'Transmitting DNA...' : 'Endorse & Transmit'}
                                </Button>
                            </div>
                            <div className="rounded-2xl border p-1 bg-black/40 shadow-inner">
                                <ScrollArea className="h-[200px] w-full">
                                    <div className="p-4 font-mono text-[11px] leading-relaxed">
                                        <pre className="text-primary/90 whitespace-pre scrollbar-hide">
                                            {formatLicksToText(extractedLicks)}
                                        </pre>
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <div className="h-16 w-16 border-4 border-primary/20 rounded-full"></div>
                                <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-lg text-primary font-bold animate-pulse tracking-tight">Heuristic DNA Scan in Progress...</p>
                                <p className="text-xs text-muted-foreground mt-2">Mapping orchestral roles and harmonic structures</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
