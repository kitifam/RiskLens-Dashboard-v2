import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { DatePicker } from './ui/DatePicker';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { calculateScore, getRiskLevel, cn, formatCurrency } from '../lib/utils';
import { analyzeRiskWithGemini, AIAnalysisResult } from '../lib/ai';
import { BusinessUnit, RiskType, Risk } from '../types/risk';
import { useDebounce } from '../lib/hooks';
import { 
  CheckCircle2, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  Loader2, 
  Sparkles, 
  PenLine, 
  Wand2, 
  XCircle,
  History,
  BrainCircuit,
  MessageSquare,
  FormInput,
  ChevronRight,
  Bot,
  User,
  Cloud,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRisks } from '../contexts/RiskContext';
import { useAuth } from '../contexts/AuthContext';
import { addScore } from '../data/mockUsers';
import { getRBACRole } from '../types/user';
import { getCriticalRiskThreshold, notifyCriticalRisk } from '../lib/notifications';

// ✅ Import Risk Interview types and functions
import { 
  InterviewState, 
  InterviewQuestion,
  analyzeInputAndSelectFlow,
  QUESTION_TEMPLATES,
  generateRiskStatement
} from '../lib/riskInterview';

interface RiskFormData {
  title: string;
  description: string;
  businessUnit: BusinessUnit | '';
  type: RiskType;
  likelihood: number;
  impact: number;
  expectedDate: string;
  financialImpact: number;
}

const INITIAL_DATA: RiskFormData = {
  title: '',
  description: '',
  businessUnit: '',
  type: 'risk',
  likelihood: 1,
  impact: 1,
  expectedDate: '',
  financialImpact: 0,
};

interface AddRiskFormProps {
    onCancel?: () => void;
    onSuccess?: () => void;
    initialData?: Risk;
}

