'use client';

import { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  Query, 
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useCollection<T = DocumentData>(collectionPath: string) {
  const db = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const ref = collection(db, collectionPath);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db, collectionPath]);

  return { data, loading, error };
}