
import { collection, doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * #ЗАЧЕМ: Сохранение "Шедевра" (удачной музыкальной комбинации).
 * #ЧТО: Отправляет текущие параметры сюиты в Firestore. 
 *       Использует детерминированный путь через setDoc для обхода ошибок прав.
 * #СВЯЗИ: Вызывается из хука useAuraGroove.
 */
export function saveMasterpiece(db: Firestore, data: {
  seed: number;
  mood: string;
  genre: string;
  density: number;
  bpm: number;
  instrumentSettings: any;
}) {
  // #ЗАЧЕМ: Гарантированный путь masterpieces/{id}.
  // Мы создаем ссылку на новый документ в коллекции, чтобы SDK сгенерировал ID на клиенте.
  const masterpiecesRef = collection(db, 'masterpieces');
  const newDocRef = doc(masterpiecesRef);

  // #ЗАЧЕМ: Гарантированная сериализация.
  // Мы создаем чистый клон объекта данных.
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

  // #ЗАЧЕМ: Соблюдение правила "Avoid Awaiting Mutation Calls".
  // Используем setDoc с явно созданной ссылкой.
  setDoc(newDocRef, payload)
    .catch(async (serverError) => {
      // #ЗАЧЕМ: Создание контекстной ошибки для диагностики.
      const permissionError = new FirestorePermissionError({
        path: newDocRef.path,
        operation: 'create',
        requestResourceData: payload,
      });

      // Эмиссия ошибки через глобальный слушатель.
      errorEmitter.emit('permission-error', permissionError);
    });
}
