# AuraGroove V2

> A generative music engine that creates unique, real-time soundscapes, designed to run flawlessly on any device.

## Core Philosophy: Performance as a Feature

AuraGroove is built on a simple premise: generative music should be accessible to everyone, on any device, without compromising on depth or quality. This is achieved through a highly-optimized, custom-built audio engine that prioritizes performance above all else.

We consciously avoid heavy, all-in-one libraries for sound generation. Instead, AuraGroove uses a **heterogeneous audio engine**, where each task is handled by the most efficient tool for the job. This means:

*   **For complex, harmonically rich sounds**, like acoustic instruments, we use high-quality **samplers**. This provides incredible realism without the computational overhead of real-time synthesis.
*   **For more electronic and dynamic sounds**, such as basslines and synthesizer pads, we leverage **real-time synthesis**. This offers maximum flexibility and expressiveness.
*   **Heavy lifting is offloaded to Web Workers.** Complex calculations for music generation and audio processing happen in the background, ensuring a smooth, glitch-free user experience, even on low-powered devices.

This modular, performance-first approach allows AuraGroove to deliver a rich, immersive musical experience that is both sophisticated and universally accessible.