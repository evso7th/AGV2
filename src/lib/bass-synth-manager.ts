
import type { BassInstrument, BassTechnique, Mood } from "@/types/music";
import { TECHNIQUE_PRESETS, type BassTechniqueParams } from "./bass-presets";
import type { FractalEvent, Dynamics, Phrasing } from '@/types/fractal';

export class BassSynthManager {
    private audioContext: AudioContext;
    private workletNode: AudioWorkletNode | null = null;
    private outputNode: GainNode;
    public isInitialized = false;
    private scheduledTimeouts = new Set<NodeJS.Timeout>();

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
            console.log('[BassSynthManager] Initialized');
        } catch (e) {
            console.error('[BassSynthManager] Failed to init:', e);
        }
    }

    public setVolume(volume: number) {
        if(this.outputNode instanceof GainNode){
            this.outputNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
        }
    }

    private setParam(name: string, value: number) {
        if (!this.workletNode) return;
        const param = this.workletNode.parameters.get(name);
        if (param && isFinite(value)) {
            // Use setTargetAtTime for smooth transitions
            param.setTargetAtTime(value, this.audioContext.currentTime, 0.01);
        } else if (!param) {
            console.warn(`[BassSynthManager] Parameter "${name}" not found on worklet node.`);
        }
    }
    
    private getParamsForTechnique(
        technique: 'pluck' | 'ghost' | 'slap' | 'pulse',
        phrasing: Phrasing,
        dynamics: Dynamics,
        mood: Mood
    ): BassTechniqueParams {
        const baseParams = { ...(TECHNIQUE_PRESETS[technique] || TECHNIQUE_PRESETS['pluck']) };

        if (dynamics === 'p') {
            baseParams.distortion *= 0.5;
            baseParams.resonance *= 0.8;
        } else if (dynamics === 'f') {
            baseParams.distortion *= 1.2;
            baseParams.resonance *= 1.1;
        }

        if (mood === 'dark' || mood === 'melancholic') {
            baseParams.cutoff *= 0.9;
        } else if (mood === 'epic') {
            baseParams.cutoff *= 1.1;
        }
        
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
        const params = this.getParamsForTechnique(event.technique as any, event.phrasing, event.dynamics, 'melancholic'); 

        // Set parameters on the worklet node's parameters
        this.setParam('cutoff', params.cutoff);
        this.setParam('resonance', params.resonance);
        this.setParam('distortion', params.distortion);
        this.setParam('portamento', params.portamento);
        
        const message = {
            type: 'noteOn',
            frequency: freq,
            velocity: velocity,
            when: noteOnTime,
            technique: event.technique 
        };
        console.log('[BassSynthManager] Posting message to worklet:', message);
        this.workletNode.port.postMessage(message);

        // Schedule Note Off
        const noteOffTime = noteOnTime + event.duration;
        const delayUntilOff = (noteOffTime - this.audioContext.currentTime) * 1000;
        if (delayUntilOff > 0) {
            const timeoutId = setTimeout(() => {
                if (this.workletNode) {
                    this.workletNode.port.postMessage({ type: 'noteOff', when: this.audioContext.currentTime });
                    console.log(`[BassSynthManager] Posting noteOff for freq ${freq} at ${this.audioContext.currentTime}`);
                }
                this.scheduledTimeouts.delete(timeoutId);
            }, delayUntilOff);
            this.scheduledTimeouts.add(timeoutId);
        } else {
             // If the note-off is in the past, send it immediately.
             this.workletNode.port.postMessage({ type: 'noteOff', when: this.audioContext.currentTime });
             console.warn(`[BassSynthManager] Note-off for freq ${freq} was in the past, sending now.`);
        }
    }

    public setPreset(instrumentName: BassInstrument) {
        console.log(`[BassSynthManager] setPreset called with: ${instrumentName}. This is now a no-op for parameter setting, as it's technique-driven.`);
        if (instrumentName === 'none' && this.workletNode) {
             this.workletNode.port.postMessage({ type: 'noteOff' });
        }
    }

    public setTechnique(technique: BassTechnique) {
         console.log(`[BassSynthManager] setTechnique called with: ${technique}. This is a no-op as it's driven by FractalEvent.`);
    }

    public allNotesOff() {
        this.stop();
    }

    public stop() {
        this.scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.scheduledTimeouts.clear();
        
        if (this.workletNode) {
            console.log('[BassSynthManager] Stopping all notes now.');
            this.workletNode.port.postMessage({ type: 'noteOff' });
        }
    }

    public dispose() {
        this.stop();
        this.workletNode?.disconnect();
    }
}
