/**
 * @fileOverview Справочные материалы AuraGroove (HTML-верстка).
 * #ЗАЧЕМ: Централизованное хранилище документации для пользователей.
 * #ОБНОВЛЕНО: Глубокая актуализация на основе Disclaimer V3.7.0.
 */

export const GUIDE_RU = `
<div class="prose-info text-[13px] leading-relaxed space-y-4">
  <h2 class="text-xl font-black text-primary uppercase tracking-tighter border-b border-primary/20 pb-2">Инструкция AuraGroove</h2>
  <p class="text-[10px] font-bold opacity-50 uppercase tracking-widest">Версия интерфейса: v3.1 Stable | Ядро: v3.7.0</p>
  
  <section class="space-y-2">
    <h3 class="text-sm font-black uppercase text-primary/80">1. О приложении</h3>
    <p>AuraGroove — это детерминированный музыкальный движок, создающий уникальные звуковые ландшафты в реальном времени. Это не ИИ в привычном понимании (здесь нет промптов) — только чистая математика, фракталы и генетические алгоритмы.</p>
  </section>

  <section class="space-y-2">
    <h3 class="text-sm font-black uppercase text-primary/80">2. Основные функции</h3>
    <ul class="list-disc pl-4 space-y-1">
      <li><strong>Regenerate (Refresh):</strong> Создает новую пьесу с уникальной структурой и семенем (Seed).</li>
      <li><strong>Like (Thumbs Up):</strong> Сохраняет удачную комбинацию в глобальный "генофонд" шедевров.</li>
      <li><strong>DNA Anchor:</strong> Позволяет зафиксировать конкретный трек-донор из базы Наследия.</li>
      <li><strong>Direct Stream Bridge (Tower):</strong> Обеспечивает стабильное воспроизведение в фоновом режиме.</li>
    </ul>
  </section>

  <section class="space-y-2">
    <h3 class="text-sm font-black uppercase text-primary/80">3. Лимит голосов (ARP)</h3>
    <p>Качество звука напрямую зависит от количества активных голосов. Нажмите на иконку <strong>Layers</strong> в футере:</p>
    <ul class="list-disc pl-4 space-y-1">
      <li><strong>Минимум 50:</strong> Порог приемлемого качества.</li>
      <li><strong>Рекомендуемо 60-120:</strong> Для мобильных устройств.</li>
      <li><strong>Максимум 250-512:</strong> Для мощных настольных систем.</li>
    </ul>
    <p class="text-[11px] italic opacity-70">Примечание: После смены лимита во время игры нажмите «Regenerate» для очистки старых хвостов.</p>
  </section>

  <section class="space-y-2">
    <h3 class="text-sm font-black uppercase text-primary/80">4. Студийный микшер</h3>
    <table class="w-full border-collapse text-[11px]">
      <tr class="border-b border-primary/20"><th class="text-left py-1">Канал</th><th class="text-left py-1">Роль</th></tr>
      <tr><td class="py-1 font-bold">Master</td><td class="py-1">Общая громкость приложения</td></tr>
      <tr><td class="py-1 font-bold">Bass</td><td class="py-1">Фундамент и грув (G1 Standard)</td></tr>
      <tr><td class="py-1 font-bold">Lead</td><td class="py-1">Ведущая мелодия</td></tr>
      <tr><td class="py-1 font-bold">Keyb</td><td class="py-1">Ритмические пэды</td></tr>
      <tr><td class="py-1 font-bold">Drums</td><td class="py-1">Ударная секция</td></tr>
    </table>
  </section>
</div>
`;

export const GUIDE_EN = `
<div class="prose-info text-[13px] leading-relaxed space-y-4">
  <h2 class="text-xl font-black text-primary uppercase tracking-tighter border-b border-primary/20 pb-2">AuraGroove Manual</h2>
  <p class="text-[10px] font-bold opacity-50 uppercase tracking-widest">UI Version: v3.1 Stable | Core Engine: v3.7.0</p>

  <section class="space-y-2">
    <h3 class="text-sm font-black uppercase text-primary/80">1. Introduction</h3>
    <p>AuraGroove is a deterministic music engine creating unique soundscapes in real-time. It's not prompt-based AI; it's pure mathematics, fractals, and genetic algorithms.</p>
  </section>

  <section class="space-y-2">
    <h3 class="text-sm font-black uppercase text-primary/80">2. Key Controls</h3>
    <ul class="list-disc pl-4 space-y-1">
      <li><strong>Regenerate (Refresh):</strong> Generates a completely new piece with a unique structure and Seed.</li>
      <li><strong>Like (Thumbs Up):</strong> Saves the current session to the global "masterpieces" gene pool.</li>
      <li><strong>DNA Anchor:</strong> Locks a specific donor track from the Heritage database.</li>
      <li><strong>Direct Stream Bridge (Tower):</strong> Ensures stable background playback.</li>
    </ul>
  </section>

  <section class="space-y-2">
    <h3 class="text-sm font-black uppercase text-primary/80">3. Voice Limit (ARP)</h3>
    <p>Sound quality is proportional to the number of active voices. Tap the <strong>Layers</strong> icon in the footer:</p>
    <ul class="list-disc pl-4 space-y-1">
      <li><strong>Min 50:</strong> Minimum threshold for acceptable quality.</li>
      <li><strong>60-120:</strong> Recommended for mobile devices.</li>
      <li><strong>250-512:</strong> For high-performance desktop systems.</li>
    </ul>
    <p class="text-[11px] italic opacity-70">Note: If you change the limit during playback, press "Regenerate" to clear lingering voices.</p>
  </section>

  <section class="space-y-2">
    <h3 class="text-sm font-black uppercase text-primary/80">4. Studio Mixer</h3>
    <table class="w-full border-collapse text-[11px]">
      <tr class="border-b border-primary/20"><th class="text-left py-1">Channel</th><th class="text-left py-1">Role</th></tr>
      <tr><td class="py-1 font-bold">Master</td><td class="py-1">Overall application volume</td></tr>
      <tr><td class="py-1 font-bold">Bass</td><td class="py-1">Groove foundation (G1 Standard)</td></tr>
      <tr><td class="py-1 font-bold">Lead</td><td class="py-1">Main melodic theme</td></tr>
      <tr><td class="py-1 font-bold">Keyb</td><td class="py-1">Rhythmic pads</td></tr>
      <tr><td class="py-1 font-bold">Drums</td><td class="py-1">Percussion section</td></tr>
    </table>
  </section>
</div>
`;

export const DISCLAIMER_RU = `
<div class="prose-info text-[12px] leading-relaxed space-y-4">
  <h2 class="text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">ДИСКЛЕЙМЕР: AuraGroove V3</h2>
  
  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">1. Что это такое (и чем не является)</h3>
    <p>AuraGroove — это детерминированный алгоритмический музыкальный движок. Это не генератор на основе нейросетей (как SUNO или Udio).</p>
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
