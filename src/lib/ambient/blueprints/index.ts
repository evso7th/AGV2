
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


/**
 * A simple, unified library of all available blueprints.
 * This structure replaces the complex dynamic loader, ensuring that if a blueprint
 * is in this list, it is guaranteed to be available.
 */
export const BLUEPRINT_LIBRARY: Record<Genre, Partial<Record<Mood, MusicBlueprint>>> = {
    ambient: {
        melancholic: MelancholicAmbientBlueprint,
        dark: DarkAmbientBlueprint,
        calm: CalmAmbientBlueprint,
        dreamy: DreamyAmbientBlueprint,
        joyful: JoyfulAmbientBlueprint,
        enthusiastic: EnthusiasticAmbientBlueprint,
        contemplative: NeutralAmbientBlueprint, // Mapped to Neutral
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
        // #ЗАЧЕМ: Этот блок маршрутизирует комбинацию `blues` + `melancholic` на
        //         специально созданный `WinterBluesBlueprint`.
        // #СВЯЗИ: Является частью решения проблемы с выбором гитарных сэмплеров.
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
    // Other genres can be added here...
    progressive: {},
    rock: {},
    house: {},
    rnb: {},
    ballad: {},
    reggae: {},
    celtic: {},
};

/**
 * Retrieves a music blueprint based on genre and mood from the unified library.
 * This function ensures a blueprint is always returned by using a fallback mechanism.
 * @param genre The musical genre.
 * @param mood The musical mood.
 * @returns A MusicBlueprint.
 */
export function getBlueprint(genre: Genre, mood: Mood): MusicBlueprint {
    const genreBlueprints = BLUEPRINT_LIBRARY[genre];
    
    // 1. Try to find the exact mood in the requested genre.
    if (genreBlueprints && genreBlueprints[mood]) {
        const blueprint = genreBlueprints[mood]!;
        console.log(`[getBlueprint] Requesting blueprint for Genre: ${genre}, Mood: ${mood}. Found direct match: ${blueprint.id}.ts`);
        return blueprint;
    }
    
    // 2. Fallback: If mood not in genre, try finding the mood in the 'ambient' genre.
    const fallbackBlueprint = BLUEPRINT_LIBRARY['ambient']?.[mood];
    if (fallbackBlueprint) {
        console.warn(`[getBlueprint] Requesting blueprint for Genre: ${genre}, Mood: ${mood}. No specific blueprint, falling back to 'ambient' genre. Using: ${fallbackBlueprint.id}.ts`);
        return fallbackBlueprint;
    }
    
    // 3. Ultimate Fallback: Return the default melancholic ambient blueprint.
    console.error(`[getBlueprint] Requesting blueprint for Genre: ${genre}, Mood: ${mood}. Ultimate fallback to Melancholic Ambient. Using: ${MelancholicAmbientBlueprint.id}.ts`);
    return MelancholicAmbientBlueprint;
}
