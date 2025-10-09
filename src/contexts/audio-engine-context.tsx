
'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { WorkerSettings, Score, InstrumentPart, BassInstrument, MelodyInstrument, AccompanimentInstrument, BassTechnique, TextureSettings, ScoreName, Note, ChordSampleNote } from '@/types/music';
import { DrumMachine } from '@/lib/drum-machine';
import { SamplerPlayer } from '@/lib/sampler-player';
import { ViolinSamplerPlayer } from '@/lib/violin-sampler-player';
import { FluteSamplerPlayer } from '@/lib/flute-sampler-player';
import { AcousticGuitarChordSamplerPlayer } from '@/lib/acoustic-guitar-sampler-player';
import { AccompanimentSynthManager } from '@/lib/accompaniment-synth-manager';
import { BassSynthManager } from '@/lib/bass-synth-manager';
import { SparklePlayer } from '@/lib/sparkle-player';
import { PadPlayer } from '@/lib/pad-player';
import { getPresetParams } from "@/lib/presets";
import { PIANO_SAMPLES, VIOLIN_SAMPLES, FLUTE_SAMPLES, ACOUSTIC_GUITAR_CHORD_SAMPLES } from '@/lib/samples';
import { AcousticGuitarSampler } from '@/lib/acoustic-guitar-sampler';

// --- Type Definitions ---
type WorkerMessage = {
    type: 'score' | 'error' | 'debug' | 'sparkle' | 'pad';
    score?: Score;
    error?: string;
    message?: string;
    data?: any;
    padName?: string;
    time?: number;
};

// --- Constants ---
const VOICE_BALANCE = {
  bass: 1.0, melody: 0.7, accompaniment: 0.6, drums: 0.8,
  effects: 0.6, sparkles: 0.35, pads: 0.9, piano: 1.0, violin: 0.8, flute: 0.8, acousticGuitar: 0.45,
  acousticGuitarSolo: 0.9,
};

const EQ_FREQUENCIES = [60, 125, 250, 500, 1000, 2000, 4000];

const isMobile = () => typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// --- React Context ---
interface AudioEngineContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  isPlaying: boolean;
  initialize: () => Promise<boolean>;
  setIsPlaying: (playing: boolean) => void;
  updateSettings: (settings: Partial<WorkerSettings>) => void;
  setVolume: (part: InstrumentPart, volume: number) => void;
  setInstrument: (part: 'bass' | 'melody' | 'accompaniment', name: BassInstrument | MelodyInstrument | AccompanimentInstrument) => void;
  setBassTechnique: (technique: BassTechnique) => void;
  setTextureSettings: (settings: TextureSettings) => void;
  setEQGain: (bandIndex: number, gain: number) => void;
  startMasterFadeOut: (durationInSeconds: number) => void;
  cancelMasterFadeOut: () => void;
}

const AudioEngineContext = createContext<AudioEngineContextType | null>(null);

export const useAudioEngine = () => {
  const context = useContext(AudioEngineContext);
  if (!context) {
    throw new Error('useAudioEngine must be used within an AudioEngineProvider');
  }
  return context;
};

