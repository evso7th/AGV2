'use client';

import { useState, useCallback } from 'react';
import { Midi } from '@tonejs/midi';
import { Upload, FileMusic, Play, Download, Search, Settings2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { detectKeyFromNotes, SEMITONE_TO_DEGREE } from '@/lib/music-theory';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * #ЗАЧЕМ: Инструментальный Дашборд "Алхимик MIDI".
 * #ЧТО: Страница для загрузки, детекции ключа и экстракции ликов из MIDI файлов.
 */
export default function MidiIngestPage() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [extractedLicks, setExtractedLicks] = useState<any[]>([]);
    const [detectedKey, setDetectedKey] = useState<{ root: number, mode: string } | null>(null);
    const [manualRoot, setManualRoot] = useState<string>("60");

    const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const midi = new Midi(event.target?.result as ArrayBuffer);
            
            // 1. Находим дорожку соло (самая активная)
            const track = midi.tracks.reduce((prev, curr) => 
                curr.notes.length > prev.notes.length ? curr : prev
            );

            // 2. Детекция ключа
            const noteNumbers = track.notes.map(n => n.midi);
            const key = detectKeyFromNotes(noteNumbers);
            setDetectedKey(key);
            setManualRoot(key.root.toString());

            // 3. Экстракция фраз (по 4 такта)
            // Допустим tpb=12 (12/8 shuffle). 4 такта = 48 тиков.
            const licks = segmentMidiToLicks(track, key.root);
            setExtractedLicks(licks);
            setIsAnalyzing(false);
        };
        reader.readAsArrayBuffer(file);
    };

    const segmentMidiToLicks = (track: any, root: number) => {
        const result = [];
        const barsPerLick = 4;
        const totalTime = track.duration;
        const bpm = 72; // Предполагаемый темп для нормализации
        const secondsPerBar = (60 / bpm) * 4;
        
        for (let i = 0; i < totalTime / (secondsPerBar * barsPerLick); i++) {
            const start = i * secondsPerBar * barsPerLick;
            const end = (i + 1) * secondsPerBar * barsPerLick;
            
            const phraseNotes = track.notes.filter((n: any) => n.time >= start && n.time < end);
            if (phraseNotes.length < 4) continue;

            // Конвертация в наш формат {t, d, deg}
            const lick = phraseNotes.map((n: any) => {
                const relativeTime = n.time - start;
                const tick = Math.round((relativeTime / (secondsPerBar / 12))); // Квантизация к 12 тикам
                const durationTicks = Math.round(n.duration / (secondsPerBar / 12));
                const degree = SEMITONE_TO_DEGREE[(n.midi - root + 120) % 12] || 'R';
                
                return { t: tick, d: durationTicks, deg: degree };
            });

            result.push({
                id: `LICK_${Date.now()}_${i}`,
                phrase: lick,
                tags: ['legacy', 'extracted']
            });
        }
        return result;
    };

    const copyToClipboard = () => {
        const json = JSON.stringify(extractedLicks, null, 2);
        navigator.clipboard.writeText(json);
        alert('JSON скопирован! Теперь вставьте его в blues_guitar_solo.ts');
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
                            <CardTitle className="text-3xl font-bold">Алхимик MIDI</CardTitle>
                            <CardDescription>Завод по превращению MIDI архивов в Золотые Аксиомы Блюза</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Upload Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Label className="text-lg font-semibold flex items-center gap-2">
                                <Upload className="h-5 w-5" /> Загрузить архив
                            </Label>
                            <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                                <input 
                                    type="file" 
                                    accept=".mid,.midi" 
                                    onChange={onFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="space-y-2">
                                    <Sparkles className="h-10 w-10 mx-auto text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Перетащите MIDI файлы сюда или нажмите для выбора</p>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Panel */}
                        <div className="space-y-4">
                            <Label className="text-lg font-semibold flex items-center gap-2">
                                <Search className="h-5 w-5" /> Анализ и Детекция
                            </Label>
                            <Card className="bg-muted/30 border-0">
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Вероятный ключ:</span>
                                        <div className="flex items-center gap-2">
                                            {detectedKey ? (
                                                <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-bold uppercase">
                                                    {detectedKey.root} {detectedKey.mode}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Ожидание файла...</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Ручная корректировка Root</Label>
                                        <Select value={manualRoot} onValueChange={setManualRoot}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({length: 12}).map((_, i) => (
                                                    <SelectItem key={i} value={(60+i).toString()} className="text-xs">
                                                        Note {(60+i)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Results Section */}
                    {extractedLicks.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-lg font-semibold flex items-center gap-2">
                                    <Settings2 className="h-5 w-5" /> Извлеченные Аксиомы ({extractedLicks.length})
                                </Label>
                                <Button size="sm" onClick={copyToClipboard} className="gap-2">
                                    <Download className="h-4 w-4" /> Copy Licks JSON
                                </Button>
                            </div>
                            <ScrollArea className="h-[300px] rounded-md border p-4 bg-black/20 font-mono text-[10px]">
                                <pre className="text-primary/80">
                                    {JSON.stringify(extractedLicks, null, 2)}
                                </pre>
                            </ScrollArea>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-primary font-bold animate-pulse">Работает Алхимик: трансмутация MIDI нот...</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
