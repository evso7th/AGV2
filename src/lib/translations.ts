/**
 * @fileOverview Universal Translation Dictionary for AuraGroove.
 * #ЗАЧЕМ: Централизованное управление мультиязычностью (RU/EN).
 */

export type Language = 'ru' | 'en';

export const TRANSLATIONS = {
    // Welcome Page
    welcome_title: { ru: "Добро пожаловать в AuraGroove", en: "Welcome to AuraGroove" },
    welcome_desc_main: { ru: "Ваш персональный цифровой оркестр живой музыки.", en: "Your personal digital live-music generator." },
    welcome_desc_orchestra: { ru: "The Infinite Take Orchestra", en: "The Infinite Take Orchestra" },
    btn_start: { ru: "Запустить AuraGroove", en: "Start AuraGroove" },
    
    // Navigator Header
    btn_play: { ru: "Играть", en: "Play" },
    btn_pause: { ru: "Пауза", en: "Pause" },
    
    // Selectors
    label_genre: { ru: "Жанр", en: "Genre" },
    label_mood: { ru: "Настроение", en: "Mood" },
    btn_add_to_route: { ru: "Добавить в маршрут", en: "Add to Route" },
    
    // Route List
    label_current_path: { ru: "Текущий путь", en: "Current Path" },
    label_steps: { ru: "шагов", en: "steps" },
    empty_route_title: { ru: "Маршрут пуст", en: "No journey yet" },
    empty_route_desc: { ru: "Выберите жанр и настроение, затем нажмите + Добавить в маршрут", en: "Pick a genre and mood then tap + Add to Route" },
    
    // Dialogs
    dialog_capture_title: { ru: "Сохранить путешествие", en: "Capture Journey" },
    dialog_capture_name: { ru: "Название...", en: "Name..." },
    btn_capture_save: { ru: "Запомнить путь", en: "Store Journey" },
    
    dialog_library_title: { ru: "Библиотека маршрутов", en: "Library" },
    steps_count: { ru: "шагов", en: "steps" },
    
    dialog_mixer_title: { ru: "Студийный микшер", en: "Studio Mixer" },
    dialog_eq_title: { ru: "Эквалайзер", en: "Equalizer" },
    
    dialog_capacity_title: { ru: "Контроль полифонии", en: "Polyphony Control" },
    dialog_capacity_desc: { ru: "Глобальный лимит активных голосов", en: "Global active voice limit" },
    dialog_capacity_hint: { ru: "Меньший лимит экономит ресурсы на мобильных устройствах. Больший дает более богатые хвосты.", en: "Lower limit saves CPU on mobile. Higher limit provides richer tails." },
    
    dialog_timer_title: { ru: "Таймер сна", en: "Sleep Timer" },
    dialog_timer_desc: { ru: "Установите длительность сессии", en: "Set session duration" },
    btn_timer_activate: { ru: "Активировать таймер", en: "Activate Timer" },
    btn_timer_stop: { ru: "Остановить таймер", en: "Stop Timer" },
    
    dialog_info_title: { ru: "Информационный центр", en: "Information Center" },
    tab_user_guide: { ru: "Руководство", en: "User Guide" },
    tab_disclaimer: { ru: "Дисклеймер", en: "Disclaimer" },
    btn_close: { ru: "Закрыть", en: "Close" },
    
    // Toasts
    toast_dna_synced: { ru: "ДНК синхронизирована", en: "DNA Synced" },
    toast_dna_synced_desc: { ru: "Наследие обновлено из облака", en: "Heritage refreshed from cloud" },
    toast_journey_loaded: { ru: "Маршрут загружен", en: "Journey Loaded" },
    toast_masterpiece_saved: { ru: "Шедевр сохранен!", en: "Masterpiece Saved!" },
    toast_masterpiece_desc: { ru: "Это зерно добавлено в облачный реестр.", en: "This seed has been added to the Cloud Registry." },
    toast_action_blocked: { ru: "Действие заблокировано", en: "Action Blocked" },
    toast_only_in_pause: { ru: "Доступно только в режиме паузы", en: "Available only in Pause state" },
    toast_next_pattern: { ru: "Следующий паттерн", en: "Next Pattern" },
    toast_next_desc: { ru: "Регенерация сюиты...", en: "Regenerating suite..." },
    toast_prev_pattern: { ru: "Предыдущий паттерн", en: "Previous Pattern" },
    toast_prev_desc: { ru: "Перезапуск текущей ДНК...", en: "Restarting current DNA..." },
    toast_sync_fail: { ru: "Ошибка синхронизации", en: "Sync Failed" },
    
    // Genres (UI Display)
    g_ambient: { ru: "Slow Fusion", en: "Slow Fusion" },
    g_psybient: { ru: "Neuro Space", en: "Neuro Space" },
    g_blues: { ru: "Cafe's Blues", en: "Cafe's Blues" },
    g_reggae: { ru: "Root Reggey", en: "Root Reggey" },
    g_random: { ru: "⚡ СЮРПРИЗ", en: "⚡ SURPRISE" },
    
    // Moods (UI Display)
    m_melancholic: { ru: "Меланхолия", en: "Melancholic" },
    m_dreamy: { ru: "Мечтательность", en: "Dreamy" },
    m_calm: { ru: "Спокойствие", en: "Calm" },
    m_joyful: { ru: "Радость", en: "Joyful" },
    m_random: { ru: "⚡ ЛЮБОЕ", en: "⚡ ANY" }
};
