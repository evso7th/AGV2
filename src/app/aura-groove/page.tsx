
'use client';

import { AuraGrooveV2 } from '@/components/aura-groove-v2';
import { useAuraGroove } from '@/hooks/use-aura-groove';
import LoadingDots from '@/components/ui/loading-dots';

export default function AuraGrooveUIPage() {
  const auraGrooveProps = useAuraGroove();

  if (auraGrooveProps.isInitializing) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-background">
        <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-headline text-primary">AuraGroove</h1>
            <LoadingDots />
            <p className="text-muted-foreground">{auraGrooveProps.loadingText}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-background">
       <div className="w-[320px] h-[600px] border rounded-lg flex flex-col overflow-hidden shadow-2xl bg-card text-card-foreground">
        <AuraGrooveV2 {...auraGrooveProps} />
      </div>
    </main>
  );
}
