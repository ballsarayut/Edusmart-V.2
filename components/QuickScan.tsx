
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { saveToFirestore } from '../firebaseService';
import { Student, AttendanceRecord, SystemConfig } from '../types';
import { 
  Scan, Loader2, Check, X, ShieldAlert, Sparkles, 
  History, Clock, Camera, Keyboard, AlertCircle, RefreshCw,
  Users
} from 'lucide-react';

// Declare html5-qrcode global
declare const Html5Qrcode: any;

interface QuickScanProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

const QuickScan: React.FC<QuickScanProps> = ({ students, attendanceRecords, setAttendanceRecords }) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<'PRESENT' | 'LATE' | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const scanInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<any>(null);
  
  const config: SystemConfig = useMemo(() => {
    const saved = localStorage.getItem('cms_system_config');
    return saved ? JSON.parse(saved) : { morningTimeLimit: '08:00', scanMode: 'BARCODE_SCANNER' };
  }, []);

  const thaiToNumericMap: Record<string, string> = {
    'ๅ': '1', 'ๆ': '2', 'ภ': '3', 'ถ': '4', 'ุ': '5', 'ึ': '6', 'ค': '7', 'ต': '8', 'จ': '9', 'ข': '0',
    '/': '2', '๑': '1', '๒': '2', '๓': '3', '๔': '4', '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9', '๐': '0'
  };

  const translateThaiInput = (input: string): string => {
    return input.split('').map(char => thaiToNumericMap[char] || char).join('');
  };

  useEffect(() => {
    if (config.scanMode === 'BARCODE_SCANNER' && !isCameraActive) {
      const interval = setInterval(() => {
        if (document.activeElement !== scanInputRef.current) {
          scanInputRef.current?.focus();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [config.scanMode, isCameraActive]);

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraActive]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      setTimeout(() => {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        const qrCodeSuccessCallback = (decodedText: string) => {
          handleScanLogic(decodedText);
        };
        const scanConfig = { 
          fps: 15, 
          qrbox: { width: 250, height: 120 },
          aspectRatio: 1.777778
        };
        html5QrCode.start(
          { facingMode: "environment" }, 
          scanConfig, 
          qrCodeSuccessCallback,
          undefined
        ).catch((err: any) => {
          setCameraError("ไม่สามารถเข้าถึงกล้องได้: " + err);
          setIsCameraActive(false);
        });
      }, 300);
    } catch (err: any) {
      setCameraError("เกิดข้อผิดพลาดในการเปิดกล้อง");
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const todayDate = new Date().toISOString().split('T')[0];

  const todayScans = useMemo(() => {
    return attendanceRecords
      .filter(r => r.date === todayDate && r.type === 'MORNING')
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [attendanceRecords, todayDate]);

  const handleScanLogic = (input: string) => {
    let translatedInput = translateThaiInput(input);
    const cleanInput = translatedInput.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    if (!cleanInput) return;
    
    setScanError(null);
    const student = students.find(s => String(s.studentId) === cleanInput || String(s.id) === cleanInput);

    if (student) {
      const now = new Date();
      const timestamp = now.toLocaleString('th-TH');
      const [limitHour, limitMin] = config.morningTimeLimit.split(':').map(Number);
      const limitTime = new Date();
      limitTime.setHours(limitHour, limitMin, 0);
      
      const status = now > limitTime ? 'LATE' : 'PRESENT';
      setLastStatus(status as any);

      const newRecord: AttendanceRecord = {
        id: `MORNING_${todayDate}_${student.id}`,
        studentId: student.id,
        date: todayDate,
        type: 'MORNING',
        status: status as any,
        timestamp: timestamp
      };

      // Save to Firestore
      saveToFirestore('attendance', newRecord);

      setAttendanceRecords(prev => {
        const filtered = prev.filter(r => !(r.studentId === student.id && r.date === todayDate && r.type === 'MORNING'));
        return [newRecord, ...filtered];
      });

      setLastScannedStudent(student);
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        audio.play();
      } catch (err) {}
      setTimeout(() => setLastScannedStudent(null), 3000);
    } else {
      setScanError(`ไม่พบรหัส: ${cleanInput}`);
      setTimeout(() => setScanError(null), 3000);
    }
    setBarcodeInput('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScanLogic(barcodeInput);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Compact Scan Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-slate-950 p-6 md:p-8 rounded-[32px] shadow-2xl relative overflow-hidden border-2 border-amber-500">
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="w-full h-1 bg-amber-500 absolute animate-[scan-line_4s_linear_infinite]" />
          </div>
          
          <div className="flex flex-col items-center space-y-6 relative z-10">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 text-amber-500">
                <Scan size={24} className="animate-pulse" />
                <h2 className="text-xl font-black text-white font-heading uppercase tracking-tight">
                  Terminal
                </h2>
              </div>
              <div className="flex items-center gap-2">
                 <span className="px-2 py-0.5 bg-white/10 rounded-full text-[9px] font-black text-slate-400 uppercase border border-white/5">
                   {config.morningTimeLimit} น.
                 </span>
                 <span className="px-2 py-0.5 bg-blue-500/10 rounded-full text-[9px] font-black text-blue-400 uppercase border border-blue-500/20">
                   {config.scanMode === 'CAMERA' ? 'CAMERA' : 'BARCODE'}
                 </span>
              </div>
            </div>

            <div className="w-full max-w-lg">
              {config.scanMode === 'CAMERA' ? (
                <div className="space-y-4">
                  {!isCameraActive ? (
                    <button 
                      onClick={() => setIsCameraActive(true)}
                      className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400 py-8 rounded-[24px] flex flex-col items-center justify-center gap-2 transition-all shadow-xl active:scale-95 group"
                    >
                      <Camera size={32} />
                      <span className="text-lg font-black uppercase tracking-widest font-heading">เปิดกล้องสแกน</span>
                    </button>
                  ) : (
                    <div className="relative">
                      <div id="reader" className="w-full aspect-video bg-black rounded-[24px] border-2 border-white/10 overflow-hidden shadow-2xl"></div>
                      <button 
                        onClick={() => setIsCameraActive(false)}
                        className="absolute bottom-4 right-4 p-3 bg-red-600 text-white rounded-xl shadow-xl z-20"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="relative">
                  <input 
                    ref={scanInputRef}
                    type="text" 
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    autoFocus
                    placeholder="รอรับข้อมูลบาร์โค้ด..."
                    className="w-full bg-white/5 border-2 border-white/10 focus:border-amber-400 rounded-[24px] px-6 py-6 text-3xl font-black text-white outline-none transition-all placeholder:text-white/5 text-center tracking-widest shadow-inner"
                  />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10">
                    <Keyboard size={24} />
                  </div>
                </form>
              )}
            </div>

            <div className="h-28 flex items-center justify-center w-full">
              {lastScannedStudent ? (
                <div className={`flex items-center gap-5 px-6 py-4 rounded-[24px] shadow-2xl animate-in zoom-in duration-300 border border-white/20 w-full max-w-md ${lastStatus === 'LATE' ? 'bg-amber-600' : 'bg-green-600'}`}>
                  <div className="p-3 bg-white/20 rounded-xl"><Check size={28} strokeWidth={4} className="text-white" /></div>
                  <div className="text-left overflow-hidden">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">
                      {lastStatus === 'LATE' ? 'มาสาย (LATE)' : 'มาเรียน (PRESENT)'}
                    </p>
                    <p className="text-xl font-black font-heading text-white truncate leading-none">{lastScannedStudent.name}</p>
                    <p className="text-[10px] font-bold text-white/70 uppercase mt-1">รหัส: {lastScannedStudent.studentId}</p>
                  </div>
                </div>
              ) : scanError ? (
                <div className="flex items-center gap-4 bg-red-600 text-white px-6 py-4 rounded-[24px] shadow-2xl animate-in shake duration-300 border border-white/20 w-full max-w-md">
                  <ShieldAlert size={28} />
                  <div className="text-left">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-80">ERROR</p>
                      <p className="font-black text-lg uppercase truncate">{scanError}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500 opacity-60">
                  <Sparkles size={20} className="text-amber-600 animate-pulse" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]">
                    {config.scanMode === 'CAMERA' ? 'เล็งบาร์โค้ดให้ตรงกรอบ' : 'กรุณายิงบาร์โค้ดเพื่อเช็คชื่อ'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Scans Statistics / Quick View */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">มาเรียนวันนี้</p>
            <p className="text-4xl font-black text-green-600 font-heading">
              {todayScans.filter(s => s.status === 'PRESENT').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">มาสายวันนี้</p>
            <p className="text-4xl font-black text-amber-500 font-heading">
              {todayScans.filter(s => s.status === 'LATE').length}
            </p>
          </div>
          <div className="col-span-2 bg-slate-900 p-6 rounded-[32px] text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Users size={24} className="text-blue-400" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">เช็คชื่อแล้วรวม</p>
                <p className="text-2xl font-black font-heading">{todayScans.length} รายการ</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">เวลาปัจจุบัน</p>
              <p className="text-lg font-bold font-mono">{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* History Table - Now more visible */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
        <div className="p-6 bg-slate-50/50 border-b flex items-center justify-between sticky top-0 z-20">
          <h3 className="text-sm font-black text-slate-900 font-heading flex items-center gap-3 uppercase tracking-wider">
            <History className="text-blue-600" size={18} /> รายการสแกนล่าสุด ({todayScans.length})
          </h3>
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-[9px] font-black text-slate-400 uppercase">มาเรียน</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-[9px] font-black text-slate-400 uppercase">มาสาย</span>
             </div>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 scrollbar-hide">
          <table className="w-full text-left">
            <thead className="bg-white sticky top-0 border-b text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">
              <tr>
                <th className="px-8 py-3 whitespace-nowrap">เวลา</th>
                <th className="px-8 py-3">นักเรียน</th>
                <th className="px-8 py-3 hidden md:table-cell">ห้อง</th>
                <th className="px-8 py-3 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {todayScans.map((r) => {
                const student = students.find(s => s.id === r.studentId);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors animate-in slide-in-from-left duration-200">
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-400 font-black text-xs">
                        <Clock size={12} /> {r.timestamp.split(' ')[1]}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <p className="font-black text-slate-900 text-sm">{student?.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{student?.studentId}</p>
                    </td>
                    <td className="px-8 py-4 hidden md:table-cell">
                      <span className="text-[10px] font-bold text-slate-600">{student?.level} / {student?.room}</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${r.status === 'LATE' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                        {r.status === 'LATE' ? 'สาย' : 'มาเรียน'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {todayScans.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <Scan size={40} className="mx-auto text-slate-100 mb-3" />
                    <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">ยังไม่มีประวัติการสแกนในวันนี้</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        #reader video {
            object-fit: cover !important;
            width: 100% !important;
            height: 100% !important;
            border-radius: 20px;
        }
        #reader__dashboard, #reader__camera_selection { display: none !important; }
      `}} />
    </div>
  );
};

export default QuickScan;
