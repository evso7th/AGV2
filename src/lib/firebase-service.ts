
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
 * #ЗАЧЕМ: Трансляция оцифрованного наследия в Гиперкуб AuraGroove.
 * #ЧТО: Сохраняет аксиому с векторными координатами и семантическими метками.
 * #ОБНОВЛЕНО (ПЛАН №531): Поддержка Hypercube API (vector, commonMood, compositionId).
 */
export function saveHeritageAxiom(db: Firestore, data: {
    phrase: number[];
    role: 'melody' | 'bass' | 'drums' | 'accomp';
    genre: string;
    commonMood: CommonMood;
    mood: string;
    compositionId: string;
    barOffset: number;
    vector: AxiomVector;
    origin: string;
    tags: string[];
}) {
    const heritageRef = collection(db, 'heritage_axioms');
    const newDocRef = doc(heritageRef);

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
