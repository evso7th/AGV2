/**
 * @fileOverview Справочные материалы AuraGroove (Синхронизация с источниками 100%).
 * #ЗАЧЕМ: Прямая трансляция текстовых исходников в интерфейс инфоцентра.
 * #ЧТО: Содержание GUIDE и DISCLAIMER заменено на текст из файлов .txt.
 */

export const GUIDE_RU = `
<div class="prose-info text-[13px] leading-relaxed whitespace-pre-wrap font-sans px-2">
﻿Полное руководство пользователя 
AuraGroove V 03.62 (Infinite Take Orchestra)
Добро пожаловать в AuraGroove V3 — автономный музыкальный интеллект, имитирующий работу живого ансамбля. Это руководство поможет вам понять философию проекта, настроить систему под себя и научиться управлять генерацией музыки в реальном времени.
1. Введение: Что такое AuraGroove?
AuraGroove — это детерминированный алгоритмический движок, создающий уникальную фоновую музыку в реальном времени с помощью фрактальной математики, цепей Маркова и генетических алгоритмов.
Важно понимать, чем AuraGroove НЕ является:
* ❌ Это не нейросеть. Здесь нет LLM-моделей (как в SUNO или Udio). Никаких текстовых промптов.
* ❌ Это не плеер. Приложение не хранит и не воспроизводит готовые аудиофайлы или MIDI-треки.
* ✅ Это математический генератор. Каждая нота, ритм и тембр создаются «здесь и сейчас» из внутреннего состояния системы. Виртуальные музыканты играют «в живую», подчиняясь строгим математическим законам и генетической памяти.
2. Первые шаги: Персональная настройка звука
Звук в AuraGroove синтезируется в реальном времени через Web Audio API, поэтому он всегда звучит по-разному в зависимости от устройства, наушников, проводного или Bluetooth-соединения.
Что нужно сделать сразу после загрузки:
1. Откройте System Mixer и Эквалайзер.
2. Настройте их под себя и свою акустическую систему.
3. Сделайте это ОДИН РАЗ — ваши настройки сохранятся локально на вашем устройстве.
💡 Совет: Вы можете привязать пресеты System Mixer к конкретным жанрам. Тогда при смене жанра в Очереди ваш идеальный микс будет загружаться автоматически.
3. Жанры и «Мозги» (Brains)
Движок специализируется на создании ненавязчивой фоновой музыки для расслабления или концентрации. Каждый жанр управляется отдельным модулем — «Мозгом» (Brain), который диктует свои правила гармонии, ритма и техник исполнения.
* 🎷 Cafe Blues: Обширная библиотека техник. Выразительные мелодии, ритмические паттерны и способность к живой импровизации.
* 🎹 Soft Fusion: Глубокие текстуры, атмосферные слои и сложные гармонии.
* 🎻 Zoology: Стилизация под оркестровое звучание 60-70-х годов XX века, дополненная синтезаторными пэдами в стиле Нейро-Спейс и Софт-Фьюжн. Включает гитары, органы, пианино, скрипки, ударные и SFX-ботов.
* 🛰️ Нейро Спейс: Транс-амбиентные структуры с выраженной ритмикой.
* 🌴 Roots Reggae: Понимает законы "Риддима", создает специфический грув (находится в стадии активного развития нишевых вариаций).
4. Генетическая Система: От Seed до Шедевра
Каждая сессия — это уникальный организм, проходящий путь от «зерна» до полноценной пьесы.
1. Генерация Seed: При старте создается уникальное 32-битное число (Seed) — зерно, из которого вырастет музыкальная вселенная сессии.
2. Генетическое скрещивание: Если включено «Наследие», Seed скрещивается на битовом уровне с Seed-ами успешных прошлых сессий (masterpieces). Новое семя наследует удачные пропорции, но остается 100% уникальным.
3. Suite DNA: На основе Seed строится «хребет» пьесы на 160 тактов: гармоническая карта (цепи Маркова), карта напряжения (Tension Map) и выбор Династии (набора музыкальных фраз-аксиом).
4. Навигация и Аксиомы: Движок накладывает ДНК на временную сетку (Интро, Кульминация, Кода) и активирует «Аксиомы» — оцифрованные фрагменты человеческого исполнения, которые проходят через фрактальные мутации (инверсия, ретроград, джиттер).
5. Интерфейс и Управление
Верхняя панель навигации (Слева направо)
1. 🏠 Домой: Возврат на стартовый экран.
2. 📡 Бродкаст: Специальный облегченный режим для слабых устройств.
3. ⏺️ Запись: Позволяет записать понравившийся фрагмент в формате .webm.
4. ❤️ Лайк (Нравится): Если вы слышите отличный фрагмент, нажмите эту кнопку. Аксиома этого фрагмента запомнится в облачную библиотеку и улучшит генерацию для всех пользователей.
5. 🔄 Регенерация: Если музыка не нравится, нажмите кнопку. Система создаст новое семя и новую мутацию в рамках выбранного жанра и настроения.
Формирование Очереди (CURRENT PATH)
Вы можете собрать свой собственный маршрут музыкального путешествия.
* Выберите Жанр (Genre) и Настроение (MOOD).
* Нажмите ADD TO ROUTE, чтобы зафиксировать выбор в очереди.
* Очередь можно сохранять на устройство, загружать, перемешивать, добавлять или удалять элементы.
* ⚠️ Важно: После внесения изменений в очередь нажмите Pause, затем кнопку «Обновление очереди» (вторая слева в нижнем тулбаре), чтобы система приняла новые настройки. Затем нажмите Play.
Нижний тулбар (Слева направо)
1. 📊 Анализатор спектра: Визуализация частот.
2. 🔄 Обновление очереди: Применяет изменения, сделанные в CURRENT PATH.
3. 🧬 Индикатор Наследия: Переключатель использования генетического пула (masterpieces) для генерации.
4. ⚙️ Управление голосами (ARP): Настройка лимита активных голосов (подробнее в "Технические настройки").
5. 🌓 Тема: Переключатель темной и светлой темы интерфейса.
6. ⏳ Таймер сна: Автоматическая остановка воспроизведения (до 30 минут).
6. Технические рекомендации и Ограничения
Количество голосов и качество звука (ARP)
Качество звука прямо пропорционально количеству активных голосов. Настройка меняется через панель ARP: Voice Limit (иконка микросхемы CPU).
* 50 голосов: Экспериментальный минимум. Ниже этого порога возможны серьезные артефакты и 8-битные искажения.
* Десктоп: Рекомендуется 256–512 голосов.
* Мобильные устройства: Рекомендуется 50–120 голосов для стабильной работы без троттлинга.
* Примечание: Выше 512 голосов нет слышимого преимущества, только трата ресурсов процессора.
⚠️ Предупреждение для Мобильных Устройств
Использование AuraGroove на смартфоне, который вы активно используете для повседневных задач, настоятельно не рекомендуется из-за ограничений мобильных ОС:
* Звонки и уведомления: Любой входящий звонок немедленно прервет аудио (это ограничение ОС, а не баг).
* Конкуренция за ресурсы: Открытие других приложений отнимает процессорное время, что вызовет заикания (glitches) и артефакты звука.
* Энергосбережение: Агрессивные алгоритмы экономии батареи могут "убивать" фоновые процессы, вызывая сильные искажения или остановку.
* Рекомендация: Используйте выделенное устройство (планшет, старый телефон, ПК) или режим "Бродкаст" для мобильных.
7. Конфиденциальность и Автономность
AuraGroove полностью уважает вашу приватность:
* Ноль телеметрии: Мы не собираем статистику, аналитику или поведенческие данные.
* Ноль профилей: Учетные записи и история активности не создаются.
* Локальное хранение: Все данные сессий и настройки хранятся в localStorage или IndexedDB вашего браузера. Ничто не отправляется на серверы.
* Оффлайн по умолчанию: Движок может работать без интернета. Подключение к сети требуется только при первом запуске и для опциональной синхронизации генетического пула (облачной библиотеки шедевров). После кратковременного онлайн-подключения (около 5 минут) приложение кэширует данные и может работать абсолютно локально.
</div>
`;

