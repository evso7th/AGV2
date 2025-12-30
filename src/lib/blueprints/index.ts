
import type { MusicBlueprint, Genre, Mood } from '@/types/music';

// --- Static Imports for Ambient (as requested) ---
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


// Export the default blueprint so it can be imported directly
export { MelancholicAmbientBlueprint };

// --- Static Library for Immediately Available Blueprints ---
export const STATIC_BLUEPRINT_LIBRARY: Partial<Record<Genre, Partial<Record<Mood, MusicBlueprint>>>> = {
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
    }
};

// --- Dynamic Loader Map for Lazy-loaded Blueprints ---
const DYNAMIC_BLUEPRINT_MAP: Partial<Record<Genre, Partial<Record<Mood, () => Promise<{ default: { [key: string]: MusicBlueprint } }>>>>> = {
    trance: {
        joyful: () => import('./trance/joyful'),
        melancholic: () => import('./trance/melancholic').then(m => ({ default: { MelancholicTranceBlueprint: m.MelancholicTranceBlueprint } })),
        calm: () => import('./trance/neutral'), // Assuming neutral is the fallback for calm in trance
        // Add other trance moods here as they are created
    },
    // Other genres like 'rock', 'progressive' would be added here
};

/**
 * Asynchronously retrieves a music blueprint based on genre and mood.
 * Ambient blueprints are loaded statically, others are lazy-loaded.
 * @param genre The musical genre.
 * @param mood The musical mood.
 * @returns A Promise that resolves to the requested MusicBlueprint.
 */
export async function getBlueprint(genre: Genre, mood: Mood): Promise<MusicBlueprint> {
    console.log(`[getBlueprint] Requesting blueprint for Genre: ${genre}, Mood: ${mood}`);

    // Priority 1: Check static library (for ambient)
    const staticBlueprint = STATIC_BLUEPRINT_LIBRARY[genre]?.[mood];
    if (staticBlueprint) {
        console.log(`[getBlueprint] Found statically loaded blueprint: ${staticBlueprint.name}. All ambient blueprints are pre-loaded.`);
        return staticBlueprint;
    }

    // Priority 2: Check dynamic library for lazy loading
    const loader = DYNAMIC_BLUEPRINT_MAP[genre]?.[mood];
    if (loader) {
        console.log(`[getBlueprint] Dynamically loading blueprint for ${genre}/${mood}...`);
        const module = await loader();
        // The blueprint is expected to be the main export of its file, often keyed by its name.
        const blueprintKey = Object.keys(module.default)[0];
        const dynamicBlueprint = module.default[blueprintKey];
        console.log(`[getBlueprint] Dynamically loaded: ${dynamicBlueprint.name}`);
        return dynamicBlueprint;
    }

    // Fallback: If a specific mood is not found, default to a core blueprint for that genre or a global default.
    console.warn(`[getBlueprint] No specific blueprint for ${genre}/${mood}. Falling back.`);
    const fallbackGenre = STATIC_BLUEPRINT_LIBRARY[genre] || STATIC_BLUEPRINT_LIBRARY['ambient'];
    const fallbackBlueprint = fallbackGenre?.[mood] || fallbackGenre?.['melancholic'];
    
    if (fallbackBlueprint) {
        return fallbackBlueprint;
    }
    
    // Ultimate fallback
    return MelancholicAmbientBlueprint;
}

// Deprecated, but kept for reference until all parts of the system are updated.
export const BLUEPRINT_LIBRARY = STATIC_BLUEPRINT_LIBRARY;
