
import React, { useState, useMemo, useEffect } from 'react';
import { saveToFirestore, deleteFromFirestore } from '../firebaseService';
import { Student, TuitionConfig, PaymentRecord, ThaiLevel, Department } from '../types';
import { 
  CreditCard, Plus, Save, Trash2, Banknote, History, Search, CheckCircle2, 
  User, Wallet, Building2, X, Loader2,
  Printer, FileText, MapPin, Phone, AlertCircle, ChevronLeft, GraduationCap
} from 'lucide-react';

interface ReceiptSettings {
  schoolName: string;
  address: string;
  phone: string;
  receiverName: string;
  term: string;
  year: string;
}

interface TuitionSystemProps {
  students: Student[];
  tuitionConfigs: TuitionConfig[];
  setTuitionConfigs: React.Dispatch<React.SetStateAction<TuitionConfig[]>>;
  paymentRecords: PaymentRecord[];
  setPaymentRecords: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  user: any;
}

const TuitionSystem: React.FC<TuitionSystemProps> = ({ 
  students, tuitionConfigs, setTuitionConfigs, paymentRecords, setPaymentRecords, user 
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'payment' | 'receipt_settings'>('payment');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState<PaymentRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [bankInfo, setBankInfo] = useState({
    bankName: 'ธนาคารกรุงไทย (Krungthai)',
    accountNo: '012-3-45678-9',
    accountName: 'วิทยาลัยเทคโนโลยีอาชีวศึกษา'
  });

  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    schoolName: 'วิทยาลัยเทคโนโลยีอาชีวศึกษา (EduSmart Vocational)',
    address: '123 ถ.นวัตกรรม ต.ในเมือง อ.เมือง จ.สุราษฎร์ธานี 84000',
    phone: '077-123456',
    receiverName: user.name,
    term: '1',
    year: '2567'
  });

  useEffect(() => {
    const savedBank = localStorage.getItem('cms_bank_info');
    if (savedBank) setBankInfo(JSON.parse(savedBank));
    
    const savedReceipt = localStorage.getItem('cms_receipt_settings');
    if (savedReceipt) setReceiptSettings(JSON.parse(savedReceipt));
  }, []);

  const saveSettings = () => {
    localStorage.setItem('cms_bank_info', JSON.stringify(bankInfo));
    localStorage.setItem('cms_receipt_settings', JSON.stringify(receiptSettings));
    alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
  };

  const [newConfig, setNewConfig] = useState<Partial<TuitionConfig>>({
    level: Object.values(ThaiLevel)[0],
    department: Object.values(Department)[0],
    amount: 0,
    term: '1/2567'
  });

  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('TRANSFER');

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.includes(searchTerm)
    );
  }, [students, searchTerm]);

  const handleAddConfig = async () => {
    if (!newConfig.amount || newConfig.amount <= 0) return alert('ระบุจำนวนเงิน');
    setIsConfigSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const config: TuitionConfig = {
      id: `CONF_${Date.now()}`,
      level: newConfig.level!,
      department: newConfig.department!,
      amount: newConfig.amount!,
      term: newConfig.term!
    };
    // Save to Firestore
    saveToFirestore('tuition_configs', config);
    setTuitionConfigs(prev => [...prev, config]);
    setIsConfigSaving(false);
  };

  const handlePayment = async (student: Student) => {
    const amount = Number(paymentAmount);
    if (amount <= 0) return alert('ระบุจำนวนเงินที่ชำระ');

    setIsPaymentSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const config = tuitionConfigs.find(c => c.level === student.level && c.department === student.department);
    const newPayment: PaymentRecord = {
      id: `PAY_${Date.now()}`,
      studentId: student.id,
      configId: config?.id || 'GENERAL',
      amount: amount,
      method: paymentMethod,
      date: new Date().toLocaleDateString('th-TH'),
      recordedBy: receiptSettings.receiverName || user.name,
      status: 'PAID',
    };

    // Save to Firestore
    saveToFirestore('payments', newPayment);

    setPaymentRecords(prev => [...prev, newPayment]);
    setReceiptToPrint(newPayment);
    setPaymentAmount("");
    setDiscountAmount(0);
    setIsPaymentSaving(false);
    setShowReceiptModal(true);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return alert('กรุณาอนุญาตให้เบราว์เซอร์เปิด Pop-up เพื่อพิมพ์ใบเสร็จ');

    const html = `
      <html>
        <head>
          <title>Receipt - ${receiptToPrint?.id}</title>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
          <style>
            @page { 
              size: A5 landscape; 
              margin: 0; 
            }
            body { 
              font-family: 'Sarabun', sans-serif; 
              margin: 0; 
              padding: 0; 
              -webkit-print-color-adjust: exact;
            }
            .receipt-container {
              width: 210mm;
              height: 148mm;
              padding: 12mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              background: white;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-y { border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; }
            .badge { 
              border: 1.5px solid #000; 
              padding: 4px 15px; 
              display: inline-block; 
              font-weight: bold; 
              margin-top: 8px;
              border-radius: 4px;
            }
            .line-double { border-bottom: 3.5px double #000; }
            .flex-grow { flex-grow: 1; }
            .signature-area {
              margin-top: auto;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 50px;
              padding-bottom: 10mm;
              text-align: center;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="receipt-container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const processDeleteConfig = (id: string) => {
    setTuitionConfigs(prev => prev.filter(c => c.id !== id));
    setConfirmDeleteId(null);
  };

  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const handleDeletePayment = async (id: string) => {
    if (paymentToDelete === id) {
      try {
        await deleteFromFirestore('payments', id);
        setPaymentRecords(prev => prev.filter(p => p.id !== id));
        setPaymentToDelete(null);
      } catch (error) {
        console.error("Failed to delete payment: ", error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    } else {
      setPaymentToDelete(id);
      // Auto reset after 3 seconds
      setTimeout(() => setPaymentToDelete(null), 3000);
    }
  };

  const studentPaymentHistory = useMemo(() => {
    if (!selectedStudentId) return [];
    return paymentRecords
      .filter(p => p.studentId === selectedStudentId)
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [paymentRecords, selectedStudentId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-fit no-print">
        <button onClick={() => setActiveTab('payment')} className={`px-6 py-3 rounded-xl text-xs font-bold transition-all font-heading ${activeTab === 'payment' ? 'bg-[#00AEEF] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>รับชำระเงิน</button>
        <button onClick={() => setActiveTab('config')} className={`px-6 py-3 rounded-xl text-xs font-bold transition-all font-heading ${activeTab === 'config' ? 'bg-[#00AEEF] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>โครงสร้างค่าเทอม</button>
        <button onClick={() => setActiveTab('receipt_settings')} className={`px-6 py-3 rounded-xl text-xs font-bold transition-all font-heading ${activeTab === 'receipt_settings' ? 'bg-[#00AEEF] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>ตั้งค่าใบเสร็จ/บัญชี</button>
      </div>

      {activeTab === 'receipt_settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 no-print">
          <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-sky-50 text-[#00AEEF] rounded-2xl shadow-sm"><Building2 size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-900 font-heading">บัญชีธนาคารรับเงิน</h3>
                <p className="text-xs text-slate-400 font-bold">ข้อมูลนี้จะปรากฏในหน้า Dashboard ของผู้ปกครอง</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ธนาคาร</label>
                <input type="text" value={bankInfo.bankName} onChange={(e) => setBankInfo({...bankInfo, bankName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">เลขที่บัญชี</label>
                <input type="text" value={bankInfo.accountNo} onChange={(e) => setBankInfo({...bankInfo, accountNo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ชื่อบัญชี</label>
                <input type="text" value={bankInfo.accountName} onChange={(e) => setBankInfo({...bankInfo, accountName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" />
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl shadow-sm"><FileText size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-900 font-heading">ข้อมูลหัวใบเสร็จ</h3>
                <p className="text-xs text-slate-400 font-bold">กำหนดข้อมูลที่จะพิมพ์ลงในใบรับเงิน</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ชื่อสถานศึกษา</label>
                <input type="text" value={receiptSettings.schoolName} onChange={(e) => setReceiptSettings({...receiptSettings, schoolName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ที่อยู่สถานศึกษา</label>
                <textarea rows={2} value={receiptSettings.address} onChange={(e) => setReceiptSettings({...receiptSettings, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ภาคเรียนที่</label>
                  <input type="text" value={receiptSettings.term} onChange={(e) => setReceiptSettings({...receiptSettings, term: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" placeholder="เช่น 1" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ปีการศึกษา</label>
                  <input type="text" value={receiptSettings.year} onChange={(e) => setReceiptSettings({...receiptSettings, year: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" placeholder="เช่น 2567" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">ชื่อผู้รับเงิน</label>
                  <input type="text" value={receiptSettings.receiverName} onChange={(e) => setReceiptSettings({...receiptSettings, receiverName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">เบอร์โทรศัพท์</label>
                  <input type="text" value={receiptSettings.phone} onChange={(e) => setReceiptSettings({...receiptSettings, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold" />
                </div>
              </div>
              <button onClick={saveSettings} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs font-heading">
                <Save size={18} /> บันทึกการตั้งค่าทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 no-print">
          <div className="lg:col-span-1 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold font-heading">กำหนดค่าเทอม</h3>
            <div className="space-y-4">
              <input type="text" value={newConfig.term} onChange={(e) => setNewConfig({...newConfig, term: e.target.value})} className="w-full bg-slate-50 border rounded-xl px-4 py-3" placeholder="ภาคเรียน เช่น 1/2567" />
              <select value={newConfig.level} onChange={(e) => setNewConfig({...newConfig, level: e.target.value})} className="w-full bg-slate-50 border rounded-xl px-4 py-3 font-bold">
                {Object.values(ThaiLevel).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={newConfig.department} onChange={(e) => setNewConfig({...newConfig, department: e.target.value})} className="w-full bg-slate-50 border rounded-xl px-4 py-3 font-bold">
                {Object.values(Department).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <input type="number" value={newConfig.amount || ""} onChange={(e) => setNewConfig({...newConfig, amount: Number(e.target.value)})} className="w-full bg-slate-50 border rounded-xl px-4 py-3 font-black text-xl" placeholder="ยอดเงิน (บาท)" />
              <button onClick={handleAddConfig} disabled={isConfigSaving} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs font-heading shadow-lg transition-all flex items-center justify-center gap-2 ${isConfigSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#00AEEF] text-white hover:bg-sky-600'}`}>
                {isConfigSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isConfigSaving ? 'กำลังบันทึก...' : 'บันทึกโครงสร้าง'}
              </button>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                <tr>
                  <th className="px-8 py-5">ระดับ / แผนก</th>
                  <th className="px-8 py-5 text-right">ยอดเงิน</th>
                  <th className="px-8 py-5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tuitionConfigs.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-black text-slate-900">{c.level}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{c.department}</p>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-lg text-[#00AEEF]">
                      {c.amount.toLocaleString()} ฿
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => processDeleteConfig(c.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div className="flex flex-col gap-8 no-print h-full">
          {/* TOP ROW: Form (Left) and Student Search (Right) aligned */}
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
             {/* Main Payment Form Area */}
             <div className="flex-1 w-full space-y-6">
                {selectedStudentId ? (
                   <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-10 animate-in slide-in-from-left-4">
                     {(() => {
                       const s = students.find(x => x.id === selectedStudentId)!;
                       const config = tuitionConfigs.find(c => c.level === s.level && c.department === s.department);
                       const paid = paymentRecords.filter(p => p.studentId === s.id).reduce((sum, p) => sum + p.amount, 0);
                       const remainingBeforeDiscount = config ? Math.max(0, config.amount - paid) : 0;
                       const remaining = Math.max(0, remainingBeforeDiscount - discountAmount);

                       return (
                         <div className="space-y-8">
                           {/* Selected Student Header */}
                           <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b">
                              <div className="flex items-center gap-6">
                               <div className="w-20 h-20 bg-sky-50 text-[#00AEEF] rounded-[24px] flex items-center justify-center shadow-inner"><User size={40} /></div>
                               <div>
                                   <h3 className="text-3xl font-black text-slate-900 font-heading leading-tight">{s.name}</h3>
                                   <div className="flex items-center gap-3 mt-1.5">
                                      <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">{s.studentId}</span>
                                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{s.level} | {s.department}</p>
                                   </div>
                               </div>
                             </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             {/* Payment Form */}
                             <div className="space-y-6">
                               <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ระบุยอดเงินที่รับชำระ</label>
                                     <div className="relative">
                                        <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} className="w-full bg-white border-2 border-slate-100 focus:border-[#00AEEF] rounded-2xl px-6 py-4 font-black text-4xl outline-none transition-all shadow-inner text-[#00AEEF]" placeholder="0" />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">฿</span>
                                     </div>
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 font-heading">ส่วนลด (ถ้ามี)</label>
                                     <div className="relative">
                                        <input type="number" value={discountAmount || ""} onChange={(e) => setDiscountAmount(Number(e.target.value))} className="w-full bg-white border-2 border-slate-100 focus:border-amber-500 rounded-2xl px-6 py-3 font-bold text-slate-900 outline-none transition-all shadow-inner" placeholder="ระบุยอดส่วนลด..." />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-slate-300 text-sm">฿</span>
                                     </div>
                                  </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <button onClick={() => setPaymentMethod('TRANSFER')} className={`py-4 rounded-2xl text-[10px] font-black border-2 transition-all uppercase tracking-widest font-heading ${paymentMethod === 'TRANSFER' ? 'bg-[#00AEEF] border-[#00AEEF] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-sky-100'}`}>เงินโอน (Transfer)</button>
                                  <button onClick={() => setPaymentMethod('CASH')} className={`py-4 rounded-2xl text-[10px] font-black border-2 transition-all uppercase tracking-widest font-heading ${paymentMethod === 'CASH' ? 'bg-[#00AEEF] border-[#00AEEF] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-sky-100'}`}>เงินสด (Cash)</button>
                               </div>
                               <button onClick={() => handlePayment(s)} disabled={isPaymentSaving || remainingBeforeDiscount === 0} className={`w-full py-6 rounded-[24px] font-black uppercase tracking-widest text-xs transition-all shadow-2xl active:scale-95 font-heading flex items-center justify-center gap-3 ${isPaymentSaving ? 'bg-slate-400 cursor-not-allowed' : remainingBeforeDiscount === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#00AEEF] text-white hover:bg-sky-600'}`}>
                                 {isPaymentSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                 {isPaymentSaving ? 'กำลังประมวลผล...' : 'ยืนยันรับเงินและออกใบเสร็จ'}
                               </button>
                             </div>
                             {/* Financial Info Card */}
                             <div className="bg-slate-900 p-8 md:p-10 rounded-[40px] text-white flex flex-col justify-center relative overflow-hidden shadow-2xl h-full min-h-[400px]">
                               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-10 translate-y--10">
                                  <Wallet size={180} />
                               </div>
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 relative z-10 font-heading">ยอดค้างชำระจริง</p>
                               <p className="text-6xl font-black text-[#00AEEF] font-heading relative z-10 tracking-tighter">
                                 {remaining.toLocaleString()}
                                 <span className="text-xl ml-2 text-slate-400">฿</span>
                               </p>
                               <div className="mt-8 pt-6 border-t border-white/10 space-y-3 relative z-10">
                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                     <span>ยอดตั้งต้น (เทอม {config?.term || '-'})</span>
                                     <span className="text-white">{config?.amount.toLocaleString() || 0} ฿</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                     <span>ชำระสะสมแล้ว</span>
                                     <span className="text-white">{paid.toLocaleString()} ฿</span>
                                  </div>
                               </div>
                             </div>
                           </div>
                         </div>
                       )
                     })()}
                   </div>
                ) : (
                   <div className="bg-white border-4 border-dashed border-slate-100 rounded-[40px] h-[550px] flex flex-col items-center justify-center text-slate-300 p-20 text-center animate-in fade-in">
                     <Wallet size={80} className="mb-6 opacity-10" />
                     <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest font-heading">โปรดเลือกนักเรียน</h3>
                     <p className="text-sm font-bold opacity-60 mt-2">คลิกรายชื่อนักเรียนจากแผงค้นหาทางด้านขวา</p>
                   </div>
                )}
             </div>

             {/* Sidebar: Student List (Search) on the RIGHT, same height/top as form */}
             <div className="w-full lg:w-80 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col shrink-0 lg:h-[550px] animate-in slide-in-from-right-4">
               <div className="p-6 border-b flex items-center gap-3 bg-slate-50/50 rounded-t-[32px]">
                 <Search className="text-slate-400" size={18} />
                 <input type="text" placeholder="ค้นหาชื่อ หรือ รหัส..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent font-bold outline-none text-sm" />
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                 {filteredStudents.map(s => (
                   <button key={s.id} onClick={() => { setSelectedStudentId(s.id); setReceiptToPrint(null); setShowReceiptModal(false); }} className={`w-full text-left p-4 rounded-[20px] border-2 transition-all ${selectedStudentId === s.id ? 'bg-[#00AEEF] border-[#00AEEF] text-white shadow-lg scale-[1.02]' : 'bg-white border-transparent hover:bg-slate-50 text-slate-900'}`}>
                     <p className="font-black text-sm truncate">{s.name}</p>
                     <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${selectedStudentId === s.id ? 'text-sky-100 opacity-80' : 'text-slate-400'}`}>{s.studentId}</p>
                   </button>
                 ))}
                 {filteredStudents.length === 0 && <p className="text-center py-10 text-slate-300 font-bold text-xs uppercase">ไม่พบข้อมูล</p>}
               </div>
             </div>
          </div>

          {/* BOTTOM ROW: History Section */}
          {selectedStudentId && (
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-6">
              <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                    <History className="text-[#00AEEF]" size={18} /> ประวัติการชำระเงินของนักเรียน
                  </h4>
                  <span className="bg-white px-4 py-1 rounded-full border text-[10px] font-black text-slate-400 uppercase">{studentPaymentHistory.length} รายการ</span>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <tr>
                          <th className="px-8 py-4">วันที่</th>
                          <th className="px-8 py-4">ยอดเงิน</th>
                          <th className="px-8 py-4">วิธีชำระ</th>
                          <th className="px-8 py-4 text-right">ใบเสร็จ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {studentPaymentHistory.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-4 text-xs font-bold text-slate-600">{p.date}</td>
                            <td className="px-8 py-4 text-sm font-black text-slate-900">{p.amount.toLocaleString()} ฿</td>
                            <td className="px-8 py-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${p.method === 'CASH' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{p.method}</span>
                            </td>
                            <td className="px-8 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => { setReceiptToPrint(p); setShowReceiptModal(true); }} className="p-2.5 bg-slate-100 text-slate-400 hover:bg-[#00AEEF] hover:text-white rounded-xl transition-all shadow-sm group-hover:scale-105" title="พิมพ์ใบเสร็จ">
                                    <Printer size={16} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeletePayment(p.id); }} 
                                    className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-95 border flex items-center justify-center min-w-[40px] ${
                                      paymentToDelete === p.id 
                                      ? 'bg-red-600 text-white border-red-600 animate-pulse' 
                                      : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-600 hover:text-white'
                                    }`} 
                                    title={paymentToDelete === p.id ? "คลิกอีกครั้งเพื่อยืนยัน" : "ลบรายการ"}
                                  >
                                    {paymentToDelete === p.id ? (
                                      <span className="text-[8px] font-black uppercase whitespace-nowrap px-1">ยืนยัน?</span>
                                    ) : (
                                      <Trash2 size={16} />
                                    )}
                                  </button>
                                </div>
                            </td>
                          </tr>
                        ))}
                        {studentPaymentHistory.length === 0 && (
                          <tr><td colSpan={4} className="py-12 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">ไม่มีประวัติการชำระเงิน</td></tr>
                        )}
                    </tbody>
                  </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Receipt Preview Modal - Center Aligned UI */}
      {showReceiptModal && receiptToPrint && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300 no-print">
          <div className="w-full flex flex-col items-center justify-center space-y-8">
            
            {/* The A5 Receipt Area - Force Center Alignment */}
            <div className="bg-white p-2 rounded-[32px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transform scale-90 sm:scale-100 animate-in zoom-in-95 duration-500 origin-center">
              <div id="receipt-content" className="receipt-container bg-white text-black p-8 md:p-12 w-[210mm] min-h-[148mm] rounded-[24px]">
                 {/* Content Header */}
                 <div className="text-center" style={{ marginBottom: '15px' }}>
                    <h2 className="font-bold" style={{ margin: '0', fontSize: '20px', letterSpacing: '-0.02em' }}>{receiptSettings.schoolName}</h2>
                    <p style={{ margin: '4px 0', fontSize: '11px', opacity: 0.7 }}>{receiptSettings.address}</p>
                    <p style={{ margin: '2px 0', fontSize: '11px', opacity: 0.7 }}>โทร: {receiptSettings.phone}</p>
                    <div className="badge" style={{ fontSize: '13px', border: '1.5px solid #000', padding: '4px 16px', marginTop: '10px', borderRadius: '4px', textTransform: 'uppercase' }}>ใบรับเงิน / Receipt</div>
                 </div>

                 {/* Header: Term and Year */}
                 <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px' }}>
                    <p style={{ margin: 0, fontSize: '12px' }}><span className="font-bold">ภาคเรียนที่:</span> {receiptSettings.term}</p>
                    <p style={{ margin: 0, fontSize: '12px' }}><span className="font-bold">ปีการศึกษา:</span> {receiptSettings.year}</p>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', fontSize: '11px', marginBottom: '15px', borderBottom: '1.5px solid #000', paddingBottom: '15px', marginTop: '5px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                       <p style={{ margin: 0 }}><span className="font-bold">เลขที่บิล:</span> {receiptToPrint.id}</p>
                       <p style={{ margin: 0 }}><span className="font-bold">ชื่อ-นามสกุล:</span> {students.find(s=>s.id===receiptToPrint.studentId)?.name}</p>
                       <p style={{ margin: 0 }}><span className="font-bold">รหัสประจำตัว:</span> {students.find(s=>s.id===receiptToPrint.studentId)?.studentId}</p>
                    </div>
                    <div className="text-right" style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' }}>
                       <p style={{ margin: 0 }}><span className="font-bold">วันที่:</span> {receiptToPrint.date}</p>
                       <p style={{ margin: 0 }}><span className="font-bold">ระดับชั้น:</span> {students.find(s=>s.id===receiptToPrint.studentId)?.level}</p>
                       <p style={{ margin: 0 }}><span className="font-bold">แผนกวิชา:</span> {students.find(s=>s.id===receiptToPrint.studentId)?.department}</p>
                    </div>
                 </div>

                 <div className="border-y" style={{ padding: '15px 0', marginBottom: '20px', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                       <span className="font-bold" style={{ fontSize: '13px' }}>รายการชำระค่าธรรมเนียมการเรียน</span>
                       <span className="font-bold" style={{ fontSize: '13px' }}>{receiptToPrint.amount.toLocaleString()} ฿</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', opacity: 0.6 }}>
                       <span>ช่องทางการชำระเงิน</span>
                       <span>{receiptToPrint.method === 'TRANSFER' ? 'เงินโอน (Transfer)' : 'เงินสด (Cash)'}</span>
                    </div>
                 </div>

                 <div style={{ marginBottom: '30px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span className="font-bold" style={{ fontSize: '14px', textTransform: 'uppercase' }}>ยอดรวมสุทธิ (Total Amount)</span>
                       <span className="font-bold" style={{ fontSize: '24px', borderBottom: '4px double #000', paddingBottom: '2px' }}>{receiptToPrint.amount.toLocaleString()} บาท</span>
                    </div>
                 </div>

                 <div className="signature-area" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', textAlign: 'center', fontSize: '12px', marginTop: 'auto', paddingBottom: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                       <div style={{ width: '180px', borderBottom: '1px dotted #000', marginBottom: '8px' }}></div>
                       <p className="font-bold" style={{ margin: 0, opacity: 0.6, fontSize: '11px' }}>ผู้ชำระเงิน / Payer</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                       <p style={{ margin: '0 0 6px 0', fontSize: '13px' }}>{receiptToPrint.recordedBy || '-'}</p>
                       <div style={{ width: '180px', borderBottom: '1px dotted #000', marginBottom: '8px' }}></div>
                       <p className="font-bold" style={{ margin: 0, opacity: 0.6, fontSize: '11px' }}>ผู้รับเงิน / Receiver</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* Action Bar - Modern Centered Buttons */}
            <div className="flex gap-4 w-full max-w-lg justify-center animate-in slide-in-from-bottom-4 duration-700">
               <button 
                  onClick={() => setShowReceiptModal(false)} 
                  className="flex items-center gap-3 px-8 py-5 bg-white/10 hover:bg-white/20 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.1em] backdrop-blur-md transition-all border border-white/10 active:scale-95"
               >
                  <X size={18} /> ปิดหน้าต่าง
               </button>
               <button 
                  onClick={handlePrint} 
                  className="flex-1 flex items-center justify-center gap-3 px-10 py-5 bg-[#00AEEF] hover:bg-sky-400 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.15em] shadow-[0_20px_40px_-10px_rgba(0,174,239,0.5)] transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95"
               >
                  <Printer size={22} strokeWidth={2.5} /> สั่งพิมพ์ใบเสร็จ (A5)
               </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-print { display: block; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .origin-center { transform-origin: center center; }
      `}} />
    </div>
  );
};

export default TuitionSystem;