export const GUIDE_EN = `
<div class="prose-info text-[13px] leading-relaxed whitespace-pre-wrap font-sans px-2">
AuraGroove V 03.62 (Infinite Take Orchestra) – Complete User Guide
Welcome to AuraGroove V3—an autonomous musical intelligence that simulates the dynamics of a live ensemble. This guide will help you understand the project's philosophy, customize the system to your liking, and master real-time music generation.
1. Introduction: What is AuraGroove?
AuraGroove is a deterministic algorithmic engine that creates unique background music in real time using fractal mathematics, Markov chains, and genetic algorithms.
It is important to understand what AuraGroove is NOT:
* ❌ It is not a neural network. There are no LLM models here (like in SUNO or Udio). No text prompts.
* ❌ It is not a media player. The app does not store or play back pre-recorded audio files or MIDI tracks.
* ✅ It is a mathematical generator. Every note, rhythm, and timbre is created "here and now" from the system's internal state. Virtual musicians play "live," governed by strict mathematical laws and genetic memory.
2. First Steps: Personal Sound Setup
Sound in AuraGroove is synthesized in real time via the Web Audio API, meaning it will always sound slightly different depending on your device, headphones, and whether you're using a wired or Bluetooth connection.
What to do immediately after loading:
1. Open the System Mixer and Equalizer.
2. Tweak them to your liking and match your acoustic setup.
3. Do this ONCE—your settings will be saved locally on your device.
💡 Pro Tip: You can link System Mixer presets to specific genres. Then, when you switch genres in the Queue, your perfect mix will load automatically.
3. Genres and "Brains"
The engine specializes in creating unobtrusive background music for relaxation or focus. Each genre is managed by a separate module—a "Brain"—which dictates its own rules for harmony, rhythm, and playing techniques.
* 🎷 Cafe Blues: An extensive library of techniques. Expressive melodies, rhythmic patterns, and the ability to improvise live.
* 🎹 Soft Fusion: Deep textures, atmospheric layers, and complex harmonies.
* 🎻 Zoology: Stylized after the orchestral sound of the 1960s and 70s, complemented by synthesizer pads in the style of Neuro-Space and Soft Fusion. Includes guitars, organs, pianos, violins, drums, and SFX bots.
* 🛰️ Neuro Space: Trance-ambient structures with pronounced rhythmic elements.
* 🌴 Roots Reggae: Understands the laws of the "riddim" and creates a specific groove (currently in active development for niche variations).
4. The Genetic System: From Seed to Masterpiece
Every session is a unique organism that evolves from a "seed" into a full-fledged piece.
1. Seed Generation: Upon startup, a unique 32-bit number (the Seed) is generated—the grain from which the session's musical universe will grow.
2. Genetic Crossover: If "Heritage" is enabled, the Seed is crossed at the bitwise level with Seeds from successful past sessions (masterpieces). The new seed inherits successful proportions but remains 100% unique.
3. Suite DNA: Based on the Seed, the "backbone" of the piece is built for 160 bars: a harmonic map (Markov chains), a tension map (Tension Map), and the selection of a Dynasty (a set of musical phrase axioms).
4. Navigation and Axioms: The engine maps the DNA onto a timeline (Intro, Climax, Coda) and activates "Axioms"—digitized fragments of human performance that undergo fractal mutations (inversion, retrograde, jitter).
5. Interface and Controls
Top Navigation Bar (Left to Right)
1. 🏠 Home: Return to the start screen.
2. 📡 Broadcast: A special lightweight mode for low-end devices.
3. ⏺️ Record: Allows you to record a favorite snippet in .webm format.
4. ❤️ Like: If you hear a great fragment, hit this button. The axiom of this fragment will be remembered in the cloud library and improve generation for all users.
5. 🔄 Regenerate: If you don't like the music, press this. The system will create a new seed and a new mutation within the selected genre and mood.
Building the Queue (CURRENT PATH)
You can assemble your own route for a musical journey.
* Select a Genre and Mood.
* Click ADD TO ROUTE to lock your choice into the queue.
* The queue can be saved to your device, loaded, shuffled, or have items added/removed.
* ⚠️ Important: After making changes to the queue, press Pause, then click the "Queue Refresh" button (second from the left in the bottom toolbar) so the system applies the new settings. Then press Play.
Bottom Toolbar (Left to Right)
1. 📊 Spectrum Analyzer: Frequency visualization.
2. 🔄 Queue Refresh: Applies changes made in the CURRENT PATH.
3. 🧬 Heritage Indicator: Toggle for using the genetic pool (masterpieces) for generation.
4. ⚙️ Voice Control (ARP): Adjust the limit of active voices (more details in "Technical Settings").
5. 🌓 Theme: Toggle between dark and light interface themes.
6. ⏳ Sleep Timer: Auto-stop playback (up to 30 minutes).
6. Technical Recommendations and Limitations
Voice Count and Sound Quality (ARP)
Sound quality is directly proportional to the number of active voices. This is adjusted via the ARP: Voice Limit panel (the CPU chip icon).
* 50 voices: Experimental minimum. Below this threshold, severe artifacts and 8-bit distortion are possible.
* Desktop: Recommended 256–512 voices.
* Mobile devices: Recommended 50–120 voices for stable operation without throttling.
* Note: Going above 512 voices offers no audible advantage and just wastes CPU resources.
⚠️ Mobile Device Warning
Using AuraGroove on a smartphone that you actively use for daily tasks is highly discouraged due to mobile OS limitations:
* Calls and Notifications: Any incoming call will immediately interrupt the audio (this is an OS limitation, not a bug).
* Resource Competition: Opening other apps steals CPU time, which will cause audio glitches and artifacts.
* Battery Saver: Aggressive battery-saving algorithms may "kill" background processes, causing severe distortion or stopping playback entirely.
* Recommendation: Use a dedicated device (tablet, old phone, PC) or "Broadcast" mode for mobile.
7. Privacy and Autonomy
AuraGroove fully respects your privacy:
* Zero Telemetry: We do not collect statistics, analytics, or behavioral data.
* Zero Profiles: No user accounts or activity histories are created.
* Local Storage: All session data and settings are stored in your browser's localStorage or IndexedDB. Nothing is sent to servers.
* Offline by Default: The engine can works without the internet. A network connection is only required for first run and optional syncing of the genetic pool (the cloud library of masterpieces). After a brief online connection (about 5 minutes), the app caches the data and can run completely offline.
</div>
`;

