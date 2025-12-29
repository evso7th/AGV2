

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
    const input = ctx.createGain();
    const output = ctx.createGain();
    const wet = ctx.createGain();
    const dry = ctx.createGain();

    dry.gain.value = 1 - mix;
    wet.gain.value = mix;

    // This connection was the source of the error. It bypassed the wet/dry mix.
    // input.connect(dry); 
    dry.connect(output);

    const delay = ctx.createDelay(0.025); // base delay
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

const makeFilteredDelay = (ctx: AudioContext, {time = 0.38, fb = 0.26, hc = 3600, wet = 0.2}) => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain();
    const wetG = ctx.createGain();
    
    dry.gain.value = 1.0 - wet;
    wetG.gain.value = wet;

    input.connect(dry);
    dry.connect(output);

    const d = ctx.createDelay(2.0);
    d.delayTime.value = time;
    const loop = ctx.createGain();
    loop.gain.value = fb;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = hc;
    lp.Q.value = 0.7;

    input.connect(d);
    d.connect(lp);
    lp.connect(loop);
    loop.connect(d);
    lp.connect(wetG);
    wetG.connect(output);
    
    return {input, output};
};

export async function buildMultiInstrument(ctx: AudioContext, {
  type = 'organ',            // 'organ' | 'synth' | 'mellotron' | 'guitar'
  preset = {} as any,
  cabinetIRUrl = null,       // для guitar (и можно для organ)
  plateIRUrl = null,         // общий plate
  mellotronMap = null,       // { name:'strings', zones: [{note:60,url:'...'}, ...] }
  output = ctx.destination
} = {}) {
  // #ЗАЧЕМ: Главная "фабрика" по созданию сложных V2-инструментов.
  // #ЧТО: В зависимости от параметра 'type' собирает сложную цепочку Web Audio узлов (граф)
  //      для эмуляции различных инструментов: органа, аналогового синтезатора, меллотрона или электрогитары.
  //      Возвращает стандартизированный API для управления этим инструментом.
  // #СВЯЗИ: Вызывается из V2-менеджеров (MelodySynthManagerV2, AccompanimentSynthManagerV2).
  
  console.log(`%c[InstrumentFactory] Build process STARTING for type: ${type}`, 'color: #FFA500; font-weight: bold;');

  // ───── Master FX (plate ревёрб общий)
  const master = ctx.createGain(); master.gain.value = 0.8;
  const reverb = ctx.createConvolver();
  try {
      if (plateIRUrl) {
          reverb.buffer = await loadIR(ctx, plateIRUrl);
      }
  } catch (e) {
      console.error('[InstrumentFactory] Failed to load plate reverb IR, continuing without it.', e);
  }

  const revMix = ctx.createGain(); revMix.gain.value = preset.reverbMix ?? 0.18;
  if (reverb.buffer) {
    reverb.connect(master);
  }

  // API, общий выход
  const api = { 
      connect:(dest?: AudioNode)=>master.connect(dest||output), 
      setParam:(k: string,v: any)=>{}, 
      noteOn:(midi: number, when?: number)=>{}, 
      noteOff:(midi: number, when?: number)=>{}, 
      setPreset:(p: any)=>{}, 
      allNotesOff: () => {},
      preset: preset // Expose preset for easier access
  };

  // ──────────────────────────────────────────────────────────────────────────
  // ORGAN (drawbar + Leslie)
  if (type === 'organ') {
    const {
      drawbars = [8,0,8,8,0,4,0,2,0], // 16',5 1/3',8',4',2 2/3',2',1 3/5',1 1/3',1'
      vibratoRate = 6.0, vibratoDepth = 0.003,
      leslie = { mode:'slow', slow:0.6, fast:6.0, accel:0.6 },
      keyClick = 0.004,
      lpf = 8000, hpf = 90,
      chorusMix = 0.2, reverbMix = 0.15
    } = preset;

    const organOut = ctx.createGain(); organOut.gain.value = 0.6;
    const organLPF = ctx.createBiquadFilter(); organLPF.type='lowpass'; organLPF.frequency.value=lpf; organLPF.Q.value=0.7;
    const organHPF = ctx.createBiquadFilter(); organHPF.type='highpass'; organHPF.frequency.value=hpf; organHPF.Q.value=0.7;
    const chorus = makeChorus(ctx, {rate:0.7, depth:0.005, mix:chorusMix});

    const pan = ctx.createStereoPanner(); pan.pan.value = 0;
    const trem = ctx.createGain(); trem.gain.value = 1.0;
    const lfo = ctx.createOscillator(); lfo.type='sine';
    const lfoPanGain = ctx.createGain(); const lfoAmpGain = ctx.createGain();
    lfoPanGain.gain.value = 0.7; lfoAmpGain.gain.value = 0.08;
    lfo.connect(lfoPanGain); lfo.connect(lfoAmpGain);
    lfoPanGain.connect(pan.pan); lfoAmpGain.connect(trem.gain);
    lfo.start();

    const foot = [0.5, 0.75, 1, 2, 3, 4, 5, 6, 8];
    const activeVoices = new Map();

    const revSend = ctx.createGain(); revSend.gain.value = reverbMix;
    organOut.connect(master);
    if(reverb.buffer) {
        organOut.connect(revSend); revSend.connect(reverb);
    }

    const vib = ctx.createOscillator(); vib.type='sine'; vib.frequency.value=vibratoRate;
    const vibGain = ctx.createGain(); vibGain.gain.value = vibratoDepth * 100; // vibrato is in cents
    vib.connect(vibGain); vib.start();

    let targetRate = (leslie.mode==='fast'? leslie.fast : leslie.slow);
    lfo.frequency.value = targetRate;
    const setLeslie = (mode: 'fast' | 'slow')=>{
      targetRate = (mode==='fast'? leslie.fast : leslie.slow);
      const now = ctx.currentTime;
      lfo.frequency.cancelScheduledValues(now);
      lfo.frequency.setTargetAtTime(targetRate, now, leslie.accel);
    };

    api.noteOn = (midi, when=ctx.currentTime) => {
      console.log(`%c[Organ] noteOn triggered for MIDI: ${midi}`, 'color: lightblue');
      if (activeVoices.has(midi)) {
          api.noteOff(midi, when);
      }
      const f0 = midiToHz(midi);
      
      const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; console.log(`[Organ MIDI=${midi}] Created voiceGain`);
      
      voiceGain.connect(chorus.input); console.log(`[Organ MIDI=${midi}] Connected voiceGain -> chorus`);
      chorus.output.connect(organHPF);
      organHPF.connect(organLPF);
      organLPF.connect(trem);
      trem.connect(pan);
      pan.connect(organOut); console.log(`[Organ MIDI=${midi}] Connected pan -> organOut`);

      const kc = ctx.createBufferSource();
      const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate*keyClick), ctx.sampleRate);
      const d = noise.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.2;
      kc.buffer=noise; const kcEnv=ctx.createGain(); kcEnv.gain.value=0.6; kc.connect(kcEnv); kcEnv.connect(voiceGain); kc.start(when); kc.stop(when+keyClick);

      const oscs = foot.map((ft, i) => {
        if(drawbars[i] === 0) return null;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f0*ft, when);
        vibGain.connect(osc.detune);
        const g = ctx.createGain(); g.gain.value = (drawbars[i]/8)*0.4;
        osc.connect(g); g.connect(voiceGain);
        osc.start(when);
        return {osc,g};
      }).filter(o => o !== null);

      activeVoices.set(midi, { oscs, voiceGain });
      
      voiceGain.gain.cancelScheduledValues(when);
      voiceGain.gain.linearRampToValueAtTime(1.0, when+0.01);
    };
    api.noteOff = (midi, when=ctx.currentTime) => {
      console.log(`%c[Organ] noteOff triggered for MIDI: ${midi}`, 'color: lightcoral');
      const voice = activeVoices.get(midi);
      if (!voice) return;
      voice.voiceGain.gain.cancelScheduledValues(when);
      voice.voiceGain.gain.linearRampToValueAtTime(0.0001, when+0.05);
      voice.oscs.forEach(({osc}: any)=>osc.stop(when+0.06));
      activeVoices.delete(midi);
    };
    api.setParam = (k,v)=>{
      if (k==='leslie') setLeslie(v); 
      if (k==='lpf') organLPF.frequency.value = v;
    };
    api.allNotesOff = () => {
      activeVoices.forEach((value, key) => {
        api.noteOff(key, ctx.currentTime);
      });
    };
    api.setPreset = (p)=>{ api.preset = p; /* Logic to update params */ };
  }
  
  // ──────────────────────────────────────────────────────────────────────────
  // SYNTH (subtractive pad/lead)
  else if (type === 'synth') {
    // DIAGNOSTIC LOG 1
    console.log(`[Factory:Synth] Building with preset:`, preset);

    const {
        osc = [],
        noise = { on: false, color: 'white', gain: 0.0 },
        adsr = { a: 0.1, d: 0.5, s: 0.5, r: 1.0 },
        lpf = { cutoff: 3000, q: 1, mode: '12dB' },
        lfo = { rate: 0, amount: 0, target: 'filter' },
        chorus = { on: false, rate: 0, depth: 0, mix: 0 },
        delay = { on: false, time: 0, fb: 0, hc: 0, mix: 0 },
        reverbMix = 0.18
    } = preset;

    const pre = ctx.createGain(); pre.gain.value = 0.9;
    
    const filt = ctx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=lpf.cutoff; filt.Q.value=lpf.q;
    const filt2 = ctx.createBiquadFilter(); filt2.type='lowpass'; filt2.frequency.value=lpf.cutoff; filt2.Q.value=lpf.q;
    const use2pole = (lpf.mode!=='24dB');
    const mainChain = use2pole ? (pre.connect(filt), filt) : (pre.connect(filt), filt.connect(filt2), filt2);
    
    const finalChain = ctx.createGain();
    mainChain.connect(finalChain);

    if (chorus.on) {
        const chorusNode = makeChorus(ctx, chorus);
        mainChain.connect(chorusNode.input);
        chorusNode.output.connect(finalChain);
    }
    if (delay.on) {
        const delayNode = makeFilteredDelay(ctx, delay);
        finalChain.connect(delayNode.input);
        delayNode.output.connect(master); // Connect delay output to master
    } else {
        finalChain.connect(master);
    }
    
    const revSend = ctx.createGain(); revSend.gain.value = reverbMix;
    if (reverb.buffer) {
        finalChain.connect(revSend);
        revSend.connect(reverb);
    }

    if (lfo?.amount > 0){
      const l = ctx.createOscillator(); l.type='sine'; l.frequency.value=lfo.rate;
      const lg=ctx.createGain(); lg.gain.value=lfo.amount;
      l.connect(lg);
      if (lfo.target==='filter'){ lg.connect(filt.frequency); if (!use2pole) lg.connect(filt2.frequency); }
      l.start();
    }

    const activeVoices = new Map();
    let noiseBuffer: AudioBuffer | null = null;
    if(noise.on) {
        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = noiseBuffer.getChannelData(0);
        for(let i=0; i<d.length; i++) {
            d[i] = (Math.random() * 2 - 1);
        }
    }

    api.noteOn = (midi, when=ctx.currentTime) => {
      // DIAGNOSTIC LOG 2
      console.log(`%c[Factory:Synth] api.noteOn triggered - MIDI: ${midi}, Time: ${when}`, 'color: yellow');

      const f = midiToHz(midi);
      
      const vGain = ctx.createGain(); vGain.gain.value = 0.0;
      vGain.connect(pre);

      const oscs = osc.map((o: any)=>{
        const x = ctx.createOscillator(); x.type=o.type as OscillatorType; 
        const detuneFactor = Math.pow(2, (o.detune || 0) / 1200);
        const octaveFactor = Math.pow(2, o.octave || 0);
        x.frequency.setValueAtTime(f * detuneFactor * octaveFactor, when);
        
        const g = ctx.createGain(); g.gain.value=o.gain;
        x.connect(g); g.connect(vGain);
        x.start(when);
        return {x,g};
      });

      let noiseNode = null;
      if (noise.on && noiseBuffer){
        const n = ctx.createBufferSource();
        n.buffer = noiseBuffer;
        n.loop = true;
        const ng = ctx.createGain(); ng.gain.value=noise.gain;
        n.connect(ng); ng.connect(vGain); n.start(when);
        noiseNode = {n,ng};
      }
      
      const voicePackage = { oscs, noise: noiseNode, gain: vGain };
      activeVoices.set(midi, voicePackage);
      
      // DIAGNOSTIC LOG 3
      console.log(`[Factory:Synth] ADSR applied: a=${adsr.a}, d=${adsr.d}, s=${adsr.s}`);

      vGain.gain.cancelScheduledValues(when);
      vGain.gain.setValueAtTime(0.0001, when);
      vGain.gain.linearRampToValueAtTime(1.0, when+adsr.a);
      vGain.gain.setTargetAtTime(adsr.s, when+adsr.a, adsr.d / 3);
    };

    api.noteOff = (midi, when=ctx.currentTime) => {
      const voice = activeVoices.get(midi);
      if (!voice) return;
      
      const vGain = voice.gain;
      const r = adsr.r || 1.0;
      vGain.gain.cancelScheduledValues(when);
      vGain.gain.setTargetAtTime(0.0001, when, r / 3);
      
      const stopTime = when + r * 2;
      voice.oscs.forEach(({x}: any)=>x.stop(stopTime));
      if (voice.noise){
          voice.noise.n.stop(stopTime);
      }
      activeVoices.delete(midi);
    };
    api.allNotesOff = () => {
      activeVoices.forEach((value, key) => {
        api.noteOff(key, ctx.currentTime);
      });
    };
    api.setParam=(k,v)=>{ if (k==='cutoff') filt.frequency.value=v; };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MELLOTRON (sample + wow/flutter + tapeNoise)
  else if (type === 'mellotron') {
    const {
      instrument = 'strings', // 'strings'|'choir'|'flute' (подберите карту)
      attack = 0.04, release = 0.35,
      wow = { rate: 0.3, depth: 0.003 },
      flutter = { rate: 5.5, depth: 0.0008 },
      noise = { level: -36 }, // dB
      lpf = 9000, hpf = 120,
      reverbMix = 0.2
    } = preset;

    const zones = (mellotronMap?.zones ?? []).filter((z: any)=>z.name===instrument || !z.name);
    const cache: Record<string, AudioBuffer> = {};
    if(zones.length === 0) console.warn(`[Mellotron] No sample zones found for instrument: ${instrument}`);
    
    for (const z of zones) {
        if(z.url) cache[z.note] = await loadSample(ctx, z.url);
    }
    
    const out = ctx.createGain(); out.gain.value=0.9;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=lpf; lp.Q.value=0.5;
    const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=hpf; hp.Q.value=0.7;
    out.connect(hp); hp.connect(lp); lp.connect(master);
    const revSend = ctx.createGain(); revSend.gain.value = reverbMix;
    if(reverb.buffer) {
        lp.connect(revSend); revSend.connect(reverb);
    }

    const noiseB = ctx.createBufferSource();
    const nb = ctx.createBuffer(1, ctx.sampleRate*2, ctx.sampleRate); const d = nb.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.4;
    noiseB.buffer=nb; noiseB.loop=true;
    const noiseG = ctx.createGain(); noiseG.gain.value = dB(noise.level); noiseB.connect(noiseG); noiseG.connect(lp); noiseB.start();

    const activeNotes = new Map();

    api.noteOn = (midi, when=ctx.currentTime) => {
      const notes = Object.keys(cache).map(n=>+n).sort((a,b)=>Math.abs(a-midi)-Math.abs(b-midi));
      const root = notes[0] ?? 60;
      if (!cache[root]) return;

      const src = ctx.createBufferSource(); src.buffer = cache[root]; src.loop = true;
      const playback = Math.pow(2, (midi - root)/12);
      src.playbackRate.value = playback;

      const lfoWow = ctx.createOscillator(); lfoWow.type='sine'; lfoWow.frequency.value=wow.rate;
      const lfoWg = ctx.createGain(); lfoWg.gain.value = wow.depth*playback;
      const lfoFl = ctx.createOscillator(); lfoFl.type='sine'; lfoFl.frequency.value=flutter.rate;
      const lfoFg = ctx.createGain(); lfoFg.gain.value = flutter.depth*playback;
      lfoWow.connect(lfoWg); lfoFl.connect(lfoFg);
      lfoWg.connect(src.playbackRate); lfoFg.connect(src.playbackRate);
      lfoWow.start(when); lfoFl.start(when);

      const vg = ctx.createGain(); vg.gain.value=0.0;
      src.connect(vg); vg.connect(out);
      src.start(when);
      vg.gain.linearRampToValueAtTime(1.0, when+attack);

      activeNotes.set(midi, {src, vg, lfoWow, lfoFl});
    };
    api.noteOff = (midi, when=ctx.currentTime) => {
      const current = activeNotes.get(midi);
      if (!current) return;
      current.vg.gain.cancelScheduledValues(when);
      current.vg.gain.linearRampToValueAtTime(0.0001, when+release);
      current.src.stop(when+release+0.05);
      try { current.lfoWow.stop(when+release+0.05); current.lfoFl.stop(when+release+0.05); } catch{}
      activeNotes.delete(midi);
    };
     api.allNotesOff = () => {
      activeNotes.forEach((value, key) => {
        api.noteOff(key, ctx.currentTime);
      });
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GUITAR (Gilmour shineOn / muffLead)
  else if (type === 'guitar') {
    const {
      variant='shineOn', // 'shineOn' | 'muffLead'
      pickup = { cutoff: 3600, q: 1.0 },
      drive = { type: (variant==='muffLead'?'muff':'soft'), amount: (variant==='muffLead'?0.65:0.2) },
      comp  = { threshold: (variant==='muffLead'?-20:-18), ratio:(variant==='muffLead'?4:3), attack:0.01, release:0.12, makeup: +3 },
      post = { lpf:(variant==='muffLead'?4700:5200), mids: [{f:850,q:0.9,g:+2},{f:(variant==='muffLead'?3200:2500),q:1.4,g:(variant==='muffLead'?-2:-1.5)}] },
      phaser = { stages:4, base:(variant==='muffLead'?900:800), depth:(variant==='muffLead'?700:600), rate:(variant==='muffLead'?0.18:0.16), fb:0.12, mix:(variant==='muffLead'?0.18:0.22) },
      delayA = { time:0.38, fb:(variant==='muffLead'?0.26:0.28), hc:3600, wet:(variant==='muffLead'?0.16:0.22) },
      delayB = (variant==='muffLead'? { time:0.52, fb:0.22, hc:3600, wet:0.12 } : null),
      reverbMix = (variant==='muffLead'?0.2:0.18),
      osc = { width:0.46, detune: (variant==='muffLead'?7:5), mainGain:(variant==='muffLead'?0.8:0.85), detGain:(variant==='muffLead'?0.2:0.18), subGain:(variant==='muffLead'?0.3:0.25) },
      adsr = { a:(variant==='muffLead'?0.008:0.006), d:(variant==='muffLead'?0.5:0.35), s:(variant==='muffLead'?0.65:0.6), r:(variant==='muffLead'?1.8:1.6) }
    } = preset;

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
    
    const pickupLPF = ctx.createBiquadFilter(); pickupLPF.type='lowpass'; pickupLPF.frequency.value=pickup.cutoff; pickupLPF.Q.value=pickup.q;
    const hpf = ctx.createBiquadFilter(); hpf.type='highpass'; hpf.frequency.value=90; hpf.Q.value=0.7;

    const compNode = ctx.createDynamicsCompressor();
    compNode.threshold.value=comp.threshold; compNode.ratio.value=comp.ratio; compNode.attack.value=comp.attack; compNode.release.value=comp.release;
    const compMakeup = ctx.createGain(); compMakeup.gain.value = dB(comp.makeup||0);

    const shaper = ctx.createWaveShaper(); shaper.curve = (drive.type==='muff') ? makeMuff(drive.amount) : makeSoftClip(drive.amount); shaper.oversample='4x';

    const postHPF = ctx.createBiquadFilter(); postHPF.type='highpass'; postHPF.frequency.value=80; postHPF.Q.value=0.7;
    const mid1 = ctx.createBiquadFilter(); mid1.type='peaking'; mid1.frequency.value=post.mids[0].f; mid1.Q.value=post.mids[0].q; mid1.gain.value=post.mids[0].g;
    const mid2 = ctx.createBiquadFilter(); mid2.type='peaking'; mid2.frequency.value=post.mids[1].f; mid2.Q.value=post.mids[1].q; mid2.gain.value=post.mids[1].g;
    const postLPF = ctx.createBiquadFilter(); postLPF.type='lowpass'; postLPF.frequency.value=post.lpf; postLPF.Q.value=0.7;

    const cab = ctx.createConvolver(); 
    try {
      if (cabinetIRUrl) cab.buffer = await loadIR(ctx, cabinetIRUrl);
    } catch(e) { console.error('[Guitar] Failed to load cabinet IR', e); }

    const ph = makePhaser(ctx, phaser);
    const dA = makeFilteredDelay(ctx, {time:delayA.time, fb:delayA.fb, hc:delayA.hc, wet:delayA.wet});
    const dB_node = delayB ? makeFilteredDelay(ctx, {time:delayB.time, fb:delayB.fb, hc:delayB.hc, wet:delayB.wet}) : null;

    const revSend = ctx.createGain(); revSend.gain.value = reverbMix;
    if(reverb.buffer) { revSend.connect(reverb); }
    
    let activeVoices = new Map<number, { oscMain: OscillatorNode, oscDet: OscillatorNode, oscSub: OscillatorNode, vGain: GainNode }>();

    api.noteOn = (midi, when=ctx.currentTime)=>{
      const f = midiToHz(midi);
      const vGain = ctx.createGain(); vGain.gain.value=0.0;

      const oscMain = createPulseOsc(ctx, f, osc.width);
      const oscDet  = createPulseOsc(ctx, f, (osc.width || 0.5)+0.06); oscDet.detune.value = osc.detune || 0;
      const oscSub  = ctx.createOscillator(); oscSub.type='sine'; oscSub.frequency.value=f/2;
      const gMain=ctx.createGain(); gMain.gain.value=osc.mainGain;
      const gDet =ctx.createGain(); gDet.gain.value =osc.detGain;
      const gSub =ctx.createGain(); gSub.gain.value =osc.subGain;
      const sum = ctx.createGain(); sum.gain.value=0.8;
      oscMain.connect(gMain).connect(sum);
      oscDet.connect(gDet).connect(sum);
      oscSub.connect(gSub).connect(sum);
      oscMain.start(when); oscDet.start(when); oscSub.start(when);

      sum.connect(vGain);
      vGain.connect(pickupLPF);
      pickupLPF.connect(hpf);
      hpf.connect(compNode); compNode.connect(compMakeup);
      compMakeup.connect(shaper);
      shaper.connect(postHPF);
      postHPF.connect(mid1); mid1.connect(mid2); mid2.connect(postLPF);
      const afterCab = (cabinetIRUrl && cab.buffer ? (postLPF.connect(cab), cab) : postLPF);

      afterCab.connect(ph.input);
      if(dA) ph.output.connect(dA.input);
      if (dB_node) ph.output.connect(dB_node.input);

      ph.output.connect(master); ph.output.connect(revSend);
      if(dA) dA.output.connect(revSend); if (dB_node) dB_node.output.connect(revSend);

      vGain.gain.cancelScheduledValues(when);
      vGain.gain.setValueAtTime(vGain.gain.value, when);
      vGain.gain.linearRampToValueAtTime(1.0, when+adsr.a);
      vGain.gain.setTargetAtTime(adsr.s, when+adsr.a, adsr.d / 3);

      activeVoices.set(midi, { oscMain, oscDet, oscSub, vGain });
    };
    api.noteOff=(midi, when=ctx.currentTime)=>{
      const voice = activeVoices.get(midi);
      if(!voice) return;
      const { oscMain, oscDet, oscSub, vGain } = voice;

      vGain.gain.cancelScheduledValues(when);
      vGain.gain.setValueAtTime(vGain.gain.value, when);
      vGain.gain.setTargetAtTime(0.0001, when, adsr.r / 3);
      
      const stopTime = when + adsr.r;
      oscMain.stop(stopTime);
      oscDet.stop(stopTime);
      oscSub.stop(stopTime);
      activeVoices.delete(midi);
    };
     api.allNotesOff = () => {
      activeVoices.forEach((value, key) => {
        api.noteOff(key, ctx.currentTime);
      });
    };
    api.setParam=(k,v)=>{
      if (k==='pickupLPF') pickupLPF.frequency.value=v;
      if (k==='drive') shaper.curve=(drive.type==='muff')?makeMuff(v):makeSoftClip(v);
    };
  } else {
      console.log(`[InstrumentFactory] Unknown or unhandled instrument type: ${type}. Creating fallback gain node.`);
  }

  master.connect(output || ctx.destination);
  
  console.log(`%c[InstrumentFactory] Build process COMPLETED for type: ${type}. Final output connected.`, 'color: #32CD32;');
  return api;
}
