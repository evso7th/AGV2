
'use client';

import { useState, useEffect } from 'react';
import { Midi } from '@tonejs/midi';
import { Upload, FileMusic, Download, Search, Settings2, Sparkles, Tags, Heart, CloudUpload, Music, Waves, Drum, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { detectKeyFromNotes, SEMITONE_TO_DEGREE, DEGREE_KEYS } from '@/lib/music-theory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { saveHeritageAxiom } from '@/lib/firebase-service';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type IngestionRole = 'melody' | 'bass' | 'drums' | 'accomp';

/**
 * #ЗАЧЕМ: Компактное форматирование ликов для экспорта.
 */
const formatLicksToText = (licks: any[]) => {
    return "[\n" + licks.map(lick => {
        const { phrase, ...rest } = lick;
        const restJson = JSON.stringify(rest, null, 2);
        return `  {\n    "phrase": [${phrase.join(', ')}],\n${restJson.substring(4)}`;
    }).join(",\n") + "\n]";
};

/**
 * #ЗАЧЕМ: Универсальный сегментатор треков.
 */
const segmentTrackToCompactLicks = (track: any, root: number, role: IngestionRole, origin: string, extraTags: string) => {
    const result = [];
    const barsPerLick = 4;
    const bpm = 72; 
    const secondsPerBar = (60 / bpm) * 4;
    const userTags = extraTags.split(',').map(t => t.trim()).filter(Boolean);

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
                degreeIdx = n.midi; // Для барабанов сохраняем MIDI питч
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
            tags: ['heritage', role, ...userTags],
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
    const [detectedKey, setDetectedKey] = useState<{ root: number, mode: string } | null>(null);
    const [origin, setOrigin] = useState("");
    const [extraTags, setExtraTags] = useState("");

    const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const midi = new Midi(event.target?.result as ArrayBuffer);
                setMidiFile(midi);
                
                // Авто-выбор самого длинного трека для начала
                const longestTrackIdx = midi.tracks.reduce((prev, curr, idx) => 
                    curr.notes.length > midi.tracks[prev].notes.length ? idx : prev, 0
                );
                
                setSelectedTrackIndex(longestTrackIdx);
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

    useEffect(() => {
        if (midiFile && selectedTrackIndex !== -1 && detectedKey) {
            const track = midiFile.tracks[selectedTrackIndex];
            const licks = segmentTrackToCompactLicks(track, detectedKey.root, selectedRole, origin, extraTags);
            setExtractedLicks(licks);
        }
    }, [midiFile, selectedTrackIndex, selectedRole, detectedKey, origin, extraTags]);

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

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-background">
            <Card className="w-full max-w-5xl shadow-xl border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Factory className="h-10 w-10 text-primary" />
                        <div>
                            <CardTitle className="text-3xl font-bold">Heritage Alchemist v3.0</CardTitle>
                            <CardDescription>Multi-Track Genetic Ingestion Console</CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => router.push('/aura-groove')} className="text-xs"> Studio</Button>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4 md:col-span-1 p-4 border rounded-xl bg-muted/20">
                            <Label className="text-xs font-bold uppercase tracking-wider">Source Identity</Label>
                            <Input placeholder="Artist / Dynasty" value={origin} onChange={(e) => setOrigin(e.target.value)} className="h-8 text-xs" />
                            <Input placeholder="Tags (soul, romantic...)" value={extraTags} onChange={(e) => setExtraTags(e.target.value)} className="h-8 text-xs" />
                            
                            <div className="pt-4 border-t space-y-4">
                                <Label className="text-xs font-bold uppercase">Discovery</Label>
                                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 text-center hover:border-primary/50 transition-colors relative">
                                    <input type="file" accept=".mid,.midi" onChange={onFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <Upload className="h-6 w-6 mx-auto text-primary/50 mb-2" />
                                    <p className="text-[10px] text-muted-foreground">Select MIDI File</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <Label className="text-xs font-bold uppercase tracking-wider">Track Map {midiFile ? `(${midiFile.name})` : ''}</Label>
                            <ScrollArea className="h-[200px] rounded-md border bg-black/20 p-2">
                                {!midiFile ? (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">No file loaded</div>
                                ) : (
                                    <div className="space-y-1">
                                        {midiFile.tracks.map((track, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => setSelectedTrackIndex(i)}
                                                className={cn(
                                                    "flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-xs",
                                                    selectedTrackIndex === i ? "bg-primary/20 border-l-2 border-primary" : "hover:bg-muted/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono opacity-50">{i.toString().padStart(2, '0')}</span>
                                                    <span className="font-medium">{track.name || `Unnamed Track`}</span>
                                                </div>
                                                <div className="flex items-center gap-4 opacity-70">
                                                    <span>{track.notes.length} notes</span>
                                                    <span>{(track.duration / 4).toFixed(1)} bars</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>

                            {selectedTrackIndex !== -1 && (
                                <div className="flex items-center gap-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                    <div className="flex-grow flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Active Track Role</Label>
                                            <div className="flex gap-1 mt-1">
                                                {(['melody', 'bass', 'drums', 'accomp'] as IngestionRole[]).map(role => (
                                                    <Button 
                                                        key={role}
                                                        size="sm"
                                                        variant={selectedRole === role ? "default" : "outline"}
                                                        onClick={() => setSelectedRole(role)}
                                                        className="h-7 px-3 text-[10px] capitalize gap-1.5"
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
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase text-muted-foreground">Signature</p>
                                        <p className="text-sm font-bold text-primary">{detectedKey?.root} {detectedKey?.mode}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {extractedLicks.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-bold flex items-center gap-2 uppercase">
                                    <Settings2 className="h-4 w-4" /> Axiom Preview ({extractedLicks.length})
                                </Label>
                                <Button 
                                    onClick={transmitToGlobalMemory} 
                                    disabled={isTransmitting}
                                    className="gap-2 text-xs h-9 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20"
                                >
                                    <CloudUpload className="h-4 w-4" /> 
                                    {isTransmitting ? 'Ingesting...' : 'Endorse & Transmit'}
                                </Button>
                            </div>
                            <ScrollArea className="h-[200px] rounded-md border p-4 bg-black/40 font-mono text-[10px]">
                                <pre className="text-primary/80 whitespace-pre">
                                    {formatLicksToText(extractedLicks)}
                                </pre>
                            </ScrollArea>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-primary font-bold animate-pulse">Decompressing Dynasty Code...</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
