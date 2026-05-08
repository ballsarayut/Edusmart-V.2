import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';
import { syncCollection, saveToFirestore, saveMultipleToFirestore } from './firebaseService';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MorningAttendance from './components/MorningAttendance';
import QuickScan from './components/QuickScan';
import ScannerSettings from './components/ScannerSettings';
import ClassAttendance from './components/ClassAttendance';
import BehaviorSystem from './components/BehaviorSystem';
import StudentManagement from './components/StudentManagement';
import Reports from './components/Reports';
import FinanceReport from './components/FinanceReport';
import UserManagement from './components/UserManagement';
import SystemSettings from './components/SystemSettings';
import ExamManager from './components/ExamManager';
import CloudConfig from './components/CloudConfig';
import LineConfig from './components/LineConfig';
import MorningScoreSummary from './components/MorningScoreSummary';
import TuitionSystem from './components/TuitionSystem';
import NewsBroadcast from './components/NewsBroadcast';
import AuditLogs from './components/AuditLogs';
import JobPortal from './components/JobPortal'; 
import Login from './components/Login';
import { MOCK_STUDENTS, MOCK_ATTENDANCE, MOCK_BEHAVIOR, MOCK_SUBJECTS, MOCK_STUDY_BLOCKS } from './data/mockData';
import { Student, AttendanceRecord, BehaviorRecord, Subject, User, StudyBlock, TuitionConfig, PaymentRecord, NotificationRecord, NewsRecord, LoginLog } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    let savedUser = localStorage.getItem('edusmart_user');
    if (!savedUser) {
        savedUser = sessionStorage.getItem('edusmart_user');
    }
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeMenu, setActiveMenu] = useState(() => {
    let savedMenu = localStorage.getItem('edusmart_active_menu');
    if (!savedMenu) {
        savedMenu = sessionStorage.getItem('edusmart_active_menu');
    }
    return savedMenu || 'dashboard';
  });
  const [isSyncingWithCloud, setIsSyncingWithCloud] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [news, setNews] = useState<NewsRecord[]>([
    {
      id: 'N1',
      title: 'แจ้งวันหยุดราชการ กรณีพิเศษ',
      content: 'วิทยาลัยขอแจ้งหยุดเรียนในวันที่ 24 กรกฎาคม นี้ เพื่อให้นักเรียนได้ทำกิจกรรมจิตอาสา...',
      type: 'INFO',
      targetType: 'ALL',
      authorName: 'อ.สมพงษ์ ใจสว่าง',
      date: '10/06/2567',
      timestamp: new Date().toISOString()
    }
  ]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<string[]>(['1', '2', '3']);
  const [systemUsers, setSystemUsers] = useState<User[]>([
    { id: 'A1', name: 'แอดมิน ระบบ', role: 'ADMIN', username: 'admin', password: '1234', department: 'ส่วนกลาง' },
    { id: 'AC1', name: 'หัวหน้างานฝ่ายวิชาการ', role: 'ACADEMIC', username: 'academic', password: '1234', department: 'งานวิชาการ' },
    { id: 'T1', name: 'อ.สมพงษ์ ใจสว่าง', role: 'TEACHER', username: 'teacher', password: '1234', department: 'เทคโนโลยีสารสนเทศ' },
    { id: 'C1', name: 'บจก. นวัตกรรมซอฟต์แวร์', role: 'COMPANY', username: 'company', password: '1234', companyName: 'บริษัท นวัตกรรมซอฟต์แวร์ จำกัด' },
    { id: 'F1', name: 'ฝ่ายการเงิน', role: 'FINANCE', username: 'finance', password: '1234', department: 'ฝ่ายการเงิน' },
    { id: 'P1', name: 'คุณแม่ของนายสมชาย', role: 'PARENT', username: 'parent', password: '1234', studentId: '1' }
  ]);
  const [tuitionConfigs, setTuitionConfigs] = useState<TuitionConfig[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [studyBlocks, setStudyBlocks] = useState<StudyBlock[]>(MOCK_STUDY_BLOCKS);

  // Sync state to cloud helper
  const syncToCloud = async (type: string, data: any) => {
    if (!isFirebaseReady) return;
    setIsSyncingWithCloud(true);
    try {
      if (!Array.isArray(data)) {
        await saveToFirestore(type, data);
      }
    } catch (e) {
      console.error("Firebase Sync Failed", e);
    } finally {
      setIsSyncingWithCloud(false);
    }
  };

  useEffect(() => {
    // Keep track of firebase connection state
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setIsFirebaseReady(true);
      setFirebaseUser(fbUser);
    });

    // Attempt silent anonymous sign-in to enable Firestore sync if configured
    const initAnon = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.warn("Firebase Anonymous Auth not available", e);
      }
    };
    initAnon();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isFirebaseReady) return;

    // PUBLIC COLLECTIONS
    const unsubNews = syncCollection<NewsRecord>('news', (data) => {
      setNews(data);
    });

    const unsubSubjects = syncCollection<Subject>('subjects', (data) => {
      if (data.length > 0) setSubjects(data);
      else if (isFirebaseReady) {
         const hasSeeded = localStorage.getItem('seeded_subjects');
         if (!hasSeeded) {
           saveMultipleToFirestore('subjects', MOCK_SUBJECTS);
           localStorage.setItem('seeded_subjects', 'true');
         }
      }
    });

    const unsubBlocks = syncCollection<StudyBlock>('blocks', (data) => {
      if (data.length > 0) setStudyBlocks(data);
      else if (isFirebaseReady) {
         const hasSeeded = localStorage.getItem('seeded_blocks');
         if (!hasSeeded) {
           saveMultipleToFirestore('blocks', MOCK_STUDY_BLOCKS);
           localStorage.setItem('seeded_blocks', 'true');
         }
      }
    });

    const unsubTuitionConfigs = syncCollection<TuitionConfig>('tuition_configs', setTuitionConfigs);

    // PRIVATE COLLECTIONS
    let unsubStudents = () => {};
    let unsubAttendance = () => {};
    let unsubBehavior = () => {};
    let unsubPayments = () => {};
    let unsubUsers = () => {};

    if (firebaseUser) {
      unsubStudents = syncCollection<Student>('students', (data) => {
        if (data.length === 0) {
          saveMultipleToFirestore('students', MOCK_STUDENTS);
        }
        if (data.length > 0) setStudents(data);
      });

      unsubAttendance = syncCollection<AttendanceRecord>('attendance', setAttendance);
      unsubBehavior = syncCollection<BehaviorRecord>('behavior', setBehaviorRecords);
      unsubPayments = syncCollection<PaymentRecord>('payments', setPaymentRecords);
      unsubUsers = syncCollection<User>('users', (data) => {
        if (data.length > 0) setSystemUsers(data);
        else if (firebaseUser) {
          saveMultipleToFirestore('users', [
            { id: 'A1', name: 'แอดมิน ระบบ', role: 'ADMIN', username: 'admin', password: '1234', department: 'ส่วนกลาง' },
            { id: 'AC1', name: 'หัวหน้างานฝ่ายวิชาการ', role: 'ACADEMIC', username: 'academic', password: '1234', department: 'งานวิชาการ' },
            { id: 'T1', name: 'อ.สมพงษ์ ใจสว่าง', role: 'TEACHER', username: 'teacher', password: '1234', department: 'เทคโนโลยีสารสนเทศ' },
            { id: 'C1', name: 'บจก. นวัตกรรมซอฟต์แวร์', role: 'COMPANY', username: 'company', password: '1234', companyName: 'บริษัท นวัตกรรมซอฟต์แวร์ จำกัด' },
            { id: 'F1', name: 'ฝ่ายการเงิน', role: 'FINANCE', username: 'finance', password: '1234', department: 'ฝ่ายการเงิน' },
            { id: 'P1', name: 'คุณแม่ของนายสมชาย', role: 'PARENT', username: 'parent', password: '1234', studentId: '1' }
          ]);
        }
      });
    }

    return () => {
      unsubNews();
      unsubSubjects();
      unsubBlocks();
      unsubTuitionConfigs();
      unsubStudents();
      unsubAttendance();
      unsubBehavior();
      unsubPayments();
      unsubUsers();
    };
  }, [isFirebaseReady, firebaseUser]);

  useEffect(() => {
    // Audit logs remain local
  }, []);


  const handleLogin = (userData: User, rememberMe: boolean = false) => {
    const newLog: LoginLog = {
      id: `LOG_${Date.now()}`,
      userId: userData.username,
      userName: userData.name,
      userRole: userData.role,
      timestamp: new Date().toLocaleString('th-TH'),
      deviceInfo: navigator.userAgent
    };
    
    setLoginLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 1000); 
      return updated;
    });
    
    setUser(userData);
    
    if (rememberMe) {
      localStorage.setItem('edusmart_user', JSON.stringify(userData));
      sessionStorage.removeItem('edusmart_user');
    } else {
      sessionStorage.setItem('edusmart_user', JSON.stringify(userData));
      localStorage.removeItem('edusmart_user');
    }
    
    const menuToSet = userData.role === 'COMPANY' ? 'job_portal' : 'dashboard';
    setActiveMenu(menuToSet);
    
    if (rememberMe) {
        localStorage.setItem('edusmart_active_menu', menuToSet);
        sessionStorage.removeItem('edusmart_active_menu');
    } else {
        sessionStorage.setItem('edusmart_active_menu', menuToSet);
        localStorage.removeItem('edusmart_active_menu');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('edusmart_user');
    localStorage.removeItem('edusmart_active_menu');
    sessionStorage.removeItem('edusmart_user');
    sessionStorage.removeItem('edusmart_active_menu');
  };

  const handleSetActiveMenu = (menu: string) => {
    setActiveMenu(menu);
    if (localStorage.getItem('edusmart_user')) {
        localStorage.setItem('edusmart_active_menu', menu);
    } else {
        sessionStorage.setItem('edusmart_active_menu', menu);
    }
  };

  if (!user) return <Login onLogin={handleLogin} systemUsers={systemUsers} />;

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return <Dashboard students={students} attendance={attendance} behavior={behaviorRecords} news={news} notifications={notifications} user={user} studyBlocks={studyBlocks} tuitionConfigs={tuitionConfigs} paymentRecords={paymentRecords} />;
      case 'job_portal': return <JobPortal currentUser={user} students={students} />; 
      case 'broadcast': return <NewsBroadcast students={students} news={news} setNews={(val) => { setNews(val); }} currentUser={user} />;
      case 'quick_scan': return <QuickScan students={students} attendanceRecords={attendance} setAttendanceRecords={setAttendance} />;
      case 'students': return <StudentManagement students={students} setStudents={setStudents} />;
      case 'morning': return <MorningAttendance students={students} setStudents={setStudents} attendanceRecords={attendance} setAttendanceRecords={setAttendance} rooms={rooms} setRooms={setRooms} />;
      case 'subject': return <ClassAttendance students={students} setStudents={setStudents} subjects={subjects} setSubjects={setSubjects} rooms={rooms} setRooms={setRooms} attendanceRecords={attendance} setAttendanceRecords={setAttendance} currentUser={user} />;
      case 'behavior': return <BehaviorSystem students={students} setStudents={setStudents} behaviorRecords={behaviorRecords} setBehaviorRecords={setBehaviorRecords} />;
      case 'tuition': return <TuitionSystem students={students} tuitionConfigs={tuitionConfigs} setTuitionConfigs={setTuitionConfigs} paymentRecords={paymentRecords} setPaymentRecords={setPaymentRecords} user={user} />;
      case 'finance_report': return <FinanceReport students={students} paymentRecords={paymentRecords} tuitionConfigs={tuitionConfigs} />;
      case 'report': return <Reports students={students} attendance={attendance} behavior={behaviorRecords} user={user} studyBlocks={studyBlocks} paymentRecords={paymentRecords} tuitionConfigs={tuitionConfigs} />;
      case 'morning_scores': return <MorningScoreSummary students={students} attendance={attendance} studyBlocks={studyBlocks} />;
      case 'users': return <UserManagement users={systemUsers} setUsers={setSystemUsers} currentUser={user} students={students} />;
      case 'audit_logs': return <AuditLogs logs={loginLogs} setLogs={setLoginLogs} />;
      case 'exam_manager': return <ExamManager studyBlocks={studyBlocks} setStudyBlocks={setStudyBlocks} />;
      case 'scanner_settings': return <ScannerSettings />;
      case 'settings': return <SystemSettings studyBlocks={studyBlocks} setStudyBlocks={setStudyBlocks} />;
      case 'cloud_config': return <CloudConfig students={students} attendance={attendance} behavior={behaviorRecords} payments={paymentRecords} subjects={subjects} />;
      case 'line_config': return <LineConfig />;
      default: return <JobPortal currentUser={user} students={students} />;
    }
  };

  return (
    <Layout activeMenu={activeMenu} setActiveMenu={handleSetActiveMenu} user={user} onLogout={handleLogout} notifications={notifications} setNotifications={setNotifications}>
      {(!isFirebaseReady || isSyncingWithCloud) && (
        <div className="fixed bottom-8 right-8 z-[100] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">
            {isFirebaseReady ? "กำลังซิงค์ข้อมูลกับ Cloud..." : "กำลังเชื่อมต่อระบบ Cloud..."}
          </span>
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};

export default App;
