/**
 * @fileOverview Справочные материалы AuraGroove (Semantic HTML Edition).
 * #ЗАЧЕМ: Профессиональное форматирование документации с разделами и заголовками.
 * #ЧТО: Тексты из GUIDE и DISCLAIMER структурированы с использованием Tailwind-стилей Credits.
 */

export const GUIDE_RU = `
<div class="prose-info text-[12px] leading-relaxed space-y-6 px-2">
  <h2 class="text-base sm:text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">Полное руководство пользователя AuraGroove V 03.62</h2>
  
  <p class="opacity-90 font-bold italic">Infinite Take Orchestra</p>
  
  <p>Добро пожаловать в AuraGroove V3 — автономный музыкальный интеллект, имитирующий работу живого ансамбля. Это руководство поможет вам понять философию проекта, настроить систему под себя и научиться управлять генерацией музыки в реальном времени.</p>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">1. Введение: Что такое AuraGroove?</h3>
    <p>AuraGroove — это детерминированный алгоритмический движок, создающий уникальную фоновую музыку в реальном времени с помощью фрактальной математики, цепей Маркова и генетических алгоритмов.</p>
    <div class="space-y-1 opacity-80">
      <p>Важно понимать, чем AuraGroove НЕ является:</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>❌ Это не нейросеть. Здесь нет LLM-моделей (как в SUNO или Udio). Никаких текстовых промптов.</li>
        <li>❌ Это не плеер. Приложение не хранит и не воспроизводит готовые аудиофайлы или MIDI-треки.</li>
        <li>✅ Это математический генератор. Каждая нота, ритм и тембр создаются «здесь и сейчас» из внутреннего состояния системы.</li>
      </ul>
    </div>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">2. Первые шаги: Персональная настройка звука</h3>
    <p>Звук в AuraGroove синтезируется в реальном времени через Web Audio API, поэтому он всегда звучит по-разному в зависимости от устройства и типа подключения.</p>
    <ol class="list-decimal pl-4 space-y-1 opacity-80">
      <li>Откройте System Mixer и Эквалайзер.</li>
      <li>Настройте их под себя и свою акустическую систему.</li>
      <li>Сделайте это ОДИН РАЗ — ваши настройки сохранятся локально на вашем устройстве.</li>
    </ol>
    <div class="bg-primary/5 p-3 rounded-lg border border-primary/20 text-[10px] italic mt-2">
      <strong>💡 Совет:</strong> Вы можете связать пресеты System Mixer с конкретными жанрами. Тогда при смене жанра в Очереди ваш идеальный микс будет загружаться автоматически.
    </div>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">3. Жанры и «Мозги» (Brains)</h3>
    <p>Движок специализируется на создании ненавязчивой фоновой музыки. Каждый жанр управляется отдельным модулем — «Мозгом» (Brain):</p>
    <ul class="list-disc pl-4 space-y-1 opacity-80">
      <li><strong>Cafe Blues:</strong> Обширная библиотека техник. Выразительные мелодии и живая импровизация.</li>
      <li><strong>Soft Fusion:</strong> Глубокие текстуры, атмосферные слои и сложные гармонии.</li>
      <li><strong>Zoology:</strong> Стилизация под оркестровое звучание 60-70-х годов XX века.</li>
      <li><strong>Neuro Space:</strong> Транс-амбиентные структуры с выраженной ритмикой.</li>
      <li><strong>Roots Reggae:</strong> Законы "Риддима" и специфический грув.</li>
    </ul>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">4. Генетическая Система: От Seed до Шедевра</h3>
    <ol class="list-decimal pl-4 space-y-1 opacity-80">
      <li><strong>Генерация Seed:</strong> При старте создается уникальное 32-битное число — зерно сессии.</li>
      <li><strong>Генетическое скрещивание:</strong> Скрещивание Seed-а с успешными прошлыми сессиями (masterpieces).</li>
      <li><strong>Suite DNA:</strong> Построение «хребта» пьесы на 160 тактов (гармония, напряжение, династия).</li>
      <li><strong>Навигация и Аксиомы:</strong> Активация «Аксиом» — фрагментов человеческого исполнения.</li>
    </ol>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">5. Интерфейс и Управление</h3>
    <p><strong>Верхняя панель:</strong> Домой, Бродкаст (для слабых устройств), Запись (.webm), Лайк (сохранение в облако), Регенерация.</p>
    <p><strong>CURRENT PATH (Очередь):</strong> Сборка собственного маршрута. ⚠️ Важно: после изменений нажмите Pause, затем «Обновление очереди», затем Play.</p>
    <p><strong>Нижний тулбар:</strong> Анализатор спектра, Обновление очереди, Индикатор Наследия, Управление голосами (ARP), Тема, Таймер сна.</p>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">6. Технические рекомендации и Ограничения</h3>
    <ul class="list-disc pl-4 space-y-1 opacity-80">
      <li><strong>ARP (Голоса):</strong> 50 (минимум), 512 (максимум). Рекомендуется 50-120 для мобильных.</li>
    </ul>
    <p class="text-destructive/80 font-bold">⚠️ Предупреждение: Использование на смартфоне во время повседневных задач может вызывать заикания из-за ограничений ОС.</p>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">7. Конфиденциальность и Автономность</h3>
    <ul class="list-disc pl-4 space-y-1 opacity-80">
      <li>Ноль телеметрии и профилей. Локальное хранение данных.</li>
      <li>Оффлайн по умолчанию (сеть нужна только для первой синхронизации).</li>
    </ul>
  </section>
</div>
`;

