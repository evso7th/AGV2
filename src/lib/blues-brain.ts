
/**
 * @fileOverview Blues Brain V79.0 — "Log Integrity & Harmony Fallback".
 * #ЗАЧЕМ: Исправление отображения статуса Drums/Piano и добавление гитарной гармонии.
 * #ЧТО: 1. Добавлена генерация Harmony при отсутствии ДНК. 2. Исправлен activeAxioms объект.
 */

import {
  FractalEvent,
  GhostChord,
  InstrumentHints,
  Mood,
  SuiteDNA,
  NavigationInfo,
  BluesCognitiveState,
  CommonMood,
  InstrumentPart,
  Technique,
  Dynamics,
  Phrasing
} from '@/types/music';
import {
    DEGREE_TO_SEMITONE,
    decompressCompactPhrase,
    calculateMusiNum,
    normalizeStr,
    repairLegacyPhrase,
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter,
    mergeIdenticalNotes,
    keyToMidiRoot,
    resolveSemanticTimbre,
    TICKS_PER_BAR,
    TICK_TO_BEAT
} from './music-theory';

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

export class BluesBrain {
  private config: any;
  private seed: number;
  private mood: Mood;
  private random: any;

  private currentAxiom: any[] = [];
  private currentAxiomMaxTick: number = 0;
  private currentBassAxiom: any[] = [];
  private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
  
  private currentLickId: string = '';
  private currentTrackName: string = 'Algorithmic';
  private sessionAnchorId: string | null = null; 
  private currentNativeRoot: number | null = null;
  private currentPreferredInstrument: string | null = null;

  private soloistBusyUntilBar: number = -1;
  private readonly MELODY_CEILING = 72;

  constructor(seed: number, mood: Mood, history: string[], axioms: any[], selectedIds: string[], anchorId: string | null, genre: string, useH: boolean) {
    this.seed = seed; this.mood = mood;
    this.random = this.createSeededRandom(seed);
    this.config = { cloudAxioms: axioms, selectedCompositionIds: selectedIds, activeAnchorId: anchorId, useHeritage: useH, isImprovising: !selectedIds?.length };
  }

  private createSeededRandom(seed: number) {
    let state = seed;
    const next = () => { state = (state * 1664525 + 1013904223) % Math.pow(2, 32); return state / Math.pow(2, 32); };
    return { next, nextInt: (max: number) => Math.floor(next() * max) };
  }

  public updateCloudAxioms(axioms: any[], selectedIds?: string[], anchorId?: string | null, root?: any, useH?: boolean, isImpro?: boolean) {
      this.config.cloudAxioms = axioms;
      if (selectedIds !== undefined) this.config.selectedCompositionIds = selectedIds;
      if (anchorId !== undefined) this.config.activeAnchorId = anchorId;
      if (useH !== undefined) this.config.useHeritage = useH;
      if (isImpro !== undefined) this.config.isImprovising = isImpro;
      this.soloistBusyUntilBar = -1;
  }

