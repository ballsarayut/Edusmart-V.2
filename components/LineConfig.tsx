
import React, { useState, useEffect } from 'react';
import { MessageCircle, Link as LinkIcon, Save, Info, ExternalLink } from 'lucide-react';

const LineConfig: React.FC = () => {
  const [lineNotifyUrl, setLineNotifyUrl] = useState('');

  useEffect(() => {
    const savedLineUrl = localStorage.getItem('cms_line_notify_url') || '';
    setLineNotifyUrl(savedLineUrl);
  }, []);

  const saveLineUrl = () => {
    localStorage.setItem('cms_line_notify_url', lineNotifyUrl);
    alert('บันทึกการตั้งค่า LINE สำเร็จ ผู้ปกครองสามารถใช้ลิงก์นี้เพื่อแจ้งชำระเงินได้ทันที');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-50" />
        
        <div className="flex items-center gap-6 mb-10 relative z-10">
          <div className="p-5 bg-[#06C755] rounded-[24px] text-white shadow-2xl shadow-green-100">
            <MessageCircle size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight font-heading">ตั้งค่าการแจ้งเตือน LINE</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">กำหนดลิงก์สำหรับการรับแจ้งชำระเงินจากผู้ปกครอง</p>
          </div>
        </div>

        <div className="space-y-8 relative z-10">
          <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex gap-4">
            <Info className="text-blue-600 shrink-0" size={24} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-blue-900 font-heading">ทำไมต้องตั้งค่า?</p>
              <p className="text-xs text-blue-800 leading-relaxed font-bold">
                ลิงก์ที่คุณระบุที่นี่จะปรากฏในหน้า "แดชบอร์ดของผู้ปกครอง" เมื่อพวกเขากดปุ่มชำระเงิน คุณสามารถใช้ลิงก์กลุ่มไลน์ (Group Invite), LINE Official Account, หรือ LINE Notify เพื่อให้ผู้ปกครองส่งสลิปมาให้คุณได้โดยตรง
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2 font-heading">
              <LinkIcon size={12} className="text-blue-500" /> LINE Notify URL / Official Account Link
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                value={lineNotifyUrl} 
                onChange={(e) => setLineNotifyUrl(e.target.value)} 
                placeholder="เช่น https://line.me/R/ti/p/@donbosco_surat"
                className="flex-1 bg-slate-50 border-2 border-slate-100 focus:border-[#06C755] rounded-[20px] px-6 py-4 font-bold text-slate-900 outline-none transition-all shadow-inner" 
              />
              <button 
                onClick={saveLineUrl}
                className="px-10 py-4 bg-slate-900 text-white rounded-[20px] font-black hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
              >
                <Save size={18} /> บันทึกการตั้งค่า
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">ตัวอย่างรูปแบบลิงก์</p>
               <ul className="space-y-3 text-[11px] font-bold text-slate-600">
                 <li className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                   LINE OA: <span className="text-blue-600">https://line.me/R/ti/p/@id</span>
                 </li>
                 <li className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                   Group: <span className="text-blue-600">https://line.me/R/ti/g/code</span>
                 </li>
               </ul>
            </div>
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">สถานะปัจจุบัน</p>
               <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${lineNotifyUrl ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-xs font-black uppercase text-slate-900">
                    {lineNotifyUrl ? 'พร้อมใช้งานแล้ว' : 'ยังไม่ได้ตั้งค่า'}
                  </span>
               </div>
               {lineNotifyUrl && (
                 <a href={lineNotifyUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline">
                   ทดสอบลิงก์ <ExternalLink size={10} />
                 </a>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineConfig;
