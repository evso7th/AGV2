"use client";

import { useState, useEffect } from 'react';
import type { Preset, MusicParameters } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Trash2, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { suggestParameterPresets } from '@/ai/flows/suggest-parameter-presets';
import { DEFAULT_PARAMS } from '@/lib/music';

interface PresetsProps {
  currentParameters: MusicParameters;
  onLoadPreset: (parameters: MusicParameters) => void;
  disabled: boolean;
}

const defaultPresets: Preset[] = [
  { id: 'default-1', name: 'Cyberpunk Drive', parameters: { tempo: 150, scale: 'E Minor', instrument: 'FMSynth', pattern: 'up', noteDensity: 0.8 } },
  { id: 'default-2', name: 'Ambient Dreams', parameters: { tempo: 70, scale: 'C Major', instrument: 'AMSynth', pattern: 'random', noteDensity: 0.4 } },
  { id: 'default-3', name: 'Industrial Beat', parameters: { tempo: 100, scale: 'Chromatic', instrument: 'MetalSynth', pattern: 'down', noteDensity: 0.9 } },
];


export default function Presets({ currentParameters, onLoadPreset, disabled }: PresetsProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [isSaveOpen, setSaveOpen] = useState(false);
  const [isSuggestOpen, setSuggestOpen] = useState(false);
  const [suggestionDescription, setSuggestionDescription] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedPresets = localStorage.getItem('math-tune-presets');
      if (storedPresets) {
        setPresets(JSON.parse(storedPresets));
      } else {
        setPresets(defaultPresets);
      }
    } catch (error) {
      console.error("Failed to load presets from local storage", error);
      setPresets(defaultPresets);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('math-tune-presets', JSON.stringify(presets));
    } catch (error) {
      console.error("Failed to save presets to local storage", error);
    }
  }, [presets]);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast({ title: 'Preset name is empty', variant: 'destructive' });
      return;
    }
    const newPreset: Preset = {
      id: `user-${Date.now()}`,
      name: newPresetName,
      parameters: currentParameters,
    };
    setPresets(prev => [newPreset, ...prev]);
    setNewPresetName('');
    setSaveOpen(false);
    toast({ title: 'Preset Saved!', description: `"${newPresetName}" has been added to your presets.` });
  };

  const handleDeletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Preset Deleted' });
  };
  
  const handleSuggestPresets = async () => {
    if (!suggestionDescription.trim()) {
      toast({ title: 'Description is empty', variant: 'destructive' });
      return;
    }
    setIsSuggesting(true);
    try {
      const { presets: suggested } = await suggestParameterPresets({ description: suggestionDescription });
      const newPresets: Preset[] = suggested.map((p, i) => ({
        id: `ai-${Date.now()}-${i}`,
        name: (p.name as string) || `AI Suggestion ${i + 1}`,
        parameters: { ...DEFAULT_PARAMS, ...p } as MusicParameters,
      }));
      setPresets(prev => [...newPresets, ...prev]);
      toast({ title: 'AI Presets Added', description: `${newPresets.length} new presets have been suggested by AI.` });
      setSuggestOpen(false);
      setSuggestionDescription('');
    } catch (error) {
      toast({ title: 'Suggestion Failed', description: 'Could not get AI suggestions.', variant: 'destructive' });
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Dialog open={isSaveOpen} onOpenChange={setSaveOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" disabled={disabled}><Save className="mr-2 h-4 w-4" /> Save Current</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Save Preset</DialogTitle></DialogHeader>
            <Input
              placeholder="Enter preset name..."
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
            />
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
              <Button onClick={handleSavePreset}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isSuggestOpen} onOpenChange={setSuggestOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" disabled={disabled}><Wand2 className="mr-2 h-4 w-4" /> Suggest</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Suggest Presets with AI</DialogTitle></DialogHeader>
            <Input
              placeholder="e.g., 'calm, relaxing piano music'"
              value={suggestionDescription}
              onChange={(e) => setSuggestionDescription(e.target.value)}
            />
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
              <Button onClick={handleSuggestPresets} disabled={isSuggesting}>
                {isSuggesting ? 'Suggesting...' : 'Get Suggestions'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-48 rounded-md border p-2">
        {presets.length > 0 ? (
          <div className="space-y-1">
            {presets.map(preset => (
              <div key={preset.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted group">
                <button onClick={() => onLoadPreset(preset.parameters)} className="text-left flex-grow truncate" disabled={disabled}>
                  {preset.name}
                </button>
                {!preset.id.startsWith('default-') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeletePreset(preset.id)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">No presets saved.</div>
        )}
      </ScrollArea>
    </div>
  );
}
