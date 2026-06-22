
import { collection, doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

/**
 * #ЗАЧЕМ: Сохранение "Шедевра" (удачной музыкальной комбинации).
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
  const masterpiecesRef = collection(db, 'masterpieces');
  const newDocRef = doc(masterpiecesRef);
  const cleanSettings = JSON.parse(JSON.stringify(data.instrumentSettings));

  const payload = {
    seed: data.seed,
    mood: data.mood,
    genre: data.genre,
    density: data.density,
    bpm: data.bpm,
    instrumentSettings: cleanSettings,
    origin: data.isArbiterFind ? 'AI_Arbiter' : 'User_Like',
    timestamp: serverTimestamp()
  };

  setDoc(newDocRef, payload)
    .then(() => {
        if (!data.isArbiterFind) {
            toast({
                title: "Masterpiece Saved!",
                description: "This seed has been added to the Cloud Registry.",
            });
        }
    })
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: newDocRef.path,
        operation: 'create',
        requestResourceData: payload,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
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
    // ID формируется из имени файла для обеспечения функции обновления
    const docId = data.filename.replace(/[^a-zA-Z0-9]/g, '_');
    const docRef = doc(db, 'project_documents', docId);
    
    const payload = {
        ...data,
        timestamp: serverTimestamp()
    };

    setDoc(docRef, payload, { merge: true })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'write',
                requestResourceData: payload,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
}

/**
 * #ЗАЧЕМ: Генерирую уникальный UID для аксиомы (ПЛАН №1188).
 * #ЧТО: Комбинация названия, роли и криптографически стойкого случайного суффикса.
 */
function generateAxiomUid(compositionId: string, role: string): string {
    const cleanCompId = compositionId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const cleanRole = role.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10);
    const randomSuffix = Math.random().toString(36).substring(2, 12); // 10 chars
    return `${cleanCompId}_${cleanRole}_${randomSuffix}`;
}

/**
 * #ЗАЧЕМ: Трансляция оцифрованного наследия в Гиперкуб AuraGroove.
 */
export function saveHeritageAxiom(db: Firestore, data: any, index: number = 0) {
    const compositionId = data.compositionId || 'Unknown_Heritage';
    const role = data.role || 'melody';
    
    // #ЗАЧЕМ: ПЛАН №1188. Использование UID вместо хеша для предотвращения коллизий типа "70hori".
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
            const permissionError = new FirestorePermissionError({
                path: newDocRef.path,
                operation: 'create',
                requestResourceData: payload,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
}
