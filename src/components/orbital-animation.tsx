
"use client";
import React, { useEffect, useRef, useMemo } from 'react';
import styles from './orbital-animation.module.css';
import { cn } from '@/lib/utils';

interface OrbitalAnimationProps {
    isPlaying?: boolean;
    tempo?: number;
    tension?: number; // 0.1 - 1.0
    className?: string;
    size?: string;
}

/**
 * @fileOverview Orbital Animation V4.0 — "The Emotional Core".
 * #ЗАЧЕМ: Реакция на Tension — управление цветом, скоростью и свечением.
 */
export function OrbitalAnimation({ isPlaying = false, tempo = 90, tension = 0.5, className, size }: OrbitalAnimationProps) {
  const planeRef = useRef<HTMLDivElement>(null);

  // #ЗАЧЕМ: Маппинг напряжения на параметры анимации
  // Скорость: от 80с (ползком) до 20с (нормальный шаг).
  const duration = useMemo(() => {
      const base = isPlaying ? 40 : 60;
      return base / (0.5 + tension * 1.0) + 's';
  }, [isPlaying, tension]);

  // Цвета и свечение
  const dynamicStyles = useMemo(() => {
      const hue = 270 + (tension * 20); // Сдвиг от фиолетового к фуксии
      const saturation = 50 + (tension * 30);
      const light = 40 + (tension * 20);
      const glow = 20 + (tension * 60); // Интенсивность размытия тени
      
      return {
          '--orbital-color': `hsl(${hue}, ${saturation}%, ${light}%)`,
          '--orbital-glow': `${glow}px`,
          '--orbital-size': size || '300px'
      } as React.CSSProperties;
  }, [tension, size]);

  useEffect(() => {
    if (planeRef.current) {
        planeRef.current.style.animationDuration = duration;
    }
  }, [duration]);

  return (
    <div className={cn(styles.view, className)} style={dynamicStyles}>
      <div ref={planeRef} className={cn(styles.plane, styles.main)}>
        {Array.from({ length: 6 }).map((_, i) => (
            <div 
                key={i} 
                className={styles.circle}
                style={{ 
                    boxShadow: `0 0 var(--orbital-glow) var(--orbital-color), inset 0 0 var(--orbital-glow) var(--orbital-color)`,
                    borderColor: `hsla(270, 50%, 50%, ${0.2 + tension * 0.3})`
                }}
            ></div>
        ))}
      </div>
    </div>
  );
}
