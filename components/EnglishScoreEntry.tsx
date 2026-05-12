import React, { useState, useMemo, useEffect } from 'react';
import { saveMultipleToFirestore } from '../firebaseService';
import { Student, EnglishScoreRecord, User } from '../types';
import { 
  Search, Save, CheckCircle2, Languages, 
  User as UserIcon, Loader2, Sparkles, Star, AlertCircle,
  Download, Upload, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface EnglishScoreEntryProps {
  students: Student[];
  englishScores: EnglishScoreRecord[];
  setEnglishScores: React.Dispatch<React.SetStateAction<EnglishScoreRecord[]>>;
  currentUser: User | null;
}

const EnglishScoreEntry: React.FC<EnglishScoreEntryProps> = ({ 
  students, 
  englishScores, 
  setEnglishScores,
  currentUser
}) => {
  const availableLevels = useMemo(() => Array.from(new Set(students.map(s => s.level))).map(String).sort(), [students]);
  const availableDepts = useMemo(() => Array.from(new Set(students.map(s => s.department))).map(String).sort(), [students]);
  const availableRooms = useMemo(() => Array.from(new Set(students.map(s => s.room))).map(String).sort((a,b) => parseInt(a)-parseInt(b)), [students]);

  const [level, setLevel] = useState<string>(availableLevels[0] || '');
  const [dept, setDept] = useState<string>(availableDepts[0] || '');
  const [room, setRoom] = useState<string>(availableRooms[0] || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [currentSession, setCurrentSession] = useState<Record<string, number>>({});

  useEffect(() => {
    if (availableLevels.length > 0 && !level) setLevel(availableLevels[0]);
    if (availableDepts.length > 0 && !dept) setDept(availableDepts[0]);
    if (availableRooms.length > 0 && !room) setRoom(availableRooms[0]);
  }, [availableLevels, availableDepts, availableRooms]);

  useEffect(() => {
    const sessionMap: Record<string, number> = {};
    englishScores.forEach(r => {
      sessionMap[r.studentId] = r.score;
    });
    setCurrentSession(sessionMap);
  }, [englishScores]);

  const filteredStudents = students.filter(s => 
    s.level === level && s.department === dept && s.room === room &&
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.includes(searchTerm))
  );

  const handleScoreChange = (studentId: string, score: string) => {
    const numScore = Math.min(10, Math.max(0, parseInt(score) || 0));
    setCurrentSession(prev => ({ ...prev, [studentId]: numScore }));
    setIsSaved(false);
  };

  const setAllScores = (score: number) => {
    const newBatch: Record<string, number> = {};
    filteredStudents.forEach(s => { newBatch[s.id] = score; });
    setCurrentSession(prev => ({ ...prev, ...newBatch }));
    setIsSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const timestamp = new Date().toLocaleString('th-TH');
    const date = new Date().toISOString().split('T')[0];
    
    const newRecordsBatch: EnglishScoreRecord[] = filteredStudents.map(s => ({
      id: `ENG_${s.id}`,
      studentId: s.id,
      score: currentSession[s.id] || 0,
      recordedBy: currentUser?.name || 'Unknown',
      date: date,
      timestamp: timestamp
    }));
    
    await saveMultipleToFirestore('english_scores', newRecordsBatch);
    
    setEnglishScores(prev => {
      const studentIds = filteredStudents.map(s => s.id);
      const otherRecords = prev.filter(r => !studentIds.includes(r.studentId));
      return [...otherRecords, ...newRecordsBatch];
    });

    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const exportTemplate = () => {
    const templateData = students
      .filter(s => s.level === level && s.department === dept && s.room === room)
      .map((s, idx) => ({
        'ลำดับ': idx + 1,
        'ชื่อ-นามสกุล': s.name,
        'รหัสประจำตัว': s.studentId,
        'คะแนนภาษาอังกฤษ (0-10)': currentSession[s.id] || 0
      }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "EnglishScores");
    XLSX.writeFile(wb, `EnglishScores_Template_${level}_${dept}_Room${room}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const newScores: Record<string, number> = { ...currentSession };
      
      jsonData.forEach(row => {
        const studentId = String(row['รหัสประจำตัว']);
        const score = parseFloat(row['คะแนนภาษาอังกฤษ (0-10)']);
        
        // Find student by studentId (the visible one) and map to technical id
        const student = students.find(s => s.studentId === studentId);
        if (student && !isNaN(score)) {
          newScores[student.id] = Math.min(10, Math.max(0, score));
        }
      });

      setCurrentSession(newScores);
      setIsSaved(false);
      // Clear input
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 bg-white p-2 rounded-[28px] border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-sm uppercase tracking-wider">
              <Languages size={20} /> คะแนนภาษาอังกฤษ
           </div>
           <div className="h-8 w-px bg-slate-200 mx-2" />
           <div className="px-4 py-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">คะแนนเต็ม</span>
              <span className="text-sm font-black text-slate-900">10 คะแนน</span>
           </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className={`
            w-full md:w-auto flex items-center justify-center gap-3 px-12 py-5 rounded-[32px] text-white font-black transition-all shadow-xl active:scale-95
            ${isSaved ? 'bg-green-600 shadow-green-200' : 
              isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black'}
          `}
        >
          {isSaving ? <Loader2 size={24} className="animate-spin" /> : isSaved ? <CheckCircle2 size={24} /> : <Save size={24} />} 
          <span className="text-base font-heading tracking-tight">{isSaving ? 'กำลังบันทึก...' : isSaved ? 'บันทึกสำเร็จ' : 'บันทึกคะแนนทั้งหมด'}</span>
        </button>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 text-slate-50/50 -mr-10 -mt-10">
           <Star size={200} strokeWidth={1} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ระดับชั้น</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 font-bold text-sm text-slate-900 outline-none transition-all shadow-inner">
              {availableLevels.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">แผนกวิชา</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 font-bold text-sm text-slate-900 outline-none transition-all shadow-inner">
              {availableDepts.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ห้องเรียน</label>
            <select value={room} onChange={(e) => setRoom(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 font-bold text-sm text-slate-900 outline-none transition-all shadow-inner">
              {availableRooms.map(v => <option key={v} value={v}>ห้อง {v}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ค้นหารายชื่อ</label>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="พิมพ์ชื่อนักเรียน..." className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl pl-14 pr-6 py-4 font-bold text-sm text-slate-900 outline-none transition-all shadow-inner" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[44px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <Star size={24} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-900 font-heading leading-none">กรอกคะแนนภาษาอังกฤษ</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={12} className="text-amber-500" />
                  รายชื่อนักเรียนในห้องที่เลือก
                </p>
             </div>
          </div>
          
          <div className="flex gap-3">
             <button onClick={exportTemplate} className="flex-1 md:flex-none px-6 py-3 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black border border-blue-100 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2">
                <Download size={14} /> โหลดเทมเพลต
             </button>
             <label className="flex-1 md:flex-none cursor-pointer px-6 py-3 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black border border-amber-100 uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all shadow-sm flex items-center gap-2">
                <Upload size={14} /> อัพโหลดไฟล์
                <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" />
             </label>
             <button onClick={() => setAllScores(10)} className="flex-1 md:flex-none px-6 py-3 bg-green-50 text-green-700 rounded-xl text-[10px] font-black border border-green-100 uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-sm">ให้ 10 ทุกคน</button>
             <button onClick={() => setAllScores(0)} className="flex-1 md:flex-none px-6 py-3 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black border border-slate-200 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm">ล้างคะแนน</button>
          </div>
        </div>

        <div className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
             {filteredStudents.map((student, index) => {
               const score = currentSession[student.id] || 0;
               return (
                 <div key={student.id} className="group bg-white p-7 rounded-[40px] border-2 border-slate-100 hover:border-indigo-200 transition-all relative overflow-hidden">
                    <div className="flex items-center gap-5 mb-8">
                       <div className="w-14 h-14 bg-slate-100 rounded-[22px] flex items-center justify-center text-lg font-black text-slate-400 group-hover:scale-110 transition-transform group-hover:bg-indigo-600 group-hover:text-white">
                          {index + 1}
                       </div>
                       <div className="min-w-0">
                          <h4 className="font-black text-slate-900 text-lg leading-tight font-heading truncate">{student.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {student.studentId}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-4">
                       <div className="flex-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">ระบุคะแนน (0-10)</label>
                          <input 
                            type="number" 
                            min="0" 
                            max="10"
                            value={score} 
                            onChange={(e) => handleScoreChange(student.id, e.target.value)}
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 font-black text-xl text-slate-900 outline-none transition-all shadow-inner"
                          />
                       </div>
                       <div className="flex flex-col gap-2">
                          <button onClick={() => handleScoreChange(student.id, String(Math.min(10, score + 1)))} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                             <CheckCircle2 size={16} />
                          </button>
                          <button onClick={() => handleScoreChange(student.id, String(Math.max(0, score - 1)))} className="p-3 bg-slate-100 rounded-xl hover:bg-red-500 hover:text-white transition-all text-red-500">
                             <AlertCircle size={16} />
                          </button>
                       </div>
                    </div>

                    <div className="absolute top-0 right-0 p-4 text-indigo-500/5 pointer-events-none group-hover:scale-125 transition-transform">
                       <Star size={100} />
                    </div>
                 </div>
               );
             })}

             {filteredStudents.length === 0 && (
               <div className="col-span-full py-40 text-center flex flex-col items-center justify-center gap-6 opacity-30">
                  <UserIcon size={100} strokeWidth={1} />
                  <p className="text-xl font-black uppercase tracking-[0.4em]">ไม่พบรายชื่อในกลุ่มนี้</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default EnglishScoreEntry;