  private selectNextAxiom(epoch: number): number | undefined {
      if (!this.config.useHeritage || !this.config.cloudAxioms?.length) {
          this.currentTrackName = 'Generative';
          return undefined;
      }

      const poolToUse = this.config.cloudAxioms.filter((ax: any) => ax.ignored !== true);
      let effectiveAnchor = this.config.activeAnchorId ? normalizeStr(this.config.activeAnchorId) : this.sessionAnchorId;
      
      let filteredPool: any[] = [];
      if (effectiveAnchor) {
          filteredPool = poolToUse.filter((ax: any) => normalizeStr(ax.compositionId) === effectiveAnchor);
      } else {
          const commonMoodFilter = MOOD_TO_COMMON[this.mood] || 'neutral';
          filteredPool = poolToUse.filter((ax: any) => {
              const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
              const axMoods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
              return axGenres.includes('blues') && (axMoods.includes(this.mood) || (Array.isArray(ax.commonMood) ? ax.commonMood.includes(commonMoodFilter) : ax.commonMood === commonMoodFilter));
          });
      }

      if (filteredPool.length > 0) {
          let basePool = filteredPool.filter(ax => ax.role === 'melody');
          if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role.toLowerCase().includes('accomp'));

          if (basePool.length > 0) {
              const maxDonorBars = Math.max(...basePool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
              const suitePlayhead = epoch % (maxDonorBars || 144);
              
              let selected: any = null;
              if (this.config.isImprovising && !this.config.activeAnchorId) {
                  selected = basePool[calculateMusiNum(this.seed, 17, epoch, basePool.length)];
              } else {
                  const sameOffsetPool = basePool.filter(ax => (ax.barOffset || 0) === (suitePlayhead % (maxDonorBars || 1)));
                  selected = sameOffsetPool.length > 0 ? sameOffsetPool[0] : basePool[0];
              }

              if (selected) {
                  this.currentTrackName = selected.compositionId;
                  this.currentLickId = selected.id;
                  this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                  this.currentPreferredInstrument = selected.preferredInstrument || null;
                  
                  this.currentAxiom = mergeIdenticalNotes(decompressCompactPhrase(selected.phrase));
                  const cid = normalizeStr(selected.compositionId);
                  const bassSibling = poolToUse.find((ax: any) => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                  this.currentBassAxiom = bassSibling ? decompressCompactPhrase(bassSibling.phrase) : [];

                  const accompSiblings = poolToUse.filter((ax: any) => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano') || ax.role.toLowerCase().includes('harmony')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                  this.currentAccompAxioms = accompSiblings.map((ax: any) => ({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument }));

                  this.currentAxiomMaxTick = (selected.bars || 4) * TICKS_PER_BAR;
                  this.soloistBusyUntilBar = epoch + (selected.bars || 4);
                  return selected.nativeBpm || undefined;
              }
          }
      }
      
      this.currentTrackName = 'Generative';
      this.currentLickId = 'none';
      this.soloistBusyUntilBar = epoch + 4;
      return undefined;
  }

  private renderGenerativeHarmony(chord: GhostChord, tension: number): FractalEvent[] {
      const intervals = chord.chordType === 'minor' ? [0, 3, 7] : [0, 4, 7];
      const events: FractalEvent[] = [];
      // Редкие удары на 1-ю и 3-ю доли
      [0, 6].forEach(t => {
          if (this.random.next() < 0.6) {
              intervals.forEach(interval => {
                  events.push({
                      type: 'harmony', note: chord.rootNote + 12 + interval,
                      time: t * TICK_TO_BEAT, duration: 2.0 * TICK_TO_BEAT,
                      weight: 0.5 + (tension * 0.1), technique: 'swell',
                      dynamics: 'p', phrasing: 'legato', chordName: chord.chordType === 'minor' ? 'Am' : 'A'
                  });
              });
          }
      });
      return events;
  }

  private renderVirtuosoPiano(chord: GhostChord, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const intervals = chord.chordType === 'minor' ? [0, 3, 7] : [0, 4, 7];
      [1.5, 4.5, 7.5, 10.5].forEach(t => {
          if (this.random.next() < 0.4) {
              const note = chord.rootNote + 12 + intervals[this.random.nextInt(intervals.length)];
              events.push({
                  type: 'pianoAccompaniment', note: note, time: t * TICK_TO_BEAT, duration: 1.0 * TICK_TO_BEAT,
                  weight: 0.35, technique: 'hit', dynamics: 'p', phrasing: 'staccato'
              });
          }
      });
      return events;
  }

  public generateBar(epoch: number, currentChord: GhostChord, navInfo: NavigationInfo, dna: SuiteDNA, hints: InstrumentHints) {
    const tension = dna.tensionMap?.[epoch] ?? 0.5;
    const events: FractalEvent[] = [];
    
    let newBpm: number | undefined;
    if (epoch >= this.soloistBusyUntilBar) newBpm = this.selectNextAxiom(epoch);

    const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
    const resChord = { ...currentChord, rootNote: resRoot };
    const instrumentOverrides: Partial<InstrumentHints> = {};

    // 1. DRUMS
    if (hints.drums) events.push(...this.renderStandardDrums(epoch, tension));

    // 2. BASS
    if (hints.bass) {
        if (this.currentBassAxiom.length > 0) {
            const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
            const barOffset = (epoch % totalBars) * TICKS_PER_BAR;
            this.currentBassAxiom.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).forEach(n => {
                events.push({ type: 'bass', note: 31 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.8, technique: 'pick', dynamics: 'p', phrasing: 'legato' });
            });
        } else {
            events.push({ type: 'bass', note: resChord.rootNote - 12, time: 0, duration: 4.0, weight: 0.7, technique: 'drone', dynamics: 'p', phrasing: 'legato' });
        }
    }

    // 3. MELODY
    let activeMelLick = 'none';
    if (hints.melody) {
        if (this.currentAxiom.length > 0) {
            const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
            const barOffset = (epoch % totalBars) * TICKS_PER_BAR;
            this.currentAxiom.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).forEach(n => {
                events.push({ type: 'melody', note: 60 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.9, technique: n.tech as any || 'pick', dynamics: 'mf', phrasing: 'legato' });
            });
            activeMelLick = this.currentLickId;
        } else {
            events.push({ type: 'melody', note: resChord.rootNote + 12, time: 0, duration: 4.0, weight: 0.65, technique: 'swell', dynamics: 'p', phrasing: 'legato' });
            activeMelLick = 'Algorithmic Pad';
        }
    }

    // 4. ACCOMPANIMENT / PIANO / HARMONY
    const usedLayers = new Set<string>();
    let pianoAxiomId = 'none';
    let harmonyAxiomId = 'none';

    this.currentAccompAxioms.forEach(ax => {
        const role = ax.role.toLowerCase();
        let target: InstrumentPart | null = null;
        if (role.includes('piano')) { target = 'pianoAccompaniment'; pianoAxiomId = ax.id; }
        else if (role.includes('accomp')) target = 'accompaniment';
        else if (role.includes('harmony') || role.includes('guitar')) { target = 'harmony'; harmonyAxiomId = ax.id; }

        if (target && hints[target] && !usedLayers.has(target)) {
            const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
            const barOffset = (epoch % totalBars) * TICKS_PER_BAR;
            ax.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).forEach(n => {
                events.push({ type: target, note: 60 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.6, technique: 'swell', dynamics: 'p', phrasing: 'legato' });
            });
            usedLayers.add(target);
        }
    });

