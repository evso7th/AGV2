
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Music } from 'lucide-react';
import Image from 'next/image';

/**
 * #ЗАЧЕМ: Корневая страница.
 * #ЧТО: ПЛАН №1235 — Теперь ведет в /home по умолчанию.
 */
export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStart = () => {
    router.push('/home');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-lg shadow-2xl text-center border-primary/10">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Image src="/assets/icon8.jpeg" alt="AuraGroove Logo" width={80} height={80} className="rounded-full shadow-lg border-2 border-primary/20" />
          </div>
          <CardTitle className="font-headline text-4xl tracking-tight">Welcome to AuraGroove</CardTitle>
          <CardDescription className="text-lg leading-relaxed pt-2">
            <span className="text-white">Your personal digital live-music generator.</span><br />
            <span className="text-primary font-bold bg-transparent">The Infinite Take Orchestra</span><br />
            <span className="text-white opacity-90">v 0.3.62 stream bridge pwa edition</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[60px] flex flex-col items-center justify-center">
          <p className="text-muted-foreground min-h-[20px]">
            Click the button below to start the experience.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleStart} className="w-full text-sm py-6 uppercase tracking-widest shadow-xl" disabled={!isClient}>
            <Music className="mr-2 h-5 w-5" />
            Start AuraGroove
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
