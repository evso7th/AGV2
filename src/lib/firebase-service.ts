import { collection, doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { AxiomVector, CommonMood } from '@/types/fractal';

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

/**
 * #ЗАЧЕМ: Генерация уникального, но детерминированного ID для аксиомы.
 * #ЧТО: Предотвращает дубликаты на уровне базы данных.
 */
function generateAxiomId(compositionId: string, role: string, phrase: number[]): string {
    const content = `${compositionId}_${role}_${phrase.join(',')}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        hash = ((hash << 5) - hash) + content.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    const cleanCompId = compositionId.replace(/[^a-zA-Z0-9]/g, '_');
    return `${cleanCompId}_${role}_${Math.abs(hash).toString(36)}`;
}

/**
 * #ЗАЧЕМ: Трансляция оцифрованного наследия в Гиперкуб AuraGroove.
 * #ЧТО: ПЛАН №685 — Тотальная защита от undefined. Все поля проверяются перед setDoc.
 */
export function saveHeritageAxiom(db: Firestore, data: any) {
    const compositionId = data.compositionId || 'Unknown_Heritage';
    const role = data.role || 'melody';
    const phrase = data.phrase || [];
    
    const axiomId = generateAxiomId(compositionId, role, phrase);
    const newDocRef = doc(db, 'heritage_axioms', axiomId);

    // #ЗАЧЕМ: Firestore не принимает undefined. Обеспечиваем наличие всех полей.
    const payload = {
        phrase: phrase,
        role: role,
        genre: Array.isArray(data.genre) ? data.genre : (data.genre ? [data.genre] : []),
        commonMood: Array.isArray(data.commonMood) ? data.commonMood : (data.commonMood ? [data.commonMood] : []),
        mood: Array.isArray(data.mood) ? data.mood : (data.mood ? [data.mood] : []),
        compositionId: compositionId,
        barOffset: data.barOffset ?? 0,
        vector: data.vector || { t: 0.5, b: 0.5, e: 0.5, h: 0.5 },
        origin: data.origin || 'Manual_Forge',
        tags: Array.isArray(data.tags) ? data.tags : [],
        narrative: data.narrative || "Heritage component.",
        nativeBpm: data.nativeBpm ?? data.bpm ?? null,
        nativeKey: data.nativeKey ?? data.key ?? null,
        timeSignature: data.timeSignature ?? data.ts ?? null,
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