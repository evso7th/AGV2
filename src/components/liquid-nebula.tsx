
"use client";

import React, { useMemo } from 'react';
import styles from './liquid-nebula.module.css';
import { cn } from '@/lib/utils';
import type { Genre } from '@/types/music';

interface LiquidNebulaProps {
    genre: Genre;
    tension: number;
    className?: string;
}

/**
 * @fileOverview Liquid Nebula V1.1 — "Sprout Protocol Integrated".
 * #ЗАЧЕМ: Реализация органического фона из YaMus2.html.
 * #ЧТО: Блобы, реагирующие на жанр и напряжение.
 */
export function LiquidNebula({ genre, tension, className }: LiquidNebulaProps) {
    
    const hue = useMemo(() => {
        const genreHues: Record<string, number> = {
            ambient: 260,
            psybient: 285,
            blues: 334,
            reggae: 150
        };
        return genreHues[genre as string] || 260;
    }, [genre]);

    // Пастельная палитра на основе жанрового Hue
    const colors = useMemo(() => {
        const s = 25 + (tension * 10); // 25-35%
        const l = 35 + (tension * 15); // 35-50%
        
        return {
            '--color-m': `hsl(${hue}, ${s}%, ${l}%)`,
            '--color-p': `hsl(${hue + 25}, ${s - 5}%, ${l - 5}%)`,
            '--color-y': `hsl(${hue - 25}, ${s + 5}%, ${l + 5}%)`,
            '--color-r': `hsl(${hue}, 15%, 70%)`,
            '--color-o': `hsl(${hue + 40}, ${s}%, ${l - 10}%)`,
            '--nebula-blur': `${30 + (tension * 40)}px`,
            '--nebula-opacity': 0.3 + (tension * 0.4),
            '--corona-opacity': 0.1 + (tension * 0.3),
            '--vignette-alpha': 0.3 + (tension * 0.4)
        } as React.CSSProperties;
    }, [hue, tension]);

    return (
        <div className={cn(styles.container, className)} style={colors}>
            <div className={styles.soft}>
                <div className={styles.fluid}>
                    <i className={cn(styles.blob, styles.m, styles.m0)}></i>
                    <i className={cn(styles.blob, styles.m, styles.m1)}></i>
                    <i className={cn(styles.blob, styles.m, styles.m2)}></i>
                    <i className={cn(styles.blob, styles.p, styles.p1)}></i>
                    <i className={cn(styles.blob, styles.r, styles.r1)}></i>
                    <i className={cn(styles.blob, styles.y, styles.y1)}></i>
                </div>
            </div>
            <div className={cn(styles.rays, styles.corA)}></div>
            <div className={styles.vig}></div>
        </div>
    );
}
