
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules, InstrumentBehaviorRules, BluesMelody, InstrumentPart, DrumKit, BluesGuitarRiff, BluesSoloPhrase, BluesRiffDegree, SuiteDNA, RhythmicFeel, BassStyle, DrumStyle, HarmonicCenter } from './fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { BlueprintNavigator, type NavigationInfo } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { V2_PRESETS } from './presets-v2';

// --- МУЗЫКАЛЬНЫЕ АССЕТЫ (БАЗА ЗНАНИЙ) ---
import { PARANOID_STYLE_RIFF } from './assets/rock-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { NEUTRAL_BLUES_BASS_RIFFS } from './assets/neutral-blues-riffs';
import { BLUES_GUITAR_RIFFS, BLUES_GUITAR_VOICINGS } from './assets/blues-guitar-riffs';
import { BLUES_MELODY_RIFFS } from './assets/blues-melody-riffs';
import { BLUES_SOLO_LICKS, BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { DRUM_KITS } from './assets/drum-kits';


export const DEGREE_TO_SEMITONE: Record<string, number> = {
    'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7,
    'b6': 8, '6': 9, 'b7': 10, '7': 11, 'R+8': 12, '9': 14, '11': 17
};

export function getScaleForMood(mood: Mood, genre?: Genre, chordType?: 'major' | 'minor' | 'dominant' | 'diminished'): number[] {
  const E1 = 28;
  let baseScale: number[];

  if (genre === 'blues') {
      if (chordType === 'major' || chordType === 'dominant') {
          // Major Blues Scale: 1, 2, b3, 3, 5, 6
          baseScale = [0, 2, 3, 4, 7, 9];
      } else { // minor, diminished, or not specified
          // Minor Blues Scale: 1, b3, 4, b5, 5, b7
          baseScale = [0, 3, 5, 6, 7, 10];
      }
  } else {
      // Existing ambient/trance logic
      switch (mood) {
        case 'joyful':      
          baseScale = [0, 2, 4, 5, 7, 9, 11];
          break;
        case 'epic':        
        case 'enthusiastic':
          baseScale = [0, 2, 4, 6, 7, 9, 11];
          break;
        case 'dreamy':      
          baseScale = [0, 2, 4, 7, 9];
          break;
        case 'contemplative': 
        case 'calm':
            baseScale = [0, 2, 4, 5, 7, 9, 10];
            break;
        case 'melancholic': 
          baseScale = [0, 2, 3, 5, 7, 9, 10];
          break;
        case 'dark':        
        case 'gloomy':
          baseScale = [0, 2, 3, 5, 7, 8, 10];
          break;
        case 'anxious':     
          baseScale = [0, 1, 3, 5, 6, 8, 10];
          break;
        default:            
          baseScale = [0, 2, 3, 5, 7, 8, 10];
          break;
      }
  }

  const fullScale: number[] = [];
  for (let octave = 0; octave < 3; octave++) {
      for (const note of baseScale) {
          fullScale.push(E1 + (octave * 12) + note);
      }
  }
  fullScale.push(E1 + 36);

  return fullScale;
}

// Helper to convert MIDI to a readable chord name
const midiToChordName = (rootNote: number, chordType: 'major' | 'minor' | 'diminished' | 'dominant'): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootName = noteNames[rootNote % 12];
    switch (chordType) {
        case 'minor': return `${rootName}m`;
        case 'diminished': return `${rootName}dim`;
        case 'dominant': return `${rootName}7`;
        case 'major':
        default:
            return rootName;
    }
};


