
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Activity, Star, Clock, BarChart3, ShieldAlert,
  CheckCircle2, Sun, ArrowLeft, LayoutDashboard, ChevronRight, 
  Wallet, Banknote, Info, MessageSquare, Copy, Check, X,
  Bell, Sparkles, ExternalLink, Megaphone, Building, AlertTriangle,
  GraduationCap, Calendar
} from 'lucide-react';
import { Student, AttendanceRecord, StudyBlock, TuitionConfig, PaymentRecord, NotificationRecord, NewsRecord } from '../types';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar
} from 'recharts';

interface DashboardProps {
  students: Student[];
  attendance: AttendanceRecord[];
  behavior: any[];
  news?: NewsRecord[];
  user: any;
  studyBlocks: StudyBlock[];
  tuitionConfigs?: TuitionConfig[];
  paymentRecords?: PaymentRecord[];
  notifications?: NotificationRecord[];
}

const StatCard = ({ title, value, sub, icon, color, textColor, extra }: any) => (
  <div className="bg-white p-5 md:p-7 rounded-[28px] border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-all group overflow-hidden h-full">
    <div className="flex items-start justify-between w-full mb-2">
      <div className="space-y-1.5 flex-1">
        <p className="text-slate-500 text-[9px] font-extrabold uppercase tracking-widest font-heading">{title}</p>
        <h3 className={`text-3xl md:text-4xl font-black ${textColor || 'text-slate-900'} font-heading`}>{value}</h3>
        <p className="text-[10px] text-slate-400 font-bold">{sub}</p>
      </div>
      <div className={`p-3 rounded-2xl ${color} text-white shadow-lg shrink-0`}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 20 }) : null}
      </div>
    </div>
    {extra && <div className="mt-4 pt-4 border-t border-slate-50">{extra}</div>}
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ 
  students = [], 
  attendance = [], 
  news = [],
  user, 
  studyBlocks = [],
  tuitionConfigs = [],
  paymentRecords = [],
  notifications = []
}) => {
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isParent = user?.role === 'PARENT';

  const bankInfo = useMemo(() => {
    const saved = localStorage.getItem('cms_bank_info');
    return saved ? JSON.parse(saved) : {
      bankName: 'ธนาคารกรุงไทย (Krungthai)',
      accountNo: '012-3-45678-9',
      accountName: 'วิทยาลัยเทคโนโลยีอาชีวศึกษา'
    };
  }, []);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bankInfo.accountNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    (attendance || []).forEach(record => {
      const sId = String(record.studentId);
      if (!map.has(sId)) map.set(sId, []);
      map.get(sId)?.push(record);
    });
    return map;
  }, [attendance]);

  const activeBlock = useMemo(() => {
    const activeBlocks = (studyBlocks || []).filter(b => b.isActive);
    if (activeBlocks.length === 0) return studyBlocks?.[0] || null;
    if (activeBlocks.length === 1) return activeBlocks[0];
    
    // Multiple active blocks: find the one that matches today's date
    const today = new Date().toISOString().split('T')[0];
    const matchingToday = activeBlocks.find(b => today >= b.startDate && today <= b.endDate);
    
    return matchingToday || activeBlocks[0];
  }, [studyBlocks]);

  const upcomingExam = useMemo(() => {
    if (!activeBlock) return null;
    const examDateStr = activeBlock.examDate || activeBlock.endDate;
    const examTimeStr = activeBlock.examTime || "08:30";
    
    const examDateTime = new Date(`${examDateStr}T${examTimeStr}:00`);
    const diffMs = examDateTime.getTime() - currentTime.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMs > 0 && diffMs <= 7 * 24 * 60 * 60 * 1000) {
      const isLess24Hours = diffMs < 24 * 60 * 60 * 1000;
      
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      return { 
        days: diffDays + 1,
        isLess24Hours,
        countdown: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        date: examDateStr, 
        time: examTimeStr,
        blockName: activeBlock.name 
      };
    }
    return null;
  }, [activeBlock, currentTime]);

  const getStudentStats = (studentObj: Student) => {
    const sIdStr = String(studentObj.id);
    const records = attendanceMap.get(sIdStr) || [];
    const morningRecords = records.filter(r => r.type === 'MORNING');
    
    let blockPresentDays = 0;
    if (activeBlock) {
      blockPresentDays = morningRecords.filter(r => 
        r.status === 'PRESENT' && r.date >= activeBlock.startDate && r.date <= activeBlock.endDate
      ).length;
    }
    const blockScore = Number(((blockPresentDays * 5) / 18).toFixed(2));
    const presentCount = morningRecords.filter(r => r.status === 'PRESENT').length;
    const attRate = morningRecords.length > 0 ? Math.round((presentCount / morningRecords.length) * 100) : 0;

    const config = (tuitionConfigs || []).find(c => c.level === studentObj.level && c.department === studentObj.department);
    const paid = (paymentRecords || []).filter(p => String(p.studentId) === sIdStr).reduce((sum, p) => sum + p.amount, 0);
    const remaining = config ? Math.max(0, config.amount - paid) : 0;

    return { blockScore, attRate, remaining, totalExpected: config?.amount || 0, paid };
  };

  const filteredStudents = useMemo(() => {
    return (students || []).filter(s => 
      (filterLevel === 'ALL' || s.level === filterLevel) &&
      (filterDept === 'ALL' || s.department === filterDept)
    );
  }, [students, filterLevel, filterDept]);

  const targetId = isParent ? user?.studentId : viewingStudentId;
  
  const currentViewStudent = useMemo(() => {
    if (!targetId) return null;
    const idStr = String(targetId);
    return (students || []).find(s => String(s.id) === idStr || String(s.studentId) === idStr);
  }, [students, targetId]);

  const relevantNews = useMemo(() => {
    if (!currentViewStudent) return news.slice(0, 3);
    
    return news.filter(n => {
      if (n.targetType === 'ALL') return true;
      if (n.targetType === 'DEPT' && n.targetDept === currentViewStudent.department) return true;
      if (n.targetType === 'ROOM') {
        const matchDept = !n.targetMajor || n.targetMajor === currentViewStudent.department;
        const matchLevel = !n.targetLevel || n.targetLevel === currentViewStudent.level;
        const matchRoom = !n.targetRoom || n.targetRoom === currentViewStudent.room;
        return matchDept && matchLevel && matchRoom;
      }
      if (n.targetType === 'INDIVIDUAL' && n.targetStudentIds?.includes(currentViewStudent.studentId)) return true;
      return false;
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 3);
  }, [news, currentViewStudent]);

  const handleShowStudentDetails = (id: string) => {
    setViewingStudentId(String(id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const behaviorWatchlist = useMemo(() => 
    filteredStudents.filter(s => s.behaviorScore < 70).sort((a,b) => a.behaviorScore - b.behaviorScore).slice(0, 6)
  , [filteredStudents]);

  const attendanceWatchlist = useMemo(() => 
    filteredStudents
      .map(s => ({ ...s, morningScore: getStudentStats(s).blockScore }))
      .filter(s => s.morningScore < 3.0)
      .sort((a,b) => a.morningScore - b.morningScore)
      .slice(0, 6)
  , [filteredStudents, attendanceMap, activeBlock]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const presentCount = (attendance || []).filter(a => 
        a.date === date && a.status === 'PRESENT' && a.type === 'MORNING'
      ).length;
      return {
        name: new Date(date).toLocaleDateString('th-TH', { weekday: 'short' }),
        value: presentCount
      };
    });
  }, [attendance]);

  if (targetId && currentViewStudent) {
    const stats = getStudentStats(currentViewStudent);
    const studentNotifications = (notifications || []).filter(n => String(n.studentId) === String(currentViewStudent.id)).slice(0, 5);

    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isParent && (
              <button 
                onClick={() => setViewingStudentId(null)} 
                className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
            <div>
              <h2 className="text-xl md:text-3xl font-black text-slate-900 font-heading uppercase tracking-tight">
                {isParent ? 'ข้อมูลบุตรหลาน' : 'สรุปข้อมูลรายบุคคล'}
              </h2>
              <p className="text-[10px] font-bold text-[#00AEEF] uppercase tracking-widest mt-1">
                {currentViewStudent.name} ({currentViewStudent.studentId})
              </p>
            </div>
          </div>
        </div>

        {upcomingExam && (
          <div className={`bg-gradient-to-r ${upcomingExam.isLess24Hours ? 'from-red-600 to-rose-700 animate-pulse' : 'from-amber-500 to-orange-600'} p-6 md:p-8 rounded-[40px] text-white shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden`}>
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-10 -translate-y-10">
               <GraduationCap size={160} />
             </div>
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center">
                     <Clock size={32} className="text-white" />
                   </div>
                   <div>
                     <h4 className="text-2xl font-black font-heading tracking-tight leading-none mb-1">
                       {upcomingExam.isLess24Hours ? 'เตรียมตัวสอบ!' : 'ประกาศกำหนดการสอบ!'}
                     </h4>
                     <p className="text-xs font-bold text-white/80 uppercase tracking-widest">
                       {upcomingExam.blockName} • สอบวันที่ {new Date(upcomingExam.date).toLocaleDateString('th-TH', { dateStyle: 'long' })} ({upcomingExam.time} น.)
                     </p>
                   </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/20 text-center min-w-[200px]">
                   <p className="text-[9px] font-black uppercase tracking-widest mb-1">
                     {upcomingExam.isLess24Hours ? 'นับถอยหลังเริ่มสอบ' : 'เหลือเวลาเตรียมตัวอีก'}
                   </p>
                   <p className={`text-3xl font-black font-heading ${upcomingExam.isLess24Hours ? 'text-yellow-300' : 'text-white'}`}>
                     {upcomingExam.isLess24Hours ? upcomingExam.countdown : `${upcomingExam.days} วัน`}
                   </p>
                </div>
             </div>
          </div>
        )}
        
        {/* Rest of the student detail view remains the same */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-6 font-heading">
              <Megaphone className="text-blue-600" size={18} /> ข่าวสารประชาสัมพันธ์สำหรับคุณ
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {relevantNews.map(n => (
                 <div key={n.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col gap-3 group hover:border-blue-300 transition-all">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        n.type === 'URGENT' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {n.type === 'URGENT' ? 'ด่วน' : 'ข่าวสาร'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{n.date}</span>
                    </div>
                    <h5 className="font-black text-slate-900 text-sm font-heading line-clamp-1">{n.title}</h5>
                    <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed">{n.content}</p>
                 </div>
               ))}
               {relevantNews.length === 0 && (
                 <div className="col-span-full py-10 text-center text-slate-300">ไม่มีประกาศใหม่</div>
               )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-6 font-heading">
              <Bell className="text-amber-500" size={18} /> การแจ้งเตือนล่าสุด
            </h4>
            <div className="space-y-4 flex-1">
               {studentNotifications.length > 0 ? studentNotifications.map((notif) => (
                 <div key={notif.id} className={`p-4 rounded-2xl border-l-4 flex gap-4 transition-all hover:bg-slate-50 ${
                   notif.type === 'ABSENT' ? 'bg-red-50 border-red-500' : 
                   notif.type === 'LATE' ? 'bg-amber-50 border-amber-500' : 'bg-blue-50 border-blue-500'
                 }`}>
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                     notif.type === 'ABSENT' ? 'bg-red-100 text-red-600' : 
                     notif.type === 'LATE' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                   }`}>
                     {notif.type === 'ABSENT' ? <X size={18} /> : notif.type === 'LATE' ? <Clock size={18} /> : <Info size={18} />}
                   </div>
                   <div className="min-w-0">
                     <p className="text-xs font-black text-slate-900 leading-tight">{notif.title}</p>
                     <p className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-1">{notif.message}</p>
                     <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{notif.date}</p>
                   </div>
                 </div>
               )) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                   <CheckCircle2 size={32} className="mb-2 opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-widest">ยังไม่มีรายการแจ้งเตือน</p>
                 </div>
               )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="เปอร์เซ็นต์เข้าแถว" 
            value={`${stats.attRate}%`} 
            icon={<CheckCircle2 />} 
            color="bg-[#00AEEF]" 
            textColor="text-[#00AEEF]" 
            sub="จากทุกวันที่มีการเช็คชื่อ" 
          />
          <StatCard 
            title="คะแนนพฤติกรรม" 
            value={currentViewStudent.behaviorScore} 
            icon={<Activity />} 
            color="bg-indigo-600" 
            textColor="text-indigo-600" 
            sub="คะแนนคงเหลือปัจจุบัน" 
          />
          <div className="bg-red-600 p-6 md:p-8 rounded-[32px] shadow-xl text-white flex flex-col justify-between hover:bg-red-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-red-100 text-[9px] font-extrabold uppercase tracking-widest font-heading mb-1">ยอดค้างชำระค่าธรรมเนียม</p>
                <h3 className="text-4xl md:text-5xl font-black font-heading leading-none">
                  {stats.remaining.toLocaleString()} <span className="text-xl">฿</span>
                </h3>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl text-white">
                <Wallet size={24} />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                <div className="text-center flex-1 border-r border-white/20">
                  <p className="text-[9px] font-black text-red-100 uppercase mb-0.5">ชำระแล้ว</p>
                  <p className="text-sm font-black">{stats.paid.toLocaleString()} ฿</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[9px] font-black text-red-100 uppercase mb-0.5">ยอดทั้งหมด</p>
                  <p className="text-sm font-black text-white/70">{stats.totalExpected.toLocaleString()} ฿</p>
                </div>
              </div>
              {stats.remaining > 0 && (
                <button 
                  onClick={() => setShowBankDetails(!showBankDetails)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg active:scale-95 font-heading"
                >
                  <Banknote size={16} /> {showBankDetails ? 'ซ่อนข้อมูลธนาคาร' : 'ชำระเงินตอนนี้'}
                </button>
              )}
            </div>
          </div>
        </div>

        {showBankDetails && stats.remaining > 0 && (
          <div className="bg-white p-8 md:p-12 rounded-[40px] border-4 border-red-500 shadow-2xl animate-in slide-in-from-top-6 duration-500 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 text-red-600 pointer-events-none">
               <Banknote size={180} />
             </div>
             <div className="flex flex-col lg:flex-row gap-12 items-center relative z-10">
                <div className="lg:w-1/2 space-y-8 w-full">
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-slate-900 flex items-center gap-3 font-heading uppercase tracking-tight">
                      <Banknote className="text-green-600" size={32} /> บัญชีสำหรับการโอนเงิน
                    </h4>
                    <p className="text-xs text-slate-500 font-bold">กรุณาตรวจสอบยอดเงินและโอนเข้าบัญชีสถาบันโดยตรง</p>
                  </div>
                  <div className="space-y-5 bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                    <div className="flex items-center justify-between py-2 border-b border-slate-200">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ธนาคาร</span>
                      <span className="text-sm font-black text-slate-900">{bankInfo.bankName}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เลขที่บัญชี</span>
                      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-red-500 shadow-sm">
                        <span className="text-3xl font-black text-red-600 tracking-tighter">{bankInfo.accountNo}</span>
                        <button 
                          onClick={handleCopyAccount}
                          className={`p-3 rounded-xl flex items-center gap-2 transition-all active:scale-90 ${copied ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white'}`}
                        >
                          {copied ? <Check size={18} /> : <Copy size={18} />}
                          <span className="text-[10px] font-black uppercase">{copied ? 'สำเร็จ' : 'คัดลอก'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อบัญชี</span>
                      <span className="text-sm font-black text-slate-900">{bankInfo.accountName}</span>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2 p-8 bg-red-50 rounded-[40px] border-2 border-red-100 flex flex-col gap-6 w-full">
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-white rounded-2xl text-red-600 shadow-sm shrink-0"><Info size={24} /></div>
                    <div>
                      <p className="text-base font-black text-slate-900 font-heading">ขั้นตอนการชำระเงิน</p>
                      <ul className="text-[11px] text-slate-700 font-bold mt-3 space-y-2 list-decimal list-inside leading-relaxed">
                        <li>โอนเงินเข้าเลขที่บัญชีที่ปรากฏให้ครบตามยอดค้างชำระ</li>
                        <li>บันทึกภาพหลักฐานการโอนเงิน (Slip) ทันที</li>
                        <li>ส่งหลักฐานให้เจ้าหน้าที่ผ่านช่องทาง LINE ของวิทยาลัย</li>
                        <li>รอเจ้าหน้าที่ตรวจสอบและอัปเดตยอดภายใน 1-2 วันทำการ</li>
                      </ul>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowBankDetails(false)} 
                    className="w-full py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-2 font-heading"
                  >
                    <X size={14} /> ปิดหน้าต่างข้อมูลธนาคาร
                  </button>
                </div>
             </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900 pointer-events-none">
              <Users size={100} />
           </div>
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3 relative z-10 font-heading">
             <span className="w-1 h-5 bg-[#00AEEF] rounded-full"></span> รายละเอียดนักเรียน
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ระดับชั้น</p>
                <p className="text-base font-black text-slate-900">{currentViewStudent.level}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">แผนกวิชา</p>
                <p className="text-base font-black text-slate-900">{currentViewStudent.department}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ห้องเรียน</p>
                <p className="text-base font-black text-slate-900">ห้อง {currentViewStudent.room}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">รหัสประจำตัว</p>
                <p className="text-base font-black text-slate-900">{currentViewStudent.studentId}</p>
              </div>
           </div>
        </div>
        
        {!isParent && (
          <button 
            onClick={() => setViewingStudentId(null)}
            className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 font-heading"
          >
            <LayoutDashboard size={18} /> กลับสู่หน้าหลัก
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight font-heading leading-none">แผงควบคุมหลัก</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional Overview</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] font-black uppercase outline-none font-heading">
            <option value="ALL">ทุกระดับชั้น</option>
            {Array.from(new Set(students.map(s => s.level))).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] font-black uppercase outline-none font-heading">
            <option value="ALL">ทุกแผนกวิชา</option>
            {Array.from(new Set(students.map(s => s.department))).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {upcomingExam && (
        <div className={`bg-gradient-to-r ${upcomingExam.isLess24Hours ? 'from-red-600 to-rose-700 animate-pulse' : 'from-amber-500 to-orange-600'} p-6 md:p-8 rounded-[40px] text-white shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-10 -translate-y-10">
              <GraduationCap size={160} />
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center">
                    <Clock size={32} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black font-heading tracking-tight leading-none mb-1">
                      {upcomingExam.isLess24Hours ? 'เตรียมตัวสอบ!' : 'ใกล้ถึงวันสอบแล้ว!'}
                    </h4>
                    <p className="text-xs font-bold text-white/80 uppercase tracking-widest">
                      {upcomingExam.blockName} • สอบวันที่ {new Date(upcomingExam.date).toLocaleDateString('th-TH', { dateStyle: 'long' })} ({upcomingExam.time} น.)
                    </p>
                  </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/20 text-center min-w-[200px]">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1">
                    {upcomingExam.isLess24Hours ? 'นับถอยหลังเริ่มสอบ' : 'เหลือเวลาเตรียมตัวอีก'}
                  </p>
                  <p className={`text-3xl font-black font-heading ${upcomingExam.isLess24Hours ? 'text-yellow-300' : 'text-white'}`}>
                    {upcomingExam.isLess24Hours ? upcomingExam.countdown : `${upcomingExam.days} วัน`}
                  </p>
              </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="จำนวนนักเรียน" value={filteredStudents.length} sub="ในตัวกรองปัจจุบัน" icon={<Users />} color="bg-slate-900" />
        <StatCard title="เฝ้าระวังพฤติกรรม" value={behaviorWatchlist.length} sub="คะแนนต่ำกว่า 70" icon={<ShieldAlert />} color="bg-red-600" textColor="text-red-600" />
        <StatCard title="เฝ้าระวังเข้าแถว" value={attendanceWatchlist.length} sub="คะแนนต่ำกว่า 3.0" icon={<Sun />} color="bg-[#00AEEF]" textColor="text-[#00AEEF]" />
        <StatCard title="มาสายวันนี้" value={(attendance || []).filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'LATE' && a.type === 'MORNING').length} sub="เข้าแถวหลัง 07:50 น." icon={<Clock />} color="bg-amber-500" textColor="text-amber-600" />
      </div>

      {!isParent && news.length > 0 && (
         <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 font-heading mb-6 flex items-center justify-between">
              <span className="flex items-center gap-3"><Megaphone className="text-blue-600" size={20} /> ประกาศล่าสุด</span>
              <ChevronRight className="text-slate-300" />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {news.slice(0, 3).map(n => (
                 <div key={n.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col gap-3 group hover:border-blue-400 transition-all">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        n.type === 'URGENT' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {n.type === 'URGENT' ? 'ด่วน' : 'ข่าวสาร'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{n.date}</span>
                    </div>
                    <h5 className="font-black text-slate-900 text-sm font-heading line-clamp-1">{n.title}</h5>
                    <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed">{n.content}</p>
                 </div>
               ))}
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-2 bg-white p-5 md:p-8 rounded-[40px] border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-black text-slate-900 font-heading mb-8 flex items-center gap-2">
             <BarChart3 className="text-[#00AEEF]" size={20} /> สถิติมาเข้าแถว (7 วันล่าสุด)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#00AEEF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center justify-between border-b pb-4 border-slate-50 font-heading">
              <span className="flex items-center gap-2"><ShieldAlert size={18} className="text-red-600" /> เฝ้าระวังพฤติกรรม</span>
            </h4>
            <div className="space-y-3">
              {behaviorWatchlist.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100/50 group hover:border-red-300 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 font-black text-xs border border-red-100 shrink-0 shadow-sm font-heading group-hover:bg-red-600 group-hover:text-white transition-colors">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[13px] text-slate-900 truncate leading-none font-heading">{s.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">คะแนน: {s.behaviorScore}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleShowStudentDetails(String(s.id))}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-xl border-2 border-red-100 shadow-sm hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 group/btn"
                  >
                    <span className="text-[10px] font-black uppercase">ดูข้อมูล</span>
                    <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              ))}
              {behaviorWatchlist.length === 0 && <p className="text-center py-6 text-[10px] text-slate-300 font-black uppercase tracking-widest">ไม่มีรายการ</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center justify-between border-b pb-4 border-slate-50 font-heading">
              <span className="flex items-center gap-2"><Sun size={18} className="text-[#00AEEF]" /> เฝ้าระวังเข้าแถว</span>
            </h4>
            <div className="space-y-3">
              {attendanceWatchlist.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-sky-50/50 rounded-2xl border border-sky-100/50 group hover:border-sky-300 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#00AEEF] font-black text-xs border border-sky-100 shrink-0 shadow-sm font-heading group-hover:bg-[#00AEEF] group-hover:text-white transition-colors">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[13px] text-slate-900 truncate leading-none font-heading">{s.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">คะแนน: {s.morningScore}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleShowStudentDetails(String(s.id))}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-[#00AEEF] rounded-xl border-2 border-sky-100 shadow-sm hover:bg-[#00AEEF] hover:text-white hover:border-[#00AEEF] transition-all active:scale-95 group/btn"
                  >
                    <span className="text-[10px] font-black uppercase">ดูข้อมูล</span>
                    <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              ))}
              {attendanceWatchlist.length === 0 && <p className="text-center py-6 text-[10px] text-slate-300 font-black uppercase tracking-widest">ไม่มีรายการ</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