export const GUIDE_EN = `
<div class="prose-info text-[12px] leading-relaxed space-y-6 px-2">
  <h2 class="text-base sm:text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">AuraGroove V 03.62 – Complete User Guide</h2>
  
  <p class="opacity-90 font-bold italic">Infinite Take Orchestra</p>
  
  <p>Welcome to AuraGroove V3—an autonomous musical intelligence that simulates the dynamics of a live ensemble. This guide will help you understand the project's philosophy, customize the system to your liking, and master real-time music generation.</p>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">1. Introduction: What is AuraGroove?</h3>
    <p>AuraGroove is a deterministic algorithmic engine that creates unique background music in real time using fractal mathematics, Markov chains, and genetic algorithms.</p>
    <div class="space-y-1 opacity-80">
      <p>What AuraGroove is NOT:</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>❌ Not a neural network (no LLMs like SUNO or Udio). No text prompts.</li>
        <li>❌ Not a media player. No pre-recorded audio or MIDI files.</li>
        <li>✅ A mathematical generator. Every note is created "here and now".</li>
      </ul>
    </div>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">2. First Steps: Personal Sound Setup</h3>
    <p>Sound is synthesized via Web Audio API, so it varies by device and connection type.</p>
    <ol class="list-decimal pl-4 space-y-1 opacity-80">
      <li>Open System Mixer and Equalizer.</li>
      <li>Tune to your acoustic setup.</li>
      <li>Settings are saved locally on your device.</li>
    </ol>
    <div class="bg-primary/5 p-3 rounded-lg border border-primary/20 text-[10px] italic mt-2">
      <strong>💡 Pro Tip:</strong> Link Mixer presets to specific genres for automatic loading during queue transitions.
    </div>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">3. Genres and "Brains"</h3>
    <p>Each genre is managed by a specialized "Brain" module:</p>
    <ul class="list-disc pl-4 space-y-1 opacity-80">
      <li><strong>Cafe Blues:</strong> Expressive melodies and live improvisation.</li>
      <li><strong>Soft Fusion:</strong> Deep textures and atmospheric layers.</li>
      <li><strong>Zoology:</strong> 60-70s orchestral styling with modern synth pads.</li>
      <li><strong>Neuro Space:</strong> Rhythmic trance-ambient structures.</li>
      <li><strong>Roots Reggae:</strong> Authentic "riddim" laws and specific grooves.</li>
    </ul>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">4. The Genetic System</h3>
    <p>Every session evolves from a <strong>Seed</strong>, crossed with <strong>Masterpieces</strong> (successful past sessions), forming a unique <strong>Suite DNA</strong> (160 bars of harmony and tension).</p>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">5. Controls</h3>
    <p><strong>Top Bar:</strong> Home, Broadcast (Low-end mode), Record, Like (Cloud save), Regenerate.</p>
    <p><strong>Current Path:</strong> Assemble your own journey. ⚠️ Important: Pause, Refresh Queue, then Play after changes.</p>
    <p><strong>Bottom Toolbar:</strong> Spectrum, Refresh, Heritage Toggle, Voice Control (ARP), Theme, Timer.</p>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">6. Recommendations</h3>
    <p><strong>ARP (Voices):</strong> Desktop (256-512), Mobile (50-120). ⚠️ Mobile Warning: Calls and other apps may cause stuttering due to OS limitations.</p>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">7. Privacy</h3>
    <p>Zero telemetry. Zero profiles. Offline-first design. All data stays on your device.</p>
  </section>
</div>
`;

