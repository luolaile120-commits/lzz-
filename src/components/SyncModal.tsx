import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { MonitorUp, Smartphone, X, Loader2, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import Peer from 'peerjs';

export function SyncModal({ onClose }: { onClose: () => void }) {
  const { importData } = useStore();
  const [mode, setMode] = useState<'idle' | 'push' | 'pull'>('idle');
  const [sessionId, setSessionId] = useState('');
  const [status, setStatus] = useState('');
  const [inputCode, setInputCode] = useState('');
  const peerRef = useRef<Peer | null>(null);

  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  const getPeerId = (code: string) => `sched-ai-v1-sync-${code}`;

  const handlePushToMobile = async () => {
    setMode('push');
    setStatus('generating');
    
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const peer = new Peer(getPeerId(code));
    peerRef.current = peer;

    peer.on('open', () => {
      setSessionId(code);
      setStatus('ready');
    });

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        const stateStr = localStorage.getItem('schedule-store-v1');
        conn.send(stateStr);
        setTimeout(() => {
          setStatus('success_sent');
        }, 500);
      });
    });

    peer.on('error', (err) => {
      console.error(err);
      setStatus('error');
    });
  };

  const handlePullFromMobile = () => {
    setMode('pull');
    setStatus('input');
  };

  const executePull = async () => {
    if (!inputCode.trim() || inputCode.length !== 4) return;
    setStatus('polling');
    
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', () => {
      const conn = peer.connect(getPeerId(inputCode.trim()));
      
      const timeoutId = setTimeout(() => {
        setStatus('error');
      }, 15000);

      conn.on('data', (data) => {
        try {
          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            if (parsed.state) {
              importData(parsed.state);
              setStatus('success');
              clearTimeout(timeoutId);
              setTimeout(() => onClose(), 2000);
            } else {
               setStatus('error');
            }
          }
        } catch(e) {
          console.error(e);
          setStatus('error');
        }
      });

      conn.on('error', (err) => {
        console.error(err);
        setStatus('error');
      });
    });

    peer.on('error', (err) => {
      console.error(err);
      setStatus('error');
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-divider)] rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden flex flex-col relative">
        <div className="p-5 border-b border-[var(--border-divider)] flex justify-between items-center bg-[var(--bg-card-solid)] relative z-10">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-[var(--accent)]" /> 
            无线设备同步
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 flex flex-col items-center">
          {mode === 'idle' && (
            <div className="space-y-4 w-full">
              <p className="text-[13px] text-[var(--text-secondary)] text-center mb-6">
                通过提取码即可快速在当前局域网内外任意设备互相传输日程数据。
              </p>
              
              <button onClick={handlePushToMobile} className="w-full p-4 rounded-xl border-2 border-[var(--border-divider)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] group-hover:bg-white/50 flex items-center justify-center text-[var(--accent)]">
                    <Smartphone size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-[14px]">发送当前数据</div>
                    <div className="text-[12px] text-[var(--text-secondary)]">生成4位短码供其他设备提取</div>
                  </div>
                </div>
              </button>

              <button onClick={handlePullFromMobile} className="w-full p-4 rounded-xl border-2 border-[var(--border-divider)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] group-hover:bg-white/50 flex items-center justify-center text-[var(--accent)]">
                    <MonitorUp size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-[14px]">接收其他设备数据</div>
                    <div className="text-[12px] text-[var(--text-secondary)]">输入4位短码覆盖当前数据</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {mode !== 'idle' && (
            <div className="flex flex-col items-center justify-center py-4 w-full">
              {status === 'generating' && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
                  <div className="text-[14px] text-[var(--text-secondary)]">正在生成同步码...</div>
                </div>
              )}
              
              {status === 'ready' && mode === 'push' && (
                <div className="flex flex-col items-center gap-5 w-full">
                  <div className="text-center space-y-2">
                    <h4 className="font-semibold text-[15px]">请在另一台设备输入此码提取：</h4>
                    <div className="text-[48px] font-mono font-bold tracking-widest text-[var(--accent)] my-4">
                      {sessionId}
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)]">同步码5分钟内有效</p>
                  </div>
                </div>
              )}

              {status === 'input' && mode === 'pull' && (
                <div className="flex flex-col items-center gap-5 w-full">
                  <div className="text-center space-y-4 w-full">
                    <h4 className="font-semibold text-[15px]">请输入4位提取码</h4>
                    <input 
                      type="text" 
                      maxLength={4} 
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-[36px] font-mono tracking-widest py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-solid)] focus:border-[var(--accent)] outline-none"
                      placeholder="0000"
                      autoFocus
                    />
                    <button 
                      onClick={executePull}
                      disabled={inputCode.length !== 4}
                      className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-medium disabled:opacity-50"
                    >
                      确认提取
                    </button>
                  </div>
                </div>
              )}

              {status === 'polling' && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
                  <div className="text-[14px] text-[var(--text-secondary)]">正在获取数据...</div>
                </div>
              )}

              {status === 'success' && (
                <div className="flex flex-col items-center gap-3 py-10 text-[var(--success)]">
                  <CheckCircle2 size={48} />
                  <div className="text-[16px] font-semibold">同步成功！</div>
                  <div className="text-[13px] opacity-80">数据已更新，稍后自动关闭</div>
                </div>
              )}

              {status === 'success_sent' && (
                <div className="flex flex-col items-center gap-3 py-10 text-[var(--success)]">
                  <CheckCircle2 size={48} />
                  <div className="text-[16px] font-semibold">发送成功！</div>
                  <div className="text-[13px] opacity-80">接收端已获取到数据</div>
                </div>
              )}

              {status === 'error' && (
                <div className="flex flex-col items-center gap-3 py-10 text-[var(--danger)]">
                  <X size={48} />
                  <div className="text-[16px] font-semibold">发生错误或同步码无效</div>
                </div>
              )}

              {status === 'offline_error' && (
                <div className="flex flex-col items-center gap-3 py-10 text-[var(--warning)]">
                  <X size={48} />
                  <div className="text-[16px] font-semibold">离线单文件版不支持此功能</div>
                  <div className="text-[13px] opacity-80">如需同步请使用在线完整版</div>
                </div>
              )}

              {['ready', 'input', 'error', 'offline_error'].includes(status) && (
                <button 
                  onClick={() => { setMode('idle'); setStatus(''); setInputCode(''); }}
                  className="mt-6 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  返回上一步
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
