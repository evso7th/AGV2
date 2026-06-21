
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Music } from 'lucide-react';
import Image from 'next/image';

/**
 * #ЗАЧЕМ: Корневая страница.
 * #ЧТО: ПЛАН №1262 — Ребрендинг стартового текста: The Infinite Take Orchestra.
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
      <Card className="w-full max-w-lg shadow-2xl text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Image src="/assets/icon8.jpeg" alt="AuraGroove Logo" width={80} height={80} className="rounded-full" />
          </div>
          <CardTitle className="font-headline text-4xl">Welcome to AuraGroove</CardTitle>
          <CardDescription className="text-lg text-white mt-2">
            Your personal digital live-music generator. <br />
            <span className="text-primary font-bold">The Infinite Take Orchestra</span> <br />
            v 0.3.62 stream bridge pwa edition
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[60px] flex flex-col items-center justify-center">
          <p className="text-muted-foreground min-h-[20px]">
            Click the button below to start the experience.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleStart} className="w-full text-lg py-6" disabled={!isClient}>
            <Music className="mr-2 h-6 w-6" />
            Start AuraGroove
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
