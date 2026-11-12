
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { saveToFirestore, saveMultipleToFirestore, deleteFromFirestore, deleteMultipleFromFirestore } from '../firebaseService';
import { Student, AttendanceRecord, AttendanceStatus, Department, STANDARD_LEVELS, STANDARD_ROOMS, isEveningStudent, getCleanLevel } from '../types';
import { STATUS_LABELS } from '../constants';
import { 
  Search, Save, CheckCircle2, History, ClipboardCheck, 
  MessageSquare, Share2, Sun, Loader2, X, Scan, Camera, CameraOff,
  UserCheck, AlertCircle, Sparkles, Check, Clock, Trash2,
  RefreshCw, Edit3, Calendar, RotateCcw, AlertTriangle, ArrowRight
} from 'lucide-react';

interface MorningAttendanceProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  rooms: string[];
  setRooms: React.Dispatch<React.SetStateAction<string[]>>;
}

// Format local date YYYY-MM-DD
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayThaiDateString = () => {
  const d = new Date();
  const thaiYear = d.getFullYear() + 543;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${thaiYear}-${month}-${day}`;
};

// Check if record belongs to today (supporting Gregorian, UTC, Thai Buddhist Era, and ID prefixes)
const isRecordToday = (r: AttendanceRecord) => {
  const localToday = getTodayDateString();
  const utcToday = new Date().toISOString().split('T')[0];
  const thaiToday = getTodayThaiDateString();

  if (r.date === localToday || r.date === utcToday || r.date === thaiToday) return true;
  if (r.id) {
    if (r.id.startsWith(`MORNING_${localToday}_`) || 
        r.id.startsWith(`MORNING_${utcToday}_`) || 
        r.id.startsWith(`MORNING_${thaiToday}_`)) {
      return true;
    }
  }
  return false;
};

const MorningAttendance: React.FC<MorningAttendanceProps> = ({ 
  students, 
  attendanceRecords, 
  setAttendanceRecords
}) => {
  // Morning assembly is strictly for normal shift (ภาคปกติ). Exclude evening students completely!
  const morningStudents = useMemo(() => {
    return students.filter(s => !isEveningStudent(s));
  }, [students]);

  const availableLevels = useMemo(() => {
    const studentLevels = morningStudents.map(s => getCleanLevel(s.level)).filter(Boolean);
    const set = new Set<string>([...STANDARD_LEVELS, ...studentLevels]);
    return Array.from(set).sort((a: string, b: string) => {
      const idxA = STANDARD_LEVELS.indexOf(a);
      const idxB = STANDARD_LEVELS.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [morningStudents]);

  const availableDepts = useMemo(() => {
    const studentDepts = morningStudents.map(s => s.department).filter(Boolean);
    const set = new Set<string>([...Object.values(Department), ...studentDepts]);
    return Array.from(set).sort((a: string, b: string) => a.localeCompare(b));
  }, [morningStudents]);

  const availableRooms = useMemo(() => {
    const studentRooms = morningStudents.map(s => String(s.room || '1').trim()).filter(Boolean);
    const set = new Set<string>([...STANDARD_ROOMS, ...studentRooms]);
    return Array.from(set).sort((a: string, b: string) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [morningStudents]);

  // Remember selected level, department, and room across reloads and tab switches
  const [level, setLevel] = useState<string>(() => localStorage.getItem('edusmart_morning_level') || '');
  const [dept, setDept] = useState<string>(() => localStorage.getItem('edusmart_morning_dept') || '');
  const [room, setRoom] = useState<string>(() => localStorage.getItem('edusmart_morning_room') || '');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [viewMode, setViewMode] = useState<'checkin' | 'history'>('checkin');
  
  // Single student update loading state
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  // History record editing modal state
  const [editingHistoryRecord, setEditingHistoryRecord] = useState<AttendanceRecord | null>(null);
  const [editHistoryStatus, setEditHistoryStatus] = useState<AttendanceStatus>('PRESENT');
  const [editHistoryRemark, setEditHistoryRemark] = useState('');
  const [isHistorySaving, setIsHistorySaving] = useState(false);

  // Barcode Scanner States
  const [isScannerEnabled, setIsScannerEnabled] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Hydrate level, dept, and room defaults while preserving saved choices
  useEffect(() => {
    const savedLevel = localStorage.getItem('edusmart_morning_level');
    if (availableLevels.length > 0) {
      if (savedLevel && availableLevels.includes(savedLevel)) {
        if (level !== savedLevel) setLevel(savedLevel);
      } else if (!level || !availableLevels.includes(level)) {
        setLevel(availableLevels[0]);
      }
    }

    const savedDept = localStorage.getItem('edusmart_morning_dept');
    if (availableDepts.length > 0) {
      if (savedDept && availableDepts.includes(savedDept)) {
        if (dept !== savedDept) setDept(savedDept);
      } else if (!dept || !availableDepts.includes(dept)) {
        setDept(availableDepts[0]);
      }
    }

    const savedRoom = localStorage.getItem('edusmart_morning_room');
    if (availableRooms.length > 0) {
      if (savedRoom && availableRooms.includes(savedRoom)) {
        if (room !== savedRoom) setRoom(savedRoom);
      } else if (!room || !availableRooms.includes(room)) {
        setRoom(availableRooms[0]);
      }
    }
  }, [availableLevels, availableDepts, availableRooms]);

  const handleLevelChange = (newLevel: string) => {
    setLevel(newLevel);
    localStorage.setItem('edusmart_morning_level', newLevel);
  };
  const handleDeptChange = (newDept: string) => {
    setDept(newDept);
    localStorage.setItem('edusmart_morning_dept', newDept);
  };
  const handleRoomChange = (newRoom: string) => {
    setRoom(newRoom);
    localStorage.setItem('edusmart_morning_room', newRoom);
  };

  const filteredStudents = useMemo(() => {
    return morningStudents.filter(s => 
      getCleanLevel(s.level) === getCleanLevel(level) && 
      s.department === dept && 
      String(s.room || '1').trim() === String(room).trim() &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.includes(searchTerm))
    );
  }, [morningStudents, level, dept, room, searchTerm]);

  // Existing records recorded for today for students in the current room (matching by both id and studentId)
  const existingTodayRecords = useMemo(() => {
    const studentKeySet = new Set<string>();
    filteredStudents.forEach(s => {
      if (s.id) studentKeySet.add(String(s.id));
      if (s.studentId) studentKeySet.add(String(s.studentId));
    });

    return attendanceRecords.filter(r => {
      if (r.type !== 'MORNING' || !isRecordToday(r)) return false;
      const rStudId = String(r.studentId || '');
      if (studentKeySet.has(rStudId)) return true;
      return filteredStudents.some(s => 
        r.id === `MORNING_${r.date}_${s.id}` || 
        r.id === `MORNING_${r.date}_${s.studentId}` ||
        r.id.endsWith(`_${s.id}`) ||
        r.id.endsWith(`_${s.studentId}`)
      );
    });
  }, [attendanceRecords, filteredStudents]);

  const hasExistingTodayRecords = existingTodayRecords.length > 0;

  // Latest timestamp of recorded attendance today
  const lastRecordedTimestamp = useMemo(() => {
    if (existingTodayRecords.length === 0) return null;
    const sorted = [...existingTodayRecords].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return sorted[0]?.timestamp || null;
  }, [existingTodayRecords]);

  // Populate session data whenever room or level changes, or upon manual reload
  useEffect(() => {
    const sessionMap: Record<string, AttendanceStatus> = {};
    const remarkMap: Record<string, string> = {};

    if (existingTodayRecords.length > 0) {
      existingTodayRecords.forEach(r => {
        const student = filteredStudents.find(s => 
          String(s.id) === String(r.studentId) || 
          String(s.studentId) === String(r.studentId) ||
          r.id.endsWith(`_${s.id}`) ||
          r.id.endsWith(`_${s.studentId}`)
        );
        if (student) {
          sessionMap[student.id] = r.status;
          sessionMap[student.studentId] = r.status;
          if (r.remark) {
            remarkMap[student.id] = r.remark;
            remarkMap[student.studentId] = r.remark;
          }
        } else {
          sessionMap[r.studentId] = r.status;
          if (r.remark) remarkMap[r.studentId] = r.remark;
        }
      });
    } else {
      // Room session fallback from localStorage in case cloud query is still resolving
      const todayDate = getTodayDateString();
      const localKey = `morning_session_${todayDate}_${level}_${dept}_${room}`;
      try {
        const saved = localStorage.getItem(localKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.session) Object.assign(sessionMap, parsed.session);
          if (parsed && parsed.remarks) Object.assign(remarkMap, parsed.remarks);
        }
      } catch (e) {}
    }

    setCurrentSession(sessionMap);
    setRemarks(remarkMap);
    setHasUnsavedChanges(false);
  }, [level, dept, room, filteredStudents, existingTodayRecords]);

  // Reload today's data from existing records
  const reloadTodayData = () => {
    const sessionMap: Record<string, AttendanceStatus> = {};
    const remarkMap: Record<string, string> = {};
    if (existingTodayRecords.length > 0) {
      existingTodayRecords.forEach(r => {
        const student = filteredStudents.find(s => 
          String(s.id) === String(r.studentId) || 
          String(s.studentId) === String(r.studentId) ||
          r.id.endsWith(`_${s.id}`) ||
          r.id.endsWith(`_${s.studentId}`)
        );
        if (student) {
          sessionMap[student.id] = r.status;
          sessionMap[student.studentId] = r.status;
          if (r.remark) {
            remarkMap[student.id] = r.remark;
            remarkMap[student.studentId] = r.remark;
          }
        } else {
          sessionMap[r.studentId] = r.status;
          if (r.remark) remarkMap[r.studentId] = r.remark;
        }
      });
    } else {
      const todayDate = getTodayDateString();
      const localKey = `morning_session_${todayDate}_${level}_${dept}_${room}`;
      try {
        const saved = localStorage.getItem(localKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.session) Object.assign(sessionMap, parsed.session);
          if (parsed && parsed.remarks) Object.assign(remarkMap, parsed.remarks);
        }
      } catch (e) {}
    }
    // Students without an existing record remain unselected
    setCurrentSession(sessionMap);
    setRemarks(remarkMap);
    setHasUnsavedChanges(false);
  };

  // Handle Scanner Focus Logic
  useEffect(() => {
    let focusInterval: number;
    if (isScannerEnabled && viewMode === 'checkin') {
      scanInputRef.current?.focus();
      focusInterval = window.setInterval(() => {
        if (document.activeElement !== scanInputRef.current) {
          scanInputRef.current?.focus();
        }
      }, 1000);
    }
    return () => clearInterval(focusInterval);
  }, [isScannerEnabled, viewMode]);

  const historyRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const student = morningStudents.find(s => 
        String(s.id) === String(record.studentId) || 
        String(s.studentId) === String(record.studentId) ||
        record.id.endsWith(`_${s.id}`) ||
        record.id.endsWith(`_${s.studentId}`)
      );
      const matchesFilter = record.type === 'MORNING' && 
        getCleanLevel(student?.level || '') === getCleanLevel(level) && 
        student?.department === dept && 
        String(student?.room || '1').trim() === String(room).trim();
      const matchesDate = selectedHistoryDate ? record.date === selectedHistoryDate : true;
      return matchesFilter && matchesDate;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceRecords, morningStudents, level, dept, room, selectedHistoryDate]);

  const handleStatusChange = (student: Student, status: AttendanceStatus) => {
    setCurrentSession(prev => {
      const isAlready = prev[student.id] === status || prev[student.studentId] === status;
      const next = { ...prev };
      if (isAlready) {
        delete next[student.id];
        delete next[student.studentId];
      } else {
        next[student.id] = status;
        next[student.studentId] = status;
      }
      return next;
    });
    setHasUnsavedChanges(true);
    setIsSaved(false);
  };

  const handleRemarkChange = (student: Student, remark: string) => {
    setRemarks(prev => ({ 
      ...prev, 
      [student.id]: remark,
      [student.studentId]: remark
    }));
    setHasUnsavedChanges(true);
    setIsSaved(false);
  };

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;

    const scannedStudent = morningStudents.find(s => s.studentId === barcodeInput.trim());
    
    if (scannedStudent) {
      handleStatusChange(scannedStudent, 'PRESENT');
      setLastScannedStudent(scannedStudent);
      
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        audio.volume = 0.5;
        audio.play();
      } catch (err) {}

      setTimeout(() => setLastScannedStudent(null), 2500);
    } else {
      setLastScannedStudent(null);
    }
    
    setBarcodeInput('');
    scanInputRef.current?.focus();
  };

  // Save or Update Attendance for the entire selected room
  const handleSave = async () => {
    const studentsWithStatus = filteredStudents.filter(s => !!(currentSession[s.id] || currentSession[s.studentId]));

    if (studentsWithStatus.length === 0) {
      setSaveMessage('⚠️ ยังไม่ได้เลือกสถานะของนักเรียน กรุณาเลือกสถานะก่อนบันทึก (หรือใช้ปุ่ม "มาทุกคน")');
      setTimeout(() => setSaveMessage(''), 3500);
      return;
    }

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const todayDate = getTodayDateString();
    const utcDate = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleString('th-TH');

    const newRecordsBatch: AttendanceRecord[] = studentsWithStatus.map(s => {
      const status = currentSession[s.id] || currentSession[s.studentId]!;
      const remark = remarks[s.id] || remarks[s.studentId] || '';
      return {
        id: `MORNING_${todayDate}_${s.studentId}`,
        studentId: s.studentId,
        date: todayDate,
        type: 'MORNING',
        status: status,
        remark: remark,
        timestamp: timestamp
      };
    });

    // Save per-room backup to localStorage immediately
    const localKey = `morning_session_${todayDate}_${level}_${dept}_${room}`;
    try {
      localStorage.setItem(localKey, JSON.stringify({
        session: currentSession,
        remarks: remarks,
        timestamp: timestamp,
        updatedAt: Date.now()
      }));
    } catch (e) {}
    
    // Save/Overwrite in Firestore for multi-device sync
    await saveMultipleToFirestore('attendance', newRecordsBatch);
    
    setAttendanceRecords(prev => {
      const studentKeys = new Set<string>();
      studentsWithStatus.forEach(s => {
        studentKeys.add(String(s.id));
        studentKeys.add(String(s.studentId));
      });
      const otherRecords = prev.filter(r => 
        !(r.type === 'MORNING' && 
          (studentKeys.has(String(r.studentId)) || studentKeys.has(String(r.id).replace(`MORNING_${r.date}_`, ''))) && 
          (r.date === todayDate || r.date === utcDate))
      );
      const updated = [...otherRecords, ...newRecordsBatch];
      try {
        localStorage.setItem('cached_attendance_records', JSON.stringify(updated.slice(-1500)));
      } catch (e) {}
      return updated;
    });

    setIsSaving(false);
    setIsSaved(true);
    setHasUnsavedChanges(false);
    const unselectedCount = filteredStudents.length - studentsWithStatus.length;
    const extraMsg = unselectedCount > 0 ? ` (บันทึกแล้ว ${studentsWithStatus.length} คน, ยังไม่เช็ค ${unselectedCount} คน)` : '';
    setSaveMessage((hasExistingTodayRecords ? 'อัพเดทข้อมูลการเข้าแถววันนี้สำเร็จเรียบร้อยแล้ว!' : 'บันทึกการเช็คชื่อเข้าแถววันนี้สำเร็จเรียบร้อยแล้ว!') + extraMsg);
    setTimeout(() => {
      setIsSaved(false);
      setSaveMessage('');
    }, 3500);
  };

  // Quick Save / Update for a single student (e.g. student arriving late)
  const handleSaveSingleStudent = async (student: Student) => {
    const status = currentSession[student.id] || currentSession[student.studentId];
    if (!status) {
      setSaveMessage('⚠️ กรุณาเลือกสถานะ (มา/สาย/ลา/ขาด) ของนักเรียนคนนี้ก่อนบันทึก');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setUpdatingStudentId(student.id);
    const todayDate = getTodayDateString();
    const utcDate = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleString('th-TH');

    const newRecord: AttendanceRecord = {
      id: `MORNING_${todayDate}_${student.studentId}`,
      studentId: student.studentId,
      date: todayDate,
      type: 'MORNING',
      status: status,
      remark: remarks[student.id] || remarks[student.studentId] || '',
      timestamp: timestamp
    };

    try {
      await saveToFirestore('attendance', newRecord);

      // Save to local key cache as well
      const localKey = `morning_session_${todayDate}_${level}_${dept}_${room}`;
      try {
        localStorage.setItem(localKey, JSON.stringify({
          session: currentSession,
          remarks: remarks,
          timestamp: timestamp,
          updatedAt: Date.now()
        }));
      } catch (e) {}

      setAttendanceRecords(prev => {
        const otherRecords = prev.filter(r => 
          !(r.type === 'MORNING' && 
            (String(r.studentId) === String(student.id) || String(r.studentId) === String(student.studentId)) && 
            (r.date === todayDate || r.date === utcDate))
        );
        const updated = [...otherRecords, newRecord];
        try {
          localStorage.setItem('cached_attendance_records', JSON.stringify(updated.slice(-1500)));
        } catch (e) {}
        return updated;
      });

      // Quick visual feedback
      setSaveMessage(`อัพเดทข้อมูลของนักเรียนสำเร็จ (${timestamp.split(' ')[1] || 'บันทึกแล้ว'})`);
      setTimeout(() => setSaveMessage(''), 2500);
    } catch (e) {
      setSaveMessage('เกิดข้อผิดพลาดในการอัพเดทข้อมูล');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setUpdatingStudentId(null);
    }
  };

  // Quick edit single record from History tab
  const handleOpenEditHistory = (record: AttendanceRecord) => {
    setEditingHistoryRecord(record);
    setEditHistoryStatus(record.status);
    setEditHistoryRemark(record.remark || '');
  };

  const handleSaveHistoryEdit = async () => {
    if (!editingHistoryRecord) return;
    setIsHistorySaving(true);
    const updatedRecord: AttendanceRecord = {
      ...editingHistoryRecord,
      status: editHistoryStatus,
      remark: editHistoryRemark,
      timestamp: `${new Date().toLocaleString('th-TH')} (แก้ไข)`
    };

    try {
      await saveToFirestore('attendance', updatedRecord);
      setAttendanceRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
      setEditingHistoryRecord(null);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
    } finally {
      setIsHistorySaving(false);
    }
  };

  const markAll = (status: AttendanceStatus) => {
    const newBatch: Record<string, AttendanceStatus> = {};
    filteredStudents.forEach(s => { 
      newBatch[s.id] = status; 
      newBatch[s.studentId] = status; 
    });
    setCurrentSession(prev => ({ ...prev, ...newBatch }));
    setHasUnsavedChanges(true);
    setIsSaved(false);
  };

  const clearAll = () => {
    setCurrentSession({});
    setRemarks({});
    setHasUnsavedChanges(true);
    setIsSaved(false);
  };

  // Calculate live stats for the current view
  const stats = useMemo(() => {
    let presents = 0;
    let lates = 0;
    let leaves = 0;
    let absents = 0;
    let unselected = 0;

    filteredStudents.forEach(s => {
      const st = currentSession[s.id] || currentSession[s.studentId];
      if (st === 'PRESENT') presents++;
      else if (st === 'LATE') lates++;
      else if (st === 'SICK_LEAVE' || st === 'BUSINESS_LEAVE') leaves++;
      else if (st === 'ABSENT') absents++;
      else unselected++;
    });

    return {
      total: filteredStudents.length,
      presents,
      lates,
      leaves,
      absents,
      unselected
    };
  }, [filteredStudents, currentSession]);

  const shareToLine = () => {
    const rawDate = new Date().toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    const currentTimeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    let text = `📋 รายงานเช็คชื่อเข้าแถว (ภาคปกติ)\n`;
    text += `🗓️ วันที่: ${rawDate}\n`;
    text += `🏫 ${level} / ${dept} (ห้อง ${room})\n`;
    if (hasExistingTodayRecords) {
      text += `🔄 (อัพเดทล่าสุด ณ เวลา ${currentTimeStr} น.)\n`;
    }
    text += `--------------------------\n`;
    
    filteredStudents.forEach((s, idx) => {
      const status = currentSession[s.id] || currentSession[s.studentId];
      let label = '(ยังไม่เช็ค)';
      if (status === 'PRESENT') label = '(มา)';
      else if (status === 'LATE') label = '(สาย)';
      else if (status === 'SICK_LEAVE') label = '(ลาป่วย)';
      else if (status === 'BUSINESS_LEAVE') label = '(ลากิจ)';
      else if (status === 'ABSENT') label = '(ขาด)';
      
      const rmkText = remarks[s.id] || remarks[s.studentId];
      const rmk = rmkText ? ` [${rmkText}]` : '';
      text += `${idx + 1}. ${s.name} ${label}${rmk}\n`;
    });
    text += `--------------------------\n`;
    
    text += `มา: ${stats.presents} | สาย: ${stats.lates} | ลา: ${stats.leaves} | ขาด: ${stats.absents}`;
    if (stats.unselected > 0) {
      text += ` | ยังไม่เช็ค: ${stats.unselected}`;
    }
    text += ` | รวม: ${stats.total}\n`;
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
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-28">
      {/* Top Header Mode Tabs & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex bg-white p-2 rounded-[22px] border border-slate-200 shadow-sm w-full md:w-fit">
          <button 
            onClick={() => setViewMode('checkin')} 
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-black transition-all ${viewMode === 'checkin' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ClipboardCheck size={18} /> เช็คชื่อวันนี้
            {hasExistingTodayRecords && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" title="มีข้อมูลของวันนี้แล้ว" />
            )}
          </button>
          <button 
            onClick={() => setViewMode('history')} 
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-black transition-all ${viewMode === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History size={18} /> ประวัติ
          </button>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {viewMode === 'checkin' && (
            <button 
              onClick={() => setIsScannerEnabled(!isScannerEnabled)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[11px] md:text-sm font-black shadow-xl transition-all uppercase tracking-widest font-heading active:scale-95 border-2 ${isScannerEnabled ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              {isScannerEnabled ? <CameraOff size={20} /> : <Scan size={20} />}
              {isScannerEnabled ? 'ปิดโหมดสแกน' : 'เปิดโหมดสแกน'}
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
           <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
              <div className="w-full h-1 bg-amber-400 absolute animate-[scan-move_3s_linear_infinite]" />
           </div>
           
           <div className="flex flex-col items-center text-center space-y-8 relative z-10">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3 text-amber-400">
                  <Scan size={32} className="animate-pulse" />
                  <h3 className="text-3xl font-black text-white font-heading uppercase tracking-tight">Scanner Terminal</h3>
                </div>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">พร้อมรับรหัสนักเรียนจากเครื่องสแกน หรือ บาร์โค้ด</p>
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
                      <span>กรุณายิงบาร์โค้ด หรือ พิมพ์เลขประจำตัวนักเรียน</span>
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

      {/* Class & Filter Selector Card */}
      <div className="bg-white p-5 md:p-8 rounded-[28px] md:rounded-[32px] border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ระดับชั้น</label>
            <select value={level} onChange={(e) => handleLevelChange(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 font-bold text-xs text-slate-900 outline-none transition-all">
              {availableLevels.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">แผนกวิชา</label>
            <select value={dept} onChange={(e) => handleDeptChange(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 font-bold text-xs text-slate-900 outline-none transition-all">
              {availableDepts.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ห้องเรียน</label>
            <select value={room} onChange={(e) => handleRoomChange(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 font-bold text-xs text-slate-900 outline-none transition-all">
              {availableRooms.map(v => <option key={v} value={v}>ห้อง {v}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1 lg:col-span-2 space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">{viewMode === 'checkin' ? 'ค้นหารายชื่อ' : 'เลือกวันที่'}</label>
            {viewMode === 'checkin' ? (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="พิมพ์ชื่อนักเรียน หรือ รหัสนักเรียน..." className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl pl-12 pr-4 py-3 font-bold text-xs text-slate-900 outline-none transition-all shadow-inner" />
              </div>
            ) : (
              <input type="date" value={selectedHistoryDate} onChange={(e) => setSelectedHistoryDate(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 font-bold text-xs text-slate-900 outline-none" />
            )}
          </div>
        </div>
      </div>

      {/* TODAY STATUS BANNER & UPDATE MODE INDICATOR (In Check-in View) */}
      {viewMode === 'checkin' && (
        <div className={`p-5 md:p-6 rounded-[28px] border transition-all ${
          hasExistingTodayRecords 
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50/70 to-blue-50 border-emerald-200/80 shadow-sm'
            : 'bg-amber-50/70 border-amber-200/80'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                  hasExistingTodayRecords 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-amber-500 text-white'
                }`}>
                  {hasExistingTodayRecords ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" style={{ animationDuration: '6s' }} /> 
                      โหมดอัพเดทข้อมูลวันนี้
                    </>
                  ) : (
                    <>
                      <Sun size={13} />
                      ยังไม่ได้บันทึกวันนี้
                    </>
                  )}
                </span>
                
                {hasExistingTodayRecords && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    เช็คชื่อแล้ว {existingTodayRecords.length} จาก {filteredStudents.length} คน
                  </span>
                )}

                {lastRecordedTimestamp && (
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" />
                    บันทึกล่าสุด: {lastRecordedTimestamp}
                  </span>
                )}
              </div>

              <p className="text-xs md:text-sm font-bold text-slate-700">
                {hasExistingTodayRecords ? (
                  <>
                    <span className="text-emerald-700 font-black">สามารถแก้ไข/อัพเดทข้อมูลได้ตลอดทั้งวัน:</span> หากมีนักเรียนมาสาย เปลี่ยนสถานะ หรือแก้ไขหมายเหตุ สามารถปรับเปลี่ยนและกด <strong>"อัพเดทข้อมูลวันนี้"</strong> ได้ทันที
                  </>
                ) : (
                  <>
                    กรุณาเลือกสถานะการเข้าแถวของนักเรียนแต่ละคน (มา / สาย / ลา / ขาด) จากนั้นกดปุ่ม <strong>"บันทึกการเช็คชื่อวันนี้"</strong>
                  </>
                )}
              </p>
            </div>

            {hasExistingTodayRecords && (
              <button 
                onClick={reloadTodayData}
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-black border border-slate-200 shadow-sm transition-all shrink-0 active:scale-95"
                title="ดึงข้อมูลที่บันทึกล่าสุดกลับมาแสดง"
              >
                <RotateCcw size={14} /> โหลดข้อมูลที่บันทึกไว้
              </button>
            )}
          </div>

          {/* Quick Real-Time Statistics Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-slate-200/60">
            <div className="bg-white/80 backdrop-blur-sm p-2.5 rounded-xl border border-slate-200/60 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">นักเรียนทั้งหมด</p>
              <p className="text-lg font-black text-slate-800 font-heading">{stats.total} คน</p>
            </div>
            <div className="bg-slate-100/90 p-2.5 rounded-xl border border-slate-200/80 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ยังไม่เช็ค</p>
              <p className="text-lg font-black text-slate-600 font-heading">{stats.unselected} คน</p>
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
            <div className="bg-red-50/80 p-2.5 rounded-xl border border-red-200/60 text-center">
              <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">ขาด</p>
              <p className="text-lg font-black text-red-800 font-heading">{stats.absents} คน</p>
            </div>
          </div>
        </div>
      )}

      {/* Save / Feedback Notification Bar */}
      {saveMessage && (
        <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-200 shrink-0" />
            <span className="font-bold text-sm md:text-base">{saveMessage}</span>
          </div>
          <button onClick={() => setSaveMessage('')} className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-100">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Bulk Delete Option in History Mode */}
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

      {/* CHECKIN VIEW */}
      {viewMode === 'checkin' ? (
        <>
          {/* Quick Mark All Buttons & Primary Save Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => markAll('PRESENT')} 
                className="flex-1 md:flex-none px-5 py-3 bg-green-50 text-green-700 rounded-xl text-[10px] font-black border border-green-200 uppercase tracking-widest hover:bg-green-100 transition-all active:scale-95"
              >
                มาทุกคน
              </button>
              <button 
                onClick={() => markAll('ABSENT')} 
                className="flex-1 md:flex-none px-5 py-3 bg-red-50 text-red-700 rounded-xl text-[10px] font-black border border-red-200 uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
              >
                ขาดทุกคน
              </button>
              <button 
                onClick={clearAll} 
                className="flex-1 md:flex-none px-4 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black border border-slate-200 uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                title="ยกเลิกการเลือกสถานะทั้งหมด ให้กลับเป็นค่าว่าง"
              >
                ล้างสถานะ
              </button>
            </div>

            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className={`flex items-center justify-center gap-3 px-8 py-4.5 rounded-2xl text-white font-black transition-all shadow-xl active:scale-95 ${
                isSaved ? 'bg-green-600 shadow-green-200' : 
                isSaving ? 'bg-slate-400 cursor-not-allowed' : 
                hasExistingTodayRecords 
                  ? hasUnsavedChanges 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 ring-4 ring-emerald-300/40' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  : 'bg-slate-900 hover:bg-black shadow-slate-300'
              }`}
            >
              {isSaving ? (
                <Loader2 size={22} className="animate-spin" />
              ) : isSaved ? (
                <CheckCircle2 size={22} />
              ) : hasExistingTodayRecords ? (
                <RefreshCw size={22} className={hasUnsavedChanges ? "animate-spin" : ""} style={{ animationDuration: '4s' }} />
              ) : (
                <Save size={22} />
              )} 
              <span className="text-sm md:text-base font-heading">
                {isSaving ? 'กำลังบันทึกข้อมูล...' : 
                 isSaved ? 'บันทึกสำเร็จเรียบร้อย!' : 
                 hasExistingTodayRecords ? (hasUnsavedChanges ? 'อัพเดทข้อมูลวันนี้ (มีการเปลี่ยนแปลง)' : 'อัพเดทข้อมูลการเช็คชื่อวันนี้') : 
                 'บันทึกการเช็คชื่อวันนี้'}
              </span>
            </button>
          </div>

          {/* Student Checkin Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStudents.map((student, index) => {
              const currentStatus = currentSession[student.id] || currentSession[student.studentId];
              const existingRecord = existingTodayRecords.find(r => 
                String(r.studentId) === String(student.id) || 
                String(r.studentId) === String(student.studentId) || 
                r.id === `MORNING_${r.date}_${student.id}` || 
                r.id === `MORNING_${r.date}_${student.studentId}` ||
                r.id.endsWith(`_${student.id}`) ||
                r.id.endsWith(`_${student.studentId}`)
              );
              const isStatusChanged = existingRecord && currentStatus && existingRecord.status !== currentStatus;

              return (
                <div 
                  key={student.id} 
                  className={`p-6 rounded-[32px] border-2 flex flex-col gap-4 group transition-all relative overflow-hidden shadow-sm hover:shadow-md ${
                    !currentStatus 
                      ? 'bg-white border-slate-200 hover:border-slate-300' 
                      : currentStatus === 'PRESENT' 
                      ? 'bg-green-50/15 border-green-400/80' 
                      : currentStatus === 'LATE' 
                      ? 'bg-amber-50/15 border-amber-400/80' 
                      : currentStatus === 'SICK_LEAVE' || currentStatus === 'BUSINESS_LEAVE' 
                      ? 'bg-blue-50/15 border-blue-400/80' 
                      : 'bg-red-50/15 border-red-400/80'
                  }`}
                >
                  {/* Status Indicator Background Watermark */}
                  {currentStatus === 'PRESENT' && (
                     <div className="absolute top-0 right-0 p-4 text-green-500/15 pointer-events-none">
                        <CheckCircle2 size={64} />
                     </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-sm shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-base truncate font-heading">{student.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {student.studentId}</p>
                      </div>
                    </div>

                    {/* Today's Existing Status Badge / Change Badge */}
                    <div className="text-right">
                      {existingRecord ? (
                        <div className="flex flex-col items-end gap-1">
                          {isStatusChanged ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black animate-pulse">
                              แก้เป็น {STATUS_LABELS[currentStatus].label}
                            </span>
                          ) : currentStatus ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                              บันทึกแล้ว: {STATUS_LABELS[existingRecord.status].label}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold">
                              เดิม: {STATUS_LABELS[existingRecord.status].label}
                            </span>
                          )}
                        </div>
                      ) : currentStatus ? (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[9px] font-bold">
                          เลือก: {STATUS_LABELS[currentStatus].label}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[9px] font-bold">
                          ยังไม่เลือกสถานะ
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Selection Buttons */}
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(STATUS_LABELS).map(([key, value]) => {
                      const isSelected = currentStatus === key;
                      return (
                        <button 
                          key={key} 
                          onClick={() => handleStatusChange(student, key as AttendanceStatus)} 
                          className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all active:scale-95 ${
                            isSelected 
                              ? value.color + ' border-current shadow-md ring-2 ring-current/20 font-black' 
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                          }`}
                        >
                          <div className="scale-90 md:scale-100">{value.icon}</div>
                          <span className="text-[8px] font-black uppercase text-center leading-tight tracking-tighter">{value.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Remark input if not present */}
                  {(currentStatus && currentStatus !== 'PRESENT') && (
                    <div className="relative animate-in slide-in-from-top-2">
                      <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        value={remarks[student.id] || remarks[student.studentId] || ''} 
                        onChange={(e) => handleRemarkChange(student, e.target.value)} 
                        placeholder="ระบุเหตุผลในการลา/สาย/ขาด..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 font-bold text-slate-900 outline-none text-[10px] focus:border-blue-500 transition-all shadow-inner" 
                      />
                    </div>
                  )}

                  {/* Quick Save Single Student Button (Extremely handy when updating 1 student) */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold">
                      {existingRecord?.timestamp ? `ล่าสุด: ${existingRecord.timestamp}` : 'ยังไม่มีประวัติวันนี้'}
                    </span>
                    <button
                      onClick={() => handleSaveSingleStudent(student)}
                      disabled={updatingStudentId === student.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all"
                      title="บันทึกหรืออัพเดทเฉพาะนักเรียนคนนี้ทันที"
                    >
                      {updatingStudentId === student.id ? (
                        <Loader2 size={12} className="animate-spin text-blue-600" />
                      ) : (
                        <Check size={12} />
                      )}
                      <span>{existingRecord ? 'อัพเดทเฉพาะคนนี้' : 'บันทึกคนนี้'}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="col-span-full py-24 text-center bg-white rounded-[40px] border-4 border-dashed border-slate-100">
                <Sun size={64} className="mx-auto opacity-10 mb-6" />
                <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-sm">ไม่พบรายชื่อในกลุ่มนี้</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* HISTORY VIEW */
        <div className="space-y-6">
          {/* Today's History Header Alert with shortcut to checkin/update */}
          {historyRecords.some(isRecordToday) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                    มีข้อมูลของวันนี้
                  </span>
                  <span className="text-xs font-bold text-blue-900">
                    สามารถแก้ไขข้อมูลของวันนี้ได้โดยตรงจากรายการด้านล่าง หรือสลับไปยังหน้า "เช็คชื่อวันนี้"
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setViewMode('checkin')} 
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-md shrink-0 active:scale-95"
              >
                <Edit3 size={14} /> ไปหน้าอัพเดทข้อมูลวันนี้
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyRecords.length > 0 ? historyRecords.map((record) => {
              const student = morningStudents.find(s => String(s.id) === String(record.studentId) || String(s.studentId) === String(record.studentId)) || students.find(s => String(s.id) === String(record.studentId) || String(s.studentId) === String(record.studentId));
              const isToday = isRecordToday(record);

              return (
                <div 
                  key={record.id} 
                  className={`bg-white p-6 rounded-[32px] border flex flex-col gap-4 shadow-sm hover:shadow-md transition-all ${
                    isToday ? 'border-blue-300 bg-blue-50/5' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${
                        isToday ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <ClipboardCheck size={20} />
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-900 font-heading leading-none">{student?.name || record.studentId}</p>
                         <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{record.date}</span>
                           {isToday && (
                             <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[8px] font-black">
                               วันนี้
                             </span>
                           )}
                         </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest shadow-sm ${STATUS_LABELS[record.status].color}`}>
                        {STATUS_LABELS[record.status].label}
                      </span>

                      {/* Edit Button for Today's Record in History */}
                      {isToday && (
                        <button 
                          onClick={() => handleOpenEditHistory(record)} 
                          className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all"
                          title="แก้ไขข้อมูลของวันนี้"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}

                      {/* Delete button */}
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
                      <MessageSquare size={14} className="text-slate-400 shrink-0" /> 
                      <span className="truncate">{record.remark}</span>
                    </div>
                  )}

                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between pt-1 border-t border-slate-100">
                     <span className="flex items-center gap-1 opacity-70">
                       <Clock size={12} /> {record.timestamp}
                     </span>
                     {isToday && (
                       <button 
                         onClick={() => handleOpenEditHistory(record)} 
                         className="text-blue-600 hover:underline font-black text-[9px]"
                       >
                         แก้ไขสถานะ
                       </button>
                     )}
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
        </div>
      )}

      {/* MODAL: Edit Record from History */}
      {editingHistoryRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 md:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-heading">แก้ไขข้อมูลการเข้าแถววันนี้</h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  {morningStudents.find(s => String(s.id) === String(editingHistoryRecord.studentId) || String(s.studentId) === String(editingHistoryRecord.studentId))?.name || editingHistoryRecord.studentId}
                </p>
              </div>
              <button 
                onClick={() => setEditingHistoryRecord(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 font-heading">เลือกสถานะใหม่</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_LABELS).map(([key, value]) => (
                    <button 
                      key={key} 
                      type="button"
                      onClick={() => setEditHistoryStatus(key as AttendanceStatus)} 
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        editHistoryStatus === key 
                          ? value.color + ' border-current shadow-md font-black' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <div>{value.icon}</div>
                      <span className="text-xs font-bold">{value.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 font-heading">หมายเหตุ (ถ้ามี)</label>
                <input 
                  type="text" 
                  value={editHistoryRemark} 
                  onChange={(e) => setEditHistoryRemark(e.target.value)} 
                  placeholder="ระบุเหตุผล เช่น มาสายเนื่องจากฝนตก..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-xs text-slate-900 outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setEditingHistoryRecord(null)} 
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-black hover:bg-slate-50 transition-all"
              >
                ยกเลิก
              </button>
              <button 
                type="button" 
                onClick={handleSaveHistoryEdit} 
                disabled={isHistorySaving}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all"
              >
                {isHistorySaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{isHistorySaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Action Bar on Mobile/Tablet */}
      {viewMode === 'checkin' && filteredStudents.length > 0 && (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-40 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-6">
          <div className="text-xs font-bold text-slate-300">
            <span className="text-emerald-400 font-black">มา {stats.presents}</span> • <span className="text-amber-400 font-black">สาย {stats.lates}</span> • <span className="text-red-400 font-black">ขาด {stats.absents}</span>
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
              isSaved ? 'bg-green-600 text-white' :
              hasExistingTodayRecords ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={14} />}
            <span>{isSaving ? 'กำลังบันทึก...' : isSaved ? 'สำเร็จ!' : hasExistingTodayRecords ? 'อัพเดทวันนี้' : 'บันทึกวันนี้'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MorningAttendance;