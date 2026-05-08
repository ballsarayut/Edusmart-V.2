
export type UserRole = 'ADMIN' | 'TEACHER' | 'PARENT' | 'FINANCE' | 'ACADEMIC' | 'COMPANY';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  password: string;
  department?: string;
  studentId?: string; 
  email?: string;
  companyName?: string;
  firebaseUid?: string;
}

export interface JobAnnouncement {
  id: string;
  type: 'JOB' | 'INTERNSHIP';
  title: string;
  companyName: string;
  description: string;
  location: string;
  salary?: string;
  contact: string;
  date: string;
  timestamp: string;
  postedBy: string;
  tags: string[];
}

export interface LoginLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  deviceInfo: string;
  ipAddress?: string;
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'BUSINESS_LEAVE' | 'SICK_LEAVE';

export enum ThaiLevel {
  VC1 = 'ปวช. 1',
  VC2 = 'ปวช. 2',
  VC3 = 'ปวช. 3',
  HVC1 = 'ปวส. 1',
  HVC2 = 'ปวส. 2'
}

export enum Department {
  IT = 'เทคโนโลยีสารสนเทศ',
  AUTO = 'ช่างยนต์',
  ELEC = 'ช่างไฟฟ้า',
  MECH = 'ช่างกลโรงงาน',
  ACCOUNT = 'การบัญชี',
  BIZ = 'เทคโนโลยีธุรกิจดิจิทัล',
  PROD = 'เทคนิคการผลิต',
  MACHINE = 'เทคนิคเครื่องกล',
  RETAIL = 'การจัดการธุรกิจค้าปลีก'
}

export interface Student {
  id: string;
  studentId: string;
  name: string;
  level: string; 
  department: string; 
  room: string;
  behaviorScore: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  type: 'MORNING' | 'SUBJECT';
  subjectId?: string;
  status: AttendanceStatus;
  remark?: string;
  timestamp: string;
}

export interface NewsRecord {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'URGENT' | 'EVENT';
  targetType: 'ALL' | 'DEPT' | 'ROOM' | 'INDIVIDUAL';
  targetDept?: string;
  targetMajor?: string;
  targetLevel?: string;
  targetRoom?: string;
  targetStudentIds?: string[]; 
  authorName: string;
  date: string;
  timestamp: string;
}

export interface NotificationRecord {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: 'ABSENT' | 'LATE' | 'LEAVE' | 'INFO';
  date: string;
  timestamp: string;
  isRead: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  level: string;
  department: string;
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  type: 'ADD' | 'DEDUCT';
  score: number;
  reason: string;
  date: string;
  recordedBy: string;
}

export interface TuitionConfig {
  id: string;
  level: string;
  department: string;
  amount: number;
  term: string; 
  blockId?: number;
  dueDate?: string;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  configId: string;
  amount: number;
  method: 'CASH' | 'TRANSFER';
  date: string;
  recordedBy: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
}

export interface StudyBlock {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  holidays: string[];
  examDate?: string;
  examTime?: string; 
}

export interface SystemConfig {
  morningTimeLimit: string;
  scanMode: 'BARCODE_SCANNER' | 'CAMERA';
}
