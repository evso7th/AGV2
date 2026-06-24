/**
 * @fileOverview Справочные материалы AuraGroove (HTML-верстка).
 * #ЗАЧЕМ: Централизованное хранилище документации для пользователей.
 */

export const GUIDE_RU = `
<div class="prose-info">
  <h2>Инструкция AuraGroove</h2>
  <p><strong>Версия интерфейса:</strong> v3.1 Stable | <strong>Ядро:</strong> v3.7.0</p>
  
  <h3>1. Введение</h3>
  <p>AuraGroove — это детерминированный музыкальный движок, создающий уникальные звуковые ландшафты в реальном времени с помощью фрактальной математики и генетических алгоритмов. Это не ИИ в привычном понимании (как SUNO), здесь нет промптов — только чистая математика и музыкальные законы.</p>

  <h3>2. Главный экран</h3>
  <ul>
    <li><strong>Regenerate ():</strong> Создает абсолютно новую пьесу с уникальной структурой.</li>
    <li><strong>Like (M):</strong> Сохраняет текущую сессию в глобальный "генофонд" шедевров.</li>
    <li><strong>DNA Anchor:</strong> Позволяет зафиксировать конкретный трек-донор из базы Наследия.</li>
  </ul>

  <h3>3. Студийный микшер</h3>
  <table class="w-full border-collapse my-4">
    <tr class="border-b border-primary/20"><th class="text-left p-2">Канал</th><th class="text-left p-2">Роль</th></tr>
    <tr><td class="p-2 font-bold">Master (M)</td><td class="p-2">Общая громкость приложения</td></tr>
    <tr><td class="p-2 font-bold">Bass (B)</td><td class="p-2">Фундамент грува</td></tr>
    <tr><td class="p-2 font-bold">Lead (MEL)</td><td class="p-2">Ведущая мелодия</td></tr>
    <tr><td class="p-2 font-bold">Keyb (ACC)</td><td class="p-2">Ритмические пэды</td></tr>
    <tr><td class="p-2 font-bold">Drums (D)</td><td class="p-2">Ударная секция</td></tr>
  </table>

  <h3>4. Управление голосами (ARP)</h3>
  <p>Нажмите на иконку микросхемы (Layers) для настройки лимита голосов. <strong>Минимум: 50</strong> (для качества), <strong>Максимум: 512</strong> (для мощных систем). На мобильных устройствах рекомендуем 60-120.</p>
</div>
`;

export const GUIDE_EN = `
<div class="prose-info">
  <h2>AuraGroove Manual</h2>
  <p><strong>UI Version:</strong> v3.1 Stable | <strong>Core Engine:</strong> v3.7.0</p>

  <h3>1. Introduction</h3>
  <p>AuraGroove is a deterministic music engine that creates unique soundscapes in real-time using fractal mathematics and genetic algorithms. No prompts, no neural networks — just pure mathematical harmony.</p>

  <h3>2. Main Controls</h3>
  <ul>
    <li><strong>Regenerate ():</strong> Generates a completely new piece with a unique structure.</li>
    <li><strong>Like (M):</strong> Saves the current session to the global "masterpieces" gene pool.</li>
    <li><strong>DNA Anchor:</strong> Locks a specific donor track from the Heritage database.</li>
  </ul>

  <h3>3. Studio Mixer</h3>
  <table class="w-full border-collapse my-4">
    <tr class="border-b border-primary/20"><th class="text-left p-2">Channel</th><th class="text-left p-2">Role</th></tr>
    <tr><td class="p-2 font-bold">Master (M)</td><td class="p-2">Overall application volume</td></tr>
    <tr><td class="p-2 font-bold">Bass (B)</td><td class="p-2">Groove foundation</td></tr>
    <tr><td class="p-2 font-bold">Lead (MEL)</td><td class="p-2">Main melodic theme</td></tr>
    <tr><td class="p-2 font-bold">Keyb (ACC)</td><td class="p-2">Rhythmic pads</td></tr>
    <tr><td class="p-2 font-bold">Drums (D)</td><td class="p-2">Percussion section</td></tr>
  </table>

  <h3>4. Voice Control (ARP)</h3>
  <p>Tap the Layers icon to adjust the voice limit. <strong>Min: 50</strong> (for quality), <strong>Max: 512</strong> (for high-end systems). We recommend 60-120 for mobile devices.</p>
</div>
`;

export const DISCLAIMER_RU = `
<div class="prose-info">
  <h2>Дисклеймер AuraGroove</h2>
  <p>AuraGroove — это экспериментальный алгоритмический проект.</p>
  
  <h3>1. Технические ограничения</h3>
  <p>Поскольку звук генерируется в реальном времени в браузере, входящие звонки или режим энергосбережения на смартфонах могут прерывать воспроизведение. Это ограничение операционной системы, а не ошибка приложения.</p>

  <h3>2. Конфиденциальность</h3>
  <p>Мы не собираем телеметрию и личные данные. Все ваши настройки (пресеты, маршруты) хранятся исключительно локально на вашем устройстве.</p>

  <h3>3. Использование контента</h3>
  <p>Музыка генерируется на лету и предназначена для личного прослушивания. Любое коммерческое использование требует согласования с разработчиком.</p>
</div>
`;

export const DISCLAIMER_EN = `
<div class="prose-info">
  <h2>AuraGroove Disclaimer</h2>
  <p>AuraGroove is an experimental algorithmic music project.</p>

  <h3>1. Technical Constraints</h3>
  <p>Since audio is generated in real-time within the browser, incoming calls or power-saving modes on smartphones may interrupt playback. This is an OS-level limitation, not an application bug.</p>

  <h3>2. Privacy</h3>
  <p>We do not collect telemetry or personal data. All your settings (presets, routes) are stored exclusively on your local device.</p>

  <h3>3. Content Usage</h3>
  <p>Music is generated on-the-fly for personal listening. Any commercial use requires prior coordination with the developer.</p>
</div>
`;
