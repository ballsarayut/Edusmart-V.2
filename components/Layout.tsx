
import React, { useState } from 'react';
import { MENU_ITEMS, MENU_GROUPS } from '../constants';
import { LogOut, Menu, User, Bell, X } from 'lucide-react';
import { NotificationRecord } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  user: any;
  onLogout: () => void;
  notifications?: NotificationRecord[];
  setNotifications?: React.Dispatch<React.SetStateAction<NotificationRecord[]>>;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeMenu, 
  setActiveMenu, 
  user, 
  onLogout,
  notifications = [],
  setNotifications
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const filteredMenuItems = MENU_ITEMS.filter(item => 
    item.roles.includes(user.role)
  );

  const groups = Array.from(new Set(filteredMenuItems.map(item => item.group)));

  const userNotifications = React.useMemo(() => {
    if (user.role !== 'PARENT') return [];
    
    return notifications
      .filter(n => n.studentId === user.studentId)
      .sort((a, b) => {
        const timeA = new Date(`${a.date} ${a.timestamp}`).getTime();
        const timeB = new Date(`${b.date} ${b.timestamp}`).getTime();
        return timeB - timeA;
      });
  }, [notifications, user]);

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleToggleNotif = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && setNotifications && unreadCount > 0) {
      setNotifications(prev => prev.map(n => {
        if (n.studentId === user.studentId) {
          return { ...n, isRead: true };
        }
        return n;
      }));
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] md:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-[280px] bg-slate-900 text-white transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        md:relative md:translate-x-0 border-r border-slate-800 shadow-2xl flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 md:p-8 pb-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
              <span className="text-lg md:text-xl font-bold italic tracking-tighter font-heading">ES</span>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight leading-none font-heading">EduSmart</h1>
              <span className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400 opacity-90 font-heading">CMS Official</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 md:py-6 scrollbar-hide space-y-6">
          {groups.map((groupKey) => (
            <div key={groupKey} className="space-y-1">
              <h3 className="px-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 font-heading">
                {(MENU_GROUPS as any)[groupKey]}
              </h3>
              <div className="space-y-0.5">
                {filteredMenuItems
                  .filter(item => item.group === groupKey)
                  .map((item) => {
                    const isActive = activeMenu === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveMenu(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`
                          w-full group flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 relative
                          ${isActive 
                            ? 'bg-blue-600/10 text-white' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'}
                        `}
                      >
                        <div className="flex items-center gap-3.5 relative z-10">
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                            ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 group-hover:bg-slate-700'}
                          `}>
                            {React.cloneElement(item.icon as React.ReactElement<any>, { size: 14 })}
                          </div>
                          <span className={`text-sm font-medium transition-all duration-300 font-heading ${isActive ? 'translate-x-1' : ''}`}>
                            {item.label}
                          </span>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50 shrink-0">
          <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-white border border-white/10 shrink-0">
                <User size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate font-heading">{user.name}</p>
                <p className="text-[10px] font-medium text-slate-500 truncate uppercase font-heading">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all duration-300 font-bold text-[10px] uppercase tracking-wider font-heading border border-red-500/20"
            >
              <LogOut size={12} /> ออกจากระบบ
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-[40] sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl transition-all"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight leading-none font-heading line-clamp-1">
                {MENU_ITEMS.find(i => i.id === activeMenu)?.label}
              </h2>
              <p className="md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">EduSmart CMS</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {user.role === 'PARENT' && (
              <div className="relative">
                <button 
                  onClick={handleToggleNotif}
                  className={`p-2.5 rounded-xl transition-all relative group ${isNotifOpen ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                >
                  <Bell size={18} className={unreadCount > 0 ? "animate-[swing_2s_ease-in-out_infinite]" : ""} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10 px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}
            
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />
            
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-900 leading-none font-heading">{user.name}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase font-heading">{user.department || 'Official'}</p>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900 border border-slate-200 shrink-0">
                <User size={18} />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 scroll-smooth scrollbar-hide">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes swing {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
        }
      `}} />
    </div>
  );
};

export default Layout;