export const DISCLAIMER_RU = `
<div class="prose-info text-[12px] leading-relaxed whitespace-pre-wrap font-sans px-2">
ДИСКЛЕЙМЕР: AuraGroove V3 — Алгоритмический Генеративный Музыкальный Движок
1. Что Это Такое (и Чем Не Является)
AuraGroove — это не генератор музыки на основе нейросетей (как SUNO, Udio или другие LLM-инструменты). Это детерминированный алгоритмический музыкальный движок, который создаёт уникальную, непрерывную фоновую музыку в реальном времени с использованием фрактальной математики, цепей Маркова и генетических алгоритмов.
* Без промптов и ИИ-генерации: Мы не принимаем и не обрабатываем текстовые запросы для создания музыки. Каждый звук генерируется исключительно из внутреннего состояния движка, без внешнего ввода, кроме начальной конфигурации сессии.
* Без нейросетей: Система построена полностью на математических преобразованиях и вероятностных автоматах, а не на моделях глубокого обучения.
* Не плеер, а генератор: AuraGroove не хранит и не воспроизводит заранее записанные треки. Весь аудио-контент синтезируется на лету с нуля в каждой сессии.
* Поддерживаемые жанры: Движок специализируется на четырёх стилях: Амбиент, Блюз, Пситранс и Регги. Каждый жанр управляется отдельным модулем «Мозг» с собственными правилами и техниками.
2. Основные Принципы
A. Математический Суверенитет
* 100% генерация: Каждая нота, ритм и тембр создаются алгоритмически в реальном времени. Никакого семплирования существующей музыки.
* Фракталы и цепи Маркова: Гармонические структуры строятся с помощью фрактальных трансформаций (инверсия, ретроград, транспозиция) и цепей Маркова для ритмической и мелодической прогрессии.
* Генетическая эволюция: Каждая сессия наследует черты из «генетического пула» успешных прошлых сессий (masterpieces), но остаётся уникальной благодаря побитовому скрещиванию и мутациям.
B. Только Генерация, Никакого Воспроизведения
* Без MIDI и аудио-файлов: Движок никогда не загружает и не проигрывает внешние аудио-файлы. Звук синтезируется напрямую через Web Audio API.
* Без «воспроизведения» чужих композиций: Система создана для генерации оригинальной музыки, а не для интерпретации или имитации существующих работ.
C. Полный Отказ от Сбора Данных
* Никакой телеметрии: AuraGroove не собирает статистику использования, аналитику или поведенческие данные.
* Никаких профилей пользователей: Мы не создаём, не храним и не отслеживаем учётные записи, предпочтения или историю активности.
* Никаких персональных данных: Приложение не запрашивает, не получает доступ и не передаёт никакую персонально идентифицируемую информацию.
* Локальное хранение: Все данные сессий (пресеты, маршруты, настройки) хранятся исключительно на вашем устройстве в localStorage или IndexedDB. Ничто не отправляется на серверы, если вы явно не решите поделиться записью через Web Share API.
* Оффлайн по умолчанию: Основной движок работает полностью без подключения к интернету. Интеграция с Firestore опциональна и используется только для синхронизации генетического пула — при отключении система работает в режиме «чистой математики».
3. Ключевые Ограничения и Особенности
A. Ограничения Устройств и Производительности
⚠️ Предупреждение для Мобильных Устройств
Использование AuraGroove на телефоне, которым вы активно пользуетесь ежедневно, настоятельно не рекомендуется. Приложение будет работать, но вы должны осознавать критические ограничения:
* Прерывания звонками: Любой входящий звонок немедленно остановит воспроизведение аудио. Это ограничение операционной системы, а не баг приложения.
* Конкуренция за ресурсы: Открытие любого другого приложения отнимет у AuraGroove процессорное время и память, что может вызвать артефакты звука, заикания или снижение качества.
* Режим энергосбережения: При разряде батареи операционная система может агрессивно троттлить или завершать фоновые процессы. Это может привести к сильным искажениям звука или полной остановке приложения.
* Отсутствие контроля над ОС: AuraGroove — это веб-приложение, генерирующее звук в реальном времени. Оно не может управлять или обходить политики управления ресурсами вашей операционной системы. Это фундаментальное ограничение архитектуры мобильных ОС.
Количество Голосов и Качество Звука
* Зависимость качества: Качество звука прямо пропорционально количеству активных голосов. Больше одновременных голосов = богаче, детальнее звук. Но больше голосов = выше требования к процессору и памяти.
* Минимальный порог: 50 голосов — это экспериментально определённый минимум для приемлемого качества звука. Ниже этого порога вы услышите серьёзные артефакты, включая 8-битные искажения и щелчки. Система не позволяет устанавливать значения ниже 50, потому что мы отказываемся предоставлять некачественный звук.
* Рекомендуемый максимум: 250 голосов — это верхний предел. Этого более чем достаточно для воспроизведения всех музыкальных нюансов и полной полифонической насыщенности. Значения выше 250 не дают слышимого преимущества и лишь тратят ресурсы системы.
* Динамическая настройка: Вы можете изменять лимит голосов в реальном времени через панель управления ARP: Voice Limit (доступ через иконку микросхемы CPU   в нижней панели управления).
Как изменить лимит голосов:
1. Нажмите на иконку микросхемы  в нижнем ряду кнопок
2. Используйте слайдер для установки желаемого лимита (50–250 голосов)
3. Нажмите «СОХРАНИТЬ ИЗМЕНЕНИЯ»
4. Важно: Если вы меняете лимит во время воспроизведения, нажмите «Регенерировать», чтобы очистить «зависшие» голоса и применить новую настройку
Как найти оптимальное значение:
* Начните с дефолтного значения (обычно 60–120 в зависимости от платформы)
* Если слышны заикания или артефакты — постепенно снижайте лимит
* Если звук кажется «тонким» или недостаточно насыщенным — увеличьте лимит (если устройство позволяет)
* Десктоп-системы обычно справляются с 120–250 голосами
* Мобильные устройства лучше держать в диапазоне 50–120 для стабильности
B. Ограничения по Жанрам и Стилям
* Четыре специализированных «Мозга»: Система использует жанровые модули (Блюз, Амбиент, Пситранс, Регги), каждый со своими правилами и техниками. Все четыре жанра полностью поддерживаются, но глубина библиотек техник различается:
	* Блюз и Амбиент имеют наиболее обширные наборы техник.
	* Пситранс и Регги полностью функциональны, но могут иметь меньше нишевых вариаций.
* Без «промпт-в-музыку»: Вы не можете ввести текстовый запрос вроде «весёлый джаз» и получить конкретный трек. Система генерирует музыку на основе своего внутреннего состояния (например, Tension Map, Mood, Genre), а не пользовательских инструкций.
C. Качество и Верность Звука
* Оптимизация для фона: AuraGroove создан для фонового использования, а не для студийного производства. «Velvet Standard 3.0» обеспечивает тёплые, органичные тембры, но может не иметь экстремального динамического диапазона.
* Артефакты кроссфейда: При переходах между динамическими группами (например, с Piano на Organ) применяется линейный кроссфейд 5 мс, который может вызывать лёгкие провалы громкости (~-3 дБ) в точке перехода.
* Без мастеринга: Финальный микс не проходит профессиональный мастеринг. Лимитер -6 дБ предотвращает клиппинг, но не оптимизирует громкость под стандарты «войны громкости».
4. Специальные Возможности и Ограничения
A. Генетическая Система
* Наследие Аксиом: Система использует курируемую библиотеку оптимизированных человеком музыкальных фраз (legacy_axioms), но они не воспроизводятся напрямую. Вместо этого они служат «генетическими шаблонами» для мутаций и эволюции.
* Суверенитет Сиблингов: При выборе донор-трека движок приоритезирует сиблинг-аксиомы (ноты, записанные вместе) из одного источника. Это обеспечивает стилистическую целостность, но в некоторых случаях ограничивает разнообразие.
* Обязательная Мутация: В режиме Composer импровизация (инверсия, ретроград, ритмический джиттер) всегда применяется, чтобы избежать статичного повторения.
B. Интерфейс и Пользовательский Опыт
* Без выбора треков: Вы не можете выбирать конкретные песни или исполнителей. Система авто-генерирует музыку на основе текущего seed, Tension Map и настроек жанра.
* Превью перед шерингом: Перед публикацией через Web Share API доступен 30-секундный превью, но полный экспорт аудио-файла не предусмотрен.
* Оффлайн-режим: Система работает оффлайн с локально кэшированными masterpieces, но синхронизация с облаком невозможна без интернета.
5. Юридические и Этические Гарантии
* Отсутствие претензий на авторские права: AuraGroove не заявляет прав на сгенерированную музыку. Система создана для производства оригинального, не охраняемого авторским правом контента через математическую генерацию.
* Полный отказ от сбора данных: Как указано выше: ноль телеметрии, ноль трекинга, ноль исключений. Точка.
* Прозрачность: Система не скрывает свою алгоритмическую природу. Пользователи информируются, что музыка генерируется через фракталы и цепи Маркова, а не через ИИ-модели.
6. Заключительное Примечание
AuraGroove — это не замена традиционным инструментам музыкального продакшена. Это специализированный генеративный музыкальный движок, созданный для обеспечения бесшовной, адаптивной фоновой атмосферы для концентрации, релаксации или творчества. Его сила — в математической чистоте, адаптивности в реальном времени и приверженности генерации оригинальной музыки, а не в имитации существующих работ или реакции на пользовательские промпты.
Помните: Это не SUNO. Это не нейросеть. Это алгоритмическая генеративная музыка, созданная с нуля, для текущего момента.
Для наилучших результатов:
* Используйте на выделенном устройстве или в периоды, когда вам не нужно принимать звонки или использовать другие приложения
* Держите устройство подключённым к зарядке или убедитесь в достаточном заряде батареи, чтобы избежать прерываний из-за энергосбережения
* Настройте лимит голосов в соответствии с возможностями вашего устройства (начните с дефолтных значений, корректируйте при необходимости)
* Примите тот факт, что мобильные ОС враждебны к фоновому аудио — это не ограничение AuraGroove, а реальность платформы
</div>
`;

