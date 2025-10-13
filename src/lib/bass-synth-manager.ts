
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
            console.log('[BassSynthManager] Initialized.');
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
            if (!this.isInitialized) console.warn('[BassMan] SKIPPING: Not initialized.');
            return;
        }

        this.stop();
        console.log(`[BassMan] Received ${events.length} events to schedule. AudioContext time: ${this.audioContext.currentTime.toFixed(2)}, Bar start time: ${startTime.toFixed(2)}`);

        const scheduleNextNote = (noteIndex: number) => {
            if (noteIndex >= events.length) {
                return; // End of sequence for this bar
            }

            const event = events[noteIndex];
            const noteOnTime = startTime + event.time;
            const noteOffTime = noteOnTime + event.duration;

            const delayUntilOn = (noteOnTime - this.audioContext.currentTime) * 1000;

            console.log(`[BassMan] Planning note ${noteIndex} (MIDI: ${event.note}). Scheduled On: ${noteOnTime.toFixed(2)}. Delay: ${delayUntilOn.toFixed(0)}ms`);

            if (delayUntilOn >= 0) {
                const noteOnTimeout = setTimeout(() => {
                    this.scheduledTimeouts.delete(noteOnTimeout);
                    if (this.workletNode) {
                        const freq = 440 * Math.pow(2, (event.note - 69) / 12);
                        if (isNaN(freq) || !isFinite(freq)) {
                            console.error('[BassMan] Invalid frequency for event:', event);
                            return;
                        }
                        const velocity = event.dynamics === 'p' ? 0.3 : event.dynamics === 'mf' ? 0.6 : 0.9;
                        const message = {
                            type: 'noteOn',
                            frequency: freq,
                            velocity: velocity,
                            technique: event.technique 
                        };
                        console.log(`[BassMan] >>>> SENDING noteOn: MIDI ${event.note}, Freq ${freq.toFixed(2)}`);
                        this.workletNode.port.postMessage(message);
                    }
                }, delayUntilOn);
                this.scheduledTimeouts.add(noteOnTimeout);
            } else {
                 console.warn(`[BassMan] SKIPPING note ${noteIndex} as its start time ${noteOnTime.toFixed(2)} is in the past.`);
            }

            const delayUntilOff = (noteOffTime - this.audioContext.currentTime) * 1000;
             if (delayUntilOff > 0) {
                 const noteOffTimeout = setTimeout(() => {
                    this.scheduledTimeouts.delete(noteOffTimeout);
                    if (this.workletNode) {
                         // Only send noteOff if it's the last note or the next note doesn't immediately start (creating a gap)
                        const nextEvent = events[noteIndex + 1];
                        if (!nextEvent || nextEvent.time > event.time + event.duration) {
                             console.log(`[BassMan] <<<< SENDING noteOff for MIDI ${event.note}`);
                             this.workletNode.port.postMessage({ type: 'noteOff' });
                        }
                    }
                    // Schedule the next note in the sequence
                    scheduleNextNote(noteIndex + 1);
                }, delayUntilOff);
                this.scheduledTimeouts.add(noteOffTimeout);
            } else {
                 // If the note is already supposed to be over, schedule the next one immediately
                 console.warn(`[BassMan] Note ${noteIndex} (MIDI: ${event.note}) duration has already passed. Scheduling next note immediately.`);
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
