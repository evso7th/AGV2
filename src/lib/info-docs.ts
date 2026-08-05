/**
 * @fileOverview Справочные материалы AuraGroove (HTML-верстка).
 * #ЗАЧЕМ: Централизованное хранилище документации для пользователей.
 * #ОБНОВЛЕНО: Версия 0.4.32. Добавлено описание новых элементов HUD и мгновенного отклика.
 */

export const GUIDE_RU = `
<div class="prose-info text-[13px] leading-relaxed space-y-6">
  <div class="text-center space-y-2 border-b border-primary/20 pb-4 mx-2">
    <h1 class="text-base sm:text-2xl font-black text-primary uppercase tracking-tighter">Полное руководство пользователя</h1>
    <p class="text-sm sm:text-lg font-bold">AuraGroove V 0.4.32 (Infinite Take Orchestra)</p>
    <p class="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">Interface: v16.2 | Core: v3.7.0</p>
  </div>

  <p class="italic text-muted-foreground text-[12px] sm:text-[13px] px-2">Добро пожаловать в AuraGroove V3 — автономный музыкальный интеллект. Версия 0.4.32 представляет полностью модернизированный иммерсивный режим HUD с расширенным контролем и мгновенной реакцией.</p>

  <section class="space-y-3 px-2">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">1. Интерактивный HUD (Иммерсивный режим)</h2>
    <p>Режим HUD активируется автоматически при отсутствии активности. Теперь он превратился в полноценный терминал управления:</p>
    <ul class="list-disc pl-5 space-y-2">
      <li><strong>Активный брендинг:</strong> Нажмите на заголовок <em>AuraGroove Infinite Take Orchestra</em> в верхней части экрана, чтобы мгновенно вызвать это окно Инфоцентра.</li>
      <li><strong>Четырехточечный контроль:</strong> В углах экрана расположены основные функции. Сверху: Регенерация (слева) и Broadcast Bridge (справа). Снизу: Студийный Микшер (слева) и Эквалайзер (справа).</li>
      <li><strong>Прогресс-бар:</strong> Прямо над нижним пультом управления появилась тонкая линия, отображающая ход текущей музыкальной сюиты.</li>
      <li><strong>Мгновенный отклик:</strong> Иконка Play/Pause меняется немедленно при нажатии, обеспечивая безупречную визуальную связь.</li>
      <li><strong>Квадратное Ядро:</strong> Центральная визуализация теперь идеально сбалансирована в форме квадрата для лучшего восприятия энергии.</li>
    </ul>
  </section>

  <section class="space-y-3 px-2">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">2. Студийные настройки</h2>
    <p>Все окна настроек (Микшер, EQ, Инфоцентр) теперь имеют единый стиль «матового стекла», не отвлекая от погружения в музыку.</p>
    <div class="bg-primary/5 p-3 rounded-lg border border-primary/20 flex gap-3">
      <span class="text-lg">💡</span>
      <p class="text-[12px]"><span class="font-black text-primary uppercase">Совет:</span> Используйте кнопку Broadcast Bridge (иконка вышки) в верхнем правом углу HUD для обеспечения стабильности звука в фоновом режиме на мобильных устройствах.</p>
    </div>
  </section>

  <section class="space-y-3 px-2 pb-6">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">3. Конфиденциальность</h2>
    <p>AuraGroove работает локально. Ваши пресеты, маршруты и настройки хранятся только в памяти вашего браузера. Ноль телеметрии, 100% музыки.</p>
    <p class="text-center font-black uppercase text-primary pt-4 tracking-widest">Enjoy the flow!</p>
  </section>
</div>
`;

export const GUIDE_EN = `
<div class="prose-info text-[13px] leading-relaxed space-y-6">
  <div class="text-center space-y-2 border-b border-primary/20 pb-4 mx-2">
    <h1 class="text-base sm:text-2xl font-black text-primary uppercase tracking-tighter">Complete User Guide</h1>
    <p class="text-sm sm:text-lg font-bold">AuraGroove V 0.4.32 (Infinite Take Orchestra)</p>
    <p class="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">Interface: v16.2 | Core: v3.7.0</p>
  </div>

  <p class="italic text-muted-foreground text-[12px] sm:text-[13px] px-2">Welcome to AuraGroove V3. Version 0.4.32 introduces a fully modernized Immersive HUD with expanded control points and instant tactile feedback.</p>

  <section class="space-y-3 px-2">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">1. Immersive HUD Evolution</h2>
    <p>The HUD activates automatically during inactivity, turning your screen into a high-tech music terminal:</p>
    <ul class="list-disc pl-5 space-y-2">
      <li><strong>Interactive Branding:</strong> Tap the <em>AuraGroove Infinite Take Orchestra</em> header at the top to instantly open this Info Center.</li>
      <li><strong>Four-Corner Control:</strong> Essential tools are now surrounding the Core. Top: Regenerate (left) and Broadcast Bridge (right). Bottom: Studio Mixer (left) and Equalizer (right).</li>
      <li><strong>Progress Indicator:</strong> A sleek progress bar is now visible just above the bottom control pill, tracking the duration of the current suite.</li>
      <li><strong>Instant Feedback:</strong> The Play/Pause icon toggles immediately upon click or tap, providing zero-latency visual confirmation.</li>
      <li><strong>Perfect Square Core:</strong> The central orbital animation is now locked to a perfect square geometry for visual balance.</li>
    </ul>
  </section>

  <section class="space-y-3 px-2">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">2. Studio Aesthetics</h2>
    <p>All control windows (Mixer, EQ, Info Center) now feature a consistent "frosted glass" style that maintains visual harmony across the app.</p>
  </section>

  <section class="space-y-2 px-2 pb-6">
    <h2 class="text-[12px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">3. Privacy and Autonomy</h2>
    <p>AuraGroove stays local. Your presets, journeys, and settings remain on your device. Zero telemetry. Zero tracking.</p>
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
      <li><strong>HUD:</strong> Интерактивный режим погружения с активными элементами управления.</li>
      <li><strong>Мгновенность:</strong> Визуальный отклик интерфейса оптимизирован для исключения задержек восприятия.</li>
      <li><strong>Приватность:</strong> Никакие данные о прослушивании не покидают ваше устройство.</li>
    </ul>
  </section>

  <p class="text-[10px] italic opacity-50 pt-2 border-t border-primary/10">Последнее обновление: Май 2026. Версия 0.4.32</p>
</div>
`;

export const DISCLAIMER_EN = `
<div class="prose-info text-[12px] leading-relaxed space-y-4 px-2">
  <h2 class="text-base sm:text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">DISCLAIMER: AuraGroove V3</h2>
  
  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">1. Technical Definition</h3>
    <p>AuraGroove is a deterministic algorithmic engine. It is NOT a standard media player as it does not play pre-recorded files; it synthesizes them on-the-fly.</p>
    <ul class="list-disc pl-4 opacity-80">
      <li><strong>HUD:</strong> Interactive immersion mode with live control points.</li>
      <li><strong>Responsiveness:</strong> UI feedback is optimized for zero-latency icon toggling.</li>
      <li><strong>Privacy:</strong> No listening data ever leaves your device.</li>
    </ul>
  </section>

  <p class="text-[10px] italic opacity-50 pt-2 border-t border-primary/10">Last Updated: May 2026. Version 0.4.32</p>
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