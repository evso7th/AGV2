// ─────────────────────────────────────────────────────────────────────────────
// MultiInstrument WebAudio: organ | synth | mellotron | guitar
// ─────────────────────────────────────────────────────────────────────────────

// ───── Helpers ─────
const loadIR = async (ctx: AudioContext, url: string | null): Promise<AudioBuffer | null> => {
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        return await ctx.decodeAudioData(buf);
    } catch (error) {
        console.warn(`[InstrumentFactory] Could not load IR from ${url}:`, error);
        return null;
    }
};

const loadSample = async (ctx: AudioContext, url: string): Promise<AudioBuffer> => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return await ctx.decodeAudioData(buf);
};

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const dB = (x: number) => Math.pow(10, x / 20);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// ───── Distortion Curves ─────
const makeSoftClip = (amount = 0.5, n = 65536) => {
    const c = new Float32Array(n);
    const k = clamp(amount, 0, 1) * 10 + 1;
    const norm = Math.tanh(k);
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        c[i] = Math.tanh(k * x) / norm;
    }
    return c;
};

const makeMuff = (gain = 0.65, n = 65536) => {
    const c = new Float32Array(n);
    const k = 1 + clamp(gain, 0, 1) * 4;
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        c[i] = Math.tanh(x * k) * 0.9;
    }
    return c;
};

// ───── FX Factories (с bypass через mix) ─────

interface BypassableFX {
    input: GainNode;
    output: GainNode;
    setMix: (mix: number) => void;
    setBypass: (bypassed: boolean) => void;
}

const makeChorus = (ctx: AudioContext, opts: { rate?: number; depth?: number; mix?: number } = {}): BypassableFX => {
    const { rate = 0.25, depth = 0.006, mix = 0.25 } = opts;

    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();

    dry.gain.value = 1 - mix;
    wet.gain.value = mix;

    const delay = ctx.createDelay(0.05);
    delay.delayTime.value = 0.02;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = rate;
    lfoGain.gain.value = depth;

    // Routing: input -> dry -> output
    //          input -> delay -> wet -> output
    input.connect(dry);
    dry.connect(output);

    input.connect(delay);
    delay.connect(wet);
    wet.connect(output);

    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    lfo.start();

    return {
        input,
        output,
        setMix: (m: number) => {
            const v = clamp(m, 0, 1);
            dry.gain.value = 1 - v;
            wet.gain.value = v;
        },
        setBypass: (bypassed: boolean) => {
            dry.gain.value = bypassed ? 1 : (1 - mix);
            wet.gain.value = bypassed ? 0 : mix;
        }
    };
};

const makeFilteredDelay = (ctx: AudioContext, opts: { time?: number; fb?: number; hc?: number; mix?: number } = {}): BypassableFX => {
    const { time = 0.38, fb = 0.26, hc = 3600, mix = 0.2 } = opts;

    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();

    dry.gain.value = 1 - mix;
    wet.gain.value = mix;

    const delayL = ctx.createDelay(5.0);
    const delayR = ctx.createDelay(5.0);
    delayL.delayTime.value = time;
    delayR.delayTime.value = time * 1.07; // slight offset for stereo

    const feedback = ctx.createGain();
    feedback.gain.value = fb;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = hc;
    filter.Q.value = 0.7;

    const merger = ctx.createChannelMerger(2);

    // Routing
    input.connect(dry);
    dry.connect(output);

    input.connect(delayL);
    delayL.connect(filter);
    filter.connect(delayR);
    delayR.connect(feedback);
    feedback.connect(delayL); // feedback loop

    delayL.connect(merger, 0, 0);
    delayR.connect(merger, 0, 1);
    merger.connect(wet);
    wet.connect(output);

    return {
        input,
        output,
        setMix: (m: number) => {
            const v = clamp(m, 0, 1);
            dry.gain.value = 1 - v;
            wet.gain.value = v;
        },
        setBypass: (bypassed: boolean) => {
            dry.gain.value = bypassed ? 1 : (1 - mix);
            wet.gain.value = bypassed ? 0 : mix;
        }
    };
};