export function generateSuiteDNA(totalBars: number, mood: Mood, seed: number, random: { next: () => number, nextInt: (max: number) => number; shuffle: <T>(array: T[]) => T[]; }, genre: Genre, blueprintParts: BlueprintPart[]): SuiteDNA {
    console.log(`[DNA] Generating Suite DNA for genre: ${genre}, mood: ${mood}`);

    const harmonyTrack: GhostChord[] = [];
    const key = getScaleForMood(mood, genre)[0];
    
    let accumulatedBars = 0;
    const totalPercent = blueprintParts.reduce((sum, part) => sum + part.duration.percent, 0);

    if (totalPercent <= 0) {
        console.error("[DNA] Blueprint parts have a total percentage of 0. Cannot generate harmony.");
        harmonyTrack.push({ rootNote: key, chordType: 'minor', bar: 0, durationBars: totalBars });
    } else {
        blueprintParts.forEach((part, index) => {
            const isLastPart = index === blueprintParts.length - 1;
            let partDuration: number;

            if (isLastPart) {
                partDuration = totalBars - accumulatedBars;
            } else {
                const proportion = part.duration.percent / totalPercent;
                partDuration = Math.round(proportion * totalBars);
            }
            
            const partStartBar = accumulatedBars;
            
            if (partDuration <= 0) return;

            if (genre === 'blues') {
                const progressionMap = {
                    i:  [{ to: 'iv', w: 0.6 }, { to: 'v', w: 0.2 }, { to: 'bVI', w: 0.2 }],
                    iv: [{ to: 'i', w: 0.7 }, { to: 'v', w: 0.3 }],
                    v:  [{ to: 'i', w: 0.8 }, { to: 'iv', w: 0.2 }],
                    bVI: [{ to: 'v', w: 0.9 }, { to: 'iv', w: 0.1 }],
                };
                const degreeMap: Record<string, {rootOffset: number, type: GhostChord['chordType']}> = {
                    'i': { rootOffset: 0, type: 'minor' },
                    'iv': { rootOffset: 5, type: 'minor' },
                    'v': { rootOffset: 7, type: 'dominant' },
                    'bVI': { rootOffset: 8, type: 'major' },
                };
                
                let currentDegree = 'i';
                let currentBarInPart = 0;
                while (currentBarInPart < partDuration) {
                    const durationOptions = [{d: 4, w: 0.6}, {d: 2, w: 0.3}, {d: 8, w: 0.1}];
                    const totalDurWeight = durationOptions.reduce((s, o) => s + o.w, 0);
                    let rDur = random.next() * totalDurWeight;
                    let duration = 4;
                    for(const opt of durationOptions) {
                        rDur -= opt.w;
                        if(rDur <= 0) { duration = opt.d; break; }
                    }

                    const finalDuration = Math.min(duration, partDuration - currentBarInPart);
                    const chordInfo = degreeMap[currentDegree];
                    harmonyTrack.push({
                        rootNote: key + chordInfo.rootOffset,
                        chordType: chordInfo.type,
                        bar: partStartBar + currentBarInPart,
                        durationBars: finalDuration
                    });
                    currentBarInPart += finalDuration;

                    const transitions = progressionMap[currentDegree as keyof typeof progressionMap];
                    const totalWeight = transitions.reduce((s, t) => s + t.w, 0);
                    let r = random.next() * totalWeight;
                    for (const transition of transitions) {
                        r -= transition.w;
                        if (r <= 0) {
                            currentDegree = transition.to;
                            break;
                        }
                    }
                }
            } else { // Ambient, Trance, etc.
                 let currentBarInPart = 0;
                 while(currentBarInPart < partDuration) {
                    const duration = [4, 8, 4, 2, 4][random.nextInt(5)];
                    const finalDuration = Math.min(duration, partDuration - currentBarInPart);
                    const chordRoot = key + [0, 5, 7, -5, 4, 2, -7][random.nextInt(7)];
                    harmonyTrack.push({ rootNote: chordRoot, chordType: random.next() > 0.5 ? 'major' : 'minor', bar: partStartBar + currentBarInPart, durationBars: finalDuration });
                    currentBarInPart += finalDuration;
                 }
            }
            accumulatedBars += partDuration;
        });

        let lastBar = harmonyTrack.reduce((max, c) => Math.max(max, c.bar + c.durationBars), 0);
        if (lastBar < totalBars) {
            const lastChord = harmonyTrack[harmonyTrack.length - 1];
            if (lastChord) {
                lastChord.durationBars += (totalBars - lastBar);
            } else {
                 harmonyTrack.push({ rootNote: key, chordType: 'minor', bar: 0, durationBars: totalBars });
            }
        }
    }

    const possibleTempos = {
        joyful: [76, 90], enthusiastic: [82, 98], contemplative: [68, 76],
        dreamy: [64, 72], calm: [60, 70], melancholic: [60, 68],
        gloomy: [62, 70], dark: [60, 68], epic: [70, 80], anxious: [78, 92],
    };

    const [minTempo, maxTempo] = possibleTempos[mood] || [60, 80];
    const baseTempo = minTempo + random.nextInt(maxTempo - minTempo + 1);

    const rhythmicFeel: RhythmicFeel = random.next() < 0.7 ? 'shuffle' : 'straight';
    const bassStyles: BassStyle[] = ['boogie', 'walking', 'pedal'];
    const bassStyle = bassStyles[random.nextInt(bassStyles.length)];
    const drumStyles: DrumStyle[] = ['heavy_backbeat', 'light_brushes', 'shuffle_A', 'shuffle_B'];
    const drumStyle = drumStyles[random.nextInt(drumStyles.length)];

    const soloPlanMap = new Map<string, string>();
    const allPlanIds = Object.keys(BLUES_SOLO_PLANS);
    const shuffledPlanIds = random.shuffle(allPlanIds);
    let planIndex = 0;
    
    blueprintParts.forEach(part => {
        if (part.instrumentRules?.melody?.source === 'blues_solo') {
            const assignedPlan = shuffledPlanIds[planIndex % shuffledPlanIds.length];
            soloPlanMap.set(part.id, assignedPlan);
            planIndex++;
        }
    });

    console.log(`[DNA] Generated: Tempo=${baseTempo}, Feel=${rhythmicFeel}, Bass=${bassStyle}, Drums=${drumStyle}`);
    console.log(`[DNA] Solo plan map created for ${soloPlanMap.size} parts.`);
    soloPlanMap.forEach((plan, partId) => console.log(`  - Part '${partId}' -> Solo Plan '${plan}'`));
    
    // --- FORMATTED TABLE LOG ---
    console.log(`\n--- [DNA] Harmony Skeleton (root notes) ---`);
    harmonyTrack.forEach(chord => {
        console.log(chord.rootNote);
    });
    console.log(`--- End of Skeleton ---\n`);

    return { harmonyTrack, baseTempo, rhythmicFeel, bassStyle, drumStyle, soloPlanMap };
}

