"use client";

import { useMusicPlayer } from '@/hooks/use-music-player';
import Header from './Header';
import Visualization from './Visualization';
import Playback from './Playback';
import Controls from './Controls';
import PromptGenerator from './PromptGenerator';
import Presets from './Presets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { MusicParameters } from '@/types';
import { DEFAULT_PARAMS } from '@/lib/music';

export default function MusicStudio() {
  const { isPlaying, play, pause, stop, updateParameters, currentNote, parameters } = useMusicPlayer(DEFAULT_PARAMS);

  const handleParameterChange = (newParams: Partial<MusicParameters>) => {
    updateParameters(newParams);
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Header />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <Card className="lg:col-span-1 lg:sticky lg:top-8">
          <CardHeader>
            <CardTitle className="font-headline">AI Composer</CardTitle>
          </CardHeader>
          <CardContent>
            <PromptGenerator onParametersGenerated={handleParameterChange} disabled={isPlaying} />
          </CardContent>

          <Separator className="my-4" />

          <CardHeader>
            <CardTitle className="font-headline">Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <Controls parameters={parameters} onParameterChange={handleParameterChange} />
          </CardContent>

          <Separator className="my-4" />
          
          <CardHeader>
            <CardTitle className="font-headline">Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <Presets currentParameters={parameters} onLoadPreset={handleParameterChange} disabled={isPlaying} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Visualization currentNote={currentNote} />
          <Playback isPlaying={isPlaying} onPlay={play} onPause={pause} onStop={stop} />
        </div>
      </div>
    </div>
  );
}
