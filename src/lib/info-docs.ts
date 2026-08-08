/**
 * @fileOverview Справочные материалы AuraGroove (HTML-верстка).
 * #ЗАЧЕМ: Централизованное хранилище документации для пользователей.
 * #ОБНОВЛЕНО: Версия 0.4.46. Добавлено описание Full Track Record (FTR).
 */

export const GUIDE_RU = `
<div class="prose-info text-[13px] leading-relaxed space-y-6">
  <div class="text-center space-y-2 border-b border-primary/20 pb-4 mx-2">
    <h1 class="text-base sm:text-2xl font-black text-primary uppercase tracking-tighter">Полное руководство пользователя</h1>
    <p class="text-sm sm:text-lg font-bold">AuraGroove V 0.4.46 (Infinite Take Orchestra)</p>
    <p class="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">Interface: v17.0 | Core: v3.7.0</p>
  </div>

  <p class="italic text-muted-foreground text-[12px] sm:text-[13px] px-2">Добро пожаловать в AuraGroove V3 — автономный музыкальный интеллект. Версия 0.4.46 представляет режим Ether и систему Full Track Record.</p>

  <section class="space-y-3 px-2">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">1. Интерактивная Визуализация (HUD)</h2>
    <p>Центральное «Ядро» теперь является активным объектом управления. Вы можете менять характер визуального ряда в реальном времени:</p>
    <ul class="list-disc pl-5 space-y-2">
      <li><strong>Переключение режимов (Double-Tap):</strong> Дважды нажмите (или кликните) в зоне анимации, чтобы сменить режим:
        <ul class="list-circle pl-5 mt-1 opacity-80">
          <li><em>Ether (по умолчанию):</em> Сочетание орбитальных колец и глубокого органического тумана.</li>
          <li><em>Orbital:</em> Чистая математическая геометрия светящихся орбит.</li>
          <li><em>Nebula (Pure):</em> Автономная художественная анимация с оригинальной палитрой перетекания.</li>
        </ul>
      </li>
    </ul>
  </section>

  <section class="space-y-3 px-2">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">2. Режимы записи (Recording)</h2>
    <p>AuraGroove поддерживает два типа экспорта вашей музыки в формат .webm:</p>
    <div class="space-y-4 bg-primary/5 p-4 rounded-lg border border-primary/10">
      <div>
        <h4 class="font-black text-[11px] uppercase text-primary">● Обычная запись (Manual)</h4>
        <p class="text-[12px]">Активируется <strong>коротким нажатием</strong> на иконку Radio. Вы сами решаете, когда начать и закончить запись. Идеально для захвата коротких фрагментов.</p>
      </div>
      <div>
        <h4 class="font-black text-[11px] uppercase text-primary">● Запись полного трека (Full Track Record)</h4>
        <p class="text-[12px]">Активируется <strong>зажатием (1.5 сек)</strong> кнопки Radio. Студия дождется завершения текущей сюиты (160 тактов), автоматически сохранит файл с идеальным финалом и переведет систему в режим Паузы. Это гарантирует целостность композиции без лишних «хвостов».</p>
      </div>
    </div>
  </section>

  <section class="space-y-3 px-2">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">3. Студийные настройки</h2>
    <p>Все окна настроек (Микшер, EQ, Инфоцентр) имеют единый стиль «матового стекла», не отвлекая от погружения в музыку. Вы можете сохранять свои пресеты и привязывать их к жанрам.</p>
  </section>

  <section class="space-y-3 px-2 pb-6">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">4. Конфиденциальность</h2>
    <p>Мы ведем анонимный учет количества сессий и географии (на основе часового пояса), чтобы понимать масштаб оркестра. Никакие персональные данные не собираются.</p>
    <p class="text-center font-black uppercase text-primary pt-4 tracking-widest">Enjoy the flow!</p>
  </section>
</div>
`;

