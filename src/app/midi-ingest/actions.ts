
'use server';

import fs from 'fs';
import path from 'path';

/**
 * #ЗАЧЕМ: Простейший файловый мост для Завода.
 */

const EXPORT_PATH = path.join(process.cwd(), 'src/lib/assets/midi-export.json');
const IMPORT_PATH = path.join(process.cwd(), 'src/lib/assets/axiom-import.json');

export async function exportMidiData(data: any) {
    try {
        fs.writeFileSync(EXPORT_PATH, JSON.stringify(data, null, 2));
        return { success: true };
    } catch (e) {
        console.error("[Forge] Export failed:", e);
        return { success: false, error: String(e) };
    }
}

export async function importAxiomData() {
    try {
        if (!fs.existsSync(IMPORT_PATH)) return [];
        const content = fs.readFileSync(IMPORT_PATH, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        console.error("[Forge] Import failed:", e);
        return [];
    }
}
