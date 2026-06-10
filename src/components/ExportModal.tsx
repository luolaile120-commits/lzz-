import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useStore } from '../store';
import { format, getISOWeek, getISOWeeksInYear, startOfISOWeek, endOfISOWeek, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel } from "docx";
import * as XLSX from 'xlsx';

export function ExportModal({ onClose }: { onClose: () => void }) {
  const { schedules, categories } = useStore();
  const [rangeType, setRangeType] = useState<'week' | 'day'>('week');
  const [year, setYear] = useState(new Date().getFullYear());
  const [week, setWeek] = useState(getISOWeek(new Date()));
  const [dateStr, setDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formatType, setFormatType] = useState<'word' | 'excel'>('word');
  const [docTitle, setDocTitle] = useState('');

  const weeksInYear = getISOWeeksInYear(new Date(year, 0, 1));
  
  const weekDateRange = useMemo(() => {
    if (year && week && week > 0 && week <= weeksInYear) {
      let d = new Date(year, 0, 4);
      const day = d.getDay() || 7;
      d.setDate(d.getDate() - day + 1 + (week - 1) * 7);
      
      const start = startOfISOWeek(d);
      const end = endOfISOWeek(d);
      return `第${week}周 （${format(start, 'M月d日')}—${format(end, 'M月d日')}）`;
    }
    return '';
  }, [year, week, weeksInYear]);

  const handleExport = async () => {
    let filteredSchedules = [...schedules];
    let start, end;
    
    if (rangeType === 'week') {
      let d = new Date(year, 0, 4);
      const day = d.getDay() || 7;
      d.setDate(d.getDate() - day + 1 + (week - 1) * 7);
      start = startOfISOWeek(d);
      end = endOfISOWeek(d);
    } else {
      start = startOfDay(parseISO(dateStr));
      end = endOfDay(parseISO(dateStr));
    }
    
    filteredSchedules = schedules.filter(s => {
      const sDate = parseISO(s.date);
      return isWithinInterval(sDate, { start, end });
    });
    
    filteredSchedules.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.timeSlot !== b.timeSlot) {
        return a.timeSlot === 'morning' ? -1 : 1;
      }
      return (a.time || '').localeCompare(b.time || '');
    });

    const defaultTitle = rangeType === 'week' ? `${year}年第${week}周日程` : `${format(parseISO(dateStr), 'yyyy年MM月dd日')}日程`;
    const finalTitle = docTitle.trim() || defaultTitle;

    if (formatType === 'excel') {
      const wsData = [
        ['日期', '时段', '时间', '类型', '标题', '地点', '备注']
      ];

      filteredSchedules.forEach(s => {
        const cat = categories.find(c => s.categories && s.categories.includes(c.id));
        wsData.push([
          s.date,
          s.timeSlot === 'morning' ? '上午' : '下午',
          s.time || '',
          cat ? cat.name : '',
          s.title || '',
          s.location || '',
          s.notes || ''
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "日程");
      XLSX.writeFile(wb, `${finalTitle}.xlsx`);
      
    } else if (formatType === 'word') {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: finalTitle,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            ...filteredSchedules.map(s => {
              const cat = categories.find(c => s.categories && s.categories.includes(c.id));
              return new Paragraph({
                children: [
                  new TextRun({ text: `日期：`, bold: true }),
                  new TextRun({ text: `${s.date} ${s.timeSlot === 'morning' ? '上午' : '下午'} ${s.time || ''} ` }),
                  new TextRun({ text: `类型：`, bold: true }),
                  new TextRun({ text: `${cat ? cat.name : ''}\n` }),
                  new TextRun({ text: `标题：`, bold: true }),
                  new TextRun({ text: `${s.title}\n` }),
                  ...(s.location ? [
                    new TextRun({ text: `地点：`, bold: true }),
                    new TextRun({ text: `${s.location}\n` })
                  ] : []),
                  ...(s.notes ? [
                    new TextRun({ text: `备注：`, bold: true }),
                    new TextRun({ text: `${s.notes}\n` })
                  ] : []),
                ],
                spacing: { after: 200 }
              });
            })
          ],
        }],
      });

      Packer.toBlob(doc).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${finalTitle}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
    
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-[var(--bg-card-solid)] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 z-10">
        <div className="px-5 py-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">导出日程数据</h2>
          <button onClick={onClose} className="p-1.5 -mr-1.5 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors bg-[var(--bg-subtle)]">
            <X size={18} />
          </button>
        </div>
        
        <div className="px-6 py-2 overflow-y-auto max-h-[80vh] flex flex-col gap-6">
          <div className="space-y-3">
            <label className="text-[14px] font-medium text-[var(--text-secondary)] block">导出范围</label>
            <div className="flex gap-2">
              <button
                onClick={() => setRangeType('week')}
                className={`flex-1 py-2.5 text-[14px] rounded-xl border transition-all ${rangeType === 'week' ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)] font-medium shadow-sm' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)] bg-transparent'}`}
              >
                按周选择
              </button>
              <button
                onClick={() => setRangeType('day')}
                className={`flex-1 py-2.5 text-[14px] rounded-xl border transition-all ${rangeType === 'day' ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)] font-medium shadow-sm' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)] bg-transparent'}`}
              >
                按天选择
              </button>
            </div>
            
            <div className="pt-2">
              {rangeType === 'week' ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[13px] font-medium text-[var(--text-secondary)] block">年份</label>
                      <input 
                        type="number" 
                        value={year} 
                        onChange={(e) => setYear(Number(e.target.value))} 
                        className="w-full px-3 py-2.5 bg-transparent border border-[var(--border-color)] focus:border-[var(--accent)] rounded-xl outline-none text-[15px] transition-colors"
                      />
                    </div>
                    <div className="flex-[1.5] space-y-1.5">
                      <label className="text-[13px] font-medium text-[var(--text-secondary)] block">周数</label>
                      <input 
                        type="number" 
                        min={1} 
                        max={weeksInYear} 
                        value={week} 
                        onChange={(e) => setWeek(Number(e.target.value))} 
                        className="w-full px-3 py-2.5 bg-transparent border border-[var(--border-color)] focus:border-[var(--accent)] rounded-xl outline-none text-[15px] transition-colors"
                      />
                      <div className="text-[12px] text-[var(--text-tertiary)]">{year}年共{weeksInYear}周</div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-[var(--bg-subtle)] rounded-xl text-[14px] text-[var(--text-secondary)]">
                    {weekDateRange}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[13px] font-medium text-[var(--text-secondary)] block">选择日期</label>
                  <input 
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full px-3 py-2.5 bg-transparent border border-[var(--border-color)] focus:border-[var(--accent)] rounded-xl outline-none text-[15px] transition-colors"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-[14px] font-medium text-[var(--text-secondary)] block">导出格式</label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormatType('word')}
                className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-[14px] transition-all bg-[var(--bg-card-solid)] ${
                  formatType === 'word' 
                    ? 'border-[var(--accent)] text-[var(--accent)] font-medium shadow-sm' 
                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                }`}
              >
                <FileText size={18} />
                Word文档
              </button>
              <button
                onClick={() => setFormatType('excel')}
                className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-[14px] transition-all bg-[var(--bg-card-solid)] ${
                  formatType === 'excel' 
                    ? 'border-[#107c41] text-[#107c41] font-medium shadow-sm ring-1 ring-[#107c41]/20' 
                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                }`}
              >
                <FileSpreadsheet size={18} />
                Excel表格
              </button>
            </div>
          </div>
          
          <div className="space-y-1.5 mb-2">
            <label className="text-[14px] font-medium text-[var(--text-secondary)] block">文档标题 <span className="opacity-60 font-normal">(Word导出用)</span></label>
            <input 
              type="text"
              placeholder="留空使用默认标题"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-transparent border border-[var(--border-color)] focus:border-[var(--accent)] rounded-xl outline-none text-[14px] transition-colors"
            />
          </div>
        </div>
        
        <div className="px-6 py-5 border-t border-[var(--border-divider)] flex justify-end gap-3 rounded-b-2xl mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-[15px] font-medium bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2.5 text-[15px] font-medium bg-[#0066ff] text-white hover:bg-[#0052cc] rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download size={18} />
            确认导出
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
