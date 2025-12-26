# AuraGroove V2

> A generative music engine that creates unique, real-time soundscapes, designed to run flawlessly on any device.

## Core Philosophy: Performance as a Feature

AuraGroove is built on a simple premise: generative music should be accessible to everyone, on any device, without compromising on depth or quality. This is achieved through a highly-optimized, custom-built audio engine that prioritizes performance above all else.

We consciously avoid heavy, all-in-one libraries for sound generation. Instead, AuraGroove uses a **heterogeneous audio engine**, where each task is handled by the most efficient tool for the job.

## The Engine: A Technical Deep Dive

The heart of AuraGroove is its unique, mixed-technology approach to synthesis:

- **🎹 Melody & Accompaniment (Native Web Audio API):** The core tonal instruments are powered by custom-built polyphonic synthesizers written from scratch using the raw Web Audio API. This provides maximum performance and zero overhead, ensuring fluid playback even on low-spec mobile devices.

- **🎸 Bass (AudioWorklet):** The bass synth runs in its own high-priority `AudioWorklet` thread. This isolates its complex processing, preventing any risk of blocking the main UI thread and ensuring a stable, powerful low-end.

- **🥁 Drums & Samples (Samplers):** Percussion and other samples are handled by efficient samplers, optimized for lightweight playback of pre-recorded audio files.

- **⏱️ Timing (Tone.js):** The `Tone.js` library is used for one thing and one thing only: as a high-precision "metronome" (`Tone.Transport`) to keep the entire system in perfect sync. **It does not generate any sound for the tonal instruments.**

## The Composer: Blueprints for Generative Music

Music isn't just sound; it's structure. AuraGroove's composition logic is built on a two-tier system:

1.  **The Composer (`FractalMusicEngine`):** An algorithmic engine that generates a musical score in real-time, measure by measure. It doesn't play from a script; it composes on the fly.

2.  **The Blueprints:** These are the "DNA" of a musical piece. A blueprint is a master preset that defines the rules for the composer, including:
    *   **Harmony:** The musical scale and chord progression that sets the mood.
    *   **Timbre:** The specific synth presets and sound palettes for each instrument.
    *   **Structure:** The tempo, note density, and other rhythmic rules that define the genre.

This system allows AuraGroove to create ever-evolving music that feels both unique and structurally coherent.

## Getting Started

1.  Clone the repository:
    ```bash
    git clone https://github.com/evso7th/AGV2.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.
