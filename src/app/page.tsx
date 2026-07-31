
/**
 * @fileOverview Welcome Page V3.2 — "The Living Core".
 * #ЗАЧЕМ: Интеграция 3D OrbitalAnimation для создания футуристического облика.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Music } from 'lucide-react';
import Image from 'next/image';
import { useAuraGroove } from '@/hooks/use-aura-groove';
import { OrbitalAnimation } from '@/components/orbital-animation';

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { t } = useAuraGroove();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStart = () => {
    router.push('/home');
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground overflow-hidden">
      
      {/* Глобальная фоновая анимация (за картой) */}
      <div className="absolute inset-0 pointer-events-none opacity-20 scale-150">
         <OrbitalAnimation isPlaying={false} tempo={30} />
      </div>

      <Card className="w-full max-w-sm shadow-2xl text-center border-primary/10 bg-card/80 backdrop-blur-sm relative z-10 overflow-hidden">
        <CardHeader className="space-y-1 relative">
          
          {/* Анимация "Живое Ядро" за логотипом */}
          <div className="absolute top-[-10%] left-0 w-full h-[120%] pointer-events-none opacity-60 z-0">
             <OrbitalAnimation isPlaying={false} tempo={60} />
          </div>

          <div className="mx-auto mb-2 relative z-10">
            <Image 
              src="/assets/icon8.jpeg" 
              alt="AuraGroove Logo" 
              width={64} 
              height={64} 
              className="rounded-full shadow-lg border-2 border-primary/20" 
            />
          </div>
          <div className="relative z-10">
            <CardTitle className="font-headline text-2xl tracking-tight">
              {t('welcome_title')}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed pt-1">
              <span className="text-white">{t('welcome_desc_main')}</span><br />
              <span className="text-primary font-bold bg-transparent">{t('welcome_desc_orchestra')}</span><br />
              <span className="text-white opacity-90 text-[10px]">v 0.3.62 stream bridge pwa edition</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 py-1 flex flex-col items-center justify-center relative z-10">
          {/* Контент минимизирован для подтяжки кнопки вверх */}
        </CardContent>
        <CardFooter className="pt-0 flex-col relative z-10">
          <Button 
            onClick={handleStart} 
            className="w-full text-[11px] py-5 uppercase tracking-widest shadow-xl bg-primary hover:bg-primary/90" 
            disabled={!isClient}
          >
            <Music className="mr-2 h-4 w-4" />
            {t('btn_start')}
          </Button>
          <div className="mt-8 text-[9px] opacity-40 uppercase tracking-tighter whitespace-nowrap">
            © 2026 Eugene Somov · AuraGroove - Infinite Take Orchestra
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
