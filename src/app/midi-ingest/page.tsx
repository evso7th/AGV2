
'use client';

import { useState, useEffect } from 'react';
import { Midi } from '@tonejs/midi';
import { Upload, FileMusic, Download, Search, Settings2, Sparkles, Tags, Heart, CloudUpload } from 'lucide-react';
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
 * #ЗАЧЕМ: Извлечение и сжатие фраз из MIDI трека.
 */
const segmentMidiToCompactLicks = (track: any, root: number, origin: string, extraTags: string) => {
    const result = [];
    const barsPerLick = 4;
    const bpm = 72; 
    const secondsPerBar = (60 / bpm) * 4;
    const userTags = extraTags.split(',').map(t => t.trim()).filter(Boolean);

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
            
            const degreeStr = SEMITONE_TO_DEGREE[(n.midi - root + 120) % 12] || 'R';
            const degIdx = DEGREE_KEYS.indexOf(degreeStr);
            const techIdx = 0;

            compactPhrase.push(tick, durationTicks, degIdx, techIdx);
        });

        result.push({
            id: `LICK_${Date.now()}_${i}`,
            phrase: compactPhrase,
            tags: ['legacy', 'compact', ...userTags],
            metadata: {
                origin: origin.trim() || 'Unknown MIDI',
                timestamp: new Date().toISOString()
            }
        });
    }
    return result;
};

export default function MidiIngestPage() {
    const router = useRouter();
    const db = useFirestore();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [extractedLicks, setExtractedLicks] = useState<any[]>([]);
    const [detectedKey, setDetectedKey] = useState<{ root: number, mode: string } | null>(null);
    const [midiTrack, setMidiTrack] = useState<any | null>(null);
    const [manualRoot, setManualRoot] = useState<string>("60");
    const [origin, setOrigin] = useState("");
    const [extraTags, setExtraTags] = useState("");

    useEffect(() => {
        if (midiTrack && detectedKey) {
            const root = parseInt(manualRoot, 10);
            const licks = segmentMidiToCompactLicks(midiTrack, root, origin, extraTags);
            setExtractedLicks(licks);
        }
    }, [midiTrack, detectedKey, manualRoot, origin, extraTags]);

    const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const midi = new Midi(event.target?.result as ArrayBuffer);
                const track = midi.tracks.reduce((prev, curr) => 
                    curr.notes.length > prev.notes.length ? curr : prev
                );

                const noteNumbers = track.notes.map(n => n.midi);
                const key = detectKeyFromNotes(noteNumbers);
                
                setMidiTrack(track);
                setDetectedKey(key);
                setManualRoot(key.root.toString());
            } catch (err) {
                console.error("Analysis failed", err);
                toast({ variant: "destructive", title: "MIDI Analysis Failed" });
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const copyToClipboard = () => {
        const text = formatLicksToText(extractedLicks);
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to Clipboard" });
    };

    const transmitToGlobalMemory = async () => {
        if (extractedLicks.length === 0) return;
        setIsTransmitting(true);
        
        try {
            console.info(`%c[Transmitter] Beginning mass endorsement of ${extractedLicks.length} licks...`, 'color: #DA70D6; font-weight: bold;');
            
            extractedLicks.forEach((lick, index) => {
                saveHeritageAxiom(db, {
                    phrase: lick.phrase,
                    dynasty: origin.toLowerCase().replace(/\s+/g, '-') || 'heritage',
                    origin: origin || 'Unknown Source',
                    tags: lick.tags
                });
            });

            toast({ 
                title: "Genetic Ingestion Success", 
                description: `${extractedLicks.length} axioms transmitted to global evolutionary pool.`
            });
        } catch (e) {
            toast({ variant: "destructive", title: "Transmission Failed" });
        } finally {
            setIsTransmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-background">
            <Card className="w-full max-w-4xl shadow-xl border-primary/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <FileMusic className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-bold">Heritage Alchemist v2.5</CardTitle>
                                <CardDescription>Synchronic Metadata Transmutation & Genetic Sowing</CardDescription>
                            </div>
                        </div>
                        <Button variant="ghost" onClick={() => router.push('/aura-groove')} className="text-xs">
                            Back to Studio
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 p-4 border rounded-xl bg-muted/20">
                            <Label className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                                <Tags className="h-4 w-4" /> Source Inheritance
                            </Label>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase">Artist / Dynasty</Label>
                                    <Input 
                                        placeholder="e.g.: The Moody Blues" 
                                        value={origin}
                                        onChange={(e) => setOrigin(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase">Genetic Tags (csv)</Label>
                                    <Input 
                                        placeholder="romantic, dreamy, slow-burn" 
                                        value={extraTags}
                                        onChange={(e) => setExtraTags(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-bold uppercase tracking-wider">Ingest MIDI</Label>
                            <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                                <input 
                                    type="file" 
                                    accept=".mid,.midi" 
                                    onChange={onFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="space-y-2">
                                    <Sparkles className="h-8 w-8 mx-auto text-primary/50" />
                                    <p className="text-xs text-muted-foreground">Drop MIDI file to extract Axioms</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {detectedKey && (
                        <Card className="bg-primary/5 border-primary/10">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Search className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground">Harmonic Signature</p>
                                        <p className="text-sm font-bold text-primary">{detectedKey.root} {detectedKey.mode}</p>
                                    </div>
                                </div>
                                <div className="w-48 space-y-1">
                                    <Label className="text-[10px] uppercase">Tonic Adjustment</Label>
                                    <Select value={manualRoot} onValueChange={setManualRoot}>
                                        <SelectTrigger className="h-7 text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({length: 12}).map((_, i) => (
                                                <SelectItem key={i} value={(60+i).toString()} className="text-[10px]">
                                                    Note {(60+i)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {extractedLicks.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-bold flex items-center gap-2 uppercase">
                                    <Settings2 className="h-4 w-4" /> Extracted Genetic Code ({extractedLicks.length})
                                </Label>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="default" 
                                        onClick={transmitToGlobalMemory} 
                                        disabled={isTransmitting}
                                        className="gap-2 text-xs h-8 bg-green-600 hover:bg-green-700"
                                    >
                                        <CloudUpload className="h-3 w-3" /> 
                                        {isTransmitting ? 'Transmitting...' : 'Endorse & Transmit'}
                                    </Button>
                                    <Button size="sm" onClick={copyToClipboard} className="gap-2 text-xs h-8">
                                        <Download className="h-3 w-3" /> Copy JSON
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="h-[250px] rounded-md border p-4 bg-black/40 font-mono text-[10px]">
                                <pre className="text-primary/80 whitespace-pre">
                                    {formatLicksToText(extractedLicks)}
                                </pre>
                            </ScrollArea>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-primary font-bold animate-pulse">Decompressing human heritage...</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
