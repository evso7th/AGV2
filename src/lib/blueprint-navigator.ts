

import type { MusicBlueprint, BlueprintPart, BlueprintBundle, Genre, Mood, InstrumentationRules, MelodyInstrument, AccompanimentInstrument, BassInstrument, V2MelodyInstrument, InstrumentBehaviorRules } from '@/types/music';

// Helper function for seeded random numbers - kept for potential future use in axiom selection
function seededRandom(seed: number) {
  let state = seed;
  const self = {
      next: () => {
        state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
        return state / Math.pow(2, 32);
      },
      nextInt: (min: number, max: number) => {
        return Math.floor(self.next() * (max - min + 1)) + min;
      }
  };
  return self;
}

type PartBoundary = {
    part: BlueprintPart;
    startBar: number;
    endBar: number;
    bundleBoundaries: {
        bundle: BlueprintBundle;
        startBar: number;
        endBar: number;
    }[];
};

export type NavigationInfo = {
  currentPart: BlueprintPart;
  currentBundle: BlueprintBundle;
  isPartTransition: boolean;
  isBundleTransition: boolean;
  logMessage: string | null;
};

function formatInstrumentation(
    instrumentation?: { [key: string]: any }, 
    drumRules?: InstrumentBehaviorRules,
    v2MelodyHint?: MelodyInstrument
): string {
    // #ЗАЧЕМ: Эта функция создает детальное, удобочитаемое описание текущей инструментовки.
    // #ЧТО: Она итерирует по правилам инструментовки и ударных из блюпринта и форматирует их в строку.
    // #СВЯЗИ: Вызывается из `tick()` для формирования лог-сообщения.
    if (!instrumentation && !drumRules?.kitName) {
        return 'Instrumentation: (none)';
    }

    const parts = instrumentation ? Object.keys(instrumentation).map(partKey => {
        const rule = instrumentation[partKey] as InstrumentationRules<any>;
        
        if (partKey === 'melody' && v2MelodyHint) {
            return `melody(V2: ${v2MelodyHint})`;
        }

        if (rule && rule.strategy === 'weighted') {
            let v1OptionsStr: string | null = null;
            let v2OptionsStr: string | null = null;
            
            if (rule.v1Options && rule.v1Options.length > 0) {
                 v1OptionsStr = `V1(${rule.v1Options.map(opt => `${opt.name}:${Math.round(opt.weight * 100)}%`).join(',')})`;
            }
            if (rule.v2Options && rule.v2Options.length > 0) {
                 v2OptionsStr = `V2(${rule.v2Options.map(opt => `${opt.name}:${Math.round(opt.weight * 100)}%`).join(',')})`;
            }
            
            const finalStr = [v1OptionsStr, v2OptionsStr].filter(Boolean).join(' | ');
            if(finalStr) {
                return `${partKey}: ${finalStr}`;
            }
        }
        return null;
    }).filter(Boolean) : [];

    const drumKitLog = drumRules?.kitName ? `Drum Kit: ${drumRules.kitName}` : null;
    
    const instrumentLog = parts.length > 0 ? `Instruments: ${parts.join(' | ')}` : null;

    return [instrumentLog, drumKitLog].filter(Boolean).join('\n  ');
}


/**
 * A class dedicated to navigating the hierarchical structure of a MusicBlueprint.
 * It tracks the current position (Part, Bundle) based on the bar count ('epoch').
 * It pre-calculates all boundaries at construction time for deterministic navigation.
 * This version uses a deterministic "bookkeeping" approach.
 */
export class BlueprintNavigator {
    public blueprint: MusicBlueprint;
    private partBoundaries: PartBoundary[] = [];
    public totalBars: number;
    private genre: Genre;
    private mood: Mood;
    private introBars: number;
    private soloPlanMap: Map<string, string>;

