
import React, { useState, useMemo } from 'react';
import { Student, AttendanceRecord } from '../types';
import { 
  Star, Search, Download, TrendingUp, User, 
  Layers, CheckCircle2, AlertCircle, GraduationCap, Trophy
} from 'lucide-react';

interface SermonJournalSummaryProps {
  students: Student[];
  attendance: AttendanceRecord[];
}

const SermonJournalSummary: React.FC<SermonJournalSummaryProps> = ({ students, attendance }) => {
  const availableLevels = useMemo(() => Array.from(new Set(students.map(s => s.level))).map(String).sort(), [students]);
  const availableDepts = useMemo(() => Array.from(new Set(students.map(s => s.department))).map(String).sort(), [students]);
  const availableRooms = useMemo(() => Array.from(new Set(students.map(s => s.room))).map(String).sort((a,b) => parseInt(a)-parseInt(b)), [students]);

  const [selectedLevel, setSelectedLevel] = useState<string>(availableLevels[0] || '');
  const [selectedDept, setSelectedDept] = useState<string>(availableDepts[0] || '');
  const [selectedRoom, setSelectedRoom] = useState<string>(availableRooms[0] || '');
  const [searchTerm, setSearchTerm] = useState('');

  const globalActiveBlocks = useMemo(() => {
    const active = new Set<number>();
    attendance.forEach(a => {
      if (a.type === 'SERMON' && a.sermonBlock) {
        active.add(a.sermonBlock);
      }
    });
    return active;
  }, [attendance]);

  const calculateSermonScore = (studentId: string) => {
    const studentRecords = attendance.filter(a => a.studentId === studentId);
    
    const blockMistakes: Record<number, Set<string>> = {
      1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set()
    };

    // Note: status 'NOT_RECORDED' in sermon, or 'ABSENT'/'LATE' in morning
    studentRecords.forEach(r => {
      if (r.type === 'SERMON' && r.sermonBlock && r.date) {
        if (r.status === 'NOT_RECORDED') {
          blockMistakes[r.sermonBlock].add(r.date);
        }
      }
    });

    studentRecords.forEach(r => {
      if (r.type === 'MORNING' && r.date && (r.status === 'ABSENT' || r.status === 'LATE' || r.status === 'BUSINESS_LEAVE' || r.status === 'SICK_LEAVE')) {
        // Find if this date had a sermon check
        const matchingSermon = studentRecords.find(s => s.type === 'SERMON' && s.date === r.date);
        if (matchingSermon && matchingSermon.sermonBlock) {
          blockMistakes[matchingSermon.sermonBlock].add(r.date);
        }
      }
    });

    const blockScores: Record<number, number> = {};
    Object.keys(blockMistakes).forEach(b => {
      const blockNum = Number(b);
      if (globalActiveBlocks.has(blockNum)) {
        const mistakeCount = blockMistakes[blockNum].size;
        // start at 5, deduct 5/18 per mistake
        blockScores[blockNum] = Number(Math.max(0, 5 - (mistakeCount / 18) * 5).toFixed(2));
      } else {
        blockScores[blockNum] = 0;
      }
    });

    const totalScore = Number(Object.values(blockScores).reduce((acc, curr) => acc + curr, 0).toFixed(2));
    
    // total records checked can just be derived from Sermon entries
    const totalSermonChecks = new Set(studentRecords.filter(r => r.type === 'SERMON' && r.sermonBlock).map(r => `${r.sermonBlock}_${r.date}`)).size;

    return {
      score: totalScore,
      rawCount: totalSermonChecks,
      blockScores,
      blockMistakes
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
    const total = filteredStudents.reduce((acc, s) => acc + calculateSermonScore(s.id).score, 0);
    return (total / filteredStudents.length).toFixed(2);
  }, [filteredStudents, attendance]);

  const exportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += "รหัสนักเรียน,ชื่อ-นามสกุล,บล็อก 1(5),บล็อก 2(5),บล็อก 3(5),บล็อก 4(5),บล็อก 5(5),คะแนนรวม(25)\n";
    filteredStudents.forEach(s => {
      const res = calculateSermonScore(s.id);
      csv += `${s.studentId},${s.name},${res.blockScores[1] || 0},${res.blockScores[2] || 0},${res.blockScores[3] || 0},${res.blockScores[4] || 0},${res.blockScores[5] || 0},${res.score}\n`;
    });
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `คะแนนสมุดโอวาท_ห้อง${selectedRoom}.csv`);
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 text-slate-50/50 -mr-16 -mt-16 pointer-events-none">
           <Trophy size={280} strokeWidth={1} />
        </div>

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-10 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-indigo-600 rounded-[24px] text-white shadow-xl shadow-indigo-100">
              <GraduationCap size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight font-heading">สรุปคะแนนสมุดโอวาท</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                <Layers size={14} className="text-indigo-500" /> 
                คะแนนบันทึกโอวาท (บล็อกละ 5 คะแนน เต็ม 25)
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <div className="bg-slate-900 px-8 py-6 rounded-[32px] text-white flex items-center gap-8 shadow-2xl">
              <div className="border-r border-slate-700 pr-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">เฉลี่ยรายห้อง (เต็ม 25)</p>
                <p className="text-4xl font-black text-indigo-400 font-heading">{roomAverage}</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">เกณฑ์คำนวณ</p>
                <p className="text-sm font-bold text-blue-400">18 วัน = 5 คะแนนต่อบล็อก</p>
              </div>
            </div>
            <button onClick={exportCSV} className="p-6 bg-white border border-slate-200 rounded-[32px] hover:bg-slate-50 transition-all shadow-sm flex flex-col items-center justify-center gap-1 group">
              <Download size={24} className="text-slate-900 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase text-slate-500">Export</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-slate-50 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ระดับชั้น</label>
            <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none appearance-none cursor-pointer">
              {availableLevels.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">แผนกวิชา</label>
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none appearance-none cursor-pointer">
              {availableDepts.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ห้องเรียน</label>
            <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none appearance-none cursor-pointer">
              {availableRooms.map(v => <option key={v} value={v}>ห้อง {v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ค้นหารายชื่อ</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ชื่อ หรือ รหัส..." className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl pl-12 pr-4 py-3.5 font-bold text-slate-900 outline-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 font-heading">
            <TrendingUp size={24} className="text-indigo-600" />
            ตารางคะแนนสมุดโอวาท
          </h3>
          <div className="flex items-center gap-6 text-[10px] font-black text-slate-400">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded-full" /> บันทึกแล้ว</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 rounded-full" /> ยังไม่บันทึก / ไม่จด</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">นักเรียน</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">สถานะบล็อกเรียน (1-5)</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">ความก้าวหน้า</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">คะแนนรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => {
                const res = calculateSermonScore(s.id);
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-all duration-300 group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-base leading-tight font-heading">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">ID: {s.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(b => (
                          <div 
                            key={b} 
                            className={`px-3 py-1.5 rounded-lg flex flex-col items-center justify-center text-[10px] font-black border-2 transition-all ${res.blockScores[b] > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-200'}`}
                            title={`บล็อก ${b}`}
                          >
                             <span className="text-[8px] opacity-60">B{b}</span>
                             <span>{res.blockScores[b] || 0}/5</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="max-w-[140px] mx-auto space-y-2">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                          <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${(res.score / 25) * 100}%` }} />
                        </div>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase">{res.score} / 25</span>
                          <span className="text-[9px] font-bold text-indigo-400">{Math.round((res.score / 25) * 100)}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 rounded-2xl text-white shadow-lg">
                         <span className="text-2xl font-black font-heading text-indigo-400">
                           {res.score}
                         </span>
                         {res.score === 25 && <CheckCircle2 className="text-green-400" size={16} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-32 text-center text-slate-300">
                    <AlertCircle size={48} className="mx-auto mb-4 opacity-5" />
                    <p className="font-bold uppercase tracking-widest text-sm">ไม่พบข้อมูลนักเรียน</p>
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

export default SermonJournalSummary;
