
import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord, BehaviorRecord, PaymentRecord, Subject } from '../types';
import { 
  Database,
  Zap,
  Loader2,
  Table as TableIcon,
  CheckCircle2,
  Server,
  Copy,
  Code as CodeIcon
} from 'lucide-react';

interface CloudConfigProps {
  students: Student[];
  attendance: AttendanceRecord[];
  behavior: BehaviorRecord[];
  payments: PaymentRecord[];
  subjects: Subject[];
}

const CloudConfig: React.FC<CloudConfigProps> = ({ 
  students, attendance, behavior, payments, subjects 
}) => {
  const [googleScriptUrl, setGoogleScriptUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<null | 'success' | 'error'>(null);
  const [copied, setCopied] = useState(false);

  const googleAppsScriptCode = `/**
 * EduSmart CMS - Google Sheets Sync Script
 * 1. Open Google Sheets
 * 2. Extensions > Apps Script
 * 3. Paste this code
 * 4. Build > Deploy > New Deployment
 * 5. Select type: Web App
 * 6. Execute as: Me
 * 7. Who has access: Anyone
 * 8. Copy the Web App URL and paste it in the CMS
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    if (action === 'syncData') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      
      // 1. Students
      if (data.students) {
        var sheet = getOrCreateSheet(ss, "ST_STUDENTS");
        sheet.clear();
        sheet.appendRow(["Student ID", "Name", "Level", "Department", "Room", "Behavior Score"]);
        if (data.students.length > 0) {
          sheet.getRange(2, 1, data.students.length, data.students[0].length).setValues(data.students);
        }
      }
      
      // 2. Morning Attendance
      if (data.morning) {
        var sheet = getOrCreateSheet(ss, "AT_MORNING");
        sheet.clear();
        sheet.appendRow(["Date", "Student ID", "Name", "Level", "Department", "Status", "Timestamp"]);
        if (data.morning.length > 0) {
          sheet.getRange(2, 1, data.morning.length, data.morning[0].length).setValues(data.morning);
        }
      }
      
      // 3. Behavior Records
      if (data.behavior) {
        var sheet = getOrCreateSheet(ss, "BE_RECORDS");
        sheet.clear();
        sheet.appendRow(["Date", "Student ID", "Name", "Type", "Score", "Reason", "Recorded By"]);
        if (data.behavior.length > 0) {
          sheet.getRange(2, 1, data.behavior.length, data.behavior[0].length).setValues(data.behavior);
        }
      }
      
      // 4. Payments
      if (data.payments) {
        var sheet = getOrCreateSheet(ss, "PY_RECORDS");
        sheet.clear();
        sheet.appendRow(["Date", "Student ID", "Name", "Amount", "Method", "Recorded By"]);
        if (data.payments.length > 0) {
          sheet.getRange(2, 1, data.payments.length, data.payments[0].length).setValues(data.payments);
        }
      }
      
      // 5. Subject Attendance (Dynamically created sheets)
      if (data.subjects) {
        for (var code in data.subjects) {
          var records = data.subjects[code];
          var sheet = getOrCreateSheet(ss, "SUB_" + code);
          sheet.clear();
          sheet.appendRow(["Date", "Student ID", "Name", "Level", "Status", "Remark", "Timestamp"]);
          if (records.length > 0) {
            var values = records.map(function(r) {
              return [r.date, r.studentId, r.name, r.level, r.status, r.remark, r.timestamp];
            });
            sheet.getRange(2, 1, values.length, values[0].length).setValues(values);
          }
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Invalid action'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function doGet() {
  return ContentService.createTextOutput("EduSmart CMS Web App is running.");
}`;

  useEffect(() => {
    const savedUrl = localStorage.getItem('cms_google_script_url');
    if (savedUrl) setGoogleScriptUrl(savedUrl);
  }, []);

  const handleSaveUrl = () => {
    localStorage.setItem('cms_google_script_url', googleScriptUrl);
    alert('บันทึก Web App URL เรียบร้อยแล้ว');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncToSheets = async () => {
    if (!googleScriptUrl) {
      alert('กรุณาระบุ Google Apps Script Web App URL ก่อนทำการเชื่อมต่อ');
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const morningAttendance = attendance.filter(a => a.type === 'MORNING');
      const subjectGroups: Record<string, any[]> = {};
      attendance.filter(a => a.type === 'SUBJECT').forEach(rec => {
        const sub = subjects.find(s => s.id === rec.subjectId);
        const sheetName = sub ? sub.code : 'Unknown';
        if (!subjectGroups[sheetName]) subjectGroups[sheetName] = [];
        const student = students.find(s => s.id === rec.studentId);
        subjectGroups[sheetName].push({
          date: rec.date,
          studentId: student?.studentId,
          name: student?.name,
          level: student?.level,
          status: rec.status,
          remark: rec.remark || '',
          timestamp: rec.timestamp
        });
      });

      const payload = {
        action: 'syncData',
        type: 'all',
        students: students.map(s => [s.studentId, s.name, s.level, s.department, s.room, s.behaviorScore]),
        morning: morningAttendance.map(a => {
          const s = students.find(x => x.id === a.studentId);
          return [a.date, s?.studentId, s?.name, s?.level, s?.department, a.status, a.timestamp];
        }),
        behavior: behavior.map(b => {
          const s = students.find(x => x.id === b.studentId);
          return [b.date, s?.studentId, s?.name, b.type, b.score, b.reason, b.recordedBy];
        }),
        payments: payments.map(p => {
          const s = students.find(x => x.id === p.studentId);
          return [p.date, s?.studentId, s?.name, p.amount, p.method, p.recordedBy];
        }),
        subjects: subjectGroups
      };

      await fetch(googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      await new Promise(resolve => setTimeout(resolve, 1500));
      setSyncStatus('success');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-4xl mx-auto">
      <div className="bg-white p-10 md:p-14 rounded-[48px] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />
        
        <div className="flex items-center gap-6 mb-12 relative z-10">
          <div className="p-5 bg-emerald-600 rounded-[24px] text-white shadow-2xl">
            <Server size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight font-heading uppercase">Cloud Database Sync</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">ตั้งค่าการเชื่อมต่อ Google Sheets เพื่อซิงค์ข้อมูลระหว่างเครื่อง</p>
          </div>
        </div>

        <div className="space-y-10 relative z-10">
          <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">Google Apps Script Web App URL</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={googleScriptUrl}
                  onChange={(e) => setGoogleScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 bg-white border-2 border-slate-100 focus:border-emerald-500 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none transition-all"
                />
                <button onClick={handleSaveUrl} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-black transition-all shadow-lg font-heading">Save URL</button>
              </div>
            </div>

            <div className="pt-4">
               <button 
                  onClick={handleSyncToSheets}
                  disabled={isSyncing}
                  className={`w-full flex items-center justify-center gap-4 py-6 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all font-heading ${
                    syncStatus === 'success' ? 'bg-green-600 text-white' :
                    isSyncing ? 'bg-slate-200 text-slate-500 cursor-not-allowed' :
                    'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                  }`}
                >
                  {isSyncing ? <Loader2 size={24} className="animate-spin" /> : syncStatus === 'success' ? <CheckCircle2 size={24} /> : <Zap size={24} />}
                  {isSyncing ? 'กำลังส่งข้อมูลไปคลาวด์...' : syncStatus === 'success' ? 'ซิงค์ข้อมูลสำเร็จ' : 'Sync All Data to Google Sheets Now'}
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm flex items-start gap-4">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><TableIcon size={20} /></div>
               <div>
                  <h4 className="font-black text-slate-900 text-sm uppercase font-heading mb-1">Sheet แยกรายวิชา</h4>
                  <p className="text-[10px] font-bold text-slate-500">ระบบจะสร้างชีตแยกตามรหัสวิชาให้อัตโนมัติ (เช่น IT30201)</p>
               </div>
            </div>
            <div className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm flex items-start gap-4">
               <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Database size={20} /></div>
               <div>
                  <h4 className="font-black text-slate-900 text-sm uppercase font-heading mb-1">รองรับการเข้าถึงพร้อมกัน</h4>
                  <p className="text-[10px] font-bold text-slate-500">เมื่อตั้งค่า URL แล้ว ทุกเครื่องจะดึงข้อมูลจากชีตเดียวกันเสมอ</p>
               </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><CodeIcon size={18} /></div>
                   <h3 className="text-sm font-black text-slate-900 uppercase font-heading">Google Apps Script Code</h3>
                </div>
                <button 
                  onClick={copyCode}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                    copied ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  {copied ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}
                </button>
             </div>
             <div className="bg-slate-900 rounded-3xl p-6 overflow-hidden relative shadow-inner">
                <div className="overflow-auto max-h-[300px] font-mono text-[11px] text-emerald-400 leading-relaxed scrollbar-hide">
                   <pre>{googleAppsScriptCode}</pre>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
             </div>
             <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-700">
                <Zap size={18} className="shrink-0" />
                <p className="text-[10px] font-bold italic">
                  คัดลอกโค้ดด้านบนไปวางใน Google Apps Script (Extensions {'>'} Apps Script) แล้วทำการ Deploy เป็น Web App 
                  เพื่อให้ระบบสามารถเชื่อมต่อกับ Google Sheets ได้อย่างสมบูรณ์
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudConfig;
