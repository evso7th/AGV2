
import { collection, doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

/**
 * #ЗАЧЕМ: Сохранение "Шедевра" (удачной музыкальной комбинации).
 * #ЧТО: ПЛАН №734 — Добавлена визуальная обратная связь и поддержка Arbiter флага.
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
 * #ЗАЧЕМ: Сохранение системного документа в облако для консистентности AI-контекста.
 */
export function saveProjectDocument(db: Firestore, data: {
    filename: string;
    content: string;
    category?: 'protocol' | 'spec' | 'backlog' | 'contract';
    version?: string;
}) {
    const docId = data.filename.replace(/[^a-zA-Z0-9]/g, '_');
    const docRef = doc(db, 'project_documents', docId);
    
    const payload = {
        ...data,
        timestamp: serverTimestamp()
    };

    setDoc(docRef, payload)
        .then(() => {
            toast({ title: "Manifest Synchronized", description: `${data.filename} is now in the Cloud.` });
        })
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
 * #ЗАЧЕМ: Генерирую уникальный, но детерминированный ID для аксиомы.
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
 * #ЧТО: ПЛАН №838 — Добавлена поддержка флага ignored.
 */
export function saveHeritageAxiom(db: Firestore, data: any) {
    const compositionId = data.compositionId || 'Unknown_Heritage';
    const role = data.role || 'melody';
    const phrase = data.phrase || [];
    
    const axiomId = generateAxiomId(compositionId, role, phrase);
    const newDocRef = doc(db, 'heritage_axioms', axiomId);

    const payload = {
        phrase: phrase,
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
        timeSignature: data.timeSignature ?? data.ts ?? null,
        ignored: data.ignored ?? false,
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
