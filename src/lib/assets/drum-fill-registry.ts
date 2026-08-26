/**
 * @fileOverview Drum Fill Registry & Shadow Drummer Engine V1.6
 * #ЗАЧЕМ: ПЛАН №2115 — "Ensemble Pulse" Protocol.
 * #ЧТО: 1. Добавление "Pickup" ударов за такт до сбивки.
 *       2. Добавление "Landing Crash" в такте после сбивки.
 *       3. Обновление паттернов: больше томов и малого барабана для плотности.
 */

import type { FractalEvent, Technique } from '@/types/music';
import { TICK_TO_BEAT } from '../music-theory';

// ──────────────────────────────────────────────────────────────
// ⚙️ ДЕКЛАРАТИВНАЯ КОНФИГУРАЦИЯ
// ──────────────────────────────────────────────────────────────

export const FILL_CONFIG = {
    triggerEveryNBars: 8,       
    tensionThreshold: 0.88,     
    historyLimit: 5,            
    excludedGenres: ['ambient'], 
    defaultVelocity: 1.25       
};

// ──────────────────────────────────────────────────────────────
// 🥁 РЕЕСТР ПОЛНОТАКТОВЫХ ПАТТЕРНОВ
// ──────────────────────────────────────────────────────────────

type FillPattern = {
    id: string;
    events: { t: number, d: number, type: string, v?: number, tech?: Technique }[];
};

export const FILL_PATTERNS: { straight: FillPattern[], shuffle: FillPattern[] } = {
    straight: [
        { id: 'S_CYMBAL_SMASH', events: [
            { t: 0, d: 3, type: 'drum_kick_reso', v: 1.35 },
            { t: 0, d: 1, type: 'drum_ride_wetter', v: 1.50 },
            { t: 3, d: 3, type: 'drum_kick_reso', v: 1.20 },
            { t: 6, d: 1, type: 'drum_snare', v: 1.25 },
            { t: 9, d: 1, type: 'drum_ride_wetter', v: 1.50 },
            { t: 10.5, d: 1.5, type: 'drum_snare', v: 1.40 },
            { t: 11.5, d: 2, type: 'drum_ride_wetter', v: 1.50 } 
        ]},
        { id: 'S_EPIC_LADDER', events: [ // "Лестница" по томам
            { t: 0, d: 3, type: 'drum_kick_reso', v: 1.30 },
            { t: 3, d: 3, type: 'drum_snare', v: 1.10 },
            { t: 6, d: 1.5, type: 'drum_Sonor_Classix_High_Tom', v: 1.25 },
            { t: 7.5, d: 1.5, type: 'drum_Sonor_Classix_Mid_Tom', v: 1.30 },
            { t: 9, d: 1.5, type: 'drum_Sonor_Classix_Low_Tom', v: 1.35 },
            { t: 10.5, d: 1.5, type: 'drum_snare', v: 1.45 }
        ]},
        { id: 'S_MACHINE_GUN_GHOST', events: [
            { t: 0, d: 3, type: 'drum_kick_reso', v: 1.30 },
            { t: 3, d: 3, type: 'drum_snare', v: 1.20 },
            { t: 6, d: 0.75, type: 'drum_snare', v: 1.25 },
            { t: 6.75, d: 0.75, type: 'drum_snare_ghost_note', v: 0.4 },
            { t: 7.5, d: 0.75, type: 'drum_snare', v: 1.30 },
            { t: 8.25, d: 0.75, type: 'drum_snare_ghost_note', v: 0.4 },
            { t: 9, d: 0.75, type: 'drum_snare', v: 1.35 },
            { t: 10.5, d: 1.5, type: 'drum_snare', v: 1.50 }
        ]}
    ],
    shuffle: [
        { id: 'T_DUB_CYMBAL_ROLL', events: [
            { t: 0, d: 6, type: 'drum_kick_reso', v: 1.40 },
            { t: 0, d: 1, type: 'drum_ride_wetter', v: 1.50 },
            { t: 3, d: 1, type: 'drum_ride_wetter', v: 1.30 },
            { t: 6, d: 2, type: 'drum_snare_off', v: 1.30 },
            { t: 9, d: 1.5, type: 'drum_Sonor_Classix_Low_Tom', v: 1.25 },
            { t: 10.5, d: 1.5, type: 'drum_snare', v: 1.40 },
            { t: 11.5, d: 2, type: 'drum_ride_wetter', v: 1.50 }
        ]},
        { id: 'T_LADDER_SHUFFLE', events: [ // Триольная лестница
            { t: 0, d: 3, type: 'drum_kick_reso', v: 1.30 },
            { t: 3, d: 3, type: 'drum_snare', v: 1.15 },
            { t: 6, d: 1, type: 'drum_Sonor_Classix_High_Tom', v: 1.25 },
            { t: 8, d: 1, type: 'drum_Sonor_Classix_Mid_Tom', v: 1.30 },
            { t: 9, d: 1, type: 'drum_Sonor_Classix_Low_Tom', v: 1.35 },
            { t: 11, d: 1, type: 'drum_snare', v: 1.50 }
        ]},
        { id: 'T_BLUES_STORM_FULL', events: [
            { t: 0, d: 3, type: 'drum_kick_reso', v: 1.40 },
            { t: 3, d: 3, type: 'drum_snare', v: 1.20 },
            { t: 6, d: 2, type: 'drum_Sonor_Classix_High_Tom', v: 1.25 },
            { t: 7, d: 2, type: 'drum_Sonor_Classix_Mid_Tom', v: 1.25 },
            { t: 8, d: 2, type: 'drum_Sonor_Classix_Low_Tom', v: 1.30 },
            { t: 9, d: 1.5, type: 'drum_snare', v: 1.35 },
            { t: 10.5, d: 1.5, type: 'drum_kick_reso', v: 1.40 },
            { t: 11.5, d: 2, type: 'drum_ride_wetter', v: 1.50 }
        ]}
    ]
};

// ──────────────────────────────────────────────────────────────
// 🕵️ ТЕНЕВОЙ ДИРИЖЕР
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
        
        // --- 1. PICKUP LOGIC (Bar BEFORE Fill) ---
        // #ЗАЧЕМ: Устранение паузы перед сбивкой.
        const isPreFill = (barCount + 2) % FILL_CONFIG.triggerEveryNBars === 0;
        if (isPreFill) {
            const pickup: FractalEvent = {
                type: 'drum_snare',
                note: 38,
                time: 11 * TICK_TO_BEAT, // На последней триоли
                duration: 0.1,
                weight: 1.1,
                technique: 'hit',
                dynamics: 'mf',
                phrasing: 'staccato'
            };
            return [...events, pickup];
        }

        // --- 2. LANDING LOGIC (Bar AFTER Fill) ---
        // #ЗАЧЕМ: Акцент "приземления" после сбивки.
        const isPostFill = barCount % FILL_CONFIG.triggerEveryNBars === 0 && barCount > 0;
        if (isPostFill) {
            const landing: FractalEvent = {
                type: 'drum_crash2',
                note: 49,
                time: 0,
                duration: 1.5,
                weight: 1.1,
                technique: 'hit',
                dynamics: 'f',
                phrasing: 'staccato'
            };
            return [...events, landing];
        }

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
