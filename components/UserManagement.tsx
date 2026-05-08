
import React, { useState, useRef, useMemo } from 'react';
import { saveToFirestore, saveMultipleToFirestore, deleteFromFirestore } from '../firebaseService';
import { User, UserRole, Department, Student } from '../types';
import * as XLSX from 'xlsx';
import { 
  UserPlus, Shield, Trash2, Edit3, X, Search, FileSpreadsheet, 
  Upload, Download, Key, UserX, Users, UserCircle, CheckCircle2, AlertCircle, Info, Check, Loader2, Building2,
  Banknote, BookOpen
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser?: User;
  students?: Student[]; 
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, currentUser, students = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<UserRole>('TEACHER');
  const [showModal, setShowModal] = useState<'ADD' | 'EDIT' | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [importStatus, setImportStatus] = useState<null | { type: 'success' | 'error', message: string }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableDepts = useMemo(() => {
    const depts = new Set(students.map(s => s.department));
    Object.values(Department).forEach(d => depts.add(d));
    return Array.from(depts).sort();
  }, [students]);

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    role: 'TEACHER',
    department: availableDepts[0] || '',
    studentId: '',
    username: '',
    password: '',
    companyName: ''
  });

  const filteredUsers = users.filter(u => 
    u.role === activeTab &&
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (u.companyName && u.companyName.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const resetForm = () => {
    setFormData({ 
      name: '', 
      role: activeTab, 
      department: activeTab === 'FINANCE' ? 'ฝ่ายการเงิน' : activeTab === 'ACADEMIC' ? 'งานวิชาการ' : availableDepts[0] || '', 
      studentId: '', 
      username: '', 
      password: '',
      companyName: ''
    });
    setEditingUserId(null);
  };

  const handleOpenEdit = (user: User) => {
    setFormData({ ...user });
    setEditingUserId(user.id);
    setShowModal('EDIT');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (showModal === 'ADD') {
      const newUser = { id: `USR_${Date.now()}`, ...formData } as User;
      // Save to Firestore
      saveToFirestore('users', newUser);
      setUsers(prev => [...prev, newUser]);
    } else if (showModal === 'EDIT' && editingUserId) {
      const updatedUser = { ...formData, id: editingUserId } as User;
      // Save to Firestore
      saveToFirestore('users', updatedUser);
      setUsers(prev => prev.map(u => u.id === editingUserId ? updatedUser : u));
    }
    
    setIsSaving(false);
    setShowModal(null);
    resetForm();
  };

  const processDeleteUser = (id: string) => {
    if (currentUser && id === currentUser.id) {
      alert('ไม่สามารถลบบัญชีที่คุณกำลังใช้งานได้');
      setConfirmDeleteId(null);
      return;
    }
    // Delete from Firestore
    deleteFromFirestore('users', id);
    setUsers(prev => prev.filter(u => u.id !== id));
    setConfirmDeleteId(null);
  };

  const downloadTemplate = () => {
    const teacherData = [
      { name: "ชื่อ-นามสกุล ครู", username: "teacher_id", password: "password123", department: "แผนกวิชา" }
    ];
    const parentData = [
      { name: "ชื่อ-นามสกุล ผู้ปกครอง", username: "parent_id", password: "password123", studentId: "รหัสนักเรียน" }
    ];
    const companyData = [
      { name: "ชื่อผู้ติดต่อ", companyName: "ชื่อสถานประกอบการ", username: "company_user", password: "password123" }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teacherData), "Template_Teacher");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parentData), "Template_Parent");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(companyData), "Template_Company");
    XLSX.writeFile(wb, "user_import_template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportStatus(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);
        const newUsers: User[] = json.map((row, i) => ({
          id: `USR_IMP_${Date.now()}_${i}`,
          name: String(row.name || '').trim(),
          username: String(row.username || '').trim(),
          password: String(row.password || '1234').trim(),
          role: activeTab,
          department: (activeTab === 'TEACHER' || activeTab === 'FINANCE' || activeTab === 'ACADEMIC') ? String(row.department || '').trim() : undefined,
          studentId: activeTab === 'PARENT' ? String(row.studentId || '').trim() : undefined,
          companyName: activeTab === 'COMPANY' ? String(row.companyName || '').trim() : undefined,
        })).filter(u => u.name && u.username);
        if (newUsers.length > 0) {
          // Save to Firestore in batch
          saveMultipleToFirestore('users', newUsers);
          setUsers(prev => [...prev, ...newUsers]);
          setImportStatus({ type: 'success', message: `นำเข้าสำเร็จ ${newUsers.length} รายการ` });
        } else {
          setImportStatus({ type: 'error', message: 'ไม่พบข้อมูลที่ถูกต้อง' });
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: 'เกิดข้อผิดพลาด' });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-5 mb-8">
            <div className="p-4 bg-indigo-600 rounded-[24px] text-white shadow-xl">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 font-heading">นำเข้าผู้ใช้งานแบบกลุ่ม</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">ประเภทที่เลือก: {activeTab}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div onClick={() => fileInputRef.current?.click()} className={`p-10 rounded-[32px] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group ${isImporting ? 'bg-slate-50 opacity-50' : 'bg-slate-50 border-slate-100 hover:border-indigo-400'}`}>
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isImporting} />
              <div className="p-5 bg-white rounded-2xl shadow-sm mb-4">
                {isImporting ? <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Upload size={32} className="text-indigo-600" />}
              </div>
              <p className="font-black text-slate-900 text-center text-sm">{isImporting ? 'กำลังประมวลผล...' : `อัปโหลดไฟล์สำหรับ ${activeTab}`}</p>
            </div>
            <div className="flex flex-col justify-center gap-4">
              <button onClick={downloadTemplate} className="flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-[24px] font-black hover:bg-black transition-all shadow-xl">
                <Download size={20} /> ดาวน์โหลดเทมเพลต
              </button>
            </div>
          </div>
          {importStatus && (
            <div className={`mt-6 p-4 rounded-2xl flex items-center gap-4 border-2 animate-in slide-in-from-top-4 ${importStatus.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
              {importStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <p className="font-black text-xs">{importStatus.message}</p>
            </div>
          )}
        </div>

        <div className="bg-indigo-900 p-10 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none text-white"><Shield size={180} /></div>
           <div className="relative z-10">
              <h4 className="text-xs font-black text-indigo-300 uppercase tracking-[0.3em] mb-8 font-heading">สรุปผู้ใช้งานรายประเภท</h4>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">การเงิน/วิชาการ</p>
                    <p className="text-3xl font-black text-white">{users.filter(u => u.role === 'FINANCE' || u.role === 'ACADEMIC').length}</p>
                 </div>
                 <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">อาจารย์</p>
                    <p className="text-3xl font-black text-white">{users.filter(u => u.role === 'TEACHER').length}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 bg-slate-50/50 border-b flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit shrink-0 overflow-x-auto">
            {[
              { id: 'TEACHER', label: 'อาจารย์', icon: <Users size={14} /> },
              { id: 'FINANCE', label: 'การเงิน', icon: <Banknote size={14} /> },
              { id: 'ACADEMIC', label: 'วิชาการ', icon: <BookOpen size={14} /> },
              { id: 'COMPANY', label: 'บริษัท', icon: <Building2 size={14} /> },
              { id: 'PARENT', label: 'ผู้ปกครอง', icon: <UserCircle size={14} /> },
              { id: 'ADMIN', label: 'แอดมิน', icon: <Shield size={14} /> }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as UserRole); setConfirmDeleteId(null); }} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black transition-all font-heading whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" placeholder="ค้นหาชื่อ หรือ Username..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-slate-900 outline-none shadow-inner" />
            </div>
            <button onClick={() => { resetForm(); setShowModal('ADD'); }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black flex items-center gap-3 shadow-xl uppercase tracking-widest">
              <UserPlus size={20} /> เพิ่มผู้ใช้
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ข้อมูลผู้ใช้</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">บัญชี / รหัสผ่าน</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">รายละเอียด</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u) => {
                const isConfirming = confirmDeleteId === u.id;
                return (
                  <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors group ${isConfirming ? 'bg-red-50' : ''}`}>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-white ${u.role === 'COMPANY' ? 'bg-amber-600' : u.role === 'FINANCE' ? 'bg-green-600' : u.role === 'ACADEMIC' ? 'bg-blue-600' : 'bg-slate-800'}`}>{u.name.charAt(0)}</div>
                        <div>
                          <p className="font-bold font-heading text-slate-900">{u.name}</p>
                          {u.companyName && <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{u.companyName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <p className="text-sm font-black text-slate-900 flex items-center gap-2"><Key size={14} className="text-blue-500" /> {u.username}</p>
                      <p className="text-xs font-mono text-slate-300">••••••••</p>
                    </td>
                    <td className="px-10 py-7 text-xs font-bold text-slate-500">
                      {u.role === 'TEACHER' || u.role === 'FINANCE' || u.role === 'ACADEMIC' ? u.department : u.role === 'PARENT' ? `นักเรียน: ${u.studentId}` : u.role === 'COMPANY' ? 'สถานประกอบการ' : 'ผู้ดูแลระบบ'}
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end gap-2">
                        {isConfirming ? (
                          <div className="flex gap-2">
                             <button onClick={() => setConfirmDeleteId(null)} className="p-2 bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase">ยกเลิก</button>
                             <button onClick={() => processDeleteUser(u.id)} className="p-2 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase">ลบ</button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => handleOpenEdit(u)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"><Edit3 size={18} /></button>
                            <button onClick={() => setConfirmDeleteId(u.id)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm"><Trash2 size={18} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <UserX size={48} className="mx-auto text-slate-200 mb-4 opacity-20" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">ไม่พบข้อมูลผู้ใช้ในหมวดหมู่ {activeTab}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[48px] p-10 md:p-14 shadow-2xl animate-in zoom-in-95 duration-300 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(null)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 transition-colors"><X size={28} /></button>
            <h3 className="text-2xl font-black text-slate-900 mb-10 uppercase tracking-tight text-center font-heading">
              {showModal === 'ADD' ? `เพิ่มผู้ใช้ ${activeTab}` : 'แก้ไขข้อมูลผู้ใช้'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 font-heading">ชื่อ-นามสกุล</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-5 py-4 font-black" />
              </div>

              {activeTab === 'COMPANY' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 font-heading">ชื่อสถานประกอบการ</label>
                  <input type="text" required value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-5 py-4 font-black" placeholder="บจก. เอบีซี จำกัด" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 font-heading">Username</label>
                  <input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-5 py-4 font-black" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 font-heading">Password</label>
                  <input type="text" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-5 py-4 font-black" />
                </div>
              </div>

              {(activeTab === 'TEACHER' || activeTab === 'FINANCE' || activeTab === 'ACADEMIC') && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 font-heading">หน่วยงาน / แผนก</label>
                  {activeTab === 'TEACHER' ? (
                    <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-black">
                      {availableDepts.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-black" placeholder={activeTab === 'FINANCE' ? 'ฝ่ายการเงิน' : 'งานวิชาการ'} />
                  )}
                </div>
              )}

              {activeTab === 'PARENT' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 font-heading">รหัสนักเรียน (สำหรับเชื่อมต่อข้อมูล)</label>
                  <input type="text" required value={formData.studentId} onChange={(e) => setFormData({...formData, studentId: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-5 py-4 font-black" placeholder="ระบุรหัส 6 หลัก" />
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-black uppercase text-xs">ยกเลิก</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-5 bg-indigo-600 text-white rounded-[24px] font-black shadow-2xl uppercase text-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
