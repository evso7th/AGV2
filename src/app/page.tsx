
/**
 * @fileOverview Welcome Page V3.5 — "Embedded Marquee Update".
 * #ЗАЧЕМ: Перенос копирайта внутрь карточки под кнопку Start.
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
      
      {/* Marquee Animation Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { left: 100%; }
          100% { left: -100%; }
        }
        .animate-marquee-slow {
          position: absolute;
          white-space: nowrap;
          animation: marquee 30s linear infinite;
        }
      ` }} />

      <Card className="w-full max-w-sm shadow-2xl text-center border-primary/10 bg-card/80 backdrop-blur-sm relative z-10 overflow-hidden min-h-[500px] flex flex-col justify-center">
        
        {/* Анимация "Живое Ядро" - теперь строго внутри карточки */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 z-0 flex items-center justify-center"
          style={{ '--orbital-size': '320px' } as React.CSSProperties}
        >
           <OrbitalAnimation isPlaying={false} tempo={60} />
        </div>

        <CardHeader className="space-y-1 relative z-10 pt-8">
          <div className="mx-auto mb-4">
            <Image 
              src="/assets/icon8.jpeg" 
              alt="AuraGroove Logo" 
              width={64} 
              height={64} 
              className="rounded-full shadow-lg border-2 border-primary/20" 
            />
          </div>
          <div className="relative">
            <CardTitle className="font-headline text-2xl tracking-tight">
              {t('welcome_title')}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed pt-2">
              <span className="text-white">{t('welcome_desc_main')}</span><br />
              <span className="text-primary font-bold bg-transparent">{t('welcome_desc_orchestra')}</span><br />
              <span className="text-white opacity-60 text-[10px]">v 0.4.12 stream bridge pwa edition</span>
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow relative z-10">
          {/* Spacer for layout consistency */}
        </CardContent>

        <CardFooter className="pt-0 flex-col relative z-10 pb-12">
          <Button 
            onClick={handleStart} 
            className="w-full text-[11px] py-5 uppercase tracking-widest shadow-xl bg-primary hover:bg-primary/90" 
            disabled={!isClient}
          >
            <Music className="mr-2 h-4 w-4" />
            {t('btn_start')}
          </Button>
        </CardFooter>

        {/* Бегущая строка, притянутая к нижнему краю рамки карточки */}
        <div className="absolute bottom-4 left-0 right-0 h-4 overflow-hidden pointer-events-none select-none z-20">
          <div className="animate-marquee-slow text-[9px] opacity-40 uppercase tracking-tighter">
            © 2026 Eugene Somov · AuraGroove - Infinite Take Orchestra
          </div>
        </div>
      </Card>
    </main>
  );
}
