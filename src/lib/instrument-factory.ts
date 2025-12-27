
// ─────────────────────────────────────────────────────────────────────────────
// MultiInstrument WebAudio: organ | synth | mellotron | guitar
// ─────────────────────────────────────────────────────────────────────────────

export async function buildMultiInstrument(ctx: AudioContext, {
  type = 'organ',            // 'organ' | 'synth' | 'mellotron' | 'guitar'
  preset = {} as any,
  cabinetIRUrl = null,       // для guitar (и можно для organ)
  plateIRUrl = null,         // общий plate
  mellotronMap = null,       // { name:'strings', zones: [{note:60,url:'...'}, ...] }
  output = ctx.destination
} = {}) {

  // ───── Helpers
  const loadIR = async (url: string | null) => {
    if (!url) return null;
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return await ctx.decodeAudioData(buf);
  };
  const loadSample = async (url: string) => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return await ctx.decodeAudioData(buf);
  };
  const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
  const dB = (x: number)=>Math.pow(10, x/20);

  const makeSoftClip = (amount=0.5, n=65536) => {
    const c=new Float32Array(n); const k=amount*10+1;
    for (let i=0;i<n;i++){ const x=i/(n-1)*2-1; c[i]=Math.tanh(k*x)/Math.tanh(k); }
    return c;
  };
  const makeMuff = (gain=0.65, n=65536) => {
    const c=new Float32Array(n);
    for (let i=0;i<n;i++){ const x=i/(n-1)*2-1; const y=Math.tanh(x*(1+gain*4))*0.9; c[i]=y; }
    return c;
  };
  const makePhaser = (ctx: AudioContext,{stages=4, base=800, depth=600, rate=0.16, fb=0.12, mix=0.2})=>{
    const input=ctx.createGain(), out=ctx.createGain(), wet=ctx.createGain(), dry=ctx.createGain();
    wet.gain.value=mix; dry.gain.value=1-mix;
    let head: AudioNode =input; const aps=[]; 
    for(let i=0;i<stages;i++){ const ap=ctx.createBiquadFilter(); ap.type='allpass'; ap.frequency.value=base*((i%2)?1.2:0.8); ap.Q.value=0.6; head.connect(ap); head=ap; aps.push(ap); }
    const fbG=ctx.createGain(); fbG.gain.value=fb; (aps[aps.length-1] as BiquadFilterNode).connect(fbG); fbG.connect(aps[0]);
    const lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=rate; const lfoG=ctx.createGain(); lfoG.gain.value=depth; lfo.connect(lfoG); aps.forEach(ap=>lfoG.connect(ap.frequency)); lfo.start();
    input.connect(dry); (aps[aps.length-1] as BiquadFilterNode).connect(wet); dry.connect(out); wet.connect(out);
    return {input, output: out, setRate:(r: number)=>lfo.frequency.value=r, setDepth:(d: number)=>lfoG.gain.value=d};
  };
  const makeChorus = (ctx: AudioContext,{rate=0.25, depth=0.006, mix=0.25})=>{
    const input=ctx.createGain(), out=ctx.createGain(), wet=ctx.createGain(), dry=ctx.createGain();
    wet.gain.value=mix; dry.gain.value=1-mix;
    const d1=ctx.createDelay(0.03), d2=ctx.createDelay(0.03);
    const l1=ctx.createOscillator(), g1=ctx.createGain(); l1.type='sine'; l1.frequency.value=rate; g1.gain.value=depth; l1.connect(g1); g1.connect(d1.delayTime); l1.start();
    const l2=ctx.createOscillator(), g2=ctx.createGain(); l2.type='sine'; l2.frequency.value=rate*1.11; g2.gain.value=depth*1.1; l2.connect(g2); g2.connect(d2.delayTime); l2.start();
    const s1=ctx.createGain(), s2=ctx.createGain(); input.connect(s1); input.connect(s2); s1.connect(d1); s2.connect(d2); d1.connect(wet); d2.connect(wet);
    input.connect(dry); dry.connect(out); wet.connect(out);
    return {input, output: out};
  };
  const makeFilteredDelay = (ctx: AudioContext,{time=0.38, fb=0.26, hc=3600, wet=0.2})=>{
    const input=ctx.createGain(), out=ctx.createGain(), wetG=ctx.createGain(); wetG.gain.value=wet;
    const d=ctx.createDelay(2.0); d.delayTime.value=time;
    const loop=ctx.createGain(); loop.gain.value=fb;
    const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=hc; lp.Q.value=0.7;
    input.connect(d); d.connect(lp); lp.connect(loop); loop.connect(d);
    lp.connect(wetG); wetG.connect(out);
    return {input, output: out};
  };

  // ───── Master FX (plate ревёрб общий)
  const master = ctx.createGain(); master.gain.value = 0.8;
  const reverb = ctx.createConvolver(); if (plateIRUrl) reverb.buffer = await loadIR(plateIRUrl);
  const revMix = ctx.createGain(); revMix.gain.value = preset.reverbMix ?? 0.18;
  if (reverb.buffer) {
    reverb.connect(master);
  }

  // API, общий выход
  const api = { connect:(dest?: AudioNode)=>master.connect(dest||output), setParam:(k: string,v: any)=>{}, noteOn:(midi: number, when?: number)=>{}, noteOff:(when?: number)=>{}, setPreset:(p: any)=>{} };

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

    // Leslie (упрощённо): амп‑мод+пан‑мод с ускорением
    const pan = ctx.createStereoPanner(); pan.pan.value = 0;
    const trem = ctx.createGain(); trem.gain.value = 1.0;
    const lfo = ctx.createOscillator(); lfo.type='sine';
    const lfoPanGain = ctx.createGain(); const lfoAmpGain = ctx.createGain();
    lfoPanGain.gain.value = 0.7; lfoAmpGain.gain.value = 0.08; // ширина/амп‑колесо
    lfo.connect(lfoPanGain); lfo.connect(lfoAmpGain);
    lfoPanGain.connect(pan.pan); lfoAmpGain.connect(trem.gain);
    lfo.start();

    // Drawbar partials
    const foot = [16, 5.333, 8, 4, 2.666, 2, 1.6, 1.333, 1];
    const gains = drawbars.map(v => (v/8));
    let activeOscs: any[] = [];
    const voiceGain = ctx.createGain(); voiceGain.gain.value = 0;

    // chain
    voiceGain.connect(chorus.input);
    chorus.output.connect(organHPF);
    organHPF.connect(organLPF);
    organLPF.connect(trem);
    trem.connect(pan);
    pan.connect(organOut);

    // mix to reverb and master
    const revSend = ctx.createGain(); revSend.gain.value = reverbMix;
    organOut.connect(master);
    if(reverb.buffer) {
        organOut.connect(revSend); revSend.connect(reverb);
    }

    // vibrato (мелкий pitch LFO на все осцилляторы)
    const vib = ctx.createOscillator(); vib.type='sine'; vib.frequency.value=vibratoRate;
    const vibGain = ctx.createGain(); vibGain.gain.value = vibratoDepth; vib.connect(vibGain); vib.start();

    // leslie speed control
    let targetRate = (leslie.mode==='fast'? leslie.fast : leslie.slow);
    lfo.frequency.value = targetRate;
    const setLeslie = (mode: 'fast' | 'slow')=>{
      targetRate = (mode==='fast'? leslie.fast : leslie.slow);
      const now = ctx.currentTime;
      lfo.frequency.cancelScheduledValues(now);
      lfo.frequency.setTargetAtTime(targetRate, now, leslie.accel);
    };

    api.noteOn = (midi, when=ctx.currentTime) => {
      const f0 = midiToHz(midi);
      // key click (очень короткий шумовой импульс)
      const kc = ctx.createBufferSource();
      const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate*keyClick), ctx.sampleRate);
      const d = noise.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.2;
      kc.buffer=noise; const kcEnv=ctx.createGain(); kcEnv.gain.value=0.6; kc.connect(kcEnv); kcEnv.connect(voiceGain); kc.start(when); kc.stop(when+keyClick);

      // Частоты гармоник по футам
      activeOscs = foot.map((ft, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine'; // гладкие паршалы
        const ratio = (8/ft); // основной 8'
        osc.frequency.setValueAtTime(f0*ratio, when);
        const g = ctx.createGain(); g.gain.value = gains[i]*0.4;
        osc.connect(g); g.connect(voiceGain);
        vibGain.connect(osc.detune); // vibrato
        osc.start(when);
        return {osc,g};
      });
      // envelope (у органа почти нет ADSR — делаем мягкий gate)
      voiceGain.gain.cancelScheduledValues(when);
      voiceGain.gain.linearRampToValueAtTime(1.0, when+0.01);
    };
    api.noteOff = (when=ctx.currentTime) => {
      voiceGain.gain.cancelScheduledValues(when);
      voiceGain.gain.linearRampToValueAtTime(0.0001, when+0.05);
      activeOscs.forEach(({osc})=>osc.stop(when+0.06));
      activeOscs = [];
    };
    api.setParam = (k,v)=>{
      if (k==='leslie') setLeslie(v); 
      if (k==='pickupLPF'||k==='lpf') organLPF.frequency.value = v;
    };
    api.setPreset = (p)=>{ /* можно маппить drawbars/vibrato/leslie */ };

    // выход
    return api;
  }
  
  master.connect(output);
  return api;
}
