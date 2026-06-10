import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Loader2, CheckCircle2, X } from 'lucide-react';

export function SyncHandler() {
  const { importData } = useStore();
  const [status, setStatus] = useState<'idle' | 'pulling' | 'pushing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pushSyncId = params.get('pushSync');
    const pullSyncId = params.get('pullSync');

    if (pushSyncId) {
      // We need to push our data to the desktop
      const pushData = async () => {
        setStatus('pushing');
        setMessage('正在向另一台设备发送数据...');
        const stateStr = localStorage.getItem('schedule-store-v1');
        try {
          const res = await fetch(`/api/sync/${pushSyncId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: stateStr })
          });
          if (res.ok) {
            setStatus('success');
            setMessage('数据发送成功！您可以关闭此页面。');
          } else {
            throw new Error('Sync failed');
          }
        } catch (e) {
          setStatus('error');
          setMessage('发送失败，请重试');
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      };
      // Delay slightly to let UI render
      setTimeout(pushData, 500);
    } else if (pullSyncId) {
      // We need to pull data from the desktop
      const pullData = async () => {
        setStatus('pulling');
        setMessage('正在获取数据...');
        try {
          const res = await fetch(`/api/sync/${pullSyncId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'ready' && data.data) {
              const parsed = JSON.parse(data.data);
              if (parsed.state) {
                importData(parsed.state);
                setStatus('success');
                setMessage('数据接收完成！请刷新页面或直接使用。');
              } else {
                throw new Error('Invalid format');
              }
            } else {
               throw new Error('Data not ready');
            }
          } else {
            throw new Error('Sync failed');
          }
        } catch (e) {
          setStatus('error');
          setMessage('获取失败或已过期');
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      };
      setTimeout(pullData, 500);
    }
  }, []);

  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-[var(--bg-primary)] px-6 py-8 rounded-2xl max-w-[320px] w-full shadow-2xl flex flex-col items-center text-center">
        {status === 'pulling' || status === 'pushing' ? (
          <Loader2 className="animate-spin text-[var(--accent)] mb-4" size={48} />
        ) : status === 'success' ? (
          <CheckCircle2 className="text-[var(--success)] mb-4" size={48} />
        ) : (
          <X className="text-[var(--danger)] mb-4" size={48} />
        )}
        
        <h3 className="text-lg font-bold mb-2">设备同步</h3>
        <p className="text-[14px] text-[var(--text-secondary)]">{message}</p>

        {(status === 'success' || status === 'error') && (
          <button 
            onClick={() => setStatus('idle')}
            className="mt-6 px-6 py-2.5 bg-[var(--accent)] text-white rounded-full font-medium text-[14px] hover:bg-[var(--accent-hover)] transition-colors"
          >
            完成
          </button>
        )}
      </div>
    </div>
  );
}
