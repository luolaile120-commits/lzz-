import React, { useState } from 'react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { X, CalendarCheck, ChevronLeft, ChevronRight, CheckCircle2, Circle, Copy } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Tooltip } from './Tooltip';

export function RightPanel() {
  const { isRightPanelOpen, toggleRightPanel, schedules, setEditingScheduleId, currentDate, categories, setCurrentDate, setViewMode, updateSchedule } = useStore();
  const [activeTab, setActiveTab] = useState<'todo' | 'completed' | 'permanent'>('todo');

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


  const incompleteSchedules = schedules.filter(s => s.status !== 'completed').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const completedSchedules = schedules.filter(s => s.status === 'completed').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const permanentSchedules = schedules.filter(s => s.priority === 'low'); // Just using low priority as placeholder for "permanent" if not strictly defined.

  const displaySchedules = activeTab === 'todo' ? incompleteSchedules : activeTab === 'completed' ? completedSchedules : permanentSchedules;

  // Mini Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  const handleDayClick = (dayStr: string) => {
    setCurrentDate(new Date(dayStr));
    setViewMode('day');
  };

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const dayStr = format(day, 'yyyy-MM-dd');
        const daySchedules = schedules.filter(s => s.date === dayStr).sort((a, b) => {
          if (a.timeSlot !== b.timeSlot) return a.timeSlot === 'morning' ? -1 : 1;
          return a.time?.localeCompare(b.time || '') || 0;
        });
        const hasSchedules = daySchedules.length > 0;

        const dayContent = (
          <div
            className={cn(
              "w-8 h-8 flex flex-col items-center justify-center rounded-full text-[13px] transition-colors relative cursor-pointer",
              !isSameMonth(day, monthStart)
                ? "text-[var(--text-tertiary)] opacity-40"
                : isSameDay(day, currentDate)
                ? "bg-[var(--accent)] text-white font-semibold shadow-sm"
                : isToday(day)
                ? "text-[var(--accent)] font-bold bg-[var(--accent-light)]"
                : "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            )}
            key={day.toString()}
            onClick={() => handleDayClick(dayStr)}
          >
            <span>{formattedDate}</span>
            {hasSchedules && (
                <div className={cn("absolute bottom-1 w-1 h-1 rounded-full", isSameDay(day, currentDate) ? "bg-white" : "bg-[var(--accent)]")}></div>
            )}
          </div>
        );

        if (hasSchedules) {
          days.push(
            <div key={day.toString()} className="w-8 h-8">
              <Tooltip 
                placement="left"
                content={
                  <div className="flex flex-col gap-2 p-1">
                    <div className="font-bold text-[14px] pb-1 border-b border-[var(--border-divider)] mb-1">{format(day, 'MM月dd日', { locale: zhCN })}</div>
                    {daySchedules.map(s => (
                      <div key={s.id} className="flex flex-col gap-0.5">
                        <div className="text-[13px] font-medium leading-tight line-clamp-1">{s.title}</div>
                        <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
                          {s.timeSlot === 'morning' ? '上午' : '下午'}{s.time && ` ${s.time}`}
                          {s.location && ` · ${s.location}`}
                        </div>
                      </div>
                    ))}
                  </div>
                }
              >
                {dayContent}
              </Tooltip>
            </div>
          );
        } else {
          days.push(dayContent);
        }
        
        day = addDays(day, 1);
    }
    rows.push(
        <div className="flex justify-between w-full" key={day.toString()}>
        {days}
        </div>
    );
    days = [];
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // Stats
  const todaySchedules = schedules.filter(s => isSameDay(new Date(s.date), new Date()));
  const todayCompleted = todaySchedules.filter(s => s.status === 'completed').length;
  const inProgress = schedules.filter(s => s.status === 'in-progress').length;

  return (
    <aside className={cn(
      "fixed inset-y-0 right-0 w-full sm:w-[340px] md:relative md:min-w-[340px] glass-sidebar border-l border-[var(--border-divider)] flex flex-col transition-all duration-300 z-50 md:z-30 shadow-2xl md:shadow-none",
      !isRightPanelOpen && "translate-x-[100%] opacity-0 pointer-events-none absolute md:-right-[340px] md:translate-x-0"
    )}>
      <div className="p-6 pb-4 flex justify-between items-center">
        <h2 className="text-[18px] font-bold tracking-tight">
          {format(currentDate, 'yyyy年M月', { locale: zhCN })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleRightPanel}
            className="w-7 h-7 rounded-full bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {/* Mini Calendar */}
        <div className="px-6 pb-4 border-b border-[var(--border-divider)]">
            <div className="flex justify-between mb-2">
                {weekDays.map(wd => (
                    <div key={wd} className="w-8 text-center text-[12px] text-[var(--text-secondary)] font-medium">
                        {wd}
                    </div>
                ))}
            </div>
            <div className="space-y-1">
                {rows}
            </div>
        </div>

        {/* Status Bars */}
        <div className="px-6 py-5 border-b border-[var(--border-divider)] space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-12 text-[13px] text-[var(--text-secondary)]">今日</div>
                <div className="flex-1 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent)] rounded-full transition-all" style={{ width: todaySchedules.length ? `${(todayCompleted / todaySchedules.length) * 100}%` : '0%' }} />
                </div>
                <div className="w-8 text-right text-[13px] font-medium">{todayCompleted}/{todaySchedules.length}</div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-12 text-[13px] text-[var(--text-secondary)]">待办</div>
                <div className="flex-1 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--warning)] rounded-full transition-all" style={{ width: `${Math.min(100, incompleteSchedules.length * 5)}%` }} />
                </div>
                <div className="w-8 text-right text-[13px] font-medium">{incompleteSchedules.length}</div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-12 text-[13px] text-[var(--text-secondary)]">进行中</div>
                <div className="flex-1 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, inProgress * 5)}%` }} />
                </div>
                <div className="w-8 text-right text-[13px] font-medium">{inProgress}</div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-12 text-[13px] text-[var(--text-secondary)]">已完成</div>
                <div className="flex-1 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--success)] rounded-full transition-all" style={{ width: `${Math.min(100, completedSchedules.length * 5)}%` }} />
                </div>
                <div className="w-8 text-right text-[13px] font-medium">{completedSchedules.length}</div>
            </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-[var(--border-divider)]">
            <div className="flex bg-[var(--bg-hover)] rounded-lg p-1 relative">
                <div 
                    className="absolute top-1 bottom-1 w-[calc(33.333%-2.66px)] bg-[var(--bg-card-solid)] rounded-md shadow-sm transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(${activeTab === 'todo' ? '0' : activeTab === 'completed' ? '100%' : '200%'})`, left: activeTab === 'todo' ? '4px' : activeTab === 'completed' ? '8px' : '12px' }}
                />
                <button onClick={() => setActiveTab('todo')} className={cn("flex-1 py-1.5 text-[13px] font-medium relative z-10 transition-colors", activeTab === 'todo' ? "text-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}>未完成</button>
                <button onClick={() => setActiveTab('completed')} className={cn("flex-1 py-1.5 text-[13px] font-medium relative z-10 transition-colors", activeTab === 'completed' ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}>已完成</button>
                <button onClick={() => setActiveTab('permanent')} className={cn("flex-1 py-1.5 text-[13px] font-medium relative z-10 transition-colors", activeTab === 'permanent' ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}>常驻</button>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 px-6 py-4 space-y-4">
          {displaySchedules.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-tertiary)] text-[13px]">
              <p>这里空空如也~</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displaySchedules.map(s => {
                const cat = categories.find(c => s.categories && s.categories.includes(c.id)) || categories[0];
                return (
                  <div 
                    key={s.id} 
                    onClick={() => setEditingScheduleId(s.id)}
                    className="flex gap-3 group relative cursor-pointer"
                  >
                    <div className="mt-1.5 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0 border-b border-[var(--border-divider)] pb-4 group-last:border-0 group-last:pb-0">
                      <div className="flex items-start justify-between">
                        <div className={cn("font-semibold text-[14px] leading-tight block truncate transition-colors pr-2", s.status === 'completed' ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-primary)] group-hover:text-[var(--accent)]")}>
                          {s.title}
                        </div>
                        <div className="flex items-center shrink-0 ml-1">
                          <button 
                            onClick={(evt) => handleCopyTitle(evt, s.date, s.title)}
                            className="p-1 px-[5px] text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                            title="复制为 YYYYMMDD 格式"
                          >
                            <Copy size={14} />
                          </button>
                          <button 
                            onClick={(evt) => toggleStatus(evt, s.id, s.status)}
                            className="p-1 ml-0.5 text-[var(--text-tertiary)] hover:text-[var(--success)] transition-colors flex-shrink-0"
                          >
                            {s.status === 'completed' ? (
                              <CheckCircle2 size={16} className="text-[var(--success)]" />
                            ) : (
                              <Circle size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className={cn("text-[12px] text-[var(--text-secondary)] mt-1.5 flex items-center flex-wrap gap-x-2 gap-y-1", s.status === 'completed' && "opacity-60")}>
                        <span className="shrink-0">{format(new Date(s.date), 'yyyy-MM-dd')}</span>
                        {s.timeSlot === 'morning' ? <span>· 上午</span> : <span>· 下午</span>}
                        {s.status === 'completed' ? <span>· 已完成</span> : <span>· 待办</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
