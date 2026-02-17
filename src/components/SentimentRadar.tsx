import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { RiskSentiment, SentimentResult } from '../lib/sentimentAnalysis';
import { Risk } from '../types/risk';

interface SentimentRadarProps {
  risks: Risk[];
  sentimentMap: Record<string, SentimentResult>;
  className?: string;
}

const sentimentConfig: Record<RiskSentiment, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
  description: string;
}> = {
  panic: {
    label: 'Panic',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    icon: AlertTriangle,
    description: 'ต้องการความช่วยเหลือด่วน'
  },
  urgent: {
    label: 'Urgent',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    icon: AlertCircle,
    description: 'ต้องติดตามใกล้ชิด'
  },
  concerned: {
    label: 'Concerned',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    icon: Activity,
    description: 'มีความกังวล'
  },
  neutral: {
    label: 'Neutral',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    icon: Thermometer,
    description: 'ปกติ'
  },
  confident: {
    label: 'Confident',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    icon: CheckCircle2,
    description: 'ควบคุมได้'
  }
};

export function SentimentRadar({ risks, sentimentMap, className }: SentimentRadarProps) {
  // คำนวณสถิติ
  const sentiments = Object.values(sentimentMap);
  const total = sentiments.length || 1; // avoid divide by zero
  
  const distribution = {
    panic: sentiments.filter(s => s.sentiment === 'panic').length,
    urgent: sentiments.filter(s => s.sentiment === 'urgent').length,
    concerned: sentiments.filter(s => s.sentiment === 'concerned').length,
    neutral: sentiments.filter(s => s.sentiment === 'neutral').length,
    confident: sentiments.filter(s => s.sentiment === 'confident').length
  };
  
  const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / total;
  
  // หา overall status
  let overallStatus: 'critical' | 'warning' | 'stable' | 'healthy' = 'stable';
  if (distribution.panic > 0 || distribution.urgent > total * 0.2) overallStatus = 'critical';
  else if (distribution.urgent > 0 || distribution.concerned > total * 0.3) overallStatus = 'warning';
  else if (avgScore > 0.1) overallStatus = 'healthy';
  
  const statusConfig = {
    critical: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Critical Attention Needed' },
    warning: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Elevated Concern' },
    stable: { color: 'text-slate-400', bg: 'bg-slate-500/20', label: 'Normal' },
    healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Well Managed' }
  };
  
  const status = statusConfig[overallStatus];
  
  // หา risks ที่ต้อง attention มากที่สุด
  const highAttentionRisks = risks
    .filter(r => sentimentMap[r.id] && ['panic', 'urgent'].includes(sentimentMap[r.id].sentiment))
    .sort((a, b) => (sentimentMap[a.id]?.score || 0) - (sentimentMap[b.id]?.score || 0))
    .slice(0, 3);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall Status Card */}
      <Card className={cn("border-2", status.bg.replace('/20', '/30'))}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Organization Risk Temperature</p>
              <h3 className={cn("text-2xl font-bold", status.color)}>
                {status.label}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Based on {total} risk descriptions • Avg Score: {avgScore.toFixed(2)}
              </p>
            </div>
            <div className={cn("p-4 rounded-full", status.bg)}>
              <Thermometer className={cn("w-8 h-8", status.color)} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Distribution Bars */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Sentiment Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(distribution) as RiskSentiment[]).map((sentiment) => {
            const count = distribution[sentiment];
            const percentage = (count / total) * 100;
            const config = sentimentConfig[sentiment];
            const Icon = config.icon;
            
            return (
              <div key={sentiment} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-3 h-3", config.color)} />
                    <span className="text-slate-300">{config.label}</span>
                  </div>
                  <span className={cn("font-medium", config.color)}>
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all", config.bgColor.replace('/10', ''))}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      {/* High Attention Risks */}
      {highAttentionRisks.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Requires Immediate Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highAttentionRisks.map(risk => {
              const sentiment = sentimentMap[risk.id];
              const config = sentimentConfig[sentiment.sentiment];
              
              return (
                <div key={risk.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {risk.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {risk.businessUnit} • Score: {risk.score}/25
                      </p>
                      {sentiment.keywords.length > 0 && (
                        <p className="text-xs text-slate-600 mt-1">
                          Keywords: {sentiment.keywords.join(', ')}
                        </p>
                      )}
                    </div>
                    <Badge className={cn("shrink-0", config.bgColor, config.color, "border-transparent")}>
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-amber-400/80 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {sentiment.recommendedAction}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Mini version สำหรับแสดงใน risk list
export function SentimentBadge({ sentiment }: { sentiment: SentimentResult }) {
  const config = sentimentConfig[sentiment.sentiment];
  const Icon = config.icon;
  
  return (
    <div className="group relative">
      <Badge className={cn(config.bgColor, config.color, "border-transparent gap-1")}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-xs text-slate-300 rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
        <p className="font-medium text-slate-200 mb-1">{config.description}</p>
        <p className="text-slate-500">{sentiment.explanation}</p>
        <p className="text-amber-400/80 mt-1 text-[10px]">{sentiment.recommendedAction}</p>
      </div>
    </div>
  );
}