export const DISCLAIMER_EN = `
<div class="prose-info text-[12px] leading-relaxed whitespace-pre-wrap font-sans px-2">
DISCLAIMER: AuraGroove V3 - Algorithmic Generative Music Engine
1. What This Is (and What It Is Not)
AuraGroove is not a neural network-based music generator (like SUNO, Udio, or other LLM-driven tools). It is a deterministic, algorithmic music engine that generates unique, continuous background music in real time using fractal mathematics, Markov chains, and genetic algorithms.
* No AI-generated prompts: We do not accept or process user prompts to create music. Every sound is generated exclusively from the internal engine's state, with no external input beyond the initial session configuration.
* No neural networks: The system is built entirely on mathematical transformations and probabilistic state machines, not deep learning models.
* Not a playback engine: AuraGroove does not store or play pre-recorded tracks. All audio is synthesized on-the-fly from scratch during each session.
* Supported Genres: The engine specializes in four distinct styles: Ambient, Blues, Psytrance, and Reggae. Each genre is powered by a dedicated "Brain" module with genre-specific rules and techniques.
2. Core Principles
A. Mathematical Sovereignty
* 100% generative: Every note, rhythm, and texture is created algorithmically in real time. There is no sampling of existing music.
* Fractal & Markov Foundations: Harmonic structures are built using fractal transformations (inversion, retrograde, transposition) and Markov chains for rhythmic and melodic progression.
* Genetic Evolution: Each session inherits traits from a "genetic pool" of successful past sessions (masterpieces), but remains unique through bitwise crossover and mutation.
B. No Playback, Only Generation
* No MIDI or audio file playback: The engine never loads or plays external audio files. It synthesizes sound directly via the Web Audio API.
* No "reproduction" of existing songs: The system is designed to create original music, not reinterpret or mimic existing works.
C. Zero Data Collection
* No telemetry: AuraGroove does not collect any usage statistics, analytics, or behavioral data.
* No user profiles: We do not create, store, or track user accounts, preferences, or activity histories.
* No personal data: The application does not request, access, or transmit any personally identifiable information.
* Local-only storage: All session data (presets, paths, settings) remains exclusively on your device in localStorage or IndexedDB. Nothing is sent to servers unless you explicitly choose to share a recording via Web Share API.
* Offline by design: The core engine functions fully without an internet connection. Firestore integration is optional and used only for genetic pool synchronization—if disabled, the system operates in pure mathematical mode.
3. Key Limitations & Constraints
A. Device & Performance Constraints
⚠️ Mobile Device Warning
Using AuraGroove on a phone you actively use daily is strongly discouraged. While the application will function, you should be aware of critical limitations:
* Call Interruptions: Any incoming phone call will immediately stop audio playback. This is an operating system limitation, not an application bug.
* Resource Contention: Opening any other application will steal CPU and memory resources from AuraGroove, potentially causing audio glitches, stuttering, or quality degradation.
* Battery Saver Mode: When your device enters power-saving mode (low battery), the operating system may aggressively throttle or terminate background processes. This can cause severe audio distortion or complete application shutdown.
* No OS Control: AuraGroove is a web application that generates sound in real time. It cannot control or override your operating system's resource management policies. This is a fundamental limitation of how mobile operating systems are designed.
Voice Count & Audio Quality
* Quality Dependency: Sound quality is directly proportional to the number of active voices. More simultaneous voices = richer, more nuanced audio. However, more voices also = higher CPU and memory requirements.
* Minimum Threshold: 50 voices is the experimentally determined minimum for acceptable audio quality. Below this threshold, you will hear severe artifacts, including 8-bit-like distortion and clicking sounds. The system prevents you from setting values below 50 because we refuse to deliver sub-audible quality.
* Recommended Maximum: 250 voices is the upper limit. This is more than sufficient to reproduce all musical nuances and provide full polyphonic richness. Values above 250 provide no audible benefit and waste system resources.
* Dynamic Adjustment: You can adjust the voice limit in real-time through the ARP: Voice Limit control panel (accessed via the CPU chip icon  in the bottom control bar).
How to Adjust Voice Limit:
1. Tap the CPU chip icon  in the bottom control row
2. Use the slider to set your desired limit (50-250 voices)
3. Press "SAVE CHANGES"
4. Important: If you change the limit during playback, press "Regenerate" to clear lingering voices and apply the new setting
Finding Your Optimal Setting:
* Start with the default value (usually 60-120 depending on platform)
* If you experience glitches or stuttering, lower the limit gradually
* If sound feels "thin" or lacks depth, increase the limit (if your device can handle it)
* Desktop systems can typically handle 120-250 voices
* Mobile devices should stay in the 50-120 range for stability
B. Genre & Style Limitations
* Four Specialized Brains: The system uses genre-specific "brains" (Blues, Ambient, Psytrance, Reggae), each with distinct rules and techniques. While all four are fully supported, the depth of technique libraries varies:
	* Blues and Ambient have the most extensive technique sets.
	* Psytrance and Reggae are fully functional but may have fewer niche variations.
* No "Prompt-to-Music": You cannot input a text prompt like "happy jazz" and expect a specific track. The system generates music based on its internal state (e.g., Tension Map, Mood, Genre), not user-provided instructions.
C. Audio Quality & Fidelity
* Background-Optimized Output: AuraGroove is designed for background use, not studio-quality production. The "Velvet Standard 3.0" ensures warm, organic textures but may lack extreme dynamic range.
* Crossover Artifacts: During transitions between dynamic groups (e.g., from Piano to Organ), a 5ms linear crossfade is applied, which may cause subtle volume dips (~-3dB) at the transition point.
* No Mastering: The final mix is not professionally mastered. The -6dB Limiter prevents clipping but does not optimize for loudness war compliance.
4. Special Features & Constraints
A. Genetic System
* Heritage Axioms: The system draws from a curated library of human-optimized musical phrases (legacy_axioms), but these are not directly played. Instead, they are used as "genetic templates" for mutation and evolution.
* Sibling Sovereignty: When selecting a donor track, the engine prioritizes sibling axioms (notes recorded together) from the same source. This ensures stylistic coherence but limits diversity in some cases.
* Mandatory Mutation: In Composer mode, improvisation (e.g., inversion, retrograde, rhythmic jitter) is always applied to prevent static repetition.
B. User Interface & Experience
* No Track Selection: You cannot choose specific songs or artists. The system auto-generates music based on the current seed, Tension Map, and genre settings.
* Preview Before Share: A 30-second preview is available before sharing via Web Share API, but no full export of the audio file is provided.
* Offline Mode: The system works offline with locally cached masterpieces, but no cloud synchronization occurs without an internet connection.
5. Legal & Ethical Safeguards
* No Copyright Claims: AuraGroove does not claim ownership of generated music. The system is designed to produce original, non-copyrightable content through mathematical generation.
* No Data Collection: As stated above: zero telemetry, zero profiles, zero personal data. Period.
* Transparency: The system does not hide its algorithmic nature. Users are informed that music is generated via fractals and Markov chains, not AI models.
6. Final Note
AuraGroove is not a replacement for traditional music production tools. It is a specialized generative music engine designed to provide a seamless, adaptive background atmosphere for focus, relaxation, or creativity. Its strength lies in its mathematical purity, real-time adaptability, and commitment to generating original music—not in mimicking existing works or responding to user prompts.
Remember: This is not SUNO. This is not a neural network. This is algorithmic generative music, created from the ground up, for the present moment.
For best results:
* Use on a dedicated device or during periods when you won't need to make calls or use other apps
* Keep your device plugged in or ensure sufficient battery to avoid power-saving interruptions
* Adjust the voice limit based on your device's capabilities (start with defaults, tweak if needed)
* Accept that mobile operating systems are hostile to background audio—this is not an AuraGroove limitation, but a platform reality
</div>
`;

