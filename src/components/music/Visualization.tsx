"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VisualizationProps {
  currentNote: string | null;
}

const NOTE_COLORS: Record<string, string> = {
  'C': 'bg-red-500',
  'D': 'bg-orange-500',
  'E': 'bg-yellow-500',
  'F': 'bg-green-500',
  'G': 'bg-cyan-500',
  'A': 'bg-blue-500',
  'B': 'bg-purple-500',
};

export default function Visualization({ currentNote }: VisualizationProps) {
  const [pulse, setPulse] = useState(false);
  const [noteColor, setNoteColor] = useState('bg-accent');

  useEffect(() => {
    if (currentNote) {
      setPulse(true);
      const baseNote = currentNote.charAt(0);
      setNoteColor(NOTE_COLORS[baseNote] || 'bg-accent');
      const timer = setTimeout(() => setPulse(false), 200);
      return () => clearTimeout(timer);
    }
  }, [currentNote]);

  return (
    <div className="w-full h-64 lg:h-96 bg-card border rounded-lg flex items-center justify-center overflow-hidden relative shadow-inner">
      <div
        className={cn(
          "rounded-full transition-all duration-200 ease-out",
          pulse ? "w-32 h-32 opacity-70" : "w-8 h-8 opacity-50",
          noteColor
        )}
      />
      <div className="absolute top-4 left-4 text-xs font-mono text-muted-foreground">
        NOTE: {currentNote || '...'}
      </div>
    </div>
  );
}
