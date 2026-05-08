
import React, { useMemo } from 'react';
import { Student, PaymentRecord, TuitionConfig } from '../types';
import { Banknote, History, TrendingUp, Wallet, ArrowUpRight, Users, CheckCircle, AlertTriangle } from 'lucide-react';

interface FinanceReportProps {
  students: Student[];
  paymentRecords: PaymentRecord[];
  tuitionConfigs: TuitionConfig[];
}

const FinanceReport: React.FC<FinanceReportProps> = ({ students, paymentRecords, tuitionConfigs }) => {
  const summary = useMemo(() => {
    let totalExpected = 0;
    let paidFullCount = 0;
    let pendingCount = 0;

    students.forEach(s => {
      const config = tuitionConfigs.find(c => c.level === s.level && c.department === s.department);
      if (config) {
        totalExpected += config.amount;
        
        const studentPaid = paymentRecords
          .filter(p => p.studentId === s.id)
          .reduce((sum, p) => sum + p.amount, 0);
        
        if (studentPaid >= config.amount) {
          paidFullCount++;
        } else {
          pendingCount++;
        }
      } else {
        // หากไม่มี config ถือว่ายังไม่มียอดค้างชำระ (หรืออาจจะข้ามไป)
        pendingCount++;
      }
    });

    const totalCollected = paymentRecords.reduce((sum, p) => sum + p.amount, 0);
    const cashTotal = paymentRecords.filter(p => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0);
    const transferTotal = paymentRecords.filter(p => p.method === 'TRANSFER').reduce((sum, p) => sum + p.amount, 0);
    const successRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    return { 
      totalExpected, 
      totalCollected, 
      cashTotal, 
      transferTotal, 
      successRate,
      paidFullCount,
      pendingCount,
      totalStudents: students.length
    };
  }, [students, tuitionConfigs, paymentRecords]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Financial Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Banknote size={80} /></div>
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">เป้าหมายจัดเก็บรวม</p>
          <p className="text-3xl font-black font-heading">{summary.totalExpected.toLocaleString()} ฿</p>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">จัดเก็บสำเร็จแล้ว</p>
            <p className="text-3xl font-black text-green-600 font-heading">{summary.totalCollected.toLocaleString()} ฿</p>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[9px] font-bold mb-1">
              <span className="text-slate-400 uppercase">Progress</span>
              <span className="text-green-600">{summary.successRate}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${summary.successRate}%` }} />
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">เงินสด (CASH)</p>
          <p className="text-3xl font-black text-slate-900 font-heading">{summary.cashTotal.toLocaleString()} ฿</p>
          <p className="text-[10px] text-amber-500 font-bold mt-2 flex items-center gap-1"><ArrowUpRight size={12}/> สัดส่วน {summary.totalCollected > 0 ? Math.round((summary.cashTotal / summary.totalCollected) * 100) : 0}%</p>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">เงินโอน (TRANSFER)</p>
          <p className="text-3xl font-black text-indigo-600 font-heading">{summary.transferTotal.toLocaleString()} ฿</p>
          <p className="text-[10px] text-indigo-400 font-bold mt-2 flex items-center gap-1"><ArrowUpRight size={12}/> สัดส่วน {summary.totalCollected > 0 ? Math.round((summary.transferTotal / summary.totalCollected) * 100) : 0}%</p>
        </div>
      </div>

      {/* Student Payment Status Summary */}
      <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 font-heading mb-8 flex items-center gap-3 uppercase tracking-tight">
          <Users className="text-blue-600" size={24} /> สรุปสถานะการชำระเงินของนักเรียน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-green-50 p-8 rounded-[32px] border border-green-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm shrink-0">
              <CheckCircle size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">จ่ายครบถ้วน</p>
              <h4 className="text-4xl font-black text-green-900 font-heading">{summary.paidFullFullCount} <span className="text-sm font-bold text-green-600">คน</span></h4>
            </div>
          </div>

          <div className="bg-amber-50 p-8 rounded-[32px] border border-amber-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
              <AlertTriangle size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">ยังค้างชำระ</p>
              <h4 className="text-4xl font-black text-amber-900 font-heading">{summary.pendingCount} <span className="text-sm font-bold text-amber-600">คน</span></h4>
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex flex-col justify-center">
             <div className="flex justify-between items-center mb-3">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ความสำเร็จเชิงประชากร</span>
               <span className="text-xs font-black text-slate-900">
                {summary.totalStudents > 0 ? Math.round((summary.paidFullCount / summary.totalStudents) * 100) : 0}%
               </span>
             </div>
             <div className="h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-green-500 transition-all duration-1000" 
                  style={{ width: `${(summary.paidFullCount / summary.totalStudents) * 100}%` }} 
                />
             </div>
             <p className="mt-3 text-[10px] font-bold text-slate-400 text-center uppercase tracking-tighter">
                จากนักเรียนทั้งหมด {summary.totalStudents} คน
             </p>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-lg font-bold font-heading flex items-center gap-3"><History size={20} className="text-indigo-600" /> ประวัติการรับเงินล่าสุด</h3>
          <span className="bg-white px-4 py-1 rounded-full border text-xs font-black text-slate-400 uppercase">{paymentRecords.length} รายการ</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
              <tr>
                <th className="px-8 py-5">วันที่</th>
                <th className="px-8 py-5">นักเรียน</th>
                <th className="px-8 py-5 text-right">ยอดชำระ</th>
                <th className="px-8 py-5">วิธีชำระ</th>
                <th className="px-8 py-5">ผู้บันทึก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paymentRecords.length > 0 ? [...paymentRecords].reverse().slice(0, 50).map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-5 text-sm font-bold text-slate-500">{p.date}</td>
                  <td className="px-8 py-5">
                    <p className="font-black text-sm text-slate-900">{students.find(s=>s.id===p.studentId)?.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{students.find(s=>s.id===p.studentId)?.studentId}</p>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-indigo-600">{p.amount.toLocaleString()} ฿</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${p.method === 'CASH' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{p.method}</span>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-400">{p.recordedBy}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest">ยังไม่มีรายการชำระเงิน</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceReport;
