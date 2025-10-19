
import type { FractalEvent, Note, MelodyInstrument } from "@/types/fractal";
import { PRESETS } from "./presets";
import { getPresetParams } from "./presets";

function midiToFreq(midi: number): number {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

export class AccompanimentSynthManager {
    private audioContext: AudioContext;
    private workletNode: AudioWorkletNode | null = null;
    private destination: AudioNode;
    public isInitialized = false;

    constructor(audioContext: AudioContext, destination: AudioNode) {
        this.audioContext = audioContext;
        this.destination = destination;
    }

    async init() {
        if (this.isInitialized) return;
        try {
            // Path to the generic subtractive synth processor
            await this.audioContext.audioWorklet.addModule('/worklets/bass-processor.js'); 
            this.workletNode = new AudioWorkletNode(this.audioContext, 'bass-processor', {
                processorOptions: { sampleRate: this.audioContext.sampleRate }
            });
            this.workletNode.connect(this.destination);
            this.isInitialized = true;
            console.log('[AccompanimentManager] Initialized with bass-processor worklet.');
        } catch (e) {
            console.error('[AccompanimentManager] Failed to initialize:', e);
        }
    }

    public schedule(events: FractalEvent[], barStartTime: number, tempo: number) {
        if (!this.workletNode || !this.isInitialized || events.length === 0) {
            if (!this.isInitialized) console.warn('[AccompanimentManager] Tried to schedule before initialized.');
            return;
        }

        const beatDuration = 60 / tempo;
        const messages: any[] = [];

        events.forEach(event => {
            const notesToPlay = event.params?.chord ? event.params.chord : [event.note];

            notesToPlay.forEach((midiNote, index) => {
                const frequency = midiToFreq(midiNote);
                if (!isFinite(frequency)) {
                    console.error(`[AccompanimentManager] Invalid frequency for MIDI note ${midiNote}`);
                    return;
                }

                // Apply a small delay for "humanization" if it's a chord
                const humanizationDelay = event.params?.chord ? index * 0.015 : 0;
                const noteOnTime = barStartTime + (event.time * beatDuration) + humanizationDelay;
                const noteOffTime = noteOnTime + (event.duration * beatDuration);

                if (!isFinite(noteOnTime) || !isFinite(noteOffTime)) {
                    console.warn('[AccompanimentManager] Non-finite time in event:', event);
                    return;
                }

                const noteId = `${event.time}-${midiNote}-${index}`;

                console.log(`%c[Accompaniment] Scheduling noteOn: ${midiNote} at beat ${event.time.toFixed(2)} | absolute time: ${noteOnTime.toFixed(4)}`, 'color: #DAA520;');

                messages.push({
                    type: 'noteOn',
                    frequency,
                    velocity: event.weight,
                    when: noteOnTime,
                    noteId: noteId,
                    params: event.params 
                });

                messages.push({
                    type: 'noteOff',
                    noteId: noteId,
                    when: noteOffTime
                });
            });
        });
        
        if (messages.length > 0) {
            this.workletNode.port.postMessage(messages);
        }
    }


    public setPreset(instrumentName: MelodyInstrument) {
        // This is now a no-op as parameters are passed with each event.
        // Kept for API compatibility.
    }

    public allNotesOff() {
        if (this.workletNode) {
            this.workletNode.port.postMessage([{ type: 'clear' }]);
        }
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
        this.workletNode?.disconnect();
        if (this.destination instanceof GainNode) {
            this.destination.disconnect();
        }
    }
}
