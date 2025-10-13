
import type { BassInstrument, BassTechnique } from "@/types/music";
import type { FractalEvent } from '@/types/fractal';

function midiToFreq(midi: number): number {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

/**
 * A dead-simple bass synth manager.
 * Its only job is to receive a score and schedule noteOn/noteOff messages to the worklet.
 */
export class BassSynthManager {
    private audioContext: AudioContext;
    private workletNode: AudioWorkletNode | null = null;
    private outputNode: GainNode;
    public isInitialized = false;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.outputNode = this.audioContext.createGain();
        this.outputNode.connect(destination);
    }

    async init() {
        if (this.isInitialized) return;
        try {
            await this.audioContext.audioWorklet.addModule('/worklets/bass-processor.js');
            this.workletNode = new AudioWorkletNode(this.audioContext, 'bass-processor', {
                processorOptions: {
                    sampleRate: this.audioContext.sampleRate
                }
            });
            this.workletNode.connect(this.outputNode);
            this.isInitialized = true;
            console.log('[BassSynthManager] "Пароходная труба" инициализирована.');
        } catch (e) {
            console.error('[BassSynthManager] Ошибка инициализации ворклета:', e);
        }
    }

    public setVolume(volume: number) {
        if(this.outputNode.gain){
            this.outputNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
        }
    }

    public play(events: FractalEvent[], barStartTime: number) {
        if (!this.workletNode || !this.isInitialized || events.length === 0) {
            if (!this.isInitialized) console.warn('[BassMan] Attempted to play before initialized.');
            return;
        }
        
        events.forEach(event => {
            const frequency = midiToFreq(event.note);
            if (!isFinite(frequency)) {
                console.error(`[BassMan] Invalid frequency for MIDI note ${event.note}`);
                return;
            }

            const absoluteOnTime = barStartTime + event.time;
            const absoluteOffTime = absoluteOnTime + event.duration;
            
            // Schedule the note ON
            this.workletNode!.port.postMessage({
                type: 'noteOn',
                frequency: frequency,
                velocity: event.weight, // Use weight as velocity
                when: absoluteOnTime,
                noteId: event.note 
            });

            // Schedule the note OFF
            this.workletNode!.port.postMessage({
                type: 'noteOff',
                noteId: event.note,
                when: absoluteOffTime
            });
        });
    }

    // --- Stub methods for API compatibility ---
    public setPreset(instrumentName: BassInstrument) {
        // No-op in this simple version
    }

    public setTechnique(technique: BassTechnique) {
        // No-op in this simple version
    }

    public allNotesOff() {
        this.stop();
    }

    public stop() {
        if (this.workletNode) {
            this.workletNode.port.postMessage({ type: 'clear' });
            console.log('[BassMan] Отправлена команда "clear" в ворклет.');
        }
    }

    public dispose() {
        this.stop();
        this.workletNode?.disconnect();
    }
}
