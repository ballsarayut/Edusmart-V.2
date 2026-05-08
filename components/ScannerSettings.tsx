
import React, { useState, useEffect } from 'react';
import { SystemConfig } from '../types';
import { 
  Scan, 
  Clock, 
  Camera, 
  Keyboard, 
  Save, 
  CheckCircle2,
  Settings2,
  Sparkles
} from 'lucide-react';

const ScannerSettings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({
    morningTimeLimit: '08:00',
    scanMode: 'BARCODE_SCANNER'
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isConfigSaved, setIsConfigSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cms_system_config');
    if (saved) setConfig(JSON.parse(saved));
  }, []);

  const handleSaveConfig = () => {
    setIsSavingConfig(true);
    localStorage.setItem('cms_system_config', JSON.stringify(config));
    setTimeout(() => {
      setIsSavingConfig(false);
      setIsConfigSaved(true);
      setTimeout(() => setIsConfigSaved(false), 2000);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6 mb-10">
          <div className="p-5 bg-amber-500 rounded-[24px] text-white shadow-2xl shadow-amber-100">
            <Settings2 size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight font-heading">ตั้งค่าเครื่องสแกนเช็คชื่อ</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">กำหนดค่าทางเทคนิคสำหรับ Quick Scan Terminal</p>
          </div>
        </div>

        <div className="space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2 font-heading">
                    <Clock size={14} className="text-blue-500" /> เวลาเข้าแถวปกติ
                 </label>
                 <input 
                    type="time" 
                    value={config.morningTimeLimit}
                    onChange={(e) => setConfig({...config, morningTimeLimit: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-amber-500 rounded-2xl px-6 py-5 font-black text-3xl outline-none transition-all shadow-inner"
                 />
                 <p className="text-[10px] text-slate-400 font-bold mt-2 ml-1">* หากสแกนหลังจากเวลานี้ ระบบจะบันทึกเป็น "มาสาย" อัตโนมัติ</p>
              </div>
              
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2 font-heading">
                    <Scan size={14} className="text-blue-500" /> อุปกรณ์อินพุตหลัก
                 </label>
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setConfig({...config, scanMode: 'BARCODE_SCANNER'})}
                      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all ${config.scanMode === 'BARCODE_SCANNER' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                       <Keyboard size={32} />
                       <span className="text-[10px] font-black uppercase tracking-widest">เครื่องยิงบาร์โค้ด</span>
                    </button>
                    <button 
                      onClick={() => setConfig({...config, scanMode: 'CAMERA'})}
                      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all ${config.scanMode === 'CAMERA' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                       <Camera size={32} />
                       <span className="text-[10px] font-black uppercase tracking-widest">กล้องเว็บแคม</span>
                    </button>
                 </div>
              </div>
           </div>

           <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex gap-4">
              <div className="p-3 bg-white rounded-2xl text-amber-500 h-fit shadow-sm">
                 <Sparkles size={20} />
              </div>
              <div className="space-y-1">
                 <p className="text-sm font-black text-slate-900 font-heading">โหมด Terminal อัตโนมัติ</p>
                 <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                   เมื่อเลือกโหมด "เครื่องยิงบาร์โค้ด" ระบบจะทำการโฟกัสช่องรับข้อมูลให้อัตโนมัติและสแกนได้ต่อเนื่องโดยไม่ต้องกดปุ่มใดๆ เหมาะสำหรับวางตั้งโต๊ะหน้าเสาธง
                 </p>
              </div>
           </div>

           <button 
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className={`w-full py-6 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 font-heading active:scale-[0.98] ${isConfigSaved ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-black'}`}
            >
              {isConfigSaved ? <CheckCircle2 size={22} /> : <Save size={22} />}
              {isSavingConfig ? 'กำลังบันทึกข้อมูล...' : isConfigSaved ? 'บันทึกสำเร็จ' : 'บันทึกการตั้งค่าเครื่องสแกน'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ScannerSettings;
