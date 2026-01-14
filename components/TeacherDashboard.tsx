
import React, { useState, useEffect } from 'react';
import { User, Session, Class, Attendance, PreRoutine, Warning, Question, Answer, PointRecord } from '../types';
import { ScienceStore } from '../store';
import { POINT_RULES } from '../constants';
import { 
  Users, PlayCircle, StopCircle, Bell, MessageSquare, 
  HelpCircle, ShoppingCart, Settings, LogOut, Star, CheckCircle, XCircle,
  Plus, Trash2, Key, Eye, EyeOff, Save
} from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const TeacherDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'students' | 'board' | 'quiz' | 'store' | 'settings'>('status');
  const [selectedClass, setSelectedClass] = useState<Class>(ScienceStore.getClasses()[0]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  
  // Data States
  const [students, setStudents] = useState<User[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [preRoutines, setPreRoutines] = useState<PreRoutine[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);

  // Student Management UI State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNo, setNewStudentNo] = useState<number>(0);
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  useEffect(() => {
    refreshData();
  }, [selectedClass]);

  const refreshData = () => {
    setStudents(ScienceStore.getStudents(selectedClass.id));
    setActiveSession(ScienceStore.getActiveSession(selectedClass.id) || null);
    setAttendances(ScienceStore.getAttendances());
    setPreRoutines(ScienceStore.getPreRoutines());
    setWarnings(ScienceStore.getWarnings());
    setQuestions(ScienceStore.getQuestions());
    setAnswers(ScienceStore.getAnswers());
  };

  const startSession = () => {
    const newSession: Session = {
      id: `SES-${Date.now()}`,
      classId: selectedClass.id,
      date: new Date().toLocaleDateString(),
      period: 1,
      status: 'active',
      objectiveTitle: '자석의 성질',
      objectiveText: '자석의 같은 극끼리는 밀어내고 다른 극끼리는 끌어당김을 설명할 수 있다.'
    };
    const sessions = ScienceStore.getSessions();
    ScienceStore.saveSessions([...sessions, newSession]);
    setActiveSession(newSession);
    refreshData();
  };

  const endSession = () => {
    if (!activeSession) return;
    if (!confirm('수업을 종료하시겠습니까?')) return;
    const updatedSessions = ScienceStore.getSessions().map(s => s.id === activeSession.id ? { ...s, status: 'closed' as const } : s);
    ScienceStore.saveSessions(updatedSessions);
    setActiveSession(null);
    refreshData();
  };

  // Student Management Logic
  const addStudent = () => {
    if (!newStudentName) return;
    const allStudents = ScienceStore.getStudents();
    const newStudent: User = {
      id: `S-${selectedClass.id}-${Date.now()}`,
      role: 'student',
      name: newStudentName,
      classId: selectedClass.id,
      studentNo: newStudentNo || students.length + 1,
      pin: '0000',
      isFirstLogin: true
    };
    ScienceStore.saveStudents([...allStudents, newStudent]);
    setNewStudentName('');
    setNewStudentNo(0);
    setShowAddModal(false);
    refreshData();
  };

  const deleteStudent = (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const filtered = ScienceStore.getStudents().filter(s => s.id !== id);
    ScienceStore.saveStudents(filtered);
    refreshData();
  };

  const updateStudentPin = (id: string, newPin: string) => {
    if (newPin.length !== 4) return;
    const updated = ScienceStore.getStudents().map(s => s.id === id ? { ...s, pin: newPin, isFirstLogin: false } : s);
    ScienceStore.saveStudents(updated);
    refreshData();
  };

  const sendWarning = (studentId: string) => {
    if (!activeSession) return;
    const currentWarnings = [...warnings];
    const existing = currentWarnings.find(w => w.sessionId === activeSession.id && w.studentId === studentId);
    if (existing) {
      if (existing.count < 2) existing.count += 1;
    } else {
      currentWarnings.push({ sessionId: activeSession.id, studentId, count: 1 });
    }
    ScienceStore.saveWarnings(currentWarnings);
    refreshData();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-20 lg:w-64 bg-indigo-900 text-indigo-100 flex flex-col p-4 shadow-xl z-20">
        <div className="mb-10 flex items-center gap-2 px-2">
          <div className="bg-white p-2 rounded-xl text-indigo-900">
            <Users size={24} />
          </div>
          <h1 className="hidden lg:block text-xl font-bold">과학실 마스터</h1>
        </div>
        
        <nav className="flex-1 space-y-1">
          {[
            { id: 'status', label: '수업 현황', icon: <Users size={20} /> },
            { id: 'students', label: '학생 관리', icon: <Settings size={20} /> },
            { id: 'board', label: '질문/답변', icon: <MessageSquare size={20} /> },
            { id: 'quiz', label: '형성평가', icon: <HelpCircle size={20} /> },
            { id: 'store', label: '상점 POS', icon: <ShoppingCart size={20} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition font-medium ${activeTab === tab.id ? 'bg-white text-indigo-900 shadow-md' : 'hover:bg-indigo-800'}`}
            >
              {tab.icon}
              <span className="hidden lg:block">{tab.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={onLogout} className="flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl hover:bg-red-800 text-red-200 mt-auto transition">
          <LogOut size={20} />
          <span className="hidden lg:block">로그아웃</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <select 
              className="bg-gray-100 border-none rounded-lg px-3 py-2 font-bold text-gray-700"
              value={selectedClass.id}
              onChange={(e) => {
                const c = ScienceStore.getClasses().find(cl => cl.id === e.target.value);
                if (c) setSelectedClass(c);
              }}
            >
              {ScienceStore.getClasses().map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            {!activeSession ? (
              <button 
                onClick={startSession}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition shadow-md font-bold"
              >
                <PlayCircle size={20} /> 수업 시작
              </button>
            ) : (
              <button 
                onClick={endSession}
                className="bg-red-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-red-700 transition shadow-md font-bold"
              >
                <StopCircle size={20} /> 수업 종료
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'status' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">실시간 수업 현황</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {students.map(s => {
                      const isPresent = attendances.some(a => a.sessionId === activeSession?.id && a.studentId === s.id);
                      const routine = preRoutines.find(r => r.sessionId === activeSession?.id && r.studentId === s.id);
                      const warning = warnings.find(w => w.sessionId === activeSession?.id && w.studentId === s.id);
                      return (
                        <div key={s.id} className={`p-5 rounded-2xl border-2 flex items-center justify-between transition ${isPresent ? 'bg-white border-indigo-100' : 'bg-gray-50 border-dashed border-gray-200 opacity-60'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${isPresent ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
                              {s.studentNo}
                            </div>
                            <div>
                              <div className="font-black text-gray-800">{s.name}</div>
                              {isPresent && (
                                <div className="text-xs font-bold space-x-2 mt-1">
                                  <span className={routine?.hasMaterials ? 'text-green-600' : 'text-red-600'}>재료:{routine?.hasMaterials ? 'O' : 'X'}</span>
                                  <span className={routine?.isReady ? 'text-blue-600' : 'text-gray-300'}>준비:{routine?.isReady ? 'O' : 'X'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {isPresent && activeSession && (
                            <div className="flex items-center gap-3">
                              {warning && warning.count > 0 && (
                                <span className="bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded-lg font-black border border-red-200">
                                  경고 {warning.count}
                                </span>
                              )}
                              <button onClick={() => sendWarning(s.id)} className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition">
                                <Bell size={20} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-4">현재 학습 목표</h3>
                  {activeSession ? (
                    <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <div className="text-indigo-900 font-black text-lg mb-2">{activeSession.objectiveTitle}</div>
                      <p className="text-gray-600 text-sm leading-relaxed">{activeSession.objectiveText}</p>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm italic py-4 text-center">수업을 시작해주세요.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold">학급 학생 명부</h3>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition font-bold"
                >
                  <Plus size={20} /> 학생 추가
                </button>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">번호</th>
                      <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">이름</th>
                      <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">비밀번호</th>
                      <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.sort((a,b) => (a.studentNo || 0) - (b.studentNo || 0)).map(s => (
                      <tr key={s.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-black text-indigo-600">{s.studentNo}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{s.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono bg-gray-100 px-3 py-1 rounded text-lg font-bold">
                              {visiblePins[s.id] ? s.pin : '****'}
                            </span>
                            <button 
                              onClick={() => setVisiblePins(prev => ({...prev, [s.id]: !prev[s.id]}))}
                              className="text-gray-400 hover:text-indigo-600 transition"
                            >
                              {visiblePins[s.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <button 
                              onClick={() => {
                                const newP = prompt('새 비밀번호 4자리를 입력하세요:', '0000');
                                if (newP && newP.length === 4) updateStudentPin(s.id, newP);
                              }}
                              className="p-1 text-gray-400 hover:text-indigo-600 transition"
                              title="비밀번호 수정"
                            >
                              <Key size={18} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => deleteStudent(s.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ... other tabs like board, quiz, store remain similar to the previous version ... */}
        </main>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black mb-6">새 학생 등록</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">출석 번호</label>
                <input 
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold"
                  placeholder="26"
                  value={newStudentNo || ''}
                  onChange={(e) => setNewStudentNo(parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">이름</label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold"
                  placeholder="홍길동"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed italic">* 초기 비밀번호는 0000으로 설정되며 학생이 첫 로그인 시 변경하게 됩니다.</p>
            </div>
            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold"
              >
                취소
              </button>
              <button 
                onClick={addStudent}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
