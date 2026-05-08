
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileUp, 
  FileText, 
  Trash2, 
  ExternalLink, 
  Download,
  AlertCircle,
  Eye,
  Loader2,
  Sparkles
} from 'lucide-react';

interface CalendarFile {
  id: string;
  name: string;
  url: string;
  date: string;
  size: string;
}

interface AcademicCalendarProps {
  currentUser: any;
}

// ตัวอย่างไฟล์ PDF จำลอง (Base64 ของไฟล์ PDF เปล่าที่มีข้อความต้อนรับ)
const MOCK_PDF_URL = "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDczL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDM0VDAwNFYwVDAzVzBTMDRRMFAwVTA0NFUwNVUwUzA1UzBTMFUwVTA1UzBTMFRwVDA0MFUwVTA1UzBTMFRwVDA0MFUwVTA1UzBTMFR3VDA0VTAzVTAxAgD9Lw6KZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8L1R5cGUvUGFnZS9QYXJlbnQgMyAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDEgMCBSPj4+Pi9Db250ZW50cyAyIDAgUi9NZWRpYUJveFswIDAgNTk1IDg0Ml0+PgplbmRvYmoKMSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2EtQm9sZD4+CmVuZG9iagozIDAgb2JqCjw8L1R5cGUvUGFnZXMvQ291bnQgMS9LaWRzWzQgMCBSXT4+CmVuZG9iago1IDAgb2JqCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAzIDAgUj4+CmVuZG9iago2IDAgb2JqCjw8L1Byb2R1Y2VyKFF0IDQuOC43KS9DcmVhdGlvbkRhdGUoRDoyMDI0MDUyMDEyMDAwMCk+PgplbmRvYmoKeHJlZgowIDcKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMjk2IDAwMDAwIG4gCjAwMDAwMDAwMTkgMDAwMDAgbiAKMDAwMDAwMDM1OCAwMDAwMCBuIAowMDAwMDAwMTU5IDAwMDAwIG4gCjAwMDAwMDA0MDcgMDAwMDAgbiAKMDAwMDAwMDQ1NyAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNy9Sb290IDUgMCBSL0luZm8gNiAwIFI+PgpzdGFydHhyZWYKNTM3CiUlRU9GCg==";

