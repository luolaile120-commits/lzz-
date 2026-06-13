import { useStore } from '../store';
import { cn } from '../lib/utils';
import { Settings, Search, Moon, Sun, Monitor, Download, Upload, QrCode, KeyRound, Loader2, CalendarDays, MapPin, Copy, ClipboardPaste, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import React, { useState, useRef, useEffect } from 'react';
import { SyncModal } from './SyncModal';
import { ExportModal } from './ExportModal';
import { CloudSync } from './CloudSync';
import { generateContent } from '../lib/ai';

export function Topbar() {
  const { isSidebarOpen, toggleSidebar, currentDate, theme, setTheme, importData, setIsSyncModalOpen, setIsApiModalOpen, schedules, categories, geminiApiKey, setEditingScheduleId } = useStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<typeof schedules | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!searchQuery.trim()) {
         setSearchResults(null);
         return;
      }
      
      setIsSearching(true);
      setSearchResults([]);
      try {
        const gApiKey = geminiApiKey || process.env.GEMINI_API_KEY;
        if (!gApiKey) {
          alert("请先在右上角【API 设置】中配置 Google AI Studio API Key");
          setIsSearching(false);
          return;
        }

        // Prepare schedule data (minimized for tokens limit)
        const data = schedules.map(s => ({
          id: s.id,
          title: s.title,
          date: s.date,
          time: s.time || '',
          location: s.location || '',
          notes: s.notes || ''
        }));

        const systemPrompt = `你是一个智能日程检索助手。当前系统时间是 ${new Date().toLocaleString('zh-CN')}。
用户要求检索以下JSON个格式的日程数据：
${JSON.stringify(data)}

用户的搜索词是：${searchQuery}

请严格根据语义检索相关的日程，并返回一个JSON数组，内部包含匹配的日程ID字符串，例如：["id1", "id2"]。如果没有任何匹配，请返回空数组 []。不要返回任何其他内容。`;

        const responseText = await generateContent(gApiKey, searchQuery, systemPrompt);
        
        let matchedIds: string[] = [];
        try {
          matchedIds = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (e) {
          console.error('Failed to parse search result', e);
        }
        
        const found = schedules.filter(s => matchedIds.includes(s.id));
        setSearchResults(found);
      } catch (e) {
         console.error(e);
         alert("语义搜索失败");
      } finally {
         setIsSearching(false);
      }
    }
  };

  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % 3]);
  };

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor size={16} />;
    if (theme === 'dark') return <Moon size={16} />;
    return <Sun size={16} />;
  };

  const handleExport = () => {
    const data = localStorage.getItem('schedule-store-v1');
    if (!data) return;
    
    // We use a blob to trigger a standard file download without encoding the string to avoid "gibberish" large URIs.
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Delay revoking the object URL to allow the browser to trigger the download in sandboxed environments
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
    
    setIsSettingsOpen(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const result = evt.target?.result;
        if (typeof result === 'string') {
          const parsed = JSON.parse(result);
          if (parsed.state) { // Zustand persist format
            importData({ ...parsed.state });
            alert("导入成功！");
          } else if (Array.isArray(parsed.schedules)) {
            importData({ schedules: parsed.schedules });
            alert("导入成功！");
          } else if (Array.isArray(parsed)) {
            importData({ schedules: parsed });
            alert("导入成功！");
          } else {
            alert("文件格式不正确，缺少数据");
          }
        }
      } catch (err) {
        console.error(err);
        alert("导入失败，文件格式有误。");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsSettingsOpen(false);
  };

  const handleCopyCode = async () => {
    try {
      const { compressToEncodedURIComponent } = await import('lz-string');
      const dataStr = JSON.stringify({ schedules, categories }); 
      const compressed = 'SYNC:' + compressToEncodedURIComponent(dataStr);
      await navigator.clipboard.writeText(compressed);
      alert("复制同步代码成功！(代码已高度压缩)");
    } catch(e) {
      alert("复制失败，请允许剪贴板权限或使用导出数据功能");
    }
    setIsSettingsOpen(false);
  };

  const handlePasteCode = async () => {
    try {
      let text = '';
      try {
        text = await navigator.clipboard.readText();
      } catch (err) {
        text = window.prompt("由于浏览器安全限制，无法直接读取剪贴板。\n请在此处粘贴您的同步代码：") || '';
      }
      
      if (!text.trim()) {
        setIsSettingsOpen(false);
        return;
      }
      
      const { decompressFromEncodedURIComponent } = await import('lz-string');
      let dataStr = text;
      
      if (text.startsWith('SYNC:')) {
        const decompressed = decompressFromEncodedURIComponent(text.substring(5));
        if (decompressed) dataStr = decompressed;
      }
      
      const data = JSON.parse(dataStr);
      if (Array.isArray(data)) {
        importData({ schedules: data });
        alert("导入代码成功");
      } else if (data.schedules && Array.isArray(data.schedules)) {
        importData({ schedules: data.schedules, categories: data.categories || undefined });
        alert("导入同步代码成功");
      } else {
        alert("格式不正确，期望JSON日程数组");
      }
    } catch(e) {
      console.error(e);
      alert("读取剪贴板失败，请确保您复制了有效的同步代码");
    }
    setIsSettingsOpen(false);
  };

  return (
    <div className="sticky top-0 z-20 px-4 md:px-8 py-4 flex items-center justify-between border-b border-[var(--border-divider)] glass-sidebar">
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        {!isSidebarOpen && (
          <button onClick={toggleSidebar} className="w-9 h-9 rounded-full bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/10 transition-colors flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight whitespace-nowrap">我的日程</h1>
          <p className="text-[13px] md:text-[15px] text-[var(--text-secondary)]">{format(new Date(), 'yyyy年 MMMM d日 EEEE', { locale: zhCN })}</p>
        </div>
      </div>

      <CloudSync />

      <div className="flex items-center gap-2 flex-shrink-0 relative">
        <div className="relative flex items-center" ref={searchRef}>
          <Search className="absolute left-3 text-[var(--text-tertiary)]" size={14} />
          <input
            type="text"
            placeholder="语义搜索日程 (回车确认)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="pl-9 pr-8 py-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-hover)] text-[14px] w-24 focus:w-40 sm:w-48 sm:focus:w-64 focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-light)] focus:bg-[var(--bg-card-solid)] transition-all outline-none"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 text-[var(--accent)] animate-spin" size={14} />
          )}

          {/* Search Results Dropdown */}
          {searchResults && (
            <div className="absolute top-full lg:right-0 mt-2 w-[calc(100vw-32px)] lg:w-96 max-h-96 overflow-y-auto rounded-xl bg-[var(--bg-card-solid)] border border-[var(--border-color)] shadow-xl z-50 py-2 custom-scrollbar">
              <div className="px-4 py-2 border-b border-[var(--border-divider)] text-[12px] font-semibold text-[var(--text-secondary)]">
                {searchResults.length > 0 ? `找到 ${searchResults.length} 个结果` : '未找到相关日程'}
              </div>
              {searchResults.length === 0 ? (
                <div className="p-8 flex flex-col items-center text-center text-[var(--text-tertiary)]">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-3">
                     <Search size={20} className="opacity-50" />
                  </div>
                  <p className="text-[14px]">没有与您的描述匹配的日程</p>
                  <p className="text-[12px] mt-1">您可以尝试换个说法，例如“上周的会议”</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {searchResults.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => { setEditingScheduleId(s.id); setSearchResults(null); }}
                      className="text-left px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-divider)] last:border-0"
                    >
                      <div className="font-bold text-[14px] text-[var(--text-primary)] leading-tight mb-1">{s.title}</div>
                      <div className="flex items-center gap-x-3 gap-y-1 text-[12px] text-[var(--text-secondary)] flex-wrap">
                        <div className="flex items-center gap-1.5"><CalendarDays size={12}/> {s.date} {s.time}</div>
                        {s.location && <div className="flex items-center gap-1.5"><MapPin size={12}/> {s.location}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <button
          onClick={cycleTheme}
          className="w-9 h-9 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors"
          title={`当前主题: ${theme}`}
        >
          {getThemeIcon()}
        </button>
        
        <button 
          onClick={() => useStore.getState().toggleRightPanel()}
          className="px-3 py-1.5 ml-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-card-solid)] hover:bg-[var(--bg-hover)] text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
        >
          总览
        </button>
        
        <div className="relative" ref={settingsRef}>
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-9 h-9 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors"
          >
            <Settings size={16} />
          </button>
          
          {isSettingsOpen && (
            <div className="absolute right-0 mt-3 w-[280px] rounded-2xl bg-[var(--bg-card-solid)] border border-[var(--border-divider)] shadow-2xl z-50 overflow-hidden py-3 animate-in fade-in slide-in-from-top-2 flex flex-col gap-1">
              
              <div className="px-3">
                <button 
                  onClick={() => { setIsSettingsOpen(false); setIsSyncModalOpen(true); }} 
                  className="w-full text-left px-3 py-2.5 text-[14px] text-[var(--text-primary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] rounded-lg transition-colors flex items-center gap-3 font-medium"
                >
                  <QrCode size={18} />
                  设备间同步
                </button>
                <button 
                  onClick={() => { setIsSettingsOpen(false); setIsApiModalOpen(true); }} 
                  className="w-full text-left px-3 py-2.5 text-[14px] text-[var(--text-primary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] rounded-lg transition-colors flex items-center gap-3 font-medium mt-0.5"
                >
                  <KeyRound size={18} />
                  API 密钥设置
                </button>
              </div>

              <div className="h-px bg-[var(--border-divider)] my-1.5 mx-3" />

              <div className="px-3">
                <button 
                  onClick={() => { setIsSettingsOpen(false); setIsExportModalOpen(true); }} 
                  className="w-full text-left px-3 py-2.5 text-[14px] text-[var(--text-primary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] rounded-lg transition-colors flex items-center gap-3 font-medium"
                >
                  <Download size={18} />
                  导出日程数据
                </button>
              </div>

              <div className="h-px bg-[var(--border-divider)] my-1.5 mx-3" />

              <div className="px-3">
                <div className="px-3 py-1.5 text-[12px] font-semibold text-[var(--text-tertiary)] flex items-center gap-2">
                  文件与数据备份
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <button onClick={handleExport} className="w-full text-left px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors flex flex-col items-center justify-center gap-1.5 text-center">
                    <Download size={18} />
                    保存为文件
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors flex flex-col items-center justify-center gap-1.5 text-center">
                    <Upload size={18} />
                    从文件导入
                  </button>
                </div>
              </div>

              <div className="h-px bg-[var(--border-divider)] my-1.5 mx-3" />

              <div className="px-3">
                <div className="px-3 py-1.5 text-[12px] font-semibold text-[var(--text-tertiary)] flex items-center gap-2">
                  局域网/跨端同步码
                </div>
                <button onClick={handleCopyCode} className="w-full text-left px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors flex items-center gap-3 mt-0.5">
                  <Copy size={16} />
                  生成并复制数据同步码
                </button>
                <button onClick={handlePasteCode} className="w-full text-left px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors flex items-center gap-3 mt-0.5">
                  <ClipboardPaste size={16} />
                  粘贴同步码导入数据
                </button>
              </div>

              <div className="h-px bg-[var(--border-divider)] my-1.5 mx-3" />
              
              <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
            </div>
          )}
        </div>
      </div>
      {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} />}
    </div>
  );
}
