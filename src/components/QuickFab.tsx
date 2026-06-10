import { useState } from 'react';
import { useStore } from '../store';
import { Plus, Sun, CloudSun, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export function QuickFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [slot, setSlot] = useState<'morning' | 'afternoon'>('morning');
  
  const { addSchedule, currentDate, viewMode } = useStore();

  if (viewMode !== 'day') return null;

  const handleSubmit = () => {
    if (!title.trim()) return;
    addSchedule({
      title: title.trim(),
      desc: desc.trim(),
      date: format(currentDate, 'yyyy-MM-dd'),
      timeSlot: slot,
      priority: 'medium',
      categories: [],
      organizer: [],
      participant: [],
      status: 'todo'
    });
    setTitle('');
    setDesc('');
    setIsOpen(false);
  };

  return (
    <div className="fixed z-[200] bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
      <div className={cn(
        "absolute bottom-full mb-4 w-[300px] bg-[var(--bg-card-solid)] rounded-2xl shadow-xl border border-[var(--border-divider)] p-4 transition-all duration-200 origin-bottom",
        isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
      )}>
        <div className="text-[14px] font-semibold flex items-center gap-1.5 mb-3">
          <Zap size={14} className="text-[var(--accent)]" /> 快速添加
        </div>
        
        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">标题</label>
            <input 
              autoFocus={isOpen}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') setIsOpen(false); }}
              placeholder="输入日程标题..." 
              className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-divider)] text-[13px] focus:border-[var(--accent)] outline-none bg-[var(--bg-primary)] transition-colors" 
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">描述（可选）</label>
            <textarea 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="补充说明..." 
              className="w-full px-2.5 py-2 rounded-lg border border-[var(--border-divider)] text-[13px] focus:border-[var(--accent)] outline-none bg-[var(--bg-primary)] transition-colors h-14 resize-none" 
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1 uppercase tracking-wider">时段</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setSlot('morning')}
                className={cn("flex-1 py-1.5 rounded border text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors", slot === 'morning' ? "border-[var(--warning)] bg-[var(--warning-light)] text-[var(--warning)]" : "border-[var(--border-divider)] text-[var(--text-secondary)] hover:border-[var(--warning)]")}
              >
                <Sun size={12} /> 上午
              </button>
              <button 
                onClick={() => setSlot('afternoon')}
                className={cn("flex-1 py-1.5 rounded border text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors", slot === 'afternoon' ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]" : "border-[var(--border-divider)] text-[var(--text-secondary)] hover:border-[var(--accent)]")}
              >
                <CloudSun size={12} /> 下午
              </button>
            </div>
          </div>
          <button 
            onClick={handleSubmit}
            className="w-full py-2 rounded-lg bg-[var(--accent)] text-white text-[13px] font-semibold hover:bg-[var(--accent-hover)] transition-colors mt-2"
          >
            添加日程
          </button>
        </div>
      </div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-8 py-3 rounded-full bg-[var(--accent)] text-white shadow-lg flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all font-semibold"
      >
        <Plus size={18} className={cn("transition-transform duration-300", isOpen && "rotate-45")} />
        快速添加
      </button>
    </div>
  );
}
