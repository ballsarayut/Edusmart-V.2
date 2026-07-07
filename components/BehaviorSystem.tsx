
import React, { useState } from 'react';
import { saveToFirestore, deleteFromFirestore } from '../firebaseService';
import { Student, BehaviorRecord } from '../types';
import { Award, PlusCircle, MinusCircle, FileText, Search, AlertCircle, Trash2, X, AlertTriangle, Check, RotateCcw, MessageCircle } from 'lucide-react';

interface BehaviorSystemProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  behaviorRecords: BehaviorRecord[];
  setBehaviorRecords: React.Dispatch<React.SetStateAction<BehaviorRecord[]>>;
}

const BehaviorSystem: React.FC<BehaviorSystemProps> = ({ students, setStudents, behaviorRecords, setBehaviorRecords }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [scoreChange, setScoreChange] = useState<number>(5);
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.includes(searchTerm));

  const handleScoreUpdate = (type: 'ADD' | 'DEDUCT') => {
    if (!selectedStudent || !reason.trim()) return;

    const change = type === 'ADD' ? scoreChange : -scoreChange;
    const newScore = Math.max(0, selectedStudent.behaviorScore + change);
    const updatedStudent = { ...selectedStudent, behaviorScore: newScore };

    // Update Student Score in Firestore
    saveToFirestore('students', updatedStudent);

    setStudents(prev => prev.map(s => 
      s.id === selectedStudentId ? updatedStudent : s
    ));

    // Add History Record
    const newRecord: BehaviorRecord = {
      id: `BEH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId: selectedStudent.id,
      type,
      score: scoreChange,
      reason,
      date: new Date().toLocaleDateString('th-TH'),
      recordedBy: 'อาจารย์ผู้สอน'
    };

    // Save Record to Firestore
    saveToFirestore('behavior', newRecord);

    setBehaviorRecords(prev => [newRecord, ...prev]);
    setReason('');
  };

  const processDeleteBehavior = async (id: string) => {
    const record = behaviorRecords.find(b => b.id === id);
    if (!record) return;

    try {
      // Delete from Firestore
      await deleteFromFirestore('behavior', id);

      // Revert the score on the student
      const student = students.find(s => s.id === record.studentId);
      if (student) {
        const adjustment = record.type === 'ADD' ? -record.score : record.score;
        const newScore = Math.max(0, student.behaviorScore + adjustment);
        const updatedStudent = { ...student, behaviorScore: newScore };
        
        // Save the updated student score back to Firestore
        await saveToFirestore('students', updatedStudent);
        
        setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
      }

      // Remove the record locally
      setBehaviorRecords(prev => prev.filter(b => b.id !== id));
      setConfirmingDeleteId(null);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return { label: 'ดีมาก', color: 'bg-green-100 text-green-800' };
    if (score >= 70) return { label: 'ดี', color: 'bg-blue-100 text-blue-800' };
    return { label: 'เฝ้าระวัง', color: 'bg-red-100 text-red-800' };
  };

  const shareToLine = () => {
    if (!selectedStudent) return;

    const studentRecords = behaviorRecords.filter(b => b.studentId === selectedStudent.id);
    
    let historyText = '';
    if (studentRecords.length > 0) {
      const sortedRecords = [...studentRecords].sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
      
      const latestRecord = sortedRecords[0];
      const latestTypeStr = latestRecord.type === 'ADD' ? 'บวก' : 'หัก';
      
      historyText += `\n\n📌 รายการล่าสุด:\n- ${latestRecord.reason} (${latestTypeStr} ${latestRecord.score} คะแนน) เมื่อ ${latestRecord.date}`;
      
      if (sortedRecords.length > 1) {
        historyText += `\n\nประวัติพฤติกรรมทั้งหมด:\n`;
        sortedRecords.forEach((r, idx) => {
          const typeStr = r.type === 'ADD' ? '+' : '-';
          historyText += `${idx + 1}. ${r.reason} (${typeStr}${r.score}) [${r.date}]\n`;
        });
      }
    } else {
      historyText += `\n\n✅ ไม่มีประวัติพฤติกรรม`;
    }

    const message = `แจ้งเตือนพฤติกรรม\nชื่อ: ${selectedStudent.name}\nรหัส: ${selectedStudent.studentId}\nระดับชั้น: ${selectedStudent.level} ${selectedStudent.department}\nคะแนนพฤติกรรมปัจจุบัน: ${selectedStudent.behaviorScore} คะแนน${historyText}\n\n- ระบบ EduSmart`;
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
    window.open(lineUrl, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-200px)] overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหานักเรียน..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-11 pr-4 py-3 font-black text-slate-900 outline-none focus:border-blue-500 transition-all text-sm" 
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
          {filteredStudents.map(student => (
            <button 
              key={student.id} 
              onClick={() => setSelectedStudentId(student.id)} 
              className={`w-full text-left p-5 rounded-[24px] border-2 transition-all ${selectedStudentId === student.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]' : 'bg-white border-transparent hover:bg-slate-50 text-slate-900'}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-black text-sm">{student.name}</p>
                  <p className={`text-[10px] font-bold uppercase mt-1 tracking-widest ${selectedStudentId === student.id ? 'text-slate-400' : 'text-slate-500'}`}>รหัส: {student.studentId}</p>
                </div>
                <div className={`px-3 py-1 rounded-xl text-xs font-black shadow-sm ${selectedStudentId === student.id ? 'bg-white text-slate-900' : getScoreStatus(student.behaviorScore).color}`}>
                  {student.behaviorScore}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        {selectedStudent ? (
          <>
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-blue-600">
                <Award size={150} />
              </div>
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-blue-100">
                    <Award size={40} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedStudent.name}</h3>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">{selectedStudent.level} • {selectedStudent.department}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">คะแนนปัจจุบัน</p>
                    <p className={`text-6xl font-black leading-none ${selectedStudent.behaviorScore >= 70 ? 'text-blue-600' : 'text-red-600'}`}>{selectedStudent.behaviorScore}</p>
                  </div>
                  <button onClick={shareToLine} className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#00B900] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#009900] transition-all shadow-lg shadow-green-100/50">
                    <MessageCircle size={14} /> แชร์ผ่านไลน์
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100 space-y-5">
                <h4 className="font-black text-slate-900 flex items-center gap-2 text-sm uppercase tracking-widest">
                  <PlusCircle size={18} className="text-green-600" /> ปรับปรุงคะแนนพฤติกรรม
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6">
                    <input 
                      type="text" 
                      placeholder="ระบุเหตุผลในการปรับคะแนน..." 
                      value={reason} 
                      onChange={(e) => setReason(e.target.value)} 
                      className="w-full bg-white border-2 border-transparent focus:border-blue-500 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none transition-all shadow-inner" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input 
                      type="number" 
                      value={scoreChange} 
                      onChange={(e) => setScoreChange(parseInt(e.target.value) || 0)} 
                      className="w-full bg-white border-2 border-transparent focus:border-blue-500 rounded-2xl px-5 py-3.5 font-black text-slate-900 outline-none text-center shadow-inner" 
                    />
                  </div>
                  <div className="md:col-span-4 flex gap-3">
                    <button onClick={() => handleScoreUpdate('ADD')} className="flex-1 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95 text-xs uppercase tracking-widest">บวกคะแนน</button>
                    <button onClick={() => handleScoreUpdate('DEDUCT')} className="flex-1 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 text-xs uppercase tracking-widest">หักคะแนน</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-900 flex items-center gap-3 text-xl mb-8">
                <FileText size={24} className="text-blue-600" /> ประวัติการปรับปรุงคะแนน
              </h3>
              <div className="space-y-4">
                {behaviorRecords.filter(b => b.studentId === selectedStudent.id).map(record => {
                  const isConfirming = confirmingDeleteId === record.id;
                  return (
                    <div key={record.id} className={`flex items-center justify-between p-6 rounded-[28px] border-2 transition-all relative overflow-hidden ${isConfirming ? 'bg-red-50 border-red-500 ring-2 ring-red-200' : 'bg-white border-slate-50 hover:border-slate-200'}`}>
                      <div className="flex gap-5 items-center relative z-10">
                        <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center shadow-inner shrink-0 ${record.type === 'ADD' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {record.type === 'ADD' ? <PlusCircle size={22} /> : <MinusCircle size={22} />}
                        </div>
                        <div>
                          <p className={`font-black leading-tight ${isConfirming ? 'text-red-900' : 'text-slate-900'}`}>{record.reason}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.date}</span>
                             <span className="text-slate-200">•</span>
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">โดย: {record.recordedBy}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 relative z-10">
                        <div className={`text-2xl font-black ${record.type === 'ADD' ? 'text-green-600' : 'text-red-600'}`}>
                          {record.type === 'ADD' ? '+' : '-'}{record.score}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isConfirming ? (
                            <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-300">
                               <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmingDeleteId(null); }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all"
                              >
                                <X size={14} /> ยกเลิก
                              </button>
                              <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); processDeleteBehavior(record.id); }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg"
                              >
                                <Check size={14} /> ยืนยันลบ
                              </button>
                            </div>
                          ) : (
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setConfirmingDeleteId(record.id);
                                setTimeout(() => setConfirmingDeleteId(prev => prev === record.id ? null : prev), 5000);
                              }}
                              className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                              title="ลบรายการนี้"
                            >
                              <Trash2 size={22} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {behaviorRecords.filter(b => b.studentId === selectedStudent.id).length === 0 && (
                  <div className="py-20 text-center flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[32px]">
                     <Award size={64} className="mb-4 opacity-5" />
                     <p className="text-sm font-black uppercase tracking-widest">ยังไม่มีประวัติพฤติกรรม</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full bg-white rounded-[40px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
               <AlertCircle size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">เลือกรายชื่อนักเรียน</h3>
            <p className="text-slate-400 font-bold max-w-xs mx-auto">กรุณาเลือกนักเรียนจากรายการด้านซ้ายเพื่อจัดการคะแนนพฤติกรรมและดูประวัติย้อนหลัง</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BehaviorSystem;
