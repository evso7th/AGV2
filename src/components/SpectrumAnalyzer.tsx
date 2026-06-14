
'use client';

import React, { useRef, useEffect } from 'react';
import { useAudioEngine } from '@/contexts/audio-engine-context';

/**
 * #ЗАЧЕМ: Высокопроизводительный спектроанализатор для AuraGroove.
 * #ЧТО: Canvas-визуализация частотного спектра.
 */
export const SpectrumAnalyzer: React.FC = () => {
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

        const draw = () => {
            requestRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            const width = canvas.width;
            const height = canvas.height;

            // Очистка
            ctx.clearRect(0, 0, width, height);

            const barCount = 64; // Отрисовываем 64 столбика для читаемости
            const barWidth = (width / barCount) * 0.8;
            const gap = (width / barCount) * 0.2;
            
            for (let i = 0; i < barCount; i++) {
                // Маппинг данных: берем только нижнюю часть спектра (до 10кГц), где больше активности
                const dataIdx = Math.floor(i * (bufferLength / barCount) * 0.6);
                const barHeight = (dataArray[dataIdx] / 255) * height;

                // Цветовой градиент AuraGroove
                const hue = 270; // Основной цвет Primary (Purple)
                const saturation = 25 + (dataArray[dataIdx] / 255) * 50;
                const lightness = 40 + (dataArray[dataIdx] / 255) * 20;
                
                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                
                // Рисуем столбик со скруглением вверху
                const x = i * (barWidth + gap);
                const y = height - barHeight;
                
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
                ctx.fill();
                
                // Эффект свечения для пиков
                if (dataArray[dataIdx] > 200) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
                } else {
                    ctx.shadowBlur = 0;
                }
            }
        };

        draw();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [analyser]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black/20 rounded-lg p-4 border border-primary/10">
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
