import React, { useEffect, useMemo, useState } from 'react';
import { Risk } from '../types/risk';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckSquare,
  XCircle,
  Forward,
  History,
  Sparkles,
  Target
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { findCascadeRisks } from '../lib/correlation';
import { getCriticalRiskThreshold, notifyEscalation } from '../lib/notifications';

interface CommandCenterProps {
  risks: Risk[];
  onRiskClick?: (riskId: string) => void;
}

type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'escalated';
type UrgencyLevel = 'critical' | 'warning' | 'normal';

interface DecisionItem {
  risk: Risk;
  urgency: UrgencyLevel;
  recommendedAction: string;
  estimatedImpact: string;
  deadline: string;
  status: DecisionStatus;
  rationale: string;
}

export function CommandCenter({ risks, onRiskClick }: CommandCenterProps) {
  const { t, language } = useLanguage();
  
  // Load decisions from sessionStorage (persist during session, reset on refresh)
  const loadDecisions = (): Record<string, DecisionStatus> => {
    try {
      const stored = sessionStorage.getItem('riskLens_decisions');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };
  
  const saveDecisions = (decisions: Record<string, DecisionStatus>) => {
    try {
      sessionStorage.setItem('riskLens_decisions', JSON.stringify(decisions));
    } catch (e) {
      console.error('Failed to save decisions:', e);
    }
  };
  
  const [decisions, setDecisions] = useState<Record<string, DecisionStatus>>(loadDecisions());
  const [showHistory, setShowHistory] = useState(false);
  
  // Save decisions whenever they change
  useEffect(() => {
    saveDecisions(decisions);
  }, [decisions]);

  // Generate decision items based on risk analysis
  const decisionQueue: DecisionItem[] = useMemo(() => {
    const items: DecisionItem[] = [];
    const criticalThreshold = getCriticalRiskThreshold();
    
    // Critical risks requiring immediate decision (ใช้เกณฑ์จาก Settings)
    const criticalRisks = risks.filter(r => r.score >= criticalThreshold && r.status === 'active');
    criticalRisks.forEach(risk => {
      const cascade = findCascadeRisks(risks, risk);
      items.push({
        risk,
        urgency: 'critical',
        recommendedAction: cascade.length > 0 
          ? `Activate contingency plan (may trigger ${cascade.length} cascade risks)` 
          : 'Immediate mitigation required',
        estimatedImpact: formatCurrency(risk.financialImpact || 0),
        deadline: 'Within 24 hours',
        status: decisions[risk.id] || 'pending',
        rationale: `Score ${risk.score}/25 with ${cascade.length > 0 ? 'cascade potential' : 'isolated impact'}`
      });
    });

    // High risks requiring monitoring (ต่ำกว่าเกณฑ์วิกฤต)
    const highRisks = risks.filter(r => r.score >= 15 && r.score < criticalThreshold && r.status === 'active');
    highRisks.forEach(risk => {
      items.push({
        risk,
        urgency: 'warning',
        recommendedAction: 'Schedule mitigation review',
        estimatedImpact: formatCurrency(risk.financialImpact || 0),
        deadline: 'Within 1 week',
        status: decisions[risk.id] || 'pending',
        rationale: 'Elevated risk level requires executive awareness'
      });
    });

    // Issues that need attention
    const activeIssues = risks.filter(r => r.type === 'issue' && r.status === 'active' && r.score < 15);
    activeIssues.slice(0, 3).forEach(risk => {
      items.push({
        risk,
        urgency: 'normal',
        recommendedAction: 'Monitor and document',
        estimatedImpact: formatCurrency(risk.financialImpact || 0),
        deadline: 'Ongoing',
        status: decisions[risk.id] || 'pending',
        rationale: 'Active issue within acceptable thresholds'
      });
    });

    return items.sort((a, b) => {
      const urgencyOrder = { critical: 0, warning: 1, normal: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }, [risks, decisions]);

  const handleDecision = (riskId: string, status: DecisionStatus) => {
    setDecisions(prev => ({ ...prev, [riskId]: status }));
    if (status === 'escalated') {
      const risk = risks.find(r => r.id === riskId);
      if (risk) {
        notifyEscalation({
          title: risk.title,
          riskId: risk.id,
          score: risk.score,
          businessUnit: risk.businessUnit,
        }).catch((err) => console.error('Notify escalation failed:', err));
      }
    }
  };

  const getUrgencyConfig = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'critical':
        return {
          icon: AlertCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          badge: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
      case 'warning':
        return {
          icon: Clock,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        };
      case 'normal':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        };
    }
  };

  const pendingCount = decisionQueue.filter(d => d.status === 'pending').length;
  const decidedCount = Object.keys(decisions).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Executive Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-950/30 to-slate-900 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-400 font-medium mb-1">Decision Required</p>
                <h3 className="text-3xl font-bold text-slate-100">{pendingCount}</h3>
                <p className="text-xs text-slate-500 mt-1">Items awaiting your decision</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-950/30 to-slate-900 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-400 font-medium mb-1">Exposure at Risk</p>
                <h3 className="text-3xl font-bold text-slate-100">
                  {formatCurrency(decisionQueue
                    .filter(d => d.status === 'pending' && d.urgency === 'critical')
                    .reduce((acc, d) => acc + (d.risk.financialImpact || 0), 0)
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Critical pending decisions</p>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-full">
                <TrendingUp className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-950/30 to-slate-900 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-400 font-medium mb-1">Decisions Made</p>
                <h3 className="text-3xl font-bold text-slate-100">{decidedCount}</h3>
                <p className="text-xs text-slate-500 mt-1">This session</p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <CheckSquare className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Executive Brief */}
      <Card className="bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 border-indigo-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-full shrink-0">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-indigo-100 mb-2 flex items-center gap-2">
                AI Executive Brief
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">LIVE</Badge>
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {language === 'th' ? (
                  <>
                    ระบบตรวจพบ <span className="text-red-400 font-semibold">{pendingCount} ความเสี่ยงวิกฤต</span> ที่ต้องตัดสินใจภายใน 24 ชั่วโมง 
                    {decisionQueue.some(d => d.urgency === 'critical' && findCascadeRisks(risks, d.risk).length > 0) && 
                      ' มีความเสี่ยงที่อาจกระทบต่อเนื่อง (cascade) หลายรายการ แนะนำให้พิจารณาอนุมัติแผนฉุกเฉิน'}
                    {' การตัดสินใจในช่วงนี้จะลดผลกระทบทางการเงินได้ถึง 40%'}
                  </>
                ) : (
                  <>
                    System detected <span className="text-red-400 font-semibold">{pendingCount} critical risks</span> requiring decision within 24 hours.
                    {decisionQueue.some(d => d.urgency === 'critical' && findCascadeRisks(risks, d.risk).length > 0) && 
                      ' Multiple cascade risks detected. Recommend approving emergency contingency plans.'}
                    {' Decisions made now can reduce financial impact by up to 40%.'}
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decision Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Decision Queue
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs"
          >
            <History className="w-3 h-3 mr-1" />
            {showHistory ? 'Hide History' : 'Show History'}
          </Button>
        </div>

        {decisionQueue
          .filter(d => {
            // ถ้าเปิด Show History แสดงทั้งหมด (pending + decided)
            // ถ้าปิด Show History แสดงเฉพาะ pending
            return showHistory ? true : d.status === 'pending';
          })
          .map((item) => {
          const config = getUrgencyConfig(item.urgency);
          const Icon = config.icon;
          const isDecided = item.status !== 'pending';

          return (
            <Card 
              key={item.risk.id} 
              className={cn(
                "transition-all duration-300",
                isDecided ? "opacity-60" : "hover:border-cyan-500/50",
                config.bgColor,
                "border",
                config.borderColor
              )}
            >
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Left: Risk Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn("w-4 h-4", config.color)} />
                      <Badge className={cn("text-[10px]", config.badge)}>
                        {item.urgency.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                        {item.risk.businessUnit}
                      </Badge>
                      {isDecided && (
                        <Badge className={cn("text-[10px]", 
                          item.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          item.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        )}>
                          {item.status.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    
                    <h4 
                      className="font-semibold text-slate-100 mb-1 cursor-pointer hover:text-cyan-400 transition-colors"
                      onClick={() => onRiskClick?.(item.risk.id)}
                    >
                      {item.risk.title}
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.deadline}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {item.estimatedImpact}
                      </span>
                      <span className="text-slate-500">
                        Score: {item.risk.score}/25
                      </span>
                    </div>

                    <div className="mt-3 p-2 bg-slate-950/50 rounded border border-slate-800">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-indigo-300 font-medium">AI Recommendation</p>
                          <p className="text-xs text-slate-400">{item.recommendedAction}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{item.rationale}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  {!isDecided ? (
                    <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={() => handleDecision(item.risk.id, 'approved')}
                      >
                        <CheckSquare className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-950/30"
                        onClick={() => handleDecision(item.risk.id, 'rejected')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400"
                        onClick={() => handleDecision(item.risk.id, 'escalated')}
                      >
                        <Forward className="w-4 h-4 mr-1" />
                        Escalate
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500">
                      <CheckCircle2 className="w-4 h-4" />
                      Decided
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-[10px]"
                        onClick={() => handleDecision(item.risk.id, 'pending')}
                      >
                        Undo
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {decisionQueue.filter(d => showHistory ? true : d.status === 'pending').length === 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-slate-100">All Caught Up!</h4>
              <p className="text-sm text-slate-400">No pending decisions requiring your attention.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}