export const CREDITS_HTML = `
<div class="prose-info text-[12px] leading-relaxed space-y-4 px-2">
  <h2 class="text-base sm:text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">🎵 Audio Credits & Licensing</h2>
  
  <p>AuraGroove is a strictly non-commercial project. All audio assets are used under Creative Commons or Public Domain licenses.</p>

  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">⚠️ Attribution Requirements</h3>
    <ul class="list-disc pl-4 space-y-1 opacity-80">
      <li><strong>Fender Telecaster</strong> by JohnZealeyMusic (Freesound)</li>
      <li><strong>SFX Collection</strong> by akelley6 (Freesound)</li>
      <li><strong>Microfreak Texture Pack</strong> by Deleted_User_6725533</li>
    </ul>
  </section>

  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">✅ Public Domain & CC0</h3>
    <ul class="list-disc pl-4 space-y-1 opacity-80">
      <li><strong>Voice Assets</strong> by alien_i_trust, universfield</li>
      <li><strong>Drum Kits</strong> by Karoryfer & Walter_Odington</li>
      <li><strong>Ambient Textures</strong> by DneproMan</li>
    </ul>
  </section>

  <div class="bg-primary/5 p-3 rounded-lg border border-primary/20 text-[10px] italic">
    <strong>Note:</strong> All code logic and generative algorithms are proprietary to the AuraGroove engine.
  </div>
</div>
`;
