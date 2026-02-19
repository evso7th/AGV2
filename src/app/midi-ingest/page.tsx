/**
 * #ЗАЧЕМ: Heritage Alchemist V13.0 — "Curator's Control".
 * #ЧТО: 1. Добавлена возможность вручную менять роль трека (Melody/Bass/etc).
 *       2. Реализован выборочный импорт аксиом через чекбоксы.
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Midi } from '@tonejs/midi';
import { 
    Upload, FileMusic, Settings2, Sparkles, Tags, 
    CloudUpload, Music, Waves, Drum, LayoutGrid, Factory, Trash2, BrainCircuit, 
    Play, PlayCircle, StopCircle, CheckCircle2,
    Database, RefreshCcw, ShieldCheck, XCircle, CheckSquare, Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { detectKeyFromNotes, SEMITONE_TO_DEGREE, DEGREE_KEYS, TECHNIQUE_KEYS, DEGREE_TO_SEMITONE } from '@/lib/music-theory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';
import { saveHeritageAxiom } from '@/lib/firebase-service';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Mood, Genre, FractalEvent } from '@/types/music';
import { useAudioEngine } from '@/contexts/audio-engine-context';

type IngestionRole = 'melody' | 'bass' | 'drums' | 'accomp';

const MOOD_OPTIONS: Mood[] = ['epic', 'joyful', 'enthusiastic', 'melancholic', 'dark', 'anxious', 'dreamy', 'contemplative', 'calm'];
const GENRE_OPTIONS: Genre[] = ['ambient', 'trance', 'blues', 'progressive', 'rock', 'house', 'rnb', 'ballad', 'reggae', 'celtic'];

const calculatePhraseHash = (phrase: number[]): string => {
    return phrase.join('|');
};

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
            compactPhrase.push(tick, durationTicks, degreeIdx, 0);
        });

        const hash = calculatePhraseHash(compactPhrase);

        result.push({
            id: `LICK_${Date.now()}_${role.toUpperCase()}_${i}`,
            phrase: compactPhrase,
            hash: hash,
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
    const { initialize, isInitialized, playRawEvents, setInstrument, setIsPlaying, isPlaying } = useAudioEngine();
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [midiFile, setMidiFile] = useState<Midi | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [extractedLicks, setExtractedLicks] = useState<any[]>([]);
    const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(-1);
    const [selectedRole, setSelectedRole] = useState<IngestionRole>('melody');
    const [selectedMood, setSelectedMood] = useState<Mood>('melancholic');
    const [selectedGenre, setSelectedGenre] = useState<Genre>('blues');
    const [detectedKey, setDetectedKey] = useState<{ root: number, mode: string } | null>(null);
    const [origin, setOrigin] = useState("");
    const [trackRoles, setTrackRoles] = useState<Map<number, IngestionRole>>(new Map());
    
    const [isPlayingFull, setIsPlayingFull] = useState(false);
    const [playingTrackIdx, setPlayingTrackIdx] = useState<number | null>(null);
    const [playingLickIdx, setPlayingLickIdx] = useState<number | null>(null);
    
    const [ingestedHashes, setIngestedHashes] = useState<Set<string>>(new Set());
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
        const saved = localStorage.getItem('AuraGroove_Ingested_Hashes');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setIngestedHashes(new Set(parsed));
            } catch(e) {}
        }
    }, [db]);

    const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsAnalyzing(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const midi = new Midi(event.target?.result as ArrayBuffer);
                setMidiFile(midi);
                const rolesMap = new Map<number, IngestionRole>();
                midi.tracks.forEach((track, i) => rolesMap.set(i, detectTrackRole(track)));
                setTrackRoles(rolesMap);
                const longestTrackIdx = midi.tracks.reduce((prev, curr, idx) => 
                    curr.notes.length > midi.tracks[prev].notes.length ? idx : prev, 0);
                setSelectedTrackIndex(longestTrackIdx);
                setSelectedRole(rolesMap.get(longestTrackIdx) || 'melody');
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

    const handleTrackSelect = (idx: number) => {
        setSelectedTrackIndex(idx);
        setSelectedRole(trackRoles.get(idx) || 'melody');
    };

    /** #ЗАЧЕМ: Ручное переопределение роли трека. */
    const handleRoleOverride = (idx: number, newRole: IngestionRole) => {
        const newRoles = new Map(trackRoles);
        newRoles.set(idx, newRole);
        setTrackRoles(newRoles);
        if (selectedTrackIndex === idx) {
            setSelectedRole(newRole);
        }
    };

    useEffect(() => {
        if (midiFile && selectedTrackIndex !== -1 && detectedKey) {
            const track = midiFile.tracks[selectedTrackIndex];
            const licks = segmentTrackToCompactLicks(track, detectedKey.root, selectedRole, origin, selectedMood, selectedGenre);
            setExtractedLicks(licks);
            
            // #ЗАЧЕМ: По умолчанию выбираем все свежие лики.
            const freshIds = new Set<string>();
            licks.forEach(l => {
                if (!ingestedHashes.has(l.hash)) freshIds.add(l.id);
            });
            setSelectedLickIds(freshIds);
        }
    }, [midiFile, selectedTrackIndex, selectedRole, detectedKey, origin, selectedMood, selectedGenre, ingestedHashes]);

    const stats = useMemo(() => {
        const total = extractedLicks.length;
        const known = extractedLicks.filter(l => ingestedHashes.has(l.hash)).length;
        const selected = extractedLicks.filter(l => selectedLickIds.has(l.id)).length;
        return { total, known, fresh: total - known, selected };
    }, [extractedLicks, ingestedHashes, selectedLickIds]);

    const silenceLaboratory = () => {
        setIsPlaying(false);
        setIsPlayingFull(false);
        setPlayingTrackIdx(null);
        setPlayingLickIdx(null);
    };

    const playFullMidi = async () => {
        if (!midiFile) return;
        if (isPlayingFull) { silenceLaboratory(); return; }
        if (!isInitialized) await initialize();

        silenceLaboratory();
        const tempo = 72; 
        const beatDuration = 60 / tempo;
        const allEvents: FractalEvent[] = [];
        let minStartTime = Infinity;
        midiFile.tracks.forEach(t => t.notes.forEach(n => { if (n.time < minStartTime) minStartTime = n.time; }));
        if (minStartTime === Infinity) minStartTime = 0;

        midiFile.tracks.forEach((track, trackIdx) => {
            const role = trackRoles.get(trackIdx) || 'melody';
            const mappedRole = role === 'accomp' ? 'accompaniment' : role;
            track.notes.forEach(note => {
                allEvents.push({
                    type: mappedRole as any,
                    note: note.midi,
                    time: (note.time - minStartTime) / beatDuration,
                    duration: note.duration / beatDuration,
                    weight: note.velocity,
                    technique: (role === 'bass' ? 'pluck' : (role === 'drums' ? 'hit' : 'pick')) as any,
                    dynamics: 'mf',
                    phrasing: 'legato'
                });
            });
        });

        if (allEvents.length > 0) {
            await Promise.all([
                setInstrument('bass', 'bass_jazz_warm'),
                setInstrument('melody', 'blackAcoustic'),
                setInstrument('accompaniment', 'organ_soft_jazz')
            ]);

            setIsPlayingFull(true);
            playRawEvents(allEvents, { 
                bass: 'bass_jazz_warm', 
                melody: 'blackAcoustic', 
                accompaniment: 'organ_soft_jazz' 
            });
        }
    };

    const playSingleTrack = async (trackIdx: number) => {
        if (!midiFile) return;
        if (playingTrackIdx === trackIdx) { silenceLaboratory(); return; }
        if (!isInitialized) await initialize();

        silenceLaboratory();
        const tempo = 72;
        const beatDuration = 60 / tempo;
        const track = midiFile.tracks[trackIdx];
        const role = trackRoles.get(trackIdx) || 'melody';
        const mappedRole = role === 'accomp' ? 'accompaniment' : role;
        
        let minTime = Infinity;
        track.notes.forEach(n => { if (n.time < minTime) minTime = n.time; });
        if (minTime === Infinity) minTime = 0;

        const events: FractalEvent[] = track.notes.map(note => ({
            type: mappedRole as any,
            note: note.midi,
            time: (note.time - minTime) / beatDuration,
            duration: note.duration / beatDuration,
            weight: note.velocity,
            technique: (role === 'bass' ? 'pluck' : (role === 'drums' ? 'hit' : 'pick')) as any,
            dynamics: 'mf',
            phrasing: 'legato'
        }));

        if (events.length > 0) {
            const targetInstrument = role === 'bass' ? 'bass_jazz_warm' : (role === 'melody' ? 'blackAcoustic' : 'organ_soft_jazz');
            await setInstrument(role === 'accomp' ? 'accompaniment' : (role as any), targetInstrument);

            setPlayingTrackIdx(trackIdx);
            playRawEvents(events, { [mappedRole]: targetInstrument });
        }
    };

    const auralizeLick = async (lick: any, idx: number) => {
        if (playingLickIdx === idx) { silenceLaboratory(); return; }
        if (!isInitialized) await initialize();

        silenceLaboratory();
        const roleMap: Record<string, string> = { 'melody': 'melody', 'bass': 'bass', 'accomp': 'accompaniment', 'drums': 'drums' };
        const role = roleMap[lick.role] || 'melody';
        const events: FractalEvent[] = [];
        const root = detectedKey?.root || 60;

        for (let i = 0; i < lick.phrase.length; i += 4) {
            const t = lick.phrase[i];
            const d = lick.phrase[i+1];
            const degIdx = lick.phrase[i+2];
            events.push({
                type: role as any,
                note: lick.role === 'drums' ? degIdx : root + (DEGREE_TO_SEMITONE[DEGREE_KEYS[degIdx]] || 0),
                time: t / 3, duration: d / 3, weight: 0.8, technique: 'pick', dynamics: 'mf', phrasing: 'legato'
            });
        }

        const targetInstrument = lick.role === 'bass' ? 'bass_jazz_warm' : (lick.role === 'melody' ? 'blackAcoustic' : 'organ_soft_jazz');
        if (lick.role !== 'drums') {
            await setInstrument(lick.role === 'accomp' ? 'accompaniment' : (lick.role as any), targetInstrument);
        }

        setPlayingLickIdx(idx);
        playRawEvents(events, { [role]: targetInstrument });
    };

    /** #ЗАЧЕМ: Переключение выбора лика. */
    const toggleLickSelection = (id: string) => {
        const next = new Set(selectedLickIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedLickIds(next);
    };

    const selectAllFresh = () => {
        const next = new Set<string>();
        extractedLicks.forEach(l => {
            if (!ingestedHashes.has(l.hash)) next.add(l.id);
        });
        setSelectedLickIds(next);
    };

    const deselectAll = () => setSelectedLickIds(new Set());

    const transmitToGlobalMemory = async () => {
        const licksToIngest = extractedLicks.filter(l => selectedLickIds.has(l.id) && !ingestedHashes.has(l.hash));
        
        if (licksToIngest.length === 0) {
            toast({ title: "Genetic Selection Empty", description: "No fresh axioms selected for transmission." });
            return;
        }

        setIsTransmitting(true);
        const newHashes = new Set(ingestedHashes);
        try {
            for (const lick of licksToIngest) {
                await saveHeritageAxiom(db, {
                    phrase: lick.phrase,
                    role: lick.role,
                    dynasty: origin.toLowerCase().replace(/\s+/g, '-') || 'heritage',
                    origin: lick.origin,
                    tags: lick.tags
                });
                newHashes.add(lick.hash);
            }
            
            const hashList = Array.from(newHashes);
            localStorage.setItem('AuraGroove_Ingested_Hashes', JSON.stringify(hashList));
            setIngestedHashes(newHashes);
            setSelectedLickIds(new Set()); // Clear selection after successful ingest
            
            toast({ title: "Genetic Ingestion Success", description: `Transmitted ${licksToIngest.length} selected axioms to the cloud.` });
            fetchGlobalCount(); 
        } catch (e) {
            toast({ variant: "destructive", title: "Transmission Failed" });
        } finally {
            setIsTransmitting(false);
        }
    };

    const clearPreview = () => {
        silenceLaboratory();
        setMidiFile(null);
        setFileName("");
        setExtractedLicks([]);
        setSelectedTrackIndex(-1);
        setDetectedKey(null);
        setTrackRoles(new Map());
        setSelectedLickIds(new Set());
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-background text-foreground">
            <Card className="w-full max-w-5xl shadow-2xl border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Factory className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold tracking-tight">Heritage Alchemist v13.0</CardTitle>
                            <CardDescription className="text-muted-foreground flex items-center gap-2">
                                <ShieldCheck className="h-3 w-3 text-green-500" /> Curator Controls Active | Selective Ingestion
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {(isPlayingFull || playingTrackIdx !== null || playingLickIdx !== null) && (
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={silenceLaboratory}
                                className="h-10 px-4 rounded-xl gap-2 font-bold animate-pulse"
                            >
                                <XCircle className="h-4 w-4" /> Stop All Sounds
                            </Button>
                        )}
                        <div className="hidden md:flex flex-col items-end px-4 border-r border-primary/10">
                            <div className="flex items-center gap-2 text-primary font-bold text-lg">
                                <Database className="h-4 w-4" />
                                {globalAxiomCount !== null ? globalAxiomCount.toLocaleString() : '---'}
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Global Genetic Reserve</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={fetchGlobalCount} disabled={isFetchingCount} className={cn("h-10 w-10 rounded-xl", isFetchingCount && "animate-spin")}>
                            <RefreshCcw className="h-5 w-5 text-primary/60" />
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/aura-groove')} className="text-xs hover:bg-primary hover:text-primary-foreground transition-all rounded-xl h-10 px-6">
                            Return to Studio
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-6 lg:col-span-1">
                            <div className="p-5 border rounded-2xl bg-muted/30 space-y-4 shadow-inner">
                                <Label className="text-xs font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
                                    <Tags className="h-3 w-3" /> Identity & Taxonomy
                                </Label>
                                <Input placeholder="Artist / Group / Dynasty" value={origin} onChange={(e) => setOrigin(e.target.value)} className="h-10 text-sm bg-background/50 border-primary/20" />
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Genre</Label>
                                        <Select value={selectedGenre} onValueChange={(v) => setSelectedGenre(v as Genre)}>
                                            <SelectTrigger className="h-9 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {GENRE_OPTIONS.map(g => <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Mood</Label>
                                        <Select value={selectedMood} onValueChange={(v) => setSelectedMood(v as Mood)}>
                                            <SelectTrigger className="h-9 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {MOOD_OPTIONS.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-primary/10 space-y-4">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-primary/80">File Discovery</Label>
                                    <div className="group border-2 border-dashed border-primary/20 rounded-2xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all relative overflow-hidden">
                                        <input type="file" accept=".mid,.midi" onChange={onFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                                        <p className="text-xs font-medium text-muted-foreground group-hover:text-primary">Click to scan MIDI DNA</p>
                                    </div>
                                    {midiFile && (
                                        <Button variant="ghost" size="sm" onClick={clearPreview} className="w-full text-[10px] h-8 gap-2 text-destructive hover:bg-destructive/10">
                                            <Trash2 className="h-3 w-3" /> Clear Laboratory
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex justify-between items-center mb-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
                                    <LayoutGrid className="h-3 w-3" /> Ensemble Map {fileName ? `(${fileName})` : ''}
                                </Label>
                                <div className="flex gap-2 items-center">
                                    {midiFile && (
                                        <div className="flex items-center gap-3 mr-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-bold text-green-500">{stats.fresh} FRESH</span>
                                                <span className="text-[10px] font-bold text-muted-foreground">{stats.known} KNOWN</span>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="secondary" 
                                                onClick={playFullMidi}
                                                className={cn(
                                                    "h-8 text-[10px] uppercase font-bold tracking-widest gap-2 bg-primary/20 text-primary border border-primary/30 transition-all",
                                                    isPlayingFull ? "bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30" : "hover:bg-primary/30"
                                                )}
                                            >
                                                {isPlayingFull ? <StopCircle className="h-4 w-4 fill-current" /> : <PlayCircle className="h-4 w-4" />}
                                                {isPlayingFull ? "Stop Preview" : "Play Full MIDI"}
                                            </Button>
                                        </div>
                                    )}
                                    {detectedKey && (
                                        <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-2 shadow-sm">
                                            <span className="text-[10px] text-muted-foreground font-bold">KEY:</span>
                                            <span className="text-xs font-bold text-primary">{detectedKey.root} {detectedKey.mode.toUpperCase()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <ScrollArea className="h-[320px] rounded-2xl border border-primary/10 bg-black/20 p-3 shadow-inner">
                                {!midiFile ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs italic gap-2 opacity-50">
                                        <FileMusic className="h-10 w-10 mb-2" />
                                        Waiting for source material...
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {midiFile.tracks.map((track, i) => {
                                            const role = trackRoles.get(i) || 'melody';
                                            const isCurrentPlaying = playingTrackIdx === i;
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
                                                            <span className="text-sm font-semibold truncate max-w-[150px]">
                                                                {track.name || `Track ${i + 1}`}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-primary/70 font-bold uppercase tracking-tighter flex items-center gap-1">
                                                                    <BrainCircuit className="h-2 w-2" /> Suggested:
                                                                </span>
                                                                {/* #ЗАЧЕМ: Ручное изменение роли трека. */}
                                                                <Select 
                                                                    value={role} 
                                                                    onValueChange={(val) => handleRoleOverride(i, val as IngestionRole)}
                                                                >
                                                                    <SelectTrigger className="h-5 px-1 py-0 text-[10px] w-24 bg-primary/10 border-primary/20">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="melody" className="text-[10px]">Melody</SelectItem>
                                                                        <SelectItem value="bass" className="text-[10px]">Bass</SelectItem>
                                                                        <SelectItem value="accomp" className="text-[10px]">Accompaniment</SelectItem>
                                                                        <SelectItem value="drums" className="text-[10px]">Drums</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className={cn("h-8 w-8 rounded-full", isCurrentPlaying ? "text-destructive hover:bg-destructive/10" : "text-primary hover:bg-primary/10")}
                                                            onClick={(e) => { e.stopPropagation(); playSingleTrack(i); }}
                                                        >
                                                            {isCurrentPlaying ? <StopCircle className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5" />}
                                                        </Button>
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
                        </div>
                    </div>

                    {extractedLicks.length > 0 && (
                        <div className="space-y-4 border-t border-primary/10 pt-8 animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col gap-1">
                                    <Label className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-primary">
                                        <Settings2 className="h-4 w-4" /> Genetic Buffer ({extractedLicks.length} Axioms)
                                    </Label>
                                    <div className="flex items-center gap-4 ml-6">
                                        <span className="text-[10px] text-muted-foreground">
                                            {stats.selected} / {stats.total} selected for ingestion.
                                        </span>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={selectAllFresh} className="h-6 text-[9px] px-2 gap-1 rounded-lg hover:bg-primary/10 text-primary">
                                                <CheckSquare className="h-3 w-3" /> Select All Fresh
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={deselectAll} className="h-6 text-[9px] px-2 gap-1 rounded-lg hover:bg-destructive/10 text-destructive">
                                                <Square className="h-3 w-3" /> Deselect All
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button 
                                        onClick={transmitToGlobalMemory} 
                                        disabled={isTransmitting || stats.selected === 0}
                                        className={cn(
                                            "gap-2 text-xs h-10 px-6 rounded-full transition-all active:scale-95 shadow-lg",
                                            stats.selected === 0 ? "bg-muted" : "bg-green-600 hover:bg-green-700 shadow-green-900/30"
                                        )}
                                    >
                                        <CloudUpload className="h-4 w-4" /> 
                                        {isTransmitting ? 'Transmitting...' : `Ingest ${stats.selected} Selected Axioms`}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {extractedLicks.map((lick, idx) => {
                                    const isIngested = ingestedHashes.has(lick.hash);
                                    const isSelected = selectedLickIds.has(lick.id);
                                    const isCurrentPlayingLick = playingLickIdx === idx;
                                    return (
                                        <div 
                                            key={idx} 
                                            onClick={() => !isIngested && toggleLickSelection(lick.id)}
                                            className={cn(
                                                "p-3 border rounded-xl flex items-center justify-between text-[10px] font-mono transition-all cursor-pointer",
                                                isIngested 
                                                    ? "bg-muted/50 border-muted opacity-60 cursor-default" 
                                                    : (isSelected 
                                                        ? "bg-primary/10 border-primary shadow-sm" 
                                                        : "bg-primary/5 border-primary/20 hover:border-primary/40")
                                            )}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox 
                                                        checked={isSelected} 
                                                        onCheckedChange={() => toggleLickSelection(lick.id)}
                                                        disabled={isIngested}
                                                        className={cn(isIngested && "opacity-0")}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    {isIngested ? <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" /> : <Sparkles className="h-3 w-3 text-primary shrink-0" />}
                                                    <span className="truncate opacity-70">FRAG_{idx.toString().padStart(2, '0')}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {isIngested && <span className="text-[8px] uppercase font-bold text-muted-foreground px-1 bg-muted rounded">KNOWN</span>}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className={cn("h-7 w-7 rounded-full", isCurrentPlayingLick ? "text-destructive hover:bg-destructive/10" : "text-primary hover:bg-primary/10")} 
                                                    onClick={(e) => { e.stopPropagation(); auralizeLick(lick, idx); }}
                                                >
                                                    {isCurrentPlayingLick ? <StopCircle className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
