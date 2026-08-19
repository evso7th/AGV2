
/**
 * @fileOverview Drum Fill Registry & Shadow Drummer Engine V1.3
 * #ЗАЧЕМ: Устранение пауз и просадок громкости в сбивках.
 * #ЧТО: ПЛАН №2106 — Все паттерны теперь начинаются с t:0 (Full-Bar). Velocity поднят до 1.25-1.40.
 */

import type { FractalEvent, Technique } from '@/types/music';
import { TICK_TO_BEAT } from '../music-theory';

// ──────────────────────────────────────────────────────────────
// ⚙️ ДЕКЛАРАТИВНАЯ КОНФИГУРАЦИЯ (Корректируйте здесь)
// ──────────────────────────────────────────────────────────────

export const FILL_CONFIG = {
    triggerEveryNBars: 8,       // Сбивка каждый 8-й такт
    tensionThreshold: 0.88,     // Принудительная сбивка при высоком напряжении
    historyLimit: 5,            // Глубина памяти уникальности
    excludedGenres: ['ambient'], // Жанры без сбивок
    defaultVelocity: 1.25       // БАЗОВАЯ МОЩЬ (соответствует основному ритму)
};

// ──────────────────────────────────────────────────────────────
// 🥁 РЕЕСТР ПОЛНОТАКТОВЫХ ПАТТЕРНОВ (1 такт = 12 тиков)
// ──────────────────────────────────────────────────────────────

type FillPattern = {
    id: string;
    events: { t: number, d: number, type: string, v?: number, tech?: Technique }[];
};

export const FILL_PATTERNS: { straight: FillPattern[], shuffle: FillPattern[] } = {
    // --- STRAIGHT (Trance, Rock, House) ---
    straight: [
        { id: 'S_EPIC_ROLL_CRASH', events: [
            { t: 0, d: 3, type: 'drum_kick_reso', v: 1.35 }, // Мощный старт вместо паузы
            { t: 3, d: 3, type: 'drum_kick_reso', v: 1.20 },
            { t: 6, d: 1, type: 'drum_snare', v: 1.25 },
            { t: 6.75, d: 1, type: 'drum_snare', v: 1.10 },
            { t: 7.5, d: 1, type: 'drum_snare', v: 1.20 },
            { t: 8.25, d: 1, type: 'drum_Sonor_Classix_High_Tom', v: 1.30 },
            { t: 9, d: 1, type: 'drum_Sonor_Classix_Mid_Tom', v: 1.30 },
            { t: 9.75, d: 1, type: 'drum_Sonor_Classix_Low_Tom', v: 1.35 },
            { t: 10.5, d: 1.5, type: 'drum_snare', v: 1.40 },
            { t: 11.5, d: 2, type: 'drum_crash2', v: 0.75 }
        ]},
        { id: 'S_MACHINE_GUN_GHOST', events: [
            { t: 0, d: 3, type: 'drum_kick_reso', v: 1.30 },
            { t: 3, d: 3, type: 'drum_snare', v: 1.20 },
            { t: 6, d: 0.75, type: 'drum_snare', v: 1.25 },
            { t: 6.75, d: 0.75, type: 'drum_snare_ghost_note', v: 0.60 },
            { t: 7.5, d: 0.75, type: 'drum_snare', v: 1.20 },
            { t: 8.25, d: 0.75, type: 'drum_snare_ghost_note', v: 0.60 },
            { t: 9, d: 0.75, type: 'drum_snare', v: 1.30 },
            { t: 10.5, d: 0.75, type: 'drum_snare', v: 1.35 },
            { t: 11.25, d: 0.75, type: 'drum_kick_reso', v: 1.40 }
        ]},
        { id: 'S_TOM_WAVE_FULL', events: [
            { t: 0, d: 3, type: 'drum_kick_reso', v: 1.30 },
            { t: 3, d: 1.5, type: 'drum_Sonor_Classix_High_Tom', v: 1.15 },
            { t: 4.5, d: 1.5, type: 'drum_Sonor_Classix_High_Tom', v: 1.15 },
            { t: 6, d: 1.5, type: 'drum_Sonor_Classix_Mid_Tom', v: 1.20 },
            { t: 7.5, d: 1.5, type: 'drum_Sonor_Classix_Mid_Tom', v: 1.25 },
            { t: 9, d: 1.5, type: 'drum_Sonor_Classix_Low_Tom', v: 1.30 },
            { t: 10.5, d: 1.5, type: 'drum_snare', v: 1.40 },
            { t: 11.5, d: 2, type: 'drum_ride_wetter', v: 0.85 }
        ]}
    ],
    // --- SHUFFLE (Blues, Reggae) ---
    shuffle: [
        { id: 'T_BLUES_STORM_FULL', events: [
            { t: 0, d: 3, type: 'drum_kick_reso', v: 1.40 },
            { t: 3, d: 3, type: 'drum_snare', v: 1.20 },
            { t: 6, d: 2, type: 'drum_Sonor_Classix_High_Tom', v: 1.25 },
            { t: 7, d: 2, type: 'drum_Sonor_Classix_Mid_Tom', v: 1.25 },
            { t: 8, d: 2, type: 'drum_Sonor_Classix_Low_Tom', v: 1.30 },
            { t: 9, d: 1.5, type: 'drum_snare', v: 1.35 },
            { t: 10.5, d: 1.5, type: 'drum_kick_reso', v: 1.40 },
            { t: 11.5, d: 2, type: 'drum_crash2', v: 0.70 }
        ]},
        { id: 'T_DUB_DENSITY_FULL', events: [
            { t: 0, d: 6, type: 'drum_kick_reso', v: 1.40 },
            { t: 6, d: 2, type: 'drum_snare_off', v: 1.30 },
            { t: 8, d: 2, type: 'drum_snare_ghost_note', v: 0.70 },
            { t: 9, d: 1.5, type: 'drum_Sonor_Classix_Low_Tom', v: 1.25 },
            { t: 10.5, d: 1.5, type: 'drum_snare', v: 1.40 }
        ]}
    ]
};