    constructor(blueprint: MusicBlueprint, seed: number, genre: Genre, mood: Mood, introBars: number, soloPlanMap: Map<string, string>) {
        this.blueprint = blueprint;
        this.genre = genre;
        this.mood = mood;
        this.introBars = introBars; // This might be deprecated if percentages are always used
        this.totalBars = this.blueprint.structure.totalDuration.preferredBars;
        this.soloPlanMap = soloPlanMap;

        let currentBar = 0;
        const allParts = this.blueprint.structure.parts;
        const totalPercent = allParts.reduce((sum, part) => sum + part.duration.percent, 0);

        if (totalPercent <= 0) {
            console.error("[NAVIGATOR] Blueprint parts have a total percentage of 0. Cannot create navigation map.");
            return;
        }
        
        let accumulatedBars = 0;

        allParts.forEach((part, index) => {
            const isLastPart = index === allParts.length - 1;
            let partDuration: number;

            if (isLastPart) {
                partDuration = this.totalBars - accumulatedBars;
            } else {
                const proportion = part.duration.percent / totalPercent;
                partDuration = Math.round(proportion * this.totalBars);
            }

            const partStartBar = currentBar + accumulatedBars;
            const partBoundary = this.createPartBoundary(part, partStartBar, partDuration);
            this.partBoundaries.push(partBoundary);
            
            accumulatedBars += partDuration;
        });

        // Ensure the last part ends exactly at totalBars
        if (this.partBoundaries.length > 0) {
            const lastPart = this.partBoundaries[this.partBoundaries.length - 1];
            lastPart.endBar = this.totalBars - 1;
        }

        // Ensure navigator is robust by sorting and logging
        this.partBoundaries.sort((a,b) => a.startBar - b.startBar);
        console.log('[NAVIGATOR] Initialized with part boundaries:', this.partBoundaries.map(p => ({id: p.part.id, start: p.startBar, end: p.endBar, bundles: p.bundleBoundaries.length})));
    }
    
    private createPartBoundary(part: BlueprintPart, startBar: number, duration: number): PartBoundary {
        const partBoundary: PartBoundary = {
            part,
            startBar,
            endBar: startBar + duration - 1,
            bundleBoundaries: []
        };
        
        const bundleCount = part.bundles.length;
        
        if (bundleCount > 0) {
            const bundleDurations = part.bundles.map(b => b.duration.percent);
            const totalBundlePercent = bundleDurations.reduce((a, b) => a + b, 0);

            if (totalBundlePercent > 0) {
                let accumulatedDuration = 0;
                for (let i = 0; i < bundleCount; i++) {
                    const bundleSpec = part.bundles[i];
                    const isLastBundleInPart = i === bundleCount - 1;

                    let bundleDuration;
                    if (isLastBundleInPart) {
                        bundleDuration = duration - accumulatedDuration;
                    } else {
                        const proportion = bundleDurations[i] / totalBundlePercent;
                        bundleDuration = Math.round(proportion * duration);
                    }
                    
                    partBoundary.bundleBoundaries.push({
                        bundle: bundleSpec,
                        startBar: startBar + accumulatedDuration,
                        endBar: startBar + accumulatedDuration + bundleDuration - 1
                    });
                    accumulatedDuration += bundleDuration;
                }
            }
        }
        return partBoundary;
    }


