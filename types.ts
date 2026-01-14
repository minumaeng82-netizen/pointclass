
export type Role = 'teacher' | 'student';

export interface User {
  id: string;
  role: Role;
  name: string;
  classId?: string;
  studentNo?: number;
  pin?: string; // 4-digit PIN
  isFirstLogin?: boolean;
}

export interface Class {
  id: string;
  name: string;
}

export type SessionStatus = 'active' | 'closed' | 'inactive';

export interface Session {
  id: string;
  classId: string;
  date: string;
  period: number;
  status: SessionStatus;
  objectiveTitle: string;
  objectiveText: string;
  adminStudentId?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT';

export interface Attendance {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  loginAt: string;
}

export interface PreRoutine {
  sessionId: string;
  studentId: string;
  hasMaterials: boolean;
  isReady: boolean;
}

export interface Warning {
  sessionId: string;
  studentId: string;
  count: number;
}

export type MissionStatus = 'PASS' | 'FAIL' | 'PENDING';

export interface MissionResult {
  sessionId: string;
  studentId: string;
  status: MissionStatus;
}

export type PointType = 'EARN' | 'SPEND' | 'CONVERT';
export type PointBucket = 'CONFIRMED' | 'HOLD';

export interface PointRecord {
  id: string;
  studentId: string;
  sessionId?: string;
  type: PointType;
  bucket: PointBucket;
  points: number;
  reason: string;
  createdAt: string;
}

export interface Question {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  text: string;
  isPinned: boolean;
  isHidden: boolean;
  recommendations: string[];
  createdAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  text: string;
  isBest: boolean;
  isHidden: boolean;
  recommendations: string[];
  createdAt: string;
}

export interface QuizItem {
  id: string;
  type: 'MCQ' | 'SHORT';
  prompt: string;
  choices?: string[];
  correctAnswer: string;
}

export interface QuizResponse {
  quizItemId: string;
  studentId: string;
  attemptNo: number;
  answer: string;
  isCorrect: boolean;
  earnedPoints: number;
}

export interface StoreItem {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface ClaimRequest {
  id: string;
  studentId: string;
  title: string;
  priceKrw: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ON_ORDER' | 'RECEIVED' | 'REJECTED';
  createdAt: string;
}
