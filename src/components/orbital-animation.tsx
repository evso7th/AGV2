
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
 * @fileOverview Orbital Animation V5.2 — "High Contrast Spectrum".
 * #ЗАЧЕМ: Расширение цветового диапазона для более заметной реакции на музыку.
 * #ЧТО: Hue shift увеличен до 80 градусов (Indigo -> Magenta).
 */
export function OrbitalAnimation({ isPlaying = false, tempo = 90, tension = 0.5, className, size }: OrbitalAnimationProps) {
  const planeRef = useRef<HTMLDivElement>(null);

  // Скорость вращения орбит (зависит от Tension)
  const rotationDuration = useMemo(() => {
      const base = isPlaying ? 40 : 60;
      return base / (0.5 + tension * 1.5) + 's';
  }, [isPlaying, tension]);

  // Длительность пульса ядра (BPM Sync: 60 / BPM = секунды на удар)
  const pulseDuration = useMemo(() => {
      return (60 / Math.max(30, tempo || 90)) + 's';
  }, [tempo]);

  // Цвета и свечение - РАСШИРЕННЫЙ СПЕКТР
  const dynamicStyles = useMemo(() => {
      // 250 (Indigo/Violet) -> 330 (Magenta/Hot Pink)
      const hue = 250 + (tension * 80); 
      const saturation = 40 + (tension * 55); // Глубокий рост насыщенности
      const light = 35 + (tension * 30);      // Заметный рост яркости
      const glow = 15 + (tension * 85);       // Экстремальное свечение на пиках
      
      return {
          '--orbital-hue': hue,
          '--orbital-saturation': `${saturation}%`,
          '--orbital-lightness': `${light}%`,
          '--orbital-color': `hsl(${hue}, ${saturation}%, ${light}%)`,
          '--orbital-glow': `${glow}px`,
          '--orbital-size': size || '300px',
          '--pulse-duration': pulseDuration,
          '--pulse-play-state': isPlaying ? 'running' : 'paused'
      } as React.CSSProperties;
  }, [tension, size, pulseDuration, isPlaying]);

  useEffect(() => {
    if (planeRef.current) {
        planeRef.current.style.animationDuration = rotationDuration;
    }
  }, [rotationDuration]);

  return (
    <div className={cn(styles.view, className)} style={dynamicStyles}>
      <div ref={planeRef} className={cn(styles.plane, styles.main)}>
        {Array.from({ length: 6 }).map((_, i) => (
            <div 
                key={i} 
                className={styles.circle}
                style={{ 
                    boxShadow: `0 0 var(--orbital-glow) var(--orbital-color), inset 0 0 var(--orbital-glow) var(--orbital-color)`,
                    borderColor: `hsla(var(--orbital-hue), var(--orbital-saturation), var(--orbital-lightness), ${0.1 + tension * 0.5})`
                }}
            ></div>
        ))}
      </div>
    </div>
  );
}
