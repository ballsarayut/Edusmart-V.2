
import React, { useState } from 'react';
import { saveMultipleToFirestore } from '../firebaseService';
import { StudyBlock } from '../types';
import { 
  Layers, 
  Sun, 
  Trash2, 
  X,
  CalendarDays
} from 'lucide-react';

interface SystemSettingsProps {
  studyBlocks: StudyBlock[];
  setStudyBlocks: (blocks: StudyBlock[]) => void;
}

const BLOCK_COLORS = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 'bg-emerald-600'];

const SystemSettings: React.FC<SystemSettingsProps> = ({ studyBlocks, setStudyBlocks }) => {
  const [deletingDate, setDeletingDate] = useState<{ blockId: number; date: string } | null>(null);

  const handleUpdateBlock = (id: number, field: keyof StudyBlock, value: any) => {
    const updated = studyBlocks.map(block => 
      block.id === id ? { ...block, [field]: value } : block
    );
    // Save to Firestore
    saveMultipleToFirestore('blocks', updated);
    setStudyBlocks(updated);
  };

  const processRemoveHoliday = (blockId: number, date: string) => {
    const updated = studyBlocks.map(block => block.id === blockId ? { ...block, holidays: block.holidays.filter(d => d !== date) } : block);
    // Save to Firestore
    saveMultipleToFirestore('blocks', updated);
    setStudyBlocks(updated);
    setDeletingDate(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-7xl mx-auto">
      <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-200 shadow-sm relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-slate-900 rounded-[24px] text-white shadow-2xl">
              <Layers size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight font-heading">ตั้งค่าบล็อกเรียน (Study Blocks)</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">กำหนดช่วงเวลาเรียนและวันหยุดพิเศษรายบล็อก</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-12">
          {studyBlocks.map((block, idx) => (
            <div key={block.id} className={`p-8 md:p-10 rounded-[40px] border-2 transition-all duration-500 ${block.isActive ? 'border-blue-500 bg-blue-50/20 shadow-lg shadow-blue-100/50' : 'border-slate-100 bg-white'}`}>
              <div className="flex flex-col xl:flex-row items-start xl:items-center gap-10">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl shadow-2xl text-white transition-transform duration-500 ${block.isActive ? 'scale-110 rotate-3' : ''} ${BLOCK_COLORS[idx % BLOCK_COLORS.length]}`}>
                  {block.id}
                </div>
                <div className="flex-1 space-y-4 w-full">
                   <div className="flex items-center justify-between w-full">
                     <input 
                        type="text" 
                        value={block.name} 
                        onChange={(e) => handleUpdateBlock(block.id, 'name', e.target.value)} 
                        className={`font-black text-2xl outline-none focus:ring-0 p-0 w-64 font-heading bg-transparent transition-colors ${block.isActive ? 'text-blue-900' : 'text-slate-900'}`} 
                     />
                     
                     <div className="flex items-center gap-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${block.isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                          {block.isActive ? 'เปิดใช้งานอยู่' : 'ปิดใช้งาน'}
                        </span>
                        <button 
                          onClick={() => handleUpdateBlock(block.id, 'isActive', !block.isActive)}
                          className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${block.isActive ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${block.isActive ? 'translate-x-8' : 'translate-x-0'}`}
                          />
                        </button>
                     </div>
                   </div>
                   <div className="flex flex-wrap gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">วันที่เริ่มต้น</label>
                        <input type="date" value={block.startDate} onChange={(e) => handleUpdateBlock(block.id, 'startDate', e.target.value)} className="bg-white border-2 border-slate-100 focus:border-blue-400 rounded-xl px-4 py-2 font-bold text-sm outline-none transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">วันที่สิ้นสุด</label>
                        <input type="date" value={block.endDate} onChange={(e) => handleUpdateBlock(block.id, 'endDate', e.target.value)} className="bg-white border-2 border-slate-100 focus:border-blue-400 rounded-xl px-4 py-2 font-bold text-sm outline-none transition-all" />
                      </div>
                   </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 font-heading">
                  <Sun size={14} className="text-amber-500" /> วันหยุดพิเศษในบล็อกนี้ (ถือเป็นวันมาเรียน)
                </h4>
                <div className="flex flex-wrap gap-3">
                  {block.holidays.map(date => {
                    const isConfirming = deletingDate?.blockId === block.id && deletingDate?.date === date;
                    return (
                      <div key={date} className={`flex items-center gap-3 pl-5 pr-2 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${isConfirming ? 'bg-red-600 border-red-700 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                        <span>{new Date(date).toLocaleDateString('th-TH', { dateStyle: 'long' })}</span>
                        {isConfirming ? (
                          <div className="flex gap-1 animate-in slide-in-from-right-2">
                             <button onClick={() => setDeletingDate(null)} className="p-2 hover:bg-white/10 rounded-lg transition-all"><X size={16} /></button>
                             <button onClick={() => processRemoveHoliday(block.id, date)} className="p-2 hover:bg-white/10 rounded-lg transition-all font-black text-[10px] uppercase">ยืนยัน</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingDate({ blockId: block.id, date })} className="p-2 text-slate-300 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                        )}
                      </div>
                    );
                  })}
                  <div className="relative group">
                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    <input 
                      type="date" 
                      onChange={(e) => {
                        if (!e.target.value) return;
                        handleUpdateBlock(block.id, 'holidays', [...block.holidays, e.target.value]);
                        e.target.value = '';
                      }}
                      className="bg-white border-2 border-dashed border-slate-200 rounded-2xl pl-12 pr-5 py-3 text-xs font-bold outline-none hover:border-blue-400 transition-all cursor-pointer" 
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
