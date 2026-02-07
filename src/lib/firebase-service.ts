import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';

/**
 * #ЗАЧЕМ: Сохранение "Шедевра" (удачной музыкальной комбинации).
 * #ЧТО: Отправляет текущие параметры сюиты в Firestore.
 * #СВЯЗИ: Вызывается из хука useAuraGroove.
 */
export async function saveMasterpiece(db: Firestore, data: {
  seed: number;
  mood: string;
  genre: string;
  density: number;
  bpm: number;
  instrumentSettings: any;
}) {
  try {
    const masterpiecesRef = collection(db, 'masterpieces');
    await addDoc(masterpiecesRef, {
      ...data,
      timestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('[Memory] Failed to save masterpiece:', error);
    return false;
  }
}