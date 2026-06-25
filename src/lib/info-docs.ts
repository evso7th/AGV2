/**
 * @fileOverview Справочные материалы AuraGroove (HTML-верстка).
 * #ЗАЧЕМ: Централизованное хранилище документации для пользователей.
 * #ОБНОВЛЕНО: Глубокая актуализация на основе User Guide v0.3.62 и Disclaimer V3.7.0.
 */

export const GUIDE_RU = `
<div class="prose-info text-[13px] leading-relaxed space-y-6">
  <div class="text-center space-y-2 border-b border-primary/20 pb-4">
    <h1 class="text-2xl font-black text-primary uppercase tracking-tighter">Полное руководство пользователя</h1>
    <p class="text-lg font-bold">AuraGroove V 03.62 (Infinite Take Orchestra)</p>
    <p class="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">Interface: v3.1 | Core: v3.7.0</p>
  </div>

  <p class="italic text-muted-foreground">Добро пожаловать в AuraGroove V3 — автономный музыкальный интеллект, имитирующий работу живого ансамбля. Это руководство поможет вам понять философию проекта, настроить систему под себя и научиться управлять генерацией музыки в реальном времени.</p>

  <section class="space-y-3">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">1. Введение: Что такое AuraGroove?</h2>
    <p>AuraGroove — это детерминированный алгоритмический движок, создающий уникальную фоновую музыку в реальном времени с помощью фрактальной математики, цепей Маркова и генетических алгоритмов.</p>
    <div class="bg-muted/30 p-3 rounded-lg space-y-2 border border-border/50">
      <p class="font-bold text-[11px] uppercase opacity-70">Важно понимать, чем AuraGroove НЕ является:</p>
      <ul class="space-y-1 text-[12px]">
        <li class="flex gap-2"><span>❌</span> <span>Это не нейросеть. Здесь нет LLM-моделей (как в SUNO или Udio). Никаких текстовых промптов.</span></li>
        <li class="flex gap-2"><span>❌</span> <span>Это не плеер. Приложение не хранит и не воспроизводит готовые аудиофайлы или MIDI-треки.</span></li>
        <li class="flex gap-2"><span>✅</span> <span>Это математический генератор. Каждая нота, ритм и тембр создаются «здесь и сейчас» из внутреннего состояния системы. Виртуальные музыканты играют «в живую», подчиняясь строгим математическим законам и генетической памяти.</span></li>
      </ul>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">2. Первые шаги: Персональная настройка звука</h2>
    <p>Звук в AuraGroove синтезируется в реальном времени через Web Audio API, поэтому он всегда звучит по-разному в зависимости от устройства, наушников, проводного или Bluetooth-соединения.</p>
    <div class="space-y-2">
      <p class="font-bold text-[11px] uppercase opacity-70">Что нужно сделать сразу после загрузки:</p>
      <ol class="list-decimal pl-5 space-y-1">
        <li>Откройте System Mixer и Эквалайзер.</li>
        <li>Настройте их под себя и свою акустическую систему.</li>
        <li>Сделайте это ОДИН РАЗ — ваши настройки сохранятся локально на вашем устройстве.</li>
      </ol>
    </div>
    <div class="bg-primary/5 p-3 rounded-lg border border-primary/20 flex gap-3">
      <span class="text-lg">💡</span>
      <p class="text-[12px]"><span class="font-black text-primary uppercase">Совет:</span> Вы можете связать пресеты System Mixer с конкретными жанрами. Тогда при смене жанра в Очереди ваш идеальный микс загрузится автоматически.</p>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">3. Жанры и «Мозги» (Brains)</h2>
    <p>Движок специализируется на создании ненавязчивой фоновой музыки для расслабления или концентрации. Каждый жанр управляется отдельным модулем — «Мозгом» (Brain), который диктует свои правила гармонии, ритма и техник исполнения.</p>
    <ul class="space-y-2">
      <li class="flex gap-2">
        <span class="text-base">🎷</span>
        <div><span class="font-black text-primary uppercase">Cafe-Blues:</span> Обширная библиотека техник. Выразительные мелодии, ритмические паттерны и способность к живой импровизации.</div>
      </li>
      <li class="flex gap-2">
        <span class="text-base">🧘</span>
        <div><span class="font-black text-primary uppercase">Slow Fusion (Ambient):</span> Глубокие текстуры, атмосферные слои и сложные гармонии.</div>
      </li>
      <li class="flex gap-2">
        <span class="text-base">🦒</span>
        <div><span class="font-black text-primary uppercase">Zoology:</span> Стилизация под оркестровое звучание 60-70-х годов XX века, дополненная синтезаторными пэдами в стиле Neuro-Space и Slow Fusion. Включает гитары, органы, пианино, скрипки, ударные и SFX-ботов.</div>
      </li>
      <li class="flex gap-2">
        <span class="text-base">🌌</span>
        <div><span class="font-black text-primary uppercase">Neuro Space:</span> Транс-амбиентные структуры с выраженной ритмикой.</div>
      </li>
      <li class="flex gap-2">
        <span class="text-base">🇯🇲</span>
        <div><span class="font-black text-primary uppercase">Roots Reggae:</span> Понимает законы «Риддима» и создает специфический грув (находится в стадии активного развития нишевых вариаций).</div>
      </li>
    </ul>
  </section>

  <section class="space-y-3">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">4. Генетическая Система: От Seed до Шедевра</h2>
    <p>Каждая сессия — это уникальный организм, проходящий путь от «зерна» до полноценной пьесы.</p>
    <div class="space-y-3 pl-2 border-l border-primary/20">
      <div class="space-y-1">
        <p class="font-bold text-[11px] uppercase"><span class="text-primary">1. Генерация Seed:</span></p>
        <p>При старте создается уникальное 32-битное число — зерно, из которого вырастет музыкальная вселенная сессии.</p>
      </div>
      <div class="space-y-1">
        <p class="font-bold text-[11px] uppercase"><span class="text-primary">2. Генетическое скрещивание:</span></p>
        <p>Если включено «Наследие», Seed скрещивается на битовом уровне с Seed-ами успешных прошлых сессий (masterpieces). Новое семя наследует удачные пропорции, но остается 100% уникальным.</p>
      </div>
      <div class="space-y-1">
        <p class="font-bold text-[11px] uppercase"><span class="text-primary">3. Suite DNA:</span></p>
        <p>На основе Seed строится «хребет» пьесы на 160 тактов: гармоническая карта (цепи Маркова), карта напряжения (Tension Map) и выбор Династии (набора фраз-аксиом).</p>
      </div>
      <div class="space-y-1">
        <p class="font-bold text-[11px] uppercase"><span class="text-primary">4. Навигация и Аксиомы:</span></p>
        <p>Движок накладывает ДНК на временную сетку (Интро, Кульминация, Кода) и активирует «Аксиомы» — оцифрованные фрагменты человеческого исполнения, которые проходят через фрактальные мутации.</p>
      </div>
    </div>
  </section>

  <section class="space-y-4">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">5. Интерфейс и Управление</h2>
    
    <div class="space-y-2">
      <p class="font-bold text-[11px] uppercase opacity-70">Верхняя панель навигации (Слева направо):</p>
      <ul class="space-y-2 text-[12px]">
        <li class="flex gap-2"><span>🏠</span> <span><span class="font-bold">Домой:</span> Возврат на стартовый экран.</span></li>
        <li class="flex gap-2"><span>🗼</span> <span><span class="font-bold">Broadcast:</span> Специальный облегченный режим для слабых устройств.</span></li>
        <li class="flex gap-2"><span>⏺️</span> <span><span class="font-bold">Запись:</span> Позволяет записать понравившийся фрагмент в формате .webm.</span></li>
        <li class="flex gap-2"><span>❤️</span> <span><span class="font-bold">Лайк (Нравится):</span> Сохраняет аксиому этого фрагмента в облачную библиотеку для улучшения генерации.</span></li>
        <li class="flex gap-2"><span>🔄</span> <span><span class="font-bold">Regenerate:</span> Создает новое семя и новую мутацию внутри жанра.</span></li>
      </ul>
    </div>

    <div class="bg-muted/20 p-4 rounded-xl space-y-2 border border-border/50">
      <p class="font-black text-[11px] uppercase tracking-wider text-primary">Формирование Очереди (CURRENT PATH):</p>
      <p>Вы можете собрать свой собственный маршрут музыкального путешествия.</p>
      <ul class="list-disc pl-5 space-y-1 text-[12px]">
        <li>Выберите Жанр и Настроение.</li>
        <li>Нажмите <span class="font-bold uppercase text-primary">Add to Route</span>.</li>
        <li>Очередь можно сохранять, загружать, перемешивать или редактировать.</li>
        <li class="text-destructive font-bold italic">⚠️ Важно: После изменений нажмите Pause, затем кнопку «Обновление очереди» в нижнем тулбаре, чтобы система приняла настройки. Затем нажмите Play.</li>
      </ul>
    </div>

    <div class="space-y-2">
      <p class="font-bold text-[11px] uppercase opacity-70">Нижний тулбар (Слева направо):</p>
      <ul class="space-y-2 text-[12px]">
        <li class="flex gap-2"><span>📈</span> <span><span class="font-bold">Анализатор спектра:</span> Визуализация частот.</span></li>
        <li class="flex gap-2"><span>🔄</span> <span><span class="font-bold">Обновление очереди:</span> Применяет изменения в CURRENT PATH.</span></li>
        <li class="flex gap-2"><span>🧬</span> <span><span class="font-bold">Индикатор Наследия:</span> Включение/выключение генетического пула.</span></li>
        <li class="flex gap-2"><span>⚙️</span> <span><span class="font-bold">Управление голосами (ARP):</span> Настройка лимита активных голосов.</span></li>
        <li class="flex gap-2"><span>🌓</span> <span><span class="font-bold">Тема:</span> Переключение между темной и светлой темами.</span></li>
        <li class="flex gap-2"><span>⏳</span> <span><span class="font-bold">Таймер сна:</span> Остановка воспроизведения (до 30 минут).</span></li>
      </ul>
    </div>
  </section>

  <section class="space-y-4">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">6. Технические рекомендации и Ограничения</h2>
    
    <div class="space-y-2">
      <h3 class="text-[11px] font-black uppercase text-primary/70">Количество голосов и качество звука (ARP)</h3>
      <p>Качество звука прямо пропорционально количеству активных голосов. Настройка меняется через панель ARP (иконка микросхемы CPU):</p>
      <ul class="list-disc pl-5 space-y-1 text-[12px]">
        <li><span class="font-bold">50 голосов:</span> Экспериментальный минимум. Ниже возможны артефакты.</li>
        <li><span class="font-bold">Десктоп:</span> Рекомендуется 256–512 голосов.</li>
        <li><span class="font-bold">Мобильные:</span> Рекомендуется 50–120 голосов.</li>
      </ul>
    </div>

    <div class="bg-destructive/5 p-4 rounded-xl border border-destructive/20 space-y-2">
      <h3 class="text-[11px] font-black uppercase text-destructive flex items-center gap-2"><span>⚠️</span> Предупреждение для Мобильных Устройств</h3>
      <p class="text-[12px]">Использование на смартфоне, который вы активно используете, не рекомендуется из-за ограничений ОС:</p>
      <ul class="list-disc pl-5 space-y-1 text-[11px] opacity-80">
        <li>Звонки и уведомления прервут аудио (ограничение ОС).</li>
        <li>Открытие других приложений вызовет заикания (glitches).</li>
        <li>Режим энергосбережения может "убить" звук или остановить приложение.</li>
      </ul>
      <p class="font-bold text-[11px] pt-1 uppercase">Рекомендация: Используйте посвященное устройство или режим "Бродкаст".</p>
    </div>
  </section>

  <section class="space-y-2 pb-6">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">7. Конфиденциальность и Автономность</h2>
    <p>AuraGroove полностью уважает вашу приватность. Ноль телеметрии. Ноль профилей. Все данные хранятся только локально. Движок работает полностью офлайн после первого кэширования.</p>
    <p class="text-center font-black uppercase text-primary pt-4 tracking-widest">Enjoy listening!</p>
  </section>
</div>
`;

