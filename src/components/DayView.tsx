import { useStore } from '../store';
import { cn } from '../lib/utils';
import { Sun, CloudSun, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export function DayView() {
  const { schedules, currentDate, categories } = useStore();
  const dateStr = format(currentDate, 'yyyy-MM-dd');

  const daySchedules = schedules.filter(s => s.date === dateStr);
  const morning = daySchedules.filter(s => s.timeSlot === 'morning');
  const afternoon = daySchedules.filter(s => s.timeSlot === 'afternoon');

  const getCategory = (id: string) => categories.find(c => c.id === id);

  const renderSection = (title: string, items: any[], type: 'morning' | 'afternoon') => (
    <div className={cn("mb-6 rounded-xl overflow-hidden border", type === 'morning' ? "bg-[#fdcb6e0f] border-[#fdcb6e26]" : "bg-[#0071e30d] border-[#0071e31f]")}>
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", type === 'morning' ? "bg-[var(--warning-light)] text-[var(--warning)]" : "bg-[var(--accent-light)] text-[var(--accent)]")}>
          {type === 'morning' ? <Sun size={16} /> : <CloudSun size={16} />}
        </div>
        <div className="text-[15px] font-semibold">{title}</div>
        <div className="text-[13px] text-[var(--text-tertiary)]">{items.length} 项</div>
      </div>
      
      <div className="px-2 pb-2">
        {items.map(s => {
          const category = s.categories?.[0] ? getCategory(s.categories[0]) : null;
          return (
            <div 
              key={s.id} 
              onClick={() => useStore.getState().setEditingScheduleId(s.id)}
              className="mb-1.5 p-4 rounded-xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-[var(--border-color)] hover:shadow-md hover:-translate-y-[1px] transition-all cursor-pointer flex items-start gap-3.5"
            >
              <div className={cn("w-1 h-9 rounded-sm shrink-0 mt-0.5", 
                s.priority === 'high' ? "bg-[var(--danger)]" : 
                s.priority === 'medium' ? "bg-[var(--warning)]" : "bg-[var(--success)]"
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[16px] font-semibold tracking-tight truncate">{s.title}</div>
                  {s.time && <div className="text-[13px] font-medium text-[var(--accent)] shrink-0">{s.time}</div>}
                </div>
                
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {category && (
                    <span 
                      className="px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {category.name}
                    </span>
                  )}
                  {s.location && <span className="text-[12px] text-[var(--text-secondary)]">📍 {s.location}</span>}
                  {s.leaders && <span className="text-[12px] text-[var(--text-secondary)]">👥 {s.leaders}</span>}
                  {s.department && <span className="text-[12px] text-[var(--text-secondary)]">🏢 {s.department}</span>}
                  {s.desc && <span className="text-[12px] text-[var(--text-tertiary)] truncate max-w-[200px]">{s.desc}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto pt-2 md:pt-16 pb-32">
      {renderSection("上午", morning, "morning")}
      {renderSection("下午", afternoon, "afternoon")}
      
      {daySchedules.length === 0 && (
        <div className="text-center py-12 text-[var(--text-tertiary)]">
          <Calendar className="mx-auto mb-3 opacity-40" size={40} />
          <p className="text-[15px]">暂无日程</p>
        </div>
      )}
    </div>
  );
}
