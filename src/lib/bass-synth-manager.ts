
import type { BassInstrument, BassTechnique, Mood } from "@/types/music";
import { TECHNIQUE_PRESETS, type BassTechniqueParams } from "./bass-presets";
import type { FractalEvent, Dynamics, Phrasing } from '@/types/fractal';
import { getPresetParams, PRESETS } from "./presets";


export class BassSynthManager {
    private audioContext: AudioContext;
    private workletNode: AudioWorkletNode | null = null;
    private outputNode: GainNode;
    public isInitialized = false;
    private scheduledTimeouts = new Set<NodeJS.Timeout>();
    private currentPreset: BassInstrument = 'glideBass';
    private currentTechnique: BassTechnique = 'portamento';


    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.outputNode = this.audioContext.createGain();
        this.outputNode.connect(destination);
    }

    async init() {
        if (this.isInitialized) return;
        try {
            await this.audioContext.audioWorklet.addModule('/worklets/bass-processor.js');
            this.workletNode = new AudioWorkletNode(this.audioContext, 'bass-processor');
            this.workletNode.connect(this.outputNode);
            this.isInitialized = true;
            // No need to set preset here, it's done per note
        } catch (e) {
            console.error('[BassSynthManager] Failed to initialize:', e);
        }
    }
    
    public setVolume(volume: number) {
        if(this.outputNode instanceof GainNode){
            this.outputNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
        }
    }

    private getParamsForTechnique(
        technique: 'pluck' | 'ghost' | 'slap',
        phrasing: Phrasing,
        dynamics: Dynamics,
        mood: Mood
    ): BassTechniqueParams {
        const baseParams = { ...TECHNIQUE_PRESETS[technique] };

        // Adjust for dynamics
        if (dynamics === 'p') {
            baseParams.distortion *= 0.5;
            baseParams.resonance *= 0.8;
        } else if (dynamics === 'f') {
            baseParams.distortion *= 1.2;
            baseParams.resonance *= 1.1;
        }

        // Adjust for mood
        if (mood === 'dark' || mood === 'melancholic') {
            baseParams.cutoff *= 0.9;
        } else if (mood === 'epic') {
            baseParams.cutoff *= 1.1;
        }
        
        // Handle phrasing
        baseParams.portamento = (phrasing === 'legato' && technique !== 'slap' && technique !== 'ghost') ? 0.03 : 0;
        
        return baseParams;
    }


    public play(event: FractalEvent, startTime: number) {
        if (!this.workletNode || !this.isInitialized) {
            console.warn('[BassSynthManager] Tried to play event before initialized.');
            return;
        }

        const freq = 440 * Math.pow(2, (event.note - 69) / 12);
        if (isNaN(freq) || !isFinite(freq)) {
            console.error('[BassSynthManager] Invalid frequency for event:', event);
            return;
        }

        const noteOnTime = startTime + event.time;
        
        if (!isFinite(noteOnTime)) {
             console.error('[BassSynthManager] Non-finite time scheduled for event:', event);
             return;
        }
        
        const velocity = event.dynamics === 'p' ? 0.3 : event.dynamics === 'mf' ? 0.6 : 0.9;

        const params = this.getParamsForTechnique(event.technique, event.phrasing, event.dynamics, 'melancholic');

        // console.log(`[BassSynthManager] Event: technique=${event.technique}, dynamics=${event.dynamics}. Params: `, params);

        this.workletNode.parameters.get('cutoff')!.setValueAtTime(params.cutoff, noteOnTime);
        this.workletNode.parameters.get('resonance')!.setValueAtTime(params.resonance, noteOnTime);
        this.workletNode.parameters.get('distortion')!.setValueAtTime(params.distortion, noteOnTime);
        this.workletNode.parameters.get('portamento')!.setValueAtTime(params.portamento, noteOnTime);

        this.workletNode.port.postMessage({
            type: 'noteOn',
            frequency: freq,
            velocity: velocity,
            when: noteOnTime
        });

        // Schedule Note Off
        const noteOffTime = noteOnTime + event.duration;
        const delayUntilOff = (noteOffTime - this.audioContext.currentTime) * 1000;
        if (delayUntilOff > 0) {
            const timeoutId = setTimeout(() => {
                if (this.workletNode) {
                    this.workletNode.port.postMessage({ type: 'noteOff' });
                }
                this.scheduledTimeouts.delete(timeoutId);
            }, delayUntilOff);
            this.scheduledTimeouts.add(timeoutId);
        }
    }


    public setPreset(instrumentName: BassInstrument) {
        if (!this.workletNode) return;
        this.currentPreset = instrumentName;
        if (instrumentName === 'none') {
             this.workletNode.port.postMessage({ type: 'noteOff' });
             return;
        };
        // This method is now effectively a no-op for parameter setting,
        // but kept for potential future use or state management.
        console.log(`[BassSynthManager] Preset set to ${instrumentName}. Note: Parameters are now technique-driven.`);
    }

    public setTechnique(technique: BassTechnique) {
        if (!this.workletNode) return;
        this.currentTechnique = technique;
        // This is also largely a no-op now, as technique is per-note.
        // It could set a 'default' or 'fallback' mode if desired.
    }

    public allNotesOff() {
        this.stop();
    }

    public stop() {
        this.scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.scheduledTimeouts.clear();
        
        if (this.workletNode) {
            this.workletNode.port.postMessage({ type: 'noteOff' });
        }
    }

    public dispose() {
        this.stop();
        this.workletNode?.disconnect();
    }
}
