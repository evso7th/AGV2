
/**
 * @fileOverview Drum Fill Registry & Shadow Drummer Engine V1.2
 * #ЗАЧЕМ: Декларативное управление сбивками без изменения "Золотой Базы" Мозгов.
 * #ЧТО: ПЛАН №2105 — Расширение реестра длинными эпическими филлами (8-12 ударов) с железом.
 */

import type { FractalEvent, Technique } from '@/types/music';
import { TICK_TO_BEAT } from '../music-theory';

// ──────────────────────────────────────────────────────────────
// ⚙️ ДЕКЛАРАТИВНАЯ КОНФИГУРАЦИЯ
// ──────────────────────────────────────────────────────────────

export const FILL_CONFIG = {
    triggerEveryNBars: 8,       // Сбивка каждый N-й такт (например, 8)
    tensionThreshold: 0.88,     // Принудительная сбивка при высоком напряжении
    historyLimit: 6,            // Не повторять сбивку в течение 6 тактов
    excludedGenres: ['ambient'], // Жанры-исключения
    defaultVelocity: 1.10       // Базовая мощь (согласовано с основным ритмом)
};

// ──────────────────────────────────────────────────────────────
// 🥁 РЕЕСТР ПАТТЕРНОВ (1 такт = 12 тиков)
// ──────────────────────────────────────────────────────────────

type FillPattern = {
    id: string;
    events: { t: number, d: number, type: string, v?: number, tech?: Technique }[];
};