export function createDrumAxiom(kit: DrumKit, genre: Genre, mood: Mood, tempo: number, random: { next: () => number, nextInt: (max: number) => number }, rules?: InstrumentBehaviorRules): { events: FractalEvent[], log: string } {
    const events: FractalEvent[] = [];
    let log = '[DrumAudit] 3. Generation Result: ';
    
    const drumRiffsForMood = BLUES_DRUM_RIFFS[mood] ?? BLUES_DRUM_RIFFS['contemplative'] ?? [];
    if (drumRiffsForMood.length === 0) return {events, log: "No drum riffs for mood."};

    const riff = drumRiffsForMood[random.nextInt(drumRiffsForMood.length)];

    const createEvents = (pattern: number[] | undefined, type: keyof DrumKit) => {
        if (pattern && kit[type] && kit[type]!.length > 0) {
            const sample = kit[type]![random.nextInt(kit[type]!.length)];
            pattern.forEach(tick => {
                events.push({ type: sample, time: tick / 3, duration: 0.25, weight: 0.8, technique: 'hit', dynamics: 'f', phrasing: 'staccato', params: {} });
            });
            return `${type}(${kit[type]!.length}) `;
        }
        return '';
    };

    log += createEvents(riff.K, 'kick');
    log += createEvents(riff.SD, 'snare');
    log += createEvents(riff.HH, 'hihat');
    log += createEvents(riff.OH, 'hihat');
    log += createEvents(riff.R, 'ride');
    log += createEvents(riff.T, 'perc');
    log += createEvents(riff.ghostSD, 'snare');
    
    return { events, log };
}

export function createHarmonyAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number; nextInt: (max: number) => number; }, epoch: number): FractalEvent[] {
    const axiom: FractalEvent[] = [];
    const chordName = midiToChordName(chord.rootNote, chord.chordType);
    
    console.log(`[HarmonyAudit] [Create] Bar: ${epoch} - Generating 1 harmony event for chord: ${chordName}`);

    axiom.push({
        type: 'harmony',
        note: chord.rootNote, 
        duration: 4.0,       
        time: 0,             
        weight: 0.7,
        technique: 'choral',
        dynamics: 'mf',
        phrasing: 'legato',
        params: { barCount: epoch },
        chordName: chordName
    });

    return axiom;
}

export function createAmbientBassAxiom(
  chord: GhostChord,
  mood: Mood,
  genre: Genre,
  random: { next: () => number; nextInt: (max: number) => number; },
  tempo: number,
  technique: Technique
): FractalEvent[] {
  const axiom: FractalEvent[] = [];
  const rootNote = chord.rootNote;

  // Simple drone for ambient
  axiom.push({
    type: 'bass',
    note: rootNote - 12, // One octave lower
    duration: 4.0, // Whole note
    time: 0,
    weight: 0.75,
    technique: 'drone',
    dynamics: 'p',
    phrasing: 'legato',
    params: {
      attack: 1.5,
      release: 3.0,
      cutoff: 200,
      resonance: 0.8,
      distortion: 0.05,
      portamento: 0.1
    }
  });

  return axiom;
}

