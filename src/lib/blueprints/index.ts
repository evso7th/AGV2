
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
import { NeutralTranceBlueprint } from './trance/neutral';

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
        calm: NeutralTranceBlueprint,
        // Other trance moods can be added here...
    },
    // Other genres can be added here...
    progressive: {},
    rock: {},
    house: {},
    rnb: {},
    ballad: {},
    reggae: {},
    blues: {},
    celtic: {},
};

/**
 * Retrieves a music blueprint based on genre and mood from the unified library.
 * This function ensures a blueprint is always returned by using a fallback mechanism.
 * @param genre The musical genre.
 * @param mood The musical mood.
 * @returns A MusicBlueprint.
 */
export async function getBlueprint(genre: Genre, mood: Mood): Promise<MusicBlueprint> {
    console.log(`[getBlueprint] Requesting blueprint for Genre: ${genre}, Mood: ${mood}`);

    const genreBlueprints = BLUEPRINT_LIBRARY[genre];
    
    // 1. Try to find the exact mood in the requested genre.
    if (genreBlueprints && genreBlueprints[mood]) {
        console.log(`[getBlueprint] Found direct match: ${genre}/${mood}`);
        return genreBlueprints[mood]!;
    }
    
    // 2. Fallback: If mood not in genre, try finding the mood in the 'ambient' genre.
    console.warn(`[getBlueprint] No specific blueprint for ${genre}/${mood}. Falling back to 'ambient' genre for this mood.`);
    const fallbackBlueprint = BLUEPRINT_LIBRARY['ambient']?.[mood];
    if (fallbackBlueprint) {
        return fallbackBlueprint;
    }
    
    // 3. Ultimate Fallback: Return the default melancholic ambient blueprint.
    console.error(`[getBlueprint] Ultimate fallback to Melancholic Ambient.`);
    return MelancholicAmbientBlueprint;
}
