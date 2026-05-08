
import React, { useState, useMemo } from 'react';
import { Student, AttendanceRecord, StudyBlock } from '../types';
import { Star, Search, Download, TrendingUp, Sun, User, Calendar, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

interface MorningScoreSummaryProps {
  students: Student[];
  attendance: AttendanceRecord[];
  studyBlocks: StudyBlock[];
}

const MorningScoreSummary: React.FC<MorningScoreSummaryProps> = ({ students, attendance, studyBlocks }) => {
  const availableLevels = useMemo(() => Array.from(new Set(students.map(s => s.level))).sort(), [students]);
  const availableDepts = useMemo(() => Array.from(new Set(students.map(s => s.department))).sort(), [students]);
  const availableRooms = useMemo(() => Array.from(new Set(students.map(s => s.room))).sort((a, b) => parseInt(a as string) - parseInt(b as string)), [students]);

  const [selectedBlockId, setSelectedBlockId] = useState<number | 'ALL'>(
    studyBlocks.find(b => b.isActive)?.id || (studyBlocks.length > 0 ? studyBlocks[0].id : 'ALL')
  );
  const [selectedLevel, setSelectedLevel] = useState<string>(availableLevels[0] || '');
  const [selectedDept, setSelectedDept] = useState<string>(availableDepts[0] || '');
  const [selectedRoom, setSelectedRoom] = useState<string>(availableRooms[0] || '');
  const [searchTerm, setSearchTerm] = useState('');

  const currentBlock = useMemo(() => 
    selectedBlockId === 'ALL' ? null : studyBlocks.find(b => b.id === selectedBlockId)
  , [selectedBlockId, studyBlocks]);

  // ฟังก์ชันคำนวณคะแนนที่ปรับปรุงใหม่: เน้นเฉพาะ MORNING และเช็คความถูกต้องของช่วงวันที่
  const calculateScore = (studentId: string) => {
    // 1. กรองเฉพาะ "เข้าแถว" (MORNING) เท่านั้น และต้องเป็น PRESENT เท่านั้น
    const studentMorningAttendance = attendance.filter(a => 
      a.studentId === studentId && 
      a.type === 'MORNING' && 
      a.status === 'PRESENT'
    );
    
    // 2. กำหนดบล็อกที่จะนำมาคำนวณ
    let blocksToProcess = currentBlock ? [currentBlock] : studyBlocks.filter(b => b.isActive);
    if (blocksToProcess.length === 0 && studyBlocks.length > 0) blocksToProcess = [studyBlocks[0]];

    // 3. นับจำนวนวันที่มาเรียนจริงในช่วงบล็อกที่กำหนด
    const actualPresentDays = studentMorningAttendance.filter(a => {
      if (selectedBlockId === 'ALL') return true;
      if (!currentBlock) return false;
      
      // เปรียบเทียบวันที่โดยตัดส่วนของเวลาออก (Normalize)
      const recordDate = a.date;
      return recordDate >= currentBlock.startDate && recordDate <= currentBlock.endDate;
    }).length;

    // 4. นับวันหยุดพิเศษ (Holidays) ในบล็อกที่เลือก (ถือเป็นวันมาเรียน)
    const holidayDays = blocksToProcess.reduce((acc, b) => {
      if (selectedBlockId !== 'ALL' && b.id !== selectedBlockId) return acc;
      return acc + (Array.isArray(b.holidays) ? b.holidays.length : 0);
    }, 0);
    
    // 5. รวมวันมาเรียนทั้งหมด
    const totalDays = actualPresentDays + holidayDays;
    
    // 6. คำนวณคะแนน (ฐาน 18 วัน = 5.0 คะแนน)
    const baseDays = 18;
    const finalScore = Math.min(5.0, (totalDays * 5) / baseDays);

    return { 
      score: Number(finalScore.toFixed(2)), 
      actualDays: actualPresentDays, 
      holidayDays: holidayDays, 
      totalDays: totalDays 
    };
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.level === selectedLevel && 
      s.department === selectedDept && 
      s.room === selectedRoom &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.includes(searchTerm))
    );
  }, [students, selectedLevel, selectedDept, selectedRoom, searchTerm]);

  const roomAverage = useMemo(() => {
    if (filteredStudents.length === 0) return "0.00";
    const total = filteredStudents.reduce((acc, s) => acc + calculateScore(s.id).score, 0);
    return (total / filteredStudents.length).toFixed(2);
  }, [filteredStudents, attendance, selectedBlockId, studyBlocks]);

  const exportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += "รหัสนักเรียน,ชื่อ-นามสกุล,มาเรียนจริง(เข้าแถว),วันหยุดพิเศษ,รวมวันมาเรียน,คะแนนเข้าแถว(5.0)\n";
    filteredStudents.forEach(s => {
      const res = calculateScore(s.id);
      csv += `${s.studentId},${s.name},${res.actualDays},${res.holidayDays},${res.totalDays},${res.score}\n`;
    });
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `คะแนนเข้าแถว_${currentBlock?.name || 'ทุกบล็อก'}_ห้อง${selectedRoom}.csv`);
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-amber-500 rounded-[24px] text-white shadow-xl shadow-amber-100">
              <Star size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight font-heading">สรุปคะแนนเข้าแถว</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                <Layers size={14} className="text-blue-500" /> 
                {currentBlock ? `กำลังดูข้อมูล: ${currentBlock.name}` : 'กำลังดูข้อมูล: ทุกบล็อกเรียน'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <div className="bg-slate-900 px-8 py-6 rounded-[32px] text-white flex items-center gap-8 shadow-2xl">
              <div className="border-r border-slate-700 pr-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">เฉลี่ยรายห้อง</p>
                <p className="text-4xl font-black text-amber-400 font-heading">{roomAverage}</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">เกณฑ์คำนวณ</p>
                <p className="text-sm font-bold text-blue-400">ฐาน 18 วัน (เฉพาะเข้าแถว)</p>
              </div>
            </div>
            <button onClick={exportCSV} className="p-6 bg-white border border-slate-200 rounded-[32px] hover:bg-slate-50 transition-all shadow-sm flex flex-col items-center justify-center gap-1 group">
              <Download size={24} className="text-slate-900 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase text-slate-500">Export</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-8 border-t border-slate-50">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">เลือกบล็อกเรียน</label>
            <select value={selectedBlockId} onChange={(e) => setSelectedBlockId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))} className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none appearance-none cursor-pointer">
              <option value="ALL">ทุกบล็อกรวมกัน</option>
              {studyBlocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ระดับชั้น</label>
            <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none appearance-none cursor-pointer">
              {availableLevels.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">แผนกวิชา</label>
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none appearance-none cursor-pointer">
              {availableDepts.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ห้องเรียน</label>
            <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none appearance-none cursor-pointer">
              {availableRooms.map(v => <option key={v} value={v}>ห้อง {v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ค้นหารายชื่อ</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ชื่อ หรือ รหัส..." className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl pl-12 pr-4 py-3.5 font-bold text-slate-900 outline-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 font-heading">
            <TrendingUp size={24} className="text-blue-600" />
            ตารางคะแนนเข้าแถวรายบุคคล
          </h3>
          <div className="flex items-center gap-6 text-[10px] font-black text-slate-400">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded-full" /> มาเข้าแถวจริง</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-400 rounded-full" /> วันหยุดพิเศษ</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-100 rounded-full" /> ยังไม่ถึงเกณฑ์ (18 วัน)</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">นักเรียน</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ความก้าวหน้า (ฐาน 18 วัน)</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">มาแถว / หยุดพิเศษ</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">คะแนนสะสม (5.0)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => {
                const res = calculateScore(s.id);
                const isTargetMet = res.totalDays >= 18;
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-all duration-300 group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-base leading-tight">{s.name}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{s.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="max-w-[200px] space-y-2">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                          <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${Math.min(100, (res.actualDays / 18) * 100)}%` }} />
                          <div className="h-full bg-amber-400 transition-all duration-700" style={{ width: `${Math.min(100, (res.holidayDays / 18) * 100)}%` }} />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-black uppercase ${isTargetMet ? 'text-green-600' : 'text-slate-400'}`}>
                            {isTargetMet ? 'ครบเกณฑ์ ✓' : `${res.totalDays} / 18 วัน`}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300">{Math.round((res.totalDays / 18) * 100)}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                        <div className="text-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 shadow-sm">
                           <p className="text-[9px] font-black uppercase tracking-tighter opacity-60">มาแถว</p>
                           <p className="text-sm font-black">{res.actualDays}</p>
                        </div>
                        <div className="text-center px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 shadow-sm">
                           <p className="text-[9px] font-black uppercase tracking-tighter opacity-60">พิเศษ</p>
                           <p className="text-sm font-black">{res.holidayDays}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                         <span className={`text-3xl font-black font-heading ${res.score >= 4 ? 'text-green-600' : res.score >= 3 ? 'text-blue-600' : 'text-red-600'}`}>
                           {res.score.toFixed(2)}
                         </span>
                         {res.score === 5 && <CheckCircle2 className="text-green-500" size={18} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-32 text-center text-slate-300">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-5" />
                    <p className="font-bold">ไม่พบข้อมูลนักเรียน</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MorningScoreSummary;
