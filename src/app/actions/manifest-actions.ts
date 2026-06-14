// 'use server';

import fs from 'fs/promises';
import path from 'path';

/**
 * #ЗАЧЕМ: Чтение манифестов из корня проекта и папки docs/ на стороне сервера.
 * #ЧТО: ПЛАН №1007 — Улучшенный поиск файлов для предотвращения пустых документов в Firestore.
 */
export async function readProjectRootManifests() {
  const filesToSync = [
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

  console.log(`[ManifestAction] Starting sync for ${filesToSync.length} files...`);

  for (const relPath of filesToSync) {
    try {
      // 1. Пытаемся найти по точному пути
      let fullPath = path.join(rootDir, relPath);
      let exists = false;
      try {
        await fs.access(fullPath);
        exists = true;
      } catch {
        // 2. Если не нашли, и это не вложенный путь, пробуем в docs/
        if (!relPath.includes('/')) {
          const altPath = path.join(rootDir, 'docs', relPath);
          try {
            await fs.access(altPath);
            fullPath = altPath;
            exists = true;
          } catch {}
        }
      }

      if (exists) {
        const content = await fs.readFile(fullPath, 'utf-8');
        
        if (content && content.trim().length > 0) {
          results.push({
            filename: path.basename(relPath),
            content: content,
            path: relPath
          });
        } else {
          console.warn(`[ManifestAction] File found but empty: ${relPath}`);
        }
      } else {
        console.warn(`[ManifestAction] File not found anywhere: ${relPath}`);
      }
    } catch (e) {
      console.error(`[ManifestAction] Critical error reading ${relPath}:`, e);
    }
  }

  console.log(`[ManifestAction] Sync complete. Found ${results.length} files with content.`);
  return results;
}
