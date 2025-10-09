import { NoteEvent } from "./types";

// A map of note names to their corresponding audio file URLs, including velocity layers.
const SAMPLES: Record<string, { low: string; high: string } | string> = {
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
	C4: "/assets/acoustic_guitar_samples/acoustic-guitar-string-c-note-clean.mp3", // Mapped C3 to C4 as it's a common middle note
	D4: "/assets/acoustic_guitar_samples/acoustic-guitar-string-d-note-regolar-clean.mp3",
	E4: "/assets/acoustic_guitar_samples/acoustic-guitar-string-e3_120bpm.mp3", // E3 is a bit low, but we'll use it for E4
};

/**
 * A sampler player for the acoustic guitar, capable of handling multi-layered velocity samples.
 * It pre-loads audio samples and schedules them for playback with precise timing.
 */
export class AcousticGuitarSampler {
	private audioContext: AudioContext;
	private samples: Map<string, AudioBuffer> = new Map();
	public output: GainNode;
	private isLoading: boolean = true;

	constructor(audioContext: AudioContext) {
		this.audioContext = audioContext;
		this.output = this.audioContext.createGain();
		this.loadSamples();
	}

	private async loadSamples() {
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

		this.isLoading = true;
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

	public schedule(notes: NoteEvent[]) {
		if (this.isLoading) return; // Don't schedule if samples are not ready

		notes.forEach((note) => {
			const sampleInfo = SAMPLES[note.note];
			if (!sampleInfo) return; // Skip notes for which we have no sample

			let bufferKey = note.note;
			if (typeof sampleInfo === "object") {
				// This is a velocity-layered note
				bufferKey = note.velocity > 0.6 ? `${note.note}-high` : `${note.note}-low`;
			}

			const buffer = this.samples.get(bufferKey);
			if (buffer) {
				const source = this.audioContext.createBufferSource();
				source.buffer = buffer;
				
				// Create a gain node for this specific note to control its volume via velocity
				const noteGain = this.audioContext.createGain();
				noteGain.gain.value = note.velocity;
				
				source.connect(noteGain);
				noteGain.connect(this.output);
				
				source.start(note.time, 0, note.duration);
			}
		});
	}

	public setVolume(volume: number) {
		this.output.gain.value = volume;
	}
}