const makePhaser = (ctx: AudioContext, opts: { stages?: number; base?: number; depth?: number; rate?: number; fb?: number; mix?: number } = {}): BypassableFX & { setRate: (r: number) => void; setDepth: (d: number) => void } => {
    const { stages = 4, base = 800, depth = 600, rate = 0.16, fb = 0.12, mix = 0.2 } = opts;

    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();

    dry.gain.value = 1 - mix;
    wet.gain.value = mix;

    let head: AudioNode = input;
    const aps: BiquadFilterNode[] = [];

    for (let i = 0; i < stages; i++) {
        const ap = ctx.createBiquadFilter();
        ap.type = 'allpass';
        ap.frequency.value = base * ((i % 2) ? 1.2 : 0.8);
        ap.Q.value = 0.6;
        head.connect(ap);
        head = ap;
        aps.push(ap);
    }

    const fbG = ctx.createGain();
    fbG.gain.value = fb;
    if (aps.length > 0) {
        aps[aps.length - 1].connect(fbG);
        fbG.connect(aps[0]);
    }

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = rate;
    const lfoG = ctx.createGain();
    lfoG.gain.value = depth;
    lfo.connect(lfoG);
    aps.forEach(ap => lfoG.connect(ap.frequency));
    lfo.start();

    input.connect(dry);
    dry.connect(output);

    if (aps.length > 0) {
        aps[aps.length - 1].connect(wet);
    } else {
        input.connect(wet);
    }
    wet.connect(output);

    return {
        input,
        output,
        setMix: (m: number) => {
            const v = clamp(m, 0, 1);
            dry.gain.value = 1 - v;
            wet.gain.value = v;
        },
        setBypass: (bypassed: boolean) => {
            dry.gain.value = bypassed ? 1 : (1 - mix);
            wet.gain.value = bypassed ? 0 : mix;
        },
        setRate: (r: number) => { lfo.frequency.value = r; },
        setDepth: (d: number) => { lfoG.gain.value = d; }
    };
};

// ───── Main Factory ─────

