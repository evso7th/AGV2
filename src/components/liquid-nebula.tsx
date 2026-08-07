
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
  isReference?: boolean; // true = YaMus2.html, false = Pastel Fog
}

/**
 * @fileOverview Liquid Nebula V4.0 — "Pulse Reactive Update".
 * #ЗАЧЕМ: Реализация пульсации, идентичной OrbitalAnimation.
 */
export function LiquidNebula({ genre, tension, isPlaying = false, tempo = 75, className, isReference = false }: LiquidNebulaProps) {
  const { analyser } = useAudioEngine();
  const isMobile = useIsMobile();
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // 1. Музыкальная пульсация (Event Listener)
  useEffect(() => {
    if (isMobile) return; 

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
  }, [isPlaying, analyser, isMobile]);

  // 2. Цвета и динамические переменные
  const colors = useMemo(() => {
    const pulseDuration = (60 / (tempo || 75)) + 's';
    
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
        '--pulse-play-state': isPlaying ? 'running' : 'paused',
        '--mobile-pulse-duration': pulseDuration
      } as React.CSSProperties;
    }
    return {
        '--pulse-play-state': isPlaying ? 'running' : 'paused',
        '--mobile-pulse-duration': pulseDuration
    } as React.CSSProperties;
  }, [genre, tension, isReference, isPlaying, tempo]);

  return (
    <div
      className={cn(styles.container, className)}
      style={colors}
      data-mode={isReference ? "reference" : "pastel"}
      data-pulsing={isPulsing}
      data-mobile={isMobile}
    >
      <div className={styles.scaler}>
        <div className={styles.soft}>
          <div className={styles.fluid}>
            <i className={cn(styles.blob, styles.m, styles.m0)} />
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
