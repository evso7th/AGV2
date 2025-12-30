

import type { MusicBlueprint, BlueprintPart, BlueprintBundle, Genre, Mood, InstrumentationRules, MelodyInstrument, AccompanimentInstrument, BassInstrument } from '@/types/music';

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

function formatInstrumentation(instrumentation?: { [key: string]: any }): string {
    if (!instrumentation) {
        return 'Instrumentation: (none)';
    }

    const parts = Object.keys(instrumentation).map(partKey => {
        const rule = instrumentation[partKey] as InstrumentationRules<any>;
        if (rule && rule.strategy === 'weighted' && (rule.options || rule.v1Options || rule.v2Options)) {
            const options = rule.options || rule.v1Options || rule.v2Options || [];
            const optionsStr = options
                .map(opt => `${opt.name}:${Math.round(opt.weight * 100)}%`)
                .join(',');
            return `${partKey}(${optionsStr})`;
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
        introParts.forEach(part => {
            const partDuration = this.introBars;
            const partStartBar = currentBar;
            const partEndBar = partStartBar + partDuration - 1;
            
            const partBoundary = this.createPartBoundary(part, partStartBar, partDuration);
            this.partBoundaries.push(partBoundary);
            
            currentBar += partDuration;
            introDurationTotal += partDuration;
        });

        // Calculate remaining bars and percentage for main parts
        const remainingBars = this.totalBars - introDurationTotal;
        const mainPartsTotalPercent = mainParts.reduce((sum, part) => sum + part.duration.percent, 0);

        if (mainPartsTotalPercent <= 0 && mainParts.length > 0) {
            console.error("[NAVIGATOR] Main parts have a total percentage of 0. Cannot distribute remaining bars.");
        } else {
            mainParts.forEach((part, index) => {
                const isLastPart = index === mainParts.length - 1;
                let partDuration;

                if (isLastPart) {
                    // Last part takes all remaining bars to avoid rounding errors
                    partDuration = this.totalBars - currentBar;
                } else {
                    const proportion = part.duration.percent / mainPartsTotalPercent;
                    partDuration = Math.round(proportion * remainingBars);
                }

                const partStartBar = currentBar;
                const partBoundary = this.createPartBoundary(part, partStartBar, partDuration);
                this.partBoundaries.push(partBoundary);
                
                currentBar += partDuration;
            });
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
        
        let bundleStartInPart = 0;
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
    public tick(currentBar: number): NavigationInfo | null {
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
            const instrumentationLog = formatInstrumentation(partInfo.part.instrumentation);
            
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
