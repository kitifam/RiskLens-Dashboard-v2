import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  MessageSquare, 
  Bot, 
  User, 
  ChevronRight, 
  CheckCircle2,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  InterviewState, 
  InterviewQuestion,
  analyzeInputAndSelectFlow,
  QUESTION_TEMPLATES,
  generateRiskStatement
} from '../lib/riskInterview';
import { Risk } from '../types/risk';

interface RiskInterviewProps {
  onComplete: (riskData: Partial<Risk>) => void;
  onCancel: () => void;
}

export function RiskInterview({ onComplete, onCancel }: RiskInterviewProps) {
  const [state, setState] = useState<InterviewState>({
    stage: 'initial',
    originalInput: '',
    extractedInfo: {},
    questionsAsked: []
  });
  const [input, setInput] = useState('');
  const [currentFlow, setCurrentFlow] = useState<string>('generic');
  const [questionIndex, setQuestionIndex] = useState(0);

  // เริ่มต้น - วิเคราะห์ input แรก
  const handleInitialSubmit = () => {
    if (!input.trim()) return;
    
    const analysis = analyzeInputAndSelectFlow(input);
    setCurrentFlow(analysis.flow);
    setState(prev => ({
      ...prev,
      originalInput: input,
      stage: 'clarifying',
      extractedInfo: {
        ...prev.extractedInfo,
        isRisk: analysis.suggestedType === 'risk'
      }
    }));
    setInput('');
    setQuestionIndex(0);
  };

  // ตอบคำถามต่อเนื่อง
  const handleAnswer = (answer: string | string[]) => {
    const currentQ = QUESTION_TEMPLATES[currentFlow]?.[questionIndex];
    if (!currentQ) return;

    // เก็บคำตอบ
    setState(prev => ({
      ...prev,
      extractedInfo: {
        ...prev.extractedInfo,
        [currentQ.id]: answer
      },
      questionsAsked: [...prev.questionsAsked, currentQ.id]
    }));

    // ไปคำถามถัดไป หรือสรุป
    const nextIndex = questionIndex + 1;
    const questions = QUESTION_TEMPLATES[currentFlow] || [];
    
    if (nextIndex < questions.length) {
      setQuestionIndex(nextIndex);
    } else {
      setState(prev => ({ ...prev, stage: 'summary' }));
    }
  };

  // สร้าง risk สมบูรณ์
  const handleComplete = () => {
    const result = generateRiskStatement(state);
    onComplete({
      title: result.title,
      description: result.description,
      type: state.extractedInfo.isRisk ? 'risk' : 'issue',
      likelihood: result.likelihood,
      impact: result.impact,
      score: result.likelihood * result.impact
    });
  };

  // ข้ามคำถามนี้
  const handleSkip = () => {
    const nextIndex = questionIndex + 1;
    const questions = QUESTION_TEMPLATES[currentFlow] || [];
    if (nextIndex < questions.length) {
      setQuestionIndex(nextIndex);
    } else {
      setState(prev => ({ ...prev, stage: 'summary' }));
    }
  };

  const currentQuestion = QUESTION_TEMPLATES[currentFlow]?.[questionIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5 text-indigo-400" />
            AI Risk Interviewer
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs">
              BETA
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Chat History */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {/* ข้อความเริ่มต้น */}
            {state.originalInput && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-200 flex-1">
                  {state.originalInput}
                </div>
              </div>
            )}

            {/* AI ถาม */}
            {state.stage !== 'initial' && currentQuestion && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center shrink-0 border border-indigo-500/30">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3">
                    <p className="text-sm text-slate-200">{currentQuestion.question}</p>
                    {currentQuestion.context && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        💡 {currentQuestion.context}
                      </p>
                    )}
                  </div>
                  
                  {/* ตัวเลือก */}
                  <div className="space-y-2">
                    {currentQuestion.type === 'single_choice' && currentQuestion.options?.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer(opt.value)}
                        className="w-full text-left p-3 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 hover:border-cyan-500/50 transition-all text-sm text-slate-300"
                      >
                        <div className="flex items-center justify-between">
                          <span>{opt.label}</span>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </button>
                    ))}
                    
                    {currentQuestion.type === 'multiple_choice' && (
                      <div className="space-y-2">
                        {currentQuestion.options?.map(opt => (
                          <label key={opt.value} className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-950 cursor-pointer hover:bg-slate-800">
                            <input 
                              type="checkbox" 
                              value={opt.value}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const current = (state.extractedInfo[currentQuestion.id] as string[]) || [];
                                const updated = checked 
                                  ? [...current, opt.value]
                                  : current.filter(v => v !== opt.value);
                                handleAnswer(updated);
                              }}
                              className="w-4 h-4 rounded border-slate-600 text-cyan-500"
                            />
                            <span className="text-sm text-slate-300">{opt.label}</span>
                          </label>
                        ))}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleSkip()}
                          className="w-full mt-2"
                        >
                          ข้ามคำถามนี้ →
                        </Button>
                      </div>
                    )}
                    
                    {currentQuestion.type === 'text' && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAnswer(input)}
                          placeholder="พิมพ์คำตอบ..."
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 outline-none"
                        />
                        <Button size="sm" onClick={() => handleAnswer(input)} disabled={!input.trim()}>
                          ส่ง
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* สรุป */}
            {state.stage === 'summary' && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-emerald-300 mb-2">
                    ✅ สรุป Risk Statement
                  </h4>
                  {(() => {
                    const result = generateRiskStatement(state);
                    return (
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-slate-500">Title:</span>
                          <p className="text-slate-200 font-medium">{result.title}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Description:</span>
                          <p className="text-slate-300">{result.description}</p>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-slate-500">Likelihood:</span>
                            <span className="text-cyan-400 font-bold ml-1">{result.likelihood}/5</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Impact:</span>
                            <span className="text-orange-400 font-bold ml-1">{result.impact}/5</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Score:</span>
                            <span className={cn(
                              "font-bold ml-1",
                              result.likelihood * result.impact >= 15 ? "text-red-400" : "text-yellow-400"
                            )}>
                              {result.likelihood * result.impact}/25
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 italic">{result.reasoning}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          {state.stage !== 'initial' && state.stage !== 'summary' && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: `${((questionIndex) / (QUESTION_TEMPLATES[currentFlow]?.length || 1)) * 100}%` }}
                />
              </div>
              <span>{questionIndex + 1} / {QUESTION_TEMPLATES[currentFlow]?.length || 1}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-slate-800">
            <Button variant="ghost" onClick={onCancel}>
              ยกเลิก
            </Button>
            
            {state.stage === 'initial' ? (
              <Button 
                onClick={handleInitialSubmit}
                disabled={!input.trim()}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                เริ่มสัมภาษณ์
              </Button>
            ) : state.stage === 'summary' ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setState(prev => ({ ...prev, stage: 'clarifying', questionsAsked: [] }))}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  เริ่มใหม่
                </Button>
                <Button onClick={handleComplete} className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ใช้ Risk นี้
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}