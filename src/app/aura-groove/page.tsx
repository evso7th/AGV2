
'use client';

import { useEffect, useRef } from 'react';
import { AuraGrooveV2 } from '@/components/aura-groove-v2';
import { useAuraGroove } from '@/hooks/use-aura-groove';

/**
 * #ЗАЧЕМ: Страница профессионального интерфейса.
 * #ЧТО: ПЛАН №1182 — Оптимизация эффекта очистки для предотвращения автопауз.
 */
export default function ExpertUIPage() {
  const auraGrooveProps = useAuraGroove();
  const { isPlaying, setIsPlaying, stopAllSounds } = auraGrooveProps;

  // Используем ref для стабильного отслеживания состояния проигрывания в эффекте очистки
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (isPlayingRef.current) {
        setIsPlaying(false);
        stopAllSounds();
      }
    };
  }, [setIsPlaying, stopAllSounds]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-0 sm:p-6 bg-background">
       <div className="w-full sm:w-[360px] h-screen sm:h-[680px] border-0 sm:border rounded-none sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl bg-card text-card-foreground">
            <AuraGrooveV2 {...auraGrooveProps} />
      </div>
    </main>
  );
}
