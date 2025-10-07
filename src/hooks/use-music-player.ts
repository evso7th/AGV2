"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import type { MusicParameters } from '@/types';
import { Scale } from 'tonal';

type Instrument = Tone.Synth | Tone.FMSynth | Tone.AMSynth | Tone.MetalSynth | Tone.MembraneSynth;

export function useMusicPlayer(initialParams: MusicParameters) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [params, setParams] = useState<MusicParameters>(initialParams);

  const synth = useRef<Instrument | null>(null);
  const pattern = useRef<Tone.Pattern | null>(null);
  const distortion = useRef<Tone.Distortion | null>(null);
  const reverb = useRef<Tone.Reverb | null>(null);

  const createSynth = useCallback((instrument: string): Instrument => {
    switch (instrument) {
      case 'FMSynth': return new Tone.FMSynth();
      case 'AMSynth': return new Tone.AMSynth();
      case 'MetalSynth': return new Tone.MetalSynth();
      case 'MembraneSynth': return new Tone.MembraneSynth();
      default: return new Tone.Synth();
    }
  }, []);

  useEffect(() => {
    distortion.current = new Tone.Distortion(0.1).toDestination();
    reverb.current = new Tone.Reverb(1.5).connect(distortion.current);

    const newSynth = createSynth(params.instrument);
    newSynth.connect(reverb.current);
    synth.current = newSynth;
    
    return () => {
      synth.current?.dispose();
      distortion.current?.dispose();
      reverb.current?.dispose();
    };
  }, [params.instrument, createSynth]);

  useEffect(() => {
    if (!synth.current) return;

    Tone.Transport.bpm.value = params.tempo;

    if (pattern.current) {
      pattern.current.dispose();
    }
    
    const notes = Scale.get(params.scale).notes.map(note => `${note}4`);

    pattern.current = new Tone.Pattern((time, note) => {
      if (Math.random() < params.noteDensity) {
        synth.current?.triggerAttackRelease(note, '8n', time);
        Tone.Draw.schedule(() => {
          setCurrentNote(note);
        }, time);
      }
    }, notes, params.pattern as any);
    
    pattern.current.start(0);

    if (isPlaying) {
      Tone.Transport.start();
    }

    return () => {
      pattern.current?.dispose();
    };
  }, [params, isPlaying]);


  const play = useCallback(async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    Tone.Transport.start();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    Tone.Transport.pause();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    Tone.Transport.stop();
    setCurrentNote(null);
    setIsPlaying(false);
  }, []);

  const updateParameters = useCallback((newParams: Partial<MusicParameters>) => {
    setParams(prev => ({...prev, ...newParams}));
  }, []);

  return { isPlaying, play, pause, stop, updateParameters, currentNote, parameters: params };
}
