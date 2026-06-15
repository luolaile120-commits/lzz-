import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, format, startOfWeek, addWeeks, startOfMonth, addMonths } from 'date-fns';

export type Priority = 'high' | 'medium' | 'low';
export type ScheduleStatus = 'todo' | 'in-progress' | 'completed';
export type TimeSlot = 'morning' | 'afternoon';
export type ViewMode = 'day' | 'week' | 'month';
export type ThemePreset = 'default' | 'aurora' | 'sunset' | 'ocean' | 'forest' | 'rose';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Schedule {
  id: string;
  title: string;
  desc?: string;
  location?: string;
  time?: string;
  date: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  priority: Priority;
  categories: string[];
  organizer: string[];
  participant: string[];
  status: ScheduleStatus;
  createTime: string;
  reminder?: string;
  notes?: string;
  leaders?: string;
  department?: string;
}

export interface PermanentTask {
  id: string;
  title: string;
  desc?: string;
  timeSlot: TimeSlot;
  categories: string[];
  priority: Priority;
  recurrence: {
    type: 'weekly';
    weekdays: number[]; // 0-6 (0 is Sunday)
  };
  reminder?: string;
}

const defaultCategories: Category[] = [
  { id: '1', name: '拍摄', color: '#f97316' }, // 橙色
  { id: '2', name: '会议', color: '#ef4444' }, // 红色
  { id: '3', name: '出差', color: '#3b82f6' }, // 蓝色
];

interface AppState {
  schedules: Schedule[];
  permanentTasks: PermanentTask[];
  categories: Category[];
  organizers: string[];
  participants: string[];
  
  // UI State
  viewMode: ViewMode;
  currentDate: Date;
  searchQuery: string;
  filterCategories: string[];
  isSidebarOpen: boolean;
  isRightPanelOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  themePreset: ThemePreset;
  animations: boolean;
  editingScheduleId: string | null;
  isSyncModalOpen: boolean;
  isApiModalOpen: boolean;
  geminiApiKey: string;

  // Actions
  addSchedule: (s: Omit<Schedule, 'id' | 'createTime'>) => void;
  updateSchedule: (id: string, s: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  
  setViewMode: (mode: ViewMode) => void;
  setCurrentDate: (date: Date) => void;
  setSearchQuery: (query: string) => void;
  toggleFilterCategory: (id: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setThemePreset: (preset: ThemePreset) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  setEditingScheduleId: (id: string | null) => void;
  setIsSyncModalOpen: (open: boolean) => void;
  setIsApiModalOpen: (open: boolean) => void;
  setGeminiApiKey: (key: string) => void;
  importData: (data: Partial<AppState>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      schedules: [],
      permanentTasks: [],
      categories: defaultCategories,
      organizers: [],
      participants: [],
      
      viewMode: 'week',
      currentDate: new Date(),
      searchQuery: '',
      filterCategories: [],
      isSidebarOpen: true,
      isRightPanelOpen: true,
      theme: 'system',
      themePreset: 'default',
      animations: true,
      editingScheduleId: null,
      isSyncModalOpen: false,
      isApiModalOpen: false,
      geminiApiKey: '',

      addSchedule: (s) => set((state) => ({
        schedules: [...state.schedules, { 
          ...s, 
          id: Date.now().toString(),
          createTime: new Date().toISOString()
        }]
      })),
      
      updateSchedule: (id, updates) => set((state) => ({
        schedules: state.schedules.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      
      deleteSchedule: (id) => set((state) => ({
        schedules: state.schedules.filter(s => s.id !== id)
      })),

      setViewMode: (mode) => set({ viewMode: mode }),
      setCurrentDate: (date) => set({ currentDate: date }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      toggleFilterCategory: (id) => set((state) => ({
        filterCategories: state.filterCategories.includes(id) 
          ? state.filterCategories.filter(c => c !== id)
          : [...state.filterCategories, id]
      })),
      setTheme: (theme) => set({ theme }),
      setThemePreset: (themePreset) => set({ themePreset }),
      toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
      toggleRightPanel: () => set(state => ({ isRightPanelOpen: !state.isRightPanelOpen })),
      setEditingScheduleId: (id) => set({ editingScheduleId: id }),
      setIsSyncModalOpen: (open) => set({ isSyncModalOpen: open }),
      setIsApiModalOpen: (open) => set({ isApiModalOpen: open }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      importData: (data) => set((state) => ({ ...state, ...data }))
    }),
    {
      name: 'schedule-store-v1',
      // Hydration workaround
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        categories: defaultCategories, // Force categories to be overridden
        currentDate: new Date(), // Reset current date to today on load
      })
    }
  )
);
