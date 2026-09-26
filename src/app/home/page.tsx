
/**
 * @fileOverview Navigator Gateway Page V2.2 — "Orbital Removal".
 * #ЗАЧЕМ: ПЛАН №2500. Очистка загрузочного экрана от орбиталей.
 */
'use client';

import { useState, useEffect } from 'react';
import { AuraGrooveRoute } from '@/components/AuraGrooveRoute';
import { useAuraGroove } from '@/hooks/use-aura-groove';
import { LiquidNebula } from '@/components/liquid-nebula';
import { Dna } from 'lucide-react';

export default function NavigatorPage() {
  const auraGrooveProps = useAuraGroove();
  const { isPlaying, setIsPlaying, stopAllSounds } = auraGrooveProps;
  const [isWarmingUp, setIsWarmingUp] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWarmingUp(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (isPlaying) {
        setIsPlaying(false);
        stopAllSounds();
      }
    };
  }, [isPlaying, setIsPlaying, stopAllSounds]);

  if (isWarmingUp) {
    return (
      <div className="min-h-screen w-full bg-black">
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <LiquidNebula isPlaying={true} genre="ambient" tension={0.3} />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center animate-pulse">
              <Dna className="h-8 w-8 text-primary animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-primary font-black uppercase tracking-[0.3em] text-sm animate-pulse">Analyzing DNA</h2>
              <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-0 sm:p-6 bg-background">
       <div className="w-full sm:w-[360px] h-screen sm:h-[680px] border-0 sm:border rounded-none sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl bg-card text-card-foreground">
            <AuraGrooveRoute {...auraGrooveProps} />
      </div>
    </main>
  );
}
