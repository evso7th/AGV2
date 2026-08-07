"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import styles from './liquid-nebula.module.css';
import { cn } from '@/lib/utils';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Genre } from '@/types/music';

interface LiquidNebulaProps {
  genre: Genre;
  tension: number;
  isPlaying?: boolean;
  tempo?: number;
  className?: string;
  isReference?: boolean; // true = YaMus2.html (Pure), false = Hybrid Fog
}

/**
 * @fileOverview Liquid Nebula V6.1 — "Strict Core Pulse Sync".
 * #ЗАЧЕМ: ПЛАН №1470. Удаление бесконечных анимаций. Пульсация только по MIDI-событию.
 */
export function LiquidNebula({ genre, tension, isPlaying = false, tempo = 75, className, isReference = false }: LiquidNebulaProps) {
  const { analyser } = useAudioEngine();
  const isMobile = useIsMobile();
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // 1. Музыкальная пульсация (Event Listener - Now for all devices)
  useEffect(() => {
    const onPulse = (e: any) => {
        if (!isPlaying) return;
        
        const hitTime = e.detail.time;
        const audioContext = analyser?.context;
        if (!audioContext) return;

        const now = audioContext.currentTime;
        const delay = (hitTime - now) * 1000;
        
        if (delay > -50) {
            const t = setTimeout(() => {
                setIsPulsing(true);
                const t2 = setTimeout(() => setIsPulsing(false), 120);
                pulseTimeoutsRef.current.push(t2);
            }, Math.max(0, delay));
            pulseTimeoutsRef.current.push(t);
        }
    };
    
    window.addEventListener('AG_CORE_PULSE', onPulse);
    return () => {
        window.removeEventListener('AG_CORE_PULSE', onPulse);
        pulseTimeoutsRef.current.forEach(clearTimeout);
        pulseTimeoutsRef.current = [];
    };
  }, [isPlaying, analyser]);

  // 2. Цвета и динамические переменные
  const dynamicStyles = useMemo(() => {
    if (!isReference) {
      const genreHues: Record<string, number> = {
        ambient: 260,   
        psybient: 285,  
        blues: 334,     
        reggae: 150,    
      };
      const hue = genreHues[genre as string] || 260;
      const s = 25 + tension * 10;
      const l = 35 + tension * 15;
      return {
        '--color-m': `hsl(${hue}, ${s}%, ${l}%)`,
        '--color-p': `hsl(${hue + 25}, ${s - 5}%, ${l - 5}%)`,
        '--color-y': `hsl(${hue - 25}, ${s + 5}%, ${l + 5}%)`,
        '--color-r': `hsl(${hue}, 15%, 70%)`,
        '--color-o': `hsl(${hue + 40}, ${s}%, ${l - 10}%)`,
      } as React.CSSProperties;
    }
    return {} as React.CSSProperties;
  }, [genre, tension, isReference]);

  return (
    <div
      className={cn(styles.container, className)}
      style={dynamicStyles}
      data-mode={isReference ? "reference" : "pastel"}
      data-pulsing={isPulsing}
      data-mobile={isMobile}
    >
      <div className={styles.scaler}>
        <div className={styles.soft}>
          <div className={styles.fluid}>
            {/* CENTRAL CORE: Единственный элемент, который пульсирует */}
            <div className={styles.centralCore}>
                <i className={cn(styles.blob, styles.m, styles.m0)} />
            </div>

            {/* PERIPHERY: Стабильное движение */}
            <i className={cn(styles.blob, styles.m, styles.m1)} />
            <i className={cn(styles.blob, styles.m, styles.m2)} />
            <i className={cn(styles.blob, styles.m, styles.m3)} />
            <i className={cn(styles.blob, styles.m, styles.m4)} />
            <i className={cn(styles.blob, styles.p, styles.p1)} />
            <i className={cn(styles.blob, styles.rim, styles.r1)} />
            <i className={cn(styles.blob, styles.rim, styles.r2)} />
            <i className={cn(styles.blob, styles.rim, styles.r3)} />
            <i className={cn(styles.blob, styles.y, styles.y1)} />
            <i className={cn(styles.blob, styles.y, styles.y2)} />
            <i className={cn(styles.blob, styles.y, styles.y3)} />
            <i className={cn(styles.blob, styles.o, styles.o1)} />
          </div>
        </div>
        {isReference && (
          <>
            <div className={cn(styles.rays, styles.corA)} />
            <div className={cn(styles.rays, styles.corB)} />
            <div className={cn(styles.rays, styles.whisk)} />
          </>
        )}
      </div>
    </div>
  );
}
