
import type { BassInstrument, BassTechnique } from "@/types/music";
import { BASS_PRESETS } from "./bass-presets";
import type { FractalEvent } from '@/types/fractal';

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
            this.setPreset('glideBass'); 
            this.setTechnique('arpeggio');
        } catch (e) {
            console.error('[BassSynthManager] Failed to initialize:', e);
        }
    }
    
    public setVolume(volume: number) {
        if(this.outputNode instanceof GainNode){
            this.outputNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
        }
    }

    public play(event: FractalEvent) {
        if (!this.workletNode || !this.isInitialized) {
            console.warn('[BassSynthManager] Tried to play event before initialized.');
            return;
        }

        const freq = 440 * Math.pow(2, (event.note - 69) / 12);
        if (isNaN(freq)) {
            console.error('[BassSynthManager] NaN frequency for event:', event);
            return;
        }

        const velocity = event.dynamics === 'p' ? 0.3 : event.dynamics === 'mf' ? 0.6 : 0.9;
        
        const noteOnTime = event.time;
        const noteOffTime = noteOnTime + event.duration;

        this.workletNode.port.postMessage({
            type: 'noteOn',
            frequency: freq,
            velocity: velocity,
            when: noteOnTime
        });

        // Schedule Note Off
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
        if (!this.workletNode || instrumentName === 'none') {
             if(this.workletNode) this.workletNode.port.postMessage({ type: 'noteOff' });
             return;
        };
        
        const preset = BASS_PRESETS[instrumentName];
        
        if (preset) {
             this.workletNode.port.postMessage({
                type: 'setPreset',
                ...preset
             });
        }
    }

    public setTechnique(technique: BassTechnique) {
        if (!this.workletNode) return;
        this.workletNode.port.postMessage({ type: 'setMode', mode: technique });
    }

    public allNotesOff() {
        this.stop();
    }

    public stop() {
        // Clear all scheduled note-off events
        this.scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.scheduledTimeouts.clear();
        
        // Immediately stop any currently playing note in the worklet
        if (this.workletNode) {
            this.workletNode.port.postMessage({ type: 'noteOff' });
        }
    }

    public dispose() {
        this.stop();
        this.workletNode?.disconnect();
    }
}
