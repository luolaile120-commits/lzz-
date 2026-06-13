import { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { Cloud, UploadCloud, RefreshCw, Check, AlertTriangle } from 'lucide-react';

export function CloudSync() {
  const { schedules, permanentTasks, importData } = useStore();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncText, setSyncText] = useState('云端就绪');
  
  const isFirstLoadRef = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper functions for API calls
  const pullData = async (isManual = false) => {
    setSyncStatus('syncing');
    setSyncText(isManual ? '正在手动拉取中...' : '正在同步云端数据...');
    try {
      const res = await fetch('/api/kv');
      if (!res.ok) throw new Error('Network response was not ok');
      const result = await res.json();
      
      if (result && result.success && result.data) {
        const cloudState = result.data.state || result.data;
        if (cloudState && (cloudState.schedules || cloudState.permanentTasks)) {
          importData({
            schedules: cloudState.schedules || [],
            permanentTasks: cloudState.permanentTasks || [],
          });
        }
      }
      
      setSyncStatus('success');
      setSyncText(isManual ? '已成功拉取最新数据' : '云端同步完成');
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncText('云端就绪');
      }, 2000);
    } catch (e) {
      console.error('Cloud pull failed:', e);
      setSyncStatus('error');
      setSyncText('云端同步失败，请检查网络');
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncText('云端就绪');
      }, 3000);
    } finally {
      isFirstLoadRef.current = false;
    }
  };

  const pushData = async (isManual = false) => {
    setSyncStatus('syncing');
    setSyncText(isManual ? '正在手动上传中...' : '正在同步云端数据...');
    try {
      const payload = {
        state: {
          schedules: stateRef.current.schedules,
          permanentTasks: stateRef.current.permanentTasks
        },
        version: 1
      };

      const res = await fetch('/api/kv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: payload }),
      });

      if (!res.ok) throw new Error('Push failed');

      setSyncStatus('success');
      setSyncText(isManual ? '已成功上传云端' : '云端同步完成');
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncText('云端就绪');
      }, 2000);
    } catch (e) {
      console.error('Cloud upload failed:', e);
      setSyncStatus('error');
      setSyncText('云端同步失败，请检查网络');
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncText('云端就绪');
      }, 3000);
    }
  };

  // Auto-pull on mount
  useEffect(() => {
    pullData(false);
  }, [importData]);

  // Keep a reference of state we want to push
  const stateRef = useRef({ schedules, permanentTasks });
  useEffect(() => {
    stateRef.current = { schedules, permanentTasks };
  }, [schedules, permanentTasks]);

  // Debounce upload on change (10 seconds debounce delay as per request)
  useEffect(() => {
    if (isFirstLoadRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      await pushData(false);
    }, 10000); // 10 seconds debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [schedules, permanentTasks]);

  // Handle active manual triggers
  const handleManualPush = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    pushData(true);
  };

  const handleManualPull = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    pullData(true);
  };

  return (
    <div className="flex items-center select-none max-w-sm flex-shrink mx-2">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/5 dark:bg-white/5 border border-neutral-200/40 dark:border-neutral-800/40 shadow-xs font-mono text-[10px] text-neutral-600 dark:text-neutral-300">
        <div className="flex items-center gap-1 max-w-[120px] sm:max-w-xs truncate">
          {syncStatus === 'syncing' && <RefreshCw size={10} className="animate-spin text-neutral-400 shrink-0" />}
          {syncStatus === 'success' && <Check size={10} className="text-emerald-500 shrink-0" />}
          {syncStatus === 'error' && <AlertTriangle size={10} className="text-rose-500 shrink-0" />}
          {syncStatus === 'idle' && <Cloud size={10} className="text-neutral-400 shrink-0" />}
          
          <span className={cn(
            "truncate",
            syncStatus === 'success' ? 'text-emerald-500 font-semibold' :
            syncStatus === 'error' ? 'text-rose-500 font-semibold' : ''
          )}>
            {syncText}
          </span>
        </div>

        <div className="w-px h-2.5 bg-neutral-300 dark:bg-neutral-700 shrink-0" />

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleManualPush}
            disabled={syncStatus === 'syncing'}
            title="立即保存上传至云端"
            className="px-1.5 py-0.5 rounded hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-sans font-medium transition-all text-[9.5px]"
          >
            立即保存
          </button>
          <button
            onClick={handleManualPull}
            disabled={syncStatus === 'syncing'}
            title="重新拉取云端最新数据"
            className="px-1.5 py-0.5 rounded hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-sans font-medium transition-all text-[9.5px]"
          >
            重新拉取
          </button>
        </div>
      </div>
    </div>
  );
}
