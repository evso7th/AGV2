# ТЗ: Динамическое Вступление v2.0 ("Изолированный Пролог")

**Статус:** Предложение
**Автор:** AuraGroove AI (на основе анализа и совместных решений)
**Дата:** 2024-10-04

---

## 1. Ретроспектива: Анализ предыдущих неудач (Планы 668-675)

Перед формулированием нового подхода необходимо честно признать, почему предыдущие попытки провалились. Все наши неудачи сводились к двум фундаментальным архитектурным ошибкам:

1.  **Неприкосновенность Ядра:** Мы неоднократно пытались встроить логику интро непосредственно в ядро `FractalMusicEngine`. Это приводило к каскадным сбоям, так как любое изменение в сложной системе с множеством состояний (`веса`, `ветви`, `аксиомы`) нарушало его внутренний баланс. **Вывод:** Ядро движка должно оставаться "черным ящиком", отвечающим только за основную музыкальную эволюцию. Его нельзя "трогать" для решения частных задач.

2.  **Хрупкость "Передачи Управления":** Наша последняя попытка с созданием отдельного генератора интро и "передачей управления" ему от основного движка провалилась из-за сложности синхронизации. `FractalMusicEngine` "засыпал" во время интро, и к моменту "передачи эстафеты" его внутреннее состояние было не готово к созданию музыки. **Вывод:** Сложные механизмы переключения и синхронизации между разными композиторами — это источник нестабильности.

**Главный Урок:** Нам нужно решение, которое **полностью изолировано** от `FractalMusicEngine` и **не требует сложной передачи управления**.

---

## 2. Новая Стратегия: "Интро как Декоратор"

**Принцип:** `FractalMusicEngine` — это единственный источник музыкальной эволюции, и он работает **всегда**, с первого до последнего такта. Однако, в течение первых `N` тактов (период интро) мы "декорируем" его вывод, подменяя сгенерированную им партитуру на партитуру, созданную специальной, **простой и изолированной** функцией-генератором интро.

**Схема работы:**

1.  **На каждом такте (`tick`)** воркер сначала, как и раньше, вызывает `fractalMusicEngine.evolve()`. Это позволяет движку развивать свои внутренние состояния (веса, фразы), даже если мы пока не используем его музыку.
2.  **Затем воркер проверяет:** `if (currentBar < introDuration)`.
3.  **Если `true`:** Он **игнорирует** результат `evolve()` и вместо этого вызывает отдельную, чистую функцию `generateIntroSequence()`. Результат этой функции отправляется на исполнение.
4.  **Если `false`:** Он просто использует результат `evolve()`, как и раньше.

**Преимущества:**
*   **Безопасность:** Ядро `FractalMusicEngine` не модифицируется. Риск регрессии минимален.
*   **Надежность:** Нет сложной "передачи управления". К моменту окончания интро основной движок уже "разогрет" и готов генерировать музыку без пауз.
*   **Гибкость:** Вся логика интро вынесена в одну функцию и управляется декларативно через блюпринт.

---

## 3. Техническое Задание

### 3.1. Модификация Блюпринтов (`src/types/music.ts`)

**Задача:** Расширить "язык" блюпринтов, чтобы они могли декларативно описывать, как должно звучать интро.

1.  **Добавить тип `IntroRules`:**
    ```typescript
    export type IntroRules = {
      /** Список инструментов, которым разрешено играть в интро. */
      allowedInstruments: InstrumentPart[];
      /** Скорость "нарастания" (0.0-1.0), влияет на плотность и динамику. */
      buildUpSpeed: number;
      /** Особые техники, разрешенные только в интро. */
      specialTechniques?: {
        part: InstrumentPart;
        technique: Technique;
      }[];
    };
    ```

2.  **Добавить `introRules` в `BlueprintPart`:**
    ```typescript
    export type BlueprintPart = {
      // ... существующие поля
      /** Правила для генерации вступления, если эта часть является интро. */
      introRules?: IntroRules;
    };
    ```

### 3.2. Модификация Воркера (`src/app/ambient.worker.ts`)

**Задача:** Реализовать логику "декоратора" в главном цикле.

