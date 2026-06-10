import React from 'react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { Sun, CloudSun, CalendarDays, MapPin, Clock, CheckCircle2, Circle, Copy } from 'lucide-react';
import { addDays, startOfWeek, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Tooltip } from './Tooltip';

export function WeekView() {
  const { currentDate, schedules, setEditingScheduleId, updateSchedule, categories } = useStore();
  const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const getDayEvents = (dateStr: string, slot: 'morning' | 'afternoon') => {
    return schedules.filter(s => s.date === dateStr && s.timeSlot === slot);
  };

  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);
  const tomorrow = addDays(todayDate, 1);
  const dayAfter = addDays(todayDate, 2);

  const weekEvents = schedules.filter(s => {
    const sDate = new Date(s.date);
    sDate.setHours(0,0,0,0);
    return sDate.getTime() >= todayDate.getTime() && sDate.getTime() <= dayAfter.getTime();
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleDragStart = (e: React.DragEvent, scheduleId: string) => {
    e.dataTransfer.setData('text/plain', scheduleId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dateStr: string, timeSlot: 'morning' | 'afternoon') => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      updateSchedule(id, { date: dateStr, timeSlot });
    }
  };

  const toggleStatus = (e: React.MouseEvent, id: string, currentStatus: string | undefined) => {
    e.stopPropagation();
    updateSchedule(id, { status: currentStatus === 'completed' ? 'todo' : 'completed' });
  };

  const handleCopyTitle = (e: React.MouseEvent, dateStr: string, title: string) => {
    e.stopPropagation();
    const formattedDate = format(new Date(dateStr), 'yyyyMMdd');
    const textToCopy = `${formattedDate} ${title}`;
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-full">
      <div className="w-full border border-[var(--border-divider)] rounded-xl overflow-hidden grid grid-cols-[56px_repeat(7,1fr)]">
        <div className="p-2 border-r border-b border-[var(--border-divider)] bg-[var(--bg-card-solid)]"></div>
        {days.map((d, i) => (
          <div key={d.toString()} className="text-center py-2.5 border-b border-l border-[var(--border-divider)] bg-[var(--bg-card-solid)] min-w-0">
            <div className="font-semibold text-[13px] text-[var(--text-secondary)]">{weekDays[i]}</div>
            <div className="text-[12px] opacity-70 mt-0.5">{format(d, 'M/d')}</div>
          </div>
        ))}

        {/* Morning row */}
        <div className="flex flex-col items-center justify-start p-2 border-r border-[var(--border-divider)] bg-[var(--warning-light)] text-[var(--warning)] font-semibold text-[12px] pt-4">
          <Sun size={16} className="mb-1" />
          上午
        </div>
        {days.map(d => {
          const dStr = format(d, 'yyyy-MM-dd');
          const evs = getDayEvents(dStr, 'morning');
          return (
            <div 
              key={`m-${dStr}`} 
              className="min-h-[120px] p-2 border-r border-b border-[var(--border-divider)] bg-[#fdcb6e0a] hover:bg-[var(--warning-light)]/50 transition-colors cursor-pointer flex flex-col gap-1.5"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, dStr, 'morning')}
            >
              {evs.map(e => {
                const cat = categories.find(c => e.categories?.includes(c.id)) || categories[0];
                return (
                <div 
                  key={e.id} 
                  draggable
                  onDragStart={(evt) => handleDragStart(evt, e.id)}
                  onClick={(evt) => { evt.stopPropagation(); setEditingScheduleId(e.id); }}
                  className="group relative text-[12px] p-2 pr-6 rounded-md text-white leading-tight flex-shrink-0 min-h-[50px] flex flex-col justify-center cursor-pointer hover:opacity-90 shadow-sm transition-transform active:scale-95 cursor-grab active:cursor-grabbing font-medium"
                  style={{ backgroundColor: cat?.color || '#3b82f6' }}
                >
                  <Tooltip content={
                    <div className="flex flex-col gap-1.5 p-1 w-[220px]">
                      <div className="font-bold text-[15px] truncate">{e.title}</div>
                      <div className="text-[13px] opacity-90">
                        {e.date} · 上午 · {e.status === 'completed' ? '已完成' : '待办'}
                      </div>
                      {e.time && <div className="text-[14px] opacity-80">上午{e.time}</div>}
                    </div>
                  }>
                    <div className="w-full text-left line-clamp-2">{e.title}</div>
                  </Tooltip>
                  <div 
                    onClick={(evt) => toggleStatus(evt, e.id, e.status)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-white/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:border-white"
                  >
                    {e.status === 'completed' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              )})}
            </div>
          );
        })}

        {/* Afternoon row */}
        <div className="flex flex-col items-center justify-start p-2 border-r border-t-0 border-[var(--border-divider)] bg-[var(--accent-light)] text-[var(--accent)] font-semibold text-[12px] pt-4">
          <CloudSun size={16} className="mb-1" />
          下午
        </div>
        {days.map(d => {
          const dStr = format(d, 'yyyy-MM-dd');
          const evs = getDayEvents(dStr, 'afternoon');
          return (
            <div 
              key={`a-${dStr}`} 
              className="min-h-[120px] p-2 border-r border-[var(--border-divider)] bg-[#0071e30a] hover:bg-[var(--accent-light)]/50 transition-colors cursor-pointer flex flex-col gap-1.5"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, dStr, 'afternoon')}
            >
              {evs.map(e => {
                const cat = categories.find(c => e.categories?.includes(c.id)) || categories[0];
                return (
                <div 
                  key={e.id} 
                  draggable
                  onDragStart={(evt) => handleDragStart(evt, e.id)}
                  onClick={(evt) => { evt.stopPropagation(); setEditingScheduleId(e.id); }}
                  className="group relative text-[12px] p-2 pr-6 rounded-md text-white leading-tight flex-shrink-0 min-h-[50px] flex flex-col justify-center cursor-pointer hover:opacity-90 shadow-sm transition-transform active:scale-95 cursor-grab active:cursor-grabbing font-medium"
                  style={{ backgroundColor: cat?.color || '#3b82f6' }}
                >
                  <Tooltip content={
                    <div className="flex flex-col gap-1.5 p-1 w-[220px]">
                      <div className="font-bold text-[15px] truncate">{e.title}</div>
                      <div className="text-[13px] opacity-90">
                        {e.date} · 下午 · {e.status === 'completed' ? '已完成' : '待办'}
                      </div>
                      {e.time && <div className="text-[14px] opacity-80">下午{e.time}</div>}
                    </div>
                  }>
                    <div className="w-full text-left line-clamp-2">{e.title}</div>
                  </Tooltip>
                  <div 
                    onClick={(evt) => toggleStatus(evt, e.id, e.status)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-white/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:border-white"
                  >
                    {e.status === 'completed' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              )})}
            </div>
          );
        })}
      </div>

      {/* Week Events List */}
      <div className="bg-[var(--bg-card-solid)] border border-[var(--border-divider)] rounded-2xl p-6 shadow-sm mb-12">
        <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2">
          <CalendarDays size={18} className="text-[var(--accent)]" />
          本周日程清单
        </h3>
        
        {weekEvents.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-secondary)] text-[14px]">
            本周暂无日程安排
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {weekEvents.map(s => {
              const dowObj = new Date(s.date);
              dowObj.setHours(0,0,0,0);
              let dowStr = weekDays[dowObj.getDay()];
              if (dowObj.getTime() === todayDate.getTime()) dowStr = '今天';
              else if (dowObj.getTime() === tomorrow.getTime()) dowStr = '明天';
              else if (dowObj.getTime() === dayAfter.getTime()) dowStr = '后天';
              
              return (
                <div 
                  key={s.id} 
                  onClick={() => setEditingScheduleId(s.id)}
                  className="group flex flex-col p-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--accent)] hover:shadow-md transition-all cursor-pointer bg-[var(--bg-primary)]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={cn("font-bold text-[15px] group-hover:text-[var(--accent)] transition-colors line-clamp-2 pr-2", s.status === 'completed' && "line-through text-[var(--text-tertiary)] group-hover:text-[var(--text-tertiary)]")}>
                      {s.title}
                    </div>
                    <div className="flex items-center shrink-0 ml-1">
                      <button 
                        onClick={(evt) => handleCopyTitle(evt, s.date, s.title)}
                        className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] rounded-md transition-colors opacity-0 group-hover:opacity-100 mr-1"
                        title="复制为 YYYYMMDD 格式"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        onClick={(evt) => toggleStatus(evt, s.id, s.status)}
                        className="p-1 mt-0.5 text-[var(--text-tertiary)] hover:text-[var(--success)] transition-colors"
                      >
                        {s.status === 'completed' ? (
                          <CheckCircle2 size={20} className="text-[var(--success)]" />
                        ) : (
                          <Circle size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className={cn("mt-auto grid grid-cols-2 gap-y-2 gap-x-4 text-[13px] text-[var(--text-secondary)]", s.status === 'completed' && "opacity-60")}>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={14} className="opacity-70" />
                      <span className="text-[var(--text-primary)] font-medium">{dowStr}</span>
                      <span className="opacity-75 relative top-[0.5px]">({format(dowObj, 'MM-dd')})</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="opacity-70" />
                      <span className="truncate">{s.timeSlot === 'morning' ? '上午' : '下午'}{s.time ? ` ${s.time}` : ''}</span>
                    </div>

                    {s.location && (
                      <div className="flex items-center gap-1.5 col-span-2 mt-0.5">
                        <MapPin size={14} className="opacity-70 shrink-0" />
                        <span className="truncate">{s.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
