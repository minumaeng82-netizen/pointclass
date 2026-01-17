
import React, { useState, useEffect } from 'react';
import { User, Session, PointRecord, Question, Answer, PreRoutine, Warning, QuizItem, QuizResponse } from '../types';
import { ScienceStore } from '../store';
import { POINT_RULES } from '../constants';
import {
  Home, MessageCircle, HelpCircle, Gift, User as UserIcon,
  ArrowRight, CheckCircle, AlertCircle, Send, Star, LogOut
} from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const StudentApp: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'board' | 'quiz' | 'store'>('home');
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [routineStep, setRoutineStep] = useState<number>(0);
  const [hasMaterials, setHasMaterials] = useState<boolean | null>(null);
  const [isReady, setIsReady] = useState<boolean | null>(null);

  const [points, setPoints] = useState<PointRecord[]>([]);
  const [warning, setWarning] = useState<Warning | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questionText, setQuestionText] = useState('');

  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [quizResponses, setQuizResponses] = useState<QuizResponse[]>([]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); // Polling for session status/warnings
    return () => clearInterval(interval);
  }, [user]);

  const refreshData = () => {
    const session = ScienceStore.getActiveSession(user.classId!);
    setActiveSession(session || null);

    // Grade - based filtering for Questions
    const allStudents = ScienceStore.getStudents();
    const myGrade = user.classId?.split('-')[0];

    const visibleQuestions = ScienceStore.getQuestions().filter(q => {
      if (q.isHidden) return false;
      const author = allStudents.find(s => s.id === q.studentId);
      const authorGrade = author?.classId?.split('-')[0];
      return authorGrade === myGrade;
    });

    setQuestions(visibleQuestions);
    setAnswers(ScienceStore.getAnswers().filter(a => visibleQuestions.some(vq => vq.id === a.questionId) && !a.isHidden));

    if (session) {
      const routine = ScienceStore.getPreRoutines().find(r => r.sessionId === session.id && r.studentId === user.id);
      if (routine && routineStep === 0) setRoutineStep(3); // Already completed

      const wrn = ScienceStore.getWarnings().find(w => w.sessionId === session.id && w.studentId === user.id);
      setWarning(wrn || null);

      setQuizItems(ScienceStore.getQuizItems());
      setQuizResponses(ScienceStore.getQuizResponses().filter(r => r.studentId === user.id));
    }

    setPoints(ScienceStore.getPoints().filter(p => p.studentId === user.id));
  };

  const submitRoutine = (materials: boolean, ready: boolean) => {
    if (!activeSession) return;
    const routines = ScienceStore.getPreRoutines();
    const newRoutine: PreRoutine = { sessionId: activeSession.id, studentId: user.id, hasMaterials: materials, isReady: ready };
    ScienceStore.savePreRoutines([...routines, newRoutine]);
    setRoutineStep(3);
    refreshData();
  };

  const askQuestion = () => {
    if (!activeSession || !questionText.trim()) return;
    const currentQs = ScienceStore.getQuestions();

    // Rule: max 1 per session for points
    const alreadyAsked = currentQs.some(q => q.sessionId === activeSession.id && q.studentId === user.id);

    const newQ: Question = {
      id: Math.random().toString(36).substr(2, 9),
      sessionId: activeSession.id,
      studentId: user.id,
      studentName: user.name,
      text: questionText,
      isPinned: false,
      isHidden: false,
      recommendations: [],
      createdAt: new Date().toISOString()
    };

    ScienceStore.saveQuestions([...currentQs, newQ]);

    if (!alreadyAsked) {
      const p = ScienceStore.getPoints();
      p.push({
        id: Math.random().toString(36).substr(2, 9),
        studentId: user.id,
        sessionId: activeSession.id,
        type: 'EARN',
        bucket: 'HOLD',
        points: POINT_RULES.QUESTION_CREATE,
        reason: '질문 작성',
        createdAt: new Date().toISOString()
      });
      ScienceStore.savePoints(p);
    }

    setQuestionText('');
    refreshData();
  };

  const postAnswer = (qId: string, text: string) => {
    if (!activeSession || !text.trim()) return;
    const currentAns = ScienceStore.getAnswers();
    const alreadyAnswered = currentAns.some(a => a.sessionId === activeSession.id && a.studentId === user.id);

    // Initializing new Answer with required sessionId and isHidden fields
    const newA: Answer = {
      id: Math.random().toString(36).substr(2, 9),
      questionId: qId,
      sessionId: activeSession.id,
      studentId: user.id,
      studentName: user.name,
      text: text,
      isBest: false,
      isHidden: false,
      recommendations: [],
      createdAt: new Date().toISOString()
    };

    ScienceStore.saveAnswers([...currentAns, newA]);

    if (!alreadyAnswered) {
      const p = ScienceStore.getPoints();
      p.push({
        id: Math.random().toString(36).substr(2, 9),
        studentId: user.id,
        sessionId: activeSession.id,
        type: 'EARN',
        bucket: 'HOLD',
        points: POINT_RULES.ANSWER_CREATE,
        reason: '답변 작성',
        createdAt: new Date().toISOString()
      });
      ScienceStore.savePoints(p);
    }
    refreshData();
  };

  const selectBestAnswer = (questionId: string, answerId: string) => {
    // Only the question author can select the best answer
    const question = ScienceStore.getQuestions().find(q => q.id === questionId);
    if (!question || question.studentId !== user.id) return;

    const allAnswers = ScienceStore.getAnswers();
    const targetAnswer = allAnswers.find(a => a.id === answerId);
    if (!targetAnswer) return;

    const updatedAnswers = allAnswers.map(a => {
      if (a.questionId === questionId) {
        return { ...a, isBest: a.id === answerId };
      }
      return a;
    });

    ScienceStore.saveAnswers(updatedAnswers);

    // Award Points to the answer author
    const p = ScienceStore.getPoints();
    p.push({
      id: Math.random().toString(36).substr(2, 9),
      studentId: targetAnswer.studentId,
      sessionId: activeSession?.id, // Optional linkage to session
      type: 'EARN',
      bucket: 'CONFIRMED', // Immediate reward
      points: POINT_RULES.BEST_ANSWER,
      reason: '최고의 답변 선정',
      createdAt: new Date().toISOString()
    });
    ScienceStore.savePoints(p);

    refreshData();
  };

  const solveQuiz = (itemId: string, answer: string) => {
    if (!activeSession) return;
    const item = quizItems.find(i => i.id === itemId);
    if (!item) return;

    const existingResponses = ScienceStore.getQuizResponses();
    const prev = existingResponses.filter(r => r.quizItemId === itemId && r.studentId === user.id);
    if (prev.length >= 2) return; // Max 2 attempts

    const attemptNo = prev.length + 1;
    const isCorrect = answer.trim() === item.correctAnswer;
    const earnedPoints = isCorrect ? (attemptNo === 1 ? POINT_RULES.QUIZ_FIRST_TRY : POINT_RULES.QUIZ_SECOND_TRY) : 0;

    const newResponse: QuizResponse = {
      quizItemId: itemId,
      studentId: user.id,
      attemptNo,
      answer,
      isCorrect,
      earnedPoints
    };

    ScienceStore.saveQuizResponses([...existingResponses, newResponse]);

    if (isCorrect) {
      const p = ScienceStore.getPoints();
      p.push({
        id: Math.random().toString(36).substr(2, 9),
        studentId: user.id,
        sessionId: activeSession.id,
        type: 'EARN',
        bucket: 'HOLD',
        points: earnedPoints,
        reason: `형성평가 정답 (${attemptNo}차)`,
        createdAt: new Date().toISOString()
      });
      ScienceStore.savePoints(p);
    }
    refreshData();
  };

  const confirmedPoints = points.filter(p => p.bucket === 'CONFIRMED').reduce((acc, curr) => acc + (curr.type === 'SPEND' ? -curr.points : curr.points), 0);
  const holdPoints = points.filter(p => p.bucket === 'HOLD').reduce((acc, curr) => acc + curr.points, 0);

  // Pre-Routine flow
  if (activeSession && routineStep < 3) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full animate-in slide-in-from-bottom-10 duration-500">
          {routineStep === 0 && (
            <div className="space-y-8">
              <h2 className="text-4xl font-black">자석의 성질</h2>
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                <p className="text-2xl mb-8">실험 관찰과 교과서를<br />다 챙겼나요?</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => { setHasMaterials(true); setRoutineStep(1); }}
                    className="bg-white text-indigo-600 py-6 rounded-2xl text-2xl font-black shadow-lg hover:scale-105 transition"
                  >
                    네!
                  </button>
                  <button
                    onClick={() => { setHasMaterials(false); setRoutineStep(1); }}
                    className="bg-indigo-400 text-white py-6 rounded-2xl text-2xl font-black border border-white/20 hover:scale-105 transition"
                  >
                    아니오
                  </button>
                </div>
              </div>
            </div>
          )}

          {routineStep === 1 && (
            <div className="space-y-8">
              <div className="bg-white text-indigo-900 p-8 rounded-3xl shadow-2xl space-y-4">
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">오늘의 목표</span>
                <h2 className="text-3xl font-black leading-tight">자석의 같은 극끼리는 밀어내고 다른 극끼리는 끌어당김을 설명하기</h2>
                <div className="pt-4">
                  <button
                    onClick={() => setRoutineStep(2)}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    이해했어요 <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {routineStep === 2 && (
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                <p className="text-2xl mb-8">이제 과학 수업을<br />시작할 준비가 되었나요?</p>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => submitRoutine(hasMaterials || false, true)}
                    className="bg-yellow-400 text-indigo-900 py-6 rounded-2xl text-2xl font-black shadow-lg hover:scale-105 transition"
                  >
                    준비 완료! 🚀
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden pb-16">
      {/* Header */}
      <header className="bg-white border-b p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
            {user.studentNo}
          </div>
          <div>
            <div className="font-bold">{user.name}</div>
            <div className="text-[10px] text-gray-500 uppercase">{user.classId} 과학 시간</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {warning && warning.count > 0 && (
            <div className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-bold border border-red-200 animate-pulse">
              <AlertCircle size={14} /> 경고 {warning.count}/2
            </div>
          )}
          <button onClick={onLogout} className="p-2 text-gray-400"><LogOut size={20} /></button>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {activeTab === 'home' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-600 p-5 rounded-3xl text-white shadow-lg">
                <div className="text-xs text-indigo-100 mb-1">사용 가능 포인트</div>
                <div className="text-3xl font-black">{confirmedPoints}P</div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-400 mb-1">보류 중 포인트</div>
                <div className="text-3xl font-black text-gray-800">{holdPoints}P</div>
                <div className="text-[10px] text-gray-400 mt-1 leading-none">미션 성공 시 지급</div>
              </div>
            </div>

            {warning && warning.count >= 2 && (
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl">
                <p className="text-orange-800 text-sm font-medium">
                  이번 시간에는 기본 포인트를 받을 수 없어요. 😢<br />
                  <span className="font-bold text-orange-600">하지만 걱정 마세요! 다음 차시에 다시 도전하면 보류 포인트를 모두 받을 수 있어요!</span>
                </p>
              </div>
            )}

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Star size={18} className="text-yellow-500" /> 학급 월간 미션 현황
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-bold">
                  <span>미션 달성까지</span>
                  <span className="text-indigo-600">6 / 8회</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '75%' }} />
                </div>
                <p className="text-xs text-gray-400">* 전원 미션 성공 시 보상을 받아요!</p>
              </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-3xl">
              <h3 className="font-bold mb-2 text-indigo-900">오늘의 학습 목표</h3>
              <p className="text-indigo-800 text-sm leading-relaxed">
                {activeSession?.objectiveText || '수업을 기다려주세요.'}
              </p>
            </div>
          </>
        )}

        {activeTab === 'board' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
              <textarea
                placeholder="궁금한 내용을 질문해보세요! (+1P)"
                className="w-full h-24 p-3 bg-gray-50 border-none rounded-2xl resize-none text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
              <button
                onClick={askQuestion}
                disabled={!questionText.trim()}
                className="w-full mt-2 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:bg-gray-200"
              >
                <Send size={18} /> 질문 등록하기
              </button>
            </div>

            <div className="space-y-4">
              {questions.map(q => {
                const qAns = answers.filter(a => a.questionId === q.id);
                return (
                  <div key={q.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">질문</div>
                        {q.isPinned && <Star size={16} className="text-yellow-400 fill-current" />}
                      </div>
                      <div className="font-bold text-gray-800">{q.text}</div>
                      <div className="text-[10px] text-gray-400 mt-2">{q.studentName} 학생 | 답변 {qAns.length}개</div>
                    </div>
                    <div className="p-4 bg-gray-50 space-y-3">
                      {qAns.map(ans => (
                        <div key={ans.id} className={`p-3 rounded-2xl text-sm transition ${ans.isBest ? 'bg-yellow-100 border border-yellow-200' : 'bg-white border border-gray-200'}`}>
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-indigo-500">A.</span>
                              <span className="font-bold text-gray-700">{ans.text}</span>
                            </div>
                            {q.studentId === user.id && !ans.isBest && (
                              <button
                                onClick={() => selectBestAnswer(q.id, ans.id)}
                                className="text-[10px] bg-gray-100 text-gray-400 px-2 py-1 rounded-lg font-bold hover:bg-yellow-100 hover:text-yellow-600 transition"
                              >
                                채택하기
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400">{ans.studentName} {ans.isBest && '• 최고의 답변 선정!'}</div>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="답변을 작성해 보세요... (+1P)"
                          className="flex-1 text-sm p-2 rounded-xl border border-gray-200 outline-none focus:border-indigo-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              postAnswer(q.id, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black px-2">오늘의 확인 문제</h3>
            {quizItems.map((item, idx) => {
              const responses = quizResponses.filter(r => r.quizItemId === item.id);
              const isResolved = responses.some(r => r.isCorrect) || responses.length >= 2;
              const lastResponse = responses[responses.length - 1];

              return (
                <div key={item.id} className={`p-6 rounded-3xl border-2 transition ${isResolved ? (lastResponse?.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-white border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-gray-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                    <span className="font-bold text-lg">{item.prompt}</span>
                  </div>

                  {!isResolved ? (
                    <div className="space-y-2">
                      {item.type === 'MCQ' ? (
                        <div className="grid grid-cols-1 gap-2">
                          {item.choices?.map(choice => (
                            <button
                              key={choice}
                              onClick={() => solveQuiz(item.id, choice)}
                              className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition font-medium"
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="정답 입력"
                            className="flex-1 p-4 rounded-xl border border-gray-200 outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') solveQuiz(item.id, (e.target as HTMLInputElement).value);
                            }}
                          />
                          <button
                            className="bg-indigo-600 text-white px-6 rounded-xl font-bold"
                            onClick={(e) => {
                              const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                              solveQuiz(item.id, input.value);
                            }}
                          >
                            제출
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {lastResponse?.isCorrect ? (
                        <>
                          <CheckCircle className="text-green-600" size={24} />
                          <div className="font-bold text-green-700">정답입니다! (+{lastResponse.earnedPoints}P)</div>
                        </>
                      ) : (
                        <>
                          <XCircle className="text-red-600" size={24} />
                          <div className="font-bold text-red-700">틀렸습니다. (기회 종료)</div>
                        </>
                      )}
                    </div>
                  )}
                  {responses.length === 1 && !lastResponse?.isCorrect && (
                    <div className="mt-4 text-xs font-bold text-red-500 animate-bounce">
                      * 기회가 한 번 더 남았어요! 다시 풀어보세요.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around h-16 px-2 shadow-lg">
        {[
          { id: 'home', icon: <Home size={22} />, label: '홈' },
          { id: 'board', icon: <MessageCircle size={22} />, label: '질문있어요!' },
          { id: 'quiz', icon: <HelpCircle size={22} />, label: '문제풀이' },
          { id: 'store', icon: <Gift size={22} />, label: '상점' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${activeTab === item.id ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            {item.icon}
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// Internal icon for consistency
const XCircle: React.FC<{ className?: string, size?: number }> = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
);

export default StudentApp;
