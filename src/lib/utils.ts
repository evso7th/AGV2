import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as Tone from 'tone';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function noteToMidi(note: string): number {
    return new Tone.Frequency(note).toMidi();
}
