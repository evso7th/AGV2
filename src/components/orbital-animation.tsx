"use client";
import React, { useEffect, useRef, useMemo, useState } from 'react';
import styles from './orbital-animation.module.css';
import { cn } from '@/lib/utils';
import { useAudioEngine } from '@/contexts/audio-engine-context';

interface OrbitalAnimationProps {
    isPlaying?: boolean;
    tempo?: number;
    tension?: number; // 0.1 - 1.0
    className?: string;
    size?: string;
}

/**
 * @fileOverview Orbital Animation V6.0 — "Synesthetic Heart".
 * #ЗАЧЕМ: Реализация ПЛАНА №1335. Визуальный отклик на удары бочки и баса.
 * #ЧТО: Подписка на AG_CORE_PULSE и управление состоянием импульса.
 */
export function OrbitalAnimation({ isPlaying = false, tempo = 90, tension = 0.5, className, size }: OrbitalAnimationProps) {
  const planeRef = useRef<HTMLDivElement>(null);
  const { analyser } = useAudioEngine();
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Скорость вращения орбит (зависит от Tension)
  const rotationDuration = useMemo(() => {
      const base = isPlaying ? 40 : 60;
      return base / (0.5 + tension * 1.5) + 's';
  }, [isPlaying, tension]);

  // Цвета и свечение - РАСШИРЕННЫЙ СПЕКТР
  const dynamicStyles = useMemo(() => {
      const hue = 250 + (tension * 80); 
      const saturation = 40 + (tension * 55); 
      const light = 35 + (tension * 30);      
      const glow = 15 + (tension * 85);       
      
      return {
          '--orbital-hue': hue,
          '--orbital-saturation': `${saturation}%`,
          '--orbital-lightness': `${light}%`,
          '--orbital-color': `hsl(${hue}, ${saturation}%, ${light}%)`,
          '--orbital-glow': `${glow}px`,
          '--orbital-size': size || '300px',
          '--pulse-play-state': isPlaying ? 'running' : 'paused'
      } as React.CSSProperties;
  }, [tension, size, isPlaying]);

  // --- IMPULSE LISTENER (PLAN №1335) ---
  useEffect(() => {
    const onPulse = (e: any) => {
        if (!isPlaying) return;
        
        const hitTime = e.detail.time;
        const audioContext = analyser?.context;
        if (!audioContext) return;

        const now = audioContext.currentTime;
        const delay = (hitTime - now) * 1000;
        
        // Планируем визуальную вспышку в будущем (синхронно со звуком)
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
    >
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
