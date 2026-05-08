
import React, { useState, useRef, useMemo } from 'react';
import { saveToFirestore, saveMultipleToFirestore, deleteFromFirestore } from '../firebaseService';
import { Student, ThaiLevel, Department } from '../types';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  Search, 
  UserPlus,
  Info,
  UserX,
  Users,
  Edit3,
  Trash2,
  X,
  Plus,
  AlertCircle,
  FileText,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface StudentManagementProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ students, setStudents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<null | { type: 'success' | 'error', message: string }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableDepts = useMemo(() => {
    const depts = new Set(students.map(s => s.department));
    Object.values(Department).forEach(d => depts.add(d));
    return Array.from(depts).sort();
  }, [students]);

  const [showModal, setShowModal] = useState<'ADD' | 'EDIT' | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({
    studentId: '',
    name: '',
    level: Object.values(ThaiLevel)[0],
    department: availableDepts[0] || '',
    room: '1'
  });

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.includes(searchTerm)
  );

  const handleOpenEdit = (student: Student) => {
    setFormData({ ...student });
    setEditingStudentId(student.id);
    setShowModal('EDIT');
  };

  const handleOpenAdd = () => {
    setFormData({
      studentId: '',
      name: '',
      level: Object.values(ThaiLevel)[0],
      department: availableDepts[0] || '',
      room: '1'
    });
    setShowModal('ADD');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showModal === 'ADD') {
      const newStudent: Student = {
        id: `STU_${Date.now()}`,
        studentId: formData.studentId || '',
        name: formData.name || '',
        level: formData.level || '',
        department: formData.department || '',
        room: formData.room || '1',
        behaviorScore: 100
      };
      // Save to Firestore
      saveToFirestore('students', newStudent);
      setStudents(prev => [newStudent, ...prev]);
    } else if (showModal === 'EDIT' && editingStudentId) {
      const updatedStudent = { ...formData, id: editingStudentId } as Student;
      // Save to Firestore
      saveToFirestore('students', updatedStudent);
      setStudents(prev => prev.map(s => s.id === editingStudentId ? updatedStudent : s));
    }
    setShowModal(null);
  };

  const deleteStudent = (id: string) => {
    // Delete from Firestore
    deleteFromFirestore('students', id);
    setStudents(prev => prev.filter(s => s.id !== id));
    setStudentToDelete(null);
  };

  const downloadTemplate = () => {
    const templateData = [
      { studentId: "661001", name: "นายสมชาย ใจดี", level: "ปวช. 1", department: "เทคโนโลยีสารสนเทศ", room: "1" }
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, "Student_Import");
    XLSX.writeFile(wb, "student_import_template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const newStudents: Student[] = json.map((row, i) => ({
          id: `STU_IMP_${Date.now()}_${i}`,
          studentId: String(row.studentId || '').trim(),
          name: String(row.name || '').trim(),
          level: String(row.level || '').trim(),
          department: String(row.department || '').trim(),
          room: String(row.room || '1').trim(),
          behaviorScore: 100
        })).filter(s => s.studentId && s.name);

        if (newStudents.length > 0) {
          // Save to Firestore in batch
          saveMultipleToFirestore('students', newStudents);
          setStudents(prev => [...newStudents, ...prev]);
          setImportStatus({ type: 'success', message: `นำเข้าข้อมูลสำเร็จ ${newStudents.length} รายการ` });
        } else {
          setImportStatus({ type: 'error', message: 'ไม่พบข้อมูลที่ถูกต้อง กรุณาตรวจสอบหัวตาราง (studentId, name, level, department, room)' });
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการอ่านไฟล์' });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[28px] md:rounded-[40px] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 md:p-4 bg-green-600 rounded-xl md:rounded-[24px] text-white shadow-xl shadow-green-100"><FileSpreadsheet size={24} /></div>
            <div>
              <h3 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight font-heading">นำเข้าข้อมูลนักเรียน</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Excel (.xlsx) คอลัมน์: studentId, name, level, department, room</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className={`p-6 md:p-10 rounded-[24px] md:rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-95 group ${isImporting ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-100 hover:border-green-400'}`}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
              <div className="p-3 bg-white rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                {isImporting ? <Loader2 size={24} className="text-green-600 animate-spin" /> : <Upload size={24} className="text-green-600" />}
              </div>
              <p className="text-xs font-black text-slate-900 uppercase">{isImporting ? 'กำลังนำเข้า...' : 'เลือกไฟล์ Excel'}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={downloadTemplate} 
                className="flex items-center justify-center gap-3 py-4 md:py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 font-heading"
              >
                <Download size={18} /> โหลดเทมเพลต
              </button>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                <Info size={16} className="text-blue-600 shrink-0" />
                <p className="text-[10px] text-blue-800 font-bold leading-relaxed uppercase">
                  หัวตารางต้องตรงเป๊ะ: studentId, name, level, department, room
                </p>
              </div>
            </div>
          </div>
          {importStatus && (
            <div className={`mt-6 p-4 rounded-2xl flex items-center gap-4 border-2 animate-in slide-in-from-top-4 ${importStatus.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
              {importStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <p className="font-black text-xs">{importStatus.message}</p>
            </div>
          )}
        </div>
        
        <div className="bg-slate-900 p-8 md:p-10 rounded-[28px] md:rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col justify-center text-center sm:text-left">
           <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-white"><Users size={120} /></div>
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">จำนวนนักเรียนทั้งหมด</p>
           <p className="text-5xl md:text-6xl font-black text-white leading-none font-heading">{students.length}</p>
           <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-widest">ในฐานข้อมูลวิทยาลัย</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center px-1">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="ค้นหาชื่อ หรือ รหัสนักเรียน..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-4 font-bold text-sm text-slate-900 outline-none shadow-sm" />
        </div>
        <div className="flex gap-3">
          <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 font-heading">
            <Plus size={20} /> เพิ่มนักเรียนใหม่
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length > 0 ? filteredStudents.map((s) => (
          <div key={s.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-blue-400 transition-all relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 font-black text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 font-heading">
                {s.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-900 text-base leading-tight truncate font-heading">{s.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {s.studentId}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[8px] font-black text-slate-500 uppercase">{s.level}</span>
                  <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[8px] font-black text-slate-500 uppercase">{s.department}</span>
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md text-[8px] font-black text-blue-600 uppercase">ห้อง {s.room}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => handleOpenEdit(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={18} /></button>
                <button onClick={() => setStudentToDelete(s)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center text-slate-300 uppercase font-black tracking-widest text-xs flex flex-col items-center gap-4">
            <UserX size={48} className="opacity-10" />
            ไม่พบข้อมูลที่ค้นหา
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-md rounded-[40px] p-10 text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 font-heading mb-2">ยืนยันการลบนักเรียน?</h3>
              <p className="text-slate-500 font-bold mb-8">คุณกำลังจะลบข้อมูลของ <span className="text-slate-900">{studentToDelete.name}</span> ออกจากระบบอย่างถาวร</p>
              <div className="flex gap-4">
                 <button onClick={() => setStudentToDelete(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">ยกเลิก</button>
                 <button onClick={() => deleteStudent(studentToDelete.id)} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">ยืนยันการลบ</button>
              </div>
           </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[48px] p-10 md:p-14 shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <button onClick={() => setShowModal(null)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 transition-colors">
              <X size={28} />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-10 uppercase tracking-tight font-heading text-center">
              {showModal === 'ADD' ? 'เพิ่มนักเรียนใหม่' : 'แก้ไขข้อมูลนักเรียน'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ชื่อ-นามสกุล</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-4 font-black text-slate-900 outline-none transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">รหัสประจำตัวนักเรียน</label>
                <input type="text" required value={formData.studentId} onChange={(e) => setFormData({...formData, studentId: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-4 font-black text-slate-900 outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ระดับชั้น</label>
                  <select value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-4 font-black text-slate-900 outline-none cursor-pointer">
                    {Object.values(ThaiLevel).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ห้อง</label>
                  <input type="text" required value={formData.room} onChange={(e) => setFormData({...formData, room: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-4 font-black text-slate-900 outline-none transition-all text-center" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">แผนกวิชา</label>
                <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-4 font-black text-slate-900 outline-none cursor-pointer">
                  {availableDepts.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all font-heading">ยกเลิก</button>
                <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-black shadow-2xl shadow-blue-200 uppercase text-xs tracking-widest hover:bg-blue-700 transition-all font-heading">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