    if (hints.pianoAccompaniment && !usedLayers.has('pianoAccompaniment')) {
        events.push(...this.renderVirtuosoPiano(resChord, tension));
        pianoAxiomId = 'Rhodes Bubbling';
    }

    if (hints.harmony && !usedLayers.has('harmony')) {
        events.push(...this.renderGenerativeHarmony(resChord, tension));
        harmonyAxiomId = 'Algorithmic Skank';
    }

    if (hints.accompaniment && !usedLayers.has('accompaniment')) {
        events.push({ type: 'accompaniment', note: resChord.rootNote + 12, time: 0, duration: 4.0, weight: 0.5, technique: 'swell', dynamics: 'p', phrasing: 'legato' });
    }

    const modeStr = this.config.isImprovising && !this.config.activeAnchorId ? 'IMPROVISATION' : 'RESTORATION';

    return { 
        events, 
        tension, 
        brightness: tension * 0.8,
        beautyScore: 0.85, 
        trackName: this.currentTrackName, 
        newBpm, 
        activeAxioms: { 
            melody: activeMelLick, 
            drums: hints.drums ? 'Standard Pulse' : 'none',
            bass: this.currentBassAxiom.length > 0 ? 'Sibling DNA' : 'Generative Drone',
            harmony: harmonyAxiomId,
            piano: pianoAxiomId
        },
        narrative: `Blues ${modeStr}: ${this.currentTrackName} [Status: PLAYING]`
    };
  }

  private renderStandardDrums(epoch: number, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      events.push({ type: 'drum_kick_reso', note: 36, time: 0, duration: 0.1, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
      [3, 9].forEach(t => events.push({ type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.8, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' }));
      [0, 3, 6, 9].forEach(t => events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      return events;
  }
}
