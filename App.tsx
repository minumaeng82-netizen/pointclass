
import React, { useState, useEffect } from 'react';
import { User, Session } from './types';
import { ScienceStore } from './store';
import TeacherDashboard from './components/TeacherDashboard';
import StudentApp from './components/StudentApp';
import { KeyRound, ShieldAlert, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('3-1');
  
  // Login States
  const [loginStep, setLoginStep] = useState<'selection' | 'pin' | 'changePin'>('selection');
  const [attemptingUser, setAttemptingUser] = useState<User | null>(null);
  const [pinBuffer, setPinBuffer] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const loginAsTeacher = () => {
    const teacher: User = { id: 'T1', role: 'teacher', name: '과학선생님' };
    setCurrentUser(teacher);
  };

  const handleStudentSelect = (student: User) => {
    setAttemptingUser(student);
    setLoginStep('pin');
    setPinBuffer('');
    setError(null);
  };

  const verifyPin = () => {
    if (!attemptingUser) return;
    if (pinBuffer === attemptingUser.pin) {
      if (attemptingUser.isFirstLogin || attemptingUser.pin === '0000') {
        setLoginStep('changePin');
        setPinBuffer('');
      } else {
        completeLogin(attemptingUser);
      }
    } else {
      setError('비밀번호가 일치하지 않습니다.');
      setPinBuffer('');
    }
  };

  const handleChangePin = () => {
    if (newPin.length !== 4) {
      setError('비밀번호는 숫자 4자리여야 합니다.');
      return;
    }
    if (!attemptingUser) return;

    const allStudents = ScienceStore.getStudents();
    const updatedStudents = allStudents.map(s => 
      s.id === attemptingUser.id 
        ? { ...s, pin: newPin, isFirstLogin: false } 
        : s
    );
    ScienceStore.saveStudents(updatedStudents);
    
    completeLogin({ ...attemptingUser, pin: newPin, isFirstLogin: false });
  };

  const completeLogin = (student: User) => {
    setCurrentUser(student);
    const session = ScienceStore.getActiveSession(student.classId!);
    if (session) {
      const attendances = ScienceStore.getAttendances();
      const existing = attendances.find(a => a.sessionId === session.id && a.studentId === student.id);
      if (!existing) {
        const newAttendance = {
          id: Math.random().toString(36).substr(2, 9),
          sessionId: session.id,
          studentId: student.id,
          status: 'PRESENT' as const,
          loginAt: new Date().toISOString()
        };
        ScienceStore.saveAttendances([...attendances, newAttendance]);
      }
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setLoginStep('selection');
    setAttemptingUser(null);
    setPinBuffer('');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-indigo-50 p-4 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8">
          <h1 className="text-3xl font-bold text-center text-indigo-600 mb-8">🧪 과학실 마스터</h1>
          
          {loginStep === 'selection' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-700">학생 로그인</h2>
                  <select 
                    className="p-2 border border-gray-200 rounded-xl bg-white text-sm"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    {ScienceStore.getClasses().map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-5 gap-3 h-72 overflow-y-auto pr-2 custom-scrollbar">
                  {ScienceStore.getStudents(selectedClassId).map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleStudentSelect(s)}
                      className="aspect-square bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-sm font-bold hover:bg-indigo-600 hover:text-white transition group border border-gray-100"
                    >
                      <span className="text-[10px] text-gray-400 group-hover:text-indigo-200">{s.studentNo}번</span>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6 flex justify-center">
                <button 
                  onClick={loginAsTeacher}
                  className="flex items-center gap-2 text-indigo-600 font-bold hover:underline"
                >
                  선생님인가요? 대시보드 입장
                </button>
              </div>
            </div>
          )}

          {loginStep === 'pin' && attemptingUser && (
            <div className="text-center py-6 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-1">{attemptingUser.name}</h2>
              <p className="text-gray-500 mb-6">비밀번호 숫자 4자리를 입력하세요.</p>
              
              <div className="flex justify-center gap-4 mb-8">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 border-indigo-200 ${pinBuffer.length > i ? 'bg-indigo-600' : 'bg-transparent'}`} />
                ))}
              </div>

              {error && <p className="text-red-500 text-sm mb-4 font-bold">{error}</p>}

              <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      if (num === 'C') setPinBuffer('');
                      else if (num === '←') setPinBuffer(p => p.slice(0, -1));
                      else if (pinBuffer.length < 4) {
                        const next = pinBuffer + num;
                        setPinBuffer(next);
                        if (next.length === 4) {
                          // Trigger verification automatically or via button
                        }
                      }
                    }}
                    className="h-16 rounded-2xl bg-gray-50 text-xl font-bold hover:bg-indigo-50 transition"
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setLoginStep('selection')}
                  className="flex-1 py-3 text-gray-500 font-bold"
                >
                  취소
                </button>
                <button 
                  onClick={verifyPin}
                  disabled={pinBuffer.length !== 4}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:bg-gray-300"
                >
                  확인
                </button>
              </div>
            </div>
          )}

          {loginStep === 'changePin' && attemptingUser && (
            <div className="text-center py-6 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-1">비밀번호 변경</h2>
              <p className="text-gray-500 mb-6">최초 로그인 시 비밀번호를 변경해야 합니다.<br/>사용할 숫자 4자리를 입력해주세요.</p>
              
              <input 
                type="password"
                maxLength={4}
                placeholder="0000"
                className="w-full text-center text-4xl tracking-widest font-black py-4 bg-gray-50 border-2 border-indigo-100 rounded-2xl mb-4 outline-none focus:border-indigo-600"
                onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                value={newPin}
              />

              {error && <p className="text-red-500 text-sm mb-4 font-bold">{error}</p>}

              <button 
                onClick={handleChangePin}
                disabled={newPin.length !== 4}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:bg-gray-300 transition"
              >
                비밀번호 저장 및 로그인 <ArrowRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser.role === 'teacher' ? (
        <TeacherDashboard user={currentUser} onLogout={logout} />
      ) : (
        <StudentApp user={currentUser} onLogout={logout} />
      )}
    </div>
  );
};

export default App;
