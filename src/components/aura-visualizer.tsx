
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { LiquidNebula } from './liquid-nebula';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Genre } from '@/types/music';

type ViewMode = 'nebula' | 'cover';

interface AuraVisualizerProps {
    genre: Genre;
    tension: number;
    isPlaying: boolean;
    tempo: number;
    size?: string;
    className?: string;
}

const COVER_IMAGES = [
  "/assets/cover.jpg",
  "/assets/images/cover_reggae_2.png",
  "/assets/images/cover_reggae.png",
  "/assets/images/cyber_blues.png",
  "/assets/images/dark_trance.png"
];

/**
 * @fileOverview Aura Visualizer V20.0 — "Nebula & Cover Only".
 * #ЗАЧЕМ: ПЛАН №2500. Удаление орбиталей, возврат блюра в туманность и ротация обложек.
 */
export function AuraVisualizer({ genre, tension, isPlaying, tempo, size, className }: AuraVisualizerProps) {
    const isMobile = useIsMobile();
    const [mode, setMode] = useState<ViewMode>('nebula');
    const [feedback, setFeedback] = useState<string | null>(null);

    // Rotation State
    const [imageIndex, setImageIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    // Initial load
    useEffect(() => {
        const saved = localStorage.getItem('AG_ViewMode') as ViewMode;
        const initialMode: ViewMode = (['nebula', 'cover'].includes(saved)) ? saved : 'nebula';
        setMode(initialMode);
    }, []);

    // Rotation Logic: 1 minute interval
    useEffect(() => {
        if (mode !== 'cover' || !isPlaying) return;

        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                setImageIndex(prev => (prev + 1) % COVER_IMAGES.length);
                setIsFading(false);
            }, 1000); 
        }, 60000); 

        return () => clearInterval(interval);
    }, [mode, isPlaying]);

    const handleCycleMode = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setMode(prev => {
            const next: ViewMode = prev === 'nebula' ? 'cover' : 'nebula';
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
            className={cn("relative cursor-pointer select-none overflow-visible flex items-center justify-center", className)} 
            onDoubleClick={handleCycleMode}
            style={{ width: size || '100%', height: size || '100%', background: 'transparent' }}
        >
            {/* 1. NEBULA MODE */}
            {mode === 'nebula' && (
                <LiquidNebula 
                    genre={genre} 
                    tension={tension} 
                    isPlaying={isPlaying}
                    tempo={tempo}
                    isReference={false} 
                    className="animate-in fade-in duration-1000 opacity-100"
                />
            )}

            {/* 2. CINEMATIC COVER ROTATION MODE */}
            {mode === 'cover' && (
                <div className="absolute inset-0 flex items-center justify-center p-4 animate-in zoom-in-95 duration-700">
                    <div className="relative w-full h-full shadow-[0_0_60px_rgba(0,0,0,0.6)] rounded-3xl overflow-hidden border border-white/10 bg-black/40">
                        <div 
                            className={cn(
                                "relative w-full h-full transition-all duration-[1000ms] ease-in-out",
                                isFading ? "opacity-0 scale-95 blur-sm" : "opacity-90 scale-100 blur-0"
                            )}
                        >
                            <Image 
                                src={COVER_IMAGES[imageIndex]} 
                                alt="AuraGroove Cover" 
                                fill
                                className="object-cover"
                                style={{ 
                                    animation: isPlaying ? 'slow-zoom 60s infinite alternate linear' : 'none'
                                }}
                                priority
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
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

            <style jsx global>{`
                @keyframes slow-zoom {
                    from { transform: scale(1); }
                    to { transform: scale(1.15); }
                }
            `}</style>
        </div>
    );
}