1.  **Изменить `Scheduler.tick()`:**
    ```typescript
    tick() {
        if (!this.isRunning || !fractalMusicEngine) return;

        // ШАГ 1: Основной движок ВСЕГДА работает в фоне.
        const mainEnginePayload = fractalMusicEngine.evolve(this.barDuration, this.barCount);

        let finalPayload: { events: FractalEvent[], instrumentHints: InstrumentHints };

        // ШАГ 2: Проверяем, находимся ли мы в периоде интро.
        if (this.barCount < this.settings.introBars) {
            const introPart = fractalMusicEngine.navigator?.blueprint.structure.parts.find(p => p.id.startsWith('INTRO'));
            
            if (introPart?.introRules) {
                // ШАГ 3А: Если да, подменяем партитуру на сгенерированную "прологом".
                finalPayload = generateIntroSequence(
                    this.barCount,
                    introPart.introRules,
                    fractalMusicEngine.getGhostHarmony(), // Безопасно получаем гармонию
                    this.settings,
                    (fractalMusicEngine as any).random // Передаем тот же генератор случайных чисел
                );
            } else {
                // Если правил интро нет, просто играем то, что сгенерировал основной движок.
                finalPayload = mainEnginePayload;
            }
        } else {
            // ШАГ 3Б: Интро закончилось, используем основную партитуру.
            finalPayload = mainEnginePayload;
        }

        // ШАГ 4: Отправляем итоговую партитуру на исполнение.
        // ... (существующий код postMessage)
    }
    ```

### 3.3. Создание Генератора Интро (`src/lib/music-theory.ts`)

**Задача:** Создать изолированную, предсказуемую функцию для генерации музыки вступления.

1.  **Создать функцию `generateIntroSequence`:**
    ```typescript
    import type { IntroRules, GhostChord, WorkerSettings, FractalEvent, InstrumentHints } from '@/types/music';

    /**
     * Генерирует музыкальную партитуру для одного такта вступления.
     * @param currentBar - Текущий номер такта.
     * @param introRules - Правила вступления из блюпринта.
     * @param harmonyTrack - Полный гармонический "скелет" сюиты.
     * @param settings - Общие настройки (темп, настроение).
     * @param random - Генератор случайных чисел.
     * @returns - Готовая партитура для одного такта.
     */
    export function generateIntroSequence(
      currentBar: number,
      introRules: IntroRules,
      harmonyTrack: GhostChord[],
      settings: WorkerSettings,
      random: { next: () => number, nextInt: (max: number) => number }
    ): { events: FractalEvent[], instrumentHints: InstrumentHints } {
      
      const events: FractalEvent[] = [];
      const instrumentHints: InstrumentHints = {};
      
      // Найти текущий аккорд
      const currentChord = harmonyTrack.find(c => currentBar >= c.bar && currentBar < c.bar + c.durationBars);
      if (!currentChord) return { events, instrumentHints };

      const activeLayers = new Set(introRules.allowedInstruments);

      // --- Простая, предсказуемая логика генерации ---

      // 1. БАС: Если разрешен, играет только корневую ноту аккорда.
      if (activeLayers.has('bass')) {
        events.push(createAmbientBassAxiom(currentChord, settings.mood, settings.genre, random, settings.tempo, 'drone')[0]);
      }

      // 2. АККОМПАНЕМЕНТ: Если разрешен, играет простой пэд.
      if (activeLayers.has('accompaniment')) {
        events.push(...createAccompanimentAxiom(currentChord, settings.mood, settings.genre, random, settings.tempo, 'low'));
      }
      
      // 3. УДАРНЫЕ: Если разрешены, играют очень простой, редкий бит.
      if (activeLayers.has('drums')) {
         // ... (логика для редкого кика или хэта)
      }

      return { events, instrumentHints };
    }
    ```

---

## 4. План Внедрения

1.  **Шаг 1 (Безопасность):** Внести изменения в `src/types/music.ts`, добавив `IntroRules`. Это не сломает существующий код.
2.  **Шаг 2 (Изоляция):** Создать функцию `generateIntroSequence` в `src/lib/music-theory.ts` и тщательно ее протестировать отдельно.
3.  **Шаг 3 (Интеграция):** Внести изменения в `ambient.worker.ts`, реализовав логику "декоратора".
4.  **Шаг 4 (Тестирование):** Запустить приложение с блюпринтом, в котором есть `introRules`, и убедиться, что:
    *   Интро проигрывается корректно.
    *   Переход к основной части происходит плавно и без тишины.
    *   Приложение не падает, если у блюпринта нет `introRules`.

Этот подход минимизирует риски и обеспечивает, что ядро движка останется нетронутым и стабильным, а вся новая логика будет изолирована и легко управляема.