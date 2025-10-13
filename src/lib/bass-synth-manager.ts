
import type { BassInstrument, BassTechnique } from "@/types/music";
import { TECHNIQUE_PRESETS } from "./bass-presets";
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
        } catch (e) {
            console.error('[BassSynthManager] Failed to init:', e);
        }
    }

    public setVolume(volume: number) {
        if(this.outputNode instanceof GainNode){
            this.outputNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
        }
    }

    public play(events: FractalEvent[], startTime: number) {
        if (!this.workletNode || !this.isInitialized || events.length === 0) {
            return;
        }

        this.stop(); // Clear any previously scheduled notes for this bar

        const scheduleNextNote = (noteIndex: number) => {
            if (noteIndex >= events.length) return;

            const event = events[noteIndex];
            const noteOnTime = startTime + event.time;
            const noteOffTime = noteOnTime + event.duration;
            const delayUntilOn = (noteOnTime - this.audioContext.currentTime) * 1000;

            if (delayUntilOn >= 0) {
                const noteOnTimeout = setTimeout(() => {
                    if (this.workletNode) {
                        const freq = 440 * Math.pow(2, (event.note - 69) / 12);
                         if (isNaN(freq) || !isFinite(freq)) {
                            console.error('[BassSynthManager] Invalid frequency for event:', event);
                            return;
                        }

                        const velocity = event.dynamics === 'p' ? 0.3 : event.dynamics === 'mf' ? 0.6 : 0.9;
                        
                        this.workletNode.port.postMessage({
                            type: 'noteOn',
                            frequency: freq,
                            velocity: velocity,
                            technique: event.technique 
                        });
                    }
                    this.scheduledTimeouts.delete(noteOnTimeout);
                }, delayUntilOn);
                this.scheduledTimeouts.add(noteOnTimeout);
            }

            const delayUntilOff = (noteOffTime - this.audioContext.currentTime) * 1000;
            if (delayUntilOff > 0) {
                const noteOffTimeout = setTimeout(() => {
                    if (this.workletNode && (noteIndex === events.length - 1 || events[noteIndex + 1].time > event.time + event.duration)) {
                       this.workletNode.port.postMessage({ type: 'noteOff' });
                    }
                    this.scheduledTimeouts.delete(noteOffTimeout);
                     // Schedule next note
                    scheduleNextNote(noteIndex + 1);
                }, delayUntilOff);
                this.scheduledTimeouts.add(noteOffTimeout);
            } else {
                 // If the note is already supposed to be over, schedule the next one immediately
                 scheduleNextNote(noteIndex + 1);
            }
        };

        scheduleNextNote(0);
    }


    public setPreset(instrumentName: BassInstrument) {
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
            this.workletNode.port.postMessage({ type: 'noteOff' });
        }
    }

    public dispose() {
        this.stop();
        this.workletNode?.disconnect();
    }
}
