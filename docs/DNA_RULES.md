# DNA Rules: The Heritage Codex (v1.3 "Narrative Age")

1.  **Dual Mode Operation**: The engine exclusively uses 'DNA Anchor' (manual selection) and 'Composer' (heritage-enabled free play) modes.
2.  **Strict Channel Routing**: In Anchor mode, axioms must play exactly as recorded through their assigned channels: Bass, Melody, Accompaniment, Harmony, and Rhodes.
3.  **Role Authority**: Every axiom belongs to one of the 5 roles. This role dictates its routing regardless of the session mode.
4.  **Narrative Integrity**: MIDI track information must be preserved in the `narrative` field during import.
5.  **Auditor Sovereignty**: Users have total control over all axiom attributes (role, genre, mood, vector) via the DNA Auditor.
6.  **Temporal Grid**: The 12/8 grid, tick count per bar, and BPM must remain perfectly synchronized between auditing and performance.
7.  **Axiom BPM Dominance**: If a track is 80 BPM but an axiom is 40 BPM, that specific axiom must be time-stretched to fit the master tempo (80 BPM).
8.  **Melody Imperative**: A melody axiom must always be present. If missing from the donor track, the engine must generate a melodic part following genre and mood rules.
9.  **Filter Immunity**: Anchor mode ignores all genre and mood filters.
10. **Composer Filtering**: In free play, the engine only selects donors matching the UI genre/mood. If no matches exist, it falls back to full algorithmic generation.
11. **Mandatory Mutation**: In Composer mode, improvisation and mutations (inversion, retrograde, jitter) must be applied.
12. **Sibling Sovereignty**: The engine prioritizes "Sibling" axioms (those recorded together) within the active donor track. Sibling search is strictly limited to the active donor track.
13. **Session Uniqueness**: The first donor track and the sequence of tracks must be unique for every launch. Use a "Blacklist" history of 7 tracks to prevent repeats.
14. **Brain-Defined Logic**: Differences between Harmony and Accompaniment logic are defined by the specific genre Brain (Ambient, Blues, Trance, etc.).
15. **Axiom Supremacy**: No layering of axioms with generation. If an axiom exists for a channel, it is the master. Generation is used only when no axioms are present.
16. **Instrument Veto**: Instruments defined in an axiom's `preferredInstrument` field have absolute priority over Blueprint and UI settings.
17. **Semantic Timbre Groups**: In DNA Auditor, instruments can be assigned to dynamic groups that react to Tension (T).
18. **Piano Dualism**: The pianist channel should use Rhodes (70%) and Sampled Piano (30%) randomly, decided upon each donor track change.
19. **DNA INTERFACE SANCTITY**: КАТЕГОРИЧЕСКИ ЗАПРЕЩАЕТСЯ ТРОГАТЬ СИСТЕМУ ЛОГИРОВАНИЯ И ИНТЕРФЕЙС DNA.
20. **ANCHOR PERSISTENCE**: The active DNA Anchor must remain strictly locked during Pause/Play cycles.
21. **NARRATIVE SCALING**: The engine supports `timeScale` parameter. For Solo/Melody, this expands the reading window of the Axiom while slowing down the playback, creating 'laid-back' feel.
22. **GOLDEN NOTE SUPREMACY**: In high-density passages, notes on strong beats (0, 3, 6, 9) must be preserved and enhanced (vibrato, duration), while others become ghost notes (30% weight).
