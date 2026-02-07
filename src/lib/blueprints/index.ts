import type { MusicBlueprint, Genre, Mood } from '@/types/music';

// --- Static Imports for All Blueprints ---
import { MelancholicAmbientBlueprint } from './ambient/melancholic';
import { DarkAmbientBlueprint } from './ambient/dark';
import { CalmAmbientBlueprint } from './ambient/calm';
import { DreamyAmbientBlueprint } from './ambient/dreamy';
import { JoyfulAmbientBlueprint } from './ambient/joyful';
import { EnthusiasticAmbientBlueprint } from './ambient/enthusiastic';
import { NeutralAmbientBlueprint } from './ambient/neutral';
import { EpicAmbientBlueprint } from './ambient/epic';
import { AnxiousAmbientBlueprint } from './ambient/anxious';
import { MelancholicTranceBlueprint } from './trance/melancholic';
import { DarkTranceBlueprint } from './trance/dark';
import { AnxiousTranceBlueprint } from './trance/anxious';
import { JoyfulTranceBlueprint } from './trance/joyful';
import { CalmTranceBlueprint } from './trance/calm';
import { EpicTranceBlueprint } from './trance/epic';
import { EnthusiasticTranceBlueprint } from './trance/enthusiastic';
import { DreamyTranceBlueprint } from './trance/dreamy';
import { ContemplativeTranceBlueprint } from './trance/contemplative';
import { DarkBluesBlueprint } from './blues/dark';
import { EnthusiasticBluesBlueprint } from './blues/enthusiastic';
import { JoyfulBluesBlueprint } from './blues/joyful';
import { NeutralBluesBlueprint } from './blues/neutral';
import { CalmBluesBlueprint } from './blues/calm';
import { DreamyBluesBlueprint } from './blues/dreamy';
import { EpicBluesBlueprint } from './blues/epic';
import { AnxiousBluesBlueprint } from './blues/anxious';
import { ContemplativeBluesBlueprint } from './blues/contemplative';
import { WinterBluesBlueprint } from './blues/winter';

// --- Bridge Blueprints ---
import { DarkBridgeBlueprint } from './bridges/dark';
import { WinterBridgeBlueprint } from './bridges/winter';
import { AnxiousBridgeBlueprint } from './bridges/anxious';

export const BLUEPRINT_LIBRARY: Record<Genre, Partial<Record<Mood, MusicBlueprint>>> = {
    ambient: {
        melancholic: MelancholicAmbientBlueprint,
        dark: DarkAmbientBlueprint,
        calm: CalmAmbientBlueprint,
        dreamy: DreamyAmbientBlueprint,
        joyful: JoyfulAmbientBlueprint,
        enthusiastic: EnthusiasticAmbientBlueprint,
        contemplative: NeutralAmbientBlueprint, 
        epic: EpicAmbientBlueprint,
        anxious: AnxiousAmbientBlueprint,
    },
    trance: {
        melancholic: MelancholicTranceBlueprint,
        dark: DarkTranceBlueprint,
        anxious: AnxiousTranceBlueprint,
        joyful: JoyfulTranceBlueprint,
        calm: CalmTranceBlueprint,
        epic: EpicTranceBlueprint,
        enthusiastic: EnthusiasticTranceBlueprint,
        dreamy: DreamyTranceBlueprint,
        contemplative: ContemplativeTranceBlueprint,
    },
    blues: {
        melancholic: WinterBluesBlueprint,
        dark: DarkBluesBlueprint,
        enthusiastic: EnthusiasticBluesBlueprint,
        joyful: JoyfulBluesBlueprint,
        contemplative: ContemplativeBluesBlueprint,
        calm: CalmBluesBlueprint,
        dreamy: DreamyBluesBlueprint,
        epic: EpicBluesBlueprint,
        anxious: AnxiousBluesBlueprint,
    },
    progressive: {}, rock: {}, house: {}, rnb: {}, ballad: {}, reggae: {}, celtic: {},
};

export const BRIDGE_LIBRARY: Partial<Record<Mood, MusicBlueprint>> = {
    dark: DarkBridgeBlueprint,
    melancholic: WinterBridgeBlueprint,
    anxious: AnxiousBridgeBlueprint,
};

/**
 * #ЗАЧЕМ: Возвращает БП моста для конкретного настроения.
 */
export function getBridgeBlueprint(mood: Mood): MusicBlueprint {
    return BRIDGE_LIBRARY[mood] || WinterBridgeBlueprint;
}

export function getBlueprint(genre: Genre, mood: Mood): MusicBlueprint {
    const genreBlueprints = BLUEPRINT_LIBRARY[genre];
    if (genreBlueprints && genreBlueprints[mood]) return genreBlueprints[mood]!;
    const fallbackBlueprint = BLUEPRINT_LIBRARY['ambient']?.[mood];
    if (fallbackBlueprint) return fallbackBlueprint;
    return MelancholicAmbientBlueprint;
}
