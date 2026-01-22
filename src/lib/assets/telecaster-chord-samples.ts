/**
 * #ЗАЧЕМ: Эта библиотека сопоставляет имена гитарных аккордов с путями к их
 *          аудиосэмплам (Telecaster Clean).
 * #ЧТО: Экспортирует константу TELECASTER_CHORD_SAMPLES.
 * #СВЯЗИ: Используется `telecaster-chords-sampler.ts` для загрузки и
 *          воспроизведения правильных аккордов.
 */
export const TELECASTER_CHORD_SAMPLES: Record<string, string> = {
    'Dm': '/assets/guitars_hords_samples/clear_telecaster/591189__telecaster-clean-dm-hi-r.ogg',
    'G': '/assets/guitars_hords_samples/clear_telecaster/591194__telecaster-clean-g-low-l.ogg',
    'Em': '/assets/guitars_hords_samples/clear_telecaster/591210__telecaster-clean-em-low-r.ogg',
    'Fm': '/assets/guitars_hords_samples/clear_telecaster/591183__telecaster-clean-fm-low-r.ogg',
    'F': '/assets/guitars_hords_samples/clear_telecaster/591175__telecaster-clean-f-low-l.ogg',
    'Am': '/assets/guitars_hords_samples/clear_telecaster/591170__telecaster-clean-am-hi-l.ogg',
    'Bb': '/assets/guitars_hords_samples/clear_telecaster/591202__telecaster-clean-bb-hi-r.ogg',
    'Eb': '/assets/guitars_hords_samples/clear_telecaster/591216__telecaster-clean-eb-hi-l-001.ogg',
    'E': '/assets/guitars_hords_samples/clear_telecaster/591178__telecaster-clean-e-hi-l.ogg',
    'D': '/assets/guitars_hords_samples/clear_telecaster/591191__telecaster-clean-d-hi-r.ogg',
    'Abm': '/assets/guitars_hords_samples/clear_telecaster/591172__telecaster-clean-abm-low-l.ogg',
    'C': '/assets/guitars_hords_samples/clear_telecaster/591204__telecaster-clean-c-hi-r.ogg',
    'Bm': '/assets/guitars_hords_samples/clear_telecaster/591206__telecaster-clean-bm-hi-r.ogg',
    'A': '/assets/guitars_hords_samples/clear_telecaster/591167__telecaster-clean-a-hi-r.ogg',
    'B': '/assets/guitars_hords_samples/clear_telecaster/591173__telecaster-clean-b-hi-r.ogg'
};
