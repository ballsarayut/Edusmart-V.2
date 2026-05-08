
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { saveToFirestore, saveMultipleToFirestore, deleteFromFirestore, deleteMultipleFromFirestore } from '../firebaseService';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { STATUS_LABELS } from '../constants';
import { 
  Search, Save, CheckCircle2, History, ClipboardCheck, 
  MessageSquare, Share2, Sun, Loader2, X, Scan, Camera, CameraOff,
  UserCheck, AlertCircle, Sparkles, Check, Clock, Trash2
} from 'lucide-react';

interface MorningAttendanceProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  rooms: string[];
  setRooms: React.Dispatch<React.SetStateAction<string[]>>;
}

const MorningAttendance: React.FC<MorningAttendanceProps> = ({ 
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
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'checkin' | 'history'>('checkin');

  // Barcode Scanner States
  const [isScannerEnabled, setIsScannerEnabled] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (availableLevels.length > 0 && !level) setLevel(availableLevels[0]);
    if (availableDepts.length > 0 && !dept) setDept(availableDepts[0]);
    if (availableRooms.length > 0 && !room) setRoom(availableRooms[0]);
  }, [availableLevels, availableDepts, availableRooms]);

  useEffect(() => {
    const rawDate = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(r => r.date === rawDate && r.type === 'MORNING');
    const sessionMap: Record<string, AttendanceStatus> = {};
    const remarkMap: Record<string, string> = {};
    todayRecords.forEach(r => {
      sessionMap[r.studentId] = r.status;
      if (r.remark) remarkMap[r.studentId] = r.remark;
    });
    setCurrentSession(sessionMap);
    setRemarks(remarkMap);
  }, [level, dept, room, attendanceRecords]);

  // Handle Scanner Focus Logic
  useEffect(() => {
    let focusInterval: number;
    if (isScannerEnabled && viewMode === 'checkin') {
      scanInputRef.current?.focus();
      // สร้าง interval เพื่อดึงโฟกัสกลับมาเสมอ ป้องกันครูเผลอไปกดที่อื่น
      focusInterval = window.setInterval(() => {
        if (document.activeElement !== scanInputRef.current) {
          scanInputRef.current?.focus();
        }
      }, 1000);
    }
    return () => clearInterval(focusInterval);
  }, [isScannerEnabled, viewMode]);

  const filteredStudents = students.filter(s => 
    s.level === level && s.department === dept && s.room === room &&
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.includes(searchTerm))
  );

  const historyRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const student = students.find(s => s.id === record.studentId);
      const matchesFilter = record.type === 'MORNING' && student?.level === level && student?.department === dept && student?.room === room;
      const matchesDate = selectedHistoryDate ? record.date === selectedHistoryDate : true;
      return matchesFilter && matchesDate;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceRecords, students, level, dept, room, selectedHistoryDate]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setCurrentSession(prev => ({ ...prev, [studentId]: status }));
    setIsSaved(false);
  };

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;

    // ค้นหานักเรียนจาก studentId
    const scannedStudent = students.find(s => s.studentId === barcodeInput.trim());
    
    if (scannedStudent) {
      handleStatusChange(scannedStudent.id, 'PRESENT');
      setLastScannedStudent(scannedStudent);
      
      // เสียง Beep สัญญาณสำเร็จ
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        audio.volume = 0.5;
        audio.play();
      } catch (err) {}

      // เคลียร์ feedback หลังจาก 2 วินาที
      setTimeout(() => setLastScannedStudent(null), 2500);
    } else {
      setLastScannedStudent(null);
    }
    
    setBarcodeInput('');
    scanInputRef.current?.focus();
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    const rawDate = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleString('th-TH');
    const newRecordsBatch: AttendanceRecord[] = filteredStudents.map(s => ({
      id: `MORNING_${rawDate}_${s.id}`,
      studentId: s.id,
      date: rawDate,
      type: 'MORNING',
      status: currentSession[s.id] || 'ABSENT',
      remark: remarks[s.id] || '',
      timestamp: timestamp
    }));
    
    // Save to Firestore for multi-device sync
    await saveMultipleToFirestore('attendance', newRecordsBatch);
    
    setAttendanceRecords(prev => {
      const studentIds = filteredStudents.map(s => s.id);
      const otherRecords = prev.filter(r => !(r.date === rawDate && r.type === 'MORNING' && studentIds.includes(r.studentId)));
      return [...otherRecords, ...newRecordsBatch];
    });
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const markAll = (status: AttendanceStatus) => {
    const newBatch: Record<string, AttendanceStatus> = {};
    filteredStudents.forEach(s => { newBatch[s.id] = status; });
    setCurrentSession(prev => ({ ...prev, ...newBatch }));
    setIsSaved(false);
  };

  const shareToLine = () => {
    const rawDate = new Date().toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    let text = `📋 รายงานเช็คชื่อเข้าแถว\n`;
    text += `🗓️ วันที่: ${rawDate}\n`;
    text += `🏫 ${level} / ${dept} (ห้อง ${room})\n`;
    text += `--------------------------\n`;
    filteredStudents.forEach((s, idx) => {
      const status = currentSession[s.id] || 'ABSENT';
      let label = '(ขาด)'; 
      if (status === 'PRESENT') label = '(มา)';
      else if (status === 'LATE') label = '(สาย)';
      else if (status === 'SICK_LEAVE' || status === 'BUSINESS_LEAVE') label = '(ลา)';
      text += `${idx + 1}. ${s.name} ${label}\n`;
    });
    text += `--------------------------\n`;
    const presents = filteredStudents.filter(s => currentSession[s.id] === 'PRESENT').length;
    const absents = filteredStudents.filter(s => (currentSession[s.id] || 'ABSENT') === 'ABSENT').length;
    const lates = filteredStudents.filter(s => currentSession[s.id] === 'LATE').length;
    const leaves = filteredStudents.filter(s => currentSession[s.id] === 'SICK_LEAVE' || currentSession[s.id] === 'BUSINESS_LEAVE').length;
    
    text += `มา: ${presents} | สาย: ${lates} | ลา: ${leaves} | ขาด: ${absents} | รวม: ${filteredStudents.length}\n`;
    text += `ระบบ EduSmart CMS`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank');
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const deleteCurrentDayRecords = async () => {
    if (!selectedHistoryDate) return;
    
    setIsDeleting(true);
    setConfirmBulkDelete(false);
    try {
      const idsToDelete = historyRecords.map(r => r.id);
      await deleteMultipleFromFirestore('attendance', idsToDelete);
      setAttendanceRecords(prev => prev.filter(r => !idsToDelete.includes(r.id)));
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteSingleRecord = async (id: string) => {
    setIsDeleting(true);
    setConfirmDeleteId(null);
    try {
      await deleteFromFirestore('attendance', id);
      setAttendanceRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex bg-white p-2 rounded-[22px] border border-slate-200 shadow-sm w-full md:w-fit">
          <button onClick={() => setViewMode('checkin')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-black transition-all ${viewMode === 'checkin' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><ClipboardCheck size={18} /> เช็คชื่อวันนี้</button>
          <button onClick={() => setViewMode('history')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-black transition-all ${viewMode === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><History size={18} /> ประวัติ</button>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {viewMode === 'checkin' && (
            <button 
              onClick={() => setIsScannerEnabled(!isScannerEnabled)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[11px] md:text-sm font-black shadow-xl transition-all uppercase tracking-widest font-heading active:scale-95 border-2 ${isScannerEnabled ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              {isScannerEnabled ? <CameraOff size={20} /> : <Scan size={20} />}
              {isScannerEnabled ? 'ปิดระบบสแกน' : 'เปิดโหมดสแกน'}
            </button>
          )}

          {viewMode === 'checkin' && filteredStudents.length > 0 && (
            <button 
              onClick={shareToLine}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#06C755] text-white rounded-2xl text-[11px] md:text-sm font-black shadow-xl hover:bg-green-600 transition-all uppercase tracking-widest font-heading active:scale-95"
            >
              <Share2 size={18} /> แชร์ LINE
            </button>
          )}
        </div>
      </div>

      {/* Barcode Scanner UI Panel */}
      {viewMode === 'checkin' && isScannerEnabled && (
        <div className="bg-slate-950 p-8 md:p-12 rounded-[40px] shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden border-4 border-amber-400">
           {/* Scan Line Animation */}
           <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
              <div className="w-full h-1 bg-amber-400 absolute animate-[scan-move_3s_linear_infinite]" />
           </div>
           
           <div className="flex flex-col items-center text-center space-y-8 relative z-10">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3 text-amber-400">
                  <Scan size={32} className="animate-pulse" />
                  <h3 className="text-3xl font-black text-white font-heading uppercase tracking-tight">Scanner Terminal</h3>
                </div>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">พร้อมรับรหัสนักเรียนจากเครื่องสแกน หรือ กล้อง</p>
              </div>

              <form onSubmit={handleBarcodeScan} className="w-full max-w-lg">
                <div className="relative group">
                   <input 
                    ref={scanInputRef}
                    type="text" 
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="สแกนบาร์โค้ดที่นี่..."
                    className="w-full bg-white/5 border-2 border-white/20 focus:border-amber-400 rounded-[32px] px-10 py-8 text-4xl font-black text-white outline-none transition-all placeholder:text-white/10 text-center tracking-[0.2em]"
                   />
                   <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20">
                      <Loader2 className="animate-spin" size={24} />
                   </div>
                </div>
              </form>

              {lastScannedStudent ? (
                <div className="flex items-center gap-6 bg-green-600 text-white px-10 py-6 rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-6 duration-300 border-2 border-white/20">
                  <div className="p-4 bg-white/20 rounded-2xl">
                    {/* Fixed: Used imported Check icon */}
                    <Check size={32} strokeWidth={4} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Check-in Success!</p>
                    <p className="text-2xl font-black leading-none font-heading">{lastScannedStudent.name}</p>
                    <p className="text-xs font-bold text-green-100 mt-1">{lastScannedStudent.studentId} • มาเรียน</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-500">
                   <div className="flex items-center gap-3 text-sm font-bold animate-pulse">
                      <Sparkles size={18} className="text-amber-500" />
                      <span>กรุณายิงบาร์โค้ด หรือ พิมพ์เลข 6 หลัก</span>
                   </div>
                </div>
              )}
           </div>

           <style dangerouslySetInnerHTML={{ __html: `
              @keyframes scan-move {
                0% { top: 0%; }
                100% { top: 100%; }
              }
           `}} />
        </div>
      )}

      <div className="bg-white p-5 md:p-8 rounded-[28px] md:rounded-[32px] border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ระดับชั้น</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 font-bold text-xs text-slate-900 outline-none transition-all">
              {availableLevels.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">แผนกวิชา</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 font-bold text-xs text-slate-900 outline-none transition-all">
              {availableDepts.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ห้องเรียน</label>
            <select value={room} onChange={(e) => setRoom(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 font-bold text-xs text-slate-900 outline-none transition-all">
              {availableRooms.map(v => <option key={v} value={v}>ห้อง {v}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1 lg:col-span-2 space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">{viewMode === 'checkin' ? 'ค้นหารายชื่อ' : 'เลือกวันที่'}</label>
            {viewMode === 'checkin' ? (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="พิมพ์ชื่อนักเรียน..." className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl pl-12 pr-4 py-3 font-bold text-xs text-slate-900 outline-none transition-all shadow-inner" />
              </div>
            ) : (
              <input type="date" value={selectedHistoryDate} onChange={(e) => setSelectedHistoryDate(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 font-bold text-xs text-slate-900 outline-none" />
            )}
          </div>
        </div>
      </div>

      {viewMode === 'history' && historyRecords.length > 0 && selectedHistoryDate && (
        <div className="flex justify-end px-1 animate-in fade-in slide-in-from-right-4 duration-300">
          {confirmBulkDelete ? (
            <div className="flex items-center gap-3 bg-red-600 p-2 pl-6 rounded-2xl shadow-xl animate-in zoom-in duration-300">
               <span className="text-[10px] font-black text-white uppercase tracking-widest">ยืนยันลบทั้งหมด?</span>
               <button onClick={() => setConfirmBulkDelete(false)} className="px-4 py-2 bg-white/20 text-white rounded-xl text-[10px] font-black hover:bg-white/30 transition-all">ยกเลิก</button>
               <button onClick={deleteCurrentDayRecords} className="px-5 py-2 bg-white text-red-600 rounded-xl text-[10px] font-black hover:bg-slate-50 transition-all">ลบข้อมูล</button>
            </div>
          ) : (
            <button 
              onClick={() => setConfirmBulkDelete(true)}
              disabled={isDeleting}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black border transition-all shadow-sm active:scale-95 ${
                isDeleting ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white'
              }`}
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} 
              {isDeleting ? 'กำลังลบ...' : 'ลบข้อมูลทั้งหมดของวันที่เลือก'}
            </button>
          )}
        </div>
      )}

      {viewMode === 'checkin' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
            <div className="flex gap-2">
              <button onClick={() => markAll('PRESENT')} className="flex-1 md:flex-none px-6 py-3 bg-green-50 text-green-700 rounded-xl text-[10px] font-black border border-green-200 uppercase tracking-widest hover:bg-green-100 transition-all">มาทุกคน</button>
              <button onClick={() => markAll('ABSENT')} className="flex-1 md:flex-none px-6 py-3 bg-red-50 text-red-700 rounded-xl text-[10px] font-black border border-red-200 uppercase tracking-widest hover:bg-red-100 transition-all">ขาดทุกคน</button>
            </div>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className={`flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-white font-black transition-all shadow-xl active:scale-95 ${
                isSaved ? 'bg-green-600 shadow-green-200' : 
                isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black'
              }`}
            >
              {isSaving ? <Loader2 size={22} className="animate-spin" /> : isSaved ? <CheckCircle2 size={22} /> : <Save size={22} />} 
              <span className="text-sm md:text-base font-heading">{isSaving ? 'กำลังบันทึก...' : isSaved ? 'บันทึกสำเร็จ' : 'บันทึกข้อมูลวันนี้'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStudents.map((student, index) => (
              <div key={student.id} className={`bg-white p-6 rounded-[32px] border-2 flex flex-col gap-5 group transition-all relative overflow-hidden ${currentSession[student.id] === 'PRESENT' ? 'border-green-400 bg-green-50/10' : 'border-slate-100 hover:border-blue-300'}`}>
                {currentSession[student.id] === 'PRESENT' && (
                   <div className="absolute top-0 right-0 p-4 text-green-500/20">
                      <CheckCircle2 size={64} />
                   </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-sm shrink-0 shadow-lg group-hover:scale-110 transition-transform">{index + 1}</div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 text-base truncate font-heading">{student.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {student.studentId}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(STATUS_LABELS).map(([key, value]) => (
                    <button 
                      key={key} 
                      onClick={() => handleStatusChange(student.id, key as AttendanceStatus)} 
                      className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${currentSession[student.id] === key ? value.color + ' border-current shadow-sm' : 'bg-white border-slate-50 text-slate-300 hover:border-slate-200'}`}
                    >
                      <div className="scale-90 md:scale-100">{value.icon}</div>
                      <span className="text-[8px] font-black uppercase text-center leading-tight tracking-tighter">{value.label}</span>
                    </button>
                  ))}
                </div>

                {(currentSession[student.id] && currentSession[student.id] !== 'PRESENT') && (
                  <div className="relative animate-in slide-in-from-top-2">
                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="text" value={remarks[student.id] || ''} onChange={(e) => setRemarks(prev => ({ ...prev, [student.id]: e.target.value }))} placeholder="ระบุเหตุผลในการลา/ขาด..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 font-bold text-slate-900 outline-none text-[10px] focus:border-blue-500 transition-all shadow-inner" />
                  </div>
                )}
              </div>
            ))}
            {filteredStudents.length === 0 && (
              <div className="col-span-full py-24 text-center bg-white rounded-[40px] border-4 border-dashed border-slate-50">
                <Sun size={64} className="mx-auto opacity-10 mb-6" />
                <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-sm">ไม่พบรายชื่อในกลุ่มนี้</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {historyRecords.length > 0 ? historyRecords.map((record) => {
            const student = students.find(s => s.id === record.studentId);
            return (
              <div key={record.id} className="bg-white p-6 rounded-[32px] border border-slate-200 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><ClipboardCheck size={20} /></div>
                    <div>
                       <p className="text-sm font-black text-slate-900 font-heading leading-none">{student?.name}</p>
                       <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{record.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest shadow-sm ${STATUS_LABELS[record.status].color}`}>
                      {STATUS_LABELS[record.status].label}
                    </span>
                    {confirmDeleteId === record.id ? (
                      <div className="flex items-center gap-1.5 animate-in slide-in-from-right-2 duration-300">
                        <button onClick={() => setConfirmDeleteId(null)} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all"><X size={14} /></button>
                        <button onClick={() => deleteSingleRecord(record.id)} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md"><Check size={14} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirmDeleteId(record.id)}
                        disabled={isDeleting}
                        className={`p-1.5 rounded-lg transition-all ${isDeleting ? 'text-slate-200 cursor-not-allowed' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                        title="ลบรายการนี้"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {record.remark && (
                  <div className="p-3 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-600 flex items-center gap-3 border border-slate-100">
                    <MessageSquare size={14} className="text-slate-400" /> {record.remark}
                  </div>
                )}
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1 opacity-60">
                   {/* Fixed: Used imported Clock icon */}
                   <Clock size={12} /> บันทึกเมื่อ {record.timestamp}
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-24 text-center bg-white rounded-[40px] border-4 border-dashed border-slate-50">
               <History size={64} className="mx-auto text-slate-100 mb-6" />
               <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-sm">ไม่พบข้อมูลประวัติ</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MorningAttendance;