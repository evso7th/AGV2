/**
 * @fileOverview Offline Sync Center V1.9 — "Toolbar Integration".
 * #ЗАЧЕМ: Обновление стиля кнопки для соответствия тулбару навигатора (h-10, outline).
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CloudLightning, 
  AlertCircle, 
  RefreshCw, 
  RotateCcw,
  Zap,
  Dna,
  Heart,
  Database
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
  DialogDescription
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { vault } from '@/lib/audio-cache';
import { loadDnaCache } from '@/lib/dna-cache';
import { useAudioEngine } from '@/contexts/audio-engine-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const SYNC_SCHEDULED_KEY = 'AG_OfflineSync_Scheduled';

export function OfflineSyncCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [cachedCount, setCachedCount] = useState(0);
  
  // DNA State
  const [axiomsCount, setAxiomsCount] = useState(0);
  const [masterpiecesCount, setMasterpiecesCount] = useState(0);
  const [lastDnaSync, setLastDnaSync] = useState<number | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'syncing' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { toast } = useToast();
  const { syncDna } = useAudioEngine();

  const refreshStats = useCallback(async () => {
    try {
      // 1. Audio Assets Stats
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

      // 2. DNA Stats (Axioms & Masterpieces)
      const dna = await loadDnaCache();
      setAxiomsCount(dna.axioms?.length || 0);
      setMasterpiecesCount(dna.masterpieces?.length || 0);
      setLastDnaSync(dna.syncedAt);

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
      // 1. ПРИНУДИТЕЛЬНАЯ СИНХРОНИЗАЦИЯ DNA (Firestore -> Local Cache)
      await syncDna();

      // 2. СИНХРОНИЗАЦИЯ ATOMS (Samples)
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
            if (count % 20 === 0) {
                setCachedCount(count);
            }
          } catch (err) {
            console.warn(`[Sync] Skip: ${url}`);
          }
        }
      }
      
      setCachedCount(count);
      
      // Финальное обновление стат
      await refreshStats();

      setStatus('complete');
      toast({ title: "System Synchronized", description: "All atoms and DNA records are now local." });
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message || "Network Error");
      toast({ variant: "destructive", title: "Sync Failed", description: e.message });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, toast, syncDna, refreshStats]);

  const handleResync = useCallback(async () => {
    setStatus('scanning');
    try {
        toast({ title: "HARD RESET", description: "Purging local vaults..." });
        await vault.clear();
        setCachedCount(0);
        setIsSyncing(false); 
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

  const isComplete = totalFiles > 0 && cachedCount >= totalFiles && axiomsCount > 0;

  return (
    <>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => { setIsOpen(true); refreshStats(); }}
        className={cn("h-10 w-10 relative transition-all", (isSyncing || isComplete) && "text-primary border-primary/20")}
      >
        {isSyncing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : isComplete ? (
          <Database className="h-4 w-4" />
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
              Asset & DNA Synchronization Unit v1.9
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* AUDIO ATOMS SECTION (Always Visible) */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <Label className="text-[10px] font-black uppercase text-primary/70 flex items-center gap-1.5">
                   <Zap className="h-3 w-3" /> Audio Atoms (Samples)
                </Label>
                <span className="text-xs font-mono font-black text-primary">
                    {totalFiles > 0 ? Math.round((cachedCount / totalFiles) * 100) : 0}%
                </span>
              </div>
              <Progress value={totalFiles > 0 ? (cachedCount / totalFiles) * 100 : 0} className="h-1.5 bg-white/5" />
              <div className="flex justify-between items-center text-[9px] font-mono opacity-40 uppercase">
                 <span>Atoms: {cachedCount} / {totalFiles || '---'}</span>
                 {isSyncing && <span className="animate-pulse text-primary font-black">Syncing...</span>}
              </div>
            </div>

            {/* COLLAPSIBLE DNA & MAINTENANCE */}
            <Accordion type="single" collapsible className="w-full border-none">
              <AccordionItem value="dna-intel" className="border-none">
                <AccordionTrigger className="hover:no-underline py-2 border-none">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-black uppercase text-primary/70 flex items-center gap-1.5 cursor-pointer">
                        <Dna className="h-3.5 w-3.5" /> Heritage DNA & Maintenance
                    </Label>
                    <Badge variant="outline" className={cn("text-[8px] font-black uppercase", axiomsCount > 0 ? "text-green-500 border-green-500/20" : "text-amber-500 border-amber-500/20")}>
                        {axiomsCount > 0 ? "Ready" : "Needed"}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-0 space-y-6">
                    {/* DNA STATS */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
                            <div className="text-[8px] font-black uppercase opacity-40 flex items-center gap-1">
                                <Dna className="h-3.5 w-3.5" /> Axioms
                            </div>
                            <div className="text-xl font-black font-mono text-primary">{axiomsCount}</div>
                            <div className="text-[7px] uppercase font-bold opacity-30">Musical Phrases</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
                            <div className="text-[8px] font-black uppercase opacity-40 flex items-center gap-1">
                                <Heart className="h-3.5 w-3.5" /> Masterpieces
                            </div>
                            <div className="text-xl font-black font-mono text-primary">{masterpiecesCount}</div>
                            <div className="text-[7px] uppercase font-bold opacity-30">Genetic Pool</div>
                        </div>
                    </div>
                    {lastDnaSync && (
                        <p className="text-[8px] font-mono opacity-30 uppercase text-center">
                            Last Intel Sync: {new Date(lastDnaSync).toLocaleString()}
                        </p>
                    )}

                    {/* MAINTENANCE BUTTON (Moved inside accordion) */}
                    <div className="pt-6 border-t border-white/10 flex flex-col items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); handleResync(); }}
                            disabled={isSyncing}
                            className="w-full text-[10px] font-black uppercase text-destructive hover:text-white hover:bg-destructive/40 gap-2 h-12 border border-destructive/30 transition-all shadow-lg"
                        >
                            <RotateCcw className="h-4 w-4" /> 
                            Maintenance: Wipe & Resync
                        </Button>
                        <p className="text-[8px] text-muted-foreground uppercase text-center leading-relaxed max-w-[240px] opacity-60 font-bold">
                            Clears all atoms and DNA. Use if the orchestra sounds broken.
                        </p>
                    </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {status === 'error' && (
              <div className="p-3 rounded bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-[10px] font-black uppercase">{errorMessage}</p>
              </div>
            )}

            {/* ACTION BUTTONS (Always Visible) */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button 
                onClick={startSync} 
                disabled={isSyncing}
                className="font-black uppercase text-[10px] h-12 shadow-xl tracking-widest"
              >
                {isSyncing ? "Working..." : isComplete ? "Full Refresh" : "Sync All"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="font-black uppercase text-[10px] h-12 border-white/10"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
