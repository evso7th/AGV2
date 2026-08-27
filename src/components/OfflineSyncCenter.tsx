/**
 * @fileOverview Offline Sync Center V1.5.0 — "Maintenance Logic Fix".
 * #ЗАЧЕМ: 1. Исправление логической блокировки при Resync.
 *       2. Объединение Maintenance Mode в одну функциональную кнопку.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CloudLightning, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Trash2,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { vault } from '@/lib/audio-cache';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const SYNC_SCHEDULED_KEY = 'AG_OfflineSync_Scheduled';

export function OfflineSyncCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [cachedCount, setCachedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'syncing' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { toast } = useToast();

  const refreshStats = useCallback(async () => {
    try {
      await vault.init();
      const count = await vault.getCachedCount();
      setCachedCount(count);
      
      const res = await fetch('/audio-manifest.json');
      if (res.ok) {
        const manifest = await res.json();
        if (Array.isArray(manifest)) {
            setTotalFiles(manifest.length);
        }
      }
    } catch (e: any) {
      console.warn('[SyncCenter] Stats refresh failed');
    }
  }, []);

  const startSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setStatus('syncing');
    setErrorMessage(null);
    localStorage.removeItem(SYNC_SCHEDULED_KEY);

    try {
      const res = await fetch('/audio-manifest.json');
      if (!res.ok) throw new Error('Manifest unavailable');
      
      const manifest = await res.json();
      if (!Array.isArray(manifest)) throw new Error('Invalid manifest');

      setTotalFiles(manifest.length);
      let count = await vault.getCachedCount();
      
      for (const url of manifest) {
        const exists = await vault.get(url);
        if (!exists) {
          try {
            await vault.fetch(url);
            count++;
            if (count % 15 === 0) setCachedCount(count);
          } catch (err) {
            console.warn(`[Sync] Skip: ${url}`);
          }
        }
      }
      
      setCachedCount(count);
      setStatus('complete');
      toast({ title: "DNA Synced", description: "All atoms are now local." });
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message || "Network Error");
      toast({ variant: "destructive", title: "Sync Failed", description: e.message });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, toast]);

  const handleResync = useCallback(async () => {
    // 1. Очистка базы
    setStatus('scanning');
    try {
        toast({ title: "HARD RESET", description: "Purging local vault..." });
        await vault.clear();
        setCachedCount(0);
        
        // 2. Важно: сбрасываем флаг, чтобы startSync не "отфутболил" вызов
        setIsSyncing(false); 
        
        // 3. Запуск чистой синхронизации
        // Используем setTimeout чтобы стейт успел обновиться
        setTimeout(() => startSync(), 100);
    } catch (e: any) {
        toast({ variant: "destructive", title: "Reset Error", description: e.message });
    }
  }, [startSync, toast]);

  useEffect(() => {
    refreshStats();
    if (localStorage.getItem(SYNC_SCHEDULED_KEY) === 'true') {
        startSync();
    }
  }, [refreshStats, startSync]);

  const isComplete = totalFiles > 0 && cachedCount >= totalFiles;

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(true)}
        className={cn("h-8 w-8 relative transition-all", isSyncing && "text-primary scale-110")}
      >
        {isSyncing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : isComplete ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <CloudLightning className="h-4 w-4" />
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-neutral-950/95 backdrop-blur-2xl border-primary/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-primary flex items-center gap-2 text-xl tracking-tighter">
              <Zap className="h-6 w-6 fill-current" /> Masterforge Vault
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold opacity-50 tracking-[0.2em]">
              Atomic Asset Synchronization v1.5
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <Label className="text-[10px] font-black uppercase text-primary/70">Local Integrity</Label>
                <span className="text-xs font-mono font-black text-primary">
                    {totalFiles > 0 ? Math.round((cachedCount / totalFiles) * 100) : 0}%
                </span>
              </div>
              <Progress value={totalFiles > 0 ? (cachedCount / totalFiles) * 100 : 0} className="h-1.5 bg-white/5" />
              <div className="flex justify-between items-center text-[9px] font-mono opacity-40 uppercase">
                 <span>Atoms: {cachedCount} / {totalFiles || '---'}</span>
                 {isSyncing && <span className="animate-pulse text-primary font-black">Writing...</span>}
              </div>
            </div>

            {status === 'error' && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-[10px] font-black uppercase">{errorMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={startSync} 
                disabled={isSyncing || (isComplete && totalFiles > 0)}
                className="font-black uppercase text-[10px] h-12 shadow-xl tracking-widest"
              >
                {isSyncing ? "Syncing..." : isComplete ? "Up to Date" : "Sync Now"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="font-black uppercase text-[10px] h-12 border-white/10"
              >
                Close
              </Button>
            </div>

            {/* DANGER ZONE: UNIFIED MAINTENANCE BUTTON */}
            <div className="pt-6 border-t border-white/10 flex flex-col items-center gap-3">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleResync}
                    disabled={isSyncing}
                    className="w-full text-[10px] font-black uppercase text-destructive hover:text-white hover:bg-destructive/40 gap-2 h-12 border border-destructive/30 transition-all shadow-lg"
                >
                    <RotateCcw className="h-4 w-4" /> 
                    Maintenance: Full Resync
                </Button>
                <p className="text-[8px] text-muted-foreground uppercase text-center leading-relaxed max-w-[240px] opacity-60 font-bold">
                    Wipes all local data and re-downloads everything. Use for repair.
                </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
