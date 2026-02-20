'use server';
/**
 * #ЗАЧЕМ: Server Actions для Heritage Forge.
 * #ЧТО: Прямая запись данных на диск для анализа Агентом.
 */
import fs from 'fs/promises';
import path from 'path';

export async function saveMidiToBuffer(data: any) {
  try {
    const filePath = path.join(process.cwd(), 'src/lib/assets/ingest_buffer.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`[Bridge] Data saved to ${filePath}`);
    return { success: true };
  } catch (error) {
    console.error('[Bridge] Save failed:', error);
    throw error;
  }
}