export const FILL_PATTERNS: { straight: FillPattern[], shuffle: FillPattern[] } = {
    // --- ДЛЯ ТРАНСА, РОКА, ХАУСА (4/4) ---
    straight: [
        { id: 'S_EPIC_ROLL_CRASH', events: [
            { t: 0, d: 3, type: 'drum_ride_wetter', v: 0.7 },
            { t: 3, d: 3, type: 'drum_ride_wetter', v: 0.7 },
            { t: 6, d: 1, type: 'drum_snare', v: 1.1 },
            { t: 6.75, d: 1, type: 'drum_snare', v: 0.9 },
            { t: 7.5, d: 1, type: 'drum_snare', v: 1.0 },
            { t: 8.25, d: 1, type: 'drum_Sonor_Classix_High_Tom', v: 1.1 },
            { t: 9, d: 1, type: 'drum_Sonor_Classix_Mid_Tom', v: 1.1 },
            { t: 9.75, d: 1, type: 'drum_Sonor_Classix_Low_Tom', v: 1.1 },
            { t: 10.5, d: 1.5, type: 'drum_snare', v: 1.2 },
            { t: 11.5, d: 2, type: 'drum_crash2', v: 0.6 }
        ]},
        { id: 'S_MACHINE_GUN_GHOST', events: [
            { t: 0, d: 6, type: 'drum_kick_reso', v: 1.2 },
            { t: 6, d: 0.75, type: 'drum_snare', v: 1.1 },
            { t: 6.75, d: 0.75, type: 'drum_snare_ghost_note', v: 0.4 },
            { t: 7.5, d: 0.75, type: 'drum_snare', v: 1.1 },
            { t: 8.25, d: 0.75, type: 'drum_snare_ghost_note', v: 0.4 },
            { t: 9, d: 0.75, type: 'drum_snare', v: 1.1 },
            { t: 9.75, d: 0.75, type: 'drum_snare_ghost_note', v: 0.4 },
            { t: 10.5, d: 0.75, type: 'drum_snare', v: 1.2 },
            { t: 11.25, d: 0.75, type: 'drum_snare', v: 1.3 }
        ]},
        { id: 'S_TOM_WAVE', events: [
            { t: 0, d: 1.5, type: 'drum_Sonor_Classix_High_Tom', v: 1.0 },
            { t: 1.5, d: 1.5, type: 'drum_Sonor_Classix_High_Tom', v: 1.0 },
            { t: 3, d: 1.5, type: 'drum_Sonor_Classix_Mid_Tom', v: 1.1 },
            { t: 4.5, d: 1.5, type: 'drum_Sonor_Classix_Mid_Tom', v: 1.1 },
            { t: 6, d: 1.5, type: 'drum_Sonor_Classix_Low_Tom', v: 1.2 },
            { t: 7.5, d: 1.5, type: 'drum_Sonor_Classix_Low_Tom', v: 1.2 },
            { t: 9, d: 1, type: 'drum_snare', v: 1.1 },
            { t: 10, d: 1, type: 'drum_snare', v: 1.2 },
            { t: 11, d: 1, type: 'drum_kick_reso', v: 1.3 },
            { t: 11.5, d: 2, type: 'drum_ride_wetter', v: 0.8 }
        ]},
        { id: 'S_RIDE_STAB', events: [
            { t: 0, d: 3, type: 'drum_ride_wetter', v: 1.0 },
            { t: 1.5, d: 1.5, type: 'drum_snare_ghost_note', v: 0.5 },
            { t: 3, d: 3, type: 'drum_ride_wetter', v: 1.0 },
            { t: 4.5, d: 1.5, type: 'drum_snare_ghost_note', v: 0.5 },
            { t: 6, d: 3, type: 'drum_ride_wetter', v: 1.1 },
            { t: 9, d: 1, type: 'drum_snare', v: 1.2 },
            { t: 10, d: 1, type: 'drum_snare', v: 1.2 },
            { t: 11, d: 1, type: 'drum_snare', v: 1.3 },
            { t: 11.5, d: 2, type: 'drum_crash2', v: 0.5 }
        ]},
        { id: 'S_INDUSTRIAL_DRAG', events: [
            { t: 0, d: 6, type: 'drum_kick_reso', v: 1.3 },
            { t: 6, d: 1, type: 'drum_snare', v: 1.0 },
            { t: 7, d: 1, type: 'drum_snare_ghost_note', v: 0.6 },
            { t: 8, d: 1, type: 'drum_snare_ghost_note', v: 0.6 },
            { t: 9, d: 1, type: 'drum_Sonor_Classix_Low_Tom', v: 1.1 },
            { t: 10, d: 1, type: 'drum_Sonor_Classix_Low_Tom', v: 1.2 },
            { t: 11, d: 1, type: 'drum_kick_reso', v: 1.3 }
        ]}
    ],
    // --- ДЛЯ БЛЮЗА И РЕГГИ (12/8 SHUFFLE) ---
    shuffle: [
        { id: 'T_BLUES_STORM', events: [
            { t: 0, d: 2, type: 'drum_kick_reso', v: 1.2 },
            { t: 2, d: 2, type: 'drum_ride_wetter', v: 0.8 },
            { t: 4, d: 2, type: 'drum_snare', v: 1.0 },
            { t: 6, d: 2, type: 'drum_Sonor_Classix_High_Tom', v: 1.1 },
            { t: 7, d: 2, type: 'drum_Sonor_Classix_Mid_Tom', v: 1.1 },
            { t: 8, d: 2, type: 'drum_Sonor_Classix_Low_Tom', v: 1.2 },
            { t: 9, d: 1, type: 'drum_snare', v: 1.2 },
            { t: 10, d: 1, type: 'drum_snare', v: 1.2 },
            { t: 11, d: 1, type: 'drum_kick_reso', v: 1.3 },
            { t: 11.5, d: 2, type: 'drum_crash2', v: 0.6 }
        ]},
        { id: 'T_TRIPLET_ROLL', events: [
            { t: 0, d: 4, type: 'drum_ride_wetter', v: 0.7 },
            { t: 4, d: 4, type: 'drum_ride_wetter', v: 0.8 },
            { t: 8, d: 1.3, type: 'drum_snare', v: 1.1 },
            { t: 9.3, d: 1.3, type: 'drum_snare', v: 1.1 },
            { t: 10.6, d: 1.4, type: 'drum_snare', v: 1.2 }
        ]},
        { id: 'T_DUB_DENSITY', events: [
            { t: 0, d: 6, type: 'drum_kick_reso', v: 1.3 },
            { t: 6, d: 2, type: 'drum_snare_off', v: 1.1 },
            { t: 8, d: 2, type: 'drum_snare_ghost_note', v: 0.5 },
            { t: 9, d: 1.5, type: 'drum_Sonor_Classix_Low_Tom', v: 1.1 },
            { t: 10.5, d: 1.5, type: 'drum_snare', v: 1.2 }
        ]},
        { id: 'T_RIDE_WASH_LONG', events: [
            { t: 0, d: 3, type: 'drum_ride_wetter', v: 0.9 },
            { t: 3, d: 3, type: 'drum_ride_wetter', v: 0.9 },
            { t: 6, d: 3, type: 'drum_ride_wetter', v: 1.0 },
            { t: 9, d: 1, type: 'drum_snare', v: 1.1 },
            { t: 10, d: 1, type: 'drum_Sonor_Classix_Mid_Tom', v: 1.1 },
            { t: 11, d: 1, type: 'drum_Sonor_Classix_Low_Tom', v: 1.2 }
        ]},
        { id: 'T_KICK_SNARE_CLIMAX', events: [
            { t: 0, d: 3, type: 'drum_kick_reso', v: 1.2 },
            { t: 3, d: 3, type: 'drum_snare', v: 1.1 },
            { t: 6, d: 3, type: 'drum_kick_reso', v: 1.3 },
            { t: 9, d: 1.5, type: 'drum_snare', v: 1.3 },
            { t: 10.5, d: 1.5, type: 'drum_crash2', v: 0.6 }
        ]}
    ]
};

// ──────────────────────────────────────────────────────────────
// 🕵️ ТЕНЕВОЙ ДИРИЖЕР (The Interceptor)
// ──────────────────────────────────────────────────────────────

export class ShadowDrummer {
    private static history: string[] = [];

    /**
     * Основной метод декорации выходного потока.
     */
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

        const nonDrumEvents = events.filter(e => {
            const type = Array.isArray(e.type) ? e.type[0] : e.type;
            return !type.startsWith('drum') && !type.startsWith('perc');
        });

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
