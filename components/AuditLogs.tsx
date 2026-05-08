
import React, { useState, useMemo } from 'react';
import { LoginLog } from '../types';
import { 
  History, 
  Search, 
  Smartphone, 
  Monitor, 
  User, 
  Clock, 
  Shield, 
  Filter,
  Trash2,
  Calendar,
  ChevronRight,
  Info
} from 'lucide-react';

interface AuditLogsProps {
  logs: LoginLog[];
  setLogs: React.Dispatch<React.SetStateAction<LoginLog[]>>;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ logs, setLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch = 
          log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
          log.userId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'ALL' || log.userRole === filterRole;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [logs, searchTerm, filterRole]);

  const clearLogs = () => {
    if (confirm('คุณต้องการล้างประวัติการเข้าใช้งานทั้งหมดหรือไม่? (ข้อมูลนี้ไม่สามารถกู้คืนได้)')) {
      setLogs([]);
    }
  };

  const getDeviceIcon = (ua: string) => {
    if (/mobile|android|iphone/i.test(ua)) return <Smartphone size={16} className="text-blue-500" />;
    return <Monitor size={16} className="text-slate-500" />;
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 rounded-[24px] text-white shadow-xl">
            <History size={28} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-heading uppercase">Login Audit Logs</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ประวัติการเข้าใช้งานระบบโดยละเอียด</p>
          </div>
        </div>
        <button 
          onClick={clearLogs}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all font-heading"
        >
          <Trash2 size={16} /> ล้างประวัติทั้งหมด
        </button>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อผู้ใช้ หรือ User ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-3.5 bg-slate-100 rounded-2xl text-slate-400">
            <Filter size={18} />
          </div>
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="flex-1 md:w-48 bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none cursor-pointer"
          >
            <option value="ALL">ทุกบทบาท</option>
            <option value="ADMIN">ADMIN</option>
            <option value="TEACHER">TEACHER</option>
            <option value="PARENT">PARENT</option>
            <option value="FINANCE">FINANCE</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">วันเวลาที่เข้าใช้งาน</th>
                <th className="px-8 py-5">ผู้ใช้งาน</th>
                <th className="px-8 py-5">บทบาท</th>
                <th className="px-8 py-5">อุปกรณ์ / ข้อมูลเบราว์เซอร์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{log.timestamp.split(' ')[0]}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{log.timestamp.split(' ')[1]} น.</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black text-xs">
                        {log.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{log.userName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: {log.userId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      log.userRole === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      log.userRole === 'TEACHER' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      log.userRole === 'PARENT' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {log.userRole}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 max-w-xs md:max-w-md">
                      <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                        {getDeviceIcon(log.deviceInfo)}
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 line-clamp-1 leading-tight uppercase tracking-tighter">
                        {log.deviceInfo}
                      </p>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <History size={64} />
                      <p className="text-sm font-black uppercase tracking-[0.3em]">ยังไม่มีข้อมูลประวัติการใช้งาน</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100 flex gap-4">
        <Info className="text-blue-600 shrink-0" size={24} />
        <div>
          <p className="text-sm font-black text-blue-900 font-heading uppercase">Security Note</p>
          <p className="text-xs text-blue-800 font-bold leading-relaxed mt-1">
            ระบบจะบันทึกทุกครั้งที่มีการเข้าสู่ระบบสำเร็จ ข้อมูลนี้ช่วยให้ผู้ดูแลระบบตรวจสอบความผิดปกติ เช่น การเข้าใช้งานจากสถานที่หรืออุปกรณ์ที่ไม่คุ้นเคยได้
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
