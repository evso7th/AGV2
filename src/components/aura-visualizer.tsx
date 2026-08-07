
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { OrbitalAnimation } from './orbital-animation';
import { LiquidNebula } from './liquid-nebula';
import { cn } from '@/lib/utils';
import type { Genre } from '@/types/music';

type ViewMode = 'orbital' | 'hybrid'; // Режим 'nebula' удален

interface AuraVisualizerProps {
    genre: Genre;
    tension: number;
    isPlaying: boolean;
    tempo: number;
    size?: string;
    className?: string;
}

/**
 * @fileOverview Aura Visualizer V1.2 — "Ensemble Focus".
 * #ЗАЧЕМ: Исключение режима Nebula (только блобы) из ротации.
 * #ЧТО: ПЛАН №1470 — Цикл теперь только Orbital <-> Hybrid. Hybrid — дефолт.
 */
export function AuraVisualizer({ genre, tension, isPlaying, tempo, size, className }: AuraVisualizerProps) {
    const [mode, setMode] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('AG_ViewMode') as ViewMode;
            // Если в кэше был старый режим 'nebula', сбрасываем на 'hybrid'
            if (saved === 'orbital' || saved === 'hybrid') return saved;
            return 'hybrid'; 
        }
        return 'hybrid';
    });

    const [feedback, setFeedback] = useState<string | null>(null);

    const handleCycleMode = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setMode(prev => {
            // Переключаемся только между двумя режимами
            const next: ViewMode = prev === 'orbital' ? 'hybrid' : 'orbital';
            localStorage.setItem('AG_ViewMode', next);
            setFeedback(next.toUpperCase());
            return next;
        });
    }, []);

    useEffect(() => {
        if (feedback) {
            const t = setTimeout(() => setFeedback(null), 1500);
            return () => clearTimeout(t);
        }
    }, [feedback]);

    return (
        <div 
            className={cn("relative cursor-pointer select-none", className)} 
            onDoubleClick={handleCycleMode}
            style={{ width: size || '100%', height: size || '100%' }}
        >
            {/* Layer 1: Nebula (Отображается только в режиме Hybrid) */}
            {(mode === 'hybrid') && (
                <LiquidNebula 
                    genre={genre} 
                    tension={tension} 
                    className={cn("transition-opacity duration-1000", "opacity-60")} 
                />
            )}

            {/* Layer 2: Orbital (Отображается всегда, так как Nebula-only режим отключен) */}
            {(mode === 'orbital' || mode === 'hybrid') && (
                <OrbitalAnimation 
                    genre={genre} 
                    tension={tension} 
                    isPlaying={isPlaying} 
                    tempo={tempo}
                    size="100%"
                    className="z-10"
                />
            )}

            {/* Mode Feedback Overlay */}
            {feedback && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-out fade-out duration-1000">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
                        {feedback} MODE
                    </span>
                </div>
            )}
        </div>
    );
}
