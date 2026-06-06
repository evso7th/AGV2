
'use client';

import { useEffect } from 'react';
import { AuraGrooveRoute } from '@/components/AuraGrooveRoute';
import { useAuraGroove } from '@/hooks/use-aura-groove';

/**
 * #ЗАЧЕМ: Главная страница для простых пользователей (Navigator).
 * #ЧТО: ПЛАН №1235 — Выделенный роут для простого интерфейса.
 * #ОБНОВЛЕНО (ПЛАН №96): Добавлена принудительная остановка музыки при уходе.
 */
export default function NavigatorPage() {
  const auraGrooveProps = useAuraGroove();
  const { isPlaying, setIsPlaying, stopAllSounds } = auraGrooveProps;

  // #ЗАЧЕМ: Остановка музыки при уходе со страницы навигатора.
  useEffect(() => {
    return () => {
      // Это сработает при размонтировании компонента (уход со страницы)
      // Гарантирует, что сессия завершается при переходе "Домой" или закрытии.
      if (isPlaying) {
        setIsPlaying(false);
        stopAllSounds();
      }
    };
  }, [isPlaying, setIsPlaying, stopAllSounds]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-0 sm:p-6 bg-background">
       <div className="w-full sm:w-[360px] h-screen sm:h-[680px] border-0 sm:border rounded-none sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl bg-card text-card-foreground">
            <AuraGrooveRoute {...auraGrooveProps} />
      </div>
    </main>
  );
}