// ✅ ฟังก์ชันหา risk ที่คล้ายกัน (Jaccard similarity)
function findSimilarRisks(existingRisks: Risk[], newTitle: string, newDesc: string): Risk[] {
  const getShingles = (text: string, k: number = 3): Set<string> => {
    const shingles = new Set<string>();
    const cleanText = text.toLowerCase().replace(/[^\u0E00-\u0E7Fa-z0-9]/g, '');
    for (let i = 0; i <= cleanText.length - k; i++) {
      shingles.add(cleanText.substring(i, i + k));
    }
    return shingles;
  };

  const jaccardSimilarity = (text1: string, text2: string): number => {
    const set1 = getShingles(text1);
    const set2 = getShingles(text2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  };

  return existingRisks.filter(risk => {
    const similarity = jaccardSimilarity(
      `${newTitle} ${newDesc}`,
      `${risk.title} ${risk.description}`
    );
    return similarity > 0.3;
  }).sort((a, b) => {
    const simA = jaccardSimilarity(`${newTitle} ${newDesc}`, `${a.title} ${a.description}`);
    const simB = jaccardSimilarity(`${newTitle} ${newDesc}`, `${b.title} ${b.description}`);
    return simB - simA;
  }).slice(0, 3);
}

const DRAFT_STORAGE_KEY = 'risklens_draft_v1';

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddRiskForm({ onCancel, onSuccess, initialData }: AddRiskFormProps) {
  const { t, language } = useLanguage();
  const { risks: allRisks, addRisk, updateRisk } = useRisks(); // ใช้ context แทน MOCK_RISKS
  
  // ✅ Mode state: 'form' | 'interview'
  const [mode, setMode] = useState<'form' | 'interview'>('form');
  
  // Form states — default Expected Date = วันนี้
  const [formData, setFormData] = useState<RiskFormData>(() => ({
    ...INITIAL_DATA,
    expectedDate: getTodayISO(),
  }));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Auto-save State
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // AI States
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoFilledScore, setAutoFilledScore] = useState(false);
  
  // Similar risks detection
  const [similarRisks, setSimilarRisks] = useState<Risk[]>([]);
  const [showSimilarWarning, setShowSimilarWarning] = useState(false);
  const [autoAnalyzeEnabled, setAutoAnalyzeEnabled] = useState(true);
  
  // ✅ Interview states
  const [interviewState, setInterviewState] = useState<InterviewState>({
    stage: 'initial',
    originalInput: '',
    extractedInfo: {},
    questionsAsked: []
  });
  const [currentFlow, setCurrentFlow] = useState<string>('generic');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [interviewInput, setInterviewInput] = useState('');
  
  const [isSuccess, setIsSuccess] = useState(false);

  const debouncedTitle = useDebounce(formData.title, 1000);
  const debouncedDescription = useDebounce(formData.description, 1000);

  // Initialize data
  useEffect(() => {
    if (initialData) {
        setFormData({
            title: initialData.title,
            description: initialData.description,
            businessUnit: initialData.businessUnit,
            type: initialData.type,
            likelihood: initialData.likelihood,
            impact: initialData.impact,
            expectedDate: initialData.expectedDate || '',
            financialImpact: initialData.financialImpact || 0
        });
    } else {
        // Only try to load draft if we are CREATING a new risk (not editing)
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                // Check if draft has content
                if (parsed.title || parsed.description) {
                    setFormData(prev => ({ ...prev, ...parsed }));
                    setIsDraftLoaded(true);
                    setLastSaved(new Date());
                    // Clear "Draft Loaded" message after 3 seconds
                    setTimeout(() => setIsDraftLoaded(false), 3000);
                }
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    }
  }, [initialData]);

  const { currentUser } = useAuth();
  const rbac = currentUser ? getRBACRole(currentUser.role) : null;
  const lockDepartment = rbac === 'MANAGER' || rbac === 'USER';

  // Default: หน่วยงาน = แผนกตัวเอง, Expected Date = วันนี้ (สำหรับฟอร์มเพิ่มใหม่)
  const validBUs = ['Sales', 'IT', 'Finance', 'Operations', 'HR'];
  useEffect(() => {
    if (initialData) return;
    setFormData(prev => {
      const next = { ...prev };
      if (!prev.expectedDate) next.expectedDate = getTodayISO();
      if (currentUser && validBUs.includes(currentUser.businessUnit) && !prev.businessUnit) {
        next.businessUnit = currentUser.businessUnit as RiskFormData['businessUnit'];
      }
      return next;
    });
  }, [initialData, currentUser?.id, currentUser?.businessUnit]);

  // RBAC: MANAGER/USER ล็อกหน่วยงานให้เป็นแผนกตัวเอง
  useEffect(() => {
    if (!currentUser || initialData || !lockDepartment) return;
    const bu = currentUser.businessUnit as RiskFormData['businessUnit'];
    if (bu && validBUs.includes(bu)) {
      setFormData(prev => ({ ...prev, businessUnit: bu }));
    }
  }, [currentUser?.id, currentUser?.businessUnit, lockDepartment, initialData]);

  // Auto-save logic
  useEffect(() => {
    // Don't auto-save if editing existing data
    if (initialData) return;

    // Don't save empty form
    const isEmpty = !formData.title && !formData.description && !formData.businessUnit;
    if (isEmpty) return;

    const handler = setTimeout(() => {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
        setLastSaved(new Date());
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(handler);
  }, [formData, initialData]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setLastSaved(null);
  };

  const score = calculateScore(formData.likelihood, formData.impact);
  const riskLevel = getRiskLevel(score);

  // Auto-analyze for form mode
  useEffect(() => {
    if (autoAnalyzeEnabled && mode === 'form' &&
        debouncedTitle.length > 5 && 
        debouncedDescription.length > 10 &&
        !initialData) {
        
      const similar = findSimilarRisks(allRisks, debouncedTitle, debouncedDescription);
      if (similar.length > 0) {
        setSimilarRisks(similar);
        setShowSimilarWarning(true);
      } else {
        setShowSimilarWarning(false);
      }

      triggerAIAnalysis();
    }
  }, [debouncedTitle, debouncedDescription, autoAnalyzeEnabled, initialData, mode]);

  const triggerAIAnalysis = async () => {
    if (formData.title.length > 3 && formData.description.length > 5) {
        setIsAnalyzing(true);
        setAutoFilledScore(false);
        try {
            const result = await analyzeRiskWithGemini(formData.title, formData.description, formData.type);
            setAiAnalysis(result);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    }
  };

  // ✅ Interview functions
  const startInterview = () => {
    setMode('interview');
    setInterviewState({
      stage: 'initial',
      originalInput: '',
      extractedInfo: {},
      questionsAsked: []
    });
    setCurrentFlow('generic');
    setQuestionIndex(0);
    setInterviewInput('');
  };

  const handleInitialInterviewSubmit = () => {
    if (!interviewInput.trim()) return;
    
    const analysis = analyzeInputAndSelectFlow(interviewInput);
    setCurrentFlow(analysis.flow);
    setInterviewState(prev => ({
      ...prev,
      originalInput: interviewInput,
      stage: 'clarifying',
      extractedInfo: {
        ...prev.extractedInfo,
        isRisk: analysis.suggestedType === 'risk'
      }
    }));
    setInterviewInput('');
    setQuestionIndex(0);
  };

  const handleInterviewAnswer = (answer: string | string[]) => {
    const currentQ = QUESTION_TEMPLATES[currentFlow]?.[questionIndex];
    if (!currentQ) return;

    setInterviewState(prev => ({
      ...prev,
      extractedInfo: {
        ...prev.extractedInfo,
        [currentQ.id]: answer
      },
      questionsAsked: [...prev.questionsAsked, currentQ.id]
    }));

    const nextIndex = questionIndex + 1;
    const questions = QUESTION_TEMPLATES[currentFlow] || [];
    
    if (nextIndex < questions.length) {
      setQuestionIndex(nextIndex);
    } else {
      setInterviewState(prev => ({ ...prev, stage: 'summary' }));
    }
  };

  const handleSkipQuestion = () => {
    const nextIndex = questionIndex + 1;
    const questions = QUESTION_TEMPLATES[currentFlow] || [];
    if (nextIndex < questions.length) {
      setQuestionIndex(nextIndex);
    } else {
      setInterviewState(prev => ({ ...prev, stage: 'summary' }));
    }
  };

  const applyInterviewResult = () => {
    const result = generateRiskStatement(interviewState);
    setFormData(prev => ({
      ...prev,
      title: result.title,
      description: result.description,
      type: interviewState.extractedInfo.isRisk ? 'risk' : 'issue',
      likelihood: result.likelihood,
      impact: result.impact
    }));
    setMode('form');
    setAutoFilledScore(true);
  };

  const getCleanedAiDescription = (ai: AIAnalysisResult) =>
    (ai.improvedDescription || '')
      .replace(/^\[AI ปรับแก้\]\s*/i, '')
      .replace(/\s*\(ปรับจาก[^)]*\)\s*$/i, '')
      .replace(/\s*\(AI ตรวจสอบแล้วถูกต้อง\)\s*$/i, '')
      .trim();
  const isMismatch = aiAnalysis && aiAnalysis.detectedType !== formData.type;
  const isApplied = aiAnalysis && formData.description === getCleanedAiDescription(aiAnalysis);
  const shouldBlockSave = isMismatch && !isApplied;

  const errors = {
    title: formData.title.length < 5 ? (language === 'th' ? "หัวข้อต้องยาวอย่างน้อย 5 ตัวอักษร" : "Title must be at least 5 characters") : "",
    description: formData.description.length < 10 ? (language === 'th' ? "รายละเอียดต้องยาวอย่างน้อย 10 ตัวอักษร" : "Description must be at least 10 characters") : "",
    businessUnit: !formData.businessUnit ? (language === 'th' ? "กรุณาเลือกหน่วยงาน" : "Please select business unit") : "",
  };
  const isValid = formData.title.length >= 5 &&
                  formData.description.length >= 10 &&
                  !!formData.businessUnit &&
                  !shouldBlockSave;
  const missingList = [errors.title, errors.description, errors.businessUnit].filter(Boolean);
  if (shouldBlockSave) missingList.push(language === 'th' ? "ประเภทความเสี่ยงไม่ตรงกับที่ AI วิเคราะห์ — กรุณากดใช้ข้อความที่แนะนำหรือแก้ประเภท" : "Risk type doesn't match AI analysis — use suggested text or change type");
  if (!isValid && missingList.length === 0) {
    missingList.push(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน (หัวข้อ, รายละเอียด, หน่วยงาน)' : 'Please fill in all required fields (title, description, business unit)');
  }

  const handleChange = (field: keyof RiskFormData, value: any) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'type') {
        setAiAnalysis(null);
    }
  };

  const handleApplyRewrite = () => {
    if (aiAnalysis) {
      const cleanTitle = (aiAnalysis.improvedTitle || '').replace(/^\[Professional\]\s*/i, '').trim();
      const cleanDesc = getCleanedAiDescription(aiAnalysis);
      setFormData(prev => ({
          ...prev,
          title: cleanTitle,
          description: cleanDesc,
          likelihood: aiAnalysis.suggestedLikelihood,
          impact: aiAnalysis.suggestedImpact
      }));
      setAutoFilledScore(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValid) return;

      if (initialData) {
        // Update existing risk
        updateRisk(initialData.id, {
          ...formData,
          businessUnit: formData.businessUnit as BusinessUnit,
          score,
          aiSuggestedType: aiAnalysis?.detectedType,
        });
        setIsSuccess(true);
        setTimeout(() => onSuccess?.(), 1200);
        return;
    } else {
        // Create new risk
        const newRisk: Risk = {
            id: Math.random().toString(36).substr(2, 9),
            ...formData,
            businessUnit: formData.businessUnit as BusinessUnit,
            score,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            aiSuggestedType: aiAnalysis?.detectedType,
            reportedByUserId: currentUser?.id,
            createdBy: currentUser?.id,
        };
        addRisk(newRisk);
        clearDraft();
        if (currentUser) {
            addScore(
                currentUser.id,
                'create_risk',
                `Created risk: "${newRisk.title}"`,
                newRisk.id
            );
        }
        // Trigger: แจ้งเตือนเมื่อความเสี่ยงใหม่ >= เกณฑ์วิกฤต (ตามช่องทางที่เปิดไว้)
        const threshold = getCriticalRiskThreshold();
        if (newRisk.score >= threshold) {
            notifyCriticalRisk({
                title: newRisk.title,
                reporterName: currentUser?.name ?? '—',
                score: newRisk.score,
                businessUnit: newRisk.businessUnit,
            }).catch((err) => console.error('Critical risk notification failed:', err));
        }
    }
    
    setIsSuccess(true);
    // กลับไปหน้าแดชบอร์ดหลังบันทึกสำเร็จ (ให้หน้าจอเปลี่ยน)
    setTimeout(() => onSuccess?.(), 1200);
  }

  const handleReset = () => {
    if (window.confirm(language === 'th' ? 'ต้องการล้างข้อมูลทั้งหมด?' : 'Clear all data?')) {
        setFormData(INITIAL_DATA);
        setTouched({});
        setIsSuccess(false);
        setAiAnalysis(null);
        setSimilarRisks([]);
        setShowSimilarWarning(false);
        setMode('form');
        clearDraft(); // ✅ Clear draft on reset
        setInterviewState({
            stage: 'initial',
            originalInput: '',
            extractedInfo: {},
            questionsAsked: []
        });
    }
  };

  // ✅ Get current question for interview
  const currentQuestion = QUESTION_TEMPLATES[currentFlow]?.[questionIndex];

  if (isSuccess) {
    return (
        <Card className="max-w-md mx-auto mt-8 text-center p-8 bg-slate-900 border-slate-800">
            <div className="flex justify-center mb-4">
                <div className="bg-emerald-900/30 p-4 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">
                {initialData ? "อัพเดทข้อมูลสำเร็จ!" : "เพิ่มความเสี่ยงสำเร็จ!"}
            </h2>
            <p className="text-slate-400 mb-8">ข้อมูลถูกบันทึกลงในทะเบียนความเสี่ยงแล้ว</p>
            <div className="flex flex-col gap-3">
                {!initialData && (
                    <Button onClick={() => {
                        setIsSuccess(false);
                        setFormData(INITIAL_DATA);
                        setTouched({});
                        setAiAnalysis(null);
                    }} className="w-full">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        เพิ่มรายการอื่น (Add Another)
                    </Button>
                )}
                <Button onClick={onSuccess} variant={initialData ? "primary" : "outline"} className="w-full">
                    กลับไปหน้าแดชบอร์ด
                </Button>
            </div>
        </Card>
    )
  }

  // ✅ INTERVIEW MODE
  if (mode === 'interview') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Mode switcher */}
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setMode('form')}
            className="text-slate-400"
          >
            <FormInput className="w-4 h-4 mr-2" />
            {language === 'th' ? 'กลับไปกรอกแบบปกติ' : 'Back to Form'}
          </Button>
        </div>

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
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 min-h-[300px]">
              {/* Initial message */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center shrink-0 border border-indigo-500/30">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3 text-sm text-slate-200 flex-1">
                  {language === 'th' 
                    ? 'สวัสดีครับ ผมจะช่วยคุณบันทึกความเสี่ยง กรุณาเล่าให้ฟังคร่าวๆ ว่าเกิดอะไรขึ้น (เช่น "vendor ส่งของล่าช้า", "server ใกล้เต็ม")'
                    : 'Hello! I\'ll help you record this risk. Please briefly describe what happened (e.g., "vendor delivery delay", "server almost full")'}
                </div>
              </div>

              {/* User's initial input */}
              {interviewState.originalInput && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-sm text-slate-200 flex-1">
                    {interviewState.originalInput}
                  </div>
                </div>
              )}

              {/* AI Questions and Answers */}
              {interviewState.questionsAsked.map((qId, idx) => {
                const q = QUESTION_TEMPLATES[currentFlow]?.find(x => x.id === qId);
                const answer = interviewState.extractedInfo[qId];
                return (
                  <div key={qId} className="space-y-2">
                    {/* Question */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <Bot className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3 text-sm text-slate-200 flex-1">
                        {q?.question}
                        {q?.context && (
                          <p className="text-xs text-slate-500 mt-1 italic">💡 {q.context}</p>
                        )}
                      </div>
                    </div>
                    {/* Answer */}
                    <div className="flex gap-3 pl-11">
                      <div className="bg-slate-800 rounded-lg p-2 text-sm text-slate-300">
                        {Array.isArray(answer) ? answer.join(', ') : answer}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Current Question */}
              {interviewState.stage !== 'summary' && interviewState.stage !== 'initial' && currentQuestion && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3">
                      <p className="text-sm text-slate-200">{currentQuestion.question}</p>
                      {currentQuestion.context && (
                        <p className="text-xs text-slate-500 mt-1 italic">💡 {currentQuestion.context}</p>
                      )}
                    </div>
                    
                    {/* Answer options */}
                    <div className="space-y-2">
                      {currentQuestion.type === 'single_choice' && currentQuestion.options?.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => handleInterviewAnswer(opt.value)}
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
                                  const current = (interviewState.extractedInfo[currentQuestion.id] as string[]) || [];
                                  const updated = checked 
                                    ? [...current, opt.value]
                                    : current.filter(v => v !== opt.value);
                                  handleInterviewAnswer(updated);
                                }}
                                className="w-4 h-4 rounded border-slate-600 text-cyan-500"
                              />
                              <span className="text-sm text-slate-300">{opt.label}</span>
                            </label>
                          ))}
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={handleSkipQuestion}
                              className="flex-1"
                            >
                              {language === 'th' ? 'ข้าม' : 'Skip'}
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => {
                                const current = interviewState.extractedInfo[currentQuestion.id] as string[];
                                if (current && current.length > 0) {
                                  handleInterviewAnswer(current);
                                }
                              }}
                              disabled={!(interviewState.extractedInfo[currentQuestion.id] as string[])?.length}
                              className="flex-1"
                            >
                              {language === 'th' ? 'ต่อไป' : 'Next'}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {currentQuestion.type === 'text' && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={interviewInput}
                            onChange={(e) => setInterviewInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && interviewInput.trim() && handleInterviewAnswer(interviewInput)}
                            placeholder={language === 'th' ? 'พิมพ์คำตอบ...' : 'Type your answer...'}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 outline-none"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => handleInterviewAnswer(interviewInput)}
                            disabled={!interviewInput.trim()}
                          >
                            {language === 'th' ? 'ส่ง' : 'Send'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              {interviewState.stage === 'summary' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-emerald-300 mb-2">
                      ✅ {language === 'th' ? 'สรุป Risk Statement' : 'Risk Statement Summary'}
                    </h4>
                    {(() => {
                      const result = generateRiskStatement(interviewState);
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
            {interviewState.stage !== 'initial' && interviewState.stage !== 'summary' && (
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

            {/* Initial Input */}
            {interviewState.stage === 'initial' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={interviewInput}
                  onChange={(e) => setInterviewInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && interviewInput.trim() && handleInitialInterviewSubmit()}
                  placeholder={language === 'th' ? 'อธิบายความเสี่ยงคร่าวๆ...' : 'Briefly describe the risk...'}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 outline-none"
                />
                <Button 
                  onClick={handleInitialInterviewSubmit}
                  disabled={!interviewInput.trim()}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {language === 'th' ? 'เริ่ม' : 'Start'}
                </Button>
              </div>
            )}

            {/* Summary Actions */}
            {interviewState.stage === 'summary' && (
              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <Button 
                  variant="outline" 
                  onClick={() => setInterviewState(prev => ({ ...prev, stage: 'clarifying', questionsAsked: [] }))}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  {language === 'th' ? 'เริ่มใหม่' : 'Restart'}
                </Button>
                <Button 
                  onClick={applyInterviewResult}
                  className="flex-1 gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {language === 'th' ? 'ใช้ Risk นี้' : 'Use This Risk'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ FORM MODE (Original)
  return (
    <div className="space-y-4">
      {/* Mode switcher */}
      {!initialData && (
        <div className="flex justify-between items-center">
          {/* Draft Indicator */}
          <div className="flex items-center gap-2">
              {isDraftLoaded && (
                  <span className="text-xs text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/50 flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                      <History className="w-3 h-3" />
                      Recovered from draft
                  </span>
              )}
              {lastSaved && !isDraftLoaded && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Cloud className="w-3 h-3" />
                      Auto-saved {lastSaved.toLocaleTimeString()}
                  </span>
              )}
          </div>

          <div className="flex gap-2">
            {(lastSaved || isDraftLoaded) && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                        if(confirm('Delete draft?')) {
                            setFormData(INITIAL_DATA);
                            clearDraft();
                        }
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                    title="Clear Draft"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            )}
            <Button 
                variant="outline" 
                size="sm" 
                onClick={startInterview}
                className="gap-2 border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/30"
            >
                <MessageSquare className="w-4 h-4" />
                {language === 'th' ? 'ใช้ AI สัมภาษณ์ (แนะนำ)' : 'Use AI Interview (Recommended)'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
              <CardHeader>
                  <CardTitle>{initialData ? 'แก้ไขข้อมูล (Edit Risk)' : 'รายละเอียดความเสี่ยงใหม่ (New Risk Details)'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                  
              {/* Classification */}
              <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t.classification}</label>
                  <div className="flex gap-4">
                      <label className={cn(
                          "flex-1 border rounded-lg p-3 cursor-pointer transition-all flex items-center gap-3",
                          formData.type === 'risk' ? "border-cyan-500 bg-cyan-900/20 ring-1 ring-cyan-500/50" : "border-slate-700 bg-slate-950 hover:bg-slate-900"
                      )}>
                          <input 
                              type="radio" 
                              name="type" 
                              value="risk" 
                              checked={formData.type === 'risk'} 
                              onChange={() => handleChange('type', 'risk')}
                              className="w-4 h-4 text-cyan-500 bg-slate-900 border-slate-600"
                          />
                          <div>
                              <span className="font-medium block text-slate-200">Risk (ความเสี่ยง)</span>
                              <span className="text-xs text-slate-500">{t.riskDesc}</span>
                          </div>
                      </label>
                      <label className={cn(
                          "flex-1 border rounded-lg p-3 cursor-pointer transition-all flex items-center gap-3",
                          formData.type === 'issue' ? "border-cyan-500 bg-cyan-900/20 ring-1 ring-cyan-500/50" : "border-slate-700 bg-slate-950 hover:bg-slate-900"
                      )}>
                          <input 
                              type="radio" 
                              name="type" 
                              value="issue" 
                              checked={formData.type === 'issue'} 
                              onChange={() => handleChange('type', 'issue')}
                              className="w-4 h-4 text-cyan-500 bg-slate-900 border-slate-600"
                          />
                          <div>
                              <span className="font-medium block text-slate-200">Issue (ปัญหา)</span>
                              <span className="text-xs text-slate-500">{t.issueDesc}</span>
                          </div>
                      </label>
                  </div>
              </div>

              {/* Title & Description */}
              <div className="relative">
                    <Input 
                      label={t.title}
                      placeholder="เช่น ระบบล่ม, ลูกค้ายกเลิกสัญญา..."
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      error={errors.title}
                      required
                  />
              </div>
              
              <div className="relative">
                  <Textarea 
                      label="รายละเอียด (Description)" 
                      placeholder="อธิบายเหตุการณ์ บริบท และผลกระทบที่อาจเกิดขึ้น..."
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      error={errors.description}
                      rows={4}
                      required
                      className="pr-12" 
                  />
                  
                  {/* AI Trigger Button */}
                  <div className="absolute top-8 right-2">
                      <button 
                          type="button"
                          onClick={triggerAIAnalysis}
                          disabled={isAnalyzing || formData.title.length < 3}
                          className={cn(
                              "p-2 rounded-full transition-all group relative border border-indigo-500/30",
                              isAnalyzing ? "bg-slate-800 cursor-not-allowed" : "bg-indigo-900/30 hover:bg-indigo-600/80 text-indigo-300 hover:text-white hover:shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                          )}
                      >
                          {isAnalyzing ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                              <>
                                  <PenLine className="w-5 h-5" />
                                  <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
                              </>
                          )}
                          
                          <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-slate-900 text-xs text-slate-200 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                              {t.aiRewriteTooltip}
                          </div>
                      </button>
                  </div>
              </div>

              {/* Similar Risks Warning */}
              {showSimilarWarning && similarRisks.length > 0 && (
                <div className="rounded-lg p-4 bg-amber-950/20 border border-amber-500/30 animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <History className="w-5 h-5 text-amber-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4" />
                        {language === 'th' ? 'พบความเสี่ยงที่คล้ายกันในระบบ' : 'Similar Historical Risks Detected'}
                      </h4>
                      <div className="space-y-2">
                        {similarRisks.map(risk => (
                          <div key={risk.id} className="bg-slate-950/50 p-3 rounded border border-slate-800 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-200">{risk.title}</span>
                              <Badge className="text-[10px] bg-slate-800 text-slate-400">
                                {risk.businessUnit}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 mt-1">
                              <span>Score: {risk.score}/25</span>
                              <span>•</span>
                              <span>{new Date(risk.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="text-amber-400">
                                Impact: {formatCurrency(risk.financialImpact || 0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="mt-2 text-xs text-amber-400"
                        onClick={() => setShowSimilarWarning(false)}
                      >
                        {language === 'th' ? 'ซ่อน' : 'Dismiss'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Rewrite Suggestion Box - แสดงเฉพาะคำแนะนำ ไม่มี [AI ปรับแก้] หรือที่มาข้อความ */}
              {aiAnalysis && (() => {
                  const cleanTitle = (aiAnalysis.improvedTitle || '').replace(/^\[Professional\]\s*/i, '').trim();
                  const cleanDesc = (aiAnalysis.improvedDescription || '')
                      .replace(/^\[AI ปรับแก้\]\s*/i, '')
                      .replace(/\s*\(ปรับจาก[^)]*\)\s*$/i, '')
                      .replace(/\s*\(AI ตรวจสอบแล้วถูกต้อง\)\s*$/i, '')
                      .trim();
                  return (
                  <div className={cn(
                      "rounded-lg p-4 animate-in fade-in slide-in-from-top-2 border",
                      shouldBlockSave ? "bg-red-950/10 border-red-500/30" : "bg-indigo-950/20 border-indigo-500/30"
                  )}>
                      <div className="flex items-start gap-3 mb-3">
                          {shouldBlockSave ? <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" /> : <Wand2 className="w-5 h-5 text-indigo-400 mt-0.5" />}
                          <span className={cn("text-sm font-bold block", shouldBlockSave ? "text-red-300" : "text-indigo-300")}>
                              {t.aiRewriteTitle}
                          </span>
                      </div>

                      <div className="bg-slate-950/50 p-3 rounded border border-slate-800 mb-3 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
                          <p className="font-medium text-slate-200 text-sm mb-1">{cleanTitle}</p>
                          <p className="text-slate-400 text-xs line-clamp-2">{cleanDesc}</p>
                          <div className="mt-2 flex items-center gap-2">
                              <Badge variant="default" className="text-[10px] bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                                  AI Auto-Score: {calculateScore(aiAnalysis.suggestedLikelihood, aiAnalysis.suggestedImpact)}/25
                              </Badge>
                          </div>
                      </div>

                      <Button size="sm" variant={shouldBlockSave ? "danger" : "secondary"} onClick={handleApplyRewrite} className="w-full">
                          {shouldBlockSave ? <RotateCcw className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                          {t.aiUseThis}
                      </Button>
                  </div>
                  );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                      label={t.businessUnit}
                      options={[
                          { value: 'Sales', label: 'Sales' },
                          { value: 'IT', label: 'IT' },
                          { value: 'Finance', label: 'Finance' },
                          { value: 'Operations', label: 'Operations' },
                          { value: 'HR', label: 'HR' },
                      ]}
                      value={formData.businessUnit}
                      onChange={(e) => handleChange('businessUnit', e.target.value)}
                      error={errors.businessUnit}
                      required
                      disabled={lockDepartment}
                  />
                  
                    <Input 
                      type="number"
                      label={`${t.financialExposure} (USD)`}
                      placeholder="0.00"
                      value={Number.isFinite(formData.financialImpact) ? formData.financialImpact : ''}
                      onChange={(e) => handleChange('financialImpact', Number(e.target.value) || 0)}
                  />
              </div>
              
                <div>
                  <DatePicker
                      label={t.expectedDate}
                      value={formData.expectedDate}
                      onChange={(v) => handleChange('expectedDate', v)}
                  />
              </div>

              {/* Likelihood & Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-3">
                      <div className="flex justify-between">
                          <label className="text-sm font-medium text-slate-300">{t.likelihood} (1-5)</label>
                          <span className="text-sm font-semibold text-cyan-400">{formData.likelihood}</span>
                      </div>
                      <div className="flex justify-between gap-1">
                          {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleChange('likelihood', val)}
                                  className={cn(
                                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                                      formData.likelihood === val 
                                          ? "bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]" 
                                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                  )}
                              >
                                  {val}
                              </button>
                          ))}
                      </div>
                      <p className="text-xs text-slate-500">1 = {t.low}, 5 = {t.critical}</p>
                  </div>

                  <div className="space-y-3">
                      <div className="flex justify-between">
                          <label className="text-sm font-medium text-slate-300">{t.impact} (1-5)</label>
                          <span className="text-sm font-semibold text-cyan-400">{formData.impact}</span>
                      </div>
                      <div className="flex justify-between gap-1">
                          {[1, 2, 3, 4, 5].map((val) => (
                              <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleChange('impact', val)}
                                  className={cn(
                                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                                      formData.impact === val 
                                          ? "bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]" 
                                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                  )}
                              >
                                  {val}
                              </button>
                          ))}
                      </div>
                      <p className="text-xs text-slate-500">1 = {t.low}, 5 = {t.critical}</p>
                  </div>
              </div>
              
              {autoFilledScore && !shouldBlockSave && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/10 p-2 rounded border border-emerald-900/20">
                      <Sparkles className="w-3 h-3" />
                      {t.aiAutoScore}
                  </div>
              )}

              {/* Auto-analyze toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded border border-slate-800">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-slate-300">AI Auto-Analysis</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoAnalyzeEnabled(!autoAnalyzeEnabled)}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    autoAnalyzeEnabled ? "bg-indigo-600" : "bg-slate-700"
                  )}
                >
                  <span className="text-xs absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform" style={{ transform: autoAnalyzeEnabled ? 'translateX(20px)' : 'translateX(0)' }}></span>
                </button>
              </div>
          </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
          {/* แจ้งว่าขาดอะไรจึงบันทึกไม่ได้ */}
          {!isValid && (
              <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-3 flex items-start gap-3" role="alert">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                      <p className="text-sm font-medium text-red-400">
                          {language === 'th' ? 'ไม่สามารถบันทึกได้ เพราะ:' : "Can't save because:"}
                      </p>
                      <ul className="text-xs text-red-300/90 list-disc list-inside space-y-0.5">
                          {missingList.length > 0 ? missingList.map((msg, i) => (
                              <li key={i}>{msg}</li>
                          )) : (
                              <li>{language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please complete all required fields'}</li>
                          )}
                      </ul>
                  </div>
              </div>
          )}

          <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => {
                  if(!initialData) clearDraft();
                  onCancel?.();
              }}>Cancel</Button>
              <Button
                  type="button"
                  disabled={!isValid || isAnalyzing}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }}
              >
                  <Save className="w-4 h-4 mr-2" />
                  {initialData ? 'Update' : 'Save'}
              </Button>
          </div>
      </div>
    </div>

    <div className="space-y-6">
      <Card className={cn("border-2 transition-colors", riskLevel.bg.replace('bg-', 'bg-').replace('/10', '/5'), riskLevel.border)}>
          <CardHeader className="pb-2 border-b-0">
              <CardTitle className="text-base flex justify-between items-center">
                  {t.score}
                  <Badge className={cn(riskLevel.bg, riskLevel.color, "border-transparent")}>{riskLevel.label}</Badge>
              </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex items-end justify-center py-4">
                  <span className={cn("text-5xl font-bold font-mono", riskLevel.color)}>{score}</span>
                  <span className="text-slate-500 text-lg mb-1 ml-1">/25</span>
              </div>
              <div className="text-xs text-center text-slate-400">
                  {t.likelihood} x {t.impact}
              </div>
          </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/30">
          <CardHeader className="border-indigo-500/20">
              <CardTitle className="flex items-center gap-2 text-indigo-300">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  AI Analysis
              </CardTitle>
          </CardHeader>
          <CardContent>
              {!aiAnalysis && !isAnalyzing && (
                  <div className="text-sm text-slate-400 text-center py-4">
                      {t.aiRewriteTooltip}
                  </div>
              )}
              
              {isAnalyzing && (
                  <div className="flex flex-col items-center justify-center py-6 text-indigo-300">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <span className="text-sm">Gemini is analyzing...</span>
                  </div>
              )}

              {aiAnalysis && !isAnalyzing && (
                  <div className="space-y-4 animate-in fade-in">
                      <div>
                          <p className="text-sm font-medium text-slate-300 mb-1">Status:</p>
                          <div className="flex items-center gap-2">
                              <span className={cn(
                                  "text-lg font-bold capitalize",
                                  shouldBlockSave ? "text-red-400" : "text-emerald-400"
                              )}>
                                  {shouldBlockSave ? "Needs Review" : "Valid"}
                              </span>
                              <Badge variant="default" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                                  {Math.round(aiAnalysis.confidence * 100)}% Conf.
                              </Badge>
                          </div>
                      </div>
                      
                      {shouldBlockSave ? (
                            <div className="bg-red-950/30 p-3 rounded-lg border border-red-900/50 shadow-sm">
                              <p className="text-xs text-red-300 mb-2">
                                  {t.aiMismatchError}: User selected <strong>{formData.type.toUpperCase()}</strong> but text describes <strong>{aiAnalysis.detectedType.toUpperCase()}</strong>.
                              </p>
                          </div>
                      ) : (
                          <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-900/20 p-2 rounded border border-emerald-900/30">
                              <CheckCircle2 className="w-4 h-4" />
                              Content matches type
                          </div>
                      )}
                  </div>
              )}
          </CardContent>
      </Card>
    </div>
  </div>
</div>
  );
}