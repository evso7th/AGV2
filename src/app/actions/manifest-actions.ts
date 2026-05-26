/**
 * #ЗАЧЕМ: Заглушка для стабильности импортов.
 * #ЧТО: ПЛАН №6000 — Проект 100% статический, серверные действия удалены.
 */
export async function readProjectRootManifests() {
  console.warn('[ManifestAction] Running in static mode. Root access is restricted.');
  return [];
}