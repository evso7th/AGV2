
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { OrbitalAnimation } from './orbital-animation';
import { LiquidNebula } from './liquid-nebula';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Genre } from '@/types/music';

type ViewMode = 'orbital' | 'ether' | 'nebula' | 'cover';

interface AuraVisualizerProps {
    genre: Genre;
    tension: number;
    isPlaying: boolean;
    tempo: number;
    size?: string;
    className?: string;
}

/**
 * @fileOverview Aura Visualizer V18.0 — "Static Cover Mode".
 * #ЗАЧЕМ: ПЛАН №1510. Добавление 4-го режима: статическая обложка.
 */
export function AuraVisualizer({ genre, tension, isPlaying, tempo, size, className }: AuraVisualizerProps) {
    const isMobile = useIsMobile();
    const [mode, setMode] = useState<ViewMode>('nebula');
    const [feedback, setFeedback] = useState<string | null>(null);

    // Initial load and auto-fallback for mobile
    useEffect(() => {
        const saved = localStorage.getItem('AG_ViewMode') as ViewMode;
        // Проверка валидности сохраненного режима, теперь включая 'cover'
        let initialMode: ViewMode = (['orbital', 'ether', 'nebula', 'cover'].includes(saved)) ? saved : 'nebula';

        if (isMobile && initialMode === 'ether') {
            initialMode = 'orbital';
        }
        
        setMode(initialMode);
    }, [isMobile]);

    const handleCycleMode = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        
        // Определение доступных режимов в зависимости от устройства
        const effectiveModes: ViewMode[] = isMobile ? ['orbital', 'nebula', 'cover'] : ['ether', 'orbital', 'nebula', 'cover'];
        
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
            className={cn("relative cursor-pointer select-none overflow-visible flex items-center justify-center", className)} 
            onDoubleClick={handleCycleMode}
            style={{ width: size || '100%', height: size || '100%', background: 'transparent' }}
        >
            {/* 1. BACKGROUND LAYER: NEBULA FOG */}
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

            {/* 2. FOREGROUND LAYER: ORBITAL RINGS */}
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

            {/* 3. STATIC COVER MODE */}
            {mode === 'cover' && (
                <div className="absolute inset-0 flex items-center justify-center p-4 animate-in zoom-in-95 duration-700">
                    <div className="relative w-full h-full shadow-[0_0_60px_rgba(0,0,0,0.6)] rounded-3xl overflow-hidden border border-white/10 bg-black/40">
                        <Image 
                            src="/assets/cover.jpg" 
                            alt="AuraGroove Cover" 
                            fill
                            className="object-cover opacity-90 transition-opacity duration-1000"
                            priority
                        />
                        {/* Тонкий виньеточный градиент поверх для глубины */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
                    </div>
                </div>
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
