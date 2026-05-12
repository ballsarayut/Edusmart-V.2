
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Award, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText,
  UserPlus,
  Briefcase,
  Thermometer,
  Settings,
  ShieldCheck,
  Star,
  Activity,
  CreditCard,
  Banknote,
  MessageCircle,
  CloudCog,
  Scan,
  Settings2,
  Megaphone,
  History,
  CalendarDays,
  GraduationCap,
  Building2,
  Calendar,
  Languages
} from 'lucide-react';

export const COLORS = {
  primary: '#0f172a',
  secondary: '#334155',
  accent: '#2563eb',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0891b2',
};

export const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PRESENT: { 
    label: 'มาเรียน', 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: <CheckCircle className="w-4 h-4" /> 
  },
  LATE: { 
    label: 'มาสาย', 
    color: 'bg-amber-100 text-amber-800 border-amber-200', 
    icon: <Clock className="w-4 h-4" /> 
  },
  ABSENT: { 
    label: 'ขาดเรียน', 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: <XCircle className="w-4 h-4" /> 
  },
  BUSINESS_LEAVE: { 
    label: 'ลากิจ', 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: <Briefcase className="w-4 h-4" /> 
  },
  SICK_LEAVE: { 
    label: 'ลาป่วย', 
    color: 'bg-purple-100 text-purple-800 border-purple-200', 
    icon: <Thermometer className="w-4 h-4" /> 
  },
};

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'แผงควบคุมหลัก', icon: <LayoutDashboard />, roles: ['ADMIN', 'TEACHER', 'PARENT', 'FINANCE', 'ACADEMIC'], group: 'MAIN' },
  { id: 'quick_scan', label: 'สแกนเช็คชื่อ (ด่วน)', icon: <Scan />, roles: ['ADMIN', 'TEACHER'], group: 'MAIN' },
  
  { id: 'job_portal', label: 'ประกาศงาน/ฝึกงาน', icon: <Briefcase />, roles: ['ADMIN', 'TEACHER', 'ACADEMIC', 'PARENT', 'COMPANY'], group: 'ACADEMIC' },
  { id: 'broadcast', label: 'ประชาสัมพันธ์ข่าวสาร', icon: <Megaphone />, roles: ['ADMIN', 'TEACHER', 'ACADEMIC'], group: 'ACADEMIC' },
  { id: 'students', label: 'ทะเบียนนักเรียน', icon: <UserPlus />, roles: ['ADMIN', 'TEACHER', 'ACADEMIC'], group: 'ACADEMIC' },
  { id: 'morning', label: 'เช็คชื่อเข้าแถว', icon: <Users />, roles: ['ADMIN', 'TEACHER'], group: 'ACADEMIC' },
  { id: 'subject', label: 'เช็คชื่อรายวิชา', icon: <BookOpen />, roles: ['ADMIN', 'TEACHER'], group: 'ACADEMIC' },
  { id: 'behavior', label: 'คะแนนพฤติกรรม', icon: <Award />, roles: ['ADMIN', 'TEACHER'], group: 'ACADEMIC' },
  { id: 'sermon', label: 'สมุดโอวาท', icon: <GraduationCap />, roles: ['ADMIN', 'TEACHER'], group: 'ACADEMIC' },
  { id: 'english', label: 'คะแนนภาษาอังกฤษ', icon: <Languages />, roles: ['ADMIN', 'TEACHER'], group: 'ACADEMIC' },
  
  { id: 'tuition', label: 'ระบบค่าเทอม', icon: <CreditCard />, roles: ['ADMIN', 'FINANCE'], group: 'FINANCE' },
  { id: 'finance_report', label: 'สรุปรายรับ', icon: <Banknote />, roles: ['ADMIN', 'FINANCE'], group: 'FINANCE' },
  { id: 'line_config', label: 'ตั้งค่าการแจ้งเตือน', icon: <MessageCircle />, roles: ['ADMIN', 'FINANCE'], group: 'FINANCE' },

  { id: 'report', label: 'สรุปรายงานผล', icon: <FileText />, roles: ['ADMIN', 'TEACHER', 'PARENT', 'ACADEMIC'], group: 'ANALYTICS' },
  { id: 'morning_scores', label: 'สรุปคะแนนเข้าแถว', icon: <Star />, roles: ['ADMIN', 'TEACHER', 'ACADEMIC'], group: 'ANALYTICS' },
  { id: 'sermon_summary', label: 'สรุปคะแนนโอวาท', icon: <Award />, roles: ['ADMIN', 'TEACHER', 'ACADEMIC'], group: 'ANALYTICS' },
  
  { id: 'users', label: 'จัดการผู้ใช้', icon: <ShieldCheck />, roles: ['ADMIN'], group: 'SYSTEM' },
  { id: 'audit_logs', label: 'ประวัติการใช้งาน', icon: <History />, roles: ['ADMIN'], group: 'SYSTEM' },
  { id: 'exam_manager', label: 'จัดการวันสอบ', icon: <CalendarDays />, roles: ['ADMIN', 'ACADEMIC'], group: 'SYSTEM' },
  { id: 'scanner_settings', label: 'ตั้งค่าเครื่องสแกน', icon: <Settings2 />, roles: ['ADMIN'], group: 'SYSTEM' },
  { id: 'settings', label: 'ตั้งค่าบล็อกเรียน', icon: <Settings />, roles: ['ADMIN'], group: 'SYSTEM' },
  { id: 'cloud_config', label: 'ตั้งค่าระบบคลาวด์', icon: <CloudCog />, roles: ['ADMIN'], group: 'SYSTEM' },
];

export const MENU_GROUPS = {
  MAIN: 'ภาพรวมระบบ',
  ACADEMIC: 'งานทั่วไป/วิชาการ',
  FINANCE: 'การเงินและค่าเทอม',
  ANALYTICS: 'วิเคราะห์และรายงาน',
  SYSTEM: 'ผู้ดูแลระบบ'
};
