
import type { MusicBlueprint, BlueprintPart, BlueprintBundle } from '@/types/music';

// Helper function for seeded random numbers
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
 */
export class BlueprintNavigator {
    private blueprint: MusicBlueprint;
    private partBoundaries: PartBoundary[] = [];
    public totalBars: number;

    constructor(blueprint: MusicBlueprint, seed: number) {
        this.blueprint = blueprint;
        const random = seededRandom(seed);

        let totalSuiteBars = 0;

        for (const part of this.blueprint.structure.parts) {
            const partDuration = random.nextInt(part.duration.bars.min, part.duration.bars.max);
            
            const partStartBar = totalSuiteBars;
            const partEndBar = partStartBar + partDuration - 1;
            
            const partBoundary: PartBoundary = {
                part,
                startBar: partStartBar,
                endBar: partEndBar,
                bundleBoundaries: []
            };

            let bundleStartBarInPart = 0;
            const bundleCount = part.bundles.length;
            
            let remainingBars = partDuration;
            for (let i = 0; i < bundleCount; i++) {
                const bundleSpec = part.bundles[i];
                let bundleDuration = 0;
                if (i === bundleCount - 1) {
                    bundleDuration = remainingBars;
                } else {
                    const maxPossible = Math.max(bundleSpec.duration.min, remainingBars - (bundleCount - 1 - i) * bundleSpec.duration.min);
                    const minDuration = Math.min(bundleSpec.duration.min, remainingBars);
                     if (minDuration > maxPossible) {
                        bundleDuration = minDuration;
                    } else {
                        bundleDuration = random.nextInt(minDuration, maxPossible);
                    }
                }
                
                const actualDuration = Math.max(0, Math.min(bundleDuration, remainingBars));

                partBoundary.bundleBoundaries.push({
                    bundle: bundleSpec,
                    startBar: partStartBar + bundleStartBarInPart,
                    endBar: partStartBar + bundleStartBarInPart + actualDuration - 1
                });

                bundleStartBarInPart += actualDuration;
                remainingBars -= actualDuration;
            }
            
            this.partBoundaries.push(partBoundary);
            totalSuiteBars += partDuration;
        }

        this.totalBars = totalSuiteBars;
    }

    /**
     * Calculates the current position in the blueprint for a given bar number.
     * @param currentBar The current bar number (epoch).
     * @returns NavigationInfo object with details about the current position and transitions.
     */
    public tick(currentBar: number): NavigationInfo | null {
        const partInfo = this.partBoundaries.find(p => currentBar >= p.startBar && currentBar <= p.endBar);
        if (!partInfo) {
            return null; // End of composition
        }

        const bundleInfo = partInfo.bundleBoundaries.find(b => currentBar >= b.startBar && currentBar <= b.endBar);
        if (!bundleInfo) {
            console.error(`[NAVIGATOR @ Bar ${currentBar}] Could not find bundle in part ${partInfo.part.id}`);
            return null;
        }

        const isPartTransition = currentBar === partInfo.startBar;
        const isBundleTransition = !isPartTransition && currentBar === bundleInfo.startBar;

        let logMessage: string | null = null;
        if (isPartTransition) {
            logMessage = `[NAVIGATOR @ Bar ${currentBar}] Transition: Part ${partInfo.part.id}. Mutation point (macro).`;
        } else if (isBundleTransition) {
            logMessage = `[NAVIGATOR @ Bar ${currentBar}] Transition: Bundle ${bundleInfo.bundle.id}. Mutation point (micro).`;
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
