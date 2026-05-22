
import React, { useState, useMemo } from 'react';
import { saveToFirestore, deleteFromFirestore } from '../firebaseService';
import { NewsRecord, Student, Department, ThaiLevel } from '../types';
import { 
  Megaphone, Plus, Search, X, Send, Users, User, Layout, 
  AlertCircle, Calendar, Trash2, Edit3, Loader2, Sparkles, Check,
  Building, GraduationCap, ArrowRight, Briefcase, UserPlus
} from 'lucide-react';

interface NewsBroadcastProps {
  students: Student[];
  news: NewsRecord[];
  setNews: React.Dispatch<React.SetStateAction<NewsRecord[]>>;
  currentUser: any;
}

const NewsBroadcast: React.FC<NewsBroadcastProps> = ({ students, news, setNews, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // State สำหรับการจัดการรายบุคคล
  const [individualInput, setIndividualInput] = useState('');
  const [selectedIndividualIds, setSelectedIndividualIds] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<NewsRecord>>({
    title: '',
    content: '',
    type: 'INFO',
    targetType: 'ALL',
    targetDept: '',
    targetMajor: '',
    targetLevel: 'ปวช. 1',
    targetRoom: '1'
  });

  const availableDepts = useMemo(() => Array.from(new Set(students.map(s => s.department))).map(String).sort(), [students]);
  const availableLevels = useMemo(() => Array.from(new Set(students.map(s => s.level))).map(String).sort(), [students]);
  const availableRooms = useMemo(() => Array.from(new Set(students.map(s => s.room))).map(String).sort((a,b) => parseInt(a)-parseInt(b)), [students]);

  // ค้นหานักเรียนจากรหัสที่กำลังพิมพ์
  const foundStudent = useMemo(() => {
    if (individualInput.length < 3) return null;
    return students.find(s => s.studentId === individualInput.trim());
  }, [individualInput, students]);

  // Initial form values for dropdowns
  useMemo(() => {
    if (availableDepts.length > 0 && !formData.targetDept) {
      setFormData(prev => ({ ...prev, targetDept: availableDepts[0], targetMajor: availableDepts[0] }));
    }
  }, [availableDepts]);

  const filteredNews = useMemo(() => {
    return news
      .filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.content.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [news, searchTerm]);

  const addIndividual = () => {
    if (foundStudent && !selectedIndividualIds.includes(foundStudent.studentId)) {
      setSelectedIndividualIds(prev => [...prev, foundStudent.studentId]);
      setIndividualInput('');
    }
  };

  const removeIndividual = (id: string) => {
    setSelectedIndividualIds(prev => prev.filter(item => item !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    if (formData.targetType === 'INDIVIDUAL' && selectedIndividualIds.length === 0) {
      alert('กรุณาระบุรายชื่อนักเรียนอย่างน้อย 1 คน');
      return;
    }

    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const newRecord: NewsRecord = {
      id: `NEWS_${Date.now()}`,
      title: formData.title!,
      content: formData.content!,
      type: formData.type as any,
      targetType: formData.targetType as any,
      targetDept: formData.targetType === 'DEPT' ? formData.targetDept : undefined,
      targetMajor: formData.targetType === 'ROOM' ? formData.targetMajor : undefined,
      targetLevel: formData.targetType === 'ROOM' ? formData.targetLevel : undefined,
      targetRoom: formData.targetType === 'ROOM' ? formData.targetRoom : undefined,
      targetStudentIds: formData.targetType === 'INDIVIDUAL' ? selectedIndividualIds : undefined,
      authorName: currentUser.name,
      date: new Date().toLocaleDateString('th-TH'),
      timestamp: new Date().toISOString()
    };

    // Save to Firestore
    saveToFirestore('news', newRecord);

    setNews(prev => [newRecord, ...prev]);
    setIsSending(false);
    setShowModal(false);
    
    // Reset
    setFormData({ 
      title: '', 
      content: '', 
      type: 'INFO', 
      targetType: 'ALL',
      targetDept: availableDepts[0] || '',
      targetMajor: availableDepts[0] || '',
      targetLevel: availableLevels[0] || 'ปวช. 1',
      targetRoom: availableRooms[0] || '1'
    });
    setSelectedIndividualIds([]);
    setIndividualInput('');
  };

  const [newsToDelete, setNewsToDelete] = useState<string | null>(null);

  const deleteNews = async (id: string | number) => {
    const idStr = String(id);
    if (newsToDelete === idStr) {
      try {
        await deleteFromFirestore('news', idStr);
        setNews(prev => prev.filter(n => n.id !== idStr));
        setNewsToDelete(null);
      } catch (error) {
        console.error("Failed to delete news: ", error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    } else {
      setNewsToDelete(idStr);
      // Auto reset after 3 seconds
      setTimeout(() => setNewsToDelete(null), 3000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 font-heading flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100"><Megaphone size={32} /></div>
            ประชาสัมพันธ์ข่าวสาร
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-1">วิทยาลัยเทคโนโลยีอาชีวศึกษา Portal</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all active:scale-95 font-heading text-sm uppercase tracking-widest"
        >
          <Plus size={20} /> เขียนประกาศใหม่
        </button>
      </div>

      <div className="bg-white p-4 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
        <Search className="text-slate-300 ml-4" size={24} />
        <input 
          type="text" 
          placeholder="ค้นหาข่าวสาร/ประกาศ..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 py-4 bg-transparent font-bold text-slate-900 outline-none text-lg"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredNews.map(item => (
          <div key={item.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-2 h-full ${item.type === 'URGENT' ? 'bg-red-500' : item.type === 'EVENT' ? 'bg-amber-500' : 'bg-blue-500'}`} />
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    item.type === 'URGENT' ? 'bg-red-50 text-red-600 border-red-100' : 
                    item.type === 'EVENT' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                    'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {item.type === 'URGENT' ? 'ด่วนที่สุด' : item.type === 'EVENT' ? 'กิจกรรม' : 'ข่าวประชาสัมพันธ์'}
                  </span>
                  <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-2">
                    {item.targetType === 'ALL' ? <Users size={12} /> : 
                     item.targetType === 'DEPT' ? <Building size={12} /> : 
                     item.targetType === 'ROOM' ? <Layout size={12} /> : <User size={12} />}
                    ส่งถึง: {
                      item.targetType === 'ALL' ? 'ทุกคนในวิทยาลัย' : 
                      item.targetType === 'DEPT' ? `แผนก ${item.targetDept}` : 
                      item.targetType === 'ROOM' ? `${item.targetMajor} | ${item.targetLevel} / ${item.targetRoom}` : 
                      `ระบุรายบุคคล (${item.targetStudentIds?.length} คน)`
                    }
                  </span>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 font-heading leading-tight">{item.title}</h3>
                <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{item.content}</p>
                
                <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-[10px]">{item.authorName.charAt(0)}</div>
                    <p className="text-xs font-black text-slate-900 uppercase">โดย: {item.authorName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase">
                    <Calendar size={14} /> {item.date}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                 <button 
                   onClick={(e) => { e.stopPropagation(); deleteNews(item.id); }} 
                   className={`p-3 rounded-2xl transition-all shadow-sm active:scale-95 border flex items-center justify-center min-w-[50px] ${
                     newsToDelete === item.id 
                     ? 'bg-red-600 text-white border-red-600 animate-pulse' 
                     : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-600 hover:text-white'
                   }`}
                   title={newsToDelete === item.id ? "คลิกอีกครั้งเพื่อยืนยัน" : "ลบข่าวสาร"}
                 >
                   {newsToDelete === item.id ? (
                     <span className="text-[10px] font-black uppercase whitespace-nowrap px-1">ยืนยัน?</span>
                   ) : (
                     <Trash2 size={22} />
                   )}
                 </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredNews.length === 0 && (
          <div className="py-32 text-center bg-white rounded-[48px] border-4 border-dashed border-slate-100">
            <Megaphone size={64} className="mx-auto text-slate-100 mb-6" />
            <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-sm">ไม่มีข่าวประชาสัมพันธ์ในขณะนี้</p>
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[48px] p-8 md:p-14 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 transition-colors"><X size={28} /></button>
            
            <h3 className="text-2xl font-black text-slate-900 mb-10 font-heading flex items-center gap-4">
              <Megaphone className="text-blue-600" /> เขียนประกาศใหม่
            </h3>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-heading">เลือกระดับกลุ่มเป้าหมาย</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                   {[
                     { id: 'ALL', label: 'ทั้งวิทยาลัย', icon: <Users size={16} /> },
                     { id: 'DEPT', label: 'แยกแผนกวิชา', icon: <Building size={16} /> },
                     { id: 'ROOM', label: 'สาขา/ระดับ/ห้อง', icon: <Layout size={16} /> },
                     { id: 'INDIVIDUAL', label: 'รายบุคคล', icon: <User size={16} /> },
                   ].map(target => (
                     <button
                        key={target.id}
                        type="button"
                        onClick={() => setFormData({...formData, targetType: target.id as any})}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-tighter ${
                          formData.targetType === target.id 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-blue-300'
                        }`}
                     >
                       {target.icon}
                       {target.label}
                     </button>
                   ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-heading">ประเภทประกาศ</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-4 font-black outline-none"
                  >
                    <option value="INFO">ข่าวทั่วไป (Information)</option>
                    <option value="URGENT">ด่วนที่สุด (Urgent)</option>
                    <option value="EVENT">กิจกรรม (Event)</option>
                  </select>
                </div>

                {formData.targetType === 'DEPT' && (
                  <div className="space-y-2 animate-in slide-in-from-top-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-heading">เลือกแผนกวิชา</label>
                    <select 
                      value={formData.targetDept} 
                      onChange={(e) => setFormData({...formData, targetDept: e.target.value, targetMajor: e.target.value})}
                      className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl px-5 py-4 font-black outline-none"
                    >
                      {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                
                {formData.targetType === 'ALL' && (
                  <div className="space-y-2 flex items-end">
                    <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      ส่งถึงทุกคนในระบบ (นักเรียนและผู้ปกครอง)
                    </div>
                  </div>
                )}
              </div>

              {formData.targetType === 'ROOM' && (
                <div className="space-y-6 animate-in slide-in-from-top-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เลือกสาขาวิชา/งาน</label>
                    <select value={formData.targetMajor} onChange={(e) => setFormData({...formData, targetMajor: e.target.value})} className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl px-5 py-4 font-black outline-none">
                      {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ระดับชั้น</label>
                      <select value={formData.targetLevel} onChange={(e) => setFormData({...formData, targetLevel: e.target.value})} className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl px-5 py-4 font-bold outline-none">
                        {availableLevels.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ห้อง</label>
                      <select value={formData.targetRoom} onChange={(e) => setFormData({...formData, targetRoom: e.target.value})} className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl px-5 py-4 font-bold outline-none">
                        {availableRooms.map(v => <option key={v} value={v}>ห้อง {v}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {formData.targetType === 'INDIVIDUAL' && (
                <div className="space-y-6 animate-in slide-in-from-top-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-heading">ระบุรหัสนักเรียนผู้รับ</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                          type="text" 
                          value={individualInput}
                          onChange={(e) => setIndividualInput(e.target.value)}
                          placeholder="กรอกรหัส 6 หลัก เช่น 661001"
                          className="w-full bg-blue-50 border-2 border-blue-100 focus:border-blue-500 rounded-2xl px-12 py-4 font-black outline-none"
                        />
                      </div>
                      <button 
                        type="button"
                        disabled={!foundStudent}
                        onClick={addIndividual}
                        className={`px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${
                          foundStudent ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-300'
                        }`}
                      >
                        <UserPlus size={18} /> เพิ่ม
                      </button>
                    </div>
                    {foundStudent && (
                      <div className="mt-2 p-4 bg-green-50 rounded-2xl border-2 border-green-100 flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                          <Check className="text-green-600" size={18} />
                          <div>
                            <p className="text-xs font-black text-green-900">{foundStudent.name}</p>
                            <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">{foundStudent.level} | {foundStudent.department}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-green-500 uppercase">ตรวจพบข้อมูล</span>
                      </div>
                    )}
                  </div>

                  {selectedIndividualIds.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รายการผู้รับ ({selectedIndividualIds.length} คน)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                        {selectedIndividualIds.map(id => {
                          const stu = students.find(s => s.studentId === id);
                          return (
                            <div key={id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-red-200 transition-all">
                              <div className="min-w-0">
                                <p className="text-[11px] font-black text-slate-900 truncate">{stu?.name || id}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{id}</p>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => removeIndividual(id)}
                                className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 border-t border-slate-100 pt-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-heading">หัวข้อประกาศ</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="เช่น แจ้งกำหนดการวันไหว้ครู ปีการศึกษา 2567"
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-6 py-5 font-black text-lg outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 font-heading">เนื้อหาประกาศ</label>
                <textarea 
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="ระบุรายละเอียดที่ต้องการแจ้งให้ผู้ปกครองและนักเรียนทราบ..."
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-3xl px-6 py-5 font-medium outline-none resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-black uppercase text-xs tracking-widest font-heading">ยกเลิก</button>
                <button 
                  type="submit" 
                  disabled={isSending}
                  className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 font-heading"
                >
                  {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  {isSending ? 'กำลังส่งประกาศ...' : 'ส่งประกาศทันที'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsBroadcast;
