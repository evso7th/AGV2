'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useDoc<T = DocumentData>(path: string) {
  const db = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const ref = doc(db, path);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        setData(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db, path]);

  return { data, loading, error };
}