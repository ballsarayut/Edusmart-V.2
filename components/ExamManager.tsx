
import React, { useState } from 'react';
import { saveMultipleToFirestore } from '../firebaseService';
import { StudyBlock } from '../types';
import { CalendarDays, Save, CheckCircle2, Info, Clock, GraduationCap } from 'lucide-react';

interface ExamManagerProps {
  studyBlocks: StudyBlock[];
  setStudyBlocks: (blocks: StudyBlock[]) => void;
}

const ExamManager: React.FC<ExamManagerProps> = ({ studyBlocks, setStudyBlocks }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdateExamInfo = (blockId: number, field: 'examDate' | 'examTime', value: string) => {
    const updated = studyBlocks.map(b => 
      b.id === blockId ? { ...b, [field]: value } : b
    );
    setStudyBlocks(updated);
    setSuccess(false);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    
    // Save to Firestore
    await saveMultipleToFirestore('blocks', studyBlocks);
    
    setIsSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-blue-600 text-white rounded-[24px] shadow-xl shadow-blue-100">
            <CalendarDays size={32} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-heading">จัดการกำหนดการสอบ</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">ตั้งค่าวันและเวลาสอบประจำแต่ละบล็อกเรียน</p>
          </div>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={isSaving}
          className={`px-10 py-5 rounded-[24px] font-black uppercase text-xs tracking-widest shadow-2xl transition-all flex items-center gap-3 active:scale-95 ${
            success ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-black'
          }`}
        >
          {isSaving ? <Clock className="animate-spin" size={18} /> : success ? <CheckCircle2 size={18} /> : <Save size={18} />}
          {isSaving ? 'กำลังบันทึก...' : success ? 'บันทึกสำเร็จ' : 'บันทึกข้อมูลทั้งหมด'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {studyBlocks.map((block) => (
          <div key={block.id} className={`bg-white p-8 rounded-[40px] border-2 transition-all group overflow-hidden relative ${block.isActive ? 'border-blue-500 shadow-lg' : 'border-slate-100'}`}>
            {block.isActive && (
              <div className="absolute top-0 right-0 px-6 py-2 bg-blue-500 text-white rounded-bl-[20px] text-[10px] font-black uppercase tracking-widest">
                บล็อกเรียนปัจจุบัน
              </div>
            )}
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center font-black text-3xl shadow-xl shrink-0 ${block.isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {block.id}
              </div>
              
              <div className="flex-1 space-y-2 text-center md:text-left">
                <h3 className="text-xl font-black text-slate-900 font-heading">{block.name}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                  ช่วงเวลาเรียน: {new Date(block.startDate).toLocaleDateString('th-TH')} - {new Date(block.endDate).toLocaleDateString('th-TH')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto">
                <div className="space-y-2 flex-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">วันสอบ</label>
                  <div className="relative">
                    <GraduationCap className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${block.examDate ? 'text-blue-600' : 'text-slate-300'}`} size={18} />
                    <input 
                      type="date" 
                      value={block.examDate || block.endDate}
                      onChange={(e) => handleUpdateExamInfo(block.id, 'examDate', e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl pl-12 pr-4 py-4 font-black outline-none transition-all shadow-inner text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 flex-1 sm:w-40">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">เวลาเริ่มสอบ</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="time" 
                      value={block.examTime || "08:30"}
                      onChange={(e) => handleUpdateExamInfo(block.id, 'examTime', e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl pl-12 pr-4 py-4 font-black outline-none transition-all shadow-inner text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 p-8 rounded-[40px] border-2 border-amber-100 flex gap-5 items-start">
        <div className="p-3 bg-white rounded-2xl text-amber-500 shadow-sm"><Info size={24} /></div>
        <div className="space-y-1">
          <p className="text-sm font-black text-amber-900 font-heading uppercase">ระบบแจ้งเตือนตามจริง</p>
          <p className="text-xs text-amber-800 font-bold leading-relaxed">
            แอดมินสามารถกำหนดเวลาเริ่มสอบได้ หากไม่กำหนดระบบจะใช้ค่าเริ่มต้นคือ 08:30 น. 
            การแจ้งเตือนแบบนับถอยหลัง (Countdown) จะปรากฏอัตโนมัติเมื่อเหลือเวลาไม่ถึง 24 ชั่วโมงก่อนเริ่มสอบจริง
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExamManager;
