/**
 * @fileOverview Справочные материалы AuraGroove (HTML-верстка).
 * #ЗАЧЕМ: Централизованное хранилище документации для пользователей.
 * #ОБНОВЛЕНО: Версия 0.4.12. Добавлено описание HUD и Ambient Mode.
 */

export const GUIDE_RU = `
<div class="prose-info text-[13px] leading-relaxed space-y-6">
  <div class="text-center space-y-2 border-b border-primary/20 pb-4">
    <h1 class="text-lg sm:text-2xl font-black text-primary uppercase tracking-tighter">Полное руководство пользователя</h1>
    <p class="text-base sm:text-lg font-bold">AuraGroove V 0.4.12 (Infinite Take Orchestra)</p>
    <p class="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">Interface: v15.4 | Core: v3.7.0</p>
  </div>

  <p class="italic text-muted-foreground text-[12px] sm:text-[13px]">Добро пожаловать в AuraGroove V3 — автономный музыкальный интеллект, имитирующий работу живого ансамбля. Это руководство поможет вам понять философию проекта, настроить систему под себя и научиться управлять генерацией музыки в реальном времени.</p>

  <section class="space-y-3">
    <h2 class="text-[13px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">1. Введение: Что такое AuraGroove?</h2>
    <p>AuraGroove — это детерминированный алгоритмический движок, создающий уникальную фоновую музыку в реальном времени с помощью фрактальной математики, цепей Маркова и генетических алгоритмов.</p>
    <div class="bg-muted/30 p-3 rounded-lg space-y-2 border border-border/50">
      <p class="font-bold text-[11px] uppercase opacity-70">Важно понимать, чем AuraGroove НЕ является:</p>
      <ul class="space-y-1 text-[12px]">
        <li class="flex gap-2"><span>❌</span> <span>Это не нейросеть. Здесь нет LLM-моделей (как в SUNO или Udio). Никаких текстовых промптов.</span></li>
        <li class="flex gap-2"><span>❌</span> <span>Это не плеер. Приложение не хранит и не воспроизводит готовые аудиофайлы или MIDI-треки.</span></li>
        <li class="flex gap-2"><span>✅</span> <span>Это математический генератор. Каждая нота, ритм и тембр создаются «здесь и сейчас».</span></li>
      </ul>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-[13px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">2. Иммерсивный режим (HUD)</h2>
    <p>Новая функция версии 0.4 — режим полного погружения. Если вы не взаимодействуете с интерфейсом в течение 10 секунд при включенной музыке, приложение переходит в режим <strong>Ambient HUD</strong>.</p>
    <ul class="list-disc pl-5 space-y-2">
      <li><strong>Живое Ядро:</strong> Центральная визуализация энергии (Орбиты), которая меняет цвет, скорость и свечение в зависимости от музыкального напряжения (Tension).</li>
      <li><strong>Минималистичный пульт:</strong> В нижней части экрана остается только «пилюля» с основными кнопками управления и счетчик шагов.</li>
      <li><strong>Обратная связь:</strong> При нажатии «Лайк» или «Запись» в HUD всплывают деликатные уведомления.</li>
    </ul>
    <p class="text-muted-foreground italic text-[11px] sm:text-[12px]">Чтобы выйти из режима HUD, просто коснитесь любой кнопки управления или нажмите «X» на пульте.</p>
  </section>

  <section class="space-y-3">
    <h2 class="text-[13px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">3. Настройка звука</h2>
    <p>Звук синтезируется через Web Audio API. Рекомендуется настроить <strong>System Mixer</strong> и <strong>Эквалайзер</strong> под вашу акустику. Настройки сохраняются локально.</p>
    <div class="bg-primary/5 p-3 rounded-lg border border-primary/20 flex gap-3">
      <span class="text-lg">💡</span>
      <p class="text-[12px]"><span class="font-black text-primary uppercase">Совет:</span> Вы можете связать пресеты микшера с жанрами для автоматической загрузки идеального баланса.</p>
    </div>
  </section>

  <section class="space-y-3 pb-6">
    <h2 class="text-[13px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">4. Конфиденциальность</h2>
    <p>AuraGroove полностью уважает вашу приватность. Ноль телеметрии. Все данные хранятся только локально.</p>
    <p class="text-center font-black uppercase text-primary pt-4 tracking-widest">Enjoy listening!</p>
  </section>
</div>
`;

