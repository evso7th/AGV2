
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
                }
                this.scheduledTimeouts.delete(timeoutId);
            }, delayUntilOff);
            this.scheduledTimeouts.add(timeoutId);
        }
    }

    public setPreset(instrumentName: BassInstrument) {
        console.log(`[BassSynthManager] setPreset called with: ${instrumentName}. This is now a no-op for parameter setting, as it's technique-driven.`);
        if (instrumentName === 'none' && this.workletNode) {
             this.workletNode.port.postMessage({ type: 'noteOff' });
        }
    }

    public setTechnique(technique: BassTechnique) {
        if (!this.workletNode) return;
        
        const params = TECHNIQUE_PRESETS[technique as keyof typeof TECHNIQUE_PRESETS] || TECHNIQUE_PRESETS['pluck'];
        
        const parameterMap = {
            'cutoff': params.cutoff,
            'resonance': params.resonance,
            'distortion': params.distortion,
            'portamento': params.portamento,
        };

        for(const [name, value] of Object.entries(parameterMap)) {
            const param = this.workletNode.parameters.get(name);
            if (param && isFinite(value)) {
                param.setTargetAtTime(value, this.audioContext.currentTime, 0.02);
            }
        }
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
