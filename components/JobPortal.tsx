
import React, { useState, useMemo, useEffect } from 'react';
import { JobAnnouncement, User, Student } from '../types';
import { 
  Briefcase, Plus, Search, Building2, MapPin, 
  Banknote, Phone, Calendar, Trash2, X, Send, 
  Loader2, Sparkles, Filter, CheckCircle2, GraduationCap, ArrowRight, Share2, Info,
  UserCircle, FileText, Mail, ChevronRight, Inbox
} from 'lucide-react';

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  studentId: string;
  studentName: string;
  studentLevel: string;
  studentDept: string;
  message: string;
  timestamp: string;
  status: 'PENDING' | 'VIEWED';
}

interface JobPortalProps {
  currentUser: User;
  students?: Student[];
}

const JobPortal: React.FC<JobPortalProps> = ({ currentUser, students = [] }) => {
  const [jobs, setJobs] = useState<JobAnnouncement[]>([
    {
      id: 'J1',
      type: 'INTERNSHIP',
      title: 'นักศึกษาฝึกงาน แผนก IT Support',
      companyName: 'บริษัท เทคโนโลยีล้ำสมัย จำกัด',
      description: 'ดูแลระบบ Network และซ่อมบำรุงคอมพิวเตอร์เบื้องต้นภายในสำนักงาน ร่วมโปรเจกต์พัฒนาระบบคลาวด์ของบริษัท และเรียนรู้การทำงานร่วมกับทีมวิศวกรซอฟต์แวร์มืออาชีพ',
      location: 'อ.เมือง จ.สุราษฎร์ธานี',
      salary: '300 - 500 บาท/วัน',
      contact: '081-234-5678 (คุณสมศักดิ์)',
      date: '20/05/2567',
      timestamp: new Date().toISOString(),
      postedBy: 'SYSTEM',
      tags: ['IT', 'Network', 'Hardware']
    }
  ]);

  const [applications, setApplications] = useState<Application[]>([]);
  const [activeView, setActiveView] = useState<'EXPLORE' | 'APPLICATIONS'>(
    currentUser.role === 'COMPANY' ? 'APPLICATIONS' : 'EXPLORE'
  );

  const [showPostModal, setShowPostModal] = useState(false);
  const [viewingJob, setViewingJob] = useState<JobAnnouncement | null>(null);
  const [applyingJob, setApplyingJob] = useState<JobAnnouncement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'JOB' | 'INTERNSHIP'>('ALL');
  const [isPosting, setIsPosting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Load applications from localStorage on mount
  useEffect(() => {
    const savedApps = localStorage.getItem('cms_job_apps');
    if (savedApps) setApplications(JSON.parse(savedApps));
  }, []);

  const [formData, setFormData] = useState<Partial<JobAnnouncement>>({
    type: 'JOB',
    title: '',
    description: '',
    location: '',
    salary: '',
    contact: '',
    tags: []
  });

  const [applyData, setApplyData] = useState({
    studentId: currentUser.studentId || '',
    message: ''
  });

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => 
      (filterType === 'ALL' || j.type === filterType) &&
      (j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
       j.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [jobs, searchTerm, filterType]);

  const relevantApplications = useMemo(() => {
    if (currentUser.role === 'ADMIN') return applications;
    if (currentUser.role === 'COMPANY') {
      const myJobIds = jobs.filter(j => j.companyName === (currentUser.companyName || currentUser.name)).map(j => j.id);
      return applications.filter(a => myJobIds.includes(a.jobId));
    }
    return [];
  }, [applications, currentUser, jobs]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newJob: JobAnnouncement = {
      id: `JOB_${Date.now()}`,
      type: formData.type as any,
      title: formData.title!,
      companyName: currentUser.role === 'COMPANY' ? (currentUser.companyName || currentUser.name) : 'สถานประกอบการภายนอก',
      description: formData.description!,
      location: formData.location!,
      salary: formData.salary,
      contact: formData.contact!,
      date: new Date().toLocaleDateString('th-TH'),
      timestamp: new Date().toISOString(),
      postedBy: currentUser.name,
      tags: []
    };

    setJobs(prev => [newJob, ...prev]);
    setIsPosting(false);
    setShowPostModal(false);
    setFormData({ type: 'JOB', title: '', description: '', location: '', salary: '', contact: '' });
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;
    
    setIsApplying(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const student = students.find(s => s.studentId === applyData.studentId || s.id === applyData.studentId);
    
    const newApp: Application = {
      id: `APP_${Date.now()}`,
      jobId: applyingJob.id,
      jobTitle: applyingJob.title,
      studentId: student?.studentId || applyData.studentId,
      studentName: student?.name || 'นักศึกษาไม่ระบุชื่อ',
      studentLevel: student?.level || '-',
      studentDept: student?.department || '-',
      message: applyData.message,
      timestamp: new Date().toLocaleString('th-TH'),
      status: 'PENDING'
    };

    const updatedApps = [newApp, ...applications];
    setApplications(updatedApps);
    localStorage.setItem('cms_job_apps', JSON.stringify(updatedApps));

    setIsApplying(false);
    setApplyingJob(null);
    setApplyData({ studentId: currentUser.studentId || '', message: '' });
    alert('ส่งใบสมัครเบื้องต้นเรียบร้อยแล้ว');
  };

  const deleteJob = (id: string) => {
    if (confirm('ยืนยันการลบประกาศนี้?')) {
      setJobs(prev => prev.filter(j => j.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-600 text-white rounded-[24px] shadow-xl shadow-indigo-100">
            <Briefcase size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 font-heading uppercase tracking-tight">Jobs & Internship</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">ศูนย์กลางการเชื่อมโยงสถานประกอบการและนักศึกษา</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {(currentUser.role === 'ADMIN' || currentUser.role === 'COMPANY' || currentUser.role === 'ACADEMIC') && (
            <>
              <button 
                onClick={() => setActiveView(activeView === 'EXPLORE' ? 'APPLICATIONS' : 'EXPLORE')}
                className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${
                  activeView === 'APPLICATIONS' 
                  ? 'bg-amber-500 border-amber-500 text-white shadow-lg' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Inbox size={18} />
                {activeView === 'APPLICATIONS' ? 'ดูประกาศทั้งหมด' : `รายการสมัคร (${relevantApplications.length})`}
              </button>
              <button 
                onClick={() => setShowPostModal(true)}
                className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all active:scale-95 font-heading text-[11px] uppercase tracking-widest"
              >
                <Plus size={18} /> ลงประกาศงาน
              </button>
            </>
          )}
        </div>
      </div>

      {activeView === 'EXPLORE' ? (
        <>
          <div className="bg-white p-5 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาตำแหน่งงาน หรือ ชื่อบริษัท..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-slate-900 outline-none transition-all shadow-inner"
              />
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
              <button onClick={() => setFilterType('ALL')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${filterType === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>ทั้งหมด</button>
              <button onClick={() => setFilterType('JOB')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${filterType === 'JOB' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>รับสมัครงาน</button>
              <button onClick={() => setFilterType('INTERNSHIP')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${filterType === 'INTERNSHIP' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>รับฝึกงาน</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all group flex flex-col justify-between relative overflow-hidden">
                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest text-white ${job.type === 'JOB' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                  {job.type === 'JOB' ? 'รับสมัครงาน' : 'รับฝึกงาน'}
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Building2 size={16} />
                      <span className="text-[11px] font-black uppercase tracking-tight truncate">{job.companyName}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 font-heading leading-tight group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                  </div>

                  <p className="text-slate-500 text-sm font-medium line-clamp-3 leading-relaxed">{job.description}</p>

                  <div className="space-y-3 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-3 text-slate-400 font-bold text-xs">
                      <MapPin size={14} className="shrink-0" /> <span className="truncate">{job.location}</span>
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-3 text-emerald-600 font-bold text-xs">
                        <Banknote size={14} className="shrink-0" /> <span>{job.salary}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 text-[10px] font-black uppercase tracking-widest">
                    <Calendar size={12} /> {job.date}
                  </div>
                  <div className="flex gap-2">
                    {(currentUser.role === 'ADMIN' || (currentUser.role === 'COMPANY' && job.postedBy === currentUser.name)) && (
                       <button onClick={() => deleteJob(job.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                    )}
                    <button 
                      onClick={() => setViewingJob(job)}
                      className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      รายละเอียด
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredJobs.length === 0 && (
              <div className="col-span-full py-32 text-center bg-white rounded-[48px] border-4 border-dashed border-slate-100 flex flex-col items-center">
                <Briefcase size={64} className="opacity-10 mb-6" />
                <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-sm">ไม่พบประกาศที่ตรงตามการค้นหา</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
           <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-900 font-heading uppercase flex items-center gap-3">
                   <Inbox className="text-amber-500" /> รายการใบสมัครเบื้องต้น
                 </h3>
                 <span className="bg-white px-4 py-1.5 rounded-full border text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   {relevantApplications.length} รายการที่พบ
                 </span>
              </div>
              <div className="divide-y divide-slate-100">
                 {relevantApplications.map(app => (
                   <div key={app.id} className="p-8 hover:bg-slate-50 transition-all group">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                         <div className="flex gap-6 items-start">
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                               <UserCircle size={32} />
                            </div>
                            <div className="space-y-1">
                               <h4 className="text-lg font-black text-slate-900 font-heading leading-none">{app.studentName}</h4>
                               <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">ID: {app.studentId} • {app.studentLevel} / {app.studentDept}</p>
                               <div className="flex items-center gap-3 mt-4 text-[11px] font-bold text-slate-400">
                                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-900">{app.jobTitle}</span>
                                  <span className="flex items-center gap-1.5"><Calendar size={12} /> {app.timestamp}</span>
                               </div>
                            </div>
                         </div>
                         <div className="lg:w-1/3 p-4 bg-white border border-slate-100 rounded-2xl italic text-xs text-slate-500 line-clamp-2">
                           "{app.message || 'ไม่มีข้อความแนะนำตัว'}"
                         </div>
                         <div className="flex gap-2 shrink-0">
                            <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2">
                              <FileText size={14} /> ดูโปรไฟล์เต็ม
                            </button>
                         </div>
                      </div>
                   </div>
                 ))}
                 {relevantApplications.length === 0 && (
                   <div className="py-24 text-center">
                      <Inbox size={64} className="mx-auto text-slate-100 mb-6" />
                      <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-sm">ยังไม่มีนักเรียนสมัครเข้ามาในขณะนี้</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Modal: Apply for Job */}
      {applyingJob && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in zoom-in-95 duration-300">
           <div className="bg-white w-full max-w-xl rounded-[48px] p-10 md:p-14 shadow-2xl relative">
              <button onClick={() => setApplyingJob(null)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 transition-colors"><X size={28} /></button>
              <div className="mb-10 text-center">
                 <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                    <Send size={32} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 font-heading uppercase tracking-tight">สมัครงานเบื้องต้น</h3>
                 <p className="text-sm font-bold text-slate-400 mt-1">{applyingJob.title} - {applyingJob.companyName}</p>
              </div>
              <form onSubmit={handleApply} className="space-y-6">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ยืนยันรหัสนักเรียน</label>
                   <input 
                    type="text" 
                    required 
                    value={applyData.studentId}
                    onChange={(e) => setApplyData({...applyData, studentId: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-6 py-4 font-black outline-none" 
                    placeholder="ระบุรหัส 6 หลักของคุณ"
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ข้อความแนะนำตัวสั้นๆ</label>
                   <textarea 
                    rows={4} 
                    required 
                    value={applyData.message}
                    onChange={(e) => setApplyData({...applyData, message: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-6 py-4 font-medium outline-none resize-none" 
                    placeholder="บอกเหตุผลที่คุณสนใจตำแหน่งนี้..."
                   />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setApplyingJob(null)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-black uppercase text-xs tracking-widest">ยกเลิก</button>
                    <button 
                      type="submit" 
                      disabled={isApplying}
                      className="flex-1 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                    >
                      {isApplying ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                      ส่งใบสมัคร
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Modal: Job Details */}
      {viewingJob && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[48px] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
              <button onClick={() => setViewingJob(null)} className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all z-20">
                <X size={24} />
              </button>
              
              <div className={`h-3 ${viewingJob.type === 'JOB' ? 'bg-blue-600' : 'bg-emerald-600'}`} />
              
              <div className="p-10 md:p-14 space-y-10 max-h-[85vh] overflow-y-auto scrollbar-hide">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <Building2 size={24} />
                    <h4 className="text-sm font-black uppercase tracking-[0.2em]">{viewingJob.companyName}</h4>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black text-slate-900 font-heading leading-tight">{viewingJob.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${viewingJob.type === 'JOB' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                      {viewingJob.type === 'JOB' ? 'งานประจำ' : 'ฝึกงาน'}
                    </span>
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                      โพสต์เมื่อ {viewingJob.date}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                   <h5 className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-widest font-heading">
                     <Info size={16} className="text-indigo-500" /> รายละเอียดและสวัสดิการ
                   </h5>
                   <p className="text-slate-600 text-lg leading-relaxed font-medium bg-slate-50 p-8 rounded-[32px] border border-slate-100 italic">
                     "{viewingJob.description}"
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-10">
                   <div className="space-y-4">
                      <div className="flex items-start gap-4">
                         <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><MapPin size={20} /></div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">สถานที่ปฏิบัติงาน</p>
                            <p className="font-bold text-slate-900">{viewingJob.location}</p>
                         </div>
                      </div>
                      {viewingJob.salary && (
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Banknote size={20} /></div>
                          <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ค่าตอบแทน/เงินเดือน</p>
                              <p className="font-black text-emerald-600">{viewingJob.salary}</p>
                          </div>
                        </div>
                      )}
                   </div>
                   <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl">
                      {currentUser.role === 'PARENT' ? (
                        <>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">สนใจสมัครให้บุตรหลาน?</p>
                          <button 
                            onClick={() => { setViewingJob(null); setApplyingJob(viewingJob); }}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-xl"
                          >
                            <Send size={16} /> สมัครงานทันที
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">ช่องทางการติดต่อสมัคร</p>
                          <div className="flex items-center gap-4 text-xl font-black font-heading mb-4">
                            <Phone size={24} className="text-white" />
                            {viewingJob.contact}
                          </div>
                          <button className="w-full py-4 bg-indigo-600/30 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-white/10">
                            <Share2 size={16} /> แชร์ประกาศนี้
                          </button>
                        </>
                      )}
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {showPostModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[48px] p-8 md:p-14 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowPostModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 transition-colors"><X size={28} /></button>
            
            <h3 className="text-2xl font-black text-slate-900 mb-10 font-heading flex items-center gap-4 uppercase tracking-tight">
              <Sparkles className="text-indigo-600" /> ลงประกาศงาน/ฝึกงาน
            </h3>

            <form onSubmit={handlePost} className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-heading">ประเภทประกาศ</label>
                <div className="grid grid-cols-2 gap-4">
                   <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'JOB'})}
                      className={`flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${
                        formData.type === 'JOB' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-blue-300'
                      }`}
                   >
                     <Briefcase size={18} /> รับสมัครงาน
                   </button>
                   <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'INTERNSHIP'})}
                      className={`flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${
                        formData.type === 'INTERNSHIP' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-emerald-300'
                      }`}
                   >
                     <GraduationCap size={18} /> รับฝึกงาน
                   </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">หัวข้อประกาศ / ตำแหน่ง</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-6 py-4 font-black outline-none" placeholder="เช่น ช่างซ่อมเครื่องยนต์อาวุโส" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">รายละเอียดและคุณสมบัติ</label>
                <textarea rows={4} required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-6 py-4 font-medium outline-none resize-none" placeholder="ระบุภาระงานและทักษะที่ต้องการ..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">สถานที่ทำงาน</label>
                   <input type="text" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-6 py-4 font-bold outline-none" placeholder="เช่น จ.สุราษฎร์ธานี" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ค่าตอบแทน (ถ้ามี)</label>
                   <input type="text" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-6 py-4 font-bold outline-none" placeholder="เช่น 15,000 - 18,000" />
                 </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ข้อมูลติดต่อ</label>
                <input type="text" required value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-6 py-4 font-bold outline-none" placeholder="ชื่อผู้ติดต่อ, เบอร์โทรศัพท์ หรือ Line ID" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowPostModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-black uppercase text-xs tracking-widest">ยกเลิก</button>
                <button 
                  type="submit" 
                  disabled={isPosting}
                  className="flex-1 py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                >
                  {isPosting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  {isPosting ? 'กำลังลงประกาศ...' : 'ยืนยันลงประกาศ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPortal;
