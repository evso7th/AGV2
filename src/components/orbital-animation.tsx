"use client";
import React, { useEffect, useRef, useMemo, useState } from 'react';
import styles from './orbital-animation.module.css';
import { cn } from '@/lib/utils';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { useIsMobile } from '@/hooks/use-mobile';

interface OrbitalAnimationProps {
    isPlaying?: boolean;
    tempo?: number;
    tension?: number; // 0.1 - 1.0
    className?: string;
    size?: string;
}

/**
 * @fileOverview Orbital Animation V7.0 — "Mobile Lite Optimization".
 * #ЗАЧЕМ: ПЛАН №1400. Разделение тяжелой JS-реактивности и легкого мобильного рендера.
 * #ЧТО: Автономный CSS-пульс на мобильных вместо JS-триггеров.
 */
export function OrbitalAnimation({ isPlaying = false, tempo = 90, tension = 0.5, className, size }: OrbitalAnimationProps) {
  const planeRef = useRef<HTMLDivElement>(null);
  const { analyser } = useAudioEngine();
  const isMobile = useIsMobile();
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Скорость вращения орбит (зависит от Tension)
  const rotationDuration = useMemo(() => {
      const base = isPlaying ? 40 : 60;
      return base / (0.5 + tension * 1.5) + 's';
  }, [isPlaying, tension]);

  // Длительность пульса для мобильного CSS-цикла
  const pulseDuration = useMemo(() => {
    return (60 / (tempo || 90)) + 's';
  }, [tempo]);

  // Цвета и свечение
  const dynamicStyles = useMemo(() => {
      const hue = 250 + (tension * 80); 
      const saturation = 40 + (tension * 55); 
      const light = 35 + (tension * 30);      
      const glow = isMobile ? 8 + (tension * 30) : 15 + (tension * 85);       
      
      return {
          '--orbital-hue': hue,
          '--orbital-saturation': `${saturation}%`,
          '--orbital-lightness': `${light}%`,
          '--orbital-color': `hsl(${hue}, ${saturation}%, ${light}%)`,
          '--orbital-glow': `${glow}px`,
          '--orbital-size': size || '300px',
          '--pulse-play-state': isPlaying ? 'running' : 'paused',
          '--mobile-pulse-duration': pulseDuration
      } as React.CSSProperties;
  }, [tension, size, isPlaying, isMobile, pulseDuration]);

  // --- DESKTOP ONLY: IMPULSE LISTENER ---
  useEffect(() => {
    if (isMobile) return; // На мобилках не слушаем, крутимся сами

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
