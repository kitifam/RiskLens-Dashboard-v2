import React, { useState, useMemo } from 'react';
import { MOCK_RISKS } from '../data/mockData';
import { Risk } from '../types/risk';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { HeatMap } from './HeatMap';
import { RiskList } from './RiskList';
import { RiskDetailsModal } from './RiskDetailsModal';
import { Button } from './ui/Button';
import { RiskTrendChart } from './RiskTrendChart';
import { 
    AlertTriangle, 
    Activity, 
    CheckCircle2, 
    Search, 
    TrendingUp, 
    TrendingDown, 
    X, 
    DollarSign, 
    Wallet, 
    ShieldCheck, 
    Bot,
    Sparkles,
    Filter
} from 'lucide-react';
import { cn, formatCurrency, getRiskContent } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { analyzeBatchSentiment } from '../lib/sentimentAnalysis';
import { SentimentRadar } from './SentimentRadar';

interface DashboardProps {
    onEditRisk: (risk: Risk) => void;
}

type KPIFilterType = 'financial' | 'critical' | 'mitigation' | 'compliance' | null;

export function Dashboard({ onEditRisk }: DashboardProps) {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBU, setFilterBU] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [heatmapFilter, setHeatmapFilter] = useState<{likelihood: number, impact: number} | null>(null);
  const [kpiFilter, setKpiFilter] = useState<KPIFilterType>(null);
  
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  // Pre-calculate KPIs (from ALL data)
  const allFinancialExposure = MOCK_RISKS.reduce((acc, risk) => acc + (risk.financialImpact || 0), 0);
  const allCriticalCount = MOCK_RISKS.filter(r => r.score >= 15).length;
  const allMitigationCost = allFinancialExposure * 0.1;
  const complianceRate = 92;
  // ✅ Calculate sentiment for all risks
  const sentimentMap = useMemo(() => {
    return analyzeBatchSentiment(MOCK_RISKS.map(r => ({ id: r.id, description: r.description })));
  }, []);

  const filteredRisks = useMemo(() => {
    return MOCK_RISKS.filter(risk => {
      // Localize title/desc for search
      const { title, description } = getRiskContent(risk, language);
      
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBU = filterBU === 'All' || risk.businessUnit === filterBU;
      const matchesType = filterType === 'All' || risk.type === filterType;
      
      const matchesHeatmap = heatmapFilter 
        ? risk.likelihood === heatmapFilter.likelihood && risk.impact === heatmapFilter.impact
        : true;
      
      let matchesKPI = true;
      if (kpiFilter === 'financial') {
          // Show top 20% financial impact or > 100k
          matchesKPI = (risk.financialImpact || 0) > 100000;
      } else if (kpiFilter === 'critical') {
          matchesKPI = risk.score >= 15;
      } else if (kpiFilter === 'mitigation') {
          // Simulate showing actionable risks
          matchesKPI = risk.status === 'active';
      } else if (kpiFilter === 'compliance') {
           // Simulate compliance filter (looking for keywords or specific BU in this mock)
           matchesKPI = title.toLowerCase().includes('compliance') || 
                        description.toLowerCase().includes('regulation') ||
                        risk.businessUnit === 'Finance' || risk.businessUnit === 'HR';
      }
      
      return matchesSearch && matchesBU && matchesType && matchesHeatmap && matchesKPI;
    });
  }, [searchTerm, filterBU, filterType, heatmapFilter, kpiFilter, language]);

  const handleCellClick = (likelihood: number, impact: number) => {
    if (heatmapFilter?.likelihood === likelihood && heatmapFilter.impact === impact) {
        setHeatmapFilter(null); 
    } else {
        setHeatmapFilter({ likelihood, impact });
        setKpiFilter(null); // Clear KPI filter when using heatmap
    }
  };

  const handleKPISelect = (filter: KPIFilterType) => {
      if (kpiFilter === filter) {
          setKpiFilter(null);
      } else {
          setKpiFilter(filter);
          setHeatmapFilter(null); // Clear heatmap filter
      }
  };

  const handleRiskClick = (riskId: string) => {
    const risk = MOCK_RISKS.find(r => r.id === riskId);
    if (risk) setSelectedRisk(risk);
  };

  const businessUnits = ['All', 'Sales', 'IT', 'Finance', 'Operations', 'HR'];
  const types = ['All', 'risk', 'issue'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* 2. AI Insight Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-lg p-1">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <Bot className="w-32 h-32 text-indigo-400" />
          </div>
          <div className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-4 relative z-10">
              <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-400/20 shrink-0">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                  <h3 className="text-lg font-semibold text-indigo-100 flex items-center gap-2">
                      {t.aiSituationReport}
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">LIVE</span>
                  </h3>
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                      {t.aiReportDesc}
                  </p>
              </div>
              <Button size="sm" variant="secondary" className="shrink-0 bg-indigo-900/50 hover:bg-indigo-800 border-indigo-700/50">
                  {t.fullReport}
              </Button>
          </div>
      </div>

      {/* 4. & 5. KPI Cards (Clickable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
            onClick={() => handleKPISelect('financial')}
            className={cn(
                "border-l-4 border-l-red-500 bg-slate-900/80 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl",
                kpiFilter === 'financial' ? "ring-2 ring-red-500/50 bg-slate-800" : ""
            )}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">{t.financialExposure}</p>
                <h3 className="text-2xl font-bold text-slate-100 mt-2">{formatCurrency(allFinancialExposure)}</h3>
              </div>
              <div className={cn("p-2 rounded-lg border", kpiFilter === 'financial' ? "bg-red-500 text-white border-red-400" : "bg-red-900/30 border-red-800/50 text-red-500")}>
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-red-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span className="font-medium">+15%</span>
              <span className="text-slate-500 ml-1">{t.vsLastQuarter}</span>
            </div>
          </CardContent>
        </Card>

        <Card 
            onClick={() => handleKPISelect('critical')}
            className={cn(
                "border-l-4 border-l-orange-500 bg-slate-900/80 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl",
                kpiFilter === 'critical' ? "ring-2 ring-orange-500/50 bg-slate-800" : ""
            )}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">{t.criticalRisks}</p>
                <h3 className="text-3xl font-bold text-orange-500 mt-2">{allCriticalCount}</h3>
              </div>
              <div className={cn("p-2 rounded-lg border", kpiFilter === 'critical' ? "bg-orange-500 text-white border-orange-400" : "bg-orange-900/30 border-orange-800/50 text-orange-500")}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
             <div className="mt-4 flex items-center text-xs text-orange-400">
              <Activity className="w-3 h-3 mr-1" />
              <span className="font-medium">{t.immediateAction}</span>
            </div>
          </CardContent>
        </Card>

        <Card 
            onClick={() => handleKPISelect('mitigation')}
            className={cn(
                "border-l-4 border-l-cyan-500 bg-slate-900/80 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl",
                kpiFilter === 'mitigation' ? "ring-2 ring-cyan-500/50 bg-slate-800" : ""
            )}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">{t.mitigationCost}</p>
                <h3 className="text-2xl font-bold text-cyan-500 mt-2">{formatCurrency(allMitigationCost)}</h3>
              </div>
              <div className={cn("p-2 rounded-lg border", kpiFilter === 'mitigation' ? "bg-cyan-500 text-white border-cyan-400" : "bg-cyan-900/30 border-cyan-800/50 text-cyan-500")}>
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-emerald-400">
              <TrendingDown className="w-3 h-3 mr-1" />
              <span className="font-medium">-5%</span>
              <span className="text-slate-500 ml-1">{t.budgetSaving}</span>
            </div>
          </CardContent>
        </Card>

        <Card 
            onClick={() => handleKPISelect('compliance')}
            className={cn(
                "border-l-4 border-l-emerald-500 bg-slate-900/80 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl",
                kpiFilter === 'compliance' ? "ring-2 ring-emerald-500/50 bg-slate-800" : ""
            )}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">{t.complianceRate}</p>
                <h3 className="text-3xl font-bold text-emerald-500 mt-2">{complianceRate}%</h3>
              </div>
              <div className={cn("p-2 rounded-lg border", kpiFilter === 'compliance' ? "bg-emerald-500 text-white border-emerald-400" : "bg-emerald-900/30 border-emerald-800/50 text-emerald-500")}>
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
             <div className="mt-4 flex items-center text-xs text-slate-500">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
              <span>{t.excellent}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 bg-slate-900 p-4 rounded-lg shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
             <div className="w-full md:w-1/3 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                    placeholder={t.searchPlaceholder}
                    className="pl-9 bg-slate-950/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
             <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <Filter className="w-4 h-4 text-slate-500 mr-1" />
                <span className="text-xs text-slate-500 whitespace-nowrap">{t.filterBU}</span>
                {businessUnits.map(bu => (
                    <button
                        key={bu}
                        onClick={() => setFilterBU(bu)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-full transition-all border whitespace-nowrap",
                            filterBU === bu 
                                ? "bg-cyan-600 text-white border-cyan-500 shadow-[0_0_10px_rgba(8,145,178,0.4)]" 
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200"
                        )}
                    >
                        {bu === 'All' ? t.all : bu}
                    </button>
                ))}
            </div>
        </div>

        {/* Filter Row: Swapped Left/Right as requested */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 w-full border-t border-slate-800 pt-3">
             {/* LEFT SIDE: Filter Chips */}
             <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {heatmapFilter && (
                    <div className="flex items-center gap-2 animate-in fade-in">
                        <span className="text-xs text-cyan-400 border border-cyan-500/30 bg-cyan-950/30 px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                            <Activity className="w-3 h-3" /> {t.heatmapFilter}: L{heatmapFilter.likelihood} x I{heatmapFilter.impact}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => setHeatmapFilter(null)} className="h-6 w-6 p-0 text-slate-500 hover:text-white">
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                )}
                {kpiFilter && (
                     <div className="flex items-center gap-2 animate-in fade-in">
                        <span className="text-xs text-orange-400 border border-orange-500/30 bg-orange-950/30 px-2 py-1 rounded-full flex items-center gap-1 uppercase whitespace-nowrap">
                            <Filter className="w-3 h-3" /> {t.filter}: {kpiFilter}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => setKpiFilter(null)} className="h-6 w-6 p-0 text-slate-500 hover:text-white">
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                )}
            </div>

            {/* RIGHT SIDE: Type Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 justify-end">
                <span className="text-xs text-slate-500 whitespace-nowrap mr-1 uppercase font-bold">{t.filterType}</span>
                {types.map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-full transition-all border uppercase whitespace-nowrap",
                            filterType === type 
                                ? "bg-indigo-600 text-white border-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.4)]" 
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200"
                        )}
                    >
                        {type === 'All' ? t.all : type}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* ✅ 1. Split Layout: Heatmap (Left) & Trend (Middle) & Sentiment (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="w-full">
            <HeatMap 
                risks={filteredRisks} 
                onRiskClick={handleRiskClick}
                onCellClick={handleCellClick}
                selectedCell={heatmapFilter}
            />
        </div>
        <div className="w-full">
            <RiskTrendChart risks={filteredRisks} />
        </div>
        {/* ✅ เพิ่ม Sentiment Radar ที่นี่ */}
        <div className="w-full">
            <SentimentRadar risks={MOCK_RISKS} sentimentMap={sentimentMap} />
        </div>
      </div>
      
      {/* Risk Registry (Full Width) */}
      <div className="w-full">
            <RiskList 
                risks={filteredRisks} 
                onView={setSelectedRisk}
                onEdit={onEditRisk}
            />
      </div>

      {selectedRisk && (
        <RiskDetailsModal 
            risk={selectedRisk} 
            onClose={() => setSelectedRisk(null)}
            onEdit={onEditRisk}
        />
      )}
    </div>
  );
}