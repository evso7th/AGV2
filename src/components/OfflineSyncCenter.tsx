
/**
 * @fileOverview Offline Sync Center V1.2.0 — "Full Resync Integration".
 * #ЗАЧЕМ: Реализация функции принудительной пересинхронизации для устранения расхождений.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  DownloadCloud, 
  CloudLightning, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Database,
  Timer,
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
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const SYNC_SCHEDULED_KEY = 'AG_OfflineSync_Scheduled';

export function OfflineSyncCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [totalFiles, setTotalFiles] = useState(1091);
  const [cachedCount, setCachedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'syncing' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      console.warn('[SyncCenter] Background stats check failed');
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
      if (!res.ok) throw new Error('Could not download audio manifest');
      
      const manifest = await res.json();
      
      if (!Array.isArray(manifest)) {
          throw new Error('MANIFEST_NOT_ARRAY: Invalid manifest data structure');
      }

      setTotalFiles(manifest.length);
      let count = await vault.getCachedCount();
      
      for (const url of manifest) {
        const exists = await vault.get(url);
        if (!exists) {
          try {
            await vault.fetch(url);
            count++;
            if (count % 5 === 0) setCachedCount(count);
          } catch (err) {
            console.warn(`[Sync] Skipping failed atom: ${url}`);
          }
        }
      }
      
      setCachedCount(count);
      setStatus('complete');
      toast({ title: "DNA Synced", description: "All atoms are now stored locally." });
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message || "Network Error");
      toast({ variant: "destructive", title: "Sync Failed", description: e.message });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, toast]);

  const handleResync = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setStatus('scanning');
    try {
        await vault.clear();
        setCachedCount(0);
        // Start fresh sync
        await startSync();
    } catch (e: any) {
        toast({ variant: "destructive", title: "Resync Error", description: e.message });
        setIsSyncing(false);
    }
  }, [isSyncing, startSync, toast]);

  useEffect(() => {
    refreshStats();
    if (localStorage.getItem(SYNC_SCHEDULED_KEY) === 'true') {
        startSync();
    }
  }, [refreshStats, startSync]);

  const scheduleForNextRun = () => {
    localStorage.setItem(SYNC_SCHEDULED_KEY, 'true');
    setIsOpen(false);
    toast({ title: "Sync Scheduled", description: "DNA will sync on next launch." });
  };

  const isComplete = totalFiles > 0 && cachedCount >= totalFiles;

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(true)}
        className={cn("h-8 w-8 relative transition-colors", isSyncing && "text-primary")}
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
                <span className="text-xs font-mono font-bold text-primary">{Math.round((cachedCount / (totalFiles || 1)) * 100)}%</span>
              </div>
              <Progress value={(cachedCount / (totalFiles || 1)) * 100} className="h-2 bg-muted" />
              <p className="text-[9px] text-muted-foreground uppercase text-right">
                {cachedCount} of {totalFiles} atoms stored
              </p>
            </div>

            {status === 'error' && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-[10px] font-bold uppercase leading-tight">{errorMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={startSync} 
                disabled={isSyncing || isComplete}
                className="font-black uppercase text-[10px] h-12 shadow-lg"
              >
                {isComplete ? (
                    <><Check className="h-4 w-4 mr-2" /> Up to Date</>
                ) : (
                    <><CloudLightning className="h-4 w-4 mr-2" /> Sync Now</>
                )}
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

            {(isComplete || cachedCount > 0) && !isSyncing && (
                <div className="flex justify-center pt-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleResync}
                        className="text-[9px] font-black uppercase opacity-30 hover:opacity-100 hover:text-destructive gap-1.5 h-6 transition-all"
                    >
                        <RotateCcw className="h-3 w-3" /> Reset & Force Resync
                    </Button>
                </div>
            )}
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
