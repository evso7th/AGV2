'use client';

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Music } from 'lucide-react';
import Image from 'next/image';
import { useAudioEngine } from '@/contexts/audio-engine-context';

/**
 * #ЗАЧЕМ: Корневая страница приветствия.
 * #ЧТО: ПЛАН №2330 — Обновление бренда и версии системы до v3.0.
 */
export default function Home() {
  const router = useRouter();
  const { stopAllSounds } = useAudioEngine();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStart = () => {
    // #ЗАЧЕМ: Гарантированная тишина перед входом в систему.
    try {
        stopAllSounds();
    } catch(e) {}

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {
            // Игнорируем блокировки браузера
          });
        }
      }
    }
    router.push('/home');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-lg shadow-2xl text-center border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Image src="/assets/icon8.jpeg" alt="AuraGroove Logo" width={80} height={80} className="rounded-full shadow-lg border-2 border-primary/30" />
          </div>
          <CardTitle className="font-headline text-4xl text-primary">Welcome to AuraGroove</CardTitle>
          <CardDescription className="text-lg leading-relaxed">
            Your personal pure digital fractal music generator. 
            <br />
            <span className="text-sm font-black uppercase tracking-widest opacity-70">
              v 3.0 "The Infinite Take Orchestra"
            </span>
            <br />
            <span className="text-xs font-bold text-muted-foreground italic">
              Stream Bridge PWA Edition
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[60px] flex flex-col items-center justify-center">
          <p className="text-muted-foreground text-sm font-medium">
            Click the button below to start the experience.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleStart} className="w-full text-lg py-7 font-black uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all" disabled={!isClient}>
            <Music className="mr-3 h-6 w-6" />
            Start AuraGroove
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
