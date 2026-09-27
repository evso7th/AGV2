"use client";

import React, { useMemo, useEffect, useRef } from 'react';
import styles from './liquid-nebula.module.css';
import { cn } from '@/lib/utils';
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
 * @fileOverview Liquid Nebula V6.5 — "Pulse Removal".
 * #ЗАЧЕМ: Полное удаление привязки к музыкальному пульсу.
 */
export function LiquidNebula({ genre, tension, isPlaying = false, tempo = 75, className, isReference = false }: LiquidNebulaProps) {
  const isMobile = useIsMobile();

  // 1. Цвета и динамические переменные
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
      data-mobile={isMobile}
    >
      <div className={styles.scaler}>
        <div className={styles.soft}>
          <div className={styles.fluid}>
            {/* CENTRAL CORE */}
            <div className={styles.centralCore}>
                <i className={cn(styles.blob, styles.m, styles.m0)} />
            </div>

            {/* PERIPHERY */}
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