export const GUIDE_EN = `
<div class="prose-info text-[13px] leading-relaxed space-y-6">
  <div class="text-center space-y-2 border-b border-primary/20 pb-4">
    <h1 class="text-lg sm:text-2xl font-black text-primary uppercase tracking-tighter">Complete User Guide</h1>
    <p class="text-base sm:text-lg font-bold">AuraGroove V 0.4.12 (Infinite Take Orchestra)</p>
    <p class="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">Interface: v15.4 | Core: v3.7.0</p>
  </div>

  <p class="italic text-muted-foreground text-[12px] sm:text-[13px]">Welcome to AuraGroove V3—an autonomous musical intelligence that simulates the dynamics of a live ensemble. This guide will help you understand the project's philosophy and master real-time music generation.</p>

  <section class="space-y-3">
    <h2 class="text-[13px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">1. Introduction</h2>
    <p>AuraGroove is a deterministic algorithmic engine creating unique background music via fractal math, Markov chains, and genetic algorithms.</p>
  </section>

  <section class="space-y-3">
    <h2 class="text-[13px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">2. Immersive Mode (HUD)</h2>
    <p>New in version 0.4: the <strong>Ambient HUD</strong>. If you remain inactive for 10 seconds while music is playing, the app enters a focused immersion state.</p>
    <ul class="list-disc pl-5 space-y-2">
      <li><strong>The Living Core:</strong> A central energy visualization (Orbitals) that reacts to musical Tension by changing color, speed, and glow intensity.</li>
      <li><strong>Control Pill:</strong> A floating minimalist toolbar containing essential playback and capture buttons.</li>
      <li><strong>Visual Feedback:</strong> Confirmation messages for Likes and Recordings float elegantly within the HUD.</li>
    </ul>
    <p class="text-muted-foreground italic text-[11px] sm:text-[12px]">Simply interact with any control or press 'X' to return to the standard interface.</p>
  </section>

  <section class="space-y-3">
    <h2 class="text-[13px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">3. Sound Setup</h2>
    <p>Sound is synthesized in real time. We recommend calibrating the <strong>System Mixer</strong> and <strong>Equalizer</strong> for your specific audio equipment.</p>
  </section>

  <section class="space-y-2 pb-6">
    <h2 class="text-[13px] sm:text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">4. Privacy</h2>
    <p>AuraGroove respects your privacy. Zero telemetry. All data remains locally on your device.</p>
    <p class="text-center font-black uppercase text-primary pt-4 tracking-widest">Enjoy listening!</p>
  </section>
</div>
`;

export const DISCLAIMER_RU = `
<div class="prose-info text-[12px] leading-relaxed space-y-4">
  <h2 class="text-base sm:text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">ДИСКЛЕЙМЕР: AuraGroove V3</h2>
  
  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">1. Что это такое</h3>
    <p>AuraGroove — это детерминированный алгоритмический движок. Это не генератор на основе нейросетей (как SUNO или Udio).</p>
    <ul class="list-disc pl-4 opacity-80">
      <li>Без промптов: Мы не обрабатываем текстовые запросы.</li>
      <li>Без нейросетей: Система построена на фракталах и цепи Маркова.</li>
      <li>Не плеер: Весь звук синтезируется «на лету» с нуля.</li>
    </ul>
  </section>

  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">2. Основные Принципы</h3>
    <p><strong>Математический Суверенитет:</strong> 100% генерация. Никакого семплирования существующей музыки.</p>
    <p><strong>Приватность:</strong> Ноль телеметрии. Ноль профилей. Все настройки хранятся только локально.</p>
  </section>

  <p class="text-[10px] italic opacity-50 pt-2 border-t border-primary/10">Последнее обновление: Май 2026. Версия 0.4.12</p>
</div>
`;

export const DISCLAIMER_EN = `
<div class="prose-info text-[12px] leading-relaxed space-y-4">
  <h2 class="text-base sm:text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">DISCLAIMER: AuraGroove V3</h2>
  
  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">1. Definition</h3>
    <p>AuraGroove is a deterministic, algorithmic music engine. It is NOT a neural network-based generator.</p>
    <ul class="list-disc pl-4 opacity-80">
      <li>No prompts: We do not process text-to-music requests.</li>
      <li>No neural networks: Built entirely on fractal math and Markov chains.</li>
      <li>Not a playback engine: Audio is synthesized on-the-fly.</li>
    </ul>
  </section>

  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">2. Core Principles</h3>
    <p><strong>Mathematical Sovereignty:</strong> 100% generative. No sampling of existing music.</p>
    <p><strong>Zero Data Collection:</strong> No telemetry, no user profiles.</p>
  </section>

  <p class="text-[10px] italic opacity-50 pt-2 border-t border-primary/10">Last Updated: May 2026. Version 0.4.12</p>
</div>
`;

export const CREDITS_HTML = `
<div class="prose-info text-[12px] leading-relaxed space-y-4">
  <h2 class="text-base sm:text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">🎵 Audio Credits & Licensing</h2>
  
  <p>AuraGroove is a strictly non-commercial project. All audio assets are used under Creative Commons or Public Domain licenses.</p>

  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">⚠️ CC-BY 4.0 Attribution</h3>
    <ul class="list-disc pl-4 space-y-1 opacity-80">
      <li><strong>Fender Telecaster</strong> by JohnZealeyMusic (Freesound)</li>
      <li><strong>SFX Collection</strong> by akelley6 (Freesound)</li>
      <li><strong>Robotic Transformer</strong> by VectorSpace</li>
    </ul>
  </section>

  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">✅ Public Domain & CC0</h3>
    <ul class="list-disc pl-4 space-y-1 opacity-80">
      <li><strong>Voice Assets</strong> by alien_i_trust, fidelfortune, universfield (Pixabay)</li>
      <li><strong>Drum Kits</strong> by Karoryfer & Walter_Odington</li>
      <li><strong>Ambient Textures</strong> by DneproMan</li>
    </ul>
  </section>

  <div class="bg-primary/5 p-3 rounded-lg border border-primary/20 text-[10px] italic">
    <strong>DMCA:</strong> If you believe an asset is used incorrectly, please contact us for immediate removal.
  </div>
</div>
`;