export const DISCLAIMER_RU = `
<div class="prose-info text-[12px] leading-relaxed space-y-6 px-2">
  <h2 class="text-base sm:text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">ДИСКЛЕЙМЕР: AuraGroove V3</h2>
  
  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">1. Что Это Такое (и Чем Не Является)</h3>
    <p>AuraGroove — это детерминированный алгоритмический музыкальный движок. Мы не используем нейросети (SUNO, Udio и др.).</p>
    <ul class="list-disc pl-4 space-y-1 opacity-80">
      <li><strong>Без промптов:</strong> Каждый звук генерируется из внутреннего состояния.</li>
      <li><strong>Без нейросетей:</strong> Система построена на математических преобразованиях.</li>
      <li><strong>Не плеер:</strong> Аудио синтезируется на лету, а не воспроизводится из файлов.</li>
    </ul>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">2. Основные Принципы</h3>
    <ul class="list-disc pl-4 space-y-1 opacity-80">
      <li><strong>Математический Суверенитет:</strong> 100% генерация через фракталы и цепи Маркова.</li>
      <li><strong>Только Генерация:</strong> Никаких MIDI или аудио-файлов извне.</li>
      <li><strong>Приватность:</strong> Ноль телеметрии, ноль профилей, локальное хранение.</li>
    </ul>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">3. Ограничения Производительности</h3>
    <div class="p-3 bg-destructive/10 rounded border border-destructive/20 space-y-2">
      <p class="font-black uppercase text-destructive tracking-tighter">⚠️ Предупреждение для Мобильных Устройств</p>
      <p class="text-[10px] leading-tight opacity-90">Использование на основном телефоне не рекомендуется: звонки прерывают аудио, другие приложения отнимают ресурсы, режим экономии энергии может искажать звук.</p>
    </div>
    <p class="mt-2 italic opacity-70">Лимит голосов (ARP) должен быть выше 50 для приемлемого качества.</p>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">4. Специальные Возможности</h3>
    <p>Система использует <strong>Наследие Аксиом</strong> — генетические шаблоны человеческого исполнения, подвергающиеся глубокой математической мутации.</p>
  </section>

  <div class="bg-primary/5 p-3 rounded-lg border border-primary/20 text-[10px] italic">
    <strong>Финальное примечание:</strong> AuraGroove не имитирует чужие работы. Мы создаем оригинальную математическую музыку в реальном времени.
  </div>
</div>
`;

export const DISCLAIMER_EN = `
<div class="prose-info text-[12px] leading-relaxed space-y-6 px-2">
  <h2 class="text-base sm:text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">DISCLAIMER: AuraGroove V3</h2>
  
  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">1. What This Is</h3>
    <p>AuraGroove is an algorithmic music engine. We do NOT use neural networks or LLMs like SUNO or Udio.</p>
    <ul class="list-disc pl-4 space-y-1 opacity-80">
      <li><strong>No Prompts:</strong> Sound is generated from internal state only.</li>
      <li><strong>No AI:</strong> Built on mathematical probabilistic state machines.</li>
      <li><strong>Not a Player:</strong> All audio is synthesized from scratch.</li>
    </ul>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">2. Core Principles</h3>
    <ul class="list-disc pl-4 space-y-1 opacity-80">
      <li><strong>Mathematical Sovereignty:</strong> 100% generative using fractal math.</li>
      <li><strong>Zero Data Collection:</strong> No telemetry, no profiles, local-only storage.</li>
      <li><strong>Offline by Design:</strong> Functions fully without internet connection.</li>
    </ul>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">3. Constraints</h3>
    <div class="p-3 bg-destructive/10 rounded border border-destructive/20 space-y-2">
      <p class="font-black uppercase text-destructive tracking-tighter">⚠️ Mobile Device Warning</p>
      <p class="text-[10px] leading-tight opacity-90">Audio will stop on calls. Resource contention from other apps and power-saving modes can cause significant distortion.</p>
    </div>
    <p class="mt-2 italic opacity-70">Voice count (ARP) must stay above 50 for audible quality.</p>
  </section>

  <section class="space-y-2">
    <h3 class="text-[11px] font-black uppercase text-primary/70">4. Legal & Ethics</h3>
    <p>No copyright claims. The system produces original, non-copyrightable content through mathematical generation.</p>
  </section>

  <div class="bg-primary/5 p-3 rounded-lg border border-primary/20 text-[10px] italic">
    <strong>Final Note:</strong> This is algorithmic generative music, created from the ground up for the present moment.
  </div>
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
