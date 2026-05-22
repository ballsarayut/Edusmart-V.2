
import React, { useState, useMemo, useEffect } from 'react';
import { Student, AttendanceRecord, BehaviorRecord, StudyBlock, PaymentRecord, TuitionConfig, EnglishScoreRecord } from '../types';
import * as XLSX from 'xlsx';
import { 
  FileText, 
  Search, 
  Download, 
  User, 
  Award, 
  TrendingUp,
  Users,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Wallet,
  Calendar,
  ChevronRight,
  Sun,
  Plus,
  ArrowRight,
  TrendingDown,
  Activity,
  /* Added missing icons to fix component errors */
  Star,
  X,
  Banknote
} from 'lucide-react';
import { STATUS_LABELS } from '../constants';

interface ReportsProps {
  students: Student[];
  attendance: AttendanceRecord[];
  behavior: BehaviorRecord[];
  user: any;
  studyBlocks: StudyBlock[];
  paymentRecords?: PaymentRecord[];
  tuitionConfigs?: TuitionConfig[];
  englishScores?: EnglishScoreRecord[];
  initialTab?: 'individual' | 'room';
}

const Reports: React.FC<ReportsProps> = ({ 
  students, attendance, behavior, user, studyBlocks, paymentRecords = [], tuitionConfigs = [], englishScores = [],
  initialTab
}) => {
  const isParent = user.role === 'PARENT';
  
  const parentChild = useMemo(() => {
    if (!isParent) return null;
    return students.find(s => String(s.id) === String(user.studentId) || String(s.studentId) === String(user.studentId));
  }, [isParent, students, user.studentId]);

  const [activeTab, setActiveTab] = useState<'individual' | 'room'>(initialTab || (isParent ? 'individual' : 'room'));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    isParent ? parentChild?.id || null : null
  );

  useEffect(() => {
    if (isParent && parentChild) {
      setSelectedStudentId(parentChild.id);
    }
  }, [isParent, parentChild]);

  /* Fix: Explicitly cast mapped values to string array to avoid unknown assignment errors on line 63 */
  const availableLevels = useMemo(() => Array.from(new Set(students.map(s => s.level))).map(String).sort(), [students]);
  const availableDepts = useMemo(() => Array.from(new Set(students.map(s => s.department))).map(String).sort(), [students]);
  const availableRooms = useMemo(() => Array.from(new Set(students.map(s => s.room))).map(String).sort((a, b) => parseInt(a) - parseInt(b)), [students]);

  const [reportLevel, setReportLevel] = useState<string>(availableLevels[0] || '');
  const [reportDept, setReportDept] = useState<string>(availableDepts[0] || '');
  const [reportRoom, setReportRoom] = useState<string>(availableRooms[0] || '');

  const selectedStudent = useMemo(() => students.find(s => String(s.id) === String(selectedStudentId)), [students, selectedStudentId]);

  const roomStudents = useMemo(() => {
    return students.filter(s => 
      s.level === reportLevel && s.department === reportDept && s.room === reportRoom
    );
  }, [students, reportLevel, reportDept, reportRoom]);

  const getStudentMetrics = (studentId: string) => {
    const studentRecords = attendance.filter(a => String(a.studentId) === String(studentId));
    const morningRecords = studentRecords.filter(r => r.type === 'MORNING');
    const presents = morningRecords.filter(r => r.status === 'PRESENT').length;
    const lates = morningRecords.filter(r => r.status === 'LATE').length;
    const absents = morningRecords.filter(r => r.status === 'ABSENT').length;
    const rate = morningRecords.length > 0 ? Math.round((presents / morningRecords.length) * 100) : 0;

    const student = students.find(s => String(s.id) === String(studentId));
    const config = tuitionConfigs.find(c => c.level === student?.level && c.department === student?.department);
    const paid = paymentRecords.filter(p => String(p.studentId) === String(studentId)).reduce((sum, p) => sum + p.amount, 0);
    const totalDue = config?.amount || 0;
    const remaining = Math.max(0, totalDue - paid);

    const sermonRecords = studentRecords.filter(r => r.type === 'SERMON' && r.status === 'RECORDED');
    // Using a map to track unique entries per block
    const blockDays: Record<number, Set<number>> = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
    sermonRecords.forEach(r => {
      if (r.sermonBlock && r.sermonDay) {
        blockDays[r.sermonBlock].add(r.sermonDay);
      }
    });
    
    // Sum scores from each block (18 days = 5 points)
    const sermonScore = Number(Object.values(blockDays).reduce((acc, set) => acc + ((set.size / 18) * 5), 0).toFixed(2));

    const englishScore = englishScores.find(e => String(e.studentId) === String(studentId))?.score || 0;

    const blockSermonScores = Object.entries(blockDays).reduce((acc, [block, set]) => {
      acc[Number(block)] = Number(((set.size / 18) * 5).toFixed(2));
      return acc;
    }, {} as Record<number, number>);

    // Calculate Morning Attendance by Block
    const blockAttendance: Record<number, number> = {};
    studyBlocks.forEach(block => {
      const start = new Date(block.startDate);
      const end = new Date(block.endDate);
      
      const recordsInBlock = morningRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= start && recordDate <= end;
      });

      const blockPresents = recordsInBlock.filter(r => r.status === 'PRESENT').length;
      // Fixed: Use 18 days as denominator to match Sermon score calculation (18 days = 5 points)
      const blockScore = Number(((blockPresents / 18) * 5).toFixed(2));
      blockAttendance[block.id] = blockScore;
    });

    return { rate, presents, lates, absents, paid, remaining, totalDue, sermonScore, englishScore, blockSermonScores, blockAttendance };
  };

  const exportIndividualExcel = () => {
    if (!selectedStudent) return;
    const { rate, paid, remaining } = getStudentMetrics(selectedStudent.id);

    const attData = attendance
      .filter(a => String(a.studentId) === String(selectedStudent.id))
      .map(a => ({
        'วันที่': a.date,
        'ประเภท': a.type === 'MORNING' ? 'เข้าแถว' : 'รายวิชา',
        'สถานะ': STATUS_LABELS[a.status]?.label || a.status,
        'หมายเหตุ': a.remark || '-',
        'เวลาที่บันทึก': a.timestamp
      }));

    const behData = behavior
      .filter(b => String(b.studentId) === String(selectedStudent.id))
      .map(b => ({
        'วันที่': b.date,
        'รายการ': b.reason,
        'ประเภท': b.type === 'ADD' ? 'เพิ่มคะแนน' : 'หักคะแนน',
        'คะแนน': b.score,
        'ผู้บันทึก': b.recordedBy
      }));

    const wb = XLSX.utils.book_new();
    const wsAtt = XLSX.utils.json_to_sheet(attData);
    XLSX.utils.book_append_sheet(wb, wsAtt, "สถิติการมาเรียน");
    const wsBeh = XLSX.utils.json_to_sheet(behData);
    XLSX.utils.book_append_sheet(wb, wsBeh, "บันทึกพฤติกรรม");

    XLSX.writeFile(wb, `รายงานผล_${selectedStudent.studentId}_${selectedStudent.name}.xlsx`);
  };

  const exportRoomExcel = () => {
    if (roomStudents.length === 0) return;

    // Data for Sheet 1: Detailed Report
    const reportData = roomStudents.map((s, idx) => {
      const metrics = getStudentMetrics(s.id);
      
      const b1Att = metrics.blockAttendance[1] || 0;
      const b1Ser = metrics.blockSermonScores[1] || 0;
      const b2Att = metrics.blockAttendance[2] || 0;
      const b2Ser = metrics.blockSermonScores[2] || 0;
      const b3Att = metrics.blockAttendance[3] || 0;
      const b3Ser = metrics.blockSermonScores[3] || 0;
      const b4Att = metrics.blockAttendance[4] || 0;
      const b4Ser = metrics.blockSermonScores[4] || 0;
      const b5Att = metrics.blockAttendance[5] || 0;
      const b5Ser = metrics.blockSermonScores[5] || 0;

      return {
        'ลำดับ': idx + 1,
        'ชื่อ-นามสกุล': s.name,
        'รหัสประจำตัว': s.studentId,
        'เข้าแถว บล็อก 1 (5)': b1Att,
        'โอวาท บล็อก 1 (5)': b1Ser,
        '⭐ รวม บล็อก 1 (10) ⭐': Number((b1Att + b1Ser).toFixed(2)),
        'เข้าแถว บล็อก 2 (5)': b2Att,
        'โอวาท บล็อก 2 (5)': b2Ser,
        '⭐ รวม บล็อก 2 (10) ⭐': Number((b2Att + b2Ser).toFixed(2)),
        'เข้าแถว บล็อก 3 (5)': b3Att,
        'โอวาท บล็อก 3 (5)': b3Ser,
        '⭐ รวม บล็อก 3 (10) ⭐': Number((b3Att + b3Ser).toFixed(2)),
        'เข้าแถว บล็อก 4 (5)': b4Att,
        'โอวาท บล็อก 4 (5)': b4Ser,
        '⭐ รวม บล็อก 4 (10) ⭐': Number((b4Att + b4Ser).toFixed(2)),
        'เข้าแถว บล็อก 5 (5)': b5Att,
        'โอวาท บล็อก 5 (5)': b5Ser,
        '⭐ รวม บล็อก 5 (10) ⭐': Number((b5Att + b5Ser).toFixed(2)),
        'คะแนนภาษาอังกฤษ (เต็ม 10)': metrics.englishScore,
        'คะแนนพฤติกรรม': s.behaviorScore
      };
    });

    // Data for Sheet 2: Summary Report
    const summaryData = roomStudents.map((s, idx) => {
      const metrics = getStudentMetrics(s.id);
      
      const b1Sum = Number(((metrics.blockAttendance[1] || 0) + (metrics.blockSermonScores[1] || 0)).toFixed(2));
      const b2Sum = Number(((metrics.blockAttendance[2] || 0) + (metrics.blockSermonScores[2] || 0)).toFixed(2));
      const b3Sum = Number(((metrics.blockAttendance[3] || 0) + (metrics.blockSermonScores[3] || 0)).toFixed(2));
      const b4Sum = Number(((metrics.blockAttendance[4] || 0) + (metrics.blockSermonScores[4] || 0)).toFixed(2));
      const b5Sum = Number(((metrics.blockAttendance[5] || 0) + (metrics.blockSermonScores[5] || 0)).toFixed(2));

      return {
        'ลำดับ': idx + 1,
        'ชื่อ-นามสกุล': s.name,
        'รหัสประจำตัว': s.studentId,
        'รวม บล็อก 1': b1Sum,
        'รวม บล็อก 2': b2Sum,
        'รวม บล็อก 3': b3Sum,
        'รวม บล็อก 4': b4Sum,
        'รวม บล็อก 5': b5Sum,
        'คะแนนภาษาอังกฤษ': metrics.englishScore
      };
    });

    const wb = XLSX.utils.book_new();
    
    // Create first worksheet (Detailed)
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wscols = [
      { wch: 8 },  // ลำดับ
      { wch: 25 }, // ชื่อ-นามสกุล
      { wch: 15 }, // รหัสประจำตัว
      { wch: 20 }, { wch: 20 }, { wch: 22 }, // บล็อก 1
      { wch: 20 }, { wch: 20 }, { wch: 22 }, // บล็อก 2
      { wch: 20 }, { wch: 20 }, { wch: 22 }, // บล็อก 3
      { wch: 20 }, { wch: 20 }, { wch: 22 }, // บล็อก 4
      { wch: 20 }, { wch: 20 }, { wch: 22 }, // บล็อก 5
      { wch: 25 }, // คะแนนภาษาอังกฤษ
      { wch: 15 }  // คะแนนพฤติกรรม
    ];
    ws['!cols'] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "รายงานผลรายห้อง (ละเอียด)");

    // Create second worksheet (Summary)
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const summaryCols = [
      { wch: 8 },  // ลำดับ
      { wch: 25 }, // ชื่อ-นามสกุล
      { wch: 15 }, // รหัสประจำตัว
      { wch: 15 }, // บล็อก 1
      { wch: 15 }, // บล็อก 2
      { wch: 15 }, // บล็อก 3
      { wch: 15 }, // บล็อก 4
      { wch: 15 }, // บล็อก 5
      { wch: 20 }  // คะแนนภาษาอังกฤษ
    ];
    wsSummary['!cols'] = summaryCols;
    XLSX.utils.book_append_sheet(wb, wsSummary, "สรุปคะแนนรวม");

    XLSX.writeFile(wb, `รายงานสรุป_${reportLevel}_${reportDept}_ห้อง${reportRoom}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-fit">
          {!isParent && (
            <button onClick={() => setActiveTab('room')} className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-black transition-all font-heading ${activeTab === 'room' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Users size={18} /> ดึงข้อมูลรายห้อง
            </button>
          )}
          <button onClick={() => setActiveTab('individual')} className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-black transition-all font-heading ${activeTab === 'individual' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <User size={18} /> {isParent ? 'ผลการเรียนและพฤติกรรม' : 'รายงานผลรายบุคคล'}
          </button>
        </div>
        
        {isParent && (
           <div className="px-5 py-2.5 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 animate-pulse">
             <Activity size={12} /> ระบบอัปเดตข้อมูลล่าสุดแบบเรียลไทม์
           </div>
        )}
      </div>

      {activeTab === 'room' && !isParent && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ระดับชั้น</label>
              <select value={reportLevel} onChange={(e) => setReportLevel(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 font-bold text-slate-900 outline-none">
                {availableLevels.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">แผนกวิชา</label>
              <select value={reportDept} onChange={(e) => setReportDept(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 font-bold text-slate-900 outline-none">
                {availableDepts.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ห้อง</label>
              <select value={reportRoom} onChange={(e) => setReportRoom(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 font-bold text-slate-900 outline-none">
                {availableRooms.map(v => <option key={v} value={v}>ห้อง {v}</option>)}
              </select>
            </div>
            <button 
              onClick={exportRoomExcel}
              className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all font-heading uppercase text-xs tracking-widest"
            >
              <Download size={20} /> ดึงข้อมูลรายห้อง
            </button>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 font-heading uppercase tracking-tight">
                <BarChart3 className="text-blue-600" size={24} /> 
                ภาพรวมนักเรียน {reportLevel} / {reportDept} ห้อง {reportRoom}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-6">ลำดับ</th>
                    <th className="px-8 py-6">ชื่อ-นามสกุล</th>
                    <th className="px-8 py-6">พฤติกรรม</th>
                    <th className="px-8 py-6">ภาษาอังกฤษ</th>
                    <th className="px-8 py-6">การมาเข้าแถว</th>
                    <th className="px-8 py-6 text-right">การเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roomStudents.map((s, idx) => {
                    const metrics = getStudentMetrics(s.id);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-6 text-sm font-black text-slate-300 group-hover:text-slate-900">{idx + 1}</td>
                        <td className="px-8 py-6">
                          <p className="font-black text-slate-900">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.studentId}</p>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${s.behaviorScore < 70 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                             {s.behaviorScore} แต้ม
                           </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${metrics.englishScore < 5 ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {metrics.englishScore} / 10
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full w-24 overflow-hidden shadow-inner">
                              <div className={`h-full rounded-full transition-all duration-1000 ${metrics.rate < 80 ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${metrics.rate}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-slate-600">{metrics.rate}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <span className={`text-[10px] font-black uppercase ${metrics.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {metrics.remaining > 0 ? `ค้าง ${metrics.remaining.toLocaleString()} ฿` : 'ครบแล้ว'}
                           </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-right-4">
          {!isParent && (
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm h-[700px] flex flex-col">
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="ค้นหาชื่อ/รหัส..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none focus:border-blue-400 transition-all" />
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                  {students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.includes(searchTerm)).map(s => (
                    <button key={s.id} onClick={() => setSelectedStudentId(s.id)} className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${selectedStudentId === s.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                      <p className="font-black text-sm truncate">{s.name}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-widest mt-1.5 ${selectedStudentId === s.id ? 'text-slate-400' : 'text-slate-500'}`}>{s.studentId}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className={`${isParent ? 'lg:col-span-4' : 'lg:col-span-3'} space-y-8`}>
            {selectedStudent ? (
              <div className="space-y-8">
                <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-blue-600">
                    <User size={180} />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                    <div className="flex items-center gap-8">
                      <div className="w-28 h-28 bg-slate-900 rounded-[36px] flex items-center justify-center text-white shadow-2xl relative">
                        <User size={54} />
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                           <Star size={20} fill="currentColor" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 font-heading tracking-tight">{selectedStudent.name}</h2>
                        <div className="flex items-center gap-3">
                           <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-blue-100">{selectedStudent.studentId}</span>
                           <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">{selectedStudent.level} • แผนก{selectedStudent.department} • ห้อง {selectedStudent.room}</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={exportIndividualExcel}
                      className="flex items-center gap-3 px-10 py-5 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                    >
                      <FileSpreadsheet size={22} /> ออกรายงานฉบับสมบูรณ์
                    </button>
                  </div>

                  {/* Metrics Dashboard */}
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 mt-14">
                     <div className="bg-slate-50 p-6 rounded-[36px] border border-slate-100 text-center hover:bg-white hover:border-blue-400 transition-all group">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">คะแนนพฤติกรรม</p>
                        <p className={`text-4xl font-black font-heading ${selectedStudent.behaviorScore < 70 ? 'text-red-600' : 'text-slate-900'}`}>{selectedStudent.behaviorScore}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">{selectedStudent.behaviorScore >= 90 ? 'ยอดเยี่ยม' : selectedStudent.behaviorScore >= 70 ? 'ระดับปกติ' : 'ต้องปรับปรุง'}</p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-[36px] border border-slate-100 text-center hover:bg-white hover:border-blue-400 transition-all group">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">อัตรามาเรียน</p>
                        <p className="text-4xl font-black text-blue-600 font-heading">{getStudentMetrics(selectedStudent.id).rate}%</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">ประเมินจากกิจกรรมหน้าเสาธง</p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-[36px] border border-slate-100 text-center hover:bg-white hover:border-blue-400 transition-all group">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">เข้าแถว (วัน)</p>
                        <p className="text-4xl font-black text-slate-900 font-heading">{getStudentMetrics(selectedStudent.id).presents}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">จำนวนวันที่มาเช็คชื่อปกติ</p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-[36px] border border-slate-100 text-center hover:bg-white hover:border-blue-400 transition-all group">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">คะแนนโอวาท</p>
                        <p className="text-4xl font-black text-indigo-600 font-heading">{getStudentMetrics(selectedStudent.id).sermonScore}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">บันทึกสมุดโอวาท (เต็ม 25)</p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-[36px] border border-slate-100 text-center hover:bg-white hover:border-blue-400 transition-all group">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ภาษาอังกฤษ</p>
                        <p className="text-4xl font-black text-amber-500 font-heading">{getStudentMetrics(selectedStudent.id).englishScore}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">คะแนนเต็ม 10</p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-[36px] border border-slate-100 text-center hover:bg-white hover:border-blue-400 transition-all group">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ยอดค่าเทอมค้าง</p>
                        <p className={`text-4xl font-black font-heading ${getStudentMetrics(selectedStudent.id).remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                           {getStudentMetrics(selectedStudent.id).remaining.toLocaleString()}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">{getStudentMetrics(selectedStudent.id).remaining > 0 ? 'มียอดค้างชำระ' : 'ชำระครบถ้วนแล้ว'}</p>
                     </div>
                  </div>

                  {/* Attendance Breakdown */}
                  <div className="mt-8 bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                     <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Clock size={16} className="text-blue-500" /> รายละเอียดคะแนนเข้าแถวแยกรายบล็อก (เต็ม 5)
                     </h4>
                     <div className="grid grid-cols-5 gap-4">
                       {studyBlocks.map(block => (
                         <div key={block.id} className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">บล็อก {block.id}</p>
                           <p className={`text-xl font-black font-heading ${getStudentMetrics(selectedStudent.id).blockAttendance[block.id] < 4 ? 'text-amber-500' : 'text-blue-600'}`}>
                             {getStudentMetrics(selectedStudent.id).blockAttendance[block.id] || 0}
                           </p>
                         </div>
                       ))}
                     </div>
                  </div>

                  {/* Sermon Score Breakdown */}
                  <div className="mt-8 bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                     <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Star size={16} className="text-amber-500" /> รายละเอียดคะแนนโอวาทแยกรายบล็อก (บล็อกละ 5 คะแนน)
                     </h4>
                     <div className="grid grid-cols-5 gap-4">
                       {[1, 2, 3, 4, 5].map(block => (
                         <div key={block} className="bg-white p-4 rounded-2xl border border-slate-200 text-center">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">บล็อก {block}</p>
                           <p className="text-xl font-black text-slate-900 font-heading">{getStudentMetrics(selectedStudent.id).blockSermonScores[block] || 0}</p>
                         </div>
                       ))}
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Timeline section for Attendance */}
                  <div className="bg-white p-8 md:p-10 rounded-[48px] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-4 font-heading uppercase tracking-tight">
                      <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Clock size={24} /></div>
                      ประวัติการเข้าแถวล่าสุด
                    </h3>
                    <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-slate-100">
                      {attendance.filter(a => String(a.studentId) === String(selectedStudent.id) && a.type === 'MORNING').slice(-7).reverse().map((a, i) => (
                        <div key={a.id} className="relative pl-12 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                          <div className={`absolute left-0 top-1.5 w-10 h-10 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white ${a.status === 'PRESENT' ? 'bg-green-500' : a.status === 'LATE' ? 'bg-amber-500' : 'bg-red-500'}`}>
                             {a.status === 'PRESENT' ? <CheckCircle2 size={16} /> : a.status === 'LATE' ? <Clock size={16} /> : <X size={16} />}
                          </div>
                          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                             <div className="flex justify-between items-center mb-1">
                                <p className="font-black text-sm text-slate-900">{STATUS_LABELS[a.status].label}</p>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.date}</span>
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                <Clock size={12} /> บันทึกเมื่อ {a.timestamp.split(' ')[1]} น.
                                {a.remark && <span className="text-blue-600 ml-2">• หมายเหตุ: {a.remark}</span>}
                             </div>
                          </div>
                        </div>
                      ))}
                      {attendance.filter(a => String(a.studentId) === String(selectedStudent.id) && a.type === 'MORNING').length === 0 && (
                        <div className="py-16 text-center text-slate-300">
                           <Sun size={64} className="mx-auto mb-4 opacity-10" />
                           <p className="text-sm font-black uppercase tracking-widest">ยังไม่มีข้อมูลการเช็คชื่อเข้าแถว</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Behavior Records section */}
                  <div className="bg-white p-8 md:p-10 rounded-[48px] border border-slate-200 shadow-sm h-fit">
                    <h3 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-4 font-heading uppercase tracking-tight">
                      <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl"><Award size={24} /></div>
                      บันทึกความประพฤติ
                    </h3>
                    <div className="space-y-4">
                      {behavior.filter(b => String(b.studentId) === String(selectedStudent.id)).slice(-7).reverse().map((b, i) => (
                        <div key={b.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-lg transition-all animate-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                          <div className="flex items-center gap-5">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${b.type === 'ADD' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {b.type === 'ADD' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                             </div>
                             <div>
                               <p className="font-black text-sm text-slate-900 leading-tight mb-1">{b.reason}</p>
                               <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                 <span>{b.date}</span>
                                 <span className="text-slate-200">•</span>
                                 <span>ครู {b.recordedBy.split(' ')[1] || b.recordedBy}</span>
                               </div>
                             </div>
                          </div>
                          <div className={`text-2xl font-black font-heading ${b.type === 'ADD' ? 'text-green-600' : 'text-red-600'}`}>
                             {b.type === 'ADD' ? '+' : '-'}{b.score}
                          </div>
                        </div>
                      ))}
                      {behavior.filter(b => String(b.studentId) === String(selectedStudent.id)).length === 0 && (
                        <div className="py-20 text-center text-slate-300">
                           <Award size={64} className="mx-auto mb-4 opacity-10" />
                           <p className="text-sm font-black uppercase tracking-widest">ยังไม่มีบันทึกพฤติกรรมในเทอมนี้</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Summary Block for Parent */}
                <div className="bg-slate-900 p-10 md:p-14 rounded-[56px] shadow-2xl relative overflow-hidden text-white">
                   <div className="absolute top-0 right-0 p-14 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
                      <Wallet size={250} />
                   </div>
                   <div className="flex flex-col lg:flex-row gap-12 items-center relative z-10">
                      <div className="lg:w-1/2 space-y-6">
                         <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 rounded-2xl text-blue-400 text-[10px] font-black uppercase tracking-widest border border-white/5">
                            <Banknote size={14} /> รายละเอียดค่าธรรมเนียมการเรียน
                         </div>
                         <h3 className="text-4xl font-black font-heading tracking-tight leading-none">สรุปยอดเงินและ<br/>สถานะการชำระเงิน</h3>
                         <p className="text-slate-400 font-bold text-sm leading-relaxed">ข้อมูลการเงินของบุตรหลานจะถูกอัปเดตทุกครั้งที่มีการชำระเงิน หากมีข้อสงสัยกรุณาติดต่อแผนกการเงินของวิทยาลัย</p>
                      </div>
                      <div className="lg:w-1/2 w-full">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white/5 p-8 rounded-[40px] border border-white/10">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">ชำระแล้วทั้งหมด</p>
                               <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-black text-green-400 font-heading">{getStudentMetrics(selectedStudent.id).paid.toLocaleString()}</span>
                                  <span className="text-xs font-bold text-slate-500">฿</span>
                               </div>
                            </div>
                            <div className="bg-white/5 p-8 rounded-[40px] border border-white/10">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">มียอดค้างชำระ</p>
                               <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-black text-red-400 font-heading">{getStudentMetrics(selectedStudent.id).remaining.toLocaleString()}</span>
                                  <span className="text-xs font-bold text-slate-500">฿</span>
                               </div>
                            </div>
                            <div className="bg-white/10 p-8 rounded-[40px] border border-white/20 col-span-1 sm:col-span-2 flex items-center justify-between">
                               <div>
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">สถานะปัจจุบัน</p>
                                  <p className="text-xl font-black uppercase tracking-tight">{getStudentMetrics(selectedStudent.id).remaining === 0 ? 'ชำระครบถ้วน ✓' : 'มียอดค้างชำระ !'}</p>
                               </div>
                               <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                                  ตรวจสอบรายการ
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-[600px] bg-white rounded-[64px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center p-20 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8 animate-bounce">
                  <Search size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 font-heading uppercase tracking-widest">โปรดเลือกนักเรียนที่ต้องการดูข้อมูล</h3>
                <p className="text-slate-400 text-sm mt-3 font-bold opacity-70">เลือกรายชื่อทางด้านซ้ายเพื่อเปิดดูสรุปรายงานผลพฤติกรรมและการเรียน</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