const AcademicCalendar: React.FC<AcademicCalendarProps> = ({ currentUser }) => {
  const [calendars, setCalendars] = useState<CalendarFile[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cms_academic_calendars');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCalendars(parsed);
      if (parsed.length > 0) setSelectedCalendar(parsed[0]);
    } else {
      // เพิ่มตัวอย่างข้อมูลครั้งแรก
      const mockData: CalendarFile[] = [
        {
          id: 'CAL_SAMPLE_1',
          name: 'ปฏิทินการศึกษา_ภาคเรียนที่_1_2567.pdf',
          url: MOCK_PDF_URL,
          date: '20/05/2567',
          size: '0.45 MB'
        },
        {
          id: 'CAL_SAMPLE_2',
          name: 'กำหนดการสอบปลายภาค_บล็อกที่_1.pdf',
          url: MOCK_PDF_URL,
          date: '15/05/2567',
          size: '0.22 MB'
        }
      ];
      setCalendars(mockData);
      setSelectedCalendar(mockData[0]);
      localStorage.setItem('cms_academic_calendars', JSON.stringify(mockData));
    }
  }, []);

  const isAdminOrAcademic = currentUser.role === 'ADMIN' || currentUser.role === 'ACADEMIC';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      const newCal: CalendarFile = {
        id: `CAL_${Date.now()}`,
        name: file.name,
        url: base64Url,
        date: new Date().toLocaleDateString('th-TH'),
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      };

      const updated = [newCal, ...calendars];
      setCalendars(updated);
      setSelectedCalendar(newCal);
      localStorage.setItem('cms_academic_calendars', JSON.stringify(updated));
      setIsUploading(false);
      if (e.target) e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const deleteCalendar = (id: string) => {
    if (!confirm('ยืนยันการลบไฟล์ปฏิทินนี้?')) return;
    const updated = calendars.filter(c => c.id !== id);
    setCalendars(updated);
    localStorage.setItem('cms_academic_calendars', JSON.stringify(updated));
    if (selectedCalendar?.id === id) {
      setSelectedCalendar(updated.length > 0 ? updated[0] : null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-blue-600 text-white rounded-[24px] shadow-xl shadow-blue-100 ring-4 ring-blue-50">
            <Calendar size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
               <h2 className="text-3xl font-black text-slate-900 font-heading uppercase tracking-tight">Academic Calendar</h2>
               <Sparkles className="text-amber-500 hidden sm:block" size={20} />
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">ปฏิทินกิจกรรมและการศึกษาประจำปี</p>
          </div>
        </div>

        {isAdminOrAcademic && (
          <div className="relative group">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <button className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all group-hover:bg-black group-hover:scale-105 active:scale-95 font-heading">
              {isUploading ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
              {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดปฏิทินใหม่ (PDF)'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* File List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 font-heading">
               <FileText size={18} className="text-blue-500" /> เอกสารปฏิทิน ({calendars.length})
             </h3>
          </div>
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 scrollbar-hide">
            {calendars.map(cal => (
              <div 
                key={cal.id}
                onClick={() => setSelectedCalendar(cal)}
                className={`p-5 rounded-[28px] border-2 transition-all cursor-pointer group flex flex-col gap-3 relative overflow-hidden ${
                  selectedCalendar?.id === cal.id 
                  ? 'bg-white border-blue-600 shadow-xl shadow-blue-100 ring-1 ring-blue-600/10' 
                  : 'bg-white border-slate-100 hover:border-blue-300'
                }`}
              >
                {selectedCalendar?.id === cal.id && (
                   <div className="absolute top-0 right-0 p-2 text-blue-600 opacity-20">
                      <Calendar size={40} />
                   </div>
                )}
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedCalendar?.id === cal.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-black text-sm truncate leading-tight transition-colors ${selectedCalendar?.id === cal.id ? 'text-blue-600' : 'text-slate-900'}`}>{cal.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{cal.date} • {cal.size}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1 relative z-10">
                   <div className="flex gap-2">
                      <span className="text-[8px] font-black text-blue-600 px-2 py-0.5 bg-blue-50 rounded-md uppercase tracking-widest">PDF Document</span>
                   </div>
                   {isAdminOrAcademic && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteCalendar(cal.id); }}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="ลบไฟล์"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {calendars.length === 0 && (
              <div className="py-24 text-center bg-white rounded-[40px] border-4 border-dashed border-slate-50">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar size={40} className="text-slate-200" />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">ยังไม่มีการอัปโหลดไฟล์</p>
                <p className="text-slate-300 text-[10px] font-bold mt-2">โปรดใช้ปุ่มด้านบนเพื่อเพิ่มปฏิทิน</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden h-[850px] flex flex-col relative group/preview">
            {selectedCalendar ? (
              <>
                <div className="p-7 bg-slate-50 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-200">
                      <Eye size={24} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 font-heading leading-none uppercase tracking-tight truncate max-w-[200px] md:max-w-md">{selectedCalendar.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-[0.15em] flex items-center gap-2">
                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> ระบบดูตัวอย่างแบบเรียลไทม์
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <a 
                      href={selectedCalendar.url} 
                      download={selectedCalendar.name}
                      className="flex-1 sm:flex-none p-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      <span className="sm:hidden text-xs font-black uppercase">Download</span>
                    </a>
                    <button 
                      onClick={() => window.open(selectedCalendar.url, '_blank')}
                      className="flex-1 sm:flex-none p-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={18} />
                      <span className="sm:hidden text-xs font-black uppercase">Open Full</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-slate-100 p-4 md:p-8 flex items-center justify-center relative">
                  {/* Background branding inside viewer */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                     <h1 className="text-[120px] font-black uppercase rotate-12 select-none">EDUSMART</h1>
                  </div>
                  <iframe 
                    src={`${selectedCalendar.url}#toolbar=0&navpanes=0`} 
                    className="w-full h-full rounded-[32px] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] bg-white border-none relative z-10"
                    title="PDF Preview"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-slate-50">
                <div className="w-28 h-28 bg-white rounded-[40px] flex items-center justify-center text-slate-100 mb-8 animate-pulse shadow-inner border border-slate-100">
                  <Eye size={54} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 font-heading uppercase tracking-widest">Interactive Viewer</h3>
                <p className="text-slate-400 text-sm mt-4 font-bold max-w-sm mx-auto leading-relaxed uppercase tracking-tight">
                  เลือกไฟล์จากรายการด้านซ้ายเพื่อเปิดดูปฏิทินวิชาการ ตารางสอบ และวันสำคัญประจำปีการศึกษา
                </p>
                <div className="mt-10 flex gap-2">
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150" />
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 rounded-[56px] shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
           <AlertCircle size={250} />
        </div>
        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
          <div className="p-5 bg-white/20 backdrop-blur-xl rounded-[32px] text-white shadow-xl shrink-0">
             <AlertCircle size={40} strokeWidth={2.5} />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-black font-heading uppercase tracking-tight">ข้อแนะนำการใช้งานระบบปฏิทิน</h3>
            <p className="text-sm text-blue-100 font-medium leading-relaxed max-w-3xl">
              ไฟล์ที่อัปโหลดจะถูกจัดเก็บไว้ในหน่วยความจำของเบราว์เซอร์ (Local Storage) เครื่องนี้เท่านั้น 
              หากต้องการแชร์ให้ผู้ใช้อื่นหรือเครื่องอื่นเห็นข้อมูล แนะนำให้ใช้เมนู <span className="underline font-bold">"ประชาสัมพันธ์ข่าวสาร"</span> เพื่อส่งไฟล์ หรืออัปโหลดซ้ำในแต่ละเครื่องที่ใช้งาน
            </p>
          </div>
          <div className="md:ml-auto">
             <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
                Secured Local Storage
             </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .origin-center { transform-origin: center center; }
        iframe {
          -ms-zoom: 0.75;
          -moz-transform: scale(0.75);
          -moz-transform-origin: 0 0;
          -o-transform: scale(0.75);
          -o-transform-origin: 0 0;
          -webkit-transform: scale(0.75);
          -webkit-transform-origin: 0 0;
        }
      `}} />
    </div>
  );
};

export default AcademicCalendar;
