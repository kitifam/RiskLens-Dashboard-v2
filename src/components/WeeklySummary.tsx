import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { MOCK_RISKS } from '../data/mockData';
import { cn, getRiskLevel, formatDate, getRiskContent } from '../lib/utils';
import { RiskList } from './RiskList';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  FileDown, 
  Mail, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb, 
  ArrowRight,
  PieChart,
  ListFilter
} from 'lucide-react';

export function WeeklySummary() {
  const { t, language } = useLanguage();
  const [selectedSummary, setSelectedSummary] = useState<'total' | 'critical' | 'issues' | 'operational' | null>(null);

  const totalRisks = MOCK_RISKS.length;
  const criticalRisks = MOCK_RISKS.filter(r => r.score >= 15).length;
  const issuesCount = MOCK_RISKS.filter(r => r.type === 'issue').length;
  
  const buCounts: Record<string, number> = {
    'Sales': 0, 'IT': 0, 'Finance': 0, 'Operations': 0, 'HR': 0
  };
  MOCK_RISKS.forEach(r => {
    if (buCounts[r.businessUnit] !== undefined) {
      buCounts[r.businessUnit]++;
    }
  });

  const topCriticalRisks = [...MOCK_RISKS]
    .filter(r => r.score >= 15)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const currentDate = new Date();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const endOfWeek = new Date(currentDate);
  endOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 6);

  // Filter Logic for Interactivity
  const filteredRisks = MOCK_RISKS.filter(r => {
      if (selectedSummary === 'total') return true;
      if (selectedSummary === 'critical') return r.score >= 15;
      if (selectedSummary === 'issues') return r.type === 'issue';
      // In a real app, you might have a dedicated 'category' field. 
      // Here we assume 'Operations' BU proxies for Operational risks for demo purposes.
      if (selectedSummary === 'operational') return r.businessUnit === 'Operations'; 
      return false;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto text-slate-200 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">{t.executiveSummary}</h1>
          <p className="text-slate-500 mt-1">
            {t.week} {formatDate(startOfWeek.toISOString())} - {formatDate(endOfWeek.toISOString())}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => alert("Mock: PDF Download initiated")}>
            <FileDown className="w-4 h-4 mr-2" />
            {t.downloadPDF}
          </Button>
          <Button onClick={() => alert("Mock: Email sent to board members")}>
            <Mail className="w-4 h-4 mr-2" />
            {t.emailBoard}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
            onClick={() => setSelectedSummary(selectedSummary === 'total' ? null : 'total')}
            className={cn(
                "border-l-4 border-l-cyan-600 cursor-pointer transition-all hover:-translate-y-1",
                selectedSummary === 'total' ? "ring-2 ring-cyan-500/50 bg-slate-800" : ""
            )}
        >
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-400">{t.totalRisks}</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-bold text-slate-100">{totalRisks}</span>
              <span className="text-xs text-emerald-400 font-medium mb-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +5%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card 
            onClick={() => setSelectedSummary(selectedSummary === 'critical' ? null : 'critical')}
            className={cn(
                "border-l-4 border-l-red-600 cursor-pointer transition-all hover:-translate-y-1",
                selectedSummary === 'critical' ? "ring-2 ring-red-500/50 bg-slate-800" : ""
            )}
        >
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-400">{t.criticalRisks}</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-bold text-red-500">{criticalRisks}</span>
              <span className="text-xs text-red-400 font-medium mb-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +12%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card 
             onClick={() => setSelectedSummary(selectedSummary === 'issues' ? null : 'issues')}
             className={cn(
                "border-l-4 border-l-yellow-500 cursor-pointer transition-all hover:-translate-y-1",
                selectedSummary === 'issues' ? "ring-2 ring-yellow-500/50 bg-slate-800" : ""
            )}
        >
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-400">{t.issuesCount}</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-bold text-yellow-500">{issuesCount}</span>
              <span className="text-xs text-slate-500 font-medium mb-1">
                {t.newRisks}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card 
             onClick={() => setSelectedSummary(selectedSummary === 'operational' ? null : 'operational')}
             className={cn(
                "border-l-4 border-l-purple-600 cursor-pointer transition-all hover:-translate-y-1",
                selectedSummary === 'operational' ? "ring-2 ring-purple-500/50 bg-slate-800" : ""
            )}
        >
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-400">{t.mainCategory}</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-xl font-bold text-purple-400 truncate">Operational</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">45% {t.of} {t.totalRisks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Conditionally Render List based on Selection */}
      {selectedSummary && (
          <div className="animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-4 text-slate-300">
                  <ListFilter className="w-5 h-5" />
                  <h3 className="font-semibold">
                      {selectedSummary === 'total' && t.listTotal}
                      {selectedSummary === 'critical' && t.listCritical}
                      {selectedSummary === 'issues' && t.listIssues}
                      {selectedSummary === 'operational' && t.listOperational}
                  </h3>
              </div>
              <RiskList risks={filteredRisks} />
          </div>
      )}

      <Card className="bg-gradient-to-r from-indigo-900/20 to-slate-900 border-indigo-500/30">
        <CardHeader className="pb-2 border-indigo-500/20">
          <CardTitle className="flex items-center gap-2 text-indigo-300">
            <Lightbulb className="w-5 h-5 text-indigo-400" />
            {t.aiGeneratedInsights}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-indigo-900/50 shadow-sm transition-all hover:border-indigo-500/50">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-red-900/30 rounded text-red-400 mt-0.5 border border-red-900/50">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">{t.insightSalesTitle}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.insightSalesDesc}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-indigo-900/50 shadow-sm transition-all hover:border-indigo-500/50">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-orange-900/30 rounded text-orange-400 mt-0.5 border border-orange-900/50">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">{t.insightITTitle}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.insightITDesc}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-indigo-900/50 shadow-sm transition-all hover:border-indigo-500/50">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-emerald-900/30 rounded text-emerald-400 mt-0.5 border border-emerald-900/50">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">{t.insightMitigationTitle}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.insightMitigationDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-slate-400" />
              {t.riskDistribution}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {Object.entries(buCounts).map(([unit, count]) => {
                const percentage = totalRisks > 0 ? Math.round((count / totalRisks) * 100) : 0;
                return (
                  <div key={unit}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-300">{unit}</span>
                      <span className="text-slate-500">{count} {t.risk} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-cyan-600 h-2.5 rounded-full shadow-[0_0_8px_rgba(8,145,178,0.6)]" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg text-xs text-slate-400 border border-slate-800">
              <strong>{t.observation}:</strong> {t.obsText}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              {t.criticalAlerts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCriticalRisks.map((risk) => {
                 const { title } = getRiskContent(risk, language);
                 return (
                  <div key={risk.id} className="p-3 border border-red-900/30 bg-red-950/10 rounded-lg flex flex-col gap-2 hover:bg-red-950/20 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-red-300 text-sm line-clamp-1">{title}</div>
                      <Badge className="bg-red-500/20 text-red-300 shrink-0 border-transparent">{risk.score}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs text-red-400/70">
                      <span>{risk.businessUnit} • {risk.type.toUpperCase()}</span>
                      <span>{t.expectedDate}: {risk.expectedDate ? formatDate(risk.expectedDate) : 'Immediate'}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => alert("Mock: Escalation trigger")}
                        className="text-xs bg-slate-900 border border-red-900 text-red-400 px-2 py-1 rounded hover:bg-red-900/30 transition-colors"
                      >
                        {t.escalate}
                      </button>
                      <button 
                         onClick={() => alert("Mock: Mitigation approved")}
                         className="text-xs bg-red-900/50 border border-red-800 text-red-100 px-2 py-1 rounded hover:bg-red-800 transition-colors"
                      >
                        {t.approve}
                      </button>
                    </div>
                  </div>
                 );
              })}
              
              {topCriticalRisks.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-sm">
                  {t.notFound}
                </div>
              )}
            </div>
            {topCriticalRisks.length > 0 && (
                <div className="mt-4 text-center">
                    <Button variant="ghost" size="sm" className="text-slate-500 text-xs hover:text-cyan-400">
                        {t.viewAll} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}