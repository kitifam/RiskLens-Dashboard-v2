import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Risk } from '../types/risk';
import { useLanguage } from '../contexts/LanguageContext';

interface RiskTrendChartProps {
    risks: Risk[];
}

export function RiskTrendChart({ risks }: RiskTrendChartProps) {
    const { t } = useLanguage();

    // Simulated trend data with separate metrics for New Risks and Critical Escalations
    const dataPoints = [
        { day: 'M', newRisks: 8, criticalEscalations: 2, label: 'Mon' },
        { day: 'T', newRisks: 10, criticalEscalations: 1, label: 'Tue' },
        { day: 'W', newRisks: 6, criticalEscalations: 3, label: 'Wed' },
        { day: 'T', newRisks: 12, criticalEscalations: 4, label: 'Thu' },
        { day: 'F', newRisks: 9, criticalEscalations: 2, label: 'Fri' },
        { day: 'S', newRisks: 4, criticalEscalations: 1, label: 'Sat' },
        { day: 'S', newRisks: 3, criticalEscalations: 0, label: 'Sun' },
    ];

    const maxValue = Math.max(...dataPoints.map(d => d.newRisks + d.criticalEscalations));

    return (
        <Card className="h-full bg-slate-900 border border-slate-800 shadow-lg min-h-[340px]">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        {t.riskTrendAnalysis}
                    </CardTitle>
                    <div className="flex gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> IT (+12%)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> Ops (-5%)
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full flex items-end justify-between gap-2 pt-4 px-2">
                    {dataPoints.map((point, index) => {
                        const total = point.newRisks + point.criticalEscalations;
                        // Minimum height for visibility if total > 0
                        const totalHeightPercent = total > 0 ? Math.max(5, (total / maxValue) * 100) : 0;
                        const height = `${totalHeightPercent}%`;
                        
                        // Calculate internal percentages of the stack
                        const criticalRatio = total > 0 ? (point.criticalEscalations / total) * 100 : 0;
                        const newRatio = total > 0 ? (point.newRisks / total) * 100 : 0;
                        
                        const criticalHeight = `${criticalRatio}%`;
                        const newHeight = `${newRatio}%`;

                        return (
                            <div key={index} className="flex flex-col items-center gap-2 w-full group relative">
                                <div className="relative w-full flex justify-center h-full items-end">
                                     {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-xs px-2 py-1 rounded border border-slate-700 whitespace-nowrap z-10 shadow-lg pointer-events-none">
                                        <div className="font-bold mb-1">{point.label}</div>
                                        <div className="flex items-center gap-1 text-cyan-400">New: {point.newRisks}</div>
                                        <div className="flex items-center gap-1 text-red-400">Critical: {point.criticalEscalations}</div>
                                    </div>
                                    
                                    {/* Stacked Bar Container */}
                                    <div 
                                        className="w-full max-w-[30px] rounded-t-sm flex flex-col-reverse overflow-hidden hover:brightness-110 transition-all cursor-pointer bg-slate-800/50"
                                        style={{ height }}
                                    >
                                        <div style={{ height: newHeight }} className="w-full bg-cyan-500 transition-all"></div>
                                        <div style={{ height: criticalHeight }} className="w-full bg-red-500 transition-all"></div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500 font-medium">{point.day}</span>
                            </div>
                        )
                    })}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-cyan-500"></div> {t.newRisks}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-red-500"></div> {t.criticalEscalations}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}