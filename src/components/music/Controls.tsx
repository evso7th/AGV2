"use client";

import type { MusicParameters } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SCALES, INSTRUMENTS, PATTERNS } from '@/lib/music';

interface ControlsProps {
  parameters: MusicParameters;
  onParameterChange: (newParams: Partial<MusicParameters>) => void;
}

export default function Controls({ parameters, onParameterChange }: ControlsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="tempo">Tempo: {parameters.tempo} BPM</Label>
        <Slider
          id="tempo"
          min={40}
          max={240}
          step={1}
          value={[parameters.tempo]}
          onValueChange={([value]) => onParameterChange({ tempo: value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="note-density">Note Density</Label>
        <Slider
          id="note-density"
          min={0.1}
          max={1}
          step={0.1}
          value={[parameters.noteDensity]}
          onValueChange={([value]) => onParameterChange({ noteDensity: value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="scale">Scale</Label>
        <Select value={parameters.scale} onValueChange={(value) => onParameterChange({ scale: value })}>
          <SelectTrigger id="scale">
            <SelectValue placeholder="Select a scale" />
          </SelectTrigger>
          <SelectContent>
            {SCALES.map(scale => (
              <SelectItem key={scale} value={scale}>{scale}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="instrument">Instrument</Label>
        <Select value={parameters.instrument} onValueChange={(value) => onParameterChange({ instrument: value })}>
          <SelectTrigger id="instrument">
            <SelectValue placeholder="Select an instrument" />
          </SelectTrigger>
          <SelectContent>
            {INSTRUMENTS.map(instrument => (
              <SelectItem key={instrument} value={instrument}>{instrument}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
       <div className="space-y-2">
        <Label htmlFor="pattern">Pattern</Label>
        <Select value={parameters.pattern} onValueChange={(value) => onParameterChange({ pattern: value })}>
          <SelectTrigger id="pattern">
            <SelectValue placeholder="Select a pattern" />
          </SelectTrigger>
          <SelectContent>
            {PATTERNS.map(pattern => (
              <SelectItem key={pattern} value={pattern}>{pattern}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