    /**
     * Calculates the current position in the blueprint for a given bar number.
     * @param currentBar The current bar number (epoch).
     * @returns NavigationInfo object with details about the current position and transitions.
     */
    public tick(currentBar: number, v2MelodyHint?: MelodyInstrument): NavigationInfo | null {
        // Wrap the bar count if it exceeds the total duration, allowing for looping.
        const effectiveBar = currentBar % this.totalBars;

        const partInfo = this.partBoundaries.find(p => effectiveBar >= p.startBar && effectiveBar <= p.endBar);
        if (!partInfo) {
            console.error(`[NAVIGATOR @ Bar ${effectiveBar}] CRITICAL: Could not find part for current bar.`);
            return null;
        }

        // If no bundles, create a default one for the whole part duration
        if (partInfo.bundleBoundaries.length === 0) {
            const isPartTransition = effectiveBar === partInfo.startBar;
             const logMessage = isPartTransition ? `%c[NAVIGATOR @ Bar ${currentBar}] Part Transition: ${partInfo.part.id} (No Bundles)` : null;
            return {
                currentPart: partInfo.part,
                currentBundle: { id: `${partInfo.part.id}_DEFAULT_BUNDLE`, name: 'Default', duration: { percent: 100 }, characteristics: {}, phrases: {} },
                isPartTransition,
                isBundleTransition: false,
                logMessage
            };
        }

        const bundleInfo = partInfo.bundleBoundaries.find(b => effectiveBar >= b.startBar && effectiveBar <= b.endBar);
        if (!bundleInfo) {
            console.error(`[NAVIGATOR @ Bar ${effectiveBar}] CRITICAL: Could not find bundle in part ${partInfo.part.id}`);
             if (partInfo.bundleBoundaries.length > 0) {
                 return {
                    currentPart: partInfo.part,
                    currentBundle: partInfo.bundleBoundaries[0].bundle,
                    isPartTransition: effectiveBar === partInfo.startBar,
                    isBundleTransition: false,
                    logMessage: `[NAVIGATOR @ Bar ${effectiveBar}] Fallback to first bundle in part ${partInfo.part.id}.`
                 };
             }
            return null;
        }

        const isPartTransition = effectiveBar === partInfo.startBar;
        const isBundleTransition = !isPartTransition && effectiveBar === bundleInfo.startBar;
        
        let logMessage: string | null = null;
        if (isPartTransition || isBundleTransition) {
            const transitionType = isPartTransition ? "Part" : "Bundle";
            const mutationType = isPartTransition ? "MACRO" : "micro";
            
            // #ЗАЧЕМ: Формирование детального лога для отладки.
            // #ЧТО: Собирает информацию о текущей секции, включая инструменты, правила и длительность.
            // #СВЯЗИ: Вызывается из tick() для формирования лог-сообщения.
            const partDuration = partInfo.endBar - partInfo.startBar + 1;
            const bundleDuration = bundleInfo.endBar - bundleInfo.startBar + 1;

            const rulesLog: string[] = [];
            if (partInfo.part.instrumentRules) {
                Object.entries(partInfo.part.instrumentRules).forEach(([key, value]) => {
                    const density = value.density ? `density:[${value.density.min}-${value.density.max}]` : '';
                    const source = value.source ? `src:${value.source}` : '';
                    const kit = value.kitName ? `kit:${value.kitName}` : '';
                    
                    let soloPlanLog: string | null = null;
                    if (key === 'melody' && this.soloPlanMap.has(partInfo.part.id)) {
                        soloPlanLog = `solo:${this.soloPlanMap.get(partInfo.part.id)}`;
                    }

                    const rulesStr = [density, source, soloPlanLog, kit].filter(Boolean).join(' ');
                    if (rulesStr) {
                        rulesLog.push(`${key}(${rulesStr})`);
                    }
                });
            }

            const instrumentationLog = formatInstrumentation(partInfo.part.instrumentation, partInfo.part.instrumentRules?.drums, v2MelodyHint);
            
            logMessage = `%c[NAVIGATOR @ Bar ${currentBar}] ${transitionType} Transition: ${partInfo.part.id} (${partDuration} bars) / ${bundleInfo.bundle.id} (${bundleDuration} bars)\n` +
                         `  - Context: Genre: ${this.genre}, Mood: ${this.mood}, BP: ${this.blueprint.name}\n` +
                         `  - ${instrumentationLog}\n` +
                         `  - Rules: ${rulesLog.join(' | ')}\n` +
                         `  - Mutation: ${mutationType}`;
        }


        return {
            currentPart: partInfo.part,
            currentBundle: bundleInfo.bundle,
            isPartTransition,
            isBundleTransition,
            logMessage
        };
    }
}
