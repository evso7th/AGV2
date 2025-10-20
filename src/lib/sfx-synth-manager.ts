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
            this.workletNode = new AudioWorkletNode(this.context, 'sfx-processor');
            this.workletNode.connect(this.destination);
            this.isReady = true;
            console.log('SFX Synth Manager initialized and ready.');
        } catch (error) {
            console.error('Error initializing SFX Synth Manager:', error);
            throw error;
        }
    }

    public trigger(time: number, params?: any): void {
        if (!this.isReady || !this.workletNode) {
            return;
        }
        this.workletNode.port.postMessage({
            type: 'trigger',
            time: time,
            noteParams: params || {}
        });
    }

    public isSynthReady(): boolean {
        return this.isReady;
    }
}
