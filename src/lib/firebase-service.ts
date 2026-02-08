import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * #ЗАЧЕМ: Сохранение "Шедевра" (удачной музыкальной комбинации).
 * #ЧТО: Отправляет текущие параметры сюиты в Firestore. Использует неблокирующий вызов.
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
  const masterpiecesRef = collection(db, 'masterpieces');
  
  // #ЗАЧЕМ: Гарантированная сериализация.
  // Мы создаем чистый клон объекта данных, чтобы избежать передачи ссылок на внутренние стейты React.
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
  // Мы не используем await, чтобы не блокировать UI и позволить Firestore работать в фоне.
  addDoc(masterpiecesRef, payload)
    .catch(async (serverError) => {
      // #ЗАЧЕМ: Создание контекстной ошибки для LLM-отладки.
      // Это позволит точно увидеть, почему Firestore отклонил запрос.
      const permissionError = new FirestorePermissionError({
        path: masterpiecesRef.path,
        operation: 'create',
        requestResourceData: payload,
      });

      // #ЗАЧЕМ: Эмиссия ошибки через глобальный слушатель.
      // Ошибка будет перехвачена FirebaseErrorListener и отображена в оверлее.
      errorEmitter.emit('permission-error', permissionError);
    });
}
