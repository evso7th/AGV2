/**
 * @fileOverview Welcome Page V3.1 — "Mobile Compact Optimization".
 * #ЗАЧЕМ: Уменьшение шрифтов и отступов для идеального отображения на мобильных экранах.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Music } from 'lucide-react';
import Image from 'next/image';
import { useAuraGroove } from '@/hooks/use-aura-groove';

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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground">
      <Card className="w-full max-w-sm shadow-2xl text-center border-primary/10">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-2">
            <Image 
              src="/assets/icon8.jpeg" 
              alt="AuraGroove Logo" 
              width={64} 
              height={64} 
              className="rounded-full shadow-lg border-2 border-primary/20" 
            />
          </div>
          <CardTitle className="font-headline text-2xl tracking-tight">
            {t('welcome_title')}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed pt-1">
            <span className="text-white">{t('welcome_desc_main')}</span><br />
            <span className="text-primary font-bold bg-transparent">{t('welcome_desc_orchestra')}</span><br />
            <span className="text-white opacity-90 text-[10px]">v 0.3.62 stream bridge pwa edition</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-0 py-1 flex flex-col items-center justify-center">
          {/* Контент минимизирован для подтяжки кнопки вверх */}
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            onClick={handleStart} 
            className="w-full text-[11px] py-5 uppercase tracking-widest shadow-xl" 
            disabled={!isClient}
          >
            <Music className="mr-2 h-4 w-4" />
            {t('btn_start')}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
