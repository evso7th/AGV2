

// ─────────────────────────────────────────────────────────────────────────────
// MultiInstrument WebAudio: organ | synth | mellotron | guitar
// ─────────────────────────────────────────────────────────────────────────────

// ───── Helpers
const loadIR = async (ctx: AudioContext, url: string | null) => {
    // #ЗАЧЕМ: Загружает и декодирует аудиофайл для использования в ConvolverNode (импульсный отклик).
    // #ЧТО: Асинхронно запрашивает файл по URL, преобразует его в ArrayBuffer и декодирует в AudioBuffer.
    // #СВЯЗИ: Используется для создания реверберации и эмуляции кабинетов.
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch IR: ${res.statusText}`);
        const buf = await res.arrayBuffer();
        return await ctx.decodeAudioData(buf);
    } catch (error) {
        console.error(`[InstrumentFactory] CRITICAL ERROR loading IR from ${url}:`, error);
        throw error; // Re-throw to be caught by the main builder
    }
};
const loadSample = async (ctx: AudioContext, url: string) => {
    // #ЗАЧЕМ: Загружает и декодирует аудиофайл для сэмплера (Mellotron).
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return await ctx.decodeAudioData(buf);
};
const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const dB = (x: number) => Math.pow(10, x / 20);

const makeSoftClip = (amount = 0.5, n = 65536) => {
    const c = new Float32Array(n);
    const k = amount * 10 + 1;
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        c[i] = Math.tanh(k * x) / Math.tanh(k);
    }
    return c;
};
const makeMuff = (gain = 0.65, n = 65536) => {
    const c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        const y = Math.tanh(x * (1 + gain * 4)) * 0.9;
        c[i] = y;
    }
    return c;
};
const makePhaser = (ctx: AudioContext, { stages = 4, base = 800, depth = 600, rate = 0.16, fb = 0.12, mix = 0.2 }) => {
    const input = ctx.createGain(), out = ctx.createGain(), wet = ctx.createGain(), dry = ctx.createGain();
    wet.gain.value = mix;
    dry.gain.value = 1 - mix;
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
    (aps[aps.length - 1] as BiquadFilterNode).connect(fbG);
    fbG.connect(aps[0]);
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = rate;
    const lfoG = ctx.createGain();
    lfoG.gain.value = depth;
    lfo.connect(lfoG);
    aps.forEach(ap => lfoG.connect(ap.frequency));
    lfo.start();
    input.connect(dry);
    (aps[aps.length - 1] as BiquadFilterNode).connect(wet);
    dry.connect(out);
    wet.connect(out);
    return { input, output: out, setRate: (r: number) => (lfo.frequency.value = r), setDepth: (d: number) => (lfoG.gain.value = d) };
};

const makeChorus = (ctx: AudioContext, {rate = 0.25, depth = 0.006, mix = 0.25}) => {
    const input = ctx.createGain(), output = ctx.createGain(), wet = ctx.createGain(), dry = ctx.createGain();
    wet.gain.value = mix;
    dry.gain.value = 1 - mix;

    input.connect(dry);
    dry.connect(output);

    const delay = ctx.createDelay(0.025);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    lfo.type = 'sine';
    lfo.frequency.value = rate;
    lfoGain.gain.value = depth;

    input.connect(delay);
    delay.connect(wet);
    wet.connect(output);

    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    lfo.start();

    return { input, output };
};

const makeFilteredDelay = (ctx: AudioContext, { time = 0.38, fb = 0.26, hc = 3600, mix = 0.2 }) => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1.0 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;

    input.connect(dry);
    dry.connect(output);

    const delayL = ctx.createDelay(5.0);
    const delayR = ctx.createDelay(5.0);
    delayL.delayTime.value = time;
    delayR.delayTime.value = time;

    const feedback = ctx.createGain();
    feedback.gain.value = fb;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = hc;
    filter.Q.value = 0.7;
    
    const merger = ctx.createChannelMerger(2);

    input.connect(delayL);
    delayL.connect(filter).connect(delayR);
    delayR.connect(feedback).connect(delayL);

    delayL.connect(merger, 0, 0);
    delayR.connect(merger, 0, 1);
    
    merger.connect(wet);
    wet.connect(output);
    
    return { input, output };
};


export async function buildMultiInstrument(ctx: AudioContext, {
  type = 'organ',
  preset = {} as any,
  cabinetIRUrl = null,
  plateIRUrl = null,
  mellotronMap = null,
  output = ctx.destination
} = {}) {
  console.log(`%c[InstrumentFactory] Build STARTING for type: ${type}`, 'color: #FFA500; font-weight: bold;');

  const master = ctx.createGain(); master.gain.value = 0.8;
  const reverb = ctx.createConvolver();
  try {
      if (plateIRUrl) {
          reverb.buffer = await loadIR(ctx, plateIRUrl);
      }
  } catch (e) {
      console.error('[InstrumentFactory] Failed to load plate reverb IR.', e);
  }

  const api = { 
      connect:(dest?: AudioNode)=>master.connect(dest||output), 
      setParam:(k: string,v: any)=>{}, 
      noteOn:(midi: number, when?: number)=>{}, 
      noteOff:(midi: number, when?: number)=>{}, 
      setPreset:(p: any)=>{}, 
      allNotesOff: () => {},
      preset: preset
  };

  if (type === 'synth') {
    let currentPreset = { ...preset };

    // --- СТАТИЧЕСКАЯ ЦЕПОЧКА ЭФФЕКТОВ (ПЛАН 1245) ---
    const compNode = ctx.createDynamicsCompressor();
    const compMakeup = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    const filt2 = ctx.createBiquadFilter();
    let chorusNode = makeChorus(ctx, currentPreset.chorus || {});
    let delayNode = makeFilteredDelay(ctx, currentPreset.delay || {});
    const finalChain = ctx.createGain();
    const lfoNode = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const revSend = ctx.createGain();

    // Соединяем узлы в правильном порядке ОДИН РАЗ
    compNode.connect(compMakeup).connect(filt);
    const use2pole = (currentPreset.lpf?.mode !== '24dB');
    if (!use2pole) {
      filt.connect(filt2);
    }
    const lastFilter = use2pole ? filt : filt2;

    let currentOutput: AudioNode = lastFilter;
    if (currentPreset.chorus?.on) {
        currentOutput.connect(chorusNode.input);
        currentOutput = chorusNode.output;
    }
    if (currentPreset.delay?.on) {
        currentOutput.connect(delayNode.input);
        currentOutput = delayNode.output;
    }
    currentOutput.connect(finalChain);
    finalChain.connect(master);
    if (reverb.buffer) {
        finalChain.connect(revSend);
        revSend.connect(reverb);
    }
    lfoNode.start();

    const activeVoices = new Map();
    let noiseBuffer: AudioBuffer | null = null;
    
    const getOscConfig = (p: any) => {
        if (p.osc && p.osc.length > 0) return p.osc;
        // Дефолтный осциллятор, если не задан
        return [{ type: 'sawtooth', gain: 0.5, octave: 0, detune: 0 }];
    };

    const updateNodesFromPreset = (p: any) => {
        // Компрессор
        compNode.threshold.value = p.comp?.threshold ?? -20;
        compNode.knee.value = p.comp?.knee ?? 10;
        compNode.ratio.value = p.comp?.ratio ?? 12;
        compNode.attack.value = p.comp?.attack ?? 0.005;
        compNode.release.value = p.comp?.release ?? 0.1;
        compMakeup.gain.value = dB(p.comp?.makeup ?? 0);
        
        // Фильтры
        filt.type = 'lowpass';
        filt.frequency.value = p.lpf?.cutoff || 3000;
        filt.Q.value = p.lpf?.q || 1;
        filt2.type = 'lowpass';
        filt2.frequency.value = p.lpf?.cutoff || 3000;
        filt2.Q.value = p.lpf?.q || 1;
        
        // LFO
        lfoNode.type = p.lfo?.shape || 'sine';
        lfoNode.frequency.value = p.lfo?.rate || 0;
        lfoGain.gain.value = p.lfo?.amount || 0;
        
        try { lfoGain.disconnect(); } catch(e){}
        if (lfoGain.gain.value > 0) {
            lfoNode.connect(lfoGain);
            if (p.lfo?.target === 'filter') {
                lfoGain.connect(filt.frequency);
                if (!use2pole) lfoGain.connect(filt2.frequency);
            }
        }
        
        // FX
        revSend.gain.value = p.reverbMix || 0.18;

        if (p.noise?.on) {
            noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
            const d = noiseBuffer.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
        } else {
            noiseBuffer = null;
        }
    };

    updateNodesFromPreset(currentPreset);

    api.noteOn = (midi, when = ctx.currentTime) => {
        const f = midiToHz(midi);
        
        // Для каждой ноты создаем ТОЛЬКО источники звука и vGain
        const vGain = ctx.createGain();
        vGain.gain.value = 0.0;
        vGain.connect(compNode); // Подключаем голос к началу СТАТИЧЕСКОЙ цепи

        const oscConfig = getOscConfig(currentPreset);
        const oscs = oscConfig.map((o: any) => {
            const x = ctx.createOscillator();
            x.type = o.type as OscillatorType;
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

        let noiseNode = null;
        if (currentPreset.noise?.on && noiseBuffer) {
            const n = ctx.createBufferSource();
            n.buffer = noiseBuffer;
            n.loop = true;
            const ng = ctx.createGain();
            ng.gain.value = currentPreset.noise.gain || 0.1;
            n.connect(ng);
            ng.connect(vGain);
            n.start(when);
            noiseNode = { n, ng };
        }
        
        activeVoices.set(midi, { oscs, noise: noiseNode, gain: vGain });
        
        const adsr = currentPreset.adsr || { a: 0.05, d: 0.3, s: 0.7, r: 0.5 };
        vGain.gain.cancelScheduledValues(when);
        vGain.gain.setValueAtTime(0.0001, when);
        vGain.gain.linearRampToValueAtTime(1.0, when + adsr.a);
        vGain.gain.setTargetAtTime(adsr.s, when + adsr.a, Math.max(adsr.d / 3, 0.001));
    };

    api.noteOff = (midi, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi);
        if (!voice) return;
        
        const vGain = voice.gain;
        const r = currentPreset.adsr?.r || 0.5;
        
        vGain.gain.cancelScheduledValues(when);
        vGain.gain.setValueAtTime(vGain.gain.value, when);
        vGain.gain.setTargetAtTime(0.0001, when, Math.max(r / 4, 0.001));
        
        const stopTime = when + r + 0.1;
        voice.oscs.forEach(({ x }: any) => x.stop(stopTime));
        if (voice.noise) voice.noise.n.stop(stopTime);
        
        activeVoices.delete(midi);
    };
    
    api.allNotesOff = () => {
        activeVoices.forEach((_, key) => api.noteOff(key, ctx.currentTime));
    };

    api.setPreset = (p) => {
        console.log('[Factory:Synth] setPreset:', p);
        api.allNotesOff();
        currentPreset = { ...p };
        api.preset = p;
        updateNodesFromPreset(p);
    };
  } else if (type === 'guitar') {
      let {
        variant='shineOn', pickup, drive, comp, post, phaser, delayA, delayB, reverbMix, osc, adsr
      } = { ...preset };

      // --- СТАТИЧЕСКАЯ ЦЕПОЧКА ЭФФЕКТОВ ---
      const guitarInput = ctx.createGain(); 
      const pickupLPF = ctx.createBiquadFilter(); 
      const hpf = ctx.createBiquadFilter(); 
      const compNode = ctx.createDynamicsCompressor();
      const compMakeup = ctx.createGain();
      const shaper = ctx.createWaveShaper();
      const postHPF = ctx.createBiquadFilter();
      const mid1 = ctx.createBiquadFilter();
      const mid2 = ctx.createBiquadFilter();
      const postLPF = ctx.createBiquadFilter();
      const cab = ctx.createConvolver();
      const ph = makePhaser(ctx, phaser);
      const dA = makeFilteredDelay(ctx, delayA);
      const dB_node = delayB ? makeFilteredDelay(ctx, delayB) : null;
      const revSend = ctx.createGain();

      guitarInput.connect(pickupLPF).connect(hpf).connect(compNode).connect(compMakeup)
          .connect(shaper).connect(postHPF).connect(mid1).connect(mid2).connect(postLPF);
      
      let lastInChain: AudioNode = postLPF;
      if (cabinetIRUrl) {
          try {
              cab.buffer = await loadIR(ctx, cabinetIRUrl);
              postLPF.connect(cab);
              lastInChain = cab;
          } catch(e) { console.error('[Guitar] Failed to load cabinet IR', e); }
      }
      
      lastInChain.connect(ph.input);
      let fxChain: AudioNode = ph.output;

      fxChain.connect(dA.input);
      fxChain = dA.output;
      
      if (dB_node) {
        fxChain.connect(dB_node.input);
        fxChain = dB_node.output;
      }
      
      const guitarOut = ctx.createGain();
      fxChain.connect(guitarOut);
      guitarOut.connect(master);
      if (reverb.buffer) {
          guitarOut.connect(revSend);
          revSend.connect(reverb);
      }
      
      const activeVoices = new Map();
      const createPulseOsc = (ctx: AudioContext, freq: number, inputWidth = 0.5) => {
            const width = !isFinite(inputWidth) || inputWidth === null ? 0.5 : inputWidth;
            const real = new Float32Array(32), imag = new Float32Array(32);
            for (let n = 1; n < 32; n++) { 
                const a = (2/(n*Math.PI)) * Math.sin(n*Math.PI*width); 
                real[n]=a; 
            }
            const wave = ctx.createPeriodicWave(real, imag, { disableNormalization:true });
            const o = ctx.createOscillator(); o.setPeriodicWave(wave); o.frequency.value=freq; return o;
        };

      const updateGuitarNodes = (p: any) => {
          pickupLPF.frequency.value = p.pickup?.cutoff ?? 3600; pickupLPF.Q.value = p.pickup?.q ?? 1.0;
          hpf.frequency.value = 90; hpf.Q.value = 0.7;
          compNode.threshold.value = p.comp?.threshold ?? -18; compNode.ratio.value = p.comp?.ratio ?? 3;
          compNode.attack.value = p.comp?.attack ?? 0.01; compNode.release.value = p.comp?.release ?? 0.12;
          compMakeup.gain.value = dB(p.comp?.makeup ?? 3);
          shaper.curve = (p.drive?.type === 'muff') ? makeMuff(p.drive.amount) : makeSoftClip(p.drive.amount);
          postHPF.frequency.value = 80;
          mid1.frequency.value = p.post?.mids[0].f ?? 850; mid1.Q.value = p.post?.mids[0].q ?? 0.9; mid1.gain.value = p.post?.mids[0].g ?? 2;
          mid2.frequency.value = p.post?.mids[1].f ?? 2500; mid2.Q.value = p.post?.mids[1].q ?? 1.4; mid2.gain.value = p.post?.mids[1].g ?? -1.5;
          postLPF.frequency.value = p.post?.lpf ?? 5200;
          revSend.gain.value = p.reverbMix ?? 0.18;
      };
      
      updateGuitarNodes(preset);

      api.noteOn = (midi, when = ctx.currentTime) => {
        const f = midiToHz(midi);
        const vGain = ctx.createGain(); vGain.gain.value = 0.0;

        const sum = ctx.createGain(); sum.gain.value = 0.8;
        const oscMain = createPulseOsc(ctx, f, osc.width);
        const oscDet  = createPulseOsc(ctx, f, (osc.width || 0.5)+0.06); oscDet.detune.value = osc.detune || 0;
        const oscSub  = ctx.createOscillator(); oscSub.type='sine'; oscSub.frequency.value=f/2;
        const gMain=ctx.createGain(); gMain.gain.value=osc.mainGain;
        const gDet =ctx.createGain(); gDet.gain.value =osc.detGain;
        const gSub =ctx.createGain(); gSub.gain.value =osc.subGain;
        
        oscMain.connect(gMain).connect(sum);
        oscDet.connect(gDet).connect(sum);
        oscSub.connect(gSub).connect(sum);
        
        sum.connect(vGain);
        vGain.connect(guitarInput);

        oscMain.start(when); oscDet.start(when); oscSub.start(when);

        vGain.gain.cancelScheduledValues(when);
        vGain.gain.linearRampToValueAtTime(1.0, when + adsr.a);
        vGain.gain.setTargetAtTime(adsr.s, when + adsr.a, adsr.d / 3);

        activeVoices.set(midi, { oscMain, oscDet, oscSub, vGain });
      };

      api.noteOff = (midi, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi);
        if (!voice) return;
        voice.vGain.gain.cancelScheduledValues(when);
        voice.vGain.gain.setValueAtTime(voice.vGain.gain.value, when);
        voice.vGain.gain.setTargetAtTime(0.0001, when, adsr.r / 3);
        const stopTime = when + adsr.r;
        voice.oscMain.stop(stopTime); voice.oscDet.stop(stopTime); voice.oscSub.stop(stopTime);
        activeVoices.delete(midi);
      };

      api.allNotesOff = () => activeVoices.forEach((_, key) => api.noteOff(key));
      api.setPreset = (p) => { 
          api.allNotesOff(); 
          preset = p; 
          api.preset = p;
          updateGuitarNodes(p);
      };
  }

  master.connect(output || ctx.destination);
  console.log(`%c[InstrumentFactory] Build COMPLETED for type: ${type}.`, 'color: #32CD32;');
  return api;
}

    