export const GUIDE_EN = `
<div class="prose-info text-[13px] leading-relaxed space-y-6">
  <div class="text-center space-y-2 border-b border-primary/20 pb-4 mx-2">
    <h1 class="text-base sm:text-2xl font-black text-primary uppercase tracking-tighter">Complete User Guide</h1>
    <p class="text-sm sm:text-lg font-bold">AuraGroove V 0.4.46 (Infinite Take Orchestra)</p>
    <p class="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">Interface: v17.0 | Core: v3.7.0</p>
  </div>

  <p class="italic text-muted-foreground text-[12px] sm:text-[13px] px-2">Welcome to AuraGroove V3. Version 0.4.46 introduces Ether mode and the Full Track Record (FTR) system.</p>

  <section class="space-y-3 px-2">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">1. Interactive Visualization (HUD)</h2>
    <p>The central "Core" is now an active control element. You can change the visual character in real time:</p>
    <ul class="list-disc pl-5 space-y-2">
      <li><strong>Mode Switching (Double-Tap):</strong> Double-tap or double-click within the animation area to cycle modes:
        <ul class="list-circle pl-5 mt-1 opacity-80">
          <li><em>Ether (default):</em> A fusion of orbital rings and deep organic fog.</li>
          <li><em>Orbital:</em> Pure geometric orbits of light.</li>
          <li><em>Nebula (Pure):</em> Autonomous artistic animation with its original flow palette.</li>
        </ul>
      </li>
    </ul>
  </section>

  <section class="space-y-3 px-2">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">2. Recording Modes</h2>
    <p>AuraGroove supports two types of export to .webm format:</p>
    <div class="space-y-4 bg-primary/5 p-4 rounded-lg border border-primary/10">
      <div>
        <h4 class="font-black text-[11px] uppercase text-primary">● Manual Recording</h4>
        <p class="text-[12px]">Activated by a <strong>short tap</strong> on the Radio icon. You manually decide when to start and stop. Best for quick snippets.</p>
      </div>
      <div>
        <h4 class="font-black text-[11px] uppercase text-primary">● Full Track Record (FTR)</h4>
        <p class="text-[12px]">Activated by <strong>holding (1.5s)</strong> the Radio button. The studio will wait for the current suite (160 bars) to finish, automatically save the file with a perfect ending, and pause the system. This ensures a clean "start-to-finish" capture.</p>
      </div>
    </div>
  </section>

  <section class="space-y-3 px-2">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">3. Studio Aesthetics</h2>
    <p>All control windows (Mixer, EQ, Info Center) feature a consistent "frosted glass" style. You can save custom presets and link them to specific genres.</p>
  </section>

  <section class="space-y-2 px-2 pb-6">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">4. Privacy</h2>
    <p>We anonymously track session counts and regional distribution. No personal data is ever collected or stored.</p>
    <p class="text-center font-black uppercase text-primary pt-4 tracking-widest">Enjoy the music!</p>
  </section>
</div>
`;

export const DISCLAIMER_RU = `
<div class="prose-info text-[12px] leading-relaxed space-y-4 px-2">
  <h2 class="text-base sm:text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">ДИСКЛЕЙМЕР: AuraGroove V3</h2>
  
  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">1. Техническая природа</h3>
    <p>AuraGroove — это детерминированный алгоритмический движок. Он не является «плеером» в привычном понимании, так как не воспроизводит записанные файлы, а создает их в реальном времени.</p>
    <ul class="list-disc pl-4 opacity-80">
      <li><strong>HUD:</strong> Интерактивный режим погружения с поддержкой жестов переключения.</li>
      <li><strong>Мгновенность:</strong> Визуальный отклик интерфейса оптимизирован для исключения задержек восприятия.</li>
      <li><strong>Приватность:</strong> Мы используем анонимные агрегаторы для статистики сессий. Персональные данные не собираются.</li>
    </ul>
  </section>

  <p class="text-[10px] italic opacity-50 pt-2 border-t border-primary/10">Последнее обновление: Май 2026. Версия 0.4.46</p>
</div>
`;

export const DISCLAIMER_EN = `
<div class="prose-info text-[12px] leading-relaxed space-y-4 px-2">
  <h2 class="text-base sm:text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">DISCLAIMER: AuraGroove V3</h2>
  
  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">1. Technical Definition</h3>
    <p>AuraGroove is a deterministic algorithmic engine. It is NOT a standard media player as it does not play pre-recorded files; it synthesizes them on-the-fly.</p>
    <ul class="list-disc pl-4 opacity-80">
      <li><strong>HUD:</strong> Interactive immersion mode with gesture-based switching support.</li>
      <li><strong>Responsiveness:</strong> UI feedback is optimized for zero-latency toggling.</li>
      <li><strong>Privacy:</strong> We use anonymous session counters. No personally identifiable information is collected.</li>
    </ul>
  </section>

  <p class="text-[10px] italic opacity-50 pt-2 border-t border-primary/10">Last Updated: May 2026. Version 0.4.46</p>
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
