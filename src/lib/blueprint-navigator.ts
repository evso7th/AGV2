
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
 * It is a stateless-per-tick class; it recalculates its position on every tick.
 */
export class BlueprintNavigator {
    private blueprint: MusicBlueprint;
    private partBoundaries: { part: BlueprintPart, startBar: number, endBar: number }[] = [];
    private totalBars: number;

    constructor(blueprint: MusicBlueprint, seed: number) {
        this.blueprint = blueprint;
        const random = seededRandom(seed);

        // Determine the concrete duration of the suite and its parts
        this.totalBars = random.nextInt(
            this.blueprint.structure.totalDuration.bars.min,
            this.blueprint.structure.totalDuration.bars.max
        );

        let currentBar = 0;
        for (const part of this.blueprint.structure.parts) {
            const partDuration = random.nextInt(part.duration.bars.min, part.duration.bars.max);
            this.partBoundaries.push({
                part: part,
                startBar: currentBar,
                endBar: currentBar + partDuration -1,
            });
            currentBar += partDuration;
        }
        // Adjust total bars to match the sum of part durations
        this.totalBars = currentBar;
    }

    /**
     * Calculates the current position in the blueprint for a given bar number.
     * @param currentBar The current bar number (epoch).
     * @returns NavigationInfo object with details about the current position and transitions.
     */
    public tick(currentBar: number): NavigationInfo | null {
        const partInfo = this.partBoundaries.find(p => currentBar >= p.startBar && currentBar <= p.endBar);
        if (!partInfo) {
            // End of composition or error
            return null;
        }
        
        const prevPartInfo = this.partBoundaries.find(p => (currentBar - 1) >= p.startBar && (currentBar - 1) <= p.endBar);
        
        const isPartTransition = !prevPartInfo || prevPartInfo.part.id !== partInfo.part.id;
        
        // Simplified bundle navigation for now: assume bundles divide the part evenly.
        const barsIntoPart = currentBar - partInfo.startBar;
        const partDuration = partInfo.endBar - partInfo.startBar + 1;
        const bundleCount = partInfo.part.bundles.length;
        const approxBundleDuration = Math.ceil(partDuration / bundleCount);
        
        const currentBundleIndex = Math.min(bundleCount - 1, Math.floor(barsIntoPart / approxBundleDuration));
        const currentBundle = partInfo.part.bundles[currentBundleIndex];
        
        const prevBundleIndex = Math.min(bundleCount - 1, Math.floor((barsIntoPart - 1) / approxBundleDuration));
        
        const isBundleTransition = !isPartTransition && prevBundleIndex !== currentBundleIndex;

        let logMessage: string | null = null;
        if (isPartTransition) {
            logMessage = `[NAVIGATOR] Transition: Part ${prevPartInfo ? prevPartInfo.part.id : 'Start'} -> Part ${partInfo.part.id}. Mutation point (macro).`;
        } else if (isBundleTransition) {
            const prevBundle = partInfo.part.bundles[prevBundleIndex];
            logMessage = `[NAVIGATOR] Transition: Bundle ${prevBundle.id} -> Bundle ${currentBundle.id}. Mutation point (micro).`;
        }

        return {
            currentPart: partInfo.part,
            currentBundle: currentBundle,
            isPartTransition,
            isBundleTransition,
            logMessage
        };
    }
}
