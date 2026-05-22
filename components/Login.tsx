
import React, { useState } from 'react';
import { User as UserIcon, Lock, ArrowRight, ShieldCheck, AlertCircle, Sparkles, GraduationCap, Banknote, BookOpen, Building2 } from 'lucide-react';
import { User, Student } from '../types';

interface LoginProps {
  onLogin: (user: User, rememberMe: boolean) => void;
  systemUsers: User[];
  students?: Student[];
}

const Login: React.FC<LoginProps> = ({ onLogin, systemUsers, students = [] }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // 1. Check system users
    const foundUser = systemUsers.find(
      (u) => u.username === username && u.password === password
    );

    if (foundUser) {
      onLogin(foundUser, rememberMe);
      return;
    }

    // 2. Check student ID login (Username === Password === studentId)
    if (username && username === password) {
      const student = students.find(s => s.studentId === username);
      if (student) {
        const studentUser: User = {
          id: student.id,
          name: student.name,
          role: 'PARENT', // Using PARENT role as it has the logic for studentId views
          username: student.studentId,
          password: student.studentId,
          studentId: student.studentId,
          department: student.department
        };
        onLogin(studentUser, rememberMe);
        return;
      }
    }

    setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่');
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    const foundUser = systemUsers.find(usr => usr.username === u && usr.password === p);
    if (foundUser) onLogin(foundUser, rememberMe);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[800px] h-[800px] bg-indigo-100/40 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-[480px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        {/* Brand Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group mb-4">
            <div className="absolute -inset-4 bg-blue-600/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative w-20 h-20 bg-white border border-slate-100 rounded-[28px] flex items-center justify-center shadow-xl shadow-blue-200/40 transition-all duration-500">
              <GraduationCap size={44} className="text-blue-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 tracking-tight text-center leading-none font-heading">
            Edu<span className="text-blue-600">Smart</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 opacity-80">Institutional CMS Portal</p>
        </div>

        {/* Form Container */}
        <div className="bg-white/90 backdrop-blur-2xl border border-white rounded-[40px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] p-10 md:p-14">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-heading">เข้าใช้งานระบบ</h2>
            <p className="text-slate-500 text-sm mt-1">โปรดระบุข้อมูลเพื่อยืนยันตัวตน</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-4">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-semibold leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">ชื่อบัญชีผู้ใช้งาน</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all">
                  <UserIcon size={20} />
                </div>
                <input 
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl pl-12 pr-6 py-4 text-base font-medium text-slate-900 outline-none transition-all placeholder:text-slate-300"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">รหัสผ่าน</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all">
                  <Lock size={20} />
                </div>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl pl-12 pr-6 py-4 text-base font-medium text-slate-900 outline-none transition-all placeholder:text-slate-300"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pl-1 whitespace-nowrap">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded-md checked:border-blue-600 checked:bg-blue-600 transition-all cursor-pointer"
                  />
                  <div className="absolute opacity-0 peer-checked:opacity-100 pointer-events-none text-white scale-50 peer-checked:scale-100 transition-all duration-300">
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                  จดจำรหัสผ่าน
                </span>
              </label>
            </div>

            <button 
              type="submit"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="w-full h-16 relative group overflow-hidden bg-slate-900 rounded-2xl transition-all duration-300 shadow-xl active:scale-[0.98] mt-4"
            >
              <div className={`absolute inset-0 bg-blue-600 transition-transform duration-500 ease-in-out ${isHovered ? 'translate-x-0' : '-translate-x-full'}`}></div>
              <div className="flex items-center justify-center gap-3 relative z-10">
                <span className="text-base font-bold text-white font-heading tracking-tight">ยืนยันและเข้าสู่ระบบ</span>
                <ArrowRight size={20} className={`text-white transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
              </div>
            </button>
          </form>


        </div>
        
        <div className="mt-10 flex flex-col items-center gap-1 opacity-30">
          <p className="text-center text-slate-900 font-bold text-[9px] uppercase tracking-widest font-heading">
            Secured Institutional Network
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
