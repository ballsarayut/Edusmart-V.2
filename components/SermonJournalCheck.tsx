
import React, { useState, useMemo, useEffect } from 'react';
import { saveMultipleToFirestore } from '../firebaseService';
import { Student, AttendanceRecord } from '../types';
import { 
  Search, Save, CheckCircle2, ClipboardCheck, 
  User, AlertCircle, Check, X, Loader2, Sparkles, GraduationCap, Layers,
  Share2
} from 'lucide-react';

interface SermonJournalCheckProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

const SermonJournalCheck: React.FC<SermonJournalCheckProps> = ({ 
  students, 
  attendanceRecords, 
  setAttendanceRecords
}) => {
  const availableLevels = useMemo(() => Array.from(new Set(students.map(s => s.level))).map(String).sort(), [students]);
  const availableDepts = useMemo(() => Array.from(new Set(students.map(s => s.department))).map(String).sort(), [students]);
  const availableRooms = useMemo(() => Array.from(new Set(students.map(s => s.room))).map(String).sort((a,b) => parseInt(a)-parseInt(b)), [students]);

  const [level, setLevel] = useState<string>(availableLevels[0] || '');
  const [dept, setDept] = useState<string>(availableDepts[0] || '');
  const [room, setRoom] = useState<string>(availableRooms[0] || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [currentSession, setCurrentSession] = useState<Record<string, 'RECORDED' | 'NOT_RECORDED'>>({});

  useEffect(() => {
    if (availableLevels.length > 0 && !level) setLevel(availableLevels[0]);
    if (availableDepts.length > 0 && !dept) setDept(availableDepts[0]);
    if (availableRooms.length > 0 && !room) setRoom(availableRooms[0]);
  }, [availableLevels, availableDepts, availableRooms]);

  useEffect(() => {
    // Current block and day records for these students
    const relevantRecords = attendanceRecords.filter(r => 
      r.type === 'SERMON' && 
      r.sermonBlock === selectedBlock &&
      r.sermonDay === selectedDay
    );

    const sessionMap: Record<string, 'RECORDED' | 'NOT_RECORDED'> = {};
    relevantRecords.forEach(r => {
      sessionMap[r.studentId] = r.status as 'RECORDED' | 'NOT_RECORDED';
    });
    setCurrentSession(sessionMap);
  }, [selectedBlock, selectedDay, attendanceRecords]);

  const filteredStudents = students.filter(s => 
    s.level === level && s.department === dept && s.room === room &&
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.includes(searchTerm))
  );

  const handleStatusChange = (studentId: string, status: 'RECORDED' | 'NOT_RECORDED') => {
    setCurrentSession(prev => ({ ...prev, [studentId]: status }));
    setIsSaved(false);
  };

  const markAll = (status: 'RECORDED' | 'NOT_RECORDED') => {
    const newBatch: Record<string, 'RECORDED' | 'NOT_RECORDED'> = {};
    filteredStudents.forEach(s => { newBatch[s.id] = status; });
    setCurrentSession(prev => ({ ...prev, ...newBatch }));
    setIsSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    const timestamp = new Date().toLocaleString('th-TH');
    const date = new Date().toISOString().split('T')[0];
    
    const newRecordsBatch: AttendanceRecord[] = filteredStudents.map(s => ({
      id: `SERMON_B${selectedBlock}_D${selectedDay}_${s.id}`,
      studentId: s.id,
      date: date,
      type: 'SERMON',
      sermonBlock: selectedBlock,
      sermonDay: selectedDay,
      status: currentSession[s.id] || 'NOT_RECORDED',
      timestamp: timestamp
    }));
    
    await saveMultipleToFirestore('attendance', newRecordsBatch);
    
    setAttendanceRecords(prev => {
      const studentIds = filteredStudents.map(s => s.id);
      const otherRecords = prev.filter(r => !(r.type === 'SERMON' && r.sermonBlock === selectedBlock && r.sermonDay === selectedDay && studentIds.includes(r.studentId)));
      return [...otherRecords, ...newRecordsBatch];
    });

    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const shareToLine = () => {
    const rawDate = new Date().toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    let text = `📔 รายงานสรุปการจดโอวาท\n`;
    text += `🗓️ วันที่: ${rawDate}\n`;
    text += `📦 บล็อก ${selectedBlock} | วันที่ ${selectedDay}\n`;
    text += `🏫 ${level} / ${dept} (ห้อง ${room})\n`;
    text += `--------------------------\n`;
    
    filteredStudents.forEach((s, idx) => {
      const status = currentSession[s.id] || 'NOT_RECORDED';
      const label = status === 'RECORDED' ? '✓ (จด)' : '✗ (ไม่จด)';
      text += `${idx + 1}. ${s.name} ${label}\n`;
    });
    
    text += `--------------------------\n`;
    const recordedCount = filteredStudents.filter(s => currentSession[s.id] === 'RECORDED').length;
    const notRecordedCount = filteredStudents.filter(s => (currentSession[s.id] || 'NOT_RECORDED') === 'NOT_RECORDED').length;
    
    text += `จด: ${recordedCount} | ไม่จด: ${notRecordedCount} | รวม: ${filteredStudents.length}\n`;
    text += `ระบบ EduSmart CMS`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank');
  };

  const stats = useMemo(() => {
    const recordedCount = filteredStudents.filter(s => currentSession[s.id] === 'RECORDED').length;
    const notRecordedCount = filteredStudents.filter(s => (currentSession[s.id] || 'NOT_RECORDED') === 'NOT_RECORDED').length;
    const total = filteredStudents.length;
    const percent = total > 0 ? (recordedCount / total) * 100 : 0;
    
    return { recordedCount, notRecordedCount, total, percent };
  }, [filteredStudents, currentSession]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div className="flex flex-col gap-4 w-full xl:w-auto">
          <div className="flex items-center gap-4 bg-white p-2 rounded-[28px] border border-slate-200 shadow-sm w-full overflow-hidden">
             <div className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl font-black text-sm uppercase tracking-wider whitespace-nowrap">
                <GraduationCap size={20} /> บล็อก
             </div>
             <div className="h-8 w-px bg-slate-200 mx-2 flex-shrink-0" />
             <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                {[1, 2, 3, 4, 5].map(b => (
                  <button 
                    key={b} 
                    onClick={() => setSelectedBlock(b)}
                    className={`
                      min-w-[48px] h-12 rounded-xl flex flex-col items-center justify-center transition-all relative flex-shrink-0
                      ${selectedBlock === b 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}
                    `}
                  >
                    <span className="text-[9px] font-black uppercase tracking-tighter leading-none mb-0.5">B-</span>
                    <span className="text-sm font-black">{b}</span>
                    {selectedBlock === b && <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full animate-pulse" />}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 rounded-[28px] border border-slate-200 shadow-sm w-full overflow-hidden">
             <div className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-sm uppercase tracking-wider whitespace-nowrap">
                <Layers size={20} /> วันที่
             </div>
             <div className="h-8 w-px bg-slate-200 mx-2 flex-shrink-0" />
             <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                {Array.from({ length: 18 }, (_, i) => i + 1).map(d => (
                  <button 
                    key={d} 
                    onClick={() => setSelectedDay(d)}
                    className={`
                      min-w-[48px] h-12 rounded-xl flex flex-col items-center justify-center transition-all relative flex-shrink-0
                      ${selectedDay === d 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}
                    `}
                  >
                    <span className="text-[9px] font-black uppercase tracking-tighter leading-none mb-0.5">DAY</span>
                    <span className="text-sm font-black">{d}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className={`
            w-full xl:w-auto flex items-center justify-center gap-3 px-12 py-8 rounded-[38px] text-white font-black transition-all shadow-xl active:scale-95
            ${isSaved ? 'bg-green-600 shadow-green-200' : 
              isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black'}
          `}
        >
          {isSaving ? <Loader2 size={24} className="animate-spin" /> : isSaved ? <CheckCircle2 size={24} /> : <Save size={24} />} 
          <div className="text-left leading-tight">
            <p className="text-sm font-black uppercase tracking-widest opacity-60">บันทึกข้อมูล</p>
            <p className="text-xl font-heading tracking-tight">{isSaving ? 'กำลังประมวลผล...' : isSaved ? 'บันทึกสำเร็จ' : `บล็อก ${selectedBlock} วันที่ ${selectedDay}`}</p>
          </div>
        </button>
        
        {filteredStudents.length > 0 && (
          <button 
            onClick={shareToLine}
            className="w-full xl:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-[#06C755] text-white rounded-[28px] font-black transition-all shadow-xl hover:bg-green-600 active:scale-95"
          >
            <Share2 size={24} />
            <div className="text-left leading-tight">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">ส่งรายงาน</p>
              <p className="text-lg font-heading tracking-tight">แชร์เข้ากลุ่ม LINE</p>
            </div>
          </button>
        )}
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 p-10 text-slate-50/50 -mr-10 -mt-10">
           <GraduationCap size={200} strokeWidth={1} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ระดับชั้น</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl px-6 py-4 font-bold text-sm text-slate-900 outline-none transition-all shadow-inner">
              {availableLevels.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">แผนกวิชา</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl px-6 py-4 font-bold text-sm text-slate-900 outline-none transition-all shadow-inner">
              {availableDepts.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ห้องเรียน</label>
            <select value={room} onChange={(e) => setRoom(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl px-6 py-4 font-bold text-sm text-slate-900 outline-none transition-all shadow-inner">
              {availableRooms.map(v => <option key={v} value={v}>ห้อง {v}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ค้นหารายชื่อ</label>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="พิมพ์ชื่อนักเรียน..." className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl pl-14 pr-6 py-4 font-bold text-sm text-slate-900 outline-none transition-all shadow-inner" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[44px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Layers size={24} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-900 font-heading leading-none">รายชื่อเช็คสมุดโอวาท</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={12} className="text-amber-500" />
                  บล็อกที่กำลังเช็ค: บล็อก {selectedBlock} วันที่ {selectedDay}
                </p>
             </div>
          </div>
          
          <div className="flex gap-3">
             <div className="flex items-center gap-6 px-6 py-3 bg-white border border-slate-200 rounded-2xl">
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">จดแล้ว</span>
                   <span className="text-lg font-black text-blue-600 leading-none">{stats.recordedCount}</span>
                </div>
                <div className="w-px h-6 bg-slate-100" />
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">ยังไม่จด</span>
                   <span className="text-lg font-black text-red-500 leading-none">{stats.notRecordedCount}</span>
                </div>
                <div className="w-px h-6 bg-slate-100" />
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">ร้อยละ</span>
                   <span className="text-lg font-black text-slate-900 leading-none">{stats.percent.toFixed(0)}%</span>
                </div>
             </div>
             <button onClick={() => markAll('RECORDED')} className="flex-1 md:flex-none px-6 py-3 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black border border-blue-100 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">จดทุกคน</button>
             <button onClick={() => markAll('NOT_RECORDED')} className="flex-1 md:flex-none px-6 py-3 bg-red-50 text-red-700 rounded-xl text-[10px] font-black border border-red-100 uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">ไม่จดทุกคน</button>
          </div>
        </div>

        <div className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
             {filteredStudents.map((student, index) => {
               const status = currentSession[student.id];
               return (
                 <div key={student.id} className={`group bg-white p-7 rounded-[40px] border-2 transition-all relative overflow-hidden ${status === 'RECORDED' ? 'border-blue-500 bg-blue-50/10' : status === 'NOT_RECORDED' ? 'border-red-100' : 'border-slate-100 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-5 mb-8">
                       <div className="w-14 h-14 bg-slate-100 rounded-[22px] flex items-center justify-center text-lg font-black text-slate-400 group-hover:scale-110 transition-transform group-hover:bg-slate-900 group-hover:text-white">
                          {index + 1}
                       </div>
                       <div className="min-w-0">
                          <h4 className="font-black text-slate-900 text-lg leading-tight font-heading truncate">{student.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {student.studentId}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <button 
                        onClick={() => handleStatusChange(student.id, 'RECORDED')}
                        className={`flex flex-col items-center gap-3 py-6 rounded-3xl border-2 transition-all ${status === 'RECORDED' ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-blue-200'}`}
                       >
                          <div className={`p-2 rounded-full ${status === 'RECORDED' ? 'bg-white/20' : 'bg-slate-200'}`}>
                             <Check size={20} strokeWidth={4} />
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest">จดบันทึก</span>
                       </button>

                       <button 
                        onClick={() => handleStatusChange(student.id, 'NOT_RECORDED')}
                        className={`flex flex-col items-center gap-3 py-6 rounded-3xl border-2 transition-all ${status === 'NOT_RECORDED' ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-500/30' : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-red-200'}`}
                       >
                          <div className={`p-2 rounded-full ${status === 'NOT_RECORDED' ? 'bg-white/20' : 'bg-slate-200'}`}>
                             <X size={20} strokeWidth={4} />
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest">ไม่จด</span>
                       </button>
                    </div>

                    {status === 'RECORDED' && (
                       <div className="absolute top-0 right-0 p-4 text-blue-500/10 pointer-events-none">
                          <CheckCircle2 size={120} />
                       </div>
                    )}
                 </div>
               );
             })}

             {filteredStudents.length === 0 && (
               <div className="col-span-full py-40 text-center flex flex-col items-center justify-center gap-6 opacity-30">
                  <ClipboardCheck size={100} strokeWidth={1} />
                  <p className="text-xl font-black uppercase tracking-[0.4em]">ไม่พบรายชื่อในกลุ่มนี้</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SermonJournalCheck;
