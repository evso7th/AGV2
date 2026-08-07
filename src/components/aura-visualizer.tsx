
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { OrbitalAnimation } from './orbital-animation';
import { LiquidNebula } from './liquid-nebula';
import { cn } from '@/lib/utils';
import type { Genre } from '@/types/music';

type ViewMode = 'orbital' | 'hybrid' | 'nebula';

interface AuraVisualizerProps {
    genre: Genre;
    tension: number;
    isPlaying: boolean;
    tempo: number;
    size?: string;
    className?: string;
}

/**
 * @fileOverview Aura Visualizer V16.3 — "Unlimited Flow".
 * #ЗАЧЕМ: Реализация ПЛАНА №1482. 
 * 1. Убраны границы квадрата и черный фон (анимация затекает под интерфейс).
 * 2. Hybrid Mode временно дублирует Orbital (без небулы).
 * 3. Nebula Mode сохраняет масштабирование оригинала, но без фона.
 */
export function AuraVisualizer({ genre, tension, isPlaying, tempo, size, className }: AuraVisualizerProps) {
    const [mode, setMode] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('AG_ViewMode') as ViewMode;
            if (['orbital', 'hybrid', 'nebula'].includes(saved)) return saved;
        }
        return 'hybrid';
    });

    const [feedback, setFeedback] = useState<string | null>(null);

    const handleCycleMode = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setMode(prev => {
            const cycle: ViewMode[] = ['hybrid', 'orbital', 'nebula'];
            const nextIdx = (cycle.indexOf(prev) + 1) % cycle.length;
            const next = cycle[nextIdx];
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
            className={cn("relative cursor-pointer select-none overflow-visible", className)} 
            onDoubleClick={handleCycleMode}
            style={{ width: size || '100%', height: size || '100%' }}
        >
            {/* MODE 1: PURE NEBULA (SCALED ORIGINAL, NO BG) */}
            {mode === 'nebula' && (
                <LiquidNebula 
                    genre={genre} 
                    tension={tension} 
                    isReference={true}
                />
            )}

            {/* MODE 2: ORBITAL (PURE GEOMETRY) */}
            {mode === 'orbital' && (
                <OrbitalAnimation 
                    genre={genre} 
                    tension={tension} 
                    isPlaying={isPlaying} 
                    tempo={tempo}
                    size="100%"
                />
            )}

            {/* MODE 3: HYBRID (USER DIRECTIVE: COPY OF ORBITAL FOR NOW) */}
            {mode === 'hybrid' && (
                <OrbitalAnimation 
                    genre={genre} 
                    tension={tension} 
                    isPlaying={isPlaying} 
                    tempo={tempo}
                    size="100%"
                />
            )}

            {/* Mode Feedback Overlay */}
            {feedback && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-out fade-out duration-1000">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 bg-black/20 px-6 py-3 rounded-full backdrop-blur-sm border border-white/5 shadow-2xl">
                        {feedback} MODE
                    </span>
                </div>
            )}
        </div>
    );
}
