

import type { MusicBlueprint, BlueprintPart, BlueprintBundle, Genre, Mood, InstrumentationRules, MelodyInstrument, AccompanimentInstrument, BassInstrument, V2MelodyInstrument } from '@/types/music';

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

function formatInstrumentation(instrumentation?: { [key: string]: any }, v2MelodyHint?: MelodyInstrument): string {
    if (!instrumentation) {
        return 'Instrumentation: (none)';
    }

    const parts = Object.keys(instrumentation).map(partKey => {
        const rule = instrumentation[partKey] as InstrumentationRules<any>;
        
        if (rule && rule.strategy === 'weighted') {
            let options: { name: any; weight: number; }[] | undefined;
            
            // #ИСПРАВЛЕНО: v2MelodyHint - это не просто индикатор, это конкретный выбранный инструмент.
            // Теперь мы используем этот хинт, чтобы показать, что БЫЛО выбрано, если это V2 пресет.
            // Если хинт не предоставлен, мы просто показываем первые опции V1.
            
            let isV2 = false;
            if (rule.v2Options && rule.v2Options.length > 0) {
                 const v2Names = rule.v2Options.map(o => o.name);
                 if (v2MelodyHint && v2Names.includes(v2MelodyHint as V2MelodyInstrument)) {
                     isV2 = true;
                 } else if (partKey !== 'melody') { 
                    // Для других партий предполагаем V2, если опции есть. Это упрощение.
                    isV2 = true;
                 }
            }
            
            if (isV2) {
                 options = rule.v2Options;
                 const selected = v2MelodyHint && partKey === 'melody' ? v2MelodyHint : options?.[0]?.name || 'unknown_v2';
                 return `${partKey}(V2: ${selected})`;
            } else {
                 options = rule.v1Options || rule.options || [];
            }
            
            if (options && options.length > 0) {
                const optionsStr = options
                    .map(opt => `${opt.name}:${Math.round(opt.weight * 100)}%`)
                    .join(',');
                return `${partKey}(${optionsStr})`;
            }
        }
        return null;
    }).filter(Boolean);

    return `Instruments: ${parts.join(' | ')}`;
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

    constructor(blueprint: MusicBlueprint, seed: number, genre: Genre, mood: Mood, introBars: number) {
        this.blueprint = blueprint;
        this.genre = genre;
        this.mood = mood;
        this.introBars = introBars;
        this.totalBars = this.blueprint.structure.totalDuration.preferredBars;

        let currentBar = 0;
        const allParts = this.blueprint.structure.parts;

        // --- NEW LOGIC FOR INTRO BARS ---
        const introParts = allParts.filter(p => p.id.startsWith('INTRO_'));
        const mainParts = allParts.filter(p => !p.id.startsWith('INTRO_'));
        
        let introDurationTotal = 0;
        
        // Calculate boundaries for INTRO parts first, using the fixed introBars value
        if (introParts.length > 0) {
            const durationPerIntroPart = Math.floor(this.introBars / introParts.length);
            let remainingIntroBars = this.introBars;
            
            introParts.forEach((part, index) => {
                const isLast = index === introParts.length - 1;
                const partDuration = isLast ? remainingIntroBars : durationPerIntroPart;
                
                const partBoundary = this.createPartBoundary(part, currentBar, partDuration);
                this.partBoundaries.push(partBoundary);
                
                currentBar += partDuration;
                remainingIntroBars -= partDuration;
                introDurationTotal += partDuration;
            });
        }


        // Calculate remaining bars and percentage for main parts
        const remainingBars = this.totalBars - introDurationTotal;
        const mainPartsTotalPercent = mainParts.reduce((sum, part) => sum + part.duration.percent, 0);

        if (mainPartsTotalPercent <= 0 && mainParts.length > 0) {
            console.error("[NAVIGATOR] Main parts have a total percentage of 0. Cannot distribute remaining bars.");
        } else if (mainParts.length > 0) {
            let accumulatedMainBars = 0;
            mainParts.forEach((part, index) => {
                const isLastPart = index === mainParts.length - 1;
                let partDuration;

                if (isLastPart) {
                    partDuration = remainingBars - accumulatedMainBars;
                } else {
                    const proportion = part.duration.percent / mainPartsTotalPercent;
                    partDuration = Math.round(proportion * remainingBars);
                }

                const partStartBar = currentBar + accumulatedMainBars;
                const partBoundary = this.createPartBoundary(part, partStartBar, partDuration);
                this.partBoundaries.push(partBoundary);
                
                accumulatedMainBars += partDuration;
            });
            currentBar += accumulatedMainBars;
        }
        
        // Ensure the navigator is robust by sorting and logging
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

        const bundleInfo = partInfo.bundleBoundaries.find(b => effectiveBar >= b.startBar && effectiveBar <= b.endBar);
        if (!bundleInfo) {
            console.error(`[NAVIGATOR @ Bar ${effectiveBar}] CRITICAL: Could not find bundle in part ${partInfo.part.id}`);
            // Fallback to the first bundle if none is found (can happen at the very edge)
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
            const instrumentationLog = formatInstrumentation(partInfo.part.instrumentation, v2MelodyHint);
            
            logMessage = `%c[NAVIGATOR @ Bar ${currentBar}] ${transitionType} Transition: ${partInfo.part.id} / ${bundleInfo.bundle.id}\n` +
                         `  - Context: Genre: ${this.genre}, Mood: ${this.mood}, BP: ${this.blueprint.name}\n` +
                         `  - ${instrumentationLog}\n` +
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
