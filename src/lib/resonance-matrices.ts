
import type { FractalEvent, Mood, ResonanceContext, Technique } from '@/types/fractal';

// A simple scale to work with for the first matrix
const E_MINOR_SCALE_MIDI_DEGREES = [40, 42, 43, 45, 47, 48, 50]; // MIDI note numbers for E minor scale starting at E2

// === 1. ГАРМОНИЧЕСКИЙ РЕЗОНАНС ===
function harmonicResonance(note: number, mood: Mood, beatPhase: number): number {
  const scale = getScaleForMood(mood);
  const isConsonant = scale.includes(note % 12);
  
  // Акцент на тонике в сильных долях
  const isTonic = (note % 12) === (scale[0] % 12);
  const onStrongBeat = [0, 2].includes(Math.floor(beatPhase) % 4);
  
  if (isTonic && onStrongBeat) return 1.0;
  if (isConsonant) return 0.8;
  return 0.3; // диссонанс разрешается только в слабых долях
}

// === 2. РИТМИЧЕСКИЙ РЕЗОНАНС ===
function rhythmicResonance(
  event: FractalEvent,
  kickTimes: number[],
  snareTimes: number[],
  barDuration: number
): number {
  if (barDuration <= 0) return 0.5; // Avoid division by zero
  const time = event.time;
  const relativeTime = time % barDuration;
  
  // Синхрон с kick (бас и kick на одной доле = высокий резонанс)
  const nearKick = kickTimes.some(t => Math.abs(t - relativeTime) < 0.05);
  if (nearKick && event.type === 'bass') return event.technique === 'pluck' ? 1.0 : 0.7;
  
  // Избегание snare (бас не должен играть на 2 и 4)
  const nearSnare = snareTimes.some(t => Math.abs(t - relativeTime) < 0.05);
  if (nearSnare && event.type === 'bass') return 0.2;
  
  // Ghost notes — только в слабых долях
  if (event.technique === 'ghost') {
    const beat = Math.floor((time / barDuration) * 4) % 4; 
    return [1, 3].includes(beat) ? 0.9 : 0.4;
  }
  
  return 0.8; // Базовый резонанс, если нет конфликтов/совпадений
}

// === 3. ТЕХНИЧЕСКИЙ РЕЗОНАНС ===
function techniqueResonance(technique: Technique, mood: Mood, delta: number): number {
  const techniqueMap: Record<Mood, Record<Technique, number>> = {
    melancholic: { pluck: 1.0, ghost: 0.9, slap: 0.3, harmonic: 0.7, hit: 0.5 },
    epic: { pluck: 0.9, ghost: 0.6, slap: 0.8, harmonic: 0.5, hit: 0.5 },
    dreamy: { pluck: 0.8, ghost: 1.0, slap: 0.2, harmonic: 0.9, hit: 0.5 },
    dark: { pluck: 0.9, ghost: 0.8, slap: 0.7, harmonic: 0.4, hit: 0.5 }
  };
  
  const base = techniqueMap[mood]?.[technique] || 0.5;
  
  if (technique === 'slap' && delta > 0.8) return Math.min(0.7, base + 0.2);
  
  return base;
}

// === 4. ОСНОВНАЯ ФУНКЦИЯ K_ij ===
export function MelancholicMinorK(
  eventA: FractalEvent,
  eventB: FractalEvent,
  context: ResonanceContext
): number {
  // Если оба события - ударные, их резонанс не влияет на общую гармонию (пока)
  if (eventA.type.startsWith('drum_') && eventB.type.startsWith('drum_')) {
      return 1.0;
  }
  
  // Если одно из событий - ударное, а другое - нет, считаем ритмический резонанс
  const isADrum = eventA.type.startsWith('drum_');
  const isBDrum = eventB.type.startsWith('drum_');

  if (isADrum !== isBDrum) {
    const tonalEvent = isADrum ? eventB : eventA;
    return rhythmicResonance(tonalEvent, context.kickTimes, context.snareTimes, context.barDuration);
  }

  // Если оба события тональные (не ударные)
  const harmA = harmonicResonance(eventA.note, context.mood, context.beatPhase);
  const harmB = harmonicResonance(eventB.note, context.mood, context.beatPhase);
  
  const techA = techniqueResonance(eventA.technique, context.mood, context.delta);
  const techB = techniqueResonance(eventB.technique, context.mood, context.delta);
  
  // Взвешенное среднее для тональных инструментов
  return (
    0.6 * Math.min(harmA, harmB) + // Гармония важнее
    0.4 * Math.min(techA, techB)
  );
};

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function getScaleForMood(mood: Mood): number[] {
    const rootNoteOffset = 4; // E
    const scale = mood === 'melancholic' 
        ? [0, 2, 3, 5, 7, 8, 10] // Dorian-like
        : [0, 2, 4, 5, 7, 9, 11]; // Major
    return scale.map(degree => (degree + rootNoteOffset)); // Return absolute MIDI note bases
}
