
'use client';

import { useState, useEffect, useRef } from 'react';
import { Midi } from '@tonejs/midi';
import { 
    Upload, FileMusic, CloudUpload, Play, StopCircle, Database, 
    RefreshCcw, Compass, Zap, Factory, Trash2, Save, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore } from '@/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';
import { saveHeritageAxiom } from '@/lib/firebase-service';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { exportMidiData, importAxiomData } from './actions';
import { buildMultiInstrument } from '@/lib/instrument-factory';
import { V2_PRESETS } from '@/lib/presets-v2';
import { BASS_PRESET_INFO } from '@/lib/bass-presets';
import { SEMITONE_TO_DEGREE, DEGREE_KEYS } from '@/lib/music-theory';

type IngestionRole = 'melody' | 'bass' | 'drums' | 'accompaniment';

export default function MidiIngestPage() {
    const db = useFirestore();
    const [isClient, setIsClient] = useState(false);
    const [midiFile, setMidiFile] = useState<Midi | null>(null);
    const [fileName, setFileName] = useState("");
    const [tracks, setTracks] = useState<any[]>([]);
    const [importedAxioms, setImportedAxioms] = useState<any[]>([]);
    const [selectedAxiomIds, setSelectedAxiomIds] = useState<Set<string>>(new Set());
    
    const [globalCount, setGlobalCount] = useState<number | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [isSourcePlaying, setIsSourcePlaying] = useState(false);

    // Audio State
    const audioContextRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const instrumentsRef = useRef<Map<string, any>>(new Map());

    // Metadata
    const [genre, setGenre] = useState<any>('blues');
    const [mood, setMood] = useState<any>('melancholic');
    const [commonMood, setCommonMood] = useState<any>('dark');

    useEffect(() => {
        setIsClient(true);
        fetchGlobalCount();
    }, []);

    const fetchGlobalCount = async () => {
        try {
            const coll = collection(db, 'heritage_axioms');
            const snapshot = await getCountFromServer(coll);
            setGlobalCount(snapshot.data().count);
        } catch (e) {
            console.error("[Forge] Census failed:", e);
        }
    };

    const getAudioContext = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            masterGainRef.current = audioContextRef.current.createGain();
            masterGainRef.current.gain.value = 0.8;
            masterGainRef.current.connect(audioContextRef.current.destination);
        }
        return audioContextRef.current;
    };

    const handleFileUpload = async (file: File) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const midi = new Midi(e.target?.result as ArrayBuffer);
            setMidiFile(midi);
            const trackData = midi.tracks.map((t, i) => ({
                id: i,
                name: t.name || `Track ${i+1}`,
                notes: t.notes,
                selected: true,
                role: detectRole(t),
                preset: getDefaultPreset(detectRole(t))
            }));
            setTracks(trackData);
        };
        reader.readAsArrayBuffer(file);
    };

    const detectRole = (track: any): IngestionRole => {
        const name = (track.name || "").toLowerCase();
        if (name.includes("bass")) return 'bass';
        if (track.channel === 9 || name.match(/drum|perc/)) return 'drums';
        if (name.match(/piano|key|chord|pad|organ/)) return 'accompaniment';
        return 'melody';
    };

    const getDefaultPreset = (role: IngestionRole) => {
        if (role === 'bass') return 'bass_jazz_warm';
        if (role === 'melody') return 'cs80';
        if (role === 'accompaniment') return 'organ_soft_jazz';
        return 'drums';
    };

    const toggleTrackPlayback = async (trackIdx: number) => {
        const ctx = getAudioContext();
        await ctx.resume();
        // Simple preview logic would go here
        toast({ title: "Preview", description: "Track preview logic coming soon." });
    };

    const toggleSourcePlayback = async () => {
        const ctx = getAudioContext();
        await ctx.resume();
        setIsSourcePlaying(!isSourcePlaying);
        if (!isSourcePlaying) {
            toast({ title: "Playing Ensemble", description: "Starting source playback..." });
        }
    };

    const handleExport = async () => {
        if (!midiFile) return;
        setIsExporting(true);
        
        const exportData = {
            fileName,
            genre,
            mood,
            commonMood,
            tracks: tracks.filter(t => t.selected).map(t => ({
                name: t.name,
                role: t.role,
                notes: t.notes.map((n: any) => ({
                    midi: n.midi,
                    time: n.time,
                    duration: n.duration,
                    velocity: n.velocity
                }))
            }))
        };

        const result = await exportMidiData(exportData);
        if (result.success) {
            toast({ title: "Exported", description: "Data written to midi-export.json" });
        }
        setIsExporting(false);
    };

    const handleImport = async () => {
        setIsImporting(true);
        const axioms = await importAxiomData();
        setImportedAxioms(axioms);
        setSelectedAxiomIds(new Set(axioms.map((a: any) => a.id)));
        setIsImporting(false);
        toast({ title: "Imported", description: `Loaded ${axioms.length} axioms from axiom-import.json` });
    };

    const handlePopulate = async () => {
        setIsTransmitting(true);
        try {
            const toSave = importedAxioms.filter(a => selectedAxiomIds.has(a.id));
            for (const axiom of toSave) {
                await saveHeritageAxiom(db, axiom);
            }
            toast({ title: "Success", description: `${toSave.length} axioms uploaded to Hypercube.` });
            fetchGlobalCount();
        } catch (e) {
            toast({ variant: "destructive", title: "Upload Failed" });
        } finally {
            setIsTransmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-background">
            <header className="w-full max-w-7xl flex items-center justify-between mb-6 border-b pb-4">
                <div className="flex items-center gap-3">
                    <Factory className="h-6 w-6 text-primary" />
                    <h1 className="text-lg font-bold tracking-tight">Heritage Forge v2.0</h1>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-muted-foreground uppercase">Hypercube Axioms:</span>
                    <span className="text-primary font-bold">{globalCount ?? '...'}</span>
                </div>
            </header>

            <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* --- COLUMN 1: SOURCE DISCOVERY --- */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Source Discovery</h2>
                    <div className="space-y-4">
                        <div 
                            className="border-2 border-dashed border-primary/20 rounded-xl p-8 text-center hover:bg-primary/5 transition-colors cursor-pointer group"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files[0]); }}
                        >
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
                            <p className="text-[10px] text-muted-foreground group-hover:text-primary uppercase font-bold">Drag & Drop MIDI</p>
                        </div>

                        <div className="p-4 border rounded-xl bg-card space-y-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Track Name</Label>
                                <Input value={fileName} readOnly className="h-8 text-xs font-mono" placeholder="No file loaded" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Genre</Label>
                                    <Select value={genre} onValueChange={setGenre}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="blues">Blues</SelectItem>
                                            <SelectItem value="ambient">Ambient</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Mood</Label>
                                    <Select value={mood} onValueChange={setMood}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="melancholic">Melancholic</SelectItem>
                                            <SelectItem value="dark">Dark</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <Button 
                            variant="secondary" 
                            className="w-full h-10 gap-2" 
                            onClick={toggleSourcePlayback}
                            disabled={!midiFile}
                        >
                            {isSourcePlaying ? <StopCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {isSourcePlaying ? "Stop Source" : "Play Source File"}
                        </Button>
                        <p className="text-[9px] text-center text-muted-foreground italic">Required Length: 4-12 Bars</p>
                    </div>
                </div>

                {/* --- COLUMN 2: EXPORT BRIDGE --- */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Export Bridge</h2>
                    <Button 
                        onClick={handleExport} 
                        disabled={!midiFile || isExporting} 
                        className="w-full h-10 gap-2 font-bold"
                    >
                        <Download className="h-4 w-4" />
                        {isExporting ? "Exporting..." : "Export to File"}
                    </Button>
                    <ScrollArea className="flex-grow border rounded-xl bg-black/20 p-2 min-h-[400px]">
                        <div className="space-y-2">
                            {tracks.map((track, idx) => (
                                <div key={idx} className="p-2 border rounded-lg bg-card/50 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Checkbox checked={track.selected} onCheckedChange={(c) => {
                                                const next = [...tracks];
                                                next[idx].selected = !!c;
                                                setTracks(next);
                                            }} />
                                            <span className="text-[10px] font-bold truncate max-w-[100px]">{track.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleTrackPlayback(idx)}>
                                            <Play className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                        <Select value={track.role} onValueChange={(v) => {
                                            const next = [...tracks];
                                            next[idx].role = v;
                                            setTracks(next);
                                        }}>
                                            <SelectTrigger className="h-6 text-[9px] uppercase font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="melody">Melody</SelectItem>
                                                <SelectItem value="bass">Bass</SelectItem>
                                                <SelectItem value="accompaniment">Accomp</SelectItem>
                                                <SelectItem value="drums">Drums</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={track.preset} onValueChange={(v) => {
                                            const next = [...tracks];
                                            next[idx].preset = v;
                                            setTracks(next);
                                        }}>
                                            <SelectTrigger className="h-6 text-[9px] uppercase font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cs80">CS80</SelectItem>
                                                <SelectItem value="bass_jazz_warm">Jazz Bass</SelectItem>
                                                <SelectItem value="organ_soft_jazz">Soft Organ</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* --- COLUMN 3: ASCENSION GATE --- */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Ascension Gate</h2>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="h-10 text-[10px] uppercase font-bold" onClick={handleImport} disabled={isImporting}>
                            <RefreshCcw className={cn("h-3 w-3 mr-1", isImporting && "animate-spin")} />
                            Import File
                        </Button>
                        <Button className="h-10 text-[10px] uppercase font-bold" onClick={handlePopulate} disabled={selectedAxiomIds.size === 0 || isTransmitting}>
                            <CloudUpload className="h-3 w-3 mr-1" />
                            Populate DB
                        </Button>
                    </div>
                    <ScrollArea className="flex-grow border rounded-xl bg-black/20 p-2 min-h-[400px]">
                        <div className="space-y-2">
                            {importedAxioms.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground italic opacity-50 pt-20">
                                    No data in axiom-import.json
                                </div>
                            ) : (
                                importedAxioms.map((axiom, idx) => (
                                    <div key={idx} className="p-3 border rounded-lg bg-card flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <Checkbox 
                                                checked={selectedAxiomIds.has(axiom.id)} 
                                                onCheckedChange={() => {
                                                    const next = new Set(selectedAxiomIds);
                                                    if (next.has(axiom.id)) next.delete(axiom.id); else next.add(axiom.id);
                                                    setSelectedAxiomIds(next);
                                                }}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold uppercase">{axiom.role}</span>
                                                <span className="text-[8px] font-mono text-muted-foreground">BAR_{axiom.barOffset}</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                            <Play className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

            </div>
        </main>
    );
}
