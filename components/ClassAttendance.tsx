
import React, { useState, useEffect, useMemo } from 'react';
import { saveToFirestore, saveMultipleToFirestore, deleteFromFirestore, deleteMultipleFromFirestore } from '../firebaseService';
import { Student, Subject, AttendanceRecord, AttendanceStatus, ThaiLevel, Department, STANDARD_LEVELS, STANDARD_ROOMS, isEveningStudent, getCleanLevel } from '../types';
import { STATUS_LABELS } from '../constants';
import { 
  Save, BookOpen, Clock, Users, MessageSquare, UserPlus, X, Plus, Filter, 
  History, ClipboardCheck, Calendar, Edit3, CheckCircle2, Trash2, AlertCircle, Lock,
  Share2, Search, ChevronRight, Settings2, AlertTriangle, Loader2, Check
} from 'lucide-react';

interface ClassAttendanceProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  rooms: string[];
  setRooms: React.Dispatch<React.SetStateAction<string[]>>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  currentUser: any;
}

const ClassAttendance: React.FC<ClassAttendanceProps> = ({ 
  students: allStudents, 
  subjects, 
  setSubjects,
  attendanceRecords, 
  setAttendanceRecords,
  currentUser
}) => {
  const [selectedShift, setSelectedShift] = useState<'NORMAL' | 'EVENING'>('NORMAL');
  const [viewMode, setViewMode] = useState<'checkin' | 'history'>('checkin');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Partial<Subject> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Strictly filter students by shift
  const shiftStudents = useMemo(() => {
    return allStudents.filter(s => {
      const isEve = isEveningStudent(s);
      return selectedShift === 'EVENING' ? isEve : !isEve;
    });
  }, [allStudents, selectedShift]);

  const availableLevels = useMemo<string[]>(() => {
    const studentLevels = shiftStudents.map(s => getCleanLevel(s.level)).filter(Boolean);
    const set = new Set([...STANDARD_LEVELS, ...studentLevels]);
    return Array.from(set).sort((a, b) => {
      const idxA = STANDARD_LEVELS.indexOf(a);
      const idxB = STANDARD_LEVELS.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [shiftStudents]);

  const availableDepts = useMemo<string[]>(() => {
    const depts = new Set(shiftStudents.map(s => s.department).filter(Boolean));
    Object.values(Department).forEach(d => depts.add(d));
    return Array.from(depts).sort();
  }, [shiftStudents]);

  const availableRooms = useMemo<string[]>(() => {
    const rms = new Set(shiftStudents.map(s => s.room).filter(Boolean));
    STANDARD_ROOMS.forEach(r => rms.add(r));
    return Array.from(rms).sort((a, b) => {
      const na = parseInt(a as string);
      const nb = parseInt(b as string);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });
  }, [shiftStudents]);

  const [level, setLevel] = useState<string>(availableLevels[0] || 'ปวช. 1');
  const [dept, setDept] = useState<string>(availableDepts[0] || '');
  const [room, setRoom] = useState<string>(availableRooms[0] || '1');
  
  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => s.level === level && s.department === dept);
  }, [subjects, level, dept]);

  const [subjectId, setSubjectId] = useState<string>('');

  useEffect(() => {
    if (filteredSubjects.length > 0) {
      if (!filteredSubjects.some(s => s.id === subjectId)) {
        setSubjectId(filteredSubjects[0].id);
      }
    } else {
      setSubjectId('');
    }
  }, [filteredSubjects, subjectId]);

  const [sessionAttendance, setSessionAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubjectSaving, setIsSubjectSaving] = useState(false);

  const filteredStudents = useMemo(() => {
    return shiftStudents.filter(s => 
      getCleanLevel(s.level) === getCleanLevel(level) && 
      s.department === dept && 
      String(s.room || '1').trim() === String(room).trim() &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.includes(searchTerm))
    );
  }, [shiftStudents, level, dept, room, searchTerm]);

  useEffect(() => {
    if (!subjectId) {
      setSessionAttendance({});
      setRemarks({});
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const existing = attendanceRecords.filter(r => r.date === today && r.type === 'SUBJECT' && r.subjectId === subjectId);
    
    const attMap: Record<string, AttendanceStatus> = {};
    const remMap: Record<string, string> = {};
    
    if (existing.length > 0) {
      existing.forEach(r => {
        attMap[r.studentId] = r.status;
        if (r.remark) remMap[r.studentId] = r.remark;
      });
      filteredStudents.forEach(s => {
        if (!attMap[s.id]) attMap[s.id] = 'PRESENT';
      });
    } else {
      // Default all students to 'PRESENT' (มา) for a fresh subject check
      filteredStudents.forEach(s => {
        attMap[s.id] = 'PRESENT';
      });
    }

    setSessionAttendance(attMap);
    setRemarks(remMap);
  }, [level, dept, room, subjectId, attendanceRecords, filteredStudents.length]);

  const historyRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const student = shiftStudents.find(s => s.id === record.studentId);
      const matchesFilter = record.type === 'SUBJECT' && 
             record.subjectId === subjectId &&
             getCleanLevel(student?.level || '') === getCleanLevel(level) && 
             student?.department === dept && 
             String(student?.room || '1').trim() === String(room).trim();
      const matchesDate = selectedHistoryDate ? record.date === selectedHistoryDate : true;
      return matchesFilter && matchesDate;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.timestamp.localeCompare(a.timestamp));
  }, [attendanceRecords, subjectId, level, dept, room, shiftStudents, selectedHistoryDate]);

  const handleStatusChange = (id: string, status: AttendanceStatus) => {
    setSessionAttendance(prev => ({ ...prev, [id]: status }));
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (!subjectId) return alert('กรุณาเลือกรายวิชา');
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleString('th-TH');
    
    const newRecordsBatch: AttendanceRecord[] = filteredStudents.map(s => ({
      id: `SUBJECT_${today}_${subjectId}_${s.id}`,
      studentId: s.id,
      date: today,
      type: 'SUBJECT',
      subjectId: subjectId,
      status: sessionAttendance[s.id] || 'PRESENT',
      remark: remarks[s.id] || '',
      timestamp: timestamp
    }));

    // Save to Firestore
    await saveMultipleToFirestore('attendance', newRecordsBatch);

    setAttendanceRecords(prev => {
      const studentIds = filteredStudents.map(s => s.id);
      const otherRecords = prev.filter(r => !(r.date === today && r.type === 'SUBJECT' && r.subjectId === subjectId && studentIds.includes(r.studentId)));
      return [...otherRecords, ...newRecordsBatch];
    });

    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const markAll = (status: AttendanceStatus) => {
    const newBatch: Record<string, AttendanceStatus> = {};
    filteredStudents.forEach(s => { newBatch[s.id] = status; });
    setSessionAttendance(prev => ({ ...prev, ...newBatch }));
    setIsSaved(false);
  };

  // Calculate live stats for the current view
  const stats = useMemo(() => {
    let presents = 0;
    let lates = 0;
    let leaves = 0;
    let absents = 0;

    filteredStudents.forEach(s => {
      const st = sessionAttendance[s.id] || 'PRESENT';
      if (st === 'PRESENT') presents++;
      else if (st === 'LATE') lates++;
      else if (st === 'SICK_LEAVE' || st === 'BUSINESS_LEAVE') leaves++;
      else if (st === 'ABSENT') absents++;
    });

    return {
      total: filteredStudents.length,
      presents,
      lates,
      leaves,
      absents
    };
  }, [filteredStudents, sessionAttendance]);

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject?.name || !editingSubject?.code || !editingSubject?.level || !editingSubject?.department) return;

    setIsSubjectSaving(true);
    await new Promise(resolve => setTimeout(resolve, 400));

    if (editingSubject.id) {
      // Save to Firestore
      saveToFirestore('subjects', editingSubject as Subject);
      setSubjects(prev => prev.map(s => s.id === editingSubject.id ? (editingSubject as Subject) : s));
    } else {
      const newSub: Subject = {
        ...(editingSubject as Subject),
        id: `SUB_${Date.now()}`,
        teacherId: currentUser.id
      };
      // Save to Firestore
      saveToFirestore('subjects', newSub);
      setSubjects(prev => [...prev, newSub]);
    }
    
    setIsSubjectSaving(false);
    setEditingSubject(null);
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setConfirmDeleteId(null);
  };

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
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm w-fit">
          <button onClick={() => setViewMode('checkin')} className={`flex items-center gap-2 px-8 py-3.5 rounded-[18px] text-sm font-black transition-all ${viewMode === 'checkin' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><ClipboardCheck size={20} /> เช็คชื่อ</button>
          <button onClick={() => setViewMode('history')} className={`flex items-center gap-2 px-8 py-3.5 rounded-[18px] text-sm font-black transition-all ${viewMode === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><History size={20} /> ประวัติ</button>
        </div>
        
        <button 
          onClick={() => {
            setEditingSubject({ level: level, department: dept });
            setShowSubjectModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 text-sm font-black hover:bg-slate-50 transition-all shadow-sm font-heading"
        >
          <Settings2 size={18} className="text-blue-600" /> จัดการรายวิชา
        </button>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
        {/* Shift selector: ภาคปกติ vs ภาคค่ำ */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setSelectedShift('NORMAL')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                selectedShift === 'NORMAL'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ☀️ ภาคปกติ
            </button>
            <button
              type="button"
              onClick={() => setSelectedShift('EVENING')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                selectedShift === 'EVENING'
                  ? 'bg-indigo-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🌙 ภาคค่ำ
            </button>
          </div>
          <div className="text-xs font-bold text-slate-400">
            {selectedShift === 'NORMAL' ? 'กำลังแสดงนักเรียนภาคปกติ' : 'กำลังแสดงนักเรียนภาคค่ำ (แยกต่างหาก)'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ระดับชั้น</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none">
              {availableLevels.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">แผนกวิชา</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none">
              {availableDepts.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ห้องเรียน</label>
            <select value={room} onChange={(e) => setRoom(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none">
              {availableRooms.map(r => <option key={r} value={r}>ห้อง {r}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">รายวิชา ({dept})</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full bg-slate-50 border border-blue-100 rounded-xl px-4 py-3 font-black text-slate-900 outline-none focus:border-blue-400">
              {filteredSubjects.length > 0 ? filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>) : <option value="">(ไม่มีรายวิชาในกลุ่มนี้)</option>}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              {viewMode === 'checkin' ? 'ค้นหานักเรียน' : 'กรองตามวันที่'}
            </label>
            {viewMode === 'checkin' ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="พิมพ์ชื่อ..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-900 outline-none text-sm" />
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input type="date" value={selectedHistoryDate} onChange={(e) => setSelectedHistoryDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-900 outline-none text-sm" />
                </div>
                {selectedHistoryDate && (
                  <button onClick={() => setSelectedHistoryDate('')} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"><X size={16} /></button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'history' && historyRecords.length > 0 && selectedHistoryDate && (
        <div className="flex justify-end px-2 animate-in fade-in slide-in-from-right-4 duration-300">
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
          {/* Real-time statistics bar */}
          {filteredStudents.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">นักเรียนทั้งหมด</p>
                <p className="text-lg font-black text-slate-800 font-heading">{stats.total} คน</p>
              </div>
              <div className="bg-green-50/80 p-2.5 rounded-xl border border-green-200/60 text-center">
                <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">มา</p>
                <p className="text-lg font-black text-green-800 font-heading">{stats.presents} คน</p>
              </div>
              <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60 text-center">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">สาย</p>
                <p className="text-lg font-black text-amber-800 font-heading">{stats.lates} คน</p>
              </div>
              <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200/60 text-center">
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">ลา</p>
                <p className="text-lg font-black text-blue-800 font-heading">{stats.leaves} คน</p>
              </div>
              <div className="bg-red-50/80 p-2.5 rounded-xl border border-red-200/60 text-center col-span-2 sm:col-span-1">
                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">ขาด</p>
                <p className="text-lg font-black text-red-800 font-heading">{stats.absents} คน</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center px-2">
            <div className="flex gap-3">
              <button onClick={() => markAll('PRESENT')} className="px-5 py-2.5 bg-green-50 text-green-700 rounded-xl text-xs font-black border border-green-200 transition-all hover:bg-green-100 active:scale-95">มาทุกคน</button>
              <button onClick={() => markAll('ABSENT')} className="px-5 py-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-black border border-red-200 transition-all hover:bg-red-100 active:scale-95">ขาดทุกคน</button>
            </div>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-black transition-all shadow-xl ${
                isSaved ? 'bg-green-600 scale-105 shadow-green-100' : 
                isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black active:scale-95'
              }`}
            >
              {isSaving ? <Loader2 size={22} className="animate-spin" /> : isSaved ? <CheckCircle2 size={22} className="animate-in zoom-in" /> : <Save size={22} />}
              <span>{isSaving ? 'กำลังบันทึก...' : isSaved ? 'บันทึกสำเร็จ' : 'บันทึกข้อมูลวันนี้'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStudents.map((student, index) => {
              const currentStatus = sessionAttendance[student.id] || 'PRESENT';
              return (
                <div 
                  key={student.id} 
                  className={`bg-white p-6 rounded-[32px] border-2 shadow-sm flex flex-col justify-between transition-all group hover:shadow-md ${
                    currentStatus === 'PRESENT' ? 'border-green-400/80 bg-green-50/15' : 
                    currentStatus === 'LATE' ? 'border-amber-400/80 bg-amber-50/15' :
                    currentStatus === 'SICK_LEAVE' || currentStatus === 'BUSINESS_LEAVE' ? 'border-blue-400/80 bg-blue-50/15' :
                    'border-red-400/80 bg-red-50/15'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white shrink-0 group-hover:bg-blue-600 transition-colors">{index + 1}</div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg leading-tight font-heading">{student.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">รหัส: {student.studentId}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {Object.entries(STATUS_LABELS).map(([key, value]) => (
                        <button 
                          key={key} 
                          onClick={() => handleStatusChange(student.id, key as AttendanceStatus)} 
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all active:scale-95 ${
                            currentStatus === key 
                              ? value.color + ' border-current shadow-sm ring-2 ring-current/20 font-black' 
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          <div className="scale-110">{value.icon}</div>
                          <span className="text-[8px] font-black uppercase text-center leading-tight">{value.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {currentStatus && currentStatus !== 'PRESENT' && (
                    <div className="mt-4 relative animate-in slide-in-from-top-1">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input 
                        type="text" 
                        value={remarks[student.id] || ''} 
                        onChange={(e) => setRemarks(prev => ({ ...prev, [student.id]: e.target.value }))} 
                        placeholder="ระบุหมายเหตุ..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-blue-400 transition-all shadow-inner" 
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {filteredStudents.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100 text-slate-300">
                <Users size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-sm font-black uppercase tracking-widest">ไม่พบรายชื่อนักเรียนในกลุ่มนี้</p>
              </div>
            )}
            {filteredStudents.length > 0 && !subjectId && (
              <div className="col-span-full py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-red-100 text-red-400">
                <AlertCircle size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-sm font-black uppercase tracking-widest">กรุณาเลือกหรือเพิ่มรายวิชาสำหรับ {level} แผนก {dept}</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">วันที่</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">นักเรียน</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">สถานะ</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">วิชา</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyRecords.length > 0 ? historyRecords.map((record) => {
                const student = allStudents.find(s => s.id === record.studentId);
                const subj = subjects.find(s => s.id === record.subjectId);
                return (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm whitespace-nowrap">{record.date}</td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-900 text-sm">{student?.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{student?.studentId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border flex items-center gap-2 w-fit ${STATUS_LABELS[record.status].color}`}>
                        {STATUS_LABELS[record.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{subj?.code}</td>
                    <td className="px-6 py-4 text-right">
                      {confirmDeleteId === record.id ? (
                        <div className="flex items-center justify-end gap-1.5 animate-in slide-in-from-right-2 duration-300">
                          <button onClick={() => setConfirmDeleteId(null)} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all"><X size={14} /></button>
                          <button onClick={() => deleteSingleRecord(record.id)} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md"><Check size={14} /></button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setConfirmDeleteId(record.id)}
                          disabled={isDeleting}
                          className={`p-2 rounded-xl transition-all ${isDeleting ? 'text-slate-100 cursor-not-allowed' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                          title="ลบรายการนี้"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <History size={48} className="mx-auto text-slate-200 mb-4 opacity-10" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">ไม่พบประวัติการเช็คชื่อตามตัวกรอง</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Subject Management Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[48px] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300 relative my-8">
            <button onClick={() => { setShowSubjectModal(false); setEditingSubject(null); setConfirmDeleteId(null); }} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 transition-colors">
              <X size={28} />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight font-heading flex items-center gap-3">
              <BookOpen size={28} className="text-blue-600" /> จัดการรายวิชาเช็คชื่อ
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{editingSubject?.id ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'}</h4>
                <form onSubmit={handleSaveSubject} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">รหัสวิชา</label>
                      <input 
                        type="text" 
                        required 
                        value={editingSubject?.code || ''} 
                        onChange={(e) => setEditingSubject(prev => ({ ...prev, code: e.target.value }))}
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-3 font-bold outline-none transition-all" 
                        placeholder="เช่น IT30201"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">ชื่อวิชา</label>
                      <input 
                        type="text" 
                        required 
                        value={editingSubject?.name || ''} 
                        onChange={(e) => setEditingSubject(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-3 font-bold outline-none transition-all" 
                        placeholder="เช่น ภาษาอังกฤษ"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">ระดับชั้น</label>
                      <select 
                        value={editingSubject?.level || ''} 
                        onChange={(e) => setEditingSubject(prev => ({ ...prev, level: e.target.value }))}
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-3 font-bold outline-none cursor-pointer"
                      >
                        <option value="">เลือกสีสีกรอบ...</option>
                        {availableLevels.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">แผนกวิชา</label>
                      <select 
                        value={editingSubject?.department || ''} 
                        onChange={(e) => setEditingSubject(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-3 font-bold outline-none cursor-pointer"
                      >
                        <option value="">เลือกแผนก...</option>
                        {availableDepts.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    {editingSubject?.id && (
                      <button type="button" onClick={() => setEditingSubject(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest">ยกเลิก</button>
                    )}
                    <button 
                      type="submit" 
                      disabled={isSubjectSaving}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubjectSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                      {editingSubject?.id ? 'บันทึกการแก้ไข' : 'เพิ่มรายวิชา'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between ml-1">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">รายวิชาทั้งหมด ({subjects.length})</h4>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {subjects.sort((a,b) => a.level.localeCompare(b.level)).map(s => {
                    const isMatched = s.level === level && s.department === dept;
                    const isConfirming = confirmDeleteId === s.id;
                    return (
                      <div key={s.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${isMatched ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'} ${isConfirming ? 'border-red-400 bg-red-50' : ''}`}>
                        <div className="min-w-0 text-left">
                          <p className={`font-black text-sm truncate ${isConfirming ? 'text-red-700' : 'text-slate-900'}`}>{s.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100 uppercase">{s.code}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${isMatched ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-200 text-slate-600 border-slate-200'}`}>{s.level}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 transition-all">
                          {isConfirming ? (
                            <div className="flex gap-1 animate-in slide-in-from-right-2">
                              <button onClick={() => setConfirmDeleteId(null)} className="p-2 text-slate-500 hover:bg-white rounded-lg transition-all" title="ยกเลิก"><X size={16} /></button>
                              <button onClick={() => handleDeleteSubject(s.id)} className="p-2 text-red-600 hover:bg-white rounded-lg transition-all font-black text-[10px] uppercase" title="ยืนยันการลบ">ยืนยัน</button>
                            </div>
                          ) : (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingSubject(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"><Edit3 size={16} /></button>
                              <button onClick={() => setConfirmDeleteId(s.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"><Trash2 size={16} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {subjects.length === 0 && (
                    <div className="py-20 text-center text-slate-300 italic text-xs">ยังไม่มีข้อมูลรายวิชา</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassAttendance;
