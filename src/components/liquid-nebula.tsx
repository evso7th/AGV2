"use client";

import React, { useMemo } from 'react';
import styles from './liquid-nebula.module.css';
import { cn } from '@/lib/utils';
import type { Genre } from '@/types/music';

interface LiquidNebulaProps {
  genre: Genre;
  tension: number;
  className?: string;
  isReference?: boolean; // true = YaMus2.html, false = Pastel Fog
}

/**
 * @fileOverview Liquid Nebula V3.8 — "Flow Restoration Update".
 * #ЗАЧЕМ: вернуть перетекание цветов в обоих режимах.
 * #ЧТО: swap-цикл всегда активен; палитра цикла приходит через --sw-* из CSS.
 */
export function LiquidNebula({ genre, tension, className, isReference = false }: LiquidNebulaProps) {
  const colors = useMemo(() => {
    if (!isReference) {
      // Пастельная палитра на основе жанра (Sprout Protocol)
      // Точно такие же углы Hue, как в OrbitalAnimation
      const genreHues: Record<string, number> = {
        ambient: 260,   // Мистический Ирис
        psybient: 285,  // Астральный Пурпур
        blues: 334,     // 🌸 Пепельный Маув
        reggae: 150,    // Тропический Шалфей
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
      style={colors}
      data-mode={isReference ? "reference" : "pastel"}
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
        {/* Корона лучей — только в режиме Reference */}
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
