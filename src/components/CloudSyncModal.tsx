import { useState } from 'react';
import { useStore } from '../store';
import { Cloud, X, Loader2, UploadCloud, DownloadCloud, Server } from 'lucide-react';
import { cn } from '../lib/utils';

export function CloudSyncModal({ onClose }: { onClose: () => void }) {
  const { 
    importData, 
    syncEndpoint, 
    syncToken, 
    setSyncEndpoint, 
    setSyncToken,
    autoPullOnLoad,
    autoPushOnChange,
    setAutoPullOnLoad,
    setAutoPushOnChange
  } = useStore();
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePush = async () => {
    if (!syncEndpoint) {
      setErrorMessage("请输入有效的 API 地址");
      setStatus('error');
      return;
    }
    
    setStatus('syncing');
    setErrorMessage('');
    
    try {
      const dataStr = localStorage.getItem('schedule-store-v1');
      if (!dataStr) throw new Error("No local data found");

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (syncToken) {
        if (syncEndpoint.includes('jsonbin')) {
          headers['X-Master-Key'] = syncToken;
        } else {
          headers['Authorization'] = `Bearer ${syncToken}`;
        }
      }

      const isInternalKV = syncEndpoint === '/api/kv' || syncEndpoint.startsWith('/api/');
      const requestBody = isInternalKV ? JSON.parse(dataStr) : dataStr;

      const response = await fetch(syncEndpoint, {
        method: isInternalKV ? 'POST' : (syncEndpoint.includes('jsonbin.io/v3/b/') && !syncEndpoint.endsWith('/') ? 'PUT' : 'POST'),
        headers,
        body: typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)
      });

      let responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP 错误: ${response.status} ${response.statusText}`);
      }

      try {
        JSON.parse(responseText);
      } catch (e) {
        throw new Error("服务器返回了非 JSON 格式的数据");
      }

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "上传失败，请检查 API 地址和网络");
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const handlePull = async () => {
    if (!syncEndpoint) {
      setErrorMessage("请输入有效的 API 地址");
      setStatus('error');
      return;
    }

    setStatus('syncing');
    setErrorMessage('');

    try {
      const headers: Record<string, string> = {};
      if (syncToken) {
        if (syncEndpoint.includes('jsonbin')) {
          headers['X-Master-Key'] = syncToken;
        } else {
          headers['Authorization'] = `Bearer ${syncToken}`;
        }
      }

      let fetchUrl = syncEndpoint;
      if (syncEndpoint.includes('jsonbin.io/v3/b/') && !syncEndpoint.includes('/latest')) {
         fetchUrl = `${syncEndpoint}/latest`;
      }

      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP 错误: ${response.status} ${response.statusText}`);
      }

      let rawData;
      try {
        rawData = JSON.parse(responseText);
      } catch (e) {
        throw new Error("服务器返回了非 JSON 格式的数据（可能是无效的 API 地址）");
      }
      let parsedData = rawData;
      
      if (rawData && rawData.state) {
        parsedData = rawData;
      } else if (rawData && rawData.record && rawData.record.state) {
        parsedData = rawData.record;
      }

      if (parsedData.state) {
        importData(parsedData.state);
        setStatus('success');
        setTimeout(() => {
          setStatus('idle');
          onClose();
        }, 2000);
      } else {
        throw new Error("返回的数据格式不正确（无可恢复的日程数据）");
      }

    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "下载失败，请检查 API 地址和网络");
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-divider)] rounded-2xl w-full max-w-[450px] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-[var(--border-divider)] flex justify-between items-center bg-[var(--bg-card-solid)] relative z-10">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Cloud size={18} className="text-[var(--accent)]" /> 
            在线云端同步
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6">
          <p className="text-[14px] text-[var(--text-secondary)] mb-5">
            应用已对接 Vercel KV &amp; Redis 数据库实现多设备数据同步。默认通过后端的 <code className="px-1 text-xs py-0.5 rounded bg-[var(--bg-hover)] text-[var(--accent)] font-mono">/api/kv</code> 进行安全连接。
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-[var(--text-secondary)]">云端同步路由 / API URL</label>
              <div className="relative">
                <Server size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={syncEndpoint}
                  onChange={(e) => setSyncEndpoint(e.target.value)}
                  placeholder="/api/kv"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover)] text-[14px] focus:bg-[var(--bg-card-solid)] focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-light)] transition-all outline-none"
                />
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">本地部署或部署在 Vercel 时，请保持默认的 <code className="font-mono">/api/kv</code></p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-[var(--text-secondary)]">安全身份凭证 (可选)</label>
              <input
                type="password"
                value={syncToken}
                onChange={(e) => setSyncToken(e.target.value)}
                placeholder="配合外部 API 使用时的 Auth Token"
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-hover)] text-[14px] focus:bg-[var(--bg-card-solid)] focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-light)] transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-3.5 mb-6 p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-divider)]">
            <div className="font-bold text-[12px] text-[var(--text-secondary)] uppercase tracking-wider">智能自动同步设置</div>
            
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={autoPullOnLoad}
                onChange={(e) => setAutoPullOnLoad(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[var(--accent)] rounded border-[var(--border-color)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
              />
              <div>
                <div className="text-[13px] font-medium text-[var(--text-primary)]">启动应用时自动下载最新数据</div>
                <div className="text-[11px] text-[var(--text-secondary)]">每次页面载入时，如果有配置云端 API 将自动拉取</div>
              </div>
            </label>
            
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={autoPushOnChange}
                onChange={(e) => setAutoPushOnChange(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[var(--accent)] rounded border-[var(--border-color)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
              />
              <div>
                <div className="text-[13px] font-medium text-[var(--text-primary)]">修改日程时自动上传备份</div>
                <div className="text-[11px] text-[var(--text-secondary)]">当您新增、编辑或删除日程时，静默秒级备份至云端</div>
              </div>
            </label>
          </div>

          {status === 'idle' && (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handlePull} className="p-3 rounded-xl border-2 border-[var(--border-divider)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] transition-all flex flex-col items-center justify-center gap-2 group">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] group-hover:bg-white/50 flex items-center justify-center text-[var(--accent)]">
                  <DownloadCloud size={20} />
                </div>
                <div className="text-[14px] font-semibold text-center">从云端下载同步</div>
                <div className="text-[11px] text-[var(--text-secondary)] text-center px-2 leading-tight">获取云端最新数据并覆盖本地</div>
              </button>
              
              <button onClick={handlePush} className="p-3 rounded-xl border-2 border-[var(--border-divider)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] transition-all flex flex-col items-center justify-center gap-2 group">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] group-hover:bg-white/50 flex items-center justify-center text-[var(--accent)]">
                  <UploadCloud size={20} />
                </div>
                <div className="text-[14px] font-semibold text-center">上传备份至云端</div>
                <div className="text-[11px] text-[var(--text-secondary)] text-center px-2 leading-tight">将当前本地数据推送至云端</div>
              </button>
            </div>
          )}

          {status === 'syncing' && (
             <div className="flex flex-col items-center gap-3 py-8">
               <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
               <div className="text-[14px] text-[var(--text-secondary)]">正在与云端服务器通信...</div>
             </div>
          )}

          {status === 'success' && (
             <div className="flex flex-col items-center gap-3 py-8 text-[var(--success)]">
               <Cloud size={48} />
               <div className="text-[16px] font-semibold">云端同步成功！</div>
             </div>
          )}

          {status === 'error' && (
             <div className="flex flex-col items-center gap-2 py-8 text-[var(--danger)]">
               <X size={48} className="mb-2" />
               <div className="text-[16px] font-semibold text-center leading-snug">{errorMessage}</div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
