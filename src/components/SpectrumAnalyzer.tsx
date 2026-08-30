'use client';

import React, { useRef, useEffect } from 'react';
import { useAudioEngine } from '@/contexts/audio-engine-context';

interface SpectrumAnalyzerProps {
    info?: string;
}

/**
 * @fileOverview Spectrum Analyzer V1.1 — "30 FPS Update".
 * #ЗАЧЕМ: ПЛАН №1800. Ограничение частоты отрисовки до 30 FPS для всех жанров.
 */
export const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({ info }) => {
    const { analyser, isPlaying } = useAudioEngine();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();

    useEffect(() => {
        if (!analyser || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        let lastTime = 0;
        const interval = 1000 / 30; // 30 FPS target

        const draw = (currentTime: number) => {
            requestRef.current = requestAnimationFrame(draw);

            // --- 30 FPS THROTTLE ---
            const delta = currentTime - lastTime;
            if (delta < interval) return;
            lastTime = currentTime - (delta % interval);

            analyser.getByteFrequencyData(dataArray);

            const width = canvas.width;
            const height = canvas.height;

            // Очистка
            ctx.clearRect(0, 0, width, height);

            const barCount = 64; 
            const barWidth = (width / barCount) * 0.8;
            const gap = (width / barCount) * 0.2;
            
            for (let i = 0; i < barCount; i++) {
                const dataIdx = Math.floor(i * (bufferLength / barCount) * 0.6);
                const barHeight = (dataArray[dataIdx] / 255) * height;

                const hue = 270; 
                const saturation = 25 + (dataArray[dataIdx] / 255) * 50;
                const lightness = 40 + (dataArray[dataIdx] / 255) * 20;
                
                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                
                const x = i * (barWidth + gap);
                const y = height - barHeight;
                
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
                ctx.fill();
                
                if (dataArray[dataIdx] > 200) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
                } else {
                    ctx.shadowBlur = 0;
                }
            }
        };

        requestRef.current = requestAnimationFrame(draw);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [analyser]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black/20 rounded-lg p-4 border border-primary/10 relative overflow-hidden">
            {/* Информационная панель текущего трека */}
            {info && isPlaying && (
                <div className="absolute top-4 left-4 z-50 pointer-events-none">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/90 bg-black/60 px-2.5 py-1.5 rounded-md border border-primary/20 backdrop-blur-md shadow-xl">
                        {info}
                    </p>
                </div>
            )}

            <canvas 
                ref={canvasRef} 
                width={800} 
                height={300} 
                className="w-full h-full max-h-[300px] pointer-events-none"
            />
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">
                        Waiting for signal...
                    </p>
                </div>
            )}
        </div>
    );
};
