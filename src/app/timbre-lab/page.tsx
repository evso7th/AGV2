
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, Save, RotateCcw, Play, Music, 
  Settings2, SlidersHorizontal, Layers, Activity,
  Speaker, Zap, Waves, Volume2, Box, Square, Infinity as InfinityIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { V2_PRESETS } from '@/lib/presets-v2';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'AuraGroove_TimbreOverrides';

export default function TimbreLabPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { startPreview, stopPreview, updatePreviewPreset, togglePreviewLoop, isPreviewPlaying, isPreviewLooping } = useAudioEngine();
  
  const [overrides, setOverrides] = useState<Record<string, any>>({});
  const [activePresetId, setActivePresetId] = useState<string>('synth');
  const [activeTab, setActiveTab] = useState('engine');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setOverrides(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const presets = useMemo(() => {
    const combined: Record<string, any> = {};
    Object.entries(V2_PRESETS).forEach(([id, base]) => {
      combined[id] = { ...base, ...(overrides[id] || {}) };
    });
    return combined;
  }, [overrides]);

  const activePreset = presets[activePresetId];
  const isModified = !!overrides[activePresetId];

  // #ЗАЧЕМ: ПЛАН №907. Синхронизация в реальном времени.
  const updateParam = useCallback((path: string[], value: any) => {
    setOverrides(prev => {
      const next = { ...prev };
      if (!next[activePresetId]) next[activePresetId] = {};
      
      let current = next[activePresetId];
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!current[key]) current[key] = {};
        current[key] = { ...current[key] };
        current = current[key];
      }
      current[path[path.length - 1]] = value;
      
      // Находим актуальный объект пресета после обновления
      const updatedPreset = { ...V2_PRESETS[activePresetId as keyof typeof V2_PRESETS], ...next[activePresetId] };
      updatePreviewPreset(updatedPreset);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [activePresetId, updatePreviewPreset]);

  const resetPreset = () => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[activePresetId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      updatePreviewPreset(V2_PRESETS[activePresetId as keyof typeof V2_PRESETS]);
      return next;
    });
    toast({ title: "Preset Restored", description: `${activePresetId} is back to factory defaults.` });
  };

  const handleToggleTest = () => {
    if (isPreviewPlaying) {
        stopPreview();
    } else {
        startPreview(activePreset, activePreset.type || 'synth', isPreviewLooping);
        toast({ title: "Preview Started", description: `Playing 24-bar epic test sequence...` });
    }
  };

  const renderSlider = (label: string, value: number, min: number, max: number, step: number, path: string[], unit = "") => (
    <div className="space-y-2 py-2 border-b border-primary/5 last:border-0 group">
      <div className="flex justify-between items-center">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{label}</Label>
        <span className="text-[10px] font-mono font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded">{value}{unit}</span>
      </div>
      <Slider 
        value={[value || 0]} 
        min={min} max={max} step={step} 
        onValueChange={(v) => updateParam(path, v[0])} 
        className="py-2"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 font-body overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col gap-6">
        <header className="flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter text-primary flex items-center gap-3">
              <Settings2 className="h-8 w-8" /> Timbre Lab
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">V2 Engine Real-time Calibration Unit</p>
          </div>
          <div className="flex gap-2">
            <Button 
                variant={isPreviewLooping ? "secondary" : "outline"} 
                size="sm" 
                onClick={togglePreviewLoop} 
                className="gap-2 font-black uppercase text-[10px]"
            >
              <InfinityIcon className={cn("h-3.5 w-3.5", isPreviewLooping && "text-primary")} /> {isPreviewLooping ? "Looping ON" : "Loop Off"}
            </Button>
            <Button 
                variant={isPreviewPlaying ? "destructive" : "outline"} 
                size="sm" 
                onClick={handleToggleTest} 
                className="gap-2 font-black uppercase text-[10px] min-w-[120px]"
            >
              {isPreviewPlaying ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              {isPreviewPlaying ? "Stop Sequence" : "Test Sequence"}
            </Button>
            <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-[10px] font-black uppercase">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow overflow-hidden">
          {/* Left Column: Preset List */}
          <Card className="lg:col-span-1 border-primary/10 bg-card/50 flex flex-col overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-primary/5">
              <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                <Music className="h-4 w-4 text-primary" /> Active Timbres
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {Object.entries(presets).map(([id, p]) => (
                    <div 
                      key={id}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-all border group",
                        activePresetId === id ? "bg-primary/10 border-primary/30" : "border-transparent hover:bg-muted/50"
                      )}
                      onClick={() => {
                          if (activePresetId !== id) {
                              stopPreview();
                              setActivePresetId(id);
                          }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn("text-[11px] font-black uppercase truncate", activePresetId === id ? "text-primary" : "text-muted-foreground")}>
                          {p.name || id.replace(/_/g, ' ')}
                        </span>
                        {overrides[id] && <Badge className="h-3 w-3 p-0 rounded-full bg-primary animate-pulse" />}
                      </div>
                      <div className="text-[9px] font-bold opacity-40 uppercase mt-0.5">{p.type || 'sampler'}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right Column: Editor */}
          <Card className="lg:col-span-3 border-primary/10 bg-card/50 flex flex-col overflow-hidden">
            <CardHeader className="p-6 pb-2 border-b border-primary/5 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xl font-black uppercase text-primary tracking-tight">
                  {activePreset.name || activePresetId}
                </CardTitle>
                <CardDescription className="text-[10px] font-black uppercase opacity-50 tracking-widest">
                  Base Engine: {activePreset.type || 'Sampler Pipeline'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isModified && (
                  <Button variant="ghost" size="sm" onClick={resetPreset} className="text-destructive h-8 px-3 text-[10px] font-black uppercase">
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset to Factory
                  </Button>
                )}
              </div>
            </CardHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col overflow-hidden">
              <TabsList className="mx-6 mt-4 bg-muted/30 border border-primary/5 h-9 grid grid-cols-3 shrink-0">
                <TabsTrigger value="engine" className="text-[10px] font-black uppercase">Engine Core</TabsTrigger>
                <TabsTrigger value="filter" className="text-[10px] font-black uppercase">Filter & LFO</TabsTrigger>
                <TabsTrigger value="fx" className="text-[10px] font-black uppercase">Effects & Drive</TabsTrigger>
              </TabsList>

              <div className="flex-grow overflow-hidden relative">
                <ScrollArea className="h-full px-6">
                  <div className="py-6 space-y-8">
                    {/* ENGINE TAB */}
                    <TabsContent value="engine" className="m-0 space-y-8">
                      {/* 1. Master Volume */}
                      <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 text-primary/70">
                          <Volume2 className="h-4 w-4" /> Master Calibration
                        </h3>
                        <div className="bg-muted/20 p-4 rounded-xl border border-primary/5">
                          {renderSlider("Master Volume", activePreset.volume || 0.7, 0, 1, 0.01, ["volume"])}
                        </div>
                      </section>

                      {/* 2. Oscillators */}
                      <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 text-primary/70">
                          <Layers className="h-4 w-4" /> Sound Generation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 bg-muted/20 p-4 rounded-xl border border-primary/5">
                          {activePreset.type === 'synth' && activePreset.osc?.map((o: any, i: number) => (
                            <div key={i} className="col-span-2 p-3 bg-card/50 rounded-lg border border-primary/10">
                               <div className="flex justify-between items-center mb-2">
                                 <Badge variant="outline" className="text-[9px] uppercase font-black">Oscillator {i+1}</Badge>
                                 <span className="text-[10px] font-mono opacity-50">{o.type}</span>
                               </div>
                               {renderSlider("Detune", o.detune || 0, -100, 100, 1, ["osc", i, "detune"], " cents")}
                               {renderSlider("Gain", o.gain || 0.5, 0, 1, 0.01, ["osc", i, "gain"])}
                            </div>
                          ))}
                          {activePreset.type === 'guitar' && activePreset.osc && (
                            <div className="col-span-2 p-3 bg-card/50 rounded-lg border border-primary/10 space-y-2">
                                <Badge variant="outline" className="text-[9px] uppercase font-black">Pulse Wave Config</Badge>
                                {renderSlider("Width (Pulse)", activePreset.osc.width || 0.45, 0.1, 0.9, 0.01, ["osc", "width"])}
                                {renderSlider("Detune Spread", activePreset.osc.detune || 5, 0, 50, 1, ["osc", "detune"])}
                            </div>
                          )}
                          {activePreset.type === 'organ' && (
                            <div className="col-span-2 space-y-4">
                               <div className="grid grid-cols-9 gap-2 h-32 items-end px-2">
                                 {activePreset.drawbars?.map((v: number, i: number) => (
                                   <div key={i} className="flex flex-col items-center gap-2 h-full">
                                     <Slider 
                                       orientation="vertical" 
                                       value={[v]} min={0} max={8} step={1} 
                                       onValueChange={(val) => {
                                         const next = [...activePreset.drawbars];
                                         next[i] = val[0];
                                         updateParam(["drawbars"], next);
                                       }}
                                       className="h-24"
                                     />
                                     <span className="text-[8px] font-mono font-bold opacity-50">{i+1}</span>
                                   </div>
                                 ))}
                               </div>
                               <Label className="text-[10px] font-black uppercase text-center block opacity-40">Hammond Drawbars (16' to 1')</Label>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* 3. ADSR Envelope */}
                      <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 text-primary/70">
                          <Activity className="h-4 w-4" /> ADSR Amplitude Envelope
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 bg-muted/20 p-4 rounded-xl border border-primary/5">
                          {renderSlider("Attack", activePreset.adsr?.a || 0.01, 0.001, 2.0, 0.001, ["adsr", "a"], "s")}
                          {renderSlider("Decay", activePreset.adsr?.d || 0.1, 0.01, 2.0, 0.01, ["adsr", "d"], "s")}
                          {renderSlider("Sustain", activePreset.adsr?.s || 0.7, 0, 1, 0.01, ["adsr", "s"])}
                          {renderSlider("Release", activePreset.adsr?.r || 0.3, 0.01, 5.0, 0.01, ["adsr", "r"], "s")}
                        </div>
                      </section>
                    </TabsContent>

                    {/* FILTER TAB */}
                    <TabsContent value="filter" className="m-0 space-y-8">
                      <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 text-primary/70">
                          <Waves className="h-4 w-4" /> VCF Ladder Filter
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 bg-muted/20 p-4 rounded-xl border border-primary/5">
                          {renderSlider("Cutoff Frequency", (activePreset.lpf?.cutoff || activePreset.lpf || 2000), 20, 15000, 10, ["lpf", "cutoff"], "Hz")}
                          {renderSlider("Resonance (Q)", (activePreset.lpf?.q || 1), 0.1, 15, 0.1, ["lpf", "q"])}
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 text-primary/70">
                          <Zap className="h-4 w-4" /> LFO Modulation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 bg-muted/20 p-4 rounded-xl border border-primary/5">
                          {renderSlider("Rate", activePreset.lfo?.rate || 0.2, 0, 10, 0.01, ["lfo", "rate"], "Hz")}
                          {renderSlider("Amount", activePreset.lfo?.amount || 0, 0, 1000, 1, ["lfo", "amount"])}
                        </div>
                      </section>
                    </TabsContent>

                    {/* FX TAB */}
                    <TabsContent value="fx" className="m-0 space-y-8">
                      {/* Drive / Distortion Section */}
                      {(activePreset.type === 'guitar' || activePreset.type === 'synth') && (
                        <section className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 text-primary/70">
                            <Zap className="h-4 w-4" /> Drive & Distortion
                            </h3>
                            <div className="p-4 bg-muted/20 rounded-xl border border-primary/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Distortion Engine</Label>
                                    <Badge variant="secondary" className="text-[9px] uppercase font-black">{activePreset.drive?.type || 'Standard'}</Badge>
                                </div>
                                {renderSlider("Amount / Gain", activePreset.drive?.amount || 0.5, 0, 1, 0.01, ["drive", "amount"])}
                            </div>
                        </section>
                      )}

                      <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-tighter flex items-center gap-2 text-primary/70">
                          <Box className="h-4 w-4" /> Effects Rack
                        </h3>
                        <div className="space-y-6">
                          {/* Reverb */}
                          <div className="p-4 bg-muted/20 rounded-xl border border-primary/5 space-y-4">
                            <div className="flex items-center gap-2">
                              <Volume2 className="h-4 w-4 text-primary" />
                              <span className="text-[10px] font-black uppercase">Convolution Reverb</span>
                            </div>
                            {renderSlider("Reverb Mix", activePreset.reverbMix || 0.2, 0, 1, 0.01, ["reverbMix"])}
                          </div>

                          {/* Delay */}
                          <div className="p-4 bg-muted/20 rounded-xl border border-primary/5 space-y-4">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-primary" />
                              <span className="text-[10px] font-black uppercase">Stereo Delay</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                              {renderSlider("Time", (activePreset.delay?.time || activePreset.delayA?.time || 0.4), 0.01, 2.0, 0.01, ["delay", "time"], "s")}
                              {renderSlider("Feedback", (activePreset.delay?.fb || activePreset.delayA?.fb || 0.3), 0, 0.95, 0.01, ["delay", "fb"])}
                              {renderSlider("Mix", (activePreset.delay?.mix || activePreset.delayA?.mix || 0.2), 0, 1, 0.01, ["delay", "mix"])}
                            </div>
                          </div>

                          {/* Chorus */}
                          <div className="p-4 bg-muted/20 rounded-xl border border-primary/5 space-y-4">
                            <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4 text-primary" />
                              <span className="text-[10px] font-black uppercase">Ensemble Chorus</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                              {renderSlider("Rate", activePreset.chorus?.rate || 0.25, 0.01, 5.0, 0.01, ["chorus", "rate"], "Hz")}
                              {renderSlider("Depth", activePreset.chorus?.depth || 0.005, 0, 0.05, 0.001, ["chorus", "depth"])}
                              {renderSlider("Mix", activePreset.chorus?.mix || 0.3, 0, 1, 0.01, ["chorus", "mix"])}
                            </div>
                          </div>
                        </div>
                      </section>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </div>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
