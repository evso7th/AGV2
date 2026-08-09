
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { OrbitalAnimation } from './orbital-animation';
import { LiquidNebula } from './liquid-nebula';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Genre } from '@/types/music';

type ViewMode = 'orbital' | 'ether' | 'nebula';

interface AuraVisualizerProps {
    genre: Genre;
    tension: number;
    isPlaying: boolean;
    tempo: number;
    size?: string;
    className?: string;
}

/**
 * @fileOverview Aura Visualizer V17.1 — "Mobile Performance Shield".
 * #ЗАЧЕМ: ПЛАН №1480. Полное исключение режима Ether на мобильных (заменяется на Orbital).
 */
export function AuraVisualizer({ genre, tension, isPlaying, tempo, size, className }: AuraVisualizerProps) {
    const isMobile = useIsMobile();
    const [mode, setMode] = useState<ViewMode>('orbital');
    const [feedback, setFeedback] = useState<string | null>(null);

    // Initial load and auto-fallback for mobile
    useEffect(() => {
        const saved = localStorage.getItem('AG_ViewMode') as ViewMode;
        let initialMode: ViewMode = (['orbital', 'ether', 'nebula'].includes(saved)) ? saved : 'ether';

        if (isMobile && initialMode === 'ether') {
            initialMode = 'orbital';
        }
        
        setMode(initialMode);
    }, [isMobile]);

    const handleCycleMode = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        
        // Define effective modes based on device performance capability
        const effectiveModes: ViewMode[] = isMobile ? ['orbital', 'nebula'] : ['ether', 'orbital', 'nebula'];
        
        setMode(prev => {
            const currentIdx = effectiveModes.indexOf(prev);
            const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % effectiveModes.length;
            const next = effectiveModes[nextIdx];
            
            localStorage.setItem('AG_ViewMode', next);
            setFeedback(next.toUpperCase());
            return next;
        });
    }, [isMobile]);

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
            style={{ width: size || '100%', height: size || '100%', background: 'transparent' }}
        >
            {/* BACKGROUND LAYER: NEBULA FOG */}
            {(mode === 'ether' || mode === 'nebula') && (
                <LiquidNebula 
                    genre={genre} 
                    tension={tension} 
                    isPlaying={isPlaying}
                    tempo={tempo}
                    isReference={mode === 'nebula'} 
                    className={cn(
                        "animate-in fade-in duration-1000",
                        mode === 'ether' ? "opacity-40" : "opacity-100"
                    )}
                />
            )}

            {/* FOREGROUND LAYER: ORBITAL RINGS */}
            {(mode === 'ether' || mode === 'orbital') && (
                <OrbitalAnimation 
                    genre={genre} 
                    tension={tension} 
                    isPlaying={isPlaying} 
                    tempo={tempo}
                    size="100%"
                    className="relative z-10"
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
