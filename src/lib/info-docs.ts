/**
 * @fileOverview Справочные материалы AuraGroove (HTML-верстка).
 * #ЗАЧЕМ: Централизованное хранилище документации для пользователей.
 * #ОБНОВЛЕНО: Добавлена информация о новых авторах с Pixabay.
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
    <p>Звук в AuraGroove синтезируется в реальном времени через Web Audio API. Что нужно сделать сразу после загрузки:</p>
    <ol class="list-decimal pl-5 space-y-1">
      <li>Откройте <span class="font-bold">System Mixer</span> и <span class="font-bold">Эквалайзер</span>.</li>
      <li>Настройте их под свою акустическую систему.</li>
      <li>Сделайте это один раз — ваши настройки сохранятся локально.</li>
    </ol>
    <div class="bg-primary/5 p-3 rounded-lg border border-primary/20 flex gap-3">
      <span class="text-lg">💡</span>
      <p class="text-[12px]"><span class="font-black text-primary uppercase">Совет:</span> Вы можете связать пресеты микшера с жанрами. При смене жанра в очереди ваш идеальный микс загрузится автоматически.</p>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">3. Жанры и «Мозги» (Brains)</h2>
    <p>Движок специализируется на создании ненавязчивой фоновой музыки для расслабления или концентрации. Стилизация под оркестровое звучание 60-70-х годов XX века, дополненная синтезаторными пэдами в стиле Neuro-Space и Slow Fusion. Включает гитары, органы, пианино, скрипки, ударные и SFX-ботов. Каждый жанр управляется отдельным модулем — «Мозгом» (Brain), который диктует свои правила гармонии, ритма и техник исполнения.</p>
    <ul class="space-y-3">
      <li class="flex gap-3 items-start">
        <span class="text-xl shrink-0">🎷</span>
        <div><span class="font-black text-primary uppercase">Cafe-Blues:</span> Обширная библиотека техник. Выразительные мелодии, ритмические паттерны и способность к живой импровизации.</div>
      </li>
      <li class="flex gap-3 items-start">
        <span class="text-xl shrink-0">🧘</span>
        <div><span class="font-black text-primary uppercase">Slow Fusion (Ambient):</span> Глубокие текстуры, атмосферные слои и сложные гармонии.</div>
      </li>
      <li class="flex gap-3 items-start">
        <span class="text-xl shrink-0">🌌</span>
        <div><span class="font-black text-primary uppercase">Neuro Space:</span> "@"@"@"@0-@<185=B=K5 AB@C:BC@K A 2K@065==>9 @8B<8:>9.</div>
      </li>
      <li class="flex gap-3 items-start">
        <span class="text-xl shrink-0">🇯🇲</span>
        <div><span class="font-black text-primary uppercase">Roots Reggae:</span> Понимает законы «Риддима» и создает специфический грув (находится в стадии активного развития нишевых вариаций).</div>
      </li>
    </ul>
  </section>

  <section class="space-y-4">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">4. Интерфейс и Управление</h2>
    <div class="bg-muted/20 p-4 rounded-xl space-y-2 border border-border/50">
      <p class="font-black text-[11px] uppercase tracking-wider text-primary">Формирование Очереди (CURRENT PATH):</p>
      <p>Вы можете собрать свой собственный маршрут путешествия. Выберите Жанр и Настроение, нажмите <span class="font-bold uppercase text-primary">Add to Route</span>.</p>
      <p class="text-destructive font-bold italic text-[11px]">⚠️ Важно: После изменений в очереди нажмите Pause, затем кнопку «Обновление очереди» (🔄) в нижнем тулбаре, чтобы система приняла настройки.</p>
    </div>
  </section>

  <section class="space-y-4">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">5. Технические рекомендации</h2>
    <div class="space-y-2">
      <h3 class="text-[11px] font-black uppercase text-primary/70">Лимит голосов (ARP)</h3>
      <p>Качество звука пропорционально количеству активных голосов (иконка CPU ⚙️):</p>
      <ul class="list-disc pl-5 space-y-1 text-[12px]">
        <li><span class="font-bold">50 голосов:</span> Минимум. Ниже возможны артефакты.</li>
        <li><span class="font-bold">Десктоп:</span> Рекомендуется 256–512 голосов.</li>
        <li><span class="font-bold">Мобильные:</span> Рекомендуется 50–120 голосов.</li>
      </ul>
    </div>
  </section>

  <section class="space-y-2 pb-6">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">6. Конфиденциальность</h2>
    <p>AuraGroove полностью уважает вашу приватность. Ноль телеметрии. Все данные хранятся только локально.</p>
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

  <p class="italic text-muted-foreground">Welcome to AuraGroove V3—an autonomous musical intelligence that simulates the dynamics of a live ensemble. This guide will help you understand the project's philosophy, customize the system, and master real-time music generation.</p>

  <section class="space-y-3">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">1. Introduction</h2>
    <p>AuraGroove is a deterministic algorithmic engine creating unique background music via fractal math, Markov chains, and genetic algorithms.</p>
  </section>

  <section class="space-y-3">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">2. First Steps: Sound Setup</h2>
    <p>Sound is synthesized in real time. For the best experience:</p>
    <ol class="list-decimal pl-5 space-y-1">
      <li>Open the <span class="font-bold">System Mixer</span> and <span class="font-bold">Equalizer</span>.</li>
      <li>Calibrate for your acoustic system.</li>
      <li>Settings are saved locally on your device.</li>
    </ol>
  </section>

  <section class="space-y-3">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">3. Genres and "Brains"</h2>
    <p>The engine specializes in creating unobtrusive background music for relaxation or focus. Stylized after the orchestral sound of the 1960s-70s, complemented by synthesizer pads in the style of Neuro-Space and Slow Fusion. Includes guitars, organs, pianos, violins, drums, and SFX bots. Each genre is managed by a separate "Brain" module, which dictates its own rules for harmony, rhythm, and playing techniques.</p>
    <ul class="space-y-3">
      <li class="flex gap-3 items-start">
        <span class="text-xl shrink-0">🎷</span>
        <div><span class="font-black text-primary uppercase">Cafe-Blues:</span> Extensive library of techniques. Expressive melodies, rhythmic patterns, and live improvisation.</div>
      </li>
      <li class="flex gap-3 items-start">
        <span class="text-xl shrink-0">🧘</span>
        <div><span class="font-black text-primary uppercase">Slow Fusion (Ambient):</span> Deep textures, atmospheric layers, and complex harmonies.</div>
      </li>
      <li class="flex gap-3 items-start">
        <span class="text-xl shrink-0">🌌</span>
        <div><span class="font-black text-primary uppercase">Neuro Space:</span> "@"@"@"@0-@<185=B=K5 AB@C:BC@K A 2K@065==>9 @8B<8:>9.</div>
      </li>
      <li class="flex gap-3 items-start">
        <span class="text-xl shrink-0">🇯🇲</span>
        <div><span class="font-black text-primary uppercase">Roots Reggae:</span> Understands the laws of the "riddim" and creates a specific groove.</div>
      </li>
    </ul>
  </section>

  <section class="space-y-4">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">4. Route Management</h2>
    <div class="bg-muted/20 p-4 rounded-xl space-y-2 border border-border/50">
      <p class="font-black text-[11px] uppercase tracking-wider text-primary">CURRENT PATH:</p>
      <p>Assemble your journey. Select Genre and Mood, then tap <span class="font-bold uppercase text-primary">Add to Route</span>.</p>
      <p class="text-destructive font-bold italic text-[11px]">⚠️ Important: After changes, press Pause, then the "Queue Refresh" button (🔄) in the bottom toolbar.</p>
    </div>
  </section>

  <section class="space-y-2 pb-6">
    <h2 class="text-base font-black text-primary uppercase border-l-4 border-primary pl-3 py-1">5. Privacy</h2>
    <p>AuraGroove respects your privacy. Zero telemetry. All data stays local.</p>
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

export const CREDITS_HTML = `
<div class="prose-info text-[12px] leading-relaxed space-y-4">
  <h2 class="text-lg font-black text-primary uppercase border-b border-primary/20 pb-2">🎵 Audio Credits & Licensing</h2>
  
  <p>AuraGroove is a strictly non-commercial, freeware generative music project. All audio samples used in this project are sourced from trusted community libraries and are used in full compliance with their respective Creative Commons licenses.</p>

  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">⚠️ CC-BY 4.0 (Attribution Required)</h3>
    <p class="italic opacity-80">These assets require credit to the original creators:</p>
    <ul class="list-disc pl-4 space-y-1">
      <li><strong>Fender Telecaster Guitar (Clean Strums & Chug)</strong> by JohnZealeyMusic — <a href="https://freesound.org/people/JohnZealeyMusic/packs/33168/" target="_blank" class="text-primary hover:underline">freesound.org/packs/33168</a></li>
      <li><strong>SFX Collection</strong> by akelley6 — <a href="https://freesound.org/people/akelley6" target="_blank" class="text-primary hover:underline">freesound.org/people/akelley6</a></li>
      <li><strong>Bat Screech</strong> by richcraftstudios — <a href="https://freesound.org/s/770720" target="_blank" class="text-primary hover:underline">freesound.org/s/770720</a></li>
      <li><strong>Robotic Transformer</strong> by VectorSpace — <a href="https://freesound.org/s/497616" target="_blank" class="text-primary hover:underline">freesound.org/s/497616</a></li>
      <li><strong>Game Over SFX</strong> by landlucky — <a href="https://freesound.org/s/277403" target="_blank" class="text-primary hover:underline">freesound.org/s/277403</a></li>
      <li><strong>Upload Finished</strong> by Iceofdoom — <a href="https://freesound.org/s/717306" target="_blank" class="text-primary hover:underline">freesound.org/s/717306</a></li>
      <li><strong>Robot Voice</strong> by LittleRobotSoundFactory — <a href="https://freesound.org/s/316288" target="_blank" class="text-primary hover:underline">freesound.org/s/316288</a></li>
      <li><strong>Cyberman Voices</strong> by chungus43A — <a href="https://freesound.org/people/chungus43A" target="_blank" class="text-primary hover:underline">freesound.org/people/chungus43A</a></li>
      <li><strong>Robotic Transmission</strong> by deleted_user_4798915 — <a href="https://freesound.org/s/287974" target="_blank" class="text-primary hover:underline">freesound.org/s/287974</a></li>
      <li><strong>Processed Vocoder Voice</strong> by vate — <a href="https://freesound.org/s/953" target="_blank" class="text-primary hover:underline">freesound.org/s/953</a></li>
      <li><strong>Forever</strong> by carmsie — <a href="https://freesound.org/s/342945" target="_blank" class="text-primary hover:underline">freesound.org/s/342945</a></li>
      <li><strong>Robot Shutdown</strong> by qudup — <a href="https://freesound.org/s/219567" target="_blank" class="text-primary hover:underline">freesound.org/s/219567</a></li>
      <li><strong>Robot Voice</strong> by metrostock99 — <a href="https://freesound.org/s/514696" target="_blank" class="text-primary hover:underline">freesound.org/s/514696</a></li>
    </ul>
  </section>

  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">🎸 CC-BY-NC 3.0 (Non-Commercial Attribution)</h3>
    <p class="italic opacity-80">Used strictly under the non-commercial terms of the AuraGroove freeware project:</p>
    <ul class="list-disc pl-4 space-y-1">
      <li><strong>CS80 Guitar</strong> by mogigrumbles — <a href="https://freesound.org/packs/29636" target="_blank" class="text-primary hover:underline">freesound.org/packs/29636</a></li>
    </ul>
  </section>

  <section class="space-y-1">
    <h3 class="text-[11px] font-black uppercase text-primary/70">✅ Pixabay & CC0 (No Attribution Required)</h3>
    <p class="italic opacity-80">These creators provided assets under CC0 or Pixabay License:</p>
    <ul class="list-disc pl-4 space-y-1 opacity-80">
      <li><strong>Voice Assets</strong> by alien_i_trust, arunangshubanerjee, diff_style, edr, fidelfortune, kuzu420, phatphrogstudio, universfield (Pixabay)</li>
      <li><strong>Free Swirly Drums</strong> by Karoryfer — <a href="https://shop.karoryfer.com/pages/free-swirly-drums" target="_blank" class="hover:underline">shop.karoryfer.com/pages/free-swirly-drums</a></li>
      <li><strong>Piano Samples</strong> by TEDAgame (Freesound)</li>
      <li><strong>Drum Hats</strong> by Walter_Odington (Freesound)</li>
      <li><strong>Dark Ambient Droplets</strong> by DneproMan (Freesound)</li>
      <li><strong>Speedy Clean Guitar</strong> by SpeedY (Freesound)</li>
      <li><strong>Laser SFX</strong> by johncanyon (Freesound)</li>
      <li><strong>Voice SFX</strong> by mooncubedesign, carmsie, newagesoup, VASOTELVI, Anzbot, harrisonlace, SonicWarriorSounds, NicknameLarry, soundcannon42, 8bitmyketison, Euphrosyyn, TheEndOfACycle, Reitanna, Novi, esseffe1 (Freesound)</li>
      <li><strong>Bells, Bongo, Promenade, Flute & Guitars</strong> curated from OpenGameArt.org (CC0)</li>
    </ul>
  </section>

  <div class="bg-primary/5 p-3 rounded-lg border border-primary/20 text-[10px] italic">
    <strong>DMCA / Rights Holder Notice:</strong><br/>
    If you are a copyright holder and believe that any asset has been used incorrectly or without proper attribution, please contact us immediately. We are committed to resolving any licensing concerns promptly, including the immediate removal of the contested asset if necessary.
  </div>
</div>
`;
