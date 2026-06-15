import { useState, useEffect } from 'react';
import { useStore, Schedule, TimeSlot, Priority } from '../store';
import { cn } from '../lib/utils';
import { X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export function EditModal() {
  const { editingScheduleId, setEditingScheduleId, schedules, updateSchedule, deleteSchedule, categories } = useStore();
  const schedule = schedules.find(s => s.id === editingScheduleId);

  const [form, setForm] = useState<Partial<Schedule>>({});

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (schedule) {
      setForm({ ...schedule });
    }
  }, [schedule]);

  if (!schedule || !editingScheduleId) return null;

  const handleSave = () => {
    updateSchedule(editingScheduleId, form);
    setEditingScheduleId(null);
  };

  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
      return;
    }
    deleteSchedule(editingScheduleId);
    setEditingScheduleId(null);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-divider)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-[var(--border-divider)] flex justify-between items-center bg-[var(--bg-card-solid)] sticky top-0 z-10">
          <h3 className="text-lg font-bold">编辑日程</h3>
          <button onClick={() => setEditingScheduleId(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] transition-colors"><X size={18} /></button>
        </div>
        
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-[var(--text-secondary)]">标题</label>
            <input value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} type="text" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors" />
          </div>
          
          <div className="space-y-1.5 flex-1">
            <label className="text-[13px] font-semibold text-[var(--text-secondary)]">日期</label>
            <input value={form.date || format(new Date(), 'yyyy-MM-dd')} onChange={e => setForm({...form, date: e.target.value})} type="date" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors" />
          </div>

          <div className="space-y-1.5 flex-1">
             <label className="text-[13px] font-semibold text-[var(--text-secondary)]">参加领导</label>
             <input value={form.leaders || ''} onChange={e => setForm({...form, leaders: e.target.value})} type="text" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors" />
          </div>

          <div className="space-y-1.5 flex-1">
             <label className="text-[13px] font-semibold text-[var(--text-secondary)]">责任部门</label>
             <input value={form.department || ''} onChange={e => setForm({...form, department: e.target.value})} type="text" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors" />
          </div>

          <div className="space-y-1.5 flex-1">
            <label className="text-[13px] font-semibold text-[var(--text-secondary)]">备注</label>
            <textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors resize-none" placeholder="例如：注意事项..."></textarea>
          </div>

          <div className="flex gap-3">
            <div className="space-y-1.5 flex-1">
              <label className="text-[13px] font-semibold text-[var(--text-secondary)]">具体时间</label>
              <input value={form.time || ''} onChange={e => setForm({...form, time: e.target.value})} type="time" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors" />
            </div>
            <div className="space-y-1.5 flex-1">
              <label className="text-[13px] font-semibold text-[var(--text-secondary)]">时段</label>
              <select value={form.timeSlot || 'morning'} onChange={e => setForm({...form, timeSlot: e.target.value as TimeSlot})} className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors appearance-none">
                <option value="morning">上午</option>
                <option value="afternoon">下午</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-[var(--text-secondary)]">地点</label>
            <input value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} type="text" className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors" />
          </div>

          <div className="flex gap-3">
            <div className="space-y-1.5 flex-1">
               <label className="text-[13px] font-semibold text-[var(--text-secondary)]">分类</label>
               <select value={form.categories?.[0] || categories[0]?.id} onChange={e => setForm({...form, categories: [e.target.value]})} className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors appearance-none">
                 {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
            </div>
            
            <div className="space-y-1.5 flex-1">
               <label className="text-[13px] font-semibold text-[var(--text-secondary)]">优先级</label>
               <select value={form.priority || 'medium'} onChange={e => setForm({...form, priority: e.target.value as Priority})} className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors appearance-none">
                 <option value="high">高</option>
                 <option value="medium">中</option>
                 <option value="low">低</option>
               </select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-[var(--text-secondary)]">完成状态</label>
            <select value={form.status || 'todo'} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-solid)] text-[14px] focus:border-[var(--accent)] outline-none transition-colors appearance-none">
              <option value="todo">待办</option>
              <option value="in-progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[var(--border-divider)] flex justify-between bg-[var(--bg-card-solid)] sticky bottom-0 z-10">
          <button onClick={handleDelete} className={cn("px-4 py-2 flex items-center gap-1.5 rounded-lg transition-colors text-[13px] font-medium", deleteConfirm ? "bg-[var(--danger)] text-white hover:bg-[var(--danger)]" : "text-[var(--danger)] hover:bg-[var(--danger-light)]")}>
            <Trash2 size={16} /> {deleteConfirm ? '确认删除?' : '删除'}
          </button>
          <div className="flex gap-2">
            <button onClick={() => setEditingScheduleId(null)} className="px-4 py-2 rounded-lg bg-[var(--bg-hover)] text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">取消</button>
            <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-[var(--accent)] text-white text-[13px] font-medium hover:bg-[var(--accent-hover)] transition-colors">保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}