// ──────────────────────────────────────────────────────────────
// 🕵️ ТЕНЕВОЙ ДИРИЖЕР (The Interceptor)
// ──────────────────────────────────────────────────────────────

export class ShadowDrummer {
    private static history: string[] = [];

    public static decorate(
        events: FractalEvent[], 
        barCount: number, 
        tension: number, 
        genre: string, 
        feel: string = 'straight'
    ): FractalEvent[] {
        if (FILL_CONFIG.excludedGenres.includes(genre)) return events;

        const isTimeForFill = (barCount + 1) % FILL_CONFIG.triggerEveryNBars === 0;
        const isExtremeTension = tension >= FILL_CONFIG.tensionThreshold;

        if (!isTimeForFill && !isExtremeTension) return events;

        const poolType = (feel === 'shuffle' || genre === 'blues' || genre === 'reggae') ? 'shuffle' : 'straight';
        const pool = FILL_PATTERNS[poolType];

        const available = pool.filter(p => !this.history.includes(p.id));
        const picked = available.length > 0 
            ? available[Math.floor(Math.random() * available.length)]
            : pool[Math.floor(Math.random() * pool.length)];

        this.history.push(picked.id);
        if (this.history.length > FILL_CONFIG.historyLimit) this.history.shift();

        // Удаляем ВСЕ старые ударные в этом такте
        const nonDrumEvents = events.filter(e => {
            const type = Array.isArray(e.type) ? e.type[0] : e.type;
            return !type.startsWith('drum') && !type.startsWith('perc');
        });

        // Вклеиваем сбивку, которая ТЕПЕРЬ ВСЕГДА НАЧИНАЕТСЯ С ПЕРВОЙ ДОЛИ
        const fillEvents: FractalEvent[] = picked.events.map(fe => ({
            type: fe.type,
            note: 36, 
            time: fe.t * TICK_TO_BEAT,
            duration: fe.d * TICK_TO_BEAT,
            weight: fe.v || FILL_CONFIG.defaultVelocity,
            technique: fe.tech || 'hit',
            dynamics: 'mf',
            phrasing: 'staccato',
            params: { isFill: true, fillId: picked.id }
        }));

        return [...nonDrumEvents, ...fillEvents];
    }
}