// These functions are exported so they can be used in other modules if necessary.
// However, the primary composition logic resides within the FractalMusicEngine class itself.
export { createAmbientMelodyMotif, mutateBassPhrase, createBassFill, createDrumFill, chooseHarmonyInstrument, mutateBluesAccompaniment, mutateBluesMelody, createBluesOrganLick, generateIntroSequence };


// Stubs for functions that might have been moved but are still exported, to avoid breaking builds.
function createAmbientMelodyMotif(chord: GhostChord, mood: Mood, random: { next: () => number; nextInt: (max: number) => number; }, previousMotif?: FractalEvent[], registerHint?: 'low' | 'mid' | 'high', genre?: Genre): FractalEvent[] { return []; }
function mutateBassPhrase(phrase: FractalEvent[], chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number; nextInt: (max: number) => number; }): FractalEvent[] { return []; }
function createBassFill(chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number; nextInt: (max: number) => number; }): { events: FractalEvent[]; duration: number } { return { events: [], duration: 0 }; }
function createDrumFill(random: { next: () => number; nextInt: (max: number) => number; }, params: any): FractalEvent[] { return []; }
function chooseHarmonyInstrument(part: BlueprintPart, useMelodyV2: boolean, random: { next: () => number }): 'piano' | 'guitarChords' | 'violin' | 'flute' | 'none' { return 'piano'; }
function mutateBluesAccompaniment(phrase: FractalEvent[], chord: GhostChord, random: { next: () => number; nextInt: (max: number) => number; }): FractalEvent[] { return []; }
function mutateBluesMelody(phrase: BluesSoloPhrase, chord: GhostChord, random: { next: () => number; nextInt: (max: number) => number; }): BluesSoloPhrase { return []; }
function createBluesOrganLick(chord: GhostChord, random: { next: () => number; nextInt: (max: number) => number; }): FractalEvent[] { return []; }
function generateIntroSequence(currentBar: number, introRules: any, harmonyTrack: GhostChord[], settings: any, random: any): { events: FractalEvent[], instrumentHints: InstrumentHints } { return { events: [], instrumentHints: {} }; }

// --- MELODY MUTATION FUNCTIONS (PLAN 1712) ---

/**
 * Transposes a melody by a given interval in semitones.
 */
export function transposeMelody(phrase: BluesSoloPhrase, interval: number): BluesSoloPhrase {
    if (!phrase) return [];
    return phrase.map(note => ({
        ...note,
        note: (note.note || 0) + interval
    }));
}

/**
 * Inverts a melody around its first note.
 */
export function invertMelody(phrase: BluesSoloPhrase): BluesSoloPhrase {
    if (!phrase || phrase.length === 0) return [];
    const firstNote = phrase[0].note || 60;
    return phrase.map(note => ({
        ...note,
        note: firstNote - ((note.note || 60) - firstNote)
    }));
}

/**
 * Varies the rhythm of a melody slightly.
 */
export function varyRhythm(phrase: BluesSoloPhrase, random: { next: () => number }): BluesSoloPhrase {
    const newPhrase: BluesSoloPhrase = JSON.parse(JSON.stringify(phrase));
    if (newPhrase.length < 2) return newPhrase;

    // 50% chance to modify rhythm
    if (random.next() < 0.5) {
        const i = Math.floor(random.next() * (newPhrase.length - 1));
        const note1 = newPhrase[i];
        const note2 = newPhrase[i + 1];

        // Try to merge two short notes into one longer one
        if (note1.d < 4 && note2.d < 4) {
            note1.d += note2.d;
            newPhrase.splice(i + 1, 1);
        }
        // Or split a long note into two shorter ones
        else if (note1.d > 3) {
            const splitPoint = Math.floor(note1.d / 2);
            note1.d = splitPoint;
            newPhrase.splice(i + 1, 0, {
                ...note1,
                t: note1.t + splitPoint,
                d: note1.d - splitPoint,
                // deg must be present, copy from note1
                deg: note1.deg,
            });
        }
    }
    return newPhrase;
}

/**
 * Adds simple ornaments (grace notes) to a melody.
 */
export function addOrnaments(phrase: BluesSoloPhrase, random: { next: () => number }): BluesSoloPhrase {
    if (!phrase) return [];
    return phrase.map(note => {
        // 20% chance to add a grace note before the main note
        if (random.next() < 0.2) {
            const graceNote: BluesSoloPhrase[0] = {
                t: note.t,
                d: 1, // very short
                deg: note.deg, // This should be calculated or derived if needed, for now just copy
                tech: 'gr' // grace note technique
            };
            note.t += 1; // Shift original note
            if (note.d > 1) note.d -= 1;
            return [graceNote, note];
        }
        return [note];
    }).flat();
}
