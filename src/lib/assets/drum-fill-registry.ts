
/**
 * @fileOverview Drum Fill Registry & Shadow Drummer Engine V1.1
 * #ЗАЧЕМ: Декларативное управление сбивками без изменения "Золотой Базы" Мозгов.
 * #ИСПРАВЛЕНО: Конвертация тиков в доли (beats) для устранения пауз.
 */

import type { FractalEvent, Technique } from '@/types/music';
import { TICK_TO_BEAT } from '../music-theory';

// ──────────────────────────────────────────────────────────────
// ⚙️ ДЕКЛАРАТИВНАЯ КОНФИГУРАЦИЯ (Редактировать здесь)
// ──────────────────────────────────────────────────────────────

export const FILL_CONFIG = {
    triggerEveryNBars: 8,       // Сбивка каждый N-й такт (например, 8)
    tensionThreshold: 0.88,     // Принудительная сбивка при высоком напряжении
    historyLimit: 5,            // Не повторять сбивку в течение 5 тактов
    excludedGenres: ['ambient'], // Жанры-исключения
    defaultVelocity: 1.10       // Мощь сбивки (согласовано с силой Kick/Snare)
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
        { id: 'S_SN_ROLL', events: [
            { t: 9, d: 1, type: 'drum_snare', v: 0.8 }, { t: 9.75, d: 1, type: 'drum_snare', v: 0.9 },
            { t: 10.5, d: 1, type: 'drum_snare', v: 1.0 }, { t: 11.25, d: 1, type: 'drum_snare', v: 1.1 }
        ]},
        { id: 'S_TOM_RUN', events: [
            { t: 6, d: 1.5, type: 'drum_Sonor_Classix_High_Tom' }, { t: 7.5, d: 1.5, type: 'drum_Sonor_Classix_Mid_Tom' },
            { t: 9, d: 1.5, type: 'drum_Sonor_Classix_Low_Tom' }, { t: 10.5, d: 1.5, type: 'drum_snare', v: 1.1 }
        ]},
        { id: 'S_KICK_SNARE', events: [
            { t: 0, d: 3, type: 'drum_kick_reso', v: 1.2 }, { t: 6, d: 1, type: 'drum_snare' },
            { t: 7.5, d: 1, type: 'drum_snare' }, { t: 9, d: 3, type: 'drum_snare', v: 1.1 }
        ]},
        { id: 'S_GHOST_TRIP', events: [
            { t: 8, d: 1, type: 'drum_snare_ghost_note' }, { t: 9, d: 1, type: 'drum_snare' },
            { t: 10, d: 1, type: 'drum_snare_ghost_note' }, { t: 11, d: 1, type: 'drum_snare', v: 1.1 }
        ]},
        { id: 'S_POWER_STAB', events: [
            { t: 0, d: 6, type: 'drum_kick_reso' }, { t: 6, d: 3, type: 'drum_snare', v: 1.2 },
            { t: 9, d: 3, type: 'drum_snare', v: 1.2 }
        ]},
        { id: 'S_DOUBLE_KICK', events: [
            { t: 9, d: 1.5, type: 'drum_kick_reso' }, { t: 10.5, d: 1.5, type: 'drum_kick_reso', v: 1.1 }
        ]},
        { id: 'S_HAT_OPENER', events: [
            { t: 0, d: 9, type: 'drum_open_hh_top2', v: 0.8 }, { t: 9, d: 3, type: 'drum_snare', v: 1.0 }
        ]},
        { id: 'S_TOM_ACCENT', events: [
            { t: 3, d: 3, type: 'drum_Sonor_Classix_High_Tom' }, { t: 9, d: 3, type: 'drum_Sonor_Classix_High_Tom', v: 1.1 }
        ]},
        { id: 'S_SNARE_DRAG', events: [
            { t: 10, d: 0.5, type: 'drum_snare_ghost_note' }, { t: 10.5, d: 0.5, type: 'drum_snare_ghost_note' },
            { t: 11, d: 1, type: 'drum_snare', v: 1.1 }
        ]},
        { id: 'S_END_CRASH', events: [
            { t: 0, d: 12, type: 'drum_ride_wetter', v: 0.6 }
        ]}
    ],
    // --- ДЛЯ БЛЮЗА И РЕГГИ (12/8 SHUFFLE) ---
    shuffle: [
        { id: 'T_BLUES_ROLL', events: [
            { t: 8, d: 2, type: 'drum_snare', tech: 'vb' }, { t: 10, d: 2, type: 'drum_snare', v: 1.1 }
        ]},
        { id: 'T_DUB_DROP', events: [
            { t: 6, d: 3, type: 'drum_kick_reso', v: 1.2 }, { t: 9, d: 3, type: 'drum_snare_off' }
        ]},
        { id: 'T_TRIPLET_TOM', events: [
            { t: 0, d: 4, type: 'drum_Sonor_Classix_High_Tom' }, { t: 4, d: 4, type: 'drum_Sonor_Classix_Mid_Tom' },
            { t: 8, d: 4, type: 'drum_Sonor_Classix_Low_Tom' }
        ]},
        { id: 'T_LAZY_SNARE', events: [
            { t: 3, d: 3, type: 'drum_snare_ghost_note' }, { t: 9, d: 3, type: 'drum_snare', v: 1.1 }
        ]},
        { id: 'T_HAT_DANCE', events: [
            { t: 1.5, d: 1.5, type: 'drum_open_hh_bottom2' }, { t: 4.5, d: 1.5, type: 'drum_open_hh_bottom2' },
            { t: 7.5, d: 1.5, type: 'drum_open_hh_bottom2' }, { t: 10.5, d: 1.5, type: 'drum_open_hh_bottom2' }
        ]},
        { id: 'T_KICK_PULSE', events: [
            { t: 0, d: 2, type: 'drum_kick_reso' }, { t: 2, d: 2, type: 'drum_kick_reso' },
            { t: 4, d: 2, type: 'drum_kick_reso' }, { t: 6, d: 6, type: 'drum_snare', v: 1.1 }
        ]},
        { id: 'T_SHUFFLE_DRAG', events: [
            { t: 10, d: 1, type: 'drum_snare_ghost_note' }, { t: 11, d: 1, type: 'drum_snare', v: 1.1 }
        ]},
        { id: 'T_RIM_ECHO', events: [
            { t: 3, d: 3, type: 'drum_perc-001' }, { t: 9, d: 3, type: 'drum_perc-001', v: 0.8 }
        ]},
        { id: 'T_RIDE_WASH', events: [
            { t: 0, d: 12, type: 'drum_ride_wetter', v: 0.5 }
        ]},
        { id: 'T_BIG_ONE', events: [
            { t: 6, d: 6, type: 'drum_kick_reso', v: 1.3 }, { t: 6, d: 6, type: 'drum_snare', v: 1.3 }
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
        // 1. Проверка исключений
        if (FILL_CONFIG.excludedGenres.includes(genre)) return events;

        // 2. Декларативные условия срабатывания
        const isTimeForFill = (barCount + 1) % FILL_CONFIG.triggerEveryNBars === 0;
        const isExtremeTension = tension >= FILL_CONFIG.tensionThreshold;

        if (!isTimeForFill && !isExtremeTension) return events;

        // 3. Выбор типа сетки
        const poolType = (feel === 'shuffle' || genre === 'blues' || genre === 'reggae') ? 'shuffle' : 'straight';
        const pool = FILL_PATTERNS[poolType];

        // 4. Подбор уникальной сбивки (учет истории)
        const available = pool.filter(p => !this.history.includes(p.id));
        const picked = available.length > 0 
            ? available[Math.floor(Math.random() * available.length)]
            : pool[Math.floor(Math.random() * pool.length)];

        // Обновление истории
        this.history.push(picked.id);
        if (this.history.length > FILL_CONFIG.historyLimit) this.history.shift();

        // 5. Хирургическая замена барабанов
        const nonDrumEvents = events.filter(e => {
            const type = Array.isArray(e.type) ? e.type[0] : e.type;
            return !type.startsWith('drum') && !type.startsWith('perc');
        });

        const fillEvents: FractalEvent[] = picked.events.map(fe => ({
            type: fe.type,
            note: 36, // Нота игнорируется менеджером, важен тип
            time: fe.t * TICK_TO_BEAT, // ВАЖНО: Конвертация тиков (0..12) в доли (0..4)
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
