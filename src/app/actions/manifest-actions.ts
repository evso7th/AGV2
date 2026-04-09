'use server';

import fs from 'fs/promises';
import path from 'path';

/**
 * #ЗАЧЕМ: Чтение манифестов из корня проекта и папки docs/ на стороне сервера.
 * #ЧТО: ПЛАН №1007 — Улучшенный поиск файлов для предотвращения пустых документов в Firestore.
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
    'docs/AXIOM_PROTOCOL.md',
    'docs/BLUES_METHODOLOGY.md',
    'docs/DNA_RULES.md',
    'docs/FORGE_MASTER_SPEC.md',
    'docs/GENETIC_SYSTEM.md',
    'docs/SOR_SPECIFICATION.md',
    'docs/TECHNIQUE_GUIDE.md',
    'src/lib/project_history.md'
  ];

  const results = [];
  const rootDir = process.cwd();

  console.log(`[ManifestAction] Starting sync for ${fileList.length} files...`);

  for (const relativePath of fileList) {
    try {
      const fullPath = path.join(rootDir, relativePath);
      
      // Проверяем существование файла
      try {
        await fs.access(fullPath);
      } catch {
        console.warn(`[ManifestAction] File not found at ${fullPath}, skipping.`);
        continue;
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      
      if (!content || content.trim().length === 0) {
        console.warn(`[ManifestAction] File ${relativePath} is empty!`);
      }

      results.push({
        filename: path.basename(relativePath),
        content: content,
        path: relativePath
      });
    } catch (e) {
      console.error(`[ManifestAction] Critical error reading ${relativePath}:`, e);
    }
  }

  console.log(`[ManifestAction] Sync complete. Found ${results.length} valid files.`);
  return results;
}
