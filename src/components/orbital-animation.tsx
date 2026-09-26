"use client";
import React, { useEffect, useRef, useMemo } from 'react';
import styles from './orbital-animation.module.css';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Genre } from '@/types/music';

interface OrbitalAnimationProps {
    isPlaying?: boolean;
    tempo?: number;
    tension?: number; // 0.1 - 1.0
    genre?: Genre;    
    className?: string;
    size?: string;
}

/**
 * @fileOverview Orbital Animation V9.0 — "Radiant Core".
 * #ЗАЧЕМ: Усиление параметров свечения для визуальной глубины.
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
  const isMobile = useIsMobile();

  const hue = useMemo(() => {
    const genreHues: Record<string, number> = {
        ambient: 260,
        psybient: 285,
        blues: 334,
        reggae: 150
    };
    return genreHues[genre as string] || 260;
  }, [genre]);

  const saturation = useMemo(() => 40 + (tension * 20), [tension]); // Больше насыщенности
  const lightness = useMemo(() => 50 + (tension * 20), [tension]);   // Больше яркости

  const rotationDuration = useMemo(() => {
      const base = isPlaying ? 40 : 60;
      return base / (0.5 + tension * 1.5) + 's';
  }, [isPlaying, tension]);

  const dynamicStyles = useMemo(() => {
      // #ЗАЧЕМ: ПЛАН №2515. Радикальное увеличение радиуса блюра.
      const glow = isMobile ? 12 + (tension * 30) : 25 + (tension * 80);       
      
      return {
          '--aura-hue': hue,
          '--aura-sat': `${saturation}%`,
          '--aura-light': `${lightness}%`,
          '--orbital-color': `hsl(${hue}, ${saturation}%, ${lightness}%)`,
          '--orbital-glow': `${glow}px`,
          '--orbital-size': size || '300px',
      } as React.CSSProperties;
  }, [hue, saturation, lightness, tension, size, isMobile]);

  useEffect(() => {
    if (planeRef.current) {
        planeRef.current.style.animationDuration = rotationDuration;
    }
  }, [rotationDuration]);

  return (
    <div 
        className={cn(styles.view, className)} 
        style={dynamicStyles}
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
