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
 * #ЧТО: Сохраняет аксиому с использованием детерминированного ID для защиты от дубликатов.
 * #ОБНОВЛЕНО (ПЛАН №661): Поддержка множественных жанров и настроений.
 */
export function saveHeritageAxiom(db: Firestore, data: {
    phrase: number[];
    role: 'melody' | 'bass' | 'drums' | 'accomp';
    genre: string[];
    commonMood: CommonMood[];
    mood: string[];
    compositionId: string;
    barOffset: number;
    vector: AxiomVector;
    origin: string;
    tags: string[];
    narrative: string;
    nativeBpm?: number;
    nativeKey?: string;
    timeSignature?: string;
}) {
    const axiomId = generateAxiomId(data.compositionId, data.role, data.phrase);
    const newDocRef = doc(db, 'heritage_axioms', axiomId);

    const payload = {
        phrase: data.phrase,
        role: data.role,
        genre: data.genre,
        commonMood: data.commonMood,
        mood: data.mood,
        compositionId: data.compositionId,
        barOffset: data.barOffset,
        vector: data.vector,
        origin: data.origin,
        tags: data.tags,
        narrative: data.narrative,
        nativeBpm: data.nativeBpm || null,
        nativeKey: data.nativeKey || null,
        timeSignature: data.timeSignature || null,
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