import { collection, doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

/**
 * #ЗАЧЕМ: Сохранение "Шедевра" (удачной музыкальной комбинации).
 * #ЧТО: ПЛАН №2401 — Укрепление стабильности для предотвращения краха в Safari.
 *       Удалены уведомления об успехе (дублируют HUD).
 */
export function saveMasterpiece(db: Firestore, data: {
  seed: number;
  mood: string;
  genre: string;
  density: number;
  bpm: number;
  instrumentSettings: any;
  isArbiterFind?: boolean;
}) {
  if (!db) {
    console.warn('[FirebaseService] Firestore instance missing');
    return;
  }

  try {
    const masterpiecesRef = collection(db, 'masterpieces');
    const newDocRef = doc(masterpiecesRef);
    
    // Глубокая очистка настроек
    const cleanSettings = JSON.parse(JSON.stringify(data.instrumentSettings || {}));

    const payload = {
      seed: data.seed || 0,
      mood: data.mood || 'unknown',
      genre: data.genre || 'unknown',
      density: data.density || 0.5,
      bpm: data.bpm || 72,
      instrumentSettings: cleanSettings,
      origin: data.isArbiterFind ? 'AI_Arbiter' : 'User_Like',
      timestamp: serverTimestamp()
    };

    setDoc(newDocRef, payload)
      .catch(async (serverError) => {
        // ПЛАН №2401: Очистка payload от FieldValue перед логированием ошибки
        const { timestamp, ...serializablePayload } = payload;
        
        const permissionError = new FirestorePermissionError({
          path: newDocRef.path,
          operation: 'create',
          requestResourceData: serializablePayload,
        });
        
        errorEmitter.emit('permission-error', permissionError);
      });
  } catch (criticalError) {
    console.error('[FirebaseService] Critical save error:', criticalError);
    toast({
      variant: "destructive",
      title: "Save Failed",
      description: "A local error occurred while preparing the data."
    });
  }
}

/**
 * #ЗАЧЕМ: Сохранение системного документа в облако.
 * #ЧТО: Использует имя файла как ID для обеспечения возможности обновления (Overwrite).
 */
export function saveProjectDocument(db: Firestore, data: {
    filename: string;
    content: string;
    category?: 'protocol' | 'spec' | 'backlog' | 'contract';
    version?: string;
}) {
    if (!db) return;
    
    try {
        const docId = data.filename.replace(/[^a-zA-Z0-9]/g, '_');
        const docRef = doc(db, 'project_documents', docId);
        
        const payload = {
            ...data,
            timestamp: serverTimestamp()
        };

        setDoc(docId, payload, { merge: true })
            .catch(async (serverError) => {
                const { timestamp, ...serializable } = payload;
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'write',
                    requestResourceData: serializable,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    } catch (e) {}
}

/**
 * #ЗАЧЕМ: Генерирую уникальный UID для аксиомы (ПЛАН №1188).
 */
function generateAxiomUid(compositionId: string, role: string): string {
    const cleanCompId = compositionId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const cleanRole = role.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10);
    const randomSuffix = Math.random().toString(36).substring(2, 12);
    return `${cleanCompId}_${cleanRole}_${randomSuffix}`;
}

/**
 * #ЗАЧЕМ: Трансляция оцифрованного наследия в Гиперкуб AuraGroove.
 */
export function saveHeritageAxiom(db: Firestore, data: any, index: number = 0) {
    if (!db) return;
    
    try {
        const compositionId = data.compositionId || 'Unknown_Heritage';
        const role = data.role || 'melody';
        const axiomId = generateAxiomUid(compositionId, role);
        const newDocRef = doc(db, 'heritage_axioms', axiomId);

        const payload = {
            phrase: data.phrase || [],
            role: role,
            genre: Array.isArray(data.genre) ? data.genre : (data.genre ? [data.genre] : []),
            commonMood: Array.isArray(data.commonMood) ? data.commonMood : (data.commonMood ? [data.commonMood] : []),
            mood: Array.isArray(data.mood) ? data.mood : (data.mood ? [data.mood] : []),
            compositionId: compositionId,
            barOffset: data.barOffset ?? 0,
            bars: data.bars ?? null,
            noteCount: data.noteCount ?? null,
            vector: data.vector || { t: 0.5, b: 0.5, e: 0.5, h: 0.5 },
            origin: data.origin || 'Manual_Forge',
            tags: Array.isArray(data.tags) ? data.tags : [],
            narrative: data.narrative || "Heritage component.",
            nativeBpm: data.nativeBpm ?? data.bpm ?? null,
            nativeKey: data.nativeKey ?? data.key ?? null,
            nativeScale: data.nativeScale ?? data.scale ?? null,
            timeSignature: data.timeSignature ?? data.ts ?? null,
            ignored: data.ignored ?? false,
            preferredInstrument: data.preferredInstrument || null,
            timestamp: serverTimestamp()
        };

        setDoc(newDocRef, payload)
            .catch(async (serverError) => {
                const { timestamp, ...serializable } = payload;
                const permissionError = new FirestorePermissionError({
                    path: newDocRef.path,
                    operation: 'create',
                    requestResourceData: serializable,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    } catch (e) {}
}
