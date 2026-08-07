
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
 * @fileOverview Aura Visualizer V16.2 — "The Masterpiece Balance".
 * #ЗАЧЕМ: ПЛАН №1480. 
 * 1. Hybrid Mode (Default): Кольца + Пастельный туман.
 * 2. Nebula Mode: Оригинальный YaMus2.html, вписанный в квадрат.
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
            className={cn("relative cursor-pointer select-none overflow-hidden rounded-2xl bg-black", className)} 
            onDoubleClick={handleCycleMode}
            style={{ width: size || '100%', height: size || '100%' }}
        >
            {/* MODE 1: PURE NEBULA (SCALED ORIGINAL) */}
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

            {/* MODE 3: HYBRID (PASTEL SYNC) */}
            {mode === 'hybrid' && (
                <>
                    <LiquidNebula 
                        genre={genre} 
                        tension={tension} 
                        isReference={false}
                        className="opacity-70"
                    />
                    <OrbitalAnimation 
                        genre={genre} 
                        tension={tension} 
                        isPlaying={isPlaying} 
                        tempo={tempo}
                        size="100%"
                        className="z-10"
                    />
                </>
            )}

            {/* Mode Feedback Overlay */}
            {feedback && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-out fade-out duration-1000">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60 bg-black/40 px-6 py-3 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
                        {feedback} MODE
                    </span>
                </div>
            )}
        </div>
    );
}
