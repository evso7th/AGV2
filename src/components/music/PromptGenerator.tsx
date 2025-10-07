"use client";

import { useState } from 'react';
import { generateMusicParameters, GenerateMusicParametersInput, GenerateMusicParametersOutput } from '@/ai/flows/generate-music-from-prompt';
import type { MusicParameters } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SCALES, INSTRUMENTS } from '@/lib/music';

interface PromptGeneratorProps {
  onParametersGenerated: (newParams: Partial<MusicParameters>) => void;
  disabled: boolean;
}

export default function PromptGenerator({ onParametersGenerated, disabled }: PromptGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!prompt) {
      toast({ title: 'Prompt is empty', description: 'Please enter a description for the music you want to create.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const input: GenerateMusicParametersInput = { prompt };
      const result: GenerateMusicParametersOutput = await generateMusicParameters(input);
      
      const newParams: Partial<MusicParameters> = {
        tempo: result.tempo,
        scale: SCALES.includes(result.scale) ? result.scale : SCALES[0],
        instrument: INSTRUMENTS.includes(result.instrument) ? result.instrument : INSTRUMENTS[0],
      };

      onParametersGenerated(newParams);
      toast({ title: 'Parameters Generated!', description: 'Your music parameters have been updated.' });
    } catch (error) {
      console.error('Error generating parameters:', error);
      toast({ title: 'Generation Failed', description: 'Could not generate parameters from your prompt. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="e.g., 'a fast-paced, futuristic synth melody in a minor key'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
      />
      <Button onClick={handleSubmit} disabled={isLoading || disabled} className="w-full">
        <Wand2 className="mr-2 h-4 w-4" />
        {isLoading ? 'Generating...' : 'Generate with AI'}
      </Button>
    </div>
  );
}
