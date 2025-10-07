"use client";

import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';

interface PlaybackProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}

export default function Playback({ isPlaying, onPlay, onPause, onStop }: PlaybackProps) {
  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      {!isPlaying ? (
        <Button onClick={onPlay} size="lg" className="w-32 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Play className="mr-2 h-5 w-5" />
          Play
        </Button>
      ) : (
        <Button onClick={onPause} size="lg" variant="secondary" className="w-32">
          <Pause className="mr-2 h-5 w-5" />
          Pause
        </Button>
      )}
      <Button onClick={onStop} size="lg" variant="outline" className="w-32">
        <Square className="mr-2 h-5 w-5" />
        Stop
      </Button>
    </div>
  );
}