export async function buildMultiInstrument(ctx: AudioContext, {
    type = 'organ',
    preset = {} as any,
    cabinetIRUrl = null as string | null,
    plateIRUrl = null as string | null,
    mellotronMap = null as any,
    output = ctx.destination
} = {}) {
    console.log(`%c[InstrumentFactory] Building: ${type}`, 'color: #FFA500; font-weight: bold;');

    // ───── Master Section ─────
    const master = ctx.createGain();
    master.gain.value = 0.8;

    const reverb = ctx.createConvolver();
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = 0.18;

    // Загрузка plate reverb (async, но не блокирующая)
    if (plateIRUrl) {
        loadIR(ctx, plateIRUrl).then(buf => {
            if (buf) {
                reverb.buffer = buf;
                console.log('[InstrumentFactory] Plate reverb loaded');
            }
        });
    }
    
    // Reverb всегда в цепи (если нет buffer — тишина, это ок)
    reverb.connect(reverbWet);
    reverbWet.connect(master);

    // API (будет заполнен ниже)
    const api = {
        connect: (dest?: AudioNode) => master.connect(dest || output),
        disconnect: () => { try { master.disconnect(); } catch {} },
        setParam: (k: string, v: any) => {},
        noteOn: (midi: number, when?: number) => {},
        noteOff: (midi: number, when?: number) => {},
        setPreset: (p: any) => {},
        allNotesOff: () => {},
        preset: preset
    };

    // ══════════════════════════════════════════════════════════════════════════
    // SYNTH
    // ══════════════════════════════════════════════════════════════════════════
    if (type === 'synth') {
        let currentPreset = { ...preset };

        // ─── Static Graph (создаём один раз, никогда не переподключаем) ───
        const compNode = ctx.createDynamicsCompressor();
        const compMakeup = ctx.createGain();

        // Два фильтра последовательно (всегда в цепи)
        const filt1 = ctx.createBiquadFilter();
        filt1.type = 'lowpass';
        const filt2 = ctx.createBiquadFilter();
        filt2.type = 'lowpass';

        // Bypass для второго фильтра (12dB vs 24dB mode)
        const filt2Bypass = ctx.createGain(); // параллельный путь
        const filt2Wet = ctx.createGain();

        // FX
        const chorus = makeChorus(ctx, currentPreset.chorus || {});
        const delay = makeFilteredDelay(ctx, currentPreset.delay || {});

        const finalChain = ctx.createGain();
        finalChain.gain.value = 1.0;

        const revSend = ctx.createGain();
        revSend.gain.value = currentPreset.reverbMix ?? 0.18;

        // LFO для фильтра
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.start();

        // ─── Routing (статический, один раз) ───
        // Voices -> compNode -> compMakeup -> filt1 -> [filt2 bypass system] -> chorus -> delay -> finalChain -> master
        //                                                                                                    -> revSend -> reverb

        compNode.connect(compMakeup);
        compMakeup.connect(filt1);

        // Фильтр 2: bypass система
        // filt1 -> filt2 -> filt2Wet -> (merge)
        // filt1 -> filt2Bypass ------> (merge)
        // merge -> chorus.input
        filt1.connect(filt2);
        filt2.connect(filt2Wet);
        filt1.connect(filt2Bypass);

        const filt2Merge = ctx.createGain();
        filt2Wet.connect(filt2Merge);
        filt2Bypass.connect(filt2Merge);

        filt2Merge.connect(chorus.input);
        chorus.output.connect(delay.input);
        delay.output.connect(finalChain);

        finalChain.connect(master);
        finalChain.connect(revSend);
        revSend.connect(reverb);

        // LFO -> filter frequencies
        lfo.connect(lfoGain);

        // ─── State ───
        const activeVoices = new Map<number, { oscs: { x: OscillatorNode; g: GainNode }[]; noise: { n: AudioBufferSourceNode; ng: GainNode } | null; gain: GainNode }>();
        let noiseBuffer: AudioBuffer | null = null;

        // ─── Helpers ───
        const getOscConfig = (p: any) => {
            if (p.osc && p.osc.length > 0) return p.osc;
            return [{ type: 'sawtooth', gain: 0.5, octave: 0, detune: 0 }];
        };

        const updateNodesFromPreset = (p: any) => {
            // Compressor
            compNode.threshold.value = p.comp?.threshold ?? -20;
            compNode.knee.value = p.comp?.knee ?? 10;
            compNode.ratio.value = p.comp?.ratio ?? 4;
            compNode.attack.value = p.comp?.attack ?? 0.003;
            compNode.release.value = p.comp?.release ?? 0.15;
            compMakeup.gain.value = dB(p.comp?.makeup ?? 6);

            // Filter
            const cutoff = p.lpf?.cutoff ?? 3000;
            const q = p.lpf?.q ?? 1;
            const is24dB = (p.lpf?.mode === '24dB');

            filt1.frequency.value = cutoff;
            filt1.Q.value = q;
            filt2.frequency.value = cutoff;
            filt2.Q.value = q;

            // Bypass system: 24dB = через filt2, 12dB = bypass
            filt2Wet.gain.value = is24dB ? 1 : 0;
            filt2Bypass.gain.value = is24dB ? 0 : 1;

            // LFO
            lfo.type = (p.lfo?.shape as OscillatorType) || 'sine';
            lfo.frequency.value = p.lfo?.rate ?? 0;
            lfoGain.gain.value = p.lfo?.amount ?? 0;

            try { lfoGain.disconnect(); } catch {}
            if (lfoGain.gain.value > 0 && p.lfo?.target === 'filter') {
                lfoGain.connect(filt1.frequency);
                if (is24dB) lfoGain.connect(filt2.frequency);
            }

            // Chorus (bypass через mix)
            if (p.chorus?.on) {
                chorus.setMix(p.chorus.mix ?? 0.25);
            } else {
                chorus.setMix(0); // bypass
            }

            // Delay (bypass через mix)
            if (p.delay?.on) {
                delay.setMix(p.delay.mix ?? 0.2);
            } else {
                delay.setMix(0); // bypass
            }

            // Reverb send
            revSend.gain.value = p.reverbMix ?? 0.18;

            // Noise buffer
            if (p.noise?.on) {
                noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
                const d = noiseBuffer.getChannelData(0);
                for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
            } else {
                noiseBuffer = null;
            }
        };

        // Initial setup
        updateNodesFromPreset(currentPreset);

        // ─── API Implementation ───
        api.noteOn = (midi, when = ctx.currentTime) => {
            const f = midiToHz(midi);

            const vGain = ctx.createGain();
            vGain.gain.value = 0.0;
            vGain.connect(compNode); // -> static chain

            const oscConfig = getOscConfig(currentPreset);
            const oscs = oscConfig.map((o: any) => {
                const x = ctx.createOscillator();
                x.type = (o.type as OscillatorType) || 'sawtooth';
                const detuneFactor = Math.pow(2, (o.detune || 0) / 1200);
                const octaveFactor = Math.pow(2, o.octave || 0);
                x.frequency.setValueAtTime(f * detuneFactor * octaveFactor, when);

                const g = ctx.createGain();
                g.gain.value = o.gain ?? 0.5;
                x.connect(g);
                g.connect(vGain);
                x.start(when);
                return { x, g };
            });

            let noiseNode: { n: AudioBufferSourceNode; ng: GainNode } | null = null;
            if (currentPreset.noise?.on && noiseBuffer) {
                const n = ctx.createBufferSource();
                n.buffer = noiseBuffer;
                n.loop = true;
                const ng = ctx.createGain();
                ng.gain.value = currentPreset.noise.gain ?? 0.1;
                n.connect(ng);
                ng.connect(vGain);
                n.start(when);
                noiseNode = { n, ng };
            }

            activeVoices.set(midi, { oscs, noise: noiseNode, gain: vGain });

            const adsr = currentPreset.adsr || { a: 0.01, d: 0.1, s: 0.8, r: 0.3 };
            vGain.gain.cancelScheduledValues(when);
            vGain.gain.setValueAtTime(0.0001, when);
            vGain.gain.linearRampToValueAtTime(1.0, when + adsr.a);
            vGain.gain.setTargetAtTime(adsr.s, when + adsr.a, Math.max(adsr.d / 3, 0.001));
        };

        api.noteOff = (midi, when = ctx.currentTime) => {
            const voice = activeVoices.get(midi);
            if (!voice) return;

            const r = currentPreset.adsr?.r ?? 0.3;

            voice.gain.gain.cancelScheduledValues(when);
            voice.gain.gain.setValueAtTime(voice.gain.gain.value, when);
            voice.gain.gain.setTargetAtTime(0.0001, when, Math.max(r / 4, 0.001));

            const stopTime = when + r + 0.1;
            voice.oscs.forEach(({ x }) => x.stop(stopTime));
            if (voice.noise) voice.noise.n.stop(stopTime);

            activeVoices.delete(midi);
        };

        api.allNotesOff = () => {
            activeVoices.forEach((_, key) => api.noteOff(key, ctx.currentTime));
        };

        api.setPreset = (p) => {
            console.log('[Synth] setPreset:', p);
            api.allNotesOff();
            currentPreset = { ...p };
            api.preset = currentPreset;
            updateNodesFromPreset(currentPreset);
        };

        api.setParam = (k, v) => {
            if (k === 'reverbMix') revSend.gain.value = v;
            if (k === 'filterCutoff') {
                filt1.frequency.value = v;
                filt2.frequency.value = v;
            }
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GUITAR
    // ══════════════════════════════════════════════════════════════════════════
    else if (type === 'guitar') {
        let currentPreset = { ...preset };

        // ─── Static Graph ───
        const guitarInput = ctx.createGain();

        // Pickup simulation
        const pickupLPF = ctx.createBiquadFilter();
        pickupLPF.type = 'lowpass';
        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 90;
        hpf.Q.value = 0.7;

        // Compressor
        const compNode = ctx.createDynamicsCompressor();
        const compMakeup = ctx.createGain();

        // Distortion
        const shaper = ctx.createWaveShaper();
        shaper.oversample = '4x';

        // Post EQ
        const postHPF = ctx.createBiquadFilter();
        postHPF.type = 'highpass';
        postHPF.frequency.value = 80;
        postHPF.Q.value = 0.7;

        const mid1 = ctx.createBiquadFilter();
        mid1.type = 'peaking';
        const mid2 = ctx.createBiquadFilter();
        mid2.type = 'peaking';

        const postLPF = ctx.createBiquadFilter();
        postLPF.type = 'lowpass';

        // Cabinet (convolver) с bypass
        const cab = ctx.createConvolver();
        const cabWet = ctx.createGain();
        const cabDry = ctx.createGain();
        cabWet.gain.value = 1;
        cabDry.gain.value = 0;

        // FX
        const phaser = makePhaser(ctx, currentPreset.phaser || {});
        const delayA = makeFilteredDelay(ctx, currentPreset.delayA || {});
        const delayB = makeFilteredDelay(ctx, currentPreset.delayB || {});

        const guitarOut = ctx.createGain();
        guitarOut.gain.value = 0.9;

        const revSend = ctx.createGain();
        revSend.gain.value = currentPreset.reverbMix ?? 0.18;

        // ─── Routing ───
        guitarInput.connect(pickupLPF);
        pickupLPF.connect(hpf);
        hpf.connect(compNode);
        compNode.connect(compMakeup);
        compMakeup.connect(shaper);
        shaper.connect(postHPF);
        postHPF.connect(mid1);
        mid1.connect(mid2);
        mid2.connect(postLPF);

        // Cabinet bypass system
        postLPF.connect(cab);
        cab.connect(cabWet);
        postLPF.connect(cabDry);

        const cabMerge = ctx.createGain();
        cabWet.connect(cabMerge);
        cabDry.connect(cabMerge);

        // FX chain
        cabMerge.connect(phaser.input);
        phaser.output.connect(delayA.input);
        delayA.output.connect(delayB.input);
        delayB.output.connect(guitarOut);

        guitarOut.connect(master);
        guitarOut.connect(revSend);
        revSend.connect(reverb);

        // Load cabinet IR
        if (cabinetIRUrl) {
            loadIR(ctx, cabinetIRUrl).then(buf => {
                if (buf) {
                    cab.buffer = buf;
                    cabWet.gain.value = 1;
                    cabDry.gain.value = 0;
                    console.log('[Guitar] Cabinet IR loaded');
                } else {
                    cabWet.gain.value = 0;
                    cabDry.gain.value = 1;
                }
            });
        } else {
            cabWet.gain.value = 0;
            cabDry.gain.value = 1;
        }

        // ─── State ───
        const activeVoices = new Map<number, { oscMain: OscillatorNode; oscDet: OscillatorNode; oscSub: OscillatorNode; vGain: GainNode }>();

        // Pulse oscillator helper
        const createPulseOsc = (freq: number, width = 0.5) => {
            const w = clamp(width, 0.1, 0.9);
            const real = new Float32Array(32);
            const imag = new Float32Array(32);
            for (let n = 1; n < 32; n++) {
                real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * w);
            }
            const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: true });
            const osc = ctx.createOscillator();
            osc.setPeriodicWave(wave);
            osc.frequency.value = freq;
            return osc;
        };

        const updateGuitarNodes = (p: any) => {
            // Pickup
            pickupLPF.frequency.value = p.pickup?.cutoff ?? 3600;
            pickupLPF.Q.value = p.pickup?.q ?? 1;

            // Compressor
            compNode.threshold.value = p.comp?.threshold ?? -18;
            compNode.ratio.value = p.comp?.ratio ?? 3;
            compNode.attack.value = p.comp?.attack ?? 0.01;
            compNode.release.value = p.comp?.release ?? 0.12;
            compMakeup.gain.value = dB(p.comp?.makeup ?? 3);

            // Distortion
            const driveType = p.drive?.type ?? 'soft';
            const driveAmount = p.drive?.amount ?? 0.3;
            shaper.curve = driveType === 'muff' ? makeMuff(driveAmount) : makeSoftClip(driveAmount);

            // EQ
            mid1.frequency.value = p.post?.mids?.[0]?.f ?? 850;
            mid1.Q.value = p.post?.mids?.[0]?.q ?? 0.9;
            mid1.gain.value = p.post?.mids?.[0]?.g ?? 2;

            mid2.frequency.value = p.post?.mids?.[1]?.f ?? 2500;
            mid2.Q.value = p.post?.mids?.[1]?.q ?? 1.4;
            mid2.gain.value = p.post?.mids?.[1]?.g ?? -1.5;

            postLPF.frequency.value = p.post?.lpf ?? 5200;

            // Phaser
            if (p.phaser?.on !== false) {
                phaser.setMix(p.phaser?.mix ?? 0.2);
                phaser.setRate(p.phaser?.rate ?? 0.16);
                phaser.setDepth(p.phaser?.depth ?? 600);
            } else {
                phaser.setMix(0);
            }

            // Delay A
            if (p.delayA?.on !== false) {
                delayA.setMix(p.delayA?.mix ?? 0.2);
            } else {
                delayA.setMix(0);
            }

            // Delay B
            if (p.delayB?.on) {
                delayB.setMix(p.delayB?.mix ?? 0.15);
            } else {
                delayB.setMix(0);
            }

            // Reverb
            revSend.gain.value = p.reverbMix ?? 0.18;
        };

        // Initial setup
        updateGuitarNodes(currentPreset);

        // ─── API Implementation ───
        api.noteOn = (midi, when = ctx.currentTime) => {
            const f = midiToHz(midi);
            const oscP = currentPreset.osc ?? {};
            const adsr = currentPreset.adsr ?? { a: 0.006, d: 0.35, s: 0.6, r: 1.6 };

            const vGain = ctx.createGain();
            vGain.gain.value = 0.0;

            const sum = ctx.createGain();
            sum.gain.value = 0.8;

            const oscMain = createPulseOsc(f, oscP.width ?? 0.46);
            const oscDet = createPulseOsc(f, (oscP.width ?? 0.46) + 0.06);
            oscDet.detune.value = oscP.detune ?? 5;
            const oscSub = ctx.createOscillator();
            oscSub.type = 'sine';
            oscSub.frequency.value = f / 2;

            const gMain = ctx.createGain(); gMain.gain.value = oscP.mainGain ?? 0.85;
            const gDet = ctx.createGain(); gDet.gain.value = oscP.detGain ?? 0.18;
            const gSub = ctx.createGain(); gSub.gain.value = oscP.subGain ?? 0.25;

            oscMain.connect(gMain).connect(sum);
            oscDet.connect(gDet).connect(sum);
            oscSub.connect(gSub).connect(sum);

            sum.connect(vGain);
            vGain.connect(guitarInput); // -> static chain

            oscMain.start(when);
            oscDet.start(when);
            oscSub.start(when);

            vGain.gain.cancelScheduledValues(when);
            vGain.gain.setValueAtTime(0.0001, when);
            vGain.gain.linearRampToValueAtTime(1.0, when + adsr.a);
            vGain.gain.setTargetAtTime(adsr.s, when + adsr.a, Math.max(adsr.d / 3, 0.001));

            activeVoices.set(midi, { oscMain, oscDet, oscSub, vGain });
        };

        api.noteOff = (midi, when = ctx.currentTime) => {
            const voice = activeVoices.get(midi);
            if (!voice) return;

            const r = currentPreset.adsr?.r ?? 1.6;

            voice.vGain.gain.cancelScheduledValues(when);
            voice.vGain.gain.setValueAtTime(voice.vGain.gain.value, when);
            voice.vGain.gain.setTargetAtTime(0.0001, when, Math.max(r / 4, 0.001));

            const stopTime = when + r + 0.1;
            voice.oscMain.stop(stopTime);
            voice.oscDet.stop(stopTime);
            voice.oscSub.stop(stopTime);

            activeVoices.delete(midi);
        };

        api.allNotesOff = () => {
            activeVoices.forEach((_, key) => api.noteOff(key, ctx.currentTime));
        };

        api.setPreset = (p) => {
            console.log('[Guitar] setPreset:', p);
            api.allNotesOff();
            currentPreset = { ...p };
            api.preset = currentPreset;
            updateGuitarNodes(currentPreset);
        };

        api.setParam = (k, v) => {
            if (k === 'drive') {
                const type = currentPreset.drive?.type ?? 'soft';
                shaper.curve = type === 'muff' ? makeMuff(v) : makeSoftClip(v);
            }
            if (k === 'pickupCutoff') pickupLPF.frequency.value = v;
            if (k === 'reverbMix') revSend.gain.value = v;
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ORGAN (placeholder - можно добавить позже)
    // ══════════════════════════════════════════════════════════════════════════
    else if (type === 'organ') {
        console.warn('[InstrumentFactory] Organ not implemented in this version');
        // Заглушка — можете вставить ваш старый код органа
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MELLOTRON (placeholder)
    // ══════════════════════════════════════════════════════════════════════════
    else if (type === 'mellotron') {
        console.warn('[InstrumentFactory] Mellotron not implemented in this version');
    }

    // ───── Final Connection ─────
    master.connect(output);

    console.log(`%c[InstrumentFactory] Build COMPLETED: ${type}`, 'color: #32CD32; font-weight: bold;');
    return api;
}