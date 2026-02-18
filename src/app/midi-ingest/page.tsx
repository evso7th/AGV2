'use client';

import { useState } from 'react';
import { Midi } from '@tonejs/midi';
import { Upload, FileMusic, Download, Search, Settings2, Sparkles, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { detectKeyFromNotes, SEMITONE_TO_DEGREE } from '@/lib/music-theory';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * #ЗАЧЕМ: Инструментальный Дашборд "Алхимик MIDI" v2.0.
 * #ЧТО: Поддержка метаданных (Artist/Origin) и протокол безопасной вставки через ingest_buffer.json.
 */
export default function MidiIngestPage() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [extractedLicks, setExtractedLicks] = useState<any[]>([]);
    const [detectedKey, setDetectedKey] = useState<{ root: number, mode: string } | null>(null);
    const [manualRoot, setManualRoot] = useState<string>("60");
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
                
                // 1. Находим самую активную дорожку
                const track = midi.tracks.reduce((prev, curr) => 
                    curr.notes.length > prev.notes.length ? curr : prev
                );

                // 2. Детекция ключа
                const noteNumbers = track.notes.map(n => n.midi);
                const key = detectKeyFromNotes(noteNumbers);
                setDetectedKey(key);
                setManualRoot(key.root.toString());

                // 3. Экстракция
                const licks = segmentMidiToLicks(track, key.root);
                setExtractedLicks(licks);
            } catch (err) {
                console.error("Analysis failed", err);
                alert("Ошибка анализа MIDI. Возможно, файл поврежден.");
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const segmentMidiToLicks = (track: any, root: number) => {
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

            const phrase = phraseNotes.map((n: any) => {
                const relativeTime = n.time - start;
                const tick = Math.round((relativeTime / (secondsPerBar / 12))); 
                const durationTicks = Math.max(1, Math.round(n.duration / (secondsPerBar / 12)));
                const degree = SEMITONE_TO_DEGREE[(n.midi - root + 120) % 12] || 'R';
                
                return { t: tick, d: durationTicks, deg: degree };
            });

            result.push({
                id: `LEGACY_${Date.now()}_${i}`,
                phrase,
                tags: ['legacy', 'extracted', ...userTags],
                metadata: {
                    origin: origin || 'Unknown MIDI',
                    timestamp: new Date().toISOString()
                }
            });
        }
        return result;
    };

    const copyToClipboard = () => {
        const json = JSON.stringify(extractedLicks, null, 2);
        navigator.clipboard.writeText(json);
        alert('JSON скопирован! Теперь вставьте его в файл src/lib/assets/ingest_buffer.json и скажите AI: "ДЕЛАЙ ТРАНСМУТАЦИЮ"');
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-background">
            <Card className="w-full max-w-4xl shadow-xl border-primary/20">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileMusic className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold">Алхимик MIDI v2.0</CardTitle>
                            <CardDescription>Завод по добыче Наследия для Золотой Базы</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Source Info */}
                        <div className="space-y-4 p-4 border rounded-xl bg-muted/20">
                            <Label className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
                                <Tags className="h-4 w-4" /> Метаданные источника
                            </Label>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase">Исполнитель / Песня</Label>
                                    <Input 
                                        placeholder="например: The Moody Blues" 
                                        value={origin}
                                        onChange={(e) => setOrigin(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase">Доп. теги (через запятую)</Label>
                                    <Input 
                                        placeholder="slow, sad, melodic" 
                                        value={extraTags}
                                        onChange={(e) => setExtraTags(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Upload */}
                        <div className="space-y-4">
                            <Label className="text-sm font-bold uppercase tracking-wider">Загрузить файл</Label>
                            <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                                <input 
                                    type="file" 
                                    accept=".mid,.midi" 
                                    onChange={onFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="space-y-2">
                                    <Sparkles className="h-8 w-8 mx-auto text-primary/50" />
                                    <p className="text-xs text-muted-foreground">Перетащите MIDI файл сюда</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analysis Panel */}
                    {detectedKey && (
                        <Card className="bg-primary/5 border-primary/10">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Search className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground">Вероятный ключ</p>
                                        <p className="text-sm font-bold text-primary">{detectedKey.root} {detectedKey.mode}</p>
                                    </div>
                                </div>
                                <div className="w-48 space-y-1">
                                    <Label className="text-[10px] uppercase">Корректировка</Label>
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

                    {/* Results */}
                    {extractedLicks.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-bold flex items-center gap-2 uppercase">
                                    <Settings2 className="h-4 w-4" /> Извлеченные Аксиомы ({extractedLicks.length})
                                </Label>
                                <Button size="sm" onClick={copyToClipboard} className="gap-2 text-xs h-8">
                                    <Download className="h-3 w-3" /> Copy for Ingestion
                                </Button>
                            </div>
                            <ScrollArea className="h-[250px] rounded-md border p-4 bg-black/40 font-mono text-[10px]">
                                <pre className="text-primary/80">
                                    {JSON.stringify(extractedLicks, null, 2)}
                                </pre>
                            </ScrollArea>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-primary font-bold animate-pulse">Трансмутация MIDI нот...</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