export const GUIDE_EN = `
<div class="prose-info text-[13px] leading-relaxed space-y-6">
  <div class="text-center space-y-2 border-b border-primary/20 pb-4">
    <h1 class="text-2xl font-black text-primary uppercase tracking-tighter">Complete User Guide</h1>
    <p class="text-lg font-bold">AuraGroove V 03.62 (Infinite Take Orchestra)</p>
    <p class="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">Interface: v3.1 | Core: v3.7.0</p>
  </div>

  <p class="italic text-muted-foreground">Welcome to AuraGroove V3—an autonomous musical intelligence that simulates the dynamics of a live ensemble. This guide will help you understand the project's philosophy, customize the system to your liking, and master real-time music generation.</p>

  <section class="space-y-3">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">1. Introduction: What is AuraGroove?</h2>
    <p>AuraGroove is a deterministic algorithmic engine that creates unique background music in real time using fractal mathematics, Markov chains, and genetic algorithms.</p>
    <div class="bg-muted/30 p-3 rounded-lg space-y-2 border border-border/50">
      <p class="font-bold text-[11px] uppercase opacity-70">Important to understand what AuraGroove is NOT:</p>
      <ul class="space-y-1 text-[12px]">
        <li class="flex gap-2"><span>❌</span> <span>It is not a neural network. There are no LLM models here (like in SUNO or Udio). No text prompts.</span></li>
        <li class="flex gap-2"><span>❌</span> <span>It is not a media player. The app does not store or play back pre-recorded audio files or MIDI tracks.</span></li>
        <li class="flex gap-2"><span>✅</span> <span>It is a mathematical generator. Every note, rhythm, and timbre is created "here and now" from the system's internal state. Virtual musicians play "live," governed by strict mathematical laws and genetic memory.</span></li>
      </ul>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">2. First Steps: Personal Sound Setup</h2>
    <p>Sound in AuraGroove is synthesized in real time via the Web Audio API, meaning it will always sound slightly different depending on your device, headphones, and whether you're using a wired or Bluetooth connection.</p>
    <div class="space-y-2">
      <p class="font-bold text-[11px] uppercase opacity-70">What to do immediately after loading:</p>
      <ol class="list-decimal pl-5 space-y-1">
        <li>Open the System Mixer and Equalizer.</li>
        <li>Tweak them to your liking and match your acoustic setup.</li>
        <li>Do this ONCE—your settings will be saved locally on your device.</li>
      </ol>
    </div>
    <div class="bg-primary/5 p-3 rounded-lg border border-primary/20 flex gap-3">
      <span class="text-lg">💡</span>
      <p class="text-[12px]"><span class="font-black text-primary uppercase">Pro Tip:</span> You can link System Mixer presets to specific genres. Then, when you switch genres in the Queue, your perfect mix will load automatically.</p>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">3. Genres and "Brains"</h2>
    <p>The engine specializes in creating unobtrusive background music for relaxation or focus. Each genre is managed by a separate module—a "Brain"—which dictates its own rules for harmony, rhythm, and playing techniques.</p>
    <ul class="space-y-2">
      <li class="flex gap-2">
        <span class="text-base">🎷</span>
        <div><span class="font-black text-primary uppercase">Cafe-Blues:</span> An extensive library of techniques. Expressive melodies, rhythmic patterns, and the ability to improvise live.</div>
      </li>
      <li class="flex gap-2">
        <span class="text-base">🧘</span>
        <div><span class="font-black text-primary uppercase">Slow Fusion (Ambient):</span> Deep textures, atmospheric layers, and complex harmonies.</div>
      </li>
      <li class="flex gap-2">
        <span class="text-base">🦒</span>
        <div><span class="font-black text-primary uppercase">Zoology:</span> Stylized after the orchestral sound of the 1960s and 70s, complemented by synthesizer pads in the style of Neuro-Space and Slow Fusion. Includes guitars, organs, pianos, violins, drums, and SFX bots.</div>
      </li>
      <li class="flex gap-2">
        <span class="text-base">🌌</span>
        <div><span class="font-black text-primary uppercase">Neuro Space:</span> Trance-ambient structures with pronounced rhythmic elements.</div>
      </li>
      <li class="flex gap-2">
        <span class="text-base">🇯🇲</span>
        <div><span class="font-black text-primary uppercase">Roots Reggae:</span> Understands the laws of the "riddim" and creates a specific groove (currently in active development for niche variations).</div>
      </li>
    </ul>
  </section>

  <section class="space-y-3">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">4. The Genetic System: From Seed to Masterpiece</h2>
    <p>Every session is a unique organism that evolves from a "seed" into a full-fledged piece.</p>
    <div class="space-y-3 pl-2 border-l border-primary/20">
      <div class="space-y-1">
        <p class="font-bold text-[11px] uppercase"><span class="text-primary">1. Seed Generation:</span></p>
        <p>Upon startup, a unique 32-bit number (the Seed) is generated—the grain from which the session's musical universe will grow.</p>
      </div>
      <div class="space-y-1">
        <p class="font-bold text-[11px] uppercase"><span class="text-primary">2. Genetic Crossover:</span></p>
        <p>If "Heritage" is enabled, the Seed is crossed at the bitwise level with Seeds from successful past sessions (masterpieces). The new seed inherits successful proportions but remains 100% unique.</p>
      </div>
      <div class="space-y-1">
        <p class="font-bold text-[11px] uppercase"><span class="text-primary">3. Suite DNA:</span></p>
        <p>Based on the Seed, the "backbone" of the piece is built for 160 bars: a harmonic map (Markov chains), a tension map (Tension Map), and the selection of a Dynasty (a set of phrase axioms).</p>
      </div>
      <div class="space-y-1">
        <p class="font-bold text-[11px] uppercase"><span class="text-primary">4. Navigation and Axioms:</span></p>
        <p>The engine maps the DNA onto a timeline (Intro, Climax, Coda) and activates "Axioms"—digitized fragments of human performance that undergo fractal mutations.</p>
      </div>
    </div>
  </section>

  <section class="space-y-4">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">5. Interface and Controls</h2>
    
    <div class="space-y-2">
      <p class="font-bold text-[11px] uppercase opacity-70">Top Navigation Bar (Left to Right):</p>
      <ul class="space-y-2 text-[12px]">
        <li class="flex gap-2"><span>🏠</span> <span><span class="font-bold">Home:</span> Return to the start screen.</span></li>
        <li class="flex gap-2"><span>🗼</span> <span><span class="font-bold">Broadcast:</span> A special lightweight mode for low-end devices.</span></li>
        <li class="flex gap-2"><span>⏺️</span> <span><span class="font-bold">Record:</span> Allows you to record a favorite snippet in .webm format.</span></li>
        <li class="flex gap-2"><span>❤️</span> <span><span class="font-bold">Like:</span> Saves the current session to the global pool to improve future generation.</span></li>
        <li class="flex gap-2"><span>🔄</span> <span><span class="font-bold">Regenerate:</span> Generates a new seed and a new mutation within the genre.</span></li>
      </ul>
    </div>

    <div class="bg-muted/20 p-4 rounded-xl space-y-2 border border-border/50">
      <p class="font-black text-[11px] uppercase tracking-wider text-primary">Building the Queue (CURRENT PATH):</p>
      <p>You can assemble your own route for a musical journey.</p>
      <ul class="list-disc pl-5 space-y-1 text-[12px]">
        <li>Select a Genre and Mood.</li>
        <li>Click <span class="font-bold uppercase text-primary">Add to Route</span>.</li>
        <li>The queue can be saved, loaded, shuffled, or edited.</li>
        <li class="text-destructive font-bold italic">⚠️ Important: After changes, press Pause, then click the "Queue Refresh" button in the bottom toolbar to apply settings. Then press Play.</li>
      </ul>
    </div>

    <div class="space-y-2">
      <p class="font-bold text-[11px] uppercase opacity-70">Bottom Toolbar (Left to Right):</p>
      <ul class="space-y-2 text-[12px]">
        <li class="flex gap-2"><span>📈</span> <span><span class="font-bold">Spectrum Analyzer:</span> Frequency visualization.</span></li>
        <li class="flex gap-2"><span>🔄</span> <span><span class="font-bold">Queue Refresh:</span> Applies changes in CURRENT PATH.</span></li>
        <li class="flex gap-2"><span>🧬</span> <span><span class="font-bold">Heritage Indicator:</span> Toggle the genetic pool usage.</span></li>
        <li class="flex gap-2"><span>⚙️</span> <span><span class="font-bold">Voice Control (ARP):</span> Adjust the active voice limit.</span></li>
        <li class="flex gap-2"><span>🌓</span> <span><span class="font-bold">Theme:</span> Toggle between dark and light themes.</span></li>
        <li class="flex gap-2"><span>⏳</span> <span><span class="font-bold">Sleep Timer:</span> Auto-stop playback (up to 30 minutes).</span></li>
      </ul>
    </div>
  </section>

  <section class="space-y-4">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">6. Technical Recommendations and Limitations</h2>
    
    <div class="space-y-2">
      <h3 class="text-[11px] font-black uppercase text-primary/70">Voice Count and Sound Quality (ARP)</h3>
      <p>Sound quality is proportional to the number of active voices. Adjust via the ARP panel (CPU icon):</p>
      <ul class="list-disc pl-5 space-y-1 text-[12px]">
        <li><span class="font-bold">50 voices:</span> Experimental minimum. Below this, artifacts may occur.</li>
        <li><span class="font-bold">Desktop:</span> Recommended 256–512 voices.</li>
        <li><span class="font-bold">Mobile:</span> Recommended 50–120 voices.</li>
      </ul>
    </div>

    <div class="bg-destructive/5 p-4 rounded-xl border border-destructive/20 space-y-2">
      <h3 class="text-[11px] font-black uppercase text-destructive flex items-center gap-2"><span>⚠️</span> Mobile Device Warning</h3>
      <p class="text-[12px]">Daily-use smartphones are discouraged due to OS resource management:</p>
      <ul class="list-disc pl-5 space-y-1 text-[11px] opacity-80">
        <li>Calls and notifications interrupt audio (OS limitation).</li>
        <li>Other apps will cause audio glitches.</li>
        <li>Battery Saver mode may throttle or terminate the process.</li>
      </ul>
      <p class="font-bold text-[11px] pt-1 uppercase">Recommendation: Use a dedicated device or "Broadcast" mode.</p>
    </div>
  </section>

  <section class="space-y-2 pb-6">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">7. Privacy and Autonomy</h2>
    <p>AuraGroove respects your privacy. Zero telemetry. Zero profiles. All data is local. The engine works offline after initial caching.</p>
    <p class="text-center font-black uppercase text-primary pt-4 tracking-widest">Enjoy listening!</p>
  </section>
</div>
`;

