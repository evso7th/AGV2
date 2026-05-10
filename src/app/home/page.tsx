
'use client';

import { AuraGrooveRoute } from '@/components/AuraGrooveRoute';
import { useAuraGroove } from '@/hooks/use-aura-groove';

/**
 * #ЗАЧЕМ: Главная страница для простых пользователей (Navigator).
 * #ЧТО: ПЛАН №1675 — Хук инициализируется в режиме Навигатора.
 */
export default function NavigatorPage() {
  const auraGrooveProps = useAuraGroove({ isNavigatorMode: true });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-0 sm:p-6 bg-background">
       <div className="w-full sm:w-[360px] h-screen sm:h-[680px] border-0 sm:border rounded-none sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl bg-card text-card-foreground">
            <AuraGrooveRoute {...auraGrooveProps} />
      </div>
    </main>
  );
}
