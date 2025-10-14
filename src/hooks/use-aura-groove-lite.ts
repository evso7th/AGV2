
'use client';

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAudioEngine } from "@/contexts/audio-engine-context";

/**
 * Облегченная версия хука для стартового экрана.
 * Не содержит логики управления музыкой, только инициализация и состояния.
 */
export const useAuraGrooveLite = () => {
  const { isInitialized, isInitializing, initialize } = useAudioEngine();
  const [loadingText, setLoadingText] = useState('Click to initialize audio');
  const router = useRouter();

  const handleStart = useCallback(async () => {
    if (isInitialized) {
      router.push('/aura-groove');
      return;
    }
    if (isInitializing) return;

    setLoadingText('Initializing Audio Engine...');
    const success = await initialize();
    if (success) {
      router.push('/aura-groove');
    } else {
      setLoadingText('Failed to initialize. Please try again.');
    }
  }, [isInitialized, isInitializing, initialize, router]);

  const buttonText = isInitializing ? 'Initializing...' : (isInitialized ? 'Enter' : 'Start AuraGroove');
  
  const infoText = isInitializing 
    ? 'Please wait, the audio engine is initializing...' 
    : (isInitialized 
        ? 'Audio engine is ready.' 
        : 'Click the button below to initialize the audio engine.');

  return {
    isInitializing,
    isInitialized,
    handleStart,
    buttonText,
    infoText
  };
};
