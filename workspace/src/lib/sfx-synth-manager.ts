
import type { FractalEvent } from '@/types/fractal';

export class SfxSynthManager {
    private context: AudioContext;
    private destination: GainNode;
    private workletNode: AudioWorkletNode | null = null;
    private isReady = false;

    constructor(context: AudioContext, destination: GainNode) {
        this.context = context;
        this.destination = destination;
    }

    public async init(): Promise<void> {
        if (this.isReady) return;
        
        if (!this.context.audioWorklet) {
            const errorMsg = 'AudioWorklet is not supported in this browser.';
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        try {
            await this.context.audioWorklet.addModule('/worklets/sfx-processor.js');
            this.workletNode = new AudioWorkletNode(this.context, 'sfx-processor', { outputChannelCount: [2] });
            this.workletNode.connect(this.destination);
            this.isReady = true;
            console.log('[SFX] Synth Manager initialized and ready.');
        } catch (error) {
            console.error('[SFX] Error initializing SFX Synth Manager:', error);
            throw error;
        }
    }

    public trigger(events: FractalEvent[], barStartTime: number, tempo: number): void {
        if (!this.isReady || !this.workletNode) {
             console.warn('[SFX] Trigger called but not ready.');
            return;
        }

        const beatDuration = 60 / tempo;
        const messages: any[] = [];

        events.forEach(event => {
            if (event.type !== 'sfx') return;

            const noteOnTime = barStartTime + (event.time * beatDuration);
            const noteOffTime = noteOnTime + (event.duration * beatDuration);
            const noteId = `${noteOnTime.toFixed(4)}-${event.params?.startFreq || event.note}`;

            messages.push({
                type: 'noteOn',
                when: noteOnTime,
                noteId,
                params: event.params
            });
            messages.push({
                type: 'noteOff',
                noteId,
                when: noteOffTime
            });
        });
        
        if (messages.length > 0) {
            console.log(`[SFX] Triggering effect phrase with ${events.filter(e=>e.type === 'sfx').length} notes.`);
            this.workletNode.port.postMessage(messages);
        }
    }

    public isSynthReady(): boolean {
        return this.isReady;
    }
}

    
    