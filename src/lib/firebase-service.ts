
import { collection, doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * #ЗАЧЕМ: Сохранение "Шедевра" (удачной музыкальной комбинации).
 * #ЧТО: Отправляет текущие параметры сюиты в Firestore. 
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
 * #ЗАЧЕМ: Трансляция оцифрованного наследия в глобальную память.
 * #ЧТО: Сохраняет компактный лик (аксиому) в коллекцию heritage_axioms.
 * #СВЯЗИ: Вызывается из MIDI Alchemist Dashboard.
 */
export function saveHeritageAxiom(db: Firestore, data: {
    phrase: number[];
    dynasty: string;
    origin: string;
    tags: string[];
}) {
    const heritageRef = collection(db, 'heritage_axioms');
    const newDocRef = doc(heritageRef);

    const payload = {
        phrase: data.phrase,
        dynasty: data.dynasty,
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
