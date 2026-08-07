"use client";
import React, { useEffect, useRef, useMemo, useState } from 'react';
import styles from './orbital-animation.module.css';
import { cn } from '@/lib/utils';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Genre } from '@/types/music';

interface OrbitalAnimationProps {
    isPlaying?: boolean;
    tempo?: number;
    tension?: number; // 0.1 - 1.0
    genre?: Genre;    // #ЗАЧЕМ: Управление жанровой палитрой
    className?: string;
    size?: string;
}

/**
 * @fileOverview Orbital Animation V8.2 — "Strict Pulse Sync".
 * #ЗАЧЕМ: ПЛАН №1470. Удаление автономных циклов. Пульс только по событию.
 */
export function OrbitalAnimation({ 
    isPlaying = false, 
    tempo = 90, 
    tension = 0.5, 
    genre = 'ambient', 
    className, 
    size 
}: OrbitalAnimationProps) {
  const planeRef = useRef<HTMLDivElement>(null);
  const { analyser } = useAudioEngine();
  const isMobile = useIsMobile();
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // 1. Определение базового тона (Hue) по жанру
  const hue = useMemo(() => {
    const genreHues: Record<string, number> = {
        ambient: 260,
        psybient: 285,
        blues: 334,
        reggae: 150
    };
    return genreHues[genre as string] || 260;
  }, [genre]);

  const saturation = useMemo(() => 25 + (tension * 10), [tension]);
  const lightness = useMemo(() => 40 + (tension * 15), [tension]);

  const rotationDuration = useMemo(() => {
      const base = isPlaying ? 40 : 60;
      return base / (0.5 + tension * 1.5) + 's';
  }, [isPlaying, tension]);

  const dynamicStyles = useMemo(() => {
      const glow = isMobile ? 8 + (tension * 20) : 15 + (tension * 60);       
      
      return {
          '--aura-hue': hue,
          '--aura-sat': `${saturation}%`,
          '--aura-light': `${lightness}%`,
          '--orbital-color': `hsl(${hue}, ${saturation}%, ${lightness}%)`,
          '--orbital-glow': `${glow}px`,
          '--orbital-size': size || '300px',
      } as React.CSSProperties;
  }, [hue, saturation, lightness, tension, size, isMobile]);

  // --- UNIFIED PULSE LISTENER (NO MOBILE BYPASS) ---
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

  useEffect(() => {
    if (planeRef.current) {
        planeRef.current.style.animationDuration = rotationDuration;
    }
  }, [rotationDuration]);

  return (
    <div 
        className={cn(styles.view, className)} 
        style={dynamicStyles}
        data-pulsing={isPulsing}
        data-mobile={isMobile}
    >
      <div ref={planeRef} className={cn(styles.plane, styles.main)}>
        {Array.from({ length: 6 }).map((_, i) => (
            <div 
                key={i} 
                className={styles.circle}
            ></div>
        ))}
      </div>
    </div>
  );
}
