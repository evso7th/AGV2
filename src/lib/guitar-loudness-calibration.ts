/**
 * @fileOverview ДЕВ-инструмент калибровки громкости гитар (Option A — офлайн-замер RMS).
 * #ЗАЧЕМ: объективно измерить воспринимаемую громкость каждой гитары и вычислить трим
 * относительно референса (telecaster = 0 дБ) для заполнения GUITAR_LOUDNESS_TRIM_DB.
 *
 * Изолировано: использует собственные OfflineAudioContext, ничего в проде не трогает.
 * Результат — числа в консоль/на экран; их вручную вписываем в guitar-loudness.ts.
 */

import { TelecasterGuitarSampler } from './telecaster-guitar-sampler';
import { DarkTelecasterSampler } from './dark-telecaster-sampler';
import { BlackGuitarSampler } from './black-guitar-sampler';
import { CS80GuitarSampler } from './cs80-guitar-sampler';
import { buildMultiInstrument } from './instrument-factory';
import { V2_PRESETS } from './presets-v2';

const SR = 44100;
const REF_MIDI = 57;        // A3 — есть у всех источников
const REF_VEL = 0.8;
const NOTE_START = 0.5;     // запуск ноты позже 0, чтобы preamp (setTargetAtTime) устаканился
const RENDER_SEC = 2.5;
const WIN_START = NOTE_START + 0.05;   // 0.55 c
const WIN_END = NOTE_START + 0.30;     // 0.80 c — тело ноты, до 1-го повтора дилея DarkTele (0.83)

// #ВАЖНО: preamp-усиления ДОЛЖНЫ совпадать с тем, что ставит движок
// (audio-engine-context: SAMPLER_DEFAULTS × пользовательские gains = 1.0).
const ENGINE_PREAMP: Record<string, number> = {
    telecaster: 0.15,       // SAMPLER_DEFAULTS.electric × 1.0
    darkTelecaster: 2.2,    // 2.2 × electric(1.0)
    blackAcoustic: 0.15,    // SAMPLER_DEFAULTS.acoustic × 1.0
    cs80: 0.4,              // SAMPLER_DEFAULTS.cs80 × 1.0
};

function rms(buf: AudioBuffer): number {
    const data = buf.getChannelData(0);
    const i0 = Math.floor(WIN_START * SR);
    const i1 = Math.min(buf.length, Math.floor(WIN_END * SR));
    let sum = 0, n = 0;
    for (let i = i0; i < i1; i++) { sum += data[i] * data[i]; n++; }
    return n ? Math.sqrt(sum / n) : 0;
}

type AnySampler = {
    init: (...a: any[]) => Promise<boolean>;
    schedule: (notes: any[], time: number, tempo?: number) => void;
    setPreampGain: (g: number) => void;
    setOutputTrim?: (db: number) => void;
};

async function renderSampler(
    make: (ctx: OfflineAudioContext) => AnySampler,
    preampGain: number
): Promise<number> {
    const ctx = new OfflineAudioContext(1, Math.ceil(SR * RENDER_SEC), SR);
    const sampler = make(ctx);
    await sampler.init();
    sampler.setOutputTrim?.(0);          // трим нейтрален (как в проде сейчас)
    sampler.setPreampGain(preampGain);   // совпадает с движком
    sampler.schedule(
        [{ midi: REF_MIDI, time: 0, velocity: REF_VEL, duration: RENDER_SEC }],
        NOTE_START,
        72
    );
    const rendered = await ctx.startRendering();
    return rms(rendered);
}

async function renderSynth(presetName: 'guitar_shineOn' | 'guitar_muffLead'): Promise<number> {
    const ctx = new OfflineAudioContext(1, Math.ceil(SR * RENDER_SEC), SR);
    const preset = V2_PRESETS[presetName];
    // Менеджер ставит preamp=1.0 (unity), outputTrim=0 → измеряем выход инструмента как есть.
    const inst = await buildMultiInstrument(ctx as unknown as AudioContext, {
        type: 'guitar',
        preset,
        output: ctx.destination,
    });
    inst.noteOn(REF_MIDI, NOTE_START, REF_VEL, RENDER_SEC);
    const rendered = await ctx.startRendering();
    return rms(rendered);
}

export interface LoudnessRow { rms: number; db: number; }

export async function measureGuitarLoudness(): Promise<Record<string, LoudnessRow>> {
    const raw: Record<string, number> = {};

    raw.telecaster = await renderSampler(
        c => new TelecasterGuitarSampler(c as unknown as AudioContext, c.destination), ENGINE_PREAMP.telecaster);
    raw.darkTelecaster = await renderSampler(
        c => new DarkTelecasterSampler(c as unknown as AudioContext, c.destination), ENGINE_PREAMP.darkTelecaster);
    raw.blackAcoustic = await renderSampler(
        c => new BlackGuitarSampler(c as unknown as AudioContext, c.destination), ENGINE_PREAMP.blackAcoustic);
    raw.cs80 = await renderSampler(
        c => new CS80GuitarSampler(c as unknown as AudioContext, c.destination), ENGINE_PREAMP.cs80);
    raw.guitar_shineOn = await renderSynth('guitar_shineOn');
    raw.guitar_muffLead = await renderSynth('guitar_muffLead');

    const ref = raw.telecaster || 1e-9;
    const table: Record<string, LoudnessRow> = {};
    for (const k of Object.keys(raw)) {
        const v = raw[k] || 1e-9;
        // трим, который ПРИВЁЛ БЫ инструмент к уровню телекастера
        table[k] = { rms: v, db: 20 * Math.log10(ref / v) };
    }
    return table;
}
