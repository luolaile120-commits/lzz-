import { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';

export function CloudSync() {
  const { schedules, permanentTasks, importData } = useStore();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncText, setSyncText] = useState('');
  
  const isFirstLoadRef = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-pull on mount
  useEffect(() => {
    const pullData = async () => {
      setSyncStatus('syncing');
      setSyncText('正在同步云端数据...');
      try {
        const res = await fetch('/api/kv');
        if (!res.ok) throw new Error('Network response was not ok');
        const result = await res.json();
        
        if (result && result.success && result.data) {
          // Standard structure from KV
          const cloudState = result.data.state || result.data;
          if (cloudState && (cloudState.schedules || cloudState.permanentTasks)) {
            // Import retrieved state
            importData({
              schedules: cloudState.schedules || [],
              permanentTasks: cloudState.permanentTasks || [],
            });
          }
        }
        
        setSyncStatus('success');
        setSyncText('云端同步完成');
        setTimeout(() => {
          setSyncStatus('idle');
        }, 2000);
      } catch (e) {
        console.error('Initial Cloud pull failed:', e);
        setSyncStatus('error');
        setSyncText('云端同步失败，请检查网络');
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      } finally {
        isFirstLoadRef.current = false;
      }
    };

    pullData();
  }, [importData]);

  // Keep a reference of state we want to push
  const stateRef = useRef({ schedules, permanentTasks });
  useEffect(() => {
    stateRef.current = { schedules, permanentTasks };
  }, [schedules, permanentTasks]);

  // Debounce upload on change
  useEffect(() => {
    // If it's the first pull overlay, do not push
    if (isFirstLoadRef.current) {
      return;
    }

    // Cancel existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Trigger debounce of 10 seconds
    debounceTimerRef.current = setTimeout(async () => {
      setSyncStatus('syncing');
      setSyncText('正在同步云端数据...');
      
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
        setSyncText('云端同步完成');
        setTimeout(() => {
          setSyncStatus('idle');
        }, 2000);
      } catch (e) {
        console.error('Cloud upload failed:', e);
        setSyncStatus('error');
        setSyncText('云端同步失败，请检查网络');
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      }
    }, 10000); // 10 seconds

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [schedules, permanentTasks]);

  if (syncStatus === 'idle') return null;

  return (
    <div className="fixed top-2 left-2 z-[9999] pointer-events-none select-none px-3 py-1 rounded bg-black/5 dark:bg-white/5 backdrop-blur-xs font-sans text-[11px] shadow-sm">
      {syncStatus === 'syncing' && (
        <span className="text-gray-400 dark:text-gray-500 font-medium">
          {syncText}
        </span>
      )}
      {syncStatus === 'success' && (
        <span className="text-emerald-500 font-medium">
          {syncText}
        </span>
      )}
      {syncStatus === 'error' && (
        <span className="text-rose-500 font-medium font-semibold">
          {syncText}
        </span>
      )}
    </div>
  );
}
