'use server';

import fs from 'fs/promises';
import path from 'path';

/**
 * #ЗАЧЕМ: Чтение манифестов из корня проекта на стороне сервера.
 * #ЧТО: ПЛАН №1004 — Реализация моста между ФС сервера и клиентом для синхронизации контекста.
 */
export async function readProjectRootManifests() {
  const fileList = [
    'CODEBASE_SPECIFICATION.md',
    'DNA_rules.txt',
    'FORGE_MASTER_SPEC.md',
    'FRACTAL_ENGINE_IMPLEMENTATION_PLAN.md',
    'GENERATIVE_MUSIC_CONCEPT.md',
    'PROJECT_ANALYSIS_RU.md',
    'README.md',
    'SOCIAL_CONTRACT.md',
    'SOUND_DISCLAIMER.md',
    'STRATEGIC_CHOICE.md',
    'SYSTEM_PROTOCOL.md',
    'TECHNICAL_OVERVIEW.md',
    'src/lib/project_history.md'
  ];

  const results = [];
  const rootDir = process.cwd();

  for (const filename of fileList) {
    try {
      const fullPath = path.join(rootDir, filename);
      const content = await fs.readFile(fullPath, 'utf-8');
      results.push({
        filename: path.basename(filename),
        content: content
      });
    } catch (e) {
      console.warn(`[ManifestAction] Could not read ${filename}:`, e);
    }
  }

  return results;
}