export const DISCLAIMER_RU = `
<div class="prose-info text-[12px] leading-relaxed space-y-4">
  <h2 class="text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">ДИСКЛЕЙМЕР: AuraGroove V3</h2>
  
  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">1. Что это такое (и чем не является)</h3>
    <p>AuraGroove — это детерминированный алгоритмический движок. Это не генератор на основе нейросетей (как SUNO или Udio).</p>
    <ul class="list-disc pl-4 opacity-80">
      <li>Без промптов: Мы не обрабатываем текстовые запросы.</li>
      <li>Без нейросетей: Система построена на фракталах и цепях Маркова.</li>
      <li>Не плеер: Весь звук синтезируется «на лету» с нуля.</li>
    </ul>
  </section>

  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">2. Основные Принципы</h3>
    <p><strong>Математический Суверенитет:</strong> 100% генерация. Никакого семплирования существующей музыки.</p>
    <p><strong>Приватность:</strong> Ноль телеметрии. Ноль профилей. Все настройки хранятся только локально на вашем устройстве.</p>
  </section>

  <section class="space-y-1 bg-destructive/5 p-2 rounded border border-destructive/10">
    <h3 class="text-[11px] font-black uppercase text-destructive">3. Ограничения устройств</h3>
    <p>Использование на смартфонах может быть ограничено политиками ОС:</p>
    <ul class="list-disc pl-4">
      <li>Входящие звонки немедленно остановят звук.</li>
      <li>Режим энергосбережения может вызвать заикания звука.</li>
      <li>Открытие тяжелых приложений может отнять ресурсы у движка.</li>
    </ul>
  </section>

  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">4. Юридические гарантии</h3>
    <p>AuraGroove не заявляет прав на сгенерированную музыку. Проект предназначен для личного использования и создания адаптивного фона.</p>
  </section>

  <p class="text-[10px] italic opacity-50 pt-2 border-t border-primary/10">Последнее обновление: Май 2026. Версия 3.7.0</p>
</div>
`;

