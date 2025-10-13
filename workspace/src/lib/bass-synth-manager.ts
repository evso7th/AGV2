
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
    private preamp: GainNode; // Pre-amplifier for the bass
    public isInitialized = false;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.outputNode = this.audioContext.createGain();
        
        // Create and connect the preamp
        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 4.5; // Boost volume by 4.5x
        this.preamp.connect(this.outputNode);

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
            // Connect worklet to the preamp, not directly to the output
            this.workletNode.connect(this.preamp);
            this.isInitialized = true;
            console.log('[BassSynthManager] "Пароходная труба" инициализирована и усилена.');
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
        
        const messages = events.map(event => {
            const frequency = midiToFreq(event.note);
            if (!isFinite(frequency)) {
                console.error(`[BassMan] Invalid frequency for MIDI note ${event.note}`);
                return null;
            }

            const absoluteOnTime = barStartTime + event.time;
            const absoluteOffTime = absoluteOnTime + event.duration;
            
            return [
                { type: 'noteOn', frequency, velocity: event.weight, when: absoluteOnTime, noteId: event.note },
                { type: 'noteOff', noteId: event.note, when: absoluteOffTime }
            ];
        }).flat().filter(Boolean);

        if (messages.length > 0) {
            this.workletNode!.port.postMessage(messages);
        }
    }

    // --- Stub methods for API compatibility ---
    public setPreset(instrumentName: BassInstrument) {
        // No-op in this simple version
    }

    public setTechnique(technique: BassTechnique) {
        if (!this.workletNode) return;
        this.workletNode.port.postMessage({ type: 'setTechnique', technique });
    }

    public allNotesOff() {
        this.stop();
    }

    public stop() {
        if (this.workletNode) {
            // Send a single message which is an array of one 'clear' command.
            this.workletNode.port.postMessage([{ type: 'clear' }]);
            console.log('[BassMan] Отправлена команда "clear" в ворклет.');
        }
    }

    public dispose() {
        this.stop();
        this.workletNode?.disconnect();
        this.preamp.disconnect();
        this.outputNode.disconnect();
    }
}
