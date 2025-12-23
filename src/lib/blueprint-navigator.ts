
import type { MusicBlueprint, BlueprintPart, BlueprintBundle } from '@/types/music';

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

/**
 * A class dedicated to navigating the hierarchical structure of a MusicBlueprint.
 * It tracks the current position (Part, Bundle) based on the bar count ('epoch').
 * It pre-calculates all boundaries at construction time for deterministic navigation.
 * This version uses a deterministic "bookkeeping" approach.
 */
export class BlueprintNavigator {
    private blueprint: MusicBlueprint;
    private partBoundaries: PartBoundary[] = [];
    public totalBars: number;

    constructor(blueprint: MusicBlueprint, seed: number) {
        this.blueprint = blueprint;
        
        // Use a fixed, preferred total duration for predictability.
        this.totalBars = this.blueprint.structure.totalDuration.preferredBars;
        let currentBar = 0;

        const totalPercentage = this.blueprint.structure.parts.reduce((sum, part) => sum + part.duration.percent, 0);
        if (Math.abs(totalPercentage - 100) > 1) {
            console.warn(`[NAVIGATOR] Sum of part percentages is ${totalPercentage}, not 100. Durations may be skewed.`);
        }

        const numParts = this.blueprint.structure.parts.length;
        for (let partIndex = 0; partIndex < numParts; partIndex++) {
            const part = this.blueprint.structure.parts[partIndex];
            const isLastPart = partIndex === numParts - 1;
            
            const calculatedPartDuration = Math.round((part.duration.percent / 100) * this.totalBars);
            const partDuration = isLastPart ? this.totalBars - currentBar : calculatedPartDuration;
            
            const partStartBar = currentBar;
            const partEndBar = partStartBar + partDuration - 1;

            const partBoundary: PartBoundary = {
                part,
                startBar: partStartBar,
                endBar: partEndBar,
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

                        const proportion = bundleDurations[i] / totalBundlePercent;
                        let bundleDuration;

                        if (isLastBundleInPart) {
                            // Last bundle gets the remainder to ensure full coverage of the part
                            bundleDuration = partDuration - accumulatedDuration;
                        } else {
                            bundleDuration = Math.round(proportion * partDuration);
                        }
                        
                        const bundleEndBar = partStartBar + accumulatedDuration + bundleDuration - 1;

                        partBoundary.bundleBoundaries.push({
                            bundle: bundleSpec,
                            startBar: partStartBar + accumulatedDuration,
                            endBar: bundleEndBar
                        });
                        accumulatedDuration += bundleDuration;
                    }
                }
            }


            this.partBoundaries.push(partBoundary);
            currentBar += partDuration;
        }

        // Final check to ensure the last part covers the total duration
        if (this.partBoundaries.length > 0) {
            const lastPartBoundary = this.partBoundaries[this.partBoundaries.length - 1];
            if (lastPartBoundary.endBar !== this.totalBars - 1) {
                 lastPartBoundary.endBar = this.totalBars - 1;
                 if (lastPartBoundary.bundleBoundaries.length > 0) {
                     const lastBundle = lastPartBoundary.bundleBoundaries[lastPartBoundary.bundleBoundaries.length - 1];
                     lastBundle.endBar = this.totalBars - 1;
                 }
            }
        }
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
            return null;
        }

        // Simplified transition logic
        const isPartTransition = effectiveBar === partInfo.startBar;
        const isBundleTransition = !isPartTransition && effectiveBar === bundleInfo.startBar;
        
        let logMessage: string | null = null;
        if (isPartTransition) {
             logMessage = `%c[NAVIGATOR @ Bar ${currentBar}] Transition: Part ${partInfo.part.id}. Mutation (macro).`;
        } else if (isBundleTransition) {
             logMessage = `%c[NAVIGATOR @ Bar ${currentBar}] Transition: Bundle ${bundleInfo.bundle.id}. Mutation (micro).`;
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