export const DISCLAIMER_EN = `
<div class="prose-info text-[12px] leading-relaxed space-y-4">
  <h2 class="text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">DISCLAIMER: AuraGroove V3</h2>
  
  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">1. Definition</h3>
    <p>AuraGroove is a deterministic, algorithmic music engine. It is NOT a neural network-based generator (like SUNO or Udio).</p>
    <ul class="list-disc pl-4 opacity-80">
      <li>No prompts: We do not process text-to-music requests.</li>
      <li>No neural networks: Built entirely on fractal math and Markov chains.</li>
      <li>Not a playback engine: Audio is synthesized on-the-fly from scratch.</li>
    </ul>
  </section>

  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">2. Core Principles</h3>
    <p><strong>Mathematical Sovereignty:</strong> 100% generative. No sampling of existing music.</p>
    <p><strong>Zero Data Collection:</strong> No telemetry, no user profiles. All data remains locally on your device.</p>
  </section>

  <section class="space-y-1 bg-destructive/5 p-2 rounded border border-destructive/10">
    <h3 class="text-[11px] font-black uppercase text-destructive">3. Device Constraints</h3>
    <p>Mobile usage is subject to OS limitations:</p>
    <ul class="list-disc pl-4">
      <li>Incoming calls will stop audio playback.</li>
      <li>Battery Saver mode may throttle the audio engine.</li>
      <li>Background resources are managed by the OS, not the app.</li>
    </ul>
  </section>

  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">4. Legal Safeguards</h3>
    <p>AuraGroove claims no ownership of generated music. The system produces original, non-copyrightable content through mathematical generation.</p>
  </section>

  <p class="text-[10px] italic opacity-50 pt-2 border-t border-primary/10">Last Updated: May 2026. Version 3.7.0</p>
</div>
`;
