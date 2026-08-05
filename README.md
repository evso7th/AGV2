# AuraGroove V2

> A generative music engine that creates unique, real-time soundscapes, designed to run flawlessly on any device.

## Core Philosophy: Performance as a Feature

AuraGroove is built on a simple premise: generative music should be accessible to everyone, on any device, without compromising on depth or quality. This is achieved through a highly-optimized, custom-built audio engine that prioritizes performance above all else.

We consciously avoid heavy, all-in-one libraries for sound generation. Instead, AuraGroove uses a **heterogeneous audio engine**, where each task is handled by the most efficient tool for the job. This means:

*   **For complex, harmonically rich sounds**, like acoustic instruments, we use high-quality **samplers**. This provides incredible realism without the computational overhead of real-time synthesis.
*   **For more electronic and dynamic sounds**, such as basslines and synthesizer pads, we leverage **real-time synthesis**. This offers maximum flexibility and expressiveness.
*   **Heavy lifting is offloaded to Web Workers.** Complex calculations for music generation and audio processing happen in the background, ensuring a smooth, glitch-free user experience, even on low-powered devices.

## Audio Engineering: Clear Sky Protocol 2.0

To achieve a crystal-clear, transparent mix, AuraGroove implements rigorous acoustic standards known as the "Clear Sky Protocol 2.0":

*   **Master Headroom Calibration:** The system gain is calibrated to -6dB (Master 0.65) to prevent digital clipping even during high-energy climaxes.
*   **Spectral Segregation:** Strict frequency management using High-Pass Filters (HPF):
    *   **Bass & Drums:** Cleaned at 45Hz to remove sub-sonic "mud".
    *   **Pads, Keys & Leads:** Filtered at 220Hz to eliminate conflict with the bass foundation.
*   **The Anti-Box Dip:** A precise -2dB attenuation at 350Hz on the accompaniment bus to eliminate the "boxed-in" sound and frequency masking in the lower mid-range.
*   **Density Guard:** A reactive filtering system that automatically raises the HPF of background layers to 280Hz when melodic density increases (Tension > 0.7), ensuring clarity during complex passages.
*   **Black Acoustic resonance fix:** Reduced guitar body resonance (220Hz) from +3.5dB to +1.0dB to prevent accumulation of resonant energy during chordal play.
*   **Polyphony Polish:** Optimized ADSR envelopes with shortened release tails for Organs, Rhodes, and Lush Pads to minimize spectral buildup.
*   **Direct Stream Bridge (Silk Start):** A low-latency audio bridge for background playback on mobile devices with hardware-level fade-in protection and Media Session API stability.

This modular, performance-first approach allows AuraGroove to deliver a rich, immersive musical experience that is both sophisticated and universally accessible.