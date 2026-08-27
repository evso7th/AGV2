/**
 * @fileOverview Offline Sync Center V1.0 — "DNA Synchronization UI".
 * #ЗАЧЕМ: ПЛАН №2210. Независимый UI для управления оффлайн-кэшем.
 * #ЧТО: Прогресс-бар, выбор режима (сейчас/потом), диагностика базы.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DownloadCloud, CloudLightning, Check, AlertCircle, RefreshCw, X, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { vault } from '@/lib/audio-cache';
import { toast } from '@/hooks/use-toast';

const SYNC_SCHEDULED_KEY = 'AG_OfflineSync_Scheduled';

export function OfflineSyncCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [totalFiles, setTotalBars] = useState(0);
  const [cachedCount, setCachedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'syncing' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Проверка текущего состояния кэша
  const refreshStats = useCallback(async () => {
    try {
      await vault.init();
      const count = await vault.getCachedCount();
      setCachedCount(count);
      
      const res = await fetch('/audio-manifest.json');
      if (res.ok) {
        const manifest = await res.json();
        setTotalBars(manifest.length || 942);
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message);
    }
  }, []);

  useEffect(() => {
    refreshStats();
    
    // Авто-старт, если запланировано
    if (localStorage.getItem(SYNC_SCHEDULED_KEY) === 'true') {
        startSync();
    }
  }, [refreshStats]);

  const startSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setStatus('syncing');
    localStorage.removeItem(SYNC_SCHEDULED_KEY);

    try {
      const res = await fetch('/audio-manifest.json');
      const manifest: string[] = await res.json();
      setTotalBars(manifest.length);

      let count = await vault.getCachedCount();
      
      for (const url of manifest) {
        if (!isSyncing && status !== 'syncing') break; // Возможность отмены (будущее)
        
        const exists = await vault.get(url);
        if (!exists) {
          try {
            await vault.fetch(url);
            count++;
            setCachedCount(count);
          } catch (err) {
            console.warn(`[Sync] Failed to cache: ${url}`);
          }
        }
      }
      setStatus('complete');
      toast({ title: "DNA Synced", description: "All assets are now offline-ready." });
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const scheduleForNextRun = () => {
    localStorage.setItem(SYNC_SCHEDULED_KEY, 'true');
    setIsOpen(false);
    toast({ title: "Sync Scheduled", description: "DNA will sync on next launch." });
  };

  const isComplete = totalFiles > 0 && cachedCount >= totalFiles;

  return (
    <>
      {/* Кнопка-индикатор в Навигаторе */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(true)}
        className={cn("h-8 w-8 relative", isSyncing && "text-primary")}
      >
        {isSyncing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : isComplete ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <DownloadCloud className="h-4 w-4" />
        )}
        {isSyncing && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
        )}
      </Button>

      {/* Глобальный индикатор прогресса (всегда виден во время работы) */}
      {isSyncing && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-black/60 backdrop-blur-md border-b border-primary/20 p-2 flex flex-col items-center gap-1 animate-in slide-in-from-top duration-500">
           <div className="flex items-center gap-2">
              <CloudLightning className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Идет синхронизация ДНК</span>
              <span className="text-[9px] font-mono opacity-50">{cachedCount} / {totalFiles}</span>
           </div>
           <Progress value={(cachedCount / (totalFiles || 1)) * 100} className="h-1 w-full max-w-md bg-white/5" />
        </div>
      )}

      {/* Диалог управления */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-primary flex items-center gap-2">
              <Database className="h-5 w-5" /> Offline Storage
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold opacity-50 tracking-widest">
              Manage local DNA and instrument assets
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label className="text-[10px] font-black uppercase opacity-60">Local Integrity</Label>
                <span className="text-xs font-mono font-bold">{Math.round((cachedCount / (totalFiles || 1)) * 100)}%</span>
              </div>
              <Progress value={(cachedCount / (totalFiles || 1)) * 100} className="h-2 bg-muted" />
              <p className="text-[9px] text-muted-foreground uppercase text-right">
                {cachedCount} of {totalFiles} atoms stored
              </p>
            </div>

            {status === 'error' && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p className="text-[10px] font-bold uppercase">{errorMessage || "Vault connection error"}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={startSync} 
                disabled={isSyncing || isComplete}
                className="font-black uppercase text-[10px] h-12 shadow-lg"
              >
                <CloudLightning className="h-4 w-4 mr-2" /> Sync Now
              </Button>
              <Button 
                variant="outline" 
                onClick={scheduleForNextRun}
                disabled={isSyncing || isComplete}
                className="font-black uppercase text-[10px] h-12"
              >
                <Timer className="h-4 w-4 mr-2" /> Next Launch
              </Button>
            </div>
          </div>

          <DialogFooter className="border-t border-white/5 pt-4">
            <p className="text-[9px] text-muted-foreground leading-relaxed italic text-center w-full">
              Caching assets ensures 100% stable playback even on poor connections and during Broadcast mode.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Utility function used in components
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

function Timer({ className }: { className?: string }) {
    return <RefreshCw className={className} />;
}
