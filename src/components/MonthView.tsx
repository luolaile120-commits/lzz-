import React from 'react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isToday } from 'date-fns';
import { CalendarDays, MapPin } from 'lucide-react';
import { Tooltip } from './Tooltip';

export function MonthView() {
  const { currentDate, schedules, setEditingScheduleId, updateSchedule, categories } = useStore();
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getDayEvents = (dateStr: string) => schedules.filter(s => s.date === dateStr);

  const handleDragStart = (e: React.DragEvent, scheduleId: string) => {
    e.dataTransfer.setData('text/plain', scheduleId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      updateSchedule(id, { date: dateStr });
    }
  };

  return (
    <div className="w-full border border-[var(--border-divider)] rounded-xl overflow-hidden bg-[var(--border-divider)] grid grid-cols-7 gap-px">
      {['日', '一', '二', '三', '四', '五', '六'].map(d => (
        <div key={d} className="py-2 text-center text-[12px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-card-solid)] tracking-wider">
          {d}
        </div>
      ))}
      
      {days.map(d => {
        const dStr = format(d, 'yyyy-MM-dd');
        const evs = getDayEvents(dStr);
        const isCurrentMonth = isSameMonth(d, monthStart);
        
        return (
          <div 
            key={dStr} 
            className={cn(
              "min-h-[100px] p-1.5 bg-[var(--bg-card-solid)] hover:bg-[var(--accent-light)] transition-colors cursor-pointer relative",
              !isCurrentMonth && "opacity-40",
              isToday(d) && "bg-[var(--accent-light)]"
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, dStr)}
          >
            <div className={cn(
              "text-[12px] font-medium mb-1",
              isToday(d) ? "text-[var(--accent)] font-bold" : "text-[var(--text-secondary)]"
            )}>
              {format(d, 'd')}
            </div>
            
            <div className="space-y-0.5 mt-1">
              {evs.slice(0, 3).map(e => {
                const cat = categories.find(c => e.categories?.includes(c.id)) || categories[0];
                return (
                  <div 
                    key={e.id} 
                    draggable
                    onDragStart={(evt) => handleDragStart(evt, e.id)}
                    onClick={(evt) => { evt.stopPropagation(); setEditingScheduleId(e.id); }}
                    className={cn(
                      "text-[11px] px-1.5 py-0.5 rounded-sm truncate cursor-pointer hover:opacity-90 flex items-center transition-transform active:scale-95 cursor-grab active:cursor-grabbing font-medium text-white shadow-sm"
                    )}
                    style={{ backgroundColor: cat?.color || '#3b82f6' }}
                  >
                    <Tooltip content={
                      <div className="flex flex-col gap-1.5 text-[12px] px-1 py-0.5">
                        <div className="font-bold text-[13px]">{e.title}</div>
                        <div className="flex items-center gap-1.5 opacity-80"><CalendarDays size={12}/> {e.date} {e.time || ''}</div>
                        {e.location && <div className="flex items-center gap-1.5 opacity-80"><MapPin size={12}/> {e.location}</div>}
                      </div>
                    }>
                      <div className="w-full text-left truncate leading-tight">{e.title}</div>
                    </Tooltip>
                  </div>
                );
              })}
              {evs.length > 3 && (
                <div className="text-[10px] text-[var(--accent)] font-medium pl-1">
                  +{evs.length - 3} 更多
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
