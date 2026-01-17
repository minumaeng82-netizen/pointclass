
import {
  User, Class, Session, Attendance, PreRoutine, Warning,
  MissionResult, PointRecord, Question, Answer, QuizItem,
  QuizResponse, StoreItem, ClaimRequest
} from './types';

// Mock Initial Data
const INITIAL_CLASSES: Class[] = [
  { id: '3-1', name: '3학년 1반' },
  { id: '3-2', name: '3학년 2반' },
  { id: '4-1', name: '4학년 1반' },
];

const DEFAULT_STUDENTS: User[] = Array.from({ length: 25 }, (_, i) => ({
  id: `S-3-1-${i + 1}`,
  role: 'student',
  name: `학생 ${i + 1}`,
  classId: '3-1',
  studentNo: i + 1,
  pin: '0000',
  isFirstLogin: true
}));

const INITIAL_STORE: StoreItem[] = [
  { id: 'item-1', name: '마이쮸', price: 2, isActive: true },
  { id: 'item-2', name: '비타민C', price: 1, isActive: true },
  { id: 'item-3', name: '멘토스', price: 3, isActive: true },
  { id: 'item-4', name: '실험 키트(대형)', price: 15, isActive: true },
];

const INITIAL_QUIZ: QuizItem[] = [
  { id: 'q1', type: 'MCQ', prompt: '광합성에 필요한 기체는?', choices: ['산소', '이산화탄소', '질소', '수소'], correctAnswer: '이산화탄소' },
  { id: 'q2', type: 'SHORT', prompt: '액체에서 기체로 변하는 현상은?', correctAnswer: '기화' },
];

// LocalStorage Helper
const load = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const save = <T,>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const ScienceStore = {
  getClasses: () => load<Class[]>('classes', INITIAL_CLASSES),
  saveClasses: (classes: Class[]) => save('classes', classes),

  getStudents: (classId?: string) => {
    const students = load<User[]>('students', DEFAULT_STUDENTS);
    return classId ? students.filter(s => s.classId === classId) : students;
  },
  saveStudents: (students: User[]) => save('students', students),

  getSessions: () => load<Session[]>('sessions', []),
  saveSessions: (sessions: Session[]) => save('sessions', sessions),

  getActiveSession: (classId: string) => load<Session[]>('sessions', []).find(s => s.classId === classId && s.status === 'active'),

  getAttendances: () => load<Attendance[]>('attendances', []),
  saveAttendances: (attendances: Attendance[]) => save('attendances', attendances),

  getPreRoutines: () => load<PreRoutine[]>('preRoutines', []),
  savePreRoutines: (routines: PreRoutine[]) => save('preRoutines', routines),

  getWarnings: () => load<Warning[]>('warnings', []),
  saveWarnings: (warnings: Warning[]) => save('warnings', warnings),

  getPoints: () => load<PointRecord[]>('points', []),
  savePoints: (points: PointRecord[]) => save('points', points),

  getQuestions: () => load<Question[]>('questions', []),
  saveQuestions: (questions: Question[]) => save('questions', questions),

  getAnswers: () => load<Answer[]>('answers', []),
  saveAnswers: (answers: Answer[]) => save('answers', answers),

  getQuizItems: () => INITIAL_QUIZ,
  getQuizResponses: () => load<QuizResponse[]>('quizResponses', []),
  saveQuizResponses: (res: QuizResponse[]) => save('quizResponses', res),

  getMissionResults: () => load<MissionResult[]>('missionResults', []),
  saveMissionResults: (res: MissionResult[]) => save('missionResults', res),

  getStoreItems: () => INITIAL_STORE,

  getClaims: () => load<ClaimRequest[]>('claims', []),
  saveClaims: (claims: ClaimRequest[]) => save('claims', claims),
};
