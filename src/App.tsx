/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useStore } from './store';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DayView } from './components/DayView';
import { WeekView } from './components/WeekView';
import { MonthView } from './components/MonthView';
import { QuickFab } from './components/QuickFab';
import { RightPanel } from './components/RightPanel';
import { cn } from './lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { EditModal } from './components/EditModal';
import { SyncModal } from './components/SyncModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { ApiModal } from './components/ApiModal';

export default function App() {
  const { theme, themePreset, animations, isSidebarOpen, isRightPanelOpen, viewMode, currentDate, setViewMode, setCurrentDate, isSyncModalOpen, setIsSyncModalOpen, isCloudSyncModalOpen, setIsCloudSyncModalOpen } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    const resolvedTheme = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-preset', themePreset);
    root.setAttribute('data-anim', animations ? 'on' : 'off');
  }, [theme, themePreset, animations]);

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const getNavLabel = () => {
    if (viewMode === 'day') return format(currentDate, 'MMM do EEE', { locale: zhCN });
    if (viewMode === 'week') return "本周";
    return format(currentDate, 'yyyy年 MMMM', { locale: zhCN });
  };

  return (
    <div className="flex h-screen relative bg-[var(--bg-primary)] overflow-hidden">
      <Sidebar />

      <main className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 relative",
        (!isSidebarOpen && !isRightPanelOpen) && "w-full"
      )}>
        <Topbar />
        
        <div className="px-4 md:px-8 py-3 flex items-center justify-between border-b border-[var(--border-divider)] gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="w-9 h-9 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] flex items-center justify-center transition-colors"><ChevronLeft size={18}/></button>
            <div className="text-[17px] font-semibold min-w-[140px] md:min-w-[160px] text-center tracking-tight">{getNavLabel()}</div>
            <button onClick={handleNext} className="w-9 h-9 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] flex items-center justify-center transition-colors"><ChevronRight size={18}/></button>
            <button onClick={handleToday} className="px-4 py-1.5 ml-0 md:ml-2 text-[13px] font-medium rounded-md bg-[var(--bg-hover)] text-[var(--text-primary)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors">今天</button>
          </div>
          
          <div className="flex gap-0.5 bg-[var(--bg-hover)] rounded-md p-0.5">
            <button onClick={() => setViewMode('day')} className={cn("px-4 py-1.5 rounded-md text-[13px] font-medium transition-all", viewMode === 'day' ? "bg-[var(--bg-card-solid)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}>日</button>
            <button onClick={() => setViewMode('week')} className={cn("px-4 py-1.5 rounded-md text-[13px] font-medium transition-all", viewMode === 'week' ? "bg-[var(--bg-card-solid)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}>周</button>
            <button onClick={() => setViewMode('month')} className={cn("px-4 py-1.5 rounded-md text-[13px] font-medium transition-all", viewMode === 'month' ? "bg-[var(--bg-card-solid)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}>月</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 relative">
          {viewMode === 'day' && <DayView />}
          {viewMode === 'week' && <WeekView />}
          {viewMode === 'month' && <MonthView />}
        </div>
      </main>

      <RightPanel />
      <QuickFab />
      <EditModal />
      {isSyncModalOpen && <SyncModal onClose={() => setIsSyncModalOpen(false)} />}
      {isCloudSyncModalOpen && <CloudSyncModal onClose={() => setIsCloudSyncModalOpen(false)} />}
      <ApiModal />
    </div>
  );
}
