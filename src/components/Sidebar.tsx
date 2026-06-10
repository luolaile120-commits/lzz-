import { useStore, Priority, TimeSlot } from '../store';
import { cn } from '../lib/utils';
import { ChevronLeft, Sparkles, Loader2, ClipboardPaste } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { generateContent } from '../lib/ai';

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar, addSchedule, categories, geminiApiKey, apiEndpoint } = useStore();
  const [activeTab, setActiveTab] = useState<'schedule' | 'permanent'>('schedule');

  const [smartText, setSmartText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const [form, setForm] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    location: '',
    categoryId: categories[0]?.id || '',
    priority: 'medium' as Priority,
    timeSlot: 'morning' as TimeSlot,
    notes: ''
  });

  const handleParse = async (overrideText?: string) => {
    const textToParse = overrideText || smartText;
    if (!textToParse.trim()) return;
    setIsParsing(true);
    try {
      const gApiKey = geminiApiKey || process.env.GEMINI_API_KEY;
      if (!gApiKey) {
        alert("请先在右上角【API 设置】中配置 API Key");
        setIsParsing(false);
        return;
      }
      const systemPrompt = `你是一个专业的日程提取助手。当前系统时间是 ${new Date().toLocaleString('zh-CN')}。
请从用户的输入中提取关键信息，并严格返回JSON格式，不要包含Markdown标记。
必须返回以下字段：
- title: 日程标题 (必填)
- date: 日期 (格式: YYYY-MM-DD，如果没有指定则默认为今天)
- time: 具体时间 (格式: HH:mm，如 "15:00"，如果没有具体时间则为空字符串)
- location: 地点 (如果没有则为空字符串)
- categoryId: 分类 (不管内容是什么，一律固定填 '1')
- timeSlot: 时段 (上午为 'morning', 下午或晚上为 'afternoon')
- notes: 备注 (在此提取日程的特别注意事项，如：哪个领导参会、哪个部门组织、注意事项等，如果没有则为空字符串)`;

      const responseText = await generateContent(gApiKey, textToParse, systemPrompt, apiEndpoint);
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      if (parsed) {
        setForm(prev => ({
          ...prev,
          title: parsed.title || prev.title,
          date: parsed.date || prev.date,
          time: parsed.time || prev.time,
          location: parsed.location || prev.location,
          categoryId: '1', // 强制设置为拍摄
          timeSlot: parsed.timeSlot || prev.timeSlot,
          notes: parsed.notes || prev.notes
        }));
        setSmartText('');
      }
    } catch (e: any) {
      console.error(e);
      alert(`识别失败: ${e.message}。请检查网络、API Key 或更换代理(如果在浏览器直接访问 DeepSeek API 可能会跨域)。`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleAdd = () => {
    if (!form.title.trim()) return;
    addSchedule({
      title: form.title,
      date: form.date,
      time: form.time,
      location: form.location,
      timeSlot: form.timeSlot,
      priority: form.priority,
      categories: [form.categoryId],
      organizer: [],
      participant: [],
      status: 'todo',
      notes: form.notes
    });
    setForm({
      title: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '',
      location: '',
      categoryId: categories[0]?.id || '',
      priority: 'medium',
      timeSlot: 'morning',
      notes: ''
    });
  };

  return (
    <aside className={cn(
      "w-full sm:w-[300px] min-w-[300px] glass-sidebar border-r border-[var(--border-divider)] flex flex-col transition-all duration-300 z-50 md:z-30 absolute inset-y-0 left-0 md:relative shadow-2xl md:shadow-none",
      !isSidebarOpen && "md:absolute md:-translate-x-[300px] -translate-x-[100%] opacity-0 pointer-events-none"
    )}>
      <div className="p-6 pb-4 border-b border-[var(--border-divider)] relative">
        <h2 className="text-[22px] font-bold tracking-tight">日程计划</h2>
        <button
          onClick={toggleSidebar}
          className="absolute top-5 -right-[14px] w-7 h-7 rounded-full bg-[var(--bg-card-solid)] border border-[var(--border-divider)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-colors shadow-sm z-30"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="flex gap-0.5 px-5 pt-3">
        <button
          onClick={() => setActiveTab('schedule')}
          className={cn("flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors", activeTab === 'schedule' ? "bg-[var(--accent-light)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]")}
        >
          常规日程
        </button>
        <button
          onClick={() => setActiveTab('permanent')}
          className={cn("flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors", activeTab === 'permanent' ? "bg-[var(--accent-light)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]")}
        >
          常驻任务
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
        {/* Smart input */}
        <div className="bg-[var(--accent-light)] rounded-xl p-3 border border-[var(--accent)]/20 relative">
          <label className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--accent)] mb-2">
            <Sparkles size={14} />
            智能识别日程
          </label>
          <textarea 
            value={smartText}
            onChange={e => setSmartText(e.target.value)}
            placeholder="粘贴文字，例如：明天下午3点在会议室开会..." 
            className="w-full text-[13px] bg-transparent border-none outline-none resize-none h-16 placeholder-[var(--accent)]/50 text-[var(--text-primary)]"
          />
          <div className="flex justify-between items-center mt-1">
            <button
              onClick={async () => {
                try {
                  let text = '';
                  try {
                    text = await navigator.clipboard.readText();
                  } catch (err) {
                    text = window.prompt("由于浏览器安全限制，无法直接读取剪贴板。\n请在此处粘贴需要提取的文本：") || '';
                  }
                  
                  if (text.trim()) {
                    setSmartText(text);
                    handleParse(text); // auto parse
                  }
                } catch(e) {
                  console.error('Clipboard access denied', e);
                  alert('无法读取剪贴板，请允许浏览器读取剪贴板或手动粘贴。');
                }
              }}
              className="text-[var(--accent)] text-[12px] font-medium hover:bg-[var(--accent)]/10 px-2 py-1 rounded flex items-center gap-1 transition-colors"
              title="读取剪贴板并智能识别"
            >
              <ClipboardPaste size={14} /> 读取并识别
            </button>
            <button 
              onClick={() => handleParse()}
              disabled={isParsing || !smartText.trim()}
              className="bg-[var(--accent)] text-white text-[12px] px-3 py-1.5 rounded-md font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isParsing && <Loader2 size={12} className="animate-spin" />}
              识别并填入
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-[var(--text-secondary)]">标题</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} type="text" placeholder="输入日程标题" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors" />
          </div>
          <div className="flex gap-3">
            <div className="space-y-1.5 flex-1">
              <label className="text-[13px] font-semibold text-[var(--text-secondary)]">日期</label>
              <input value={form.date} onChange={e => setForm({...form, date: e.target.value})} type="date" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors" />
            </div>
            <div className="space-y-1.5 flex-1">
              <label className="text-[13px] font-semibold text-[var(--text-secondary)]">时间</label>
              <input value={form.time} onChange={e => setForm({...form, time: e.target.value})} type="time" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-[var(--text-secondary)]">地点</label>
            <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} type="text" placeholder="日程地点" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors" />
          </div>
          <div className="space-y-1.5">
             <label className="text-[13px] font-semibold text-[var(--text-secondary)]">分类</label>
             <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors appearance-none">
               {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
          <div className="space-y-1.5 flex-1">
            <label className="text-[13px] font-semibold text-[var(--text-secondary)]">备注</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors resize-none" placeholder="例如：某领导参会、某部门组织..."></textarea>
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-[var(--border-divider)]">
        <button onClick={handleAdd} className="w-full py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-[15px] transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
          <span>+ 添加日程</span>
        </button>
      </div>
    </aside>
  );
}
