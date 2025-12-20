

import type { MusicBlueprint, TensionProfile, HarmonicCenter } from '@/types/music';

export const MelancholicAmbientBlueprint: MusicBlueprint = {
  // ============================================================================
  // МЕТАДАННЫЕ
  // ============================================================================
  
  id: 'melancholic_ambient',
  name: 'Melancholic Drift',
  description: 'Задумчивый, интроспективный ambient с плавными гармоническими переходами',
  
  mood: 'melancholic',
  
  // ============================================================================
  // ГЛОБАЛЬНЫЕ МУЗЫКАЛЬНЫЕ ПАРАМЕТРЫ
  // ============================================================================
  
  musical: {
    key: {
      root: 'D',
      scale: 'dorian', // D E F G A B C — мягкий минор с натуральной секстой
      octave: 3        // D3 как опорная точка
    },
    
    bpm: {
      base: 52,
      range: [48, 56],    // Допустимый диапазон (может варьироваться)
      modifier: 0.95      // Из MoodProfile (чуть медленнее нейтрального)
    },
    
    timeSignature: {
      numerator: 4,
      denominator: 4
    },
    
    // Гармоническая траектория всей сюиты (крупный план)
    harmonicJourney: [
      {
        partIndex: 0,           // INTRO
        center: 'Dm7',          // Тоника (D F A C)
        satellites: ['Gm7', 'Am7'], // Разрешённые "соседи"
        weight: 0.8             // 80% времени на Dm7
      },
      {
        partIndex: 1,           // BUILD
        center: 'Gm7',          // Субдоминанта (G Bb D F)
        satellites: ['Dm7', 'Cmaj7'],
        weight: 0.6             // Больше движения
      },
      {
        partIndex: 2,           // MAIN
        center: 'Am7',          // Доминанта (A C E G)
        satellites: ['Dm7', 'Fmaj7', 'Em7b5'],
        weight: 0.5             // Максимальная свобода
      },
      {
        partIndex: 3,           // RELEASE
        center: 'Fmaj7',        // bIII (F A C E) — лирический аккорд
        satellites: ['Dm7', 'Gm7'],
        weight: 0.7
      },
      {
        partIndex: 4,           // OUTRO
        center: 'Dm7',          // Возврат к тонике
        satellites: [],         // Только тоника (статика)
        weight: 1.0
      }
    ] as HarmonicCenter[],
    
    // Масштабная динамическая кривая (tension)
    tensionProfile: {
      type: 'arc',              // Классическая дуга
      peakPosition: 0.58,       // Пик на 58% длины сюиты
      curve: (progress: number, peakPos: number): number => {
        if (progress < peakPos) {
          // Рост: медленный старт, ускорение к пику
          return Math.pow(progress / peakPos, 1.3);
        } else {
          // Спад: плавное затухание
          return Math.pow((1 - progress) / (1 - peakPos), 1.8);
        }
      }
    } as TensionProfile
  },
  
  // ============================================================================
  // СТРУКТУРА СЮИТЫ (иерархия)
  // ============================================================================
  
  structure: {
    totalDuration: {
      bars: { min: 220, max: 280 }, // @ 52 BPM = 11-14 минут
      preferredBars: 250            // Целевое значение
    },
    
    parts: [
      // ========================================================================
      // ЧАСТЬ 1: INTRO (Пробуждение)
      // ========================================================================
      {
        id: 'INTRO',
        name: 'Awakening',
        
        duration: {
          bars: { min: 24, max: 32 },
          bundles: { min: 2, max: 3 }  // 2-3 бандла
        },
        
        // Слои (какие инструменты активны)
        layers: {
          bass: true,
          pad: true,
          arpeggio: false,      // Входит в середине INTRO
          melody: false,
          sparkles: false,      // Только с BUILD
          sfx: false,
          drums: false
        },
        
        // Расписание входа инструментов (в процентах от длины части)
        instrumentEntry: {
          bass: 0.0,            // Сразу
          pad: 0.25,            // 25% INTRO (если INTRO = 28 тактов → такт 7)
          arpeggio: 0.65,       // 65% INTRO
        },
        
        // Правила для каждого инструмента
        instrumentRules: {
          bass: {
            techniques: [
              { value: 'pedal', weight: 0.8 },      // 80% — долгие педали
              { value: 'drone', weight: 0.2 }       // 20% — суб-бас дрон
            ],
            register: {
              preferred: 'low',   // D1-G2
              range: { min: 26, max: 43 } // MIDI (D1 = 26, G2 = 43)
            },
            density: { min: 0.25, max: 0.4 }, // Редко (25-40% заполненности)
            velocity: { min: 50, max: 70 },
          },
          
          pad: {
            techniques: [
              { value: 'swell', weight: 0.6 },      // Медленные нарастания
              { value: 'sustained', weight: 0.4 }   // Статичные аккорды
            ],
            register: {
              preferred: 'mid',
              range: { min: 48, max: 72 } // C3-C5
            },
            density: { min: 0.6, max: 0.8 }, // Более плотно, чем бас
            velocity: { min: 40, max: 60 },
          },
          
          arpeggio: {
            techniques: [
              { value: 'slow_ascend', weight: 0.5 },
              { value: 'slow_descend', weight: 0.3 },
              { value: 'random_sparse', weight: 0.2 }
            ],
            register: {
              preferred: 'mid-high',
              range: { min: 60, max: 84 } // C4-C6
            },
            density: { min: 0.3, max: 0.5 },
            velocity: { min: 35, max: 55 }, // Тише остальных
          }
        },
        
        // Бандлы (подразделы части)
        bundles: [
          {
            id: 'INTRO_BUNDLE_1',
            name: 'Emergence',
            duration: { min: 12, max: 16 }, // тактов
            
            characteristics: {
              harmonicMovement: 'static',     // Почти без движения
              densityBias: -0.1,              // На 10% разреженнее базовой
              filterCutoff: { min: 0.4, max: 0.6 }, // 40-60% от макс. (приглушено)
              reverbWet: 0.5
            },
            
            phrases: {
              count: { min: 3, max: 4 },      // 3-4 фразы по 4 такта
              length: { min: 4, max: 4 }      // Все фразы по 4 такта (симметрия)
            }
          },
          
          {
            id: 'INTRO_BUNDLE_2',
            name: 'Unfolding',
            duration: { min: 12, max: 16 },
            
            characteristics: {
              harmonicMovement: 'slight',     // Лёгкое движение (Dm7 → Gm7)
              densityBias: 0.0,
              filterCutoff: { min: 0.5, max: 0.7 }, // Приоткрывается
              reverbWet: 0.55
            },
            
            phrases: {
              count: { min: 3, max: 4 },
              length: { min: 4, max: 4 }
            }
          }
        ],
        
        outroFill: {
          type: 'filter_sweep',
          duration: 2,            // такта
          parameters: {
            filterStart: 0.6,     // 60% cutoff
            filterEnd: 0.95,      // 95% cutoff (открывается)
            curve: 'exponential'  // Ускорение к концу
          }
        }
      },
      
      // ... (other parts will be added later)
    ]
  },
  
  mutations: {
    onBundleBoundary: {
      probability: 0.4,
      types: [
        { type: 'transpose', weight: 0.6, params: { semitones: [-2, 2, -5, 5] } },
        { type: 'rhythmic_shift', weight: 0.3, params: { shift: [0.125, 0.25] } },
        { type: 'velocity_curve', weight: 0.1, params: { curve: ['crescendo', 'diminuendo'] } }
      ]
    },
    onPartBoundary: {
      probability: 0.75,
      types: [
        { type: 'inversion', weight: 0.3, params: {} },
        { type: 'register_shift', weight: 0.3, params: { octaves: [-1, 1] } },
        { type: 'voicing_change', weight: 0.2, params: { voicing: ['drop2', 'drop3', 'quartal'] } },
      ]
    },
    onSuiteBoundary: {
      regenerateAxioms: true,
      varyHarmonicCenter: {
        enabled: true,
        allowedRoots: ['D', 'A', 'G'],
        allowedScales: ['dorian', 'aeolian']
      },
      reshuffleLayering: false
    }
  },
  
  ambientEvents: [],
  continuity: {},
  rendering: {}
};