// --- Provider Component ---
export const AudioEngineProvider = ({ children }: { children: React.ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthPoolRef = useRef<AudioWorkletNode[]>([]);
  const nextVoiceRef = useRef(0);
  const settingsRef = useRef<WorkerSettings | null>(null);
  
  const drumMachineRef = useRef<DrumMachine | null>(null);
  const accompanimentManagerRef = useRef<AccompanimentSynthManager | null>(null);
  const bassManagerRef = useRef<BassSynthManager | null>(null);
  const sparklePlayerRef = useRef<SparklePlayer | null>(null);
  const padPlayerRef = useRef<PadPlayer | null>(null);
  const samplerPlayerRef = useRef<SamplerPlayer | null>(null);
  const violinSamplerPlayerRef = useRef<ViolinSamplerPlayer | null>(null);
  const fluteSamplerPlayerRef = useRef<FluteSamplerPlayer | null>(null);
  const acousticGuitarChordSamplerPlayerRef = useRef<AcousticGuitarChordSamplerPlayer | null>(null);
  const acousticGuitarSoloSamplerRef = useRef<AcousticGuitarSampler | null>(null);


  const masterGainNodeRef = useRef<GainNode | null>(null);
  const gainNodesRef = useRef<Record<InstrumentPart, GainNode | null>>({
    bass: null, melody: null, accompaniment: null, effects: null, drums: null, sparkles: null, pads: null, piano: null, violin: null, flute: null, acousticGuitar: null, acousticGuitarSolo: null,
  });

  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  
  const { toast } = useToast();
  
  const setInstrumentCallback = useCallback((part: 'bass' | 'melody' | 'accompaniment', name: BassInstrument | MelodyInstrument | AccompanimentInstrument) => {
    if (!settingsRef.current) return;
    
    const instrumentSettings = settingsRef.current.instrumentSettings;

    if (part === 'accompaniment') {
        accompanimentManagerRef.current?.setPreset('none');
        if (name === 'violin') violinSamplerPlayerRef.current?.setVolume(instrumentSettings.accompaniment.volume);
        else if (name === 'piano') samplerPlayerRef.current?.setVolume(instrumentSettings.accompaniment.volume);
        else if (name === 'flute') fluteSamplerPlayerRef.current?.setVolume(instrumentSettings.accompaniment.volume);
        else if (name === 'acousticGuitar') acousticGuitarChordSamplerPlayerRef.current?.setVolume(instrumentSettings.accompaniment.volume);
        else if (name === 'acousticGuitarSolo') acousticGuitarSoloSamplerRef.current?.setVolume(instrumentSettings.accompaniment.volume);
        else accompanimentManagerRef.current?.setPreset(name as MelodyInstrument);
    }
    if (part === 'bass') {
        bassManagerRef.current?.setPreset('none');
        if (name === 'violin') violinSamplerPlayerRef.current?.setVolume(instrumentSettings.bass.volume);
        else if (name === 'piano') samplerPlayerRef.current?.setVolume(instrumentSettings.bass.volume);
        else if (name === 'flute') fluteSamplerPlayerRef.current?.setVolume(instrumentSettings.bass.volume);
        else if (name === 'acousticGuitarSolo') {
            acousticGuitarSoloSamplerRef.current?.setVolume(instrumentSettings.bass.volume);
        } else {
             bassManagerRef.current?.setPreset(name as BassInstrument);
        }
    }
     if (part === 'melody') {
        if (name === 'violin') violinSamplerPlayerRef.current?.setVolume(instrumentSettings.melody.volume);
        else if (name === 'piano') samplerPlayerRef.current?.setVolume(instrumentSettings.melody.volume);
        else if (name === 'flute') fluteSamplerPlayerRef.current?.setVolume(instrumentSettings.melody.volume);
        else if (name === 'acousticGuitarSolo') {
            acousticGuitarSoloSamplerRef.current?.setVolume(instrumentSettings.melody.volume);
        }
    }

    // This part is crucial, we update the settingsRef immediately
    // so that the next call to updateSettings in the main hook sends the correct data.
    const newInstrumentSettings = {
        ...settingsRef.current.instrumentSettings,
        [part]: { ...settingsRef.current.instrumentSettings[part], name }
    };
    settingsRef.current.instrumentSettings = newInstrumentSettings;
     // We don't call updateSettings here, as it's handled by the main hook's useEffect
  }, []);

  const scheduleScore = useCallback((score: Score, audioContext: AudioContext) => {
    console.log(`[AudioEngine] Received score. Bass: ${score.bass?.length || 0}, Melody: ${score.melody?.length || 0}, Accomp: ${score.accompaniment?.length || 0}, Drums: ${score.drums?.length || 0}`);
    console.time('scheduleScore');

    const now = audioContext.currentTime;
    const currentSettings = settingsRef.current;
    
    if (!currentSettings) return;

    // Handle "Composer Controls Instruments" for fractal style
    if (score.instrumentHints && currentSettings.score === 'fractal' && currentSettings.composerControlsInstruments) {
        if (score.instrumentHints.bass) setInstrumentCallback('bass', score.instrumentHints.bass);
        if (score.instrumentHints.melody) setInstrumentCallback('melody', score.instrumentHints.melody);
        if (score.instrumentHints.accompaniment) setInstrumentCallback('accompaniment', score.instrumentHints.accompaniment);
    }

    // Bass
    const bassScore = score.bass || [];
    if (bassScore.length > 0 && currentSettings.instrumentSettings.bass.name !== 'none') {
        const instrumentName = currentSettings.instrumentSettings.bass.name;
        if (instrumentName === 'piano' && samplerPlayerRef.current) {
            samplerPlayerRef.current.schedule('piano', bassScore, now);
        } else if (instrumentName === 'violin' && violinSamplerPlayerRef.current) {
            violinSamplerPlayerRef.current.schedule(bassScore, now);
        } else if (instrumentName === 'flute' && fluteSamplerPlayerRef.current) {
            fluteSamplerPlayerRef.current.schedule(bassScore, now);
        } else if (instrumentName === 'acousticGuitarSolo' && acousticGuitarSoloSamplerRef.current) {
            console.log('[AudioEngine] Scheduling BASS for AcousticGuitarSampler (Solo)');
            acousticGuitarSoloSamplerRef.current.schedule(bassScore, now);
        } else if (bassManagerRef.current) {
            bassManagerRef.current.schedule(bassScore, now);
        }
    }
    
    // Melody
    const melodyScore = score.melody || [];
    if (melodyScore.length > 0 && currentSettings.instrumentSettings.melody.name !== 'none') {
        const instrumentName = currentSettings.instrumentSettings.melody.name;
        if (instrumentName === 'piano' && samplerPlayerRef.current) {
            samplerPlayerRef.current.schedule('piano', melodyScore, now);
        } else if (instrumentName === 'violin' && violinSamplerPlayerRef.current) {
            violinSamplerPlayerRef.current.schedule(melodyScore, now);
        } else if (instrumentName === 'flute' && fluteSamplerPlayerRef.current) {
            fluteSamplerPlayerRef.current.schedule(melodyScore, now);
        } else if (instrumentName === 'acousticGuitarSolo' && acousticGuitarSoloSamplerRef.current) {
            console.log('[AudioEngine] Scheduling MELODY for AcousticGuitarSampler (Solo)');
            acousticGuitarSoloSamplerRef.current.schedule(melodyScore, now);
        } else {
            const gainNode = gainNodesRef.current.melody;
            if (gainNode) {
                melodyScore.forEach(note => {
                    const voice = synthPoolRef.current[nextVoiceRef.current++ % synthPoolRef.current.length];
                    if (voice) {
                        const params = getPresetParams(instrumentName, note);
                        if (!params) return;
                        voice.disconnect();
                        voice.connect(gainNode);
                        const noteOnTime = now + note.time;
                        voice.port.postMessage({ ...params, type: 'noteOn', when: noteOnTime });
                        const noteOffTime = noteOnTime + note.duration;
                        const delayUntilOff = (noteOffTime - audioContext.currentTime) * 1000;
                        setTimeout(() => voice.port.postMessage({ type: 'noteOff', release: params.release }), Math.max(0, delayUntilOff));
                    }
                });
            }
        }
    }
    
    // Accompaniment
    const accompanimentScore = score.accompaniment || [];
    const accompanimentChord = score.accompanimentChord;

    if (currentSettings.instrumentSettings.accompaniment.name !== 'none') {
        const instrumentName = currentSettings.instrumentSettings.accompaniment.name;
        if (instrumentName === 'acousticGuitar' && accompanimentChord && acousticGuitarChordSamplerPlayerRef.current) {
            acousticGuitarChordSamplerPlayerRef.current.schedule('acousticGuitar', accompanimentChord, now);
        } else if (accompanimentScore.length > 0) {
            if (instrumentName === 'piano' && samplerPlayerRef.current) {
                samplerPlayerRef.current.schedule('piano', accompanimentScore, now);
            } else if (instrumentName === 'violin' && violinSamplerPlayerRef.current) {
                violinSamplerPlayerRef.current.schedule(accompanimentScore, now);
            } else if (instrumentName === 'flute' && fluteSamplerPlayerRef.current) {
                fluteSamplerPlayerRef.current.schedule(accompanimentScore, now);
            } else if (instrumentName === 'acousticGuitarSolo' && acousticGuitarSoloSamplerRef.current) {
              acousticGuitarSoloSamplerRef.current.schedule(accompanimentScore, now);
            } else if (accompanimentManagerRef.current) {
                accompanimentManagerRef.current.schedule(accompanimentScore, now);
            }
        }
    }

    // Drums
    const drumScore = score.drums || [];
    if (drumScore.length > 0 && drumMachineRef.current && currentSettings.drumSettings.enabled) {
        drumMachineRef.current.schedule(drumScore, now);
    }

    // Effects
    const effectsScore = score.effects || [];
    if (effectsScore.length > 0 && currentSettings) {
        const gainNode = gainNodesRef.current.effects;
        if (gainNode) {
            effectsScore.forEach(note => {
                 const voice = synthPoolRef.current[nextVoiceRef.current++ % synthPoolRef.current.length];
                 if(voice) {
                     const noteAsMidi: Note = { midi: new (require('tone').Frequency)(note.note).toMidi(), time: note.time, duration: 0.5, velocity: note.velocity };
                     const params = getPresetParams(note.note as InstrumentType, noteAsMidi);
                     if (!params) return;
                     voice.disconnect();
                     voice.connect(gainNode);
                     const noteOnTime = now + note.time;
                     const noteOffTime = noteOnTime + 0.5; // Fixed duration for effects
                     
                     voice.port.postMessage({ ...params, type: 'noteOn', when: noteOnTime });
                     const delayUntilOff = (noteOffTime - audioContext.currentTime) * 1000;
                     setTimeout(() => voice.port.postMessage({ type: 'noteOff', release: params.release }), Math.max(0, delayUntilOff));
                 }
            });
        }
    }


    console.timeEnd('scheduleScore');
  }, [setInstrumentCallback]);

  const initialize = useCallback(async () => {
    if (isInitialized || isInitializing) return true;
    
    setIsInitializing(true);
    
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                 sampleRate: isMobile() ? 44100 : 44100, latencyHint: 'interactive'
            });
        }

        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

        const context = audioContextRef.current;
        
        if (!masterGainNodeRef.current) {
            masterGainNodeRef.current = context.createGain();
            const eqChain: BiquadFilterNode[] = EQ_FREQUENCIES.map((freq, i) => {
                const filter = context.createBiquadFilter();
                filter.type = (i === 0) ? 'lowshelf' : (i === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking');
                filter.frequency.value = freq;
                filter.Q.value = 1.0;
                filter.gain.value = 0;
                return filter;
            });
            eqChain.forEach((filter, i) => {
              if (i < eqChain.length - 1) filter.connect(eqChain[i+1]);
            });
            eqChain[eqChain.length - 1].connect(context.destination);
            eqNodesRef.current = eqChain;
            masterGainNodeRef.current.connect(eqChain[0]);
        }

        if (!gainNodesRef.current.bass) {
            const parts: InstrumentPart[] = ['bass', 'melody', 'accompaniment', 'effects', 'drums', 'sparkles', 'pads', 'piano', 'violin', 'flute', 'acousticGuitar', 'acousticGuitarSolo'];
            parts.forEach(part => {
                gainNodesRef.current[part] = context.createGain();
                gainNodesRef.current[part]!.connect(masterGainNodeRef.current!);
            });
        }

        const initPromises: Promise<any>[] = [];
        if (!drumMachineRef.current) {
            drumMachineRef.current = new DrumMachine(context, gainNodesRef.current.drums!);
            initPromises.push(drumMachineRef.current.init());
        }
        if (!samplerPlayerRef.current) {
            samplerPlayerRef.current = new SamplerPlayer(context, gainNodesRef.current.piano!);
            initPromises.push(samplerPlayerRef.current.loadInstrument('piano', PIANO_SAMPLES));
        }
        if (!violinSamplerPlayerRef.current) {
            violinSamplerPlayerRef.current = new ViolinSamplerPlayer(context, gainNodesRef.current.violin!);
            initPromises.push(violinSamplerPlayerRef.current.loadInstrument('violin', VIOLIN_SAMPLES));
        }
        if (!fluteSamplerPlayerRef.current) {
            fluteSamplerPlayerRef.current = new FluteSamplerPlayer(context, gainNodesRef.current.flute!);
            initPromises.push(fluteSamplerPlayerRef.current.loadInstrument('flute', FLUTE_SAMPLES));
        }
        if (!acousticGuitarChordSamplerPlayerRef.current) {
            acousticGuitarChordSamplerPlayerRef.current = new AcousticGuitarChordSamplerPlayer(context, gainNodesRef.current.acousticGuitar!);
            initPromises.push(acousticGuitarChordSamplerPlayerRef.current.loadInstrument('acousticGuitar', ACOUSTIC_GUITAR_CHORD_SAMPLES));
        }
        if (!acousticGuitarSoloSamplerRef.current) {
            console.log('[AudioEngine] Initializing AcousticGuitarSampler (Solo)...');
            acousticGuitarSoloSamplerRef.current = new AcousticGuitarSampler(context);
            acousticGuitarSoloSamplerRef.current.output.connect(gainNodesRef.current.acousticGuitarSolo!);
            initPromises.push(acousticGuitarSoloSamplerRef.current.init());
        }
        if (!accompanimentManagerRef.current) {
            accompanimentManagerRef.current = new AccompanimentSynthManager(context, gainNodesRef.current.accompaniment!);
            initPromises.push(accompanimentManagerRef.current.init());
        }
        if (!bassManagerRef.current) {
            bassManagerRef.current = new BassSynthManager(context, gainNodesRef.current.bass!);
            initPromises.push(bassManagerRef.current.init());
        }
        if (!sparklePlayerRef.current) {
            sparklePlayerRef.current = new SparklePlayer(context, gainNodesRef.current.sparkles!);
            initPromises.push(sparklePlayerRef.current.init());
        }
        if (!padPlayerRef.current) {
            padPlayerRef.current = new PadPlayer(context, gainNodesRef.current.pads!);
            initPromises.push(padPlayerRef.current.init());
        }

        if (!workerRef.current) {
            const worker = new Worker(new URL('../lib/ambient.worker.ts', import.meta.url), { type: 'module' });
            worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
                const now = audioContextRef.current?.currentTime ?? 0;
                const scheduleTime = event.data.time ? now + event.data.time : now;

                if (event.data.type === 'score' && event.data.score) scheduleScore(event.data.score, context);
                else if (event.data.type === 'sparkle') sparklePlayerRef.current?.playRandomSparkle(scheduleTime);
                else if (event.data.type === 'pad' && event.data.padName) padPlayerRef.current?.setPad(event.data.padName, scheduleTime);
                else if (event.data.type === 'error') toast({ variant: "destructive", title: "Worker Error", description: event.data.error });
            };
            workerRef.current = worker;
        }
        
        if(synthPoolRef.current.length === 0) {
            initPromises.push(context.audioWorklet.addModule('/worklets/synth-processor.js').then(() => {
                const numVoices = isMobile() ? 4 : 8;
                synthPoolRef.current = Array.from({ length: numVoices }, () => new AudioWorkletNode(context, 'synth-processor'));
            }));
        }
        
        await Promise.all(initPromises);

        setIsInitialized(true);
        return true;
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        toast({ variant: "destructive", title: "Audio Initialization Error", description: `Could not start audio: ${errorMessage}`});
        console.error(e);
        return false;
    } finally {
        setIsInitializing(false);
    }
  }, [isInitialized, isInitializing, toast, scheduleScore, setInstrumentCallback]);

  const stopAllSounds = useCallback(() => {
    accompanimentManagerRef.current?.allNotesOff();
    bassManagerRef.current?.allNotesOff();
    padPlayerRef.current?.stop();
    samplerPlayerRef.current?.stopAll();
    violinSamplerPlayerRef.current?.stopAll();
    fluteSamplerPlayerRef.current?.stopAll();
    acousticGuitarChordSamplerPlayerRef.current?.stopAll();
    acousticGuitarSoloSamplerRef.current?.stopAll();
  }, []);
  
  const setIsPlayingCallback = useCallback((playing: boolean) => {
    setIsPlaying(playing);
    if (!isInitialized || !workerRef.current || !audioContextRef.current) return;
    if (playing) {
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        workerRef.current.postMessage({ command: 'start' });
    } else {
        stopAllSounds();
        workerRef.current.postMessage({ command: 'stop' });
    }
  }, [isInitialized, stopAllSounds]);

  const updateSettingsCallback = useCallback((settings: Partial<WorkerSettings>) => {
     if (!isInitialized || !workerRef.current) return;
     const newSettings = { ...settingsRef.current, ...settings } as WorkerSettings;
     settingsRef.current = newSettings;
     workerRef.current.postMessage({ command: 'update_settings', data: newSettings });
  }, [isInitialized]);

  const setVolumeCallback = useCallback((part: InstrumentPart, volume: number) => {
    const gainNode = gainNodesRef.current[part];
    if (gainNode) {
        let balancedVolume = volume * (VOICE_BALANCE[part as keyof typeof VOICE_BALANCE] ?? 1);
        if (part === 'acousticGuitar') {
            balancedVolume /= 2;
        }
        gainNode.gain.setTargetAtTime(balancedVolume, audioContextRef.current?.currentTime ?? 0, 0.01);
    }
  }, []);

  const setBassTechniqueCallback = useCallback((technique: BassTechnique) => {
    bassManagerRef.current?.setTechnique(technique);
     if (settingsRef.current) {
      const newSettings = {...settingsRef.current, instrumentSettings: {...settingsRef.current.instrumentSettings, bass: {...settingsRef.current.instrumentSettings.bass, technique}}};
      updateSettingsCallback(newSettings);
    }
  }, [updateSettingsCallback]);

  const setTextureSettingsCallback = useCallback((settings: TextureSettings) => {
    sparklePlayerRef.current?.setVolume(settings.sparkles.volume);
    padPlayerRef.current?.setVolume(settings.pads.volume);
    if (settingsRef.current) {
        const newSettings = {...settingsRef.current, textureSettings: { sparkles: { enabled: settings.sparkles.enabled }, pads: { enabled: settings.pads.enabled }}};
        updateSettingsCallback(newSettings);
    }
  }, [updateSettingsCallback]);

  const setEQGainCallback = useCallback((bandIndex: number, gain: number) => {
      const filterNode = eqNodesRef.current[bandIndex];
      if (filterNode && audioContextRef.current) {
          filterNode.gain.setTargetAtTime(gain, audioContextRef.current.currentTime, 0.01);
      }
  }, []);

  const startMasterFadeOut = useCallback((durationInSeconds: number) => {
      if (masterGainNodeRef.current && audioContextRef.current) {
          masterGainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + durationInSeconds);
      }
  }, []);

  const cancelMasterFadeOut = useCallback(() => {
      if (masterGainNodeRef.current && audioContextRef.current) {
          masterGainNodeRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime);
          masterGainNodeRef.current.gain.linearRampToValueAtTime(1, audioContextRef.current.currentTime + 0.5);
      }
  }, []);

  return (
    <AudioEngineContext.Provider value={{
        isInitialized, isInitializing, isPlaying, initialize,
        setIsPlaying: setIsPlayingCallback, updateSettings: updateSettingsCallback,
        setVolume: setVolumeCallback, setInstrument: setInstrumentCallback,
        setBassTechnique: setBassTechniqueCallback, setTextureSettings: setTextureSettingsCallback,
        setEQGain: setEQGainCallback, startMasterFadeOut, cancelMasterFadeOut,
    }}>
      {children}
    </AudioEngineContext.Provider>
  );
};
