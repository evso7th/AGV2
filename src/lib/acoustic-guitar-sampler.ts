
import type { Note as NoteEvent } from "@/types/music";
import * as Tone from 'tone';

// A map of note names to their corresponding audio file URLs, including velocity layers.
const SAMPLES: Record<string, { low: string; high: string } | string> = {
    C3: "/assets/acoustic_guitar_samples/acoustic-guitar-string-c-3_120bpm.mp3",
	D3: "/assets/acoustic_guitar_samples/acoustic-guitar-string-d-3_120bpm.mp3",
    E3: "/assets/acoustic_guitar_samples/acoustic-guitar-string-e3_120bpm.mp3",
	F3: {
		low: "/assets/acoustic_guitar_samples/acoustic-guitar-string-f-note-clean-low.mp3",
		high: "/assets/acoustic_guitar_samples/acoustic-guitar-string-f-note-clean-high.mp3",
	},
	G3: {
		low: "/assets/acoustic_guitar_samples/acoustic-guitar-string-g-note-clean-low.mp3",
		high: "/assets/acoustic_guitar_samples/acoustic-guitar-string-g-note-bright-clean.mp3",
	},
	A3: "/assets/acoustic_guitar_samples/acoustic-guitar-string-a-3_120bpm.mp3",
	B3: "/assets/acoustic_guitar_samples/acoustic-guitar-string-b3_120bpm.mp3",
	C4: "/assets/acoustic_guitar_samples/acoustic-guitar-string-c-note-clean.mp3",
	D4: "/assets/acoustic_guitar_samples/acoustic-guitar-string-d-note-regular-clean.mp3",
};

/**
 * A sampler player for the acoustic guitar, capable of handling multi-layered velocity samples.
 * It pre-loads audio samples and schedules them for playback with precise timing.
 */
export class AcousticGuitarSampler {
	private audioContext: AudioContext;
	private samples: Map<string, AudioBuffer> = new Map();
	public output: GainNode;
	public isInitialized: boolean = false;
    private isLoading: boolean = false;

	constructor(audioContext: AudioContext) {
		this.audioContext = audioContext;
		this.output = this.audioContext.createGain();
	}

	public async init() {
		if (this.isInitialized || this.isLoading) return;
        this.isLoading = true;

		let totalSamplesToLoad = 0;
		for (const note in SAMPLES) {
			const sampleInfo = SAMPLES[note];
			if (typeof sampleInfo === "string") {
				totalSamplesToLoad++;
			} else {
				totalSamplesToLoad += 2;
			}
		}
		console.log(`AcousticGuitarSampler: Initializing... Loading ${totalSamplesToLoad} samples.`);

		const samplePromises: Promise<void>[] = [];

		for (const note in SAMPLES) {
			const sampleInfo = SAMPLES[note];
			if (typeof sampleInfo === "string") {
				samplePromises.push(this.loadSample(note, sampleInfo));
			} else {
				// Load both velocity layers
				samplePromises.push(this.loadSample(`${note}-low`, sampleInfo.low));
				samplePromises.push(this.loadSample(`${note}-high`, sampleInfo.high));
			}
		}

		await Promise.all(samplePromises);
		this.isInitialized = true;
        this.isLoading = false;
		console.log(`AcousticGuitarSampler: ${this.samples.size} of ${totalSamplesToLoad} samples successfully loaded. Ready to play.`);
	}

	private async loadSample(noteName: string, url: string) {
		try {
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
			this.samples.set(noteName, audioBuffer);
		} catch (e) {
			console.error(`Failed to load sample: ${noteName} from ${url}`, e);
		}
	}
    
    private midiToNoteName(midi: number): string {
        return new Tone.Frequency(midi, 'midi').toNote();
    }

	public schedule(notes: NoteEvent[], startTime: number) {
		if (!this.isInitialized) return;

		notes.forEach((note) => {
            const noteName = note.note ?? this.midiToNoteName(note.midi);
            if (!noteName) return;

			const sampleInfo = SAMPLES[noteName];
			if (!sampleInfo) return;

			let bufferKey = noteName;
            const velocity = note.velocity ?? 0.7;

			if (typeof sampleInfo === "object") {
				bufferKey = velocity > 0.6 ? `${noteName}-high` : `${noteName}-low`;
			}

			const buffer = this.samples.get(bufferKey);
			if (buffer) {
				const source = this.audioContext.createBufferSource();
				source.buffer = buffer;
				
				const noteGain = this.audioContext.createGain();
				noteGain.gain.value = velocity;
				
				source.connect(noteGain);
				noteGain.connect(this.output);
				
				source.start(startTime + note.time, 0, note.duration);
			}
		});
	}

	public setVolume(volume: number) {
		this.output.gain.value = volume;
	}

    public stopAll() {
        // Since we schedule one-shot samples, a global stop isn't easily implemented
        // without tracking every single source node. For ambient music, letting notes
        // decay naturally is usually acceptable.
    }
}
